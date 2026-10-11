export interface PatientData {
  patientId: string;
  patientName: string;
  age: number | '';
  sex: 'Male' | 'Female';
  feverDurationMonths: number | '';
  headacheDurationMonths: number | '';
  alteredSensorium: boolean;
  focalNeurologicalDeficit: boolean;
  gcs: number;
  raisedICP: boolean;
  sodium: number | '';
  csfCount: number | '';
  protein: number | '';
  glucose: number | '';
  hydrocephalus: boolean;
  basalExudates: boolean;
  infarcts: boolean;

  // Additional clinical parameters for comprehensive calculation
  comorbidIllness: string[];
  fever: boolean;
  eveningRise: boolean;
  nightSweats: boolean;
  chills: boolean;
  headache: boolean;
  headacheSite: string;
  headachePersistent: boolean;
  headacheProgressive: boolean;
  vomiting: boolean;
  behaviouralChanges: boolean;
  seizures: boolean;
  seizureType: string;
  neckPain: boolean;
  earDischarge: boolean;
  weightLoss: boolean;
  lossOfAppetite: boolean;
  cough: boolean;
  lymphNodeSwelling: boolean;
  jaundice: boolean;
  rash: boolean;
  jointPain: boolean;
  priorConcurrentTB: boolean;
  contactWithTBPatient: boolean;
  pastAntiTBTreatment: boolean;
  pulse: number | '';
  bp: string;
  temp: number | '';
  rr: number | '';
  spO2: number | '';
  meningealSigns: boolean;
  cranialNervePalsies: boolean;
  motorDeficits: boolean;
  cerebellarSigns: boolean;
  featuresOfMyelitis: boolean;
  featuresOfArachnoiditis: boolean;
  systemicTBEvidence: boolean;
  hb: number | '';
  tlc: number | '';
  lymphocytes: number | '';
  neutrophils: number | '';
  bloodSugar: number | '';
  urea: number | '';
  creatinine: number | '';
  bilirubin: number | '';
  ast: number | '';
  alt: number | '';
  k: number | '';
  neutrophilsPct: number | '';
  lymphocytesPct: number | '';
  csfBloodRatio: number | '';
  cbnaat: 'Positive' | 'Negative' | 'Pending';
  meningealEnhancement: boolean;
  tuberculomas: boolean;
  gosDischarge: number;
}

export interface PredictionResult {
  hasNeurologicalDisorder: 'YES' | 'NO';
  neurologicalDisorderProbability: number;
  neurologicalDisorderSummary: string;
  tbmProbability: number;
  definiteChancesWithCBNAAT?: number;
  mortalityRiskPercentage?: number;
  mortalityPredictionBinary: 0 | 1;
  mortalityPredictionLabel: 'YES (1)' | 'NO (0)';
  riskCategory: 'Low Risk' | 'Moderate Risk' | 'High Risk' | 'Very High Risk';
  confidenceScore: number;
  thwaitesScore: number;
  maraisScore: number;
  predictedGOSLabel: string;
  hepaticRisk: 'Normal' | 'Elevated Baseline' | 'High Risk (DILI Warning)';
  keyRiskFactors: string[];
  clinicalRecommendations: string[];
}

export interface SavedPatientRecord {
  id: string;
  createdAt: string;
  patientData: PatientData;
  prediction: PredictionResult;
}
