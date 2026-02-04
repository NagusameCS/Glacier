/**
 * WebGL2-based Liquid Glass Component
 * Inspired by iyinchao/liquid-glass-studio
 * Real refraction, dispersion, and fresnel effects
 */
import { useEffect, useRef, useState, useCallback } from 'react';

// Vertex shader
const vertexShaderSource = `#version 300 es
in vec4 a_position;
out vec2 v_uv;

void main() {
  v_uv = (a_position.xy + 1.0) * 0.5;
  gl_Position = a_position;
}`;

// Fragment shader with liquid glass effects
const fragmentShaderSource = `#version 300 es
precision highp float;

#define PI 3.14159265359

in vec2 v_uv;
out vec4 fragColor;

uniform sampler2D u_background;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
uniform float u_dpr;

// Glass parameters
uniform float u_refThickness;
uniform float u_refFactor;
uniform float u_refDispersion;
uniform float u_fresnelRange;
uniform float u_fresnelFactor;
uniform float u_glareRange;
uniform float u_glareFactor;
uniform float u_glareAngle;
uniform float u_blur;
uniform vec4 u_tint;
uniform float u_roundness;
uniform vec2 u_shapeSize;
uniform vec2 u_shapePos;
uniform float u_liquidWobble;

// Noise functions for liquid wobble
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
  for (int i = 0; i < 4; i++) {
    value += amplitude * noise(p);
    p *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

// SDF for superellipse (squircle) with liquid wobble
float sdSuperellipse(vec2 p, vec2 size, float n, float wobble) {
  // Add liquid wobble distortion
  float angle = atan(p.y, p.x);
  float wobbleAmount = wobble * 8.0;
  float wobbleOffset = sin(angle * 3.0 + u_time * 2.0) * wobbleAmount
                     + sin(angle * 5.0 - u_time * 1.5) * wobbleAmount * 0.5
                     + sin(angle * 7.0 + u_time * 3.0) * wobbleAmount * 0.25;
  
  // Add noise-based organic wobble
  wobbleOffset += fbm(vec2(angle * 2.0, u_time * 0.5)) * wobbleAmount * 0.8;
  
  p = p / (size + wobbleOffset);
  vec2 ps = abs(p);
  float gm = pow(ps.x, n) + pow(ps.y, n);
  return (pow(gm, 1.0 / n) - 1.0) * min(size.x, size.y);
}

// Get normal from SDF (surface curvature direction)
vec2 getNormal(vec2 p, vec2 size, float n, float wobble) {
  float eps = 0.5;
  float d = sdSuperellipse(p, size, n, wobble);
  float dx = sdSuperellipse(p + vec2(eps, 0.0), size, n, wobble) - d;
  float dy = sdSuperellipse(p + vec2(0.0, eps), size, n, wobble) - d;
  return normalize(vec2(dx, dy));
}

// Smooth blur sampling for background
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

void main() {
  vec2 uv = v_uv;
  vec2 pixelPos = uv * u_resolution;
  
  // Shape position (centered with mouse offset for interactivity)
  vec2 shapeCenter = u_resolution * 0.5 + u_shapePos * u_resolution;
  vec2 p = pixelPos - shapeCenter;
  
  // Calculate SDF - squircle shape with liquid wobble
  float n = 2.0 + u_roundness * 4.0;
  vec2 size = u_shapeSize * u_resolution * 0.5;
  float sd = sdSuperellipse(p, size, n, u_liquidWobble);
  
  // Get glass thickness
  float minSize = min(size.x, size.y);
  float thickness = u_refThickness * 2.0;
  
  if (sd < 0.0) {
    // Inside the glass shape
    float depth = -sd;
    
    // Normalize depth: 0 at edge, 1 at center
    float normalizedDepth = clamp(depth / thickness, 0.0, 1.0);
    
    // Get surface normal for refraction direction
    vec2 normal = getNormal(p, size, n, u_liquidWobble);
    
    // === LIQUID CAUSTICS ===
    // Simulate light focusing through the curved glass
    float causticNoise = fbm(p * 0.02 + u_time * 0.3);
    float caustics = pow(causticNoise, 2.0) * normalizedDepth * 0.15;
    
    // === REFRACTION ===
    // Calculate refraction using Snell's law approximation
    // More refraction at edges where light enters at angle
    float edgeFactor = pow(1.0 - normalizedDepth, 1.5);
    
    // Refraction strength based on IOR
    float refractionStrength = (u_refFactor - 1.0) * 0.15;
    
    // Add liquid wobble to refraction
    float wobbleRefraction = sin(u_time * 2.0 + length(p) * 0.05) * u_liquidWobble * 0.02;
    
    // Base refraction offset
    vec2 refractionOffset = normal * edgeFactor * (refractionStrength + wobbleRefraction);
    
    // Chromatic dispersion - different wavelengths refract differently
    float dispersionOffset = u_refDispersion * 0.003 * edgeFactor;
    
    // Sample background with chromatic aberration (RGB split)
    vec2 uvR = uv - refractionOffset * (1.0 - dispersionOffset);
    vec2 uvG = uv - refractionOffset;
    vec2 uvB = uv - refractionOffset * (1.0 + dispersionOffset);
    
    // Clamp UVs to prevent sampling outside texture
    uvR = clamp(uvR, 0.0, 1.0);
    uvG = clamp(uvG, 0.0, 1.0);
    uvB = clamp(uvB, 0.0, 1.0);
    
    // Sample with blur
    float blurAmount = u_blur * (1.0 - normalizedDepth * 0.3);
    vec4 colorR = blurredSample(u_background, uvR, blurAmount);
    vec4 colorG = blurredSample(u_background, uvG, blurAmount);
    vec4 colorB = blurredSample(u_background, uvB, blurAmount);
    
    vec4 refractedColor = vec4(colorR.r, colorG.g, colorB.b, 1.0);
    
    // Add caustic highlights
    refractedColor.rgb += vec3(caustics * 0.8, caustics * 0.9, caustics);
    
    // === FRESNEL - Edge reflection only ===
    // Fresnel effect: more reflection at grazing angles (edges)
    // Should NOT tint the center of the glass
    float fresnelEdge = pow(1.0 - normalizedDepth, 4.0);
    float fresnelIntensity = fresnelEdge * u_fresnelFactor;
    
    // Apply fresnel as additive edge highlight, not a full tint
    vec3 fresnelHighlight = vec3(1.0, 1.0, 0.98) * fresnelIntensity * 0.25;
    
    // === GLARE / SPECULAR ===
    // Glare based on surface angle relative to "light"
    float glareAngle = atan(normal.y, normal.x) * 2.0 + u_glareAngle + u_time * 0.2;
    float glareIntensity = (0.5 + sin(glareAngle) * 0.5);
    glareIntensity *= edgeFactor * u_glareFactor;
    glareIntensity = pow(glareIntensity, 2.5);
    
    // Warm-tinted glare highlight
    vec3 glareColor = vec3(1.0, 0.98, 0.95) * glareIntensity * 0.35;
    
    // === COMBINE EFFECTS ===
    vec3 finalColor = refractedColor.rgb;
    
    // Add tint (very subtle)
    finalColor = mix(finalColor, u_tint.rgb, u_tint.a * 0.15);
    
    // Add fresnel edge highlight
    finalColor += fresnelHighlight;
    
    // Add glare
    finalColor += glareColor;
    
    // === INNER SHADOW at very edge ===
    float innerShadow = smoothstep(0.0, 0.08, normalizedDepth);
    finalColor *= mix(0.92, 1.0, innerShadow);
    
    // === TOP EDGE HIGHLIGHT ===
    float topHighlight = smoothstep(0.6, 0.0, v_uv.y) * (1.0 - normalizedDepth) * 0.08 * u_fresnelFactor;
    finalColor += vec3(topHighlight);
    
    // Anti-aliasing at shape edge
    float aa = smoothstep(0.0, 1.5, -sd);
    fragColor = vec4(finalColor, aa);
    
  } else {
    // Outside the glass - show background
    fragColor = texture(u_background, uv);
  }
  
  // Smooth blend at edge for anti-aliasing
  float edgeBlend = smoothstep(1.5, -1.5, sd);
  vec4 bgColor = texture(u_background, uv);
  fragColor = mix(bgColor, fragColor, edgeBlend);
}`;

