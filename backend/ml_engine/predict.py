import sys
import json
import numpy as np
import pandas as pd
import joblib
import shap
import warnings
import os

warnings.filterwarnings("ignore")

# Define paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, 'model_mlp.pkl')
SCALER_PATH = os.path.join(BASE_DIR, 'scaler.pkl')
BACKGROUND_DATA_PATH = os.path.join(BASE_DIR, 'background_data.pkl')
FEATURE_NAMES_PATH = os.path.join(BASE_DIR, 'feature_names.pkl')
CLASSES_PATH = os.path.join(BASE_DIR, 'classes.pkl')

def predict(data_json):
    try:
        # Load artifacts
        model = joblib.load(MODEL_PATH)
        scaler = joblib.load(SCALER_PATH)
        feature_names = joblib.load(FEATURE_NAMES_PATH)
        
        # Parse Input
        input_data = json.loads(data_json)
        
        # Determine if Single or Batch
        is_batch = isinstance(input_data, list)
        
        # Normalize to DataFrame
        if is_batch:
            # Batch mode: input_data is list of dicts
            df_input = pd.DataFrame(input_data)
            # Ensure all feature columns exist, fill missing with 0
            for col in feature_names:
                if col not in df_input.columns:
                    df_input[col] = 0.0
            df_input = df_input[feature_names]
        else:
            # Single mode
            df_input = pd.DataFrame(columns=feature_names)
            df_input.loc[0] = 0 
            for k, v in input_data.items():
                if k in feature_names:
                    df_input.loc[0, k] = float(v)
            df_input = df_input[feature_names]

        # Scale
        X_scaled = scaler.transform(df_input) # numpy array
        
        # Predict Probabilities
        probs_all = model.predict_proba(X_scaled) # shape (N, n_classes)
        model_classes = model.classes_ # e.g. [1, 2, 3]
        
        results = []
        
        # Helper to find index of a specific class label
        def get_prob_for_label(probs_row, label):
            # find index where model_classes == label
            matches = np.where(model_classes == label)[0]
            if len(matches) > 0:
                return probs_row[matches[0]]
            return 0.0

        # Process each prediction
        for i in range(len(probs_all)):
            probs = probs_all[i]
            
            # Get class with max probability
            class_idx_in_probs = np.argmax(probs)
            predicted_label = model_classes[class_idx_in_probs]
            
            # Map Label to Text
            # 1=Normal, 2=Suspect, 3=Pathologic
            map_label = {1: 'Normal', 2: 'Suspect', 3: 'Pathologic'}
            classification = map_label.get(predicted_label, 'Unknown')
            
            # Calculate Risk Score
            # Use specific probabilities if available
            p_suspect = get_prob_for_label(probs, 2)
            p_pathologic = get_prob_for_label(probs, 3)
            
            risk_score = (p_suspect * 0.5) + (p_pathologic * 1.0)
            
            # SHAP
            # DISABLE for Batch to prevent crashes and timeouts
            shap_output = []
            if not is_batch:
                try:
                    # Only run SHAP for single prediction
                    background = joblib.load(BACKGROUND_DATA_PATH)
                    explainer = shap.KernelExplainer(model.predict_proba, background)
                    with warnings.catch_warnings():
                        warnings.simplefilter("ignore")
                        shap_calc = explainer.shap_values(X_scaled, nsamples=50)
                    
                    # shap_calc might be list (multiclass) or array (binary)
                    # For MLPClassifier it is usually a list of arrays
                    current_shap_vals = None
                    if isinstance(shap_calc, list):
                        # Use the values for the predicted class
                        current_shap_vals = shap_calc[class_idx_in_probs][0]
                    else:
                        # Binary case?
                        current_shap_vals = shap_calc[0] # Fallback
                        
                    if current_shap_vals is not None:
                        for idx, name in enumerate(feature_names):
                            shap_output.append({
                                'feature': name,
                                'value': float(df_input.iloc[0, idx]),
                                'shap_importance': float(current_shap_vals[idx])
                            })
                        shap_output.sort(key=lambda x: abs(x['shap_importance']), reverse=True)
                except Exception as shap_err:
                     # Non-fatal SHAP error
                     sys.stderr.write(f"SHAP Error: {shap_err}\n")

            results.append({
                'classification': classification,
                'riskScore': float(risk_score),
                'probabilities': {
                    'Normal': float(get_prob_for_label(probs, 1)),
                    'Suspect': float(get_prob_for_label(probs, 2)),
                    'Pathologic': float(get_prob_for_label(probs, 3))
                },
                'shapValues': shap_output,
                'modelVersion': 'MLP Neural Network (Scikit-Learn)'
            })
            
        if is_batch:
            print(json.dumps(results))
        else:
            print(json.dumps(results[0]))
        
    except Exception as e:
        sys.stderr.write(str(e))
        print(json.dumps({'error': str(e)}))

if __name__ == '__main__':
    if len(sys.argv) > 1:
        predict(sys.argv[1])
    else:
        # Read from stdin
        input_data = sys.stdin.read()
        if input_data:
            predict(input_data)
        else:
            print(json.dumps({'error': 'No input data provided'}))
