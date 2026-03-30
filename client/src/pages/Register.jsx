import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [step, setStep] = useState('form'); // 'form' | 'otp'
  const [form, setForm] = useState({ email: '', phone: '', username: '', password: '', confirmPassword: '' });
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.email || !form.phone || !form.username || !form.password || !form.confirmPassword) {
      return setError('All fields are required.');
    }
    if (!/^[+\d][\d\s\-()]{9,}$/.test(form.phone.trim())) {
      return setError('Please enter a valid phone number (10+ digits).');
    }
    if (!/\S+@\S+\.\S+/.test(form.email)) {
      return setError('Please enter a valid email address.');
    }
    if (form.password.length < 6) {
      return setError('Password must be at least 6 characters.');
    }
    if (form.password !== form.confirmPassword) {
      return setError('Passwords do not match.');
    }

    setLoading(true);
    try {
      const data = await register(form.email, form.phone, form.username, form.password);
      setSuccess(data.message || 'OTP sent to your email!');
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!otp || otp.length !== 6) {
      return setError('Please enter the 6-digit OTP.');
    }

    setLoading(true);
    try {
      await verifyOtp(form.email, otp);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const data = await resendOtp(form.email);
      setSuccess(data.message || 'New OTP sent!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="text-center mb-8">
            <span className="text-5xl">{step === 'form' ? '🚗' : '📧'}</span>
            <h1 className="text-2xl font-bold text-gray-900 mt-3">
              {step === 'form' ? 'Create Account' : 'Verify Email'}
            </h1>
            <p className="text-gray-500 mt-1">
              {step === 'form'
                ? 'Join the community carpool'
                : `Enter the 6-digit code sent to your email and phone`}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 text-sm">
              {success}
            </div>
          )}

          {step === 'form' ? (
            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email" name="email" value={form.email} onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                <input
                  type="tel" name="phone" value={form.phone} onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                  placeholder="+91 9876543210"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
                <input
                  type="text" name="username" value={form.username} onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                  placeholder="johndoe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <input
                  type="password" name="password" value={form.password} onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                <input
                  type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit" disabled={loading}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? 'Sending OTP...' : 'Send Verification Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Enter OTP</label>
                <input
                  type="text" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all text-center text-2xl tracking-[0.5em] font-mono"
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                />
              </div>
              <button
                type="submit" disabled={loading || otp.length !== 6}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? 'Verifying...' : 'Verify & Create Account'}
              </button>
              <div className="flex justify-between items-center text-sm">
                <button
                  type="button" onClick={handleResendOtp} disabled={loading}
                  className="text-teal-600 hover:text-teal-700 font-medium disabled:opacity-50 cursor-pointer"
                >
                  Resend OTP
                </button>
                <button
                  type="button" onClick={() => { setStep('form'); setOtp(''); setError(''); setSuccess(''); }}
                  className="text-gray-500 hover:text-gray-700 cursor-pointer"
                >
                  ← Back
                </button>
              </div>
            </form>
          )}

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-teal-600 hover:text-teal-700 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
