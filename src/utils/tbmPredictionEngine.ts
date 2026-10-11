import type { PatientData, PredictionResult } from '../types/tbm';
import { fetchBackendPrediction } from './api';
import type { BackendPredictionResponse } from './api';

export function calculateTBMPrediction(data: PatientData): PredictionResult {
  let score = 0;
  const riskFactors: string[] = [];
  const recommendations: string[] = [];

  // Neurological Disorder specific evaluation
  const neuroReasons: string[] = [];
  if (data.meningealSigns) neuroReasons.push('Positive Meningeal Signs');
  if (data.cranialNervePalsies) neuroReasons.push('Cranial Nerve Palsy');
  if (data.motorDeficits) neuroReasons.push('Focal Motor Deficits');
  if (data.seizures) neuroReasons.push('Seizures / Convulsions');
  if (data.behaviouralChanges) neuroReasons.push('Altered Sensorium / Behavioural Changes');
  if (data.featuresOfArachnoiditis || data.featuresOfMyelitis) neuroReasons.push('Spinal Cord Involvement');
  if (data.meningealEnhancement || data.tuberculomas) neuroReasons.push('CNS Imaging Abnormalities');

  const hasNeurologicalDisorder: 'YES' | 'NO' = neuroReasons.length > 0 ? 'YES' : 'NO';
  const neurologicalDisorderProbability = neuroReasons.length > 0 
    ? Math.min(75 + (neuroReasons.length * 8), 99) 
    : 5;

  const neurologicalDisorderSummary = hasNeurologicalDisorder === 'YES'
    ? `Patient presents key clinical findings consistent with a Neurological Disorder (${neuroReasons.join(', ')}).`
    : 'No overt focal neurological deficits, meningeal signs, or CNS structural lesions identified.';

  // 1. Demographics & History Weighting
  if (typeof data.age === 'number') {
    if (data.age < 36) {
      score += 8;
      riskFactors.push('Younger age group (<36 yrs)');
    } else {
      score += 4;
    }
  }

  if (data.contactWithTBPatient) {
    score += 15;
    riskFactors.push('Known contact with active TB patient');
  }

  if (data.pastAntiTBTreatment || data.priorConcurrentTB) {
    score += 12;
    riskFactors.push('Prior/Concurrent history of TB');
  }

  if (data.comorbidIllness.includes('HIV')) {
    score += 10;
    riskFactors.push('Immunocompromised state (HIV positive)');
  }

  // 2. Constitutional Symptoms
  let constitutionalCount = 0;
  if (data.fever) constitutionalCount++;
  if (data.eveningRise) {
    constitutionalCount += 2;
    riskFactors.push('Classic evening rise of temperature');
  }
  if (data.nightSweats) constitutionalCount++;
  if (data.weightLoss) {
    constitutionalCount += 2;
    riskFactors.push('Unexplained weight loss');
  }
  if (data.lossOfAppetite) constitutionalCount++;
  if (data.cough) constitutionalCount++;

  score += Math.min(constitutionalCount * 4, 20);

  // 3. Neurological Manifestations
  if (data.headache) {
    score += 6;
    if (data.headachePersistent && data.headacheProgressive) {
      score += 6;
      riskFactors.push('Persistent & progressive headache');
    }
  }

  if (data.meningealSigns) {
    score += 12;
    riskFactors.push('Positive meningeal irritation signs');
  }

  if (data.cranialNervePalsies) {
    score += 14;
    riskFactors.push('Cranial nerve palsy present');
  }

  if (data.motorDeficits) {
    score += 10;
    riskFactors.push('Focal motor deficit present');
  }

  if (data.seizures) {
    score += 8;
    riskFactors.push('Seizure activity noted');
  }

  if (data.behaviouralChanges) {
    score += 10;
    riskFactors.push('Altered sensorium / behavioural changes');
  }

  if (data.featuresOfArachnoiditis || data.featuresOfMyelitis) {
    score += 12;
    riskFactors.push('Spinal cord involvement (Arachnoiditis/Myelitis)');
  }

  // 4. Lab & CSF Chemistry
  if (typeof data.csfBloodRatio === 'number' && data.csfBloodRatio > 0) {
    if (data.csfBloodRatio < 0.3) {
      score += 25;
      riskFactors.push('Severely decreased CSF:Blood glucose ratio (<0.3)');
    } else if (data.csfBloodRatio < 0.5) {
      score += 16;
      riskFactors.push('Low CSF:Blood glucose ratio (<0.5)');
    }
  }

  if (typeof data.lymphocytesPct === 'number' && data.lymphocytesPct > 50) {
    score += 12;
    riskFactors.push('Lymphocytic predominance in CSF/Blood');
  }

  if (data.cbnaat === 'Positive') {
    score += 35;
    riskFactors.push('CBNAAT / GeneXpert Mycobacterium tuberculosis POSITIVE');
  }

  // 5. Neuroimaging
  if (data.meningealEnhancement) {
    score += 18;
    riskFactors.push('Basal meningeal enhancement on neuroimaging');
  }

  if (data.tuberculomas) {
    score += 20;
    riskFactors.push('Intracranial tuberculomas identified on MRI/CT');
  }

  if (data.systemicTBEvidence) {
    score += 15;
    riskFactors.push('Extrameningeal systemic TB evidence');
  }

  const maxPossibleScore = 160;
  let rawProb = (score / maxPossibleScore) * 100;
  
  if (data.cbnaat === 'Positive') {
    rawProb = Math.max(rawProb, 92);
  }

  const tbmProbability = Math.min(Math.round(rawProb * 10) / 10, 99.5);

  let riskCategory: PredictionResult['riskCategory'] = 'Low Risk';
  if (tbmProbability >= 75) {
    riskCategory = 'Very High Risk';
  } else if (tbmProbability >= 50) {
    riskCategory = 'High Risk';
  } else if (tbmProbability >= 30) {
    riskCategory = 'Moderate Risk';
  }

  let thwaites = 0;
  if (typeof data.age === 'number') thwaites += data.age >= 36 ? 2 : 0;
  thwaites += (data.fever || data.headache) ? -1 : 0;
  if (typeof data.csfBloodRatio === 'number' && data.csfBloodRatio < 0.5) thwaites -= 3;
  
  let marais = 0;
  if (data.fever || data.eveningRise) marais += 2;
  if (data.weightLoss) marais += 1;
  if (data.cough) marais += 1;
  if (data.meningealSigns) marais += 2;
  if (data.cranialNervePalsies) marais += 1;
  if (data.cbnaat === 'Positive') marais += 4;
  if (data.meningealEnhancement) marais += 2;
  if (data.tuberculomas) marais += 2;

  let hepaticRisk: PredictionResult['hepaticRisk'] = 'Normal';
  const astNum = typeof data.ast === 'number' ? data.ast : 0;
  const altNum = typeof data.alt === 'number' ? data.alt : 0;
  const biliNum = typeof data.bilirubin === 'number' ? data.bilirubin : 0;

  if (astNum > 120 || altNum > 120 || biliNum > 2.0) {
    hepaticRisk = 'High Risk (DILI Warning)';
    riskFactors.push('Significantly elevated transaminases/bilirubin baseline');
    recommendations.push('⚠️ CAUTION: Modified Anti-TB regimen required due to baseline liver impairment.');
  } else if (astNum > 40 || altNum > 40 || biliNum > 1.2) {
    hepaticRisk = 'Elevated Baseline';
    recommendations.push('Monitor Liver Function Tests (LFTs) bi-weekly upon initiating ATT.');
  }

  let predictedGOS = 5;
  if (data.motorDeficits || data.behaviouralChanges) predictedGOS = 3;
  if (data.cranialNervePalsies && data.featuresOfArachnoiditis) predictedGOS = 2;
  if (tbmProbability > 80 && (data.behaviouralChanges || data.seizures)) predictedGOS = Math.min(predictedGOS, 3);
  if (data.gosDischarge) {
    predictedGOS = data.gosDischarge;
  }

  const gosLabels: Record<number, string> = {
    1: 'GOS 1: Death',
    2: 'GOS 2: Persistent Vegetative State',
    3: 'GOS 3: Severe Disability',
    4: 'GOS 4: Moderate Disability',
    5: 'GOS 5: Good Recovery'
  };

  if (tbmProbability >= 50 || data.cbnaat === 'Positive') {
    recommendations.push('Initiate 4-drug Anti-Tubercular Therapy (ATT: RHEZ) immediately without delay.');
    recommendations.push('Administer adjunctive Corticosteroid therapy to reduce meningeal inflammation.');
  } else if (tbmProbability >= 30) {
    recommendations.push('Consider empirical ATT initiation while awaiting secondary lab culture / MRI results.');
  } else {
    recommendations.push('Evaluate for alternative central nervous system etiologies.');
  }

  const confidenceScore = Math.min(Math.round(75 + (riskFactors.length * 2.5)), 98);
  const mortalityPredictionBinary: 0 | 1 = tbmProbability >= 50 ? 1 : 0;
  const mortalityPredictionLabel: 'YES (1)' | 'NO (0)' = mortalityPredictionBinary === 1 ? 'YES (1)' : 'NO (0)';

  // Definite chances with CBNAAT positivity in percentage
  const definiteChancesWithCBNAAT = data.cbnaat === 'Positive'
    ? Math.min(Math.round(Math.max(tbmProbability, 97.5) * 10) / 10, 99.5)
    : Math.min(Math.round(Math.max(tbmProbability + 15, 95.0) * 10) / 10, 98.5);

  // Mortality Risk Percentage calculation based on clinical severity staging
  let mortBase = 12.0;
  if (typeof data.gcs === 'number') {
    if (data.gcs <= 8) mortBase += 36.0; // BMRC Stage III
    else if (data.gcs <= 11) mortBase += 22.0; // BMRC Stage II
    else if (data.gcs <= 13) mortBase += 10.0;
  }
  if (data.alteredSensorium) mortBase += 12.0;
  if (data.focalNeurologicalDeficit) mortBase += 10.0;
  if (data.infarcts) mortBase += 12.0;
  if (data.hydrocephalus) mortBase += 8.0;
  if (data.raisedICP) mortBase += 8.0;
  if (typeof data.age === 'number' && data.age > 50) mortBase += 8.0;
  const mortalityRiskPercentage = Math.min(Math.max(Math.round(mortBase * 10) / 10, 5.0), 88.0);

  return {
    hasNeurologicalDisorder,
    neurologicalDisorderProbability,
    neurologicalDisorderSummary,
    tbmProbability,
    definiteChancesWithCBNAAT,
    mortalityRiskPercentage,
    mortalityPredictionBinary,
    mortalityPredictionLabel,
    riskCategory,
    confidenceScore,
    thwaitesScore: thwaites,
    maraisScore: marais,
    predictedGOSLabel: gosLabels[predictedGOS] || 'GOS 5: Good Recovery',
    hepaticRisk,
    keyRiskFactors: riskFactors,
    clinicalRecommendations: recommendations
  };
}

export async function calculateTBMPredictionAsync(
  data: PatientData
): Promise<{ result: BackendPredictionResponse; isLiveBackend: boolean }> {
  const backendResult = await fetchBackendPrediction(data);
  if (backendResult) {
    return { result: backendResult, isLiveBackend: true };
  }
  return { result: calculateTBMPrediction(data), isLiveBackend: false };
}
