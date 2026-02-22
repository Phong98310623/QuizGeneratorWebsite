import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Difficulty, GeneratedQuestion, QuestionType } from '../types/quiz';
import { useAuth } from '../context/AuthContext';
import { aiApi, setsApi } from '../services/api';
import { Button } from './quiz/Button';
import { Input } from './quiz/Input';
import { Select } from './quiz/Select';
import { QuestionCard } from './quiz/QuestionCard';
import { extractTextFromPdf } from '../utils/pdfExtractor';
import { extractTextFromImage } from '../utils/ocrExtractor';

type GenerationMode = 'topic' | 'file';

const difficultyToBackend = (d: Difficulty) => {
  if (d === Difficulty.EASY) return 'easy';
  if (d === Difficulty.HARD) return 'hard';
  return 'medium';
};

const AIQuestionGenerator: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [mode, setMode] = useState<GenerationMode>('topic');

  // Topic mode state
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);
  const [type, setType] = useState<QuestionType>(QuestionType.MULTIPLE_CHOICE);
  const [count, setCount] = useState<number>(5);

  // File mode state
  const [file, setFile] = useState<File | null>(null);
  const [textContent, setTextContent] = useState<string>('');
  const [filePreview, setFilePreview] = useState<string>('');
  const [fileDifficulty, setFileDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);
  const [fileType, setFileType] = useState<QuestionType>(QuestionType.MULTIPLE_CHOICE);
  const [fileCount, setFileCount] = useState<number>(5);
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Common state
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
    if (mode === 'topic') {
      setSaveTitle((prev) => (prev === '' || prev === topic ? topic : prev));
    }
  }, [topic, mode]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    const validExt = ['txt', 'md', 'pdf', 'png', 'jpg', 'jpeg'];
    const isImage = ['png', 'jpg', 'jpeg'].includes(ext || '');
    
    if (!validExt.includes(ext || '')) {
      setError('Chỉ hỗ trợ file text (.txt, .md), PDF (.pdf) và ảnh (.png, .jpg, .jpeg). Vui lòng chọn file đúng định dạng.');
      return;
    }

    if (selectedFile.size > 50 * 1024 * 1024) {
      setError('File quá lớn (tối đa 50MB).');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setTextContent(''); // Reset text content if any
    setProcessingProgress(0);

    // Read file preview or trigger extraction (PDF or OCR)
    if (ext === 'pdf') {
      setFilePreview('File PDF đã chọn. Đang trích xuất nội dung...');
      try {
        const text = await extractTextFromPdf(selectedFile);
        setTextContent(text);
        const preview = text.length > 500 ? text.substring(0, 500) + '...' : text;
        setFilePreview(`(Trích xuất từ PDF ${selectedFile.name}):\n\n${preview}`);
      } catch (err: any) {
        setError(err.message || 'Lỗi khi trích xuất PDF.');
        setFile(null);
        setFilePreview('');
      }
    } else if (isImage) {
      setFilePreview('Ảnh đã chọn. Đang xử lý OCR (nhận dạng chữ)...');
      try {
        const text = await extractTextFromImage(selectedFile, (progress) => {
          setProcessingProgress(progress);
        });
        setTextContent(text);
        const preview = text.length > 500 ? text.substring(0, 500) + '...' : text;
        setFilePreview(`(Trích xuất từ Ảnh ${selectedFile.name}):\n\n${preview}`);
      } catch (err: any) {
        setError(err.message || 'Lỗi khi trích xuất văn bản từ ảnh.');
        setFile(null);
        setFilePreview('');
      } finally {
        setProcessingProgress(0);
      }
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setTextContent(content);
        const preview = content.length > 500 ? content.substring(0, 500) + '...' : content;
        setFilePreview(preview);
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleGenerateFromTopic = async () => {
    if (!topic.trim()) {
      setError("Vui lòng nhập chủ đề bạn muốn tạo câu hỏi.");
      return;
    }

    if (!isAuthenticated) {
      setError('Bạn cần đăng nhập để tạo câu hỏi bằng AI.');
      return;
    }

    setLoading(true);
    setError(null);
    setSaveError(null);
    setQuestions([]);
    setSavedPin(null);

    try {
      const result = await aiApi.generate(null as any, {
        topic: topic.trim(),
        count,
        difficulty,
        type,
      });
      const list = result.data as GeneratedQuestion[];
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
        const saveResult = await setsApi.create(null as any, payload);
        setSavedPin(saveResult.pin || null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Đã có lỗi xảy ra. Vui lòng thử lại.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFromFile = async () => {
    if (!file && !textContent) {
      setError("Vui lòng chọn một file hoặc đợi quá trình trích xuất văn bản hoàn tất.");
      return;
    }

    if (!isAuthenticated) {
      setError('Bạn cần đăng nhập để tạo câu hỏi bằng AI.');
      return;
    }

    setLoading(true);
    setError(null);
    setSaveError(null);
    setQuestions([]);
    setSavedPin(null);

    try {
      const formData = new FormData();
      if (file) {
        formData.append('file', file);
      }
      if (textContent) {
        formData.append('textContent', textContent);
      }
      formData.append('count', String(fileCount));
      formData.append('difficulty', fileDifficulty);
      formData.append('type', fileType);
      formData.append('title', file?.name.replace(/\.[^/.]+$/, "") || "Bộ câu hỏi từ file"); // Remove extension

      const result = await aiApi.generateFromFile(null as any, formData);
      const list = result.data as GeneratedQuestion[];
      setQuestions(list);

      // Auto save
      const fileName = file.name.replace(/\.[^/.]+$/, "");
      const payload = {
        title: fileName,
        description: `Tạo từ file: ${file.name}`,
        type: fileType || undefined,
        questions: list.map((q) => ({
          content: q.question,
          options: q.options && q.options.length > 0 ? q.options : [q.correctAnswer],
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || undefined,
          difficulty: difficultyToBackend(fileDifficulty),
        })),
      };
      const saveResult = await setsApi.create(null as any, payload);
      setSavedPin(saveResult.pin || null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Đã có lỗi xảy ra. Vui lòng thử lại.';
      setError(msg);
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
    if (mode === 'topic') {
      setTimeout(() => topicInputRef.current?.focus(), 0);
    } else {
      setFile(null);
      setFilePreview('');
    }
  };

  const handleSaveSet = async () => {
    if (questions.length === 0) return;
    if (!saveTitle.trim()) {
      setSaveError('Vui lòng nhập tên bộ câu hỏi.');
      return;
    }
    if (!isAuthenticated) {
      setSaveError('Bạn cần đăng nhập để lưu bộ câu hỏi.');
      return;
    }
    setSaveError(null);
    setSaving(true);
    try {
      const difficulty = mode === 'topic' ? difficultyToBackend(fileDifficulty) : difficultyToBackend(fileDifficulty);
      const payload = {
        title: saveTitle.trim(),
        description: saveDescription.trim() || undefined,
        type: (mode === 'topic' ? type : fileType) || undefined,
        questions: questions.map((q) => ({
          content: q.question,
          options: q.options && q.options.length > 0 ? q.options : [q.correctAnswer],
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || undefined,
          difficulty,
        })),
      };
      const result = await setsApi.create(null as any, payload);
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
        <div className="mb-8 text-center sm:text-left">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Tạo câu hỏi trong tích tắc</h2>
          <p className="text-slate-500 text-lg">
            Nhập chủ đề hoặc tải lên file, để AI giúp bạn soạn thảo bộ câu hỏi chất lượng cao.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-200">
          <button
            onClick={() => setMode('topic')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              mode === 'topic'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Từ chủ đề
          </button>
          <button
            onClick={() => setMode('file')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              mode === 'file'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Từ file
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
          {mode === 'topic' ? (
            // Topic mode
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
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Tải lên file (.txt, .md, .pdf hoặc ảnh .png, .jpg)
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-slate-400 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.md,.pdf,.png,.jpg,.jpeg,text/plain,text/markdown,application/pdf,image/png,image/jpeg"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <svg className="mx-auto h-12 w-12 text-slate-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-slate-700 font-medium">
                    Kéo thả hoặc nhấp để chọn file
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Tối đa 50MB, hỗ trợ .txt, .md, .pdf
                  </p>
                </div>

                {file && (
                  <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm font-medium text-slate-700">
                        📄 {file.name} ({(file.size / 1024).toFixed(1)} KB)
                      </p>
                      {processingProgress > 0 && processingProgress < 100 && (
                        <span className="text-xs font-semibold text-indigo-600 animate-pulse">
                          Đang xử lý OCR: {processingProgress}%
                        </span>
                      )}
                    </div>
                    
                    {processingProgress > 0 && processingProgress < 100 && (
                      <div className="w-full bg-slate-200 rounded-full h-1.5 mb-3">
                        <div 
                          className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300" 
                          style={{ width: `${processingProgress}%` }}
                        ></div>
                      </div>
                    )}

                    {filePreview && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-slate-600 hover:text-slate-900 mb-2">
                          {file.name.match(/\.(pdf|png|jpg|jpeg)$/i) ? 'Nội dung trích xuất' : 'Xem trước nội dung'}
                        </summary>
                        <pre className="bg-white p-2 rounded border border-slate-200 overflow-auto max-h-40 text-slate-700 whitespace-pre-wrap break-words text-xs">
                          {filePreview}
                        </pre>
                      </details>
                    )}
                  </div>
                )}
              </div>

              <Select
                label="Độ khó"
                value={fileDifficulty}
                onChange={(e) => setFileDifficulty(e.target.value as Difficulty)}
                options={[
                  { label: 'Dễ (Easy)', value: Difficulty.EASY },
                  { label: 'Trung bình (Medium)', value: Difficulty.MEDIUM },
                  { label: 'Khó (Hard)', value: Difficulty.HARD },
                ]}
              />

              <Select
                label="Loại câu hỏi"
                value={fileType}
                onChange={(e) => setFileType(e.target.value as QuestionType)}
                options={[
                  { label: 'Trắc nghiệm (MCQ)', value: QuestionType.MULTIPLE_CHOICE },
                  { label: 'Đúng / Sai', value: QuestionType.TRUE_FALSE },
                  { label: 'Tự luận ngắn', value: QuestionType.SHORT_ANSWER },
                ]}
              />

              <div>
                <div className="flex flex-col gap-1.5 w-full">
                  <label className="text-sm font-medium text-slate-700">Số lượng câu ({fileCount})</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={fileCount}
                    onChange={(e) => setFileCount(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>1</span>
                    <span>10</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-end">
            <Button 
              onClick={mode === 'topic' ? handleGenerateFromTopic : handleGenerateFromFile} 
              isLoading={loading} 
              className="w-full sm:w-auto"
            >
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
                <p className="text-sm text-green-600 mb-4">Chia sẻ mã PIN, link hoặc quét mã QR để người khác vào làm bài.</p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-4">
                  <div className="bg-white p-3 rounded-xl border border-green-200 inline-flex shrink-0">
                    <QRCodeSVG
                      value={typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}#/play/${encodeURIComponent(savedPin)}` : ''}
                      size={160}
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                  <div className="text-center flex-1">
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-green-600 mb-1">Mã PIN</p>
                        <code className="block text-lg font-mono font-bold text-slate-800 bg-white px-3 py-2 rounded border border-green-200">
                          {savedPin}
                        </code>
                      </div>
                      <div>
                        <p className="text-xs text-green-600 mb-1">Link</p>
                        <button
                          onClick={handleCopyPlayLink}
                          className="w-full px-3 py-2 rounded border border-green-600 text-green-700 hover:bg-green-100 text-xs font-medium transition-colors"
                        >
                          Sao chép link
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
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
            <p className="text-slate-500 max-w-sm mx-auto">
              {mode === 'topic' 
                ? 'Nhập chủ đề và nhấn "Tạo câu hỏi" để bắt đầu.'
                : 'Chọn file và nhấn "Tạo câu hỏi" để bắt đầu.'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default AIQuestionGenerator;
