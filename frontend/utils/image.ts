export const MAX_AVATAR_BYTES = 450000;

export const resizeImageToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      const max = 200;
      let w = img.width;
      let h = img.height;
      if (w > max || h > max) {
        if (w > h) {
          h = (h * max) / w;
          w = max;
        } else {
          w = (w * max) / h;
          h = max;
        }
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas not supported'));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      let quality = 0.85;
      const tryExport = () => {
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        if (dataUrl.length > MAX_AVATAR_BYTES && quality > 0.3) {
          quality -= 0.15;
          tryExport();
        } else {
          resolve(dataUrl);
        }
      };
      tryExport();
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Không đọc được ảnh'));
    };
    img.src = url;
  });
};
