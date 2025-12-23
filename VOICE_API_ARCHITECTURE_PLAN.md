# Voice API Security & Guided Sessions Architecture Plan

## Executive Summary

This document outlines the architecture for:
1. **Secure Voice API Reconnection** - WebSocket relay server protecting API keys
2. **Voice-to-Entry Saving** - User-controlled and guided session modes
3. **Guided Journal Sessions** - AI-guided conversations using RAG and best practices

---

## Current State Analysis

### What Exists
- ✅ `VoiceRecorder.jsx` - Audio capture via Web Audio API
- ✅ `RealtimeConversation.jsx` - UI shell for voice conversations (disabled)
- ✅ `transcription.js` - Whisper API via Cloud Functions (secure)
- ✅ Robust entry analysis pipeline (CBT/ACT/Celebration frameworks)
- ✅ Hybrid RAG system with vector + recency + entity matching
- ✅ Signal extraction for temporal awareness
- ✅ Firebase Auth + Cloud Functions security model

### Why Voice Is Disabled
```
"Voice conversations temporarily unavailable.
A secure server relay is required for API key protection."
```
OpenAI's Realtime API requires WebSocket connection with API key in headers - exposing this client-side is a critical security vulnerability.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENT                                      │
│  ┌─────────────┐    ┌──────────────────┐    ┌─────────────────────────┐ │
│  │VoiceRecorder│───▶│GuidedSession.jsx │───▶│RealtimeConversation.jsx│ │
│  └─────────────┘    └──────────────────┘    └───────────┬─────────────┘ │
│                                                         │               │
│                              Firebase Auth Token        │               │
└─────────────────────────────────────────────────────────┼───────────────┘
                                                          │
                                                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        SECURE RELAY SERVER                              │
│                      (Cloud Run / Dedicated)                            │
│  ┌────────────────┐    ┌─────────────────┐    ┌────────────────────┐   │
│  │ Auth Validator │───▶│ Session Manager │───▶│ OpenAI Realtime    │   │
│  │ (Firebase JWT) │    │ (Per-User State)│    │ WebSocket Proxy    │   │
│  └────────────────┘    └────────┬────────┘    └────────────────────┘   │
│                                 │                                       │
│                    ┌────────────┴────────────┐                         │
│                    ▼                         ▼                         │
│           ┌──────────────┐          ┌──────────────────┐               │
│           │ Transcript   │          │ RAG Context      │               │
│           │ Accumulator  │          │ Injector         │               │
│           └──────────────┘          └──────────────────┘               │
└─────────────────────────────────────────────────────────────────────────┘
                                                          │
                                                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     FIREBASE CLOUD FUNCTIONS                            │
│  ┌────────────────┐  ┌─────────────────┐  ┌──────────────────────────┐ │
│  │saveVoiceEntry  │  │getSessionContext│  │ Existing Analysis        │ │
│  │                │  │(RAG retrieval)  │  │ Pipeline                 │ │
│  └────────────────┘  └─────────────────┘  └──────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Milestone 1: Secure WebSocket Relay Server

### Option Analysis

| Option | Pros | Cons | Recommendation |
|--------|------|------|----------------|
| **Cloud Run** | Scales to zero, managed, WebSocket support | Cold starts (~2-5s) | ✅ Best for production |
| **Cloud Functions** | Already in use | No WebSocket support | ❌ Not viable |
| **Dedicated VPS** | Full control, no cold starts | Always-on cost, maintenance | For high-volume later |
| **Firebase Realtime DB relay** | Real-time, managed | Hacky, not designed for this | ❌ Not recommended |

### Recommended: Cloud Run WebSocket Relay

#### Server Implementation (`/relay-server/`)

