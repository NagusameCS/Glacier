import { useState, useEffect, useRef, createContext, useContext, useMemo } from 'react';
import { LiquidGlass } from './components/LiquidGlass';
import {
  LiquidToggle,
  LiquidInput,
  LiquidButton,
  LiquidCard,
  LiquidCheckbox,
} from './components/LiquidComponents';

// =============================================
// GLOBAL GLASS CONTEXT
// =============================================
interface GlassParams {
  refraction: number;
  dispersion: number;
  blur: number;
  fresnel: number;
  glare: number;
  roundness: number;
}

const GlassContext = createContext<{
  params: GlassParams;
  setParams: (params: Partial<GlassParams>) => void;
}>({
  params: { refraction: 1.4, dispersion: 7, blur: 0, fresnel: 0.5, glare: 0.4, roundness: 0.8 },
  setParams: () => {},
});

const useGlass = () => useContext(GlassContext);

// =============================================
// FAVICON ICON
// =============================================
function GlacierIcon({ className = '' }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className={className}>
      <defs>
        <linearGradient id="glacierGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#60a5fa', stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: '#a78bfa', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#38bdf8', stopOpacity: 1 }} />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <polygon 
        points="50,5 90,30 90,70 50,95 10,70 10,30" 
        fill="url(#glacierGrad)" 
        filter="url(#glow)"
        opacity="0.9"
      />
      <polygon 
        points="50,15 80,35 80,65 50,85 20,65 20,35" 
        fill="none" 
        stroke="white" 
        strokeWidth="1"
        opacity="0.5"
      />
      <polygon 
        points="50,25 70,40 70,60 50,75 30,60 30,40" 
        fill="white"
        opacity="0.3"
      />
    </svg>
  );
}

// =============================================
// LIQUID GLASS CURSOR
// =============================================
function LiquidCursor() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);
  const { params } = useGlass();
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      setVisible(true);
    };
    
    const handleMouseLeave = () => setVisible(false);
    const handleMouseEnter = () => setVisible(true);
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed pointer-events-none z-[9999] transition-transform duration-75"
      style={{
        left: pos.x - 16,
        top: pos.y - 16,
        width: 32,
        height: 32,
      }}
    >
      {/* Outer glow */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, rgba(147, 51, 234, ${0.2 + params.glare * 0.2}) 0%, transparent 70%)`,
          transform: 'scale(2)',
        }}
      />
      {/* Glass cursor */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle at 30% 30%, 
            rgba(255, 255, 255, ${0.9 + params.fresnel * 0.1}) 0%, 
            rgba(255, 255, 255, ${0.4 + params.fresnel * 0.2}) 40%,
            rgba(200, 220, 255, ${0.3 + params.fresnel * 0.1}) 100%)`,
          boxShadow: `
            0 0 ${4 + params.blur}px rgba(255, 255, 255, 0.5),
            0 2px 8px rgba(0, 0, 0, 0.3),
            inset 0 1px 2px rgba(255, 255, 255, 0.8),
            inset 0 -1px 2px rgba(0, 0, 0, 0.1)
          `,
          border: '1px solid rgba(255, 255, 255, 0.4)',
        }}
      />
      {/* Inner highlight */}
      <div
        className="absolute rounded-full"
        style={{
          top: '15%',
          left: '20%',
          width: '35%',
          height: '25%',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, transparent 100%)',
          borderRadius: '50%',
        }}
      />
    </div>
  );
}

