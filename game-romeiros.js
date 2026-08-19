/**
 * Rota dos Romeiros — regras específicas deste minigame.
 * Usa o Engine genérico definido em engine.js.
 */

class Entity {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 35;
    this.vy = 0;
    this.radius = 7;
    this.state = 'WALKING'; // WALKING, BLOCKING, BUILDING, FALLING, REACHED, DEAD
    this.hasUmbrella = false;
    this.fallHeight = 0;
    this.buildProgress = 0;
    this.buildingPlatform = null; // referência à plataforma sendo construída (FIX: não empilha uma nova por frame)
  }

  update(dt, map, allEntities) {
    if (this.state === 'REACHED' || this.state === 'DEAD') return;

    if (this.state === 'WALKING') {
      let nextX = this.x + this.vx * dt;

      let isBlocked = allEntities.some(other =>
        other !== this && other.state === 'BLOCKING' && Math.hypot(other.x - nextX, other.y - this.y) < 14
      );

      if (isBlocked) {
        this.vx *= -1;
      } else {
        this.x = nextX;
      }

      let feetY = this.y + this.radius;
      let onGround = map.platforms.some(p =>
        this.x >= p.x && this.x <= p.x + p.w && feetY >= p.y - 2 && feetY <= p.y + p.h + 2
      );

      if (!onGround) {
        this.state = 'FALLING';
        this.fallHeight = 0;
      }

      if (Math.hypot(this.x - map.target.x, this.y - map.target.y) < 20) {
        this.state = 'REACHED';
      }
    }
    else if (this.state === 'BUILDING') {
      // FIX: cria a plataforma UMA vez e só cresce sua largura,
      // em vez de dar push() de uma nova plataforma a cada frame.
      this.buildProgress += dt * 25;
      const dir = this.vx > 0 ? 1 : -1;

      if (!this.buildingPlatform) {
        this.buildingPlatform = { x: this.x, y: this.y + this.radius - 2, w: 0, h: 6, color: '#0077B6' };
        map.platforms.push(this.buildingPlatform);
      }

      this.buildingPlatform.w = this.buildProgress;
      if (dir < 0) this.buildingPlatform.x = this.x - this.buildProgress;

      if (this.buildProgress >= 50) {
        this.state = 'WALKING';
        this.buildingPlatform = null;
      }
    }
    else if (this.state === 'FALLING') {
      this.vy = this.hasUmbrella ? 35 : 130;
      this.y += this.vy * dt;
      this.fallHeight += this.vy * dt;

      let feetY = this.y + this.radius;
      let landed = map.platforms.find(p =>
        this.x >= p.x && this.x <= p.x + p.w && feetY >= p.y && feetY <= p.y + p.h
      );

      if (landed) {
        if (!this.hasUmbrella && this.fallHeight > 110) {
          this.state = 'DEAD';
        } else {
          this.y = landed.y - this.radius;
          this.vy = 0;
          this.state = 'WALKING';
        }
      }

      if (this.y > map.height) {
        this.state = 'DEAD';
      }
    }
  }

  render(ctx) {
    if (this.state === 'REACHED' || this.state === 'DEAD') return;

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

    if (this.state === 'WALKING') ctx.fillStyle = '#FFCC00';
    if (this.state === 'BLOCKING') ctx.fillStyle = '#F44336';
    if (this.state === 'BUILDING') ctx.fillStyle = '#0077B6';
    if (this.state === 'FALLING') ctx.fillStyle = this.hasUmbrella ? '#0288D1' : '#FF9800';

    ctx.fill();
    ctx.closePath();

    if (this.hasUmbrella) {
      ctx.font = "10px sans-serif";
      ctx.fillText("☂️", this.x, this.y - 8);
    }
  }
}

// Configura o Engine com as regras deste jogo
const canvas = document.getElementById('gameCanvas');
canvas.width = 360;
canvas.height = 460;

const game = new Engine(canvas);

game.createEntity = (x, y) => new Entity(x, y);

game.abilityLabels = { BLOCKER: 'BLOQUEADOR', BUILDER: 'CONSTRUTOR', FLOAT: 'GUARDA-CHUVA' };

game.onAbilityUse = (entity, type) => {
  if (type === 'BLOCKER') {
    entity.state = 'BLOCKING';
    game.showToast("🛑 ROMEIRO PARADO!", 1500);
  } else if (type === 'BUILDER') {
    entity.state = 'BUILDING';
    entity.buildProgress = 0;
    game.showToast("🪜 CONSTRUINDO RAMPA...", 1500);
  } else if (type === 'FLOAT') {
    entity.hasUmbrella = true;
    game.showToast("☂️ GUARDA-CHUVA ATIVADO!", 1500);
  }
};

game.renderExtras = (ctx, mapData) => {
  // Portal
  ctx.fillStyle = "#888899";
  ctx.fillRect(mapData.spawn.x - 15, mapData.spawn.y - 30, 30, 30);
  ctx.fillStyle = "#FFCC00";
  ctx.font = "bold 10px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("PORTAL", mapData.spawn.x, mapData.spawn.y - 35);

  // McTonny
  ctx.fillStyle = "#0077B6";
  ctx.fillRect(mapData.target.x - 20, mapData.target.y - 40, 40, 40);
  ctx.fillStyle = "#fff";
  ctx.fillText("🍔 McTONNY", mapData.target.x, mapData.target.y - 45);
};

const RADIUS = 7;
const mcTonnyLevel1 = {
  width: 360,
  height: 460,
  totalEntities: 15,
  minRequired: 10,
  spawnRate: 2000,
  spawn: { x: 40, y: 100 - RADIUS }, // FIX: alinhado exatamente com a superfície da Pista 1 (y:100), sem gap
  target: { x: 310, y: 380 },
  abilities: { BLOCKER: 3, BUILDER: 2, FLOAT: 10 },
  platforms: [
    { x: 10, y: 100, w: 200, h: 10 }, // Pista 1 Superior
    { x: 90, y: 240, w: 260, h: 10 }, // Pista 2 Intermediária
    { x: 10, y: 380, w: 340, h: 10 }  // Pista 3 Inferior
  ]
};

game.loadLevel(mcTonnyLevel1);
game.start();

function selectAbility(type) {
  game.selectAbility(type);
}

function restartLevel() {
  document.getElementById('end-modal').style.display = 'none';
  game.loadLevel(mcTonnyLevel1);
}
