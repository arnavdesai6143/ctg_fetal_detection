import os
import sys
import pandas as pd
import numpy as np
from sklearn.neural_network import MLPClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, accuracy_score
import shap
import joblib

# Constants
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, 'input', 'CTG.xls')
MODEL_PATH = os.path.join(BASE_DIR, 'model_mlp.pkl')
SCALER_PATH = os.path.join(BASE_DIR, 'scaler.pkl')
FEATURE_NAMES_PATH = os.path.join(BASE_DIR, 'feature_names.pkl')
BACKGROUND_DATA_PATH = os.path.join(BASE_DIR, 'background_data.pkl')
TEST_DATA_PATH = os.path.join(BASE_DIR, 'input', 'test_data_for_upload.xlsx')

def load_data():
    """Lengths and parses the UCI CTG dataset."""
    if not os.path.exists(DATA_PATH):
        print(f"Error: Dataset not found at {DATA_PATH}")
        sys.exit(1)

    try:
        # Try finding 'Data' or first sheet
        df = pd.read_excel(DATA_PATH, sheet_name='Data', header=1)
    except Exception as e:
        print(f"Error reading Excel: {e}")
        sys.exit(1)

    features = ['LB', 'AC', 'FM', 'UC', 'DL', 'DS', 'DP', 'ASTV', 'MSTV', 'ALTV', 'MLTV', 'Width', 'Min', 'Max', 'Nmax', 'Nzeros', 'Mode', 'Mean', 'Median', 'Variance', 'Tendency']
    target = 'NSP' 

    df = df.dropna(subset=[target])
    X = df[features].astype(float)
    y = df[target].astype(int) 
    
    return X, y, features

def train():
    print("Scikit-Learn (MLP): Loading data...")
    X, y, feature_names = load_data()
    
    # Split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)
    
    # Save Test Data for Dashboard (With Answers)
    print(f"Generating '{TEST_DATA_PATH}'...")
    test_df = X_test.copy()
    test_df['NSP'] = y_test
    test_df.to_excel(TEST_DATA_PATH, index=False)
    
    # Save Blind Test Data (No Answers - For strict testing)
    BLIND_DATA_PATH = os.path.join(BASE_DIR, 'input', 'test_data_no_answers.xlsx')
    print(f"Generating '{BLIND_DATA_PATH}'...")
    test_df_blind = test_df.drop(columns=['NSP'])
    test_df_blind.to_excel(BLIND_DATA_PATH, index=False)
    
    # Scale
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Init Model: Multi-Layer Perceptron (Neural Network)
    # Hidden layers: (64, 32) matching our previous architecture
    print("Training Neural Network (MLPClassifier)...")
    model = MLPClassifier(hidden_layer_sizes=(64, 32), 
                          activation='relu', 
                          solver='adam', 
                          alpha=0.0001, 
                          batch_size='auto',
                          learning_rate_init=0.001, 
                          max_iter=500, 
                          random_state=42)
    
    model.fit(X_train_scaled, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test_scaled)
    acc = accuracy_score(y_test, y_pred)
    print(f"Test Accuracy: {acc*100:.2f}%")
        
    # Save Model
    print("Saving artifacts...")
    joblib.dump(model, MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)
    joblib.dump(feature_names, FEATURE_NAMES_PATH)
    joblib.dump(list(model.classes_), os.path.join(BASE_DIR, 'classes.pkl'))
    
    # SHAP Background (Summary using K-means on numpy array)
    # MLPClassifier works well with KernelExplainer
    # Use simple background (first 100 samples)
    background_summary = X_train_scaled[:100]
    joblib.dump(background_summary, BACKGROUND_DATA_PATH)
    
    print("Training complete.")

if __name__ == '__main__':
    train()
