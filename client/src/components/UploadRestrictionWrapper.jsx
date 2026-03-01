import React from 'react';
import { canUploadContent, getUploadRestrictionMessage } from '../utils/courseUtils';

/**
 * Wrapper component that shows upload UI only if course hasn't started
 * @param {Object} props
 * @param {string|Date} props.courseStartDate - The course start date
 * @param {React.ReactNode} props.children - The upload UI to render
 */
const UploadRestrictionWrapper = ({ courseStartDate, children }) => {
  const isUploadAllowed = canUploadContent(courseStartDate);

  if (!isUploadAllowed) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center">
          <svg
            className="w-5 h-5 text-yellow-600 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span className="text-yellow-800 font-medium">
            {getUploadRestrictionMessage(courseStartDate)}
          </span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default UploadRestrictionWrapper;
