import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

// Các variant của button
const buttonVariants = {
  primary: 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-blue-500',
  secondary: 'bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 border-gray-600',
  danger: 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white border-red-500',
  success: 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-green-500',
  ghost: 'bg-transparent hover:bg-white/10 text-gray-300 border-transparent hover:border-gray-600'
};

// Các size của button
const buttonSizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-6 py-2.5 text-base',
  lg: 'px-8 py-3 text-lg',
  xl: 'px-10 py-4 text-xl'
};

// Component Button với Glassmorphism effect
const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '',
  disabled = false,
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  onClick,
  type = 'button',
  ...props 
}) => {
  const baseClasses = cn(
    // Base styles
    'relative inline-flex items-center justify-center',
    'font-medium rounded-lg border',
    'backdrop-blur-xl bg-white/5',
    'transition-all duration-300 ease-out',
    'shadow-lg hover:shadow-xl',
    'focus:outline-none focus:ring-2 focus:ring-blue-500/50',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'overflow-hidden group',
    
    // Variant và size
    buttonVariants[variant],
    buttonSizes[size],
    className
  );

  // Animation variants
  const motionVariants = {
    rest: { scale: 1 },
    hover: { scale: 1.02 },
    tap: { scale: 0.98 }
  };

  return (
    <motion.button
      className={baseClasses}
      onClick={onClick}
      type={type}
      disabled={disabled || loading}
      variants={motionVariants}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      {...props}
    >
      {/* Background effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Loading spinner */}
      {loading && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </motion.div>
      )}
      
      {/* Content */}
      <div className="flex items-center gap-2 relative z-10">
        {/* Icon bên trái */}
        {Icon && iconPosition === 'left' && (
          <Icon className="w-4 h-4" />
        )}
        
        {/* Text */}
        <span className={loading ? 'opacity-0' : 'opacity-100'}>
          {children}
        </span>
        
        {/* Icon bên phải */}
        {Icon && iconPosition === 'right' && (
          <Icon className="w-4 h-4" />
        )}
      </div>
      
      {/* Glow effect on hover */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
    </motion.button>
  );
};

export default Button;
