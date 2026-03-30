import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AdminPanel() {
  const { api } = useAuth();
  const [tab, setTab] = useState('dashboard'); // dashboard | users | compose | history
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [email, setEmail] = useState({ subject: '', body: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (tab === 'dashboard') fetchStats();
    if (tab === 'users') fetchUsers();
    if (tab === 'history') fetchAnnouncements();
  }, [tab]);

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data);
    } catch { /* ignore */ }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users', { params: { search: search || undefined } });
      setUsers(res.data.users);
    } catch { /* ignore */ }
  };

  const fetchAnnouncements = async () => {
    try {
      const res = await api.get('/admin/announcements');
      setAnnouncements(res.data.announcements);
    } catch { /* ignore */ }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      fetchUsers();
      setMessage({ type: 'success', text: `User role updated to ${newRole}.` });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update role.' });
    }
  };

  const toggleSelectUser = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!email.subject || !email.body) {
      return setMessage({ type: 'error', text: 'Subject and body are required.' });
    }

    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const payload = { subject: email.subject, body: email.body };
      if (selectedUsers.length > 0) payload.userIds = selectedUsers;
      const res = await api.post('/admin/send-email', payload);
      setMessage({ type: 'success', text: res.data.message });
      setEmail({ subject: '', body: '' });
      setSelectedUsers([]);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to send email.' });
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'dashboard', label: '📊 Dashboard' },
    { id: 'users', label: '👥 Users' },
    { id: 'compose', label: '✉️ Compose' },
    { id: 'history', label: '📜 History' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">🛡️ Admin Panel</h1>
        <p className="text-gray-500 mt-1">Manage users and send announcements</p>
      </div>

      {message.text && (
        <div className={`px-4 py-3 rounded-lg mb-6 text-sm border ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-xl p-1 mb-8">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setMessage({ type: '', text: '' }); }}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              tab === t.id ? 'bg-white shadow text-teal-700' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {tab === 'dashboard' && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Users', value: stats.userCount, icon: '👥' },
            { label: 'Total Trips', value: stats.tripCount, icon: '🚗' },
            { label: 'Active Trips', value: stats.activeTrips, icon: '🟢' },
            { label: 'Announcements', value: stats.announcementCount, icon: '📧' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl shadow-md p-6 border border-gray-100 text-center">
              <span className="text-3xl block mb-2">{s.icon}</span>
              <p className="text-3xl font-bold text-gray-900">{s.value}</p>
              <p className="text-sm text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Users Tab */}
      {tab === 'users' && (
        <div>
          <div className="flex gap-3 mb-4">
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by email or username..."
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
            />
            <button onClick={fetchUsers} className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors cursor-pointer">
              Search
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Select</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Username</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Balance (₹)</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(u.id)}
                        onChange={() => toggleSelectUser(u.id)}
                        className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{u.username}</td>
                    <td className="px-4 py-3 text-gray-600 text-sm">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{u.creditBalance}</td>
                    <td className="px-4 py-3">
                      {u.role === 'user' ? (
                        <button
                          onClick={() => handleRoleChange(u.id, 'admin')}
                          className="text-purple-600 hover:text-purple-700 text-sm font-medium cursor-pointer"
                        >
                          Promote
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRoleChange(u.id, 'user')}
                          className="text-gray-500 hover:text-gray-700 text-sm font-medium cursor-pointer"
                        >
                          Demote
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="text-center py-8 text-gray-500">No users found.</div>
            )}
          </div>

          {selectedUsers.length > 0 && (
            <div className="mt-4 bg-teal-50 border border-teal-200 rounded-lg px-4 py-3 flex justify-between items-center">
              <span className="text-teal-700 text-sm font-medium">
                {selectedUsers.length} user(s) selected
              </span>
              <button
                onClick={() => { setTab('compose'); }}
                className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
              >
                Send Email to Selected →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Compose Tab */}
      {tab === 'compose' && (
        <div className="max-w-2xl">
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="mb-4">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                selectedUsers.length > 0
                  ? 'bg-teal-100 text-teal-700'
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {selectedUsers.length > 0
                  ? `📬 Sending to ${selectedUsers.length} selected user(s)`
                  : '📢 Broadcasting to ALL users'}
              </span>
            </div>

            <form onSubmit={handleSendEmail} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
                <input
                  type="text" value={email.subject} onChange={(e) => setEmail({ ...email, subject: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                  placeholder="e.g., 🎉 Weekend Special - Free Rides!"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
                <textarea
                  value={email.body} onChange={(e) => setEmail({ ...email, body: e.target.value })}
                  rows={8}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none resize-y"
                  placeholder="Write your announcement here..."
                />
              </div>
              <button
                type="submit" disabled={loading}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? 'Sending...' : `Send ${selectedUsers.length > 0 ? `to ${selectedUsers.length} User(s)` : 'to All Users'}`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* History Tab */}
      {tab === 'history' && (
        <div className="space-y-4">
          {announcements.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-8 text-center border border-gray-100">
              <span className="text-4xl block mb-3">📭</span>
              <p className="text-gray-500">No announcements sent yet.</p>
            </div>
          ) : (
            announcements.map(a => (
              <div key={a.id} className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-gray-900">{a.subject}</h3>
                  <span className="text-xs text-gray-400">
                    {new Date(a.createdAt).toLocaleDateString()} {new Date(a.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-gray-600 text-sm whitespace-pre-wrap mb-3">{a.body}</p>
                <div className="flex gap-3 text-xs text-gray-400">
                  <span>By: {a.sender?.username}</span>
                  <span>•</span>
                  <span>Sent to: {a.audience === 'all' ? 'All users' : `${a.userCount} user(s)`}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
