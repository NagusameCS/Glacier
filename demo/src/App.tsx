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
// GLOBAL GLASS CONTEXT - affects ALL glass on page
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
// FAVICON ICON COMPONENT
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
// MINI WEBGL LIQUID GLASS FOR UI ELEMENTS
// =============================================
function MiniLiquidGlass({ 
  width, 
  height, 
  className = '',
  style = {},
}: { 
  width: number;
  height: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const { params } = useGlass();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const rafRef = useRef<number>(0);
  const timeRef = useRef(0);

  const vertexShader = `#version 300 es
    in vec4 a_position;
    out vec2 v_uv;
    void main() {
      v_uv = (a_position.xy + 1.0) * 0.5;
      gl_Position = a_position;
    }`;

  const fragmentShader = `#version 300 es
    precision highp float;
    in vec2 v_uv;
    out vec4 fragColor;
    
    uniform vec2 u_resolution;
    uniform float u_time;
    uniform float u_refraction;
    uniform float u_dispersion;
    uniform float u_blur;
    uniform float u_fresnel;
    uniform float u_glare;
    uniform float u_roundness;
    
    float sdRoundedRect(vec2 p, vec2 b, float r) {
      vec2 q = abs(p) - b + r;
      return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
    }
    
    void main() {
      vec2 uv = v_uv;
      vec2 p = (uv - 0.5) * u_resolution;
      vec2 size = u_resolution * 0.45;
      float radius = min(size.x, size.y) * u_roundness;
      
      float sd = sdRoundedRect(p, size, radius);
      
      if (sd < 0.0) {
        float depth = -sd / max(size.x, size.y);
        depth = clamp(depth, 0.0, 1.0);
        
        // Base glass color with subtle gradient
        vec3 baseColor = vec3(0.95, 0.97, 1.0);
        
        // Fresnel edge glow
        float fresnelFactor = pow(1.0 - depth, 4.0) * u_fresnel;
        
        // Animated glare
        float angle = atan(p.y, p.x) + u_time * 0.5;
        float glareFactor = (0.5 + sin(angle * 2.0) * 0.5) * (1.0 - depth) * u_glare;
        glareFactor = pow(glareFactor, 2.0);
        
        // Combine effects
        vec3 color = baseColor;
        color = mix(color, vec3(1.0), fresnelFactor * 0.6);
        color = mix(color, vec3(1.0, 1.0, 0.98), glareFactor * 0.4);
        
        // Edge darkening
        float edgeDark = smoothstep(0.0, 0.15, depth);
        color *= mix(0.92, 1.0, edgeDark);
        
        // Chromatic aberration hint
        float dispersionHint = u_dispersion * 0.01 * (1.0 - depth);
        color.r += dispersionHint * 0.02;
        color.b -= dispersionHint * 0.02;
        
        float alpha = smoothstep(0.0, 2.0, -sd);
        fragColor = vec4(color, alpha * 0.9);
      } else {
        fragColor = vec4(0.0);
      }
      
      // Smooth AA edge
      float edgeBlend = smoothstep(1.5, -1.5, sd);
      fragColor.a *= edgeBlend;
    }`;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: false });
    if (!gl) return;
    glRef.current = gl;

    const createShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = createShader(gl.VERTEX_SHADER, vertexShader);
    const fs = createShader(gl.FRAGMENT_SHADER, fragmentShader);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      return;
    }
    programRef.current = program;

    const positions = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, []);

  useEffect(() => {
    const gl = glRef.current;
    const program = programRef.current;
    if (!gl || !program) return;

    const render = () => {
      timeRef.current += 0.016;
      
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      
      gl.useProgram(program);
      
      const setUniform = (name: string, value: number | number[]) => {
        const loc = gl.getUniformLocation(program, name);
        if (!loc) return;
        if (Array.isArray(value)) gl.uniform2f(loc, value[0], value[1]);
        else gl.uniform1f(loc, value);
      };
      
      setUniform('u_resolution', [gl.canvas.width, gl.canvas.height]);
      setUniform('u_time', timeRef.current);
      setUniform('u_refraction', params.refraction);
      setUniform('u_dispersion', params.dispersion);
      setUniform('u_blur', params.blur);
      setUniform('u_fresnel', params.fresnel);
      setUniform('u_glare', params.glare);
      setUniform('u_roundness', params.roundness);
      
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      rafRef.current = requestAnimationFrame(render);
    };
    
    rafRef.current = requestAnimationFrame(render);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [params]);

  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

  return (
    <canvas
      ref={canvasRef}
      className={className}
      width={width * dpr}
      height={height * dpr}
      style={{ width, height, ...style }}
    />
  );
}

