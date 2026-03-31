import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

// Các variant của GlassCard
const cardVariants = {
  default: 'bg-white/5 backdrop-blur-xl border-white/10',
  dark: 'bg-black/20 backdrop-blur-2xl border-white/5',
  light: 'bg-white/10 backdrop-blur-lg border-white/20',
  gradient: 'bg-gradient-to-br from-white/10 to-transparent backdrop-blur-xl border-white/15'
};

// Component GlassCard với hiệu ứng Glassmorphism
const GlassCard = ({ 
  children, 
  variant = 'default',
  className = '',
  hover = true,
  glow = false,
  padding = 'p-6',
  rounded = 'rounded-xl',
  shadow = 'shadow-2xl',
  ...props 
}) => {
  const baseClasses = cn(
    // Base glassmorphism styles
    cardVariants[variant],
    padding,
    rounded,
    shadow,
    'relative overflow-hidden',
    'transition-all duration-300 ease-out',
    
    // Hover effects
    hover && 'hover:bg-white/10 hover:border-white/20 hover:shadow-3xl hover:-translate-y-1',
    
    // Glow effect
    glow && 'shadow-[0_0_40px_rgba(59,130,246,0.15)]',
    
    className
  );

  // Animation variants
  const motionVariants = {
    initial: { 
      opacity: 0, 
      y: 20,
      scale: 0.95
    },
    animate: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: [0.23, 1, 0.32, 1]
      }
    },
    hover: hover ? {
      y: -4,
      transition: {
        duration: 0.2,
        ease: 'easeOut'
      }
    } : {}
  };

  return (
    <motion.div
      className={baseClasses}
      variants={motionVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      {...props}
    >
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />
      
      {/* Top highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      
      {/* Subtle animated background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 animate-pulse" />
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* Border glow effect */}
      <div className="absolute inset-0 rounded-xl border border-white/10 opacity-0 hover:opacity-100 transition-opacity duration-300">
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400/20 to-purple-400/20 animate-pulse" />
      </div>
    </motion.div>
  );
};

export default GlassCard;
