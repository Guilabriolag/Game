const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Configurações Gerais e Zoom ---
let ZOOM = 1.8;                // Escala equilibrada por padrão
const MIN_ZOOM = 1.0;
const MAX_ZOOM = 3.5;
const TOTAL_FRAMES = 12;
const NUM_DIRECTIONS = 16;

const player = {
    worldX: 0,
    worldY: 0,
    radius: 0.3,              // Raio de colisão do jogador em unidades do mundo
    speed: 0.05,
    dirIndex: 0,
    isMoving: false,
    animFrame: 0
};

// --- PONTOS DE INTERESSE / OBJETOS COM COLISÃO ---
const worldObjects = [
    { id: 'balcao', x: 2, y: 2, w: 2, h: 1, color: '#8b5a2b', label: 'Balcão' },
    { id: 'porta', x: -3, y: 4, w: 1, h: 0.2, color: '#4a3525', label: 'Porta' },
    { id: 'janela', x: 4, y: -3, w: 0.2, h: 1.5, color: '#66fcf1', label: 'Janela' }
];

const spriteCache = {};
const TILE_WIDTH = 120;
const TILE_HEIGHT = 60;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// --- SUPORTE A ZOOM (MOUSE SCROLL E PINÇA MOBILE) ---
window.addEventListener('wheel', (e) => {
    if (e.deltaY < 0) {
        ZOOM = Math.min(MAX_ZOOM, ZOOM + 0.15);
    } else {
        ZOOM = Math.max(MIN_ZOOM, ZOOM - 0.15);
    }
}, { passive: true });

let touchStartDist = 0;
window.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
        touchStartDist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
        );
    }
}, { passive: true });

window.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2) {
        const dist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
        );
        const delta = (dist - touchStartDist) * 0.005;
        ZOOM = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, ZOOM + delta));
        touchStartDist = dist;
    }
}, { passive: true });

