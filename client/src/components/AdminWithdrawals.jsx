import React, { useState, useEffect } from 'react';
import { withdrawalService } from '../services/api';

export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [filter, setFilter] = useState('all');
  const [processing, setProcessing] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });

  useEffect(() => {
    fetchWithdrawals();
  }, [filter, pagination.page]);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (filter !== 'all') {
        params.status = filter;
      }
      
      const response = await withdrawalService.getAllWithdrawals(params);
      setWithdrawals(response.data.withdrawals);
      setStats(response.data.stats);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total,
        pages: response.data.pagination.pages,
      }));
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async (withdrawalId) => {
    if (!window.confirm('Process this withdrawal and initiate payout?')) return;
    
    try {
      setProcessing(withdrawalId);
      await withdrawalService.processWithdrawal(withdrawalId);
      fetchWithdrawals();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to process withdrawal');
    } finally {
      setProcessing(null);
    }
  };

  const handleComplete = async (withdrawalId) => {
    const transactionId = window.prompt('Enter transaction ID (optional):');
    
    try {
      setProcessing(withdrawalId);
      await withdrawalService.completeWithdrawal(withdrawalId, {
        transactionId,
        adminNotes: 'Manually completed by admin',
      });
      fetchWithdrawals();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to complete withdrawal');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (withdrawalId) => {
    const reason = window.prompt('Enter rejection reason:');
    if (!reason) return;
    
    try {
      setProcessing(withdrawalId);
      await withdrawalService.rejectWithdrawal(withdrawalId, { reason });
      fetchWithdrawals();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to reject withdrawal');
    } finally {
      setProcessing(null);
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
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Withdrawal Requests</h2>
        <button
          onClick={fetchWithdrawals}
          className="text-blue-600 hover:text-blue-800"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending?.count || 0}</p>
          <p className="text-xs text-gray-500">₹{stats.pending?.totalMoney?.toLocaleString() || 0}</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Processing</p>
          <p className="text-2xl font-bold text-blue-600">{stats.processing?.count || 0}</p>
          <p className="text-xs text-gray-500">₹{stats.processing?.totalMoney?.toLocaleString() || 0}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Completed</p>
          <p className="text-2xl font-bold text-green-600">{stats.completed?.count || 0}</p>
          <p className="text-xs text-gray-500">₹{stats.completed?.totalMoney?.toLocaleString() || 0}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Failed</p>
          <p className="text-2xl font-bold text-red-600">{stats.failed?.count || 0}</p>
          <p className="text-xs text-gray-500">₹{stats.failed?.totalMoney?.toLocaleString() || 0}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Cancelled</p>
          <p className="text-2xl font-bold text-gray-600">{stats.cancelled?.count || 0}</p>
          <p className="text-xs text-gray-500">₹{stats.cancelled?.totalMoney?.toLocaleString() || 0}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        {['all', 'pending', 'processing', 'completed', 'failed', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : withdrawals.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No withdrawals found</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-3 text-sm font-medium text-gray-600">User</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-600">Credits</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-600">Amount</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-600">Method</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-600">Date</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {withdrawals.map((withdrawal) => (
                <tr key={withdrawal._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{withdrawal.user?.name}</p>
                    <p className="text-xs text-gray-500">{withdrawal.user?.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold">{withdrawal.creditsAmount}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-green-600">
                      ₹{withdrawal.moneyAmount?.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm">
                      {withdrawal.payoutMethod === 'bank_transfer' ? '🏦 Bank' : '📱 UPI'}
                    </span>
                    {withdrawal.payoutMethod === 'bank_transfer' && withdrawal.bankDetails && (
                      <p className="text-xs text-gray-500">
                        {withdrawal.bankDetails.bankName}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(withdrawal.status)}
                    {withdrawal.failureReason && (
                      <p className="text-xs text-red-500 mt-1">{withdrawal.failureReason}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm">{formatDate(withdrawal.createdAt)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {withdrawal.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleProcess(withdrawal._id)}
                            disabled={processing === withdrawal._id}
                            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
                          >
                            {processing === withdrawal._id ? '...' : 'Process'}
                          </button>
                          <button
                            onClick={() => handleReject(withdrawal._id)}
                            disabled={processing === withdrawal._id}
                            className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {(withdrawal.status === 'processing' || withdrawal.status === 'failed') && (
                        <>
                          <button
                            onClick={() => handleComplete(withdrawal._id)}
                            disabled={processing === withdrawal._id}
                            className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
                          >
                            Complete
                          </button>
                          {withdrawal.status === 'failed' && (
                            <button
                              onClick={() => handleProcess(withdrawal._id)}
                              disabled={processing === withdrawal._id}
                              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                              Retry
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            disabled={pagination.page === 1}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            disabled={pagination.page === pagination.pages}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
