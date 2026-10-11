import React, { useState } from 'react';
import type { PatientData } from '../types/tbm';

interface PatientFormProps {
  data: PatientData;
  onChange: (data: PatientData) => void;
  onPredict: () => void;
}

export const PatientForm: React.FC<PatientFormProps> = ({ data, onChange, onPredict }) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'clinical' | 'lab'>('basic');

  const updateField = <K extends keyof PatientData>(field: K, value: PatientData[K]) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  const handleNumericChange = (field: keyof PatientData, valStr: string) => {
    const parsed = valStr === '' ? '' : parseFloat(valStr);
    if (field === 'csfBloodRatio' && typeof parsed === 'number') {
      const bs = typeof data.bloodSugar === 'number' ? data.bloodSugar : 100;
      onChange({
        ...data,
        csfBloodRatio: parsed,
        glucose: Math.round(parsed * bs * 10) / 10
      });
      return;
    }
    updateField(field, parsed as any);
  };

  const incrementValue = (field: keyof PatientData, step: number = 1.0) => {
    const current = typeof data[field] === 'number' ? (data[field] as number) : 0;
    const nextVal = Math.round((current + step) * 100) / 100;
    if (field === 'csfBloodRatio') {
      const bs = typeof data.bloodSugar === 'number' ? data.bloodSugar : 100;
      onChange({
        ...data,
        csfBloodRatio: nextVal,
        glucose: Math.round(nextVal * bs * 10) / 10
      });
      return;
    }
    updateField(field, nextVal as any);
  };

  const decrementValue = (field: keyof PatientData, step: number = 1.0, minVal: number = 0) => {
    const current = typeof data[field] === 'number' ? (data[field] as number) : 0;
    const nextVal = Math.max(minVal, Math.round((current - step) * 100) / 100);
    if (field === 'csfBloodRatio') {
      const bs = typeof data.bloodSugar === 'number' ? data.bloodSugar : 100;
      onChange({
        ...data,
        csfBloodRatio: nextVal,
        glucose: Math.round(nextVal * bs * 10) / 10
      });
      return;
    }
    updateField(field, nextVal as any);
  };

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#146b6e] via-[#1d9a8e] to-[#25b597] p-8 text-center shadow-lg">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center justify-center gap-2">
          <span>🏥</span> TBM Mortality Prediction System
        </h1>
        <p className="mt-2 text-sm sm:text-base text-teal-50 font-normal tracking-wide">
          Clinical Risk Assessment
        </p>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="border-b border-[#363945]">
        <nav className="flex space-x-8" aria-label="Tabs">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`pb-3 px-1 border-b-2 text-sm font-medium transition-colors ${
              activeTab === 'basic'
                ? 'border-red-500 text-white font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Basic Parameters
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('clinical')}
            className={`pb-3 px-1 border-b-2 text-sm font-medium transition-colors ${
              activeTab === 'clinical'
                ? 'border-red-500 text-white font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Clinical Parameters
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('lab')}
            className={`pb-3 px-1 border-b-2 text-sm font-medium transition-colors ${
              activeTab === 'lab'
                ? 'border-red-500 text-white font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Lab & Imaging parameters
          </button>
        </nav>
      </div>

      {/* 3. Tab Content */}
      {/* Tab 1: Basic Parameters (Name, Age, Sex, Duration of Fever, Duration of Headache) */}
      {activeTab === 'basic' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
          {/* Left Column */}
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-200">Name</label>
              <input
                type="text"
                value={data.patientName || ''}
                onChange={(e) => updateField('patientName', e.target.value)}
                placeholder="Enter patient name"
                className="w-full bg-[#262730] border border-[#363945] rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all"
              />
            </div>

            <StepperInput
              label="Age (years)"
              value={data.age}
              onChange={(v) => handleNumericChange('age', v)}
              onIncrement={() => incrementValue('age', 1)}
              onDecrement={() => decrementValue('age', 1, 0)}
              step="1.00"
            />

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-200">Sex</label>
              <select
                value={data.sex}
                onChange={(e) => updateField('sex', e.target.value as 'Male' | 'Female')}
                className="w-full bg-[#262730] border border-[#363945] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
              </select>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-5">
            <StepperInput
              label="Duration of Fever (Months)"
              value={data.feverDurationMonths}
              onChange={(v) => handleNumericChange('feverDurationMonths', v)}
              onIncrement={() => incrementValue('feverDurationMonths', 0.5)}
              onDecrement={() => decrementValue('feverDurationMonths', 0.5, 0)}
              step="0.50"
            />

            <StepperInput
              label="Duration of Headache (Months)"
              value={data.headacheDurationMonths}
              onChange={(v) => handleNumericChange('headacheDurationMonths', v)}
              onIncrement={() => incrementValue('headacheDurationMonths', 0.5)}
              onDecrement={() => decrementValue('headacheDurationMonths', 0.5, 0)}
              step="0.50"
            />
          </div>
        </div>
      )}

      {/* Tab 2: Clinical Parameters (Altered Mental Status, GCS, Raised ICP, Seizures, Focal Neurological Deficit) */}
      {activeTab === 'clinical' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
          {/* Left Column */}
          <div className="space-y-5">
            <ToggleControl
              label="Altered Mental Status"
              checked={data.alteredSensorium}
              onChange={(v) => updateField('alteredSensorium', v)}
            />

            {/* GCS Slider */}
            <div className="space-y-2 pt-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-200">GCS (Glasgow Coma Scale)</span>
                <span className="text-sm font-bold text-red-500">{data.gcs}</span>
              </div>
              <input
                type="range"
                min={3}
                max={15}
                value={data.gcs}
                onChange={(e) => updateField('gcs', Number(e.target.value))}
                className="w-full accent-red-500 bg-[#363945] h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <ToggleControl
              label="Raised ICP"
              checked={data.raisedICP}
              onChange={(v) => updateField('raisedICP', v)}
            />
          </div>

          {/* Right Column */}
          <div className="space-y-5">
            <ToggleControl
              label="Seizures"
              checked={data.seizures}
              onChange={(v) => updateField('seizures', v)}
            />

            <ToggleControl
              label="Focal Neurological Deficit"
              checked={data.focalNeurologicalDeficit}
              onChange={(v) => updateField('focalNeurologicalDeficit', v)}
            />
          </div>
        </div>
      )}

      {/* Tab 3: Lab & Imaging parameters (Sodium, Creatinine, CSF cells, Lymphocytes, Protein, CSF:Blood Sugar Ratio, Hydrocephalus, Basal Exudates, Infarcts, Tuberculomas) */}
      {activeTab === 'lab' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
          {/* Left Column: Lab Parameters */}
          <div className="space-y-5">
            <StepperInput
              label="Sodium (mEq/L)"
              value={data.sodium}
              onChange={(v) => handleNumericChange('sodium', v)}
              onIncrement={() => incrementValue('sodium', 1)}
              onDecrement={() => decrementValue('sodium', 1, 80)}
              step="1.00"
            />

            <StepperInput
              label="Creatinine (mg/dL)"
              value={data.creatinine}
              onChange={(v) => handleNumericChange('creatinine', v)}
              onIncrement={() => incrementValue('creatinine', 0.1)}
              onDecrement={() => decrementValue('creatinine', 0.1, 0)}
              step="0.10"
            />

            <StepperInput
              label="CSF cells (cells/µL)"
              value={data.csfCount}
              onChange={(v) => handleNumericChange('csfCount', v)}
              onIncrement={() => incrementValue('csfCount', 5)}
              onDecrement={() => decrementValue('csfCount', 5, 0)}
              step="1.00"
            />

            <StepperInput
              label="Lymphocytes (%)"
              value={data.lymphocytes}
              onChange={(v) => handleNumericChange('lymphocytes', v)}
              onIncrement={() => incrementValue('lymphocytes', 1)}
              onDecrement={() => decrementValue('lymphocytes', 1, 0)}
              step="1.00"
            />

            <StepperInput
              label="Protein (mg/dL)"
              value={data.protein}
              onChange={(v) => handleNumericChange('protein', v)}
              onIncrement={() => incrementValue('protein', 10)}
              onDecrement={() => decrementValue('protein', 10, 0)}
              step="1.00"
            />

            <StepperInput
              label="CSF:Blood Sugar Ratio"
              value={data.csfBloodRatio}
              onChange={(v) => handleNumericChange('csfBloodRatio', v)}
              onIncrement={() => incrementValue('csfBloodRatio', 0.05)}
              onDecrement={() => decrementValue('csfBloodRatio', 0.05, 0)}
              step="0.05"
            />
          </div>

          {/* Right Column: Imaging Parameters */}
          <div className="space-y-5">
            <ToggleControl
              label="Hydrocephalus"
              checked={data.hydrocephalus}
              onChange={(v) => updateField('hydrocephalus', v)}
            />

            <ToggleControl
              label="Basal Exudates"
              checked={data.basalExudates}
              onChange={(v) => updateField('basalExudates', v)}
            />

            <ToggleControl
              label="Infarcts"
              checked={data.infarcts}
              onChange={(v) => updateField('infarcts', v)}
            />

            <ToggleControl
              label="Tuberculomas"
              checked={data.tuberculomas}
              onChange={(v) => updateField('tuberculomas', v)}
            />
          </div>
        </div>
      )}

      {/* 5. Predict Button */}
      <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <button
          type="button"
          onClick={onPredict}
          className="bg-[#1e2029] hover:bg-[#2a2c38] text-white border border-[#434756] rounded-xl px-6 py-2.5 text-sm font-semibold shadow-md transition-all active:scale-[0.98]"
        >
          Predict TBM Diagnostic Chances
        </button>
      </div>

      {/* 6. Footer Divider & Credit */}
      <div className="pt-8 border-t border-[#262730] text-xs text-slate-400 tracking-wide">
        TBM Mortality Prediction System | IET Lucknow Research Project
      </div>
    </div>
  );
};

// --- Helper Input Components ---

interface StepperInputProps {
  label: string;
  value: number | '';
  onChange: (valStr: string) => void;
  onIncrement: () => void;
  onDecrement: () => void;
  step?: string;
}

const StepperInput: React.FC<StepperInputProps> = ({
  label,
  value,
  onChange,
  onIncrement,
  onDecrement,
  step = "1.00"
}) => {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-200">{label}</label>
      <div className="flex items-center bg-[#262730] border border-[#363945] rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-red-500">
        <input
          type="number"
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0.00"
          className="w-full bg-transparent px-3.5 py-2.5 text-sm text-white focus:outline-none font-mono"
        />
        <div className="flex shrink-0 border-l border-[#363945]">
          <button
            type="button"
            onClick={onDecrement}
            className="px-3.5 py-2.5 text-slate-300 hover:bg-[#363945] hover:text-white transition font-bold select-none border-r border-[#363945]"
          >
            -
          </button>
          <button
            type="button"
            onClick={onIncrement}
            className="px-3.5 py-2.5 text-slate-300 hover:bg-[#363945] hover:text-white transition font-bold select-none"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
};

interface ToggleControlProps {
  label: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}

const ToggleControl: React.FC<ToggleControlProps> = ({ label, checked, onChange }) => {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm font-medium text-slate-200">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          checked ? 'bg-red-500' : 'bg-[#434756]'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
};
