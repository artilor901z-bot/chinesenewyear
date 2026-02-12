// ============================================================
// 收集册 — Collection Album
// ============================================================

const CALLI_FONTS = [
    '"Zhi Mang Xing"',
    '"Liu Jian Mao Cao"',
    '"Ma Shan Zheng"',
    '"TsangerZhoukeZhengdabangshu"',
    '"hongleixingshu"',
    '"qiantubifengshouxieti"',
    '"峄山碑篆体"',
];

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
    { stars: 6, label: '天赐鸿福', labelEn: 'Heavenly Fortune', categories: [0], color: '#FFD700', glow: 'rgba(255,215,0,0.5)' },
    { stars: 5, label: '吉星高照', labelEn: 'Auspicious Stars', categories: [7, 8], color: '#FFA500', glow: 'rgba(255,165,0,0.5)' },
    { stars: 4, label: '福泽绵长', labelEn: 'Enduring Blessings', categories: [4, 5], color: '#FF69B4', glow: 'rgba(255,105,180,0.5)' },
    { stars: 3, label: '万事如意', labelEn: 'All Wishes Fulfilled', categories: [2, 6], color: '#00FF9F', glow: 'rgba(0,255,159,0.5)' },
    { stars: 2, label: '迎春纳福', labelEn: 'Welcoming Fortune', categories: [1, 3], color: '#FF6644', glow: 'rgba(255,102,68,0.5)' },
];

const chosenFont = CALLI_FONTS[Math.floor(Math.random() * CALLI_FONTS.length)];

// --- Build a map: char → { categoryIndex, tier } ---
const charCategoryMap = {};
BLESSING_CATEGORIES.forEach((cat, ci) => {
    for (const ch of cat.chars) {
        charCategoryMap[ch] = ci;
    }
});

function getTierForCategory(ci) {
    for (const tier of RARITY_TIERS) {
        if (tier.categories.includes(ci)) return tier;
    }
    return RARITY_TIERS[RARITY_TIERS.length - 1];
}

// --- Load collection data ---
function loadCollection() {
    try { return JSON.parse(localStorage.getItem('gacha_collection') || '{}'); } catch(e) { return {}; }
}
function loadStats() {
    try { return JSON.parse(localStorage.getItem('gacha_stats') || '{"totalDraws":0}'); } catch(e) { return { totalDraws: 0 }; }
}

// --- Count totals ---
function countTotals() {
    let totalChars = 0;
    BLESSING_CATEGORIES.forEach(cat => { totalChars += cat.chars.length; });
    return totalChars;
}

// --- Render ---
function render() {
    const collection = loadCollection();
    const stats = loadStats();
    const totalChars = countTotals();
    const collectedCount = Object.keys(collection).length;

    // Progress
    document.getElementById('progress-text').textContent = `${collectedCount} / ${totalChars} 已收集`;
    document.getElementById('draw-count').textContent = `共抽卡 ${stats.totalDraws} 次`;
    const pct = totalChars > 0 ? (collectedCount / totalChars * 100) : 0;
    document.getElementById('progress-fill').style.width = `${pct}%`;

    const content = document.getElementById('content');

    // Empty state
    if (stats.totalDraws === 0) {
        content.innerHTML = `
            <div class="empty-state">
                <div class="big-char">福</div>
                <div>还没有开始收集</div>
                <div style="font-size:0.75rem;margin-top:4px;opacity:0.5">No cards collected yet</div>
                <a href="../gacha/">去抽卡 · Start Drawing</a>
            </div>
        `;
        return;
    }

    let html = '';

    BLESSING_CATEGORIES.forEach((cat, ci) => {
        const tier = getTierForCategory(ci);
        const color = `rgb(${cat.r}, ${cat.g}, ${cat.b})`;
        const chars = [...cat.chars];
        const catCollected = chars.filter(ch => collection[ch]).length;

        html += `<div class="category">`;
        html += `<div class="category-header">`;
        html += `<div class="category-dot" style="background:${color};box-shadow:0 0 6px ${color}"></div>`;
        html += `<span class="category-name" style="color:${color}">${cat.name}</span>`;
        html += `<span class="category-name-en">${cat.nameEn}</span>`;
        html += `<span class="category-count" style="color:${color}">${catCollected}/${chars.length}</span>`;
        html += `</div>`;

        html += `<div class="card-grid">`;
        chars.forEach(ch => {
            const data = collection[ch];
            const isCollected = !!data;
            const cls = isCollected ? 'collected' : 'locked';
            const countBadge = data && data.count > 1 ? `<div class="card-count">×${data.count}</div>` : '';

            html += `<div class="card-cell ${cls}"
                style="--cat-color:${color};--cat-r:${cat.r};--cat-g:${cat.g};--cat-b:${cat.b}"
                ${isCollected ? `data-char="${ch}" data-cat="${ci}"` : ''}>
                <div class="card-char" style="font-family:${chosenFont},serif">${isCollected ? ch : '?'}</div>
                ${countBadge}
            </div>`;
        });
        html += `</div></div>`;
    });

    content.innerHTML = html;

    // Attach click handlers to collected cards
    content.querySelectorAll('.card-cell.collected').forEach(cell => {
        cell.addEventListener('click', () => {
            const ch = cell.dataset.char;
            const ci = parseInt(cell.dataset.cat);
            showModal(ch, ci, collection[ch]);
        });
    });
}

// --- Modal ---
const modal = document.getElementById('modal');
const modalCard = document.getElementById('modal-card');

function showModal(ch, ci, data) {
    const cat = BLESSING_CATEGORIES[ci];
    const tier = getTierForCategory(ci);
    const blessing = CHAR_BLESSINGS[ch] || { phrase: ch + '运亨通', english: 'Fortune and blessings upon you' };
    const color = `rgb(${cat.r}, ${cat.g}, ${cat.b})`;

    modalCard.style.setProperty('--modal-color', tier.color);
    modalCard.style.setProperty('--modal-glow', tier.glow);

    document.getElementById('modal-stars').textContent = '★'.repeat(tier.stars) + '☆'.repeat(6 - tier.stars);
    document.getElementById('modal-stars').style.color = tier.color;
    document.getElementById('modal-category').textContent = `${cat.name} · ${cat.nameEn}`;
    document.getElementById('modal-category').style.color = color;

    const charEl = document.getElementById('modal-char');
    charEl.textContent = ch;
    charEl.style.fontFamily = `${chosenFont}, serif`;

    document.getElementById('modal-phrase').textContent = blessing.phrase;
    document.getElementById('modal-phrase').style.color = tier.color;
    document.getElementById('modal-english').textContent = blessing.english;

    const firstDate = data.firstTime ? new Date(data.firstTime).toLocaleDateString('zh-CN') : '—';
    document.getElementById('modal-meta').innerHTML =
        `${tier.label} · ${tier.labelEn}<br>` +
        `获得次数: ${data.count} · 首次获得: ${firstDate}`;

    modal.classList.add('visible');
}

function hideModal() {
    modal.classList.remove('visible');
}

document.getElementById('modal-close').addEventListener('click', hideModal);
modal.addEventListener('click', (e) => {
    if (e.target === modal) hideModal();
});
document.addEventListener('keydown', (e) => {
    if (e.code === 'Escape' && modal.classList.contains('visible')) hideModal();
});

// --- Init ---
render();