```
relay-server/
├── Dockerfile
├── package.json
├── src/
│   ├── index.ts              # Express + WebSocket server
│   ├── auth/
│   │   └── firebase.ts       # Firebase Admin SDK auth
│   ├── relay/
│   │   ├── sessionManager.ts # Per-user session state
│   │   ├── openaiProxy.ts    # OpenAI Realtime WebSocket proxy
│   │   └── transcriptBuffer.ts
│   ├── context/
│   │   └── ragInjector.ts    # Inject RAG context into system prompt
│   └── config/
│       └── secrets.ts        # Secret Manager integration
```

#### Key Security Features

1. **Authentication Flow**
   ```typescript
   // Client connects with Firebase ID token
   ws://relay.echovault.app/voice?token={firebaseIdToken}

   // Server validates before proxying
   const decodedToken = await admin.auth().verifyIdToken(token);
   const userId = decodedToken.uid;
   ```

2. **API Key Protection**
   - OpenAI API key stored in Google Secret Manager
   - Never transmitted to client
   - Server-to-OpenAI connection only

3. **Session Isolation**
   - One OpenAI session per user
   - Transcript buffer per session
   - Automatic cleanup on disconnect

4. **Rate Limiting**
   - Per-user connection limits
   - Concurrent session prevention
   - Audio duration limits

#### Relay Protocol

```typescript
// Client → Relay messages
interface ClientMessage {
  type: 'audio_chunk' | 'end_turn' | 'end_session' | 'save_entry';
  data?: string;  // base64 audio for audio_chunk
  saveOptions?: {
    asGuidedSession: boolean;
    sessionType?: GuidedSessionType;
  };
}

// Relay → Client messages
interface RelayMessage {
  type: 'audio_response' | 'transcript_delta' | 'session_saved' | 'error';
  data?: string;
  transcript?: string;
  entryId?: string;
}
```

### Deployment

```yaml
# cloudbuild.yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/voice-relay', './relay-server']
  - name: 'gcr.io/cloud-builders/gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'voice-relay'
      - '--image=gcr.io/$PROJECT_ID/voice-relay'
      - '--platform=managed'
      - '--allow-unauthenticated'  # Auth handled in app
      - '--min-instances=0'
      - '--max-instances=10'
      - '--timeout=900'  # 15 min max session
      - '--memory=512Mi'
      - '--set-secrets=OPENAI_API_KEY=openai-api-key:latest'
```

---

## Milestone 2: Voice Conversation Modes

### Mode 1: Free Conversation (User-Controlled Save)

```
┌────────────────────────────────────────────────────────┐
│                  FREE CONVERSATION                      │
│                                                        │
│  User speaks naturally with AI                         │
│  ↓                                                     │
│  Conversation continues until user ends                │
│  ↓                                                     │
│  "Would you like to save this as a journal entry?"     │
│  ↓                                                     │
│  [Yes, save] [No, discard] [Edit first]               │
│                                                        │
│  If saved:                                             │
│  - Full transcript → Entry text                        │
│  - AI summarizes key points                            │
│  - Standard analysis pipeline runs                     │
└────────────────────────────────────────────────────────┘
```

### Mode 2: Guided Session (Auto-Save)

```
┌────────────────────────────────────────────────────────┐
│                  GUIDED SESSION                         │
│                                                        │
│  User selects session type                             │
│  ↓                                                     │
│  RAG context loaded (recent entries, patterns, goals)  │
│  ↓                                                     │
│  AI guides through structured prompts                  │
│  ↓                                                     │
│  Session completes with summary                        │
│  ↓                                                     │
│  Automatically saved as structured entry               │
│  - session_type: 'guided_morning_checkin'              │
│  - structured_responses: {...}                         │
│  - ai_summary: "..."                                   │
└────────────────────────────────────────────────────────┘
```

### Entry Schema Extension

```typescript
interface VoiceEntry extends Entry {
  source: 'voice_free' | 'voice_guided' | 'text';

  // For voice entries
  voiceMetadata?: {
    duration: number;           // seconds
    wordCount: number;
    sessionType?: GuidedSessionType;
    rawTranscript: string;      // Full conversation
    processedText: string;      // Cleaned/summarized for display
  };

  // For guided sessions
  guidedSession?: {
    type: GuidedSessionType;
    completedPrompts: string[];
    structuredResponses: Record<string, string>;
    sessionSummary: string;
  };
}
```

