// ============================================================
// 灵光法阵 Gacha — Magic Circle Fortune Pull
// State machine: IDLE → PULLING → BURST → REVEAL → CARD_DISPLAY
// ============================================================

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

// --- Configuration ---
const CONFIG = {
    bg: '#CC0000',
    glowRed: '#FF2D2D',
    glowGold: '#FFD700',
    glowGreen: '#00FF9F',
    pullThreshold: 150,
    burstDuration: 1.2,
    revealDuration: 2.0,
};

// --- Data (from fu.js) ---
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
    '玉': { phrase: '金玉良缘', english: 'A golden and jade match' },
    '宝': { phrase: '招财进宝', english: 'Inviting wealth and treasures' },
    '余': { phrase: '年年有余', english: 'Abundance year after year' },
    '丰': { phrase: '五谷丰登', english: 'A bountiful harvest' },
    '盛': { phrase: '繁荣昌盛', english: 'Flourishing and prosperous' },
    '隆': { phrase: '生意兴隆', english: 'Business booming and thriving' },
    '昌': { phrase: '繁荣昌盛', english: 'Prosperity and flourishing' },
    '进': { phrase: '招财进宝', english: 'Welcoming wealth and treasure' },
    '康': { phrase: '健康长寿', english: 'Health and longevity' },
    '宁': { phrase: '宁静致远', english: 'Serenity leads to greatness' },
    '泰': { phrase: '国泰民安', english: 'A prosperous and peaceful nation' },
    '顺': { phrase: '万事顺利', english: 'Everything goes smoothly' },
    '健': { phrase: '身体健康', english: 'Good health and vitality' },
    '乐': { phrase: '快乐无忧', english: 'Joy and freedom from worry' },
    '欢': { phrase: '合家欢乐', english: 'Family happiness and joy' },
    '庆': { phrase: '普天同庆', english: 'All the world celebrates together' },
    '禧': { phrase: '恭贺新禧', english: 'Happy New Year greetings' },
    '祺': { phrase: '吉祥安祺', english: 'Auspicious blessings of peace' },
    '嘉': { phrase: '嘉年华庆', english: 'A grand festive celebration' },
    '德': { phrase: '厚德载物', english: 'Great virtue carries all things' },
    '善': { phrase: '善气迎人', english: 'Kindness welcomes all' },
    '仁': { phrase: '仁者无敌', english: 'The benevolent are invincible' },
    '义': { phrase: '义薄云天', english: 'Righteousness reaching the sky' },
    '忠': { phrase: '忠义千秋', english: 'Loyalty and honor through the ages' },
    '信': { phrase: '信誉天下', english: 'Trust and honor across the land' },
    '孝': { phrase: '百善孝为先', english: 'Filial piety is the root of virtue' },
    '慧': { phrase: '聪慧过人', english: 'Wisdom beyond measure' },
    '恩': { phrase: '恩重如山', english: 'Gratitude deep as the mountains' },
    '爱': { phrase: '爱满人间', english: 'Love fills the world' },
    '合': { phrase: '百年好合', english: 'A lifetime of harmony' },
    '圆': { phrase: '花好月圆', english: 'Blooming flowers and full moon' },
    '满': { phrase: '满堂红光', english: 'Red radiance fills the hall' },
    '美': { phrase: '美满幸福', english: 'Bliss and happiness' },
    '馨': { phrase: '温馨如意', english: 'Warm and fulfilling' },
    '雅': { phrase: '典雅脱俗', english: 'Elegance beyond the ordinary' },
    '祥': { phrase: '吉祥如意', english: 'Auspicious and as you wish' },
    '瑞': { phrase: '瑞气盈门', english: 'Auspicious energy at your door' },
    '如': { phrase: '万事如意', english: 'May everything go as you wish' },
    '意': { phrase: '称心如意', english: 'Everything to your heart\'s desire' },
    '祝': { phrase: '祝福满满', english: 'Overflowing with blessings' },
    '运': { phrase: '鸿运当头', english: 'Great fortune is upon you' },
    '麟': { phrase: '凤毛麟角', english: 'Rare and precious as a phoenix feather' },
    '鹤': { phrase: '松鹤延年', english: 'Pine and crane for longevity' },
    '华': { phrase: '华夏瑞年', english: 'An auspicious year for China' },
    '成': { phrase: '马到成功', english: 'Success upon arrival' },
    '升': { phrase: '步步高升', english: 'Rising higher with every step' },
    '登': { phrase: '登峰造极', english: 'Reaching the very peak' },
    '高': { phrase: '高朋满座', english: 'Distinguished guests fill every seat' },
};

const CALLI_FONTS = [
    '"Zhi Mang Xing"',
    '"Liu Jian Mao Cao"',
    '"Ma Shan Zheng"',
    '"TsangerZhoukeZhengdabangshu"',
    '"hongleixingshu"',
    '"qiantubifengshouxieti"',
    '"峄山碑篆体"',
];

const BLESSING_CATEGORIES = [
    { name: '五福', nameEn: 'Five Blessings', chars: '福禄寿喜财', r: 255, g: 45, b: 45 },
    { name: '财富', nameEn: 'Wealth', chars: '财富贵发金玉宝余丰盛利旺', r: 255, g: 215, b: 0 },
    { name: '平安', nameEn: 'Peace', chars: '安康宁泰和平顺健', r: 0, g: 255, b: 159 },
    { name: '喜庆', nameEn: 'Joy', chars: '喜乐欢庆禧祺嘉春', r: 255, g: 120, b: 80 },
    { name: '德行', nameEn: 'Virtue', chars: '德善仁义忠信孝慧恩', r: 255, g: 200, b: 50 },
    { name: '爱情', nameEn: 'Love', chars: '爱合圆满美馨雅', r: 255, g: 130, b: 180 },
    { name: '吉祥', nameEn: 'Auspicious', chars: '吉祥瑞如意祝运', r: 180, g: 255, b: 80 },
    { name: '神话', nameEn: 'Mythical', chars: '龙凤麟鹤华', r: 255, g: 180, b: 50 },
    { name: '成就', nameEn: 'Achievement', chars: '成升登高', r: 80, g: 220, b: 255 },
];

