import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar as CalendarIcon, Info } from 'lucide-react';
import { cn } from '../lib/utils';

interface SetlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  defaultName?: string;
  defaultDate?: string;
  defaultStatus?: string;
  mode?: 'create' | 'edit' | 'save';
}

export function SetlistModal({ 
  isOpen, 
  onClose, 
  onSave, 
  defaultName = '', 
  defaultDate = '',
  defaultStatus = 'Inactive',
  mode = 'save' 
}: SetlistModalProps) {
  const [name, setName] = useState(defaultName);
  const [date, setDate] = useState(defaultDate);
  const [status, setStatus] = useState(defaultStatus);
  const [error, setError] = useState<string | null>(null);

  // Reset local state when opened
  React.useEffect(() => {
    if (isOpen) {
      setName(defaultName);
      setDate(defaultDate || formatToday());
      setStatus(defaultStatus);
      setError(null);
    }
  }, [isOpen, defaultName, defaultDate, defaultStatus]);

  const formatToday = () => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  };

  if (!isOpen) return null;

  const getTitle = () => {
    if (mode === 'create') return 'Create a Setlist';
    if (mode === 'edit') return 'Edit Setlist Config';
    return 'Save Setlist';
  };

  const getSubtitle = () => {
    if (mode === 'create') return 'Initialize a new show sequence.';
    if (mode === 'edit') return 'Reconfigure the properties of this setlist.';
    return 'Finalize and save your new sequence.';
  };

  const getButtonText = () => {
    if (mode === 'create') return '+ Create New Setlist';
    if (mode === 'edit') return 'Save Changes';
    return 'Confirm & Save';
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in slide-in-from-bottom-4">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <h3 className="font-heading font-semibold text-lg text-gray-900 tracking-tight">{getTitle()}</h3>
            <p className="text-xs text-gray-500 mt-1">{getSubtitle()}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200/50 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
              {error}
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Setlist Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#0E7B35]" 
                placeholder="e.g. Weekly Schedule"
            />
          </div>
          
          <div>
             <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Select Date</label>
             <div className="relative">
               <input 
                 type="date"
                 value={date}
                 onChange={(e) => setDate(e.target.value)}
                 className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#0E7B35]"
               />
               <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
             </div>
          </div>
          
          <div>
             <div className="flex items-center gap-2 mb-2">
               <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Status</label>
               {mode === 'save' && status !== 'Active' && (
                 <div className="relative flex items-center">
                   <div className="absolute left-0 ml-1 z-[110] w-52 p-2 bg-gray-900 text-white text-[10px] rounded animate-pulse shadow-lg pointer-events-none">
                     Set to Active to deploy this schedule to studios
                     <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-[5px] border-transparent border-r-gray-900"></div>
                   </div>
                 </div>
               )}
             </div>
             
             <button
               type="button"
               onClick={() => setStatus(status === 'Active' ? 'Inactive' : 'Active')}
               className={cn(
                 "relative inline-flex h-8 w-14 items-center rounded-full transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#0E7B35] focus-visible:ring-offset-2",
                 status === 'Active' ? 'bg-[#0E7B35]' : 'bg-gray-200'
               )}
             >
               <span className="sr-only">Toggle Status</span>
               <span
                 className={cn(
                   "inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-sm",
                   status === 'Active' ? 'translate-x-7' : 'translate-x-1'
                 )}
               />
             </button>
             <span className="ml-3 text-sm font-medium text-gray-700 align-middle">
               {status}
             </span>
          </div>
        </div>
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
           <button onClick={onClose} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer">
             Cancel
           </button>
           <button 
             onClick={() => {
               if (!name.trim()) {
                 setError('Setlist name is required.');
                 return;
               }
               if (!date) {
                 setError('Setlist date is required.');
                 return;
               }
               onSave({ name, date, status });
               onClose();
             }} 
             data-shortcut="ctrl-s"
             className="px-4 py-2 bg-[#0E7B35] hover:bg-[#0A5E28] text-white rounded-lg text-sm font-medium transition-colors cursor-pointer shadow-sm flex items-center gap-2"
           >
             {getButtonText()} <span className="opacity-70 text-[10px] uppercase font-mono tracking-widest hidden sm:inline-block">Ctrl+S</span>
           </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