---

## Milestone 3: Guided Session Framework

### Session Types

```typescript
type GuidedSessionType =
  | 'morning_checkin'      // Start the day with intention
  | 'evening_reflection'   // Process the day
  | 'gratitude_practice'   // Three good things
  | 'goal_setting'         // Define and plan goals
  | 'emotional_processing' // CBT/ACT guided
  | 'stress_release'       // Anxiety/stress processing
  | 'weekly_review'        // Week in review
  | 'celebration'          // Acknowledge wins
  | 'situation_processing' // Work through specific situation
  | 'custom';              // User-defined
```

### Session Definition Structure

```typescript
interface GuidedSessionDefinition {
  id: GuidedSessionType;
  name: string;
  description: string;
  icon: string;
  estimatedMinutes: number;

  // When to suggest this session
  suggestWhen: {
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
    moodThreshold?: { below?: number; above?: number };
    patterns?: string[];  // e.g., ['low_streak', 'high_stress']
    dayOfWeek?: number[];
  };

  // RAG context to load
  contextNeeds: {
    recentEntries: number;      // Last N entries
    relevantGoals: boolean;
    openSituations: boolean;
    recurringPatterns: boolean;
    specificEntities?: string[]; // e.g., ['@goal:*', '@situation:*']
  };

  // Session flow
  prompts: GuidedPrompt[];

  // How to process the result
  outputProcessing: {
    summaryPrompt: string;
    extractSignals: boolean;
    therapeuticFramework?: 'cbt' | 'act' | 'general';
  };
}

interface GuidedPrompt {
  id: string;
  type: 'open' | 'rating' | 'choice' | 'reflection';
  prompt: string;

  // Dynamic prompt generation
  contextInjection?: {
    includeRecentMood?: boolean;
    includeOpenGoals?: boolean;
    includeYesterdayHighlight?: boolean;
    customRagQuery?: string;
  };

  // Conditional flow
  skipIf?: (responses: Record<string, any>, context: SessionContext) => boolean;
  followUp?: {
    condition: (response: string) => boolean;
    prompt: string;
  };
}
```

### Example: Morning Check-in Session

```typescript
const morningCheckin: GuidedSessionDefinition = {
  id: 'morning_checkin',
  name: 'Morning Check-in',
  description: 'Start your day with clarity and intention',
  icon: 'sunrise',
  estimatedMinutes: 5,

  suggestWhen: {
    timeOfDay: 'morning',
  },

  contextNeeds: {
    recentEntries: 3,
    relevantGoals: true,
    openSituations: true,
    recurringPatterns: false,
  },

  prompts: [
    {
      id: 'sleep_quality',
      type: 'open',
      prompt: "Good morning! How did you sleep last night, and how are you feeling as you start the day?",
    },
    {
      id: 'yesterday_followup',
      type: 'reflection',
      prompt: "Yesterday you mentioned {yesterdayHighlight}. How are you feeling about that today?",
      contextInjection: {
        includeYesterdayHighlight: true,
      },
      skipIf: (_, ctx) => !ctx.yesterdayHighlight,
    },
    {
      id: 'todays_intention',
      type: 'open',
      prompt: "What's one thing you'd like to focus on or accomplish today?",
      followUp: {
        condition: (response) => response.toLowerCase().includes('anxious') ||
                                  response.toLowerCase().includes('worried'),
        prompt: "I hear some concern in that. What's one small step you could take to feel more prepared?",
      },
    },
    {
      id: 'goal_checkin',
      type: 'reflection',
      prompt: "You've been working on {activeGoal}. Any thoughts on that today?",
      contextInjection: {
        includeOpenGoals: true,
      },
      skipIf: (_, ctx) => !ctx.activeGoals?.length,
    },
    {
      id: 'closing',
      type: 'open',
      prompt: "Anything else on your mind before we wrap up?",
    },
  ],

  outputProcessing: {
    summaryPrompt: `Summarize this morning check-in in 2-3 sentences,
                    highlighting the user's mood, intention for the day,
                    and any concerns or goals mentioned.`,
    extractSignals: true,
    therapeuticFramework: 'general',
  },
};
```

