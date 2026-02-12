// ============================================================
// 福 Cube — 3D ASCII Fortune Experience
// State machine: arrival → draw → fortune → (fireworks, etc.)
// ============================================================
import * as THREE from 'three';
import vertexShader from './particleVertex.glsl?raw';
import fragmentShader from './particleFragment.glsl?raw';

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

// --- Configuration ---
const CONFIG = {
    bg: '#990000', // Crimson
    glowRed: '#FF2D2D',
    glowGold: '#FFD700',
    glowGreen: '#00FF9F',
    // Transition durations (ms) — spec families: 250, 450, 900
    scatterDur: 450,
    scrambleDur: 900,
    convergeDur: 450,
    settleDur: 250,
    // Draw phase: seconds before 福 bursts into particles
    fuExplodeDelay: 2.0,
    // Draw phase: independent timing controls (seconds)
    fuRiseDuration: 0.8,
    fuShrinkDuration: 0.8,
    fuShrinkEndScale: 0.18,
    // Draw camera timing (seconds): quick pullback, then hold until burst
    fuCameraPullbackDuration: 0.45,
    fuCameraReturnDuration: 0.7,
    // Firework shell rise time (seconds) before burst
    shellRiseDuration: 2.5,
};

const LUCKY_CHARS_BY_DENSITY = [
    ' ', '·', '一', '人', '十', '大', '吉', '平', '安', '和',
    '春', '利', '兴', '旺', '发', '金', '贵', '富', '财', '寿',
    '禄', '喜', '龙', '凤', '福',
];

const ALL_LUCKY = '福禄寿喜财富贵发金玉宝余丰盛利旺隆昌兴进安康宁泰和平顺健乐欢庆禧祺嘉春德善仁义忠信孝慧恩爱合圆满美馨雅吉祥瑞如意祝运龙凤麟鹤华成升登高';

const CHAR_BLESSINGS = {
    '一': { phrase: '一帆风顺', english: 'Smooth sailing in all endeavors' },
    '人': { phrase: '人寿年丰', english: 'Long life and abundant harvests' },
    '十': { phrase: '十全十美', english: 'Perfection in every way' },
    '大': { phrase: '大吉大利', english: 'Great luck and great profit' },
    '吉': { phrase: '吉祥如意', english: 'Good fortune as you wish' },
    '平': { phrase: '四季平安', english: 'Peace through all four seasons' },
    '安': { phrase: '岁岁平安', english: 'Peace and safety year after year' },
    '和': { phrase: '和气生财', english: 'Harmony brings prosperity' },
    '春': { phrase: '春风得意', english: 'Success on the spring breeze' },
    '利': { phrase: '开岁大利', english: 'Great profit in the new year' },
    '兴': { phrase: '兴旺发达', english: 'Flourishing and thriving' },
    '旺': { phrase: '人丁兴旺', english: 'A growing and prosperous family' },
    '发': { phrase: '恭喜发财', english: 'Wishing you great prosperity' },
    '金': { phrase: '金玉满堂', english: 'Gold and jade fill the hall' },
    '贵': { phrase: '荣华富贵', english: 'Glory, splendor, and riches' },
    '富': { phrase: '富贵有余', english: 'Wealth and abundance to spare' },
    '财': { phrase: '财源广进', english: 'Wealth flowing from all directions' },
    '寿': { phrase: '福寿双全', english: 'Both blessings and longevity' },
    '禄': { phrase: '高官厚禄', english: 'High rank and generous reward' },
    '喜': { phrase: '双喜临门', english: 'Double happiness at the door' },
    '龙': { phrase: '龙马精神', english: 'The vigor of dragons and horses' },
    '凤': { phrase: '龙凤呈祥', english: 'Dragon and phoenix bring fortune' },
    '福': { phrase: '福星高照', english: 'The star of fortune shines bright' },
};

// --- Calligraphy Fonts ---
const CALLI_FONTS = [
    // Google Fonts
    '"Zhi Mang Xing"',              // 指芒星 — running script
    '"Liu Jian Mao Cao"',           // 柳建毛草 — grass script
    '"Ma Shan Zheng"',              // 马善政 — bold brush
    // Chinese Webfont Project (中文网字计划)
    '"TsangerZhoukeZhengdabangshu"', // 仓耳周珂正大榜书 — banner calligraphy
    '"hongleixingshu"',              // 鸿雷行书简体 — running script
    '"qiantubifengshouxieti"',       // 千图笔锋手写体 — brush stroke
    '"峄山碑篆体"',                    // 峄山碑篆体 — seal script
];
const FONT_DISPLAY_NAMES = [
    '指芒星',
    '柳建毛草',
    '马善政',
    '仓耳周珂正大榜书',
    '鸿雷行书简体',
    '千图笔锋手写体',
    '峄山碑篆体',
];
const chosenFont = CALLI_FONTS[Math.floor(Math.random() * CALLI_FONTS.length)];

// --- Daji title font cycling ---
let dajiFontIdx = 0;
let dajiFontTransition = null; // { oldFont, startTime }
let dajiFontAutoTimer = 0; // globalTime of last cycle
const DAJI_AUTO_INTERVAL = 4.5; // seconds between auto-cycles

function getDajiFont() { return CALLI_FONTS[dajiFontIdx]; }

function cycleDajiFont(dir) {
    const oldFont = CALLI_FONTS[dajiFontIdx];
    let newIdx;
    do { newIdx = Math.floor(Math.random() * CALLI_FONTS.length); } while (newIdx === dajiFontIdx && CALLI_FONTS.length > 1);
    dajiFontIdx = newIdx;
    dajiFontTransition = { oldFont, startTime: globalTime };
    dajiFontAutoTimer = globalTime;
}

// --- Math ---
function lerp(a, b, t) { return a + (b - a) * t; }
function easeInOut(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }

// --- 3D Projection ---
const SCENE_FOV = 500;

function project3D(x, y, z, fov) {
    const scale = fov / (fov + z);
    return {
        screenX: x * scale + window.innerWidth / 2,
        screenY: y * scale + window.innerHeight / 2,
        scale,
    };
}

function gridToWorld(col, row) {
    return {
        x: (col - cols / 2) * cellSize,
        y: (row - rows / 2) * cellSize,
    };
}

// --- Responsive Grid ---
let cellSize, cols, rows, gridW, gridH, offsetX, offsetY;
let dpr = Math.min(window.devicePixelRatio || 1, 2);

// Forward-declare Three.js variables so resize() can reference them safely
let glRenderer, glScene, glCamera, particlesMesh;
let charToUV = {}; // Map<char, {u, v}>

function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    const vmin = Math.min(window.innerWidth, window.innerHeight);
    cellSize = Math.max(10, Math.floor(vmin * 0.028));
    cols = Math.floor(window.innerWidth / cellSize);
    rows = Math.floor(window.innerHeight / cellSize);
    gridW = cols * cellSize;
    gridH = rows * cellSize;
    offsetX = (window.innerWidth - gridW) / 2;
    offsetY = (window.innerHeight - gridH) / 2;
    
    if (glRenderer) {
        glRenderer.setSize(window.innerWidth, window.innerHeight);
        glRenderer.setPixelRatio(dpr);
        // Recalculate camera FOV to match the project3D logic
        // scale = 1 at z=0 (distance SCENE_FOV).
        // visible height at distance SCENE_FOV should be window.innerHeight
        const fov = 2 * Math.atan(window.innerHeight / (2 * SCENE_FOV)) * (180 / Math.PI);
        glCamera.fov = fov;
        glCamera.aspect = window.innerWidth / window.innerHeight;
        glCamera.updateProjectionMatrix();
    }
}
window.addEventListener('resize', resize);
resize();

// --- Three.js Setup (Hybrid Rendering) ---
const ATLAS_COLS = 20;
const ATLAS_ROWS = 20; // 400 chars capacity (extra room for calligraphy font variants)
const CELL_PX = 64; // Resolution per character

function initThreeJS() {
    // 1. Renderer
    glRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
    glRenderer.setSize(window.innerWidth, window.innerHeight);
    glRenderer.setPixelRatio(dpr);
    // Note: We don't append glRenderer.domElement to body. We draw it to canvas.

    // 2. Camera — FOV matches the original project3D(x,y,z,SCENE_FOV) projection
    const fov = 2 * Math.atan(window.innerHeight / (2 * SCENE_FOV)) * (180 / Math.PI);
    glCamera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 1, 3000);
    glCamera.position.set(0, 0, SCENE_FOV);
    glCamera.lookAt(0, 0, 0);

    // 3. Scene
    glScene = new THREE.Scene();

    // 4. Texture Atlas
    const atlasCanvas = document.createElement('canvas');
    atlasCanvas.width = ATLAS_COLS * CELL_PX;
    atlasCanvas.height = ATLAS_ROWS * CELL_PX;
    const actx = atlasCanvas.getContext('2d');
    
    // Black background — avoids premultiplication issues, R channel = intensity
    actx.fillStyle = '#000';
    actx.fillRect(0, 0, atlasCanvas.width, atlasCanvas.height);

    // Collect all unique characters
    const uniqueChars = new Set([
        ...LUCKY_CHARS_BY_DENSITY,
        ...ALL_LUCKY.split(''),
        ...Object.keys(CHAR_BLESSINGS),
        '·'
    ]);
    
    actx.font = `bold ${Math.floor(CELL_PX * 0.7)}px "Courier New", "SF Mono", monospace`;
    actx.textAlign = 'center';
    actx.textBaseline = 'middle';
    actx.fillStyle = '#FFFFFF';
    
    // Pre-bake glow? The shader handles tinting.
    // The texture should be white, so we can tint it.
    // To get the "glow" look, we can draw with shadowBlur in the atlas.
    
    actx.shadowColor = 'white';
    actx.shadowBlur = CELL_PX * 0.12; // Baked glow (must fade to zero within cell)

    let idx = 0;
    uniqueChars.forEach(char => {
        if (idx >= ATLAS_COLS * ATLAS_ROWS) return;
        const col = idx % ATLAS_COLS;
        const row = Math.floor(idx / ATLAS_COLS);
        const x = col * CELL_PX + CELL_PX / 2;
        const y = row * CELL_PX + CELL_PX / 2;
        
        actx.fillText(char, x, y);
        
        // UV coordinates (bottom-left origin in UV space? Three.js uses top-left for CanvasTexture?)
        // Standard UV: 0,0 is bottom-left. Canvas Y increases downwards.
        // Three.js flips Y by default for textures unless flipY=false.
        // Let's assume standard mapping: U = col/COLS, V = 1.0 - (row + 1)/ROWS (if flipping).
        
        // Actually simpler: pass cell index or raw UV.
        // Let's pass the UV of top-left corner.
        charToUV[char] = {
            u: col / ATLAS_COLS,
            v: 1.0 - (row + 1) / ATLAS_ROWS // Flip V to match WebGL standard
        };
        idx++;
    });

    // Bake calligraphy font variants for cluster characters
    const clusterChars = LUCKY_CHARS_BY_DENSITY.filter(c => c !== ' ');
    for (let fi = 0; fi < CALLI_FONTS.length; fi++) {
        actx.font = `bold ${Math.floor(CELL_PX * 0.7)}px ${CALLI_FONTS[fi]}, "Courier New", monospace`;
        for (const char of clusterChars) {
            if (idx >= ATLAS_COLS * ATLAS_ROWS) break;
            const col = idx % ATLAS_COLS;
            const row = Math.floor(idx / ATLAS_COLS);
            const x = col * CELL_PX + CELL_PX / 2;
            const y = row * CELL_PX + CELL_PX / 2;
            actx.fillText(char, x, y);
            charToUV[char + '|' + fi] = {
                u: col / ATLAS_COLS,
                v: 1.0 - (row + 1) / ATLAS_ROWS
            };
            idx++;
        }
    }

    const atlasTexture = new THREE.CanvasTexture(atlasCanvas);
    atlasTexture.magFilter = THREE.LinearFilter;
    atlasTexture.minFilter = THREE.LinearFilter;
    // atlasTexture.flipY = true; // Default

    // 5. InstancedMesh
    const MAX_PARTICLES = 4000;
    const geometry = new THREE.PlaneGeometry(1, 1);
    const material = new THREE.ShaderMaterial({
        uniforms: {
            atlas: { value: atlasTexture },
            cellSize: { value: new THREE.Vector2(1 / ATLAS_COLS, 1 / ATLAS_ROWS) }
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        transparent: true,
        blending: THREE.CustomBlending,
        blendSrc: THREE.OneFactor,
        blendDst: THREE.OneFactor,
        blendEquation: THREE.AddEquation,
        depthWrite: false,
        depthTest: false
    });

    particlesMesh = new THREE.InstancedMesh(geometry, material, MAX_PARTICLES);
    
    // Allocate attributes
    const instanceColor = new Float32Array(MAX_PARTICLES * 3);
    const instanceAlpha = new Float32Array(MAX_PARTICLES);
    const instanceUV = new Float32Array(MAX_PARTICLES * 2);
    const instanceScale = new Float32Array(MAX_PARTICLES);

    particlesMesh.geometry.setAttribute('instanceColor', new THREE.InstancedBufferAttribute(instanceColor, 3));
    particlesMesh.geometry.setAttribute('instanceAlpha', new THREE.InstancedBufferAttribute(instanceAlpha, 1));
    particlesMesh.geometry.setAttribute('instanceUV', new THREE.InstancedBufferAttribute(instanceUV, 2));
    particlesMesh.geometry.setAttribute('instanceScale', new THREE.InstancedBufferAttribute(instanceScale, 1));
    
    // Use manual matrix updates for position? Or a custom attribute?
    // Shader uses `instanceMatrix` (standard) for position. We'll set it in the loop.
    
    particlesMesh.frustumCulled = false;
    glScene.add(particlesMesh);
}

