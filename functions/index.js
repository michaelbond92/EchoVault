import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';

// Define secrets (set these with: firebase functions:secrets:set SECRET_NAME)
const geminiApiKey = defineSecret('GEMINI_API_KEY');
const openaiApiKey = defineSecret('OPENAI_API_KEY');

// AI Model Configuration
const AI_CONFIG = {
  classification: { primary: 'gemini-1.5-flash', fallback: 'gpt-4o-mini' },
  analysis: { primary: 'gemini-2.0-flash', fallback: 'gpt-4o' },
  chat: { primary: 'gpt-4o-mini', fallback: 'gemini-1.5-flash' },
  embedding: { primary: 'text-embedding-004', fallback: null },
  transcription: { primary: 'whisper-1', fallback: null }
};

/**
 * Call the Gemini API
 */
async function callGemini(apiKey, systemPrompt, userPrompt, model = AI_CONFIG.analysis.primary) {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: userPrompt }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] }
      })
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error('Gemini API error:', res.status, errorData);
      return null;
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (e) {
    console.error('Gemini API exception:', e);
    return null;
  }
}

/**
 * Call the OpenAI GPT API
 */
async function callOpenAI(apiKey, systemPrompt, userPrompt) {
  try {
    if (!apiKey) {
      console.error('OpenAI API key not configured');
      return null;
    }

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error('OpenAI API error:', res.status, errorData);
      return null;
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (e) {
    console.error('OpenAI API exception:', e);
    return null;
  }
}

/**
 * Classify entry into type: task, mixed, reflection, or vent
 */
async function classifyEntry(apiKey, text) {
  const prompt = `
    Classify this journal entry into ONE of these types:
    - "task": Pure task/todo list, no emotional content (e.g., "Need to buy groceries, call mom")
    - "mixed": Contains both tasks AND emotional reflection (e.g., "Feeling stressed about the deadline, need to finish report")
    - "reflection": Emotional processing, self-reflection, no tasks (e.g., "I've been thinking about my relationship...")
    - "vent": Emotional release, dysregulated state, needs validation not advice (e.g., "I can't take this anymore, everything is falling apart")

    Return JSON only:
    {
      "entry_type": "task" | "mixed" | "reflection" | "vent",
      "confidence": 0.0-1.0,
      "extracted_tasks": [{ "text": "Buy milk", "completed": false }]
    }

    TASK EXTRACTION RULES (only for task/mixed types):
    - Extract ONLY explicit tasks/to-dos
    - Keep text concise (verb + object)
    - SKIP vague intentions ("I should exercise more" → NOT a task)
    - SKIP emotional statements ("I need to feel better" → NOT a task)
    - If no clear tasks, return empty array
  `;

  try {
    const raw = await callGemini(apiKey, prompt, text, AI_CONFIG.classification.primary);
    if (!raw) {
      return { entry_type: 'reflection', confidence: 0.5, extracted_tasks: [] };
    }

    const jsonStr = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(jsonStr);

    return {
      entry_type: parsed.entry_type || 'reflection',
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
      extracted_tasks: Array.isArray(parsed.extracted_tasks) ? parsed.extracted_tasks : []
    };
  } catch (e) {
    console.error('classifyEntry error:', e);
    return { entry_type: 'reflection', confidence: 0.5, extracted_tasks: [] };
  }
}

/**
 * Analyze entry and route to appropriate therapeutic framework
 */
async function analyzeEntry(apiKey, text, entryType = 'reflection') {
  if (entryType === 'task') {
    return {
      title: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
      tags: ['task'],
      mood_score: null,
      framework: 'general',
      entry_type: 'task'
    };
  }

  if (entryType === 'vent') {
    const currentHour = new Date().getHours();
    const isLateNight = currentHour >= 22 || currentHour < 5;

    const ventPrompt = `
      This person is venting and needs validation, NOT advice.
      ${isLateNight ? 'CONTEXT: It is late night/early morning. Favor gentle, sleep-compatible techniques.' : ''}

      CRITICAL RULES:
      - DO NOT challenge their thoughts
      - DO NOT offer solutions or advice
      - DO NOT minimize ("at least...", "it could be worse...")
      - DO NOT use "have you considered..."

      Goal: Lower physiological arousal through validation and grounding.

      COOLDOWN TECHNIQUES (choose the most appropriate):
      - "grounding": 5-4-3-2-1 senses, name objects in room, feel feet on floor
      - "breathing": Box breathing, 4-7-8 technique, slow exhales
      - "sensory": Cold water on wrists, hold ice, splash face
      - "movement": Shake hands vigorously, walk to another room, stretch
      - "temperature": Hold something cold, step outside briefly, cool washcloth
      - "bilateral": Tap alternating knees, cross-body movements, butterfly hug
      - "vocalization": Hum, sigh loudly, low "voo" sound, humming exhale
      ${isLateNight ? '(Prefer: breathing, grounding, bilateral, vocalization - avoid movement/temperature at night)' : ''}

      Return JSON:
      {
        "title": "Short empathetic title (max 6 words)",
        "tags": ["Tag1", "Tag2"],
        "mood_score": 0.0-1.0 (0.0=very distressed, 1.0=calm),
        "validation": "A warm, empathetic validation of their feelings (2-3 sentences)",
        "cooldown": {
          "technique": "grounding" | "breathing" | "sensory" | "movement" | "temperature" | "bilateral" | "vocalization",
          "instruction": "Simple 1-2 sentence instruction appropriate for ${isLateNight ? 'late night' : 'this time of day'}"
        }
      }
    `;

    try {
      const raw = await callGemini(apiKey, ventPrompt, text);
      if (!raw) {
        return {
          title: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
          tags: [],
          mood_score: 0.3,
          framework: 'support',
          entry_type: 'vent'
        };
      }

      const jsonStr = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(jsonStr);

      return {
        title: parsed.title || text.substring(0, 50) + (text.length > 50 ? '...' : ''),
        tags: Array.isArray(parsed.tags) ? parsed.tags : [],
        mood_score: typeof parsed.mood_score === 'number' ? parsed.mood_score : 0.3,
        framework: 'support',
        entry_type: 'vent',
        vent_support: {
          validation: parsed.validation || "It's okay to feel this way. Your feelings are valid.",
          cooldown: parsed.cooldown || { technique: 'breathing', instruction: 'Take a slow, deep breath.' }
        }
      };
    } catch (e) {
      console.error('analyzeEntry (vent) error:', e);
      return {
        title: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
        tags: [],
        mood_score: 0.3,
        framework: 'support',
        entry_type: 'vent'
      };
    }
  }

  const currentHour = new Date().getHours();
  const timeContext = currentHour >= 22 || currentHour < 5 ? 'late_night'
    : currentHour < 12 ? 'morning'
    : currentHour < 17 ? 'afternoon'
    : 'evening';

  const prompt = `
    Analyze this journal entry and route to the appropriate therapeutic framework.

    CONTEXT: Entry submitted during ${timeContext} (${currentHour}:00)
    ${entryType === 'mixed' ? 'NOTE: This entry contains both tasks AND emotional content. Acknowledge the emotional weight of their to-do list.' : ''}

    ROUTING LOGIC (choose ONE framework):
    1. "cbt" - IF text shows anxiety, negative self-talk, or cognitive distortion
    2. "celebration" - IF text describes wins, accomplishments, gratitude, joy, or positive experiences
    3. "general" - For neutral observations, casual updates, or mixed content without strong emotion

    RESPONSE DEPTH (based on emotional intensity):
    - mood_score 0.6+ (positive/neutral): Light response - validation or affirmation only
    - mood_score 0.4-0.6 (mixed): Medium response - add perspective if helpful
    - mood_score 0.2-0.4 (struggling): Full response - include behavioral suggestions
    - mood_score <0.2 (distressed): Full response + always include behavioral_activation

    TIME-AWARE SUGGESTIONS:
    - late_night: Favor sleep hygiene, gentle grounding, avoid "go for a walk" type suggestions
    - morning: Can suggest movement, planning, fresh starts
    - afternoon/evening: Standard suggestions appropriate

    Return JSON:
    {
      "title": "Short creative title (max 6 words)",
      "tags": ["Tag1", "Tag2"],
      "mood_score": 0.5 (0.0=bad, 1.0=good),
      "framework": "cbt" | "celebration" | "general",

      "cbt_breakdown": {
        "automatic_thought": "The negative thought pattern identified (or null if not clear)",
        "distortion": "Cognitive distortion label (or null if minor/not worth highlighting)",
        "validation": "Empathetic acknowledgment (1-2 sentences) - ALWAYS include for cbt",
        "perspective": "Question to consider: [question] — Alternative view: [reframe] (or null if mood > 0.5)",
        "behavioral_activation": {
          "activity": "A simple activity under 5 minutes, appropriate for ${timeContext}",
          "rationale": "Why this helps (1 sentence)"
        }
      },

      "celebration": {
        "affirmation": "Warm acknowledgment of their positive moment (1-2 sentences)",
        "amplify": "Optional prompt to savor or deepen the positive feeling (or null if not needed)"
      },

      "task_acknowledgment": "Brief empathetic note about their to-do list load (or null)"
    }

    IMPORTANT: Return null for any field that isn't genuinely useful. Less is more.
  `;

  try {
    const raw = await callGemini(apiKey, prompt, text);

    if (!raw) {
      console.error('analyzeEntry: No response from Gemini API');
      return {
        title: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
        tags: [],
        mood_score: 0.5,
        framework: 'general',
        entry_type: entryType
      };
    }

    const jsonStr = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(jsonStr);

    const result = {
      title: parsed.title || text.substring(0, 50) + (text.length > 50 ? '...' : ''),
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      mood_score: typeof parsed.mood_score === 'number' ? parsed.mood_score : 0.5,
      framework: parsed.framework || 'general',
      entry_type: entryType
    };

    if (parsed.cbt_breakdown && typeof parsed.cbt_breakdown === 'object' && Object.keys(parsed.cbt_breakdown).length > 0) {
      result.cbt_breakdown = parsed.cbt_breakdown;
    }

    if (parsed.celebration && typeof parsed.celebration === 'object') {
      result.celebration = parsed.celebration;
    }

    if (parsed.task_acknowledgment) {
      result.task_acknowledgment = parsed.task_acknowledgment;
    }

    return result;
  } catch (e) {
    console.error('analyzeEntry error:', e);
    return {
      title: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
      tags: [],
      mood_score: 0.5,
      framework: 'general',
      entry_type: entryType
    };
  }
}

/**
 * Extract enhanced context from entry
 */
async function extractEnhancedContext(apiKey, text, recentEntriesContext = '') {
  const prompt = `
    Extract structured context from this journal entry.

    EXISTING CONTEXT FROM RECENT ENTRIES:
    ${recentEntriesContext || 'No recent entries'}

    EXTRACTION RULES:

    1. PEOPLE (@person:name) - Extract mentioned people with lowercase, underscore-separated names
       - Only real people with names or clear identifiers (mom, dad, boss, therapist)
       - Skip generic references ("someone", "people", "they")
       - Examples: @person:sarah, @person:mom, @person:dr_smith

    2. PLACES (@place:name) - Significant locations
       - Specific places that might recur: @place:office, @place:gym, @place:home
       - Skip generic locations ("somewhere", "outside")

    3. GOALS/INTENTIONS (@goal:description) - Things the user wants to do or change
       - Explicit goals: "I want to...", "I need to...", "I'm going to..."
       - Examples: @goal:exercise_more, @goal:speak_up_at_work

    4. ONGOING SITUATIONS (@situation:description) - Multi-day events or circumstances
       - Job searches, health issues, relationship conflicts, projects
       - Examples: @situation:job_interview_process, @situation:apartment_hunting

    5. SELF-STATEMENTS (@self:statement) - How user describes themselves
       - "I always...", "I never...", "I'm the kind of person who..."
       - Examples: @self:always_late, @self:never_asks_for_help

    6. TOPIC TAGS (regular tags without @) - General themes
       - Examples: anxiety, work, family, health, gratitude

    Return JSON:
    {
      "structured_tags": ["@person:name", "@place:location", "@goal:description", "@situation:context", "@self:statement"],
      "topic_tags": ["general", "topic", "tags"],
      "continues_situation": "@situation:tag_from_recent_entries_if_this_continues_it" or null,
      "goal_update": {
        "tag": "@goal:tag_if_this_updates_a_previous_goal",
        "status": "progress" | "achieved" | "abandoned" | "struggling" | null
      } or null
    }

    Be conservative - only extract what's clearly present. Empty arrays are fine.
  `;

  try {
    const raw = await callGemini(apiKey, prompt, text, AI_CONFIG.classification.primary);
    if (!raw) return { structured_tags: [], topic_tags: [], continues_situation: null, goal_update: null };

    const jsonStr = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error('extractEnhancedContext error:', e);
    return { structured_tags: [], topic_tags: [], continues_situation: null, goal_update: null };
  }
}

/**
 * Generate contextual insight
 */
async function generateInsight(apiKey, currentText, historyContext, moodTrajectory = null, cyclicalPatterns = null) {
  const today = new Date();
  const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][today.getDay()];

  const moodContext = moodTrajectory
    ? `\nMOOD TRAJECTORY: ${moodTrajectory.description} (avg: ${moodTrajectory.average}, trend: ${moodTrajectory.trend})`
    : '';

  const cyclicalContext = cyclicalPatterns?.pattern
    ? `\nCYCLICAL PATTERN DETECTED: ${cyclicalPatterns.pattern}`
    : '';

  const prompt = `
    You are a proactive memory assistant analyzing journal entries.
    Today's date: ${today.toLocaleDateString()} (${dayOfWeek})
    ${moodContext}${cyclicalContext}

    INSIGHT TYPES (choose the most appropriate):
    - "warning": Negative pattern recurring (same trigger → same negative outcome)
    - "encouragement": User showing resilience or growth compared to past
    - "pattern": Neutral observation of recurring theme
    - "reminder": Direct callback to something user mentioned before
    - "progress": Positive trend or improvement over time
    - "streak": Consistent positive behavior (3+ occurrences)
    - "absence": Something negative that used to appear frequently but hasn't lately
    - "contradiction": User's current behavior contradicts their self-statement (use gently!)
    - "goal_check": Follow-up on a previously stated goal
    - "cyclical": Day-of-week or time-based pattern observation

    TEMPORAL REFERENCE RESOLUTION (CRITICAL):
    Entries use relative time references like "yesterday", "last night", "tomorrow", "tonight", etc.
    You MUST resolve these relative to EACH ENTRY'S DATE (shown in brackets), not today's date.

    STRUCTURED TAG AWARENESS:
    - @person:name = recurring person in user's life
    - @place:location = recurring location
    - @goal:intention = something user wants to achieve
    - @situation:context = ongoing multi-day situation
    - @self:statement = how user describes themselves

    TIME-BOXING RULES (CRITICAL):
    - "Recurring theme" requires 3+ mentions within 14 days
    - "Warning" patterns should be within 7 days
    - "Progress/streak" should compare against 30 days ago
    - Don't flag patterns from entries older than 60 days unless truly significant

    If the connection feels forced, weak, or the entries are too old, return { "found": false }.

    Output JSON:
    {
      "found": true,
      "type": "warning" | "encouragement" | "pattern" | "reminder" | "progress" | "streak" | "absence" | "contradiction" | "goal_check" | "cyclical",
      "message": "Concise, insightful observation (1-2 sentences max)",
      "followUpQuestions": ["Relevant question 1?", "Relevant question 2?"]
    }
  `;

  try {
    const raw = await callGemini(apiKey, prompt, `HISTORY:\n${historyContext}\n\nCURRENT ENTRY [${today.toLocaleDateString()} - written just now]:\n${currentText}`);

    if (!raw) {
      console.error('generateInsight: No response from Gemini API');
      return null;
    }

    const jsonStr = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error('generateInsight error:', e);
    return null;
  }
}