// =============================================
// CSS-BASED GLASS PANEL (no WebGL!)
// =============================================
function GlassPanel({ 
  children, 
  className = '',
  padding = 'p-6',
  animate = false,
}: { 
  children: React.ReactNode;
  className?: string;
  padding?: string;
  animate?: boolean;
}) {
  const { params } = useGlass();
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const panelRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!animate || !panelRef.current) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const rect = panelRef.current!.getBoundingClientRect();
      setMousePos({
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      });
    };
    
    const panel = panelRef.current;
    panel.addEventListener('mousemove', handleMouseMove);
    return () => panel.removeEventListener('mousemove', handleMouseMove);
  }, [animate]);

  // Dynamic glass effect based on global params
  const bgOpacity = 0.08 + params.fresnel * 0.08;
  const borderOpacity = 0.15 + params.fresnel * 0.15;
  const blurAmount = 12 + params.blur;

  return (
    <div
      ref={panelRef}
      className={`relative overflow-hidden rounded-3xl ${className}`}
      style={{
        background: `linear-gradient(135deg, 
          rgba(255, 255, 255, ${bgOpacity + 0.02}) 0%,
          rgba(255, 255, 255, ${bgOpacity}) 50%,
          rgba(200, 220, 255, ${bgOpacity * 0.8}) 100%)`,
        backdropFilter: `blur(${blurAmount}px) saturate(${150 + params.fresnel * 50}%)`,
        WebkitBackdropFilter: `blur(${blurAmount}px) saturate(${150 + params.fresnel * 50}%)`,
        border: `1px solid rgba(255, 255, 255, ${borderOpacity})`,
        boxShadow: `
          inset 0 1px 1px rgba(255, 255, 255, ${0.2 + params.glare * 0.2}),
          inset 0 -1px 1px rgba(0, 0, 0, 0.05),
          0 8px 32px rgba(0, 0, 0, 0.12),
          0 0 ${params.glare * 20}px rgba(147, 51, 234, ${params.glare * 0.1})
        `,
      }}
    >
      {/* Fresnel edge highlight */}
      <div 
        className="absolute inset-0 pointer-events-none rounded-3xl"
        style={{
          background: `linear-gradient(135deg, 
            rgba(255, 255, 255, ${params.fresnel * 0.15}) 0%, 
            transparent 50%,
            rgba(255, 255, 255, ${params.fresnel * 0.05}) 100%)`,
        }}
      />
      
      {/* Moving glare */}
      {animate && (
        <div
          className="absolute pointer-events-none transition-all duration-200 ease-out"
          style={{
            width: '50%',
            height: '50%',
            left: `${mousePos.x * 100}%`,
            top: `${mousePos.y * 100}%`,
            transform: 'translate(-50%, -50%)',
            background: `radial-gradient(circle, rgba(255,255,255,${params.glare * 0.2}) 0%, transparent 70%)`,
          }}
        />
      )}
      
      {/* Top edge shine */}
      <div 
        className="absolute inset-x-0 top-0 h-px pointer-events-none"
        style={{ 
          background: `linear-gradient(90deg, transparent, rgba(255,255,255,${0.3 + params.fresnel * 0.3}), transparent)` 
        }}
      />
      
      <div className={`relative ${padding}`}>{children}</div>
    </div>
  );
}

