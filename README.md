# Explainable Credit Scoring System

An AI-driven credit risk assessment platform that prioritizes transparency, fairness, and explainability. Unlike traditional "black-box" ML systems, this platform provides actionable insights into credit decisions, ensuring fair lending practices and empowering applicants.

## 🌟 Key Features

- **Explainable AI (XAI) via SHAP:** Breaks down every credit decision, showing exactly how each applicant parameter (e.g., income, existing debt) influenced their final score.
- **Actionable Counterfactuals:** If an application is denied, the system auto-generates a "Path to Approval" (e.g., "Increase income by $5,000" or "Reduce existing debt by $1,200") to provide transparent, actionable next steps.
- **Bias & Fairness Auditing:** Continuously monitors evaluation metrics across protected demographic groups (e.g., gender, race) using Disparate Impact and Equal Opportunity models to ensure compliance and fair lending.
- **Modern UI:** Built on React and Tailwind CSS, featuring an elegant, responsive dashboard with intuitive data visualization.

## 🏗️ Architecture

- **Backend:** Python 3.12, FastAPI, XGBoost, SHAP, Pydantic
- **Frontend:** React, React Router, Vite, Tailwind CSS
- **Machine Learning:** Custom XGBoost classifier with integrated SHAP explanations and rule-based counterfactual generations.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- Python (3.12+)

### 1. Backend Setup

```bash
cd backend
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# Mac/Linux:
# source venv/bin/activate

pip install -r requirements.txt

# Start the FastAPI server
uvicorn main:app --reload --port 8000

# Compatibility: this also works
# uvicorn app.main:app --reload --port 8000
```
The API will be available at [http://localhost:8000](http://localhost:8000). You can view the interactive Swagger documentation at [http://localhost:8000/docs](http://localhost:8000/docs).

### 2. Frontend Setup

```bash
cd credit_scoring/frontend

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```
The Frontend UI will be available at [http://localhost:5173](http://localhost:5173).

## 📡 API Endpoints Overview

- `GET /health`: System status and loaded model verification.
- `GET /dashboard`: Aggregate system metrics, approval rates, and global data insights.
- `POST /predict`: Submit an applicant's data for credit evaluation, SHAP reasoning, and counterfactuals.
- `GET /bias`: Returns disparate impact and fairness metrics for system audits.

## 📄 License
This project is licensed under the MIT License.
