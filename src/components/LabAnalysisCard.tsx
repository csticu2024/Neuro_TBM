import React from 'react';
import type { PatientData } from '../types/tbm';
import { TestTube2 } from 'lucide-react';


interface LabAnalysisCardProps {
  data: PatientData;
}

export const LabAnalysisCard: React.FC<LabAnalysisCardProps> = ({ data }) => {
  const csfRatio = typeof data.csfBloodRatio === 'number' ? data.csfBloodRatio : null;
  const ast = typeof data.ast === 'number' ? data.ast : null;
  const alt = typeof data.alt === 'number' ? data.alt : null;
  const lymphPct = typeof data.lymphocytesPct === 'number' ? data.lymphocytesPct : null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <TestTube2 className="w-4 h-4 text-emerald-400" />
          Laboratory Biomarker Reference Ranges
        </h3>
        <span className="text-xs text-slate-400 font-mono">Patient: {data.patientId}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* CSF:Blood Glucose Ratio Meter */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-300">CSF:Blood Glucose Ratio</span>
            <span className="font-mono text-emerald-400 font-bold">{csfRatio !== null ? csfRatio : 'N/A'}</span>
          </div>

          <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden flex">
            <div className="w-1/3 bg-red-500" title="< 0.3 Critical" />
            <div className="w-1/3 bg-amber-500" title="0.3 - 0.5 Low" />
            <div className="w-1/3 bg-emerald-500" title="> 0.5 Normal" />
          </div>

          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>&lt;0.3 (Critical)</span>
            <span>0.5</span>
            <span>&gt;0.6 (Normal)</span>
          </div>
        </div>

        {/* Lymphocyte Predominance Meter */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-300">Lymphocytes (%)</span>
            <span className="font-mono text-indigo-400 font-bold">{lymphPct !== null ? `${lymphPct}%` : 'N/A'}</span>
          </div>

          <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden flex">
            <div className="w-1/2 bg-slate-700" title="< 50% Neutrophilic" />
            <div className="w-1/2 bg-indigo-500" title="> 50% Lymphocytic" />
          </div>

          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>Neutrophilic (&lt;50%)</span>
            <span>Lymphocytic (&gt;50%)</span>
          </div>
        </div>

        {/* Transaminases Baseline */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-300">Transaminases (AST/ALT)</span>
            <span className="font-mono text-amber-300 font-bold">
              {ast !== null ? ast : 'N/A'} / {alt !== null ? alt : 'N/A'} U/L
            </span>
          </div>

          <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden flex">
            <div className="w-1/2 bg-emerald-500" title="< 40 Normal" />
            <div className="w-1/4 bg-amber-500" title="40-120 Moderate" />
            <div className="w-1/4 bg-red-500" title="> 120 High Risk" />
          </div>

          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>Normal (&lt;40)</span>
            <span>3x ULN</span>
            <span>Severe (&gt;120)</span>
          </div>
        </div>

      </div>

    </div>
  );
};
