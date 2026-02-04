import { useState } from 'react';

// Icons (inline SVGs for simplicity)
const Icons = {
  GitHub: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5" strokeWidth="2">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  Copy: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  ),
  Sun: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5" strokeWidth="2">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  ),
  Moon: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5" strokeWidth="2">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  ),
  Bell: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5" strokeWidth="2">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  User: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Heart: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  ),
  Star: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  Settings: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5" strokeWidth="2">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  ArrowRight: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5" strokeWidth="2">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  Play: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <polygon points="5 3 19 12 5 21 5 3"/>
    </svg>
  ),
  Pause: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
    </svg>
  ),
  Search: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5" strokeWidth="2">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  Menu: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-6 h-6" strokeWidth="2">
      <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  ),
  X: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  Download: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ),
  Package: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-6 h-6" strokeWidth="2">
      <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
};

// Code display component
function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <pre className="glacier-panel p-4 overflow-x-auto text-sm">
        <code className="text-white/90">{code}</code>
      </pre>
      <button
        onClick={copyToClipboard}
        className="absolute top-3 right-3 glacier-liquid glacier-animate p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copied ? <Icons.Check /> : <Icons.Copy />}
      </button>
    </div>
  );
}

// Section component
function Section({ id, title, description, children }: { 
  id: string; 
  title: string; 
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="py-20">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{title}</h2>
        {description && (
          <p className="text-white/70 text-lg max-w-2xl mx-auto">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

// Main App
function App() {
  const [activeTab, setActiveTab] = useState('liquid');
  const [sliderValue, setSliderValue] = useState(50);
  const [toggleOn, setToggleOn] = useState(false);
  const [checkboxChecked, setCheckboxChecked] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 animate-gradient">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
      </div>

      {/* Navbar */}
      <nav className="glacier-liquid glacier-blur-xl fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 glacier-liquid rounded-xl flex items-center justify-center">
              <Icons.Package />
            </div>
            <span className="text-xl font-bold text-white">Glacier</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-white/70 hover:text-white transition-colors">Features</a>
            <a href="#components" className="text-white/70 hover:text-white transition-colors">Components</a>
            <a href="#examples" className="text-white/70 hover:text-white transition-colors">Examples</a>
            <a href="#install" className="text-white/70 hover:text-white transition-colors">Install</a>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/NagusameCS/Glacier"
              target="_blank"
              rel="noopener noreferrer"
              className="glacier-liquid glacier-animate glacier-hover-brighten p-2 rounded-xl text-white"
            >
              <Icons.GitHub />
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 glacier-liquid px-4 py-2 rounded-full text-sm text-white/80 mb-8">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            v1.0.0 - Now Available
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight">
            Liquid Glass UI
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              for Tailwind CSS
            </span>
          </h1>
          
          <p className="text-xl text-white/70 max-w-3xl mx-auto mb-10">
            Create stunning Apple-style interfaces with realistic liquid glass effects.
            Featuring refraction, fresnel reflections, glare, and frosted glass - all as simple Tailwind utilities.
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
            <a
              href="#install"
              className="glacier-liquid glacier-animate glacier-hover-lift glacier-tint-primary px-8 py-4 rounded-2xl text-white font-semibold inline-flex items-center gap-2"
            >
              Get Started
              <Icons.ArrowRight />
            </a>
            <a
              href="https://github.com/NagusameCS/Glacier"
              target="_blank"
              rel="noopener noreferrer"
              className="glacier-liquid glacier-animate glacier-hover-brighten px-8 py-4 rounded-2xl text-white font-semibold inline-flex items-center gap-2"
            >
              <Icons.GitHub />
              View on GitHub
            </a>
          </div>

          {/* Hero demo card */}
          <div className="glacier-panel max-w-4xl mx-auto p-8">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="glacier-card glacier-animate glacier-hover-lift">
                <div className="w-12 h-12 glacier-liquid glacier-tint-primary rounded-2xl flex items-center justify-center mb-4">
                  <Icons.Star />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Liquid Glass</h3>
                <p className="text-white/60 text-sm">Real refraction and dispersion effects</p>
              </div>
              <div className="glacier-card glacier-animate glacier-hover-lift">
                <div className="w-12 h-12 glacier-liquid glacier-tint-secondary rounded-2xl flex items-center justify-center mb-4">
                  <Icons.Sun />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Frosted Glass</h3>
                <p className="text-white/60 text-sm">Subtle blur with tinted overlays</p>
              </div>
              <div className="glacier-card glacier-animate glacier-hover-lift">
                <div className="w-12 h-12 glacier-liquid glacier-tint-info rounded-2xl flex items-center justify-center mb-4">
                  <Icons.Settings />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Customizable</h3>
                <p className="text-white/60 text-sm">Tweak every parameter with utilities</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-6">
        {/* Features Section */}
        <Section 
          id="features" 
          title="Features"
          description="Everything you need to create stunning glass interfaces"
        >
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '🔮', title: 'Liquid Glass', desc: 'Realistic liquid glass with refraction, dispersion, and fresnel effects' },
              { icon: '❄️', title: 'Frosted Glass', desc: 'Beautiful frosted glass with customizable blur and opacity' },
              { icon: '✨', title: 'Glare Effects', desc: 'Dynamic glare with angle control for realistic highlights' },
              { icon: '🎨', title: 'Color Tints', desc: 'Multiple tint colors including primary, secondary, success, warning, and danger' },
              { icon: '🌊', title: 'Fresnel Reflection', desc: 'Edge lighting that responds to viewing angle' },
              { icon: '💫', title: 'Animations', desc: 'Smooth transitions, hover effects, and micro-interactions' },
              { icon: '🎛️', title: 'Fine Control', desc: 'Adjust blur, saturation, opacity, shadows, and more' },
              { icon: '📦', title: 'Components', desc: 'Pre-built buttons, cards, inputs, modals, and more' },
              { icon: '🌙', title: 'Dark Mode', desc: 'Optimized for both light and dark themes' },
            ].map((feature, i) => (
              <div key={i} className="glacier-card glacier-animate glacier-hover-brighten">
                <span className="text-3xl mb-4 block">{feature.icon}</span>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-white/60 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Glass Types Section */}
        <Section 
          id="glass-types" 
          title="Glass Types"
          description="Choose the perfect glass effect for your design"
        >
          {/* Tabs */}
          <div className="glacier-glass glacier-blur-md glacier-border flex items-center p-1 rounded-2xl bg-white/5 max-w-md mx-auto mb-12">
            {['liquid', 'frosted', 'glare'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-4 py-2 rounded-xl text-white font-medium transition-all ${
                  activeTab === tab 
                    ? 'glacier-liquid' 
                    : 'hover:bg-white/10 text-white/70'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="grid md:grid-cols-3 gap-6">
            {activeTab === 'liquid' && (
              <>
                <div className="glacier-liquid rounded-3xl p-6">
                  <h4 className="text-white font-semibold mb-2">Basic Liquid</h4>
                  <p className="text-white/70 text-sm">glacier-liquid</p>
                </div>
                <div className="glacier-liquid-refract rounded-3xl p-6">
                  <h4 className="text-white font-semibold mb-2">With Refraction</h4>
                  <p className="text-white/70 text-sm">glacier-liquid-refract</p>
                </div>
                <div className="glacier-liquid-fresnel rounded-3xl p-6">
                  <h4 className="text-white font-semibold mb-2">With Fresnel</h4>
                  <p className="text-white/70 text-sm">glacier-liquid-fresnel</p>
                </div>
              </>
            )}
            {activeTab === 'frosted' && (
              <>
                <div className="glacier-frosted rounded-3xl p-6">
                  <h4 className="text-slate-800 font-semibold mb-2">Basic Frosted</h4>
                  <p className="text-slate-600 text-sm">glacier-frosted</p>
                </div>
                <div className="glacier-frosted-light rounded-3xl p-6">
                  <h4 className="text-slate-800 font-semibold mb-2">Light Frosted</h4>
                  <p className="text-slate-600 text-sm">glacier-frosted-light</p>
                </div>
                <div className="glacier-frosted-dark rounded-3xl p-6">
                  <h4 className="text-white font-semibold mb-2">Dark Frosted</h4>
                  <p className="text-white/70 text-sm">glacier-frosted-dark</p>
                </div>
              </>
            )}
            {activeTab === 'glare' && (
              <>
                <div className="glacier-liquid-glare glacier-glare glacier-glare-light glacier-glare-tl rounded-3xl p-6">
                  <h4 className="text-white font-semibold mb-2">Top Left Glare</h4>
                  <p className="text-white/70 text-sm">glacier-glare-tl</p>
                </div>
                <div className="glacier-liquid-glare glacier-glare glacier-glare-medium glacier-glare-tr rounded-3xl p-6">
                  <h4 className="text-white font-semibold mb-2">Top Right Glare</h4>
                  <p className="text-white/70 text-sm">glacier-glare-tr</p>
                </div>
                <div className="glacier-liquid-glare glacier-glare glacier-glare-strong glacier-glare-bl rounded-3xl p-6">
                  <h4 className="text-white font-semibold mb-2">Strong Glare</h4>
                  <p className="text-white/70 text-sm">glacier-glare-strong</p>
                </div>
              </>
            )}
          </div>
        </Section>

        {/* Components Section */}
        <Section 
          id="components" 
          title="Components"
          description="Pre-styled components ready for your next project"
        >
          {/* Buttons */}
          <div className="mb-16">
            <h3 className="text-xl font-semibold text-white mb-6">Buttons</h3>
            <div className="flex flex-wrap gap-4">
              <button className="glacier-liquid glacier-animate glacier-hover-brighten glacier-active-press px-6 py-3 rounded-2xl text-white font-medium">
                Default
              </button>
              <button className="glacier-liquid glacier-animate glacier-hover-lift glacier-tint-primary px-6 py-3 rounded-2xl text-white font-medium">
                Primary
              </button>
              <button className="glacier-liquid glacier-animate glacier-hover-brighten glacier-tint-secondary px-6 py-3 rounded-2xl text-white font-medium">
                Secondary
              </button>
              <button className="glacier-liquid glacier-animate glacier-hover-brighten glacier-tint-success px-6 py-3 rounded-2xl text-white font-medium">
                Success
              </button>
              <button className="glacier-liquid glacier-animate glacier-hover-brighten glacier-tint-warning px-6 py-3 rounded-2xl text-white font-medium">
                Warning
              </button>
              <button className="glacier-liquid glacier-animate glacier-hover-brighten glacier-tint-danger px-6 py-3 rounded-2xl text-white font-medium">
                Danger
              </button>
              <button className="glacier-glass glacier-blur-sm glacier-animate glacier-hover-brighten px-6 py-3 rounded-2xl text-white font-medium bg-white/5 border border-white/10">
                Ghost
              </button>
              <button className="glacier-liquid glacier-animate glacier-hover-brighten p-3 rounded-full text-white">
                <Icons.Heart />
              </button>
              <button className="glacier-liquid glacier-animate glacier-hover-brighten p-3 rounded-full text-white">
                <Icons.Settings />
              </button>
            </div>
          </div>

          {/* Inputs */}
          <div className="mb-16">
            <h3 className="text-xl font-semibold text-white mb-6">Inputs</h3>
            <div className="grid md:grid-cols-2 gap-6 max-w-3xl">
              <div>
                <label className="text-white/70 text-sm mb-2 block">Text Input</label>
                <input
                  type="text"
                  placeholder="Enter your name..."
                  className="glacier-glass glacier-blur-md glacier-border w-full px-4 py-3 rounded-xl text-white placeholder-white/50 bg-white/5 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
                />
              </div>
              <div>
                <label className="text-white/70 text-sm mb-2 block">With Icon</label>
                <div className="relative">
                  <Icons.Search />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="glacier-glass glacier-blur-md glacier-border w-full pl-12 pr-4 py-3 rounded-xl text-white placeholder-white/50 bg-white/5 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50">
                    <Icons.Search />
                  </div>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="text-white/70 text-sm mb-2 block">Textarea</label>
                <textarea
                  placeholder="Write your message..."
                  rows={3}
                  className="glacier-glass glacier-blur-md glacier-border w-full px-4 py-3 rounded-xl text-white placeholder-white/50 bg-white/5 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="mb-16">
            <h3 className="text-xl font-semibold text-white mb-6">Controls</h3>
            <div className="grid md:grid-cols-3 gap-8 max-w-3xl">
              <div>
                <label className="text-white/70 text-sm mb-4 block">Slider: {sliderValue}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sliderValue}
                  onChange={(e) => setSliderValue(Number(e.target.value))}
                  className="w-full h-2 glacier-glass glacier-blur-sm rounded-full appearance-none bg-white/10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg"
                />
              </div>
              <div>
                <label className="text-white/70 text-sm mb-4 block">Toggle</label>
                <button
                  onClick={() => setToggleOn(!toggleOn)}
                  className={`w-12 h-6 rounded-full relative transition-colors ${
                    toggleOn ? 'bg-blue-500/80' : 'bg-white/10'
                  } glacier-border`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform shadow ${
                      toggleOn ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
              <div>
                <label className="text-white/70 text-sm mb-4 block">Checkbox</label>
                <button
                  onClick={() => setCheckboxChecked(!checkboxChecked)}
                  className={`w-6 h-6 rounded-lg glacier-border flex items-center justify-center transition-colors ${
                    checkboxChecked ? 'bg-blue-500/80' : 'bg-white/5'
                  }`}
                >
                  {checkboxChecked && <Icons.Check />}
                </button>
              </div>
            </div>
          </div>

          {/* Cards */}
          <div className="mb-16">
            <h3 className="text-xl font-semibold text-white mb-6">Cards</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="glacier-card">
                <h4 className="text-lg font-semibold text-white mb-2">Standard Card</h4>
                <p className="text-white/60 text-sm mb-4">A basic glass card component with subtle effects.</p>
                <button className="glacier-liquid glacier-animate glacier-hover-brighten px-4 py-2 rounded-xl text-white text-sm font-medium">
                  Learn More
                </button>
              </div>
              <div className="glacier-card glacier-animate glacier-hover-lift cursor-pointer">
                <h4 className="text-lg font-semibold text-white mb-2">Hoverable Card</h4>
                <p className="text-white/60 text-sm mb-4">Hover me to see the lift effect!</p>
                <div className="flex items-center gap-2 text-blue-400 text-sm font-medium">
                  Explore <Icons.ArrowRight />
                </div>
              </div>
              <div className="glacier-panel">
                <h4 className="text-lg font-semibold text-white mb-2">Panel Component</h4>
                <p className="text-white/60 text-sm mb-4">A more prominent panel with stronger effects.</p>
                <div className="flex gap-2">
                  <button className="glacier-liquid glacier-animate glacier-hover-brighten glacier-tint-primary px-4 py-2 rounded-xl text-white text-sm font-medium">
                    Accept
                  </button>
                  <button className="glacier-glass bg-white/5 glacier-animate glacier-hover-brighten px-4 py-2 rounded-xl text-white text-sm font-medium">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Alerts & Badges */}
          <div className="mb-16">
            <h3 className="text-xl font-semibold text-white mb-6">Alerts & Badges</h3>
            <div className="space-y-4 max-w-2xl">
              <div className="glacier-liquid glacier-tint-info glacier-border px-4 py-3 rounded-xl flex items-center gap-3">
                <span>ℹ️</span>
                <p className="text-white">This is an informational message.</p>
              </div>
              <div className="glacier-liquid glacier-tint-success glacier-border px-4 py-3 rounded-xl flex items-center gap-3">
                <span>✅</span>
                <p className="text-white">Operation completed successfully!</p>
              </div>
              <div className="glacier-liquid glacier-tint-warning glacier-border px-4 py-3 rounded-xl flex items-center gap-3">
                <span>⚠️</span>
                <p className="text-white">Warning: Please review your settings.</p>
              </div>
              <div className="glacier-liquid glacier-tint-danger glacier-border px-4 py-3 rounded-xl flex items-center gap-3">
                <span>❌</span>
                <p className="text-white">Error: Something went wrong.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 mt-6">
              <span className="glacier-glass glacier-blur-sm glacier-border px-3 py-1 rounded-full text-xs font-medium text-white bg-white/10">Default</span>
              <span className="glacier-glass glacier-blur-sm glacier-border px-3 py-1 rounded-full text-xs font-medium text-white bg-blue-500/30">Primary</span>
              <span className="glacier-glass glacier-blur-sm glacier-border px-3 py-1 rounded-full text-xs font-medium text-white bg-green-500/30">Success</span>
              <span className="glacier-glass glacier-blur-sm glacier-border px-3 py-1 rounded-full text-xs font-medium text-white bg-yellow-500/30">Warning</span>
              <span className="glacier-glass glacier-blur-sm glacier-border px-3 py-1 rounded-full text-xs font-medium text-white bg-red-500/30">Danger</span>
            </div>
          </div>

          {/* Progress */}
          <div className="mb-16">
            <h3 className="text-xl font-semibold text-white mb-6">Progress</h3>
            <div className="space-y-4 max-w-md">
              <div>
                <div className="flex justify-between text-sm text-white/70 mb-2">
                  <span>Uploading...</span>
                  <span>65%</span>
                </div>
                <div className="w-full h-2 glacier-glass glacier-blur-sm rounded-full overflow-hidden bg-white/10">
                  <div className="h-full w-[65%] rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm text-white/70 mb-2">
                  <span>Processing...</span>
                  <span>30%</span>
                </div>
                <div className="w-full h-2 glacier-glass glacier-blur-sm rounded-full overflow-hidden bg-white/10">
                  <div className="h-full w-[30%] rounded-full bg-gradient-to-r from-cyan-500 to-blue-500" />
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* Examples Section */}
        <Section 
          id="examples" 
          title="Real World Examples"
          description="See Glacier in action with these complete UI examples"
        >
          {/* Music Player */}
          <div className="mb-16">
            <h3 className="text-xl font-semibold text-white mb-6">Music Player</h3>
            <div className="glacier-panel max-w-sm mx-auto p-6">
              <div className="w-full aspect-square glacier-liquid rounded-2xl mb-6 flex items-center justify-center text-6xl">
                🎵
              </div>
              <div className="text-center mb-4">
                <h4 className="text-lg font-semibold text-white">Glacier Dreams</h4>
                <p className="text-white/60 text-sm">Arctic Ambient</p>
              </div>
              <div className="w-full h-1 glacier-glass glacier-blur-sm rounded-full overflow-hidden bg-white/10 mb-4">
                <div className="h-full w-1/3 rounded-full bg-white" />
              </div>
              <div className="flex items-center justify-center gap-6">
                <button className="text-white/60 hover:text-white transition-colors rotate-180">
                  <Icons.ArrowRight />
                </button>
                <button className="glacier-liquid glacier-animate glacier-hover-brighten p-4 rounded-full text-white">
                  <Icons.Play />
                </button>
                <button className="text-white/60 hover:text-white transition-colors">
                  <Icons.ArrowRight />
                </button>
              </div>
            </div>
          </div>

          {/* User Profile Card */}
          <div className="mb-16">
            <h3 className="text-xl font-semibold text-white mb-6">Profile Card</h3>
            <div className="glacier-panel max-w-sm mx-auto overflow-hidden">
              <div className="h-24 bg-gradient-to-r from-blue-500/30 to-purple-500/30" />
              <div className="px-6 pb-6">
                <div className="w-20 h-20 glacier-liquid rounded-2xl -mt-10 mb-4 flex items-center justify-center text-3xl border-4 border-slate-900/50">
                  👤
                </div>
                <h4 className="text-lg font-semibold text-white">Jane Developer</h4>
                <p className="text-white/60 text-sm mb-4">Senior UI Engineer</p>
                <div className="flex gap-4 text-sm text-white/60 mb-4">
                  <span><strong className="text-white">124</strong> Projects</span>
                  <span><strong className="text-white">3.2k</strong> Followers</span>
                </div>
                <button className="w-full glacier-liquid glacier-animate glacier-hover-brighten glacier-tint-primary py-2 rounded-xl text-white font-medium">
                  Follow
                </button>
              </div>
            </div>
          </div>

          {/* Notification */}
          <div>
            <h3 className="text-xl font-semibold text-white mb-6">Notification Toast</h3>
            <div className="glacier-notification max-w-sm mx-auto flex items-start gap-3">
              <div className="w-10 h-10 glacier-liquid glacier-tint-success rounded-xl flex items-center justify-center flex-shrink-0">
                <Icons.Check />
              </div>
              <div className="flex-1">
                <h4 className="text-slate-900 font-semibold">Upload Complete</h4>
                <p className="text-slate-600 text-sm">Your files have been successfully uploaded.</p>
              </div>
              <button className="text-slate-400 hover:text-slate-600">
                <Icons.X />
              </button>
            </div>
          </div>
        </Section>

        {/* Installation Section */}
        <Section 
          id="install" 
          title="Installation"
          description="Get started with Glacier in minutes"
        >
          <div className="max-w-3xl mx-auto space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">1. Install the package</h3>
              <CodeBlock code="npm install glacier-css" />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">2. Add to your Tailwind config</h3>
              <CodeBlock code={`// tailwind.config.js
import glacier from 'glacier-css';

export default {
  plugins: [
    glacier({
      prefix: 'glacier', // optional
    }),
  ],
}`} />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">3. Start using Glacier classes</h3>
              <CodeBlock code={`<div class="glacier-liquid glacier-animate glacier-hover-brighten p-6 rounded-2xl">
  <h2 class="text-white font-semibold">Hello, Glacier!</h2>
  <p class="text-white/70">Beautiful liquid glass effects.</p>
</div>`} />
            </div>
          </div>
        </Section>

        {/* Utilities Reference */}
        <Section 
          id="utilities" 
          title="Utility Reference"
          description="A quick reference for all available Glacier utilities"
        >
          <div className="glacier-panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-6 py-4 text-white/70 text-sm font-medium uppercase tracking-wider">Class</th>
                    <th className="px-6 py-4 text-white/70 text-sm font-medium uppercase tracking-wider">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {[
                    ['glacier-glass', 'Base glass effect with backdrop blur'],
                    ['glacier-liquid', 'Liquid glass with full effects'],
                    ['glacier-liquid-refract', 'Liquid glass with refraction'],
                    ['glacier-liquid-fresnel', 'Liquid glass with fresnel'],
                    ['glacier-frosted', 'Frosted glass effect'],
                    ['glacier-frosted-light', 'Light frosted glass'],
                    ['glacier-frosted-dark', 'Dark frosted glass'],
                    ['glacier-blur-{size}', 'Control blur (xs, sm, md, lg, xl, 2xl, 3xl)'],
                    ['glacier-saturate-{amount}', 'Control saturation (0-200)'],
                    ['glacier-tint-{color}', 'Add color tint (white, black, primary, etc.)'],
                    ['glacier-border', 'Glass border'],
                    ['glacier-shadow', 'Glass shadow'],
                    ['glacier-glare', 'Add glare effect'],
                    ['glacier-glare-{direction}', 'Glare direction (tl, tr, bl, br)'],
                    ['glacier-fresnel-{strength}', 'Fresnel intensity'],
                    ['glacier-animate', 'Enable transitions'],
                    ['glacier-hover-brighten', 'Brighten on hover'],
                    ['glacier-hover-lift', 'Lift on hover'],
                    ['glacier-active-press', 'Press effect on active'],
                    ['glacier-card', 'Pre-styled card component'],
                    ['glacier-panel', 'Pre-styled panel component'],
                    ['glacier-modal', 'Pre-styled modal component'],
                  ].map(([cls, desc], i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-3">
                        <code className="text-cyan-400 text-sm">{cls}</code>
                      </td>
                      <td className="px-6 py-3 text-white/70 text-sm">{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Section>
      </main>

      {/* Footer */}
      <footer className="glacier-liquid glacier-blur-xl mt-20 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 glacier-liquid rounded-xl flex items-center justify-center">
                <Icons.Package />
              </div>
              <span className="text-xl font-bold text-white">Glacier</span>
            </div>
            <p className="text-white/60 text-sm">
              MIT License • Made with ❄️ for the web
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/NagusameCS/Glacier"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 hover:text-white transition-colors"
              >
                <Icons.GitHub />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