/**
 * Main Cloud Function: Analyze a journal entry
 * Handles classification, analysis, context extraction, and insight generation
 */
export const analyzeJournalEntry = onCall(
  {
    secrets: [geminiApiKey],
    cors: true,
    maxInstances: 10
  },
  async (request) => {
    // Verify authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { text, recentEntriesContext, historyContext, moodTrajectory, cyclicalPatterns, operations } = request.data;

    if (!text || typeof text !== 'string') {
      throw new HttpsError('invalid-argument', 'Text is required');
    }

    const apiKey = geminiApiKey.value();
    const results = {};

    try {
      // Run requested operations
      const ops = operations || ['classify', 'analyze', 'extractContext', 'generateInsight'];

      if (ops.includes('classify')) {
        results.classification = await classifyEntry(apiKey, text);
      }

      if (ops.includes('analyze')) {
        const entryType = results.classification?.entry_type || 'reflection';
        results.analysis = await analyzeEntry(apiKey, text, entryType);
      }

      if (ops.includes('extractContext')) {
        results.enhancedContext = await extractEnhancedContext(apiKey, text, recentEntriesContext);
      }

      if (ops.includes('generateInsight') && historyContext) {
        results.insight = await generateInsight(apiKey, text, historyContext, moodTrajectory, cyclicalPatterns);
      }

      return results;
    } catch (error) {
      console.error('analyzeJournalEntry error:', error);
      throw new HttpsError('internal', 'Analysis failed');
    }
  }
);

