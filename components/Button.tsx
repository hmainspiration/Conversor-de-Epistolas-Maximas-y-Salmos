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
  const baseStyles = "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed text-sm";
  
  const variants = {
    primary: "bg-white text-slate-900 hover:bg-slate-200 focus:ring-white",
    secondary: "bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 focus:ring-slate-700",
    ghost: "bg-transparent hover:bg-slate-900 text-slate-500 hover:text-slate-200",
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