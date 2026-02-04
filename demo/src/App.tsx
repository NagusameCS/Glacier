import { useState, useEffect, useRef, createContext, useContext, useMemo, useCallback } from 'react';
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

interface GlassElement {
  id: string;
  rect: DOMRect;
  borderRadius: number;
}

interface GlassContextType {
  params: GlassParams;
  setParams: (params: Partial<GlassParams>) => void;
  registerElement: (id: string, element: HTMLElement, borderRadius?: number) => void;
  unregisterElement: (id: string) => void;
  elements: Map<string, GlassElement>;
}

const GlassContext = createContext<GlassContextType>({
  params: { refraction: 1.4, dispersion: 7, blur: 0, fresnel: 0.5, glare: 0.4, roundness: 0.8 },
  setParams: () => {},
  registerElement: () => {},
  unregisterElement: () => {},
  elements: new Map(),
});

const useGlass = () => useContext(GlassContext);

// =============================================
// SHARED WEBGL GLASS RENDERER - ONE CONTEXT FOR ALL
// =============================================
function SharedGlassRenderer() {
  const { params, elements } = useGlass();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const rafRef = useRef<number>(0);
  const timeRef = useRef(0);
  const mouseRef = useRef({ x: 0, y: 0 });

  const vertexShader = `#version 300 es
    in vec2 a_position;
    in vec2 a_uv;
    out vec2 v_uv;
    out vec2 v_pos;
    uniform vec2 u_resolution;
    
    void main() {
      vec2 clipSpace = (a_position / u_resolution) * 2.0 - 1.0;
      gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
      v_uv = a_uv;
      v_pos = a_position;
    }`;

  const fragmentShader = `#version 300 es
    precision highp float;
    in vec2 v_uv;
    in vec2 v_pos;
    out vec4 fragColor;
    
    uniform float u_time;
    uniform vec2 u_mouse;
    uniform vec2 u_size;
    uniform vec2 u_center;
    uniform float u_borderRadius;
    uniform float u_fresnel;
    uniform float u_glare;
    uniform float u_dispersion;
    uniform float u_blur;
    uniform float u_roundness;
    
    float sdRoundedBox(vec2 p, vec2 b, float r) {
      vec2 q = abs(p) - b + r;
      return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
    }
    
    void main() {
      vec2 center = u_size * 0.5;
      vec2 p = (v_uv - 0.5) * u_size;
      
      float radius = min(u_borderRadius, min(u_size.x, u_size.y) * 0.5);
      float sd = sdRoundedBox(p, u_size * 0.5 - 1.0, radius);
      
      if (sd > 0.0) {
        discard;
      }
      
      float depth = clamp(-sd / (min(u_size.x, u_size.y) * 0.5), 0.0, 1.0);
      
      // Base glass color
      vec3 baseColor = vec3(0.92, 0.94, 0.98);
      
      // Fresnel edge brightness
      float fresnelFactor = pow(1.0 - depth, 3.0) * u_fresnel;
      
      // Animated glare based on position
      vec2 glareDir = normalize(v_pos - u_mouse);
      float angle = atan(glareDir.y, glareDir.x) + u_time * 0.3;
      float glareFactor = (0.5 + sin(angle * 2.0) * 0.5) * (1.0 - depth * 0.5) * u_glare;
      glareFactor = pow(glareFactor, 1.5);
      
      // Mouse proximity glow
      float mouseDist = length(v_pos - u_mouse);
      float mouseGlow = exp(-mouseDist * 0.003) * u_glare * 0.5;
      
      // Chromatic hints
      float dispersionHint = u_dispersion * 0.005 * (1.0 - depth);
      
      vec3 color = baseColor;
      color.r += dispersionHint * 0.3;
      color.b -= dispersionHint * 0.2;
      
      // Apply effects
      color = mix(color, vec3(1.0), fresnelFactor * 0.5);
      color = mix(color, vec3(1.0, 1.0, 0.98), glareFactor * 0.4);
      color += vec3(mouseGlow * 0.3, mouseGlow * 0.2, mouseGlow * 0.4);
      
      // Edge darkening
      color *= mix(0.9, 1.0, smoothstep(0.0, 0.15, depth));
      
      // Inner shadow at edges
      float innerShadow = smoothstep(0.0, 8.0, -sd) * 0.15;
      color *= (1.0 - innerShadow);
      
      // Top highlight
      float topHighlight = smoothstep(0.4, 0.0, v_uv.y) * (1.0 - depth) * 0.2 * u_fresnel;
      color += topHighlight;
      
      float alpha = smoothstep(1.0, -1.0, sd) * (0.7 + u_fresnel * 0.25);
      
      fragColor = vec4(color, alpha);
    }`;

  // Initialize WebGL once
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2', { 
      alpha: true, 
      premultipliedAlpha: false,
      antialias: true 
    });
    if (!gl) {
      console.error('WebGL2 not supported');
      return;
    }
    glRef.current = gl;

    // Create shaders
    const createShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader error:', gl.getShaderInfoLog(shader));
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
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }
    programRef.current = program;

    // Mouse tracking
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, []);

  // Render loop
  useEffect(() => {
    const gl = glRef.current;
    const program = programRef.current;
    if (!gl || !program) return;

    const render = () => {
      timeRef.current += 0.016;
      
      const dpr = window.devicePixelRatio || 1;
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      if (canvasRef.current) {
        canvasRef.current.width = width * dpr;
        canvasRef.current.height = height * dpr;
        canvasRef.current.style.width = `${width}px`;
        canvasRef.current.style.height = `${height}px`;
      }
      
      gl.viewport(0, 0, width * dpr, height * dpr);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      
      gl.useProgram(program);

      // Get uniform locations
      const uResolution = gl.getUniformLocation(program, 'u_resolution');
      const uTime = gl.getUniformLocation(program, 'u_time');
      const uMouse = gl.getUniformLocation(program, 'u_mouse');
      const uSize = gl.getUniformLocation(program, 'u_size');
      const uCenter = gl.getUniformLocation(program, 'u_center');
      const uBorderRadius = gl.getUniformLocation(program, 'u_borderRadius');
      const uFresnel = gl.getUniformLocation(program, 'u_fresnel');
      const uGlare = gl.getUniformLocation(program, 'u_glare');
      const uDispersion = gl.getUniformLocation(program, 'u_dispersion');
      const uBlur = gl.getUniformLocation(program, 'u_blur');
      const uRoundness = gl.getUniformLocation(program, 'u_roundness');

      gl.uniform2f(uResolution, width * dpr, height * dpr);
      gl.uniform1f(uTime, timeRef.current);
      gl.uniform2f(uMouse, mouseRef.current.x * dpr, mouseRef.current.y * dpr);
      gl.uniform1f(uFresnel, params.fresnel);
      gl.uniform1f(uGlare, params.glare);
      gl.uniform1f(uDispersion, params.dispersion);
      gl.uniform1f(uBlur, params.blur);
      gl.uniform1f(uRoundness, params.roundness);

      // Render each registered element
      elements.forEach((element) => {
        const { rect, borderRadius } = element;
        
        const x = rect.left * dpr;
        const y = rect.top * dpr;
        const w = rect.width * dpr;
        const h = rect.height * dpr;
        
        // Create quad for this element
        const positions = new Float32Array([
          x, y,         0, 0,
          x + w, y,     1, 0,
          x, y + h,     0, 1,
          x, y + h,     0, 1,
          x + w, y,     1, 0,
          x + w, y + h, 1, 1,
        ]);

        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);

        const aPosition = gl.getAttribLocation(program, 'a_position');
        const aUv = gl.getAttribLocation(program, 'a_uv');
        
        gl.enableVertexAttribArray(aPosition);
        gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 16, 0);
        gl.enableVertexAttribArray(aUv);
        gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 16, 8);

        gl.uniform2f(uSize, w, h);
        gl.uniform2f(uCenter, x + w / 2, y + h / 2);
        gl.uniform1f(uBorderRadius, borderRadius * dpr);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.deleteBuffer(buffer);
      });

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [params, elements]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[100]"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
}

