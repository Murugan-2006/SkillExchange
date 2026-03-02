// PhonePe Payment Gateway Configuration - Standard Checkout API v2
const PHONEPE_CLIENT_ID = 'M23JA88N0P3U1_2602181647';
const PHONEPE_CLIENT_SECRET = 'OGM1OTQ2YWUtZDIyMS00NThkLWE3OGUtYzFkYWNmNjZiYWI4';
const PHONEPE_CLIENT_VERSION = 1;

// PhonePe Sandbox URLs (Standard Checkout API v2)
const PHONEPE_AUTH_URL = 'https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token';
const PHONEPE_PAY_URL = 'https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/pay';
const PHONEPE_STATUS_URL = 'https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/order';

export const phonepeConfig = {
  clientId: PHONEPE_CLIENT_ID,
  clientSecret: PHONEPE_CLIENT_SECRET,
  clientVersion: PHONEPE_CLIENT_VERSION,
  authUrl: PHONEPE_AUTH_URL,
  payUrl: PHONEPE_PAY_URL,
  statusUrl: PHONEPE_STATUS_URL,
  
  // Callback URLs
  redirectUrl: process.env.PHONEPE_REDIRECT_URL || 'http://localhost:5000/api/payments/phonepe/status',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
};

export default phonepeConfig;
