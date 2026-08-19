/**
 * Engine genérico de minigames.
 * Não conhece regras específicas de nenhum jogo — apenas:
 * game loop, input, HUD e ciclo de vida da fase.
 * As regras de cada jogo (Entity, física, condições de vitória)
 * ficam no arquivo game-*.js correspondente.
 */
class Engine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.entities = [];
    this.mapData = null;
    this.selectedAbility = null;
    this.abilities = {};

    this.spawnCount = 0;
    this.totalEntities = 0;
    this.minRequired = 0;
    this.savedCount = 0;
    this.lostCount = 0;
    this.lastSpawn = 0;

    this.isRunning = false;

    // Hooks que cada jogo deve sobrescrever/fornecer via config
    this.createEntity = null;   // (x, y) => Entity
    this.onAbilityUse = null;   // (entity, abilityType) => void

    this.bindEvents();
  }

  loadLevel(config) {
    this.mapData = JSON.parse(JSON.stringify(config)); // cópia profunda evita mutação do config original
    this.abilities = { ...config.abilities };
    this.totalEntities = config.totalEntities;
    this.minRequired = config.minRequired;
    this.spawnCount = 0;
    this.savedCount = 0;
    this.lostCount = 0;
    this.entities = [];
    this.isRunning = true;
    this.lastSpawn = 0;

    this.updateHUD();
    const firstAbility = Object.keys(this.abilities)[0];
    if (firstAbility) this.selectAbility(firstAbility);
    this.showToast("A FASE COMEÇOU!", 2000);
  }

  selectAbility(type) {
    this.selectedAbility = type;
    document.querySelectorAll('.btn-ability').forEach(b => b.classList.remove('active'));
    const activeBtn = document.getElementById(`btn-${type}`);
    if (activeBtn) activeBtn.classList.add('active');

    const label = (this.abilityLabels && this.abilityLabels[type]) || type;
    if (this.abilities[type] > 0) {
      this.showToast(`${label} ATIVO\n👆 Toque em um alvo`, 2000);
    } else {
      this.showToast(`SEM ESTOQUE DE ${label}!`, 1500);
    }
  }

  start() {
    let lastTime = performance.now();
    const loop = (currentTime) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1); // trava dt para evitar saltos grandes (aba em background, etc.)
      lastTime = currentTime;

      if (this.isRunning) {
        this.update(currentTime, dt);
        this.render();
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  update(currentTime, dt) {
    if (this.spawnCount < this.totalEntities && currentTime - this.lastSpawn > this.mapData.spawnRate) {
      this.entities.push(this.createEntity(this.mapData.spawn.x, this.mapData.spawn.y));
      this.spawnCount++;
      this.lastSpawn = currentTime;
      this.updateHUD();
    }

    this.entities.forEach(ent => ent.update(dt, this.mapData, this.entities));

    const newSaved = this.entities.filter(e => e.state === 'REACHED').length;
    const newLost = this.entities.filter(e => e.state === 'DEAD').length;

    if (newSaved !== this.savedCount || newLost !== this.lostCount) {
      this.savedCount = newSaved;
      this.lostCount = newLost;
      this.updateHUD();
    }

    if (this.savedCount + this.lostCount === this.totalEntities && this.isRunning) {
      this.isRunning = false;
      setTimeout(() => this.onLevelComplete(), 500);
    }
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.mapData.platforms) {
      this.mapData.platforms.forEach(p => {
        this.ctx.fillStyle = p.color || "#555565";
        this.ctx.fillRect(p.x, p.y, p.w, p.h);
      });
    }

    if (this.renderExtras) this.renderExtras(this.ctx, this.mapData);

    this.entities.forEach(ent => ent.render(this.ctx));
  }

  bindEvents() {
    const handleAction = (e) => {
      if (!this.isRunning) return;
      e.preventDefault(); // evita disparo duplicado touchstart -> mousedown sintético em mobile

      const rect = this.canvas.getBoundingClientRect();
      const touch = e.touches ? e.touches[0] : e;
      const clickX = (touch.clientX - rect.left) * (this.canvas.width / rect.width);
      const clickY = (touch.clientY - rect.top) * (this.canvas.height / rect.height);

      const target = this.entities.find(ent =>
        ent.state === 'WALKING' && Math.hypot(ent.x - clickX, ent.y - clickY) < 22
      );

      if (target && this.selectedAbility && this.abilities[this.selectedAbility] > 0) {
        const type = this.selectedAbility;
        if (this.onAbilityUse) this.onAbilityUse(target, type);
        this.abilities[type]--;
        this.updateHUD();
      }
    };

    this.canvas.addEventListener('touchstart', handleAction, { passive: false });
    this.canvas.addEventListener('mousedown', handleAction);
  }

  updateHUD() {
    document.getElementById('c-total').innerText = this.totalEntities - this.spawnCount;
    document.getElementById('c-saved').innerText = this.savedCount;
    document.getElementById('c-lost').innerText = this.lostCount;
    document.getElementById('c-target').innerText = this.minRequired;

    Object.keys(this.abilities).forEach(type => {
      const el = document.getElementById(`count-${type}`);
      if (el) el.innerText = `x${this.abilities[type]}`;
    });
  }

  showToast(msg, duration = 2000) {
    const toast = document.getElementById('action-toast');
    toast.innerText = msg;
    toast.style.display = 'block';
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => { toast.style.display = 'none'; }, duration);
  }

  onLevelComplete() {
    const passed = this.savedCount >= this.minRequired;
    const title = document.getElementById('modal-title');
    title.innerText = passed ? "FASE CONCLUÍDA! 🎉" : "OPS! FALTOU POUCO... 😅";
    title.style.color = passed ? "#4CAF50" : "#F44336";

    document.getElementById('modal-summary').innerHTML = `
      <b>${this.totalEntities}</b> saíram do Portal<br>
      <span style="color:#4CAF50"><b>${this.savedCount}</b> chegaram ao destino</span><br>
      <span style="color:#F44336"><b>${this.lostCount}</b> caíram pelo caminho</span><br><br>
      ${passed ? '<b>Objetivo alcançado com sucesso!</b>' : `Você precisava de pelo menos <b>${this.minRequired}</b>.`}
    `;
    document.getElementById('end-modal').style.display = 'flex';
  }
}
