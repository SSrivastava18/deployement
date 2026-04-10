const Review = require("../models/reviewModel"); // ✅ FIXED: was ../models/Story
const { detectSpam } = require("../services/spamDetector");

// Manually trigger spam check on a story (admin use)
const checkStorySpam = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id).populate("user");
    if (!review) return res.status(404).json({ message: "Review not found" });

    const result = await detectSpam(review, review.user, Review);

    review.isSpam = result.isSpam;
    review.spamScore = result.spamScore;
    review.spamReasons = result.spamReasons;
    review.spamCheckedAt = new Date();
    await review.save();

    res.status(200).json({
      message: "Spam check complete",
      reviewId: review._id,
      ...result,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all spam reviews
const getSpamStories = async (req, res) => {
  try {
    const spamReviews = await Review.find({ isSpam: true })
      .populate("user", "name email")
      .sort({ spamScore: -1 });

    res.status(200).json(spamReviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Clear spam flag (admin override)
const clearSpam = async (req, res) => {
  try {
    await Review.findByIdAndUpdate(req.params.id, {
      isSpam: false,
      spamScore: 0,
      spamReasons: [],
    });
    res.status(200).json({ message: "Review cleared from spam" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { checkStorySpam, getSpamStories, clearSpam };