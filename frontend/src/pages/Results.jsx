import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import { CheckCircleIcon, XCircleIcon, HomeIcon } from '@heroicons/react/24/outline';

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { examTitle, score, totalQuestions } = location.state || {};

  useEffect(() => {
    // Simple confetti effect
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);
      // Create confetti particles (simplified for demo)
      
    }, 250);

    return () => clearInterval(interval);
  }, []);

  const percentage = Math.round((score / totalQuestions) * 100);
  const passed = percentage >= 60;

  const getScoreColor = () => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    return 'text-red-600';
  };

  const getScoreMessage = () => {
    if (percentage >= 90) return 'Excellent work! 🎉';
    if (percentage >= 80) return 'Great job! 👏';
    if (percentage >= 60) return 'Well done! 👍';
    return 'Keep practicing! 💪';
  };

  if (!examTitle) {
    navigate('/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="bg-white rounded-3xl shadow-xl p-12 max-w-2xl mx-auto">
              {/* Success Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full mb-8"
              >
                <CheckCircleIcon className="w-12 h-12 text-white" />
              </motion.div>

              {/* Title */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mb-8"
              >
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Exam Completed Successfully!
                </h1>
                <p className="text-lg text-gray-600">
                  {examTitle}
                </p>
              </motion.div>

              {/* Score Display */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 }}
                className="mb-8"
              >
                <div className="bg-gray-50 rounded-2xl p-8 mb-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600 mb-2">Your Score</p>
                    <div className={`text-6xl font-bold mb-2 ${getScoreColor()}`}>
                      {score}/{totalQuestions}
                    </div>
                    <div className={`text-2xl font-semibold mb-4 ${getScoreColor()}`}>
                      {percentage}%
                    </div>
                    <p className="text-lg text-gray-700 font-medium">
                      {getScoreMessage()}
                    </p>
                  </div>
                </div>

                {/* Pass/Fail Status */}
                <div className={`inline-flex items-center space-x-2 px-6 py-3 rounded-full ${
                  passed 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {passed ? (
                    <CheckCircleIcon className="w-5 h-5" />
                  ) : (
                    <XCircleIcon className="w-5 h-5" />
                  )}
                  <span className="font-semibold">
                    {passed ? 'Passed' : 'Not Passed'}
                  </span>
                </div>
              </motion.div>

              {/* Additional Info */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
              >
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-sm font-medium text-blue-800">Correct Answers</p>
                  <p className="text-2xl font-bold text-blue-600">{score}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm font-medium text-gray-800">Total Questions</p>
                  <p className="text-2xl font-bold text-gray-600">{totalQuestions}</p>
                </div>
              </motion.div>

              {/* Actions */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1 }}
                className="space-y-4"
              >
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <HomeIcon className="w-5 h-5 inline mr-2" />
                  Back to Dashboard
                </button>

                <p className="text-sm text-gray-500">
                  Your results have been saved and can be accessed from your dashboard.
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Results;