import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Transactions() {
  const { api } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [txRes, balRes] = await Promise.allSettled([
          api.get('/credits/transactions'),
          api.get('/credits/balance'),
        ]);
        if (txRes.status === 'fulfilled') {
          setTransactions(txRes.value.data.transactions || txRes.value.data || []);
        }
        if (balRes.status === 'fulfilled') {
          setBalance(balRes.value.data.balance ?? balRes.value.data.credits ?? 0);
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
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Transactions (₹)</h1>
        <p className="text-gray-500 mt-1">Your transaction history</p>
      </div>

      {/* Balance */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl shadow-lg p-6 mb-8 text-white">
        <p className="text-teal-100 text-sm font-medium">Current Balance</p>
        <p className="text-4xl font-bold mt-1">
          ₹{loading ? '...' : (balance ?? 0)}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
        </div>
      ) : transactions.length > 0 ? (
        <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Date</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Type</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Trip</th>
                <th className="text-right px-6 py-3 text-sm font-semibold text-gray-600">Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, i) => {
                const amount = tx.amount || tx.credits || 0;
                const isPositive = amount > 0;
                return (
                  <tr key={tx._id || tx.id || i} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(tx.createdAt || tx.created_at || tx.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${
                        isPositive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {tx.type || (isPositive ? 'credit' : 'debit')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {tx.trip?.originName || tx.trip?.origin_name || tx.tripId || tx.trip_id || '—'}
                      {(tx.trip?.destinationName || tx.trip?.destination_name) && (
                        <span> → {tx.trip?.destinationName || tx.trip?.destination_name}</span>
                      )}
                    </td>
                    <td className={`px-6 py-4 text-right font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {isPositive ? '+' : ''}₹{Math.abs(amount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow p-12 text-center border border-gray-100">
          <span className="text-5xl block mb-4">📊</span>
          <p className="text-gray-500 text-lg">No transactions yet.</p>
          <p className="text-gray-400 text-sm mt-1">Complete trips to earn and spend ₹.</p>
        </div>
      )}
    </div>
  );
}
