import * as pdfjsLib from 'pdfjs-dist';

// Use a CDN that is more reliable than cdnjs for recent versions
// jsDelivr or unpkg are usually better for matching npm versions exactly
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

/**
 * Trích xuất toàn bộ văn bản từ file PDF
 * @param file File PDF từ input
 * @returns Nội dung text của PDF
 */
export const extractTextFromPdf = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }

    if (!fullText.trim()) {
      throw new Error('Không tìm thấy nội dung văn bản trong file PDF này (có thể là file ảnh scan).');
    }

    return fullText;
  } catch (err: any) {
    console.error('PDF extraction error:', err);
    throw new Error(err.message || 'Lỗi khi trích xuất văn bản từ PDF.');
  }
};
