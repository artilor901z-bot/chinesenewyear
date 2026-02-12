// ============================================================
// scene3d.js — Three.js 3D Gacha Scene (Magic Circle, Particles, Bloom)
// ============================================================
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// ---- Helpers ----

function makeTextTexture(text, size, color, font = 'serif') {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const cx = c.getContext('2d');
    cx.clearRect(0, 0, size, size);
    cx.font = `bold ${size * 0.65}px ${font}`;
    cx.textAlign = 'center';
    cx.textBaseline = 'middle';
    cx.fillStyle = color;
    cx.shadowColor = color;
    cx.shadowBlur = size * 0.05;
    cx.fillText(text, size / 2, size / 2);
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
}

function makeRing(radius, tube = 0.025, color = 0xffd700, segments = 128) {
    const geo = new THREE.TorusGeometry(radius, tube, 12, segments);
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 });
    return new THREE.Mesh(geo, mat);
}

function makeCharSprite(char, size, color, font) {
    const tex = makeTextTexture(char, 128, color, font);
    const mat = new THREE.SpriteMaterial({
        map: tex, transparent: true, opacity: 0.7,
        blending: THREE.NormalBlending, depthWrite: false,
    });
    const sp = new THREE.Sprite(mat);
    sp.scale.setScalar(size);
    return sp;
}

// ---- Taiji (太极) texture: yin-yang drawn on canvas ----
function makeTaijiTexture(size, darkColor = '#1a0505', lightColor = '#FFD700') {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const cx = c.getContext('2d');
    const r = size / 2;
    cx.clearRect(0, 0, size, size);

    // Full circle background (dark half)
    cx.beginPath();
    cx.arc(r, r, r * 0.95, 0, Math.PI * 2);
    cx.fillStyle = darkColor;
    cx.fill();

    // Light half (right side)
    cx.beginPath();
    cx.arc(r, r, r * 0.95, -Math.PI / 2, Math.PI / 2);
    cx.fillStyle = lightColor;
    cx.fill();

    // Upper S-curve bulge (light)
    cx.beginPath();
    cx.arc(r, r * 0.5, r * 0.475, 0, Math.PI * 2);
    cx.fillStyle = lightColor;
    cx.fill();

    // Lower S-curve bulge (dark)
    cx.beginPath();
    cx.arc(r, r * 1.5, r * 0.475, 0, Math.PI * 2);
    cx.fillStyle = darkColor;
    cx.fill();

    // Small dot in upper (dark dot in light area)
    cx.beginPath();
    cx.arc(r, r * 0.5, r * 0.12, 0, Math.PI * 2);
    cx.fillStyle = darkColor;
    cx.fill();

    // Small dot in lower (light dot in dark area)
    cx.beginPath();
    cx.arc(r, r * 1.5, r * 0.12, 0, Math.PI * 2);
    cx.fillStyle = lightColor;
    cx.fill();

    // Outer glow ring
    cx.beginPath();
    cx.arc(r, r, r * 0.95, 0, Math.PI * 2);
    cx.strokeStyle = lightColor;
    cx.lineWidth = size * 0.012;
    cx.shadowColor = lightColor;
    cx.shadowBlur = size * 0.02;
    cx.stroke();

    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
}

