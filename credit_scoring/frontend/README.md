# Explainable Credit AI - Frontend

This is the frontend component for the Explainable Credit AI Platform, built exclusively as a high-fidelity internal tool for risk analysts. It delivers real-time AI transparency scoring, portfolio dashboards, and detailed explainability reports.

## Tech Stack
* **Framework:** React + Vite
* **Styling:** Tailwind CSS (Strictly enforcing the custom layout and pixel-perfect design system)
* **Routing:** `react-router-dom` v6
* **API Calls:** Axios / Fetch logic located centrally in `src/services/api.js`

## Features & Navigation Flows
1. **Authentication:** Enterprise login/signup flows configured via `/login`.
2. **Dashboard (`/dashboard`):** Real-time aggregation of model decisions, approval velocity, and AI explanations. 
3. **New Evaluation (`/evaluation`):** Submission form evaluating credit health based on income, history score, and logic mapping. Hitting "Evaluate" triggers the machine learning engine and pushes results.
4. **Report Result (`/report`):** Auto-generated display capturing a single decision trace. Dynamic features map the `SHAP` values and visual adherence gauges.
5. **Bias & Fairness Monitoring (`/bias`):** Live audit panels tracking socioeconomic segments & gender impact.

## Development Setup

To get this internal portal running locally:

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Dev Server
Spin up the local hot-reload environment.
```bash
npm run dev
```

*Note: By default, the application runs on `localhost:5173`. Make sure the associated FastAPI backend is running on `localhost:8000` to properly consume the authentication and scoring APIs!*
