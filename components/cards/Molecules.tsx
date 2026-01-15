import React from 'react';
import { ThemeColors } from './BaseComponents';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import * as Progress from '@radix-ui/react-progress';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import * as SelectPrimitive from '@radix-ui/react-select';
import * as SliderPrimitive from '@radix-ui/react-slider';
import * as LabelPrimitive from '@radix-ui/react-label';
import { HiCheck, HiChevronDown, HiChevronUp } from 'react-icons/hi';

// Helper functions for interactive effects
const lightenColor = (color: string, amount: number = 0.2): string => {
  if (!color || typeof color !== 'string') return '#FFFFFF';
  try {
    const hex = color.replace('#', '');
    if (hex.length !== 6) return color; // Return original if invalid
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return color; // Return original if invalid
    const lighterR = Math.min(255, Math.floor(r + (255 - r) * amount));
    const lighterG = Math.min(255, Math.floor(g + (255 - g) * amount));
    const lighterB = Math.min(255, Math.floor(b + (255 - b) * amount));
    return `#${lighterR.toString(16).padStart(2, '0')}${lighterG.toString(16).padStart(2, '0')}${lighterB.toString(16).padStart(2, '0')}`;
  } catch (e) {
    console.warn('Error in lightenColor:', e);
    return color; // Return original color on error
  }
};

// Ripple effect component - always shows on click
const RippleEffect: React.FC<{
  position: { x: number; y: number } | null;
  isActive: boolean;
  color?: string;
}> = ({ position, isActive, color = 'rgba(255, 255, 255, 0.7)' }) => {
  if (!position || !isActive) return null;
  return (
    <div
      key={`ripple-${position.x}-${position.y}-${Date.now()}`}
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '0px',
        height: '0px',
        borderRadius: '50%',
        background: color,
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 2,
        animation: 'ripple-expand 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    />
  );
};

