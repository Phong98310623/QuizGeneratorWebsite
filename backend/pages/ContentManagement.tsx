
import React from 'react';
import { BookOpen, FileText, Plus, Search, Filter, Layers } from 'lucide-react';

const ContentManagement: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Content Manager</h1>
          <p className="text-slate-500 mt-1">Curate questions, sets, and educational material.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
          <Plus size={20} />
          Create New Set
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Total Questions</p>
            <h3 className="text-2xl font-bold text-slate-900">12,402</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-purple-50 p-3 rounded-xl text-purple-600">
            <Layers size={24} />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Question Sets</p>
            <h3 className="text-2xl font-bold text-slate-900">842</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-orange-50 p-3 rounded-xl text-orange-600">
            <BookOpen size={24} />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Verified Sets</p>
            <h3 className="text-2xl font-bold text-slate-900">156</h3>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 bg-indigo-50 text-indigo-600 text-sm font-bold rounded-lg border border-indigo-100">Question Sets</button>
            <button className="px-4 py-2 text-slate-600 text-sm font-medium hover:bg-slate-50 rounded-lg">Individual Questions</button>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search content..." 
                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm w-full outline-none"
              />
            </div>
            <button className="p-2 border border-slate-200 rounded-lg text-slate-500">
              <Filter size={18} />
            </button>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: 'Advanced React Patterns', desc: 'Hooks, Suspense, and Concurrent rendering.', count: 25, type: 'Technical' },
            { title: 'World History 101', desc: 'From the Industrial Revolution to Modern Day.', count: 50, type: 'Academic' },
            { title: 'Python for Beginners', desc: 'Data types, loops, and functions basics.', count: 15, type: 'Technical' },
            { title: 'Biology Basics', desc: 'Cell structures and fundamental processes.', count: 30, type: 'Academic' },
            { title: 'Capital Cities of Asia', desc: 'Geography quiz covering 48 countries.', count: 48, type: 'Geography' },
            { title: 'Logistics Management', desc: 'Supply chain principles and flows.', count: 20, type: 'Business' },
          ].map((set, i) => (
            <div key={i} className="group p-5 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:shadow-lg transition-all">
              <div className="flex justify-between items-start mb-4">
                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-tight">{set.type}</span>
                <div className="flex items-center gap-1 text-slate-400 text-xs font-medium">
                  <FileText size={12} />
                  {set.count} Qs
                </div>
              </div>
              <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{set.title}</h4>
              <p className="text-xs text-slate-500 mt-2 line-clamp-2">{set.desc}</p>
              <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                <div className="flex -space-x-2">
                  {[1,2,3].map(n => (
                    <img key={n} src={`https://picsum.photos/seed/${n+i}/24/24`} className="w-6 h-6 rounded-full border-2 border-white" alt="" />
                  ))}
                  <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-slate-400">+12</div>
                </div>
                <button className="text-xs font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">Edit Details</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ContentManagement;
