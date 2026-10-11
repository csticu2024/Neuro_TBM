import pandas as pd
import numpy as np
from typing import Dict, Any, Union

# Full list of 61 feature parameters from the clinical dataset specification
FEATURE_COLUMNS_61 = [
    "Age (years)",
    "Sex",
    "Comorbid Illness (DM/HTN/HIV/Other)",
    "Fever (Y/N)",
    "Evening rise (Y/N)",
    "Night sweats (Y/N)",
    "Chills (Y/N)",
    "Headache (Y/N)",
    "Site",
    "Persistent (Y/N)",
    "Progressive (Y/N)",
    "Vomiting (Y/N)",
    "Behavioural changes (Y/N)",
    "Seizures (Y/N)",
    "Neck pain (Y/N)",
    "Ear discharge (Y/N)",
    "Weight loss (Y/N)",
    "Loss of appetite (Y/N)",
    "Cough (Y/N)",
    "Lymph node swelling (Y/N)",
    "Jaundice (Y/N)",
    "Rash (Y/N)",
    "Joint pain (Y/N)",
    "Prior/concurrent TB (Y/N)",
    "Contact with TB patient (Y/N)",
    "Past anti-TB treatment (Y/N)",
    "Pulse (/min)",
    "BP (mmHg)",
    "Temp (°F)",
    "RR (/min)",
    "SpO2 (%)",
    "Meningeal signs",
    "Cranial nerve palsies",
    "Motor deficits",
    "Cerebellar signs",
    "Features of Myelitis",
    "Features of Arachnoiditis",
    "Systemic TB evidence",
    "Hb",
    "TLC",
    "Lymphocytes",
    "Neutrophils",
    "Blood sugar (mg/dl)",
    "Urea (mg/dL)",
    "Creatinine (mg/dL)",
    "Bilirubin (mg/dL)",
    "AST (U/L)",
    "ALT (U/L)",
    "K (mmol/L)",
    "Neutrophils (%)",
    "Lymphocytes (%)",
    "CSF:Blood ratio",
    "CBNAAT (1/0)",
    "Me0i0geal e0ha0ceme0t (1/0)",
    "Tuberculomas (1/0)",
    "GOS (at discharge)",
    "MBI (3 months)",
    "MBI (6 months)",
    "MRS (3 months)",
    "MRS (6 months)",
    "Sequelae (6 months) (0/1/1/Cognitive/Other)"
]

# The 13 Key Clinical Parameters expected by TBM_Model.pkl
MODEL_13_FEATURES = [
    "Duration of fever (Months)",
    "Duration of headache (Months)",
    "Altered sensorium (Y/N)",
    "Focal neurological deficit (Ophthalmoplegia/Hemiplegia/Other)",
    "Raised ICP",
    "GCS (E+V+M out of 15)",
    "Na (mEQ/L)",
    "CSF Count (cells/µL)",
    "Protein (mg/dL)",
    "Glucose (mg/dL)",
    "Hydrocephalus (Y/N)",
    "Basal exudates (Y/N)",
    "Infarcts (Y/N)"
]


def to_bool_int(val: Any) -> int:
    """
    Robustly converts boolean, string, or numeric values into 1 (True) or 0 (False).
    """
    if val is None:
        return 0
    if isinstance(val, bool):
        return 1 if val else 0
    if isinstance(val, (int, float)):
        return 1 if val > 0 else 0
    if isinstance(val, str):
        val_str = val.strip().lower()
        if val_str in ['y', 'yes', 'true', '1', 'positive', 'pos', 'present']:
            return 1
    return 0


def to_float(val: Any, default: float = 0.0) -> float:
    """
    Safely converts a value to float with fallback default.
    """
    if val is None or val == '':
        return float(default)
    try:
        return float(val)
    except (ValueError, TypeError):
        return float(default)