### Session Library (Best Practices)

```
/src/services/guided-sessions/
├── index.ts                    # Session manager
├── definitions/
│   ├── morning-checkin.ts
│   ├── evening-reflection.ts
│   ├── gratitude-practice.ts
│   ├── goal-setting.ts
│   ├── emotional-processing.ts
│   ├── stress-release.ts
│   ├── weekly-review.ts
│   ├── celebration.ts
│   └── situation-processing.ts
├── engine/
│   ├── sessionRunner.ts        # Orchestrates session flow
│   ├── promptRenderer.ts       # Injects RAG context into prompts
│   └── responseProcessor.ts    # Extracts structure from responses
└── suggestions/
    └── sessionSuggester.ts     # Recommends sessions based on context
```

---

## Milestone 4: RAG-Informed Conversations

### Context Injection Points

```typescript
interface ConversationContext {
  // Pre-loaded at session start
  recentEntries: Entry[];           // Last 5-10 entries
  relevantEntries: Entry[];         // RAG-retrieved based on time/patterns
  activeGoals: string[];            // Open @goal:* tags
  openSituations: string[];         // Ongoing @situation:* tags
  recentPatterns: Pattern[];        // Detected patterns
  moodTrajectory: MoodTrajectory;   // Recent mood trend

  // Dynamic during conversation
  mentionedEntities: string[];      // Entities mentioned this session
  emotionalState: string;           // Detected from voice/content
}
```

### System Prompt Template

```typescript
const buildSystemPrompt = (context: ConversationContext, sessionType?: GuidedSessionType): string => {
  return `You are a supportive journaling companion helping the user reflect on their thoughts and experiences.

## User Context

### Recent Mood
${context.moodTrajectory.description}
${context.moodTrajectory.trend === 'declining' ?
  'Note: User\'s mood has been declining. Be especially supportive.' : ''}

### Active Goals
${context.activeGoals.length > 0 ?
  context.activeGoals.map(g => `- ${g}`).join('\n') :
  'No active goals mentioned recently.'}

### Open Situations
${context.openSituations.length > 0 ?
  context.openSituations.map(s => `- ${s}`).join('\n') :
  'No ongoing situations.'}

### Recent Entries Summary
${context.recentEntries.slice(0, 3).map(e =>
  `- ${e.effectiveDate}: ${e.title} (mood: ${e.analysis?.mood_score?.toFixed(1) || 'unknown'})`
).join('\n')}

### Relevant Past Context
${context.relevantEntries.map(e =>
  `- ${e.effectiveDate}: "${e.text.substring(0, 100)}..."`
).join('\n')}

## Guidelines
- Reference past entries naturally: "You mentioned last week that..."
- Follow up on open situations: "How did that meeting go?"
- Acknowledge patterns: "I notice you often feel this way on Mondays"
- Be warm but not sycophantic
- Keep responses concise for voice (2-3 sentences typically)
- ${sessionType ? `This is a ${sessionType} session. Follow the structured flow.` :
                  'This is a free conversation. Let the user guide the direction.'}
`;
};
```

### Real-time RAG During Conversation

```typescript
// When user mentions something, fetch related context
const onUserUtterance = async (transcript: string, context: ConversationContext) => {
  // Extract entities from current utterance
  const entities = await extractEntities(transcript);

  // If new entities mentioned, fetch related entries
  for (const entity of entities) {
    if (!context.mentionedEntities.includes(entity)) {
      const related = await hybridRagSearch({
        query: transcript,
        entityFilter: entity,
        limit: 3,
      });

      // Inject into context for next response
      context.relevantEntries.push(...related);
      context.mentionedEntities.push(entity);
    }
  }

  return context;
};
```

