import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Difficulty, GeneratedQuestion, QuestionType } from '../types/quiz';
import { aiApi, setsApi } from '../services/api';
import { Button } from './quiz/Button';
import { Input } from './quiz/Input';
import { Select } from './quiz/Select';
import { QuestionCard } from './quiz/QuestionCard';

const difficultyToBackend = (d: Difficulty) => {
  if (d === Difficulty.EASY) return 'easy';
  if (d === Difficulty.HARD) return 'hard';
  return 'medium';
};

const AIQuestionGenerator: React.FC = () => {
  const navigate = useNavigate();
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);
  const [type, setType] = useState<QuestionType>(QuestionType.MULTIPLE_CHOICE);
  const [count, setCount] = useState<number>(5);

  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [saveTitle, setSaveTitle] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedPin, setSavedPin] = useState<string | null>(null);
  const topicInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSaveTitle((prev) => (prev === '' || prev === topic ? topic : prev));
  }, [topic]);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError("Vui lòng nhập chủ đề bạn muốn tạo câu hỏi.");
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
      setError('Bạn cần đăng nhập để tạo câu hỏi bằng AI.');
      return;
    }

    setLoading(true);
    setError(null);
    setSaveError(null);
    setQuestions([]);
    setSavedPin(null);

    let list: GeneratedQuestion[] = [];
    try {
      const result = await aiApi.generate(token, {
        topic: topic.trim(),
        count,
        difficulty,
        type,
      });
      list = result.data as GeneratedQuestion[];
      setQuestions(list);

      if (result.fromCache && result.existingPin) {
        setSavedPin(result.existingPin);
      } else {
        const title = (saveTitle || topic).trim() || topic.trim();
        const payload = {
          title,
          description: saveDescription.trim() || undefined,
          type: type || undefined,
          questions: list.map((q) => ({
            content: q.question,
            options: q.options && q.options.length > 0 ? q.options : [q.correctAnswer],
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || undefined,
            difficulty: difficultyToBackend(difficulty),
          })),
          generatorTopic: topic.trim(),
          generatorCount: count,
          generatorDifficulty: difficulty,
          generatorType: type,
        };
        const saveResult = await setsApi.create(token, payload);
        setSavedPin(saveResult.pin || null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Đã có lỗi xảy ra. Vui lòng thử lại.';
      if (list.length > 0) {
        setQuestions(list);
        setSaveError(msg);
      } else {
        setError(msg);
      }
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

  const handleCopyPlayLink = () => {
    if (!savedPin) return;
    const url = `${window.location.origin}${window.location.pathname}#/play/${encodeURIComponent(savedPin)}`;
    navigator.clipboard.writeText(url);
    alert('Đã sao chép link chơi!');
  };

  const handleResetAndCreateAgain = () => {
    setQuestions([]);
    setSavedPin(null);
    setError(null);
    setSaveError(null);
    setTimeout(() => topicInputRef.current?.focus(), 0);
  };

  const handleSaveSet = async () => {
    if (questions.length === 0) return;
    if (!saveTitle.trim()) {
      setSaveError('Vui lòng nhập tên bộ câu hỏi.');
      return;
    }
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setSaveError('Bạn cần đăng nhập để lưu bộ câu hỏi.');
      return;
    }
    setSaveError(null);
    setSaving(true);
    try {
      const payload = {
        title: saveTitle.trim(),
        description: saveDescription.trim() || undefined,
        type: type || undefined,
        questions: questions.map((q) => ({
          content: q.question,
          options: q.options && q.options.length > 0 ? q.options : [q.correctAnswer],
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || undefined,
          difficulty: difficultyToBackend(difficulty),
        })),
        generatorTopic: topic.trim() || undefined,
        generatorCount: count,
        generatorDifficulty: difficulty,
        generatorType: type,
      };
      const result = await setsApi.create(token, payload);
      setSavedPin(result.pin || null);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Lỗi khi lưu.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-8">
        <nav className="text-sm text-slate-500 mb-6">
          <Link to="/dashboard" className="hover:text-indigo-600">Trang chủ</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-700">Tạo câu hỏi</span>
        </nav>
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
                ref={topicInputRef}
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

            <div className="sm:col-span-2">
              <Input
                label="Tên bộ câu hỏi (tùy chọn, mặc định = chủ đề)"
                placeholder="Để trống sẽ dùng chủ đề làm tên"
                value={saveTitle}
                onChange={(e) => setSaveTitle(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <input
                type="text"
                value={saveDescription}
                onChange={(e) => setSaveDescription(e.target.value)}
                placeholder="Mô tả (tùy chọn)"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              <p className="text-xs text-slate-400 mt-1">Nếu điền tên và mô tả trước, bộ câu hỏi sẽ được lưu với thông tin này.</p>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <Button onClick={handleGenerate} isLoading={loading} className="w-full sm:w-auto">
              Tạo câu hỏi (tự động lưu)
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
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xl font-bold text-slate-800">Kết quả ({questions.length})</h3>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={handleCopyJSON} className="text-xs py-1.5 px-3 h-8">
                  Sao chép JSON
                </Button>
                <Button variant="secondary" onClick={handleResetAndCreateAgain} className="text-xs py-1.5 px-3 h-8">
                  Tạo lại
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {questions.map((q, index) => (
                <QuestionCard key={index} data={q} index={index} />
              ))}
            </div>

            {savedPin ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                <p className="text-green-800 font-medium mb-1">Đã lưu bộ câu hỏi</p>
                <p className="text-2xl font-mono font-bold text-green-700 mb-3">{savedPin}</p>
                <p className="text-sm text-green-600 mb-4">Chia sẻ mã PIN hoặc link để người khác vào làm bài.</p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <button
                    type="button"
                    onClick={handleCopyPlayLink}
                    className="px-4 py-2 border border-green-600 text-green-700 rounded-lg hover:bg-green-100"
                  >
                    Sao chép link chơi
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/play/${encodeURIComponent(savedPin)}`)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Vào làm ngay
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h4 className="font-semibold text-slate-800 mb-3">Lưu bộ câu hỏi</h4>
                <p className="text-sm text-slate-500 mb-3">Tự động lưu thất bại hoặc bạn có thể chỉnh tên/mô tả và lưu lại.</p>
                <div className="space-y-3 mb-4">
                  <input
                    type="text"
                    value={saveTitle}
                    onChange={(e) => setSaveTitle(e.target.value)}
                    placeholder="Tên bộ câu hỏi"
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="text"
                    value={saveDescription}
                    onChange={(e) => setSaveDescription(e.target.value)}
                    placeholder="Mô tả (tùy chọn)"
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                {saveError && <p className="text-red-600 text-sm mb-2">{saveError}</p>}
                <button
                  type="button"
                  onClick={handleSaveSet}
                  disabled={saving}
                  className="inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 text-sm"
                >
                  {saving ? 'Đang lưu...' : 'Lưu bộ câu hỏi'}
                </button>
              </div>
            )}

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
