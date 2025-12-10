/**
 * Temporal Context Detection Service
 *
 * Detects when users are talking about past days and calculates
 * the effective date for entry attribution.
 *
 * Examples:
 * - "Yesterday was rough" -> effectiveDate = today - 1
 * - "Last night I couldn't sleep" -> effectiveDate = previous night
 * - "The Monday meeting went well" -> effectiveDate = most recent Monday
 */

import { callGemini } from '../ai/gemini';

/**
 * Temporal expression patterns for quick pre-screening
 */
const TEMPORAL_PATTERNS = [
  // Relative days
  /\byesterday\b/i,
  /\blast night\b/i,
  /\bthe night before\b/i,
  /\btwo days ago\b/i,
  /\bthree days ago\b/i,
  /\ba few days ago\b/i,
  /\bthe other day\b/i,
  /\bearlier today\b/i,
  /\bthis morning\b/i,
  /\btonight\b/i,
  /\blast week\b/i,

  // Day names (when talking about past)
  /\bon (monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
  /\blast (monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
  /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday) (night|morning|afternoon|evening)\b/i,

  // Time expressions
  /\blast (morning|afternoon|evening)\b/i,
  /\bthe past (few|couple) days\b/i,

  // Retrospective language
  /\bwas feeling\b/i,
  /\bfelt (so |really |very )?(good|bad|anxious|stressed|happy|sad|tired)\b/i,
  /\bhad a (good|bad|rough|tough|great|terrible)\b/i,
  /\bwent (well|badly|great|terrible)\b/i,
];

/**
 * Quick check if text likely contains temporal references
 * Used to avoid unnecessary AI calls
 */
export const hasTemporalIndicators = (text) => {
  return TEMPORAL_PATTERNS.some(pattern => pattern.test(text));
};

/**
 * Calculate the target date from a temporal reference
 */
const calculateTargetDate = (reference, currentDate = new Date()) => {
  const today = new Date(currentDate);
  today.setHours(12, 0, 0, 0); // Normalize to noon

  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDay = today.getDay();
  const currentHour = currentDate.getHours();

  switch (reference.toLowerCase()) {
    case 'yesterday':
      return new Date(today.setDate(today.getDate() - 1));

    case 'last_night': {
      // If it's before 6am, "last night" means the night that just passed (same calendar day)
      // Otherwise, it means yesterday night
      if (currentHour < 6) {
        return new Date(today); // Same day, treat as today
      }
      return new Date(today.setDate(today.getDate() - 1));
    }

    case 'two_days_ago':
      return new Date(today.setDate(today.getDate() - 2));

    case 'three_days_ago':
      return new Date(today.setDate(today.getDate() - 3));

    case 'this_morning': {
      // If it's still morning, this is today
      // If it's afternoon/evening, this is also today but emphasizes morning
      return new Date(today);
    }

    case 'earlier_today':
      return new Date(today);

    case 'last_week':
      return new Date(today.setDate(today.getDate() - 7));

    default: {
      // Check for day names: "monday", "last_monday", etc.
      const dayMatch = reference.toLowerCase().match(/(?:last_)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/);
      if (dayMatch) {
        const targetDayName = dayMatch[1];
        const targetDay = dayNames.indexOf(targetDayName);

        if (targetDay !== -1) {
          let daysBack = currentDay - targetDay;
          if (daysBack <= 0) daysBack += 7; // Go back to previous week

          // If "last_" prefix, go back an additional week
          if (reference.toLowerCase().startsWith('last_')) {
            daysBack += 7;
          }

          return new Date(today.setDate(today.getDate() - daysBack));
        }
      }

      return null; // Unknown reference
    }
  }
};

/**
 * Use AI to detect temporal context in entry text
 */
export const detectTemporalContext = async (text, currentDate = new Date()) => {
  // Quick pre-screen - if no temporal indicators, skip AI call
  if (!hasTemporalIndicators(text)) {
    return {
      detected: false,
      effectiveDate: currentDate,
      confidence: 0,
      reference: null,
      originalPhrase: null
    };
  }

  const currentDateStr = currentDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const currentHour = currentDate.getHours();
  const timeOfDay = currentHour < 12 ? 'morning' : currentHour < 17 ? 'afternoon' : 'evening';

  const prompt = `Analyze this journal entry for temporal references. The user is writing NOW on ${currentDateStr} (${timeOfDay}).

ENTRY:
"${text}"

Determine if the user is describing events/feelings from a DIFFERENT day than today.

Return JSON:
{
  "is_about_different_day": boolean,
  "temporal_reference": "yesterday" | "last_night" | "two_days_ago" | "three_days_ago" | "this_morning" | "earlier_today" | "last_week" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday" | "last_monday" | "last_tuesday" | etc. | null,
  "original_phrase": "the exact phrase that indicates the time" | null,
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation"
}

Rules:
- "yesterday" = the calendar day before today
- "last night" = if it's early morning (before 6am), could mean tonight just passed; otherwise yesterday evening
- Day names without "last" = most recent occurrence of that day (could be this week)
- Day names with "last" = previous week's occurrence
- Present tense ("I feel tired") = today, not a different day
- Past tense alone is NOT enough - need explicit time reference
- If ambiguous, set confidence lower (0.4-0.6)
- "this morning" when it's still morning = today (not different day)
- Generic reflections ("lately", "recently", "this week") = NOT a specific different day

Examples:
- "Yesterday I had a great workout" -> yesterday, high confidence
- "I feel anxious about tomorrow" -> NOT different day (talking about future)
- "The meeting on Monday went well" -> monday, medium confidence (which Monday?)
- "I've been feeling tired lately" -> NOT different day (no specific date)
- "Last night I couldn't sleep" -> last_night, high confidence`;

  try {
    const raw = await callGemini(prompt, '', 'gemini-2.0-flash');
    if (!raw) {
      return {
        detected: false,
        effectiveDate: currentDate,
        confidence: 0,
        reference: null,
        originalPhrase: null
      };
    }

    const jsonStr = raw.replace(/```json|```/g, '').trim();
    const result = JSON.parse(jsonStr);

    if (!result.is_about_different_day || !result.temporal_reference) {
      return {
        detected: false,
        effectiveDate: currentDate,
        confidence: result.confidence || 0,
        reference: null,
        originalPhrase: result.original_phrase
      };
    }

    // Calculate the actual target date
    const targetDate = calculateTargetDate(result.temporal_reference, currentDate);

    if (!targetDate) {
      return {
        detected: false,
        effectiveDate: currentDate,
        confidence: 0.3,
        reference: result.temporal_reference,
        originalPhrase: result.original_phrase,
        reasoning: 'Could not calculate target date'
      };
    }

    return {
      detected: true,
      effectiveDate: targetDate,
      confidence: result.confidence || 0.7,
      reference: result.temporal_reference,
      originalPhrase: result.original_phrase,
      reasoning: result.reasoning
    };

  } catch (e) {
    console.error('detectTemporalContext error:', e);
    return {
      detected: false,
      effectiveDate: currentDate,
      confidence: 0,
      reference: null,
      originalPhrase: null,
      error: e.message
    };
  }
};

/**
 * Format a date for display in confirmation UI
 */
export const formatEffectiveDate = (date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  const diffDays = Math.round((today - targetDate) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays === 2) return '2 days ago';
  if (diffDays < 7) return `${diffDays} days ago`;

  return targetDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Determine if user confirmation is needed based on confidence
 */
export const needsConfirmation = (temporalResult) => {
  if (!temporalResult.detected) return false;

  // High confidence (>0.8) - auto-apply
  if (temporalResult.confidence > 0.8) return false;

  // Medium confidence (0.5-0.8) - ask user
  if (temporalResult.confidence >= 0.5) return true;

  // Low confidence (<0.5) - don't apply, don't ask
  return false;
};

export default {
  detectTemporalContext,
  hasTemporalIndicators,
  formatEffectiveDate,
  needsConfirmation
};
