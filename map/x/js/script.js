const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Configuração ---
const player = { worldX: 0, worldY: 0, speed: 0.05, dirIndex: 0, isMoving: false, animFrame: 0 };
const spriteCache = {};
const TOTAL_FRAMES = 12;
const TILE_WIDTH = 120;
const TILE_HEIGHT = 60;

function resize() { 
    canvas.width = window.innerWidth; 
    canvas.height = window.innerHeight; 
}
window.addEventListener('resize', resize);
resize();

// --- Desenho das Formas (SVG) ---
function getSVGString(viewType, step) {
    const progress = (step / TOTAL_FRAMES) * Math.PI * 2;
    const legShift = Math.sin(progress) * 8;
    const armShift = Math.cos(progress) * 7;
    const bodyBob = Math.abs(Math.sin(progress)) * 3;

    // Simplificação para garantir que algo apareça (Baseado no seu perfil)
    let body = `
        <rect x="${30 + legShift}" y="58" width="7" height="26" rx="3" fill="#1b2a38" />
        <rect x="${30 - legShift}" y="58" width="7" height="26" rx="3" fill="#233548" />
        <rect x="24" y="30" width="18" height="30" rx="4" fill="#2b3a4a" stroke="#151d26" stroke-width="2" />
        <circle cx="33" cy="18" r="9" fill="#e0ac69" />
    `;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="96" viewBox="0 0 64 96">
                <ellipse cx="32" cy="86" rx="18" ry="8" fill="rgba(0,0,0,0.4)" />
                <g transform="translate(0, ${-bodyBob})">${body}</g>
            </svg>`;
}

// --- Pré-carregamento ---
function preloadSprites() {
    const views = ['front', 'back', 'profile', 'diag_front', 'diag_back'];
    views.forEach(view => {
        spriteCache[view] = [];
        for (let i = 0; i < TOTAL_FRAMES; i++) {
            const img = new Image();
            img.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(getSVGString(view, i));
            spriteCache[view].push(img);
        }
    });
}
preloadSprites();

// --- Motor de Renderização ---
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Desenha Chão (Grid simples para testar)
    ctx.fillStyle = "#181e29";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Lógica do Personagem
    if (player.isMoving) player.animFrame = (player.animFrame + 0.25) % TOTAL_FRAMES;
    else player.animFrame = 0;

    const currentFrame = Math.floor(player.animFrame);
    const imgToDraw = spriteCache['profile'][currentFrame]; // Teste com 'profile'

    if (imgToDraw && imgToDraw.complete) {
        ctx.drawImage(imgToDraw, canvas.width/2 - 32, canvas.height/2 - 86, 64, 96);
    }
    
    requestAnimationFrame(render);
}

// --- Controle Joystick ---
const joyZone = document.getElementById('joystick-zone');
const joyStick = document.getElementById('joystick-stick');
let isDragging = false;
let joyVector = { x: 0, y: 0 };

function handleMove(clientX, clientY) {
    const rect = joyZone.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    let deltaX = clientX - centerX;
    let deltaY = clientY - centerY;
    const distance = Math.min(Math.hypot(deltaX, deltaY), 30);
    
    joyStick.style.transform = `translate(${deltaX}px, ${deltaY}px)`; // Simplificado para teste

    if (distance > 2) {
        player.isMoving = true;
    } else {
        player.isMoving = false;
    }
}

joyZone.addEventListener('pointerdown', (e) => { isDragging = true; handleMove(e.clientX, e.clientY); });
window.addEventListener('pointermove', (e) => { if(isDragging) handleMove(e.clientX, e.clientY); });
window.addEventListener('pointerup', () => { 
    isDragging = false; 
    joyStick.style.transform = `translate(0px, 0px)`;
    player.isMoving = false;
});

// Inicia o Loop
requestAnimationFrame(render);
