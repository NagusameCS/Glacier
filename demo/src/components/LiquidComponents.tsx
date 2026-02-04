/**
 * Apple-style Liquid Glass UI Components
 * Proper liquid glass toggles, sliders, and inputs
 */
import { useState, useRef, useEffect } from 'react';

// =============================================
// LIQUID GLASS TOGGLE
// =============================================
interface LiquidToggleProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function LiquidToggle({ 
  checked = false, 
  onChange, 
  disabled = false,
  size = 'md' 
}: LiquidToggleProps) {
  const [isChecked, setIsChecked] = useState(checked);
  const [isPressed, setIsPressed] = useState(false);
  
  useEffect(() => {
    setIsChecked(checked);
  }, [checked]);
  
  const handleClick = () => {
    if (disabled) return;
    const newValue = !isChecked;
    setIsChecked(newValue);
    onChange?.(newValue);
  };
  
  const sizes = {
    sm: { width: 44, height: 26, thumb: 22 },
    md: { width: 56, height: 32, thumb: 28 },
    lg: { width: 68, height: 38, thumb: 34 },
  };
  
  const { width, height, thumb } = sizes[size];
  
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isChecked}
      disabled={disabled}
      onClick={handleClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      className="relative transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-white/30 rounded-full"
      style={{
        width,
        height,
        background: isChecked 
          ? 'linear-gradient(135deg, rgba(52, 199, 89, 0.9), rgba(48, 209, 88, 0.8))'
          : 'rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: `1px solid ${isChecked ? 'rgba(52, 199, 89, 0.3)' : 'rgba(255, 255, 255, 0.2)'}`,
        boxShadow: `
          inset 0 1px 1px rgba(255, 255, 255, ${isChecked ? 0.3 : 0.1}),
          inset 0 -1px 1px rgba(0, 0, 0, 0.1),
          0 2px 8px rgba(0, 0, 0, 0.15)
        `,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {/* Track highlight */}
      <div 
        className="absolute inset-0 rounded-full overflow-hidden"
        style={{
          background: `linear-gradient(
            180deg,
            rgba(255, 255, 255, ${isChecked ? 0.2 : 0.1}) 0%,
            transparent 50%
          )`,
        }}
      />
      
      {/* Thumb */}
      <div
        className="absolute top-1/2 -translate-y-1/2 rounded-full transition-all duration-300 ease-out"
        style={{
          width: thumb - (isPressed ? 4 : 0),
          height: thumb - (isPressed ? 4 : 0),
          left: isChecked ? width - thumb - 2 : 2,
          background: 'linear-gradient(180deg, #fff 0%, #f0f0f0 100%)',
          boxShadow: `
            0 2px 4px rgba(0, 0, 0, 0.2),
            0 4px 8px rgba(0, 0, 0, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.8),
            inset 0 -1px 0 rgba(0, 0, 0, 0.05)
          `,
          transform: `translateY(-50%) ${isPressed ? 'scale(0.95)' : 'scale(1)'}`,
        }}
      >
        {/* Thumb glare */}
        <div 
          className="absolute inset-0 rounded-full"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, transparent 50%)',
          }}
        />
      </div>
    </button>
  );
}

// =============================================
// LIQUID GLASS SLIDER
// =============================================
interface LiquidSliderProps {
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number) => void;
  disabled?: boolean;
  showValue?: boolean;
  label?: string;
}