// =============================================
// LIQUID GLASS PANEL - WebGL-based glass panels
// =============================================
function LiquidPanel({ 
  children, 
  className = '',
  padding = 'p-6',
}: { 
  children: React.ReactNode;
  className?: string;
  padding?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const { params } = useGlass();
  
  useEffect(() => {
    if (!panelRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setSize({ width, height });
    });
    observer.observe(panelRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={panelRef} className={`relative overflow-hidden rounded-3xl ${className}`}>
      {/* WebGL Glass Background */}
      {size.width > 0 && (
        <div className="absolute inset-0">
          <MiniLiquidGlass width={size.width} height={size.height} className="w-full h-full" />
        </div>
      )}
      
      {/* Frosted overlay for content readability */}
      <div 
        className="absolute inset-0"
        style={{
          background: `rgba(255, 255, 255, ${0.05 + params.blur * 0.01})`,
          backdropFilter: `blur(${params.blur}px)`,
          WebkitBackdropFilter: `blur(${params.blur}px)`,
        }}
      />
      
      {/* Content */}
      <div className={`relative ${padding}`}>{children}</div>
    </div>
  );
}

// =============================================
// ANIMATED TAB BAR WITH SLIDING GLASS
// =============================================
function LiquidTabs({ 
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
    <div className="relative inline-block">
      {/* Outer glass container */}
      <LiquidPanel padding="p-1.5" className="inline-flex">
        <div ref={containerRef} className="relative flex gap-1">
          {/* Animated sliding glass indicator */}
          <div
            className="absolute top-0 bottom-0 transition-all duration-500 ease-out rounded-xl overflow-hidden"
            style={{
              left: indicatorStyle.left,
              width: indicatorStyle.width,
              transform: 'translateZ(0)',
            }}
          >
            <MiniLiquidGlass 
              width={indicatorStyle.width || 100} 
              height={44}
              className="w-full h-full"
            />
            <div 
              className="absolute inset-0"
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
              }}
            />
          </div>
          
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
      </LiquidPanel>
    </div>
  );
}