// =============================================
// GLASS PANEL - Registers with shared renderer
// =============================================
let panelIdCounter = 0;

function GlassPanel({ 
  children, 
  className = '',
  padding = 'p-6',
  borderRadius = 24,
}: { 
  children: React.ReactNode;
  className?: string;
  padding?: string;
  borderRadius?: number;
}) {
  const { registerElement, unregisterElement } = useGlass();
  const panelRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(`panel-${++panelIdCounter}`);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    const updateRect = () => {
      registerElement(idRef.current, panel, borderRadius);
    };

    updateRect();
    
    const observer = new ResizeObserver(updateRect);
    observer.observe(panel);
    
    window.addEventListener('scroll', updateRect, true);
    window.addEventListener('resize', updateRect);

    return () => {
      unregisterElement(idRef.current);
      observer.disconnect();
      window.removeEventListener('scroll', updateRect, true);
      window.removeEventListener('resize', updateRect);
    };
  }, [registerElement, unregisterElement, borderRadius]);

  return (
    <div
      ref={panelRef}
      className={`relative overflow-hidden ${className}`}
      style={{ borderRadius }}
    >
      <div className={`relative z-10 ${padding}`}>{children}</div>
    </div>
  );
}

// =============================================
// GLASS SLIDER WITH WEBGL THUMB
// =============================================
let sliderIdCounter = 0;

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
  const { registerElement, unregisterElement, params } = useGlass();
  const [currentValue, setCurrentValue] = useState(value);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(`thumb-${++sliderIdCounter}`);

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  const percentage = ((currentValue - min) / (max - min)) * 100;

  // Register thumb with WebGL renderer
  useEffect(() => {
    const thumb = thumbRef.current;
    if (!thumb) return;

    const updateRect = () => {
      registerElement(idRef.current, thumb, 50); // 50% = circle
    };

    updateRect();
    const interval = setInterval(updateRect, 50); // Update frequently for smooth tracking

    return () => {
      clearInterval(interval);
      unregisterElement(idRef.current);
    };
  }, [registerElement, unregisterElement, percentage]);

  const updateValue = useCallback((clientX: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const newValue = Math.round((x / rect.width) * (max - min) + min);
    setCurrentValue(newValue);
    onChange?.(newValue);
  }, [max, min, onChange]);

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
            className="absolute inset-y-0 left-0 transition-[width] duration-75"
            style={{
              width: `${percentage}%`,
              background: `linear-gradient(90deg, 
                rgba(59, 130, 246, ${0.7 + params.fresnel * 0.2}), 
                rgba(147, 51, 234, ${0.7 + params.fresnel * 0.2}))`,
              boxShadow: `0 0 ${10 + params.glare * 10}px rgba(59, 130, 246, ${0.3 + params.glare * 0.2})`,
            }}
          />
        </div>
        
        {/* WebGL Glass Thumb - just a positioned div that gets rendered by WebGL */}
        <div
          ref={thumbRef}
          className="absolute top-1/2 transition-transform duration-75"
          style={{
            left: `${percentage}%`,
            width: isDragging ? 32 : 28,
            height: isDragging ? 32 : 28,
            transform: `translate(-50%, -50%) scale(${isDragging ? 1.1 : 1})`,
            borderRadius: '50%',
          }}
        />
      </div>
    </div>
  );
}

