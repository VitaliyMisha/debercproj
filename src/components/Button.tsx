import React from 'react';

interface ButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  className?: string;
  type?: 'button' | 'submit';
  fullWidth?: boolean;
}

const variantClasses: Record<string, string> = {
  primary: 'bg-primary hover:bg-primary-dark text-white shadow-lg',
  secondary: 'bg-card-bg border border-white/10 text-white hover:bg-white/10',
  danger: 'bg-transparent border border-score-neg/50 text-score-neg hover:bg-score-neg/10',
  ghost: 'bg-transparent text-muted hover:text-white hover:bg-white/5',
};

export const Button: React.FC<ButtonProps> = ({
  onClick,
  disabled,
  children,
  variant = 'primary',
  className = '',
  type = 'button',
  fullWidth = false,
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`
      relative overflow-hidden font-sans font-semibold py-3 px-6 rounded-xl
      transition-all duration-200 active:scale-[0.97]
      disabled:opacity-50 disabled:cursor-not-allowed
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-to/60
      ${variantClasses[variant]}
      ${fullWidth ? 'w-full' : ''}
      ${className}
    `}
  >
    {children}
  </button>
);

export default Button;