export function LiquidSlider({
  value = 50,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  disabled = false,
  showValue = false,
  label,
}: LiquidSliderProps) {
  const [currentValue, setCurrentValue] = useState(value);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    setCurrentValue(value);
  }, [value]);
  
  const percentage = ((currentValue - min) / (max - min)) * 100;
  
  const updateValue = (clientX: number) => {
    if (!trackRef.current || disabled) return;
    
    const rect = trackRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const newPercentage = x / rect.width;
    const rawValue = min + newPercentage * (max - min);
    const steppedValue = Math.round(rawValue / step) * step;
    const clampedValue = Math.max(min, Math.min(max, steppedValue));
    
    setCurrentValue(clampedValue);
    onChange?.(clampedValue);
  };
  
  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    setIsDragging(true);
    updateValue(e.clientX);
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
        className="relative h-8 cursor-pointer"
        style={{
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
        onMouseDown={handleMouseDown}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Track background */}
        <div
          className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-2 rounded-full overflow-hidden"
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.2)',
          }}
        >
          {/* Filled track with glass effect */}
          <div
            className="absolute inset-y-0 left-0 transition-all duration-75"
            style={{
              width: `${percentage}%`,
              background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.8), rgba(147, 51, 234, 0.8))',
              boxShadow: `
                inset 0 1px 0 rgba(255, 255, 255, 0.3),
                0 0 10px rgba(59, 130, 246, 0.4)
              `,
            }}
          >
            {/* Track glare */}
            <div 
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 50%)',
              }}
            />
          </div>
        </div>
        
        {/* Thumb with liquid glass effect */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-transform duration-75"
          style={{
            left: `${percentage}%`,
            width: isDragging ? 26 : isHovering ? 24 : 22,
            height: isDragging ? 26 : isHovering ? 24 : 22,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,240,240,0.9) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            boxShadow: `
              0 2px 8px rgba(0, 0, 0, 0.3),
              0 4px 12px rgba(0, 0, 0, 0.15),
              inset 0 1px 0 rgba(255, 255, 255, 1),
              inset 0 -1px 0 rgba(0, 0, 0, 0.1)
            `,
            transform: `translate(-50%, -50%) scale(${isDragging ? 1.1 : 1})`,
          }}
        >
          {/* Thumb inner glare */}
          <div 
            className="absolute inset-1 rounded-full"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, transparent 60%)',
            }}
          />
        </div>
      </div>
    </div>
  );
}

// =============================================
// LIQUID GLASS INPUT
// =============================================
interface LiquidInputProps {
  value?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  type?: 'text' | 'email' | 'password' | 'search';
  disabled?: boolean;
  icon?: React.ReactNode;
}

export function LiquidInput({
  value = '',
  placeholder = '',
  onChange,
  type = 'text',
  disabled = false,
  icon,
}: LiquidInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  
  useEffect(() => {
    setCurrentValue(value);
  }, [value]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentValue(e.target.value);
    onChange?.(e.target.value);
  };
  
  return (
    <div
      className="relative group"
      style={{
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {/* Glass container */}
      <div
        className="relative overflow-hidden rounded-2xl transition-all duration-300"
        style={{
          background: isFocused 
            ? 'rgba(255, 255, 255, 0.12)'
            : 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border: `1px solid ${isFocused ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.15)'}`,
          boxShadow: isFocused 
            ? `
                inset 0 1px 2px rgba(255, 255, 255, 0.15),
                inset 0 -1px 2px rgba(0, 0, 0, 0.05),
                0 0 0 4px rgba(59, 130, 246, 0.2),
                0 4px 16px rgba(0, 0, 0, 0.1)
              `
            : `
                inset 0 1px 2px rgba(255, 255, 255, 0.1),
                inset 0 -1px 2px rgba(0, 0, 0, 0.05),
                0 2px 8px rgba(0, 0, 0, 0.08)
              `,
        }}
      >
        {/* Top glare */}
        <div 
          className="absolute inset-x-0 top-0 h-1/2 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 100%)',
          }}
        />
        
        <div className="flex items-center">
          {icon && (
            <div className="pl-4 text-white/50">
              {icon}
            </div>
          )}
          
          <input
            type={type}
            value={currentValue}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="w-full bg-transparent px-4 py-3.5 text-white placeholder-white/40 focus:outline-none"
            style={{
              paddingLeft: icon ? '0.5rem' : '1rem',
            }}
          />
        </div>
      </div>
    </div>
  );
}

// =============================================
// LIQUID GLASS BUTTON
// =============================================
interface LiquidButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  icon?: React.ReactNode;
}

