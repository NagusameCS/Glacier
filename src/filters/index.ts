/**
 * Glacier SVG Filters
 * Advanced SVG filters for realistic liquid glass effects
 */

// Filter configuration types
export interface FilterConfig {
  blur?: number;
  displacement?: number;
  turbulence?: number;
  lighting?: boolean;
  specular?: number;
  diffuse?: number;
}

export interface LiquidGlassFilterConfig extends FilterConfig {
  refraction?: number;
  fresnel?: number;
  dispersion?: number;
}

export interface FrostedGlassFilterConfig extends FilterConfig {
  noise?: number;
  opacity?: number;
}

// Default filter configurations
export const defaultLiquidConfig: LiquidGlassFilterConfig = {
  blur: 2,
  displacement: 10,
  turbulence: 0.02,
  lighting: true,
  specular: 1.5,
  diffuse: 0.8,
  refraction: 1.5,
  fresnel: 0.3,
  dispersion: 0.02,
};

export const defaultFrostedConfig: FrostedGlassFilterConfig = {
  blur: 4,
  noise: 0.1,
  opacity: 0.8,
  lighting: false,
};

/**
 * Generate liquid glass SVG filter
 */
export function createLiquidGlassFilter(
  id: string,
  config: LiquidGlassFilterConfig = {}
): string {
  const cfg = { ...defaultLiquidConfig, ...config };
  
  return `
    <filter id="${id}" x="-50%" y="-50%" width="200%" height="200%" color-interpolation-filters="sRGB">
      <!-- Turbulence for organic distortion -->
      <feTurbulence 
        type="fractalNoise" 
        baseFrequency="${cfg.turbulence}" 
        numOctaves="3" 
        seed="1"
        result="turbulence"
      />
      
      <!-- Displacement map for refraction effect -->
      <feDisplacementMap 
        in="SourceGraphic" 
        in2="turbulence" 
        scale="${cfg.displacement}" 
        xChannelSelector="R" 
        yChannelSelector="G"
        result="displaced"
      />
      
      <!-- Gaussian blur for glass depth -->
      <feGaussianBlur 
        in="displaced" 
        stdDeviation="${cfg.blur}"
        result="blurred"
      />
      
      ${cfg.lighting ? `
      <!-- Specular lighting for glass reflection -->
      <feSpecularLighting 
        in="turbulence" 
        surfaceScale="3" 
        specularConstant="${cfg.specular}" 
        specularExponent="20" 
        lighting-color="white"
        result="specular"
      >
        <fePointLight x="-100" y="-100" z="200"/>
      </feSpecularLighting>
      
      <!-- Diffuse lighting for depth -->
      <feDiffuseLighting 
        in="turbulence" 
        surfaceScale="2" 
        diffuseConstant="${cfg.diffuse}" 
        lighting-color="#fffef0"
        result="diffuse"
      >
        <feDistantLight azimuth="135" elevation="45"/>
      </feDiffuseLighting>
      
      <!-- Composite specular with blurred -->
      <feComposite 
        in="specular" 
        in2="blurred" 
        operator="arithmetic" 
        k1="0" k2="0.3" k3="0.7" k4="0"
        result="lit"
      />
      
      <!-- Blend with original -->
      <feBlend in="blurred" in2="lit" mode="screen" result="final"/>
      ` : `
      <feComposite in="blurred" in2="SourceAlpha" operator="in" result="final"/>
      `}
    </filter>
  `;
}

/**
 * Generate frosted glass SVG filter
 */
export function createFrostedGlassFilter(
  id: string,
  config: FrostedGlassFilterConfig = {}
): string {
  const cfg = { ...defaultFrostedConfig, ...config };
  
  return `
    <filter id="${id}" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB">
      <!-- Noise texture for frosted effect -->
      <feTurbulence 
        type="fractalNoise" 
        baseFrequency="${cfg.noise}" 
        numOctaves="4"
        result="noise"
      />
      
      <!-- Blend noise with source -->
      <feDisplacementMap 
        in="SourceGraphic" 
        in2="noise" 
        scale="2" 
        xChannelSelector="R" 
        yChannelSelector="G"
        result="displaced"
      />
      
      <!-- Main blur -->
      <feGaussianBlur 
        in="displaced" 
        stdDeviation="${cfg.blur}"
        result="blurred"
      />
      
      <!-- Composite with alpha -->
      <feComposite 
        in="blurred" 
        in2="SourceAlpha" 
        operator="in"
        result="final"
      />
    </filter>
  `;
}

/**
 * Generate refraction SVG filter
 */
export function createRefractionFilter(
  id: string,
  strength: number = 10
): string {
  return `
    <filter id="${id}" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">
      <feTurbulence 
        type="turbulence" 
        baseFrequency="0.015" 
        numOctaves="2"
        result="turbulence"
      />
      <feDisplacementMap 
        in="SourceGraphic" 
        in2="turbulence" 
        scale="${strength}" 
        xChannelSelector="R" 
        yChannelSelector="G"
      />
    </filter>
  `;
}

