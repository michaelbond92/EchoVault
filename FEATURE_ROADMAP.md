# EchoVault Feature Roadmap

*A prioritized list of 20 features based on industry research, best practices, and gap analysis*

---

## User Stories Roadmap

| Phase | Feature Name | User Story |
|-------|--------------|------------|
| **Phase 1: Habit Foundation** | Streak & Consistency Tracking | As a journal user, I want to see my current journaling streak and milestones so that I stay motivated to journal consistently and build a lasting habit. |
| **Phase 1: Habit Foundation** | Guided Breathing Exercises | As a user experiencing stress or anxiety, I want access to guided breathing exercises with visual animations so that I can actively calm myself when the app detects I need support. |
| **Phase 1: Habit Foundation** | Smart Reminders | As a busy user, I want intelligent reminders that learn my optimal journaling times so that I receive supportive nudges when I'm most likely to journal without feeling nagged. |
| **Phase 1: Habit Foundation** | Weekly/Monthly Reviews | As a reflective user, I want AI-generated summaries of my weekly and monthly patterns so that I can understand my emotional trends and celebrate my progress. |
| **Phase 2: Growth & Insights** | Gratitude Framework | As a user seeking positivity, I want dedicated gratitude journaling with a "gratitude bank" so that I can practice evidence-backed gratitude exercises and revisit them during difficult times. |
| **Phase 2: Growth & Insights** | Goal Tracking Dashboard | As a goal-oriented user, I want to set explicit goals and track progress across my entries so that I can see how my journaling connects to achieving my life objectives. |
| **Phase 2: Growth & Insights** | Achievement System & Badges | As a motivated user, I want to earn badges and achievements for journaling milestones so that I feel rewarded for my consistency and engagement. |
| **Phase 2: Growth & Insights** | Search & Discovery | As a long-term user, I want to search my entries by keyword, mood, or meaning so that I can quickly find past reflections and see "On This Day" memories. |
| **Phase 3: Holistic Wellness** | Sleep & Activity Correlation | As a health-conscious user, I want my journal to integrate with Apple Health/Google Fit so that I can see how sleep and activity affect my mood patterns. |
| **Phase 3: Holistic Wellness** | Therapist Collaboration Mode | As a user in therapy, I want to securely share selected entries with my therapist so that we can review my progress together and flag entries for discussion. |
| **Phase 3: Holistic Wellness** | Onboarding & Tutorial Flow | As a new user, I want a guided introduction to EchoVault's features so that I understand how to get the most value from the app without feeling overwhelmed. |
| **Phase 4: Rich Experiences** | Photo & Media Journaling | As a visual person, I want to attach photos to my entries and have AI analyze them so that I can capture moments beyond words and reflect on visual memories. |
| **Phase 4: Rich Experiences** | Advanced Mood Analytics | As a data-driven user, I want detailed visualizations of my mood by time-of-day, day-of-week, and tag correlations so that I can identify specific triggers and patterns. |
| **Phase 4: Rich Experiences** | Expanded CBT Toolkit | As a user working on mental health, I want structured CBT tools like thought records and behavioral experiments so that I can apply evidence-based techniques systematically. |
| **Phase 4: Rich Experiences** | Entry Templates | As a user who struggles with blank pages, I want pre-built and custom templates (morning pages, evening reflection) so that I have structure to guide my journaling. |
| **Phase 5: Personalization** | Multiple Journal Categories | As a user with diverse life areas, I want to create custom journal categories beyond personal/work so that I can track mood patterns per life domain (relationships, health, creativity). |
| **Phase 5: Personalization** | Accountability Partner | As a user seeking support, I want to optionally share my journaling streaks and mood with a trusted friend so that I have external accountability and support. |
| **Phase 5: Personalization** | End-to-End Encryption | As a privacy-conscious user, I want my entries encrypted before leaving my device so that only I can read my most sensitive reflections. |
| **Phase 6: Future** | Audio Content Library | As a user seeking relaxation, I want access to guided meditations, sleep stories, and ambient soundscapes so that I can extend my wellness practice beyond journaling. |
| **Phase 6: Future** | Relapse Prevention Mode | As a user in recovery, I want specialized tools like HALT checks, trigger libraries, and recovery milestones so that I have dedicated support for my recovery journey. |

