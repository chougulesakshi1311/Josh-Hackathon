<h1 align="center">Explainable Credit Scoring System</h1>

<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/XGBoost-1761B0?style=for-the-badge&logo=scikit-learn&logoColor=white" />
</p>

## 📖 Overview
Traditional AI models often act as "black boxes"—they approve or reject loans without explaining the reasoning. This lack of transparency leads to user frustration and regulatory concerns. 

This project solves that by providing an **Explainable Credit Scoring System**. It not only outputs a credit decision and score but also translates complex machine learning weights into simple, **human-readable explanations** (e.g., "Your income level raises concerns relative to the loan size"). Furthermore, the system includes a dedicated auditing dashboard to track **Bias Indicators** and ensure **Fairness** across different demographic and income groups.

## ✨ Core Features (Aligned with Problem Statement)

### 1. Transparent Applicant Evaluation
- **Financial Data Input:** A clean, modern UI for entering customer financial and demographic data.
- **Credit Approval/Rejection:** Evaluates the input against a custom-trained XGBoost model.
- **Human-Readable Explanations:** Uses SHAP (SHapley Additive exPlanations) to break down exactly *why* a decision was made in plain English phrases.
- **Actionable Counterfactuals:** If an applicant is rejected, the system provides a "Path to Approval" (e.g., "Reduce loan amount by $2,000").

### 2. Fairness & Bias Dashboard
- **Bias Indicators:** Automatically scans historical decisions to flag demographic anomalies.
- **Group Fairness Comparisons:** Measures the "Disparate Impact" and approval gaps between different income brackets and male/female applicants.
- **Transparent Decision Flow:** Provides global insights into what features the AI values most across the entire population.

### 3. Application Lifecycle Management (MongoDB)
- **User Authentication:** Architecture ready to track loan officer sessions.
- **Audit Trails:** All predictions and explanations are securely stored in MongoDB, creating an immutable audit trail of the model's behavior over time.
- **Application History:** A dedicated Reports dashboard to review past AI decisions.

## 🏗️ Tech Stack

**Frontend:**
- **React.js & Vite:** Extremely fast, modern component-based UI.
- **Tailwind CSS:** Responsive, utility-first styling for the dashboards.
- **React Router:** Dedicated views for Dashboard, New Evaluations, Reporting, Bias Fairness, and Auth.

**Backend:**
- **Python (FastAPI):** High-performance backend API processing evaluation requests.
- **XGBoost & SHAP:** Core ML classifier and mathematical explainability engine.
- **MongoDB (PyMongo):** NoSQL document store to track users, application histories, and fairness audits (with in-memory fallbacks).
- **Pandas / Scikit-learn:** Data processing and label encoding.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python (3.10+)
- MongoDB (Running locally on port 27017, or accessible via `MONGODB_URI`)

### 1. Backend Setup & Model Training
```bash
cd backend

# Create and activate virtual environment
python -m venv venv
.\venv\Scripts\activate   # Windows
# source venv/bin/activate # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Setup Environment Variables
# Create a .env file containing:
# MONGODB_URI=mongodb://localhost:27017
# DB_NAME=credit_scoring

# Start the server
uvicorn main:app --reload --port 8000

# Compatibility: this also works
# uvicorn app.main:app --reload --port 8000
```
> **Note:** The API will be available at `http://localhost:8000`. You can view the automated Swagger documentation at `http://localhost:8000/docs`.

### 2. Frontend Setup
```bash
cd credit_scoring/frontend

# Install dependencies
npm install

# Start the UI
npm run dev
```
> **Note:** The interface will be accessible at `http://localhost:5173`. 

## 🌐 Database & API Architecture

### Database Collections:
- **users:** Stores registered evaluators.
- **applications:** Stores all evaluated loan requests alongside the model's prediction and the calculated SHAP explanation.
- **audit_results:** Stores the historical fairness metrics tracked by the system.

### API Routes:
- `GET /health` : System status and model connectivity check.
- `GET /dashboard` : Returns macroscopic feature importance and global summary statistics.
- `GET /bias` : Returns data for the Fairness & Bias Dashboard (Approval rates by income/gender).
- `POST /predict` : Takes in applicant data, executes the ML model, stores it to MongoDB, and returns the decision, SHAP-derived natural language explanations, and counterfactuals.

## 📄 License
This codebase was explicitly built for demonstration and hackathon purposes.