// --- Rarity Tiers ---
const RARITY_TIERS = [
    {
        stars: 6, label: '天赐鸿福', labelEn: 'Heavenly Fortune',
        categories: [0],
        color: '#FFD700', glow: 'rgba(255,215,0,0.5)',
        burstRGB: [255, 215, 0],
    },
    {
        stars: 5, label: '吉星高照', labelEn: 'Auspicious Stars',
        categories: [7, 8],
        color: '#FFA500', glow: 'rgba(255,165,0,0.5)',
        burstRGB: [255, 180, 50],
    },
    {
        stars: 4, label: '福泽绵长', labelEn: 'Enduring Blessings',
        categories: [4, 5],
        color: '#FF69B4', glow: 'rgba(255,105,180,0.5)',
        burstRGB: [255, 130, 180],
    },
    {
        stars: 3, label: '万事如意', labelEn: 'All Wishes Fulfilled',
        categories: [2, 6],
        color: '#00FF9F', glow: 'rgba(0,255,159,0.5)',
        burstRGB: [0, 255, 159],
    },
    {
        stars: 2, label: '迎春纳福', labelEn: 'Welcoming Fortune',
        categories: [1, 3],
        color: '#FF6644', glow: 'rgba(255,102,68,0.5)',
        burstRGB: [255, 120, 80],
    },
];
const RARITY_WEIGHTS = [3, 7, 15, 25, 50];

// --- Math Utilities ---
function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
function easeInOut(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }
function easeOutBack(t) { const c = 1.7; return 1 + (--t) * t * ((c + 1) * t + c); }
function easeOutElastic(t) {
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1;
}
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

// --- Canvas Sizing ---
let dpr, W, H, vmin, circleR;

function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    vmin = Math.min(W, H);
    circleR = vmin * 0.22; // base radius of magic circle
}
resize();
window.addEventListener('resize', resize);

// --- Font ---
const chosenFont = CALLI_FONTS[Math.floor(Math.random() * CALLI_FONTS.length)];

// --- Rune chars for circle decoration ---
const RUNE_CHARS = '乾坤离坎震巽艮兑天地风雷水火山泽';

// --- Background Particles ---
const bgParticles = [];
function initBgParticles() {
    const count = Math.floor(W * H / 18000);
    for (let i = 0; i < count; i++) {
        bgParticles.push({
            x: Math.random() * W,
            y: Math.random() * H,
            char: ALL_LUCKY[Math.floor(Math.random() * ALL_LUCKY.length)],
            size: 10 + Math.random() * 14,
            alpha: 0.04 + Math.random() * 0.06,
            vy: -0.15 - Math.random() * 0.25,
            vx: (Math.random() - 0.5) * 0.1,
            phase: Math.random() * Math.PI * 2,
        });
    }
}
initBgParticles();

function updateBgParticles() {
    for (const p of bgParticles) {
        p.y += p.vy;
        p.x += p.vx + Math.sin(globalTime * 0.3 + p.phase) * 0.05;
        if (p.y < -20) {
            p.y = H + 20;
            p.x = Math.random() * W;
            p.char = ALL_LUCKY[Math.floor(Math.random() * ALL_LUCKY.length)];
        }
    }
}

function renderBgParticles() {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const p of bgParticles) {
        ctx.globalAlpha = p.alpha;
        ctx.font = `${p.size}px serif`;
        ctx.fillStyle = '#FFD700';
        ctx.fillText(p.char, p.x, p.y);
    }
    ctx.restore();
}

// --- Scanlines ---
function drawScanlines() {
    ctx.save();
    ctx.globalAlpha = 0.03;
    ctx.fillStyle = '#000';
    for (let y = 0; y < H; y += 4) {
        ctx.fillRect(0, y, W, 1);
    }
    ctx.restore();
}

// --- Burst Particles ---
const burstParticles = [];

function spawnBurstParticles(cx, cy, tier) {
    const count = 40 + tier.stars * 12;
    const [r, g, b] = tier.burstRGB;
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6;
        const speed = 4 + Math.random() * 10;
        burstParticles.push({
            x: cx, y: cy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 3,
            char: ALL_LUCKY[Math.floor(Math.random() * ALL_LUCKY.length)],
            r, g, b,
            life: 0.8 + Math.random() * 0.5,
            decay: 0.008 + Math.random() * 0.012,
            gravity: 0.06 + Math.random() * 0.04,
            drag: 0.985,
            size: 14 + Math.random() * 12,
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.12,
        });
    }
}

function updateBurstParticles() {
    let w = 0;
    for (let i = 0; i < burstParticles.length; i++) {
        const p = burstParticles[i];
        p.vx *= p.drag;
        p.vy *= p.drag;
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        p.rotation += p.rotSpeed;
        if (p.life > 0) burstParticles[w++] = p;
    }
    burstParticles.length = w;
}

