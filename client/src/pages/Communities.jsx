import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Communities() {
  const { api } = useAuth();
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);

  const fetchCommunities = async () => {
    try {
      const res = await api.get('/communities');
      setCommunities(res.data.communities || []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCommunities(); }, [api]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setError('Community name is required.');
    setCreating(true);
    setError('');
    try {
      await api.post('/communities', { name: name.trim(), description: description.trim() || undefined });
      setShowCreate(false);
      setName('');
      setDescription('');
      fetchCommunities();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create community.');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinByCode = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return setJoinError('Please enter an invite code.');
    setJoinLoading(true);
    setJoinError('');
    try {
      await api.post('/communities/join', { inviteCode: joinCode.trim() });
      setJoinCode('');
      fetchCommunities();
    } catch (err) {
      setJoinError(err.response?.data?.error || 'Failed to join.');
    } finally {
      setJoinLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Communities</h1>
          <p className="text-gray-500 mt-1">Carpool with your groups</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors cursor-pointer"
        >
          + Create Community
        </button>
      </div>

      {/* Join by code */}
      <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100 mb-6">
        <form onSubmit={handleJoinByCode} className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Join with Invite Code</label>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none uppercase tracking-widest font-mono"
              placeholder="XXXXXX"
              maxLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={joinLoading}
            className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
          >
            {joinLoading ? 'Joining...' : 'Join'}
          </button>
        </form>
        {joinError && <p className="text-red-600 text-sm mt-2">{joinError}</p>}
      </div>

      {/* Create Dialog */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create Community</h2>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>
            )}
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                  placeholder="e.g., Serene County Carpool"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                  placeholder="Optional description for your community"
                  rows={3}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowCreate(false); setError(''); }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Community Cards */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        </div>
      ) : communities.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {communities.map(c => (
            <Link
              key={c.id}
              to={`/communities/${c.id}`}
              className="block bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-100 overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-gray-900 text-lg">{c.name}</h3>
                  {c.myRole === 'admin' && (
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-teal-100 text-teal-800">Admin</span>
                  )}
                </div>
                {c.description && (
                  <p className="text-gray-500 text-sm mb-3 line-clamp-2">{c.description}</p>
                )}
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>👥 {c.memberCount} member{c.memberCount !== 1 ? 's' : ''}</span>
                  <span className="text-teal-600 font-medium">View →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow p-8 text-center border border-gray-100">
          <span className="text-4xl block mb-3">👥</span>
          <p className="text-gray-500">You haven&apos;t joined any communities yet.</p>
          <p className="text-gray-400 text-sm mt-1">Create one or join using an invite code!</p>
        </div>
      )}
    </div>
  );
}
