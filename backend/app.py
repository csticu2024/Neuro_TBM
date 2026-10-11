import os
import pickle
import pandas as pd
import numpy as np
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from tbm_full_dataset_preprocessor import (
    FEATURE_COLUMNS_61,
    MODEL_13_FEATURES,
    extract_61_features,
    extract_13_features_for_pkl,
    to_bool_int,
    to_float
)

BASE_DIR = os.path.dirname(__file__)
STATIC_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "dist"))

app = Flask(__name__, static_folder=STATIC_DIR if os.path.exists(STATIC_DIR) else None, static_url_path="")
CORS(app)  # Enable Cross-Origin Resource Sharing for React frontend

# Load Main Single Machine Learning Model
BASE_DIR = os.path.dirname(__file__)
MODEL_PATH = os.path.join(BASE_DIR, "TBM_Model.pkl")

tbm_model = None

if os.path.exists(MODEL_PATH):
    try:
        with open(MODEL_PATH, "rb") as f:
            tbm_model = pickle.load(f)
        print(f"✅ Loaded Main TBM Model from {MODEL_PATH}")
    except Exception as e:
        print(f"⚠️ Error loading TBM Model: {e}")

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint with backend metadata."""
    return jsonify({
        "status": "online",
        "service": "TBM Prediction Backend API",
        "modelLoaded": tbm_model is not None,
        "modelFile": "TBM_Model.pkl",
        "modelType": "RandomForestClassifier",
        "modelFeatureCount": len(MODEL_13_FEATURES),
        "modelFeatures": MODEL_13_FEATURES,
        "totalParametersCount": len(FEATURE_COLUMNS_61)
    })

@app.route('/api/parameters', methods=['GET'])
def get_parameters():
    """Returns backend parameter definitions."""
    params_list = []
    for idx, col in enumerate(MODEL_13_FEATURES):
        params_list.append({
            "index": idx,
            "columnName": col,
            "dataType": "float64 / int64"
        })
    return jsonify({
        "totalParameters": len(params_list),
        "parameters": params_list
    })

@app.route('/api/predict', methods=['POST'])
def predict_tbm():
    """
    Main prediction endpoint.
    Uses TBM_Model.pkl with the 13 clinical parameters.
    """
    try:
        data = request.get_json(force=True) or {}
    except Exception:
        return jsonify({"error": "Invalid JSON body provided."}), 400

    # 1. Transform into 61 feature DataFrame for detailed clinical analysis
    df_61 = extract_61_features(data)

    # 2. Extract 13 parameters for TBM_Model.pkl inference
    vec_13 = extract_13_features_for_pkl(data)

    # 3. Main TBM Model Inference
    ml_tbm_pred = 0
    ml_tbm_prob = None

    if tbm_model is not None:
        try:
            preds = tbm_model.predict(vec_13)[0]
            ml_tbm_pred = int(preds)
            probs = tbm_model.predict_proba(vec_13)[0]
            # Probability of positive class (TBM / Severity mortality risk)
            ml_tbm_prob = float(probs[1]) * 100.0
        except Exception as e:
            print(f"Error evaluating TBM Model: {e}")

    # 4. Neurological Manifestation Evaluation
    neuro_reasons = []
    if data.get("meningealSigns"):
        neuro_reasons.append("Positive Meningeal Signs (Neck Stiffness/Kernig)")
    if data.get("cranialNervePalsies"):
        neuro_reasons.append("Cranial Nerve Palsy Present")
    if data.get("motorDeficits") or data.get("focalNeurologicalDeficit"):
        neuro_reasons.append("Focal Motor Deficit / Hemiplegia")
    if data.get("seizures"):
        neuro_reasons.append("Active Seizure Activity / Convulsions")
    if data.get("behaviouralChanges") or data.get("alteredSensorium"):
        neuro_reasons.append("Altered Sensorium / Behavioural Changes")
    if data.get("featuresOfMyelitis") or data.get("featuresOfArachnoiditis"):
        neuro_reasons.append("Spinal Cord Involvement (Myelitis / Arachnoiditis)")
    if data.get("meningealEnhancement") or data.get("tuberculomas") or data.get("basalExudates") or data.get("hydrocephalus"):
        neuro_reasons.append("Intracranial Structural Lesion / Basal Enhancement on Neuroimaging")

    if len(neuro_reasons) > 0:
        neuro_present = True
        neuro_prob = min(75.0 + (len(neuro_reasons) * 7.5), 99.0)
    else:
        neuro_present = False
        neuro_prob = 5.0

    has_neurological_disorder = "YES" if neuro_present else "NO"
    neuro_probability = min(round(neuro_prob, 1), 99.9)

    if has_neurological_disorder == "YES":
        neuro_summary = f"Patient presents positive clinical indicators for Neurological Involvement ({', '.join(neuro_reasons)})."
    else:
        neuro_summary = "No overt focal neurological deficits, meningeal irritation, or CNS structural abnormalities detected."

    score = 0
    risk_factors = []
    recommendations = []

    age = float(df_61.iloc[0]["Age (years)"])
    if age < 36:
        score += 8
        risk_factors.append("Younger age group (<36 yrs)")
    else:
        score += 4

    contact_tb = str(data.get("contactWithTBPatient", data.get("Contact with TB patient (Y/N)", ""))).lower() in ["true", "y", "yes", "1"]
    if contact_tb:
        score += 15
        risk_factors.append("Known contact with active TB patient")

    prior_tb = str(data.get("priorConcurrentTB", data.get("Prior/concurrent TB (Y/N)", ""))).lower() in ["true", "y", "yes", "1"]
    past_tb = str(data.get("pastAntiTBTreatment", data.get("Past anti-TB treatment (Y/N)", ""))).lower() in ["true", "y", "yes", "1"]
    if prior_tb or past_tb:
        score += 12
        risk_factors.append("Prior or concurrent history of TB")

    comorbid = data.get("comorbidIllness", [])
    if isinstance(comorbid, list) and "HIV" in comorbid:
        score += 10
        risk_factors.append("Immunocompromised state (HIV positive)")

    # Constitutional symptoms
    const_count = 0
    fever = data.get("fever", True)
    if fever: const_count += 1
    if data.get("eveningRise"):
        const_count += 2
        risk_factors.append("Classic evening rise of temperature")
    if data.get("nightSweats"): const_count += 1
    if data.get("weightLoss"):
        const_count += 2
        risk_factors.append("Unexplained weight loss")
    if data.get("lossOfAppetite"): const_count += 1
    if data.get("cough"): const_count += 1

    score += min(const_count * 4, 20)

    # Neurological symptoms
    headache = data.get("headache", True)
    if headache:
        score += 6
        if data.get("headachePersistent") and data.get("headacheProgressive"):
            score += 6
            risk_factors.append("Persistent & progressive headache")

    if data.get("meningealSigns"):
        score += 12
        risk_factors.append("Positive meningeal irritation signs")

    if data.get("cranialNervePalsies"):
        score += 14
        risk_factors.append("Cranial nerve palsy present")

    if data.get("motorDeficits"):
        score += 10
        risk_factors.append("Focal motor deficit present")

    if data.get("seizures"):
        score += 8
        risk_factors.append("Seizure activity noted")

    if data.get("behaviouralChanges"):
        score += 10
        risk_factors.append("Altered sensorium / behavioural changes")

    if data.get("featuresOfArachnoiditis") or data.get("featuresOfMyelitis"):
        score += 12
        risk_factors.append("Spinal cord involvement (Arachnoiditis/Myelitis)")

    # Lab & CSF
    csf_blood_ratio = float(df_61.iloc[0]["CSF:Blood ratio"] if df_61.iloc[0]["CSF:Blood ratio"] != '' else 0.35)
    try:
        csf_blood_ratio = float(data.get("csfBloodRatio", csf_blood_ratio))
    except Exception:
        csf_blood_ratio = 0.35

    if csf_blood_ratio < 0.3:
        score += 25
        risk_factors.append("Severely decreased CSF:Blood ratio (<0.3)")
    elif csf_blood_ratio < 0.5:
        score += 16
        risk_factors.append("Low CSF:Blood ratio (<0.5)")

    lymph_pct = float(df_61.iloc[0]["Lymphocytes (%)"])
    if lymph_pct > 50:
        score += 12
        risk_factors.append("Lymphocytic predominance (>50%)")

    cbnaat_pos = int(df_61.iloc[0]["CBNAAT (1/0)"]) == 1
    if cbnaat_pos:
        score += 35
        risk_factors.append("CBNAAT / GeneXpert POSITIVE")

    # Neuroimaging
    if int(df_61.iloc[0]["Me0i0geal e0ha0ceme0t (1/0)"]) == 1:
        score += 18
        risk_factors.append("Basal meningeal enhancement")

    if int(df_61.iloc[0]["Tuberculomas (1/0)"]) == 1:
        score += 20
        risk_factors.append("Intracranial tuberculomas identified")

    if int(df_61.iloc[0]["Systemic TB evidence"]) == 1:
        score += 15
        risk_factors.append("Extrameningeal systemic TB evidence")

    max_score = 160.0
    clinical_prob = (score / max_score) * 100.0

    if ml_tbm_prob is not None:
        tbm_prob = (clinical_prob * 0.4) + (ml_tbm_prob * 0.6)
        risk_factors.append(f"AI Model Confidence / Risk: {ml_tbm_prob:.1f}%")
    else:
        tbm_prob = clinical_prob

    if cbnaat_pos:
        tbm_prob = max(tbm_prob, 92.0)

    final_tbm_probability = min(round(tbm_prob, 1), 99.5)

    if final_tbm_probability >= 75:
        risk_category = "Very High Risk"
    elif final_tbm_probability >= 50:
        risk_category = "High Risk"
    elif final_tbm_probability >= 30:
        risk_category = "Moderate Risk"
    else:
        risk_category = "Low Risk"

    thwaites = 0
    if age >= 36: thwaites += 2
    if fever or headache: thwaites -= 1
    if csf_blood_ratio < 0.5: thwaites -= 3

    marais = 0
    if fever or data.get("eveningRise"): marais += 2
    if data.get("weightLoss"): marais += 1
    if data.get("cough"): marais += 1
    if data.get("meningealSigns"): marais += 2
    if data.get("cranialNervePalsies"): marais += 1
    if cbnaat_pos: marais += 4
    if int(df_61.iloc[0]["Me0i0geal e0ha0ceme0t (1/0)"]) == 1: marais += 2
    if int(df_61.iloc[0]["Tuberculomas (1/0)"]) == 1: marais += 2

    ast_num = float(df_61.iloc[0]["AST (U/L)"])
    alt_num = float(df_61.iloc[0]["ALT (U/L)"])
    bili_num = float(df_61.iloc[0]["Bilirubin (mg/dL)"])

    if ast_num > 120 or alt_num > 120 or bili_num > 2.0:
        hepatic_risk = "High Risk (DILI Warning)"
        risk_factors.append("Elevated baseline LFT transaminases")
        recommendations.append("⚠️ CAUTION: Modified Anti-TB regimen required due to baseline liver impairment.")
    elif ast_num > 40 or alt_num > 40 or bili_num > 1.2:
        hepatic_risk = "Elevated Baseline"
        recommendations.append("Monitor Liver Function Tests (LFTs) bi-weekly upon initiating ATT.")
    else:
        hepatic_risk = "Normal"

    if final_tbm_probability >= 50 or cbnaat_pos:
        recommendations.append("Initiate 4-drug Anti-Tubercular Therapy (ATT: RHEZ) immediately without delay.")
        recommendations.append("Administer adjunctive Corticosteroid therapy to reduce meningeal inflammation.")
    elif final_tbm_probability >= 30:
        recommendations.append("Consider empirical ATT initiation while awaiting secondary lab culture / MRI results.")
    else:
        recommendations.append("Evaluate for alternative central nervous system etiologies.")

    gos_val = int(df_61.iloc[0]["GOS (at discharge)"])
    gos_labels = {
        1: "GOS 1: Death",
        2: "GOS 2: Persistent Vegetative State",
        3: "GOS 3: Severe Disability",
        4: "GOS 4: Moderate Disability",
        5: "GOS 5: Good Recovery"
    }

    confidence_score = min(round(82 + (len(risk_factors) * 1.8)), 99)

    mortality_binary = 1 if (ml_tbm_pred == 1 or final_tbm_probability >= 50.0) else 0
    mortality_label = "YES (1)" if mortality_binary == 1 else "NO (0)"

    definite_chances_cbnaat = min(round(max(final_tbm_probability, 97.5), 1), 99.5) if cbnaat_pos else min(round(max(final_tbm_probability + 15.0, 95.0), 1), 98.5)

    if ml_tbm_prob is not None:
        mortality_risk_pct = round(ml_tbm_prob, 1)
    else:
        mort_base = 12.0
        gcs = float(data.get("gcs", 12))
        if gcs <= 8: mort_base += 36.0
        elif gcs <= 11: mort_base += 22.0
        elif gcs <= 13: mort_base += 10.0
        if data.get("alteredSensorium"): mort_base += 12.0
        if data.get("focalNeurologicalDeficit"): mort_base += 10.0
        if data.get("infarcts"): mort_base += 12.0
        if data.get("hydrocephalus"): mort_base += 8.0
        if data.get("raisedICP"): mort_base += 8.0
        if float(data.get("age", 35)) > 50: mort_base += 8.0
        mortality_risk_pct = min(max(round(mort_base, 1), 5.0), 88.0)

    response_payload = {
        "hasNeurologicalDisorder": has_neurological_disorder,
        "neurologicalDisorderProbability": neuro_probability,
        "neurologicalDisorderSummary": neuro_summary,
        "tbmProbability": final_tbm_probability,
        "definiteChancesWithCBNAAT": definite_chances_cbnaat,
        "mortalityRiskPercentage": mortality_risk_pct,
        "mortalityPredictionBinary": mortality_binary,
        "mortalityPredictionLabel": mortality_label,
        "riskCategory": risk_category,
        "confidenceScore": confidence_score,
        "thwaitesScore": thwaites,
        "maraisScore": marais,
        "predictedGOSLabel": gos_labels.get(gos_val, "GOS 5: Good Recovery"),
        "hepaticRisk": hepatic_risk,
        "keyRiskFactors": risk_factors,
        "clinicalRecommendations": recommendations,
        "source": "Python Flask ML API"
    }

    return jsonify(response_payload)

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    """Serve frontend static files or fallback to index.html for SPA client-side routing."""
    if app.static_folder and os.path.exists(app.static_folder):
        file_path = os.path.join(app.static_folder, path)
        if path != "" and os.path.exists(file_path):
            return send_from_directory(app.static_folder, path)
        index_file = os.path.join(app.static_folder, 'index.html')
        if os.path.exists(index_file):
            return send_from_directory(app.static_folder, 'index.html')
    return jsonify({
        "message": "TBM Prediction Backend API is running.",
        "endpoints": ["/api/health", "/api/parameters", "/api/predict"]
    })

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5001))
    print(f"🚀 Starting TBM Prediction Backend Server on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=False)