---

## Executive Summary

After thoroughly analyzing EchoVault's current capabilities and researching industry-leading journaling apps, I've identified 20 high-impact features organized into tiers. The roadmap balances **quick wins** (features that leverage your existing AI infrastructure), **differentiators** (features that set EchoVault apart), and **industry standards** (features users expect from modern apps).

### Current Strengths to Build On
- Sophisticated multi-model AI pipeline (Gemini + OpenAI)
- Therapeutic routing (CBT/Celebration/Support frameworks)
- Voice-first design with real-time conversation
- Crisis detection and safety planning
- Contextual pattern recognition with RAG

---

## TIER 1: HIGH-VALUE QUICK WINS
*Features that leverage existing infrastructure for immediate impact*

### 1. Guided Breathing & Mindfulness Exercises
**Priority: Critical | Effort: Low | Impact: High**

**The Gap:** EchoVault shows a "decompression screen" after low-mood entries but only mentions breathing—no actual guided exercises.

**The Feature:**
- **Box Breathing** (4-4-4-4): Visual animation with haptic feedback
- **4-7-8 Breathing** ("The Relaxing Breath"): For sleep and anxiety
- **Grounding Exercise** (5-4-3-2-1): Interactive sensory awareness
- **Progressive Muscle Relaxation**: Guided body scan with audio

**Why It Matters:**
Research shows breathing exercises can reduce stress within 2-5 minutes. Your support/vent framework already recommends cooldown techniques—this makes them actionable instead of just descriptive.

**Implementation:**
- Expand `DecompressionScreen` component
- Add visual breathing circle animation (React Spring or Framer Motion)
- Integrate with TTS for guided instructions
- Track completion for pattern analysis

---

### 2. Streak & Consistency Tracking
**Priority: Critical | Effort: Low | Impact: Very High**

**The Gap:** No habit reinforcement mechanics despite existing Firebase timestamps.

**The Feature:**
- **Current Streak Counter**: "7 days in a row" display on home screen
- **Longest Streak Record**: Personal best tracking
- **Streak Recovery**: "Freeze" days for illness/vacation (earned through consistency)
- **Visual Streak Calendar**: Heat calendar showing journaling days
- **Streak Milestones**: Celebrate 7, 30, 100, 365 days

**Why It Matters:**
Daylio achieves 40% Day-30 retention vs. industry average of ~20%, largely due to streak mechanics. Studies show commitment devices like streaks boost follow-through from 65% to 95%.

**Implementation:**
- Calculate streaks from existing `createdAt` timestamps
- Add streak state to user profile in Firestore
- Display streak badge in header
- Show recovery options when streak breaks

---

### 3. Weekly/Monthly Review Summaries
**Priority: High | Effort: Medium | Impact: High**

**The Gap:** Pattern detection exists but no structured reflection moments.

**The Feature:**
- **Weekly Summary** (Generated Sunday evening):
  - Mood trajectory with sparkline
  - Top 3 themes/tags this week
  - Win highlight (highest mood entry)
  - CBT insight of the week
  - "What to watch for" based on patterns

- **Monthly Deep Dive**:
  - Mood comparison vs. previous month
  - Goal progress summary
  - Recurring people/places/situations analysis
  - Growth moments identified
  - Questions for next month's focus

**Why It Matters:**
Longitudinal visualization is one of the most requested features in mental health apps. Users who review their data have better emotional regulation and insight.

**Implementation:**
- New Gemini prompt aggregating week/month of entries
- Scheduled generation or on-demand
- Store as special "summary" entry type
- Push notification for weekly review readiness

---

### 4. Smart Reminders & Optimal Timing
**Priority: High | Effort: Low | Impact: High**

**The Gap:** `useNotifications` hook exists but limited to permission requests.

