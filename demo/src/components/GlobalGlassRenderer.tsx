/**
 * Global WebGL Glass Renderer
 * Single WebGL context that renders multiple glass rectangles
 * All UI panels can register themselves to be rendered with real liquid glass
 */
import { useEffect, useRef, useState, useCallback, createContext, useContext } from 'react';

// =============================================
// GLASS REGISTRY - Track all glass panels
// =============================================
interface GlassRect {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  roundness: number;
  intensity: 'light' | 'normal' | 'heavy';
}

interface GlassRegistryContextType {
  registerGlass: (rect: GlassRect) => void;
  unregisterGlass: (id: string) => void;
  updateGlass: (id: string, rect: Partial<GlassRect>) => void;
}

const GlassRegistryContext = createContext<GlassRegistryContextType>({
  registerGlass: () => {},
  unregisterGlass: () => {},
  updateGlass: () => {},
});

export const useGlassRegistry = () => useContext(GlassRegistryContext);

// =============================================
// SHADERS
// =============================================
const vertexShaderSource = `#version 300 es
in vec4 a_position;
out vec2 v_uv;

void main() {
  v_uv = (a_position.xy + 1.0) * 0.5;
  gl_Position = a_position;
}`;

// Fragment shader that supports multiple glass rectangles
const fragmentShaderSource = `#version 300 es
precision highp float;

#define MAX_RECTS 32
#define PI 3.14159265359

in vec2 v_uv;
out vec4 fragColor;

uniform sampler2D u_background;
uniform vec2 u_resolution;
uniform float u_time;

// Glass parameters (global)
uniform float u_refFactor;
uniform float u_refDispersion;
uniform float u_fresnelFactor;
uniform float u_glareFactor;
uniform float u_glareAngle;
uniform float u_blur;
uniform vec4 u_tint;
uniform float u_liquidWobble;
uniform float u_thickness;

// Rectangle data: [x, y, width, height] for each rect
uniform vec4 u_rects[MAX_RECTS];
// Rect params: [roundness, intensity, enabled, 0]
uniform vec4 u_rectParams[MAX_RECTS];
uniform int u_rectCount;

// Noise functions
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 3; i++) {
    value += amplitude * noise(p);
    p *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

// SDF for rounded rectangle with liquid wobble
float sdRoundedRect(vec2 p, vec2 size, float radius, float wobble, float rectIdx) {
  // Add subtle liquid wobble
  float angle = atan(p.y, p.x);
  float wobbleAmount = wobble * 3.0;
  float wobbleOffset = sin(angle * 4.0 + u_time * 1.5 + rectIdx) * wobbleAmount
                     + sin(angle * 6.0 - u_time * 2.0) * wobbleAmount * 0.4;
  wobbleOffset += fbm(vec2(angle * 1.5, u_time * 0.3 + rectIdx * 0.5)) * wobbleAmount * 0.5;
  
  vec2 q = abs(p) - size + radius + wobbleOffset;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - radius;
}

// Get normal from SDF
vec2 getNormal(vec2 p, vec2 size, float radius, float wobble, float rectIdx) {
  float eps = 0.5;
  float d = sdRoundedRect(p, size, radius, wobble, rectIdx);
  float dx = sdRoundedRect(p + vec2(eps, 0.0), size, radius, wobble, rectIdx) - d;
  float dy = sdRoundedRect(p + vec2(0.0, eps), size, radius, wobble, rectIdx) - d;
  return normalize(vec2(dx, dy));
}

// Blur sampling
vec4 blurredSample(sampler2D tex, vec2 uv, float radius) {
  vec4 color = vec4(0.0);
  float total = 0.0;
  
  for (float x = -2.0; x <= 2.0; x += 1.0) {
    for (float y = -2.0; y <= 2.0; y += 1.0) {
      vec2 offset = vec2(x, y) * radius / u_resolution;
      float weight = 1.0 - length(vec2(x, y)) / 3.5;
      weight = max(weight, 0.0);
      color += texture(tex, clamp(uv + offset, 0.0, 1.0)) * weight;
      total += weight;
    }
  }
  
  return color / total;
}

// Render glass effect for a single rectangle
vec4 renderGlass(vec2 pixelPos, vec4 rect, vec4 params, float rectIdx, vec4 bgColor) {
  vec2 rectCenter = rect.xy + rect.zw * 0.5;
  vec2 p = pixelPos - rectCenter;
  vec2 size = rect.zw * 0.5;
  
  float roundness = params.x;
  float intensity = params.y; // 0.5 = light, 1.0 = normal, 1.5 = heavy
  
  // Corner radius based on roundness
  float radius = min(size.x, size.y) * roundness * 0.5;
  
  // SDF with wobble
  float wobble = u_liquidWobble * 0.3;
  float sd = sdRoundedRect(p, size, radius, wobble, rectIdx);
  
  if (sd > 2.0) {
    return vec4(0.0); // Outside - fully transparent
  }
  
  // Inside the glass
  float depth = max(-sd, 0.0);
  float maxDepth = min(size.x, size.y) * 0.5;
  float normalizedDepth = clamp(depth / maxDepth, 0.0, 1.0);
  
  // Get surface normal
  vec2 normal = getNormal(p, size, radius, wobble, rectIdx);
  
  // === REFRACTION ===
  float edgeFactor = pow(1.0 - normalizedDepth, 1.2);
  float refractionStrength = (u_refFactor - 1.0) * 0.08 * intensity;
  
  // Subtle liquid wobble on refraction
  float wobbleRef = sin(u_time * 1.5 + length(p) * 0.03 + rectIdx) * wobble * 0.01;
  
  vec2 refractionOffset = normal * edgeFactor * (refractionStrength + wobbleRef);
  
  // Chromatic dispersion
  float dispersionOffset = u_refDispersion * 0.002 * edgeFactor * intensity;
  
  vec2 uv = pixelPos / u_resolution;
  vec2 uvR = uv - refractionOffset * (1.0 - dispersionOffset);
  vec2 uvG = uv - refractionOffset;
  vec2 uvB = uv - refractionOffset * (1.0 + dispersionOffset);
  
  uvR = clamp(uvR, 0.0, 1.0);
  uvG = clamp(uvG, 0.0, 1.0);
  uvB = clamp(uvB, 0.0, 1.0);
  
  // Sample with blur (less blur for UI panels)
  float blurAmount = u_blur * 0.3 * intensity;
  vec4 colorR = blurredSample(u_background, uvR, blurAmount);
  vec4 colorG = blurredSample(u_background, uvG, blurAmount);
  vec4 colorB = blurredSample(u_background, uvB, blurAmount);
  
  vec3 refractedColor = vec3(colorR.r, colorG.g, colorB.b);
  
  // === CAUSTICS ===
  float causticNoise = fbm(p * 0.015 + u_time * 0.2);
  float caustics = pow(causticNoise, 2.5) * normalizedDepth * 0.08 * intensity;
  refractedColor += vec3(caustics * 0.7, caustics * 0.8, caustics);
  
  // === FRESNEL ===
  float fresnelEdge = pow(1.0 - normalizedDepth, 3.5);
  float fresnelIntensity = fresnelEdge * u_fresnelFactor * intensity * 0.15;
  vec3 fresnelHighlight = vec3(1.0, 1.0, 0.98) * fresnelIntensity;
  
  // === GLARE ===
  float glareAngle = atan(normal.y, normal.x) * 2.0 + u_glareAngle + u_time * 0.15;
  float glareIntensity = (0.5 + sin(glareAngle) * 0.5);
  glareIntensity *= edgeFactor * u_glareFactor * intensity;
  glareIntensity = pow(glareIntensity, 2.8);
  vec3 glareColor = vec3(1.0, 0.98, 0.95) * glareIntensity * 0.2;
  
  // === COMBINE ===
  vec3 finalColor = refractedColor;
  
  // Subtle tint
  finalColor = mix(finalColor, u_tint.rgb, u_tint.a * 0.1 * intensity);
  
  // Add fresnel and glare
  finalColor += fresnelHighlight;
  finalColor += glareColor;
  
  // Inner shadow at edge
  float innerShadow = smoothstep(0.0, 0.1, normalizedDepth);
  finalColor *= mix(0.94, 1.0, innerShadow);
  
  // Top edge highlight
  float topHighlight = smoothstep(0.7, 0.0, (pixelPos.y - rect.y) / rect.w) * (1.0 - normalizedDepth) * 0.05 * u_fresnelFactor;
  finalColor += vec3(topHighlight);
  
  // Anti-aliasing at shape edge
  float aa = smoothstep(1.5, -1.0, sd);
  
  return vec4(finalColor, aa);
}

void main() {
  vec2 pixelPos = v_uv * u_resolution;
  // Flip Y coordinate since WebGL has origin at bottom-left
  pixelPos.y = u_resolution.y - pixelPos.y;
  
  vec4 bgColor = texture(u_background, v_uv);
  vec4 result = vec4(0.0);
  float totalAlpha = 0.0;
  
  // Render each glass rectangle
  for (int i = 0; i < MAX_RECTS; i++) {
    if (i >= u_rectCount) break;
    if (u_rectParams[i].z < 0.5) continue; // Not enabled
    
    vec4 glassColor = renderGlass(pixelPos, u_rects[i], u_rectParams[i], float(i), bgColor);
    
    // Blend glass colors (front to back)
    float alpha = glassColor.a * (1.0 - totalAlpha);
    result.rgb += glassColor.rgb * alpha;
    totalAlpha += alpha;
  }
  
  result.a = totalAlpha;
  
  // Pre-multiply alpha for correct blending
  fragColor = vec4(result.rgb, result.a);
}`;

