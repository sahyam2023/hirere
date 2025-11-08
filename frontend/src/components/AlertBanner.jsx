import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExclamationTriangleIcon as ExclamationIcon, XMarkIcon as XMarkIcon } from '@heroicons/react/24/outline';

const AlertBanner = ({ type = 'warning', message, autoClose = true, duration = 5000 }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoClose, duration]);

  const alertStyles = {
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  const iconColors = {
    warning: 'text-amber-500',
    error: 'text-red-500',
    success: 'text-green-500',
    info: 'text-blue-500'
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={`
            fixed top-16 left-0 right-0 z-40 border-2 p-4
            ${alertStyles[type]}
          `}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ExclamationIcon className={`w-6 h-6 ${iconColors[type]}`} />
              <p className="font-medium">{message}</p>
            </div>
            
            <button
              onClick={() => setIsVisible(false)}
              className="p-1 hover:bg-black/5 rounded-lg transition-colors duration-200"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AlertBanner;