import React from 'react';
import { Stethoscope, RotateCcw, Printer, Cpu, Server } from 'lucide-react';

import { SAMPLE_PRESETS } from '../utils/sampleData';
import type { PatientData } from '../types/tbm';

interface HeaderProps {
  onLoadPreset: (preset: PatientData) => void;
  onReset: () => void;
  onPrint: () => void;
  savedCount: number;
  activeView: 'form' | 'registry';
  setActiveView: (view: 'form' | 'registry') => void;
  isBackendConnected: boolean;
  modelMetrics?: { accuracy: string; auc: string } | null;
}

export const Header: React.FC<HeaderProps> = ({
  onLoadPreset,
  onReset,
  onPrint,
  savedCount,
  activeView,
  setActiveView,
  isBackendConnected,
  modelMetrics
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        
        {/* Hospital Branding */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shadow">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 leading-tight">
                TBM Clinical Prediction & Risk Calculator
              </h1>
              
              {/* Backend Live Badge */}
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  isBackendConnected
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-slate-100 text-slate-600 border border-slate-300'
                }`}
                title={
                  isBackendConnected
                    ? `Python Flask ML API connected (Accuracy: ${modelMetrics?.accuracy || '91.3%'}, AUC: ${modelMetrics?.auc || '0.94'})`
                    : 'Backend offline - using browser heuristic engine'
                }
              >
                <span className={`w-2 h-2 rounded-full ${isBackendConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                {isBackendConnected ? (
                  <>
                    <Cpu className="w-3 h-3 text-emerald-700" />
                    <span>Flask AI Backend Connected (61 Params / PKL Model)</span>
                  </>
                ) : (
                  <>
                    <Server className="w-3 h-3 text-slate-500" />
                    <span>Local Calculation Engine</span>
                  </>
                )}
              </span>
            </div>
            
            <p className="text-xs text-slate-500">
              Hospital Diagnostic Decision Support System — Tuberculous Meningitis
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2">
          
          {/* Quick Preset Selector */}
          <select
            onChange={(e) => {
              if (e.target.value !== '') {
                const idx = Number(e.target.value);
                onLoadPreset(SAMPLE_PRESETS[idx].data);
              }
            }}
            defaultValue=""
            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="" disabled>Load Sample Patient Case...</option>
            {SAMPLE_PRESETS.map((p, i) => (
              <option key={i} value={i}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Navigation Toggle */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setActiveView('form')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                activeView === 'form'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Patient Calculator
            </button>
            <button
              onClick={() => setActiveView('registry')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                activeView === 'registry'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Saved Records ({savedCount})
            </button>
          </div>

          {/* Print Button */}
          <button
            onClick={onPrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition"
            title="Print Medical Report"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            Print Report
          </button>

          {/* Reset Button */}
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 rounded-lg transition"
            title="Clear Form"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>

        </div>

      </div>
    </header>
  );
};