// =============================================
// GLOBAL GLASS RENDERER COMPONENT
// =============================================
interface GlobalGlassRendererProps {
  children: React.ReactNode;
  backgroundImage: string;
  refraction?: number;
  dispersion?: number;
  blur?: number;
  fresnel?: number;
  glare?: number;
  glareAngle?: number;
  tint?: [number, number, number, number];
  liquidWobble?: number;
  thickness?: number;
}

export function GlobalGlassRenderer({
  children,
  backgroundImage,
  refraction = 1.4,
  dispersion = 10,
  blur = 4,
  fresnel = 0.5,
  glare = 0.3,
  glareAngle = 0.8,
  tint = [0.8, 0.9, 1.0, 0.15],
  liquidWobble = 0.25,
  thickness = 20,
}: GlobalGlassRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const bgTextureRef = useRef<WebGLTexture | null>(null);
  const rafRef = useRef<number>(0);
  const rectsRef = useRef<Map<string, GlassRect>>(new Map());
  const [isReady, setIsReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Registry functions
  const registerGlass = useCallback((rect: GlassRect) => {
    rectsRef.current.set(rect.id, rect);
  }, []);

  const unregisterGlass = useCallback((id: string) => {
    rectsRef.current.delete(id);
  }, []);

  const updateGlass = useCallback((id: string, updates: Partial<GlassRect>) => {
    const existing = rectsRef.current.get(id);
    if (existing) {
      rectsRef.current.set(id, { ...existing, ...updates });
    }
  }, []);

  // Create shader helper
  const createShader = useCallback((gl: WebGL2RenderingContext, type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    
    return shader;
  }, []);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize WebGL
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2', { 
      alpha: true, 
      premultipliedAlpha: true,
      antialias: true 
    });
    
    if (!gl) {
      console.error('WebGL2 not supported');
      return;
    }
    
    glRef.current = gl;

    // Create shaders
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    
    if (!vertexShader || !fragmentShader) return;

    // Create program
    const program = gl.createProgram();
    if (!program) return;
    
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
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
    
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Create background texture
    const bgTexture = gl.createTexture();
    bgTextureRef.current = bgTexture;

    // Cleanup
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      const oldTexture = bgTextureRef.current;
      bgTextureRef.current = null;
      glRef.current = null;
      programRef.current = null;
      try {
        gl.deleteProgram(program);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        if (oldTexture) gl.deleteTexture(oldTexture);
      } catch (e) {
        // Context may be lost
      }
    };
  }, [createShader]);

  // Load background image
  useEffect(() => {
    const gl = glRef.current;
    if (!gl || !bgTextureRef.current) return;

    let isMounted = true;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (!isMounted || !glRef.current || !bgTextureRef.current) return;
      try {
        gl.bindTexture(gl.TEXTURE_2D, bgTextureRef.current);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        setIsReady(true);
      } catch (e) {
        // Context was lost
      }
    };
    img.src = backgroundImage;

    return () => { isMounted = false; };
  }, [backgroundImage]);

  // Render loop
  useEffect(() => {
    if (!isReady) return;
    
    const gl = glRef.current;
    const program = programRef.current;
    if (!gl || !program) return;

    const dpr = window.devicePixelRatio || 1;
    
    const render = (time: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      // Update canvas size
      const width = dimensions.width;
      const height = dimensions.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      
      // Enable blending
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      
      gl.useProgram(program);
      
      // Set uniforms helper
      const setUniform = (name: string, type: string, value: number | number[]) => {
        const location = gl.getUniformLocation(program, name);
        if (!location) return;
        
        if (type === '1f') gl.uniform1f(location, value as number);
        else if (type === '2f') gl.uniform2f(location, (value as number[])[0], (value as number[])[1]);
        else if (type === '4f') gl.uniform4f(location, (value as number[])[0], (value as number[])[1], (value as number[])[2], (value as number[])[3]);
        else if (type === '1i') gl.uniform1i(location, value as number);
      };
      
      setUniform('u_resolution', '2f', [canvas.width, canvas.height]);
      setUniform('u_time', '1f', time * 0.001);
      
      // Glass parameters
      setUniform('u_refFactor', '1f', refraction);
      setUniform('u_refDispersion', '1f', dispersion);
      setUniform('u_fresnelFactor', '1f', fresnel);
      setUniform('u_glareFactor', '1f', glare);
      setUniform('u_glareAngle', '1f', glareAngle);
      setUniform('u_blur', '1f', blur);
      setUniform('u_tint', '4f', tint);
      setUniform('u_liquidWobble', '1f', liquidWobble);
      setUniform('u_thickness', '1f', thickness);
      
      // Collect rect data
      const rects = Array.from(rectsRef.current.values());
      const rectCount = Math.min(rects.length, 32);
      
      // Set rect count
      const rectCountLoc = gl.getUniformLocation(program, 'u_rectCount');
      if (rectCountLoc) gl.uniform1i(rectCountLoc, rectCount);
      
      // Set rect data
      for (let i = 0; i < 32; i++) {
        const rect = rects[i];
        const rectsLoc = gl.getUniformLocation(program, `u_rects[${i}]`);
        const paramsLoc = gl.getUniformLocation(program, `u_rectParams[${i}]`);
        
        if (rect && rectsLoc && paramsLoc) {
          // Scale by DPR
          gl.uniform4f(rectsLoc, rect.x * dpr, rect.y * dpr, rect.width * dpr, rect.height * dpr);
          
          // Intensity mapping
          const intensityMap = { light: 0.5, normal: 1.0, heavy: 1.5 };
          const intensity = intensityMap[rect.intensity] || 1.0;
          
          gl.uniform4f(paramsLoc, rect.roundness, intensity, 1.0, 0.0);
        } else if (rectsLoc && paramsLoc) {
          gl.uniform4f(rectsLoc, 0, 0, 0, 0);
          gl.uniform4f(paramsLoc, 0, 0, 0, 0);
        }
      }
      
      // Bind texture
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, bgTextureRef.current);
      setUniform('u_background', '1i', 0);
      
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      
      rafRef.current = requestAnimationFrame(render);
    };
    
    rafRef.current = requestAnimationFrame(render);
    
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isReady, dimensions, refraction, dispersion, blur, fresnel, glare, glareAngle, tint, liquidWobble, thickness]);

  return (
    <GlassRegistryContext.Provider value={{ registerGlass, unregisterGlass, updateGlass }}>
      <div ref={containerRef} className="relative w-full h-full">
        {/* Glass overlay canvas */}
        <canvas
          ref={canvasRef}
          className="fixed inset-0 pointer-events-none z-10"
          style={{ width: dimensions.width, height: dimensions.height }}
        />
        {/* Content */}
        <div className="relative z-20">
          {children}
        </div>
      </div>
    </GlassRegistryContext.Provider>
  );
}

