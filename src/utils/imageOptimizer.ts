/**
 * Optimizes an image data URL for vision model analysis.
 * Preserves aspect ratio while capping maximum dimension at 1800px.
 * Keeps payload lightweight and avoids timeouts while maintaining full OCR sharpness.
 */
export async function optimizeImageForAnalysis(dataUrl: string, maxDimension = 1800): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      // If already within bounds, return as is
      if (width <= maxDimension && height <= maxDimension && dataUrl.length < 2 * 1024 * 1024) {
        resolve(dataUrl);
        return;
      }

      // Scale down proportionally
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Use jpeg with 0.90 quality for fast payload transfer
      const optimized = canvas.toDataURL('image/jpeg', 0.90);
      resolve(optimized);
    };

    img.onerror = () => {
      // Fallback to original if loading fails
      resolve(dataUrl);
    };

    img.src = dataUrl;
  });
}
