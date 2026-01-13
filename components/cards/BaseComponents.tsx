import React from 'react';

export interface Shade {
  level: number;
  hex: string;
}

export interface ThemeColors {
  bg: {
    page: string;
    card: string;
    sidebar: string;
    input: string;
  };
  text: {
    main: string;
    secondary: string;
    tertiary: string;
    onPrimary: string;
  };
  border: {
    subtle: string;
    default: string;
    focus: string;
  };
  switch?: {
    off: string;
  };
  action: {
    primary: string;
    primaryHover: string;
    secondaryBg: string;
    secondaryHover: string;
    secondaryText: string;
  };
  disabled: {
    bg: string;
    text: string;
    border: string;
  };
  semantic: {
    success: { main: string; bg: string; text: string };
    warning: { main: string; bg: string; text: string };
    error: { main: string; bg: string; text: string };
    info: { main: string; bg: string; text: string };
  };
  shades?: {
    primary: Shade[];
  };
}

// Base Card Component
export const BaseCard: React.FC<{
  children: React.ReactNode;
  theme: ThemeColors;
  className?: string;
  style?: React.CSSProperties;
}> = ({ children, theme, className = '', style = {} }) => (
  <div
    className={`rounded-2xl transition-all duration-300 ${className}`}
    style={{
      backgroundColor: theme.bg.card,
      boxShadow: `0 4px 12px -2px rgba(59, 130, 246, 0.15), 0 2px 4px -1px rgba(59, 130, 246, 0.1)`,
      maxWidth: '380px',
      width: '100%',
      ...style,
    }}
  >
    {children}
  </div>
);

// Button Components
export const UIButton: React.FC<{
  variant?: 'primary' | 'secondary' | 'tertiary';
  children: React.ReactNode;
  theme: ThemeColors;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  icon?: React.ReactNode;
}> = ({ variant = 'primary', children, theme, onClick, disabled, className = '', style = {}, icon }) => {
  const baseStyles: React.CSSProperties = {
    padding: '10px 20px',
    borderRadius: '8px',
    fontWeight: 600,
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
      color: theme.text.main,
      border: 'none',
    },
  };

  return (
    <button
      style={{ ...baseStyles, ...variantStyles[variant] }}
      onClick={onClick}
      disabled={disabled}
      className={className}
      onMouseEnter={(e) => {
        if (!disabled && variant === 'primary') {
          e.currentTarget.style.backgroundColor = theme.action.primaryHover;
        } else if (!disabled && variant === 'secondary') {
          e.currentTarget.style.backgroundColor = theme.action.secondaryHover;
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = (variantStyles[variant].backgroundColor as string) || 'transparent';
        }
      }}
    >
      {icon && <span>{icon}</span>}
      {children}
    </button>
  );
};

// Input Component
export const UIInput: React.FC<{
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  theme: ThemeColors;
  type?: string;
  className?: string;
  style?: React.CSSProperties;
}> = ({ placeholder, value, onChange, theme, type = 'text', className = '', style = {} }) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    className={`px-4 py-2 rounded-lg border transition-all focus:outline-none focus:ring-2 ${className}`}
    style={{
      backgroundColor: theme.bg.input,
      borderColor: theme.border.subtle,
      color: theme.text.main,
      fontSize: '14px',
      ...style,
    }}
    onFocus={(e) => {
      e.currentTarget.style.borderColor = theme.border.focus;
      e.currentTarget.style.boxShadow = `0 0 0 3px ${theme.border.focus}20`;
    }}
    onBlur={(e) => {
      e.currentTarget.style.borderColor = theme.border.subtle;
      e.currentTarget.style.boxShadow = 'none';
    }}
  />
);

// Tag Component
export const UITag: React.FC<{
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'tertiary';
  theme: ThemeColors;
  className?: string;
}> = ({ children, variant = 'primary', theme, className = '' }) => {
  const variantStyles = {
    primary: {
      backgroundColor: `${theme.action.primary}20`,
      color: theme.action.primary,
    },
    secondary: {
      backgroundColor: `${theme.action.secondaryBg}40`,
      color: theme.action.secondaryText,
    },
    tertiary: {
      backgroundColor: theme.bg.input,
      color: theme.text.secondary,
    },
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${className}`}
      style={variantStyles[variant]}
    >
      {children}
    </span>
  );
};

// Icon Button Component
export const IconButton: React.FC<{
  children: React.ReactNode;
  theme: ThemeColors;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}> = ({ children, theme, onClick, className = '', style = {} }) => (
  <button
    onClick={onClick}
    className={`p-2 rounded-lg transition-all ${className}`}
    style={{
      color: theme.text.secondary,
      ...style,
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = theme.bg.input;
      e.currentTarget.style.color = theme.text.main;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = 'transparent';
      e.currentTarget.style.color = theme.text.secondary;
    }}
  >
    {children}
  </button>
);
