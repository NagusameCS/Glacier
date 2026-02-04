/**
 * Glacier CSS Components
 * Pre-made CSS class compositions for common UI elements
 * These are pure CSS - no JavaScript required
 */

// Component class definitions (for TypeScript consumers)
export interface ComponentClasses {
  // Buttons
  button: string;
  buttonPrimary: string;
  buttonSecondary: string;
  buttonDanger: string;
  buttonGhost: string;
  buttonIcon: string;
  buttonGroup: string;
  
  // Cards
  card: string;
  cardHeader: string;
  cardBody: string;
  cardFooter: string;
  cardHoverable: string;
  
  // Inputs
  input: string;
  inputGroup: string;
  inputIcon: string;
  textarea: string;
  select: string;
  checkbox: string;
  radio: string;
  toggle: string;
  
  // Layout
  container: string;
  panel: string;
  modal: string;
  modalOverlay: string;
  drawer: string;
  sidebar: string;
  navbar: string;
  
  // Feedback
  alert: string;
  alertSuccess: string;
  alertWarning: string;
  alertDanger: string;
  alertInfo: string;
  toast: string;
  badge: string;
  tooltip: string;
  
  // Navigation
  tabs: string;
  tab: string;
  tabActive: string;
  breadcrumb: string;
  pagination: string;
  menu: string;
  menuItem: string;
  dropdown: string;
  
  // Data Display
  table: string;
  tableHeader: string;
  tableRow: string;
  tableCell: string;
  avatar: string;
  avatarGroup: string;
  tag: string;
  progress: string;
  
  // Media
  image: string;
  video: string;
  carousel: string;
  gallery: string;
  
  // Overlay
  overlay: string;
  overlayDark: string;
  overlayLight: string;
  backdrop: string;
  
  // Sliders
  slider: string;
  sliderTrack: string;
  sliderThumb: string;
  rangeSlider: string;
}