interface LiquidGlassProps {
  className?: string;
  width?: number;
  height?: number;
  backgroundImage?: string;
  interactive?: boolean;
  shapeSize?: [number, number];
  roundness?: number;
  refraction?: number;
  dispersion?: number;
  blur?: number;
  tint?: [number, number, number, number];
  fresnel?: number;
  glare?: number;
  glareAngle?: number;
  thickness?: number;
  liquidWobble?: number;
}

export function LiquidGlass({
  className = '',
  width = 600,
  height = 400,
  backgroundImage,
  interactive = true,
  shapeSize = [0.4, 0.35],
  roundness = 0.8,
  refraction = 1.4,
  dispersion = 7,
  blur = 8,
  tint = [1, 1, 1, 0.1],
  fresnel = 0.5,
  glare = 0.4,
  glareAngle = 0.8,
  thickness = 25,
  liquidWobble = 0.3,
}: LiquidGlassProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const bgTextureRef = useRef<WebGLTexture | null>(null);
  const rafRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const [isReady, setIsReady] = useState(false);

  // Create shader
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

  // Initialize WebGL
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
    gl.bindTexture(gl.TEXTURE_2D, bgTexture);
    
    // Load background image
    let isMounted = true;
    const loadBackground = () => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        // Check if component is still mounted and context is valid
        if (!isMounted || !glRef.current || !bgTextureRef.current) return;
        try {
          gl.bindTexture(gl.TEXTURE_2D, bgTexture);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          setIsReady(true);
        } catch (e) {
          // Context was lost, ignore
        }
      };
      img.src = backgroundImage || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80';
    };
    
    loadBackground();

    // Cleanup
    return () => {
      isMounted = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      // Clear refs before deleting to prevent async callbacks from using deleted objects
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
        // Context may already be lost
      }
    };
  }, [createShader, backgroundImage]);

  // Render loop
  useEffect(() => {
    if (!isReady) return;
    
    const gl = glRef.current;
    const program = programRef.current;
    if (!gl || !program) return;

    const dpr = window.devicePixelRatio || 1;
    
    const render = (time: number) => {
      // Smooth mouse movement
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.08;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.08;
      
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      
      gl.useProgram(program);
      
      // Set uniforms
      const setUniform = (name: string, type: string, value: number | number[]) => {
        const location = gl.getUniformLocation(program, name);
        if (!location) return;
        
        if (type === '1f') gl.uniform1f(location, value as number);
        else if (type === '2f') gl.uniform2f(location, (value as number[])[0], (value as number[])[1]);
        else if (type === '4f') gl.uniform4f(location, (value as number[])[0], (value as number[])[1], (value as number[])[2], (value as number[])[3]);
        else if (type === '1i') gl.uniform1i(location, value as number);
      };
      
      setUniform('u_resolution', '2f', [gl.canvas.width, gl.canvas.height]);
      setUniform('u_time', '1f', time * 0.001);
      setUniform('u_dpr', '1f', dpr);
      setUniform('u_mouse', '2f', [mouseRef.current.x, mouseRef.current.y]);
      
      // Glass parameters
      setUniform('u_refThickness', '1f', thickness);
      setUniform('u_refFactor', '1f', refraction);
      setUniform('u_refDispersion', '1f', dispersion);
      setUniform('u_fresnelRange', '1f', 30);
      setUniform('u_fresnelFactor', '1f', fresnel);
      setUniform('u_glareRange', '1f', 30);
      setUniform('u_glareFactor', '1f', glare);
      setUniform('u_glareAngle', '1f', glareAngle);
      setUniform('u_blur', '1f', blur);
      setUniform('u_tint', '4f', tint);
      setUniform('u_roundness', '1f', roundness);
      setUniform('u_shapeSize', '2f', shapeSize);
      setUniform('u_shapePos', '2f', [mouseRef.current.x * 0.2, -mouseRef.current.y * 0.2]);
      setUniform('u_liquidWobble', '1f', liquidWobble);
      
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
  }, [isReady, shapeSize, roundness, refraction, dispersion, blur, tint, fresnel, glare, glareAngle, thickness, liquidWobble]);

  // Mouse interaction
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    mouseRef.current.targetX = x;
    mouseRef.current.targetY = y;
  }, [interactive]);

  const handleMouseLeave = useCallback(() => {
    mouseRef.current.targetX = 0;
    mouseRef.current.targetY = 0;
  }, []);

  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

  return (
    <canvas
      ref={canvasRef}
      className={`${className}`}
      width={width * dpr}
      height={height * dpr}
      style={{ width, height }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    />
  );
}

export default LiquidGlass;