// --- Grid Buffer (for ASCII elements: bg particles, 大吉, morph) ---
let grid = [];
function clearGrid() {
    grid = new Array(rows * cols).fill(null);
}
function setCell(col, row, depth, char, r, g, b, alpha) {
    if (col < 0 || col >= cols || row < 0 || row >= rows) return;
    const idx = row * cols + col;
    const existing = grid[idx];
    if (existing && existing.depth <= depth) return;
    grid[idx] = { char, r, g, b, alpha, depth };
}

// --- Character Sampling (for morph source + 大吉 target) ---
function sampleCharacterShape(char, resolution, fontOverride) {
    const off = document.createElement('canvas');
    const octx = off.getContext('2d');
    const charCount = [...char].length;
    const w = resolution * charCount;
    const h = resolution;
    off.width = w;
    off.height = h;

    octx.fillStyle = '#000';
    octx.fillRect(0, 0, w, h);
    octx.fillStyle = '#fff';
    octx.textAlign = 'center';
    octx.textBaseline = 'middle';
    const font = fontOverride || '"SimSun", "STSong", "Songti SC", "Noto Serif SC", serif';
    octx.font = `bold ${Math.floor(resolution * 0.85)}px ${font}`;
    octx.fillText(char, w / 2, h / 2);

    const imageData = octx.getImageData(0, 0, w, h);
    const data = imageData.data;
    const points = [];
    const step = charCount > 1 ? 2 : 1;
    for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
            const idx = (y * w + x) * 4;
            const brightness = data[idx] / 255;
            if (brightness > 0.1) {
                points.push({
                    nx: (x / w) * 2 - 1,
                    ny: (y / h) * 2 - 1,
                    brightness,
                    aspect: charCount,
                });
            }
        }
    }
    return points;
}

function selectCharByLuminance(luminance) {
    const idx = Math.floor(luminance * (LUCKY_CHARS_BY_DENSITY.length - 1));
    return LUCKY_CHARS_BY_DENSITY[Math.max(0, Math.min(idx, LUCKY_CHARS_BY_DENSITY.length - 1))];
}

function lerpColor(luminance) {
    const r = 255;
    const g = Math.floor(45 + luminance * (215 - 45));
    const b = Math.floor(45 - luminance * 45);
    return { r, g, b };
}

// --- Shape Data (sampled after fonts load) ---
let fuShape = [];
let dajiShape = [];
let fontsReady = false;

// Force-load all calligraphy fonts (needed for morph transitions between fonts)
Promise.all(
    CALLI_FONTS.map(f => document.fonts.load(`64px ${f}`, '福大吉'))
).then(() => {
    fuShape = sampleCharacterShape('福', 64, chosenFont);
    dajiShape = sampleCharacterShape('大吉', 64);
    fontsReady = true;
    initThreeJS();
});

// --- 3D Daji Cluster ---
let daji3DParticles = [];
let daji3DEntryTime = 0;
let daji3DFromSeed = false;
let hoveredIdx = -1;
let currentDisplayText = '大吉大利'; // 当前显示的文字，默认"大吉大利"
let targetDisplayText = '大吉大利';  // 目标文字
let textMorphProgress = 1.0;     // 文字变形进度 0-1
let lastTextChangeTime = 0;      // 上次文字改变时间
let isTextAnimating = false;     // 是否正在播放文字动画
let textAnimationStartTime = 0;  // 文字动画开始时间

function initDaji3D(seedParticles) {
    daji3DParticles = [];
    hoveredIdx = -1;
    daji3DFromSeed = false;
    hideTooltip();
    if (Array.isArray(seedParticles) && seedParticles.length > 0) {
        daji3DParticles = seedParticles.map((p) => ({ ...p }));
        daji3DFromSeed = true;
        daji3DEntryTime = globalTime;
        return;
    }
    if (!fontsReady) return;

    const spread = Math.min(cols, rows) * 0.40 * cellSize;
    const depth = spread * 0.4;

    for (const pt of dajiShape) {
        const lum = Math.min(1, pt.brightness + 0.08);
        const char = selectCharByLuminance(lum);
        if (char === ' ') continue;
        const color = lerpColor(lum);

        daji3DParticles.push({
            baseX: pt.nx * spread * 0.5 * pt.aspect,
            baseY: pt.ny * spread * 0.5,
            origZ: (Math.random() - 0.5) * depth,
            char,
            fontIdx: Math.random() < 0.7 ? Math.floor(Math.random() * CALLI_FONTS.length) : null,
            r: color.r, g: color.g, b: color.b,
            alpha: 0.3 + lum * 0.7,
            lum,
            phase: Math.random() * Math.PI * 2,
        });
    }
    daji3DEntryTime = globalTime;
}

// Replaces render3DDaji with GPU rendering
function updateDajiToGPU(skipRender) {
    if (!particlesMesh) return 0;
    if (!daji3DParticles.length) {
        particlesMesh.count = 0;
        return 0;
    }

    const spread = Math.min(cols, rows) * 0.40 * cellSize;
    const entryT = Math.min(1, (globalTime - daji3DEntryTime) / 1.2);
    const zInflate = daji3DFromSeed ? 1 : easeInOut(entryT);
    const blendT = daji3DFromSeed ? Math.min(1, (globalTime - daji3DEntryTime) / 0.6) : 1;
    const breatheDelay = daji3DFromSeed ? 0 : 0.5;
    const breatheRamp = daji3DFromSeed
        ? 1
        : Math.min(1, Math.max(0, (globalTime - daji3DEntryTime - breatheDelay) / 0.8));
    const breatheAmp = spread * 0.06 * breatheRamp;

    const instColor = particlesMesh.geometry.attributes.instanceColor;
    const instAlpha = particlesMesh.geometry.attributes.instanceAlpha;
    const instUV = particlesMesh.geometry.attributes.instanceUV;
    const instScale = particlesMesh.geometry.attributes.instanceScale;

    const maxCount = instColor.count;
    const count = Math.min(daji3DParticles.length, maxCount);

    const clusterH = spread * 0.5;
    const highlightPos = Math.sin(globalTime * 0.8) * 0.3;

    for (let i = 0; i < count; i++) {
        const p = daji3DParticles[i];
        const z = p.origZ * zInflate + Math.sin(globalTime * 1.5 + p.phase) * breatheAmp;
        const isHovered = i === hoveredIdx;
        const hoverPush = isHovered ? -80 : 0;

        _dummy.position.set(p.baseX, -p.baseY, -(z + hoverPush));
        _dummy.updateMatrix();
        particlesMesh.setMatrixAt(i, _dummy.matrix);

        // Alpha — boost for additive, clamp for transparency
        let alpha = p.alpha * Math.max(0.2, 1.25);
        alpha = Math.min(0.8, alpha);
        if (isHovered) alpha = 1.0;

        // Metallic gradient based on world Y position
        const yNorm = clusterH > 0 ? p.baseY / clusterH : 0;
        const gradT = Math.max(0, Math.min(1, (yNorm + 1) * 0.5));
        const hDist = Math.abs(yNorm - highlightPos);
        const highlight = Math.max(0, 1 - hDist * 3);

        const metalR = Math.min(255, Math.floor(lerp(255, 180, gradT) + highlight * 55));
        const metalG = Math.min(255, Math.floor(lerp(225, 130, gradT) + highlight * 40));
        const metalB = Math.min(255, Math.floor(lerp(50, 10, gradT) + highlight * 50));

        // Blend from seed colors (particle's original r/g/b) to metallic
        const gr = lerp(p.r, metalR, blendT) / 255;
        const gg = lerp(p.g, metalG, blendT) / 255;
        const gb = lerp(p.b, metalB, blendT) / 255;

        instColor.setXYZ(i, isHovered ? 1.0 : gr, isHovered ? 0.97 : gg, isHovered ? 0.86 : gb);
        instAlpha.setX(i, alpha);

        const uv = (p.fontIdx != null && charToUV[p.char + '|' + p.fontIdx]) || charToUV[p.char];
        if (uv) instUV.setXY(i, uv.u, uv.v);

        let scale = cellSize * 1.1;
        if (isHovered) scale *= 2.2;
        instScale.setX(i, scale);
    }

    particlesMesh.count = count;
    particlesMesh.instanceMatrix.needsUpdate = true;
    instColor.needsUpdate = true;
    instAlpha.needsUpdate = true;
    instUV.needsUpdate = true;
    instScale.needsUpdate = true;

    if (!skipRender) renderAndCompositeGL();
    return count;
}

