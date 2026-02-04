# ❄️ Glacier

<p align="center">
  <img src="demo/public/favicon.svg" alt="Glacier Logo" width="120" height="120">
</p>

<p align="center">
  <strong>Beautiful Liquid Glass UI for Tailwind CSS</strong>
</p>

<p align="center">
  Create stunning Apple-style interfaces with realistic liquid glass, frosted glass, refraction, fresnel reflections, and glare effects — all as simple Tailwind utilities.
</p>

<p align="center">
  <a href="https://NagusameCS.github.io/Glacier">🌐 Live Demo</a> •
  <a href="#installation">📦 Installation</a> •
  <a href="#usage">🚀 Usage</a> •
  <a href="#utilities">📚 Utilities</a>
</p>

---

## ✨ Features

- **🔮 Liquid Glass** — Realistic liquid glass with refraction, dispersion, and fresnel effects
- **❄️ Frosted Glass** — Beautiful frosted glass with customizable blur and opacity
- **✨ Glare Effects** — Dynamic glare with angle control for realistic highlights
- **🎨 Color Tints** — Multiple tint colors including primary, secondary, success, warning, and danger
- **🌊 Fresnel Reflection** — Edge lighting that responds to viewing angle
- **💫 Animations** — Smooth transitions, hover effects, and micro-interactions
- **🎛️ Fine Control** — Adjust blur, saturation, opacity, shadows, and more
- **📦 Components** — Pre-built buttons, cards, inputs, modals, and more
- **🌙 Dark Mode** — Optimized for both light and dark themes

## 📦 Installation

```bash
npm install glacier-css
```

Or with yarn:

```bash
yarn add glacier-css
```

Or with pnpm:

```bash
pnpm add glacier-css
```

## 🚀 Usage

### 1. Add to your Tailwind config

```javascript
// tailwind.config.js
import glacier from 'glacier-css';

export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  plugins: [
    glacier({
      prefix: 'glacier', // optional, default: 'glacier'
    }),
  ],
}
```

### 2. Import the styles (optional, for animations)

```css
/* main.css */
@import 'glacier-css/styles';
```

### 3. Start using Glacier classes

```html
<div class="glacier-liquid glacier-animate glacier-hover-brighten p-6 rounded-2xl">
  <h2 class="text-white font-semibold">Hello, Glacier!</h2>
  <p class="text-white/70">Beautiful liquid glass effects.</p>
</div>
```

## 📚 Utilities

### Base Glass Effects

| Class | Description |
|-------|-------------|
| `glacier-glass` | Base glass effect with backdrop blur |
| `glacier-liquid` | Full liquid glass effect with all features |
| `glacier-liquid-refract` | Liquid glass with refraction effect |
| `glacier-liquid-fresnel` | Liquid glass with fresnel edge lighting |
| `glacier-liquid-glare` | Liquid glass with glare highlight |
| `glacier-frosted` | Standard frosted glass |
| `glacier-frosted-light` | Light frosted glass (white tint) |
| `glacier-frosted-dark` | Dark frosted glass (black tint) |

### Blur Control

| Class | Description |
|-------|-------------|
| `glacier-blur-none` | No blur |
| `glacier-blur-xs` | Extra small blur (2px) |
| `glacier-blur-sm` | Small blur (4px) |
| `glacier-blur-md` | Medium blur (8px) |
| `glacier-blur-lg` | Large blur (12px) |
| `glacier-blur-xl` | Extra large blur (20px) |
| `glacier-blur-2xl` | 2X large blur (32px) |
| `glacier-blur-3xl` | 3X large blur (48px) |

### Saturation

| Class | Description |
|-------|-------------|
| `glacier-saturate-0` | No saturation |
| `glacier-saturate-50` | 50% saturation |
| `glacier-saturate-100` | Normal saturation |
| `glacier-saturate-150` | 150% saturation |
| `glacier-saturate-200` | 200% saturation |

### Color Tints

| Class | Description |
|-------|-------------|
| `glacier-tint-white` | White tint |
| `glacier-tint-black` | Black tint |
| `glacier-tint-primary` | Primary color tint (blue) |
| `glacier-tint-secondary` | Secondary color tint (purple) |
| `glacier-tint-success` | Success color tint (green) |
| `glacier-tint-warning` | Warning color tint (yellow) |
| `glacier-tint-danger` | Danger color tint (red) |
| `glacier-tint-info` | Info color tint (cyan) |

