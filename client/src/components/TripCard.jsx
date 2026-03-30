import { Link } from 'react-router-dom';

export default function TripCard({ trip }) {
  const departureDate = new Date(trip.departureTime || trip.departure_time);
  const seatsAvailable = trip.availableSeats ?? trip.available_seats ?? trip.totalSeats ?? trip.total_seats;
  const creditsPerSeat = trip.creditsPerSeat ?? trip.credits_per_seat ?? 0;
  const status = trip.status || 'scheduled';

  const statusColors = {
    scheduled: 'bg-blue-100 text-blue-800',
    'in-progress': 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <Link
      to={`/trips/${trip._id || trip.id}`}
      className="block bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-100 overflow-hidden"
    >
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
            {status.replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </span>
          <span className="text-teal-700 font-bold text-lg">₹{creditsPerSeat}</span>
        </div>

        <div className="flex items-center space-x-3 mb-4">
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 rounded-full bg-teal-500"></div>
            <div className="w-0.5 h-8 bg-gray-300"></div>
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-gray-900 font-medium truncate">{trip.originName || trip.origin_name || 'Origin'}</p>
            <div className="h-4"></div>
            <p className="text-gray-900 font-medium truncate">{trip.destinationName || trip.destination_name || 'Destination'}</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <span>📅</span>
            <span>{departureDate.toLocaleDateString()}</span>
            <span className="ml-2">🕐</span>
            <span>{departureDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>💺</span>
            <span>{seatsAvailable} seats</span>
          </div>
        </div>

        {trip.driver && (
          <div className="mt-3 pt-3 border-t border-gray-100 text-sm text-gray-500">
            Driver: <span className="text-gray-700 font-medium">{trip.driver.username || trip.driver}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
