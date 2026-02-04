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

// SDF for superellipse (squircle)
float sdSuperellipse(vec2 p, vec2 size, float n) {
  p = p / size;
  vec2 ps = abs(p);
  float gm = pow(ps.x, n) + pow(ps.y, n);
  return (pow(gm, 1.0 / n) - 1.0) * min(size.x, size.y);
}

// Get normal from SDF
vec2 getNormal(vec2 p, vec2 size, float n) {
  float eps = 0.001;
  float d = sdSuperellipse(p, size, n);
  float dx = sdSuperellipse(p + vec2(eps, 0.0), size, n) - d;
  float dy = sdSuperellipse(p + vec2(0.0, eps), size, n) - d;
  return normalize(vec2(dx, dy));
}

// Color space conversions for proper glare
vec3 rgb2hsv(vec3 c) {
  vec4 K = vec4(0.0, -1.0/3.0, 2.0/3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

// Simple box blur for background
vec4 blurredSample(sampler2D tex, vec2 uv, float radius) {
  vec4 color = vec4(0.0);
  float total = 0.0;
  
  for (float x = -2.0; x <= 2.0; x += 1.0) {
    for (float y = -2.0; y <= 2.0; y += 1.0) {
      vec2 offset = vec2(x, y) * radius / u_resolution;
      float weight = 1.0 - length(vec2(x, y)) / 3.5;
      weight = max(weight, 0.0);
      color += texture(tex, uv + offset) * weight;
      total += weight;
    }
  }
  
  return color / total;
}

void main() {
  vec2 uv = v_uv;
  vec2 pixelPos = uv * u_resolution;
  
  // Shape position (centered with mouse offset)
  vec2 shapeCenter = u_resolution * 0.5 + u_shapePos * u_resolution;
  vec2 p = pixelPos - shapeCenter;
  
  // Calculate SDF
  float n = 2.0 + u_roundness * 3.0; // 2 = circle, 5 = squircle
  vec2 size = u_shapeSize * u_resolution * 0.5;
  float sd = sdSuperellipse(p, size, n);
  
  // Normalize to resolution for consistent thickness
  float nsd = sd / u_resolution.y;
  
  if (sd < 0.0) {
    // Inside the glass shape
    float depth = -sd;
    float normalizedDepth = depth / u_refThickness;
    normalizedDepth = clamp(normalizedDepth, 0.0, 1.0);
    
    // Get surface normal
    vec2 normal = getNormal(p, size, n);
    
    // Calculate refraction edge factor
    float x_R_ratio = 1.0 - normalizedDepth;
    float thetaI = asin(pow(x_R_ratio, 2.0));
    float thetaT = asin(1.0 / u_refFactor * sin(thetaI));
    float edgeFactor = -tan(thetaT - thetaI);
    edgeFactor = clamp(edgeFactor, 0.0, 1.0);
    
    // Refraction offset with chromatic dispersion
    vec2 refractionOffset = normal * edgeFactor * 0.05;
    
    float dispersionAmount = u_refDispersion * 0.002;
    
    // Sample with chromatic aberration
    vec4 colorR = blurredSample(u_background, uv - refractionOffset * (1.0 - dispersionAmount), u_blur);
    vec4 colorG = blurredSample(u_background, uv - refractionOffset, u_blur);
    vec4 colorB = blurredSample(u_background, uv - refractionOffset * (1.0 + dispersionAmount), u_blur);
    
    vec4 refractedColor = vec4(colorR.r, colorG.g, colorB.b, 1.0);
    
    // Apply tint
    refractedColor = mix(refractedColor, vec4(u_tint.rgb, 1.0), u_tint.a * 0.5);
    
    // Fresnel reflection
    float fresnelFactor = pow(1.0 - normalizedDepth, 5.0);
    fresnelFactor *= u_fresnelFactor;
    
    fragColor = mix(refractedColor, vec4(1.0), fresnelFactor * 0.4);
    
    // Glare effect
    float glareAngle = atan(normal.y, normal.x) * 2.0 + u_glareAngle;
    float glareFactor = (0.5 + sin(glareAngle) * 0.5);
    glareFactor *= (1.0 - normalizedDepth) * u_glareFactor;
    glareFactor = pow(glareFactor, 2.0);
    
    vec3 glareColor = hsv2rgb(vec3(0.1, 0.1, 1.0)); // Warm white glare
    fragColor = mix(fragColor, vec4(glareColor, 1.0), glareFactor * 0.3);
    
    // Edge darkening
    float edgeDark = smoothstep(0.0, 0.1, normalizedDepth);
    fragColor.rgb *= mix(0.95, 1.0, edgeDark);
    
    // Anti-aliasing at edges
    float aa = smoothstep(0.0, 2.0, -sd);
    fragColor.a = aa;
    
  } else {
    // Outside - show background
    fragColor = texture(u_background, uv);
  }
  
  // Smooth blend at edge
  float edgeBlend = smoothstep(2.0, -2.0, sd);
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
  }, [isReady, shapeSize, roundness, refraction, dispersion, blur, tint, fresnel, glare, glareAngle, thickness]);

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
