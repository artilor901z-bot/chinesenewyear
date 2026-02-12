// ============================================================
// 灵光法阵 Gacha — 3D Magic Circle Fortune Pull
// State machine: IDLE → PULLING → BURST → REVEAL → CARD_DISPLAY
// Uses Three.js via scene3d.js for all 3D rendering
// ============================================================
import { GachaScene } from './scene3d.js';

// --- Configuration ---
const CONFIG = {
    pullThreshold: 150,
    burstDuration: 1.2,
    revealDuration: 2.0,
};

// --- Data ---
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
    '"Zhi Mang Xing"', '"Liu Jian Mao Cao"', '"Ma Shan Zheng"',
    '"TsangerZhoukeZhengdabangshu"', '"hongleixingshu"',
    '"qiantubifengshouxieti"', '"峄山碑篆体"',
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

const RARITY_TIERS = [
    { stars: 6, label: '天赐鸿福', labelEn: 'Heavenly Fortune', categories: [0], color: '#FFD700', glow: 'rgba(255,215,0,0.5)', burstRGB: [255, 215, 0] },
    { stars: 5, label: '吉星高照', labelEn: 'Auspicious Stars', categories: [7, 8], color: '#FFA500', glow: 'rgba(255,165,0,0.5)', burstRGB: [255, 180, 50] },
    { stars: 4, label: '福泽绵长', labelEn: 'Enduring Blessings', categories: [4, 5], color: '#FF69B4', glow: 'rgba(255,105,180,0.5)', burstRGB: [255, 130, 180] },
    { stars: 3, label: '万事如意', labelEn: 'All Wishes Fulfilled', categories: [2, 6], color: '#00FF9F', glow: 'rgba(0,255,159,0.5)', burstRGB: [0, 255, 159] },
    { stars: 2, label: '迎春纳福', labelEn: 'Welcoming Fortune', categories: [1, 3], color: '#FF6644', glow: 'rgba(255,102,68,0.5)', burstRGB: [255, 120, 80] },
];
const RARITY_WEIGHTS = [3, 7, 15, 25, 50];

// --- Utilities ---
function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
function easeInOut(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }
function easeOutBack(t) { const c = 1.7; return 1 + (--t) * t * ((c + 1) * t + c); }
function easeOutElastic(t) {
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1;
}

// --- Font ---
const chosenFont = CALLI_FONTS[Math.floor(Math.random() * CALLI_FONTS.length)];

// ============================================================
// INIT 3D SCENE
// ============================================================
const sceneContainer = document.getElementById('scene-container');
const scene3d = new GachaScene(sceneContainer, chosenFont);
window.addEventListener('resize', () => scene3d.resize());