// =============================================
// ANIMATED TAB BAR
// =============================================
let tabIdCounter = 0;

function GlassTabs({ 
  tabs, 
  activeTab, 
  onChange 
}: { 
  tabs: { id: string; label: string; icon: string }[];
  activeTab: string;
  onChange: (id: string) => void;
}) {
  const { registerElement, unregisterElement } = useGlass();
  const containerRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(`tab-indicator-${++tabIdCounter}`);
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

  // Register indicator with WebGL
  useEffect(() => {
    const indicator = indicatorRef.current;
    if (!indicator) return;

    const updateRect = () => {
      registerElement(idRef.current, indicator, 12);
    };

    const timeout = setTimeout(updateRect, 50); // Wait for position to settle
    const interval = setInterval(updateRect, 100);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
      unregisterElement(idRef.current);
    };
  }, [registerElement, unregisterElement, indicatorStyle]);

  return (
    <GlassPanel padding="p-1.5" className="inline-block" borderRadius={20}>
      <div ref={containerRef} className="relative flex gap-1">
        {/* Sliding WebGL glass indicator */}
        <div
          ref={indicatorRef}
          className="absolute top-0 bottom-0 transition-all duration-500 ease-out"
          style={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
            borderRadius: 12,
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
let cursorIdCounter = 0;

function LiquidCursor() {
  const { registerElement, unregisterElement } = useGlass();
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [visible, setVisible] = useState(false);
  const cursorRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(`cursor-${++cursorIdCounter}`);
  
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

  // Register cursor with WebGL
  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor || !visible) return;

    const updateRect = () => {
      registerElement(idRef.current, cursor, 50);
    };

    updateRect();

    return () => {
      unregisterElement(idRef.current);
    };
  }, [registerElement, unregisterElement, pos, visible]);

  if (!visible) return null;

  return (
    <div
      ref={cursorRef}
      className="fixed pointer-events-none z-[9998]"
      style={{
        left: pos.x - 16,
        top: pos.y - 16,
        width: 32,
        height: 32,
        borderRadius: '50%',
      }}
    />
  );
}