def extract_13_features_for_pkl(data: Union[Dict[str, Any], pd.DataFrame]) -> np.ndarray:
    """
    Extracts the 13 clinical parameters expected by the main TBM_Model.pkl:
    [
        0: Duration of fever (Months),
        1: Duration of headache (Months),
        2: Altered sensorium (Y/N) [0/1],
        3: Focal neurological deficit (Ophthalmoplegia/Hemiplegia/Other) [0/1],
        4: Raised ICP [0/1],
        5: GCS (E+V+M out of 15) [3-15],
        6: Na (mEQ/L) [e.g. 135],
        7: CSF Count (cells/µL) [e.g. 100],
        8: Protein (mg/dL) [e.g. 150],
        9: Glucose (mg/dL) [e.g. 45],
        10: Hydrocephalus (Y/N) [0/1],
        11: Basal exudates (Y/N) [0/1],
        12: Infarcts (Y/N) [0/1]
    ]
    """
    if isinstance(data, pd.DataFrame):
        data = data.iloc[0].to_dict()

    fever_dur = to_float(
        data.get("feverDurationMonths", data.get("Duration of fever (Months)", data.get("durationOfFever", 1.0))),
        1.0
    )
    headache_dur = to_float(
        data.get("headacheDurationMonths", data.get("Duration of headache (Months)", data.get("durationOfHeadache", 1.0))),
        1.0
    )

    altered_sensorium = to_bool_int(
        data.get("alteredSensorium", data.get("Altered sensorium (Y/N)", data.get("behaviouralChanges")))
    )

    focal_neurological = to_bool_int(
        data.get("focalNeurologicalDeficit",
                 data.get("Focal neurological deficit (Ophthalmoplegia/Hemiplegia/Other)",
                          data.get("cranialNervePalsies") or data.get("motorDeficits")))
    )

    raised_icp = to_bool_int(
        data.get("raisedICP", data.get("Raised ICP", data.get("vomiting")))
    )

    gcs = int(to_float(
        data.get("gcs", data.get("GCS (E+V+M out of 15)", data.get("gcsScore", 15))),
        15
    ))

    sodium = to_float(
        data.get("sodium", data.get("Na (mEQ/L)", data.get("na", 135.0))),
        135.0
    )
    csf_count = to_float(
        data.get("csfCount", data.get("CSF Count (cells/µL)", data.get("csfTlc", 100.0))),
        100.0
    )
    protein = to_float(
        data.get("protein", data.get("Protein (mg/dL)", data.get("csfProtein", 150.0))),
        150.0
    )
    glucose = to_float(
        data.get("glucose", data.get("Glucose (mg/dL)", data.get("csfGlucose", 45.0))),
        45.0
    )

    hydrocephalus = to_bool_int(
        data.get("hydrocephalus", data.get("Hydrocephalus (Y/N)", data.get("meningealEnhancement")))
    )
    basal_exudates = to_bool_int(
        data.get("basalExudates", data.get("Basal exudates (Y/N)", data.get("cranialNervePalsies")))
    )
    infarcts = to_bool_int(
        data.get("infarcts", data.get("Infarcts (Y/N)", data.get("tuberculomas")))
    )

    vector = [
        fever_dur,
        headache_dur,
        altered_sensorium,
        focal_neurological,
        raised_icp,
        gcs,
        sodium,
        csf_count,
        protein,
        glucose,
        hydrocephalus,
        basal_exudates,
        infarcts
    ]

    return np.array([vector], dtype=np.float64)