// Button Molecule
export const Button: React.FC<{
  variant?: 'primary' | 'secondary' | 'tertiary' | 'link' | 'success' | 'error' | 'warning' | 'info';
  children: React.ReactNode;
  theme: ThemeColors;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  icon?: React.ReactNode;
}> = ({ variant = 'primary', children, theme, onClick, disabled, className = '', style = {}, icon }) => {
  const [ripplePosition, setRipplePosition] = React.useState<{ x: number; y: number } | null>(null);
  const [isRippling, setIsRippling] = React.useState(false);
  const [isHovering, setIsHovering] = React.useState(false);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const baseStyles: React.CSSProperties = {
    padding: '12px 24px',
    borderRadius: '8px',
    fontWeight: variant === 'link' ? 500 : 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s',
    border: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '14px',
    ...style,
  };

  const variantStyles = {
    primary: {
      backgroundColor: disabled ? (theme?.disabled?.bg || '#9CA3AF') : (theme?.action?.primary || '#6366F1'),
      color: disabled ? (theme?.disabled?.text || '#6B7280') : (theme?.text?.onPrimary || '#FFFFFF'),
    },
    secondary: {
      backgroundColor: disabled ? (theme?.disabled?.bg || '#9CA3AF') : (theme?.action?.secondaryBg || '#F3F4F6'),
      color: disabled ? (theme?.disabled?.text || '#6B7280') : (theme?.action?.secondaryText || '#1F2937'),
      border: 'none',
    },
    tertiary: {
      backgroundColor: 'transparent',
      color: disabled ? (theme?.disabled?.text || '#6B7280') : (theme?.action?.primary || '#6366F1'),
      border: 'none',
    },
    link: {
      backgroundColor: 'transparent',
      color: disabled ? (theme?.disabled?.text || '#6B7280') : (theme?.action?.primary || '#6366F1'),
      padding: '8px 0',
      textDecoration: 'underline',
      textDecorationThickness: '2px',
      textUnderlineOffset: '4px',
    },
    success: {
      backgroundColor: disabled ? (theme?.disabled?.bg || '#9CA3AF') : (theme?.semantic?.success?.main || '#22c55e'),
      color: disabled ? (theme?.disabled?.text || '#6B7280') : (theme?.text?.onPrimary || '#FFFFFF'),
    },
    error: {
      backgroundColor: disabled ? (theme?.disabled?.bg || '#9CA3AF') : (theme?.semantic?.error?.main || '#ef4444'),
      color: disabled ? (theme?.disabled?.text || '#6B7280') : (theme?.text?.onPrimary || '#FFFFFF'),
    },
    warning: {
      backgroundColor: disabled ? (theme?.disabled?.bg || '#9CA3AF') : (theme?.semantic?.warning?.main || '#f97316'),
      color: disabled ? (theme?.disabled?.text || '#6B7280') : (theme?.text?.onPrimary || '#FFFFFF'),
    },
    info: {
      backgroundColor: disabled ? (theme?.disabled?.bg || '#9CA3AF') : (theme?.semantic?.info?.main || '#3b82f6'),
      color: disabled ? (theme?.disabled?.text || '#6B7280') : (theme?.text?.onPrimary || '#FFFFFF'),
    },
  };

  const currentStyles = variantStyles[variant];

  // Helper function to darken a color
  const darkenColor = (color: string, amount: number = 0.2): string => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const darkerR = Math.max(0, Math.floor(r * (1 - amount)));
    const darkerG = Math.max(0, Math.floor(g * (1 - amount)));
    const darkerB = Math.max(0, Math.floor(b * (1 - amount)));
    return `#${darkerR.toString(16).padStart(2, '0')}${darkerG.toString(16).padStart(2, '0')}${darkerB.toString(16).padStart(2, '0')}`;
  };

  const getHoverBg = () => {
    if (!theme) return null;
    if (variant === 'primary') return theme.action?.primaryHover;
    if (variant === 'secondary') return theme.action?.secondaryHover;
    if (variant === 'tertiary') return theme.action?.secondaryBg;
    if (variant === 'success') return theme.semantic?.success?.text;
    if (variant === 'error') return theme.semantic?.error?.text;
    if (variant === 'warning') return theme.semantic?.warning?.text;
    if (variant === 'info') return theme.semantic?.info?.text;
    return null;
  };

  const getActiveBg = () => {
    if (!theme) return null;
    if (variant === 'primary') return darkenColor(theme.action?.primary || '#6366F1', 0.15);
    if (variant === 'secondary') return darkenColor(theme.action?.secondaryBg || '#F3F4F6', 0.15);
    if (variant === 'tertiary') return `${theme.action?.primary || '#6366F1'}30`;
    if (variant === 'success') return darkenColor(theme.semantic?.success?.main || '#22c55e', 0.15);
    if (variant === 'error') return darkenColor(theme.semantic?.error?.main || '#ef4444', 0.15);
    if (variant === 'warning') return darkenColor(theme.semantic?.warning?.main || '#f97316', 0.15);
    if (variant === 'info') return darkenColor(theme.semantic?.info?.main || '#3b82f6', 0.15);
    return null;
  };


  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || variant === 'link') return;
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setRipplePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsRippling(true);
      // Reset ripple after animation completes
      setTimeout(() => {
        setIsRippling(false);
        setRipplePosition(null);
      }, 600);
    }
  };

  return (
    <button
      ref={buttonRef}
      style={{ ...baseStyles, ...currentStyles, position: 'relative', overflow: 'hidden' }}
      onClick={onClick}
      disabled={disabled}
      className={className}
      onMouseEnter={(e) => {
        setIsHovering(true);
        if (!theme) return;
        if (!disabled && variant === 'primary') {
          e.currentTarget.style.backgroundColor = theme.action?.primaryHover || theme.action?.primary;
        } else if (!disabled && variant === 'secondary') {
          e.currentTarget.style.backgroundColor = theme.action?.secondaryHover || theme.action?.secondaryBg;
        } else if (!disabled && variant === 'tertiary') {
          e.currentTarget.style.backgroundColor = theme.action?.secondaryBg;
        } else if (!disabled && variant === 'link') {
          e.currentTarget.style.opacity = '0.8';
        } else if (!disabled && ['success', 'error', 'warning', 'info'].includes(variant)) {
          const hoverBg = getHoverBg();
          if (hoverBg) e.currentTarget.style.backgroundColor = hoverBg;
        }
      }}
      onMouseLeave={(e) => {
        setIsHovering(false);
        if (!disabled) {
          if (variant === 'link') {
            e.currentTarget.style.opacity = '1';
          } else {
            e.currentTarget.style.backgroundColor = (currentStyles.backgroundColor as string) || 'transparent';
          }
        }
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={(e) => {
        if (!disabled && variant === 'link') {
          e.currentTarget.style.opacity = '0.8';
        }
      }}
    >
      {/* Ripple effect on click - always show on click at cursor position */}
      {!disabled && variant !== 'link' && (
        <RippleEffect 
          position={ripplePosition} 
          isActive={isRippling} 
          color="rgba(255, 255, 255, 0.7)"
        />
      )}
      <span style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: '8px' }}>
        {icon && <span>{icon}</span>}
        {children}
      </span>
    </button>
  );
};

