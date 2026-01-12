const Vote = require('../models/Vote');
const Report = require('../models/Report');
const User = require('../models/User');

// Verification score thresholds
const VERIFICATION_THRESHOLD = 10; // Positive score needed for auto-verification
const FLAG_THRESHOLD = 5; // Flags to auto-flag/hide report
const MAX_VOTING_DISTANCE_KM = 5; // Maximum distance in km to vote

// Helper function to calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance;
};

// @desc    Vote on a report (UP, DOWN, FLAG)
// @route   POST /api/votes
// @access  Private
exports.createVote = async (req, res) => {
  try {
    const { reportId, voteType, reason, userLatitude, userLongitude } = req.body;
    const userId = req.user.id;

    // Validation
    if (!reportId || !voteType) {
      return res.status(400).json({
        success: false,
        message: 'Please provide reportId and voteType'
      });
    }

    const validVoteTypes = ['UP', 'DOWN', 'FLAG'];
    if (!validVoteTypes.includes(voteType.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: `Vote type must be one of: ${validVoteTypes.join(', ')}`
      });
    }

    // Check if report exists
    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // User cannot vote on their own report
    if (report.reportedBy.toString() === userId) {
      return res.status(403).json({
        success: false,
        message: 'You cannot vote on your own report'
      });
    }

    // Check distance if user location is provided
    if (userLatitude !== undefined && userLongitude !== undefined) {
      const reportLat = report.location.coordinates[1]; // GeoJSON format: [longitude, latitude]
      const reportLng = report.location.coordinates[0];
      
      const distance = calculateDistance(userLatitude, userLongitude, reportLat, reportLng);
      
      if (distance > MAX_VOTING_DISTANCE_KM) {
        return res.status(403).json({
          success: false,
          message: `You must be within ${MAX_VOTING_DISTANCE_KM}km of the incident to vote. You are ${distance.toFixed(2)}km away.`,
          distance: distance.toFixed(2)
        });
      }
    }

    // Check if user already voted on this report
    let existingVote = await Vote.findOne({
      report: reportId,
      user: userId
    });

    if (existingVote) {
      // Update existing vote
      const oldVoteType = existingVote.voteType;
      existingVote.voteType = voteType.toUpperCase();
      existingVote.reason = reason || '';
      await existingVote.save();

      // Update report vote counts
      const voteStats = await Vote.calculateVerificationScore(reportId);
      if (voteStats && voteStats.length > 0) {
        const stats = voteStats[0];
        report.upVotes = stats.upVotes;
        report.downVotes = stats.downVotes;
        report.flags = stats.flags;
        report.verificationScore = stats.upVotes - stats.downVotes;

        // Auto-verify if score exceeds threshold
        if (report.verificationScore >= VERIFICATION_THRESHOLD && !report.verified) {
          report.verified = true;
        }

        // Auto-flag if flags exceed threshold
        if (stats.flags >= FLAG_THRESHOLD) {
          report.status = 'UNDER_REVIEW';
        }

        await report.save();
      }

      return res.status(200).json({
        success: true,
        message: 'Vote updated successfully',
        vote: existingVote,
        report: {
          verificationScore: report.verificationScore,
          verified: report.verified,
          upVotes: report.upVotes,
          downVotes: report.downVotes,
          flags: report.flags
        }
      });
    }

    // Create new vote
    const vote = await Vote.create({
      report: reportId,
      user: userId,
      voteType: voteType.toUpperCase(),
      reason: reason || ''
    });

    // Calculate new verification score
    const voteStats = await Vote.calculateVerificationScore(reportId);
    if (voteStats && voteStats.length > 0) {
      const stats = voteStats[0];
      report.upVotes = stats.upVotes;
      report.downVotes = stats.downVotes;
      report.flags = stats.flags;
      report.verificationScore = stats.upVotes - stats.downVotes;

      // Auto-verify if score exceeds threshold
      if (report.verificationScore >= VERIFICATION_THRESHOLD && !report.verified) {
        report.verified = true;
      }

      // Auto-flag if flags exceed threshold
      if (stats.flags >= FLAG_THRESHOLD) {
        report.status = 'UNDER_REVIEW';
      }

      await report.save();
    }

    res.status(201).json({
      success: true,
      message: 'Vote created successfully',
      vote,
      report: {
        verificationScore: report.verificationScore,
        verified: report.verified,
        upVotes: report.upVotes,
        downVotes: report.downVotes,
        flags: report.flags
      }
    });
  } catch (error) {
    console.error('Create Vote Error:', error);

    // Handle duplicate vote error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already voted on this report'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create vote'
    });
  }
};