// --- SVG SPRITES ---
function getSVGString(viewType, step) {
    const progress = (step / TOTAL_FRAMES) * Math.PI * 2;
    const legShift = Math.sin(progress) * 8;
    const armShift = Math.cos(progress) * 7;
    const bodyBob = Math.abs(Math.sin(progress)) * 3;
    const bodyTilt = Math.sin(progress) * 2;

    let body = "";

    if (viewType === 'profile') {
        body = `
            <g transform="rotate(${bodyTilt}, 32, 50)">
                <rect x="${30 + legShift}" y="58" width="7" height="26" rx="3" fill="#1b2a38" />
                <rect x="${30 - legShift}" y="58" width="7" height="26" rx="3" fill="#233548" />
                <rect x="${29 + legShift}" y="80" width="9" height="7" rx="2" fill="#0d0d0d" />
                <rect x="${29 - legShift}" y="80" width="9" height="7" rx="2" fill="#0d0d0d" />
                <rect x="24" y="30" width="18" height="30" rx="4" fill="#2b3a4a" stroke="#151d26" stroke-width="2" />
                <rect x="18" y="34" width="12" height="18" rx="3" fill="#3a4b35" />
                <rect x="${28 - armShift}" y="32" width="6" height="22" rx="3" fill="#233548" />
                <circle cx="${31 - armShift}" cy="56" r="3.5" fill="#e0ac69" />
                <circle cx="33" cy="18" r="9" fill="#e0ac69" />
                <path d="M 24 10 C 32 10, 38 14, 33 22 C 28 22, 24 18, 24 10 Z" fill="#3a2212" />
            </g>`;
    } else if (viewType === 'diag_front') {
        body = `
            <g transform="rotate(${bodyTilt}, 32, 50)">
                <rect x="${21 - legShift*0.5}" y="${58 - legShift*0.7}" width="7" height="26" rx="3" fill="#15212d" />
                <rect x="${20 - legShift*0.5}" y="${80 - legShift*0.7}" width="9" height="7" rx="2" fill="#050505" />
                <rect x="${31 + legShift*0.5}" y="${58 + legShift*0.7}" width="8" height="26" rx="3" fill="#233548" />
                <rect x="${30 + legShift*0.5}" y="${80 + legShift*0.7}" width="10" height="7" rx="2" fill="#0d0d0d" />
                <rect x="18" y="30" width="28" height="30" rx="5" fill="#2b3a4a" stroke="#151d26" stroke-width="2" />
                <rect x="14" y="33" width="10" height="20" rx="3" fill="#3a4b35" />
                <polygon points="26,30 30,37 35,30" fill="#d9d9d9" />
                <rect x="11" y="${32 - armShift}" width="6" height="20" rx="3" fill="#1b2a38" />
                <rect x="42" y="${32 + armShift}" width="7" height="22" rx="3" fill="#2b3a4a" />
                <circle cx="45.5" cy="${56 + armShift}" r="3.5" fill="#e0ac69" />
                <circle cx="32" cy="18" r="9.5" fill="#e0ac69" />
                <path d="M 23 15 C 23 7, 40 8, 38 18 C 32 18, 25 18, 23 15 Z" fill="#3a2212" />
            </g>`;
    } else if (viewType === 'diag_back') {
        body = `
            <g transform="rotate(${bodyTilt}, 32, 50)">
                <rect x="${21 - legShift*0.5}" y="${58 - legShift*0.7}" width="7" height="26" rx="3" fill="#15212d" />
                <rect x="${31 + legShift*0.5}" y="${58 + legShift*0.7}" width="8" height="26" rx="3" fill="#233548" />
                <rect x="18" y="31" width="26" height="27" rx="5" fill="#3a4b35" stroke="#233020" stroke-width="2" />
                <rect x="10" y="${32 - armShift}" width="6" height="20" rx="3" fill="#1b2a38" />
                <rect x="43" y="${32 + armShift}" width="7" height="22" rx="3" fill="#2b3a4a" />
                <circle cx="32" cy="18" r="9.5" fill="#3a2212" />
            </g>`;
    } else if (viewType === 'back') {
        body = `
            <g transform="rotate(${bodyTilt}, 32, 50)">
                <rect x="23" y="${58 + legShift}" width="8" height="26" rx="3" fill="#1b2a38" />
                <rect x="33" y="${58 - legShift}" width="8" height="26" rx="3" fill="#233548" />
                <rect x="22" y="${80 + legShift}" width="10" height="7" rx="2" fill="#0d0d0d" />
                <rect x="32" y="${80 - legShift}" width="10" height="7" rx="2" fill="#0d0d0d" />
                <rect x="18" y="32" width="28" height="26" rx="5" fill="#3a4b35" stroke="#233020" stroke-width="2" />
                <rect x="10" y="${32 - armShift}" width="7" height="22" rx="3" fill="#233548" />
                <rect x="47" y="${32 + armShift}" width="7" height="22" rx="3" fill="#2b3a4a" />
                <circle cx="32" cy="18" r="10" fill="#3a2212" />
            </g>`;
    } else {
        body = `
            <g transform="rotate(${bodyTilt}, 32, 50)">
                <rect x="23" y="${58 + legShift}" width="8" height="26" rx="3" fill="#1b2a38" />
                <rect x="33" y="${58 - legShift}" width="8" height="26" rx="3" fill="#233548" />
                <rect x="22" y="${80 + legShift}" width="10" height="7" rx="2" fill="#0d0d0d" />
                <rect x="32" y="${80 - legShift}" width="10" height="7" rx="2" fill="#0d0d0d" />
                <rect x="16" y="30" width="32" height="30" rx="5" fill="#2b3a4a" stroke="#151d26" stroke-width="2" />
                <polygon points="28,30 32,38 36,30" fill="#d9d9d9" />
                <rect x="10" y="${32 - armShift}" width="7" height="22" rx="3" fill="#233548" />
                <rect x="47" y="${32 + armShift}" width="7" height="22" rx="3" fill="#2b3a4a" />
                <circle cx="13.5" cy="${56 - armShift}" r="3.5" fill="#e0ac69" />
                <circle cx="50.5" cy="${56 + armShift}" r="3.5" fill="#e0ac69" />
                <rect x="29" y="24" width="6" height="7" fill="#c99352" />
                <circle cx="32" cy="18" r="10" fill="#e0ac69" />
                <path d="M 22 16 C 22 7, 42 7, 42 16 Z" fill="#3a2212" />
            </g>`;
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="96" viewBox="0 0 64 96">
        <ellipse cx="32" cy="86" rx="18" ry="8" fill="rgba(0,0,0,0.4)" />
        <g transform="translate(0, ${-bodyBob})">${body}</g>
    </svg>`;
}

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

function worldToScreen(wx, wy) {
    const relX = wx - player.worldX;
    const relY = wy - player.worldY;
    const effectiveTileW = TILE_WIDTH * (ZOOM / 1.8);
    const effectiveTileH = TILE_HEIGHT * (ZOOM / 1.8);

    const screenX = (canvas.width / 2) + (relX - relY) * (effectiveTileW / 2);
    const screenY = (canvas.height / 2) + (relX + relY) * (effectiveTileH / 2);
    return { x: screenX, y: screenY };
}

function getSpriteFor16Directions(dirIndex) {
    let viewType = 'front';
    let flipX = 1;
    let rotationAngle = 0;

    switch (dirIndex) {
        case 0:  viewType = 'front'; break;
        case 1:  viewType = 'diag_front'; rotationAngle = -11.25; break;
        case 2:  viewType = 'diag_front'; break;
        case 3:  viewType = 'profile'; rotationAngle = -11.25; break;
        case 4:  viewType = 'profile'; break;
        case 5:  viewType = 'diag_back'; rotationAngle = 11.25; break;
        case 6:  viewType = 'diag_back'; break;
        case 7:  viewType = 'back'; rotationAngle = -11.25; break;
        case 8:  viewType = 'back'; break;
        case 9:  viewType = 'back'; rotationAngle = 11.25; break;
        case 10: viewType = 'diag_back'; flipX = -1; break;
        case 11: viewType = 'profile'; flipX = -1; rotationAngle = -11.25; break;
        case 12: viewType = 'profile'; flipX = -1; break;
        case 13: viewType = 'diag_front'; flipX = -1; rotationAngle = 11.25; break;
        case 14: viewType = 'diag_front'; flipX = -1; break;
        case 15: viewType = 'front'; rotationAngle = 11.25; break;
    }

    return { viewType, flipX, rotationAngle };
}

// --- RENDERIZAÇÃO DE OBJETOS COM COLISÃO ---
function drawObject(obj) {
    const pos = worldToScreen(obj.x, obj.y);
    const tileW = TILE_WIDTH * (ZOOM / 1.8);
    const tileH = TILE_HEIGHT * (ZOOM / 1.8);

    ctx.save();
    ctx.fillStyle = obj.color;
    ctx.strokeStyle = '#151d26';
    ctx.lineWidth = 2;

    // Renderiza caixa isométrica para o objeto
    const wPx = obj.w * (tileW / 2);
    const hPx = obj.h * (tileH / 2);

    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.lineTo(pos.x + wPx, pos.y + hPx);
    ctx.lineTo(pos.x + wPx - hPx, pos.y + hPx + wPx/2);
    ctx.lineTo(pos.x - hPx, pos.y + wPx/2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Rótulo
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText(obj.label, pos.x, pos.y - 10);
    ctx.restore();
}

// --- RENDER LOOP ---
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const halfGrid = 7;
    const effectiveTileW = TILE_WIDTH * (ZOOM / 1.8);
    const effectiveTileH = TILE_HEIGHT * (ZOOM / 1.8);

    // Grid Isométrico
    for (let x = -halfGrid; x < halfGrid; x++) {
        for (let y = -halfGrid; y < halfGrid; y++) {
            const pos = worldToScreen(x, y);

            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            ctx.lineTo(pos.x + effectiveTileW / 2, pos.y + effectiveTileH / 2);
            ctx.lineTo(pos.x, pos.y + effectiveTileH);
            ctx.lineTo(pos.x - effectiveTileW / 2, pos.y + effectiveTileH / 2);
            ctx.closePath();

            ctx.fillStyle = (x + y) % 2 === 0 ? "#181e29" : "#222a38";
            ctx.fill();
            ctx.strokeStyle = "rgba(102, 252, 241, 0.05)";
            ctx.stroke();
        }
    }

    // Renderiza Objetos de Interesse
    worldObjects.forEach(drawObject);

    // Animação do Jogador
    if (player.isMoving) {
        player.animFrame = (player.animFrame + 0.25) % TOTAL_FRAMES;
    } else {
        player.animFrame = 0;
    }

    const currentFrame = Math.floor(player.animFrame);
    const spriteData = getSpriteFor16Directions(player.dirIndex);
    const imgToDraw = spriteCache[spriteData.viewType][currentFrame];

    const screenCenter = { x: canvas.width / 2, y: canvas.height / 2 };
    const drawWidth = 64 * ZOOM;
    const drawHeight = 96 * ZOOM;

    ctx.save();
    ctx.translate(screenCenter.x, screenCenter.y);
    
    if (spriteData.flipX === -1) ctx.scale(-1, 1);
    if (spriteData.rotationAngle !== 0) ctx.rotate((spriteData.rotationAngle * Math.PI) / 180);

    if (imgToDraw && imgToDraw.complete) {
        ctx.drawImage(imgToDraw, -(drawWidth / 2), -drawHeight + (15 * ZOOM), drawWidth, drawHeight);
    }
    ctx.restore();

    document.getElementById('coordsDisplay').innerText = `${player.worldX.toFixed(1)}, ${player.worldY.toFixed(1)} | Zoom: ${ZOOM.toFixed(1)}x`;

    requestAnimationFrame(render);
}

// --- CONTROLES JOYSTICK ---
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
    const maxRadius = 55;
    const distance = Math.min(Math.hypot(deltaX, deltaY), maxRadius);
    const angle = Math.atan2(deltaY, deltaX);

    const moveX = Math.cos(angle) * distance;
    const moveY = Math.sin(angle) * distance;

    joyStick.style.transform = `translate(${moveX}px, ${moveY}px)`;

    if (distance > 3) {
        joyVector.x = moveX / maxRadius;
        joyVector.y = moveY / maxRadius;
        player.isMoving = true;

        let angleStep = (Math.PI * 2) / NUM_DIRECTIONS;
        let octant = Math.round((angle + Math.PI) / angleStep) % NUM_DIRECTIONS;
        const dirMap = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 15, 14, 13];
        player.dirIndex = dirMap[octant];
    } else {
        joyVector = { x: 0, y: 0 };
        player.isMoving = false;
    }
}

joyZone.addEventListener('pointerdown', (e) => { isDragging = true; handleMove(e.clientX, e.clientY); });
window.addEventListener('pointermove', (e) => { if (isDragging) handleMove(e.clientX, e.clientY); });
window.addEventListener('pointerup', () => {
    if (isDragging) {
        isDragging = false;
        joyStick.style.transform = `translate(0px, 0px)`;
        joyVector = { x: 0, y: 0 };
        player.isMoving = false;
    }
});

// --- ENGINE DE COLISÃO / FÍSICA ---
function checkCollision(targetX, targetY) {
    for (const obj of worldObjects) {
        if (
            targetX + player.radius > obj.x &&
            targetX - player.radius < obj.x + obj.w &&
            targetY + player.radius > obj.y &&
            targetY - player.radius < obj.y + obj.h
        ) {
            return true; // Colidiu
        }
    }
    return false;
}

setInterval(() => {
    if (player.isMoving) {
        const isoX = joyVector.x * Math.cos(Math.PI / 4) + joyVector.y * Math.sin(Math.PI / 4);
        const isoY = joyVector.y * Math.cos(Math.PI / 4) - joyVector.x * Math.sin(Math.PI / 4);

        const nextX = player.worldX + isoX * player.speed;
        const nextY = player.worldY + isoY * player.speed;

        // Validação de física por eixo (permite deslizar na parede)
        if (!checkCollision(nextX, player.worldY)) {
            player.worldX = nextX;
        }
        if (!checkCollision(player.worldX, nextY)) {
            player.worldY = nextY;
        }
    }
}, 1000 / 60);

render();