// =============================================
// WEBGL GLASS PANEL - Registers with global renderer
// =============================================
interface WebGLGlassPanelProps {
  children: React.ReactNode;
  className?: string;
  roundness?: number;
  intensity?: 'light' | 'normal' | 'heavy';
  style?: React.CSSProperties;
}

export function WebGLGlassPanel({
  children,
  className = '',
  roundness = 0.15,
  intensity = 'normal',
  style,
}: WebGLGlassPanelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const idRef = useRef(`glass-${Math.random().toString(36).substr(2, 9)}`);
  const { registerGlass, unregisterGlass, updateGlass } = useGlassRegistry();

  // Track position and size
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const updateRect = () => {
      const rect = element.getBoundingClientRect();
      const glassRect: GlassRect = {
        id: idRef.current,
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
        roundness,
        intensity,
      };
      updateGlass(idRef.current, glassRect);
    };

    // Initial registration
    const rect = element.getBoundingClientRect();
    registerGlass({
      id: idRef.current,
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
      roundness,
      intensity,
    });

    // Update on scroll/resize
    const observer = new ResizeObserver(updateRect);
    observer.observe(element);
    window.addEventListener('scroll', updateRect, { passive: true });
    window.addEventListener('resize', updateRect, { passive: true });

    // Periodic update for animations
    const interval = setInterval(updateRect, 100);

    return () => {
      unregisterGlass(idRef.current);
      observer.disconnect();
      window.removeEventListener('scroll', updateRect);
      window.removeEventListener('resize', updateRect);
      clearInterval(interval);
    };
  }, [registerGlass, unregisterGlass, updateGlass, roundness, intensity]);

  return (
    <div
      ref={ref}
      className={`relative ${className}`}
      style={{
        // Transparent background so WebGL shows through
        backgroundColor: 'transparent',
        ...style,
      }}
    >
      {/* Subtle border for visibility */}
      <div 
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        }}
      />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

export default GlobalGlassRenderer;
