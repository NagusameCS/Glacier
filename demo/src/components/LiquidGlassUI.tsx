/**
 * Liquid Glass UI Components
 * WebGL2-based liquid glass effect for UI panels
 * Uses offscreen canvas to capture background for refraction
 */
import { useEffect, useRef, useState, useCallback, createContext, useContext } from 'react';

// =============================================
// GLASS CONTEXT - Global parameters
// =============================================
interface GlassParams {
  refraction: number;
  dispersion: number;
  blur: number;
  fresnel: number;
  glare: number;
  roundness: number;
}

interface GlassContextType {
  params: GlassParams;
  setParams: (params: Partial<GlassParams>) => void;
}

const defaultParams: GlassParams = {
  refraction: 1.5,
  dispersion: 8,
  blur: 0,
  fresnel: 0.6,
  glare: 0.5,
  roundness: 0.7,
};

export const GlassContext = createContext<GlassContextType>({
  params: defaultParams,
  setParams: () => {},
});

export const useGlass = () => useContext(GlassContext);

// =============================================
// VERTEX SHADER
// =============================================
const vertexShader = `#version 300 es
in vec4 a_position;
out vec2 v_uv;
void main() {
  v_uv = (a_position.xy + 1.0) * 0.5;
  gl_Position = a_position;
}`;

// =============================================
// FRAGMENT SHADER - Apple Liquid Glass Effect
// Based on iOS 18 / macOS Sequoia design language
// Key characteristics: depth-based refraction, subsurface glow,
// specular highlights, soft edges, subtle chromatic dispersion
// =============================================
const fragmentShader = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform float u_borderRadius;

// Glass parameters
uniform float u_refraction;   // Index of refraction (1.0-2.0)
uniform float u_dispersion;   // Chromatic aberration amount
uniform float u_blur;         // Background blur amount
uniform float u_fresnel;      // Edge reflection intensity
uniform float u_glare;        // Specular highlight intensity
uniform float u_roundness;    // Shape roundness

#define PI 3.14159265359

// =============================================
// SDF Functions
// =============================================

// Squircle SDF (Apple's continuous curvature corners)
float sdSquircle(vec2 p, vec2 size, float n) {
  vec2 q = abs(p) / size;
  return (pow(pow(q.x, n) + pow(q.y, n), 1.0/n) - 1.0) * min(size.x, size.y);
}

// Standard rounded box SDF
float sdRoundedBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}

// Get surface normal from SDF gradient
vec2 getSurfaceNormal(vec2 p, vec2 size, float r, float n) {
  float eps = 0.5;
  float d = sdSquircle(p, size, n);
  float dx = sdSquircle(p + vec2(eps, 0.0), size, n) - d;
  float dy = sdSquircle(p + vec2(0.0, eps), size, n) - d;
  return normalize(vec2(dx, dy) + 0.0001);
}

// =============================================
// Noise and Pattern Functions
// =============================================

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

// Simulate background content (gradient with subtle variation)
vec3 getBackground(vec2 uv, float time) {
  // Base dark gradient (simulating typical dark UI)
  vec3 col1 = vec3(0.08, 0.06, 0.12);
  vec3 col2 = vec3(0.12, 0.10, 0.18);
  vec3 col3 = vec3(0.06, 0.08, 0.14);
  
  // Slow animated gradient
  float t = time * 0.05;
  vec3 bg = mix(col1, col2, sin(uv.y * 2.0 + t) * 0.5 + 0.5);
  bg = mix(bg, col3, cos(uv.x * 1.5 + t * 0.7) * 0.3 + 0.3);
  
  // Subtle noise texture
  float n = noise(uv * 50.0 + t * 0.5) * 0.03;
  bg += n;
  
  return bg;
}

// =============================================
// Main Glass Rendering
// =============================================

