import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TripCard from '../components/TripCard';

const APP_URL = 'https://community-carpool-app.azurewebsites.net';

export default function CommunityDetail() {
  const { id } = useParams();
  const { user, api } = useAuth();
  const [community, setCommunity] = useState(null);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const fetchData = async () => {
    try {
      const [commRes, tripsRes] = await Promise.allSettled([
        api.get(`/communities/${id}`),
        api.get(`/communities/${id}/trips`),
      ]);
      if (commRes.status === 'fulfilled') setCommunity(commRes.value.data.community);
      else setError('Failed to load community.');
      if (tripsRes.status === 'fulfilled') setTrips(tripsRes.value.data.trips || []);
    } catch {
      setError('Failed to load community.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id, api]);

  const inviteLink = community ? `${APP_URL}/join/${community.inviteCode}` : '';
  const whatsappUrl = community ? `https://wa.me/?text=${encodeURIComponent(`Join our carpool community "${community.name}": ${inviteLink}`)}` : '';

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerateCode = async () => {
    if (!confirm('This will invalidate the current invite link. Continue?')) return;
    setRegenerating(true);
    try {
      const res = await api.post(`/communities/${id}/regenerate-code`);
      setCommunity(prev => ({ ...prev, inviteCode: res.data.community.inviteCode }));
    } catch {
      alert('Failed to regenerate code.');
    } finally {
      setRegenerating(false);
    }
  };

  const handleToggleActive = async () => {
    try {
      const res = await api.patch(`/communities/${id}`, { isActive: !community.isActive });
      setCommunity(prev => ({ ...prev, isActive: res.data.community.isActive }));
    } catch {
      alert('Failed to update community.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (error || !community) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <span className="text-5xl block mb-4">❌</span>
        <p className="text-gray-500">{error || 'Community not found.'}</p>
        <Link to="/communities" className="text-teal-600 hover:text-teal-700 font-medium mt-4 inline-block">
          Back to Communities →
        </Link>
      </div>
    );
  }

  const isAdmin = community.myRole === 'admin';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{community.name}</h1>
              {!community.isActive && (
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-red-100 text-red-800">Inactive</span>
              )}
              {isAdmin && (
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-teal-100 text-teal-800">Admin</span>
              )}
            </div>
            {community.description && <p className="text-gray-500 mt-1">{community.description}</p>}
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
              <span>👥 {community.memberCount} members</span>
              <span>🚗 {community.tripCount} trips</span>
              <span>Created by {community.creator?.username}</span>
            </div>
          </div>
          <Link
            to="/communities"
            className="text-gray-400 hover:text-gray-600 text-sm"
          >
            ← Back
          </Link>
        </div>

        {/* Invite Link */}
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Invite Link</label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={inviteLink}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-sm font-mono"
            />
            <button
              onClick={copyInviteLink}
              className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 py-2.5 rounded-lg transition-colors cursor-pointer text-sm whitespace-nowrap"
            >
              {copied ? '✓ Copied!' : '📋 Copy'}
            </button>
          </div>
          <div className="flex gap-2 mt-3">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
            >
              💬 Share on WhatsApp
            </a>
            <span className="text-xs text-gray-400 self-center ml-2">Code: <span className="font-mono font-bold text-gray-600">{community.inviteCode}</span></span>
          </div>
        </div>

        {/* Admin Controls */}
        {isAdmin && (
          <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
            <button
              onClick={() => setShowMembers(!showMembers)}
              className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors cursor-pointer"
            >
              {showMembers ? 'Hide Members' : '👥 Show Members'}
            </button>
            <button
              onClick={handleRegenerateCode}
              disabled={regenerating}
              className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              {regenerating ? 'Regenerating...' : '🔄 Regenerate Code'}
            </button>
            <button
              onClick={handleToggleActive}
              className={`text-sm px-4 py-2 rounded-lg transition-colors cursor-pointer ${
                community.isActive
                  ? 'bg-red-50 hover:bg-red-100 text-red-700'
                  : 'bg-green-50 hover:bg-green-100 text-green-700'
              }`}
            >
              {community.isActive ? '🚫 Deactivate' : '✅ Activate'}
            </button>
          </div>
        )}
      </div>

      {/* Members List */}
      {showMembers && community.members && (
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Members ({community.members.length})</h2>
          <div className="divide-y divide-gray-100">
            {community.members.map(m => (
              <div key={m.id} className="flex items-center justify-between py-3">
                <div>
                  <span className="font-medium text-gray-900">{m.user.username}</span>
                  <span className="text-gray-400 text-sm ml-2">{m.user.email}</span>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  m.role === 'admin' ? 'bg-teal-100 text-teal-800' : 'bg-gray-100 text-gray-600'
                }`}>{m.role}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trips */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Community Trips</h2>
        <Link
          to={`/trips/create?communityId=${id}`}
          className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
        >
          + Create Trip
        </Link>
      </div>

      {trips.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {trips.map(trip => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow p-8 text-center border border-gray-100">
          <span className="text-4xl block mb-3">🛣️</span>
          <p className="text-gray-500">No trips in this community yet.</p>
          <Link to={`/trips/create?communityId=${id}`} className="text-teal-600 hover:text-teal-700 font-medium text-sm mt-2 inline-block">
            Create the first trip →
          </Link>
        </div>
      )}
    </div>
  );
}
