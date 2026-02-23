import React from 'react';
import { SavedQuestionDetail } from '../../services/api';

interface QuestionDetailModalProps {
  question: SavedQuestionDetail;
  onClose: () => void;
}

const QuestionDetailModal: React.FC<QuestionDetailModalProps> = ({ question, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 mb-4">
          <h3 className="text-lg font-semibold text-slate-800 flex-1">Chi tiết câu hỏi</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <p className="text-slate-800 font-medium mb-4">{question.content}</p>
        <div className="space-y-2 mb-4">
          {question.options && question.options.length > 0 ? (
            question.options.map((opt) => (
              <div
                key={opt.text}
                className={`px-4 py-2 rounded-lg border ${
                  opt.isCorrect ? 'border-green-500 bg-green-50 text-green-800' : 'border-slate-200 bg-slate-50'
                }`}
              >
                {opt.text}
                {opt.isCorrect && <span className="ml-2 text-xs font-medium text-green-600">(Đáp án đúng)</span>}
              </div>
            ))
          ) : question.correctAnswer ? (
            <div className="px-4 py-2 rounded-lg border border-green-500 bg-green-50 text-green-800">
              {question.correctAnswer} <span className="ml-2 text-xs font-medium text-green-600">(Đáp án đúng)</span>
            </div>
          ) : null}
        </div>
        {question.explanation && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-sm font-medium text-amber-800 mb-1">Lời giải thích</p>
            <p className="text-slate-700 text-sm">{question.explanation}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionDetailModal;
