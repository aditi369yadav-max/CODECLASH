// client/components/Button.tsx
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ children, className, ...props }) => {
  return (
    <button
      className={`px-4 py-2 rounded-lg font-semibold transition-colors duration-200
                  bg-orange-600 hover:bg-orange-700 text-white
                  focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50
                  ${className || ''}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;