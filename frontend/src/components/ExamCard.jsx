import React from 'react';
import { motion } from 'framer-motion';
import { ClockIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

const ExamCard = ({ exam, onStartExam }) => {
  const difficultyColors = {
    easy: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    hard: 'bg-red-100 text-red-800',
  };

  const difficulty = exam.difficulty || 'medium';

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition-shadow duration-300 border border-gray-100"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
            {exam.title}
          </h3>
          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
            <div className="flex items-center space-x-1">
              <DocumentTextIcon className="w-4 h-4" />
              <span>{exam.total_questions} questions</span>
            </div>
            <div className="flex items-center space-x-1">
              <ClockIcon className="w-4 h-4" />
              <span>{exam.duration || 30} min</span>
            </div>
          </div>
        </div>
        
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${difficultyColors[difficulty]}`}>
          {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
        </span>
      </div>

      <div className="space-y-3">
        {exam.description && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {exam.description}
          </p>
        )}
        
        <button
          onClick={() => onStartExam(exam)}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Start Exam
        </button>
      </div>
    </motion.div>
  );
};

export default ExamCard;