// --- Tooltip ---
const tooltip = document.createElement('div');
Object.assign(tooltip.style, {
    position: 'fixed',
    pointerEvents: 'none',
    opacity: '0',
    transition: 'opacity 0.2s ease',
    background: 'rgba(10, 10, 10, 0.92)',
    border: '1px solid rgba(255, 215, 0, 0.4)',
    borderRadius: '8px',
    padding: '14px 18px',
    textAlign: 'center',
    fontFamily: '"Courier New", "SF Mono", monospace',
    zIndex: '100',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    boxShadow: '0 0 24px rgba(255, 45, 45, 0.15), 0 0 8px rgba(255, 215, 0, 0.1)',
    maxWidth: '220px',
    minWidth: '140px',
});
tooltip.innerHTML = '<div id="tt-char" style="font-size:36px;color:#FFD700;margin-bottom:6px;text-shadow:0 0 12px rgba(255,215,0,0.5)"></div>'
    + '<div id="tt-phrase" style="font-size:15px;color:#FF2D2D;margin-bottom:4px"></div>'
    + '<div id="tt-english" style="font-size:11px;color:#FFD700;opacity:0.65"></div>';
document.body.appendChild(tooltip);

function showTooltip(char, screenX, screenY) {
    const blessing = CHAR_BLESSINGS[char];
    if (!blessing) { hideTooltip(); return; }

    document.getElementById('tt-char').textContent = char;
    document.getElementById('tt-phrase').textContent = blessing.phrase;
    document.getElementById('tt-english').textContent = blessing.english;

    const ttW = 200;
    const ttH = 110;
    let left = screenX - ttW / 2;
    let top = screenY - ttH - 30;

    left = Math.max(8, Math.min(window.innerWidth - ttW - 8, left));
    if (top < 8) top = screenY + 40;

    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
    tooltip.style.opacity = '1';
}

function hideTooltip() {
    tooltip.style.opacity = '0';
}

function updateHover(clientX, clientY) {
    if (daji3DParticles.length === 0) { hoveredIdx = -1; hideTooltip(); return; }

    const spread = Math.min(cols, rows) * 0.40 * cellSize;
    const entryT = Math.min(1, (globalTime - daji3DEntryTime) / 1.2);
    const zInflate = daji3DFromSeed ? 1 : easeInOut(entryT);
    const blendT = daji3DFromSeed ? Math.min(1, (globalTime - daji3DEntryTime) / 0.6) : 1;
    const breatheAmp = spread * 0.06 * (daji3DFromSeed ? blendT : zInflate);

    let bestIdx = -1, bestDist = Infinity;

    for (let i = 0; i < daji3DParticles.length; i++) {
        const p = daji3DParticles[i];
        if (!CHAR_BLESSINGS[p.char]) continue;
        const z = p.origZ * zInflate + Math.sin(globalTime * 1.5 + p.phase) * breatheAmp;
        const proj = project3D(p.baseX, p.baseY, z, SCENE_FOV);
        const dx = proj.screenX - clientX;
        const dy = proj.screenY - clientY;
        const dist = dx * dx + dy * dy;
        if (dist < bestDist) {
            bestDist = dist;
            bestIdx = i;
        }
    }

    const threshold = cellSize * 4.0; // 增加检测范围
    if (bestDist > threshold * threshold) {
        hoveredIdx = -1;
        hideTooltip();
        // 没有 hover 时，恢复显示"大吉大利"
        if (targetDisplayText !== '大吉大利') {
            currentDisplayText = targetDisplayText; // 保存旧文字
            targetDisplayText = '大吉大利';
            isTextAnimating = true;
            textAnimationStartTime = globalTime;
        }
        return;
    }

    if (bestIdx !== hoveredIdx) {
        hoveredIdx = bestIdx;
        const p = daji3DParticles[bestIdx];
        const z = p.origZ * zInflate + Math.sin(globalTime * 1.5 + p.phase) * breatheAmp;
        const proj = project3D(p.baseX, p.baseY, z, SCENE_FOV);
        showTooltip(p.char, proj.screenX, proj.screenY);

        // 获取完整的4字成语
        const blessing = CHAR_BLESSINGS[p.char];
        if (blessing && blessing.phrase) {
            const newText = blessing.phrase;
            if (targetDisplayText !== newText) {
                currentDisplayText = targetDisplayText; // 保存旧文字
                targetDisplayText = newText;
                isTextAnimating = true;
                textAnimationStartTime = globalTime;
            }
        }
    }
}

// --- Background Particles ---
const bgParticles = [];
function initBgParticles() {
    for (let i = 0; i < 40; i++) {
        bgParticles.push({
            col: Math.random() * cols,
            row: Math.random() * rows,
            vx: (Math.random() - 0.5) * 0.02,
            vy: (Math.random() - 0.5) * 0.02,
            char: ALL_LUCKY[Math.floor(Math.random() * ALL_LUCKY.length)],
            alpha: 0.03 + Math.random() * 0.08,
            phase: Math.random() * Math.PI * 2,
            changeTimer: Math.random() * 200,
        });
    }
}
initBgParticles();

function updateBgParticles(time) {
    for (const p of bgParticles) {
        p.col += p.vx;
        p.row += p.vy;
        p.changeTimer--;
        if (p.col < 0) p.col += cols;
        if (p.col >= cols) p.col -= cols;
        if (p.row < 0) p.row += rows;
        if (p.row >= rows) p.row -= rows;
        if (p.changeTimer <= 0) {
            p.char = ALL_LUCKY[Math.floor(Math.random() * ALL_LUCKY.length)];
            p.changeTimer = 100 + Math.random() * 200;
        }
        const col = Math.floor(p.col);
        const row = Math.floor(p.row);
        const flicker = p.alpha + Math.sin(p.phase + time * 1.5) * 0.02;
        setCell(col, row, 999, p.char, 255, 215, 0, Math.max(0.01, flicker));
    }
}

// --- Scanlines ---
function drawScanlines() {
    ctx.save();
    ctx.globalAlpha = 0.03;
    ctx.fillStyle = '#fff';
    for (let y = 0; y < canvas.height; y += 4 * dpr) {
        ctx.fillRect(0, y, canvas.width, 1 * dpr);
    }
    ctx.restore();
}

// --- Render ASCII Grid to Canvas ---
function renderGrid() {
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = CONFIG.bg;
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

    const fontSize = cellSize;
    ctx.font = `${fontSize}px ${chosenFont}, "Courier New", "SF Mono", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const cell = grid[row * cols + col];
            if (!cell) continue;
            const x = offsetX + col * cellSize + cellSize / 2;
            const y = offsetY + row * cellSize + cellSize / 2;
            if (cell.alpha > 0.3) {
                ctx.shadowColor = `rgba(${cell.r}, ${cell.g}, ${cell.b}, ${cell.alpha * 0.6})`;
                ctx.shadowBlur = cellSize * cell.alpha * 1.2;
            } else {
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
            }
            ctx.fillStyle = `rgba(${cell.r}, ${cell.g}, ${cell.b}, ${cell.alpha})`;
            ctx.fillText(cell.char, x, y);
        }
    }
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    ctx.restore();
    drawScanlines();
}

// --- Draw the calligraphy 福 directly on canvas ---
function drawCalligraphyFu(alpha) {
    ctx.save();
    ctx.scale(dpr, dpr);

    const vmin = Math.min(window.innerWidth, window.innerHeight);
    const fuSize = vmin * 0.55;
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${fuSize}px ${chosenFont}, serif`;

    // Outer glow layer
    ctx.globalAlpha = alpha * 0.3;
    ctx.shadowColor = CONFIG.glowGold;
    ctx.shadowBlur = fuSize * 0.15;
    ctx.fillStyle = CONFIG.glowGold;
    ctx.fillText('福', cx, cy);

    // Main character
    ctx.globalAlpha = alpha;
    ctx.shadowColor = CONFIG.glowGold;
    ctx.shadowBlur = fuSize * 0.06;
    ctx.fillStyle = CONFIG.glowGold;
    ctx.fillText('福', cx, cy);

    ctx.shadowBlur = 0;
    ctx.restore();
}