**The Feature:**
- **Customizable Reminders**: Morning, evening, or custom times
- **Adaptive Timing**: Learn when user journals most and suggest optimal windows
- **Mood-Based Prompts**: "You usually feel better when you journal around 8pm..."
- **Gentle Recovery**: "We noticed you haven't journaled in 3 days. No pressure, just checking in."
- **Context-Aware**: Skip reminders on days with existing entries

**Why It Matters:**
78% of journaling app users cite reminders as essential for habit formation. The key is making them feel supportive, not nagging.

**Implementation:**
- Expand `useNotifications.js` with scheduling logic
- Analyze entry timestamps for pattern detection
- Use Service Worker for scheduled notifications
- Preference UI in settings

---

### 5. Gratitude-Specific Framework
**Priority: High | Effort: Medium | Impact: High**

**The Gap:** No dedicated gratitude journaling despite being one of the most evidence-backed practices.

**The Feature:**
- **Gratitude Detection**: Identify gratitude expressions in entries automatically
- **Gratitude Routing**: New framework alongside CBT/Celebration/Support
- **Daily Gratitude Prompt**: "Name 3 things you're grateful for today"
- **Gratitude Bank**: Saved gratitude statements for review during hard times
- **Gratitude Streaks**: Specific streak for gratitude practice

**Why It Matters:**
Research shows gratitude journaling reduces stress, improves sleep quality, and activates the prefrontal cortex while calming the amygdala. It's one of the highest-ROI interventions.

**Implementation:**
- Add `gratitude` to `entry_type` classification
- New analysis framework in `services/analysis/index.js`
- Gratitude-specific prompts in constants
- "Gratitude Bank" collection in Firestore

---

## TIER 2: DIFFERENTIATING FEATURES
*Features that set EchoVault apart from competitors*

### 6. Goal Tracking Dashboard
**Priority: High | Effort: Medium | Impact: Very High**

**The Gap:** EchoVault detects goals in entries (`@goal:` tags) but has no structured goal management.

**The Feature:**
- **Explicit Goal Setting**: Create goals with target dates
- **Progress Visualization**: Progress bars and milestone tracking
- **Entry Linking**: See all entries mentioning a goal
- **AI Goal Insights**: "You mention career growth 3x this week but haven't taken action steps"
- **Goal Status**: Active, achieved, abandoned, struggling (already detected!)
- **Celebration Triggers**: Auto-celebrate when goal achieved

**Why It Matters:**
You're already extracting goal data—this surfaces it usefully. Goal tracking is a key feature of apps like Finch and Habitica that drive long-term engagement.

**Implementation:**
- New `goals` Firestore collection
- Dashboard component with progress visualization
- Link existing `@goal:` extraction to formal goals
- Goal-aware prompts ("How's [goal] going?")

---

### 7. Sleep & Activity Correlation
**Priority: Medium-High | Effort: Medium | Impact: High**

**The Gap:** No external data integration despite mood-tracking sophistication.

**The Feature:**
- **Apple Health / Google Fit Integration**: Import sleep, steps, HRV, heart rate
- **Correlation Analysis**: "Your mood is 23% better on days with 7+ hours of sleep"
- **Auto-Context**: Pre-populate journal entries with "You slept 6.2 hours last night"
- **Trend Visualization**: Overlay sleep data on mood heatmap
- **Trigger Identification**: Find correlations between biometrics and mood

**Why It Matters:**
Apps like Bearable and Daylio show users are hungry for holistic wellness tracking. Sleep is the #1 predictor of next-day mood according to research.

**Implementation:**
- Add HealthKit/Google Fit API integration
- New `healthData` field on entries
- Correlation analysis in insight generation
- Optional: Weather data (already used in Journal My Health)

---

### 8. Therapist Collaboration Mode
**Priority: Medium-High | Effort: Medium | Impact: High**

**The Gap:** Export exists but no real-time collaboration.

