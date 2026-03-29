import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function TripDetail() {
  const { id } = useParams();
  const { user, api } = useAuth();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [actionLoading, setActionLoading] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchTrip = useCallback(async () => {
    try {
      const res = await api.get(`/trips/${id}`);
      setTrip(res.data.trip || res.data);
    } catch { setError('Failed to load trip details.'); }
    finally { setLoading(false); }
  }, [api, id]);

  useEffect(() => { fetchTrip(); }, [fetchTrip]);

  const isDriver = trip && (
    (trip.driver?._id || trip.driver?.id || trip.driver) === (user?._id || user?.id)
  );

  const joinRequests = trip?.joinRequests || trip?.join_requests || [];
  const myRequest = joinRequests.find(r =>
    (r.user?._id || r.user?.id || r.user) === (user?._id || user?.id)
  );
  const seatsAvailable = trip?.availableSeats ?? trip?.available_seats ?? trip?.totalSeats ?? trip?.total_seats ?? 0;

  const handleJoin = async () => {
    setActionLoading('join');
    try {
      await api.post(`/trips/${id}/join`);
      showToast('Join request sent!');
      fetchTrip();
    } catch (err) { showToast(err.response?.data?.message || 'Failed to send join request.'); }
    finally { setActionLoading(''); }
  };

  const handleRequestAction = async (requestId, action) => {
    setActionLoading(requestId);
    try {
      await api.patch(`/join-requests/${requestId}/${action}`);
      showToast(`Request ${action}ed!`);
      fetchTrip();
    } catch (err) { showToast(err.response?.data?.message || `Failed to ${action} request.`); }
    finally { setActionLoading(''); }
  };

  const handleTripAction = async (action) => {
    setActionLoading(action);
    try {
      await api.patch(`/trips/${id}/${action}`);
      showToast(`Trip ${action}d!`);
      fetchTrip();
    } catch (err) { showToast(err.response?.data?.message || `Failed to ${action} trip.`); }
    finally { setActionLoading(''); }
  };

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
    </div>
  );

  if (error) return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
    </div>
  );

  if (!trip) return null;

  const status = trip.status || 'scheduled';
  const statusColors = {
    scheduled: 'bg-blue-100 text-blue-800',
    'in-progress': 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 right-4 bg-teal-700 text-white px-5 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
          {toast}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
              {status.replace(/[_-]/g, ' ').toUpperCase()}
            </span>
            <span className="text-2xl font-bold">{trip.creditsPerSeat ?? trip.credits_per_seat ?? 0} credits/seat</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex flex-col items-center">
              <div className="w-4 h-4 rounded-full bg-white"></div>
              <div className="w-0.5 h-12 bg-teal-300"></div>
              <div className="w-4 h-4 rounded-full bg-orange-300"></div>
            </div>
            <div>
              <p className="text-xl font-semibold">{trip.originName || trip.origin_name}</p>
              <div className="h-6"></div>
              <p className="text-xl font-semibold">{trip.destinationName || trip.destination_name}</p>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-xl">
              <p className="text-2xl mb-1">📅</p>
              <p className="text-sm text-gray-500">Date</p>
              <p className="font-semibold text-gray-900">{new Date(trip.departureTime || trip.departure_time).toLocaleDateString()}</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-xl">
              <p className="text-2xl mb-1">🕐</p>
              <p className="text-sm text-gray-500">Time</p>
              <p className="font-semibold text-gray-900">{new Date(trip.departureTime || trip.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-xl">
              <p className="text-2xl mb-1">💺</p>
              <p className="text-sm text-gray-500">Seats Left</p>
              <p className="font-semibold text-gray-900">{seatsAvailable}</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-xl">
              <p className="text-2xl mb-1">👤</p>
              <p className="text-sm text-gray-500">Driver</p>
              <p className="font-semibold text-gray-900">{trip.driver?.username || 'Unknown'}</p>
            </div>
          </div>

          {/* Rider Actions */}
          {!isDriver && status === 'scheduled' && (
            <div>
              {myRequest ? (
                <div className="bg-teal-50 border border-teal-200 text-teal-700 px-4 py-3 rounded-lg text-center">
                  Your request is <span className="font-bold">{myRequest.status}</span>
                </div>
              ) : seatsAvailable > 0 ? (
                <button
                  onClick={handleJoin}
                  disabled={actionLoading === 'join'}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading === 'join' ? 'Sending...' : '🙋 Request to Join'}
                </button>
              ) : (
                <div className="bg-gray-100 text-gray-500 px-4 py-3 rounded-lg text-center">No seats available</div>
              )}
            </div>
          )}

          {/* Driver Actions */}
          {isDriver && (
            <div className="space-y-4">
              {/* Trip Actions */}
              {status === 'scheduled' && (
                <div className="flex gap-3">
                  <button onClick={() => handleTripAction('complete')} disabled={!!actionLoading}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 cursor-pointer">
                    {actionLoading === 'complete' ? 'Completing...' : '✅ Complete Trip'}
                  </button>
                  <button onClick={() => handleTripAction('cancel')} disabled={!!actionLoading}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 cursor-pointer">
                    {actionLoading === 'cancel' ? 'Cancelling...' : '❌ Cancel Trip'}
                  </button>
                </div>
              )}

              {/* Join Requests */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Join Requests ({joinRequests.length})</h3>
                {joinRequests.length > 0 ? (
                  <div className="space-y-3">
                    {joinRequests.map((req) => {
                      const reqId = req._id || req.id;
                      const reqUser = req.user?.username || req.user?.email || 'User';
                      return (
                        <div key={reqId} className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
                          <div>
                            <p className="font-medium text-gray-900">{reqUser}</p>
                            <p className="text-sm text-gray-500">Status: <span className="font-semibold capitalize">{req.status}</span></p>
                          </div>
                          {req.status === 'pending' && (
                            <div className="flex gap-2">
                              <button onClick={() => handleRequestAction(reqId, 'accept')} disabled={!!actionLoading}
                                className="bg-green-500 hover:bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer">
                                {actionLoading === reqId ? '...' : 'Accept'}
                              </button>
                              <button onClick={() => handleRequestAction(reqId, 'reject')} disabled={!!actionLoading}
                                className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer">
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No join requests yet.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