// --- Draw text overlay ---
function drawOverlayText(text, yFraction, color, alpha, size, fontOverride) {
    ctx.save();
    ctx.scale(dpr, dpr);
    const fontSize = size || Math.max(12, cellSize * 1.2);
    const font = fontOverride || '"Courier New", "SF Mono", monospace';
    ctx.font = `${fontSize}px ${font}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color || CONFIG.glowGreen;
    ctx.globalAlpha = alpha ?? 0.6;
    ctx.shadowColor = color || CONFIG.glowGreen;
    ctx.shadowBlur = fontSize * 0.4;
    ctx.fillText(text, window.innerWidth / 2, window.innerHeight * yFraction);
    ctx.shadowBlur = 0;
    ctx.restore();
}

// Render Three.js particles and composite onto the Canvas 2D
function renderAndCompositeGL() {
    if (!glRenderer || !glScene || !glCamera) return;
    glRenderer.render(glScene, glCamera);
    // Composite onto Canvas 2D with additive blending
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0); // reset to physical pixel coords
    ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(glRenderer.domElement, 0, 0);
    ctx.restore();
}

// Shared dummy object for setMatrixAt (avoid per-frame allocation)
const _dummy = new THREE.Object3D();

// Updates GPU buffers for generic particle list (Launch, Morph, Fireworks)
function updateProjectedGlyphsToGPU(glyphs) {
    if (!particlesMesh) return;
    if (!glyphs.length) {
        particlesMesh.count = 0;
        return;
    }

    const instColor = particlesMesh.geometry.attributes.instanceColor;
    const instAlpha = particlesMesh.geometry.attributes.instanceAlpha;
    const instUV = particlesMesh.geometry.attributes.instanceUV;
    const instScale = particlesMesh.geometry.attributes.instanceScale;

    const maxCount = particlesMesh.geometry.getAttribute('instanceColor').count;
    const count = Math.min(glyphs.length, maxCount);

    for (let i = 0; i < count; i++) {
        const g = glyphs[i];

        // Negate Y (WebGL Y-up) and Z (original z>0 = farther, Three.js z>0 = closer)
        _dummy.position.set(g.x, -g.y, -g.z);
        _dummy.updateMatrix();
        particlesMesh.setMatrixAt(i, _dummy.matrix);

        instColor.setXYZ(i, g.r / 255, g.g / 255, g.b / 255);
        instAlpha.setX(i, g.alpha);

        const uv = (g.fontIdx != null && charToUV[g.char + '|' + g.fontIdx]) || charToUV[g.char];
        if (uv) instUV.setXY(i, uv.u, uv.v);

        instScale.setX(i, cellSize * (g.size || 1));
    }

    particlesMesh.count = count;
    particlesMesh.instanceMatrix.needsUpdate = true;
    instColor.needsUpdate = true;
    instAlpha.needsUpdate = true;
    instUV.needsUpdate = true;
    instScale.needsUpdate = true;

    renderAndCompositeGL();
}

// ============================================================
// STATE MACHINE
// ============================================================
let state = 'arrival';
let stateTime = 0;
let globalTime = 0;
let stateStartGlobal = 0;
let drawToFortuneSeed = null;

function changeState(newState) {
    state = newState;
    stateStartGlobal = globalTime;
    stateTime = 0;
    if (newState === 'draw') initDrawAnimation();
    if (newState === 'fortune') {
        if (drawToFortuneSeed && drawToFortuneSeed.length > 0) {
            initDaji3D(drawToFortuneSeed);
            drawToFortuneSeed = null;
        } else {
            initDaji3D();
        }
        initFireworks();
    }
    if (newState === 'fireworks') { hoveredIdx = -1; hideTooltip(); initFireworks(); }
}

// ============================================================
// ARRIVAL — Calligraphy 福 with neon glow + hint
// ============================================================
function updateArrival() {
    updateBgParticles(globalTime);
}

function renderArrivalOverlay() {
    // Calligraphy 福
    const fadeIn = Math.min(1, stateTime / 1.0);
    drawCalligraphyFu(fadeIn);

    // Title text
    const textFade = Math.min(1, stateTime / 1.5);
    drawOverlayText('新年纳福', 0.15, CONFIG.glowGold, textFade * 0.8, cellSize * 2);
    drawOverlayText('Embrace Fortune in the New Year', 0.20, CONFIG.glowGold, textFade * 0.5, cellSize * 1.1);

    // Swipe hint with gentle hops then rest
    const hintFade = Math.min(1, Math.max(0, (stateTime - 1.5) / 0.5));
    const pulse = 0.4 + Math.sin(globalTime * 3) * 0.2;
    // 3 gentle sine hops (0.9s) then rest (2.1s), total cycle 3s
    const hopPhase = globalTime % 3.0;
    let hopOffset = 0;
    if (hopPhase < 0.9) {
        const decay = 1 - hopPhase / 0.9;
        hopOffset = -Math.abs(Math.sin(hopPhase / 0.9 * Math.PI * 3)) * 0.012 * decay;
    }
    drawOverlayText('↑  上滑抽签  ↑', 0.88 + hopOffset, CONFIG.glowGold, hintFade * pulse, cellSize * 1.6);
    drawOverlayText('Swipe Up to Draw Fortune', 0.92 + hopOffset, CONFIG.glowGold, hintFade * pulse, cellSize * 1.1);
}

// ============================================================
// DRAW — 福 launches like firework → burst → reform into 大吉
// ============================================================
let morphParticles = [];
let launchTrail = [];
let burstFlash = 0;

// Draw phase timing
const DRAW_LAUNCH = CONFIG.fuExplodeDelay;
const DRAW_RISE = CONFIG.fuRiseDuration;
const DRAW_SHRINK = CONFIG.fuShrinkDuration;
const DRAW_SHRINK_END_SCALE = CONFIG.fuShrinkEndScale;
const DRAW_CAMERA_PULLBACK = CONFIG.fuCameraPullbackDuration;
const DRAW_CAMERA_RETURN = CONFIG.fuCameraReturnDuration;
const DRAW_SCATTER = DRAW_LAUNCH + 1.2;
const DRAW_REFORM = DRAW_SCATTER + 1.1;
const DRAW_SETTLE = DRAW_REFORM + 0.4;

function initDrawAnimation() {
    morphParticles = [];
    launchTrail = [];
    burstFlash = 0;
    drawToFortuneSeed = null;
    if (!fontsReady) return;

    const spread = Math.min(cols, rows) * 0.40 * cellSize;
    const depth = spread * 0.4;
    const dajiTargets = dajiShape.map(pt => ({
        x: pt.nx * spread * 0.5 * pt.aspect,
        y: pt.ny * spread * 0.5,
        z: (Math.random() - 0.5) * depth,
        brightness: pt.brightness,
    }));

    // Burst origin — where 福 explodes (upper area)
    const burstOrigin = gridToWorld(cols / 2, rows * 0.22);

    for (let i = 0; i < dajiTargets.length; i++) {
        const tgt = dajiTargets[i];
        const angle = Math.random() * Math.PI * 2;
        // Increase explosion radius and lift for a more dramatic effect
        const scatterRadius = spread * (0.8 + Math.random() * 1.2);
        const scatterLift = spread * (0.1 + Math.random() * 0.4);

        morphParticles.push({
            x: burstOrigin.x,
            y: burstOrigin.y,
            z: 0,
            startX: burstOrigin.x,
            startY: burstOrigin.y,
            startZ: 0,
            scatterX: burstOrigin.x + Math.cos(angle) * scatterRadius,
            scatterY: burstOrigin.y + Math.sin(angle) * scatterRadius * 0.6 + scatterLift,
            scatterZ: (Math.random() - 0.5) * depth * 1.6,
            targetX: tgt.x,
            targetY: tgt.y,
            targetZ: tgt.z,
            char: ALL_LUCKY[Math.floor(Math.random() * ALL_LUCKY.length)],
            scrambleTimer: 0,
            finalChar: selectCharByLuminance(tgt.brightness),
            brightness: tgt.brightness,
            phase: Math.random() * Math.PI * 2,
            fontIdx: Math.random() < 0.7 ? Math.floor(Math.random() * CALLI_FONTS.length) : null,
            active: false,
        });
    }
}

function updateDraw() {
    updateBgParticles(globalTime);

    const t = stateTime;

    // --- LAUNCH: trail sparks behind rising 福 ---
    if (t < DRAW_LAUNCH) {
        const riseT = Math.min(1, t / Math.max(0.001, DRAW_RISE));
        const launchT = easeInOut(riseT);
        const fuRow = lerp(rows * 0.5, rows * 0.22, launchT);
        const fuCol = cols / 2;
        const fuPos = gridToWorld(fuCol, fuRow);
        if (Math.random() < 0.6) {
            launchTrail.push({
                x: fuPos.x + (Math.random() - 0.5) * cellSize * 4,
                y: fuPos.y + cellSize * (0.9 + Math.random() * 2.2),
                z: (Math.random() - 0.5) * cellSize * 3,
                vx: (Math.random() - 0.5) * cellSize * 0.08,
                vy: cellSize * (0.08 + Math.random() * 0.12),
                vz: (Math.random() - 0.5) * cellSize * 0.06,
                char: ALL_LUCKY[Math.floor(Math.random() * ALL_LUCKY.length)],
                life: 1,
                decay: 0.015 + Math.random() * 0.025,
            });
        }
    }

    // --- BURST FLASH ---
    if (t >= DRAW_LAUNCH && t < DRAW_LAUNCH + 0.15) {
        burstFlash = 1 - (t - DRAW_LAUNCH) / 0.15;
        for (const p of morphParticles) p.active = true;
    } else if (t >= DRAW_LAUNCH + 0.15) {
        burstFlash = 0;
    }

    // --- Morph particles: scatter → reform → settle ---
    if (t >= DRAW_LAUNCH) {
        for (const p of morphParticles) {
            if (!p.active) continue;

            if (t < DRAW_SCATTER) {
                // Scatter outward from burst point
                const st = (t - DRAW_LAUNCH) / (DRAW_SCATTER - DRAW_LAUNCH);
                const eased = 1 - Math.pow(1 - st, 2);
                p.x = lerp(p.startX, p.scatterX, eased);
                // Gravity drop with ease-out to avoid velocity jump at end
                p.y = lerp(p.startY, p.scatterY, eased) + eased * cellSize * 6.0;
                p.z = lerp(p.startZ, p.scatterZ, eased);
                
                // Ramp up wobble to match the start of Reform phase (seamless transition)
                const wobble = st * cellSize * 0.8;
                p.x += Math.sin(p.phase + globalTime * 4) * wobble;
                p.y += Math.cos(p.phase + globalTime * 3) * wobble;
                p.z += Math.sin(p.phase * 0.7 + globalTime * 3.2) * wobble * 1.4;

                p.scrambleTimer -= 1;
                if (p.scrambleTimer <= 0) {
                    p.char = ALL_LUCKY[Math.floor(Math.random() * ALL_LUCKY.length)];
                    p.scrambleTimer = 2 + Math.random() * 3;
                }
            } else if (t < DRAW_REFORM) {
                // Reform into 大吉
                const st = (t - DRAW_SCATTER) / (DRAW_REFORM - DRAW_SCATTER);
                const eased = easeInOut(st);
                p.x = lerp(p.scatterX, p.targetX, eased);
                // Start reform from the dropped position (scatterY + 6.0 * cellSize)
                p.y = lerp(p.scatterY + cellSize * 6.0, p.targetY, eased);
                p.z = lerp(p.scatterZ, p.targetZ, eased);
                const wobble = (1 - eased) * cellSize * 0.8;
                p.x += Math.sin(p.phase + globalTime * 4) * wobble;
                p.y += Math.cos(p.phase + globalTime * 3) * wobble;
                p.z += Math.sin(p.phase * 0.7 + globalTime * 3.2) * wobble * 1.4;
                p.scrambleTimer -= 1;
                if (p.scrambleTimer <= 0) {
                    p.char = st > 0.4
                        ? p.finalChar
                        : ALL_LUCKY[Math.floor(Math.random() * ALL_LUCKY.length)];
                    p.scrambleTimer = 2 + st * 12;
                }
            } else {
                // Settle
                const settleT = Math.min(1, (t - DRAW_REFORM) / Math.max(0.001, DRAW_SETTLE - DRAW_REFORM));
                const eased = easeInOut(settleT);

                p.x = lerp(p.x, p.targetX, eased);
                p.y = lerp(p.y, p.targetY, eased);
                p.z = lerp(p.z, p.targetZ, eased);
                p.char = p.finalChar;
            }
        }
    }

    // --- Update trail sparks (compact-in-place, O(n)) ---
    const worldBottom = (rows * 0.5 + 2) * cellSize;
    let tw = 0;
    for (let i = 0; i < launchTrail.length; i++) {
        const s = launchTrail[i];
        s.x += s.vx;
        s.y += s.vy;
        s.z += s.vz;
        s.vx *= 0.98;
        s.vz *= 0.98;
        s.life -= s.decay;
        if (s.life > 0 && s.y < worldBottom) launchTrail[tw++] = s;
    }
    launchTrail.length = tw;

    if (t >= DRAW_SETTLE + 0.3) {
        const seeded = buildDajiSeedFromMorph();
        drawToFortuneSeed = seeded.length > 0 ? seeded : null;
        changeState('fortune');
    }
}

function buildDajiSeedFromMorph() {
    const seeded = [];
    for (const p of morphParticles) {
        if (!p.active) continue;
        const lum = Math.min(1, p.brightness + 0.08);
        const char = p.finalChar || selectCharByLuminance(lum);
        if (char === ' ') continue;
        const color = lerpColor(lum);
        seeded.push({
            baseX: p.x,
            baseY: p.y,
            origZ: p.targetZ, // Use stable targetZ as base, excluding breathing offset
            char,
            fontIdx: p.fontIdx,
            r: color.r,
            g: color.g,
            b: color.b,
            alpha: 0.3 + lum * 0.7,
            lum,
            phase: p.phase,
        });
    }
    return seeded;
}

function renderDrawParticles3D(t) {
    const glyphs = [];

    for (const s of launchTrail) {
        glyphs.push({
            x: s.x,
            y: s.y,
            z: s.z,
            char: s.char,
            r: 255,
            g: Math.floor(190 + s.life * 65),
            b: Math.floor(35 + s.life * 40),
            alpha: s.life * 0.68,
            size: 0.72 + s.life * 0.35,
            glow: 0.9,
            blur: 0.8,
        });
    }

    // Calculate common breathing params once per frame
    const spread = Math.min(cols, rows) * 0.40 * cellSize;
    const breatheAmp = spread * 0.06;

    for (const p of morphParticles) {
        if (!p.active) continue;
        const gp = p.brightness;
        const drawR = 255;
        const drawG = 180 + gp * 75;
        const drawB = gp * 50;
        let r = drawR, g = drawG, b = drawB;
        let alpha, size = 0.95 + gp * 0.45;

        // Visual effects (Flicker/Wobble/Pulse)
        if (t < DRAW_SCATTER) {
            // Explosion: Chaotic flicker and size variation
            const st = (t - DRAW_LAUNCH) / (DRAW_SCATTER - DRAW_LAUNCH);
            const fade = 1 - st; // Fade out chaos to zero

            const flicker = Math.sin(globalTime * 25 + p.phase * 3) * 0.25 * fade;
            alpha = Math.min(1, Math.max(0.1, (0.6 + gp * 0.3) + flicker));
            
            // Size oscillates rapidly
            const sizeWobble = Math.sin(globalTime * 18 + p.phase * 2) * 0.3 * fade;
            size *= (1 + sizeWobble);

        } else if (t < DRAW_REFORM) {
            // Reformation: Magic pulsing as they assemble
            const st = (t - DRAW_SCATTER) / (DRAW_REFORM - DRAW_SCATTER);
            const fade = st; // Fade in order from zero

            // Smooth harmonic pulse
            const pulse = Math.sin(globalTime * 8 + p.phase) * 0.2 * fade;
            alpha = Math.min(1, Math.max(0.2, (0.6 + gp * 0.3) + pulse));

            // Size breathes rhythmically
            const breathe = Math.sin(globalTime * 6 + p.phase) * 0.15 * fade;
            size *= (1 + breathe);

        } else {
            const settleSt = Math.min(1, (t - DRAW_REFORM) / (DRAW_SETTLE - DRAW_REFORM));
            // Blend colors toward seed values (lerpColor) so last frame matches fortune entry
            const lum = Math.min(1, gp + 0.08);
            const seed = lerpColor(lum);
            r = lerp(drawR, seed.r, settleSt);
            g = lerp(drawG, seed.g, settleSt);
            b = lerp(drawB, seed.b, settleSt);
            // Blend alpha toward seed alpha
            const seedAlpha = 0.3 + lum * 0.7;
            const pulseAlpha = Math.min(1, (0.5 + gp * 0.5) * (1 + Math.sin(settleSt * Math.PI) * 0.3));
            alpha = lerp(pulseAlpha, seedAlpha, settleSt);
            // Blend size toward fortune's baseFontSize ratio (1.1)
            size = lerp(size, 1.1, settleSt);
        }

        // Apply breathing motion (Ramps up during Reform, Full during Settle)
        // This ensures visual continuity with render3DDaji
        let breatheMix = 0;
        if (t >= DRAW_REFORM) {
            breatheMix = 1;
        } else if (t > DRAW_SCATTER) {
            const reformProgress = (t - DRAW_SCATTER) / (DRAW_REFORM - DRAW_SCATTER);
            // Ramp up in the second half of reform to blend with fading wobble
            breatheMix = Math.max(0, reformProgress - 0.5) * 2;
        }
        
        const breathing = Math.sin(globalTime * 1.5 + p.phase) * breatheAmp;
        const renderZ = p.z + breathing * breatheMix;

        glyphs.push({
            x: p.x,
            y: p.y,
            z: renderZ,
            char: p.char,
            fontIdx: p.fontIdx,
            r: Math.round(r),
            g: Math.round(g),
            b: Math.round(b),
            alpha,
            size,
            glow: 0.7,
            blur: 0.65,
        });
    }
    
    // Send to GPU instead of Canvas 2D
    updateProjectedGlyphsToGPU(glyphs);
}

function renderDrawOverlay() {
    const t = stateTime;
    renderDrawParticles3D(t);

    // Launch: draw 福 rising upward and shrinking
    if (t < DRAW_LAUNCH) {
        const riseT = Math.min(1, t / Math.max(0.001, DRAW_RISE));
        const shrinkT = Math.min(1, t / Math.max(0.001, DRAW_SHRINK));
        const riseEased = easeInOut(riseT);
        const shrinkEased = easeInOut(shrinkT);

        ctx.save();
        ctx.scale(dpr, dpr);

        const vmin = Math.min(window.innerWidth, window.innerHeight);
        const baseSize = vmin * 0.55;
        const fuSize = baseSize * lerp(1, DRAW_SHRINK_END_SCALE, shrinkEased);
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight * lerp(0.5, 0.2, riseEased);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `${fuSize}px ${chosenFont}, serif`;

        // Glow intensifies as it rises
        const intensity = 1 + riseT * 2.5;
        ctx.globalAlpha = Math.min(1, 0.3 * intensity);
        ctx.shadowColor = CONFIG.glowGold;
        ctx.shadowBlur = fuSize * 0.2 * intensity;
        ctx.fillStyle = CONFIG.glowGold;
        ctx.fillText('福', cx, cy);

        ctx.globalAlpha = 1;
        ctx.shadowBlur = fuSize * 0.08 * intensity;
        ctx.fillText('福', cx, cy);

        ctx.shadowBlur = 0;
        ctx.restore();
    }

    // Burst flash
    if (burstFlash > 0) {
        ctx.save();
        ctx.scale(dpr, dpr);
        const bx = window.innerWidth / 2;
        const by = window.innerHeight * 0.22;
        const radius = Math.min(window.innerWidth, window.innerHeight) * 0.4 * burstFlash;
        const gradient = ctx.createRadialGradient(bx, by, 0, bx, by, radius);
        gradient.addColorStop(0, `rgba(255, 255, 220, ${burstFlash * 0.8})`);
        gradient.addColorStop(0.4, `rgba(255, 215, 0, ${burstFlash * 0.4})`);
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
        ctx.restore();
    }
}

// ============================================================
// FORTUNE — 大吉 displayed
// ============================================================
function renderDaji(alpha) {
    const dajiGridSize = Math.min(cols, rows) * 0.40;
    const centerCol = cols / 2;
    const centerRow = rows / 2;
    for (const pt of dajiShape) {
        const col = Math.floor(centerCol + pt.nx * dajiGridSize * 0.5 * pt.aspect);
        const row = Math.floor(centerRow + pt.ny * dajiGridSize * 0.5);
        const lum = Math.min(1, pt.brightness + 0.08);
        const char = selectCharByLuminance(lum);
        if (char === ' ') continue;
        const color = lerpColor(lum);
        setCell(col, row, 0, char, color.r, color.g, color.b, Math.min(1, (0.3 + lum * 0.7) * alpha));
    }
}

function updateFortune() {
    updateBgParticles(globalTime);
    updateFireworkPhysics();

    // 更新文字跳字动画
    if (isTextAnimating) {
        const TOTAL_DURATION = 0.8; // 总动画时长
        const elapsed = globalTime - textAnimationStartTime;

        if (elapsed >= TOTAL_DURATION) {
            isTextAnimating = false;
            currentDisplayText = targetDisplayText;
        }
    }

    // Auto-cycle font when idle
    if (!dajiFontTransition && stateTime > 6 && globalTime - dajiFontAutoTimer > DAJI_AUTO_INTERVAL) {
        dajiFontAutoTimer = globalTime;
        cycleDajiFont(1);
    }
}

// --- Fancy 大吉 title morph transitions ---

// 获取当前要显示的文字
function getCurrentDisplayText() {
    if (isTextAnimating) {
        return targetDisplayText; // 动画中显示目标文字
    }
    return currentDisplayText;
}

// 格式化显示文字（在字符间加空格）
function formatDisplayText(text) {
    if (text.length === 2) {
        return text[0] + ' ' + text[1];
    } else if (text.length === 4) {
        return text[0] + ' ' + text[1] + ' ' + text[2] + ' ' + text[3];
    }
    return text;
}

function drawMorphSparkles(cx, cy, fontSize, t, alpha) {
    const count = 14;
    const spread = fontSize * 1.5;
    for (let i = 0; i < count; i++) {
        const seed = i * 137.508;
        const lifePhase = ((t * 2.5 + i / count) % 1);
        const sparkAlpha = Math.sin(lifePhase * Math.PI) * alpha * 0.6;
        if (sparkAlpha < 0.02) continue;
        const angle = seed + globalTime * (1.2 + (i % 3) * 0.4);
        const r = spread * (0.15 + lifePhase * 0.85);
        const sx = cx + Math.cos(angle) * r;
        const sy = cy + Math.sin(angle) * r * 0.3;
        const size = 1 + (1 - lifePhase) * 2.5;
        ctx.globalAlpha = sparkAlpha;
        ctx.fillStyle = CONFIG.glowGold;
        ctx.shadowColor = CONFIG.glowGold;
        ctx.shadowBlur = size * 5;
        ctx.beginPath();
        ctx.arc(sx, sy, size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function renderDajiTitleEntrance(stateT, font) {
    const fontSize = cellSize * 5;
    const entranceDur = 1.3;
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight * 0.15;
    const text = getCurrentDisplayText();
    const chars = [...text]; // 将文字转为字符数组

    if (stateT >= entranceDur) {
        const displayText = formatDisplayText(getCurrentDisplayText());
        drawOverlayText(displayText, 0.15, CONFIG.glowGold, 0.9, cellSize * 5, font);
        return;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.font = `${fontSize}px ${font}, serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const displayText = formatDisplayText(text);
    const totalW = ctx.measureText(displayText).width;

    // 计算每个字符的位置
    const positions = [];
    let accumulatedW = 0;
    const charWidths = chars.map(c => ctx.measureText(c).width);
    const spaceWidth = totalW - charWidths.reduce((sum, w) => sum + w, 0);
    const singleSpace = chars.length > 1 ? spaceWidth / (chars.length - 1) : 0;

    for (let i = 0; i < chars.length; i++) {
        const charX = cx - totalW / 2 + accumulatedW + charWidths[i] / 2;
        positions.push(charX);
        accumulatedW += charWidths[i] + singleSpace;
    }

    for (let i = 0; i < chars.length; i++) {
        const delay = i * 0.2;
        const dur = entranceDur - delay - 0.1;
        const charT = Math.max(0, Math.min(1, (stateT - delay) / dur));
        if (charT <= 0) continue;

        let scale;
        if (charT < 0.35) {
            scale = lerp(1.8, 0.93, easeInOut(charT / 0.35));
        } else if (charT < 0.6) {
            scale = lerp(0.93, 1.06, easeInOut((charT - 0.35) / 0.25));
        } else {
            scale = lerp(1.06, 1.0, easeInOut((charT - 0.6) / 0.4));
        }

        const alpha = Math.min(0.9, charT * 3);
        const glowMult = 1 + Math.max(0, 1 - charT * 1.5) * 2.5;
        const dropY = Math.max(0, 1 - charT * 2.5) * fontSize * 0.1;

        ctx.save();
        ctx.translate(positions[i], cy + dropY);
        ctx.scale(scale, scale);

        ctx.globalAlpha = alpha * 0.35 * glowMult;
        ctx.fillStyle = CONFIG.glowGold;
        ctx.shadowColor = CONFIG.glowGold;
        ctx.shadowBlur = fontSize * 0.25 * glowMult;
        ctx.fillText(chars[i], 0, 0);

        ctx.globalAlpha = alpha;
        ctx.shadowBlur = fontSize * 0.12;
        ctx.fillText(chars[i], 0, 0);

        ctx.restore();
    }

    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    ctx.restore();
}

