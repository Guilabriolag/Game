const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Configurações de Escala e Renderização ---
const SCALE = 2.2;             // Escala do personagem no Canvas
const TOTAL_FRAMES = 12;       // Resolução de passada
const NUM_DIRECTIONS = 16;     // Suavidade do giro (16 direções)

const player = {
    worldX: 0,
    worldY: 0,
    speed: 0.05,
    dirIndex: 0,              // 0 a 15
    isMoving: false,
    animFrame: 0,
    angle: 0
};

const spriteCache = {};
const TILE_WIDTH = 120;
const TILE_HEIGHT = 60;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// --- Motor de Geração de Sprites Em Memória ---
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
            </g>
        `;
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
            </g>
        `;
    } else if (viewType === 'diag_back') {
        body = `
            <g transform="rotate(${bodyTilt}, 32, 50)">
                <rect x="${21 - legShift*0.5}" y="${58 - legShift*0.7}" width="7" height="26" rx="3" fill="#15212d" />
                <rect x="${31 + legShift*0.5}" y="${58 + legShift*0.7}" width="8" height="26" rx="3" fill="#233548" />
                <rect x="18" y="31" width="26" height="27" rx="5" fill="#3a4b35" stroke="#233020" stroke-width="2" />
                <rect x="10" y="${32 - armShift}" width="6" height="20" rx="3" fill="#1b2a38" />
                <rect x="43" y="${32 + armShift}" width="7" height="22" rx="3" fill="#2b3a4a" />
                <circle cx="32" cy="18" r="9.5" fill="#3a2212" />
            </g>
        `;
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
            </g>
        `;
    } else { // front
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
            </g>
        `;
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
    const screenX = (canvas.width / 2) + (relX - relY) * (TILE_WIDTH / 2);
    const screenY = (canvas.height / 2) + (relX + relY) * (TILE_HEIGHT / 2);
    return { x: screenX, y: screenY };
}

// --- Mapeamento das 16 Direções com Interpolação ---
function getSpriteFor16Directions(dirIndex) {
    // Mapeia o índice de 0 a 15 para os 5 visuais base com espelhamento e micro-rotação
    let viewType = 'front';
    let flipX = 1;
    let rotationAngle = 0; // Ajuste dinâmico em graus para intermediários

    // Ângulo por setor: 360 / 16 = 22.5 graus
    switch (dirIndex) {
        case 0:  viewType = 'front'; break;                                  // Sul
        case 1:  viewType = 'diag_front'; rotationAngle = -11.25; break;      // Sul-Sudeste
        case 2:  viewType = 'diag_front'; break;                             // Sudeste
        case 3:  viewType = 'profile'; rotationAngle = -11.25; break;         // Leste-Sudeste
        case 4:  viewType = 'profile'; break;                                // Leste
        case 5:  viewType = 'diag_back'; rotationAngle = 11.25; break;        // Leste-Nordeste
        case 6:  viewType = 'diag_back'; break;                              // Nordeste
        case 7:  viewType = 'back'; rotationAngle = -11.25; break;           // Norte-Nordeste
        case 8:  viewType = 'back'; break;                                   // Norte
        case 9:  viewType = 'back'; rotationAngle = 11.25; break;            // Norte-Noroeste
        case 10: viewType = 'diag_back'; flipX = -1; break;                  // Noroeste
        case 11: viewType = 'profile'; flipX = -1; rotationAngle = -11.25; break; // Oeste-Noroeste
        case 12: viewType = 'profile'; flipX = -1; break;                    // Oeste
        case 13: viewType = 'diag_front'; flipX = -1; rotationAngle = 11.25; break; // Oeste-Sudoeste
        case 14: viewType = 'diag_front'; flipX = -1; break;                 // Sudoeste
        case 15: viewType = 'front'; rotationAngle = 11.25; break;           // Sul-Sudoeste
    }

    return { viewType, flipX, rotationAngle };
}

