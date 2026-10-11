import type { PatientData, PredictionResult } from '../types/tbm';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:5001/api' : '/api');

export interface BackendHealthResponse {
  status: string;
  service: string;
  modelLoaded: boolean;
  modelFile?: string;
  modelType?: string;
  modelFeatureCount?: number;
  modelFeatures?: string[];
  totalParametersCount?: number;
  modelMetrics?: {
    accuracy?: string;
    auc?: string;
    target?: string;
  };
}

export interface BackendPredictionResponse extends PredictionResult {
  mlMortalityProbability?: number;
  processedFeaturesCount?: number;
  source?: string;
}

export async function checkBackendHealth(): Promise<BackendHealthResponse | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function fetchBackendPrediction(data: PatientData): Promise<BackendPredictionResponse | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      console.warn('Backend API returned non-200 status:', res.status);
      return null;
    }

    const json = await res.json();
    return json;
  } catch (err) {
    console.warn('Could not connect to Python Flask backend API:', err);
    return null;
  }
}
