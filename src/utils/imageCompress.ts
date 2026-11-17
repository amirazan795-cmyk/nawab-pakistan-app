/**
 * Compresses an uploaded File or base64 data URL using an offscreen canvas
 * so images stay compact and safely below Firestore's 1MB document size limit.
 */
export const compressDataUrlOrFile = (
  input: File | string,
  maxSide = 820,
  quality = 0.7
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const processDataUrl = (dataUrl: string) => {
      if (!dataUrl.startsWith('data:image')) {
        resolve(dataUrl);
        return;
      }
      const img = new Image();
      img.onerror = () => resolve(dataUrl);
      img.onload = () => {
        let { width, height } = img;
        if (width > maxSide || height > maxSide) {
          if (width >= height) {
            height = Math.round((height * maxSide) / width);
            width = maxSide;
          } else {
            width = Math.round((width * maxSide) / height);
            height = maxSide;
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
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed.length < dataUrl.length ? compressed : dataUrl);
      };
      img.src = dataUrl;
    };

    if (typeof input === 'string') {
      processDataUrl(input);
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = () => {
      processDataUrl((reader.result as string) || '');
    };
    reader.readAsDataURL(input);
  });
};

/**
 * Compresses an image File or base64 data URL iteratively until its string length
 * is strictly <= maxBytes (preventing Firestore 1 MiB document size rejections).
 */
export const fitImageUnderBytes = async (
  input: File | string,
  maxBytes = 400000,
  initialMaxSide = 820,
  initialQuality = 0.72
): Promise<string> => {
  let current = await compressDataUrlOrFile(input, initialMaxSide, initialQuality);
  if (!current || !current.startsWith('data:image') || current.length <= maxBytes) {
    return current;
  }

  const attempts: [number, number][] = [
    [680, 0.58],
    [560, 0.5],
    [460, 0.44],
    [360, 0.38],
    [280, 0.32],
  ];

  for (const [side, quality] of attempts) {
    current = await compressDataUrlOrFile(current, side, quality);
    if (current.length <= maxBytes) {
      return current;
    }
  }

  return current;
};

/**
 * Recursively strips undefined keys from plain objects/arrays before writing to Firestore.
 */
export function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)) as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) {
        cleaned[k] = stripUndefined(v);
      }
    }
    return cleaned as T;
  }
  return value;
}
