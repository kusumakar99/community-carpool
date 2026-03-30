import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function JoinCommunity() {
  const { inviteCode } = useParams();
  const { user, api } = useAuth();
  const navigate = useNavigate();
  const [community, setCommunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        const res = await api.get(`/communities/preview/${inviteCode}`);
        setCommunity(res.data.community);
      } catch {
        setError('Invalid or expired invite link.');
      } finally {
        setLoading(false);
      }
    };
    fetchPreview();
  }, [inviteCode, api]);

  useEffect(() => {
    if (user && community && !message && !joining) {
      handleJoin();
    }
  }, [user, community]);

  const handleJoin = async () => {
    if (!user) {
      localStorage.setItem('pendingInviteCode', inviteCode);
      navigate('/register');
      return;
    }

    setJoining(true);
    setError('');
    try {
      const res = await api.post('/communities/join', { inviteCode });
      setMessage(res.data.message);
      localStorage.removeItem('pendingInviteCode');
      setTimeout(() => navigate(`/communities/${res.data.community.id}`), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to join community.');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (error && !community) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <span className="text-5xl block mb-4">❌</span>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invite Link</h1>
        <p className="text-gray-500 mb-6">{error}</p>
        <Link to="/communities" className="text-teal-600 hover:text-teal-700 font-medium">
          Go to Communities →
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
        <span className="text-5xl block mb-4">👥</span>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{community?.name}</h1>
        {community?.description && (
          <p className="text-gray-500 mb-2">{community.description}</p>
        )}
        <p className="text-sm text-gray-400 mb-6">{community?.memberCount} member{community?.memberCount !== 1 ? 's' : ''}</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {message ? (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {message}
            <p className="mt-2 text-xs text-green-500">Redirecting...</p>
          </div>
        ) : user ? (
          <button
            onClick={handleJoin}
            disabled={joining}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
          >
            {joining ? 'Joining...' : 'Join Community'}
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-gray-600 text-sm">Register or log in to join this community</p>
            <Link
              to="/register"
              onClick={() => localStorage.setItem('pendingInviteCode', inviteCode)}
              className="block w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-lg transition-colors text-center"
            >
              Register to Join
            </Link>
            <Link
              to="/login"
              onClick={() => localStorage.setItem('pendingInviteCode', inviteCode)}
              className="block text-teal-600 hover:text-teal-700 font-medium text-sm"
            >
              Already have an account? Log in →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
