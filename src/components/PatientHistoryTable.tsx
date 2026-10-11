import React, { useState } from 'react';
import type { SavedPatientRecord } from '../types/tbm';
import { Search, Trash2, ExternalLink, Download, UserCheck } from 'lucide-react';

interface PatientHistoryTableProps {
  records: SavedPatientRecord[];
  onSelectRecord: (record: SavedPatientRecord) => void;
  onDeleteRecord: (id: string) => void;
  onExportCSV: () => void;
}

export const PatientHistoryTable: React.FC<PatientHistoryTableProps> = ({
  records,
  onSelectRecord,
  onDeleteRecord,
  onExportCSV
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState<string>('All');

  const filtered = records.filter((r) => {
    const matchesSearch =
      r.patientData.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.patientData.age?.toString().includes(searchTerm);

    const matchesRisk = filterRisk === 'All' || r.prediction.riskCategory === filterRisk;

    return matchesSearch && matchesRisk;
  });

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-600" /> Patient Registry ({records.length} Cases)
          </h2>
          <p className="text-xs text-slate-500">
            Archived hospital evaluations, TBM probability scores, and diagnostic outcomes.
          </p>
        </div>

        <button
          onClick={onExportCSV}
          disabled={records.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 transition shadow-sm"
        >
          <Download className="w-4 h-4" /> Export CSV Registry
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Patient ID or Age..."
            className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={filterRisk}
          onChange={(e) => setFilterRisk(e.target.value)}
          className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="All">All Risk Levels</option>
          <option value="Very High Risk">Very High Risk</option>
          <option value="High Risk">High Risk</option>
          <option value="Moderate Risk">Moderate Risk</option>
          <option value="Low Risk">Low Risk</option>
        </select>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-left text-xs text-slate-800">
          <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
            <tr>
              <th className="px-4 py-2.5">Patient ID</th>
              <th className="px-4 py-2.5">Age / Sex</th>
              <th className="px-4 py-2.5">TBM Risk %</th>
              <th className="px-4 py-2.5">Category</th>
              <th className="px-4 py-2.5">CBNAAT</th>
              <th className="px-4 py-2.5">CSF Ratio</th>
              <th className="px-4 py-2.5">Date</th>
              <th className="px-4 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {filtered.map((record) => (
              <tr key={record.id} className="hover:bg-slate-50 transition">
                <td className="px-4 py-2.5 font-bold text-blue-900 font-mono">
                  {record.patientData.patientId}
                </td>
                <td className="px-4 py-2.5">
                  {record.patientData.age || 'N/A'} yrs / {record.patientData.sex}
                </td>
                <td className="px-4 py-2.5 font-mono font-black text-slate-900">
                  {record.prediction.tbmProbability}%
                </td>
                <td className="px-4 py-2.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    record.prediction.riskCategory === 'Very High Risk' || record.prediction.riskCategory === 'High Risk'
                      ? 'bg-red-100 text-red-800 border-red-300'
                      : record.prediction.riskCategory === 'Moderate Risk'
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}>
                    {record.prediction.riskCategory}
                  </span>
                </td>
                <td className="px-4 py-2.5 font-mono font-semibold">
                  {record.patientData.cbnaat}
                </td>
                <td className="px-4 py-2.5 font-mono">
                  {record.patientData.csfBloodRatio || 'N/A'}
                </td>
                <td className="px-4 py-2.5 text-slate-500 text-[11px]">
                  {new Date(record.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => onSelectRecord(record)}
                      className="p-1 hover:bg-slate-200 rounded text-blue-600 transition"
                      title="Load into Form"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteRecord(record.id)}
                      className="p-1 hover:bg-red-100 rounded text-red-600 transition"
                      title="Delete Record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-6 text-slate-500 italic">
                  No saved patient cases in registry.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};