// Input Molecule
export const Input: React.FC<{
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  theme: ThemeColors;
  type?: string;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  error?: boolean;
  success?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}> = ({ 
  placeholder, 
  value, 
  onChange, 
  theme, 
  type = 'text', 
  className = '', 
  style = {}, 
  disabled = false,
  error = false,
  success = false,
  iconLeft,
  iconRight
}) => {
  const borderColor = error 
    ? theme.semantic.error.main 
    : success 
    ? theme.semantic.success.main 
    : disabled 
    ? theme.disabled.border 
    : theme.border.default;

  return (
    <div className="relative">
      {iconLeft && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: theme.text.secondary }}>
          {iconLeft}
        </div>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full px-4 py-2 rounded-lg text-sm border transition-all focus:outline-none focus:ring-2 ${iconLeft ? 'pl-10' : ''} ${iconRight ? 'pr-10' : ''} ${className}`}
        style={{
          backgroundColor: disabled ? theme.disabled.bg : theme.bg.input,
          borderColor: borderColor,
          color: disabled ? theme.disabled.text : theme.text.main,
          fontSize: '14px',
          ...style,
        }}
        onMouseEnter={(e) => {
          if (!disabled && !error && !success && document.activeElement !== e.currentTarget) {
            e.currentTarget.style.borderColor = theme.border.focus;
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled && document.activeElement !== e.currentTarget) {
            e.currentTarget.style.borderColor = borderColor;
          }
        }}
        onFocus={(e) => {
          if (!disabled && !error && !success) {
            e.currentTarget.style.borderColor = theme.border.focus;
            e.currentTarget.style.boxShadow = `0 0 0 3px ${theme.border.focus}20`;
          }
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = borderColor;
          e.currentTarget.style.boxShadow = 'none';
        }}
        onMouseDown={(e) => {
          if (!disabled && !error && !success) {
            e.currentTarget.style.borderColor = theme.border.focus;
          }
        }}
      />
      {iconRight && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: theme.text.secondary }}>
          {iconRight}
        </div>
      )}
      {error && (
        <p className="text-xs mt-1" style={{ color: theme.semantic.error.text }}>This field is required</p>
      )}
    </div>
  );
};

// Textarea Molecule
export const Textarea: React.FC<{
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  theme: ThemeColors;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  error?: boolean;
  rows?: number;
}> = ({ 
  placeholder, 
  value, 
  onChange, 
  theme, 
  className = '', 
  style = {}, 
  disabled = false,
  error = false,
  rows = 4
}) => {
  const borderColor = error 
    ? theme.semantic.error.main 
    : disabled 
    ? theme.disabled.border 
    : theme.border.default;

  return (
    <textarea
      rows={rows}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`w-full px-4 py-2 rounded-lg text-sm border transition-all focus:outline-none focus:ring-2 resize-none ${className}`}
      style={{
        backgroundColor: disabled ? theme.disabled.bg : theme.bg.input,
        borderColor: borderColor,
        color: disabled ? theme.disabled.text : theme.text.main,
        fontSize: '14px',
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!disabled && !error && document.activeElement !== e.currentTarget) {
          e.currentTarget.style.borderColor = theme.border.focus;
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && document.activeElement !== e.currentTarget) {
          e.currentTarget.style.borderColor = borderColor;
        }
      }}
      onFocus={(e) => {
        if (!disabled && !error) {
          e.currentTarget.style.borderColor = theme.border.focus;
          e.currentTarget.style.boxShadow = `0 0 0 3px ${theme.border.focus}20`;
        }
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = borderColor;
        e.currentTarget.style.boxShadow = 'none';
      }}
      onMouseDown={(e) => {
        if (!disabled && !error) {
          e.currentTarget.style.borderColor = theme.border.focus;
        }
      }}
    />
  );
};

// Switch Molecule
export const Switch: React.FC<{
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  theme: ThemeColors;
  disabled?: boolean;
  label?: string;
  className?: string;
}> = ({ checked, onCheckedChange, theme, disabled = false, label, className = '' }) => {
  const [ripplePosition, setRipplePosition] = React.useState<{ x: number; y: number } | null>(null);
  const [isRippling, setIsRippling] = React.useState(false);
  const switchRef = React.useRef<HTMLButtonElement>(null);

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (switchRef.current) {
      const rect = switchRef.current.getBoundingClientRect();
      setRipplePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      setIsRippling(true);
      setTimeout(() => { setIsRippling(false); setRipplePosition(null); }, 600);
    }
  };

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {label && (
        <LabelPrimitive.Root className="text-sm" style={{ color: disabled ? theme.disabled.text : theme.text.main }}>
          {label}
        </LabelPrimitive.Root>
      )}
      <SwitchPrimitive.Root
        ref={switchRef}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors overflow-hidden ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
        style={{
          backgroundColor: disabled 
            ? theme.disabled.bg 
            : (checked ? theme.action.primary : (theme.switch?.off || theme.border.default || '#9CA3AF')),
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            const currentBg = checked ? theme.action.primary : (theme.switch?.off || theme.border.default || '#9CA3AF');
            e.currentTarget.style.backgroundColor = checked ? theme.action.primaryHover : `${currentBg}CC`;
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled) {
            const currentBg = checked ? theme.action.primary : (theme.switch?.off || theme.border.default || '#9CA3AF');
            e.currentTarget.style.backgroundColor = currentBg;
          }
        }}
        onMouseDown={handleMouseDown}
      >
        <RippleEffect position={ripplePosition} isActive={isRippling} />
        <SwitchPrimitive.Thumb
          className="block h-4 w-4 rounded-full bg-white transition-all duration-200 ease-in-out shadow-sm relative z-10"
          style={{
            transform: checked ? 'translateX(24px)' : 'translateX(4px)',
            backgroundColor: disabled ? theme.disabled.text : 'white',
          }}
        />
      </SwitchPrimitive.Root>
    </div>
  );
};

// Progress Molecule
export const ProgressBar: React.FC<{
  value: number;
  theme: ThemeColors;
  className?: string;
  style?: React.CSSProperties;
  height?: string;
  color?: string;
}> = ({ value, theme, className = '', style = {}, height = '8px', color }) => {
  return (
    <Progress.Root
      className={`relative overflow-hidden rounded-full ${className}`}
      style={{
        height: height,
        backgroundColor: theme.bg.input,
        ...style,
      }}
      value={value}
    >
      <Progress.Indicator
        className="h-full transition-all duration-300"
        style={{
          width: `${value}%`,
          backgroundColor: color || theme.action.primary,
        }}
      />
    </Progress.Root>
  );
};

// Radio Molecule
export const Radio: React.FC<{
  value: string;
  checked: boolean;
  onCheckedChange: (value: string) => void;
  theme: ThemeColors;
  disabled?: boolean;
  label?: string;
  className?: string;
}> = ({ value, checked, onCheckedChange, theme, disabled = false, label, className = '' }) => {
  const [ripplePosition, setRipplePosition] = React.useState<{ x: number; y: number } | null>(null);
  const [isRippling, setIsRippling] = React.useState(false);
  const radioRef = React.useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (radioRef.current) {
      const rect = radioRef.current.getBoundingClientRect();
      setRipplePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      setIsRippling(true);
      setTimeout(() => { setIsRippling(false); setRipplePosition(null); }, 600);
    }
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        ref={radioRef}
        onClick={() => !disabled && onCheckedChange(value)}
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all relative overflow-hidden ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        style={{
          borderColor: disabled 
            ? theme.disabled.border 
            : (checked ? theme.action.primary : theme.border.default),
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.borderColor = checked ? theme.action.primaryHover : theme.border.focus;
            e.currentTarget.style.backgroundColor = checked ? `${theme.action.primary}10` : theme.bg.input;
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled) {
            e.currentTarget.style.borderColor = checked ? theme.action.primary : theme.border.default;
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
        onMouseDown={handleMouseDown}
      >
        <RippleEffect position={ripplePosition} isActive={isRippling} />
        {checked && (
          <div 
            className="w-3 h-3 rounded-full relative z-10"
            style={{ backgroundColor: disabled ? theme.disabled.text : theme.action.primary }}
          />
        )}
      </div>
      {label && (
        <LabelPrimitive.Root className="text-sm" style={{ color: disabled ? theme.disabled.text : theme.text.main }}>
          {label}
        </LabelPrimitive.Root>
      )}
    </div>
  );
};

// RadioGroup Molecule
// RadioGroup Item Component with effects
const RadioGroupItem: React.FC<{
  option: { value: string; label: string; disabled?: boolean };
  value: string;
  theme: ThemeColors;
}> = ({ option, value, theme }) => {
  const [ripplePosition, setRipplePosition] = React.useState<{ x: number; y: number } | null>(null);
  const [isRippling, setIsRippling] = React.useState(false);
  const labelRef = React.useRef<HTMLLabelElement>(null);

  const handleMouseDown = (e: React.MouseEvent<HTMLLabelElement>) => {
    if (option.disabled) return;
    if (labelRef.current) {
      const rect = labelRef.current.getBoundingClientRect();
      setRipplePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      setIsRippling(true);
      setTimeout(() => { setIsRippling(false); setRipplePosition(null); }, 600);
    }
  };

  return (
    <label
      ref={labelRef}
      className="flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-colors relative overflow-hidden"
      style={{ 
        backgroundColor: value === option.value ? `${theme.action.primary}15` : theme.bg.input,
        border: `2px solid ${value === option.value ? theme.action.primary : theme.border.subtle}`,
      }}
      onMouseEnter={(e) => {
        if (value !== option.value) {
          e.currentTarget.style.backgroundColor = theme.action.secondaryBg;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = value === option.value ? `${theme.action.primary}15` : theme.bg.input;
      }}
      onMouseDown={handleMouseDown}
    >
      <RippleEffect position={ripplePosition} isActive={isRippling} />
      <RadioGroupPrimitive.Item
        value={option.value}
        className="w-5 h-5 rounded-full border-2 flex items-center justify-center relative z-10"
        style={{ borderColor: value === option.value ? theme.action.primary : theme.border.default }}
        disabled={option.disabled}
      >
        <RadioGroupPrimitive.Indicator
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: theme.action.primary }}
        />
      </RadioGroupPrimitive.Item>
      <span className="relative z-10" style={{ color: theme.text.main }}>{option.label}</span>
    </label>
  );
};

export const RadioGroup: React.FC<{
  value: string;
  onValueChange: (value: string) => void;
  theme: ThemeColors;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  className?: string;
}> = ({ value, onValueChange, theme, options, className = '' }) => {
  return (
    <RadioGroupPrimitive.Root value={value} onValueChange={onValueChange} className={className}>
      {options.map((option) => (
        <RadioGroupItem key={option.value} option={option} value={value} theme={theme} />
      ))}
    </RadioGroupPrimitive.Root>
  );
};

// Checkbox Molecule
export const Checkbox: React.FC<{
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  theme: ThemeColors;
  disabled?: boolean;
  label?: string;
  className?: string;
}> = ({ checked, onCheckedChange, theme, disabled = false, label, className = '' }) => {
  const [ripplePosition, setRipplePosition] = React.useState<{ x: number; y: number } | null>(null);
  const [isRippling, setIsRippling] = React.useState(false);
  const checkboxRef = React.useRef<HTMLButtonElement>(null);

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (checkboxRef.current) {
      const rect = checkboxRef.current.getBoundingClientRect();
      setRipplePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      setIsRippling(true);
      setTimeout(() => { setIsRippling(false); setRipplePosition(null); }, 600);
    }
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <CheckboxPrimitive.Root
        ref={checkboxRef}
        className="w-5 h-5 rounded border-2 flex items-center justify-center transition-all disabled:cursor-not-allowed cursor-pointer relative overflow-hidden"
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
        style={{
          backgroundColor: disabled 
            ? theme.disabled.bg 
            : (checked ? theme.action.primary : theme.bg.input),
          borderColor: disabled 
            ? theme.disabled.border 
            : (checked ? theme.action.primary : theme.border.default),
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.borderColor = checked ? theme.action.primaryHover : theme.border.focus;
            if (!checked) {
              e.currentTarget.style.backgroundColor = theme.action.secondaryBg;
            }
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled) {
            e.currentTarget.style.borderColor = checked ? theme.action.primary : theme.border.default;
            e.currentTarget.style.backgroundColor = checked ? theme.action.primary : theme.bg.input;
          }
        }}
        onMouseDown={handleMouseDown}
      >
        <RippleEffect position={ripplePosition} isActive={isRippling} />
        <CheckboxPrimitive.Indicator className="relative z-10">
          <HiCheck className="w-4 h-4" style={{ color: disabled ? theme.disabled.text : theme.text.onPrimary }} />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      {label && (
        <LabelPrimitive.Root className="text-sm" style={{ color: disabled ? theme.disabled.text : theme.text.main }}>
          {label}
        </LabelPrimitive.Root>
      )}
    </div>
  );
};

// Tag Molecule
export const Tag: React.FC<{
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'success' | 'error' | 'warning' | 'info';
  theme: ThemeColors;
  className?: string;
}> = ({ children, variant = 'primary', theme, className = '' }) => {
  const variantStyles = {
    primary: {
      backgroundColor: theme.action.primary,
      color: theme.text.onPrimary,
      border: 'none',
    },
    secondary: {
      backgroundColor: theme.action.secondaryBg,
      color: theme.action.secondaryText,
      border: `1px solid ${theme.border.default}`,
    },
    outline: {
      backgroundColor: 'transparent',
      color: theme.text.secondary,
      border: `1px solid ${theme.border.default}`,
    },
    success: {
      backgroundColor: theme.semantic.success.bg,
      color: theme.semantic.success.text,
      border: 'none',
    },
    error: {
      backgroundColor: theme.semantic.error.bg,
      color: theme.semantic.error.text,
      border: 'none',
    },
    warning: {
      backgroundColor: theme.semantic.warning.bg,
      color: theme.semantic.warning.text,
      border: 'none',
    },
    info: {
      backgroundColor: theme.semantic.info.bg,
      color: theme.semantic.info.text,
      border: 'none',
    },
  };

  return (
    <span
      className={`px-2 py-1 rounded text-xs font-medium ${className}`}
      style={variantStyles[variant]}
    >
      {children}
    </span>
  );
};

// Badge Molecule
export const Badge: React.FC<{
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  theme: ThemeColors;
  className?: string;
}> = ({ children, variant = 'primary', theme, className = '' }) => {
  const variantStyles = {
    primary: {
      backgroundColor: theme.action.primary,
      color: theme.text.onPrimary,
    },
    secondary: {
      backgroundColor: theme.action.secondaryBg,
      color: theme.action.secondaryText,
      border: `1px solid ${theme.border.default}`,
    },
    success: {
      backgroundColor: theme.semantic.success.bg,
      color: theme.semantic.success.text,
    },
    error: {
      backgroundColor: theme.semantic.error.bg,
      color: theme.semantic.error.text,
    },
    warning: {
      backgroundColor: theme.semantic.warning.bg,
      color: theme.semantic.warning.text,
    },
    info: {
      backgroundColor: theme.semantic.info.bg,
      color: theme.semantic.info.text,
    },
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${variant === 'secondary' ? 'border' : ''} ${className}`}
      style={variantStyles[variant]}
    >
      {children}
    </span>
  );
};

