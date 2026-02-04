import { useState, useEffect, useRef } from 'react';
import { LiquidGlass } from './components/LiquidGlass';
import {
  LiquidToggle,
  LiquidSlider,
  LiquidInput,
  LiquidButton,
  LiquidCard,
  LiquidCheckbox,
} from './components/LiquidComponents';

// =============================================
// ANIMATED FROSTED GLASS COMPONENT
// =============================================
function FrostedPanel({ 
  children, 
  className = '',
  animate = false,
  intensity = 'medium',
}: { 
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
  intensity?: 'light' | 'medium' | 'heavy';
}) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);
  
  const intensityValues = {
    light: { blur: 8, bg: 0.4, border: 0.15 },
    medium: { blur: 16, bg: 0.25, border: 0.2 },
    heavy: { blur: 24, bg: 0.15, border: 0.25 },
  };
  
  const { blur, bg, border } = intensityValues[intensity];
  
  useEffect(() => {
    if (!animate || !panelRef.current) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const rect = panelRef.current!.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      setMousePos({ x, y });
    };
    
    const panel = panelRef.current;
    panel.addEventListener('mousemove', handleMouseMove);
    return () => panel.removeEventListener('mousemove', handleMouseMove);
  }, [animate]);
  
  return (
    <div
      ref={panelRef}
      className={`relative overflow-hidden rounded-3xl ${className}`}
      style={{
        background: `rgba(255, 255, 255, ${bg})`,
        backdropFilter: `blur(${blur}px) saturate(180%)`,
        WebkitBackdropFilter: `blur(${blur}px) saturate(180%)`,
        border: `1px solid rgba(255, 255, 255, ${border})`,
        boxShadow: `
          inset 0 1px 1px rgba(255, 255, 255, 0.2),
          inset 0 -1px 1px rgba(0, 0, 0, 0.05),
          0 8px 32px rgba(0, 0, 0, 0.12)
        `,
      }}
    >
      {/* Animated glare following mouse */}
      {animate && (
        <div
          className="absolute pointer-events-none transition-all duration-300 ease-out"
          style={{
            width: '200px',
            height: '200px',
            left: `${mousePos.x * 100}%`,
            top: `${mousePos.y * 100}%`,
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
            opacity: mousePos.x > 0 ? 1 : 0,
          }}
        />
      )}
      
      {/* Top highlight */}
      <div 
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }}
      />
      
      {/* Content */}
      <div className="relative">{children}</div>
    </div>
  );
}

