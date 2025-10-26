import { useState, useEffect } from 'react';
import { User, Mail, Calendar, Shield, Edit, History } from 'lucide-react';
import { authAPI, analysisAPI } from '../services/api';

const UserDashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analyses, setAnalyses] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await authAPI.getCurrentUser();
        setUser(userData);
      } catch (err) {
        setError('Failed to load user data');
        console.error('Error fetching user data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const fetchAnalysisHistory = async () => {
    try {
      const history = await analysisAPI.getAll();
      setAnalyses(history);
      setShowHistory(true);
    } catch (err) {
      setError('Failed to load analysis history');
      console.error('Error fetching analysis history:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p>Loading user dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4">Error: {error}</div>
          <button
            onClick={() => window.location.reload()}
            className="bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg hover:bg-yellow-300"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <p>No user data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <User className="w-8 h-8 text-yellow-400 mr-3" />
            <h1 className="text-3xl font-bold">User Dashboard</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Profile Card */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold">Profile Information</h2>
                <button className="flex items-center text-yellow-400 hover:text-yellow-300">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex items-center">
                  <User className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-400">Full Name</p>
                    <p className="text-lg font-medium">{user.full_name}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Mail className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-400">Email Address</p>
                    <p className="text-lg font-medium">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Shield className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-400">Account Status</p>
                    <p className="text-lg font-medium">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-400">Member Since</p>
                    <p className="text-lg font-medium">
                      {new Date(user.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <h3 className="text-lg font-semibold mb-4">Account Overview</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Last Login</span>
                  <span className="font-medium">Today</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={fetchAnalysisHistory}
                  className="w-full bg-yellow-400 text-gray-900 py-2 px-4 rounded-lg hover:bg-yellow-300 transition-colors flex items-center justify-center"
                >
                  <History className="w-4 h-4 mr-2" />
                  View Analysis History
                </button>
                <button className="w-full bg-gray-700 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors">
                  Account Settings
                </button>
                <button className="w-full bg-gray-700 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors">
                  Support
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Analysis History Section */}
        {showHistory && (
          <div className="mt-8">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold">Analysis History</h2>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-gray-400 hover:text-white"
                >
                  Close
                </button>
              </div>

              {analyses.length === 0 ? (
                <p className="text-gray-400">No analysis history found.</p>
              ) : (
                <div className="space-y-4">
                  {analyses.map((analysis) => (
                    <div key={analysis.id} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium">{analysis.name}</h3>
                          <p className="text-gray-400">{analysis.location}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(analysis.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="text-sm text-yellow-400 capitalize">
                          {analysis.analysis_type}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
