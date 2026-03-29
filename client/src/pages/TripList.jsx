import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import TripCard from '../components/TripCard';

export default function TripList() {
  const { api } = useAuth();
  const [trips, setTrips] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/trips')
      .then(res => {
        setTrips(res.data.trips || res.data || []);
      })
      .catch(() => setError('Failed to load trips.'))
      .finally(() => setLoading(false));
  }, [api]);

  const filteredTrips = trips.filter(trip => {
    if (!search) return true;
    const q = search.toLowerCase();
    const dest = (trip.destinationName || trip.destination_name || '').toLowerCase();
    const orig = (trip.originName || trip.origin_name || '').toLowerCase();
    return dest.includes(q) || orig.includes(q);
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Available Trips</h1>
          <p className="text-gray-500 mt-1">Find and join rides in your community</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">🔍</span>
          <input
            type="text"
            placeholder="Search by origin or destination..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all bg-white shadow-sm"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
        </div>
      ) : filteredTrips.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTrips.map(trip => (
            <TripCard key={trip._id || trip.id} trip={trip} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow p-12 text-center border border-gray-100">
          <span className="text-5xl block mb-4">🔎</span>
          <p className="text-gray-500 text-lg">
            {search ? 'No trips match your search.' : 'No trips available right now.'}
          </p>
        </div>
      )}
    </div>
  );
}
