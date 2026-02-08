import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GeneratedQuestion, GeneratorConfig, QuestionType } from "../types";

// Initialize the client. 
// Note: In a real production app, you might proxy this through a backend to hide the key, 
// but for this client-side demo, we use the env var directly as instructed.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      question: {
        type: Type.STRING,
        description: "Nội dung câu hỏi.",
      },
      options: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Danh sách các lựa chọn trả lời (nếu là trắc nghiệm). Để trống nếu là tự luận.",
      },
      correctAnswer: {
        type: Type.STRING,
        description: "Đáp án đúng.",
      },
      explanation: {
        type: Type.STRING,
        description: "Giải thích ngắn gọn tại sao đáp án này đúng.",
      },
    },
    required: ["question", "correctAnswer", "explanation"],
  },
};

export const generateQuestions = async (config: GeneratorConfig): Promise<GeneratedQuestion[]> => {
  const modelId = "gemini-3-flash-preview"; 

  const prompt = `
    Hãy đóng vai một chuyên gia giáo dục.
    Nhiệm vụ: Tạo ra ${config.count} câu hỏi về chủ đề "${config.topic}".
    Độ khó: ${config.difficulty}.
    Loại câu hỏi: ${config.type}.
    Ngôn ngữ: Tiếng Việt.

    Yêu cầu bổ sung:
    - Nếu là Trắc nghiệm (Multiple Choice), hãy cung cấp 4 lựa chọn trong mảng 'options'.
    - Nếu là Đúng/Sai (True/False), hãy cung cấp 2 lựa chọn "Đúng" và "Sai" trong mảng 'options'.
    - Nếu là Tự luận ngắn (Short Answer), hãy để mảng 'options' rỗng.
    - Đảm bảo câu hỏi rõ ràng, chính xác và mang tính giáo dục.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.7, // Balance between creativity and precision
      },
    });

    if (response.text) {
      const data = JSON.parse(response.text) as GeneratedQuestion[];
      return data;
    }
    
    throw new Error("Không nhận được dữ liệu từ Gemini.");
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};
