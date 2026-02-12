# 福 - Chinese Fortune Character Interactive Experience

这是一个完全复刻 [https://underwater008.github.io/fu/](https://underwater008.github.io/fu/) 的交互式中文"福"字体验项目。

## 项目特点

- 🎨 **3D 粒子效果** - 使用 Three.js 实现的 GPU 加速粒子系统
- ✨ **精美书法字体** - 集成 7 种中国传统书法字体
- 🎆 **烟花动画** - 真实的物理烟花效果
- 📱 **响应式设计** - 支持桌面和移动设备
- 🎭 **状态机动画** - 流畅的四阶段交互体验

## 技术栈

### 核心依赖
- **Three.js** (^0.164.1) - 3D 渲染引擎
- **GSAP** (^3.12.5) - 高性能动画库
- **Vite** (^5.4.11) - 现代构建工具

### 其他库
- **lil-gui** - 调试控制面板
- **lottie-web** - 矢量动画
- **stats-js** - 性能监控

## 项目结构

```
.
├── fu/
│   ├── index.html      # 福字体验页面
│   └── fu.js           # 核心 JavaScript 逻辑 (75KB+)
├── index.html          # 主页入口
├── package.json        # 项目配置
├── vite.config.js      # Vite 构建配置
└── README.md           # 项目文档
```

## 快速开始

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run dev
```

访问 `http://localhost:5173` 即可体验项目。

### 构建生产版本
```bash
npm run build
```

### 预览生产版本
```bash
npm run preview
```

## 使用说明

### 交互方式

#### 桌面端
- **鼠标拖拽** - 垂直拖动触发状态转换
- **鼠标滚轮** - 向上滚动切换状态
- **空格键/上箭头** - 触发向上滑动
- **左/右箭头** - 切换字体样式

#### 移动端
- **垂直滑动** (>50px) - 触发状态转换
- **水平滑动** (>50px) - 切换字体
- **悬停** - 显示字符含义提示

### 四个交互阶段

1. **Arrival (到达)** - 书法"福"字淡入,带发光效果
2. **Draw (抽签)** - 字符爆炸、散开、重组动画
3. **Fortune (运势)** - 显示"大吉"字符集群,可悬停查看含义
4. **Fireworks (烟花)** - 绚丽烟花效果庆祝

## 核心功能

### 粒子系统
- 最多 4000 个粒子实例
- GPU 实例化渲染
- 自定义 Shader 材质
- 纹理图集优化 (20×20 网格)

### 动画效果
- 缓动函数插值
- 物理模拟 (重力、阻力)
- 颜色插值与过渡
- 粒子轨迹系统

### 字体管理
- 7 种书法字体动态加载
- 字体变形过渡效果
- 随机字体选择
- Canvas 字符烘焙

### 祝福系统
- 100+ 吉祥汉字库
- 9 大类别配色方案
- 中英文祝福语映射
- 交互式提示工具

## 性能优化

- 实例化网格减少 Draw Call
- 紧凑数组剔除避免内存分配
- 设备像素比限制 (最大 2x)
- 视锥剔除禁用 (粒子体积小)
- 加法混合减少过度绘制

## 浏览器兼容性

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

需要支持 WebGL 2.0 和 ES6 模块。

## 原始项目

本项目完全复刻自:
- 原作者: Underwater008
- 原始仓库: [Underwater008.github.io](https://github.com/Underwater008/Underwater008.github.io)
- 在线演示: [https://underwater008.github.io/fu/](https://underwater008.github.io/fu/)

## 许可证

遵循原项目许可证。本项目仅用于学习和研究目的。

---

祝你好运! 🎊
