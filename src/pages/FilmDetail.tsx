import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { ArrowLeft, Film as FilmIcon, Clock, Calendar, Copy, Volume2, X, Image as ImageIcon, Music, Trash2, HardDrive } from 'lucide-react';
import { cn } from '../lib/utils';
import { STORAGE_KEYS, getThumbnailUrl, resolveFilePath, addActivity } from '../lib/storage';
import type { LocalContent } from '../types';

export default function FilmDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [film, setFilm] = useState<LocalContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDuration, setEditDuration] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CONTENT);
      if (stored) {
        const items: LocalContent[] = JSON.parse(stored);
        const found = items.find(item => item.id === id);
        if (found) {
          setFilm(found);
          setEditTitle(found.title);
          setEditDuration(found.duration);
        }
      }
    } catch { /* ignore */ }
    setIsLoading(false);
  }, [id]);

  const handleCopyId = () => {
    navigator.clipboard.writeText(film?.id || '');
    setToastMessage('ID copied to clipboard');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSave = () => {
    if (!film) return;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CONTENT);
      if (stored) {
        const items: LocalContent[] = JSON.parse(stored);
        const updated = items.map(item =>
          item.id === film.id ? { ...item, title: editTitle, duration: editDuration } : item
        );
        localStorage.setItem(STORAGE_KEYS.CONTENT, JSON.stringify(updated));
        setFilm({ ...film, title: editTitle, duration: editDuration });
        setIsEditModalOpen(false);
        setToastMessage('Changes saved');
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch { /* ignore */ }
  };

  const handleDelete = () => {
    if (!film) return;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CONTENT);
      if (stored) {
        const items: LocalContent[] = JSON.parse(stored);
        const updated = items.filter(item => item.id !== film.id);
        localStorage.setItem(STORAGE_KEYS.CONTENT, JSON.stringify(updated));
        addActivity({ message: 'Deleted content: ' + film.title, type: 'info' });
        navigate('/films');
      }
    } catch { /* ignore */ }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <FilmIcon className="w-5 h-5 text-purple-500" />;
      case 'audio': return <Music className="w-5 h-5 text-blue-500" />;
      default: return <ImageIcon className="w-5 h-5 text-green-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'video': return 'bg-purple-50 text-purple-600 border-purple-200';
      case 'audio': return 'bg-blue-50 text-blue-600 border-blue-200';
      default: return 'bg-green-50 text-green-600 border-green-200';
    }
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0E7B35]"></div>
      </div>
    );
  }

  if (!film) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
          <FilmIcon className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Media not found</h2>
        <button onClick={() => navigate('/films')} className="text-[#0E7B35] font-medium hover:underline">Return to Library</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between gap-4 flex-wrap pb-4 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/films')} className="p-2 bg-white border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-heading font-bold text-2xl text-gray-900 tracking-tight">{film.title}</h1>
              <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide uppercase border", getTypeColor(film.type))}>
                {film.type}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-3">
              <span>ID: {film.id.slice(0, 8)}</span>
              <button onClick={handleCopyId} className="hover:text-gray-900" title="Copy ID"><Copy className="w-3.5 h-3.5" /></button>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer shadow-sm">
            Edit Details
          </button>
          <button onClick={() => setItemToDelete(true)}
            className="flex items-center gap-2 bg-white border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors cursor-pointer shadow-sm">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <div className="card p-4 overflow-hidden">
            <div className="w-full aspect-video bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200 overflow-hidden">
              {getThumbnailUrl(film) ? (
                <img src={getThumbnailUrl(film)!} alt={film.title} className="w-full h-full object-cover" />
              ) : film.type === 'video' ? (
                <FilmIcon className="w-16 h-16 text-gray-300" />
              ) : film.type === 'audio' ? (
                <Music className="w-16 h-16 text-gray-300" />
              ) : (
                <ImageIcon className="w-16 h-16 text-gray-300" />
              )}
            </div>

            {film.type === 'video' && (
              <video src={resolveFilePath(film.filePath)} controls className="w-full mt-4 rounded-lg" preload="metadata" />
            )}
            {film.type === 'audio' && (
              <audio src={resolveFilePath(film.filePath)} controls className="w-full mt-4" preload="metadata" />
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="card p-0 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-heading font-semibold text-gray-900">Details</h3>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Type</p>
                  <div className="flex items-center gap-2">
                    {getTypeIcon(film.type)}
                    <p className="text-sm font-medium text-gray-900 capitalize">{film.type}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Duration</p>
                  <p className="text-sm font-medium text-gray-900">{formatDuration(film.duration)}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">File Name</p>
                <p className="text-sm font-medium text-gray-900 font-mono break-all">{film.fileName}</p>
              </div>
              {film.mimeType && (
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">MIME Type</p>
                  <p className="text-sm font-medium text-gray-900 font-mono">{film.mimeType}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Added</p>
                <p className="text-sm font-medium text-gray-900">{new Date(film.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">File Path</p>
                <p className="text-sm font-medium text-gray-900 font-mono break-all">{film.filePath}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-xl text-sm font-medium z-[200] animate-in fade-in slide-in-from-bottom-4">
          {toastMessage}
        </div>
      )}

      {itemToDelete && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 text-center p-6">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4 border border-red-100"><Trash2 className="w-6 h-6 text-red-500" /></div>
            <h3 className="font-heading font-semibold text-lg text-gray-900 mb-2">Delete Content</h3>
            <p className="text-gray-500 text-sm mb-6">Are you sure you want to delete <span className="font-semibold text-gray-700">"{film.title}"</span>?</p>
            <div className="flex items-center gap-3 w-full">
              <button onClick={() => setItemToDelete(false)} className="flex-1 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 rounded-lg text-sm font-medium transition-colors cursor-pointer">Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer shadow-sm">Delete</button>
            </div>
          </div>
        </div>, document.body
      )}

      {isEditModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in slide-in-from-bottom-4">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-heading font-semibold text-lg text-gray-900">Edit Details</h3>
                <p className="text-sm text-gray-500 mt-1">Update title and duration.</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 block">Title</label>
                <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:border-[#0E7B35] focus:ring-[#0E7B35]" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 block">Duration (seconds)</label>
                <input type="number" min="1" value={editDuration} onChange={(e) => setEditDuration(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:border-[#0E7B35] focus:ring-[#0E7B35]" />
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 flex-shrink-0">
              <button onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 rounded-lg text-sm font-medium transition-colors cursor-pointer">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 bg-[#0E7B35] hover:bg-[#0A5E28] text-white shadow-sm rounded-lg text-sm font-medium transition-colors cursor-pointer">Save Changes</button>
            </div>
          </div>
        </div>, document.body
      )}
    </div>
  );
}