---

## Milestone 5: UI/UX Implementation

### New Components

```
/src/components/voice/
├── VoiceSessionLauncher.jsx      # Entry point - choose mode
├── GuidedSessionPicker.jsx       # Grid of session types
├── VoiceConversation.jsx         # Updated RealtimeConversation
├── SessionProgress.jsx           # Progress through guided prompts
├── TranscriptPreview.jsx         # Live transcript display
├── SaveEntryModal.jsx            # Post-session save options
└── VoiceSessionHistory.jsx       # Past voice sessions
```

### Voice Session Launcher

```jsx
const VoiceSessionLauncher = () => {
  const [mode, setMode] = useState<'select' | 'free' | 'guided'>(null);
  const { suggestedSessions } = useSuggestedSessions();

  return (
    <div className="voice-launcher">
      <h2>Start a Voice Session</h2>

      <div className="mode-selection">
        <button onClick={() => setMode('free')}>
          <MessageCircle />
          <span>Free Conversation</span>
          <small>Talk openly, save if you want</small>
        </button>

        <button onClick={() => setMode('guided')}>
          <Compass />
          <span>Guided Session</span>
          <small>Structured reflection</small>
        </button>
      </div>

      {suggestedSessions.length > 0 && (
        <div className="suggestions">
          <h3>Suggested for you</h3>
          {suggestedSessions.map(session => (
            <SessionCard
              key={session.id}
              session={session}
              onSelect={() => startGuidedSession(session.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
```

### Guided Session Flow

```jsx
const GuidedSession = ({ sessionType }) => {
  const { definition, context, currentPrompt, advance, responses } =
    useGuidedSession(sessionType);
  const { isConnected, speak, transcript } = useVoiceRelay();

  // Auto-advance when user finishes speaking
  useEffect(() => {
    if (transcript.userFinished && currentPrompt) {
      responses[currentPrompt.id] = transcript.lastUtterance;
      advance();
    }
  }, [transcript.userFinished]);

  return (
    <div className="guided-session">
      <SessionProgress
        current={currentPrompt?.id}
        total={definition.prompts.length}
      />

      <div className="current-prompt">
        <p>{renderPrompt(currentPrompt, context)}</p>
      </div>

      <TranscriptPreview transcript={transcript} />

      <VoiceControls
        onEnd={() => saveGuidedEntry(responses)}
      />
    </div>
  );
};
```

---

## Milestone 6: Entry Processing Pipeline Updates

### Voice Entry Processing

```typescript
const processVoiceEntry = async (
  transcript: string,
  userId: string,
  options: {
    source: 'voice_free' | 'voice_guided';
    sessionType?: GuidedSessionType;
    structuredResponses?: Record<string, string>;
    duration: number;
  }
): Promise<Entry> => {

  // 1. Clean transcript (remove filler words, false starts)
  const cleanedTranscript = await cleanTranscript(transcript);

  // 2. For guided sessions, use structured responses
  // For free conversations, summarize the conversation
  const entryText = options.source === 'voice_guided'
    ? await summarizeGuidedSession(options.structuredResponses, options.sessionType)
    : await summarizeFreeConversation(cleanedTranscript);

  // 3. Run through standard analysis pipeline
  const analysis = await analyzeEntry(entryText, userId);

  // 4. Generate embedding
  const embedding = await generateEmbedding(entryText);

  // 5. Extract signals
  const signals = await extractSignals(entryText, analysis);

  // 6. Build entry object
  const entry: VoiceEntry = {
    id: generateId(),
    text: entryText,
    source: options.source,
    voiceMetadata: {
      duration: options.duration,
      wordCount: transcript.split(/\s+/).length,
      sessionType: options.sessionType,
      rawTranscript: transcript,
      processedText: entryText,
    },
    guidedSession: options.source === 'voice_guided' ? {
      type: options.sessionType,
      structuredResponses: options.structuredResponses,
      sessionSummary: entryText,
    } : undefined,
    analysis,
    embedding,
    createdAt: new Date(),
    effectiveDate: new Date(),
    // ... other standard fields
  };

  // 7. Save entry and signals
  await saveEntry(userId, entry);
  await saveSignals(userId, entry.id, signals);

  return entry;
};
```

