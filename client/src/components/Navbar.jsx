import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-teal-700 shadow-lg">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl">🚗</span>
            <span className="text-white font-bold text-xl">CarPool</span>
          </Link>

          {user ? (
            <div className="flex items-center space-x-1 sm:space-x-4">
              <Link to="/dashboard" className="text-teal-100 hover:text-white px-2 sm:px-3 py-2 rounded text-sm font-medium transition-colors">
                Dashboard
              </Link>
              <Link to="/trips" className="text-teal-100 hover:text-white px-2 sm:px-3 py-2 rounded text-sm font-medium transition-colors">
                Browse
              </Link>
              <Link to="/communities" className="text-teal-100 hover:text-white px-2 sm:px-3 py-2 rounded text-sm font-medium transition-colors">
                Communities
              </Link>
              <Link to="/trips/create" className="text-teal-100 hover:text-white px-2 sm:px-3 py-2 rounded text-sm font-medium transition-colors">
                Create Trip
              </Link>
              <Link to="/my-trips" className="text-teal-100 hover:text-white px-2 sm:px-3 py-2 rounded text-sm font-medium transition-colors">
                My Trips
              </Link>
              <Link to="/transactions" className="text-teal-100 hover:text-white px-2 sm:px-3 py-2 rounded text-sm font-medium transition-colors">
                ₹ Wallet
              </Link>
              {user.role === 'admin' && (
                <Link to="/admin" className="text-yellow-200 hover:text-white px-2 sm:px-3 py-2 rounded text-sm font-medium transition-colors">
                  🛡️ Admin
                </Link>
              )}
              <div className="flex items-center space-x-3 ml-2 pl-2 sm:pl-4 border-l border-teal-500">
                <span className="text-teal-100 text-sm hidden sm:inline">
                  {user.username}
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-teal-600 hover:bg-teal-500 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors cursor-pointer"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Link to="/login" className="text-teal-100 hover:text-white px-3 py-2 rounded text-sm font-medium transition-colors">
                Login
              </Link>
              <Link to="/register" className="bg-white text-teal-700 hover:bg-teal-50 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
