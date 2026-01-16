# 1. Project Overview
CTG Insight is a full-stack web application designed for the automated analysis of Cardiotocography (CTG) data to predict fetal health states (Normal, Suspect, Pathologic). It integrates a robust Node.js backend with a Python Machine Learning Engine (Scikit-Learn MLP Neural Network) and displays results on a modern React Frontend.

# Key Features
- AI-Powered Diagnostics: Uses a Multi-Layer Perceptron (MLP) Neural Network trained on clinical CTG data.
- Universal File Compatibility: Accepts ANY Excel file with standard CTG features (LB, AC, FM, etc.), regardless of whether it contains ground-truth labels.
- Batch Prediction Engine: Instantly processes hundreds of patient records in bulk, generating Risk Scores and Classifications for each.
- Interactive Dashboard: Real-time risk visualization, patient filtering, and status monitoring.
- Seamless Integration: Python ML inference is tightly coupled with the Node.js API via standard streams, ensuring low latency and high reliability.

# 2. Technical Architecture
A. Frontend (client)
- Framework: React 18 (Vite)
- Styling: Plain CSS + Tailwind Utilities (for layout)
- Communication: Axios (HTTP) & Socket.io-client (Real-time updates)
- Key Components:
  * UploadData.jsx : Handles file drag-and-drop and progress feedback.
  * PatientsPage.jsx : Displays patient lists and visualizes AI Risk Scores using RiskGauge.

B. Backend (server)
- Runtime: Node.js (Express)
- Language: JavaScript
- Key Modules:
  * upload.js: The "Orchestrator". Receives files -> Cleans Data -> Spawns Python Process -> Merges AI Results -> Saves to memory.
  * predict.py (Python): The "Brain". Loads the trained model -> Normalizes Input -> Runs Inference -> Returns JSON.

C. Machine Learning Engine
- Model: Scikit-Learn MLPClassifier (Neural Network).
- Input: 21 CTG features (LB, AC, FM, UC, ASTV, etc.).
- Output: Class Probabilities (Normal/Suspect/Pathologic) + Risk Score.
- Training: One-time offline training (npm run train) saves artifacts (.pkl files) for production use.
- Generalization: The model is completely independent of the training file (CTG.xls). It can predict on any new data.

# 3. How to Run the Project (Step-by-Step)
Prerequisites
- Node.js (v14+)
- Python (v3.8+)
- Pip dependencies: scikit-learn, pandas, numpy, joblib, openpyxl.

Step 1: Install Dependencies
Open two terminal tabs.
- Backend: cd backend -> npm install -> pip install scikit-learn pandas numpy joblib openpyxl xlrd
- Frontend: cd frontend -> npm install

Step 2: Train the Model (One-Time Setup)
Before running the server for the first time, you must generate the model artifacts: cd backend -> npm run train

Success criteria: You should see Training complete settings saved. and .pkl files appear in backend/ml_engine/.

Step 3: Start the Application
You need to run both the backend and frontend simultaneously.

Terminal 1 (Backend): cd backend -> npm run dev
Output: CTG Insight API running on http://localhost:5001

Terminal 2 (Frontend): cd frontend -> npm run dev
Output: Local: http://localhost:5173/

Step 4: Use the Application
1. Open Chrome/Safari and go to http://localhost:5173.
2. Login (Click "Login" - any default credentials work in dev mode, or just click "Login" if pre-filled).
3. Navigate to Dashboard: You will see an EMPTY dashboard (0 patients). This is correct.
4. Upload Data: Click the "Upload" text/icon on the top or sidebar.
5. Select your Excel file (e.g., test_data_no_answers.xlsx or any valid CTG file).
Note: The file MUST have a header row with standard CTG columns (LB, AC, FM, etc.).
6. View Results: The dashboard will populate with patients.
Normal patients (Green) vs Suspect/Pathologic (Orange/Red) are determined by the AI Model.
Click on a patient to see their detailed Risk Score and Probability Breakdown on the right panel.

# 5. Citations
The CTG data has been obtained from the following link:
https://archive.ics.uci.edu/dataset/193/cardiotocography
