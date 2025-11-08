import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import StatsCard from '../components/StatsCard';
import { examAPI } from '../api/axios';
import { 
  ClipboardDocumentListIcon, 
  UsersIcon, 
  EyeIcon,
  PlusIcon,
  XMarkIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [examTitle, setExamTitle] = useState('');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exams, setExams] = useState([]);

  // Dummy stats for demo
  const stats = {
    totalExams: 5,
    totalStudents: 142,
    activeExams: 3,
    completedToday: 28
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const response = await examAPI.getExams();
      setExams(response.data);
    } catch (error) {
      // Use dummy data
      setExams([
        { id: 1, title: "Python Basics", total_questions: 10, created_at: "2024-01-15" },
        { id: 2, title: "Network Fundamentals", total_questions: 8, created_at: "2024-01-14" },
        { id: 3, title: "Cybersecurity Concepts", total_questions: 12, created_at: "2024-01-13" },
      ]);
    }
  };

  const addQuestion = () => {
    const newQuestion = {
      id: Date.now(),
      question_text: '',
      options: ['', '', '', ''],
      correct_answer: 0
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (questionId) => {
    setQuestions(questions.filter(q => q.id !== questionId));
  };

  const updateQuestion = (questionId, field, value) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { ...q, [field]: value }
        : q
    ));
  };

  const updateOption = (questionId, optionIndex, value) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { 
            ...q, 
            options: q.options.map((opt, idx) => idx === optionIndex ? value : opt)
          }
        : q
    ));
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    if (!examTitle.trim() || questions.length === 0) {
      toast.error('Please add exam title and at least one question');
      return;
    }

    setLoading(true);
    try {
      const examData = {
        title: examTitle,
        questions: questions
      };
      
      await examAPI.createExam(examData);
      toast.success('Exam created successfully');
      
      // Reset form
      setExamTitle('');
      setQuestions([]);
      fetchExams();
    } catch (error) {
      // Simulate success for demo
      toast.success('Exam created successfully');
      setExamTitle('');
      setQuestions([]);
      
      // Add to local state for demo
      const newExam = {
        id: Date.now(),
        title: examTitle,
        total_questions: questions.length,
        created_at: new Date().toISOString().split('T')[0]
      };
      setExams([newExam, ...exams]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="flex pt-16">
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
        />
        
        <main className="flex-1 lg:ml-64">
          {/* Mobile menu button */}
          <div className="lg:hidden p-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
            >
              <Bars3Icon className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8"
            >
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
              <p className="text-gray-600">Manage exams and monitor proctoring activities</p>
            </motion.div>

            {/* Stats Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
            >
              <StatsCard
                title="Total Exams"
                value={stats.totalExams}
                icon={ClipboardDocumentListIcon}
                color="blue"
              />
              <StatsCard
                title="Total Students"
                value={stats.totalStudents}
                icon={UsersIcon}
                color="green"
              />
              <StatsCard
                title="Active Exams"
                value={stats.activeExams}
                icon={EyeIcon}
                color="yellow"
              />
              <StatsCard
                title="Completed Today"
                value={stats.completedToday}
                icon={ClipboardDocumentListIcon}
                color="gray"
                trend={12}
              />
            </motion.div>

            {/* Create Exam Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-white rounded-2xl shadow-md p-8 mb-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Exam</h2>
              
              <form onSubmit={handleCreateExam} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Exam Title
                  </label>
                  <input
                    type="text"
                    value={examTitle}
                    onChange={(e) => setExamTitle(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter exam title..."
                  />
                </div>

                {/* Questions */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Questions ({questions.length})
                    </label>
                    <button
                      type="button"
                      onClick={addQuestion}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
                    >
                      <PlusIcon className="w-4 h-4" />
                      <span>Add Question</span>
                    </button>
                  </div>

                  <div className="space-y-6">
                    {questions.map((question, qIndex) => (
                      <motion.div
                        key={question.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gray-50 rounded-xl p-6 relative"
                      >
                        <button
                          type="button"
                          onClick={() => removeQuestion(question.id)}
                          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <XMarkIcon className="w-5 h-5" />
                        </button>

                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Question {qIndex + 1}
                          </label>
                          <textarea
                            value={question.question_text}
                            onChange={(e) => updateQuestion(question.id, 'question_text', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            rows="2"
                            placeholder="Enter question text..."
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {question.options.map((option, optIndex) => (
                            <div key={optIndex} className="flex items-center space-x-3">
                              <input
                                type="radio"
                                name={`correct-${question.id}`}
                                checked={question.correct_answer === optIndex}
                                onChange={() => updateQuestion(question.id, 'correct_answer', optIndex)}
                                className="text-blue-600 focus:ring-blue-500"
                              />
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => updateOption(question.id, optIndex, e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                              />
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating Exam...' : 'Create Exam'}
                </button>
              </form>
            </motion.div>

            {/* Existing Exams */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="bg-white rounded-2xl shadow-md p-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Existing Exams</h2>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">Title</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">Questions</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">Created</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exams.map((exam) => (
                      <tr key={exam.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4 font-medium text-gray-900">{exam.title}</td>
                        <td className="py-4 px-4 text-gray-600">{exam.total_questions}</td>
                        <td className="py-4 px-4 text-gray-600">{exam.created_at}</td>
                        <td className="py-4 px-4">
                          <button className="text-blue-600 hover:text-blue-800 transition-colors font-medium">
                            View Logs
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;