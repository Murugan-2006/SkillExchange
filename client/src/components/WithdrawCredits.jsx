import React, { useState, useEffect } from 'react';
import { withdrawalService, creditsService } from '../services/api';

export default function WithdrawCredits({ onClose, onSuccess }) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1); // 1: Bank Details, 2: Amount, 3: Confirm, 4: Success
  const [config, setConfig] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Bank details form
  const [bankDetails, setBankDetails] = useState({
    accountHolderName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
    bankName: '',
    accountType: 'savings',
  });
  const [upiId, setUpiId] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('bank_transfer');
  
  // Withdrawal amount
  const [creditsAmount, setCreditsAmount] = useState(100);
  const [withdrawalResult, setWithdrawalResult] = useState(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await withdrawalService.getConfig();
      setConfig(response.data);
      
      // Pre-fill bank details if available
      if (response.data.bankDetails?.accountNumber) {
        setBankDetails({
          ...bankDetails,
          accountHolderName: response.data.bankDetails.accountHolderName || '',
          accountNumber: '', // Don't pre-fill for security
          confirmAccountNumber: '',
          ifscCode: response.data.bankDetails.ifscCode || '',
          bankName: response.data.bankDetails.bankName || '',
          accountType: response.data.bankDetails.accountType || 'savings',
        });
      }
      if (response.data.upiId) {
        setUpiId(response.data.upiId);
      }
      
      // Set default withdrawal amount
      if (response.data.config?.minCredits) {
        setCreditsAmount(response.data.config.minCredits);
      }
    } catch (err) {
      setError('Failed to load withdrawal configuration');
    } finally {
      setLoading(false);
    }
  };

  const validateBankDetails = () => {
    if (payoutMethod === 'bank_transfer') {
      if (!bankDetails.accountHolderName.trim()) {
        setError('Account holder name is required');
        return false;
      }
      if (!bankDetails.accountNumber.trim()) {
        setError('Account number is required');
        return false;
      }
      if (bankDetails.accountNumber !== bankDetails.confirmAccountNumber) {
        setError('Account numbers do not match');
        return false;
      }
      if (!bankDetails.ifscCode.trim()) {
        setError('IFSC code is required');
        return false;
      }
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(bankDetails.ifscCode)) {
        setError('Invalid IFSC code format');
        return false;
      }
      if (!bankDetails.bankName.trim()) {
        setError('Bank name is required');
        return false;
      }
    } else if (payoutMethod === 'upi') {
      if (!upiId.trim() || !upiId.includes('@')) {
        setError('Valid UPI ID is required (e.g., name@upi)');
        return false;
      }
    }
    return true;
  };

  const handleSaveBankDetails = async () => {
    setError('');
    if (!validateBankDetails()) return;
    
    try {
      setSubmitting(true);
      await withdrawalService.updateBankDetails({
        ...bankDetails,
        upiId: payoutMethod === 'upi' ? upiId : undefined,
      });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save bank details');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    setError('');
    
    if (creditsAmount < config.config.minCredits) {
      setError(`Minimum withdrawal is ${config.config.minCredits} credits`);
      return;
    }
    
    if (creditsAmount > config.userStatus.currentBalance) {
      setError('Insufficient credits');
      return;
    }
    
    try {
      setSubmitting(true);
      const response = await withdrawalService.requestWithdrawal({
        creditsAmount,
        payoutMethod,
      });
      
      setWithdrawalResult(response.data);
      setStep(4);
      
      // Dispatch event to update credits in Navbar and other components
      window.dispatchEvent(new CustomEvent('creditsUpdated'));
      
      if (onSuccess) {
        onSuccess(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Withdrawal request failed');
    } finally {
      setSubmitting(false);
    }
  };

  const calculateMoney = () => {
    if (!config) return 0;
    return creditsAmount * config.config.conversionRate;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">
            {step === 4 ? '✅ Withdrawal Successful' : '💰 Withdraw Credits'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* Step Indicator */}
          {step < 4 && (
            <div className="flex justify-center mb-6">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      s === step
                        ? 'bg-blue-600 text-white'
                        : s < step
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {s < step ? '✓' : s}
                  </div>
                  {s < 3 && (
                    <div
                      className={`w-12 h-1 ${s < step ? 'bg-green-500' : 'bg-gray-200'}`}
                    ></div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Step 1: Bank Details */}
          {step === 1 && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-4">Payment Details</h3>
              
              {/* Payout Method Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Payout Method
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="bank_transfer"
                      checked={payoutMethod === 'bank_transfer'}
                      onChange={(e) => setPayoutMethod(e.target.value)}
                      className="mr-2"
                    />
                    Bank Transfer
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="upi"
                      checked={payoutMethod === 'upi'}
                      onChange={(e) => setPayoutMethod(e.target.value)}
                      className="mr-2"
                    />
                    UPI
                  </label>
                </div>
              </div>

              {payoutMethod === 'bank_transfer' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      value={bankDetails.accountHolderName}
                      onChange={(e) =>
                        setBankDetails({ ...bankDetails, accountHolderName: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Name as per bank records"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Account Number
                    </label>
                    <input
                      type="text"
                      value={bankDetails.accountNumber}
                      onChange={(e) =>
                        setBankDetails({ ...bankDetails, accountNumber: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter account number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Confirm Account Number
                    </label>
                    <input
                      type="text"
                      value={bankDetails.confirmAccountNumber}
                      onChange={(e) =>
                        setBankDetails({ ...bankDetails, confirmAccountNumber: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Re-enter account number"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        IFSC Code
                      </label>
                      <input
                        type="text"
                        value={bankDetails.ifscCode}
                        onChange={(e) =>
                          setBankDetails({ ...bankDetails, ifscCode: e.target.value.toUpperCase() })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., SBIN0001234"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Account Type
                      </label>
                      <select
                        value={bankDetails.accountType}
                        onChange={(e) =>
                          setBankDetails({ ...bankDetails, accountType: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="savings">Savings</option>
                        <option value="current">Current</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={bankDetails.bankName}
                      onChange={(e) =>
                        setBankDetails({ ...bankDetails, bankName: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., State Bank of India"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    UPI ID
                  </label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., yourname@upi"
                  />
                </div>
              )}

              <button
                onClick={handleSaveBankDetails}
                disabled={submitting}
                className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Continue'}
              </button>
            </div>
          )}

          {/* Step 2: Amount Selection */}
          {step === 2 && (
            <div>
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Available Credits</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {config.userStatus.currentBalance}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  1 Credit = ₹{config.config.conversionRate}
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Credits to Withdraw
                </label>
                <input
                  type="number"
                  value={creditsAmount}
                  onChange={(e) => setCreditsAmount(Math.max(0, parseInt(e.target.value) || 0))}
                  min={config.config.minCredits}
                  max={Math.min(config.config.maxCredits, config.userStatus.currentBalance)}
                  className="w-full px-4 py-3 text-xl border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-center"
                />
                <p className="text-sm text-gray-500 mt-1 text-center">
                  Min: {config.config.minCredits} | Max: {Math.min(config.config.maxCredits, config.userStatus.currentBalance)}
                </p>
              </div>

              {/* Quick select buttons */}
              <div className="flex gap-2 mb-6">
                {[100, 250, 500, 1000].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setCreditsAmount(Math.min(amount, config.userStatus.currentBalance))}
                    disabled={amount > config.userStatus.currentBalance}
                    className={`flex-1 py-2 rounded-lg border transition ${
                      creditsAmount === amount
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                    } disabled:opacity-50`}
                  >
                    {amount}
                  </button>
                ))}
              </div>

              <div className="bg-green-50 p-4 rounded-lg mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">You will receive</span>
                  <span className="text-2xl font-bold text-green-600">
                    ₹{calculateMoney().toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={creditsAmount < config.config.minCredits || creditsAmount > config.userStatus.currentBalance}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-4">Confirm Withdrawal</h3>
              
              <div className="bg-gray-50 rounded-lg p-4 space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Credits to Withdraw</span>
                  <span className="font-semibold">{creditsAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Conversion Rate</span>
                  <span className="font-semibold">1 Credit = ₹{config.config.conversionRate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payout Method</span>
                  <span className="font-semibold">
                    {payoutMethod === 'bank_transfer' ? 'Bank Transfer' : 'UPI'}
                  </span>
                </div>
                {payoutMethod === 'bank_transfer' && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bank Account</span>
                    <span className="font-semibold">
                      {bankDetails.bankName} - XXXX{bankDetails.accountNumber.slice(-4)}
                    </span>
                  </div>
                )}
                {payoutMethod === 'upi' && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">UPI ID</span>
                    <span className="font-semibold">{upiId}</span>
                  </div>
                )}
                <hr />
                <div className="flex justify-between text-lg">
                  <span className="font-semibold text-gray-700">Total Amount</span>
                  <span className="font-bold text-green-600">₹{calculateMoney().toLocaleString()}</span>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800">
                  ⚠️ Please verify your bank details. Incorrect details may result in failed transfers. 
                  The amount will be credited within 1-3 business days.
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Back
                </button>
                <button
                  onClick={handleWithdraw}
                  disabled={submitting}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                >
                  {submitting ? 'Processing...' : 'Confirm Withdrawal'}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 4 && withdrawalResult && (
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h3 className="text-xl font-bold text-gray-800 mb-2">Withdrawal Initiated!</h3>
              <p className="text-gray-600 mb-6">
                Your withdrawal request has been submitted and is being processed automatically.
              </p>

              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Credits Withdrawn</span>
                  <span className="font-semibold">{withdrawalResult.withdrawal.creditsAmount}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Amount</span>
                  <span className="font-semibold text-green-600">
                    ₹{withdrawalResult.withdrawal.moneyAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Status</span>
                  <span className="font-semibold text-blue-600 capitalize">
                    {withdrawalResult.withdrawal.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">New Balance</span>
                  <span className="font-semibold">{withdrawalResult.newBalance} credits</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