export function LiquidButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  icon,
}: LiquidButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };
  
  const getBackground = () => {
    if (variant === 'primary') {
      return isHovering
        ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.85), rgba(147, 51, 234, 0.85))'
        : 'linear-gradient(135deg, rgba(59, 130, 246, 0.75), rgba(147, 51, 234, 0.75))';
    }
    if (variant === 'secondary') {
      return isHovering
        ? 'rgba(255, 255, 255, 0.18)'
        : 'rgba(255, 255, 255, 0.12)';
    }
    return isHovering ? 'rgba(255, 255, 255, 0.08)' : 'transparent';
  };
  
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => { setIsPressed(false); setIsHovering(false); }}
      onMouseEnter={() => setIsHovering(true)}
      className={`
        relative overflow-hidden rounded-2xl font-medium text-white
        transition-all duration-200 ease-out
        focus:outline-none focus:ring-2 focus:ring-white/30
        ${sizes[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      style={{
        background: getBackground(),
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: `1px solid ${variant === 'primary' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.15)'}`,
        boxShadow: isPressed
          ? 'inset 0 2px 4px rgba(0, 0, 0, 0.2)'
          : `
              inset 0 1px 1px rgba(255, 255, 255, 0.2),
              0 4px 12px rgba(0, 0, 0, ${variant === 'primary' ? 0.25 : 0.15})
            `,
        transform: isPressed ? 'scale(0.98)' : 'scale(1)',
      }}
    >
      {/* Top glare */}
      <div 
        className="absolute inset-x-0 top-0 h-1/2 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 100%)',
        }}
      />
      
      <span className="relative flex items-center justify-center gap-2">
        {icon}
        {children}
      </span>
    </button>
  );
}

// =============================================
// LIQUID GLASS CARD
// =============================================
interface LiquidCardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  onClick?: () => void;
}

export function LiquidCard({
  children,
  className = '',
  hoverable = false,
  onClick,
}: LiquidCardProps) {
  const [isHovering, setIsHovering] = useState(false);
  
  return (
    <div
      className={`
        relative overflow-hidden rounded-3xl p-6
        transition-all duration-300 ease-out
        ${hoverable ? 'cursor-pointer' : ''}
        ${className}
      `}
      style={{
        background: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow: `
          inset 0 1px 1px rgba(255, 255, 255, 0.1),
          inset 0 -1px 1px rgba(0, 0, 0, 0.05),
          0 8px 32px rgba(0, 0, 0, ${isHovering && hoverable ? 0.2 : 0.12})
        `,
        transform: isHovering && hoverable ? 'translateY(-2px)' : 'translateY(0)',
      }}
      onClick={onClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Top glare */}
      <div 
        className="absolute inset-x-0 top-0 h-24 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 100%)',
        }}
      />
      
      <div className="relative">{children}</div>
    </div>
  );
}

// =============================================
// LIQUID GLASS CHECKBOX
// =============================================
interface LiquidCheckboxProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function LiquidCheckbox({
  checked = false,
  onChange,
  label,
  disabled = false,
}: LiquidCheckboxProps) {
  const [isChecked, setIsChecked] = useState(checked);
  
  useEffect(() => {
    setIsChecked(checked);
  }, [checked]);
  
  const handleClick = () => {
    if (disabled) return;
    const newValue = !isChecked;
    setIsChecked(newValue);
    onChange?.(newValue);
  };
  
  return (
    <label
      className={`flex items-center gap-3 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      onClick={handleClick}
    >
      <div
        className="relative w-6 h-6 rounded-lg transition-all duration-200"
        style={{
          background: isChecked 
            ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(147, 51, 234, 0.9))'
            : 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${isChecked ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255, 255, 255, 0.2)'}`,
          boxShadow: isChecked 
            ? '0 2px 8px rgba(59, 130, 246, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)'
            : 'inset 0 1px 2px rgba(0, 0, 0, 0.1)',
        }}
      >
        {isChecked && (
          <svg
            className="absolute inset-0 w-full h-full p-1 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </div>
      {label && <span className="text-white/90">{label}</span>}
    </label>
  );
}

export default {
  LiquidToggle,
  LiquidSlider,
  LiquidInput,
  LiquidButton,
  LiquidCard,
  LiquidCheckbox,
};
