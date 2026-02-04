import { useState, useEffect, useRef, createContext, useContext } from 'react';
import { LiquidGlass } from './components/LiquidGlass';
import {
  LiquidToggle,
  LiquidInput,
  LiquidButton,
  LiquidCard,
  LiquidCheckbox,
} from './components/LiquidComponents';

// =============================================
// GLOBAL GLASS CONTEXT - Parameters for WebGL demos
// =============================================
interface GlassParams {
  refraction: number;
  dispersion: number;
  blur: number;
  fresnel: number;
  glare: number;
  roundness: number;
  liquidWobble: number;
  shapeWidth: number;
  shapeHeight: number;
  tintColor: string;
  tintIntensity: number;
  backgroundId: number;
}

// Background image options
const BACKGROUND_IMAGES = [
  { id: 0, url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80', label: 'Mountains' },
  { id: 1, url: 'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=1200&q=80', label: 'Aurora' },
  { id: 2, url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&q=80', label: 'Valley' },
  { id: 3, url: 'https://images.unsplash.com/photo-1518173946687-a4c036bc613d?w=1200&q=80', label: 'Galaxy' },
  { id: 4, url: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&q=80', label: 'Gradient' },
  { id: 5, url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&q=80', label: 'Abstract' },
];

interface GlassContextType {
  params: GlassParams;
  setParams: (params: Partial<GlassParams>) => void;
}

const GlassContext = createContext<GlassContextType>({
  params: { 
    refraction: 1.52, dispersion: 12, blur: 0, fresnel: 0.6, 
    glare: 0.3, roundness: 0.8, liquidWobble: 0.4,
    shapeWidth: 0.5, shapeHeight: 0.45,
    tintColor: '#88ccff', tintIntensity: 0.15,
    backgroundId: 0
  },
  setParams: () => {},
});

// Glass effect presets
const GLASS_PRESETS = {
  crystal: { refraction: 1.8, dispersion: 18, blur: 0, fresnel: 0.8, glare: 0.5, roundness: 0.9, liquidWobble: 0.2, tintColor: '#ffffff', tintIntensity: 0.05 },
  water: { refraction: 1.33, dispersion: 8, blur: 2, fresnel: 0.4, glare: 0.2, roundness: 0.5, liquidWobble: 0.8, tintColor: '#66ccff', tintIntensity: 0.2 },
  diamond: { refraction: 2.0, dispersion: 25, blur: 0, fresnel: 1.0, glare: 0.8, roundness: 1.0, liquidWobble: 0.1, tintColor: '#ccddff', tintIntensity: 0.1 },
  soap: { refraction: 1.4, dispersion: 15, blur: 4, fresnel: 0.6, glare: 0.3, roundness: 0.3, liquidWobble: 0.6, tintColor: '#ffaaee', tintIntensity: 0.15 },
  ice: { refraction: 1.31, dispersion: 5, blur: 6, fresnel: 0.5, glare: 0.4, roundness: 0.7, liquidWobble: 0.15, tintColor: '#aaeeff', tintIntensity: 0.25 },
};

const useGlass = () => useContext(GlassContext);

// Helper to convert hex color to [r, g, b, a] for WebGL
function hexToRgba(hex: string, alpha: number): [number, number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return [
      parseInt(result[1], 16) / 255,
      parseInt(result[2], 16) / 255,
      parseInt(result[3], 16) / 255,
      alpha
    ];
  }
  return [1, 1, 1, 0]; // Default to transparent white
}

// Helper to get background URL by ID
function getBackgroundUrl(id: number, size: 'small' | 'medium' | 'large' = 'medium'): string {
  const bg = BACKGROUND_IMAGES.find(b => b.id === id) || BACKGROUND_IMAGES[0];
  const widthMap = { small: 600, medium: 1200, large: 1920 };
  return bg.url.replace(/w=\d+/, `w=${widthMap[size]}`);
}

// =============================================
// ANIMATED BACKGROUND - Shows off refraction
// =============================================
function AnimatedBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Main gradient base */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% -20%, rgba(120, 119, 198, 0.3), transparent),
            radial-gradient(ellipse 60% 40% at 90% 100%, rgba(255, 107, 107, 0.2), transparent),
            radial-gradient(ellipse 60% 40% at 10% 100%, rgba(79, 172, 254, 0.2), transparent),
            linear-gradient(to bottom, #0f0c29, #302b63, #24243e)
          `,
        }}
      />
      
      {/* Large floating orbs */}
      <div 
        className="absolute w-[600px] h-[600px] rounded-full animate-float-slow"
        style={{
          top: '10%',
          left: '-5%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, rgba(99, 102, 241, 0) 70%)',
          filter: 'blur(40px)',
        }}
      />
      <div 
        className="absolute w-[500px] h-[500px] rounded-full animate-float-slow-reverse"
        style={{
          bottom: '5%',
          right: '-10%',
          background: 'radial-gradient(circle, rgba(236, 72, 153, 0.4) 0%, rgba(236, 72, 153, 0) 70%)',
          filter: 'blur(40px)',
          animationDelay: '-5s',
        }}
      />
      <div 
        className="absolute w-[400px] h-[400px] rounded-full animate-float-medium"
        style={{
          top: '50%',
          left: '60%',
          background: 'radial-gradient(circle, rgba(34, 211, 238, 0.35) 0%, rgba(34, 211, 238, 0) 70%)',
          filter: 'blur(30px)',
          animationDelay: '-3s',
        }}
      />
      
      {/* Smaller animated orbs */}
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full animate-float-random"
          style={{
            width: 100 + Math.random() * 150,
            height: 100 + Math.random() * 150,
            left: `${10 + (i * 12)}%`,
            top: `${20 + Math.sin(i) * 30}%`,
            background: `radial-gradient(circle, ${
              ['rgba(251, 146, 60, 0.3)', 'rgba(168, 85, 247, 0.3)', 'rgba(56, 189, 248, 0.3)', 
               'rgba(250, 204, 21, 0.3)', 'rgba(52, 211, 153, 0.3)', 'rgba(244, 114, 182, 0.3)',
               'rgba(96, 165, 250, 0.3)', 'rgba(192, 132, 252, 0.3)'][i]
            } 0%, transparent 70%)`,
            filter: 'blur(20px)',
            animationDelay: `${-i * 2}s`,
            animationDuration: `${15 + i * 3}s`,
          }}
        />
      ))}
      
      {/* Light streaks */}
      <div className="absolute inset-0 overflow-hidden opacity-30">
        <div 
          className="absolute h-[1px] bg-gradient-to-r from-transparent via-white to-transparent animate-streak"
          style={{ top: '20%', left: '-50%', width: '100%' }}
        />
        <div 
          className="absolute h-[1px] bg-gradient-to-r from-transparent via-blue-300 to-transparent animate-streak"
          style={{ top: '60%', left: '-50%', width: '80%', animationDelay: '-3s', animationDuration: '8s' }}
        />
        <div 
          className="absolute h-[1px] bg-gradient-to-r from-transparent via-purple-300 to-transparent animate-streak"
          style={{ top: '80%', left: '-50%', width: '120%', animationDelay: '-6s', animationDuration: '12s' }}
        />
      </div>
      
      {/* Particle field */}
      <div className="absolute inset-0">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-twinkle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: 0.2 + Math.random() * 0.5,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      {/* Noise texture overlay for depth */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}

// =============================================
// CSS GLASS PANEL - No WebGL, just backdrop-filter
// =============================================
function GlassPanel({ 
  children, 
  className = '',
  padding = 'p-6',
  borderRadius = 24,
  intensity = 'normal',
}: { 
  children: React.ReactNode;
  className?: string;
  padding?: string;
  borderRadius?: number;
  intensity?: 'light' | 'normal' | 'heavy';
}) {
  const intensityStyles = {
    light: {
      bg: 'rgba(255, 255, 255, 0.05)',
      blur: '12px',
      border: 'rgba(255, 255, 255, 0.1)',
    },
    normal: {
      bg: 'rgba(255, 255, 255, 0.08)',
      blur: '20px',
      border: 'rgba(255, 255, 255, 0.15)',
    },
    heavy: {
      bg: 'rgba(255, 255, 255, 0.12)',
      blur: '30px',
      border: 'rgba(255, 255, 255, 0.2)',
    },
  };

  const styles = intensityStyles[intensity];

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ 
        borderRadius,
        background: styles.bg,
        backdropFilter: `blur(${styles.blur}) saturate(180%)`,
        WebkitBackdropFilter: `blur(${styles.blur}) saturate(180%)`,
        border: `1px solid ${styles.border}`,
        boxShadow: `
          0 8px 32px rgba(0, 0, 0, 0.3),
          inset 0 1px 0 rgba(255, 255, 255, 0.1),
          inset 0 -1px 0 rgba(0, 0, 0, 0.1)
        `,
      }}
    >
      {/* Top edge highlight */}
      <div 
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3) 50%, transparent)',
        }}
      />
      <div className={`relative z-10 ${padding}`}>{children}</div>
    </div>
  );
}

// =============================================
// CSS GLASS SLIDER - Performant, no WebGL
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
  }, [isDragging, updateValue]);

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
        className="relative h-8 cursor-pointer group"
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
            className="absolute inset-y-0 left-0 transition-[width] duration-75"
            style={{
              width: `${percentage}%`,
              background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.8), rgba(168, 85, 247, 0.8))',
              boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)',
            }}
          />
        </div>
        
        {/* CSS Glass Thumb */}
        <div
          className="absolute top-1/2 transition-all duration-75"
          style={{
            left: `${percentage}%`,
            width: isDragging ? 28 : 24,
            height: isDragging ? 28 : 24,
            transform: `translate(-50%, -50%) scale(${isDragging ? 1.1 : 1})`,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            border: '2px solid rgba(255, 255, 255, 0.4)',
            boxShadow: `
              0 4px 12px rgba(0, 0, 0, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.4),
              0 0 20px rgba(99, 102, 241, ${isDragging ? 0.5 : 0.2})
            `,
          }}
        />
      </div>
    </div>
  );
}

// =============================================
// CSS GLASS TABS
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
    <GlassPanel padding="p-1.5" className="inline-block" borderRadius={20}>
      <div ref={containerRef} className="relative flex gap-1">
        {/* Sliding glass indicator */}
        <div
          className="absolute top-0 bottom-0 transition-all duration-500 ease-out"
          style={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
            borderRadius: 12,
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(10px)',
            boxShadow: `
              0 2px 10px rgba(0, 0, 0, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.2)
            `,
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
// LIQUID CURSOR - CSS Glass Effect
// =============================================
function LiquidCursor() {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [visible, setVisible] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      setVisible(true);
    };
    
    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);
    const handleMouseLeave = () => setVisible(false);
    const handleMouseEnter = () => setVisible(true);
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, []);

  if (!visible) return null;

  return (
    <>
      {/* Main cursor */}
      <div
        className="fixed pointer-events-none z-[9998] transition-transform duration-75"
        style={{
          left: pos.x - 16,
          top: pos.y - 16,
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
          transform: `scale(${isClicking ? 0.8 : 1})`,
        }}
      />
      {/* Trail glow */}
      <div
        className="fixed pointer-events-none z-[9997]"
        style={{
          left: pos.x - 40,
          top: pos.y - 40,
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15), transparent 70%)',
          filter: 'blur(10px)',
        }}
      />
    </>
  );
}

// =============================================
// GLACIER ICON
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
// GLASS CONTROLS - Parameter sliders for WebGL demos
// =============================================
function GlassControls() {
  const { params, setParams } = useGlass();
  
  const applyPreset = (presetName: keyof typeof GLASS_PRESETS) => {
    setParams(GLASS_PRESETS[presetName]);
  };

  const randomize = () => {
    const randomColor = ['#ffffff', '#88ccff', '#ff88cc', '#88ffcc', '#ffcc88', '#cc88ff'][Math.floor(Math.random() * 6)];
    setParams({
      refraction: 1.2 + Math.random() * 0.8,
      dispersion: Math.random() * 25,
      blur: Math.random() * 12,
      fresnel: Math.random(),
      glare: Math.random() * 0.8,
      roundness: 0.3 + Math.random() * 0.7,
      liquidWobble: Math.random() * 0.8,
      shapeWidth: 0.25 + Math.random() * 0.5,
      shapeHeight: 0.25 + Math.random() * 0.45,
      tintColor: randomColor,
      tintIntensity: Math.random() * 0.35,
      backgroundId: Math.floor(Math.random() * BACKGROUND_IMAGES.length),
    });
  };
  
  return (
    <GlassPanel className="sticky top-4" borderRadius={24} intensity="heavy">
      <h3 className="text-white font-semibold mb-4 text-lg flex items-center gap-2">
        <span className="text-xl">🎛️</span> Glass Parameters
      </h3>
      
      {/* Presets */}
      <div className="mb-6">
        <p className="text-white/50 text-xs mb-3">Quick Presets</p>
        <div className="flex flex-wrap gap-2">
          {Object.keys(GLASS_PRESETS).map((preset) => (
            <button
              key={preset}
              onClick={() => applyPreset(preset as keyof typeof GLASS_PRESETS)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all capitalize
                bg-white/10 hover:bg-white/20 text-white/70 hover:text-white
                border border-white/10 hover:border-white/20"
            >
              {preset}
            </button>
          ))}
          <button
            onClick={randomize}
            className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all
              bg-gradient-to-r from-purple-500/30 to-pink-500/30 hover:from-purple-500/50 hover:to-pink-500/50 
              text-white/80 hover:text-white border border-white/20 hover:border-white/40"
          >
            🎲 Random
          </button>
        </div>
      </div>

      {/* Shape Controls */}
      <div className="mb-6 pb-4 border-b border-white/10">
        <p className="text-white/50 text-xs mb-3">Shape Size</p>
        <div className="space-y-3">
          <GlassSlider
            label="Width"
            value={Math.round(params.shapeWidth * 100)}
            min={20}
            max={80}
            onChange={(v) => setParams({ shapeWidth: v / 100 })}
            showValue
          />
          <GlassSlider
            label="Height"
            value={Math.round(params.shapeHeight * 100)}
            min={20}
            max={80}
            onChange={(v) => setParams({ shapeHeight: v / 100 })}
            showValue
          />
        </div>
      </div>

      <p className="text-white/50 text-xs mb-4">Fine-tune Parameters</p>
      <div className="space-y-4">
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
          max={25}
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
        <GlassSlider
          label="Liquid Wobble"
          value={Math.round(params.liquidWobble * 100)}
          min={0}
          max={100}
          onChange={(v) => setParams({ liquidWobble: v / 100 })}
          showValue
        />
      </div>

      {/* Tint Controls */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <p className="text-white/50 text-xs mb-3">Glass Tint</p>
        <div className="flex items-center gap-3 mb-3">
          <label className="text-white/70 text-xs min-w-[60px]">Color</label>
          <div className="flex gap-2">
            {['#ffffff', '#88ccff', '#ff88cc', '#88ffcc', '#ffcc88', '#cc88ff'].map((color) => (
              <button
                key={color}
                onClick={() => setParams({ tintColor: color })}
                className={`w-6 h-6 rounded-full border-2 transition-all ${
                  params.tintColor === color ? 'border-white scale-110' : 'border-white/30 hover:border-white/60'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
        <GlassSlider
          label="Intensity"
          value={Math.round(params.tintIntensity * 100)}
          min={0}
          max={50}
          onChange={(v) => setParams({ tintIntensity: v / 100 })}
          showValue
        />
      </div>

      {/* Background Picker */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <p className="text-white/50 text-xs mb-3">Background Image</p>
        <div className="grid grid-cols-3 gap-2">
          {BACKGROUND_IMAGES.map((bg) => (
            <button
              key={bg.id}
              onClick={() => setParams({ backgroundId: bg.id })}
              className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                params.backgroundId === bg.id 
                  ? 'border-white scale-105 shadow-lg' 
                  : 'border-white/20 hover:border-white/50'
              }`}
            >
              <img 
                src={bg.url.replace('w=1200', 'w=120')} 
                alt={bg.label}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-0 inset-x-0 bg-black/50 text-white/80 text-[8px] py-0.5 text-center">
                {bg.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </GlassPanel>
  );
}

// =============================================
// MAIN APP
// =============================================
function App() {
  const [activeTab, setActiveTab] = useState('liquid');
  const [fullscreenDemo, setFullscreenDemo] = useState(false);
  const [glassParams, setGlassParams] = useState<GlassParams>({
    refraction: 1.52,
    dispersion: 12,
    blur: 0,
    fresnel: 0.6,
    glare: 0.3,
    roundness: 0.8,
    liquidWobble: 0.4,
    shapeWidth: 0.5,
    shapeHeight: 0.45,
    tintColor: '#88ccff',
    tintIntensity: 0.15,
    backgroundId: 0,
  });

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && fullscreenDemo) {
        setFullscreenDemo(false);
      }
      if (e.key === 'f' && !fullscreenDemo && activeTab === 'liquid') {
        setFullscreenDemo(true);
      }
      // Number keys for presets
      const presetKeys = ['1', '2', '3', '4', '5'];
      const presetNames = Object.keys(GLASS_PRESETS) as (keyof typeof GLASS_PRESETS)[];
      const keyIndex = presetKeys.indexOf(e.key);
      if (keyIndex !== -1 && presetNames[keyIndex]) {
        setGlassParams(prev => ({ ...prev, ...GLASS_PRESETS[presetNames[keyIndex]] }));
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fullscreenDemo, activeTab]);

  const contextValue = {
    params: glassParams,
    setParams: (newParams: Partial<GlassParams>) => 
      setGlassParams(prev => ({ ...prev, ...newParams })),
  };

  const tabs = [
    { id: 'liquid', label: 'Liquid Glass', icon: '🔮' },
    { id: 'frosted', label: 'Frosted Glass', icon: '❄️' },
    { id: 'components', label: 'Components', icon: '🎨' },
  ];

  return (
    <GlassContext.Provider value={contextValue}>
      {/* Fullscreen Demo Mode */}
      {fullscreenDemo && (
        <div className="fixed inset-0 z-50 bg-black">
          <AnimatedBackground />
          <LiquidGlass
            width={window.innerWidth}
            height={window.innerHeight}
            refraction={glassParams.refraction}
            dispersion={glassParams.dispersion}
            blur={glassParams.blur}
            fresnel={glassParams.fresnel}
            glare={glassParams.glare}
            roundness={glassParams.roundness}
            liquidWobble={glassParams.liquidWobble}
            shapeSize={[glassParams.shapeWidth, glassParams.shapeHeight]}
            tint={hexToRgba(glassParams.tintColor, glassParams.tintIntensity)}
            backgroundImage={getBackgroundUrl(glassParams.backgroundId, 'large')}
            interactive
          />
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
            <GlassPanel padding="px-6 py-3" borderRadius={16}>
              <div className="flex items-center gap-4 text-white/70 text-sm">
                <span>Press <kbd className="px-2 py-0.5 bg-white/20 rounded">ESC</kbd> to exit</span>
                <span className="text-white/30">|</span>
                <span>Keys <kbd className="px-2 py-0.5 bg-white/20 rounded">1-5</kbd> for presets</span>
              </div>
            </GlassPanel>
          </div>
        </div>
      )}

      <div className={`min-h-screen relative overflow-hidden cursor-none ${fullscreenDemo ? 'hidden' : ''}`}>
        {/* Animated Background */}
        <AnimatedBackground />
        
        {/* Liquid Glass Cursor */}
        <LiquidCursor />

        {/* Header */}
        <header className="relative z-10 py-8 px-6">
          <div className="max-w-7xl mx-auto">
            <GlassPanel padding="px-6 py-4" className="inline-block" borderRadius={20}>
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
              Real WebGL refraction, chromatic dispersion, and edge fresnel effects. 
              Inspired by Apple's visionOS liquid glass design language.
            </p>
            
            <GlassTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
          </div>
        </section>

        {/* Main Content */}
        <main className="relative z-10 px-6 pb-20">
          <div className="max-w-7xl mx-auto">
            
            {/* LIQUID GLASS TAB - WebGL demos */}
            {activeTab === 'liquid' && (
              <div className="space-y-12 animate-fade-in">
                <div className="grid lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    <GlassPanel padding="p-3" borderRadius={28} intensity="light">
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
                          liquidWobble={glassParams.liquidWobble}
                          shapeSize={[glassParams.shapeWidth, glassParams.shapeHeight]}
                          tint={hexToRgba(glassParams.tintColor, glassParams.tintIntensity)}
                          backgroundImage={getBackgroundUrl(glassParams.backgroundId, 'medium')}
                          interactive
                        />
                      </div>
                      <p className="text-white/50 text-sm text-center mt-3 mb-1">
                        ✨ Real WebGL refraction — Move your mouse to interact
                      </p>
                      <div className="flex justify-center mt-2">
                        <button
                          onClick={() => setFullscreenDemo(true)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-white/70 hover:text-white
                            bg-white/10 hover:bg-white/20 rounded-lg transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                          </svg>
                          Fullscreen (F)
                        </button>
                      </div>
                    </GlassPanel>
                  </div>
                  
                  <div>
                    <GlassControls />
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-white mb-6">Different Backgrounds — See Real Refraction</h3>
                  <div className="grid md:grid-cols-3 gap-6">
                    {[
                      { url: 'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=600&q=80', label: 'Mountains' },
                      { url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&q=80', label: 'Valley' },
                      { url: 'https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=600&q=80', label: 'Abstract' },
                    ].map((bg, i) => (
                      <GlassPanel key={i} padding="p-2" borderRadius={24} intensity="light">
                        <LiquidGlass
                          width={350}
                          height={250}
                          backgroundImage={bg.url}
                          refraction={glassParams.refraction}
                          dispersion={glassParams.dispersion}
                          blur={glassParams.blur}
                          fresnel={glassParams.fresnel}
                          glare={glassParams.glare}
                          roundness={glassParams.roundness}
                          liquidWobble={glassParams.liquidWobble}
                          tint={hexToRgba(glassParams.tintColor, glassParams.tintIntensity)}
                          interactive
                          shapeSize={[0.55, 0.5]}
                        />
                        <p className="text-white/40 text-xs text-center mt-2">{bg.label}</p>
                      </GlassPanel>
                    ))}
                  </div>
                </div>

                <GlassPanel borderRadius={24}>
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
                          { title: 'Light Glass', desc: 'Subtle blur, perfect for overlays and modals', intensity: 'light' as const },
                          { title: 'Normal Glass', desc: 'Balanced glass effect for cards and panels', intensity: 'normal' as const },
                          { title: 'Heavy Glass', desc: 'Maximum blur and presence for key UI elements', intensity: 'heavy' as const },
                        ].map((item, i) => (
                          <GlassPanel key={i} borderRadius={24} intensity={item.intensity}>
                            <h4 className="text-white font-semibold text-lg mb-2">{item.title}</h4>
                            <p className="text-white/70 text-sm">{item.desc}</p>
                          </GlassPanel>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white mb-6">WebGL Refraction Demo</h3>
                      <GlassPanel padding="p-3" borderRadius={28} intensity="light">
                        <LiquidGlass
                          width={600}
                          height={400}
                          backgroundImage="https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&q=80"
                          refraction={glassParams.refraction}
                          dispersion={glassParams.dispersion}
                          blur={glassParams.blur}
                          fresnel={glassParams.fresnel}
                          glare={glassParams.glare}
                          roundness={glassParams.roundness}
                          liquidWobble={glassParams.liquidWobble}
                          interactive
                          shapeSize={[0.6, 0.55]}
                        />
                      </GlassPanel>
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
                      <GlassPanel borderRadius={24}>
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
                      <GlassPanel borderRadius={24}>
                        <div className="grid md:grid-cols-2 gap-8">
                          <div>
                            <h4 className="text-white/80 font-medium mb-4">Glass Toggle</h4>
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
                            <h4 className="text-white/80 font-medium mb-4">Glass Checkbox</h4>
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
                      <h3 className="text-2xl font-bold text-white mb-6">Glass Sliders</h3>
                      <GlassPanel borderRadius={24}>
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
                      <GlassPanel borderRadius={24}>
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
                      <GlassPanel className="max-w-xl mx-auto" borderRadius={24} intensity="heavy">
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

        {/* Global Styles */}
        <style>{`
          @keyframes float-slow {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(30px, -30px) scale(1.05); }
          }
          
          @keyframes float-slow-reverse {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(-30px, 30px) scale(1.05); }
          }
          
          @keyframes float-medium {
            0%, 100% { transform: translate(0, 0); }
            33% { transform: translate(20px, -15px); }
            66% { transform: translate(-10px, 10px); }
          }
          
          @keyframes float-random {
            0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.6; }
            25% { transform: translate(15px, -20px) scale(1.1); opacity: 0.8; }
            50% { transform: translate(-10px, -10px) scale(0.95); opacity: 0.5; }
            75% { transform: translate(20px, 15px) scale(1.05); opacity: 0.7; }
          }
          
          @keyframes streak {
            0% { transform: translateX(0); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translateX(200%); opacity: 0; }
          }
          
          @keyframes twinkle {
            0%, 100% { opacity: 0.2; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.5); }
          }
          
          .animate-float-slow {
            animation: float-slow 20s ease-in-out infinite;
          }
          
          .animate-float-slow-reverse {
            animation: float-slow-reverse 25s ease-in-out infinite;
          }
          
          .animate-float-medium {
            animation: float-medium 15s ease-in-out infinite;
          }
          
          .animate-float-random {
            animation: float-random 20s ease-in-out infinite;
          }
          
          .animate-streak {
            animation: streak 10s linear infinite;
          }
          
          .animate-twinkle {
            animation: twinkle 4s ease-in-out infinite;
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
