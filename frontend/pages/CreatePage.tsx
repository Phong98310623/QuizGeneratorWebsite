import React from 'react';
import AIQuestionGenerator from '../components/AIQuestionGenerator';

const CreatePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8">
        <AIQuestionGenerator />
      </div>
    </div>
  );
};

export default CreatePage;
