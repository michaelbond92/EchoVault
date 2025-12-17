import { GEMINI_API_KEY, AI_CONFIG } from '../../config';

// Timeout duration for API calls (30 seconds)
const API_TIMEOUT_MS = 30000;

/**
 * Wraps a promise with a timeout
 */
const withTimeout = (promise, timeoutMs) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('API call timeout')), timeoutMs)
    )
  ]);
};

/**
 * Call the Gemini API with a system prompt and user prompt
 */
export const callGemini = async (systemPrompt, userPrompt, model = AI_CONFIG.analysis.primary) => {
  try {
    const res = await withTimeout(
      fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: userPrompt }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] }
        })
      }),
      API_TIMEOUT_MS
    );

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error('Gemini API error:', res.status, errorData);
      return null;
    }

    const data = await res.json();
    const result = data.candidates?.[0]?.content?.parts?.[0]?.text || null;

    if (!result) {
      console.error('Gemini API returned no content:', data);
    }

    return result;
  } catch (e) {
    console.error('Gemini API exception:', e);
    return null;
  }
};