// 渲染文字跳入动画
function renderDajiJumpAnimation(font, baseAlpha) {
    const fontSize = cellSize * 5;
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight * 0.15;
    const text = targetDisplayText;
    const chars = [...text];

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.font = `${fontSize}px ${font}, serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const displayText = formatDisplayText(text);
    const totalW = ctx.measureText(displayText).width;

    // 计算每个字符的位置
    const positions = [];
    let accumulatedW = 0;
    const charWidths = chars.map(c => ctx.measureText(c).width);
    const spaceWidth = totalW - charWidths.reduce((sum, w) => sum + w, 0);
    const singleSpace = chars.length > 1 ? spaceWidth / (chars.length - 1) : 0;

    for (let i = 0; i < chars.length; i++) {
        const charX = cx - totalW / 2 + accumulatedW + charWidths[i] / 2;
        positions.push(charX);
        accumulatedW += charWidths[i] + singleSpace;
    }

    const elapsed = globalTime - textAnimationStartTime;
    const CHAR_DELAY = 0.15; // 每个字之间的延迟
    const CHAR_DURATION = 0.4; // 每个字的动画时长

    for (let i = 0; i < chars.length; i++) {
        const charStartTime = i * CHAR_DELAY;
        const charElapsed = elapsed - charStartTime;

        if (charElapsed < 0) continue; // 还没开始

        const charT = Math.min(1, charElapsed / CHAR_DURATION);

        // 弹跳动画：先快速上升，然后下落并弹跳
        let offsetY, scale, alpha;
        if (charT < 0.4) {
            // 上升阶段
            const t = charT / 0.4;
            offsetY = -fontSize * 0.6 * easeInOut(t);
            scale = lerp(0.3, 1.1, easeInOut(t));
            alpha = baseAlpha * t;
        } else if (charT < 0.7) {
            // 下落阶段
            const t = (charT - 0.4) / 0.3;
            offsetY = lerp(-fontSize * 0.6, fontSize * 0.05, t * t);
            scale = lerp(1.1, 0.95, t);
            alpha = baseAlpha;
        } else {
            // 回弹阶段
            const t = (charT - 0.7) / 0.3;
            offsetY = lerp(fontSize * 0.05, 0, easeInOut(t));
            scale = lerp(0.95, 1.0, easeInOut(t));
            alpha = baseAlpha;
        }

        const glowMult = 1 + Math.max(0, 1 - charT * 2) * 1.5;

        ctx.save();
        ctx.translate(positions[i], cy + offsetY);
        ctx.scale(scale, scale);

        // 发光效果
        ctx.globalAlpha = alpha * 0.4 * glowMult;
        ctx.fillStyle = CONFIG.glowGold;
        ctx.shadowColor = CONFIG.glowGold;
        ctx.shadowBlur = fontSize * 0.2 * glowMult;
        ctx.fillText(chars[i], 0, 0);

        // 主文字
        ctx.globalAlpha = alpha;
        ctx.shadowBlur = fontSize * 0.12;
        ctx.fillText(chars[i], 0, 0);

        ctx.restore();
    }

    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    ctx.restore();
}

function renderDajiMorph(t, fadeIn, oldFont, newFont) {
    ctx.save();
    ctx.scale(dpr, dpr);

    const fontSize = cellSize * 5;
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight * 0.15;
    const baseAlpha = fadeIn * 0.9;
    const text = getCurrentDisplayText();
    const chars = [...text]; // 将文字转为字符数组

    ctx.font = `${fontSize}px ${oldFont}, serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const displayText = formatDisplayText(text);
    const oldTotalW = ctx.measureText(displayText).width;

    // 计算旧字体每个字符的位置
    const oldPos = [];
    let accW = 0;
    const oldWidths = chars.map(c => ctx.measureText(c).width);
    const oldSpaceW = oldTotalW - oldWidths.reduce((sum, w) => sum + w, 0);
    const oldSpace = chars.length > 1 ? oldSpaceW / (chars.length - 1) : 0;
    for (let i = 0; i < chars.length; i++) {
        oldPos.push(cx - oldTotalW / 2 + accW + oldWidths[i] / 2);
        accW += oldWidths[i] + oldSpace;
    }

    ctx.font = `${fontSize}px ${newFont}, serif`;
    const newTotalW = ctx.measureText(displayText).width;

    // 计算新字体每个字符的位置
    const newPos = [];
    accW = 0;
    const newWidths = chars.map(c => ctx.measureText(c).width);
    const newSpaceW = newTotalW - newWidths.reduce((sum, w) => sum + w, 0);
    const newSpace = chars.length > 1 ? newSpaceW / (chars.length - 1) : 0;
    for (let i = 0; i < chars.length; i++) {
        newPos.push(cx - newTotalW / 2 + accW + newWidths[i] / 2);
        accW += newWidths[i] + newSpace;
    }

    const DISSOLVE_END = 0.3;
    const SCRAMBLE_START = 0.1;
    const SCRAMBLE_END = 0.7;
    const FORM_START = 0.45;

    const sparkleEnv = t < 0.15 ? t / 0.15 : (t > 0.85 ? (1 - t) / 0.15 : 1);
    drawMorphSparkles(cx, cy, fontSize, t, baseAlpha * sparkleEnv);

    if (t < DISSOLVE_END) {
        const dt = t / DISSOLVE_END;
        ctx.font = `${fontSize}px ${oldFont}, serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let i = 0; i < chars.length; i++) {
            const stagger = i * 0.2;
            const charT = Math.max(0, Math.min(1, (dt - stagger) / (1 - stagger)));
            const shakeX = Math.sin(globalTime * 35 + i * 2.7) * charT * fontSize * 0.05;
            const shakeY = Math.cos(globalTime * 28 + i * 1.9) * charT * fontSize * 0.035;
            const driftY = -charT * charT * fontSize * 0.1;
            const alpha = baseAlpha * (1 - charT * charT);
            const aber = charT * fontSize * 0.025;
            const px = oldPos[i] + shakeX;
            const py = cy + shakeY + driftY;

            if (aber > 0.5) {
                ctx.globalAlpha = alpha * 0.3;
                ctx.fillStyle = '#FF4444';
                ctx.shadowColor = '#FF4444';
                ctx.shadowBlur = fontSize * 0.12;
                ctx.fillText(chars[i], px - aber, py);
                ctx.fillStyle = '#FFEE44';
                ctx.shadowColor = '#FFEE44';
                ctx.fillText(chars[i], px + aber, py + aber * 0.3);
            }

            ctx.globalAlpha = alpha;
            ctx.fillStyle = CONFIG.glowGold;
            ctx.shadowColor = CONFIG.glowGold;
            ctx.shadowBlur = fontSize * (0.15 + charT * 0.25);
            ctx.fillText(chars[i], px, py);
        }
    }

    if (t >= SCRAMBLE_START && t < SCRAMBLE_END) {
        const st = (t - SCRAMBLE_START) / (SCRAMBLE_END - SCRAMBLE_START);
        const speed = lerp(18, 3, st * st);
        const scrambleIdx = Math.floor(globalTime * speed);
        const posBlend = easeInOut(st);
        const envelope = st < 0.15 ? st / 0.15 : (st > 0.7 ? (1 - st) / 0.3 : 1);

        ctx.font = `${fontSize}px ${st < 0.5 ? oldFont : newFont}, serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let i = 0; i < chars.length; i++) {
            const scramChar = ALL_LUCKY[(scrambleIdx + i * 13) % ALL_LUCKY.length];
            const waveY = Math.sin(globalTime * 5 + i * 2.0) * fontSize * 0.035;
            const waveX = Math.cos(globalTime * 3.5 + i * 2.5) * fontSize * 0.02;
            const px = lerp(oldPos[i], newPos[i], posBlend) + waveX;
            const py = cy + waveY;
            const pulse = 1 + Math.sin(globalTime * 8 + i) * 0.05;

            ctx.save();
            ctx.translate(px, py);
            ctx.scale(pulse, pulse);
            ctx.globalAlpha = baseAlpha * envelope * 0.7;
            ctx.fillStyle = CONFIG.glowGold;
            ctx.shadowColor = CONFIG.glowGold;
            ctx.shadowBlur = fontSize * 0.2;
            ctx.fillText(scramChar, 0, 0);
            ctx.restore();
        }
    }

    if (t >= FORM_START) {
        const ft = (t - FORM_START) / (1 - FORM_START);
        ctx.font = `${fontSize}px ${newFont}, serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let i = 0; i < chars.length; i++) {
            const stagger = i * 0.15;
            const charT = Math.max(0, Math.min(1, (ft - stagger) / (1 - stagger)));
            const easedT = easeInOut(charT);

            let scale;
            if (charT < 0.45) {
                scale = easedT / 0.45 * 1.1;
            } else if (charT < 0.7) {
                scale = lerp(1.1, 0.97, easeInOut((charT - 0.45) / 0.25));
            } else {
                scale = lerp(0.97, 1.0, easeInOut((charT - 0.7) / 0.3));
            }

            const riseY = (1 - easedT) * fontSize * 0.12;
            const glowPulse = 1 + Math.sin(charT * Math.PI) * 0.5;

            ctx.save();
            ctx.translate(newPos[i], cy + riseY);
            ctx.scale(scale, scale);

            ctx.globalAlpha = baseAlpha * easedT * 0.35 * glowPulse;
            ctx.fillStyle = CONFIG.glowGold;
            ctx.shadowColor = CONFIG.glowGold;
            ctx.shadowBlur = fontSize * 0.3 * glowPulse;
            ctx.fillText(chars[i], 0, 0);

            ctx.globalAlpha = baseAlpha * easedT;
            ctx.shadowBlur = fontSize * 0.12;
            ctx.fillText(chars[i], 0, 0);

            ctx.restore();
        }
    }

    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    ctx.restore();
}

function renderFortuneOverlay() {
    // Combined GPU render: 大吉 cluster + fireworks in one pass
    const dajiCount = updateDajiToGPU(true);

    if (fwShells.length || fwTrail.length || fwParticles.length) {
        appendFireworksToGPU(dajiCount);
    } else {
        renderAndCompositeGL();
    }

    const fadeIn = Math.min(1, stateTime / 0.9);

    // 优先显示跳字动画
    if (isTextAnimating) {
        renderDajiJumpAnimation(getDajiFont(), fadeIn * 0.9);
    } else if (dajiFontTransition) {
        const transDur = 1.2;
        const tt = (globalTime - dajiFontTransition.startTime) / transDur;
        if (tt >= 1) {
            dajiFontTransition = null;
            const displayText = formatDisplayText(getCurrentDisplayText());
            drawOverlayText(displayText, 0.15, CONFIG.glowGold, fadeIn * 0.9, cellSize * 5, getDajiFont());
        } else {
            renderDajiMorph(tt, fadeIn, dajiFontTransition.oldFont, getDajiFont());
        }
    } else if (stateTime < 1.5) {
        renderDajiTitleEntrance(stateTime, getDajiFont());
    } else {
        const displayText = formatDisplayText(getCurrentDisplayText());
        drawOverlayText(displayText, 0.15, CONFIG.glowGold, fadeIn * 0.9, cellSize * 5, getDajiFont());
    }

    const blessFade = Math.min(1, Math.max(0, (stateTime - 0.5) / 0.9));
    drawOverlayText('万事如意 · 心想事成', 0.82, CONFIG.glowRed, blessFade * 0.7, cellSize * 1.5);
    drawOverlayText('May all your wishes come true', 0.87, CONFIG.glowGold, blessFade * 0.5, cellSize * 1);
}

// ============================================================
// FIREWORKS — Lucky character bursts across the screen
// ============================================================

const BLESSING_CATEGORIES = [
    { chars: '福禄寿喜财', r: 255, g: 45, b: 45 },         // 五福 — red
    { chars: '财富贵发金玉宝余丰盛利旺', r: 255, g: 215, b: 0 }, // Wealth — gold
    { chars: '安康宁泰和平顺健', r: 0, g: 255, b: 159 },    // Peace — jade
    { chars: '喜乐欢庆禧祺嘉春', r: 255, g: 120, b: 80 },   // Joy — warm
    { chars: '德善仁义忠信孝慧恩', r: 255, g: 200, b: 50 },  // Virtue — amber
    { chars: '爱合圆满美馨雅', r: 255, g: 130, b: 180 },     // Love — pink
    { chars: '吉祥瑞如意祝运', r: 180, g: 255, b: 80 },      // Auspicious — lime
    { chars: '龙凤麟鹤华', r: 255, g: 180, b: 50 },          // Mythical — orange
    { chars: '成升登高', r: 80, g: 220, b: 255 },             // Achievement — cyan
];

const fwShells = [];
const fwTrail = [];
const fwParticles = [];
let fwLaunchTimer = 0;
let fwLaunchCount = 0;

function launchShell() {
    const cat = BLESSING_CATEGORIES[Math.floor(Math.random() * BLESSING_CATEGORIES.length)];
    const launchCol = cols * (0.15 + Math.random() * 0.7);
    const targetCol = launchCol + (Math.random() - 0.5) * cols * 0.12;
    const start = gridToWorld(launchCol, rows + 2);
    const target = gridToWorld(targetCol, rows * (0.1 + Math.random() * 0.3));
    const startZ = (Math.random() - 0.5) * cellSize * 8;
    fwShells.push({
        x: start.x,
        y: start.y,
        z: startZ,
        startX: start.x,
        startY: start.y,
        startZ,
        targetX: target.x,
        targetY: target.y,
        targetZ: (Math.random() - 0.5) * cellSize * 12,
        launchTime: globalTime,
        duration: CONFIG.shellRiseDuration * (0.85 + Math.random() * 0.3),
        cat,
    });
    fwLaunchCount++;
}

function burstShell(shell) {
    const count = 25 + Math.floor(Math.random() * 35);
    const { chars, r, g, b } = shell.cat;
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
        const speed = cellSize * (0.06 + Math.random() * 0.10);
        fwParticles.push({
            x: shell.x, y: shell.y, z: shell.z,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - cellSize * 0.06,
            vz: (Math.random() - 0.5) * speed * 0.5,
            char: chars[Math.floor(Math.random() * chars.length)],
            r, g, b,
            life: 0.6 + Math.random() * 0.3,
            decay: 0.008 + Math.random() * 0.008,
            gravity: cellSize * (0.001 + Math.random() * 0.001),
            drag: 0.985,
            trailSegs: [],
            lastTrailTime: globalTime,
        });
    }
}

// 在指定位置直接爆炸烟花（用于点击触发）
function burstFireworkAtPosition(clientX, clientY) {
    const cat = BLESSING_CATEGORIES[Math.floor(Math.random() * BLESSING_CATEGORIES.length)];

    // 使用与 project3D 相反的逻辑来计算世界坐标
    // project3D: screenX = x * scale + window.innerWidth / 2
    //            screenY = y * scale + window.innerHeight / 2
    // 反推: x = (screenX - window.innerWidth / 2) / scale
    //       y = (screenY - window.innerHeight / 2) / scale
    // 其中 scale = SCENE_FOV / (SCENE_FOV + z)

    // 假设 z = 0 (在相机焦平面上)
    const z = 0;
    const scale = SCENE_FOV / (SCENE_FOV + z);

    const worldX = (clientX - window.innerWidth / 2) / scale;
    const worldY = (clientY - window.innerHeight / 2) / scale;
    const worldZ = (Math.random() - 0.5) * cellSize * 8;

    const count = 30 + Math.floor(Math.random() * 40);
    const { chars, r, g, b } = cat;

    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
        const speed = cellSize * (0.08 + Math.random() * 0.12);
        fwParticles.push({
            x: worldX,
            y: worldY,
            z: worldZ,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - cellSize * 0.04,
            vz: (Math.random() - 0.5) * speed * 0.6,
            char: chars[Math.floor(Math.random() * chars.length)],
            r, g, b,
            life: 0.7 + Math.random() * 0.4,
            decay: 0.009 + Math.random() * 0.009,
            gravity: cellSize * (0.0012 + Math.random() * 0.0012),
            drag: 0.985,
            trailSegs: [],
            lastTrailTime: globalTime,
        });
    }
}

function initFireworks() {
    fwShells.length = 0;
    fwTrail.length = 0;
    fwParticles.length = 0;
    fwLaunchTimer = 0;
    fwLaunchCount = 0;

    // Launch an initial volley — fresh shells that rise from the bottom
    for (let i = 0; i < 2; i++) {
        launchShell();
    }
}

function updateFireworkPhysics() {
    // Auto-launch on a timer (frames)
    fwLaunchTimer--;
    if (fwLaunchTimer <= 0) {
        launchShell();
        fwLaunchTimer = fwLaunchCount < 3
            ? 40 + Math.random() * 30
            : 70 + Math.random() * 80;
    }

    const halfW = cols * cellSize * 0.5;
    const halfH = rows * cellSize * 0.5;

    // Shells — rise and burst (compact-in-place)
    let sw = 0;
    for (let i = 0; i < fwShells.length; i++) {
        const s = fwShells[i];
        const t = (globalTime - s.launchTime) / s.duration;
        const eased = 1 - Math.pow(1 - Math.min(t, 1), 2);
        s.x = lerp(s.startX, s.targetX, eased);
        s.y = lerp(s.startY, s.targetY, eased);
        s.z = lerp(s.startZ, s.targetZ, eased);

        const trailSpawn = Math.max(1, Math.floor((1 - eased) * 2.8));
        for (let j = 0; j < trailSpawn; j++) {
            fwTrail.push({
                x: s.x + (Math.random() - 0.5) * cellSize * 0.35,
                y: s.y + cellSize * (0.12 + Math.random() * 0.32),
                z: s.z + (Math.random() - 0.5) * cellSize * 0.6,
                vx: (Math.random() - 0.5) * cellSize * 0.03,
                vy: cellSize * (0.07 + Math.random() * 0.04),
                vz: (Math.random() - 0.5) * cellSize * 0.03,
                char: '·',
                r: s.cat.r, g: s.cat.g, b: s.cat.b,
                life: 0.35 + Math.random() * 0.45,
                decay: 0.03 + Math.random() * 0.04,
            });
        }
        if (t >= 1) {
            burstShell(s);
        } else {
            fwShells[sw++] = s;
        }
    }
    fwShells.length = sw;

    // Shell trails — drift and fade (compact-in-place)
    let trw = 0;
    for (let i = 0; i < fwTrail.length; i++) {
        const t = fwTrail[i];
        t.x += t.vx;
        t.y += t.vy;
        t.z += t.vz;
        t.vx *= 0.95;
        t.vz *= 0.95;
        t.life -= t.decay;
        if (t.life > 0 && t.y <= halfH + cellSize * 3) fwTrail[trw++] = t;
    }
    fwTrail.length = trw;

    // Particles — drift, fade, fall (compact-in-place)
    // Trail spawns position-only snapshots; alpha computed at render time from parent life
    const FW_TRAIL_INTERVAL = 0.06; // seconds between trail spawns
    const FW_MAX_TRAIL_SEGS = 14;
    let pw = 0;
    for (let i = 0; i < fwParticles.length; i++) {
        const p = fwParticles[i];
        p.vx *= p.drag;
        p.vy *= p.drag;
        p.vz *= p.drag;
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;
        p.life -= p.decay;

        // Spawn trailing tail segments (position snapshots only, like fireworks.html)
        if (globalTime - p.lastTrailTime >= FW_TRAIL_INTERVAL && p.life > 0.05) {
            p.trailSegs.push({ x: p.x, y: p.y, z: p.z });
            p.lastTrailTime = globalTime;
            if (p.trailSegs.length > FW_MAX_TRAIL_SEGS) p.trailSegs.shift();
        }

        if (
            p.life > 0
            && p.y <= halfH + cellSize * 6
            && p.x >= -halfW - cellSize * 8
            && p.x <= halfW + cellSize * 8
            && p.z >= -SCENE_FOV * 0.9
            && p.z <= SCENE_FOV * 1.5
        ) {
            fwParticles[pw++] = p;
        }
    }
    fwParticles.length = pw;
}

function updateFireworks() {
    updateBgParticles(globalTime);
    renderDaji(0.15 + Math.sin(globalTime * 0.8) * 0.05);
    updateFireworkPhysics();
}

function renderFireworks3D() {
    const glyphs = [];

    for (const s of fwShells) {
        glyphs.push({
            x: s.x,
            y: s.y,
            z: s.z,
            char: '·',
            r: s.cat.r,
            g: s.cat.g,
            b: s.cat.b,
            alpha: 0.9,
            size: 1.0,
            glow: 1.0,
            blur: 0.9,
        });
    }

    for (const t of fwTrail) {
        glyphs.push({
            x: t.x,
            y: t.y,
            z: t.z,
            char: t.char,
            r: t.r,
            g: t.g,
            b: t.b,
            alpha: t.life * 0.7,
            size: 0.7 + t.life * 0.3,
            glow: 0.9,
            blur: 0.85,
        });
    }

    for (const p of fwParticles) {
        const alpha = Math.max(0.05, p.life * p.life);
        glyphs.push({
            x: p.x,
            y: p.y,
            z: p.z,
            char: p.char,
            r: p.r,
            g: p.g,
            b: p.b,
            alpha,
            size: 0.92 + alpha * 0.5,
            glow: 0.65,
            blur: 0.62,
        });

        // Trailing tail segments — same char as parent, oldest=dimmest
        const segCount = p.trailSegs.length;
        for (let ti = 0; ti < segCount; ti++) {
            const seg = p.trailSegs[ti];
            const ageFrac = segCount > 1 ? ti / (segCount - 1) : 1;
            const segAlpha = alpha * (0.2 + ageFrac * 0.6);
            glyphs.push({
                x: seg.x,
                y: seg.y,
                z: seg.z,
                char: p.char,
                r: p.r,
                g: p.g,
                b: p.b,
                alpha: segAlpha,
                size: 0.6 + ageFrac * 0.35,
                glow: 0.5,
                blur: 0.5,
            });
        }
    }

    // Send to GPU instead of Canvas 2D
    updateProjectedGlyphsToGPU(glyphs);
}

// Append firework particles to the GPU buffer starting at startIdx (after daji particles)
function appendFireworksToGPU(startIdx) {
    if (!particlesMesh) return;

    const instColor = particlesMesh.geometry.attributes.instanceColor;
    const instAlpha = particlesMesh.geometry.attributes.instanceAlpha;
    const instUV = particlesMesh.geometry.attributes.instanceUV;
    const instScale = particlesMesh.geometry.attributes.instanceScale;
    const maxCount = instColor.count;

    let idx = startIdx;

    for (const s of fwShells) {
        if (idx >= maxCount) break;
        _dummy.position.set(s.x, -s.y, -s.z);
        _dummy.updateMatrix();
        particlesMesh.setMatrixAt(idx, _dummy.matrix);
        instColor.setXYZ(idx, s.cat.r / 255, s.cat.g / 255, s.cat.b / 255);
        instAlpha.setX(idx, 0.9);
        const uv = charToUV['·'];
        if (uv) instUV.setXY(idx, uv.u, uv.v);
        instScale.setX(idx, cellSize);
        idx++;
    }

    for (const t of fwTrail) {
        if (idx >= maxCount) break;
        _dummy.position.set(t.x, -t.y, -t.z);
        _dummy.updateMatrix();
        particlesMesh.setMatrixAt(idx, _dummy.matrix);
        instColor.setXYZ(idx, t.r / 255, t.g / 255, t.b / 255);
        instAlpha.setX(idx, t.life * 0.7);
        const uv = charToUV[t.char];
        if (uv) instUV.setXY(idx, uv.u, uv.v);
        instScale.setX(idx, cellSize * (0.7 + t.life * 0.3));
        idx++;
    }

    for (const p of fwParticles) {
        if (idx >= maxCount) break;
        const alpha = Math.max(0.05, p.life * p.life);
        _dummy.position.set(p.x, -p.y, -p.z);
        _dummy.updateMatrix();
        particlesMesh.setMatrixAt(idx, _dummy.matrix);
        instColor.setXYZ(idx, p.r / 255, p.g / 255, p.b / 255);
        instAlpha.setX(idx, alpha);
        const uv = charToUV[p.char];
        if (uv) instUV.setXY(idx, uv.u, uv.v);
        instScale.setX(idx, cellSize * (0.92 + alpha * 0.5));
        idx++;

        // Render trailing tail segments — same char as parent, oldest=dimmest
        const segCount = p.trailSegs.length;
        for (let ti = 0; ti < segCount; ti++) {
            if (idx >= maxCount) break;
            const seg = p.trailSegs[ti];
            const ageFrac = segCount > 1 ? ti / (segCount - 1) : 1;
            const segAlpha = alpha * (0.2 + ageFrac * 0.6);
            const segScale = cellSize * (0.6 + ageFrac * 0.35);
            _dummy.position.set(seg.x, -seg.y, -seg.z);
            _dummy.updateMatrix();
            particlesMesh.setMatrixAt(idx, _dummy.matrix);
            instColor.setXYZ(idx, p.r / 255, p.g / 255, p.b / 255);
            instAlpha.setX(idx, segAlpha);
            if (uv) instUV.setXY(idx, uv.u, uv.v);
            instScale.setX(idx, segScale);
            idx++;
        }
    }

    particlesMesh.count = idx;
    particlesMesh.instanceMatrix.needsUpdate = true;
    instColor.needsUpdate = true;
    instAlpha.needsUpdate = true;
    instUV.needsUpdate = true;
    instScale.needsUpdate = true;

    renderAndCompositeGL();
}

function renderFireworksOverlay() {
    renderFireworks3D();

    const fadeIn = Math.min(1, stateTime / 1.5);
    drawOverlayText('恭喜发财', 0.08, CONFIG.glowGold, fadeIn * 0.7, cellSize * 2);
    drawOverlayText('Prosperity & Fortune', 0.13, CONFIG.glowGold, fadeIn * 0.4, cellSize * 1);

    if (stateTime > 3) {
        const hintFade = Math.min(1, (stateTime - 3) / 0.5);
        const pulse = 0.3 + Math.sin(globalTime * 3) * 0.2;
        drawOverlayText('↑  继续  ↑', 0.94, CONFIG.glowGold, hintFade * pulse, cellSize * 1);
    }
}

// ============================================================
// SWIPE / TAP / HOVER
// ============================================================
let touchStartX = 0, touchStartY = 0, touchStartTime = 0;
let touchMoved = false;

canvas.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
    touchStartTime = performance.now();
    touchMoved = false;
    if (state === 'fortune') updateHover(t.clientX, t.clientY);
}, { passive: true });

canvas.addEventListener('touchmove', (e) => {
    const t = e.touches[0];
    if (Math.abs(t.clientX - touchStartX) > 10 || Math.abs(t.clientY - touchStartY) > 10) {
        touchMoved = true;
    }
    if (state === 'fortune') updateHover(t.clientX, t.clientY);
}, { passive: true });

canvas.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = touchStartY - e.changedTouches[0].clientY;
    const dt = performance.now() - touchStartTime;

    hoveredIdx = -1;
    hideTooltip();

    if (state === 'fortune' && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) && dt < 500) {
        cycleDajiFont(dx > 0 ? 1 : -1);
    } else if (dy > 50 && dt < 500) {
        handleSwipeUp();
    } else if (Math.abs(dx) < 15 && Math.abs(dy) < 15 && dt < 300) {
        // 点击事件（没有滑动）- 在点击位置放烟花
        burstFireworkAtPosition(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    }
}, { passive: true });

// Desktop hover
canvas.addEventListener('mousemove', (e) => {
    if (state === 'fortune') updateHover(e.clientX, e.clientY);
});
canvas.addEventListener('mouseleave', () => {
    hoveredIdx = -1;
    hideTooltip();
});

// Desktop mouse drag (swipe up)
let mouseStartY = 0, mouseDown = false;
canvas.addEventListener('mousedown', (e) => {
    mouseStartY = e.clientY;
    mouseDown = true;
});
canvas.addEventListener('mouseup', (e) => {
    if (mouseDown) {
        const dy = mouseStartY - e.clientY;

        if (dy > 50) {
            handleSwipeUp();
        } else if (Math.abs(dy) < 10) {
            // 点击事件（没有拖拽）- 在点击位置放烟花
            burstFireworkAtPosition(e.clientX, e.clientY);
        }
    }
    mouseDown = false;
});

// Desktop scroll wheel (swipe up)
canvas.addEventListener('wheel', (e) => {
    if (e.deltaY < -30) handleSwipeUp();
}, { passive: true });

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleSwipeUp();
    }
    if (state === 'fortune') {
        if (e.code === 'ArrowLeft') { e.preventDefault(); cycleDajiFont(-1); }
        if (e.code === 'ArrowRight') { e.preventDefault(); cycleDajiFont(1); }
    }
});

function handleSwipeUp() {
    if (state === 'arrival' && fontsReady) {
        changeState('draw');
    }
}

// ============================================================
// MAIN LOOP
// ============================================================
const startTime = performance.now();

function frame(now) {
    globalTime = (now - startTime) / 1000;
    stateTime = globalTime - stateStartGlobal;

    clearGrid();

    switch (state) {
        case 'arrival':  updateArrival(); break;
        case 'draw':     updateDraw(); break;
        case 'fortune':  updateFortune(); break;
        case 'fireworks': updateFireworks(); break;
    }

    // Camera follow during draw launch
    let camShift = 0;
    if (state === 'draw') {
        if (stateTime < DRAW_LAUNCH) {
            if (stateTime < DRAW_CAMERA_PULLBACK) {
                const pullbackT = Math.min(1, stateTime / Math.max(0.001, DRAW_CAMERA_PULLBACK));
                camShift = -easeInOut(pullbackT) * cellSize * 3;
            } else {
                camShift = -cellSize * 3;
            }
        } else {
            const returnT = Math.min(1, (stateTime - DRAW_LAUNCH) / Math.max(0.001, DRAW_CAMERA_RETURN));
            camShift = -(1 - easeInOut(returnT)) * cellSize * 3;
        }
        offsetY += camShift;
    }

    renderGrid();

    if (camShift !== 0) offsetY -= camShift;

    // Reset particle count — overlays will set it if they have particles
    if (particlesMesh) particlesMesh.count = 0;

    // State overlays update GPU data and composite Three.js at the right point
    switch (state) {
        case 'arrival':  renderArrivalOverlay(); break;
        case 'draw':     renderDrawOverlay(); break;
        case 'fortune':  renderFortuneOverlay(); break;
        case 'fireworks': renderFireworksOverlay(); break;
    }

    requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
