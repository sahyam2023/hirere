import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import QuestionCard from '../components/QuestionCard';
import CameraFeed from '../components/CameraFeed';
import AlertBanner from '../components/AlertBanner';
import { examAPI, proctorAPI } from '../api/axios';
import { ClockIcon, ExclamationTriangleIcon as ExclamationIcon } from '@heroicons/react/24/outline';

const Exam = () => {
  const { examId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [examData, setExamData] = useState(location.state?.exam || null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes in seconds
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('warning');
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const proctorIntervalRef = useRef(null);

  // Dummy questions for demo
  const dummyQuestions = [
    {
      id: 1,
      question_text: "Which of the following is a mutable data type in Python?",
      options: ["String", "Tuple", "List", "Integer"],
      correct_answer: 2
    },
    {
      id: 2,
      question_text: "What is the default port number for HTTP?",
      options: ["21", "80", "443", "8080"],
      correct_answer: 1
    },
    {
      id: 3,
      question_text: "Which protocol is used for secure web communication?",
      options: ["HTTP", "FTP", "HTTPS", "SMTP"],
      correct_answer: 2
    }
  ];

  useEffect(() => {
    if (!examData) {
      fetchExamData();
    } else {
      startProctoring();
    }

    return () => {
      if (proctorIntervalRef.current) {
        clearInterval(proctorIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      handleSubmitExam();
    }
  }, [timeLeft]);

  const fetchExamData = async () => {
    try {
      const response = await examAPI.getExam(examId);
      setExamData(response.data);
    } catch (error) {
      // Use dummy data for demo
      setExamData({
        id: parseInt(examId),
        title: "Python Basics",
        questions: dummyQuestions,
        duration: 30
      });
    } finally {
      startProctoring();
    }
  };

  const startProctoring = () => {
    // Simulate proctoring alerts
    proctorIntervalRef.current = setInterval(() => {
      const random = Math.random();
      if (random < 0.1) { // 10% chance of alert
        const alerts = [
          { type: 'warning', message: 'Multiple faces detected. Please ensure you are alone.' },
          { type: 'error', message: 'Face not detected. Please stay in view of the camera.' },
          { type: 'warning', message: 'Face verification failed. Please look at the camera.' }
        ];
        const alert = alerts[Math.floor(Math.random() * alerts.length)];
        setAlertType(alert.type);
        setAlertMessage(alert.message);
        setShowAlert(true);
        
        setTimeout(() => setShowAlert(false), 5000);
      }
    }, 20000); // Check every 20 seconds
  };

  const handleAnswerSelect = (answerIndex) => {
    setAnswers({
      ...answers,
      [currentQuestion]: answerIndex
    });
  };

  const goToNext = () => {
    if (currentQuestion < (examData?.questions?.length || dummyQuestions.length) - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const goToPrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmitExam = async () => {
    try {
      await examAPI.submitExam(examId, answers);
      navigate('/results', { 
        state: { 
          examTitle: examData?.title,
          score: calculateScore(),
          totalQuestions: examData?.questions?.length || dummyQuestions.length
        } 
      });
    } catch (error) {
      // Simulate successful submission
      navigate('/results', { 
        state: { 
          examTitle: examData?.title || "Python Basics",
          score: calculateScore(),
          totalQuestions: examData?.questions?.length || dummyQuestions.length
        } 
      });
    }
  };

  const calculateScore = () => {
    const questions = examData?.questions || dummyQuestions;
    let correct = 0;
    questions.forEach((question, index) => {
      if (answers[index] === question.correct_answer) {
        correct++;
      }
    });
    return correct;
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const questions = examData?.questions || dummyQuestions;
  const currentQuestionData = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {showAlert && (
        <AlertBanner 
          type={alertType} 
          message={alertMessage}
          onClose={() => setShowAlert(false)}
        />
      )}

      <div className="flex h-screen">
        {/* Main content - Questions */}
        <div className="flex-1 flex flex-col p-6 overflow-y-auto">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{examData?.title || "Python Basics"}</h1>
                <p className="text-gray-600">Question {currentQuestion + 1} of {questions.length}</p>
              </div>
              
              {/* Progress bar */}
              <div className="flex-1 max-w-md mx-8">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Question */}
          <div className="flex-1 mb-6">
            <QuestionCard
              question={currentQuestionData}
              questionNumber={currentQuestion + 1}
              totalQuestions={questions.length}
              selectedAnswer={answers[currentQuestion]}
              onAnswerSelect={handleAnswerSelect}
            />
          </div>

          {/* Navigation */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex justify-between items-center">
              <button
                onClick={goToPrevious}
                disabled={currentQuestion === 0}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  {Object.keys(answers).length} of {questions.length} answered
                </p>
              </div>

              {currentQuestion === questions.length - 1 ? (
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl transition-all duration-200 transform hover:scale-105"
                >
                  Submit Exam
                </button>
              ) : (
                <button
                  onClick={goToNext}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl transition-all duration-200 transform hover:scale-105"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - Timer & Camera */}
        <div className="w-80 bg-white border-l border-gray-200 p-6 space-y-6">
          {/* Timer */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 text-center">
            <div className="flex items-center justify-center mb-3">
              <ClockIcon className="w-6 h-6 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-800">Time Remaining</span>
            </div>
            <div className={`text-3xl font-bold ${timeLeft < 300 ? 'text-red-600' : 'text-blue-600'}`}>
              {formatTime(timeLeft)}
            </div>
            {timeLeft < 300 && (
              <p className="text-sm text-red-600 mt-2">⚠️ Less than 5 minutes left!</p>
            )}
          </div>

          {/* Camera */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-gray-700">Proctoring Active</span>
            </div>
            
            <CameraFeed 
              width={300} 
              height={225} 
              className="w-full"
            />
            
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-start space-x-2">
                <ExclamationIcon className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-gray-800">Proctoring Guidelines:</p>
                  <ul className="text-xs text-gray-600 mt-1 space-y-1">
                    <li>• Stay in camera view</li>
                    <li>• No external assistance</li>
                    <li>• Keep your workspace clear</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 max-w-md w-full"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">Submit Exam?</h3>
            <p className="text-gray-600 mb-6">
              You have answered {Object.keys(answers).length} out of {questions.length} questions. 
              Once submitted, you cannot make changes.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200"
              >
                Continue Exam
              </button>
              <button
                onClick={handleSubmitExam}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl transition-all duration-200"
              >
                Submit Now
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Exam;