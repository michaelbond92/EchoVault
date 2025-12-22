import { transcribeAudioFn } from '../../config';

/**
 * Transcribe audio using Cloud Function (Whisper API)
 * @param {string} base64 - Base64 encoded audio
 * @param {string} mimeType - MIME type of the audio
 * @returns {Promise<string>} - Transcription text or error code
 */
export const transcribeAudio = async (base64, mimeType) => {
  const startTime = Date.now();
  try {
    console.log('[EchoVault] Starting transcription:', {
      mimeType,
      base64Size: `${(base64.length / 1024).toFixed(1)} KB`,
      timestamp: new Date().toISOString()
    });

    const result = await transcribeAudioFn({ base64, mimeType });
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    // Check for error response
    if (result.data?.error) {
      console.error(`[EchoVault] Transcription error after ${elapsed}s:`, result.data.error);
      return result.data.error;
    }

    const transcript = result.data?.transcript;

    if (!transcript) {
      console.error(`[EchoVault] Transcription returned no content after ${elapsed}s`);
      return 'API_NO_CONTENT';
    }

    console.log(`[EchoVault] Transcription successful after ${elapsed}s:`, {
      transcriptLength: transcript.length,
      preview: transcript.substring(0, 100) + (transcript.length > 100 ? '...' : '')
    });
    return transcript;
  } catch (e) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.error(`[EchoVault] Transcription exception after ${elapsed}s:`, {
      name: e.name,
      message: e.message,
      code: e.code
    });
    return 'API_EXCEPTION';
  }
};