/**
 * Generate chromatic dispersion SVG filter
 */
export function createDispersionFilter(
  id: string,
  offset: number = 2
): string {
  return `
    <filter id="${id}" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB">
      <!-- Red channel offset -->
      <feOffset in="SourceGraphic" dx="${offset}" dy="0" result="red-offset"/>
      <feColorMatrix 
        in="red-offset" 
        type="matrix" 
        values="1 0 0 0 0
                0 0 0 0 0
                0 0 0 0 0
                0 0 0 1 0"
        result="red"
      />
      
      <!-- Green channel (centered) -->
      <feColorMatrix 
        in="SourceGraphic" 
        type="matrix" 
        values="0 0 0 0 0
                0 1 0 0 0
                0 0 0 0 0
                0 0 0 1 0"
        result="green"
      />
      
      <!-- Blue channel offset -->
      <feOffset in="SourceGraphic" dx="${-offset}" dy="0" result="blue-offset"/>
      <feColorMatrix 
        in="blue-offset" 
        type="matrix" 
        values="0 0 0 0 0
                0 0 0 0 0
                0 0 1 0 0
                0 0 0 1 0"
        result="blue"
      />
      
      <!-- Merge channels -->
      <feBlend in="red" in2="green" mode="screen" result="rg"/>
      <feBlend in="rg" in2="blue" mode="screen"/>
    </filter>
  `;
}

/**
 * Generate glow effect SVG filter
 */
export function createGlowFilter(
  id: string,
  color: string = 'white',
  blur: number = 10,
  opacity: number = 0.5
): string {
  return `
    <filter id="${id}" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="${blur}" result="blur"/>
      <feFlood flood-color="${color}" flood-opacity="${opacity}"/>
      <feComposite in2="blur" operator="in" result="glow"/>
      <feMerge>
        <feMergeNode in="glow"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  `;
}

/**
 * Generate a complete SVG element containing all Glacier filters
 */
export function createFiltersSVG(customFilters?: Record<string, string>): string {
  const filters = {
    // Liquid glass filters
    'glacier-liquid-glass': createLiquidGlassFilter('glacier-liquid-glass'),
    'glacier-liquid-glass-light': createLiquidGlassFilter('glacier-liquid-glass-light', {
      blur: 1,
      displacement: 5,
      specular: 2,
    }),
    'glacier-liquid-glass-dark': createLiquidGlassFilter('glacier-liquid-glass-dark', {
      blur: 3,
      displacement: 15,
      specular: 0.8,
      diffuse: 0.5,
    }),
    
    // Frosted glass filters
    'glacier-frosted': createFrostedGlassFilter('glacier-frosted'),
    'glacier-frosted-light': createFrostedGlassFilter('glacier-frosted-light', {
      blur: 2,
      noise: 0.05,
    }),
    'glacier-frosted-dark': createFrostedGlassFilter('glacier-frosted-dark', {
      blur: 6,
      noise: 0.15,
    }),
    
    // Effect filters
    'glacier-refraction': createRefractionFilter('glacier-refraction', 10),
    'glacier-refraction-subtle': createRefractionFilter('glacier-refraction-subtle', 5),
    'glacier-refraction-strong': createRefractionFilter('glacier-refraction-strong', 20),
    'glacier-dispersion': createDispersionFilter('glacier-dispersion', 2),
    'glacier-glow': createGlowFilter('glacier-glow'),
    'glacier-glow-primary': createGlowFilter('glacier-glow-primary', '#3b82f6', 15, 0.6),
    
    ...customFilters,
  };

  return `
    <svg 
      class="glacier-filters" 
      style="position:absolute;width:0;height:0;overflow:hidden;pointer-events:none;" 
      aria-hidden="true"
    >
      <defs>
        ${Object.values(filters).join('\n')}
      </defs>
    </svg>
  `;
}

/**
 * Inject filters into the DOM
 */
export function injectFilters(customFilters?: Record<string, string>): void {
  if (typeof document === 'undefined') return;
  
  // Check if already injected
  if (document.querySelector('.glacier-filters')) return;
  
  const svg = createFiltersSVG(customFilters);
  const container = document.createElement('div');
  container.innerHTML = svg;
  document.body.insertBefore(container.firstElementChild!, document.body.firstChild);
}

/**
 * Remove injected filters from the DOM
 */
export function removeFilters(): void {
  if (typeof document === 'undefined') return;
  
  const existing = document.querySelector('.glacier-filters');
  if (existing) {
    existing.remove();
  }
}

export default {
  createLiquidGlassFilter,
  createFrostedGlassFilter,
  createRefractionFilter,
  createDispersionFilter,
  createGlowFilter,
  createFiltersSVG,
  injectFilters,
  removeFilters,
};
