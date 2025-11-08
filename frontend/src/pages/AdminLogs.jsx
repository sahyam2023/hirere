import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import StatsCard from '../components/StatsCard';
import { proctorAPI, examAPI } from '../api/axios';
import { 
  Bars3Icon, 
  EyeIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  UserIcon 
} from '@heroicons/react/24/outline';

const AdminLogs = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState('');
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(false);
  const [exams, setExams] = useState([]);

  // Dummy data for demo
  const dummyExams = [
    { id: 1, title: "Python Basics" },
    { id: 2, title: "Network Fundamentals" },
    { id: 3, title: "Cybersecurity Concepts" }
  ];

  const dummyLogs = [
    {
      id: 1,
      user: "john.doe@example.com",
      event_type: "face_match",
      timestamp: "2024-01-15 10:45:32",
      image: "https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1"
    },
    {
      id: 2,
      user: "jane.smith@example.com", 
      event_type: "mismatch",
      timestamp: "2024-01-15 11:20:15",
      image: "https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1"
    },
    {
      id: 3,
      user: "alex.johnson@example.com",
      event_type: "multi_face",
      timestamp: "2024-01-15 14:30:45",
      image: "https://images.pexels.com/photos/1181424/pexels-photo-1181424.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1"
    },
    {
      id: 4,
      user: "sarah.wilson@example.com",
      event_type: "no_face",
      timestamp: "2024-01-15 15:15:20",
      image: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1"
    }
  ];

  const dummySummary = {
    face_match: 45,
    mismatch: 8,
    multi_face: 3,
    no_face: 2
  };

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    if (selectedExam) {
      fetchLogs();
      fetchSummary();
    }
  }, [selectedExam]);

  const fetchExams = async () => {
    try {
      const response = await examAPI.getExams();
      setExams(response.data);
    } catch (error) {
      setExams(dummyExams);
    }
  };

  const fetchLogs = async () => {
    if (!selectedExam) return;
    
    setLoading(true);
    try {
      const response = await proctorAPI.getLogs(selectedExam);
      setLogs(response.data);
    } catch (error) {
      setLogs(dummyLogs);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    if (!selectedExam) return;
    
    try {
      const response = await proctorAPI.getSummary(selectedExam);
      setSummary(response.data);
    } catch (error) {
      setSummary(dummySummary);
    }
  };

  const getEventBadge = (eventType) => {
    const badges = {
      face_match: { bg: 'bg-green-100', text: 'text-green-800', label: 'Face Match ✅' },
      mismatch: { bg: 'bg-red-100', text: 'text-red-800', label: 'Mismatch ❌' },
      multi_face: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Multi-Face ⚠️' },
      no_face: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'No Face 😶' }
    };

    const badge = badges[eventType] || badges.face_match;
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Proctoring Logs</h1>
              <p className="text-gray-600">Monitor and analyze proctoring activities across exams</p>
            </motion.div>

            {/* Exam Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white rounded-2xl shadow-md p-6 mb-8"
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Exam
              </label>
              <select
                value={selectedExam}
                onChange={(e) => setSelectedExam(e.target.value)}
                className="w-full md:w-auto px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose an exam...</option>
                {exams.map(exam => (
                  <option key={exam.id} value={exam.id}>
                    {exam.title}
                  </option>
                ))}
              </select>
            </motion.div>

            {selectedExam && (
              <>
                {/* Summary Stats */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
                >
                  <StatsCard
                    title="Face Match"
                    value={summary.face_match || 0}
                    icon={CheckCircleIcon}
                    color="green"
                  />
                  <StatsCard
                    title="Mismatch"
                    value={summary.mismatch || 0}
                    icon={ExclamationTriangleIcon}
                    color="red"
                  />
                  <StatsCard
                    title="Multi-Face"
                    value={summary.multi_face || 0}
                    icon={UserIcon}
                    color="yellow"
                  />
                  <StatsCard
                    title="No Face"
                    value={summary.no_face || 0}
                    icon={EyeIcon}
                    color="gray"
                  />
                </motion.div>

                {/* Logs Table */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="bg-white rounded-2xl shadow-md overflow-hidden"
                >
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900">Activity Logs</h2>
                  </div>

                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-3 text-gray-600">Loading logs...</span>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="text-left py-4 px-6 font-semibold text-gray-700">Timestamp</th>
                            <th className="text-left py-4 px-6 font-semibold text-gray-700">User</th>
                            <th className="text-left py-4 px-6 font-semibold text-gray-700">Event</th>
                            <th className="text-left py-4 px-6 font-semibold text-gray-700">Snapshot</th>
                          </tr>
                        </thead>
                        <tbody>
                          {logs.map((log, index) => (
                            <motion.tr
                              key={log.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.1 }}
                              className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                                index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                              }`}
                            >
                              <td className="py-4 px-6 text-gray-600 font-mono text-sm">
                                {formatTimestamp(log.timestamp)}
                              </td>
                              <td className="py-4 px-6 text-gray-900 font-medium">
                                {log.user}
                              </td>
                              <td className="py-4 px-6">
                                {getEventBadge(log.event_type)}
                              </td>
                              <td className="py-4 px-6">
                                <img
                                  src={log.image}
                                  alt="Snapshot"
                                  className="w-12 h-12 rounded-lg object-cover cursor-pointer hover:scale-110 transition-transform duration-200"
                                  onClick={() => window.open(log.image, '_blank')}
                                />
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>

                      {logs.length === 0 && (
                        <div className="text-center py-12">
                          <EyeIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No logs found</h3>
                          <p className="text-gray-500">No proctoring activities recorded for this exam yet.</p>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              </>
            )}

            {!selectedExam && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-center py-12"
              >
                <EyeIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Exam</h3>
                <p className="text-gray-500">Choose an exam from the dropdown above to view proctoring logs.</p>
              </motion.div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLogs;