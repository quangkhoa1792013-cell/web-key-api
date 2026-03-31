import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

// Các variant của spinner
const spinnerVariants = {
  default: 'border-blue-500',
  white: 'border-white',
  success: 'border-green-500',
  danger: 'border-red-500',
  warning: 'border-yellow-500'
};

// Các size của spinner
const spinnerSizes = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
};

// Component Spinner với animation
const Spinner = ({ 
  variant = 'default',
  size = 'md',
  className = '',
  label = '',
  centered = false,
  ...props 
}) => {
  const baseClasses = cn(
    'animate-spin rounded-full border-2 border-t-transparent',
    spinnerVariants[variant],
    spinnerSizes[size],
    className
  );

  const containerClasses = cn(
    'flex items-center gap-3',
    centered && 'justify-center',
    label && 'w-full'
  );

  // Animation cho container
  const containerVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: {
        duration: 0.3
      }
    }
  };

  // Animation cho label
  const labelVariants = {
    initial: { opacity: 0, x: -10 },
    animate: { 
      opacity: 1, 
      x: 0,
      transition: {
        delay: 0.1,
        duration: 0.3
      }
    }
  };

  return (
    <motion.div
      className={containerClasses}
      variants={containerVariants}
      initial="initial"
      animate="animate"
      {...props}
    >
      {/* Spinner chính */}
      <div className="relative">
        <div className={baseClasses} />
        
        {/* Inner glow effect */}
        <div className={cn(
          'absolute inset-0 rounded-full border-2 border-t-transparent',
          'bg-gradient-to-r from-blue-500/20 to-purple-500/20',
          'blur-sm'
        )} />
      </div>
      
      {/* Label text */}
      {label && (
        <motion.span
          className="text-sm text-gray-400 font-medium"
          variants={labelVariants}
          initial="initial"
          animate="animate"
        >
          {label}
        </motion.span>
      )}
    </motion.div>
  );
};

// Pulse Spinner variant
export const PulseSpinner = ({ size = 'md', className = '', ...props }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  };

  return (
    <div className={cn('flex justify-center', className)} {...props}>
      <div className={cn('relative', sizeClasses[size])}>
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className={cn(
              'absolute inset-0 rounded-full border-2 border-blue-500',
              'bg-gradient-to-r from-blue-500/20 to-purple-500/20'
            )}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ 
              scale: [1, 1.5, 1],
              opacity: [0.8, 0, 0.8]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: index * 0.2,
              ease: 'easeInOut'
            }}
          />
        ))}
      </div>
    </div>
  );
};

// Dots Spinner variant
export const DotsSpinner = ({ className = '', ...props }) => {
  return (
    <div className={cn('flex gap-2', className)} {...props}>
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
          animate={{
            y: [0, -10, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: index * 0.1,
            ease: 'easeInOut'
          }}
        />
      ))}
    </div>
  );
};

export default Spinner;
