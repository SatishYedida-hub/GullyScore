// Shared validation for photo uploads. Photos are stored directly in Mongo
// as base64 data URLs, so we cap size and enforce image MIME types.

const DATA_URL_RE = /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/;

// ~600KB of base64 ≈ ~450KB of decoded image data. More than enough for
// compressed avatars/crests from the frontend; protects Mongo document size.
const MAX_PHOTO_LENGTH = 600_000;

/**
 * Validate a user-supplied photo string.
 *
 * Returns an error message if invalid, or `null` if OK.
 * Empty string (or null/undefined) is treated as "clear the photo" and is
 * always valid.
 */
const validatePhoto = (value) => {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') return 'photo must be a string';
  if (value.length > MAX_PHOTO_LENGTH) {
    return 'photo is too large — please use a smaller image';
  }
  if (!DATA_URL_RE.test(value)) {
    return 'photo must be a base64 data URL (PNG, JPEG, WEBP or GIF)';
  }
  return null;
};

module.exports = {
  validatePhoto,
  MAX_PHOTO_LENGTH,
};
