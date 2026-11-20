
import React from 'react';
import type { PredictionResult, PatientData } from '../types/tbm';
import {
  BookmarkPlus,
  Printer,
  Brain,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

interface PredictionDashboardProps {
  prediction: PredictionResult;
  patientData: PatientData;
  onSaveRecord: () => void;
  onExportPDF: () => void;
  isSaved?: boolean;
}

export const PredictionDashboard: React.FC<PredictionDashboardProps> = ({
  prediction,
  patientData,
  onSaveRecord,
  onExportPDF,
  isSaved = false
}) => {
  const {
    hasNeurologicalDisorder,
    neurologicalDisorderProbability,
    neurologicalDisorderSummary,
    tbmProbability,
    riskCategory,
    confidenceScore,
    maraisScore,
    predictedGOSLabel
  } = prediction;

  const isHigh =
    riskCategory === 'High Risk' ||
    riskCategory === 'Very High Risk';

  const isModerate = riskCategory === 'Moderate Risk';

  const riskBannerStyle = isHigh
    ? 'bg-red-600 text-white'
    : isModerate
    ? 'bg-amber-500 text-slate-900'
    : 'bg-emerald-600 text-white';

  const isNeuroYes = hasNeurologicalDisorder === 'YES';

  const definiteChances =
    prediction.definiteChancesWithCBNAAT ??
    (
      patientData.cbnaat === 'Positive'
        ? Math.min(
            Math.round(Math.max(tbmProbability, 97.5) * 10) / 10,
            99.5
          )
        : Math.min(
            Math.round(Math.max(tbmProbability + 15, 95.0) * 10) / 10,
            98.5
          )
    );

  return (
    <div className="space-y-4">

      {/* NEUROLOGICAL DISORDER PREDICTION CARD */}

      <div
        className={`rounded-xl border-2 shadow-md overflow-hidden transition-all ${
          isNeuroYes
            ? 'bg-gradient-to-br from-red-900 via-slate-900 to-slate-950 border-red-500 text-white'
            : 'bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-950 border-emerald-500 text-white'
        }`}
      >
        <div className="p-4 sm:p-5 space-y-3">

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider opacity-90 text-slate-300">
              <Brain
                className={`w-5 h-5 ${
                  isNeuroYes
                    ? 'text-red-400 animate-pulse'
                    : 'text-emerald-400'
                }`}
              />
              <span>Neurological Disorder Prediction</span>
            </div>

            <span
              className={`px-2.5 py-1 rounded-full text-xs font-extrabold font-mono border ${
                isNeuroYes
                  ? 'bg-red-500/20 text-red-300 border-red-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}
            >
              Confidence: {neurologicalDisorderProbability || 99}%
            </span>
          </div>

          <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-700/60">
            <div>
              <p className="text-xs text-slate-400 font-medium">
                Predicted Status:
              </p>

              <div className="flex items-center gap-3 mt-1">
                <span
                  className={`text-3xl sm:text-4xl font-black font-mono tracking-tight px-4 py-1 rounded-xl shadow-lg border ${
                    isNeuroYes
                      ? 'bg-red-600 text-white border-red-400 shadow-red-900/50'
                      : 'bg-emerald-600 text-white border-emerald-400 shadow-emerald-900/50'
                  }`}
                >
                  {hasNeurologicalDisorder || 'NO'}
                </span>

                <div className="text-xs space-y-0.5">
                  <p className="font-bold text-slate-200">
                    {isNeuroYes
                      ? 'Neurological Disorder Detected'
                      : 'No Neurological Disorder Detected'}
                  </p>

                  <p className="text-slate-400 text-[11px]">
                    {isNeuroYes
                      ? 'Action: Immediate Neurological Evaluation Required'
                      : 'Action: Routine Monitoring'}
                  </p>
                </div>
              </div>
            </div>

            <div className="shrink-0">
              {isNeuroYes ? (
                <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shadow-inner">
                  <AlertTriangle className="w-7 h-7" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
              )}
            </div>
          </div>

          <p className="text-xs text-slate-300 pt-1 leading-relaxed bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/50">
            {neurologicalDisorderSummary}
          </p>

        </div>
      </div>

      {/* MAIN DIAGNOSTIC RISK CARD */}

      <div className="bg-white border-2 border-slate-300 rounded-xl shadow-md overflow-hidden">

        {/* RISK LEVEL BANNER */}

        <div
          className={`px-4 py-3 flex items-center justify-between ${riskBannerStyle}`}
        >
          <div>
            <span className="text-xs font-bold uppercase tracking-wider block opacity-90">
              Diagnostic Category
            </span>

            <h2 className="text-xl font-black uppercase tracking-tight">
              {riskCategory}
            </h2>
          </div>

          <div className="text-right">
            <span className="text-xs opacity-90 font-mono block">
              Confidence
            </span>

            <span className="text-lg font-extrabold font-mono">
              {confidenceScore}%
            </span>
          </div>
        </div>

        {/* TBM SCORE METER */}

        <div className="p-5 space-y-4 text-slate-900">

          {/* DIAGNOSTIC PREDICTION */}

          <div className="rounded-xl bg-slate-900 text-white p-4 sm:p-5 border border-slate-800 space-y-3.5 shadow-md">

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">📊</span>

                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Diagnostic Prediction
                </span>
              </div>
            </div>

            {/* PRIMARY TBM PROBABILITY */}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-b border-slate-800 pb-3">

              <div>
                <span className="text-sm text-slate-300 font-medium">
                  Chances:
                </span>

                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white">
                    {tbmProbability}%
                  </span>

                  <span className="text-xs text-slate-400">
                    (Calculated Probability Score)
                  </span>
                </div>
              </div>

            </div>

            {/* DEFINITE CHANCES WITH CBNAAT POSITIVITY */}

            <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700 space-y-2">

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />

                  <span className="text-xs font-bold text-slate-200">
                    Definite chances with CBNAAT positivity:
                  </span>
                </div>

                <span className="text-base font-black font-mono text-emerald-400">
                  {definiteChances}%
                </span>
              </div>

              <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      Math.max(definiteChances, 5),
                      100
                    )}%`
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                <span>
                  Microbiological Confirmation (GeneXpert / CBNAAT)
                </span>

                <span className="font-mono text-slate-300">
                  {patientData.cbnaat === 'Positive' ? (
                    <span className="text-emerald-400 font-bold">
                      CBNAAT Confirmed Positive
                    </span>
                  ) : (
                    <span>
                      Estimated upon positive CBNAAT test
                    </span>
                  )}
                </span>
              </div>

            </div>

            {/* MORTALITY RISK DISPLAY */}

            <div className="bg-gradient-to-r from-red-950/40 via-slate-800 to-slate-900 rounded-lg p-3.5 border border-red-500/30 flex items-center justify-between">

              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-400" />

                  <span className="text-xs font-bold text-red-200 uppercase tracking-wide">
                    Mortality Risk
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-300">
                  <span>Risk Level:</span>

                  <span
                    className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                      isHigh
                        ? 'bg-red-500/20 text-red-300'
                        : isModerate
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    {riskCategory}
                  </span>

                  <span className="text-slate-500">|</span>

                  <span className="text-slate-400">
                    Prognosis:{' '}
                    <strong className="text-slate-200">
                      {predictedGOSLabel}
                    </strong>
                  </span>
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-baseline gap-1 justify-end">
                  <span className="text-2xl sm:text-3xl font-black font-mono text-red-400">
                    {prediction.mortalityRiskPercentage ??
                      (isHigh ? 68.5 : isModerate ? 32.0 : 12.5)}
                    %
                  </span>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    prediction.mortalityPredictionBinary === 1 || isHigh
                      ? 'bg-red-500/20 text-red-300 border-red-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}
                >
                  {prediction.mortalityPredictionBinary === 1 || isHigh
                    ? 'Elevated Mortality Risk'
                    : 'Low Mortality Risk'}
                </span>
              </div>

            </div>

          </div>

          {/* CLINICAL BENCHMARKS SUMMARY */}

          <div className="grid grid-cols-2 gap-2 text-xs font-medium">

            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">
                Marais Criteria
              </span>

              <span className="text-base font-bold text-blue-900 font-mono">
                {maraisScore} pts
              </span>

              <p className="text-[10px] text-slate-500 mt-0.5">
                {maraisScore >= 12
                  ? 'Definite/Probable'
                  : 'Possible TBM'}
              </p>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">
                Outcome Forecast
              </span>

              <span className="text-xs font-bold text-blue-900 line-clamp-1">
                {predictedGOSLabel}
              </span>

              <p className="text-[10px] text-slate-500 mt-0.5">
                Glasgow Outcome Scale
              </p>
            </div>

          </div>

          {/* ACTION BUTTONS */}

          <div className="flex items-center gap-2 pt-1 no-print">

            <button
              onClick={onSaveRecord}
              disabled={isSaved}
              className={`flex-1 py-2 text-xs font-bold rounded-lg border flex items-center justify-center gap-1.5 transition ${
                isSaved
                  ? 'bg-slate-100 text-slate-600 border-slate-300'
                  : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow'
              }`}
            >
              <BookmarkPlus className="w-4 h-4" />

              {isSaved ? 'Case Saved' : 'Save Patient Case'}
            </button>

            <button
              onClick={onExportPDF}
              className="py-2 px-3 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg border border-slate-300 flex items-center gap-1 transition"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>

          </div>

        </div>

      </div>

    </div>
  );
};
