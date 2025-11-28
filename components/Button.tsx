import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  icon, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed text-sm";
  
  const variants = {
    primary: "bg-white text-black hover:bg-neutral-200 focus:ring-white",
    secondary: "bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 focus:ring-neutral-700",
    ghost: "bg-transparent hover:bg-neutral-900 text-neutral-500 hover:text-neutral-200",
    danger: "bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50 focus:ring-red-500"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`} 
      {...props}
    >
      {icon}
      {children}
    </button>
  );
};