// =============================================
// LIQUID GLASS SLIDER THUMB
// =============================================
function LiquidSliderWithGlassThumb({
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
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-2 rounded-full overflow-hidden"
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.3)',
          }}
        >
          {/* Filled portion */}
          <div
            className="absolute inset-y-0 left-0"
            style={{
              width: `${percentage}%`,
              background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.8), rgba(147, 51, 234, 0.8))',
              boxShadow: '0 0 10px rgba(59, 130, 246, 0.4)',
            }}
          />
        </div>
        
        {/* Liquid Glass Thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-transform duration-75"
          style={{
            left: `${percentage}%`,
            width: isDragging ? 32 : 28,
            height: isDragging ? 32 : 28,
            transform: `translate(-50%, -50%) scale(${isDragging ? 1.1 : 1})`,
          }}
        >
          <MiniLiquidGlass 
            width={32} 
            height={32}
            style={{ borderRadius: '50%' }}
          />
          {/* Glass overlay for thumb */}
          <div 
            className="absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8), rgba(255,255,255,0.4))',
              boxShadow: `
                0 2px 8px rgba(0, 0, 0, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.8),
                inset 0 -1px 0 rgba(0, 0, 0, 0.1)
              `,
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
    <LiquidPanel className="sticky top-4">
      <h3 className="text-white font-semibold mb-6 text-lg">🎛️ Global Glass Parameters</h3>
      <p className="text-white/50 text-xs mb-6">These controls affect ALL glass elements on this page</p>
      <div className="space-y-5">
        <LiquidSliderWithGlassThumb
          label="Refraction"
          value={Math.round(params.refraction * 100)}
          min={100}
          max={200}
          onChange={(v) => setParams({ refraction: v / 100 })}
          showValue
        />
        <LiquidSliderWithGlassThumb
          label="Dispersion"
          value={params.dispersion}
          min={0}
          max={20}
          onChange={(v) => setParams({ dispersion: v })}
          showValue
        />
        <LiquidSliderWithGlassThumb
          label="Blur"
          value={params.blur}
          min={0}
          max={20}
          onChange={(v) => setParams({ blur: v })}
          showValue
        />
        <LiquidSliderWithGlassThumb
          label="Fresnel"
          value={Math.round(params.fresnel * 100)}
          min={0}
          max={100}
          onChange={(v) => setParams({ fresnel: v / 100 })}
          showValue
        />
        <LiquidSliderWithGlassThumb
          label="Glare"
          value={Math.round(params.glare * 100)}
          min={0}
          max={100}
          onChange={(v) => setParams({ glare: v / 100 })}
          showValue
        />
        <LiquidSliderWithGlassThumb
          label="Roundness"
          value={Math.round(params.roundness * 100)}
          min={0}
          max={100}
          onChange={(v) => setParams({ roundness: v / 100 })}
          showValue
        />
      </div>
    </LiquidPanel>
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
    blur: 0, // Default blur all the way down
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
        {/* Animated background */}
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
            <LiquidPanel padding="px-6 py-4" className="inline-block">
              <div className="flex items-center gap-4">
                <GlacierIcon className="w-12 h-12" />
                <div>
                  <h1 className="text-2xl font-bold text-white">Glacier</h1>
                  <p className="text-white/60 text-sm">Apple Liquid Glass for the Web</p>
                </div>
              </div>
            </LiquidPanel>
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
            
            {/* Animated Tab Bar */}
            <LiquidTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
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
                    <LiquidPanel padding="p-2">
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
                    </LiquidPanel>
                  </div>
                  
                  <div>
                    <GlassControls />
                  </div>
                </div>

                {/* Multiple demos */}
                <div>
                  <h3 className="text-2xl font-bold text-white mb-6">Different Backgrounds</h3>
                  <div className="grid md:grid-cols-3 gap-6">
                    {[
                      'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=600&q=80',
                      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&q=80',
                      'https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=600&q=80',
                    ].map((bg, i) => (
                      <LiquidPanel key={i} padding="p-2">
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
                      </LiquidPanel>
                    ))}
                  </div>
                </div>

                <LiquidPanel>
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
                </LiquidPanel>
              </div>
            )}

            {/* FROSTED GLASS TAB */}
            {activeTab === 'frosted' && (
              <div className="space-y-12 animate-fade-in">
                <div className="grid lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-6">Liquid Glass Intensities</h3>
                      <div className="grid gap-6">
                        {[
                          { title: 'Subtle', desc: 'Light refraction, perfect for overlays', blur: 2, fresnel: 0.3 },
                          { title: 'Standard', desc: 'Balanced glass effect for cards', blur: 8, fresnel: 0.5 },
                          { title: 'Heavy', desc: 'Maximum glass distortion for impact', blur: 16, fresnel: 0.8 },
                        ].map((item, i) => (
                          <LiquidPanel key={i}>
                            <h4 className="text-white font-semibold text-lg mb-2">{item.title}</h4>
                            <p className="text-white/70 text-sm">{item.desc}</p>
                            <div className="flex gap-4 mt-3 text-xs text-white/50">
                              <span>Blur: {item.blur}px</span>
                              <span>Fresnel: {Math.round(item.fresnel * 100)}%</span>
                            </div>
                          </LiquidPanel>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <GlassControls />
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
                      <LiquidPanel className="flex flex-col justify-between">
                        <div>
                          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                            <MiniLiquidGlass width={48} height={48} />
                          </div>
                          <h4 className="text-white font-semibold text-lg mb-2">Dynamic Glass</h4>
                          <p className="text-white/70 text-sm">Real WebGL refraction on every element.</p>
                        </div>
                        <LiquidButton variant="secondary" size="sm">Learn More</LiquidButton>
                      </LiquidPanel>
                      
                      <LiquidPanel className="flex flex-col justify-between">
                        <div>
                          <div className="w-12 h-12 rounded-xl overflow-hidden mb-4">
                            <MiniLiquidGlass width={48} height={48} />
                          </div>
                          <h4 className="text-white font-semibold text-lg mb-2">Global Controls</h4>
                          <p className="text-white/70 text-sm">One slider changes everything.</p>
                        </div>
                        <LiquidButton variant="primary" size="sm">Get Started</LiquidButton>
                      </LiquidPanel>
                    </div>
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
                      <LiquidPanel>
                        <div className="flex flex-wrap gap-4 items-center">
                          <LiquidButton variant="primary">Primary</LiquidButton>
                          <LiquidButton variant="secondary">Secondary</LiquidButton>
                          <LiquidButton variant="ghost">Ghost</LiquidButton>
                          <LiquidButton variant="primary" size="lg">Large Button</LiquidButton>
                          <LiquidButton variant="primary" size="sm">Small</LiquidButton>
                        </div>
                      </LiquidPanel>
                    </div>

                    {/* Toggles */}
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-6">Toggles & Checkboxes</h3>
                      <LiquidPanel>
                        <div className="grid md:grid-cols-2 gap-8">
                          <div>
                            <h4 className="text-white/80 font-medium mb-4">Liquid Glass Toggle</h4>
                            <div className="space-y-4">
                              {['sm', 'md', 'lg'].map((size) => (
                                <div key={size} className="flex items-center justify-between">
                                  <span className="text-white/70 capitalize">{size === 'sm' ? 'Small' : size === 'md' ? 'Medium' : 'Large'}</span>
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
                      </LiquidPanel>
                    </div>

                    {/* Sliders with Glass Thumbs */}
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-6">Sliders (with Liquid Glass Thumb)</h3>
                      <LiquidPanel>
                        <div className="grid md:grid-cols-2 gap-8">
                          <div className="space-y-6">
                            <LiquidSliderWithGlassThumb label="Volume" value={75} showValue />
                            <LiquidSliderWithGlassThumb label="Brightness" value={50} showValue />
                            <LiquidSliderWithGlassThumb label="Opacity" value={100} showValue />
                          </div>
                          <div className="space-y-6">
                            <LiquidSliderWithGlassThumb label="Blur Radius" value={12} max={50} showValue />
                            <LiquidSliderWithGlassThumb label="Saturation" value={180} max={200} showValue />
                          </div>
                        </div>
                      </LiquidPanel>
                    </div>

                    {/* Inputs */}
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-6">Inputs</h3>
                      <LiquidPanel>
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
                      </LiquidPanel>
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
                      <LiquidPanel className="max-w-xl mx-auto">
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
                      </LiquidPanel>
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
    </GlassContext.Provider>
  );
}

export default App;
