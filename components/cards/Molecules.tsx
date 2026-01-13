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

// Button Molecule
export const Button: React.FC<{
  variant?: 'primary' | 'secondary' | 'tertiary' | 'link';
  children: React.ReactNode;
  theme: ThemeColors;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  icon?: React.ReactNode;
}> = ({ variant = 'primary', children, theme, onClick, disabled, className = '', style = {}, icon }) => {
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
      backgroundColor: disabled ? theme.disabled.bg : theme.action.primary,
      color: disabled ? theme.disabled.text : theme.text.onPrimary,
    },
    secondary: {
      backgroundColor: disabled ? theme.disabled.bg : theme.action.secondaryBg,
      color: disabled ? theme.disabled.text : theme.action.secondaryText,
      border: `1px solid ${theme.border.subtle}`,
    },
    tertiary: {
      backgroundColor: 'transparent',
      color: disabled ? theme.disabled.text : theme.text.main,
      border: 'none',
    },
    link: {
      backgroundColor: 'transparent',
      color: disabled ? theme.disabled.text : theme.action.primary,
      padding: '8px 0',
      textDecoration: 'underline',
      textDecorationThickness: '2px',
      textUnderlineOffset: '4px',
    },
  };

  const currentStyles = variantStyles[variant];

  return (
    <button
      style={{ ...baseStyles, ...currentStyles }}
      onClick={onClick}
      disabled={disabled}
      className={className}
      onMouseEnter={(e) => {
        if (!disabled && variant === 'primary') {
          e.currentTarget.style.backgroundColor = theme.action.primaryHover;
        } else if (!disabled && variant === 'secondary') {
          e.currentTarget.style.backgroundColor = theme.action.secondaryHover;
        } else if (!disabled && variant === 'tertiary') {
          e.currentTarget.style.backgroundColor = theme.action.secondaryBg;
        } else if (!disabled && variant === 'link') {
          e.currentTarget.style.opacity = '0.8';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          if (variant === 'link') {
            e.currentTarget.style.opacity = '1';
          } else {
            e.currentTarget.style.backgroundColor = (currentStyles.backgroundColor as string) || 'transparent';
          }
        }
      }}
    >
      {icon && <span>{icon}</span>}
      {children}
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
  return (
    <div className={`flex items-center justify-between ${className}`}>
      {label && (
        <LabelPrimitive.Root className="text-sm" style={{ color: disabled ? theme.disabled.text : theme.text.main }}>
          {label}
        </LabelPrimitive.Root>
      )}
      <SwitchPrimitive.Root
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
        style={{
          backgroundColor: disabled 
            ? theme.disabled.bg 
            : (checked ? theme.action.primary : (theme.switch?.off || theme.border.default || '#9CA3AF')),
        }}
      >
        <SwitchPrimitive.Thumb
          className="block h-4 w-4 rounded-full bg-white transition-all duration-200 ease-in-out shadow-sm"
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
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        onClick={() => !disabled && onCheckedChange(value)}
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        style={{
          borderColor: disabled 
            ? theme.disabled.border 
            : (checked ? theme.action.primary : theme.border.default),
        }}
      >
        {checked && (
          <div 
            className="w-3 h-3 rounded-full"
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
        <label
          key={option.value}
          className="flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-colors"
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
        >
          <RadioGroupPrimitive.Item
            value={option.value}
            className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
            style={{ borderColor: value === option.value ? theme.action.primary : theme.border.default }}
            disabled={option.disabled}
          >
            <RadioGroupPrimitive.Indicator
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: theme.action.primary }}
            />
          </RadioGroupPrimitive.Item>
          <span style={{ color: theme.text.main }}>{option.label}</span>
        </label>
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
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <CheckboxPrimitive.Root
        className="w-5 h-5 rounded border-2 flex items-center justify-center transition-all disabled:cursor-not-allowed"
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
      >
        <CheckboxPrimitive.Indicator>
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
  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectPrimitive.Trigger
        className={`w-full px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-all focus:outline-none focus:ring-2 ${className}`}
        style={{
          backgroundColor: disabled ? theme.disabled.bg : theme.bg.input,
          color: disabled ? theme.disabled.text : theme.text.main,
          border: `1px solid ${disabled ? theme.disabled.border : theme.border.default}`,
        }}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon>
          <HiChevronDown className="w-4 h-4" />
        </SelectPrimitive.Icon>
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
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                className="px-3 py-2 rounded text-sm cursor-pointer focus:outline-none"
                style={{
                  color: theme.text.main,
                }}
              >
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
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
      <SliderPrimitive.Thumb
        className="block w-5 h-5 bg-white shadow-[0_2px_10px] shadow-blackA7 rounded-[10px] hover:bg-violet3 focus:outline-none focus:shadow-[0_0_0_5px] focus:shadow-blackA8"
        style={{ backgroundColor: theme.action.primary }}
      />
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

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`p-2 rounded-lg transition-all ${className}`}
      style={{
        ...variantStyles[variant],
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!disabled && variant === 'default') {
          e.currentTarget.style.backgroundColor = theme.bg.input;
          e.currentTarget.style.color = theme.text.main;
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && variant === 'default') {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = theme.text.secondary;
        }
      }}
    >
      {children}
    </button>
  );
};