/**
 * Cloud Function: Generate text embedding
 */
export const generateEmbedding = onCall(
  {
    secrets: [geminiApiKey],
    cors: true,
    maxInstances: 10
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { text } = request.data;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      throw new HttpsError('invalid-argument', 'Valid text is required');
    }

    const apiKey = geminiApiKey.value();

    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: { parts: [{ text: text }] } })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('Embedding API error:', res.status, errorData);
        throw new HttpsError('internal', 'Embedding generation failed');
      }

      const data = await res.json();
      const embedding = data.embedding?.values || null;

      if (!embedding) {
        throw new HttpsError('internal', 'No embedding returned');
      }

      return { embedding };
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      console.error('generateEmbedding error:', error);
      throw new HttpsError('internal', 'Embedding generation failed');
    }
  }
);

/**
 * Cloud Function: Transcribe audio using Whisper
 */
export const transcribeAudio = onCall(
  {
    secrets: [openaiApiKey],
    cors: true,
    maxInstances: 5
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { base64, mimeType } = request.data;

    if (!base64 || !mimeType) {
      throw new HttpsError('invalid-argument', 'Audio data and mimeType are required');
    }

    const apiKey = openaiApiKey.value();

    if (!apiKey) {
      throw new HttpsError('failed-precondition', 'OpenAI API key not configured');
    }

    try {
      // Convert base64 to buffer
      const buffer = Buffer.from(base64, 'base64');

      // Determine file extension
      const fileExt = mimeType.includes('webm') ? 'webm' : mimeType.includes('mp4') ? 'mp4' : 'wav';

      // Create form data
      const boundary = '----FormBoundary' + Math.random().toString(36).slice(2);
      const formDataParts = [
        `--${boundary}\r\n`,
        `Content-Disposition: form-data; name="file"; filename="audio.${fileExt}"\r\n`,
        `Content-Type: ${mimeType}\r\n\r\n`,
        buffer,
        `\r\n--${boundary}\r\n`,
        `Content-Disposition: form-data; name="model"\r\n\r\n`,
        `whisper-1\r\n`,
        `--${boundary}--\r\n`
      ];

      const formBody = Buffer.concat(
        formDataParts.map(part => Buffer.isBuffer(part) ? part : Buffer.from(part))
      );

      const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': `multipart/form-data; boundary=${boundary}`
        },
        body: formBody
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('Whisper API error:', res.status, errorData);

        if (res.status === 429) return { error: 'API_RATE_LIMIT' };
        if (res.status === 401) return { error: 'API_AUTH_ERROR' };
        if (res.status === 400) return { error: 'API_BAD_REQUEST' };
        return { error: 'API_ERROR' };
      }

      const data = await res.json();
      let transcript = data.text || null;

      if (!transcript) {
        return { error: 'API_NO_CONTENT' };
      }

      // Remove filler words
      const fillerWords = /\b(um|uh|uhm|like|you know|so|well|actually|basically|literally)\b/gi;
      transcript = transcript.replace(fillerWords, ' ').replace(/\s+/g, ' ').trim();

      return { transcript };
    } catch (error) {
      console.error('transcribeAudio error:', error);
      return { error: 'API_EXCEPTION' };
    }
  }
);

/**
 * Cloud Function: Ask the journal AI a question
 */
export const askJournalAI = onCall(
  {
    secrets: [geminiApiKey],
    cors: true,
    maxInstances: 5
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { question, entriesContext } = request.data;

    if (!question || typeof question !== 'string') {
      throw new HttpsError('invalid-argument', 'Question is required');
    }

    const apiKey = geminiApiKey.value();

    const systemPrompt = `You are a helpful journal assistant with access to the user's personal entries.

CONTEXT FROM JOURNAL ENTRIES:
${entriesContext || 'No entries available'}

INSTRUCTIONS:
- Answer based ONLY on the journal entries provided
- Reference specific dates when relevant
- Notice patterns across entries (recurring people, places, goals, situations)
- Tags starting with @ indicate: @person:name, @place:location, @goal:intention, @situation:ongoing_context, @self:self_statement
- Use ### headers and * bullets for formatting
- Be warm and personal - this is someone's private journal`;

    try {
      const response = await callGemini(apiKey, systemPrompt, question);
      return { response };
    } catch (error) {
      console.error('askJournalAI error:', error);
      throw new HttpsError('internal', 'Chat failed');
    }
  }
);