// CSS class mappings (pre-composed utility classes)
export const componentClasses: ComponentClasses = {
  // ============================================
  // BUTTONS
  // ============================================
  button: `
    glacier-liquid
    glacier-animate
    glacier-hover-brighten
    glacier-active-press
    px-6 py-3
    rounded-2xl
    font-medium
    text-white
    cursor-pointer
    select-none
    inline-flex items-center justify-center gap-2
    focus:outline-none focus:ring-2 focus:ring-white/30
    disabled:opacity-50 disabled:cursor-not-allowed
  `.trim().replace(/\s+/g, ' '),
  
  buttonPrimary: `
    glacier-liquid
    glacier-animate
    glacier-hover-lift
    glacier-active-press
    glacier-tint-primary
    px-6 py-3
    rounded-2xl
    font-medium
    text-white
    cursor-pointer
    select-none
    inline-flex items-center justify-center gap-2
    focus:outline-none focus:ring-2 focus:ring-blue-400/50
  `.trim().replace(/\s+/g, ' '),
  
  buttonSecondary: `
    glacier-liquid
    glacier-animate
    glacier-hover-brighten
    glacier-active-press
    glacier-tint-secondary
    px-6 py-3
    rounded-2xl
    font-medium
    text-white
    cursor-pointer
    select-none
    inline-flex items-center justify-center gap-2
    focus:outline-none focus:ring-2 focus:ring-purple-400/50
  `.trim().replace(/\s+/g, ' '),
  
  buttonDanger: `
    glacier-liquid
    glacier-animate
    glacier-hover-brighten
    glacier-active-press
    glacier-tint-danger
    px-6 py-3
    rounded-2xl
    font-medium
    text-white
    cursor-pointer
    select-none
    inline-flex items-center justify-center gap-2
    focus:outline-none focus:ring-2 focus:ring-red-400/50
  `.trim().replace(/\s+/g, ' '),
  
  buttonGhost: `
    glacier-glass
    glacier-blur-sm
    glacier-animate
    glacier-hover-brighten
    px-6 py-3
    rounded-2xl
    font-medium
    text-white
    cursor-pointer
    select-none
    inline-flex items-center justify-center gap-2
    bg-white/5
    border border-white/10
    hover:bg-white/10
    focus:outline-none focus:ring-2 focus:ring-white/20
  `.trim().replace(/\s+/g, ' '),
  
  buttonIcon: `
    glacier-liquid
    glacier-animate
    glacier-hover-brighten
    glacier-active-press
    p-3
    rounded-full
    text-white
    cursor-pointer
    select-none
    inline-flex items-center justify-center
    focus:outline-none focus:ring-2 focus:ring-white/30
  `.trim().replace(/\s+/g, ' '),
  
  buttonGroup: `
    inline-flex
    rounded-2xl
    overflow-hidden
    glacier-border
  `.trim().replace(/\s+/g, ' '),

  // ============================================
  // CARDS
  // ============================================
  card: `
    glacier-card
    rounded-3xl
  `.trim().replace(/\s+/g, ' '),
  
  cardHeader: `
    px-6 py-4
    border-b border-white/10
  `.trim().replace(/\s+/g, ' '),
  
  cardBody: `
    p-6
  `.trim().replace(/\s+/g, ' '),
  
  cardFooter: `
    px-6 py-4
    border-t border-white/10
  `.trim().replace(/\s+/g, ' '),
  
  cardHoverable: `
    glacier-card
    glacier-animate
    glacier-hover-lift
    rounded-3xl
    cursor-pointer
  `.trim().replace(/\s+/g, ' '),

  // ============================================
  // INPUTS
  // ============================================
  input: `
    glacier-glass
    glacier-blur-md
    glacier-animate
    glacier-border
    w-full
    px-4 py-3
    rounded-xl
    text-white
    placeholder-white/50
    bg-white/5
    focus:bg-white/10
    focus:outline-none focus:ring-2 focus:ring-white/30
    disabled:opacity-50 disabled:cursor-not-allowed
  `.trim().replace(/\s+/g, ' '),
  
  inputGroup: `
    relative
    flex items-center
    glacier-glass
    glacier-blur-md
    glacier-border
    rounded-xl
    overflow-hidden
    focus-within:ring-2 focus-within:ring-white/30
  `.trim().replace(/\s+/g, ' '),
  
  inputIcon: `
    absolute
    left-4
    text-white/50
    pointer-events-none
  `.trim().replace(/\s+/g, ' '),
  
  textarea: `
    glacier-glass
    glacier-blur-md
    glacier-animate
    glacier-border
    w-full
    px-4 py-3
    rounded-xl
    text-white
    placeholder-white/50
    bg-white/5
    focus:bg-white/10
    focus:outline-none focus:ring-2 focus:ring-white/30
    resize-none
    min-h-[120px]
  `.trim().replace(/\s+/g, ' '),
  
  select: `
    glacier-glass
    glacier-blur-md
    glacier-animate
    glacier-border
    w-full
    px-4 py-3
    rounded-xl
    text-white
    bg-white/5
    focus:bg-white/10
    focus:outline-none focus:ring-2 focus:ring-white/30
    cursor-pointer
    appearance-none
  `.trim().replace(/\s+/g, ' '),
  
  checkbox: `
    glacier-glass
    glacier-blur-sm
    glacier-animate
    w-5 h-5
    rounded-md
    border border-white/30
    bg-white/5
    cursor-pointer
    appearance-none
    checked:bg-blue-500/80
    checked:border-blue-400
    focus:outline-none focus:ring-2 focus:ring-white/30
  `.trim().replace(/\s+/g, ' '),
  
  radio: `
    glacier-glass
    glacier-blur-sm
    glacier-animate
    w-5 h-5
    rounded-full
    border border-white/30
    bg-white/5
    cursor-pointer
    appearance-none
    checked:bg-blue-500/80
    checked:border-blue-400
    focus:outline-none focus:ring-2 focus:ring-white/30
  `.trim().replace(/\s+/g, ' '),
  
  toggle: `
    glacier-glass
    glacier-blur-sm
    glacier-animate
    relative
    w-12 h-6
    rounded-full
    border border-white/20
    bg-white/10
    cursor-pointer
    peer-checked:bg-blue-500/80
    after:content-['']
    after:absolute
    after:top-0.5 after:left-0.5
    after:w-5 after:h-5
    after:rounded-full
    after:bg-white
    after:transition-transform
    peer-checked:after:translate-x-6
  `.trim().replace(/\s+/g, ' '),

  // ============================================
  // LAYOUT
  // ============================================
  container: `
    glacier-panel
    rounded-3xl
    max-w-7xl
    mx-auto
    p-8
  `.trim().replace(/\s+/g, ' '),
  
  panel: `
    glacier-panel
    rounded-3xl
  `.trim().replace(/\s+/g, ' '),
  
  modal: `
    glacier-modal
    fixed
    top-1/2 left-1/2
    -translate-x-1/2 -translate-y-1/2
    max-w-lg w-full
    max-h-[90vh]
    overflow-auto
    z-50
    p-6
  `.trim().replace(/\s+/g, ' '),
  
  modalOverlay: `
    fixed inset-0
    bg-black/50
    backdrop-blur-sm
    z-40
  `.trim().replace(/\s+/g, ' '),
  
  drawer: `
    glacier-panel
    fixed
    top-0 right-0
    h-full
    w-80
    max-w-full
    z-50
    p-6
    rounded-l-3xl rounded-r-none
  `.trim().replace(/\s+/g, ' '),
  
  sidebar: `
    glacier-panel
    h-full
    w-64
    p-4
    rounded-none
  `.trim().replace(/\s+/g, ' '),
  
  navbar: `
    glacier-liquid
    glacier-blur-xl
    fixed
    top-0 left-0 right-0
    z-50
    px-6 py-4
    flex items-center justify-between
    border-b border-white/10
  `.trim().replace(/\s+/g, ' '),

  // ============================================
  // FEEDBACK
  // ============================================
  alert: `
    glacier-liquid
    glacier-border
    px-4 py-3
    rounded-xl
    flex items-center gap-3
    text-white
  `.trim().replace(/\s+/g, ' '),
  
  alertSuccess: `
    glacier-liquid
    glacier-tint-success
    glacier-border
    px-4 py-3
    rounded-xl
    flex items-center gap-3
    text-white
  `.trim().replace(/\s+/g, ' '),
  
  alertWarning: `
    glacier-liquid
    glacier-tint-warning
    glacier-border
    px-4 py-3
    rounded-xl
    flex items-center gap-3
    text-white
  `.trim().replace(/\s+/g, ' '),
  
  alertDanger: `
    glacier-liquid
    glacier-tint-danger
    glacier-border
    px-4 py-3
    rounded-xl
    flex items-center gap-3
    text-white
  `.trim().replace(/\s+/g, ' '),
  
  alertInfo: `
    glacier-liquid
    glacier-tint-info
    glacier-border
    px-4 py-3
    rounded-xl
    flex items-center gap-3
    text-white
  `.trim().replace(/\s+/g, ' '),
  
  toast: `
    glacier-notification
    fixed
    bottom-4 right-4
    min-w-[300px]
    z-50
    animate-slide-up
  `.trim().replace(/\s+/g, ' '),
  
  badge: `
    glacier-glass
    glacier-blur-sm
    glacier-border
    px-2 py-0.5
    rounded-full
    text-xs font-medium
    text-white
    bg-white/10
  `.trim().replace(/\s+/g, ' '),
  
  tooltip: `
    glacier-glass
    glacier-blur-md
    glacier-border
    glacier-shadow-sm
    px-3 py-2
    rounded-lg
    text-sm
    text-white
    bg-black/60
    max-w-xs
  `.trim().replace(/\s+/g, ' '),

  // ============================================
  // NAVIGATION
  // ============================================
  tabs: `
    glacier-glass
    glacier-blur-md
    glacier-border
    flex items-center
    p-1
    rounded-2xl
    bg-white/5
  `.trim().replace(/\s+/g, ' '),
  
  tab: `
    glacier-animate
    px-4 py-2
    rounded-xl
    text-white/70
    font-medium
    cursor-pointer
    hover:text-white hover:bg-white/10
  `.trim().replace(/\s+/g, ' '),
  
  tabActive: `
    glacier-liquid
    px-4 py-2
    rounded-xl
    text-white
    font-medium
    cursor-pointer
  `.trim().replace(/\s+/g, ' '),
  
  breadcrumb: `
    flex items-center gap-2
    text-white/70
    text-sm
  `.trim().replace(/\s+/g, ' '),
  
  pagination: `
    flex items-center gap-1
  `.trim().replace(/\s+/g, ' '),
  
  menu: `
    glacier-panel
    p-2
    rounded-xl
    min-w-[200px]
  `.trim().replace(/\s+/g, ' '),
  
  menuItem: `
    glacier-animate
    flex items-center gap-3
    px-4 py-2
    rounded-lg
    text-white/80
    cursor-pointer
    hover:bg-white/10 hover:text-white
  `.trim().replace(/\s+/g, ' '),
  
  dropdown: `
    glacier-panel
    glacier-shadow-lg
    absolute
    mt-2
    p-2
    rounded-xl
    min-w-[200px]
    z-50
  `.trim().replace(/\s+/g, ' '),

  // ============================================
  // DATA DISPLAY
  // ============================================
  table: `
    glacier-card
    w-full
    overflow-hidden
  `.trim().replace(/\s+/g, ' '),
  
  tableHeader: `
    glacier-glass
    glacier-blur-sm
    bg-white/5
    text-white/70
    text-sm font-medium
    uppercase tracking-wider
    px-6 py-3
    text-left
  `.trim().replace(/\s+/g, ' '),
  
  tableRow: `
    glacier-animate
    border-b border-white/5
    hover:bg-white/5
  `.trim().replace(/\s+/g, ' '),
  
  tableCell: `
    px-6 py-4
    text-white
  `.trim().replace(/\s+/g, ' '),
  
  avatar: `
    glacier-liquid
    glacier-border
    inline-flex items-center justify-center
    w-10 h-10
    rounded-full
    overflow-hidden
    text-white font-medium
  `.trim().replace(/\s+/g, ' '),
  
  avatarGroup: `
    flex -space-x-3
  `.trim().replace(/\s+/g, ' '),
  
  tag: `
    glacier-glass
    glacier-blur-sm
    glacier-border
    inline-flex items-center gap-1
    px-3 py-1
    rounded-full
    text-sm
    text-white
    bg-white/10
  `.trim().replace(/\s+/g, ' '),
  
  progress: `
    glacier-glass
    glacier-blur-sm
    w-full h-2
    rounded-full
    overflow-hidden
    bg-white/10
  `.trim().replace(/\s+/g, ' '),

  // ============================================
  // MEDIA
  // ============================================
  image: `
    glacier-liquid
    glacier-border
    rounded-2xl
    overflow-hidden
  `.trim().replace(/\s+/g, ' '),
  
  video: `
    glacier-liquid
    glacier-border
    rounded-2xl
    overflow-hidden
  `.trim().replace(/\s+/g, ' '),
  
  carousel: `
    glacier-panel
    rounded-3xl
    overflow-hidden
    relative
  `.trim().replace(/\s+/g, ' '),
  
  gallery: `
    glacier-card
    grid gap-4
    rounded-3xl
    overflow-hidden
  `.trim().replace(/\s+/g, ' '),

  // ============================================
  // OVERLAYS
  // ============================================
  overlay: `
    glacier-glass
    glacier-blur-lg
    fixed inset-0
    z-40
  `.trim().replace(/\s+/g, ' '),
  
  overlayDark: `
    glacier-glass
    glacier-blur-lg
    fixed inset-0
    z-40
    bg-black/60
  `.trim().replace(/\s+/g, ' '),
  
  overlayLight: `
    glacier-glass
    glacier-blur-lg
    fixed inset-0
    z-40
    bg-white/40
  `.trim().replace(/\s+/g, ' '),
  
  backdrop: `
    glacier-glass
    glacier-blur-3xl
    absolute inset-0
    -z-10
  `.trim().replace(/\s+/g, ' '),

  // ============================================
  // SLIDERS
  // ============================================
  slider: `
    glacier-glass
    glacier-blur-sm
    relative
    w-full h-2
    rounded-full
    bg-white/10
    cursor-pointer
  `.trim().replace(/\s+/g, ' '),
  
  sliderTrack: `
    absolute
    h-full
    rounded-full
    bg-gradient-to-r from-blue-500/80 to-purple-500/80
  `.trim().replace(/\s+/g, ' '),
  
  sliderThumb: `
    glacier-liquid
    glacier-animate
    glacier-hover-brighten
    absolute
    top-1/2 -translate-y-1/2
    w-5 h-5
    rounded-full
    cursor-grab
    active:cursor-grabbing
  `.trim().replace(/\s+/g, ' '),
  
  rangeSlider: `
    glacier-glass
    glacier-blur-sm
    relative
    w-full h-2
    rounded-full
    bg-white/10
    cursor-pointer
  `.trim().replace(/\s+/g, ' '),
};

// Helper function to get component classes
export function getComponentClass(component: keyof ComponentClasses): string {
  return componentClasses[component];
}

// Helper function to combine classes
export function combineClasses(...classes: string[]): string {
  return classes.filter(Boolean).join(' ');
}

// Export component CSS as a string for injection
export const componentCSS = `
/* Glacier Component Styles */

/* Keyframe animations */
@keyframes glacier-slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes glacier-slide-down {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes glacier-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes glacier-scale-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes glacier-shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

/* Animation utility classes */
.animate-slide-up {
  animation: glacier-slide-up 0.3s ease-out;
}

.animate-slide-down {
  animation: glacier-slide-down 0.3s ease-out;
}

.animate-fade-in {
  animation: glacier-fade-in 0.3s ease-out;
}

.animate-scale-in {
  animation: glacier-scale-in 0.3s ease-out;
}

/* Shimmer loading effect */
.glacier-shimmer {
  position: relative;
  overflow: hidden;
}

.glacier-shimmer::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.1),
    transparent
  );
  animation: glacier-shimmer 2s infinite;
}

/* Custom scrollbar for glass elements */
.glacier-scrollbar::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.glacier-scrollbar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.glacier-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.glacier-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
`;

export default componentClasses;