// @desc    Get vote stats for a report
// @route   GET /api/votes/report/:reportId
// @access  Public
exports.getVoteStats = async (req, res) => {
  try {
    const { reportId } = req.params;

    // Check if report exists
    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Get vote statistics
    const voteStats = await Vote.getVoteStats(reportId);

    const stats = {
      upVotes: 0,
      downVotes: 0,
      flags: 0,
      totalVotes: 0,
      verificationScore: 0,
      verified: report.verified
    };

    if (voteStats[0].summary && voteStats[0].summary.length > 0) {
      const summary = voteStats[0].summary[0];
      stats.upVotes = summary.upVotes || 0;
      stats.downVotes = summary.downVotes || 0;
      stats.flags = summary.flags || 0;
      stats.totalVotes = summary.totalVotes || 0;
      stats.verificationScore = stats.upVotes - stats.downVotes;
    }

    res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get Vote Stats Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get user's vote on a report
// @route   GET /api/votes/report/:reportId/user
// @access  Private
exports.getUserVote = async (req, res) => {
  try {
    const { reportId } = req.params;
    const userId = req.user.id;

    const vote = await Vote.findOne({
      report: reportId,
      user: userId
    }).populate('user', 'name avatar');

    if (!vote) {
      return res.status(200).json({
        success: true,
        message: 'No vote found for this user on this report',
        vote: null
      });
    }

    res.status(200).json({
      success: true,
      vote
    });
  } catch (error) {
    console.error('Get User Vote Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete vote on a report
// @route   DELETE /api/votes/:reportId
// @access  Private
exports.deleteVote = async (req, res) => {
  try {
    const { reportId } = req.params;
    const userId = req.user.id;

    // Find and delete the vote
    const vote = await Vote.findOneAndDelete({
      report: reportId,
      user: userId
    });

    if (!vote) {
      return res.status(404).json({
        success: false,
        message: 'Vote not found'
      });
    }

    // Update report vote counts
    const report = await Report.findById(reportId);
    if (report) {
      const voteStats = await Vote.calculateVerificationScore(reportId);
      if (voteStats && voteStats.length > 0) {
        const stats = voteStats[0];
        report.upVotes = stats.upVotes;
        report.downVotes = stats.downVotes;
        report.flags = stats.flags;
        report.verificationScore = stats.upVotes - stats.downVotes;

        // Remove verification if score drops below threshold
        if (report.verificationScore < VERIFICATION_THRESHOLD) {
          report.verified = false;
        }

        await report.save();
      } else {
        // No votes left, reset counts
        report.upVotes = 0;
        report.downVotes = 0;
        report.flags = 0;
        report.verificationScore = 0;
        report.verified = false;
        await report.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Vote deleted successfully',
      report: {
        verificationScore: report?.verificationScore || 0,
        verified: report?.verified || false,
        upVotes: report?.upVotes || 0,
        downVotes: report?.downVotes || 0,
        flags: report?.flags || 0
      }
    });
  } catch (error) {
    console.error('Delete Vote Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get top voted reports
// @route   GET /api/votes/top
// @access  Public
exports.getTopVotedReports = async (req, res) => {
  try {
    const { limit = 20, minVotes = 5 } = req.query;

    const topReports = await Report.find({
      totalVotes: { $gte: minVotes }
    })
      .select('title category verificationScore upVotes downVotes flags verified location')
      .sort({ verificationScore: -1, upVotes: -1 })
      .limit(parseInt(limit))
      .populate('reportedBy', 'name avatar');

    res.status(200).json({
      success: true,
      count: topReports.length,
      reports: topReports
    });
  } catch (error) {
    console.error('Get Top Voted Reports Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get user's votes
// @route   GET /api/votes/user
// @access  Private
exports.getUserVotes = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, page = 1 } = req.query;

    const skip = (page - 1) * limit;

    const votes = await Vote.find({ user: userId })
      .populate('report', 'title category status')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Vote.countDocuments({ user: userId });

    res.status(200).json({
      success: true,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      votes
    });
  } catch (error) {
    console.error('Get User Votes Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
