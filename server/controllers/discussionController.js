import Discussion from '../models/Discussion.js';
import Credits from '../models/Credits.js';

export const createDiscussion = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, question } = req.body;

    if (!title || !question) {
      return res.status(400).json({
        success: false,
        message: 'Title and question are required',
        error: 'VALIDATION_ERROR',
      });
    }

    const discussion = new Discussion({
      course: courseId,
      student: req.user.userId,
      title,
      question,
    });

    await discussion.save();
    await discussion.populate('student', 'name email profilePicture');

    res.status(201).json({
      success: true,
      message: 'Discussion created successfully',
      discussion,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'SERVER_ERROR',
    });
  }
};

export const getDiscussions = async (req, res) => {
  try {
    const { courseId } = req.params;

    const discussions = await Discussion.find({ course: courseId })
      .populate('student', 'name email profilePicture')
      .sort('-createdAt');

    res.json({
      success: true,
      discussions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'SERVER_ERROR',
    });
  }
};

export const getDiscussionById = async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.discussionId)
      .populate('student', 'name email profilePicture')
      .populate('replies.author', 'name email profilePicture');

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: 'Discussion not found',
        error: 'NOT_FOUND',
      });
    }

    // Increment views
    discussion.views += 1;
    await discussion.save();

    res.json({
      success: true,
      discussion,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'SERVER_ERROR',
    });
  }
};

export const addReply = async (req, res) => {
  try {
    const { content } = req.body;
    const { discussionId } = req.params;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Reply content is required',
        error: 'VALIDATION_ERROR',
      });
    }

    const discussion = await Discussion.findById(discussionId);
    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: 'Discussion not found',
        error: 'NOT_FOUND',
      });
    }

    const reply = {
      replyId: new (require('mongoose')).Types.ObjectId(),
      author: req.user.userId,
      content,
      upvotes: 0,
      isPinned: false,
      createdAt: new Date(),
    };

    discussion.replies.push(reply);
    await discussion.save();

    // Award credits to replier (1 credit per reply)
    const credits = await Credits.findOne({ student: req.user.userId });
    if (credits) {
      credits.balance += 1;
      credits.transactions.push({
        type: 'earned',
        amount: 1,
        reason: 'Replied to discussion',
        relatedId: discussionId,
      });
      await credits.save();
    }

    res.status(201).json({
      success: true,
      message: 'Reply added successfully',
      reply,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'SERVER_ERROR',
    });
  }
};

export const upvoteDiscussion = async (req, res) => {
  try {
    const discussion = await Discussion.findByIdAndUpdate(
      req.params.discussionId,
      { $inc: { upvotes: 1 } },
      { new: true }
    );

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: 'Discussion not found',
        error: 'NOT_FOUND',
      });
    }

    res.json({
      success: true,
      message: 'Discussion upvoted',
      discussion,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'SERVER_ERROR',
    });
  }
};

export const pinReply = async (req, res) => {
  try {
    const { discussionId, replyId } = req.params;

    const discussion = await Discussion.findById(discussionId);
    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: 'Discussion not found',
        error: 'NOT_FOUND',
      });
    }

    const reply = discussion.replies.id(replyId);
    if (!reply) {
      return res.status(404).json({
        success: false,
        message: 'Reply not found',
        error: 'NOT_FOUND',
      });
    }

    reply.isPinned = !reply.isPinned;
    await discussion.save();

    res.json({
      success: true,
      message: reply.isPinned ? 'Reply pinned' : 'Reply unpinned',
      discussion,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'SERVER_ERROR',
    });
  }
};
