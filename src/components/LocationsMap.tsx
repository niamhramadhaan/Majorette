import React from 'react';
import { Map, Marker, Overlay } from 'pigeon-maps';
import type { Location } from '../types';

export function LocationsMap({ locations, onLocationSelect }: { locations: Location[], onLocationSelect: (loc: Location) => void }) {
  const defaultCenter: [number, number] = [-6.25, 106.8]; // Jakarta rough center

  return (
    <div className="card overflow-hidden h-[600px] w-full border border-gray-200">
      <Map defaultCenter={defaultCenter} defaultZoom={10} minZoom={5}>
        {locations.map((loc) => {
          if (!loc.lat || !loc.lng) return null;
          return (
            // @ts-ignore
            <Overlay key={loc.id} anchor={[loc.lat, loc.lng]} offset={[16, 32]}>
              <div 
                className="group relative flex flex-col items-center cursor-pointer"
                onClick={() => onLocationSelect(loc)}
              >
                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-white px-2 py-1 rounded shadow text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 border border-gray-200 text-gray-800 pointer-events-none">
                  {loc.name}
                  <div className="text-[9px] text-gray-500 font-normal">{loc.screens} Screens &bull; {loc.status}</div>
                </div>
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white shadow-md border-2 border-white group-hover:scale-110 transition-transform">
                  <span className="text-[10px] font-bold">{loc.screens}</span>
                </div>
              </div>
            </Overlay>
          );
        })}
      </Map>
    </div>
  );
}
