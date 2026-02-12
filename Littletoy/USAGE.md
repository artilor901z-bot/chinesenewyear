# 使用指南 / Usage Guide

## 快速开始 / Quick Start

### 1. 启动开发服务器 / Start Development Server
```bash
npm run dev
```

服务器会在 `http://localhost:5173` 启动。

### 2. 访问页面 / Access Pages
- **主页**: [http://localhost:5173](http://localhost:5173)
- **福字体验**: [http://localhost:5173/fu/](http://localhost:5173/fu/)

## 项目文件清单 / Project Files

```
d:\Littletoy/
├── fu/
│   ├── index.html              # 福字页面入口
│   ├── fu.js                   # 主要 JavaScript 逻辑 (75KB)
│   ├── particleVertex.glsl     # 粒子顶点着色器
│   └── particleFragment.glsl   # 粒子片段着色器
├── index.html                  # 项目主页
├── package.json                # 依赖配置
├── vite.config.js              # Vite 构建配置
├── README.md                   # 项目说明
└── USAGE.md                    # 本文件
```

## 技术细节 / Technical Details

### 依赖库 / Dependencies

| 库名 | 版本 | 用途 |
|------|------|------|
| three | ^0.164.1 | 3D 渲染引擎 |
| gsap | ^3.12.5 | 动画库 |
| lil-gui | ^0.19.2 | 调试面板 |
| lottie-web | ^5.12.2 | 矢量动画 |
| stats-js | ^1.0.1 | 性能监控 |
| vite | ^5.4.11 | 构建工具 |
| sass | ^1.77.2 | CSS 预处理器 |

### 字体资源 / Fonts
项目使用以下中文书法字体：

**Google Fonts:**
- Liu Jian Mao Cao (柳建毛草)
- Ma Shan Zheng (马善政)
- Zhi Mang Xing (志芒星)

**Chinese Fonts CDN:**
- LongCang (龙藏)
- ZCOOL XiaoWei (站酷小薇)
- ZCOOL QingKeHuangYou (站酷庆科黄油)
- ZCOOL KuaiLe (站酷快乐)

### 渲染技术 / Rendering

#### WebGL Shaders
- **Vertex Shader**: 实例化广告牌粒子,永远朝向相机
- **Fragment Shader**: 采样字符纹理图集,应用颜色和透明度

#### 粒子系统
- 最大粒子数: 4000
- 纹理图集: 20×20 网格 (400 字符容量)
- 每字符分辨率: 64px
- 渲染模式: GPU 实例化

#### 状态机 / State Machine
1. **Arrival** - 书法字淡入
2. **Draw** - 爆炸动画
3. **Fortune** - 显示运势
4. **Fireworks** - 烟花效果

## 交互操作 / Interactions

### 桌面端 / Desktop

| 操作 | 功能 |
|------|------|
| 垂直拖拽鼠标 | 状态切换 |
| 向上滚轮 | 触发下一状态 |
| 空格键 | 向上滑动 |
| ↑ 方向键 | 向上滑动 |
| ← / → 方向键 | 切换字体 |
| 鼠标悬停 | 显示字符含义 |

### 移动端 / Mobile

| 操作 | 功能 |
|------|------|
| 垂直滑动 (>50px) | 状态切换 |
| 水平滑动 (>50px) | 切换字体 |
| 触摸悬停 | 显示提示 |

## 构建与部署 / Build & Deploy

### 开发模式 / Development
```bash
npm run dev
```

### 生产构建 / Production Build
```bash
npm run build
```
输出到 `dist/` 目录

### 预览构建 / Preview Build
```bash
npm run preview
```

### 部署到 GitHub Pages
1. 运行构建: `npm run build`
2. 将 `dist/` 目录内容推送到 `gh-pages` 分支
3. 在仓库设置中启用 GitHub Pages

## 性能优化建议 / Performance Tips

- ✅ 现代浏览器 (Chrome 90+, Firefox 88+, Safari 14+)
- ✅ 支持 WebGL 2.0
- ✅ 硬件加速已启用
- ⚠️ 移动设备可能需要降低粒子数量
- ⚠️ 高 DPI 屏幕已自动限制到 2x

## 常见问题 / FAQ

### Q: 页面加载缓慢？
A: 字体和纹理需要时间加载。首次访问会有网络请求，后续会使用浏览器缓存。

### Q: 粒子效果卡顿？
A: 检查浏览器是否启用硬件加速。移动设备性能有限是正常的。

### Q: 字体未正确显示？
A: 确保网络连接正常,字体从 Google Fonts 和 unpkg CDN 加载。

### Q: 如何修改配置？
A: 编辑 `fu/fu.js` 中的 `CONFIG` 对象。

## 调试 / Debugging

开启浏览器开发者工具 (F12):
- **Console**: 查看日志和错误
- **Network**: 检查资源加载
- **Performance**: 分析性能瓶颈

## 原始项目 / Original Project

- 作者: Underwater008
- 仓库: https://github.com/Underwater008/Underwater008.github.io
- 在线: https://underwater008.github.io/fu/

---

享受这个独特的中国福字交互体验！✨
