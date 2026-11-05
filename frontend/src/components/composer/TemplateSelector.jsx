import React from 'react';
import { Receipt, Radio, Stamp, Disc3 } from 'lucide-react';

const PHYSICAL_TEMPLATES = [
  {
    id: 'RECEIPTIFY',
    label: 'Receiptify',
    subLabel: 'Thermal Receipt',
    icon: Receipt,
    description: 'Vintage printed paper with monospace billing specs',
    accentColor: '#EAE3D2',
  },
  {
    id: 'CASSETTE',
    label: 'Cassette Tape',
    subLabel: 'Y2K Transparent',
    icon: Radio,
    description: 'Analog acrylic shell with spinning tape reels',
    accentColor: '#10202e',
  },
  {
    id: 'STAMP',
    label: 'Travel Stamp',
    subLabel: 'Airmail Post',
    icon: Stamp,
    description: 'Double-lined perforated postmark for journeys',
    accentColor: '#EFECE6',
  },
  {
    id: 'VINYL',
    label: 'Concert Disc',
    subLabel: 'Analog 33 RPM',
    icon: Disc3,
    description: 'Microgroove vinyl disc with spinning label',
    accentColor: '#091522',
  },
];

export default function TemplateSelector({ selectedTemplate, onSelectTemplate }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#91B9C5] flex items-center gap-1.5">
          <span>1. Physical Template</span>
          <span className="text-cyan-400">*</span>
        </label>
        <span className="text-[10px] font-mono text-[#91B9C5]/70">
          Selected: <strong className="text-white">{selectedTemplate}</strong>
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {PHYSICAL_TEMPLATES.map((tpl) => {
          const Icon = tpl.icon;
          const isSelected = (selectedTemplate || 'RECEIPTIFY').toUpperCase() === tpl.id;

          return (
            <button
              key={tpl.id}
              type="button"
              onClick={() => onSelectTemplate(tpl.id)}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-24 ${
                isSelected
                  ? 'bg-[#183952] border-cyan-400 ring-2 ring-cyan-400/40 shadow-lg shadow-cyan-950/50 scale-[1.02]'
                  : 'bg-[#081724] border-[#16354d] hover:bg-[#0d2336] hover:border-[#91B9C5]/40 text-[#91B9C5]/80'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <Icon className={`w-5 h-5 ${isSelected ? 'text-cyan-300' : 'text-[#91B9C5]'}`} />
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                )}
              </div>

              <div>
                <p className={`text-xs font-bold font-mono leading-tight ${isSelected ? 'text-white' : 'text-[#E8EEF0]'}`}>
                  {tpl.label}
                </p>
                <p className="text-[9.5px] font-mono text-[#91B9C5]/70 truncate mt-0.5">
                  {tpl.subLabel}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