function renderBurstParticles() {
    for (const p of burstParticles) {
        const alpha = p.life * p.life;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = alpha;
        ctx.font = `${p.size}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = `rgb(${p.r}, ${p.g}, ${p.b})`;
        ctx.shadowColor = `rgba(${p.r}, ${p.g}, ${p.b}, ${alpha * 0.6})`;
        ctx.shadowBlur = p.size * 0.6;
        ctx.fillText(p.char, 0, 0);
        ctx.restore();
    }
}

// --- Ambient Sparkles ---
const sparkles = [];
function spawnSparkle(cx, cy, radius, color) {
    const angle = Math.random() * Math.PI * 2;
    const dist = radius * (0.8 + Math.random() * 0.4);
    sparkles.push({
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist,
        life: 0.5 + Math.random() * 0.5,
        decay: 0.015 + Math.random() * 0.01,
        size: 1.5 + Math.random() * 2.5,
        color,
    });
}

function updateSparkles() {
    let w = 0;
    for (let i = 0; i < sparkles.length; i++) {
        const s = sparkles[i];
        s.life -= s.decay;
        if (s.life > 0) sparkles[w++] = s;
    }
    sparkles.length = w;
}

function renderSparkles() {
    for (const s of sparkles) {
        const a = s.life > 0.5 ? 1 : s.life * 2;
        ctx.save();
        ctx.globalAlpha = a * 0.8;
        ctx.fillStyle = s.color;
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        const r = s.size;
        const ri = r * 0.3;
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8 - Math.PI / 2;
            const rad = i % 2 === 0 ? r : ri;
            const px = s.x + Math.cos(angle) * rad;
            const py = s.y + Math.sin(angle) * rad;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}

// ============================================================
// CIRCLE FRAGMENTS (after burst - arcs flying away)
// ============================================================
let circleFragments = null;

function initCircleFragments(cx, cy) {
    circleFragments = [];
    const fragCount = 12;
    for (let i = 0; i < fragCount; i++) {
        const angle = (Math.PI * 2 * i) / fragCount;
        const speed = 3 + Math.random() * 5;
        circleFragments.push({
            x: cx, y: cy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 1,
            startAngle: angle - Math.PI / fragCount,
            endAngle: angle + Math.PI / fragCount,
            radius: circleR * (0.7 + Math.random() * 0.5),
            rot: 0,
            rotV: (Math.random() - 0.5) * 0.06,
            alpha: 1,
            lineW: 1 + Math.random() * 1.5,
        });
    }
}

function updateCircleFragments() {
    if (!circleFragments) return;
    for (const f of circleFragments) {
        f.x += f.vx;
        f.vy += 0.08;
        f.y += f.vy;
        f.rot += f.rotV;
        f.alpha -= 0.012;
    }
    if (circleFragments[0].alpha <= 0) circleFragments = null;
}

function renderCircleFragments() {
    if (!circleFragments) return;
    for (const f of circleFragments) {
        if (f.alpha <= 0) continue;
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(f.rot);
        ctx.globalAlpha = f.alpha;
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = f.lineW;
        ctx.shadowColor = 'rgba(255,215,0,0.5)';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(0, 0, f.radius, f.startAngle, f.endAngle);
        ctx.stroke();
        ctx.restore();
    }
}

// ============================================================
// MAGIC CIRCLE DRAWING
// ============================================================

function drawMagicCircle(cx, cy, pullProgress, time) {
    const R = circleR;
    // Rotation speeds — accelerate with pull
    const baseSpeed = 0.3;
    const pullMult = 1 + pullProgress * 8; // up to 9x speed at full pull
    const rot1 = time * baseSpeed * pullMult;
    const rot2 = -time * baseSpeed * 0.6 * pullMult;
    const rot3 = time * baseSpeed * 0.4 * pullMult;

    // Glow intensity increases with pull
    const glowIntensity = 0.4 + pullProgress * 0.6;
    const pulseGlow = 0.85 + 0.15 * Math.sin(time * 2.5);

    ctx.save();
    ctx.translate(cx, cy);

    // === Ambient glow behind circle ===
    const ambGrad = ctx.createRadialGradient(0, 0, R * 0.1, 0, 0, R * 1.5);
    ambGrad.addColorStop(0, `rgba(255, 215, 0, ${0.12 * glowIntensity * pulseGlow})`);
    ambGrad.addColorStop(0.5, `rgba(255, 100, 0, ${0.06 * glowIntensity})`);
    ambGrad.addColorStop(1, 'rgba(255, 50, 0, 0)');
    ctx.fillStyle = ambGrad;
    ctx.fillRect(-R * 1.5, -R * 1.5, R * 3, R * 3);

    // === Outer ring ===
    ctx.save();
    ctx.rotate(rot1);
    ctx.strokeStyle = `rgba(255, 215, 0, ${0.6 * glowIntensity})`;
    ctx.lineWidth = 2;
    ctx.shadowColor = `rgba(255, 215, 0, ${0.5 * glowIntensity})`;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.stroke();

    // Outer ring tick marks
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 36; i++) {
        const a = (Math.PI * 2 * i) / 36;
        const inner = i % 3 === 0 ? R - 12 : R - 7;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
        ctx.lineTo(Math.cos(a) * R, Math.sin(a) * R);
        ctx.stroke();
    }

    // Rune characters on outer ring
    ctx.shadowBlur = 6;
    ctx.font = `${R * 0.1}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = `rgba(255, 215, 0, ${0.5 * glowIntensity})`;
    for (let i = 0; i < 8; i++) {
        const a = (Math.PI * 2 * i) / 8;
        const d = R + R * 0.12;
        ctx.save();
        ctx.translate(Math.cos(a) * d, Math.sin(a) * d);
        ctx.rotate(a + Math.PI / 2);
        ctx.fillText(RUNE_CHARS[i], 0, 0);
        ctx.restore();
    }
    ctx.restore();

    // === Second ring (counter-rotating) ===
    const R2 = R * 0.78;
    ctx.save();
    ctx.rotate(rot2);
    ctx.strokeStyle = `rgba(255, 200, 50, ${0.45 * glowIntensity})`;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = `rgba(255, 215, 0, ${0.3 * glowIntensity})`;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(0, 0, R2, 0, Math.PI * 2);
    ctx.stroke();

    // Dashed decorative arcs
    ctx.setLineDash([8, 12]);
    ctx.beginPath();
    ctx.arc(0, 0, R2 * 0.92, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Small circles on second ring
    for (let i = 0; i < 6; i++) {
        const a = (Math.PI * 2 * i) / 6;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * R2, Math.sin(a) * R2, 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 215, 0, ${0.6 * glowIntensity})`;
        ctx.fill();
    }
    ctx.restore();

    // === Hexagram (六芒星) ===
    const R3 = R * 0.58;
    ctx.save();
    ctx.rotate(rot3);
    ctx.strokeStyle = `rgba(255, 215, 0, ${0.55 * glowIntensity})`;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = `rgba(255, 215, 0, ${0.4 * glowIntensity})`;
    ctx.shadowBlur = 10;

    // Triangle 1 (up)
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
        const a = (Math.PI * 2 * i) / 3 - Math.PI / 2;
        const px = Math.cos(a) * R3;
        const py = Math.sin(a) * R3;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();

    // Triangle 2 (down)
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
        const a = (Math.PI * 2 * i) / 3 + Math.PI / 2;
        const px = Math.cos(a) * R3;
        const py = Math.sin(a) * R3;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();

    // Inner hexagon connecting midpoints
    const R4 = R3 * 0.5;
    ctx.strokeStyle = `rgba(255, 180, 0, ${0.35 * glowIntensity})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const a = (Math.PI * 2 * i) / 6;
        const px = Math.cos(a) * R4;
        const py = Math.sin(a) * R4;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();

    ctx.restore();

    // === Inner circle ===
    const R5 = R * 0.32;
    ctx.strokeStyle = `rgba(255, 215, 0, ${0.5 * glowIntensity})`;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = `rgba(255, 215, 0, ${0.4 * glowIntensity})`;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(0, 0, R5, 0, Math.PI * 2);
    ctx.stroke();

    // === Center "福" character ===
    const fuPulse = 0.9 + 0.1 * Math.sin(time * 1.8);
    const fuSize = R * 0.42 * fuPulse;
    ctx.font = `${fuSize}px ${chosenFont}, serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = `rgba(255, 215, 0, ${0.75 * glowIntensity * pulseGlow})`;
    ctx.shadowColor = `rgba(255, 215, 0, ${0.6 * glowIntensity})`;
    ctx.shadowBlur = 25;
    ctx.fillText('福', 0, 0);
    // Stronger glow pass
    ctx.globalAlpha = 0.3 * glowIntensity;
    ctx.shadowBlur = 50;
    ctx.fillText('福', 0, 0);
    ctx.globalAlpha = 1;

    // === Center core glow ===
    const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, R5);
    coreGrad.addColorStop(0, `rgba(255, 240, 200, ${0.15 * glowIntensity * pulseGlow})`);
    coreGrad.addColorStop(0.5, `rgba(255, 215, 0, ${0.05 * glowIntensity})`);
    coreGrad.addColorStop(1, 'rgba(255, 215, 0, 0)');
    ctx.fillStyle = coreGrad;
    ctx.fillRect(-R5, -R5, R5 * 2, R5 * 2);

    // === Orbiting lucky characters ===
    const orbitR = R * 0.9;
    const orbitChars = '福禄寿喜财吉';
    ctx.save();
    ctx.rotate(time * 0.15 * pullMult);
    ctx.font = `${R * 0.07}px ${chosenFont}, serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < orbitChars.length; i++) {
        const a = (Math.PI * 2 * i) / orbitChars.length;
        const bobR = orbitR + Math.sin(time * 1.5 + i) * 5;
        const ox = Math.cos(a) * bobR;
        const oy = Math.sin(a) * bobR;
        ctx.fillStyle = `rgba(255, 215, 0, ${0.35 * glowIntensity})`;
        ctx.shadowColor = 'rgba(255,215,0,0.3)';
        ctx.shadowBlur = 8;
        ctx.fillText(orbitChars[i], ox, oy);
    }
    ctx.restore();

    // === Cracks (appear at high pull progress) ===
    if (pullProgress > 0.5) {
        const crackIntensity = (pullProgress - 0.5) * 2; // 0 to 1
        const crackCount = Math.floor(3 + crackIntensity * 6);
        ctx.save();
        ctx.strokeStyle = `rgba(255, 255, 200, ${crackIntensity * 0.7})`;
        ctx.lineWidth = 1 + crackIntensity * 2;
        ctx.shadowColor = `rgba(255, 255, 200, ${crackIntensity * 0.5})`;
        ctx.shadowBlur = 15;
        // Use seeded positions for stable cracks (not random per frame)
        for (let i = 0; i < crackCount; i++) {
            const seed = i * 137.508; // golden angle for distribution
            const a = seed % (Math.PI * 2);
            const startR = R5 * 0.5;
            const endR = R5 + (R - R5) * crackIntensity * (0.5 + (Math.sin(seed) * 0.5 + 0.5) * 0.5);
            ctx.beginPath();
            ctx.moveTo(Math.cos(a) * startR, Math.sin(a) * startR);
            // Jagged crack line
            const steps = 4;
            for (let j = 1; j <= steps; j++) {
                const t = j / steps;
                const r = lerp(startR, endR, t);
                const jitter = (Math.sin(seed * j * 3.7) * 0.15);
                const ca = a + jitter;
                ctx.lineTo(Math.cos(ca) * r, Math.sin(ca) * r);
            }
            ctx.stroke();
        }
        ctx.restore();
    }

    ctx.restore();
}

// --- Energy glow intensifying during pull ---
function drawCircleEnergyGlow(cx, cy, pullProgress, tier) {
    if (pullProgress < 0.1 || !tier) return;
    const intensity = clamp((pullProgress - 0.1) / 0.9, 0, 1);
    const [r, g, b] = tier.burstRGB;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // Central radial energy
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, circleR * (0.8 + intensity * 0.5));
    grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${intensity * 0.5})`);
    grad.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, ${intensity * 0.25})`);
    grad.addColorStop(0.7, `rgba(255, 255, 255, ${intensity * 0.06})`);
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, circleR * 1.3, 0, Math.PI * 2);
    ctx.fill();

    // Radiating energy lines
    if (intensity > 0.3) {
        const lineIntensity = (intensity - 0.3) / 0.7;
        const rayCount = Math.floor(8 + lineIntensity * 12);
        for (let i = 0; i < rayCount; i++) {
            const a = (Math.PI * 2 * i) / rayCount + globalTime * 0.5;
            const len = circleR * (0.5 + lineIntensity * 1.2);
            const w = 1 + lineIntensity * 2;
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(a);
            ctx.globalAlpha = lineIntensity * (0.15 + Math.sin(globalTime * 3 + i) * 0.1);
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.fillRect(-w / 2, circleR * 0.3, w, len);
            ctx.restore();
        }
    }

    ctx.restore();
}

