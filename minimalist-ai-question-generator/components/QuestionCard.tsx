import React, { useState } from 'react';
import { GeneratedQuestion } from '../types';

interface QuestionCardProps {
  data: GeneratedQuestion;
  index: number;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({ data, index }) => {
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 transition-all hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold">
              {index + 1}
            </span>
            <h3 className="text-base font-semibold text-slate-800 leading-tight">
              {data.question}
            </h3>
          </div>

          {/* Options Display */}
          {data.options && data.options.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pl-8">
              {data.options.map((option, idx) => (
                <div 
                  key={idx} 
                  className={`relative flex items-center p-3 rounded-lg border ${
                    showAnswer && option === data.correctAnswer 
                      ? "bg-green-50 border-green-200 text-green-800" 
                      : "bg-slate-50 border-transparent text-slate-700"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border mr-3 flex items-center justify-center ${
                      showAnswer && option === data.correctAnswer 
                      ? "border-green-500 bg-green-500"
                      : "border-slate-300"
                  }`}>
                    {showAnswer && option === data.correctAnswer && (
                       <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                       </svg>
                    )}
                  </div>
                  <span className="text-sm">{option}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 pl-8">
               <div className="h-24 w-full bg-slate-50 rounded-lg border border-slate-100 p-3 text-sm text-slate-400 italic">
                 (Khu vực trả lời tự luận của người học)
               </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer / Actions */}
      <div className="mt-6 pl-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between border-t border-slate-50 pt-4">
        <button
          onClick={() => setShowAnswer(!showAnswer)}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors"
        >
          {showAnswer ? 'Ẩn đáp án' : 'Xem đáp án & giải thích'}
          <svg 
            className={`w-4 h-4 transition-transform duration-200 ${showAnswer ? 'rotate-180' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Explanation Reveal */}
      {showAnswer && (
        <div className="mt-4 pl-8 animate-fadeIn">
          <div className="bg-indigo-50/50 rounded-lg p-4 border border-indigo-100">
            <p className="text-sm font-semibold text-indigo-900 mb-1">Đáp án: {data.correctAnswer}</p>
            <p className="text-sm text-slate-700 leading-relaxed">
              <span className="font-medium text-slate-900">Giải thích: </span>
              {data.explanation}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
