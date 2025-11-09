import React, { useState, useEffect } from 'react';
import { examAPI } from '../../api/axios';
import StatsCard from '../../components/StatsCard';
import { UsersIcon, BookOpenIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await examAPI.getDashboardStats();
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StatsCard
          title="Total Users"
          value={stats?.total_users ?? 0}
          icon={<UsersIcon className="w-8 h-8 text-blue-500" />}
        />
        <StatsCard
          title="Total Exams"
          value={stats?.total_exams ?? 0}
          icon={<BookOpenIcon className="w-8 h-8 text-green-500" />}
        />
        <StatsCard
          title="Total Submissions"
          value={stats?.total_submissions ?? 0}
          icon={<DocumentTextIcon className="w-8 h-8 text-purple-500" />}
        />
      </div>
    </div>
  );
};

export default AdminDashboard;