// =============================================
// ANIMATED LIQUID BLOB
// =============================================
function LiquidBlob({ className = '' }: { className?: string }) {
  return (
    <div className={`absolute pointer-events-none ${className}`}>
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8"
              result="goo"
            />
          </filter>
          <linearGradient id="blobGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(59, 130, 246, 0.6)" />
            <stop offset="100%" stopColor="rgba(147, 51, 234, 0.6)" />
          </linearGradient>
        </defs>
        <g filter="url(#goo)">
          <circle cx="70" cy="100" r="40" fill="url(#blobGrad)">
            <animate
              attributeName="cx"
              values="70;130;70"
              dur="4s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="cy"
              values="100;80;100"
              dur="3s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="130" cy="100" r="35" fill="url(#blobGrad)">
            <animate
              attributeName="cx"
              values="130;70;130"
              dur="4s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="cy"
              values="100;120;100"
              dur="3.5s"
              repeatCount="indefinite"
            />
          </circle>
        </g>
      </svg>
    </div>
  );
}

// =============================================
// INTERACTIVE PARAMETER CONTROLS
// =============================================
function GlassControls({
  params,
  onChange,
}: {
  params: {
    refraction: number;
    dispersion: number;
    blur: number;
    fresnel: number;
    glare: number;
    roundness: number;
  };
  onChange: (key: string, value: number) => void;
}) {
  return (
    <FrostedPanel className="p-6" animate>
      <h3 className="text-white font-semibold mb-6 text-lg">Glass Parameters</h3>
      <div className="space-y-5">
        <LiquidSlider
          label="Refraction"
          value={params.refraction * 100}
          min={100}
          max={200}
          onChange={(v) => onChange('refraction', v / 100)}
          showValue
        />
        <LiquidSlider
          label="Dispersion"
          value={params.dispersion}
          min={0}
          max={20}
          onChange={(v) => onChange('dispersion', v)}
          showValue
        />
        <LiquidSlider
          label="Blur"
          value={params.blur}
          min={0}
          max={20}
          onChange={(v) => onChange('blur', v)}
          showValue
        />
        <LiquidSlider
          label="Fresnel"
          value={params.fresnel * 100}
          min={0}
          max={100}
          onChange={(v) => onChange('fresnel', v / 100)}
          showValue
        />
        <LiquidSlider
          label="Glare"
          value={params.glare * 100}
          min={0}
          max={100}
          onChange={(v) => onChange('glare', v / 100)}
          showValue
        />
        <LiquidSlider
          label="Roundness"
          value={params.roundness * 100}
          min={0}
          max={100}
          onChange={(v) => onChange('roundness', v / 100)}
          showValue
        />
      </div>
    </FrostedPanel>
  );
}

// =============================================
// MAIN APP
// =============================================
function App() {
  const [activeTab, setActiveTab] = useState<'liquid' | 'frosted' | 'components'>('liquid');
  const [glassParams, setGlassParams] = useState({
    refraction: 1.4,
    dispersion: 7,
    blur: 8,
    fresnel: 0.5,
    glare: 0.4,
    roundness: 0.8,
  });
  
  const handleParamChange = (key: string, value: number) => {
    setGlassParams((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl" />
        
        {/* Floating orbs */}
        <div className="absolute top-20 right-40 w-4 h-4 bg-white/30 rounded-full animate-float" />
        <div className="absolute top-40 left-20 w-3 h-3 bg-blue-400/40 rounded-full animate-float" style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-40 right-20 w-5 h-5 bg-purple-400/40 rounded-full animate-float" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header */}
      <header className="relative z-10 py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <FrostedPanel className="px-6 py-4 inline-block" intensity="light">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Glacier</h1>
                <p className="text-white/60 text-sm">Apple Liquid Glass for the Web</p>
              </div>
            </div>
          </FrostedPanel>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 py-12 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-5xl md:text-7xl font-bold text-white mb-6">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
              Liquid Glass
            </span>
            <br />
            <span className="text-white/90">for Everyone</span>
          </h2>
          <p className="text-xl text-white/70 max-w-2xl mx-auto mb-12">
            Real-time WebGL refraction, dispersion, and fresnel effects. 
            Inspired by Apple's visionOS and iOS design language.
          </p>
          
          {/* Navigation Tabs */}
          <FrostedPanel className="inline-flex p-1.5 mb-12" intensity="light">
            {(['liquid', 'frosted', 'components'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 rounded-xl font-medium transition-all duration-300 ${
                  activeTab === tab
                    ? 'bg-white/20 text-white shadow-lg'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                {tab === 'liquid' && '🔮 Liquid Glass'}
                {tab === 'frosted' && '❄️ Frosted Glass'}
                {tab === 'components' && '🎨 Components'}
              </button>
            ))}
          </FrostedPanel>
        </div>
      </section>

      {/* Content Sections */}
      <main className="relative z-10 px-6 pb-20">
        <div className="max-w-7xl mx-auto">
          
          {/* LIQUID GLASS TAB */}
          {activeTab === 'liquid' && (
            <div className="space-y-12 animate-fade-in">
              {/* Interactive Demo */}
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <FrostedPanel className="p-2" intensity="light">
                    <div className="rounded-2xl overflow-hidden">
                      <LiquidGlass
                        width={800}
                        height={500}
                        refraction={glassParams.refraction}
                        dispersion={glassParams.dispersion}
                        blur={glassParams.blur}
                        fresnel={glassParams.fresnel}
                        glare={glassParams.glare}
                        roundness={glassParams.roundness}
                        backgroundImage="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80"
                        interactive
                      />
                    </div>
                    <p className="text-white/50 text-sm text-center mt-3 mb-1">
                      Move your mouse to interact with the glass
                    </p>
                  </FrostedPanel>
                </div>
                
                <div>
                  <GlassControls params={glassParams} onChange={handleParamChange} />
                </div>
              </div>

              {/* Multiple Glass Shapes */}
              <div>
                <h3 className="text-2xl font-bold text-white mb-6">Different Backgrounds</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  {[
                    'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=600&q=80',
                    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&q=80',
                    'https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=600&q=80',
                  ].map((bg, i) => (
                    <FrostedPanel key={i} className="p-2" intensity="light">
                      <LiquidGlass
                        width={350}
                        height={250}
                        backgroundImage={bg}
                        refraction={1.3 + i * 0.1}
                        dispersion={5 + i * 2}
                        interactive
                        shapeSize={[0.5, 0.45]}
                      />
                    </FrostedPanel>
                  ))}
                </div>
              </div>

              {/* Code Example */}
              <FrostedPanel className="p-6" animate>
                <h3 className="text-xl font-bold text-white mb-4">Quick Start</h3>
                <pre className="bg-black/30 rounded-xl p-4 overflow-x-auto text-sm">
                  <code className="text-green-400">
{`// Install
npm install glacier-css

// tailwind.config.js
import glacier from 'glacier-css';

export default {
  plugins: [glacier()],
};

// Use in your HTML
<div class="glacier-liquid glacier-blur-lg glacier-fresnel-medium">
  Your liquid glass content
</div>`}
                  </code>
                </pre>
              </FrostedPanel>
            </div>
          )}

          {/* FROSTED GLASS TAB */}
          {activeTab === 'frosted' && (
            <div className="space-y-12 animate-fade-in">
              {/* Frosted Glass Intensities */}
              <div>
                <h3 className="text-2xl font-bold text-white mb-6">Frosted Glass Intensities</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  {(['light', 'medium', 'heavy'] as const).map((intensity) => (
                    <FrostedPanel key={intensity} className="p-6" intensity={intensity} animate>
                      <h4 className="text-white font-semibold capitalize mb-2">{intensity}</h4>
                      <p className="text-white/70 text-sm">
                        {intensity === 'light' && 'Subtle blur with high transparency. Great for overlays.'}
                        {intensity === 'medium' && 'Balanced blur and opacity. Perfect for cards and panels.'}
                        {intensity === 'heavy' && 'Strong blur with solid backing. Ideal for modals.'}
                      </p>
                    </FrostedPanel>
                  ))}
                </div>
              </div>

              {/* Animated Frosted Demo */}
              <div>
                <h3 className="text-2xl font-bold text-white mb-6">Interactive Frosted Glass</h3>
                <div className="relative h-[400px] rounded-3xl overflow-hidden">
                  {/* Background with moving gradient */}
                  <div 
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(45deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
                      backgroundSize: '400% 400%',
                      animation: 'gradient-shift 8s ease infinite',
                    }}
                  />
                  
                  {/* Floating blobs */}
                  <LiquidBlob className="w-64 h-64 top-10 left-10 opacity-60" />
                  <LiquidBlob className="w-48 h-48 bottom-10 right-20 opacity-50" />
                  
                  {/* Frosted panels */}
                  <div className="absolute inset-8 grid grid-cols-2 gap-6">
                    <FrostedPanel className="p-6 flex flex-col justify-between" animate intensity="medium">
                      <div>
                        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <h4 className="text-white font-semibold text-lg mb-2">Dynamic Glare</h4>
                        <p className="text-white/70 text-sm">Move your mouse to see the glare effect follow your cursor.</p>
                      </div>
                      <LiquidButton variant="secondary" size="sm">Learn More</LiquidButton>
                    </FrostedPanel>
                    
                    <FrostedPanel className="p-6 flex flex-col justify-between" animate intensity="heavy">
                      <div>
                        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                        <h4 className="text-white font-semibold text-lg mb-2">Heavy Frosted</h4>
                        <p className="text-white/70 text-sm">Maximum blur for a solid, premium feel.</p>
                      </div>
                      <LiquidButton variant="primary" size="sm">Get Started</LiquidButton>
                    </FrostedPanel>
                  </div>
                </div>
              </div>

              {/* CSS Utilities */}
              <FrostedPanel className="p-6" animate>
                <h3 className="text-xl font-bold text-white mb-4">Frosted Glass Utilities</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-white/80 font-medium mb-3">Blur Levels</h4>
                    <pre className="bg-black/30 rounded-lg p-3 text-sm overflow-x-auto">
                      <code className="text-blue-400">
{`glacier-blur-xs   /* 4px */
glacier-blur-sm   /* 8px */
glacier-blur-md   /* 12px */
glacier-blur-lg   /* 16px */
glacier-blur-xl   /* 24px */
glacier-blur-2xl  /* 40px */`}
                      </code>
                    </pre>
                  </div>
                  <div>
                    <h4 className="text-white/80 font-medium mb-3">Frosted Presets</h4>
                    <pre className="bg-black/30 rounded-lg p-3 text-sm overflow-x-auto">
                      <code className="text-purple-400">
{`glacier-frosted-light
glacier-frosted
glacier-frosted-dark
glacier-frosted-subtle
glacier-frosted-heavy`}
                      </code>
                    </pre>
                  </div>
                </div>
              </FrostedPanel>
            </div>
          )}

          {/* COMPONENTS TAB */}
          {activeTab === 'components' && (
            <div className="space-y-12 animate-fade-in">
              {/* Buttons */}
              <div>
                <h3 className="text-2xl font-bold text-white mb-6">Buttons</h3>
                <FrostedPanel className="p-8" animate>
                  <div className="flex flex-wrap gap-4 items-center">
                    <LiquidButton variant="primary">Primary</LiquidButton>
                    <LiquidButton variant="secondary">Secondary</LiquidButton>
                    <LiquidButton variant="ghost">Ghost</LiquidButton>
                    <LiquidButton variant="primary" size="lg">Large Button</LiquidButton>
                    <LiquidButton variant="primary" size="sm">Small</LiquidButton>
                    <LiquidButton variant="primary" disabled>Disabled</LiquidButton>
                  </div>
                </FrostedPanel>
              </div>

              {/* Toggle & Checkbox */}
              <div>
                <h3 className="text-2xl font-bold text-white mb-6">Toggles & Checkboxes</h3>
                <FrostedPanel className="p-8" animate>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-white/80 font-medium mb-4">Liquid Glass Toggle</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-white/70">Small</span>
                          <LiquidToggle size="sm" />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-white/70">Medium (default)</span>
                          <LiquidToggle size="md" checked />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-white/70">Large</span>
                          <LiquidToggle size="lg" />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-white/70">Disabled</span>
                          <LiquidToggle disabled checked />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-white/80 font-medium mb-4">Liquid Glass Checkbox</h4>
                      <div className="space-y-3">
                        <LiquidCheckbox label="Enable notifications" checked />
                        <LiquidCheckbox label="Auto-save drafts" />
                        <LiquidCheckbox label="Dark mode" checked />
                        <LiquidCheckbox label="Disabled option" disabled />
                      </div>
                    </div>
                  </div>
                </FrostedPanel>
              </div>

              {/* Sliders */}
              <div>
                <h3 className="text-2xl font-bold text-white mb-6">Sliders</h3>
                <FrostedPanel className="p-8" animate>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <LiquidSlider label="Volume" value={75} showValue />
                      <LiquidSlider label="Brightness" value={50} showValue />
                      <LiquidSlider label="Opacity" value={100} showValue />
                    </div>
                    <div className="space-y-6">
                      <LiquidSlider label="Blur Radius" value={12} max={50} showValue />
                      <LiquidSlider label="Saturation" value={180} max={200} showValue />
                      <LiquidSlider label="Disabled" value={30} disabled />
                    </div>
                  </div>
                </FrostedPanel>
              </div>

              {/* Inputs */}
              <div>
                <h3 className="text-2xl font-bold text-white mb-6">Inputs</h3>
                <FrostedPanel className="p-8" animate>
                  <div className="grid md:grid-cols-2 gap-6">
                    <LiquidInput placeholder="Enter your name" />
                    <LiquidInput 
                      placeholder="Search..." 
                      type="search"
                      icon={
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      }
                    />
                    <LiquidInput placeholder="Email address" type="email" />
                    <LiquidInput placeholder="Password" type="password" />
                  </div>
                </FrostedPanel>
              </div>

              {/* Cards */}
              <div>
                <h3 className="text-2xl font-bold text-white mb-6">Cards</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <LiquidCard>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h4 className="text-white font-semibold text-lg mb-2">Performance</h4>
                    <p className="text-white/70 text-sm">WebGL-powered effects with 60fps animations.</p>
                  </LiquidCard>
                  
                  <LiquidCard hoverable onClick={() => alert('Clicked!')}>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                      </svg>
                    </div>
                    <h4 className="text-white font-semibold text-lg mb-2">Hoverable Card</h4>
                    <p className="text-white/70 text-sm">Click me! Interactive cards with lift effect.</p>
                  </LiquidCard>
                  
                  <LiquidCard>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                      </svg>
                    </div>
                    <h4 className="text-white font-semibold text-lg mb-2">Customizable</h4>
                    <p className="text-white/70 text-sm">Fine-tune every aspect with CSS variables.</p>
                  </LiquidCard>
                </div>
              </div>

              {/* Complete Form Example */}
              <div>
                <h3 className="text-2xl font-bold text-white mb-6">Complete Form</h3>
                <FrostedPanel className="p-8 max-w-xl mx-auto" animate intensity="medium">
                  <h4 className="text-white font-semibold text-xl mb-6 text-center">Create Account</h4>
                  <div className="space-y-4">
                    <LiquidInput placeholder="Full Name" />
                    <LiquidInput placeholder="Email Address" type="email" />
                    <LiquidInput placeholder="Password" type="password" />
                    
                    <div className="flex items-center justify-between py-2">
                      <LiquidCheckbox label="Remember me" />
                      <a href="#" className="text-blue-400 text-sm hover:underline">Forgot password?</a>
                    </div>
                    
                    <LiquidButton variant="primary" size="lg">
                      Create Account
                    </LiquidButton>
                    
                    <p className="text-white/50 text-sm text-center">
                      Already have an account? <a href="#" className="text-blue-400 hover:underline">Sign in</a>
                    </p>
                  </div>
                </FrostedPanel>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-8 px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-white/50 text-sm">
            Glacier CSS — MIT License — Inspired by Apple's Liquid Glass design
          </p>
          <div className="flex justify-center gap-6 mt-4">
            <a href="https://github.com/NagusameCS/Glacier" className="text-white/60 hover:text-white transition-colors">
              GitHub
            </a>
            <a href="https://www.npmjs.com/package/glacier-css" className="text-white/60 hover:text-white transition-colors">
              npm
            </a>
          </div>
        </div>
      </footer>

      {/* Global Styles */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default App;
