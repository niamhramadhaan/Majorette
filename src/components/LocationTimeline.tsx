import React, { useState } from 'react';
import { cn } from '../lib/utils';
import { format, addDays, subDays } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, MoreVertical, AlertTriangle } from 'lucide-react';
import type { Location } from '../types';

export default function LocationTimeline({ location, handleAction, currentTime: extCurrentTime }: { location: Location, handleAction?: (a: string) => void, currentTime?: Date }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const now = extCurrentTime || new Date();
  const currentHourFloat = now.getHours() + now.getMinutes() / 60;
  const showCurrentTimeMarker = currentHourFloat >= 10 && currentHourFloat <= 23;

  const startHour = 10;
  const hoursCount = 14; 
  const hours = Array.from({ length: hoursCount }, (_, i) => i + startHour);

  return (
    <div className="card overflow-hidden flex flex-col flex-1 min-h-[500px]">
      <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white border border-gray-200 rounded-lg flex items-center p-1">
            <button 
              onClick={() => setSelectedDate(subDays(selectedDate, 1))}
              className="p-1 text-gray-500 hover:bg-gray-100 rounded-md"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 px-3 text-sm font-medium text-gray-700 min-w-[140px] justify-center">
              <CalendarIcon className="w-4 h-4 text-primary" />
              {format(selectedDate, 'MMM dd, yyyy')}
            </div>
            <button 
              onClick={() => setSelectedDate(addDays(selectedDate, 1))}
              className="p-1 text-gray-500 hover:bg-gray-100 rounded-md"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <h3 className="font-heading font-semibold text-gray-800 ml-4 hidden md:block">Timeline: {location.name}</h3>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-xs font-medium text-gray-500">
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-blue-400"></div> Ads/Bumper</div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#FAEF06]"></div> Upcoming</div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-secondary"></div> Playing</div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div> Done</div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500"></div> Failed</div>
        </div>
      </div>
      
      {/* Timeline Grid */}
      <div className="flex-1 overflow-auto relative">
        <div className="min-w-[1600px] h-full flex flex-col relative pb-4">
          <div className="flex h-10 border-b border-gray-100 bg-white sticky top-0 z-40 pl-48">
             {hours.map(h => (
                <div key={h} className="flex-1 border-l border-gray-100 text-[10px] text-gray-400 font-medium pt-2 pl-2 relative">
                  {h}:00
                </div>
            ))}
            {showCurrentTimeMarker && (
              <div 
                className="absolute top-0 bottom-0 border-l-2 border-red-500 z-50 pointer-events-none"
                style={{ left: `calc(12rem + ${((currentHourFloat - startHour) / hoursCount) * 100}%)` }}
              >
                <div className="absolute -top-1 -translate-x-1/2 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                  {now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false})}
                </div>
              </div>
            )}
          </div>
          
          {showCurrentTimeMarker && (
            <div 
              className="absolute top-10 bottom-0 border-l-2 border-red-500/30 z-30 pointer-events-none"
              style={{ left: `calc(12rem + ${((currentHourFloat - startHour) / hoursCount) * 100}%)` }}
            ></div>
          )}
          
          {Array.from({ length: location.screens || 2 }, (_, i) => ({
            name: `Screen ${i + 1}`,
            setlist: i === 0 ? 'Weekend Standard' : 'Evening Showcase',
            sessionId: `sess_${Math.random().toString(36).substring(7)}`,
            synced: i === 0,
            status: i === 0 ? 'Playing' : 'Idle',
            lastOfflineSync: i === 0 ? '10 mins ago' : '1 hr ago'
          })).map((screen, i) => (
            <div key={screen.name} className="flex h-24 border-b border-gray-100 relative group hover:bg-gray-50/50 transition-colors">
                <div 
                  className="w-48 border-r border-gray-100 bg-white group-hover:bg-gray-50 sticky left-0 z-30 flex items-center justify-between px-4 transition-colors cursor-pointer shadow-[2px_0_5px_rgba(0,0,0,0.02)]"
                  onClick={() => handleAction?.(`View Details for ${screen.name}`)}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-heading font-bold text-gray-800 group-hover:text-primary transition-colors flex items-center gap-2">
                       {screen.name}
                       {screen.synced ? (
                         <div className="w-1.5 h-1.5 rounded-full bg-green-500" title="Synced"></div>
                       ) : (
                         <div className="w-1.5 h-1.5 rounded-full bg-red-500" title="Not Synced"></div>
                       )}
                    </span>
                    <span className="text-[10px] text-gray-500 mt-0.5 truncate max-w-[120px]">{screen.setlist}</span>
                     <span className="text-[9px] text-gray-400 font-mono mt-0.5">Synced {screen.lastOfflineSync}</span>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAction?.(`Studio Menu: ${screen.name}`);
                    }}
                    className="p-1.5 rounded-md hover:bg-gray-200 text-gray-400 hover:text-gray-900 transition-colors cursor-pointer"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex-1 flex relative">
                  {hours.map((_, j) => (
                      <div key={j} className="flex-1 border-l border-gray-100 border-dashed opacity-50 relative pointer-events-none">
                         <div className="absolute left-1/2 top-0 bottom-0 border-l border-gray-100 border-dashed opacity-30"></div>
                      </div>
                  ))}
                  
                  {i === 0 && (
                    (() => {
                      let currentStart = 10;
                      const items = [
                        { duration: 10, title: "Ads", status: "done", color: "bg-blue-100 text-blue-700 border-blue-200" },
                        { duration: 120, title: "Sample Feature Film A", status: "done", color: "bg-gray-200 text-gray-600 border-gray-300" },
                        { duration: 10, title: "Bumper & Ads", status: "done", color: "bg-blue-100 text-blue-700 border-blue-200" },
                        { duration: 130, title: "Action Blockbuster B", status: "playing", color: "bg-secondary/30 text-primary-dark border-secondary" },
                        { duration: 10, title: "Ads", status: "upcoming", color: "bg-blue-50 text-blue-500 border-blue-200" },
                        { duration: 110, title: "Indie Drama Showcase", status: "upcoming", color: "bg-[#FAEF06]/30 text-[#8a8100] border-[#FAEF06]" },
                        { duration: 10, title: "Ads", status: "upcoming", color: "bg-blue-50 text-blue-500 border-blue-200" },
                        { duration: 115, title: "Documentary Preview", status: "upcoming", color: "bg-[#FAEF06]/30 text-[#8a8100] border-[#FAEF06]" },
                        { duration: 10, title: "Bumper & Ads", status: "upcoming", color: "bg-blue-50 text-blue-500 border-blue-200" },
                        { duration: 120, title: "Horror Anthology Entry", status: "upcoming", color: "bg-[#FAEF06]/30 text-[#8a8100] border-[#FAEF06]" },
                        { duration: 15, title: "Late Night Ads", status: "upcoming", color: "bg-blue-50 text-blue-500 border-blue-200" },
                        { duration: 110, title: "Thriller Sequel", status: "upcoming", color: "bg-[#FAEF06]/30 text-[#8a8100] border-[#FAEF06]" }
                      ];
                      return items.map((item, idx) => {
                        const blockLine = <ShowBlock key={idx} start={currentStart} {...item} onClick={() => {
                          if (item.status === 'failed') {
                             handleAction?.(`Fix Playback: ${item.title}`);
                          } else {
                             handleAction?.(`Playback Click: ${item.title}|${item.status}|Screen 1`);
                          }
                        }} />;
                        currentStart += item.duration / 60;
                        return blockLine;
                      });
                    })()
                  )}
                  
                  {i === 1 && (
                    (() => {
                      let currentStart = 10;
                      const items = [
                        { duration: 15, title: "Morning Ads", status: "done", color: "bg-blue-100 text-blue-700 border-blue-200" },
                        { duration: 105, title: "Short Film Demo", status: "done", color: "bg-gray-200 text-gray-600 border-gray-300" },
                        { duration: 15, title: "Ads & Trailers", status: "done", color: "bg-blue-100 text-blue-700 border-blue-200" },
                        { duration: 115, title: "Drama Feature C", status: "failed", color: "bg-red-50 border-red-200 text-red-700" },
                        { duration: 15, title: "Bumper", status: "upcoming", color: "bg-blue-50 text-blue-500 border-blue-200" },
                        { duration: 160, title: "Action Blockbuster B", status: "upcoming", color: "bg-[#FAEF06]/30 text-[#8a8100] border-[#FAEF06]" },
                        { duration: 20, title: "Ads & Trailers", status: "upcoming", color: "bg-blue-50 text-blue-500 border-blue-200" },
                        { duration: 110, title: "Indie Drama Showcase", status: "upcoming", color: "bg-[#FAEF06]/30 text-[#8a8100] border-[#FAEF06]" },
                        { duration: 15, title: "Trailer Reel", status: "upcoming", color: "bg-blue-50 text-blue-500 border-blue-200" },
                        { duration: 100, title: "Sample Feature Film A", status: "upcoming", color: "bg-[#FAEF06]/30 text-[#8a8100] border-[#FAEF06]" }
                      ];
                      return items.map((item, idx) => {
                        const blockLine = <ShowBlock key={idx} start={currentStart} {...item} onClick={() => {
                          if (item.status === 'failed') {
                             handleAction?.(`Fix Playback: ${item.title}`);
                          } else {
                             handleAction?.(`Playback Click: ${item.title}|${item.status}|Screen 2`);
                          }
                        }} />;
                        currentStart += item.duration / 60;
                        return blockLine;
                      });
                    })()
                  )}
                  
                  {i === 2 && (
                    (() => {
                      let currentStart = 10.5;
                      const items = [
                        { duration: 120, title: "Indie Drama Showcase", status: "done", color: "bg-gray-200 text-gray-600 border-gray-300" },
                        { duration: 15, title: "Ads", status: "done", color: "bg-blue-100 text-blue-700 border-blue-200" },
                        { duration: 120, title: "Indie Drama Showcase", status: "playing", color: "bg-secondary/30 text-primary-dark border-secondary" },
                        { duration: 20, title: "Ads & Trailers", status: "upcoming", color: "bg-blue-50 text-blue-500 border-blue-200" },
                        { duration: 130, title: "Action Blockbuster B", status: "upcoming", color: "bg-[#FAEF06]/30 text-[#8a8100] border-[#FAEF06]" },
                        { duration: 15, title: "Ads", status: "upcoming", color: "bg-blue-50 text-blue-500 border-blue-200" },
                        { duration: 120, title: "Horror Anthology Entry", status: "upcoming", color: "bg-[#FAEF06]/30 text-[#8a8100] border-[#FAEF06]" },
                        { duration: 10, title: "Bumper", status: "upcoming", color: "bg-blue-50 text-blue-500 border-blue-200" },
                        { duration: 115, title: "Documentary Preview", status: "upcoming", color: "bg-[#FAEF06]/30 text-[#8a8100] border-[#FAEF06]" },
                        { duration: 10, title: "Ads", status: "upcoming", color: "bg-blue-50 text-blue-500 border-blue-200" },
                        { duration: 110, title: "Thriller Sequel", status: "upcoming", color: "bg-[#FAEF06]/30 text-[#8a8100] border-[#FAEF06]" }
                      ];
                      return items.map((item, idx) => {
                        const blockLine = <ShowBlock key={idx} start={currentStart} {...item} onClick={() => {
                          if (item.status === 'failed') {
                             handleAction?.(`Fix Playback: ${item.title}`);
                          } else {
                             handleAction?.(`Playback Click: ${item.title}|${item.status}|Screen 3`);
                          }
                        }} />;
                        currentStart += item.duration / 60;
                        return blockLine;
                      });
                    })()
                  )}
                </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ShowBlock({ start, duration, title, status, color, onClick }: { start: number, duration: number, title: string, status: string, color: string, onClick?: () => void, key?: number | string }) {
  const startHour = 10;
  const leftPercent = ((start - startHour) / 14) * 100;
  const widthPercent = ((duration / 60) / 14) * 100;

  return (
    <div 
      className={cn(
        "absolute z-10 top-3 bottom-3 rounded-md border flex flex-col justify-center px-3 transition-all overflow-hidden group",
        color,
        status === 'failed' && "animate-pulse"
      )}
      style={{ left: `calc(${leftPercent}%)`, width: `${widthPercent}%` }}
    >
      <div className="text-xs font-bold truncate leading-tight flex items-center gap-1.5">
         {status === 'failed' && (
           <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
         )}
         {title}
      </div>
      <div className="text-[10px] font-medium opacity-80 mt-0.5 truncate flex items-center gap-1.5">
          {status === 'playing' && <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>}
          {Math.floor(start)}:{Math.round((start%1)*60).toString().padStart(2, '0')} - {Math.floor(start + duration/60)}:{Math.round(((start + duration/60)%1)*60).toString().padStart(2, '0')}
      </div>
    </div>
  );
}
