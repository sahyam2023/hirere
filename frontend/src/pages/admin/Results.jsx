import React, { useState, useEffect } from 'react';
import { examAPI } from '../../api/axios';
import { EyeIcon } from '@heroicons/react/24/outline';

const AdminResults = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const response = await examAPI.getAllSubmissions();
        setSubmissions(response.data);
      } catch (error) {
        console.error('Failed to fetch submissions:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">All Submissions</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="bg-white shadow-md rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {submissions.map((sub) => (
                <tr key={sub.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{sub.user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{sub.exam.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{sub.score}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{new Date(sub.submitted_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => setSelectedSubmission(sub)} className="text-indigo-600 hover:text-indigo-900">
                      <EyeIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {selectedSubmission && (
        <SubmissionDetailModal submission={selectedSubmission} onClose={() => setSelectedSubmission(null)} />
      )}
    </div>
  );
};

const SubmissionDetailModal = ({ submission, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-6">Submission Details</h2>
        <div className="space-y-4">
          <p><strong>Candidate:</strong> {submission.user.email}</p>
          <p><strong>Exam:</strong> {submission.exam.title}</p>
          <p><strong>Score:</strong> {submission.score}</p>
          <p><strong>Submitted At:</strong> {new Date(submission.submitted_at).toLocaleString()}</p>
          <div>
            <h3 className="font-bold mb-2">Answers:</h3>
            <pre className="bg-gray-100 p-4 rounded-lg">{JSON.stringify(submission.answers, null, 2)}</pre>
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg">Close</button>
        </div>
      </div>
    </div>
  );
};

export default AdminResults;