// =============================================
// ANIMATED TAB BAR WITH CSS GLASS
// =============================================
function GlassTabs({ 
  tabs, 
  activeTab, 
  onChange 
}: { 
  tabs: { id: string; label: string; icon: string }[];
  activeTab: string;
  onChange: (id: string) => void;
}) {
  const { params } = useGlass();
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  
  useEffect(() => {
    if (!containerRef.current) return;
    const activeButton = containerRef.current.querySelector(`[data-tab="${activeTab}"]`) as HTMLElement;
    if (activeButton) {
      setIndicatorStyle({
        left: activeButton.offsetLeft,
        width: activeButton.offsetWidth,
      });
    }
  }, [activeTab]);

  return (
    <GlassPanel padding="p-1.5" className="inline-block">
      <div ref={containerRef} className="relative flex gap-1">
        {/* Sliding glass indicator */}
        <div
          className="absolute top-0 bottom-0 rounded-xl transition-all duration-500 ease-out"
          style={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
            background: `linear-gradient(135deg, 
              rgba(255, 255, 255, ${0.2 + params.fresnel * 0.1}) 0%,
              rgba(255, 255, 255, ${0.15 + params.fresnel * 0.05}) 100%)`,
            boxShadow: `
              0 4px 20px rgba(0, 0, 0, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, ${0.3 + params.glare * 0.2}),
              0 0 ${params.glare * 15}px rgba(147, 51, 234, ${params.glare * 0.15})
            `,
            border: `1px solid rgba(255, 255, 255, ${0.2 + params.fresnel * 0.1})`,
          }}
        />
        
        {tabs.map((tab) => (
          <button
            key={tab.id}
            data-tab={tab.id}
            onClick={() => onChange(tab.id)}
            className={`relative z-10 px-6 py-2.5 rounded-xl font-medium transition-colors duration-300 ${
              activeTab === tab.id ? 'text-white' : 'text-white/60 hover:text-white/80'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>
    </GlassPanel>
  );
}

// =============================================
// GLASS SLIDER WITH CSS THUMB
// =============================================
function GlassSlider({
  label,
  value,
  min = 0,
  max = 100,
  onChange,
  showValue = false,
}: {
  label?: string;
  value: number;
  min?: number;
  max?: number;
  onChange?: (v: number) => void;
  showValue?: boolean;
}) {
  const { params } = useGlass();
  const [currentValue, setCurrentValue] = useState(value);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  const percentage = ((currentValue - min) / (max - min)) * 100;

  const updateValue = (clientX: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const newValue = Math.round((x / rect.width) * (max - min) + min);
    setCurrentValue(newValue);
    onChange?.(newValue);
  };

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => updateValue(e.clientX);
    const handleMouseUp = () => setIsDragging(false);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-2">
          {label && <span className="text-white/80 text-sm">{label}</span>}
          {showValue && <span className="text-white/60 text-sm tabular-nums">{currentValue}</span>}
        </div>
      )}
      
      <div
        ref={trackRef}
        className="relative h-10 cursor-pointer"
        onMouseDown={(e) => { setIsDragging(true); updateValue(e.clientX); }}
      >
        {/* Track */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-2 rounded-full overflow-hidden"
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div
            className="absolute inset-y-0 left-0"
            style={{
              width: `${percentage}%`,
              background: `linear-gradient(90deg, 
                rgba(59, 130, 246, ${0.7 + params.fresnel * 0.2}), 
                rgba(147, 51, 234, ${0.7 + params.fresnel * 0.2}))`,
              boxShadow: `0 0 ${10 + params.glare * 10}px rgba(59, 130, 246, ${0.3 + params.glare * 0.2})`,
            }}
          />
        </div>
        
        {/* CSS Glass Thumb */}
        <div
          className="absolute top-1/2 transition-transform duration-75"
          style={{
            left: `${percentage}%`,
            width: isDragging ? 32 : 28,
            height: isDragging ? 32 : 28,
            transform: `translate(-50%, -50%) scale(${isDragging ? 1.1 : 1})`,
            borderRadius: '50%',
            background: `radial-gradient(circle at 30% 30%, 
              rgba(255, 255, 255, 0.95) 0%, 
              rgba(255, 255, 255, 0.7) 40%,
              rgba(200, 220, 255, 0.6) 100%)`,
            boxShadow: `
              0 2px 8px rgba(0, 0, 0, 0.3),
              0 4px 16px rgba(0, 0, 0, 0.15),
              inset 0 1px 2px rgba(255, 255, 255, 0.9),
              inset 0 -1px 2px rgba(0, 0, 0, 0.1),
              0 0 ${params.glare * 10}px rgba(147, 51, 234, ${params.glare * 0.3})
            `,
            border: `1px solid rgba(255, 255, 255, ${0.4 + params.fresnel * 0.2})`,
          }}
        >
          {/* Thumb shine */}
          <div 
            className="absolute rounded-full"
            style={{
              top: '10%',
              left: '15%',
              width: '40%',
              height: '30%',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, transparent 100%)',
            }}
          />
        </div>
      </div>
    </div>
  );
}

// =============================================
// GLASS CONTROLS PANEL
// =============================================
function GlassControls() {
  const { params, setParams } = useGlass();
  
  return (
    <GlassPanel className="sticky top-4" animate>
      <h3 className="text-white font-semibold mb-4 text-lg flex items-center gap-2">
        <span className="text-xl">🎛️</span> Global Glass Parameters
      </h3>
      <p className="text-white/50 text-xs mb-6">Controls affect ALL glass on this page</p>
      <div className="space-y-5">
        <GlassSlider
          label="Refraction"
          value={Math.round(params.refraction * 100)}
          min={100}
          max={200}
          onChange={(v) => setParams({ refraction: v / 100 })}
          showValue
        />
        <GlassSlider
          label="Dispersion"
          value={params.dispersion}
          min={0}
          max={20}
          onChange={(v) => setParams({ dispersion: v })}
          showValue
        />
        <GlassSlider
          label="Blur"
          value={params.blur}
          min={0}
          max={20}
          onChange={(v) => setParams({ blur: v })}
          showValue
        />
        <GlassSlider
          label="Fresnel"
          value={Math.round(params.fresnel * 100)}
          min={0}
          max={100}
          onChange={(v) => setParams({ fresnel: v / 100 })}
          showValue
        />
        <GlassSlider
          label="Glare"
          value={Math.round(params.glare * 100)}
          min={0}
          max={100}
          onChange={(v) => setParams({ glare: v / 100 })}
          showValue
        />
        <GlassSlider
          label="Roundness"
          value={Math.round(params.roundness * 100)}
          min={0}
          max={100}
          onChange={(v) => setParams({ roundness: v / 100 })}
          showValue
        />
      </div>
    </GlassPanel>
  );
}

// =============================================
// MAIN APP
// =============================================
function App() {
  const [activeTab, setActiveTab] = useState('liquid');
  const [glassParams, setGlassParams] = useState<GlassParams>({
    refraction: 1.4,
    dispersion: 7,
    blur: 0,
    fresnel: 0.5,
    glare: 0.4,
    roundness: 0.8,
  });
  
  const contextValue = useMemo(() => ({
    params: glassParams,
    setParams: (newParams: Partial<GlassParams>) => 
      setGlassParams(prev => ({ ...prev, ...newParams })),
  }), [glassParams]);

  const tabs = [
    { id: 'liquid', label: 'Liquid Glass', icon: '🔮' },
    { id: 'frosted', label: 'Frosted Glass', icon: '❄️' },
    { id: 'components', label: 'Components', icon: '🎨' },
  ];

  return (
    <GlassContext.Provider value={contextValue}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden cursor-none">
        {/* Liquid Glass Cursor */}
        <LiquidCursor />
        
        {/* Animated background - NO floating dots */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl" />
        </div>

        {/* Header */}
        <header className="relative z-10 py-8 px-6">
          <div className="max-w-7xl mx-auto">
            <GlassPanel padding="px-6 py-4" className="inline-block" animate>
              <div className="flex items-center gap-4">
                <GlacierIcon className="w-12 h-12" />
                <div>
                  <h1 className="text-2xl font-bold text-white">Glacier</h1>
                  <p className="text-white/60 text-sm">Apple Liquid Glass for the Web</p>
                </div>
              </div>
            </GlassPanel>
          </div>
        </header>

        {/* Hero */}
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
            
            <GlassTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
          </div>
        </section>

        {/* Main Content */}
        <main className="relative z-10 px-6 pb-20">
          <div className="max-w-7xl mx-auto">
            
            {/* LIQUID GLASS TAB */}
            {activeTab === 'liquid' && (
              <div className="space-y-12 animate-fade-in">
                <div className="grid lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    <GlassPanel padding="p-2" animate>
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
                    </GlassPanel>
                  </div>
                  
                  <div>
                    <GlassControls />
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-white mb-6">Different Backgrounds</h3>
                  <div className="grid md:grid-cols-3 gap-6">
                    {[
                      'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=600&q=80',
                      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&q=80',
                      'https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=600&q=80',
                    ].map((bg, i) => (
                      <GlassPanel key={i} padding="p-2" animate>
                        <LiquidGlass
                          width={350}
                          height={250}
                          backgroundImage={bg}
                          refraction={glassParams.refraction}
                          dispersion={glassParams.dispersion}
                          blur={glassParams.blur}
                          fresnel={glassParams.fresnel}
                          glare={glassParams.glare}
                          roundness={glassParams.roundness}
                          interactive
                          shapeSize={[0.5, 0.45]}
                        />
                      </GlassPanel>
                    ))}
                  </div>
                </div>

                <GlassPanel animate>
                  <h3 className="text-xl font-bold text-white mb-4">Quick Start</h3>
                  <pre className="bg-black/30 rounded-xl p-4 overflow-x-auto text-sm">
                    <code className="text-green-400">
{`// Install
npm install glacier-css

// tailwind.config.js
import glacier from 'glacier-css';

module.exports = {
  plugins: [glacier()],
};

// Use in your HTML
<div class="glacier-liquid glacier-blur-lg">
  Your liquid glass content
</div>`}
                    </code>
                  </pre>
                </GlassPanel>
              </div>
            )}

            {/* FROSTED GLASS TAB */}
            {activeTab === 'frosted' && (
              <div className="space-y-12 animate-fade-in">
                <div className="grid lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-6">Glass Intensities</h3>
                      <div className="grid gap-6">
                        {[
                          { title: 'Subtle', desc: 'Light refraction, perfect for overlays' },
                          { title: 'Standard', desc: 'Balanced glass effect for cards' },
                          { title: 'Heavy', desc: 'Maximum glass distortion for impact' },
                        ].map((item, i) => (
                          <GlassPanel key={i} animate>
                            <h4 className="text-white font-semibold text-lg mb-2">{item.title}</h4>
                            <p className="text-white/70 text-sm">{item.desc}</p>
                          </GlassPanel>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white mb-6">Interactive Demo</h3>
                      <div className="relative h-[400px] rounded-3xl overflow-hidden">
                        <div 
                          className="absolute inset-0"
                          style={{
                            background: 'linear-gradient(45deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
                            backgroundSize: '400% 400%',
                            animation: 'gradient-shift 8s ease infinite',
                          }}
                        />
                        
                        <div className="absolute inset-8 grid grid-cols-2 gap-6">
                          <GlassPanel className="flex flex-col justify-between" animate>
                            <div>
                              <h4 className="text-white font-semibold text-lg mb-2">Dynamic Glass</h4>
                              <p className="text-white/70 text-sm">Real-time parameter changes affect all glass.</p>
                            </div>
                            <LiquidButton variant="secondary" size="sm">Learn More</LiquidButton>
                          </GlassPanel>
                          
                          <GlassPanel className="flex flex-col justify-between" animate>
                            <div>
                              <h4 className="text-white font-semibold text-lg mb-2">Global Controls</h4>
                              <p className="text-white/70 text-sm">One slider changes everything.</p>
                            </div>
                            <LiquidButton variant="primary" size="sm">Get Started</LiquidButton>
                          </GlassPanel>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <GlassControls />
                  </div>
                </div>
              </div>
            )}

            {/* COMPONENTS TAB */}
            {activeTab === 'components' && (
              <div className="space-y-12 animate-fade-in">
                <div className="grid lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-12">
                    {/* Buttons */}
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-6">Buttons</h3>
                      <GlassPanel animate>
                        <div className="flex flex-wrap gap-4 items-center">
                          <LiquidButton variant="primary">Primary</LiquidButton>
                          <LiquidButton variant="secondary">Secondary</LiquidButton>
                          <LiquidButton variant="ghost">Ghost</LiquidButton>
                          <LiquidButton variant="primary" size="lg">Large Button</LiquidButton>
                          <LiquidButton variant="primary" size="sm">Small</LiquidButton>
                        </div>
                      </GlassPanel>
                    </div>

                    {/* Toggles */}
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-6">Toggles & Checkboxes</h3>
                      <GlassPanel animate>
                        <div className="grid md:grid-cols-2 gap-8">
                          <div>
                            <h4 className="text-white/80 font-medium mb-4">Liquid Glass Toggle</h4>
                            <div className="space-y-4">
                              {['sm', 'md', 'lg'].map((size) => (
                                <div key={size} className="flex items-center justify-between">
                                  <span className="text-white/70 capitalize">
                                    {size === 'sm' ? 'Small' : size === 'md' ? 'Medium' : 'Large'}
                                  </span>
                                  <LiquidToggle size={size as 'sm' | 'md' | 'lg'} checked={size === 'md'} />
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-white/80 font-medium mb-4">Liquid Glass Checkbox</h4>
                            <div className="space-y-3">
                              <LiquidCheckbox label="Enable notifications" checked />
                              <LiquidCheckbox label="Auto-save drafts" />
                              <LiquidCheckbox label="Dark mode" checked />
                            </div>
                          </div>
                        </div>
                      </GlassPanel>
                    </div>

                    {/* Sliders */}
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-6">Sliders (Liquid Glass Thumb)</h3>
                      <GlassPanel animate>
                        <div className="grid md:grid-cols-2 gap-8">
                          <div className="space-y-6">
                            <GlassSlider label="Volume" value={75} showValue />
                            <GlassSlider label="Brightness" value={50} showValue />
                            <GlassSlider label="Opacity" value={100} showValue />
                          </div>
                          <div className="space-y-6">
                            <GlassSlider label="Blur Radius" value={12} max={50} showValue />
                            <GlassSlider label="Saturation" value={180} max={200} showValue />
                          </div>
                        </div>
                      </GlassPanel>
                    </div>

                    {/* Inputs */}
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-6">Inputs</h3>
                      <GlassPanel animate>
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
                      </GlassPanel>
                    </div>

                    {/* Cards */}
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-6">Cards</h3>
                      <div className="grid md:grid-cols-3 gap-6">
                        {[
                          { icon: '⚡', title: 'Performance', desc: 'WebGL-powered 60fps', gradient: 'from-blue-500 to-purple-500' },
                          { icon: '🎯', title: 'Interactive', desc: 'Click & hover effects', gradient: 'from-green-500 to-teal-500' },
                          { icon: '🎨', title: 'Customizable', desc: 'Fine-tune everything', gradient: 'from-orange-500 to-pink-500' },
                        ].map((card, i) => (
                          <LiquidCard key={i} hoverable>
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-4 text-2xl`}>
                              {card.icon}
                            </div>
                            <h4 className="text-white font-semibold text-lg mb-2">{card.title}</h4>
                            <p className="text-white/70 text-sm">{card.desc}</p>
                          </LiquidCard>
                        ))}
                      </div>
                    </div>

                    {/* Form */}
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-6">Complete Form</h3>
                      <GlassPanel className="max-w-xl mx-auto" animate>
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
                        </div>
                      </GlassPanel>
                    </div>
                  </div>
                  
                  <div>
                    <GlassControls />
                  </div>
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

        <style>{`
          @keyframes gradient-shift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
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
    </GlassContext.Provider>
  );
}

export default App;
