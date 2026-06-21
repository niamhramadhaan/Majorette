import React, { useState, useEffect } from 'react';
import { UploadCloud, Search, CheckCircle2, Trash2, Image as ImageIcon, Music, Clock, Film } from 'lucide-react';
import { createPortal } from 'react-dom';
import { cn } from '../lib/utils';
import { Pagination } from '../components/Pagination';
import { useNavigate } from 'react-router-dom';
import { STORAGE_KEYS, addActivity, getThumbnailUrl } from '../lib/storage';
import type { LocalContent } from '../types';

export default function Films() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [content, setContent] = useState<LocalContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('All');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<LocalContent | null>(null);

  useEffect(() => { loadContent(); }, []);

  const loadContent = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CONTENT);
      if (stored) setContent(JSON.parse(stored));
    } catch { /* ignore */ }
    setIsLoading(false);
  };

  const saveContent = (newContent: LocalContent[]) => {
    setContent(newContent);
    localStorage.setItem(STORAGE_KEYS.CONTENT, JSON.stringify(newContent));
  };

  const handleAction = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const TABS = ['All', 'Video', 'Audio', 'Image'];

  const filteredContent = content.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase());
    const matchesTab = activeTab === 'All' || item.type === activeTab.toLowerCase();
    return matchesSearch && matchesTab;
  });

  const itemsPerPage = 9;
  const totalPages = Math.ceil(filteredContent.length / itemsPerPage);

  const handleDelete = () => {
    if (!itemToDelete) return;
    const newContent = content.filter(c => c.id !== itemToDelete.id);
    saveContent(newContent);
    setItemToDelete(null);
    handleAction('Deleted "' + itemToDelete.title + '"');
    addActivity({ message: 'Deleted content: ' + itemToDelete.title, type: 'info' });
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video': return <Film className="w-6 h-6 text-gray-400" />;
      case 'audio': return <Music className="w-6 h-6 text-gray-400" />;
      default: return <ImageIcon className="w-6 h-6 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search by title..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm w-full sm:w-64 focus:outline-none focus:border-[#0E7B35] focus:ring-1 focus:ring-[#0E7B35]" />
          </div>
        </div>
        <button onClick={() => navigate('/films/ingest')} className="flex items-center justify-center gap-2 bg-[#0E7B35] hover:bg-[#0A5E28] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer">
          <UploadCloud className="w-4 h-4" /> Add Content
        </button>
      </div>

      {toastMessage && (
        <div className="bg-blue-50 text-blue-700 p-3 rounded-lg border border-blue-200 flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4" /><span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      <div className="flex gap-2 pb-2 overflow-x-auto hide-scrollbar">
        {TABS.map((tab) => (
          <button key={tab} onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
            className={cn("px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border", activeTab === tab ? "bg-[#0E7B35] text-white border-[#0E7B35]" : "bg-white text-gray-600 hover:bg-gray-50 border-gray-200")}>
            {tab}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0E7B35]"></div></div>
      ) : content.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Film className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-heading font-semibold text-gray-900 mb-2">No Content Yet</h3>
            <p className="text-gray-500 mb-6">Add media files to get started.</p>
            <button onClick={() => navigate('/films/ingest')} className="inline-flex items-center gap-2 px-6 py-3 bg-[#0E7B35] hover:bg-[#0A5E28] text-white rounded-lg text-sm font-medium transition-colors">
              <UploadCloud className="w-4 h-4" /> Add Content
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-4">
              {filteredContent.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((item) => (
                <div key={item.id} className="card p-5 group hover:border-[#B9EA38]/50 transition-colors flex flex-col h-full relative overflow-hidden">
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button onClick={(e) => { e.stopPropagation(); setItemToDelete(item); }} className="w-7 h-7 flex items-center justify-center bg-white text-gray-500 hover:text-red-500 rounded-md shadow-sm border border-gray-200 transition-colors" title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-start gap-4 mb-5 flex-1 min-w-0">
                    <div className="w-16 h-12 bg-gray-100 rounded-md flex items-center justify-center flex-shrink-0 border border-gray-200 overflow-hidden">
                      {getThumbnailUrl(item) ? (
                        <img src={getThumbnailUrl(item)!} alt="" className="w-full h-full object-cover" />
                      ) : (
                        getContentIcon(item.type)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-heading font-semibold text-gray-900 group-hover:text-[#0E7B35] transition-colors line-clamp-2 break-words">{item.title}</h4>
                      <div className="flex items-center gap-2 mt-1 min-w-0">
                        <span className={cn("px-2 py-0.5 rounded text-[10px] font-semibold uppercase flex-shrink-0",
                          item.type === 'video' ? "bg-purple-50 text-purple-600" : item.type === 'audio' ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-600")}>
                          {item.type}
                        </span>
                        <span className="text-xs text-gray-400 truncate">{item.fileName}</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-y-3 gap-x-2 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500"><Clock className="w-3.5 h-3.5 opacity-60" />{item.duration}s</div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500"><span className="text-[10px] text-gray-400">{new Date(item.createdAt).toLocaleDateString()}</span></div>
                  </div>
                </div>
              ))}
            </div>
            {filteredContent.length === 0 && <div className="p-12 text-center text-gray-400">No content found matching criteria.</div>}
          </div>
          {filteredContent.length > itemsPerPage && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
        </>
      )}

      {itemToDelete && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 text-center p-6">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4 border border-red-100"><Trash2 className="w-6 h-6 text-red-500" /></div>
            <h3 className="font-heading font-semibold text-lg text-gray-900 mb-2">Delete Content</h3>
            <p className="text-gray-500 text-sm mb-6">Are you sure you want to delete <span className="font-semibold text-gray-700">"{itemToDelete.title}"</span>?</p>
            <div className="flex items-center gap-3 w-full">
              <button onClick={() => setItemToDelete(null)} className="flex-1 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 rounded-lg text-sm font-medium transition-colors cursor-pointer">Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer shadow-sm">Delete</button>
            </div>
          </div>
        </div>, document.body
      )}
    </div>
  );
}
