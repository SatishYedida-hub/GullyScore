// Client-side image compression. We downscale to a small square thumbnail
// (good enough for team crests and player avatars) and re-encode as JPEG
// so the resulting base64 data URL fits comfortably in a Mongo document.

const DEFAULT_OPTIONS = {
  maxSize: 256, // square: fits neatly in all avatar sizes, ~20-40KB jpeg
  type: 'image/jpeg',
  quality: 0.82,
};

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () =>
      reject(reader.error || new Error('Could not read file'));
    reader.readAsDataURL(file);
  });

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image failed to load'));
    img.src = src;
  });

/**
 * Turn a File (from a <input type="file">) into a compressed square data URL.
 * Centers and crops the image to a square before resizing, so avatars look
 * consistent regardless of the source aspect ratio.
 */
export const compressImage = async (file, options = {}) => {
  if (!file) throw new Error('No file provided');
  if (!file.type || !file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  const { maxSize, type, quality } = { ...DEFAULT_OPTIONS, ...options };

  const dataUrl = await readFileAsDataUrl(file);
  const img = await loadImage(dataUrl);

  // Crop to a centered square from the source image to avoid stretching.
  const srcSize = Math.min(img.width, img.height);
  const sx = (img.width - srcSize) / 2;
  const sy = (img.height - srcSize) / 2;

  const targetSize = Math.min(maxSize, srcSize);

  const canvas = document.createElement('canvas');
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext('2d');
  // A slight background prevents transparent pixels from turning black when
  // exporting to JPEG.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, targetSize, targetSize);
  ctx.drawImage(img, sx, sy, srcSize, srcSize, 0, 0, targetSize, targetSize);

  return canvas.toDataURL(type, quality);
};