// Label Molecule
export const Label: React.FC<{
  children: React.ReactNode;
  htmlFor?: string;
  variant?: 'default' | 'secondary' | 'small';
  theme: ThemeColors;
  className?: string;
}> = ({ children, htmlFor, variant = 'default', theme, className = '' }) => {
  const variantStyles = {
    default: {
      fontSize: '14px',
      fontWeight: 500,
      color: theme.text.main,
    },
    secondary: {
      fontSize: '14px',
      fontWeight: 700,
      color: theme.text.secondary,
    },
    small: {
      fontSize: '12px',
      fontWeight: 700,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
      color: theme.text.tertiary,
    },
  };

  return (
    <LabelPrimitive.Root
      htmlFor={htmlFor}
      className={`block mb-2 ${variant === 'small' ? 'uppercase tracking-wider' : ''} ${className}`}
      style={variantStyles[variant]}
    >
      {children}
    </LabelPrimitive.Root>
  );
};

// Select Item Component with effects
const SelectItem: React.FC<{
  option: { value: string; label: string };
  theme: ThemeColors;
}> = ({ option, theme }) => {
  const [ripplePosition, setRipplePosition] = React.useState<{ x: number; y: number } | null>(null);
  const [isRippling, setIsRippling] = React.useState(false);
  const itemRef = React.useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (itemRef.current) {
      const rect = itemRef.current.getBoundingClientRect();
      setRipplePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      setIsRippling(true);
      setTimeout(() => { setIsRippling(false); setRipplePosition(null); }, 600);
    }
  };

  return (
    <SelectPrimitive.Item
      value={option.value}
      className="px-3 py-2 rounded text-sm cursor-pointer focus:outline-none transition-all relative overflow-hidden"
      style={{ color: theme.text.main }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = theme.action.secondaryBg;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
      onMouseDown={handleMouseDown as any}
    >
      <RippleEffect position={ripplePosition} isActive={isRippling} />
      <span className="relative z-10">
        <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
      </span>
    </SelectPrimitive.Item>
  );
};