// --- Render Loop ---
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Grid Isométrico
    const halfGrid = 7;
    for (let x = -halfGrid; x < halfGrid; x++) {
        for (let y = -halfGrid; y < halfGrid; y++) {
            const pos = worldToScreen(x, y);

            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            ctx.lineTo(pos.x + TILE_WIDTH / 2, pos.y + TILE_HEIGHT / 2);
            ctx.lineTo(pos.x, pos.y + TILE_HEIGHT);
            ctx.lineTo(pos.x - TILE_WIDTH / 2, pos.y + TILE_HEIGHT / 2);
            ctx.closePath();

            ctx.fillStyle = (x + y) % 2 === 0 ? "#181e29" : "#222a38";
            ctx.fill();
            ctx.strokeStyle = "rgba(102, 252, 241, 0.05)";
            ctx.stroke();
        }
    }

    // Atualização da Passada
    if (player.isMoving) {
        player.animFrame = (player.animFrame + 0.25) % TOTAL_FRAMES;
    } else {
        player.animFrame = 0;
    }

    const currentFrame = Math.floor(player.animFrame);
    const spriteData = getSpriteFor16Directions(player.dirIndex);
    const imgToDraw = spriteCache[spriteData.viewType][currentFrame];

    const screenCenter = { x: canvas.width / 2, y: canvas.height / 2 };
    const drawWidth = 64 * SCALE;
    const drawHeight = 96 * SCALE;

    ctx.save();
    ctx.translate(screenCenter.x, screenCenter.y);
    
    // Inversão Horizontal para direções para Oeste
    if (spriteData.flipX === -1) {
        ctx.scale(-1, 1);
    }

    // Micro-rotação procedural para os ângulos intermediários
    if (spriteData.rotationAngle !== 0) {
        ctx.rotate((spriteData.rotationAngle * Math.PI) / 180);
    }

    if (imgToDraw && imgToDraw.complete) {
        ctx.drawImage(imgToDraw, -(drawWidth / 2), -drawHeight + (10 * SCALE), drawWidth, drawHeight);
    }
    ctx.restore();

    document.getElementById('coordsDisplay').innerText = `${player.worldX.toFixed(1)}, ${player.worldY.toFixed(1)}`;

    requestAnimationFrame(render);
}

// --- Controles e Matemática de Entrada do Joystick ---
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
    const maxRadius = 45; // Raio estendido proporcional ao novo layout
    const distance = Math.min(Math.hypot(deltaX, deltaY), maxRadius);
    const angle = Math.atan2(deltaY, deltaX);

    const moveX = Math.cos(angle) * distance;
    const moveY = Math.sin(angle) * distance;

    joyStick.style.transform = `translate(${moveX}px, ${moveY}px)`;

    if (distance > 3) {
        joyVector.x = moveX / maxRadius;
        joyVector.y = moveY / maxRadius;
        player.isMoving = true;

        // Mapeamento em 16 Setores (22.5° por fração)
        let angleStep = (Math.PI * 2) / NUM_DIRECTIONS;
        let octant = Math.round((angle + Math.PI) / angleStep) % NUM_DIRECTIONS;
        
        // Mapeamento dos ângulos do radiano para os índices do Engine
        const dirMap = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 15, 14, 13];
        player.dirIndex = dirMap[octant];
    } else {
        joyVector = { x: 0, y: 0 };
        player.isMoving = false;
    }
}

joyZone.addEventListener('pointerdown', (e) => {
    isDragging = true;
    handleMove(e.clientX, e.clientY);
});

window.addEventListener('pointermove', (e) => {
    if (isDragging) handleMove(e.clientX, e.clientY);
});

window.addEventListener('pointerup', () => {
    if (isDragging) {
        isDragging = false;
        joyStick.style.transform = `translate(0px, 0px)`;
        joyVector = { x: 0, y: 0 };
        player.isMoving = false;
    }
});

// Loop de Física Sincronizado
setInterval(() => {
    if (player.isMoving) {
        // Conversão de Vetor de Tela para Eixos Isométricos
        const isoX = joyVector.x * Math.cos(Math.PI / 4) + joyVector.y * Math.sin(Math.PI / 4);
        const isoY = joyVector.y * Math.cos(Math.PI / 4) - joyVector.x * Math.sin(Math.PI / 4);

        player.worldX += isoX * player.speed;
        player.worldY += isoY * player.speed;
    }
}, 1000 / 60);

// Inicia Render
render();