// --- Burst Flash ---
function drawBurstFlash(progress, tier) {
    if (progress > 1) return;
    const flash = 1 - progress;
    if (flash <= 0) return;
    const [r, g, b] = tier.burstRGB;

    ctx.save();
    const grad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, vmin * 0.8);
    grad.addColorStop(0, `rgba(255, 255, 240, ${flash * 0.95})`);
    grad.addColorStop(0.2, `rgba(255, 255, 240, ${flash * 0.6})`);
    grad.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${flash * 0.4})`);
    grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
}

// --- Expanding glow rings (after burst) ---
function drawBurstRings(cx, cy, progress, tier) {
    const [r, g, b] = tier.burstRGB;
    // Multiple expanding rings
    for (let i = 0; i < 3; i++) {
        const delay = i * 0.12;
        const t = clamp((progress - delay) / 0.6, 0, 1);
        if (t <= 0 || t >= 1) continue;
        const radius = circleR * (0.3 + t * 2.5);
        const alpha = (1 - t) * 0.5;
        const lineW = (1 - t) * 4 + 1;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.lineWidth = lineW;
        ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${alpha * 0.8})`;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
}

// --- Text Helpers ---
function drawGlowText(text, x, y, color, alpha, size, font) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `${size}px ${font || 'sans-serif'}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = size * 0.4;
    ctx.fillText(text, x, y);
    ctx.globalAlpha = alpha * 0.5;
    ctx.shadowBlur = size * 0.8;
    ctx.fillText(text, x, y);
    ctx.restore();
}

// ============================================================
// GACHA DRAW LOGIC
// ============================================================

function performDraw() {
    const roll = Math.random() * 100;
    let cumulative = 0;
    let tierIdx = RARITY_WEIGHTS.length - 1;
    for (let i = 0; i < RARITY_WEIGHTS.length; i++) {
        cumulative += RARITY_WEIGHTS[i];
        if (roll < cumulative) { tierIdx = i; break; }
    }
    const tier = RARITY_TIERS[tierIdx];
    const catIdx = tier.categories[Math.floor(Math.random() * tier.categories.length)];
    const category = BLESSING_CATEGORIES[catIdx];
    const char = category.chars[Math.floor(Math.random() * category.chars.length)];
    const blessing = CHAR_BLESSINGS[char] || { phrase: char + '运亨通', english: 'Fortune and blessings upon you' };

    return { character: char, blessing, category, tier, tierIndex: tierIdx };
}

// --- Save draw to localStorage for collection ---
function saveDrawToCollection(draw) {
    let collection = {};
    try { collection = JSON.parse(localStorage.getItem('gacha_collection') || '{}'); } catch(e) {}
    const key = draw.character;
    if (collection[key]) {
        collection[key].count++;
    } else {
        collection[key] = {
            count: 1,
            firstTime: Date.now(),
            tierIndex: draw.tierIndex,
        };
    }
    // Also track total draws
    const stats = { totalDraws: 0 };
    try { Object.assign(stats, JSON.parse(localStorage.getItem('gacha_stats') || '{}')); } catch(e) {}
    stats.totalDraws++;
    localStorage.setItem('gacha_collection', JSON.stringify(collection));
    localStorage.setItem('gacha_stats', JSON.stringify(stats));
}

// ============================================================
// STATE MACHINE
// ============================================================

let state = 'IDLE';
let stateTime = 0;
let globalTime = 0;
let startTime = 0;
let stateStartGlobal = 0;
let pullProgress = 0;
let currentDraw = null;
let snapBackCb = null;
let quickPullCb = null;
let preDrawnTier = null;
let isMultiMode = false;

function changeState(newState) {
    state = newState;
    stateStartGlobal = globalTime;
    stateTime = 0;

    if (newState === 'IDLE') {
        pullProgress = 0;
        circleFragments = null;
        burstParticles.length = 0;
        sparkles.length = 0;
        currentDraw = null;
        preDrawnTier = null;
        isMultiMode = false;
        hideCardOverlay();
        // Hide multi overlay if visible
        const mo = document.getElementById('multi-overlay');
        const md = document.getElementById('multi-detail');
        if (mo) mo.classList.remove('visible');
        if (md) md.classList.remove('visible');
        const bmp = document.getElementById('btn-multi-pull');
        if (bmp) bmp.classList.remove('hidden');
    }
    if (newState === 'PULLING') {
        currentDraw = performDraw();
        preDrawnTier = currentDraw.tier;
    }
    if (newState === 'BURST') {
        if (!currentDraw) currentDraw = performDraw();
        preDrawnTier = currentDraw.tier;
        saveDrawToCollection(currentDraw);
        initCircleFragments(W / 2, H / 2);
        spawnBurstParticles(W / 2, H / 2, currentDraw.tier);
    }
    if (newState === 'CARD_DISPLAY') {
        if (!isMultiMode) showCardOverlay(currentDraw);
    }
}

// --- Snap Back ---
function snapBackAnimation() {
    const startProg = pullProgress;
    const snapStart = globalTime;
    const dur = 0.35;
    snapBackCb = () => {
        const t = clamp((globalTime - snapStart) / dur, 0, 1);
        pullProgress = startProg * (1 - easeOutElastic(t));
        if (t >= 1) {
            pullProgress = 0;
            snapBackCb = null;
            state = 'IDLE';
        }
    };
}

// --- Quick Pull (keyboard/scroll) ---
function quickPullAnimation() {
    if (state !== 'IDLE') return;
    changeState('PULLING');
    const quickStart = globalTime;
    const dur = 0.6;
    quickPullCb = () => {
        const t = clamp((globalTime - quickStart) / dur, 0, 1);
        pullProgress = easeInOut(t);
        if (t >= 1) {
            pullProgress = 1;
            quickPullCb = null;
            changeState('BURST');
        }
    };
}

// ============================================================
// STATE UPDATE & RENDER
// ============================================================

function updateIdle() {
    if (Math.random() < 0.15) {
        spawnSparkle(W / 2, H / 2, circleR * 1.1, '#FFD700');
    }
}

function renderIdle() {
    const cx = W / 2;
    const cy = H / 2;

    drawMagicCircle(cx, cy, 0, globalTime);

    // Title
    const titleAlpha = clamp(globalTime / 0.8, 0, 1);
    drawGlowText('灵 光 法 阵', cx, H * 0.1, '#FFD700', titleAlpha, vmin * 0.055, `${chosenFont}, serif`);
    drawGlowText('Fortune Sigil', cx, H * 0.1 + vmin * 0.045, 'rgba(255,215,0,0.5)', titleAlpha * 0.6, vmin * 0.022, '-apple-system, sans-serif');

    // Hint text
    const hintAlpha = clamp((globalTime - 1.0) / 0.5, 0, 1);
    const pulse = 0.5 + 0.5 * Math.sin(globalTime * 3);
    drawGlowText('↑ 上拉启动法阵 ↑', cx, H * 0.9, '#FFD700', hintAlpha * (0.4 + pulse * 0.3), vmin * 0.032, '-apple-system, sans-serif');
    drawGlowText('Swipe up / Space / Scroll', cx, H * 0.9 + vmin * 0.035, 'rgba(255,215,0,0.35)', hintAlpha * 0.3, vmin * 0.018, '-apple-system, sans-serif');
}

function updatePulling() {
    if (snapBackCb) snapBackCb();
    if (quickPullCb) quickPullCb();
    if (Math.random() < 0.1 + pullProgress * 0.5) {
        const color = preDrawnTier ? `rgb(${preDrawnTier.burstRGB.join(',')})` : '#FFD700';
        spawnSparkle(W / 2, H / 2, circleR * (1 + pullProgress * 0.5), color);
    }
}

function renderPulling() {
    const cx = W / 2;
    const cy = H / 2;

    // Screen shake at high pull
    let shaking = false;
    if (pullProgress > 0.5) {
        shaking = true;
        const shake = (pullProgress - 0.5) * 10;
        ctx.save();
        ctx.translate(
            (Math.random() - 0.5) * shake,
            (Math.random() - 0.5) * shake
        );
    }

    drawMagicCircle(cx, cy, pullProgress, globalTime);
    drawCircleEnergyGlow(cx, cy, pullProgress, preDrawnTier);

    if (shaking) {
        ctx.restore();
    }

    // Pull progress arc (circular instead of bar)
    const barR = circleR * 1.35;
    const arcEnd = pullProgress * Math.PI * 2;
    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, barR, 0, Math.PI * 2);
    ctx.stroke();
    if (pullProgress > 0) {
        ctx.globalAlpha = 0.7;
        const color = preDrawnTier ? preDrawnTier.color : '#FFD700';
        ctx.strokeStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, barR, -Math.PI / 2, -Math.PI / 2 + arcEnd);
        ctx.stroke();
    }
    ctx.restore();
}

function updateBurst() {
    updateCircleFragments();
    if (stateTime > CONFIG.burstDuration) {
        changeState('REVEAL');
    }
}

function renderBurst() {
    const cx = W / 2;
    const cy = H / 2;
    const tier = currentDraw.tier;
    const progress = stateTime / CONFIG.burstDuration;

    // Flash
    drawBurstFlash(stateTime / 0.25, tier);

    // Circle fragments flying away
    renderCircleFragments();

    // Expanding glow rings
    drawBurstRings(cx, cy, progress, tier);

    // Character fading in during burst end
    if (stateTime > CONFIG.burstDuration * 0.4) {
        const charT = (stateTime - CONFIG.burstDuration * 0.4) / (CONFIG.burstDuration * 0.6);
        const charAlpha = clamp(charT, 0, 1) * 0.4;
        const charSize = vmin * 0.25 * (3 - charT * 2);
        drawGlowText(currentDraw.character, cx, cy, `rgba(${tier.burstRGB.join(',')},1)`, charAlpha, charSize, `${chosenFont}, serif`);
    }
}

function updateReveal() {
    const tier = currentDraw.tier;
    if (Math.random() < 0.25) {
        spawnSparkle(W / 2, H / 2, vmin * 0.2, tier.color);
    }
    if (stateTime > CONFIG.revealDuration) {
        changeState('CARD_DISPLAY');
    }
}

function renderReveal() {
    const cx = W / 2;
    const cy = H / 2;
    const tier = currentDraw.tier;
    const draw = currentDraw;

    // Dim background
    ctx.save();
    ctx.globalAlpha = clamp(stateTime / 0.3, 0, 0.4);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    // Residual circle glow behind character
    const glowAlpha = clamp(1 - stateTime / 1.5, 0, 0.3);
    if (glowAlpha > 0) {
        ctx.save();
        ctx.globalAlpha = glowAlpha;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, circleR);
        grad.addColorStop(0, `rgba(${tier.burstRGB.join(',')}, 0.3)`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, circleR, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // Character zoom in with bounce
    const charT = clamp(stateTime / 0.5, 0, 1);
    const charScale = charT < 1 ? lerp(3, 1, easeOutBack(charT)) : 1;
    const charSize = vmin * 0.18 * charScale;
    const charAlpha = clamp(stateTime / 0.3, 0, 1);
    drawGlowText(draw.character, cx, cy - vmin * 0.05, '#FFF', charAlpha, charSize, `${chosenFont}, serif`);

    // Category name
    const catT = clamp((stateTime - 0.4) / 0.3, 0, 1);
    if (catT > 0) {
        drawGlowText(draw.category.name, cx, cy - vmin * 0.2, tier.color, catT, vmin * 0.035, `${chosenFont}, serif`);
        drawGlowText(`— ${draw.category.nameEn} —`, cx, cy - vmin * 0.16, tier.color, catT * 0.5, vmin * 0.018, '-apple-system, sans-serif');
    }

    // Blessing phrase
    const phraseT = clamp((stateTime - 0.7) / 0.3, 0, 1);
    if (phraseT > 0) {
        drawGlowText(draw.blessing.phrase, cx, cy + vmin * 0.1, '#FFD700', phraseT, vmin * 0.045, `${chosenFont}, serif`);
    }

    // English
    const engT = clamp((stateTime - 0.9) / 0.3, 0, 1);
    if (engT > 0) {
        drawGlowText(draw.blessing.english, cx, cy + vmin * 0.16, 'rgba(255,215,0,0.6)', engT * 0.7, vmin * 0.02, '-apple-system, sans-serif');
    }

    // Stars
    const starStartT = 1.0;
    const starSize = vmin * 0.03;
    const starY = cy - vmin * 0.28;
    for (let i = 0; i < tier.stars; i++) {
        const st = clamp((stateTime - starStartT - i * 0.1) / 0.15, 0, 1);
        if (st > 0) {
            const sx = cx + (i - (tier.stars - 1) / 2) * starSize * 1.5;
            drawGlowText('★', sx, starY, tier.color, st, starSize * easeOutBack(st), '-apple-system, sans-serif');
        }
    }

    // Tier label
    const labelT = clamp((stateTime - 1.5) / 0.3, 0, 1);
    if (labelT > 0) {
        drawGlowText(tier.label, cx, cy + vmin * 0.24, tier.color, labelT * 0.6, vmin * 0.022, `${chosenFont}, serif`);
        drawGlowText(tier.labelEn, cx, cy + vmin * 0.28, tier.color, labelT * 0.35, vmin * 0.015, '-apple-system, sans-serif');
    }
}

function updateCardDisplay() {
    if (Math.random() < 0.1) {
        const tier = currentDraw.tier;
        spawnSparkle(W / 2, H / 2, vmin * 0.25, tier.color);
    }
}

function renderCardDisplay() {
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
}

// ============================================================
// CARD OVERLAY (DOM)
// ============================================================

const cardOverlay = document.getElementById('card-overlay');
const cardContainer = cardOverlay.querySelector('.card-container');
const btnDrawAgain = document.getElementById('btn-draw-again');
const backLink = document.getElementById('back-link');
const homeLink = document.getElementById('home-link');

function showCardOverlay(draw) {
    const tier = draw.tier;
    const cat = draw.category;

    cardContainer.style.setProperty('--card-color', tier.color);
    cardContainer.style.setProperty('--card-glow', tier.glow);
    cardContainer.style.setProperty('--card-font', `${chosenFont}, serif`);

    document.getElementById('card-stars').textContent = '★'.repeat(tier.stars) + '☆'.repeat(6 - tier.stars);
    document.getElementById('card-category').textContent = `${cat.name} · ${cat.nameEn}`;

    const charEl = document.getElementById('card-character');
    charEl.textContent = draw.character;
    charEl.style.fontFamily = `${chosenFont}, serif`;

    document.getElementById('card-phrase').textContent = draw.blessing.phrase;
    document.getElementById('card-english').textContent = draw.blessing.english;
    document.getElementById('card-info').textContent = `${tier.label} · ${tier.labelEn}`;

    cardOverlay.classList.add('visible');
    cardContainer.style.animation = 'none';
    cardContainer.offsetHeight;
    cardContainer.style.animation = '';

    setTimeout(() => {
        btnDrawAgain.style.display = 'block';
        backLink.style.display = 'block';
        homeLink.style.display = 'block';
    }, 600);
}

function hideCardOverlay() {
    cardOverlay.classList.remove('visible');
    btnDrawAgain.style.display = 'none';
    backLink.style.display = 'none';
    homeLink.style.display = 'none';
}

btnDrawAgain.addEventListener('click', () => {
    changeState('IDLE');
});

// ============================================================
// MULTI-PULL (十连抽) SYSTEM
// ============================================================

const btnMultiPull = document.getElementById('btn-multi-pull');
const multiOverlay = document.getElementById('multi-overlay');
const multiGrid = document.getElementById('multi-grid');
const btnMultiAgain = document.getElementById('btn-multi-again');
const btnMultiSingle = document.getElementById('btn-multi-single');
const multiDetail = document.getElementById('multi-detail');
const detailCard = document.getElementById('detail-card');

let multiDraws = [];

function performMultiDraw() {
    const draws = [];
    for (let i = 0; i < 10; i++) {
        draws.push(performDraw());
    }
    // Sort by rarity (best first)
    draws.sort((a, b) => a.tierIndex - b.tierIndex);
    return draws;
}

function saveMultiDrawsToCollection(draws) {
    let collection = {};
    try { collection = JSON.parse(localStorage.getItem('gacha_collection') || '{}'); } catch(e) {}
    const stats = { totalDraws: 0 };
    try { Object.assign(stats, JSON.parse(localStorage.getItem('gacha_stats') || '{}')); } catch(e) {}

    for (const draw of draws) {
        const key = draw.character;
        if (collection[key]) {
            collection[key].count++;
        } else {
            collection[key] = { count: 1, firstTime: Date.now(), tierIndex: draw.tierIndex };
        }
        stats.totalDraws++;
    }
    localStorage.setItem('gacha_collection', JSON.stringify(collection));
    localStorage.setItem('gacha_stats', JSON.stringify(stats));
}

function showMultiResults(draws) {
    multiDraws = draws;
    multiGrid.innerHTML = '';

    for (let i = 0; i < draws.length; i++) {
        const d = draws[i];
        const card = document.createElement('div');
        card.className = 'multi-card';
        card.style.setProperty('--mc-color', d.tier.color);
        card.style.setProperty('--mc-glow', d.tier.glow);
        card.style.animationDelay = `${i * 0.08}s`;

        card.innerHTML = `
            <div class="mc-stars">${'★'.repeat(d.tier.stars)}</div>
            <div class="mc-char" style="font-family:${chosenFont},serif">${d.character}</div>
            <div class="mc-phrase">${d.blessing.phrase}</div>
        `;

        card.addEventListener('click', (e) => {
            e.stopPropagation();
            showMultiDetail(d);
        });

        multiGrid.appendChild(card);
    }

    multiOverlay.classList.add('visible');
    btnMultiPull.classList.add('hidden');
}

function hideMultiResults() {
    multiOverlay.classList.remove('visible');
    multiDetail.classList.remove('visible');
    if (state === 'IDLE' || state === 'CARD_DISPLAY') {
        btnMultiPull.classList.remove('hidden');
    }
}

function showMultiDetail(draw) {
    detailCard.style.setProperty('--card-color', draw.tier.color);
    detailCard.style.setProperty('--card-glow', draw.tier.glow);
    detailCard.style.setProperty('--card-font', `${chosenFont}, serif`);

    document.getElementById('detail-stars').textContent = '★'.repeat(draw.tier.stars) + '☆'.repeat(6 - draw.tier.stars);
    document.getElementById('detail-category').textContent = `${draw.category.name} · ${draw.category.nameEn}`;
    const charEl = document.getElementById('detail-character');
    charEl.textContent = draw.character;
    charEl.style.fontFamily = `${chosenFont}, serif`;
    document.getElementById('detail-phrase').textContent = draw.blessing.phrase;
    document.getElementById('detail-english').textContent = draw.blessing.english;
    document.getElementById('detail-info').textContent = `${draw.tier.label} · ${draw.tier.labelEn}`;

    detailCard.style.animation = 'none';
    detailCard.offsetHeight;
    detailCard.style.animation = '';

    multiDetail.classList.add('visible');
}

multiDetail.addEventListener('click', () => {
    multiDetail.classList.remove('visible');
});

function startMultiPull() {
    if (state !== 'IDLE') return;
    isMultiMode = true;
    const draws = performMultiDraw();
    saveMultiDrawsToCollection(draws);
    btnMultiPull.classList.add('hidden');

    // Quick burst animation then show results
    currentDraw = draws[0]; // Use best draw for burst visual
    preDrawnTier = currentDraw.tier;
    changeState('PULLING');

    const quickStart = globalTime;
    const dur = 0.5;
    quickPullCb = () => {
        const t = clamp((globalTime - quickStart) / dur, 0, 1);
        pullProgress = easeInOut(t);
        if (t >= 1) {
            pullProgress = 1;
            quickPullCb = null;
            // Burst then show multi results
            initCircleFragments(W / 2, H / 2);
            spawnBurstParticles(W / 2, H / 2, currentDraw.tier);
            state = 'BURST';
            stateStartGlobal = globalTime;
            stateTime = 0;

            // Show multi overlay after burst
            setTimeout(() => {
                showMultiResults(draws);
                state = 'CARD_DISPLAY';
                stateStartGlobal = globalTime;
                stateTime = 0;
            }, 800);
        }
    };
}

btnMultiPull.addEventListener('click', () => {
    startMultiPull();
});

btnMultiAgain.addEventListener('click', () => {
    hideMultiResults();
    changeState('IDLE');
    setTimeout(() => startMultiPull(), 100);
});

btnMultiSingle.addEventListener('click', () => {
    hideMultiResults();
    isMultiMode = false;
    changeState('IDLE');
});

// Show/hide multi-pull button based on state
function updateMultiPullButton() {
    if (state === 'IDLE' && !isMultiMode) {
        btnMultiPull.classList.remove('hidden');
    } else if (state !== 'IDLE' && !multiOverlay.classList.contains('visible')) {
        btnMultiPull.classList.add('hidden');
    }
}

// ============================================================
// INTERACTION HANDLERS
// ============================================================

let touchStartY = 0;
let mouseStartY = 0;
let mouseDown = false;

canvas.addEventListener('touchstart', (e) => {
    if (state === 'IDLE') {
        touchStartY = e.touches[0].clientY;
        changeState('PULLING');
        pullProgress = 0;
    }
}, { passive: true });

canvas.addEventListener('touchmove', (e) => {
    if (state === 'PULLING' && !quickPullCb) {
        const dy = touchStartY - e.touches[0].clientY;
        if (dy > 0) {
            pullProgress = clamp(dy / CONFIG.pullThreshold, 0, 1);
        }
    }
}, { passive: true });

canvas.addEventListener('touchend', () => {
    if (state === 'PULLING' && !quickPullCb) {
        if (pullProgress >= 0.95) {
            changeState('BURST');
        } else if (pullProgress > 0) {
            snapBackAnimation();
        } else {
            state = 'IDLE';
        }
    }
}, { passive: true });

canvas.addEventListener('mousedown', (e) => {
    if (state === 'IDLE') {
        mouseStartY = e.clientY;
        mouseDown = true;
        changeState('PULLING');
        pullProgress = 0;
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (mouseDown && state === 'PULLING' && !quickPullCb) {
        const dy = mouseStartY - e.clientY;
        if (dy > 0) {
            pullProgress = clamp(dy / CONFIG.pullThreshold, 0, 1);
        }
    }
});

canvas.addEventListener('mouseup', () => {
    if (mouseDown && state === 'PULLING' && !quickPullCb) {
        if (pullProgress >= 0.95) {
            changeState('BURST');
        } else if (pullProgress > 0) {
            snapBackAnimation();
        } else {
            state = 'IDLE';
        }
    }
    mouseDown = false;
});

canvas.addEventListener('mouseleave', () => {
    if (mouseDown && state === 'PULLING' && !quickPullCb && pullProgress > 0) {
        snapBackAnimation();
    }
    mouseDown = false;
});

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'Enter') {
        e.preventDefault();
        if (state === 'IDLE') {
            quickPullAnimation();
        } else if (state === 'CARD_DISPLAY') {
            changeState('IDLE');
        }
    }
});

canvas.addEventListener('wheel', (e) => {
    if (e.deltaY < -30 && state === 'IDLE') {
        quickPullAnimation();
    }
}, { passive: true });

// ============================================================
// MAIN LOOP
// ============================================================

function frame(now) {
    if (!startTime) startTime = now;
    globalTime = (now - startTime) / 1000;
    stateTime = globalTime - stateStartGlobal;

    ctx.save();
    ctx.scale(dpr, dpr);

    ctx.fillStyle = CONFIG.bg;
    ctx.fillRect(0, 0, W, H);

    updateBgParticles();
    renderBgParticles();
    drawScanlines();

    updateBurstParticles();
    updateSparkles();

    switch (state) {
        case 'IDLE':
            updateIdle();
            renderIdle();
            break;
        case 'PULLING':
            updatePulling();
            renderPulling();
            break;
        case 'BURST':
            updateBurst();
            renderBurst();
            break;
        case 'REVEAL':
            updateReveal();
            renderReveal();
            break;
        case 'CARD_DISPLAY':
            updateCardDisplay();
            renderCardDisplay();
            break;
    }

    renderBurstParticles();
    renderSparkles();

    ctx.restore();

    updateMultiPullButton();

    requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
