import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TripList from './pages/TripList';
import TripCreate from './pages/TripCreate';
import TripDetail from './pages/TripDetail';
import MyTrips from './pages/MyTrips';
import Transactions from './pages/Transactions';
import AdminPanel from './pages/AdminPanel';

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main>
          <Routes>
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/trips" element={<ProtectedRoute><TripList /></ProtectedRoute>} />
            <Route path="/trips/create" element={<ProtectedRoute><TripCreate /></ProtectedRoute>} />
            <Route path="/trips/:id" element={<ProtectedRoute><TripDetail /></ProtectedRoute>} />
            <Route path="/my-trips" element={<ProtectedRoute><MyTrips /></ProtectedRoute>} />
            <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
            <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}

export default App;
