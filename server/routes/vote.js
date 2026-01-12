const express = require('express');
const router = express.Router();
const {
  createVote,
  getVoteStats,
  getUserVote,
  deleteVote,
  getTopVotedReports,
  getUserVotes
} = require('../controller/vote');
const { protect } = require('../middleware/auth');

// Public routes
router.get('/top', getTopVotedReports);
router.get('/report/:reportId', getVoteStats);

// Protected routes (authenticated users only)
router.post('/', protect, createVote);
router.get('/report/:reportId/user', protect, getUserVote);
router.delete('/:reportId', protect, deleteVote);
router.get('/user/votes', protect, getUserVotes);

module.exports = router;
