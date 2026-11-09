import React from 'react';
import { Ticket, Radio, Stamp, Disc3, Orbit } from 'lucide-react';

const PHYSICAL_TEMPLATES = [
  {
    id: 'RECEIPTIFY',
    label: 'Ticket Stub',
    subLabel: 'Space Jazz Pass',
    icon: Ticket,
    description: 'Perforated pass with Swiss typography, artist portrait & barcode',
  },
  {
    id: 'CASSETTE',
    label: 'Cassette Tape',
    subLabel: 'Memory Anchors',
    icon: Radio,
    description: 'Acrylic shell with printed album art label & dual tape spools',
  },
  {
    id: 'STAMP',
    label: 'Airmail Stamp',
    subLabel: 'Scalloped Post',
    icon: Stamp,
    description: 'Vintage postage stamp with scalloped edges & postal cancellation mark',
  },
  {
    id: 'VINYL',
    label: 'Concert Vinyl',
    subLabel: '33⅓ RPM Record',
    icon: Disc3,
    description: '12" vinyl disc sliding out from gatefold album jacket',
  },
  {
    id: 'GALAXY',
    label: 'Cosmic Turntable',
    subLabel: 'Planetary Orbits',
    icon: Orbit,
    description: 'Cosmic turntable platter with concentric orbits & planet info tags',
  },
];

export default function TemplateSelector({ selectedTemplate, onSelectTemplate }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-mono font-bold uppercase tracking-wider text-sky-200 flex items-center gap-1.5">
          <span>Physical Template</span>
        </label>
        <span className="text-[10px] font-mono text-slate-400">
          Format: <strong className="text-sky-300 font-bold">{selectedTemplate}</strong>
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {PHYSICAL_TEMPLATES.map((tpl) => {
          const Icon = tpl.icon;
          const isSelected = (selectedTemplate || 'CASSETTE').toUpperCase() === tpl.id;

          return (
            <button
              key={tpl.id}
              type="button"
              onClick={() => onSelectTemplate(tpl.id)}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-22 relative overflow-hidden ${
                isSelected
                  ? 'bg-[#0d253d] border-sky-400/60 text-white shadow-md ring-1 ring-sky-400/30'
                  : 'bg-[#071523] border-sky-500/20 hover:bg-[#0c2034] hover:border-sky-400/40 text-slate-400'
              }`}
            >
              {isSelected && (
                <div className="absolute inset-0 bg-gradient-to-br from-[#00594c]/20 via-transparent to-sky-400/15 pointer-events-none" />
              )}
              <div className="flex items-center justify-between w-full relative z-10">
                <Icon className={`w-4 h-4 ${isSelected ? 'text-sky-400' : 'text-slate-400'}`} />
                {isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.9)]" />
                )}
              </div>

              <div className="relative z-10">
                <p className={`text-xs font-bold font-mono leading-tight ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                  {tpl.label}
                </p>
                <p className="text-[9.5px] font-mono text-slate-400 truncate mt-0.5">
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
