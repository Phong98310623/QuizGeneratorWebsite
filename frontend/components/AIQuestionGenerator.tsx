import React, { useState } from 'react';
import { Difficulty, GeneratedQuestion, QuestionType } from '../types/quiz';
import { generateQuestions } from '../services/geminiService';
import { Button } from './quiz/Button';
import { Input } from './quiz/Input';
import { Select } from './quiz/Select';
import { QuestionCard } from './quiz/QuestionCard';

const AIQuestionGenerator: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);
  const [type, setType] = useState<QuestionType>(QuestionType.MULTIPLE_CHOICE);
  const [count, setCount] = useState<number>(5);

  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError("Vui lòng nhập chủ đề bạn muốn tạo câu hỏi.");
      return;
    }

    setLoading(true);
    setError(null);
    setQuestions([]);

    try {
      const result = await generateQuestions({
        topic,
        count,
        difficulty,
        type,
      });
      setQuestions(result);
    } catch (err: unknown) {
      setError("Đã có lỗi xảy ra khi tạo câu hỏi. Vui lòng thử lại. (Kiểm tra API Key nếu cần)");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyJSON = () => {
    if (questions.length === 0) return;
    const jsonStr = JSON.stringify(questions, null, 2);
    navigator.clipboard.writeText(jsonStr);
    alert("Đã sao chép dữ liệu JSON vào clipboard!");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-8">
        <div className="mb-8 text-center sm:text-left">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Tạo câu hỏi trong tích tắc</h2>
          <p className="text-slate-500 text-lg">
            Nhập chủ đề, chọn cấu hình và để AI giúp bạn soạn thảo bộ câu hỏi chất lượng cao.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="sm:col-span-2">
              <Input
                label="Chủ đề câu hỏi"
                placeholder="Ví dụ: Lịch sử Việt Nam thế kỷ 19, Javascript căn bản..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                autoFocus
              />
            </div>

            <Select
              label="Độ khó"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              options={[
                { label: 'Dễ (Easy)', value: Difficulty.EASY },
                { label: 'Trung bình (Medium)', value: Difficulty.MEDIUM },
                { label: 'Khó (Hard)', value: Difficulty.HARD },
              ]}
            />

            <Select
              label="Loại câu hỏi"
              value={type}
              onChange={(e) => setType(e.target.value as QuestionType)}
              options={[
                { label: 'Trắc nghiệm (MCQ)', value: QuestionType.MULTIPLE_CHOICE },
                { label: 'Đúng / Sai', value: QuestionType.TRUE_FALSE },
                { label: 'Tự luận ngắn', value: QuestionType.SHORT_ANSWER },
              ]}
            />

            <div className="sm:col-span-2">
              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-sm font-medium text-slate-700">Số lượng câu ({count})</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={count}
                  onChange={(e) => setCount(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-xs text-slate-400">
                  <span>1</span>
                  <span>10</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <Button onClick={handleGenerate} isLoading={loading} className="w-full sm:w-auto">
              Tạo câu hỏi
              <svg className="ml-2 -mr-1 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {questions.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800">Kết quả ({questions.length})</h3>
              <Button variant="secondary" onClick={handleCopyJSON} className="text-xs py-1.5 px-3 h-8">
                Sao chép JSON
              </Button>
            </div>

            <div className="space-y-4">
              {questions.map((q, index) => (
                <QuestionCard key={index} data={q} index={index} />
              ))}
            </div>

            <div className="text-center pt-8 pb-4">
              <p className="text-slate-400 text-sm">Nội dung được tạo bởi AI (Gemini) và có thể cần kiểm chứng.</p>
            </div>
          </div>
        )}

        {!loading && questions.length === 0 && !error && (
          <div className="text-center py-12 px-6 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
              <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h3 className="text-slate-900 font-medium text-lg mb-1">Chưa có câu hỏi nào</h3>
            <p className="text-slate-500 max-w-sm mx-auto">Nhập chủ đề và nhấn "Tạo câu hỏi" để bắt đầu.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default AIQuestionGenerator;
