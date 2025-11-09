import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import ExamCard from '../components/ExamCard';
import { examAPI } from '../api/axios';
import { UserIcon, ClipboardDocumentListIcon, CameraIcon } from '@heroicons/react/24/outline';

const Dashboard = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Dummy data for demo
  const dummyExams = [
    { 
      id: 1, 
      title: "Python Basics", 
      total_questions: 10,
      duration: 30,
      difficulty: 'easy',
      description: "Test your knowledge of Python fundamentals including variables, functions, and basic data structures."
    },
    { 
      id: 2, 
      title: "Network Fundamentals", 
      total_questions: 8,
      duration: 25,
      difficulty: 'medium',
      description: "Assess your understanding of networking concepts, protocols, and network security principles."
    },
    { 
      id: 3, 
      title: "Cybersecurity Concepts", 
      total_questions: 12,
      duration: 45,
      difficulty: 'hard',
      description: "Challenge yourself with advanced cybersecurity topics including threat analysis and security frameworks."
    }
  ];

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const response = await examAPI.getExams();
      setExams(response.data);
    } catch (error) {
      // Use dummy data if API fails
      setExams(dummyExams);
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = (exam) => {
    navigate(`/exam/${exam.id}`, { state: { exam } });
  };

  const handleFaceRegister = () => {
    navigate('/face-register');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.1,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {user?.name}! 👋
            </h1>
            <p className="text-gray-600">
              Ready to take your next exam? Choose from the available assessments below.
            </p>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          >
            <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-50 rounded-xl">
                  <ClipboardDocumentListIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Available Exams</p>
                  <p className="text-2xl font-bold text-gray-900">{exams.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-green-50 rounded-xl">
                  <UserIcon className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Profile Status</p>
                  <p className="text-sm font-semibold text-green-600">Active</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-3 rounded-xl ${user?.is_face_registered ? 'bg-green-50' : 'bg-amber-50'}`}>
                    <CameraIcon className={`w-6 h-6 ${user?.is_face_registered ? 'text-green-600' : 'text-amber-600'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Face Verification</p>
                    <p className={`text-sm font-semibold ${user?.is_face_registered ? 'text-green-600' : 'text-amber-600'}`}>
                      {user?.is_face_registered ? 'Completed' : 'Setup Required'}
                    </p>
                  </div>
                </div>
                {!user?.is_face_registered && (
                  <button
                    onClick={handleFaceRegister}
                    className="text-xs bg-amber-100 text-amber-800 px-3 py-1 rounded-full hover:bg-amber-200 transition-colors duration-200"
                  >
                    Setup Now
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Exams Grid */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            <motion.div variants={itemVariants}>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Exams</h2>
            </motion.div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading exams...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {exams.map((exam, index) => (
                  <motion.div key={exam.id} variants={itemVariants}>
                    <ExamCard exam={exam} onStartExam={handleStartExam} />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {exams.length === 0 && !loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <ClipboardDocumentListIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No exams available</h3>
              <p className="text-gray-500">Check back later for new assessments.</p>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;