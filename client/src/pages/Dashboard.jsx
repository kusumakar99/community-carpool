import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TripCard from '../components/TripCard';

export default function Dashboard() {
  const { user, api } = useAuth();
  const [balance, setBalance] = useState(null);
  const [recentTrips, setRecentTrips] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [balRes, tripsRes, commRes] = await Promise.allSettled([
          api.get('/credits/balance'),
          api.get('/trips'),
          api.get('/communities'),
        ]);
        if (balRes.status === 'fulfilled') {
          setBalance(balRes.value.data.balance ?? balRes.value.data.credits ?? 0);
        }
        if (tripsRes.status === 'fulfilled') {
          const trips = tripsRes.value.data.trips || tripsRes.value.data || [];
          setRecentTrips(trips.slice(0, 3));
        }
        if (commRes.status === 'fulfilled') {
          setCommunities(commRes.value.data.communities || []);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [api]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, <span className="text-teal-600">{user?.username}</span>! 👋
        </h1>
        <p className="text-gray-500 mt-1">Here&apos;s your carpool dashboard</p>
      </div>

      {/* Credit Balance Card */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl shadow-lg p-6 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-teal-100 text-sm font-medium">Balance (₹)</p>
            <p className="text-4xl font-bold mt-1">
              ₹{loading ? '...' : (balance ?? 0)}
            </p>
          </div>
          <div className="text-6xl opacity-80">💰</div>
        </div>
        <Link
          to="/transactions"
          className="inline-block mt-4 text-sm text-teal-100 hover:text-white underline underline-offset-2"
        >
          View transaction history →
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Link
          to="/trips/create"
          className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg hover:border-teal-200 transition-all text-center group"
        >
          <span className="text-4xl block mb-2 group-hover:scale-110 transition-transform inline-block">🚀</span>
          <h3 className="font-semibold text-gray-900">Create Trip</h3>
          <p className="text-sm text-gray-500 mt-1">Offer a ride and earn ₹</p>
        </Link>
        <Link
          to="/trips"
          className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg hover:border-teal-200 transition-all text-center group"
        >
          <span className="text-4xl block mb-2 group-hover:scale-110 transition-transform inline-block">🔍</span>
          <h3 className="font-semibold text-gray-900">Browse Trips</h3>
          <p className="text-sm text-gray-500 mt-1">Find rides near you</p>
        </Link>
        <Link
          to="/my-trips"
          className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg hover:border-teal-200 transition-all text-center group"
        >
          <span className="text-4xl block mb-2 group-hover:scale-110 transition-transform inline-block">📋</span>
          <h3 className="font-semibold text-gray-900">My Trips</h3>
          <p className="text-sm text-gray-500 mt-1">Manage your rides</p>
        </Link>
      </div>

      {/* My Communities */}
      {communities.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">My Communities</h2>
            <Link to="/communities" className="text-teal-600 hover:text-teal-700 text-sm font-medium">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {communities.slice(0, 3).map(c => (
              <Link
                key={c.id}
                to={`/communities/${c.id}`}
                className="block bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-100 p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-gray-900">{c.name}</h3>
                  {c.myRole === 'admin' && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">Admin</span>
                  )}
                </div>
                <p className="text-sm text-gray-500">👥 {c.memberCount} members</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Trips */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Recent Trips</h2>
          <Link to="/trips" className="text-teal-600 hover:text-teal-700 text-sm font-medium">
            View all →
          </Link>
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          </div>
        ) : recentTrips.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentTrips.map(trip => (
              <TripCard key={trip._id || trip.id} trip={trip} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow p-8 text-center border border-gray-100">
            <span className="text-4xl block mb-3">🛣️</span>
            <p className="text-gray-500">No trips yet. Create one or browse available rides!</p>
          </div>
        )}
      </div>
    </div>
  );
}
