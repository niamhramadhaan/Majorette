import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { ArrowLeft, Edit3, Film as FilmIcon, Clock, HardDrive, Calendar, User, Building, MapPin, Tag, Copy, Volume2, X, Image as ImageIcon, UploadCloud } from 'lucide-react';
import { cn } from '../lib/utils';
import { MOCK_MEDIA_ITEMS } from '../lib/mockData';
import type { MediaItem, MediaType } from '../types';

export default function FilmDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [film, setFilm] = useState<MediaItem | null>(location.state?.film || null);
  const [isLoading, setIsLoading] = useState(!location.state?.film);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [packageFile, setPackageFile] = useState<File | null>(null);
  const [tempPosterPreview, setTempPosterPreview] = useState<string | null>(null);
  const posterInputRef = React.useRef<HTMLInputElement>(null);
  const [editForm, setEditForm] = useState<any>(location.state?.film ? { ...location.state.film, tags: location.state.film.genre ? location.state.film.genre.split(/, | \/ /) : [] } : {});
  const [genreInput, setGenreInput] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const handleCopyId = () => {
    navigator.clipboard.writeText(film?.id?.toString() || '');
    setToastMessage('ID Copied to clipboard');
    setTimeout(() => setToastMessage(null), 3000);
  };
  
  useEffect(() => {
    if (!film) {
      setTimeout(() => {
        const found = MOCK_MEDIA_ITEMS.find(f => f.id.toString() === id);
        if (found) {
          setFilm(found);
          setEditForm({ ...found, tags: found.genre ? found.genre.split(/, | \/ /) : [] });
        }
        setIsLoading(false);
      }, 500);
    }
  }, [id, film]);

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

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Synced': return 'bg-[#B9EA38]/20 text-[#0A5E28] border-[#B9EA38]/50';
      case 'Processing': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Expiring Soon': return 'bg-[#FAEF06]/30 text-[#8a8100] border-[#FAEF06]';
      case 'Expired': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const handleUpdate = () => {
    setFilm({ ...film, ...editForm, genre: editForm.tags.join(', ') });
    setIsEditModalOpen(false);
  };

  const addGenre = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && genreInput.trim() !== '') {
      e.preventDefault();
      if (!editForm.tags.includes(genreInput.trim())) {
        setEditForm({ ...editForm, tags: [...editForm.tags, genreInput.trim()] });
      }
      setGenreInput('');
    }
  };

  const removeGenre = (tagToRemove: string) => {
    setEditForm({ ...editForm, tags: editForm.tags.filter((t: string) => t !== tagToRemove) });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-4 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/films')}
            className="p-2 bg-white border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-heading font-bold text-2xl text-gray-900 tracking-tight">{film.title}</h1>
              <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide uppercase border", getStatusColor(film.status))}>
                {film.status}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-3">
               <span>ID: {film.id.toString().padStart(6, '0')}</span>
               <button onClick={handleCopyId} className="hover:text-gray-900" title="Copy ID"><Copy className="w-3.5 h-3.5" /></button>
            </p>
          </div>
        </div>
        
        <button 
          onClick={() => setIsEditModalOpen(true)}
          className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 flex-shrink-0 cursor-pointer rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm">
          <Edit3 className="w-4 h-4" />
          Edit Details
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Poster & Quick Stats */}
        <div className="space-y-6">
          <div className="card p-4 overflow-hidden">
             <div className="w-full aspect-[2/3] bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200 relative group overflow-hidden">
                {(tempPosterPreview || film.posterPath) ? (
                  <img src={tempPosterPreview || film.posterPath!} alt={film.title} className="w-full h-full object-cover" />
                ) : (
                  <FilmIcon className="w-16 h-16 text-gray-300" />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <button onClick={() => posterInputRef.current?.click()} className="px-4 py-2 bg-white text-gray-900 text-sm font-medium rounded-full cursor-pointer hover:bg-gray-100">
                     Change Poster
                   </button>
                   <input type="file" accept="image/*" ref={posterInputRef} className="hidden" onChange={(e) => {
                     if (e.target.files?.[0]) {
                       setTempPosterPreview(URL.createObjectURL(e.target.files[0]));
                       setToastMessage('preview');
                     }
                   }} />
                </div>
             </div>
             
             <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                   <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">Duration</p>
                   <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5"><Clock className="w-4 h-4 text-[#0E7B35]" /> {film.duration} mins</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                   <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">Type</p>
                   <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5"><Tag className="w-4 h-4 text-[#0E7B35]" /> {film.type}</p>
                </div>
             </div>
             
             <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-green-500"></div>
                   <span className="text-sm font-medium text-green-700">Decryption Package: Attached</span>
                </div>
             </div>
             
             <button 
               onClick={() => setIsPackageModalOpen(true)}
               className="w-full mt-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium text-sm rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
             >
                <Edit3 className="w-4 h-4" />
                Edit Package
             </button>
          </div>
        </div>

        {/* Right Column: Detailed Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h3 className="font-heading font-semibold text-gray-900 text-lg mb-4">Synopsis</h3>
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
              {film.synopsis}
            </p>
          </div>

          <div className="card p-0 overflow-hidden">
             <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
               <h3 className="font-heading font-semibold text-gray-900">Metadata</h3>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                <div className="p-6 space-y-5">
                   <div>
                     <p className="text-xs text-gray-500 font-medium mb-1">Age Rating</p>
                     <p className="text-sm font-semibold text-gray-900 inline-flex px-2 py-0.5 bg-gray-100 border border-gray-200 rounded text-center min-w-[40px] justify-center">{film.ageRating || 'SU'}</p>
                   </div>
                   <div>
                     <p className="text-xs text-gray-500 font-medium mb-1 relative flex items-center gap-1.5"><Building className="w-3.5 h-3.5" /> Publisher</p>
                     <p className="text-sm font-medium text-gray-900">{film.publisher || 'Unknown'}</p>
                   </div>
                   <div>
                     <p className="text-xs text-gray-500 font-medium mb-1 relative flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Director</p>
                     <p className="text-sm font-medium text-gray-900">{film.director || 'Unknown'}</p>
                   </div>
                   <div>
                     <p className="text-xs text-gray-500 font-medium mb-1 relative flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> Genre</p>
                     <div className="flex flex-wrap gap-1 mt-1">
                        {film.genre ? film.genre.split(', ').map((g: string) => (
                           <span key={g} className="px-2 py-0.5 bg-[#0E7B35]/10 text-[#0E7B35] rounded font-medium text-xs border border-[#0E7B35]/20">{g}</span>
                        )) : <span className="text-sm text-gray-900 border px-2 py-0.5 rounded border-gray-200">Uncategorized</span>}
                     </div>
                   </div>
                </div>
                <div className="p-6 space-y-5">
                   <div>
                     <p className="text-xs text-gray-500 font-medium mb-1 relative flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Start / End Date</p>
                     <p className="text-sm font-medium text-gray-900">Jan 1, 2024 &mdash; {film.expiryDate}</p>
                   </div>
                   <div>
                     <p className="text-xs text-gray-500 font-medium mb-1 relative flex items-center gap-1.5"><Volume2 className="w-3.5 h-3.5" /> Volume Recommendation</p>
                     <p className="text-sm font-medium text-gray-900">{film.volume || 100} / 100</p>
                   </div>
                   <div>
                     <p className="text-xs text-gray-500 font-medium mb-1">Audio Profile</p>
                     <p className="text-sm font-medium text-gray-900">{film.audioType || 'Stereo'}</p>
                   </div>
                   <div>
                     <p className="text-xs text-gray-500 font-medium mb-1 relative flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Distribution</p>
                     <p className="text-sm font-medium text-gray-900">{film.targetLocations} Locations Synced</p>
                   </div>
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
      
      {/* Custom Toast Message for Preview */}
      {toastMessage === 'preview' ? (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-2xl z-[200] animate-in fade-in slide-in-from-bottom-4 transition-all flex items-center gap-4">
           <span className="text-sm font-medium">Save this poster image?</span>
           <div className="flex items-center gap-2">
             <button onClick={() => {
                setTempPosterPreview(null);
                setToastMessage(null);
                if (posterInputRef.current) posterInputRef.current.value = '';
             }} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors cursor-pointer">Discard</button>
             <button onClick={() => {
                setFilm({ ...film, posterPath: tempPosterPreview });
                setTempPosterPreview(null);
                setToastMessage('Poster saved successfully');
                setTimeout(() => setToastMessage(null), 3000);
             }} className="px-3 py-1.5 bg-[#0E7B35] hover:bg-[#0A5E28] rounded-lg text-sm font-medium transition-colors cursor-pointer">Save</button>
           </div>
        </div>
      ) : toastMessage ? (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-xl text-sm font-medium z-[200] animate-in fade-in slide-in-from-bottom-4 transition-all">
           {toastMessage}
        </div>
      ) : null}

      {/* Edit Package Modal */}
      {isPackageModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 animate-in fade-in backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in slide-in-from-bottom-4">
             <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0 bg-white">
                <h3 className="font-heading font-semibold text-lg text-gray-900">Edit Package</h3>
                <button onClick={() => setIsPackageModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                   <X className="w-5 h-5" />
                </button>
             </div>
             
             <div className="p-6 overflow-y-auto space-y-6">
                 <div>
                   <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 block">Media Package</label>
                   <div className="border-2 border-dashed border-gray-200 hover:border-[#0E7B35] rounded-xl flex flex-col items-center justify-center text-center p-6 relative cursor-pointer overflow-hidden transition-colors group">
                     <input type="file" accept=".media" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" onChange={(e) => {
                       if(e.target.files?.[0]) setPackageFile(e.target.files[0]);
                     }} />
                     {packageFile ? (
                       <div className="flex flex-col items-center gap-2">
                         <div className="w-10 h-10 rounded-full bg-[#0E7B35] text-white flex items-center justify-center shadow-sm">
                            <HardDrive className="w-5 h-5" />
                         </div>
                         <h3 className="font-semibold text-[#0E7B35] text-sm">{packageFile.name}</h3>
                         <span className="text-xs font-medium text-gray-500">{(packageFile.size / (1024*1024)).toFixed(2)} MB</span>
                       </div>
                     ) : (
                       <div className="flex flex-col items-center">
                         <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mb-3 group-hover:bg-[#0E7B35]/10 group-hover:text-[#0E7B35] text-gray-400 transition-colors">
                            <UploadCloud className="w-5 h-5" />
                         </div>
                         <span className="text-sm font-medium text-gray-900">Upload new .media package</span>
                         <span className="text-xs font-medium text-gray-500 mt-1">Drag & drop or Browse file</span>
                       </div>
                     )}
                   </div>
                 </div>
             </div>
             
             <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 flex-shrink-0">
                <button onClick={() => { setIsPackageModalOpen(false); setPackageFile(null); }} className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 rounded-lg text-sm font-medium transition-colors cursor-pointer">Cancel</button>
                <button 
                  onClick={() => {
                     setIsPackageModalOpen(false);
                     setPackageFile(null);
                     setToastMessage('Package configuration saved successfully');
                     setTimeout(() => setToastMessage(null), 3000);
                  }} 
                  className="px-4 py-2 bg-[#0E7B35] hover:bg-[#0A5E28] text-white shadow-sm rounded-lg text-sm font-medium transition-colors cursor-pointer">
                   Save Configuration
                </button>
             </div>
           </div>
         </div>,
         document.body
      )}
      
      {isEditModalOpen && createPortal(
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-4">
             <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-semibold text-lg text-gray-900">Edit Details</h3>
                  <p className="text-sm text-gray-500 mt-1">Update media metadata and settings.</p>
                </div>
                <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                  <X className="w-5 h-5" />
                </button>
             </div>
             
             <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
                <div>
                   <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 block">Cover Poster</label>
                   <div 
                      className="border-2 border-dashed border-gray-200 hover:border-[#0E7B35] rounded-xl flex items-center p-3 relative cursor-pointer overflow-hidden max-w-sm transition-colors group"
                   >
                     <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" onChange={(e) => {
                       if(e.target.files?.[0]) {
                         const file = e.target.files[0];
                         setEditForm({...editForm, posterPath: URL.createObjectURL(file)});
                       }
                     }} />
                     {editForm.posterPath ? (
                       <div className="flex items-center gap-4 w-full">
                         <img src={editForm.posterPath} alt="Preview" className="w-16 h-24 object-cover rounded-md shadow-sm" />
                         <span className="text-sm font-medium text-[#0E7B35]">Change Poster</span>
                       </div>
                     ) : (
                       <div className="flex items-center gap-3 py-3 px-2 w-full text-gray-500 group-hover:text-gray-700">
                         <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-[#0E7B35]/10 group-hover:text-[#0E7B35]">
                            <ImageIcon className="w-4 h-4" />
                         </div>
                         <span className="text-sm font-medium">Upload new cover image</span>
                       </div>
                     )}
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 block">Title</label>
                      <input type="text" value={editForm.title} onChange={(e) => setEditForm({...editForm, title: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:border-[#0E7B35] focus:ring-[#0E7B35]" />
                   </div>
                   <div>
                      <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 block">Content Type</label>
                      <select value={editForm.type} onChange={(e) => setEditForm({...editForm, type: e.target.value as MediaType})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:border-[#0E7B35] focus:ring-[#0E7B35]">
                         <option>Film</option>
                         <option>Advertisement</option>
                         <option>Bumper</option>
                         <option>Trailer</option>
                      </select>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 block">Duration (mins or secs)</label>
                      <input type="number" step="0.5" value={editForm.duration} onChange={(e) => setEditForm({...editForm, duration: parseFloat(e.target.value)})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:border-[#0E7B35] focus:ring-[#0E7B35]" />
                   </div>
                   <div>
                      <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 block">Volume Recommendation (0-100)</label>
                      <div className="flex items-center gap-2">
                        <input type="range" min="0" max="100" value={editForm.volume} onChange={(e) => setEditForm({...editForm, volume: parseInt(e.target.value)})} className="flex-1 accent-[#0E7B35]" />
                        <input type="number" min="0" max="100" value={editForm.volume} onChange={(e) => setEditForm({...editForm, volume: parseInt(e.target.value)})} className="w-16 px-2 py-1.5 border border-gray-200 rounded text-sm text-center focus:outline-none focus:ring-1 focus:border-[#0E7B35] focus:ring-[#0E7B35]" />
                      </div>
                   </div>
                </div>

                <div>
                   <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 block">Genres / Tags</label>
                   <div className="flex flex-wrap gap-2 mb-2 p-2 min-h-[44px] bg-gray-50 border border-gray-200 rounded-lg focus-within:ring-1 focus-within:ring-[#0E7B35] focus-within:border-[#0E7B35] focus-within:bg-white transition-colors">
                      {editForm.tags?.map((tag: string) => (
                         <span key={tag} className="flex items-center gap-1.5 px-2 py-1 bg-[#0E7B35] text-white rounded text-xs font-medium">
                            {tag}
                            <button onClick={() => removeGenre(tag)} className="hover:text-gray-200"><X className="w-3 h-3" /></button>
                         </span>
                      ))}
                      <input 
                         type="text" 
                         value={genreInput}
                         onChange={(e) => setGenreInput(e.target.value)}
                         onKeyDown={addGenre}
                         placeholder="Type and press Enter..." 
                         className="flex-1 min-w-[120px] bg-transparent text-sm focus:outline-none" 
                      />
                   </div>
                </div>

                <div>
                   <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 block">Synopsis</label>
                   <textarea rows={4} value={editForm.synopsis ?? ''} onChange={(e) => setEditForm({...editForm, synopsis: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:border-[#0E7B35] focus:ring-[#0E7B35]"></textarea>
                </div>
             </div>
             
             <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 flex-shrink-0">
                <button onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 rounded-lg text-sm font-medium transition-colors cursor-pointer">Cancel</button>
                <button onClick={handleUpdate} className="px-4 py-2 bg-[#0E7B35] hover:bg-[#0A5E28] text-white shadow-sm rounded-lg text-sm font-medium transition-colors cursor-pointer">
                   Save Changes
                </button>
             </div>
           </div>
         </div>,
         document.body
      )}

    </div>
  );
}
