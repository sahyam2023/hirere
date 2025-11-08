import React from 'react';
import { motion } from 'framer-motion';

const QuestionCard = ({ question, questionNumber, totalQuestions, selectedAnswer, onAnswerSelect }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition-shadow duration-300"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
          Question {questionNumber} of {totalQuestions}
        </span>
        <span className="text-sm text-gray-500">
          {selectedAnswer ? 'Answered' : 'Not answered'}
        </span>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-6 leading-relaxed">
        {question.question_text}
      </h3>

      <div className="space-y-3">
        {question.options.map((option, index) => (
          <label
            key={index}
            className={`
              flex items-center p-4 rounded-xl cursor-pointer transition-all duration-200 border-2
              ${selectedAnswer === index 
                ? 'bg-blue-50 border-blue-200 text-blue-900' 
                : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
              }
            `}
          >
            <input
              type="radio"
              name={`question-${question.id}`}
              value={index}
              checked={selectedAnswer === index}
              onChange={() => onAnswerSelect(index)}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span className="ml-3 text-gray-700 font-medium">
              {String.fromCharCode(65 + index)}. {option}
            </span>
          </label>
        ))}
      </div>
    </motion.div>
  );
};

export default QuestionCard;