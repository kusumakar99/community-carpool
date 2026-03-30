import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TripCard from '../components/TripCard';

export default function MyTrips() {
  const { api } = useAuth();
  const [tab, setTab] = useState('driving');
  const [drivingTrips, setDrivingTrips] = useState([]);
  const [ridingTrips, setRidingTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [actionLoading, setActionLoading] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchTrips = useCallback(async () => {
    try {
      const [createdRes, joinedRes] = await Promise.allSettled([
        api.get('/trips/my/created'),
        api.get('/trips/my/joined'),
      ]);
      if (createdRes.status === 'fulfilled') {
        setDrivingTrips(createdRes.value.data.trips || createdRes.value.data || []);
      }
      if (joinedRes.status === 'fulfilled') {
        setRidingTrips(joinedRes.value.data.trips || joinedRes.value.data || []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { fetchTrips(); }, [fetchTrips]);

  const handleStartJourney = async (tripId) => {
    setActionLoading(tripId);
    try {
      await api.patch(`/trips/${tripId}/start`);
      showToast('Journey started!');
      fetchTrips();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to start journey.');
    } finally {
      setActionLoading('');
    }
  };

  const currentTrips = tab === 'driving' ? drivingTrips : ridingTrips;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 right-4 bg-teal-700 text-white px-5 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
          {toast}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Trips</h1>
          <p className="text-gray-500 mt-1">Manage your rides</p>
        </div>
        <Link
          to="/trips/create"
          className="mt-4 sm:mt-0 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors inline-block text-center"
        >
          + New Trip
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl mb-6 max-w-md">
        <button
          onClick={() => setTab('driving')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
            tab === 'driving' ? 'bg-white shadow text-teal-700' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🚗 Driving ({drivingTrips.length})
        </button>
        <button
          onClick={() => setTab('riding')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
            tab === 'riding' ? 'bg-white shadow text-teal-700' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🧑‍🤝‍🧑 Riding ({ridingTrips.length})
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
        </div>
      ) : currentTrips.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {currentTrips.map(trip => {
            const tripId = trip._id || trip.id;
            const tripStatus = (trip.status || '').toUpperCase();
            const hasAcceptedRiders = tab === 'driving' && (trip.joinRequests || []).some(r => (r.status || '').toUpperCase() === 'ACCEPTED');
            return (
              <div key={tripId}>
                <TripCard trip={trip} />
                {tab === 'driving' && tripStatus === 'SCHEDULED' && hasAcceptedRiders && (
                  <button
                    onClick={(e) => { e.preventDefault(); handleStartJourney(tripId); }}
                    disabled={actionLoading === tripId}
                    className="w-full mt-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {actionLoading === tripId ? 'Starting...' : '🚀 Start Journey'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow p-12 text-center border border-gray-100">
          <span className="text-5xl block mb-4">{tab === 'driving' ? '🚗' : '🧑‍🤝‍🧑'}</span>
          <p className="text-gray-500 text-lg">
            {tab === 'driving'
              ? "You haven't created any trips yet."
              : "You haven't joined any trips yet."
            }
          </p>
          <Link
            to={tab === 'driving' ? '/trips/create' : '/trips'}
            className="inline-block mt-4 text-teal-600 hover:text-teal-700 font-medium"
          >
            {tab === 'driving' ? 'Create your first trip →' : 'Browse available trips →'}
          </Link>
        </div>
      )}
    </div>
  );
}
