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
  const [pendingMembers, setPendingMembers] = useState([]);
  const [approvedPhones, setApprovedPhones] = useState([]);
  const [newPhone, setNewPhone] = useState('');
  const [bulkPhones, setBulkPhones] = useState('');
  const [showApprovedPhones, setShowApprovedPhones] = useState(false);

  const fetchData = async () => {
    try {
      const [commRes, tripsRes] = await Promise.allSettled([
        api.get(`/communities/${id}`),
        api.get(`/communities/${id}/trips`),
      ]);
      if (commRes.status === 'fulfilled') {
        const comm = commRes.value.data.community;
        setCommunity(comm);
        // If admin, also fetch pending members and approved phones
        if (comm.myRole === 'admin') {
          const [pendingRes, phonesRes] = await Promise.allSettled([
            api.get(`/communities/${id}/pending-members`),
            api.get(`/communities/${id}/approved-phones`),
          ]);
          if (pendingRes.status === 'fulfilled') setPendingMembers(pendingRes.value.data.pendingMembers || []);
          if (phonesRes.status === 'fulfilled') setApprovedPhones(phonesRes.value.data.phones || []);
        }
      } else {
        setError('Failed to load community.');
      }
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

  const handleApprove = async (memberId) => {
    try {
      await api.patch(`/communities/${id}/members/${memberId}/approve`);
      setPendingMembers(prev => prev.filter(m => m.id !== memberId));
      setCommunity(prev => prev ? { ...prev, memberCount: prev.memberCount + 1 } : prev);
    } catch {
      alert('Failed to approve member.');
    }
  };

  const handleReject = async (memberId) => {
    try {
      await api.patch(`/communities/${id}/members/${memberId}/reject`);
      setPendingMembers(prev => prev.filter(m => m.id !== memberId));
    } catch {
      alert('Failed to reject member.');
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!confirm('Remove this member from the community?')) return;
    try {
      await api.delete(`/communities/${id}/members/${memberId}`);
      setCommunity(prev => prev ? {
        ...prev,
        members: prev.members.filter(m => m.id !== memberId),
        memberCount: prev.memberCount - 1,
      } : prev);
    } catch {
      alert('Failed to remove member.');
    }
  };

  const handlePromote = async (memberId) => {
    try {
      const res = await api.patch(`/communities/${id}/members/${memberId}/promote`);
      alert(res.data.message);
      fetchCommunity();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to promote member.');
    }
  };

  const handleDemote = async (memberId) => {
    try {
      const res = await api.patch(`/communities/${id}/members/${memberId}/demote`);
      alert(res.data.message);
      fetchCommunity();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to demote admin.');
    }
  };

  const handleAddPhone = async () => {
    const phone = newPhone.trim();
    if (!phone) return;
    try {
      await api.post(`/communities/${id}/approved-phones`, { phones: [phone] });
      setNewPhone('');
      const res = await api.get(`/communities/${id}/approved-phones`);
      setApprovedPhones(res.data.phones || []);
    } catch {
      alert('Failed to add phone number.');
    }
  };

  const handleBulkAddPhones = async () => {
    const phones = bulkPhones.split('\n').map(p => p.trim()).filter(p => p.length > 0);
    if (phones.length === 0) return;
    try {
      await api.post(`/communities/${id}/approved-phones`, { phones });
      setBulkPhones('');
      const res = await api.get(`/communities/${id}/approved-phones`);
      setApprovedPhones(res.data.phones || []);
    } catch {
      alert('Failed to add phone numbers.');
    }
  };

  const handleDeletePhone = async (phoneId) => {
    try {
      await api.delete(`/communities/${id}/approved-phones/${phoneId}`);
      setApprovedPhones(prev => prev.filter(p => p.id !== phoneId));
    } catch {
      alert('Failed to remove phone number.');
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
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    m.role === 'admin' ? 'bg-teal-100 text-teal-800' : 'bg-gray-100 text-gray-600'
                  }`}>{m.role}</span>
                  {isAdmin && m.role !== 'admin' && (
                    <>
                      <button
                        onClick={() => handlePromote(m.id)}
                        className="text-teal-600 hover:text-teal-800 text-xs px-2 py-1 rounded cursor-pointer font-medium"
                      >
                        ⬆ Make Admin
                      </button>
                      <button
                        onClick={() => handleRemoveMember(m.id)}
                        className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded cursor-pointer"
                      >
                        ✕ Remove
                      </button>
                    </>
                  )}
                  {isAdmin && m.role === 'admin' && m.userId !== user?.id && (
                    <button
                      onClick={() => handleDemote(m.id)}
                      className="text-amber-600 hover:text-amber-800 text-xs px-2 py-1 rounded cursor-pointer font-medium"
                    >
                      ⬇ Remove Admin
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Members (admin only) */}
      {isAdmin && pendingMembers.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-amber-800 mb-3">⏳ Pending Approvals ({pendingMembers.length})</h3>
          {pendingMembers.map(m => (
            <div key={m.id} className="flex items-center justify-between py-3 border-b border-amber-100 last:border-0">
              <div>
                <span className="font-medium text-gray-900">{m.user.username}</span>
                <div className="flex gap-3 text-xs text-gray-500 mt-1">
                  <span>📞 {m.user.phone}</span>
                  {m.user.gender && <span>👤 {m.user.gender}</span>}
                  {m.user.age && <span>🎂 {m.user.age} yrs</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleApprove(m.id)} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm cursor-pointer">✅ Approve</button>
                <button onClick={() => handleReject(m.id)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm cursor-pointer">❌ Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pre-approved Phones (admin only) */}
      {isAdmin && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-blue-800">📋 Pre-approved Phone Numbers</h3>
            <button
              onClick={() => setShowApprovedPhones(!showApprovedPhones)}
              className="text-blue-600 hover:text-blue-800 text-sm cursor-pointer"
            >
              {showApprovedPhones ? 'Hide' : `Show (${approvedPhones.length})`}
            </button>
          </div>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newPhone}
              onChange={e => setNewPhone(e.target.value)}
              placeholder="+91 9876543210"
              className="flex-1 px-3 py-2 border rounded-lg text-sm"
              onKeyDown={e => e.key === 'Enter' && handleAddPhone()}
            />
            <button onClick={handleAddPhone} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm cursor-pointer">Add</button>
          </div>
          <textarea
            value={bulkPhones}
            onChange={e => setBulkPhones(e.target.value)}
            placeholder="Paste multiple phone numbers (one per line)"
            className="w-full px-3 py-2 border rounded-lg text-sm mb-2"
            rows={3}
          />
          <button onClick={handleBulkAddPhones} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm mb-3 cursor-pointer">Add All</button>
          <p className="text-xs text-blue-600 mb-3">Users with these phone numbers will be auto-approved when they join.</p>
          {showApprovedPhones && approvedPhones.length > 0 && (
            <div className="space-y-2">
              {approvedPhones.map(p => (
                <div key={p.id} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg">
                  <span className="text-sm font-mono text-gray-700">{p.phone}</span>
                  <button onClick={() => handleDeletePhone(p.id)} className="text-red-500 hover:text-red-700 text-xs cursor-pointer">✕ Remove</button>
                </div>
              ))}
            </div>
          )}
          {showApprovedPhones && approvedPhones.length === 0 && (
            <p className="text-xs text-gray-500">No pre-approved phone numbers yet.</p>
          )}
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