### Borders & Shadows

| Class | Description |
|-------|-------------|
| `glacier-border` | Glass border |
| `glacier-border-{opacity}` | Border with custom opacity (0-100) |
| `glacier-shadow` | Glass shadow |
| `glacier-shadow-{size}` | Shadow size (sm, md, lg, xl) |

### Glare Effects

| Class | Description |
|-------|-------------|
| `glacier-glare` | Enable glare effect |
| `glacier-glare-light` | Light glare intensity |
| `glacier-glare-medium` | Medium glare intensity |
| `glacier-glare-strong` | Strong glare intensity |
| `glacier-glare-tl` | Glare from top-left |
| `glacier-glare-tr` | Glare from top-right |
| `glacier-glare-bl` | Glare from bottom-left |
| `glacier-glare-br` | Glare from bottom-right |

### Fresnel Effects

| Class | Description |
|-------|-------------|
| `glacier-fresnel` | Base fresnel effect |
| `glacier-fresnel-light` | Light fresnel intensity |
| `glacier-fresnel-medium` | Medium fresnel intensity |
| `glacier-fresnel-strong` | Strong fresnel intensity |

### Animations & Interactions

| Class | Description |
|-------|-------------|
| `glacier-animate` | Enable smooth transitions |
| `glacier-hover-brighten` | Brighten on hover |
| `glacier-hover-lift` | Lift/elevate on hover |
| `glacier-hover-glow` | Glow on hover |
| `glacier-active-press` | Press effect when active/clicked |

### Pre-styled Components

| Class | Description |
|-------|-------------|
| `glacier-card` | Card component |
| `glacier-panel` | Panel component with stronger effects |
| `glacier-modal` | Modal/dialog component |
| `glacier-window` | Window/container component |
| `glacier-notification` | Notification/toast component |

## 🎨 Examples

### Button

```html
<button class="glacier-liquid glacier-animate glacier-hover-brighten glacier-tint-primary px-6 py-3 rounded-2xl text-white font-medium">
  Click me
</button>
```

### Card

```html
<div class="glacier-card">
  <h3 class="text-lg font-semibold text-white">Card Title</h3>
  <p class="text-white/70">Card content goes here.</p>
</div>
```

### Input

```html
<input
  type="text"
  placeholder="Enter text..."
  class="glacier-glass glacier-blur-md glacier-border w-full px-4 py-3 rounded-xl text-white placeholder-white/50 bg-white/5 focus:outline-none focus:ring-2 focus:ring-white/30"
/>
```

### Alert

```html
<div class="glacier-liquid glacier-tint-success glacier-border px-4 py-3 rounded-xl flex items-center gap-3">
  <span>✅</span>
  <p class="text-white">Operation completed successfully!</p>
</div>
```

### Modal

```html
<div class="glacier-modal max-w-md w-full p-6">
  <h2 class="text-xl font-semibold text-white mb-4">Modal Title</h2>
  <p class="text-white/70 mb-6">Modal content goes here.</p>
  <div class="flex gap-3 justify-end">
    <button class="glacier-glass bg-white/5 px-4 py-2 rounded-xl text-white">Cancel</button>
    <button class="glacier-liquid glacier-tint-primary px-4 py-2 rounded-xl text-white">Confirm</button>
  </div>
</div>
```

## 🛠️ Configuration

You can customize Glacier by passing options to the plugin:

```javascript
glacier({
  // Custom prefix (default: 'glacier')
  prefix: 'glass',
  
  // Custom colors
  colors: {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#06b6d4',
  },
  
  // Custom blur values
  blur: {
    xs: '2px',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '20px',
  },
})
```

## 🎯 Browser Support

Glacier uses `backdrop-filter` which is supported in all modern browsers:

- ✅ Chrome 76+
- ✅ Firefox 103+
- ✅ Safari 9+
- ✅ Edge 79+

## 📝 CSS Variables

Glacier uses CSS custom properties that you can override:

```css
:root {
  --glacier-blur: 12px;
  --glacier-saturation: 1.8;
  --glacier-tint-opacity: 0.1;
  --glacier-border-opacity: 0.2;
  --glacier-shadow-opacity: 0.1;
  --glacier-fresnel: 0.3;
  --glacier-glare: 0.15;
  --glacier-glare-angle: 135deg;
  --glacier-transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

<p align="center">
  Made with ❄️ for the web
</p>