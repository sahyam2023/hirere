import React, { useState, useEffect } from 'react';
import { examAPI } from '../../api/axios';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

const QuestionBank = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const response = await examAPI.getQuestions();
      setQuestions(response.data);
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (question = null) => {
    setCurrentQuestion(question);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setCurrentQuestion(null);
    setIsModalOpen(false);
  };

  const handleSave = async (questionData) => {
    try {
      if (currentQuestion) {
        await examAPI.updateQuestion(currentQuestion.id, questionData);
        toast.success('Question updated successfully');
      } else {
        await examAPI.createQuestion(questionData);
        toast.success('Question created successfully');
      }
      fetchQuestions();
      closeModal();
    } catch (error) {
      console.error('Failed to save question:', error);
    }
  };

  const handleDelete = async (questionId) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        await examAPI.deleteQuestion(questionId);
        toast.success('Question deleted successfully');
        fetchQuestions();
      } catch (error) {
        console.error('Failed to delete question:', error);
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Question Bank</h1>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Create Question
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="bg-white shadow-md rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Text</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marks</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {questions.map((q) => (
                <tr key={q.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{q.text}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{q.marks}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => openModal(q)} className="text-indigo-600 hover:text-indigo-900">
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDelete(q.id)} className="text-red-600 hover:text-red-900 ml-4">
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <QuestionModal
          question={currentQuestion}
          onClose={closeModal}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

const QuestionModal = ({ question, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    text: question?.text || '',
    options: question?.options || {},
    correct_option: question?.correct_option || '',
    marks: question?.marks || 0,
    exam_id: question?.exam_id || 1, // Default exam_id
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOptionChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      options: { ...prev.options, [key]: value },
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-6">{question ? 'Edit Question' : 'Create Question'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Question Text</label>
            <textarea
              name="text"
              value={formData.text}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              rows="3"
              required
            ></textarea>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Options</label>
            {['A', 'B', 'C', 'D'].map(key => (
              <div key={key} className="flex items-center mt-2">
                <span className="mr-2">{key}:</span>
                <input
                  type="text"
                  value={formData.options[key] || ''}
                  onChange={(e) => handleOptionChange(key, e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>
            ))}
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Correct Option</label>
            <select
              name="correct_option"
              value={formData.correct_option}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            >
              <option value="">Select an option</option>
              {Object.keys(formData.options).map(key => (
                <option key={key} value={key}>{key}</option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Marks</label>
            <input
              type="number"
              name="marks"
              value={formData.marks}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
            />
          </div>
          <div className="flex justify-end gap-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuestionBank;