**The Feature:**
- **Shareable Summary Link**: Therapist gets read-only access to selected date ranges
- **Therapist Notes**: Therapists can add private notes to entries
- **Discussion Flags**: Mark entries to discuss in next session
- **Progress Reports**: Generate session-ready summary PDFs
- **Secure Sharing**: Time-limited, revocable access tokens

**Why It Matters:**
Computer-assisted CBT is most effective as a hybrid delivery method with clinician guidance. This positions EchoVault as a therapeutic tool, not just a personal app.

**Implementation:**
- Firestore security rules for shared access
- Shareable link generation with expiry
- Therapist view component (read-only)
- Discussion flags array on entries

---

### 9. Photo & Media Journaling
**Priority: Medium | Effort: Medium | Impact: Medium-High**

**The Gap:** Text and voice only—no visual journaling capability.

**The Feature:**
- **Photo Entries**: Attach photos to journal entries
- **AI Image Analysis**: Describe photo context and extract emotions
- **Photo Prompts**: "What's in this photo and why is it meaningful?"
- **Memory Timeline**: Visual gallery view of photo entries
- **Vision-to-Journal**: Upload photo, AI generates journal prompt about it

**Why It Matters:**
Visual journaling aids memory consolidation and emotional processing. Many users prefer photo-first capture, especially in moments of joy.

**Implementation:**
- Firebase Storage for images
- Gemini Vision API for image analysis
- Photo picker component
- Gallery view option in entry list

---

### 10. Advanced Mood Analytics Dashboard
**Priority: Medium | Effort: Medium | Impact: High**

**The Gap:** 30-day heatmap exists but no deeper analytics.

**The Feature:**
- **Time-of-Day Patterns**: "You feel best at 10am, worst at 3pm"
- **Day-of-Week Trends**: Enhanced visualization of weekly patterns
- **Tag Correlation Matrix**: Which tags co-occur with good/bad moods?
- **Trigger Word Cloud**: Visual representation of common themes
- **Comparison Views**: This month vs. last month, this year vs. last
- **Predictive Insights**: "Based on patterns, tomorrow may be challenging"

**Why It Matters:**
Visualization of mental health data heightens self-awareness and promotes proactive self-management. Users who see patterns make better decisions.

**Implementation:**
- New analytics dashboard component
- D3.js or Recharts for visualizations
- Aggregate queries on entries
- Gemini-generated insight overlays

---

## TIER 3: ENGAGEMENT & RETENTION FEATURES
*Features that keep users coming back*

### 11. Achievement System & Badges
**Priority: Medium | Effort: Low-Medium | Impact: Medium-High**

**The Feature:**
- **Milestone Badges**: First entry, 7-day streak, 30 entries, etc.
- **Behavior Badges**: "CBT Champion" (used CBT 10x), "Voice Journaler", "Night Owl"
- **Progress Levels**: Journaling levels that unlock with consistent use
- **Collections**: Badge collections for different journaling styles
- **Celebration Moments**: Special animations for achievements

**Why It Matters:**
Finch and Habitica prove that gamification dramatically increases retention. Even subtle rewards (badges) activate dopamine-driven motivation loops.

**Implementation:**
- `achievements` Firestore collection
- Achievement check on entry save
- Badge display component
- Achievement unlock animations

---

### 12. Entry Templates & Structured Journaling
**Priority: Medium | Effort: Low | Impact: Medium**

**The Feature:**
- **Pre-built Templates**: Morning pages, Evening reflection, Weekly review, Gratitude list
- **Custom Templates**: Users create their own structures
- **Template Prompts**: Each section has AI-suggested prompts
- **Grid Diary Style**: Optional structured format (like Grid Diary app)
- **Template Analytics**: Which templates correlate with mood improvement

**Why It Matters:**
Structured journaling helps users who feel overwhelmed by blank pages. Grid Diary's success shows demand for template-based approaches.

**Implementation:**
- Template schema in constants
- Template selector in prompt screen
- Section-by-section entry interface
- Template collection in Firestore

---

### 13. Search & Discovery
**Priority: Medium | Effort: Low | Impact: Medium**

