import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { setsApi, publicApi, userFavoritesApi } from '../services/api';

const PERSONAL_COLLECTION_NAME = 'câu hỏi cá nhân';
import { Input } from '../components/quiz/Input';
import { Select } from '../components/quiz/Select';

interface OptionItem {
  id: string;
  text: string;
  isCorrect: boolean;
}

const CustomizeQuestion: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [explanation, setExplanation] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [options, setOptions] = useState<OptionItem[]>([
    { id: '1', text: '', isCorrect: false },
    { id: '2', text: '', isCorrect: false },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedPin, setSavedPin] = useState<string | null>(null);

  const addOption = () => {
    setOptions((prev) => [...prev, { id: Date.now().toString(), text: '', isCorrect: false }]);
  };

  const removeOption = (id: string) => {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((o) => o.id !== id));
  };

  const updateOption = (id: string, field: 'text' | 'isCorrect', value: string | boolean) => {
    setOptions((prev) =>
      prev.map((o) => {
        if (o.id !== id) {
          if (field === 'isCorrect' && value === true) return { ...o, isCorrect: false };
          return o;
        }
        return { ...o, [field]: value };
      })
    );
  };

  const setCorrectOption = (id: string) => {
    setOptions((prev) => prev.map((o) => ({ ...o, isCorrect: o.id === id })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Vui lòng nhập tiêu đề bộ câu hỏi.');
      return;
    }
    if (!content.trim()) {
      setError('Vui lòng nhập nội dung câu hỏi.');
      return;
    }

    const validOptions = options.filter((o) => o.text.trim());
    if (validOptions.length < 2) {
      setError('Cần ít nhất 2 đáp án.');
      return;
    }
    const hasCorrect = validOptions.some((o) => o.isCorrect);
    if (!hasCorrect) {
      setError('Vui lòng chọn đáp án đúng.');
      return;
    }

    if (!isAuthenticated) {
      setError('Bạn cần đăng nhập để tạo câu hỏi.');
      return;
    }

    setSaving(true);
    try {
      const correctAnswer = validOptions.find((o) => o.isCorrect)!.text.trim();
      const result = await setsApi.create(null as any, {
        title: title.trim(),
        description: description.trim() || undefined,
        type: 'custom',
        questions: [
          {
            content: content.trim(),
            options: validOptions.map((o) => ({ text: o.text.trim(), isCorrect: o.isCorrect })),
            correctAnswer,
            explanation: explanation.trim() || undefined,
            difficulty,
          },
        ],
      });
      setSavedPin(result.pin || null);

      if (result.pin) {
        try {
          const questions = await publicApi.getQuestionsByPin(result.pin);
          const favData = await userFavoritesApi.get(null as any);
          let col = favData.savedCollections.find((c) => c.name === PERSONAL_COLLECTION_NAME);
          if (!col) {
            const created = await userFavoritesApi.createCollection(null as any, PERSONAL_COLLECTION_NAME);
            col = created;
          }
          for (const q of questions) {
            await userFavoritesApi.addToCollection(null as any, col!.nameid, q.id);
          }
        } catch {
          // Lưu collection thất bại, không chặn flow chính
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyPlayLink = () => {
    if (!savedPin) return;
    const url = `${window.location.origin}${window.location.pathname}#/play/${encodeURIComponent(savedPin)}`;
    navigator.clipboard.writeText(url);
    alert('Đã sao chép link chơi!');
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <Link to="/profile" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-600 mb-6">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Quay lại Hồ sơ
        </Link>

        <h1 className="text-2xl font-bold text-slate-800 mb-6">Tạo câu hỏi thủ công</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <Input
              label="Tiêu đề bộ câu hỏi *"
              placeholder="Ví dụ: Ôn tập Lịch sử chương 1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Mô tả (tùy chọn)</label>
              <textarea
                placeholder="Mô tả ngắn gọn về bộ câu hỏi..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-slate-800">Câu hỏi</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Nội dung câu hỏi *</label>
              <textarea
                placeholder="Nhập nội dung câu hỏi..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                required
              />
            </div>

            <Select
              label="Độ khó"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              options={[
                { label: 'Dễ', value: 'easy' },
                { label: 'Trung bình', value: 'medium' },
                { label: 'Khó', value: 'hard' },
              ]}
            />

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-700">Các đáp án *</label>
                <button
                  type="button"
                  onClick={addOption}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  + Thêm đáp án
                </button>
              </div>
              <p className="text-xs text-slate-500 mb-3">Chọn đáp án đúng bằng cách bấm vào ô vuông bên cạnh.</p>
              <div className="space-y-3">
                {options.map((opt) => (
                  <div key={opt.id} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCorrectOption(opt.id)}
                      className={`w-6 h-6 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                        opt.isCorrect ? 'border-green-500 bg-green-50' : 'border-slate-300 hover:border-slate-400'
                      }`}
                      title="Đánh dấu đáp án đúng"
                    >
                      {opt.isCorrect && (
                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                    <input
                      type="text"
                      placeholder="Nội dung đáp án"
                      value={opt.text}
                      onChange={(e) => updateOption(opt.id, 'text', e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(opt.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="Xóa đáp án"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Lời giải thích (tùy chọn)</label>
              <textarea
                placeholder="Giải thích đáp án đúng..."
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          {savedPin ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-green-800 font-medium mb-2">Đã tạo thành công!</p>
              <p className="text-sm text-green-700 mb-3">Mã PIN: <span className="font-mono font-bold">{savedPin}</span></p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCopyPlayLink}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                >
                  Sao chép link chơi
                </button>
                <Link
                  to={`/play/${encodeURIComponent(savedPin)}`}
                  className="px-4 py-2 border border-green-600 text-green-700 rounded-lg hover:bg-green-50 text-sm font-medium"
                >
                  Làm bài ngay
                </Link>
                <button
                  type="button"
                  onClick={() => { setSavedPin(null); setTitle(''); setContent(''); setOptions([{ id: '1', text: '', isCorrect: false }, { id: '2', text: '', isCorrect: false }]); setExplanation(''); setDescription(''); }}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm"
                >
                  Tạo mới
                </button>
              </div>
            </div>
          ) : (
            <button
              type="submit"
              disabled={saving}
              className="w-full px-4 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? 'Đang lưu...' : 'Lưu và tạo bộ câu hỏi'}
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default CustomizeQuestion;
