import React, { useState, useEffect } from 'react';
import { withdrawalService } from '../services/api';

export default function WithdrawalHistory({ onClose }) {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await withdrawalService.getHistory();
      setWithdrawals(response.data.withdrawals);
    } catch (error) {
      console.error('Error fetching withdrawal history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (withdrawalId) => {
    if (!window.confirm('Are you sure you want to cancel this withdrawal?')) return;
    
    try {
      await withdrawalService.cancelWithdrawal(withdrawalId);
      fetchHistory();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to cancel withdrawal');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">📜 Withdrawal History</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : withdrawals.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-4xl mb-4">📭</p>
              <p>No withdrawal history yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {withdrawals.map((withdrawal) => (
                <div
                  key={withdrawal._id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge(withdrawal.status)}
                        <span className="text-sm text-gray-500">
                          {formatDate(withdrawal.createdAt)}
                        </span>
                      </div>
                      <p className="text-lg font-semibold">
                        {withdrawal.creditsAmount} Credits → ₹{withdrawal.moneyAmount?.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        {withdrawal.payoutMethod === 'bank_transfer' ? '🏦 Bank Transfer' : '📱 UPI'}
                        {withdrawal.payoutMethod === 'bank_transfer' && withdrawal.bankDetails && (
                          <span className="ml-2">
                            ({withdrawal.bankDetails.bankName} - {withdrawal.bankDetails.accountNumber})
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      {withdrawal.status === 'pending' && (
                        <button
                          onClick={() => handleCancel(withdrawal._id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Cancel
                        </button>
                      )}
                      {withdrawal.status === 'completed' && withdrawal.completedAt && (
                        <p className="text-xs text-gray-500">
                          Completed: {formatDate(withdrawal.completedAt)}
                        </p>
                      )}
                      {withdrawal.status === 'failed' && withdrawal.failureReason && (
                        <p className="text-xs text-red-500">
                          {withdrawal.failureReason}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
