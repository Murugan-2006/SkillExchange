import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function CertificatePage({ certificateNumber }) {
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    verifyCertificate();
  }, [certificateNumber]);

  const verifyCertificate = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/certificates/verify/${certificateNumber}`
      );
      setCertificate(response.data);
    } catch (error) {
      console.error('Error verifying certificate:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Verifying certificate...</div>;
  }

  if (!certificate || !certificate.isValid) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <h1 className="text-3xl font-bold text-red-600 mb-4">Certificate Not Found</h1>
        <p className="text-gray-600">
          This certificate could not be verified. Please check the URL.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg shadow-lg p-8 text-center">
        {/* Certificate Header */}
        <h1 className="text-4xl font-bold text-blue-600 mb-2">Certificate of Completion</h1>
        <div className="w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600 my-4"></div>

        {/* Certificate Content */}
        <div className="bg-white rounded-lg p-8 my-6 shadow-md">
          <p className="text-gray-600 text-lg mb-4">This is to certify that</p>

          <h2 className="text-4xl font-bold text-gray-800 my-6">
            {certificate.student}
          </h2>

          <p className="text-gray-600 text-lg mb-4">has successfully completed the course</p>

          <h3 className="text-2xl font-semibold text-blue-600 mb-6">
            {certificate.course}
          </h3>

          {certificate.skills && certificate.skills.length > 0 && (
            <div className="mb-6">
              <p className="text-gray-600 mb-3">Skills Acquired:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {certificate.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          <p className="text-gray-500 text-sm mt-8">
            Issued: {new Date(certificate.issuedAt).toLocaleDateString()}
          </p>
          <p className="text-gray-500 text-sm">
            Certificate ID: {certificate.certificateNumber}
          </p>
        </div>

        {/* Verification Badge */}
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 border-2 border-green-600 rounded-full p-4">
            <p className="text-green-600 font-bold text-lg">✓ VERIFIED</p>
          </div>
        </div>

        <p className="text-gray-600 text-sm">
          Verified {certificate.verificationCount} times
        </p>
      </div>
    </div>
  );
}
