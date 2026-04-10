const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Detects spam in a review based on:
 * 1. Same user posting multiple reviews for the same hostel/PG within 30 days
 * 2. Many posts about the same hostel in last 7 days (promo flooding)
 * 3. Brand new account (< 3 days old) with very first post
 * 4. Rule-based content pre-check (phone numbers, links, promo keywords)
 * 5. AI content analysis via Gemini 2.0 Flash (free tier)
 */
async function detectSpam(review, user, Review) {
  let spamScore = 0;
  const spamReasons = [];

  try {
    // ---------------------------------------------------------------
    // Signal 1: Same user already reviewed the same hostel/PG
    // recently (within 30 days) — avoids penalizing old follow-ups
    // ---------------------------------------------------------------
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentDuplicate = await Review.countDocuments({
      user: user.id || user._id,
      name: { $regex: new RegExp(`^${escapeRegex(review.name)}$`, "i") },
      _id: { $ne: review._id },
      createdAt: { $gte: thirtyDaysAgo },
    });

    if (recentDuplicate >= 1) {
      spamScore += 40;
      spamReasons.push(
        `Same user posted ${recentDuplicate + 1} reviews for "${review.name}" within 30 days`
      );
    }

    // ---------------------------------------------------------------
    // Signal 2: 5+ posts about same hostel within last 7 days
    // ---------------------------------------------------------------
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const hostelFloodCount = await Review.countDocuments({
      name: { $regex: new RegExp(escapeRegex(review.name), "i") },
      createdAt: { $gte: sevenDaysAgo },
    });

    if (hostelFloodCount >= 5) {
      spamScore += 20;
      spamReasons.push(
        `${hostelFloodCount} posts about "${review.name}" in the last 7 days (possible promo flooding)`
      );
    }

    // ---------------------------------------------------------------
    // Signal 3: Brand new account (< 3 days) with first post
    // FIX: user.createdAt may not exist in JWT payload — handle safely
    // ---------------------------------------------------------------
    if (user.createdAt) {
      const accountAgeDays =
        (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      const userTotalPosts = await Review.countDocuments({
        user: user.id || user._id,
      });

      if (accountAgeDays < 3 && userTotalPosts <= 1) {
        spamScore += 25;
        spamReasons.push(
          `Account is only ${Math.floor(accountAgeDays)} day(s) old with a single post`
        );
      }
    }

    // ---------------------------------------------------------------
    // Signal 4: Rule-based content pre-check (fast, no API needed)
    // Catches obvious spam before wasting an AI call
    // ---------------------------------------------------------------
    const ruleResult = ruleBasedCheck(review);
    if (ruleResult.flagged) {
      spamScore += ruleResult.score;
      spamReasons.push(...ruleResult.reasons);
    }

    // ---------------------------------------------------------------
    // Signal 5: AI content analysis via Gemini
    // FIX: raised confidence ceiling to 60 so AI alone CAN flag spam
    // FIX: passes all review fields, not just name + reviewText
    // ---------------------------------------------------------------
    const aiResult = await analyzeWithGemini(review);
    if (aiResult.isSpam) {
      spamScore += aiResult.confidence;
      spamReasons.push(`AI flagged: ${aiResult.reason}`);
    }

  } catch (err) {
    console.error("detectSpam error:", err.message);
  }

  return {
    isSpam: spamScore >= 60,
    spamScore,
    spamReasons,
  };
}

/**
 * Fast rule-based check — runs before AI to catch obvious spam
 * and reduce unnecessary Gemini API calls.
 */
function ruleBasedCheck(review) {
  const reasons = [];
  let score = 0;
  const text = `${review.name} ${review.reviewText} ${review.location}`.toLowerCase();

  // Phone numbers (Indian + international formats)
  const phoneRegex = /(\+91[\s-]?)?[6-9]\d{9}|(\+\d{1,3}[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/;
  if (phoneRegex.test(text)) {
    score += 35;
    reasons.push("Contains phone number — likely promotional content");
  }

  // WhatsApp / external links
  const linkRegex = /whatsapp|wa\.me|bit\.ly|tinyurl|http[s]?:\/\/(?!staystory)/i;
  if (linkRegex.test(text)) {
    score += 30;
    reasons.push("Contains external link or WhatsApp reference");
  }

  // Promotional / ad keywords
  const promoKeywords = [
    "call now", "contact us", "book now", "best hostel", "affordable",
    "limited seats", "hurry", "offer", "discount", "starting from ₹",
    "enquire now", "visit us", "dm for details", "slots available",
    "no brokerage", "zero brokerage", "newly launched", "prime location",
    "fully furnished", "available immediately", "call for booking",
  ];
  const matchedKeywords = promoKeywords.filter((kw) => text.includes(kw));
  if (matchedKeywords.length >= 2) {
    score += 20;
    reasons.push(`Promotional language detected: "${matchedKeywords.slice(0, 3).join('", "')}"`);
  }

  // Suspiciously short review (less than 15 words)
  const wordCount = review.reviewText?.trim().split(/\s+/).length || 0;
  if (wordCount < 15) {
    score += 10;
    reasons.push(`Very short review (${wordCount} words) with minimal personal detail`);
  }

  // All-caps shouting
  const capsRatio = (review.reviewText?.match(/[A-Z]/g) || []).length /
    (review.reviewText?.length || 1);
  if (capsRatio > 0.5 && review.reviewText?.length > 20) {
    score += 10;
    reasons.push("Excessive use of capital letters — common in ads");
  }

  return { flagged: score > 0, score, reasons };
}

/**
 * Uses Google Gemini 2.0 Flash (free tier) to analyse review content.
 * FIX: uses all review fields for richer context
 * FIX: robust JSON extraction that handles markdown fences + extra text
 * FIX: confidence ceiling raised to 60 so AI can independently flag spam
 */
async function analyzeWithGemini(review) {
  try {
    // BUG FIX: was "gemini-1.5-flash" — updated to current free model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `You are a spam detection system for StayStory — a platform where real tenants share honest reviews of hostels, PGs, and flats in India.

Analyze this review submission and determine if it is SPAM or a GENUINE tenant experience.

=== REVIEW DETAILS ===
Stay Name: "${review.name}"
Location: "${review.location}"
Room Type: "${review.roomType || "Not specified"}"
Price Range: "${review.priceRange || "Not specified"}"
Overall Rating: ${review.rating}/5
Facilities Claimed: ${(review.facilities || []).join(", ") || "None"}
Cleanliness Rating: ${review.facilitiesRating?.cleanliness || "N/A"}/5
Food Rating: ${review.facilitiesRating?.food || "N/A"}/5
Security Rating: ${review.facilitiesRating?.security || "N/A"}/5
Internet Rating: ${review.facilitiesRating?.internet || "N/A"}/5
Review Text: "${review.reviewText}"
======================

Mark as SPAM (isSpam: true) if ANY of these apply:
1. Sounds written by the owner/manager, not a real tenant (uses "we offer", "our facility", "contact us")
2. Has no specific personal experience (no mention of personal incidents, duration of stay, personal observations)
3. Contains phone numbers, WhatsApp, email, or external URLs
4. Unrealistically perfect across ALL dimensions — every rating is 5/5 with zero criticism
5. Feels like marketing copy — keyword-stuffed, uses SEO phrases, reads like a brochure
6. A targeted attack — nothing but extreme negativity with no specific factual details
7. All facility ratings are identical/suspiciously uniform (e.g., all exactly 4.5)

Mark as GENUINE (isSpam: false) if:
- It shares specific personal observations, even if mostly positive or mostly negative
- It mentions concrete details (move-in experience, specific issues, interactions with staff/owner)
- The tone is conversational, not marketing-copy

Respond ONLY with a valid JSON object. No markdown, no explanation outside the JSON:
{"isSpam": true or false, "confidence": a number from 0 to 60, "reason": "one concise sentence explaining the decision"}`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text();

    // FIX: robust extraction — finds JSON even if Gemini wraps in markdown
    const jsonMatch = raw.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) throw new Error(`No JSON found in Gemini response: ${raw}`);

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate shape to avoid crashes downstream
    return {
      isSpam: Boolean(parsed.isSpam),
      confidence: Math.min(60, Math.max(0, Number(parsed.confidence) || 0)),
      reason: String(parsed.reason || "No reason provided"),
    };

  } catch (err) {
    console.error("Gemini analysis failed:", err.message);
    // If AI fails, skip gracefully — don't block the review
    return { isSpam: false, confidence: 0, reason: "AI check skipped due to error" };
  }
}

/**
 * Escapes special regex characters in hostel names
 * Prevents crashes if name contains characters like "(" or "+"
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = { detectSpam };