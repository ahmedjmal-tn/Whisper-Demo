/**
 * Validators for audio file uploads.
 * Shared between client and server.
 */

export const ALLOWED_MIME_TYPES = [
  "audio/mpeg",        // .mp3
  "audio/mp3",         // .mp3 alt
  "audio/wav",         // .wav
  "audio/wave",        // .wav alt
  "audio/x-wav",       // .wav alt
  "audio/mp4",         // .m4a
  "audio/x-m4a",       // .m4a alt
  "audio/m4a",         // .m4a alt
  "audio/webm",        // .webm (from browser recording)
  "audio/ogg",         // .ogg
  "video/webm",        // some browsers send video/webm for audio recordings
] as const;

export const ALLOWED_EXTENSIONS = [
  ".mp3",
  ".wav",
  ".m4a",
  ".webm",
  ".ogg",
] as const;

/** Maximum file size in bytes: 25 MB */
export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

/** Maximum file size human-readable */
export const MAX_FILE_SIZE_LABEL = "25 MB";

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate an audio file on the client side.
 */
export function validateAudioFile(file: File): ValidationResult {
  // Check size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File is too large. Maximum size is ${MAX_FILE_SIZE_LABEL}. Your file: ${(file.size / (1024 * 1024)).toFixed(1)} MB.`,
    };
  }

  // Check extension
  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  const hasValidExtension = ALLOWED_EXTENSIONS.includes(ext as typeof ALLOWED_EXTENSIONS[number]);

  // Check MIME type
  const hasValidMime = ALLOWED_MIME_TYPES.includes(file.type as typeof ALLOWED_MIME_TYPES[number]);

  if (!hasValidExtension && !hasValidMime) {
    return {
      valid: false,
      error: `Invalid file type "${file.type || ext}". Accepted formats: MP3, WAV, M4A, WebM, OGG.`,
    };
  }

  if (file.size === 0) {
    return { valid: false, error: "File is empty." };
  }

  return { valid: true };
}

/**
 * Validate on the server side (buffer-based).
 */
export function validateServerFile(
  size: number,
  mimeType: string,
  fileName: string
): ValidationResult {
  if (size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File exceeds maximum size of ${MAX_FILE_SIZE_LABEL}.`,
    };
  }

  if (size === 0) {
    return { valid: false, error: "Uploaded file is empty." };
  }

  const ext = "." + fileName.split(".").pop()?.toLowerCase();
  const hasValidExtension = ALLOWED_EXTENSIONS.includes(ext as typeof ALLOWED_EXTENSIONS[number]);
  const hasValidMime = ALLOWED_MIME_TYPES.includes(mimeType as typeof ALLOWED_MIME_TYPES[number]);

  if (!hasValidExtension && !hasValidMime) {
    return {
      valid: false,
      error: `Invalid file type. Accepted: MP3, WAV, M4A, WebM, OGG.`,
    };
  }

  return { valid: true };
}