// Select Molecule
export const Select: React.FC<{
  value?: string;
  onValueChange: (value: string) => void;
  theme: ThemeColors;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}> = ({ value, onValueChange, theme, options, placeholder = 'Choose an option...', disabled = false, className = '' }) => {
  const [ripplePosition, setRipplePosition] = React.useState<{ x: number; y: number } | null>(null);
  const [isRippling, setIsRippling] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setRipplePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      setIsRippling(true);
      setTimeout(() => { setIsRippling(false); setRipplePosition(null); }, 600);
    }
  };

  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectPrimitive.Trigger
        ref={triggerRef}
        className={`w-full px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-all focus:outline-none focus:ring-2 relative overflow-hidden ${className}`}
        style={{
          backgroundColor: disabled ? theme.disabled.bg : theme.bg.input,
          color: disabled ? theme.disabled.text : theme.text.main,
          border: `1px solid ${disabled ? theme.disabled.border : theme.border.default}`,
        }}
        onMouseEnter={(e) => {
          if (!disabled && document.activeElement !== e.currentTarget) {
            e.currentTarget.style.borderColor = theme.border.focus;
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled && document.activeElement !== e.currentTarget) {
            e.currentTarget.style.borderColor = theme.border.default;
          }
        }}
        onMouseDown={handleMouseDown}
      >
        <RippleEffect position={ripplePosition} isActive={isRippling} />
        <span className="relative z-10 flex items-center justify-between w-full">
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon>
            <HiChevronDown className="w-4 h-4" />
          </SelectPrimitive.Icon>
        </span>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className="rounded-lg shadow-lg border min-w-[200px] p-1"
          style={{ 
            backgroundColor: theme.bg.card, 
            borderColor: theme.border.subtle,
          }}
        >
          <SelectPrimitive.ScrollUpButton className="flex items-center justify-center h-6">
            <HiChevronUp className="w-4 h-4" style={{ color: theme.text.secondary }} />
          </SelectPrimitive.ScrollUpButton>
          <SelectPrimitive.Viewport>
            {options.map((option) => (
              <SelectItem key={option.value} option={option} theme={theme} />
            ))}
          </SelectPrimitive.Viewport>
          <SelectPrimitive.ScrollDownButton className="flex items-center justify-center h-6">
            <HiChevronDown className="w-4 h-4" style={{ color: theme.text.secondary }} />
          </SelectPrimitive.ScrollDownButton>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
};

