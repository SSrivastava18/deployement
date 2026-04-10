const express = require("express");
const router = express.Router();
const {
  checkStorySpam,
  getSpamStories,
  clearSpam,
} = require("../controllers/spamController");

// GET  /api/spam           → list all spam stories
// POST /api/spam/check/:id → run spam check on a story
// PUT  /api/spam/clear/:id → clear spam flag from a story

router.get("/", getSpamStories);
router.post("/check/:id", checkStorySpam);
router.put("/clear/:id", clearSpam);

module.exports = router;