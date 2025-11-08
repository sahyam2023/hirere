import React from 'react';
import { motion } from 'framer-motion';

const Loader = ({ fullScreen = true }) => {
  const containerClass = fullScreen 
    ? "fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center"
    : "flex items-center justify-center py-8";

  return (
    <div className={containerClass}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full"
      />
      <span className="ml-3 text-gray-700 font-medium">Loading...</span>
    </div>
  );
};

export default Loader;