// Slider Thumb Component with effects
const SliderThumb: React.FC<{ theme: ThemeColors }> = ({ theme }) => {
  const [ripplePosition, setRipplePosition] = React.useState<{ x: number; y: number } | null>(null);
  const [isRippling, setIsRippling] = React.useState(false);
  const thumbRef = React.useRef<HTMLSpanElement>(null);

  const handleMouseDown = (e: React.MouseEvent<HTMLSpanElement>) => {
    if (thumbRef.current) {
      const rect = thumbRef.current.getBoundingClientRect();
      setRipplePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      setIsRippling(true);
      setTimeout(() => { setIsRippling(false); setRipplePosition(null); }, 600);
    }
  };

  return (
    <SliderPrimitive.Thumb
      ref={thumbRef}
      className="block w-5 h-5 bg-white shadow-[0_2px_10px] shadow-blackA7 rounded-[10px] focus:outline-none focus:shadow-[0_0_0_5px] focus:shadow-blackA8 transition-all relative overflow-visible"
      style={{ backgroundColor: theme.action.primary }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = theme.action.primaryHover;
        e.currentTarget.style.transform = 'scale(1.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = theme.action.primary;
        e.currentTarget.style.transform = 'scale(1)';
      }}
      onMouseDown={handleMouseDown as any}
    >
      <RippleEffect position={ripplePosition} isActive={isRippling} />
    </SliderPrimitive.Thumb>
  );
};

