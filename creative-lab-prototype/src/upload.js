export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export function validateImage(file, maxMB = 10) {
  if (!file) return 'Choose a photo to get started.';
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    return 'Choose a JPG, PNG or WebP photo. Other file types are not supported.';
  if (file.size > maxMB * 1024 * 1024) return `This photo is too large. Choose a file smaller than ${maxMB} MB.`;
  if (file.size === 0) return 'This file is empty. Please choose another photo.';
  return '';
}