// =============================================
// GLASS CONTROLS
// =============================================
function GlassControls() {
  const { params, setParams } = useGlass();
  
  return (
    <GlassPanel className="sticky top-4" borderRadius={24}>
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
  
  const [elements, setElements] = useState<Map<string, GlassElement>>(new Map());

  const registerElement = useCallback((id: string, element: HTMLElement, borderRadius = 24) => {
    const rect = element.getBoundingClientRect();
    setElements(prev => {
      const next = new Map(prev);
      next.set(id, { id, rect, borderRadius });
      return next;
    });
  }, []);

  const unregisterElement = useCallback((id: string) => {
    setElements(prev => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const contextValue = useMemo(() => ({
    params: glassParams,
    setParams: (newParams: Partial<GlassParams>) => 
      setGlassParams(prev => ({ ...prev, ...newParams })),
    registerElement,
    unregisterElement,
    elements,
  }), [glassParams, registerElement, unregisterElement, elements]);

  const tabs = [
    { id: 'liquid', label: 'Liquid Glass', icon: '🔮' },
    { id: 'frosted', label: 'Frosted Glass', icon: '❄️' },
    { id: 'components', label: 'Components', icon: '🎨' },
  ];

  return (
    <GlassContext.Provider value={contextValue}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden cursor-none">
        {/* Shared WebGL renderer - ONE context for all glass */}
        <SharedGlassRenderer />
        
        {/* Liquid Glass Cursor */}
        <LiquidCursor />
        
        {/* Animated background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl" />
        </div>

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
                    <GlassPanel padding="p-2" borderRadius={24}>
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
                      <GlassPanel key={i} padding="p-2" borderRadius={24}>
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
                          { title: 'Subtle', desc: 'Light refraction, perfect for overlays' },
                          { title: 'Standard', desc: 'Balanced glass effect for cards' },
                          { title: 'Heavy', desc: 'Maximum glass distortion for impact' },
                        ].map((item, i) => (
                          <GlassPanel key={i} borderRadius={24}>
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
                          <GlassPanel className="flex flex-col justify-between" borderRadius={24}>
                            <div>
                              <h4 className="text-white font-semibold text-lg mb-2">Dynamic Glass</h4>
                              <p className="text-white/70 text-sm">Real-time parameter changes affect all glass.</p>
                            </div>
                            <LiquidButton variant="secondary" size="sm">Learn More</LiquidButton>
                          </GlassPanel>
                          
                          <GlassPanel className="flex flex-col justify-between" borderRadius={24}>
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
                      <h3 className="text-2xl font-bold text-white mb-6">Sliders (WebGL Glass Thumb)</h3>
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
                      <GlassPanel className="max-w-xl mx-auto" borderRadius={24}>
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