// ============================================================
// GACHA DRAW LOGIC
// ============================================================
function performDraw() {
    const roll = Math.random() * 100;
    let cumulative = 0, tierIdx = RARITY_WEIGHTS.length - 1;
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

function saveDrawToCollection(draw) {
    let collection = {};
    try { collection = JSON.parse(localStorage.getItem('gacha_collection') || '{}'); } catch (e) { /* empty */ }
    const key = draw.character;
    if (collection[key]) { collection[key].count++; }
    else { collection[key] = { count: 1, firstTime: Date.now(), tierIndex: draw.tierIndex }; }
    const stats = { totalDraws: 0 };
    try { Object.assign(stats, JSON.parse(localStorage.getItem('gacha_stats') || '{}')); } catch (e) { /* empty */ }
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

// --- DOM Elements ---
const hud = document.getElementById('hud-overlay');
const titleEl = document.getElementById('hud-title');
const hintEl = document.getElementById('hud-hint');
const revealEl = document.getElementById('reveal-container');
const cardOverlay = document.getElementById('card-overlay');
const cardContainer = cardOverlay.querySelector('.card-container');
const btnDrawAgain = document.getElementById('btn-draw-again');
const backLink = document.getElementById('back-link');
const homeLink = document.getElementById('home-link');
const btnMultiPull = document.getElementById('btn-multi-pull');
const multiOverlay = document.getElementById('multi-overlay');
const multiGrid = document.getElementById('multi-grid');
const btnMultiAgain = document.getElementById('btn-multi-again');
const btnMultiSingle = document.getElementById('btn-multi-single');
const multiDetail = document.getElementById('multi-detail');
const detailCard = document.getElementById('detail-card');

function changeState(newState) {
    state = newState;
    stateStartGlobal = globalTime;
    stateTime = 0;
    scene3d.state = newState;

    if (newState === 'IDLE') {
        pullProgress = 0;
        currentDraw = null;
        preDrawnTier = null;
        isMultiMode = false;
        hideCardOverlay();
        hideReveal();
        scene3d.resetToIdle();
        multiOverlay.classList.remove('visible');
        multiDetail.classList.remove('visible');
        btnMultiPull.classList.remove('hidden');
        titleEl.classList.add('visible');
        hintEl.classList.add('visible');
    }
    if (newState === 'PULLING') {
        // Multi-pull pre-sets currentDraw — don't overwrite it
        if (!isMultiMode) {
            currentDraw = performDraw();
        }
        preDrawnTier = currentDraw.tier;
        scene3d.tierColor.set(
            preDrawnTier.burstRGB[0] / 255,
            preDrawnTier.burstRGB[1] / 255,
            preDrawnTier.burstRGB[2] / 255,
        );
        titleEl.classList.remove('visible');
        hintEl.classList.remove('visible');
    }
    if (newState === 'BURST') {
        if (!currentDraw) currentDraw = performDraw();
        preDrawnTier = currentDraw.tier;
        // Multi-pull already saved via saveMultiDrawsToCollection
        if (!isMultiMode) saveDrawToCollection(currentDraw);
        scene3d.triggerBurst(currentDraw.tier);
    }
    if (newState === 'REVEAL') {
        showReveal(currentDraw);
        scene3d.bloomPass.strength = 0.7; // Reset bloom after burst
    }
    if (newState === 'CARD_DISPLAY') {
        hideReveal(); // Iteration 1: hide reveal before showing card
        if (!isMultiMode) showCardOverlay(currentDraw);
        scene3d.setDim(0.6);
        scene3d.bloomPass.strength = 0.4; // Subtle bloom for card display
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
        if (t >= 1) { pullProgress = 0; snapBackCb = null; state = 'IDLE'; scene3d.resetToIdle(); titleEl.classList.add('visible'); hintEl.classList.add('visible'); }
    };
}

// --- Quick Pull ---
function quickPullAnimation() {
    if (state !== 'IDLE') return;
    changeState('PULLING');
    const quickStart = globalTime;
    const dur = 0.6;
    quickPullCb = () => {
        const t = clamp((globalTime - quickStart) / dur, 0, 1);
        pullProgress = easeInOut(t);
        if (t >= 1) { pullProgress = 1; quickPullCb = null; changeState('BURST'); }
    };
}

// ============================================================
// REVEAL (DOM-based text with CSS animations)
// ============================================================
function showReveal(draw) {
    const tier = draw.tier;
    scene3d.setDim(0.3);
    revealEl.innerHTML = '';
    revealEl.style.setProperty('--reveal-color', tier.color);

    // Stars
    const starsDiv = document.createElement('div');
    starsDiv.className = 'reveal-stars';
    starsDiv.innerHTML = Array.from({ length: tier.stars }, (_, i) =>
        `<span class="reveal-star" style="animation-delay:${1.0 + i * 0.1}s">★</span>`
    ).join('');
    revealEl.appendChild(starsDiv);

    // Category
    const catDiv = document.createElement('div');
    catDiv.className = 'reveal-cat';
    catDiv.textContent = `${draw.category.name} · ${draw.category.nameEn}`;
    revealEl.appendChild(catDiv);

    // Character
    const charDiv = document.createElement('div');
    charDiv.className = 'reveal-char';
    charDiv.textContent = draw.character;
    charDiv.style.fontFamily = `${chosenFont}, serif`;
    revealEl.appendChild(charDiv);

    // Blessing
    const phraseDiv = document.createElement('div');
    phraseDiv.className = 'reveal-phrase';
    phraseDiv.textContent = draw.blessing.phrase;
    revealEl.appendChild(phraseDiv);

    const engDiv = document.createElement('div');
    engDiv.className = 'reveal-eng';
    engDiv.textContent = draw.blessing.english;
    revealEl.appendChild(engDiv);

    // Tier label
    const tierDiv = document.createElement('div');
    tierDiv.className = 'reveal-tier';
    tierDiv.textContent = `${tier.label} · ${tier.labelEn}`;
    revealEl.appendChild(tierDiv);

    revealEl.classList.add('visible');
}

function hideReveal() {
    revealEl.classList.remove('visible');
}

// ============================================================
// CARD OVERLAY
// ============================================================
function showCardOverlay(draw) {
    const tier = draw.tier;
    cardContainer.style.setProperty('--card-color', tier.color);
    cardContainer.style.setProperty('--card-glow', tier.glow);
    cardContainer.style.setProperty('--card-font', `${chosenFont}, serif`);
    document.getElementById('card-stars').textContent = '★'.repeat(tier.stars) + '☆'.repeat(6 - tier.stars);
    document.getElementById('card-category').textContent = `${draw.category.name} · ${draw.category.nameEn}`;
    const charEl = document.getElementById('card-character');
    charEl.textContent = draw.character;
    charEl.style.fontFamily = `${chosenFont}, serif`;
    document.getElementById('card-phrase').textContent = draw.blessing.phrase;
    document.getElementById('card-english').textContent = draw.blessing.english;
    document.getElementById('card-info').textContent = `${tier.label} · ${tier.labelEn}`;
    cardOverlay.classList.add('visible');
    cardContainer.style.animation = 'none';
    cardContainer.offsetHeight; // reflow
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

btnDrawAgain.addEventListener('click', () => changeState('IDLE'));

// ============================================================
// MULTI-PULL (十连抽)
// ============================================================
let multiDraws = [];

function performMultiDraw() {
    const draws = [];
    for (let i = 0; i < 10; i++) draws.push(performDraw());
    draws.sort((a, b) => a.tierIndex - b.tierIndex);
    return draws;
}

function saveMultiDrawsToCollection(draws) {
    let collection = {};
    try { collection = JSON.parse(localStorage.getItem('gacha_collection') || '{}'); } catch (e) { /* empty */ }
    const stats = { totalDraws: 0 };
    try { Object.assign(stats, JSON.parse(localStorage.getItem('gacha_stats') || '{}')); } catch (e) { /* empty */ }
    for (const draw of draws) {
        const key = draw.character;
        if (collection[key]) collection[key].count++;
        else collection[key] = { count: 1, firstTime: Date.now(), tierIndex: draw.tierIndex };
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
            <div class="mc-phrase">${d.blessing.phrase}</div>`;
        card.addEventListener('click', (e) => { e.stopPropagation(); showMultiDetail(d); });
        multiGrid.appendChild(card);
    }
    multiOverlay.classList.add('visible');
    btnMultiPull.classList.add('hidden');
}

function hideMultiResults() {
    multiOverlay.classList.remove('visible');
    multiDetail.classList.remove('visible');
    if (state === 'IDLE' || state === 'CARD_DISPLAY') btnMultiPull.classList.remove('hidden');
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

multiDetail.addEventListener('click', () => multiDetail.classList.remove('visible'));

function startMultiPull() {
    if (state !== 'IDLE') return;
    isMultiMode = true;
    const draws = performMultiDraw();
    saveMultiDrawsToCollection(draws);
    btnMultiPull.classList.add('hidden');
    currentDraw = draws[0];
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
            scene3d.triggerBurst(currentDraw.tier);
            state = 'BURST';
            stateStartGlobal = globalTime;
            stateTime = 0;
            scene3d.state = 'BURST';
            // Iteration 4: don't double-save — saveMultiDrawsToCollection already saved all 10
            setTimeout(() => {
                showMultiResults(draws);
                state = 'CARD_DISPLAY';
                scene3d.state = 'CARD_DISPLAY';
                scene3d.setDim(0.6);
            }, 900);
        }
    };
}

btnMultiPull.addEventListener('click', () => startMultiPull());
btnMultiAgain.addEventListener('click', () => { hideMultiResults(); changeState('IDLE'); setTimeout(() => startMultiPull(), 100); });
btnMultiSingle.addEventListener('click', () => { hideMultiResults(); isMultiMode = false; changeState('IDLE'); });

function updateMultiPullButton() {
    if (state === 'IDLE' && !isMultiMode) btnMultiPull.classList.remove('hidden');
    else if (state !== 'IDLE' && !multiOverlay.classList.contains('visible')) btnMultiPull.classList.add('hidden');
}

// ============================================================
// INTERACTION HANDLERS (on renderer canvas)
// ============================================================
const canvas = scene3d.renderer.domElement;
let touchStartY = 0, mouseStartY = 0, mouseDown = false;

canvas.addEventListener('touchstart', (e) => {
    if (state === 'IDLE') { touchStartY = e.touches[0].clientY; changeState('PULLING'); pullProgress = 0; }
}, { passive: true });

canvas.addEventListener('touchmove', (e) => {
    if (state === 'PULLING' && !quickPullCb) {
        const dy = touchStartY - e.touches[0].clientY;
        if (dy > 0) pullProgress = clamp(dy / CONFIG.pullThreshold, 0, 1);
    }
}, { passive: true });

canvas.addEventListener('touchend', () => {
    if (state === 'PULLING' && !quickPullCb) {
        if (pullProgress >= 0.95) changeState('BURST');
        else if (pullProgress > 0) snapBackAnimation();
        else { state = 'IDLE'; scene3d.resetToIdle(); titleEl.classList.add('visible'); hintEl.classList.add('visible'); }
    }
}, { passive: true });

canvas.addEventListener('mousedown', (e) => {
    if (state === 'IDLE') { mouseStartY = e.clientY; mouseDown = true; changeState('PULLING'); pullProgress = 0; }
});

canvas.addEventListener('mousemove', (e) => {
    if (mouseDown && state === 'PULLING' && !quickPullCb) {
        const dy = mouseStartY - e.clientY;
        if (dy > 0) pullProgress = clamp(dy / CONFIG.pullThreshold, 0, 1);
    }
});

canvas.addEventListener('mouseup', () => {
    if (mouseDown && state === 'PULLING' && !quickPullCb) {
        if (pullProgress >= 0.95) changeState('BURST');
        else if (pullProgress > 0) snapBackAnimation();
        else { state = 'IDLE'; scene3d.resetToIdle(); titleEl.classList.add('visible'); hintEl.classList.add('visible'); }
    }
    mouseDown = false;
});

canvas.addEventListener('mouseleave', () => {
    if (mouseDown && state === 'PULLING' && !quickPullCb && pullProgress > 0) snapBackAnimation();
    mouseDown = false;
});

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'Enter') {
        e.preventDefault();
        if (state === 'IDLE') quickPullAnimation();
        else if (state === 'CARD_DISPLAY') changeState('IDLE');
    }
});

canvas.addEventListener('wheel', (e) => {
    if (e.deltaY < -30 && state === 'IDLE') quickPullAnimation();
}, { passive: true });

// ============================================================
// MAIN LOOP
// ============================================================
function frame(now) {
    if (!startTime) startTime = now;
    const prevGlobal = globalTime;
    globalTime = (now - startTime) / 1000;
    const dt = globalTime - prevGlobal;
    stateTime = globalTime - stateStartGlobal;

    // State updates
    if (snapBackCb) snapBackCb();
    if (quickPullCb) quickPullCb();

    // Sync pull progress to 3D scene
    scene3d.pullProgress = pullProgress;

    // Iteration 9: guard first-frame dt=0
    if (dt <= 0 || dt > 0.1) { requestAnimationFrame(frame); return; }

    // State-specific logic
    switch (state) {
        case 'IDLE':
            if (Math.random() < 0.12) scene3d.spawnSparkle(null);
            break;
        case 'PULLING':
            // Iteration 6: only spawn sparkles while circle is visible
            if (Math.random() < 0.1 + pullProgress * 0.5) {
                scene3d.spawnSparkle(null);
            }
            break;
        case 'BURST':
            // Iteration 6: no sparkles during burst (circle hidden)
            if (stateTime > CONFIG.burstDuration) changeState('REVEAL');
            break;
        case 'REVEAL':
            if (stateTime > CONFIG.revealDuration) changeState('CARD_DISPLAY');
            break;
        case 'CARD_DISPLAY':
            break;
    }

    // Render 3D scene
    scene3d.update(dt);

    updateMultiPullButton();
    requestAnimationFrame(frame);
}

// Start
titleEl.classList.add('visible');
hintEl.classList.add('visible');
requestAnimationFrame(frame);