def extract_61_features(data: Union[Dict[str, Any], pd.DataFrame]) -> pd.DataFrame:
    """
    Transforms patient data into the full 61-feature DataFrame for comprehensive clinical scoring.
    """
    if isinstance(data, pd.DataFrame):
        data = data.iloc[0].to_dict()

    row = {}

    # Demographics
    row["Age (years)"] = to_float(data.get("age", data.get("Age (years)", 35.0)), 35.0)

    sex_val = data.get("sex", data.get("Sex", "Male"))
    if isinstance(sex_val, str):
        row["Sex"] = 1 if sex_val.strip().lower() in ["male", "m", "1"] else 0
    else:
        row["Sex"] = int(sex_val) if sex_val else 0

    comorb = data.get("comorbidIllness", data.get("Comorbid Illness (DM/HTN/HIV/Other)", []))
    row["Comorbid Illness (DM/HTN/HIV/Other)"] = ",".join(comorb) if isinstance(comorb, list) else str(comorb or "None")

    # Constitutional & Symptoms
    row["Fever (Y/N)"] = to_bool_int(data.get("fever", data.get("Fever (Y/N)")))
    row["Evening rise (Y/N)"] = to_bool_int(data.get("eveningRise", data.get("Evening rise (Y/N)")))
    row["Night sweats (Y/N)"] = to_bool_int(data.get("nightSweats", data.get("Night sweats (Y/N)")))
    row["Chills (Y/N)"] = to_bool_int(data.get("chills", data.get("Chills (Y/N)")))
    row["Headache (Y/N)"] = to_bool_int(data.get("headache", data.get("Headache (Y/N)")))

    row["Site"] = str(data.get("headacheSite", data.get("Site", "Diffuse")))
    row["Persistent (Y/N)"] = "Y" if to_bool_int(data.get("headachePersistent", data.get("Persistent (Y/N)"))) else "N"
    row["Progressive (Y/N)"] = "Y" if to_bool_int(data.get("headacheProgressive", data.get("Progressive (Y/N)"))) else "N"
    row["Vomiting (Y/N)"] = "Y" if to_bool_int(data.get("vomiting", data.get("Vomiting (Y/N)"))) else "N"

    row["Behavioural changes (Y/N)"] = "Y" if to_bool_int(data.get("behaviouralChanges", data.get("Behavioural changes (Y/N)"))) else "N"
    row["Seizures (Y/N)"] = "Y" if to_bool_int(data.get("seizures", data.get("Seizures (Y/N)"))) else "N"
    row["Neck pain (Y/N)"] = "Y" if to_bool_int(data.get("neckPain", data.get("Neck pain (Y/N)"))) else "N"
    row["Ear discharge (Y/N)"] = "Y" if to_bool_int(data.get("earDischarge", data.get("Ear discharge (Y/N)"))) else "N"
    row["Weight loss (Y/N)"] = "Y" if to_bool_int(data.get("weightLoss", data.get("Weight loss (Y/N)"))) else "N"
    row["Loss of appetite (Y/N)"] = "Y" if to_bool_int(data.get("lossOfAppetite", data.get("Loss of appetite (Y/N)"))) else "N"

    row["Cough (Y/N)"] = to_bool_int(data.get("cough", data.get("Cough (Y/N)")))
    row["Lymph node swelling (Y/N)"] = to_bool_int(data.get("lymphNodeSwelling", data.get("Lymph node swelling (Y/N)")))
    row["Jaundice (Y/N)"] = to_bool_int(data.get("jaundice", data.get("Jaundice (Y/N)")))
    row["Rash (Y/N)"] = to_bool_int(data.get("rash", data.get("Rash (Y/N)")))
    row["Joint pain (Y/N)"] = to_bool_int(data.get("jointPain", data.get("Joint pain (Y/N)")))

    # History
    row["Prior/concurrent TB (Y/N)"] = "Y" if to_bool_int(data.get("priorConcurrentTB", data.get("Prior/concurrent TB (Y/N)"))) else "N"
    row["Contact with TB patient (Y/N)"] = "Y" if to_bool_int(data.get("contactWithTBPatient", data.get("Contact with TB patient (Y/N)"))) else "N"
    row["Past anti-TB treatment (Y/N)"] = to_bool_int(data.get("pastAntiTBTreatment", data.get("Past anti-TB treatment (Y/N)")))

    # Vitals
    row["Pulse (/min)"] = int(to_float(data.get("pulse", data.get("Pulse (/min)", 84)), 84))
    row["BP (mmHg)"] = str(data.get("bp", data.get("BP (mmHg)", "120/80")))
    row["Temp (°F)"] = to_float(data.get("temp", data.get("Temp (°F)", 99.4)), 99.4)
    row["RR (/min)"] = int(to_float(data.get("rr", data.get("RR (/min)", 18)), 18))
    row["SpO2 (%)"] = int(to_float(data.get("spO2", data.get("SpO2 (%)", 98)), 98))

    # Neurological Exam
    row["Meningeal signs"] = to_bool_int(data.get("meningealSigns", data.get("Meningeal signs")))
    row["Cranial nerve palsies"] = to_bool_int(data.get("cranialNervePalsies", data.get("Cranial nerve palsies")))
    row["Motor deficits"] = "Y" if to_bool_int(data.get("motorDeficits", data.get("Motor deficits"))) else "N"
    row["Cerebellar signs"] = to_bool_int(data.get("cerebellarSigns", data.get("Cerebellar signs")))
    row["Features of Myelitis"] = to_bool_int(data.get("featuresOfMyelitis", data.get("Features of Myelitis")))
    row["Features of Arachnoiditis"] = to_bool_int(data.get("featuresOfArachnoiditis", data.get("Features of Arachnoiditis")))
    row["Systemic TB evidence"] = to_bool_int(data.get("systemicTBEvidence", data.get("Systemic TB evidence")))

    # Labs
    row["Hb"] = to_float(data.get("hb", data.get("Hb", 12.5)), 12.5)
    row["TLC"] = int(to_float(data.get("tlc", data.get("TLC", 9200)), 9200))
    row["Lymphocytes"] = int(to_float(data.get("lymphocytes", data.get("Lymphocytes", 40)), 40))
    row["Neutrophils"] = int(to_float(data.get("neutrophils", data.get("Neutrophils", 55)), 55))
    row["Blood sugar (mg/dl)"] = to_float(data.get("bloodSugar", data.get("Blood sugar (mg/dl)", 110.0)), 110.0)
    row["Urea (mg/dL)"] = to_float(data.get("urea", data.get("Urea (mg/dL)", 28.0)), 28.0)
    row["Creatinine (mg/dL)"] = to_float(data.get("creatinine", data.get("Creatinine (mg/dL)", 0.9)), 0.9)
    row["Bilirubin (mg/dL)"] = to_float(data.get("bilirubin", data.get("Bilirubin (mg/dL)", 0.8)), 0.8)
    row["AST (U/L)"] = int(to_float(data.get("ast", data.get("AST (U/L)", 32)), 32))
    row["ALT (U/L)"] = int(to_float(data.get("alt", data.get("ALT (U/L)", 30)), 30))
    row["K (mmol/L)"] = to_float(data.get("k", data.get("K (mmol/L)", 4.2)), 4.2)
    row["Neutrophils (%)"] = int(to_float(data.get("neutrophilsPct", data.get("Neutrophils (%)", 35)), 35))
    row["Lymphocytes (%)"] = int(to_float(data.get("lymphocytesPct", data.get("Lymphocytes (%)", 65)), 65))
    row["CSF:Blood ratio"] = str(data.get("csfBloodRatio", data.get("CSF:Blood ratio", "0.35")))

    # Imaging & Outcome
    cbnaat_raw = data.get("cbnaat", data.get("CBNAAT (1/0)", "Negative"))
    row["CBNAAT (1/0)"] = 1 if (isinstance(cbnaat_raw, str) and cbnaat_raw.lower() in ["positive", "1"]) or cbnaat_raw == 1 else 0
    row["Me0i0geal e0ha0ceme0t (1/0)"] = to_bool_int(
        data.get("meningealEnhancement", data.get("Me0i0geal e0ha0ceme0t (1/0)", data.get("Meningeal enhancement (1/0)")))
    )
    row["Tuberculomas (1/0)"] = to_bool_int(data.get("tuberculomas", data.get("Tuberculomas (1/0)")))
    row["GOS (at discharge)"] = int(to_float(data.get("gosDischarge", data.get("GOS (at discharge)", 5)), 5))

    row["MBI (3 months)"] = to_float(data.get("mbi3Months", data.get("MBI (3 months)", 100.0)), 100.0)
    row["MBI (6 months)"] = to_float(data.get("mbi6Months", data.get("MBI (6 months)", 100.0)), 100.0)
    row["MRS (3 months)"] = to_float(data.get("mrs3Months", data.get("MRS (3 months)", 0.0)), 0.0)
    row["MRS (6 months)"] = to_float(data.get("mrs6Months", data.get("MRS (6 months)", 0.0)), 0.0)
    row["Sequelae (6 months) (0/1/1/Cognitive/Other)"] = str(data.get("sequelae6Months", data.get("Sequelae (6 months) (0/1/1/Cognitive/Other)", "None")))

    return pd.DataFrame([row], columns=FEATURE_COLUMNS_61)
