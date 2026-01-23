import Quiz from '../models/Quiz.js';
import axios from 'axios';

// Generate quiz using LLM API
export const generateQuiz = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { questionCount = 5, difficulty = 'medium' } = req.body;

    // Find video and get transcript
    const Video = (await import('../models/Video.js')).default;
    const video = await Video.findById(videoId);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found',
        error: 'NOT_FOUND',
      });
    }

    if (!video.transcript) {
      return res.status(400).json({
        success: false,
        message: 'Video has no transcript',
        error: 'VALIDATION_ERROR',
      });
    }

    // Check if quiz already exists
    let quiz = await Quiz.findOne({ video: videoId });
    if (quiz) {
      return res.json({
        success: true,
        message: 'Quiz already exists',
        quiz,
      });
    }

    // Generate questions using LLM (placeholder for actual API call)
    const questions = generateMockQuestions(video.transcript, questionCount, difficulty);

    // Save quiz
    quiz = new Quiz({
      video: videoId,
      course: video.course,
      questions,
      isApproved: false,
    });

    await quiz.save();

    res.status(201).json({
      success: true,
      message: 'Quiz generated successfully',
      quiz,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'SERVER_ERROR',
    });
  }
};

// Mock function - replace with actual LLM API call
const generateMockQuestions = (transcript, count, difficulty) => {
  const questions = [];
  const keywords = transcript.split(' ').slice(0, 20);

  for (let i = 0; i < count; i++) {
    questions.push({
      type: i % 2 === 0 ? 'mcq' : 'short_answer',
      question: `Question ${i + 1}: What is the main concept discussed in this video?`,
      options: i % 2 === 0 ? ['Option A', 'Option B', 'Option C', 'Option D'] : [],
      correctAnswer: i % 2 === 0 ? 'Option A' : 'Concept explanation',
      explanation: 'This is explained in the video content.',
      difficulty,
    });
  }

  return questions;
};

export const getQuiz = async (req, res) => {
  try {
    const { videoId } = req.params;

    const quiz = await Quiz.findOne({ video: videoId });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found',
        error: 'NOT_FOUND',
      });
    }

    res.json({
      success: true,
      quiz,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'SERVER_ERROR',
    });
  }
};

export const submitQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { answers } = req.body;

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: 'Answers array is required',
        error: 'VALIDATION_ERROR',
      });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found',
        error: 'NOT_FOUND',
      });
    }

    // Calculate score
    let score = 0;
    const feedback = quiz.questions.map((q, idx) => ({
      questionId: q.questionId,
      isCorrect: q.correctAnswer === answers[idx],
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
    }));

    score = feedback.filter((f) => f.isCorrect).length;
    const percentage = (score / quiz.questions.length) * 100;

    // Record attempt
    const attempt = {
      student: req.user.userId,
      answers,
      score: percentage,
      completedAt: new Date(),
    };

    quiz.attempts.push(attempt);
    await quiz.save();

    res.json({
      success: true,
      message: 'Quiz submitted successfully',
      score: percentage,
      feedback,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'SERVER_ERROR',
    });
  }
};

export const approveQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndUpdate(
      req.params.quizId,
      {
        isApproved: true,
        approvedBy: req.user.userId,
      },
      { new: true }
    );

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found',
        error: 'NOT_FOUND',
      });
    }

    res.json({
      success: true,
      message: 'Quiz approved',
      quiz,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'SERVER_ERROR',
    });
  }
};
