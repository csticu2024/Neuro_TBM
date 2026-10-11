import { useState, useEffect } from 'react';
import type { PatientData, SavedPatientRecord, PredictionResult } from './types/tbm';
import { INITIAL_PATIENT_DATA } from './utils/sampleData';
import { calculateTBMPrediction, calculateTBMPredictionAsync } from './utils/tbmPredictionEngine';
import { PatientForm } from './components/PatientForm';
import { PredictionDashboard } from './components/PredictionDashboard';
import { PatientHistoryTable } from './components/PatientHistoryTable';
import { CheckCircle2, RotateCcw, Printer } from 'lucide-react';

export function App() {
  const [activeView, setActiveView] = useState<'form' | 'registry'>('form');
  const [patientData, setPatientData] = useState<PatientData>(INITIAL_PATIENT_DATA);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [hasCalculated, setHasCalculated] = useState<boolean>(false);

  const [savedRecords, setSavedRecords] = useState<SavedPatientRecord[]>(() => {
    try {
      const stored = localStorage.getItem('tbm_saved_records');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('tbm_saved_records', JSON.stringify(savedRecords));
    } catch (e) {
      console.error('Failed to sync saved records', e);
    }
  }, [savedRecords]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handlePredict = async () => {
    try {
      const { result, isLiveBackend } = await calculateTBMPredictionAsync(patientData);
      setPrediction(result);
      setHasCalculated(true);
      if (isLiveBackend) {
        showNotification('⚡ TBM Chances & CBNAAT Positivity calculated via Flask ML Backend!');
      } else {
        showNotification('Calculated TBM Chances & CBNAAT Positivity');
      }
    } catch (err) {
      setPrediction(calculateTBMPrediction(patientData));
      setHasCalculated(true);
      showNotification('Calculated TBM Chances & CBNAAT Positivity');
    }
  };

  const isCurrentlySaved = savedRecords.some((r) => r.patientData.patientId === patientData.patientId);

  const handleSaveRecord = async () => {
    const { result } = await calculateTBMPredictionAsync(patientData);
    const newRecord: SavedPatientRecord = {
      id: `REC-${Date.now()}`,
      createdAt: new Date().toISOString(),
      patientData: { ...patientData },
      prediction: result
    };

    setSavedRecords((prev) => [newRecord, ...prev.filter((r) => r.patientData.patientId !== patientData.patientId)]);
    showNotification(`Case ${patientData.patientId} saved to registry.`);
  };

  const handleDeleteRecord = (id: string) => {
    setSavedRecords((prev) => prev.filter((r) => r.id !== id));
    showNotification('Record deleted.');
  };

  const handleSelectRecord = async (record: SavedPatientRecord) => {
    setPatientData(record.patientData);
    setPrediction(record.prediction);
    setHasCalculated(true);
    setActiveView('form');
    showNotification(`Loaded case ${record.patientData.patientId}.`);
  };

  const handleReset = () => {
    const resetData: PatientData = {
      ...INITIAL_PATIENT_DATA,
      patientId: `TBM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
    };
    setPatientData(resetData);
    setPrediction(null);
    setHasCalculated(false);
    showNotification('Form reset.');
  };

  const handleExportCSV = () => {
    if (savedRecords.length === 0) return;

    const headers = [
      'Patient ID',
      'Patient Name',
      'Age',
      'Sex',
      'Fever Duration',
      'Headache Duration',
      'Altered Sensorium',
      'Focal Deficit',
      'GCS',
      'Raised ICP',
      'Sodium',
      'CSF Count',
      'Protein',
      'Glucose',
      'TBM Probability (%)',
      'Risk Category'
    ];

    const rows = savedRecords.map((r) => [
      r.patientData.patientId,
      `"${r.patientData.patientName || ''}"`,
      r.patientData.age,
      r.patientData.sex,
      r.patientData.feverDurationMonths,
      r.patientData.headacheDurationMonths,
      r.patientData.alteredSensorium ? 'Yes' : 'No',
      r.patientData.focalNeurologicalDeficit ? 'Yes' : 'No',
      r.patientData.gcs,
      r.patientData.raisedICP ? 'Yes' : 'No',
      r.patientData.sodium,
      r.patientData.csfCount,
      r.patientData.protein,
      r.patientData.glucose,
      r.prediction.tbmProbability,
      r.prediction.riskCategory
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `TBM_Patient_Registry_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('Exported Patient Registry CSV.');
  };

  return (
    <div className="min-h-screen bg-[#0e1117] text-slate-100 flex flex-col font-sans">
      
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#1e2029] text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">{notification}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="bg-[#181a24] border-b border-[#262730] px-4 sm:px-6 py-3.5 no-print">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          
          {/* Left Title */}
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-wide">
              TBM Prediction
            </h1>
          </div>

          {/* Right Actions: Print & Reset ONLY */}
          <div className="flex items-center gap-3 text-xs">
            <button
              type="button"
              onClick={() => window.print()}
              className="py-1.5 px-3.5 bg-[#262730] hover:bg-[#363945] text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-[#363945] transition"
            >
              <Printer className="w-4 h-4 text-slate-300" /> Print
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="py-1.5 px-3.5 bg-[#262730] hover:bg-[#363945] text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-[#363945] transition"
            >
              <RotateCcw className="w-4 h-4 text-red-400" /> Reset
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 p-4 sm:p-6 max-w-5xl mx-auto w-full">
        {activeView === 'form' ? (
          <div className="space-y-6">
            <PatientForm
              data={patientData}
              onChange={setPatientData}
              onPredict={handlePredict}
            />

            {/* Show prediction dashboard after predict button is pressed or if record loaded */}
            {hasCalculated && prediction && (
              <div className="pt-4 border-t border-[#262730]">
                <h2 className="text-lg font-bold text-white mb-4">
                  Prediction & Diagnostic Risk Assessment
                </h2>
                <PredictionDashboard
                  prediction={prediction}
                  patientData={patientData}
                  onSaveRecord={handleSaveRecord}
                  onExportPDF={() => window.print()}
                  isSaved={isCurrentlySaved}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="bg-[#181a24] border border-[#262730] rounded-2xl p-6">
            <PatientHistoryTable
              records={savedRecords}
              onSelectRecord={handleSelectRecord}
              onDeleteRecord={handleDeleteRecord}
              onExportCSV={handleExportCSV}
            />
          </div>
        )}
      </main>

    </div>
  );
}

export default App;