**The Gap:** Semantic search exists via chat but no direct search UI.

**The Feature:**
- **Full-Text Search**: Find entries by keywords
- **Semantic Search**: "Find entries where I felt anxious about work"
- **Filter System**: By date, mood range, tags, entry type
- **"On This Day"**: Surface past entries from same date
- **Discovery Cards**: "You wrote something similar 3 months ago..."

**Why It Matters:**
One of the most requested features across all journaling app reviews. Instant access to past entries is a key digital advantage over paper.

**Implementation:**
- Search UI component
- Leverage existing embedding search
- Firestore composite queries
- "On This Day" cron/trigger

---

### 14. Expanded CBT Toolkit
**Priority: Medium | Effort: Medium | Impact: High**

**The Gap:** Primarily cognitive restructuring; missing exposure, problem-solving, behavioral experiments.

**The Feature:**
- **Thought Records**: Structured ABC (Activating event, Belief, Consequence) logging
- **Behavioral Experiments**: Design and track hypothesis testing
- **Problem-Solving Worksheets**: Guided problem breakdown and solution generation
- **Exposure Hierarchies**: For anxiety—graded exposure task tracking
- **Cognitive Distortion Library**: Learn and identify common thinking traps
- **Evidence Gathering**: Formal "evidence for/against" this thought exercise

**Why It Matters:**
Research shows comprehensive CBT apps (4+ techniques) are most effective. Anxiety Coach and CBT-i Coach have proven these features work.

**Implementation:**
- New `cbt_tools` Firestore collection
- Thought record component
- Behavioral experiment tracker
- Exposure hierarchy builder
- Link to related entries

---

### 15. Accountability Partner/Sharing (Optional)
**Priority: Low-Medium | Effort: Medium-High | Impact: Medium**

**The Feature:**
- **Trusted Contact**: Share selected entries with a friend/partner
- **Check-In Requests**: "Can you check on me today?"
- **Mood Alerts**: Partner notified if multiple low-mood days
- **Anonymous Sharing**: Share entries (anonymized) to get community support
- **Therapist Sharing**: Different from collaboration—more casual sharing

**Why It Matters:**
Research shows accountability partners boost goal achievement from 65% to 95%. HabitShare's success demonstrates demand for social accountability.

**Implementation:**
- Sharing permission system
- Partner invitation flow
- Shared feed view
- Privacy controls per entry

---

## TIER 4: POLISH & PROFESSIONALISM
*Features that elevate the overall experience*

### 16. Onboarding & Tutorial Flow
**Priority: Medium | Effort: Low-Medium | Impact: Medium-High**

**The Feature:**
- **Welcome Flow**: 3-5 screens explaining EchoVault's philosophy
- **Feature Discovery**: Interactive tooltips for first-time feature use
- **Personality Quiz**: Customize initial experience (voice vs. text, personal vs. work focus)
- **First Entry Guidance**: Hand-held first journal entry
- **Feature Unlocking**: Introduce features gradually to avoid overwhelm

**Why It Matters:**
First impressions determine retention. Apps like Headspace excel at onboarding because they make the first experience magical.

**Implementation:**
- Onboarding component sequence
- `onboarding_complete` flag on user
- Tooltip/tour library (React Joyride)
- Progressive feature revelation

---

### 17. Multiple Journal Categories/Spaces
**Priority: Low-Medium | Effort: Medium | Impact: Medium**

**The Feature:**
- **Beyond Personal/Work**: Add relationships, health, creativity, spirituality
- **Custom Categories**: Users create their own journal "spaces"
- **Category-Specific Prompts**: Tailored prompts per category
- **Category Analytics**: Mood patterns per life area
- **Default Category**: Set preferred category for quick entry

**Why It Matters:**
Penzu and Day One users value the ability to separate different aspects of life. More granular categorization = more useful pattern detection.

**Implementation:**
- Category management UI
- Extended category field (array vs. enum)
- Category-specific prompt banks
- Per-category analytics

---

