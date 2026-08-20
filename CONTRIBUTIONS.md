# Project Contributions & Codebase Ownership Matrix

This document defines the clear authorship and module ownership breakdown for the **AgriMind Unified Platform** (`agrimind-merged`), tracking contributions merged from `ML_project` and `agrimind-main`.

---

## 1. Primary Authorship Breakdown

| Module / Component | Primary Author / Team | Source Repository | Key Responsibilities |
| :--- | :--- | :--- | :--- |
| **`/ml/pipelines/calc_profit.py`** | **ML Engineering Team** | `ML_project` | Lasso regression profit pipeline, feature engineering, flock cost & revenue arithmetic |
| **`/ml/pipelines/infer_disease.py`** | **ML Engineering Team** | `ML_project` | Dual-engine poultry fecal disease diagnostics, confidence scoring, treatment advisory |
| **`/ml/models/`** | **ML Engineering Team** | `ML_project` | Model serialization binaries (`poultry_profit_model.pkl`, weights checkpoints) |
| **`/ml/notebooks/`** | **ML Engineering Team** | `ML_project` | Google Colab model training, evaluation metrics, confusion matrices |
| **`/app/backend/config/`** | **Full-Stack Web Team** | `agrimind-main` | MongoDB connection handling, offline resilience fallback |
| **`/app/backend/middleware/`** | **Full-Stack Web Team** | `agrimind-main` | JWT authentication & role-based route protection |
| **`/app/backend/routes/auth.js`** | **Full-Stack Web Team** | `agrimind-main` | User registration, login, bcrypt security, profile validation |
| **`/app/backend/routes/user.js`** | **Full-Stack Web Team** | `agrimind-main` | Profile updates, employee farmer lookup & support |
| **`/app/backend/routes/farms.js`** | **ML & Full-Stack Team** | `ML_project` | Farm CRUD & automated Python ML profit pipeline invocation |
| **`/app/backend/routes/predict.js`** | **ML & Full-Stack Team** | `ML_project` | Fecal image uploads, Python diagnostics execution, audit logging |
| **`/app/backend/routes/products.js`** | **Full-Stack Web Team** | `ML_project` | Poultry equipment, medicines, vaccines, feed, and farmer selling trade hub |
| **`/app/backend/routes/weather.js`** | **Full-Stack Web Team** | `ML_project` | Geocoding & real-time Open-Meteo weather forecasts |
| **`/app/frontend/src/context/`** | **Full-Stack Web Team** | `agrimind-main` | AuthContext, JWT persistence, Bengali/English multilingual switching |
| **`/app/frontend/src/components/Auth/`** | **Full-Stack Web Team** | `agrimind-main` | `LoginPage.jsx`, `RegisterPage.jsx`, `ForgotPasswordModal.jsx` |
| **`/app/frontend/src/components/Dashboard.jsx`** | **Full-Stack Web Team** | `ML_project` | Overview, Farm Registration Form, Shopping Explorer, Diagnostics Banner |
| **`/app/frontend/src/components/MyFarm.jsx`** | **ML & Full-Stack Team** | `ML_project` | Stored farm list & switcher, ML profit hero card, flock specs, weather widget |
| **`/app/frontend/src/components/Marketplace.jsx`**| **Full-Stack Web Team** | `ML_project` | Supplies shop, farmer produce selling modal, seller contact modal |
| **`/app/frontend/src/components/DiseaseDetection.jsx`** | **ML & Full-Stack Team**| `ML_project` | Drag-and-drop uploader, probability gauges, confidence meter, medical advisory |

---

## 2. Directory Ownership Tree

```
agrimind-merged/
├── ml/                                 [ML TEAM]
│   ├── models/                         -> Model checkpoint binaries
│   ├── pipelines/                      -> Python ML inference engines
│   └── notebooks/                      -> Model training & evaluation scripts
│
└── app/                                [FULL-STACK WEB TEAM]
    ├── backend/
    │   ├── config/                     -> DB connector & resilience
    │   ├── middleware/                 -> JWT Authentication
    │   ├── models/                     -> User, Farm, Prediction schemas
    │   └── routes/                     -> REST API endpoints
    │
    └── frontend/
        └── src/
            ├── context/                -> Auth session & Multilingual (BN/EN)
            └── components/             -> Responsive UI Suite
```