// Slider Molecule
export const Slider: React.FC<{
  value: number[];
  onValueChange: (value: number[]) => void;
  theme: ThemeColors;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}> = ({ value, onValueChange, theme, min = 0, max = 100, step = 1, className = '' }) => {
  return (
    <SliderPrimitive.Root
      value={value}
      onValueChange={onValueChange}
      min={min}
      max={max}
      step={step}
      className={`relative flex items-center select-none touch-none w-full h-5 ${className}`}
    >
      <SliderPrimitive.Track className="bg-blackA10 relative grow rounded-full h-2" style={{ backgroundColor: theme.bg.input }}>
        <SliderPrimitive.Range className="absolute bg-white rounded-full h-full" style={{ backgroundColor: theme.action.primary }} />
      </SliderPrimitive.Track>
      <SliderThumb theme={theme} />
    </SliderPrimitive.Root>
  );
};

// Pill Molecule
export const Pill: React.FC<{
  children: React.ReactNode;
  theme: ThemeColors;
  className?: string;
}> = ({ children, theme, className = '' }) => {
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium ${className}`}
      style={{ backgroundColor: theme.bg.input, color: theme.text.main }}
    >
      {children}
    </span>
  );
};

// IconButton Molecule (basado en Button pero más pequeño)
export const IconButton: React.FC<{
  children: React.ReactNode;
  theme: ThemeColors;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  variant?: 'default' | 'primary' | 'secondary';
}> = ({ children, theme, onClick, disabled = false, className = '', style = {}, variant = 'default' }) => {
  const [ripplePosition, setRipplePosition] = React.useState<{ x: number; y: number } | null>(null);
  const [isRippling, setIsRippling] = React.useState(false);
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  const variantStyles = {
    default: {
      backgroundColor: 'transparent',
      color: theme.text.secondary,
    },
    primary: {
      backgroundColor: theme.action.primary,
      color: theme.text.onPrimary,
    },
    secondary: {
      backgroundColor: theme.action.secondaryBg,
      color: theme.action.secondaryText,
    },
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setRipplePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsRippling(true);
      setTimeout(() => {
        setIsRippling(false);
        setRipplePosition(null);
      }, 600);
    }
  };

  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      disabled={disabled}
      className={`p-2 rounded-lg transition-all relative overflow-hidden ${className}`}
      style={{
        ...variantStyles[variant],
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          if (variant === 'default') {
            e.currentTarget.style.backgroundColor = theme.bg.input;
            e.currentTarget.style.color = theme.text.main;
          } else if (variant === 'primary') {
            e.currentTarget.style.backgroundColor = theme.action.primaryHover;
          } else if (variant === 'secondary') {
            e.currentTarget.style.backgroundColor = theme.action.secondaryHover;
          }
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          if (variant === 'default') {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = theme.text.secondary;
          } else {
            e.currentTarget.style.backgroundColor = variantStyles[variant].backgroundColor as string;
          }
        }
      }}
      onMouseDown={handleMouseDown}
    >
      {!disabled && (
        <RippleEffect position={ripplePosition} isActive={isRippling} />
      )}
      <span style={{ position: 'relative', zIndex: 2 }}>{children}</span>
    </button>
  );
};