// ---- Bagua trigram texture (3 lines: solid/broken) ----
function makeBaguaTexture(size, trigramBits, color = '#FFD700') {
    // trigramBits: 3-element array, 1=solid, 0=broken (bottom to top)
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const cx = c.getContext('2d');
    cx.clearRect(0, 0, size, size);
    const lineH = size * 0.1;
    const gap = size * 0.08;
    const w = size * 0.6;
    const startY = size / 2 + (lineH + gap);
    cx.fillStyle = color;
    cx.shadowColor = color;
    cx.shadowBlur = size * 0.03;
    for (let i = 0; i < 3; i++) {
        const y = startY - i * (lineH + gap);
        if (trigramBits[i] === 1) {
            // Solid line
            cx.fillRect((size - w) / 2, y, w, lineH);
        } else {
            // Broken line (gap in middle)
            const seg = w * 0.4;
            cx.fillRect((size - w) / 2, y, seg, lineH);
            cx.fillRect(size / 2 + w * 0.1, y, seg, lineH);
        }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
}

// 八卦 trigrams: 乾坤离坎震巽艮兑 (binary representations bottom-to-top)
const BAGUA_DATA = [
    { name: '乾', bits: [1, 1, 1] },
    { name: '坤', bits: [0, 0, 0] },
    { name: '离', bits: [1, 0, 1] },
    { name: '坎', bits: [0, 1, 0] },
    { name: '震', bits: [0, 0, 1] },
    { name: '巽', bits: [1, 1, 0] },
    { name: '艮', bits: [1, 0, 0] },
    { name: '兑', bits: [0, 1, 1] },
];
const ORBIT_CHARS = '福禄寿喜财吉';

// ============================================================
export class GachaScene {
    constructor(container, chosenFont = 'serif') {
        this.container = container;
        this.font = chosenFont;
        this.elapsed = 0;
        this.pullProgress = 0;
        this.tierColor = new THREE.Color(1, 0.84, 0);
        this.state = 'IDLE';
        this.burstActive = false;
        this.burstTime = 0;
        this.flashIntensity = 0;
        this.cameraShakeAmt = 0;
        this._baseBG = new THREE.Color(0xCC0000);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        Object.assign(this.renderer.domElement.style, {
            position: 'fixed', top: '0', left: '0', zIndex: '0', touchAction: 'none',
        });
        container.appendChild(this.renderer.domElement);

        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = this._baseBG.clone();
        this.scene.fog = new THREE.FogExp2(0x880000, 0.012);

        // Camera
        this.camera = new THREE.PerspectiveCamera(
            55, window.innerWidth / window.innerHeight, 0.1, 100,
        );
        this.camera.position.set(0, 0, 12);
        this.cameraBase = new THREE.Vector3(0, 0, 12);
        this.cameraTarget = new THREE.Vector3(0, 0, 12);

        // Post-processing
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            0.5, 0.4, 0.55,
        );
        this.composer.addPass(this.bloomPass);
        this.composer.addPass(new OutputPass());

        // Build scene
        this._createMagicCircle();
        this._createBgParticles();
        this._createSparkles();
        this._createBurstSystem();
        this._createFlash();
        this._createExpandRings();
    }

    // ======== TAIJI MAGIC CIRCLE (太极八卦阵) ========
    _createMagicCircle() {
        this.circleGroup = new THREE.Group();
        this.scene.add(this.circleGroup);

        // === Outer ring (ornamental, with Chinese-style notches) ===
        this.outerRing = makeRing(3, 0.035, 0xffd700);
        this.circleGroup.add(this.outerRing);

        // Decorative notches (12 for 12 地支/earthly branches)
        const notchVerts = [];
        for (let i = 0; i < 12; i++) {
            const a = (Math.PI * 2 * i) / 12;
            notchVerts.push(Math.cos(a) * 2.75, Math.sin(a) * 2.75, 0);
            notchVerts.push(Math.cos(a) * 3.0, Math.sin(a) * 3.0, 0);
        }
        const notchGeo = new THREE.BufferGeometry();
        notchGeo.setAttribute('position', new THREE.Float32BufferAttribute(notchVerts, 3));
        this.outerRing.add(new THREE.LineSegments(notchGeo,
            new THREE.LineBasicMaterial({ color: 0xffd700, transparent: true, opacity: 0.6 })));

        // === 八卦 Bagua trigrams on outer ring ===
        this.baguaSprites = [];
        for (let i = 0; i < 8; i++) {
            const tex = makeBaguaTexture(128, BAGUA_DATA[i].bits, '#FFD700');
            const mat = new THREE.SpriteMaterial({
                map: tex, transparent: true, opacity: 0.7,
                blending: THREE.NormalBlending, depthWrite: false,
            });
            const sp = new THREE.Sprite(mat);
            sp.scale.set(0.6, 0.6, 1);
            const a = (Math.PI * 2 * i) / 8;
            sp.position.set(Math.cos(a) * 3.5, Math.sin(a) * 3.5, 0);
            this.outerRing.add(sp);
            this.baguaSprites.push(sp);
        }

        // === Middle ring (tilted, counter-rotating, 祥云/cloud pattern ring) ===
        this.middleRing = makeRing(2.3, 0.025, 0xff4444);
        this.middleRing.rotation.x = 0.3;
        this.circleGroup.add(this.middleRing);

        // Second thin ring for depth
        const innerMiddle = makeRing(2.1, 0.015, 0xff6633, 64);
        innerMiddle.material.opacity = 0.4;
        this.middleRing.add(innerMiddle);

        // Small dots (representing 气/qi nodes)
        for (let i = 0; i < 8; i++) {
            const dot = new THREE.Mesh(
                new THREE.SphereGeometry(0.05, 8, 8),
                new THREE.MeshBasicMaterial({ color: 0xffd700 }),
            );
            const a = (Math.PI * 2 * i) / 8;
            dot.position.set(Math.cos(a) * 2.3, Math.sin(a) * 2.3, 0);
            this.middleRing.add(dot);
        }

        // === Inner ring (differently tilted) ===
        this.innerRing = makeRing(1.6, 0.02, 0xffa500);
        this.innerRing.rotation.x = -0.2;
        this.innerRing.rotation.y = 0.3;
        this.circleGroup.add(this.innerRing);

        // === Taiji (太极阴阳) at center ===
        const taijiTex = makeTaijiTexture(512, '#220808', '#FFD700');
        this.taijiSprite = new THREE.Sprite(new THREE.SpriteMaterial({
            map: taijiTex, transparent: true,
            blending: THREE.NormalBlending, depthWrite: false, opacity: 0.75,
        }));
        this.taijiSprite.scale.set(2.8, 2.8, 1);
        this.circleGroup.add(this.taijiSprite);

        // Center 福 character (on top of taiji) — NormalBlending so it reads clearly
        const fuTex = makeTextTexture('福', 128, '#FFD700', this.font);
        this.centerChar = new THREE.Sprite(new THREE.SpriteMaterial({
            map: fuTex, transparent: true, opacity: 0.85,
            blending: THREE.NormalBlending, depthWrite: false,
        }));
        this.centerChar.scale.setScalar(1.4);
        this.centerChar.position.z = 0.1;
        this.circleGroup.add(this.centerChar);

        // === Orbiting lucky character sprites ===
        this.orbitSprites = [];
        for (let i = 0; i < ORBIT_CHARS.length; i++) {
            const sp = makeCharSprite(ORBIT_CHARS[i], 0.4, '#FFD700', this.font);
            this.circleGroup.add(sp);
            this.orbitSprites.push(sp);
        }

        // === Energy glow (additive sphere behind) ===
        this.energyGlow = new THREE.Mesh(
            new THREE.SphereGeometry(2.8, 32, 32),
            new THREE.MeshBasicMaterial({
                color: 0xffd700, transparent: true, opacity: 0,
                blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide,
            }),
        );
        this.circleGroup.add(this.energyGlow);

        // === Crack lines (appear at high pull) ===
        this.crackLines = [];
        for (let i = 0; i < 9; i++) {
            const seed = i * 137.508;
            const a = seed % (Math.PI * 2);
            const cv = [];
            for (let j = 0; j <= 4; j++) {
                const t = j / 4;
                const r = 0.5 + 2.0 * t;
                const jitter = j === 0 ? 0 : Math.sin(seed * j * 3.7) * 0.15;
                cv.push(Math.cos(a + jitter) * r, Math.sin(a + jitter) * r, 0.05);
            }
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.Float32BufferAttribute(cv, 3));
            const line = new THREE.Line(geo, new THREE.LineBasicMaterial({
                color: 0xfffff0, transparent: true, opacity: 0,
            }));
            this.circleGroup.add(line);
            this.crackLines.push(line);
        }
    }

    _updateMagicCircle() {
        const t = this.elapsed;
        const p = this.pullProgress;
        const speed = 1 + p * 8;

        // Outer ring: slow majestic rotation
        this.outerRing.rotation.z = t * 0.15 * speed;

        // Middle ring: counter-rotate with slight tilt oscillation
        this.middleRing.rotation.z = -t * 0.12 * speed;
        this.middleRing.rotation.x = 0.3 + Math.sin(t * 0.4) * 0.1;

        // Inner ring: different axis
        this.innerRing.rotation.z = t * 0.1 * speed;
        this.innerRing.rotation.x = -0.2 + Math.cos(t * 0.35) * 0.12;
        this.innerRing.rotation.y = 0.3 + Math.sin(t * 0.25) * 0.1;

        // Taiji: slow spin (yin-yang rotation is iconic)
        this.taijiSprite.material.rotation = -t * 0.3 * speed;

        // Center char pulse
        const pulse = 0.9 + 0.1 * Math.sin(t * 1.8);
        this.centerChar.scale.setScalar(1.4 * pulse);

        // Orbiting chars
        for (let i = 0; i < this.orbitSprites.length; i++) {
            const a = (Math.PI * 2 * i) / this.orbitSprites.length + t * 0.15 * speed;
            const bobR = 2.7 + Math.sin(t * 1.5 + i) * 0.15;
            this.orbitSprites[i].position.set(Math.cos(a) * bobR, Math.sin(a) * bobR, 0);
        }

        // Glow based on pull — idle is very dim, pulling lights everything up
        const glow = 0.12 + p * 0.88;
        this.outerRing.material.opacity = 0.5 * glow;
        this.middleRing.material.opacity = 0.35 * glow;
        this.innerRing.material.opacity = 0.4 * glow;
        this.taijiSprite.material.opacity = (0.35 + p * 0.5) * glow;
        this.centerChar.material.opacity = 0.4 + p * 0.5;

        // Orbiting chars dim at idle
        for (let i = 0; i < this.orbitSprites.length; i++) {
            this.orbitSprites[i].material.opacity = 0.25 + p * 0.55;
        }

        // Bagua trigrams dim at idle
        for (let i = 0; i < this.baguaSprites.length; i++) {
            this.baguaSprites[i].material.opacity = 0.2 + p * 0.6;
        }

        // Energy glow — only during pull
        this.energyGlow.material.opacity = p * 0.18;
        this.energyGlow.material.color.copy(this.tierColor);
        this.energyGlow.scale.setScalar(1 + p * 0.6);

        // Cracks
        const crackI = p > 0.5 ? (p - 0.5) * 2 : 0;
        const visCracks = Math.floor(3 + crackI * 6);
        for (let i = 0; i < this.crackLines.length; i++) {
            this.crackLines[i].material.opacity = i < visCracks ? crackI * 0.7 : 0;
        }

        // Bloom ramp (idle ≈0 → pulling up to 2.5)
        this.bloomPass.strength = 0.05 + p * 2.45;

        // Camera zoom on pull
        this.cameraTarget.z = 12 - p * 2.5;
    }

    // ======== BACKGROUND PARTICLES ========
    _createBgParticles() {
        const N = 300;
        const pos = new Float32Array(N * 3);
        this._bgVel = new Float32Array(N * 3);
        this._bgN = N;
        for (let i = 0; i < N; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 35;
            pos[i * 3 + 1] = (Math.random() - 0.5) * 25;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 10 - 5;
            this._bgVel[i * 3 + 1] = -0.003 - Math.random() * 0.005;
            this._bgVel[i * 3] = (Math.random() - 0.5) * 0.002;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        this.bgPoints = new THREE.Points(geo, new THREE.PointsMaterial({
            color: 0xffd700, size: 0.12, transparent: true, opacity: 0.15,
            blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
        }));
        this.scene.add(this.bgPoints);
    }

    _updateBgParticles() {
        const p = this.bgPoints.geometry.attributes.position;
        for (let i = 0; i < this._bgN; i++) {
            p.array[i * 3] += this._bgVel[i * 3] + Math.sin(this.elapsed * 0.3 + i) * 0.0003;
            p.array[i * 3 + 1] += this._bgVel[i * 3 + 1];
            if (p.array[i * 3 + 1] < -14) {
                p.array[i * 3 + 1] = 14;
                p.array[i * 3] = (Math.random() - 0.5) * 35;
            }
        }
        p.needsUpdate = true;
    }

    // ======== SPARKLES ========
    _createSparkles() {
        const MAX = 150;
        this._sparkMax = MAX;
        this._sparkN = 0;
        this._sparkLife = new Float32Array(MAX);
        this._sparkDecay = new Float32Array(MAX);
        const pos = new Float32Array(MAX * 3);
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        this.sparkPoints = new THREE.Points(geo, new THREE.PointsMaterial({
            color: 0xffd700, size: 0.15, transparent: true, opacity: 0.35,
            blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
        }));
        this.scene.add(this.sparkPoints);
    }

    spawnSparkle() {
        // Iteration 5: removed color param — sparkles always gold to avoid shared-material issues
        if (this._sparkN >= this._sparkMax) return;
        const i = this._sparkN++;
        const angle = Math.random() * Math.PI * 2;
        const dist = 2.5 + Math.random() * 1.5 + this.pullProgress * 0.8;
        const p = this.sparkPoints.geometry.attributes.position;
        p.array[i * 3] = Math.cos(angle) * dist;
        p.array[i * 3 + 1] = Math.sin(angle) * dist;
        p.array[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
        this._sparkLife[i] = 0.5 + Math.random() * 0.5;
        this._sparkDecay[i] = 0.015 + Math.random() * 0.01;
        p.needsUpdate = true;
        this.sparkPoints.geometry.setDrawRange(0, this._sparkN);
    }

    _updateSparkles() {
        let w = 0;
        const p = this.sparkPoints.geometry.attributes.position;
        for (let i = 0; i < this._sparkN; i++) {
            this._sparkLife[i] -= this._sparkDecay[i];
            if (this._sparkLife[i] > 0) {
                if (w !== i) {
                    p.array[w * 3] = p.array[i * 3];
                    p.array[w * 3 + 1] = p.array[i * 3 + 1];
                    p.array[w * 3 + 2] = p.array[i * 3 + 2];
                    this._sparkLife[w] = this._sparkLife[i];
                    this._sparkDecay[w] = this._sparkDecay[i];
                }
                w++;
            }
        }
        this._sparkN = w;
        p.needsUpdate = true;
        this.sparkPoints.geometry.setDrawRange(0, this._sparkN);
    }

    // ======== BURST PARTICLES ========
    _createBurstSystem() {
        const MAX = 600;
        this._burstMax = MAX;
        this._burstN = 0;
        this._burstVel = new Float32Array(MAX * 3);
        this._burstLife = new Float32Array(MAX);
        this._burstDecay = new Float32Array(MAX);
        const pos = new Float32Array(MAX * 3);
        const col = new Float32Array(MAX * 3);
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
        this.burstPoints = new THREE.Points(geo, new THREE.PointsMaterial({
            size: 0.22, vertexColors: true, transparent: true, opacity: 0.9,
            blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
        }));
        this.burstPoints.visible = false;
        this.scene.add(this.burstPoints);
    }

    triggerBurst(tier) {
        const count = Math.min(40 + tier.stars * 14, this._burstMax);
        this._burstN = count;
        const [r, g, b] = tier.burstRGB;
        const pos = this.burstPoints.geometry.attributes.position;
        const col = this.burstPoints.geometry.attributes.color;
        for (let i = 0; i < count; i++) {
            pos.array[i * 3] = pos.array[i * 3 + 1] = pos.array[i * 3 + 2] = 0;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const speed = 2 + Math.random() * 7;
            this._burstVel[i * 3] = Math.cos(theta) * Math.sin(phi) * speed;
            this._burstVel[i * 3 + 1] = Math.sin(theta) * Math.sin(phi) * speed;
            this._burstVel[i * 3 + 2] = Math.cos(phi) * speed * 0.4;
            col.array[i * 3] = r / 255;
            col.array[i * 3 + 1] = g / 255;
            col.array[i * 3 + 2] = b / 255;
            this._burstLife[i] = 0.8 + Math.random() * 0.6;
            this._burstDecay[i] = 0.008 + Math.random() * 0.012;
        }
        pos.needsUpdate = true;
        col.needsUpdate = true;
        this.burstPoints.visible = true;
        this.burstPoints.geometry.setDrawRange(0, count);
        this.burstActive = true;
        this.burstTime = 0;

        this.flashIntensity = 1.0;
        this.cameraShakeAmt = 0.35;
        this.circleGroup.visible = false;
        this.triggerExpandRings(tier.burstRGB);
    }

    _updateBurst(dt) {
        if (!this.burstActive) return;
        this.burstTime += dt;
        const pos = this.burstPoints.geometry.attributes.position;
        let alive = 0;
        for (let i = 0; i < this._burstN; i++) {
            if (this._burstLife[i] <= 0) continue;
            alive++;
            this._burstVel[i * 3] *= 0.975;
            this._burstVel[i * 3 + 1] *= 0.975;
            this._burstVel[i * 3 + 1] -= 0.025;
            this._burstVel[i * 3 + 2] *= 0.975;
            pos.array[i * 3] += this._burstVel[i * 3] * dt * 60;
            pos.array[i * 3 + 1] += this._burstVel[i * 3 + 1] * dt * 60;
            pos.array[i * 3 + 2] += this._burstVel[i * 3 + 2] * dt * 60;
            this._burstLife[i] -= this._burstDecay[i];
        }
        pos.needsUpdate = true;
        this.burstPoints.material.opacity = alive > 0 ? 0.85 : 0;
        if (alive === 0) {
            this.burstActive = false;
            this.burstPoints.visible = false;
        }
    }

    // ======== FLASH ========
    _createFlash() {
        this.flashMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(120, 120),
            new THREE.MeshBasicMaterial({
                color: 0xffffff, transparent: true, opacity: 0,
                blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false,
            }),
        );
        this.flashMesh.renderOrder = 999;
        this.scene.add(this.flashMesh);
    }

    // ======== EXPANDING RINGS ========
    _createExpandRings() {
        this.expandRings = [];
        for (let i = 0; i < 3; i++) {
            const ring = makeRing(0.1, 0.025, 0xffd700);
            ring.material.blending = THREE.AdditiveBlending;
            ring.material.depthWrite = false;
            ring.visible = false;
            this.scene.add(ring);
            this.expandRings.push({ mesh: ring, time: 0, active: false, delay: i * 0.15 });
        }
    }

    triggerExpandRings(tierRGB) {
        const c = new THREE.Color(tierRGB[0] / 255, tierRGB[1] / 255, tierRGB[2] / 255);
        for (const r of this.expandRings) {
            r.active = true;
            r.time = 0;
            r.mesh.visible = true;
            r.mesh.material.color.copy(c);
            r.mesh.scale.set(1, 1, 1);
        }
    }

    _updateExpandRings(dt) {
        for (const r of this.expandRings) {
            if (!r.active) continue;
            r.time += dt;
            const t = Math.max(0, r.time - r.delay);
            if (t > 0.7) { r.active = false; r.mesh.visible = false; continue; }
            const prog = t / 0.7;
            const s = 0.3 + prog * 9;
            r.mesh.scale.set(s, s, 1);
            r.mesh.material.opacity = (1 - prog) * 0.55;
        }
    }

    // ======== STATE CONTROL ========
    resetToIdle() {
        this.state = 'IDLE';
        this.pullProgress = 0;
        this.circleGroup.visible = true;
        this.burstActive = false;
        this.burstPoints.visible = false;
        this.flashIntensity = 0;
        this.cameraShakeAmt = 0;
        this.cameraTarget.set(0, 0, 12);
        this.bloomPass.strength = 0.05;
        // Iteration 7: restore both background and fog
        this.scene.background.copy(this._baseBG);
        this.scene.fog.color.set(0x880000);
        for (const r of this.expandRings) { r.active = false; r.mesh.visible = false; }
    }

    setDim(amount) {
        // Iteration 7: dim both background and fog together
        const factor = 1 - amount * 0.75;
        const bg = this._baseBG.clone().multiplyScalar(factor);
        this.scene.background.copy(bg);
        this.scene.fog.color.copy(bg);
    }

    // ======== RESIZE ========
    resize() {
        const w = window.innerWidth, h = window.innerHeight;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
        this.composer.setSize(w, h);
        this.bloomPass.setSize(w, h);
    }

    // ======== MAIN UPDATE ========
    update(dt) {
        this.elapsed += dt;

        if (this.circleGroup.visible) this._updateMagicCircle();
        this._updateBgParticles();
        this._updateSparkles();
        this._updateBurst(dt);
        this._updateExpandRings(dt);

        // Iteration 10: Flash always tracks camera, fade when active
        this.flashMesh.position.copy(this.camera.position);
        this.flashMesh.translateZ(-1.5);
        this.flashMesh.quaternion.copy(this.camera.quaternion);
        if (this.flashIntensity > 0) {
            this.flashIntensity = Math.max(0, this.flashIntensity - dt * 2.8);
            this.flashMesh.material.opacity = this.flashIntensity * 0.85;
        } else {
            this.flashMesh.material.opacity = 0;
        }

        // Camera shake
        if (this.cameraShakeAmt > 0.001) {
            this.cameraShakeAmt *= 0.91;
            const s = this.cameraShakeAmt;
            this.camera.position.x = this.cameraTarget.x + (Math.random() - 0.5) * s;
            this.camera.position.y = this.cameraTarget.y + (Math.random() - 0.5) * s;
            this.camera.position.z = this.cameraTarget.z;
        } else {
            this.camera.position.lerp(this.cameraTarget, 0.06);
        }

        // Pull-state micro-shake
        if (this.pullProgress > 0.5 && this.state === 'PULLING') {
            const s = (this.pullProgress - 0.5) * 0.18;
            this.camera.position.x += (Math.random() - 0.5) * s;
            this.camera.position.y += (Math.random() - 0.5) * s;
        }

        this.composer.render();
    }

    // ======== DISPOSE ========
    dispose() {
        this.renderer.dispose();
        this.composer.dispose();
        if (this.renderer.domElement.parentElement) {
            this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
        }
    }
}
