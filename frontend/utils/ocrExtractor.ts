import { createWorker } from 'tesseract.js';

/**
 * Trích xuất văn bản từ ảnh (PNG, JPG) sử dụng Tesseract.js
 * @param file File ảnh từ input
 * @param onProgress Callback để theo dõi tiến trình (%)
 * @returns Nội dung text của ảnh
 */
export const extractTextFromImage = async (
  file: File, 
  onProgress?: (progress: number) => void
): Promise<string> => {
  const worker = await createWorker('vie+eng', 1, {
    logger: m => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(Math.round(m.progress * 100));
      }
    }
  });

  try {
    const imageUrl = URL.createObjectURL(file);
    const { data: { text } } = await worker.recognize(imageUrl);
    URL.revokeObjectURL(imageUrl);
    
    if (!text.trim()) {
      throw new Error('Không thể trích xuất văn bản từ ảnh này.');
    }

    return text;
  } catch (err: any) {
    console.error('OCR extraction error:', err);
    throw new Error(err.message || 'Lỗi khi trích xuất văn bản từ ảnh.');
  } finally {
    await worker.terminate();
  }
};
