import express from 'express';
import {
  createDiscussion,
  getDiscussions,
  getDiscussionById,
  addReply,
  upvoteDiscussion,
  pinReply,
} from '../controllers/discussionController.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/:courseId/discussions', authMiddleware, createDiscussion);
router.get('/:courseId/discussions', getDiscussions);
router.get('/discussion/:discussionId', getDiscussionById);
router.post('/discussion/:discussionId/replies', authMiddleware, addReply);
router.put('/discussion/:discussionId/upvote', authMiddleware, upvoteDiscussion);
router.put(
  '/discussion/:discussionId/replies/:replyId/pin',
  authMiddleware,
  adminMiddleware,
  pinReply
);

export default router;
