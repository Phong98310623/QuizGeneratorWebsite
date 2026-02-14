import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { publicApi, attemptsApi, PlayQuestion, QuestionSetMeta } from '../services/api';

const PlayPage: React.FC = () => {
  const { pin } = useParams<{ pin: string }>();
  const navigate = useNavigate();
  const [meta, setMeta] = useState<QuestionSetMeta | null>(null);
  const [questions, setQuestions] = useState<PlayQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const hasSavedToServer = useRef(false);

  const normalizedPin = pin ? decodeURIComponent(pin).trim().toUpperCase() : '';

  useEffect(() => {
    if (!normalizedPin) {
      setError('Mã PIN không hợp lệ');
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      setError('');
      try {
        const [setRes, questionsRes] = await Promise.all([
          publicApi.getSetByPin(normalizedPin),
          publicApi.getQuestionsByPin(normalizedPin),
        ]);
        setMeta(setRes);
        setQuestions(questionsRes);
        if (questionsRes.length === 0) setError('Bộ câu hỏi trống.');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Không tải được bộ câu hỏi.');
      } finally {
        setLoading(false);
      }
    })();
  }, [normalizedPin]);

  const current = questions[index];
  const isLast = index >= questions.length - 1;
  const isCorrect = current && selected !== null && (current.options?.find((o) => o.text === selected)?.isCorrect ?? current.correctAnswer === selected);

  const handleNext = () => {
    if (isLast) return;
    setIndex((i) => i + 1);
    setSelected(null);
    setSubmitted(false);
  };

  const handleSubmit = () => {
    if (selected === null || !current) return;
    setSubmitted(true);
    setAnswers((prev) => ({ ...prev, [current.id]: selected }));
    if (isCorrect) setCorrectCount((c) => c + 1);
  };

  const handleFinish = async () => {
    setIndex(questions.length);
    if (meta && normalizedPin && questions.length > 0 && !hasSavedToServer.current) {
      hasSavedToServer.current = true;
      const token = localStorage.getItem('auth_token');
      const allAnswers = questions.map((q) => ({
        questionId: q.id,
        selectedAnswer: answers[q.id] ?? (current && q.id === current.id ? selected ?? '' : ''),
      }));
      if (token) {
        try {
          await attemptsApi.submit(token, normalizedPin, allAnswers);
        } catch {
          hasSavedToServer.current = false;
        }
      }
    }
  };

  const handlePlayAgain = () => {
    setIndex(0);
    setSelected(null);
    setSubmitted(false);
    setCorrectCount(0);
    setAnswers({});
    hasSavedToServer.current = false;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error || !meta) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <p className="text-red-600 mb-4">{error || 'Bộ câu hỏi không tồn tại.'}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Bộ câu hỏi trống.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  const finished = index >= questions.length;
  if (finished) {
    const total = questions.length;
    const correct = correctCount;
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-slate-800 mb-2">Kết quả</h2>
          <p className="text-3xl font-bold text-indigo-600 mb-1">{correct} / {total}</p>
          <p className="text-slate-500 mb-6">câu đúng</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
            >
              Về trang chủ
            </button>
            <button
              onClick={handlePlayAgain}
              className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium"
            >
              Làm lại
            </button>
            <button
              onClick={() => navigate('/explore')}
              className="px-4 py-2 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 text-sm font-medium"
            >
              Khám phá thêm
            </button>
          </div>
        </div>
      </div>
    );
  }

  const q = current;
  const options = q.options?.length ? q.options : (q.correctAnswer ? [{ text: q.correctAnswer, isCorrect: true }] : []);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 py-3 px-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="text-slate-500 hover:text-slate-700 text-sm"
          >
            Thoát
          </button>
          <span className="text-sm font-medium text-slate-600">{meta.title}</span>
          <span className="text-sm text-slate-400">{index + 1} / {questions.length}</span>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-6">{q.content}</h2>
          <div className="space-y-2">
            {options.map((opt) => {
              const isChosen = selected === opt.text;
              const showRight = submitted && opt.isCorrect;
              const showWrong = submitted && isChosen && !opt.isCorrect;
              return (
                <button
                  key={opt.text}
                  type="button"
                  disabled={submitted}
                  onClick={() => !submitted && setSelected(opt.text)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                    showRight ? 'border-green-500 bg-green-50 text-green-800' :
                    showWrong ? 'border-red-500 bg-red-50 text-red-800' :
                    isChosen ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {opt.text}
                </button>
              );
            })}
          </div>
          {q.explanation && submitted && (
            <p className="mt-4 text-sm text-slate-600 p-3 bg-slate-50 rounded-lg">{q.explanation}</p>
          )}
          <div className="mt-6 flex justify-end gap-2">
            {!submitted ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={selected === null}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                Xác nhận
              </button>
            ) : isLast ? (
              <button
                type="button"
                onClick={handleFinish}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Xem kết quả
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Câu tiếp
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PlayPage;