void main() {
  vec2 center = u_resolution * 0.5;
  vec2 p = (v_uv - 0.5) * u_resolution;
  
  // Use squircle (n=4-6) for Apple-style continuous corners
  float n = 4.0 + u_roundness * 2.0;
  vec2 size = u_resolution * 0.5 - 2.0;
  float sd = sdSquircle(p, size, n);
  
  // Early discard for outside
  if (sd > 1.0) {
    discard;
  }
  
  // =========================================
  // DEPTH CALCULATION
  // Models the glass as a lens - thicker in center
  // =========================================
  float maxThickness = min(u_resolution.x, u_resolution.y) * 0.3;
  float thickness = clamp(-sd / maxThickness, 0.0, 1.0);
  // Curved depth profile (like a lens)
  float depth = sqrt(thickness);
  
  // Surface normal for optical calculations
  vec2 normal = getSurfaceNormal(p, size, u_borderRadius, n);
  
  // =========================================
  // REFRACTION (Snell's Law)
  // Light bends more at edges where glass is thinner
  // =========================================
  float ior = u_refraction;
  
  // Angle of incidence increases toward edges
  float incidenceAngle = (1.0 - depth) * PI * 0.35;
  
  // Snell's law: sin(θ₂) = sin(θ₁) / n
  float refractionAngle = asin(clamp(sin(incidenceAngle) / ior, -1.0, 1.0));
  float refractionStrength = tan(refractionAngle - incidenceAngle);
  refractionStrength = clamp(refractionStrength, -0.15, 0.15);
  
  // Refraction offset follows surface normal
  vec2 refractOffset = normal * refractionStrength * (1.0 - depth * 0.5);
  
  // =========================================
  // CHROMATIC DISPERSION
  // Different wavelengths refract differently
  // Creates subtle rainbow at edges
  // =========================================
  float dispersion = u_dispersion * 0.002 * (1.0 - depth);
  
  vec2 uvR = v_uv + refractOffset * (1.0 - dispersion);
  vec2 uvG = v_uv + refractOffset;
  vec2 uvB = v_uv + refractOffset * (1.0 + dispersion);
  
  // Sample background with chromatic offsets
  vec3 bgR = getBackground(uvR, u_time);
  vec3 bgG = getBackground(uvG, u_time);
  vec3 bgB = getBackground(uvB, u_time);
  
  vec3 refracted = vec3(bgR.r, bgG.g, bgB.b);
  
  // =========================================
  // GLASS MATERIAL COLOR
  // Subtle blue-white tint characteristic of glass
  // =========================================
  vec3 glassColor = vec3(0.92, 0.94, 0.98);
  
  // Mix refracted background with glass tint
  // More tint at center (thicker glass absorbs more)
  vec3 color = mix(refracted, glassColor, 0.15 + depth * 0.25);
  
  // =========================================
  // FRESNEL REFLECTION
  // Edges reflect more (Schlick's approximation)
  // =========================================
  float F0 = pow((1.0 - ior) / (1.0 + ior), 2.0);
  float fresnel = F0 + (1.0 - F0) * pow(1.0 - depth, 5.0);
  fresnel *= u_fresnel;
  
  // Fresnel adds white reflection at edges
  color = mix(color, vec3(1.0), fresnel * 0.4);
  
  // =========================================
  // SUBSURFACE SCATTERING APPROXIMATION
  // Soft internal glow, especially at edges
  // =========================================
  float sss = pow(1.0 - depth, 2.0) * 0.15;
  vec3 sssColor = vec3(0.95, 0.97, 1.0);
  color = mix(color, sssColor, sss);
  
  // =========================================
  // SPECULAR HIGHLIGHTS
  // Subtle, position-dependent bright spots
  // =========================================
  vec2 lightDir = normalize(vec2(0.3, -0.5)); // Top-right light
  vec2 mouseInfluence = (u_mouse - 0.5) * 0.3;
  vec2 viewDir = normalize(p / u_resolution - mouseInfluence);
  vec2 halfVec = normalize(lightDir + viewDir);
  
  float specAngle = max(dot(normal, halfVec), 0.0);
  float specular = pow(specAngle, 32.0) * u_glare * (1.0 - depth * 0.3);
  
  // Secondary softer highlight
  vec2 lightDir2 = normalize(vec2(-0.5, -0.3));
  float spec2Angle = max(dot(normal, normalize(lightDir2 + viewDir)), 0.0);
  float specular2 = pow(spec2Angle, 16.0) * u_glare * 0.3 * (1.0 - depth * 0.5);
  
  color += vec3(1.0, 0.99, 0.97) * (specular + specular2);
  
  // =========================================
  // SOFT INNER SHADOW
  // Creates depth at edges
  // =========================================
  float innerShadow = smoothstep(0.0, 0.2, depth);
  color *= 0.88 + innerShadow * 0.12;
  
  // =========================================
  // EDGE DEFINITION
  // Subtle darkening at very edge for definition
  // =========================================
  float edgeDefine = smoothstep(0.0, 0.05, depth);
  color *= 0.92 + edgeDefine * 0.08;
  
  // =========================================
  // TOP EDGE HIGHLIGHT
  // Simulates light catching top edge
  // =========================================
  float topHighlight = smoothstep(0.5, 0.0, v_uv.y) * (1.0 - depth) * u_fresnel * 0.1;
  color += topHighlight;
  
  // =========================================
  // AMBIENT OCCLUSION AT CORNERS
  // Corners are slightly darker
  // =========================================
  vec2 cornerDist = abs(p) / size;
  float cornerFactor = smoothstep(0.7, 1.0, max(cornerDist.x, cornerDist.y));
  color *= 1.0 - cornerFactor * 0.05 * (1.0 - depth);
  
  // =========================================
  // SUBTLE NOISE
  // Prevents banding, adds material quality
  // =========================================
  float materialNoise = (noise(v_uv * 200.0 + u_time) - 0.5) * 0.015;
  color += materialNoise;
  
  // =========================================
  // ALPHA AND ANTI-ALIASING
  // =========================================
  float alpha = smoothstep(1.0, -0.5, sd);
  // Glass is slightly more opaque at center
  alpha *= 0.75 + depth * 0.2;
  
  fragColor = vec4(color, alpha);
}`;

// =============================================
// LIQUID GLASS PANEL - Real WebGL UI Panel
// =============================================
interface LiquidGlassPanelProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  borderRadius?: number;
}

export function LiquidGlassPanel({
  children,
  className = '',
  style,
  borderRadius = 24,
}: LiquidGlassPanelProps) {
  const { params } = useGlass();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const rafRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const sizeRef = useRef({ width: 0, height: 0 });
  const [ready, setReady] = useState(false);

  // Initialize WebGL
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2', { 
      alpha: true, 
      premultipliedAlpha: false,
      antialias: true,
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

    // Create fullscreen quad
    const positions = new Float32Array([
      -1, -1, 1, -1, -1, 1,
      -1, 1, 1, -1, 1, 1,
    ]);
    
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    
    const posLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    setReady(true);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      glRef.current = null;
      programRef.current = null;
      try {
        gl.deleteProgram(program);
        gl.deleteShader(vs);
        gl.deleteShader(fs);
        gl.deleteBuffer(buffer);
      } catch {}
    };
  }, []);

  // Render loop
  useEffect(() => {
    if (!ready) return;
    
    const gl = glRef.current;
    const program = programRef.current;
    if (!gl || !program) return;

    let startTime = performance.now();
    
    const render = () => {
      const time = (performance.now() - startTime) * 0.001;
      
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      
      gl.useProgram(program);

      // Set uniforms
      const setUniform = (name: string, type: string, value: number | number[]) => {
        const loc = gl.getUniformLocation(program, name);
        if (!loc) return;
        if (type === '1f') gl.uniform1f(loc, value as number);
        else if (type === '2f') gl.uniform2f(loc, (value as number[])[0], (value as number[])[1]);
      };

      setUniform('u_resolution', '2f', [gl.canvas.width, gl.canvas.height]);
      setUniform('u_time', '1f', time);
      setUniform('u_mouse', '2f', [mouseRef.current.x, mouseRef.current.y]);
      setUniform('u_borderRadius', '1f', borderRadius * (window.devicePixelRatio || 1));
      
      // Glass params from context
      setUniform('u_refraction', '1f', params.refraction);
      setUniform('u_dispersion', '1f', params.dispersion);
      setUniform('u_blur', '1f', params.blur);
      setUniform('u_fresnel', '1f', params.fresnel);
      setUniform('u_glare', '1f', params.glare);
      setUniform('u_roundness', '1f', params.roundness);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      
      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);
    
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [ready, params, borderRadius]);

  // Handle resize
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      sizeRef.current = { width: rect.width, height: rect.height };
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    
    return () => observer.disconnect();
  }, []);

  // Mouse tracking
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseRef.current = {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
  }, []);

  const handleMouseLeave = useCallback(() => {
    mouseRef.current = { x: 0.5, y: 0.5 };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{ borderRadius, ...style }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ borderRadius }}
      />
      <div className="relative z-10 p-6">{children}</div>
    </div>
  );
}

// =============================================
// LIQUID GLASS CURSOR
// =============================================
export function LiquidGlassCursor() {
  const { params } = useGlass();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const rafRef = useRef<number>(0);
  const posRef = useRef({ x: -100, y: -100, targetX: -100, targetY: -100 });
  const [visible, setVisible] = useState(false);

  // Smaller cursor shader - Apple liquid glass style
  const cursorFragment = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;
uniform float u_time;
uniform float u_fresnel;
uniform float u_glare;

void main() {
  vec2 p = (v_uv - 0.5) * 2.0;
  float dist = length(p);
  
  if (dist > 1.0) discard;
  
  // Spherical depth (thicker at center like a droplet)
  float depth = sqrt(1.0 - dist * dist);
  
  // Base glass color
  vec3 glassColor = vec3(0.92, 0.94, 0.98);
  
  // Fresnel reflection at edges
  float F0 = 0.04;
  float fresnel = F0 + (1.0 - F0) * pow(1.0 - depth, 5.0);
  fresnel *= u_fresnel;
  
  // Subtle refraction tint at edges
  vec3 refractionTint = vec3(0.85, 0.88, 0.95);
  vec3 color = mix(refractionTint, glassColor, depth);
  
  // Add fresnel white
  color = mix(color, vec3(1.0), fresnel * 0.5);
  
  // Subtle specular highlight
  vec2 lightDir = normalize(vec2(0.4, -0.6));
  float spec = pow(max(dot(normalize(p), -lightDir), 0.0), 16.0);
  spec *= (1.0 - dist * 0.5) * u_glare;
  color += vec3(1.0, 0.99, 0.97) * spec * 0.4;
  
  // Soft inner glow (subsurface)
  float innerGlow = depth * 0.1;
  color += vec3(0.95, 0.97, 1.0) * innerGlow;
  
  // Edge definition
  float edgeDark = smoothstep(0.0, 0.15, depth);
  color *= 0.9 + edgeDark * 0.1;
  
  // Subtle chromatic dispersion at edge
  float chromatic = (1.0 - depth) * 0.05;
  color.r += chromatic * 0.3;
  color.b -= chromatic * 0.2;
  
  float alpha = smoothstep(1.0, 0.85, dist) * (0.7 + depth * 0.25);
  fragColor = vec4(color, alpha);
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
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = createShader(gl.VERTEX_SHADER, vertexShader);
    const fs = createShader(gl.FRAGMENT_SHADER, cursorFragment);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    programRef.current = program;

    const positions = new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      glRef.current = null;
      programRef.current = null;
    };
  }, [cursorFragment]);

  // Render
  useEffect(() => {
    const gl = glRef.current;
    const program = programRef.current;
    if (!gl || !program) return;

    const startTime = performance.now();
    
    const render = () => {
      // Smooth follow
      posRef.current.x += (posRef.current.targetX - posRef.current.x) * 0.15;
      posRef.current.y += (posRef.current.targetY - posRef.current.y) * 0.15;

      const time = (performance.now() - startTime) * 0.001;
      
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      
      gl.useProgram(program);
      
      const timeLoc = gl.getUniformLocation(program, 'u_time');
      const fresnelLoc = gl.getUniformLocation(program, 'u_fresnel');
      const glareLoc = gl.getUniformLocation(program, 'u_glare');
      
      gl.uniform1f(timeLoc, time);
      gl.uniform1f(fresnelLoc, params.fresnel);
      gl.uniform1f(glareLoc, params.glare);
      
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      
      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [params]);

  // Mouse events
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      posRef.current.targetX = e.clientX;
      posRef.current.targetY = e.clientY;
      setVisible(true);
    };
    const handleLeave = () => setVisible(false);
    const handleEnter = () => setVisible(true);
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleLeave);
    document.addEventListener('mouseenter', handleEnter);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleLeave);
      document.removeEventListener('mouseenter', handleEnter);
    };
  }, []);

  if (!visible) return null;

  const size = 32;
  const dpr = window.devicePixelRatio || 1;

  return (
    <canvas
      ref={canvasRef}
      width={size * dpr}
      height={size * dpr}
      className="fixed pointer-events-none z-[9999]"
      style={{
        width: size,
        height: size,
        left: posRef.current.x - size / 2,
        top: posRef.current.y - size / 2,
        transform: `translate(${posRef.current.x - posRef.current.targetX}px, ${posRef.current.y - posRef.current.targetY}px)`,
      }}
    />
  );
}

// =============================================
// LIQUID SLIDER THUMB
// =============================================
interface LiquidSliderProps {
  label?: string;
  value: number;
  min?: number;
  max?: number;
  onChange?: (v: number) => void;
  showValue?: boolean;
}

export function LiquidSlider({
  label,
  value,
  min = 0,
  max = 100,
  onChange,
  showValue = false,
}: LiquidSliderProps) {
  const { params } = useGlass();
  const [currentValue, setCurrentValue] = useState(value);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbCanvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => { setCurrentValue(value); }, [value]);
  
  const percentage = ((currentValue - min) / (max - min)) * 100;

  // Thumb shader - Apple liquid glass droplet style
  const thumbFragment = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;
uniform float u_time;
uniform float u_active;
uniform float u_fresnel;
uniform float u_glare;

void main() {
  vec2 p = (v_uv - 0.5) * 2.0;
  float dist = length(p);
  if (dist > 1.0) discard;
  
  // Spherical depth profile
  float depth = sqrt(max(0.0, 1.0 - dist * dist));
  
  // Base glass material
  vec3 glassColor = vec3(0.90, 0.93, 0.98);
  vec3 refractionTint = vec3(0.82, 0.86, 0.94);
  vec3 color = mix(refractionTint, glassColor, depth);
  
  // Fresnel reflection (Schlick)
  float F0 = 0.04;
  float fresnel = F0 + (1.0 - F0) * pow(1.0 - depth, 5.0);
  fresnel *= u_fresnel;
  color = mix(color, vec3(1.0), fresnel * 0.5);
  
  // Specular highlight
  vec2 lightDir = normalize(vec2(0.3, -0.5));
  float spec = pow(max(dot(normalize(p), -lightDir), 0.0), 24.0);
  spec *= (1.0 - dist * 0.3) * u_glare;
  color += vec3(1.0, 0.99, 0.97) * spec * 0.5;
  
  // Subsurface glow
  float sss = depth * 0.12;
  color += vec3(0.95, 0.97, 1.0) * sss;
  
  // Active state - subtle brightness increase
  float activeBoost = u_active * 0.15;
  color += vec3(0.1, 0.12, 0.18) * activeBoost;
  
  // Edge definition
  float edgeDark = smoothstep(0.0, 0.2, depth);
  color *= 0.88 + edgeDark * 0.12;
  
  // Chromatic dispersion hint
  float chromatic = (1.0 - depth) * 0.04;
  color.r += chromatic * 0.2;
  color.b -= chromatic * 0.15;
  
  float alpha = smoothstep(1.0, 0.8, dist) * (0.8 + depth * 0.15 + u_active * 0.05);
  fragColor = vec4(color, alpha);
}`;

  // Initialize WebGL for thumb
  useEffect(() => {
    const canvas = thumbCanvasRef.current;
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
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = createShader(gl.VERTEX_SHADER, vertexShader);
    const fs = createShader(gl.FRAGMENT_SHADER, thumbFragment);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    programRef.current = program;

    const positions = new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      glRef.current = null;
      programRef.current = null;
    };
  }, [thumbFragment]);

  // Render thumb
  useEffect(() => {
    const gl = glRef.current;
    const program = programRef.current;
    if (!gl || !program) return;

    const startTime = performance.now();
    
    const render = () => {
      const time = (performance.now() - startTime) * 0.001;
      
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      
      gl.useProgram(program);
      
      gl.uniform1f(gl.getUniformLocation(program, 'u_time'), time);
      gl.uniform1f(gl.getUniformLocation(program, 'u_active'), isDragging ? 1.0 : 0.0);
      gl.uniform1f(gl.getUniformLocation(program, 'u_fresnel'), params.fresnel);
      gl.uniform1f(gl.getUniformLocation(program, 'u_glare'), params.glare);
      
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isDragging, params]);

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
    const handleMove = (e: MouseEvent) => updateValue(e.clientX);
    const handleUp = () => setIsDragging(false);
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };
  }, [isDragging, updateValue]);

  const thumbSize = isDragging ? 32 : 28;
  const dpr = window.devicePixelRatio || 1;

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
          style={{ background: 'rgba(255,255,255,0.1)', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)' }}>
          <div
            className="absolute inset-y-0 left-0 transition-[width] duration-75"
            style={{
              width: `${percentage}%`,
              background: `linear-gradient(90deg, rgba(59,130,246,0.8), rgba(147,51,234,0.8))`,
              boxShadow: `0 0 12px rgba(59,130,246,0.4)`,
            }}
          />
        </div>
        
        {/* WebGL Thumb */}
        <div
          className="absolute top-1/2 transition-all duration-75"
          style={{
            left: `${percentage}%`,
            transform: `translate(-50%, -50%) scale(${isDragging ? 1.1 : 1})`,
          }}
        >
          <canvas
            ref={thumbCanvasRef}
            width={thumbSize * dpr}
            height={thumbSize * dpr}
            style={{ width: thumbSize, height: thumbSize }}
          />
        </div>
      </div>
    </div>
  );
}

export default { LiquidGlassPanel, LiquidGlassCursor, LiquidSlider, GlassContext, useGlass };