### 18. End-to-End Encryption
**Priority: Medium | Effort: Medium-High | Impact: Medium**

**The Feature:**
- **Local Encryption**: Entries encrypted before leaving device
- **Zero-Knowledge Design**: Server never sees unencrypted content
- **Recovery Phrase**: User-controlled encryption key recovery
- **Encryption Indicators**: Visual confirmation of security status
- **Selective Encryption**: Choose which entries to encrypt

**Why It Matters:**
Penzu's military-grade encryption is a key differentiator. Mental health data is extremely sensitive—privacy builds trust.

**Implementation:**
- Client-side encryption library (libsodium-wrappers)
- Key derivation from user password
- Encrypted blob storage in Firestore
- Search limitations (encrypted entries require decrypt for search)

---

### 19. Audio Content Library
**Priority: Low | Effort: Medium | Impact: Medium**

**The Feature:**
- **Guided Meditations**: 5-10 minute audio sessions
- **Sleep Stories**: Calming narratives for bedtime (like Calm)
- **Affirmation Recordings**: Positive self-talk audio tracks
- **Soundscapes**: Background sounds for journaling (rain, ocean, forest)
- **User Recordings**: Save personal affirmations as audio

**Why It Matters:**
Calm and Headspace built empires on audio content. EchoVault already has TTS infrastructure—this extends it.

**Implementation:**
- Audio file hosting (Firebase Storage or CDN)
- Audio player component
- Content library screen
- Playback controls and progress tracking

---

### 20. Relapse Prevention & Recovery Mode
**Priority: Low-Medium | Effort: Medium | Impact: High (for target users)**

**The Feature:**
- **Recovery Tracking**: Track days in recovery (optional, user-configured)
- **Trigger Library**: Document personal triggers with coping strategies
- **HALT Check**: Hungry, Angry, Lonely, Tired assessment prompts
- **Urge Surfing Guidance**: Mindfulness for managing cravings
- **Support Network**: Quick-access contacts beyond crisis
- **Recovery Milestones**: Celebrate recovery anniversaries

**Why It Matters:**
For users in addiction recovery or managing recurring conditions, specialized tools are life-changing. This builds on existing safety features.

**Implementation:**
- Recovery mode toggle in settings
- Recovery-specific prompts and tracking
- HALT assessment component
- Trigger-coping strategy database
- Recovery milestone tracking

---

## Implementation Priority Matrix

| Feature | Impact | Effort | Priority Score | Recommended Order |
|---------|--------|--------|----------------|-------------------|
| 1. Guided Breathing | High | Low | 95 | **Sprint 1** |
| 2. Streak Tracking | Very High | Low | 98 | **Sprint 1** |
| 3. Weekly/Monthly Reviews | High | Medium | 85 | **Sprint 1** |
| 4. Smart Reminders | High | Low | 88 | **Sprint 1** |
| 5. Gratitude Framework | High | Medium | 82 | **Sprint 2** |
| 6. Goal Dashboard | Very High | Medium | 90 | **Sprint 2** |
| 7. Sleep/Activity Correlation | High | Medium | 78 | **Sprint 3** |
| 8. Therapist Collaboration | High | Medium | 76 | **Sprint 3** |
| 11. Achievements/Badges | Medium-High | Low-Medium | 75 | **Sprint 2** |
| 13. Search & Discovery | Medium | Low | 74 | **Sprint 2** |
| 16. Onboarding Flow | Medium-High | Low-Medium | 73 | **Sprint 3** |
| 9. Photo Journaling | Medium-High | Medium | 70 | **Sprint 4** |
| 10. Advanced Analytics | High | Medium | 72 | **Sprint 4** |
| 14. Expanded CBT | High | Medium | 71 | **Sprint 4** |
| 12. Entry Templates | Medium | Low | 68 | **Sprint 4** |
| 17. Multiple Categories | Medium | Medium | 60 | **Sprint 5** |
| 15. Accountability Partner | Medium | Medium-High | 55 | **Sprint 5** |
| 18. E2E Encryption | Medium | Medium-High | 58 | **Sprint 5** |
| 19. Audio Library | Medium | Medium | 50 | **Future** |
| 20. Relapse Prevention | High* | Medium | 65* | **Future** |

