import React, { createContext, useState, useContext } from 'react';

const CourseContext = createContext();

export const useCourse = () => {
  const context = useContext(CourseContext);
  if (!context) {
    throw new Error('useCourse must be used within CourseProvider');
  }
  return context;
};

export const CourseProvider = ({ children }) => {
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(false);

  const value = {
    courses,
    setCourses,
    enrollments,
    setEnrollments,
    loading,
    setLoading,
  };

  return <CourseContext.Provider value={value}>{children}</CourseContext.Provider>;
};