---

## Implementation Phases

### Phase 1: Secure Relay Server (Week 1-2)
- [ ] Set up Cloud Run project
- [ ] Implement WebSocket server with Firebase Auth
- [ ] Create OpenAI Realtime API proxy
- [ ] Implement transcript buffering
- [ ] Deploy and test connectivity
- [ ] Update client to connect to relay

### Phase 2: Basic Voice Reconnection (Week 2-3)
- [ ] Update `RealtimeConversation.jsx` to use relay
- [ ] Implement free conversation mode
- [ ] Add post-conversation save dialog
- [ ] Process voice transcripts as entries
- [ ] Test end-to-end flow

### Phase 3: Guided Session Framework (Week 3-4)
- [ ] Create session definition schema
- [ ] Implement 3 core sessions:
  - Morning Check-in
  - Evening Reflection
  - Gratitude Practice
- [ ] Build session runner engine
- [ ] Create `GuidedSessionPicker` UI
- [ ] Implement session progress tracking

### Phase 4: RAG Integration (Week 4-5)
- [ ] Create `getSessionContext` Cloud Function
- [ ] Implement dynamic prompt rendering with context
- [ ] Add real-time entity detection during conversation
- [ ] Build context injection into system prompts
- [ ] Test RAG-informed responses

### Phase 5: Full Session Library (Week 5-6)
- [ ] Implement remaining session types:
  - Goal Setting
  - Emotional Processing (CBT/ACT)
  - Stress Release
  - Weekly Review
  - Celebration
  - Situation Processing
- [ ] Add session suggestion algorithm
- [ ] Build session history view
- [ ] Polish UI/UX

### Phase 6: Testing & Refinement (Week 6-7)
- [ ] End-to-end testing
- [ ] Voice quality optimization
- [ ] Latency optimization
- [ ] Error handling and edge cases
- [ ] User feedback integration

---

## Security Checklist

- [ ] API keys never leave server
- [ ] Firebase Auth validated on every WebSocket connection
- [ ] Session isolation between users
- [ ] Rate limiting per user
- [ ] Audio data encrypted in transit (WSS)
- [ ] Transcripts encrypted at rest
- [ ] Session timeout after inactivity
- [ ] Audit logging for voice sessions
- [ ] CORS properly configured
- [ ] No PII in logs

---

## Cost Considerations

| Component | Estimated Cost |
|-----------|---------------|
| Cloud Run (WebSocket relay) | ~$5-20/mo based on usage |
| OpenAI Realtime API | ~$0.06/min audio |
| OpenAI Whisper (fallback) | ~$0.006/min |
| Firestore reads/writes | Existing quota |

**Recommendation**: Start with 5-minute session limit, expand based on usage patterns.

---

## Success Metrics

1. **Security**: Zero API key exposures
2. **Reliability**: <1% session failure rate
3. **Latency**: <500ms voice response time
4. **Adoption**: 30% of entries from voice within 3 months
5. **Completion**: 80%+ guided session completion rate
6. **Quality**: Voice entries have comparable analysis depth to text

---

## Open Questions

1. **Offline Support**: Should we support offline voice recording with deferred processing?
2. **Voice Profiles**: Should the AI voice/personality be customizable?
3. **Multi-language**: Support transcription in other languages?
4. **Session Sharing**: Allow sharing guided session templates?
5. **Therapist Mode**: Professional-guided sessions for therapy use cases?

---

## Next Steps

1. Review and approve this architecture
2. Set up Cloud Run project and secrets
3. Begin Phase 1 implementation
4. Create tracking issues for each phase
