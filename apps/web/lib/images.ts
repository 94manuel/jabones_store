const publicFilePath = '/api/backend/files/public';
const fallbackProductImage = '/products/coco-puro.svg';

export function productImageSrc(imageUrl?: string) {
  const value = imageUrl?.trim();
  if (!value) return fallbackProductImage;
  if (value.startsWith(publicFilePath)) return value;

  try {
    const url = new URL(value);
    if (url.pathname === publicFilePath) return `${url.pathname}${url.search}`;
  } catch {
    return value;
  }

  return value;
}
