import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { ArrowLeft, Film, Music, Image as ImageIcon, CheckCircle2, AlertCircle, FolderOpen, Loader2, Check, X, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';
import { STORAGE_KEYS, generateId, getTimestamp, addActivity, fetchFilesFromServer, getMimeTypeFromExtension, resolveFilePath, detectDuration, generateVideoThumbnail, getContentRoot } from '../lib/storage';
import type { LocalContent, ContentType } from '../types';

interface ServerFile {
  name: string;
  path: string;
  type: string;
  size: number;
}

interface FileEntry {
  file: ServerFile;
  title: string;
  duration: number;
  thumbnail: string | null;
  durationAutoDetected: boolean;
  isDetectingDuration: boolean;
  isGeneratingThumbnail: boolean;
}

export default function FilmIngest() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [contentType, setContentType] = useState<ContentType>('video');
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [serverFiles, setServerFiles] = useState<ServerFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [existingPaths, setExistingPaths] = useState<Set<string>>(new Set());
  const [duplicateConfirmFile, setDuplicateConfirmFile] = useState<ServerFile | null>(null);

  const contentRoot = getContentRoot();

  useEffect(() => { loadExistingPaths(); loadFiles(); }, [contentType]);

  const loadExistingPaths = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CONTENT);
      if (stored) {
        const content: LocalContent[] = JSON.parse(stored);
        setExistingPaths(new Set(content.map(c => c.filePath)));
      } else {
        setExistingPaths(new Set());
      }
    } catch { setExistingPaths(new Set()); }
  };

  const loadFiles = async () => {
    setIsLoadingFiles(true);
    setServerError(null);
    try {
      const files = await fetchFilesFromServer(contentType);
      setServerFiles(files);
    } catch {
      setServerError('Could not connect to content server. Make sure the server is running.');
      setServerFiles([]);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const isSelected = (file: ServerFile) => entries.some(e => e.file.path === file.path);

  const isAlreadyIngested = (file: ServerFile) => existingPaths.has(file.path);

  const confirmDuplicateIngest = async () => {
    if (!duplicateConfirmFile) return;
    const file = duplicateConfirmFile;
    setDuplicateConfirmFile(null);
    await addFileToEntries(file);
  };

  const addFileToEntries = async (file: ServerFile) => {
    const defaultDuration = contentType === 'image' ? 10 : 30;
    const autoTitle = file.name.replace(/\.[^/.]+$/, '');

    const entry: FileEntry = {
      file,
      title: autoTitle,
      duration: defaultDuration,
      thumbnail: null,
      durationAutoDetected: false,
      isDetectingDuration: false,
      isGeneratingThumbnail: false,
    };

    setEntries(prev => [...prev, entry]);
    const filePath = file.path;

    if (contentType === 'video' || contentType === 'audio') {
      setEntries(prev => prev.map(e => e.file.path === filePath ? { ...e, isDetectingDuration: true } : e));
      try {
        const url = resolveFilePath(file.path);
        const detected = await detectDuration(url, contentType);
        setEntries(prev => prev.map(e => e.file.path === filePath ? { ...e, duration: detected, durationAutoDetected: true, isDetectingDuration: false } : e));
      } catch {
        setEntries(prev => prev.map(e => e.file.path === filePath ? { ...e, isDetectingDuration: false } : e));
      }
    }

    if (contentType === 'video') {
      setEntries(prev => prev.map(e => e.file.path === filePath ? { ...e, isGeneratingThumbnail: true } : e));
      try {
        const url = resolveFilePath(file.path);
        const thumbnail = await generateVideoThumbnail(url);
        setEntries(prev => prev.map(e => e.file.path === filePath ? { ...e, thumbnail, isGeneratingThumbnail: false } : e));
      } catch {
        setEntries(prev => prev.map(e => e.file.path === filePath ? { ...e, isGeneratingThumbnail: false } : e));
      }
    }

    if (contentType === 'image') {
      setEntries(prev => prev.map(e => e.file.path === filePath ? { ...e, thumbnail: resolveFilePath(file.path) } : e));
    }
  };

  const toggleFile = async (file: ServerFile) => {
    if (isSelected(file)) {
      setEntries(prev => prev.filter(e => e.file.path !== file.path));
      return;
    }

    if (isAlreadyIngested(file)) {
      setDuplicateConfirmFile(file);
      return;
    }

    await addFileToEntries(file);
  };

  const updateEntry = (path: string, updates: Partial<FileEntry>) => {
    setEntries(prev => prev.map(e => e.file.path === path ? { ...e, ...updates } : e));
  };

  const removeEntry = (path: string) => {
    setEntries(prev => prev.filter(e => e.file.path !== path));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (entries.length === 0) { setErrorMsg('Please select at least one file.'); return; }

    const emptyTitles = entries.filter(e => !e.title.trim());
    if (emptyTitles.length > 0) { setErrorMsg('All selected files need a title.'); return; }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const storedContent = localStorage.getItem(STORAGE_KEYS.CONTENT);
      const existingContent: LocalContent[] = storedContent ? JSON.parse(storedContent) : [];

      const newItems: LocalContent[] = entries.map(entry => ({
        id: generateId(),
        title: entry.title.trim(),
        type: contentType,
        filePath: entry.file.path,
        fileName: entry.file.name,
        mimeType: getMimeTypeFromExtension(entry.file.name),
        duration: entry.duration,
        thumbnailPath: entry.thumbnail || undefined,
        createdAt: getTimestamp(),
      }));

      localStorage.setItem(STORAGE_KEYS.CONTENT, JSON.stringify([...existingContent, ...newItems]));
      addActivity({ message: 'Added ' + newItems.length + ' content item' + (newItems.length > 1 ? 's' : ''), type: 'success' });
      setIsSubmitting(false);
      setSuccess(true);
      navigate('/films');
    } catch {
      setIsSubmitting(false);
      setErrorMsg('Failed to save content.');
    }
  };

  const typeOptions: { value: ContentType; label: string; icon: React.ElementType }[] = [
    { value: 'video', label: 'Video', icon: Film },
    { value: 'audio', label: 'Audio', icon: Music },
    { value: 'image', label: 'Image', icon: ImageIcon },
  ];

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/films')} className="p-2 bg-white border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="font-heading font-semibold text-xl text-gray-800 tracking-tight">Add Content</h2>
          <p className="text-sm text-gray-500">Select media files from your content library</p>
        </div>
      </div>

      {success && (
        <div className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-200 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
          <p className="font-medium text-sm">Content added successfully!</p>
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
          <p className="font-medium text-sm">{errorMsg}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6">
          <h3 className="font-heading font-semibold text-gray-800 mb-4">Content Type</h3>
          <div className="grid grid-cols-3 gap-4">
            {typeOptions.map(option => {
              const Icon = option.icon;
              return (
                <button key={option.value} type="button" onClick={() => { setContentType(option.value); setEntries([]); }}
                  className={cn("p-6 rounded-xl border-2 text-center transition-colors", contentType === option.value ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300")}>
                  <Icon className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <p className="font-medium text-gray-700">{option.label}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h3 className="font-heading font-semibold text-gray-800">Select Files</h3>
              {serverFiles.length > 0 && (
                <span className="text-xs text-gray-400">
                  {entries.length > 0 && entries.length + ' selected'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {serverFiles.length > 0 && (
                <button type="button" onClick={() => {
                  const allSelected = serverFiles.every(f => isSelected(f));
                  if (allSelected) {
                    setEntries([]);
                  } else {
                    const existingPaths = new Set(entries.map(e => e.file.path));
                    const newFiles = serverFiles.filter(f => !existingPaths.has(f.path));
                    const defaultDuration = contentType === 'image' ? 10 : 30;
                    const newEntries: FileEntry[] = newFiles.map(file => ({
                      file,
                      title: file.name.replace(/\.[^/.]+$/, ''),
                      duration: defaultDuration,
                      thumbnail: contentType === 'image' ? resolveFilePath(file.path) : null,
                      durationAutoDetected: false,
                      isDetectingDuration: false,
                      isGeneratingThumbnail: false,
                    }));
                    setEntries(prev => [...prev, ...newEntries]);
                    newEntries.forEach(entry => {
                      const filePath = entry.file.path;
                      if (contentType === 'video' || contentType === 'audio') {
                        detectDuration(resolveFilePath(entry.file.path), contentType).then(
                          detected => setEntries(prev => prev.map(e => e.file.path === filePath ? { ...e, duration: detected, durationAutoDetected: true } : e))
                        ).catch(() => {});
                      }
                      if (contentType === 'video') {
                        generateVideoThumbnail(resolveFilePath(entry.file.path)).then(
                          thumbnail => setEntries(prev => prev.map(e => e.file.path === filePath ? { ...e, thumbnail } : e))
                        ).catch(() => {});
                      }
                    });
                  }
                }} className="text-sm text-primary hover:text-primary-dark font-medium">
                  {serverFiles.every(f => isSelected(f)) ? 'Deselect All' : 'Select All'}
                </button>
              )}
              <button type="button" onClick={loadFiles} className="text-sm text-gray-500 hover:text-gray-700 font-medium">Refresh</button>
            </div>
          </div>
          <p className="text-xs text-gray-500 mb-4">Files from: <code className="bg-gray-100 px-1.5 py-0.5 rounded">{contentRoot}</code></p>

          {serverError ? (
            <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">{serverError}</p>
                  <p className="text-xs text-yellow-700 mt-1">Run <code className="bg-yellow-100 px-1.5 py-0.5 rounded">npm run server</code> to start the content server.</p>
                </div>
              </div>
            </div>
          ) : isLoadingFiles ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-gray-500 mt-3">Loading files...</p>
            </div>
          ) : serverFiles.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-xl">
              <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No {contentType} files found</p>
              <p className="text-xs text-gray-400 mt-1">Add files to <code className="bg-gray-100 px-1.5 py-0.5 rounded">{contentRoot}</code></p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {serverFiles.map((file) => {
                const selected = isSelected(file);
                const alreadyIngested = isAlreadyIngested(file);
                return (
                  <div key={file.path} onClick={() => toggleFile(file)}
                    className={cn("p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between",
                      selected ? "border-primary bg-primary/5" : alreadyIngested ? "border-gray-200 bg-gray-50" : "border-gray-200 hover:border-gray-300 bg-white")}>
                    <div className="flex items-center gap-3">
                      <div className={cn("w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                        selected ? "border-primary bg-primary" : "border-gray-300")}>
                        {selected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      {contentType === 'video' ? <Film className="w-4 h-4 text-gray-400" /> : contentType === 'audio' ? <Music className="w-4 h-4 text-gray-400" /> : <ImageIcon className="w-4 h-4 text-gray-400" />}
                      <span className={cn("text-sm font-medium", alreadyIngested && !selected ? "text-gray-400" : "text-gray-700")}>{file.name}</span>
                      {alreadyIngested && !selected && (
                        <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">Already added</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">{formatFileSize(file.size)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {entries.length > 0 && (
          <div className="card p-6">
            <h3 className="font-heading font-semibold text-gray-800 mb-4">
              Selected Files ({entries.length})
            </h3>
            <div className="space-y-4">
              {entries.map((entry) => (
                <div key={entry.file.path} className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                  <div className="flex items-start gap-3">
                    {entry.thumbnail ? (
                      <img src={entry.thumbnail} alt="" className="w-16 h-12 object-cover rounded-md border border-gray-200 flex-shrink-0" />
                    ) : entry.isGeneratingThumbnail ? (
                      <div className="w-16 h-12 bg-gray-200 rounded-md flex items-center justify-center flex-shrink-0">
                        <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                      </div>
                    ) : (
                      <div className="w-16 h-12 bg-gray-200 rounded-md flex items-center justify-center flex-shrink-0">
                        {contentType === 'video' ? <Film className="w-4 h-4 text-gray-400" /> : contentType === 'audio' ? <Music className="w-4 h-4 text-gray-400" /> : <ImageIcon className="w-4 h-4 text-gray-400" />}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 truncate flex-1">{entry.file.name}</span>
                        <button type="button" onClick={() => removeEntry(entry.file.path)} className="text-gray-400 hover:text-red-500 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <input type="text" value={entry.title} onChange={(e) => updateEntry(entry.file.path, { title: e.target.value })}
                        className="w-full mt-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 flex-1">
                      <label className="text-xs text-gray-500 whitespace-nowrap">Duration (s)</label>
                      <input type="number" value={entry.duration} onChange={(e) => updateEntry(entry.file.path, { duration: parseInt(e.target.value) || 10, durationAutoDetected: false })} min="1"
                        className="w-20 px-2 py-1 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                      {entry.isDetectingDuration && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Loader2 className="w-3 h-3 animate-spin" /> Detecting...
                        </div>
                      )}
                      {entry.durationAutoDetected && !entry.isDetectingDuration && (
                        <div className="flex items-center gap-1 text-xs text-primary">
                          <CheckCircle2 className="w-3 h-3" /> Auto
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button type="button" onClick={() => navigate('/films')} className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors cursor-pointer">Cancel</button>
          <button type="submit" disabled={isSubmitting || entries.length === 0}
            className="px-6 py-2.5 bg-primary hover:bg-primary-dark disabled:opacity-70 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm cursor-pointer">
            {isSubmitting ? <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span> : <Film className="w-4 h-4" />}
            {isSubmitting ? 'Adding...' : 'Add ' + entries.length + ' Item' + (entries.length !== 1 ? 's' : '')}
          </button>
        </div>
      </form>

      {duplicateConfirmFile && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 text-center p-6">
            <div className="w-12 h-12 rounded-full bg-yellow-50 flex items-center justify-center mx-auto mb-4 border border-yellow-100"><AlertTriangle className="w-6 h-6 text-yellow-500" /></div>
            <h3 className="font-heading font-semibold text-lg text-gray-900 mb-2">Already Ingested</h3>
            <p className="text-gray-500 text-sm mb-6">"<span className="font-semibold text-gray-700">{duplicateConfirmFile.name}</span>" is already in your content library. Add it again?</p>
            <div className="flex items-center gap-3 w-full">
              <button onClick={() => setDuplicateConfirmFile(null)} className="flex-1 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 rounded-lg text-sm font-medium transition-colors cursor-pointer">Cancel</button>
              <button onClick={confirmDuplicateIngest} className="flex-1 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-medium transition-colors cursor-pointer shadow-sm">Add Again</button>
            </div>
          </div>
        </div>, document.body
      )}
    </div>
  );
}
