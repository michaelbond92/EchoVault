/**
 * EchoVault Mobile Save Test Script
 *
 * Paste this into the browser console to test the recording and save flow.
 * Run each test function individually to verify specific functionality.
 */

const EchoVaultTests = {

  // Test 1: Check if all required logs appear during a recording
  async testRecordingFlow() {
    console.log('=== TEST: Recording Flow ===');
    console.log('Instructions:');
    console.log('1. Start a recording using the mic button');
    console.log('2. Record for at least 5 seconds');
    console.log('3. Stop the recording');
    console.log('4. Watch for these logs:');
    console.log('   ✓ [Recording] Starting microphone capture...');
    console.log('   ✓ [Recording] Using MIME type: audio/webm or audio/mp4');
    console.log('   ✓ [Recording] MediaRecorder started with 1s timeslice');
    console.log('   ✓ [Recording] Chunk received: X bytes (should appear every second)');
    console.log('   ✓ [Recording] Stopped. Total chunks: X');
    console.log('   ✓ [Recording] Created blob: X bytes');
    console.log('   ✓ [Recording] Base64 length: X');
    console.log('   ✓ [Recording] Sending to transcription...');
    console.log('');
    console.log('If any of these are missing, the recording failed at that step.');
  },

  // Test 2: Check transcription flow
  async testTranscriptionFlow() {
    console.log('=== TEST: Transcription Flow ===');
    console.log('After recording, watch for these logs:');
    console.log('   ✓ [Transcription] handleAudioWrapper called');
    console.log('   ✓ [Transcription] Audio data received: {base64Length: X, mime: "...", estimatedSizeKB: X}');
    console.log('   ✓ [Transcription] Wake lock acquired: true/false');
    console.log('   ✓ [Transcription] Audio backed up to localStorage');
    console.log('   ✓ [Transcription] Starting transcription API call...');
    console.log('   ✓ Whisper transcription request (via Cloud Function)');
    console.log('   ✓ Whisper transcription result: "your transcribed text..."');
    console.log('   ✓ [Transcription] API call completed in Xms');
    console.log('   ✓ [Transcription] Success! Clearing backup and saving entry...');
  },

  // Test 3: Check save entry flow (with temporal detection)
  async testSaveEntryFlow() {
    console.log('=== TEST: Save Entry Flow ===');
    console.log('After transcription, watch for these logs:');
    console.log('   ✓ [SaveEntry] Starting save process, text length: X');
    console.log('   ✓ [SaveEntry] Temporal detection result: {...}');
    console.log('   ✓ [SaveEntry] Date comparison: {effectiveDate: "...", today: "...", isToday: true/false}');
    console.log('');
    console.log('If isToday is TRUE:');
    console.log('   ✓ [SaveEntry] Detected date is today, saving normally without backdating');
    console.log('');
    console.log('If isToday is FALSE and confidence 0.5-0.8:');
    console.log('   ⚠ [SaveEntry] Needs confirmation, showing temporal modal');
    console.log('   → A modal should appear asking about backdating');
    console.log('');
    console.log('If no modal appears but entry doesnt save, thats the bug!');
  },

  // Test 4: Verify localStorage backup
  testLocalStorageBackup() {
    console.log('=== TEST: LocalStorage Backup ===');
    const backups = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('echov_audio_backup_')) {
        const data = JSON.parse(localStorage.getItem(key));
        backups.push({
          key,
          timestamp: new Date(data.timestamp).toLocaleString(),
          mime: data.mime,
          sizeKB: Math.round(data.base64.length / 1024)
        });
      }
    }

    if (backups.length === 0) {
      console.log('✓ No pending audio backups (good - means saves completed)');
    } else {
      console.log('⚠ Found pending audio backups:');
      backups.forEach(b => {
        console.log(`  - ${b.key}: ${b.sizeKB}KB, recorded ${b.timestamp}`);
      });
      console.log('These are recordings that failed to save.');
    }
    return backups;
  },

  // Test 5: Check Wake Lock support
  async testWakeLock() {
    console.log('=== TEST: Wake Lock Support ===');

    if ('wakeLock' in navigator) {
      console.log('✓ Wake Lock API is supported');
      try {
        const lock = await navigator.wakeLock.request('screen');
        console.log('✓ Wake Lock acquired successfully');
        await lock.release();
        console.log('✓ Wake Lock released');
      } catch (e) {
        console.log('⚠ Wake Lock request failed:', e.message);
      }
    } else {
      console.log('⚠ Wake Lock API not supported - will use video fallback on iOS');
    }

    // Check iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    console.log('iOS device:', isIOS);
  },

  // Test 6: Check MediaRecorder support
  testMediaRecorder() {
    console.log('=== TEST: MediaRecorder Support ===');

    if (typeof MediaRecorder === 'undefined') {
      console.log('✗ MediaRecorder not supported!');
      return;
    }

    console.log('✓ MediaRecorder is supported');

    const mimeTypes = [
      'audio/webm',
      'audio/webm;codecs=opus',
      'audio/mp4',
      'audio/ogg',
      'audio/wav'
    ];

    mimeTypes.forEach(mime => {
      const supported = MediaRecorder.isTypeSupported(mime);
      console.log(`  ${supported ? '✓' : '✗'} ${mime}`);
    });
  },

  // Test 7: Simulate temporal detection scenarios
  testTemporalScenarios() {
    console.log('=== TEST: Temporal Detection Scenarios ===');
    console.log('');
    console.log('Test phrases and expected behavior:');
    console.log('');
    console.log('SHOULD SAVE IMMEDIATELY (about today):');
    console.log('  "Today was a good day" → isToday=true → save without modal');
    console.log('  "This morning I went to the gym" → isToday=true → save without modal');
    console.log('  "Tonight I\'m going to relax" → isToday=true → save without modal');
    console.log('');
    console.log('SHOULD SHOW MODAL (about past):');
    console.log('  "Yesterday was rough" → isToday=false → show modal');
    console.log('  "Last week I felt better" → isToday=false → show modal');
    console.log('');
    console.log('SHOULD AUTO-BACKDATE (high confidence):');
    console.log('  "On Monday I had a meeting" (if today is Wed) → confidence>0.8 → auto-backdate');
  },

  // Test 8: Full end-to-end test checklist
  runFullTest() {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║           ECHOVAULT MOBILE SAVE TEST CHECKLIST               ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('Run through this checklist manually:');
    console.log('');
    console.log('□ 1. QUICK RECORDING TEST (5 seconds)');
    console.log('   - Tap mic, speak for 5 seconds, tap stop');
    console.log('   - Should see chunk logs every second');
    console.log('   - Entry should save and appear in feed');
    console.log('');
    console.log('□ 2. LONG RECORDING TEST (2-3 minutes)');
    console.log('   - Tap mic, speak for 2-3 minutes, tap stop');
    console.log('   - Watch for continuous chunk logs');
    console.log('   - Transcription should complete');
    console.log('   - Entry should save (or modal should appear)');
    console.log('');
    console.log('□ 3. TODAY REFERENCE TEST');
    console.log('   - Record: "Today has been really productive"');
    console.log('   - Should see: isToday=true in logs');
    console.log('   - Entry should save WITHOUT modal');
    console.log('');
    console.log('□ 4. PAST REFERENCE TEST');
    console.log('   - Record: "Yesterday was a tough day"');
    console.log('   - Should see: isToday=false in logs');
    console.log('   - Modal SHOULD appear asking about backdating');
    console.log('');
    console.log('□ 5. NETWORK RESILIENCE TEST');
    console.log('   - Enable airplane mode briefly during transcription');
    console.log('   - Should see retry attempts in logs');
    console.log('   - Should see "Audio backed up to localStorage"');
    console.log('');
    console.log('Run EchoVaultTests.testLocalStorageBackup() after tests');
    console.log('to check for any failed saves.');
  },

  // Clear test backups
  clearTestBackups() {
    console.log('=== Clearing Audio Backups ===');
    let count = 0;
    const keysToRemove = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('echov_audio_backup_')) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      count++;
    });

    console.log(`Cleared ${count} backup(s)`);
  }
};

// Print instructions
console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║              ECHOVAULT TEST UTILITIES LOADED                 ║');
console.log('╚══════════════════════════════════════════════════════════════╝');
console.log('');
console.log('Available commands:');
console.log('  EchoVaultTests.runFullTest()        - Show full test checklist');
console.log('  EchoVaultTests.testRecordingFlow()  - Recording flow instructions');
console.log('  EchoVaultTests.testTranscriptionFlow() - Transcription flow check');
console.log('  EchoVaultTests.testSaveEntryFlow()  - Save flow check');
console.log('  EchoVaultTests.testLocalStorageBackup() - Check pending backups');
console.log('  EchoVaultTests.testWakeLock()       - Test wake lock support');
console.log('  EchoVaultTests.testMediaRecorder()  - Test recording support');
console.log('  EchoVaultTests.testTemporalScenarios() - Show temporal test cases');
console.log('  EchoVaultTests.clearTestBackups()   - Clear stuck backups');
console.log('');
console.log('Start with: EchoVaultTests.runFullTest()');

// Make globally available
window.EchoVaultTests = EchoVaultTests;
