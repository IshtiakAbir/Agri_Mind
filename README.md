# AgriMind — Unified Smart Poultry Platform

> **AgriMind** is an AI-powered smart poultry management system combining automated Machine Learning Profit Estimation (Lasso Pipeline), Deep Learning Poultry Disease Diagnostics (EfficientNetB3 & CV), an AgriShop Marketplace, Real-time Geocoded Weather, and Role-Based User Management (Farmer & Employee).

---

## 🏗️ Repository Architecture

```
agrimind-merged/
├── ml/                        # [ML TEAM] Machine Learning Core
│   ├── models/                # Trained model binaries (poultry_profit_model.pkl)
│   ├── pipelines/             # Clean inference scripts (calc_profit.py, infer_disease.py)
│   └── notebooks/             # Colab notebooks & training scripts
│
├── app/                       # [WEB TEAM] Full-Stack Web Application
│   ├── backend/               # Node.js + Express API
│   │   ├── config/            # MongoDB connector with offline fallback
│   │   ├── middleware/        # JWT Authentication middleware
│   │   ├── models/            # Mongoose schemas (User, Farm, Prediction)
│   │   ├── routes/            # REST API routes (auth, user, farms, predict, products, weather)
│   │   └── server.js          # Express server entry point
│   │
│   └── frontend/              # React + Vite + Tailwind CSS
│       └── src/
│           ├── context/       # AuthContext (JWT session & BN/EN Language)
│           ├── components/    # Complete UI suite
│           └── App.jsx        # Unified master router
│
├── run-agrimind.bat           # One-click Windows startup script
├── requirements.txt           # Unified Python ML dependencies
├── CONTRIBUTIONS.md           # Authorship matrix & Git tracking breakdown
└── package.json               # Monorepo task runner
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18+)
- **Python** (3.9+) with `numpy`, `pandas`, `scikit-learn`, `joblib`, `pillow` installed (`pip install -r requirements.txt`)
- **MongoDB** (Local instance or MongoDB Atlas URI in `.env`)

### 2. One-Click Launch (Windows)
Double-click `run-agrimind.bat` in the root folder. It automatically starts the backend API (Port 3001) and frontend dev server (Port 5173).

### 3. Manual Launch via NPM
```bash
# 1. Install all dependencies
npm run install:all

# 2. Run backend and frontend concurrently
npm run dev
```

* **Frontend Web App**: [http://localhost:5173](http://localhost:5173)
* **Backend API**: [http://localhost:3001](http://localhost:3001)

---

## 🌟 Core Features

1. **Automated ML Profit Forecasting**:
   - Uses trained Lasso Regression pipeline to forecast net profit based on flock size, feed consumption, mortality rate, feed prices, market rates, and operational overhead.
2. **AI Disease Diagnostics**:
   - Upload poultry fecal dropping images to diagnose **Coccidiosis**, **Salmonella**, and **Newcastle Disease** with confidence percentage meters and treatment advisories.
3. **Multi-Farm Management**:
   - Register and manage multiple poultry farms with an instant farm switcher bar.
4. **AgriShop Poultry Marketplace**:
   - Browse instruments, medicines, vaccines, and feed.
   - Farmers can list their own produce (live chickens, brown eggs) for direct trade.
5. **Live Microclimate Weather**:
   - Real-time weather lookup based on each farm's city & country via Open-Meteo.
6. **Authentication & Roles**:
   - Secure login & registration for Farmers and Employees with bilingual Bengali/English support.