*Impact is very high for specific user segment

---

## Quick Wins (< 1 Week Each)

1. **Streak Counter**: Calculate from timestamps, display badge (~2-3 days)
2. **Search UI**: Wrap existing semantic search in UI (~2-3 days)
3. **Breathing Animations**: SVG breathing circle with timers (~3-4 days)
4. **On This Day**: Query past entries by date (~1-2 days)
5. **Gratitude Detection**: Add to classification prompt (~2-3 days)

---

## Research Sources

### Journaling App Best Practices
- [Zapier: Best Journal Apps 2025](https://zapier.com/blog/best-journaling-apps/)
- [Reflection.app: Complete Guide](https://www.reflection.app/blog/best-journaling-apps)
- [Rosebud: Best Journal Apps Comparison](https://www.rosebud.app/blog/best-journal-apps)

### AI & Mental Health Apps
- [Mindsera: AI Journal for Mental Wellbeing](https://www.mindsera.com/)
- [Choosing Therapy: Best Journal Apps](https://www.choosingtherapy.com/best-journal-apps/)
- [App Inventiv: Mental Health App Features](https://appinventiv.com/blog/mental-health-app-features/)

### Gamification & Retention
- [Naavik: Gamification in Habit Apps](https://naavik.co/deep-dives/deep-dives-new-horizons-in-gamification/)
- [Habitica: Gamified Task Management](https://habitica.com/)
- [Habit Rewards](https://habitrewards.me/)

### CBT & Evidence-Based Features
- [JMIR: CBT Apps Assessment](https://www.jmir.org/2021/7/e27619/)
- [Choosing Therapy: Best CBT Apps](https://www.choosingtherapy.com/best-cbt-apps/)
- [PMC: CBT Apps for Depression](https://pmc.ncbi.nlm.nih.gov/articles/PMC8367167/)

### Health Integration
- [Bearable: Symptom Tracker](https://bearable.app/)
- [CareClinic: Health Diary](https://careclinic.io/health-diary/)
- [Diarly: Apple Health Integration](https://diarly.app/help/integrating-apple-health)

### Visualization & Longitudinal Tracking
- [PMC: Data Visualization for Mental Health](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9100378/)
- [Therapy Trainings: Progress Tracking](https://www.therapytrainings.com/pages/blog/assessment-and-progress-tracking-the-power-of-data-driven-insights-in-therapy-apps)

### Mindfulness & Breathing
- [Calm: Meditation and Sleep](https://www.calm.com/)
- [Breathwrk: Health App](https://www.breathwrk.com/)
- [Oak: Meditation & Breathing](https://apps.apple.com/us/app/oak-meditation-breathing/id1210209691)

### Gratitude Research
- [Open MH: Science of Gratitude](https://openmh.org/the-science-backed-benefits-of-your-gratitude-journal-more-than-just-positive-thinking/)
- [Reflection: Power of Gratitude](https://www.reflection.app/blog/the-power-of-a-gratitude-journal-how-it-can-transform-your-life)

---

## Conclusion

EchoVault already has a **best-in-class AI foundation**—the therapeutic routing, contextual insights, and voice capabilities are exceptional. The roadmap above builds on these strengths while addressing key gaps in:

1. **Habit Formation** (streaks, reminders, gamification)
2. **Self-Reflection** (reviews, analytics, visualization)
3. **Holistic Wellness** (breathing, health data, gratitude)
4. **Discoverability** (search, templates, onboarding)

**Recommended First Sprint Focus:**
- Streak tracking (biggest retention lever)
- Guided breathing (makes existing support actionable)
- Smart reminders (drives daily engagement)
- Weekly reviews (surfaces existing pattern detection)

These four features together create a **habit loop**: reminder → entry → analysis → streak → weekly review → repeat.
