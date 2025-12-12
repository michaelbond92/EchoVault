import { transcribeAudioFn } from '../../config';

// Max file size in MB (Whisper API limit is 25MB)
const MAX_FILE_SIZE_MB = 25;

/**
 * Transcribe audio using Cloud Function (Whisper API)
 * @param {string} base64 - Base64 encoded audio
 * @param {string} mimeType - MIME type of the audio
 * @returns {Promise<string>} - Transcription text or error code
 */
export const transcribeAudio = async (base64, mimeType) => {
  try {
    // Calculate file size from base64 (base64 is ~33% larger than binary)
    const fileSizeBytes = (base64.length * 3) / 4;
    const fileSizeMB = fileSizeBytes / (1024 * 1024);

    console.log('Whisper transcription request (via Cloud Function):', {
      mimeType,
      audioSizeMB: fileSizeMB.toFixed(2),
      model: 'whisper-1'
    });

    // Client-side size check to avoid unnecessary network requests
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      console.error(`Audio file too large: ${fileSizeMB.toFixed(2)}MB (max ${MAX_FILE_SIZE_MB}MB)`);
      return 'FILE_TOO_LARGE';
    }

    const result = await transcribeAudioFn({ base64, mimeType });

    // Check for error response
    if (result.data?.error) {
      console.error('Transcription error:', result.data.error);
      return result.data.error;
    }

    const transcript = result.data?.transcript;

    if (!transcript) {
      console.error('Transcription returned no content');
      return 'API_NO_CONTENT';
    }

    console.log('Whisper transcription result:', transcript);
    return transcript;
  } catch (e) {
    console.error('Whisper API exception:', e);

    // Check for timeout errors
    if (e.code === 'functions/deadline-exceeded' || e.message?.includes('deadline') || e.message?.includes('timeout')) {
      return 'API_TIMEOUT';
    }

    return 'API_EXCEPTION';
  }
};
