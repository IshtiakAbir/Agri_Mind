# AgriMind — Pre-Thesis 2 Poster Viva Preparation

**Project:** AgriMind: Smart Poultry Health and Profit Decision Support
**Team:** Afif Ahnaf Syed (22301569), Taosim Afrin (22301488), Md Ishtiak Alam Abir (22301360), Radoan Khan Rid (22299349), Sinawath Siam (22101677)
**Supervisor:** Partha Bhoumik  |  **Thesis ID:** P26101147  |  **Institution:** BRAC University

> **How to use this file**
> - 🎤 **Speech** = word-for-word script (about 60–90 seconds per part). Say it in your own words, don't memorise it robotically.
> - 🛠️ **What we used** = quick reference of tools and files.
> - ❓ **Q&A** = likely faculty questions with a ready spoken answer.
> - Anything in **[brackets]** is a number or fact you must fill in yourself (e.g. your Colab accuracy).
> - Facts were checked against the code in `agrimind-merged/`.

---

## 0. READ FIRST — Poster vs. Code (be ready, answer honestly)

| # | Poster says | What the code actually does | Safe honest answer |
|---|---|---|---|
| 1 | "Deep Learning CNN Disease Classifier" | EfficientNetB3 is trained in Colab (`ml/notebooks/poultry_disease_detection_cnn.py`). The trained `.keras` file is **not in `ml/models/`**, so `infer_disease.py` and `diseaseEngine.js` fall back to a **colour-feature engine**. Fallback confidence is clamped to 82–96 %. | "The CNN was trained and evaluated in Colab. The app uses the Keras checkpoint when it is available and falls back to a lightweight engine so the system never fails. Hosting the trained model as a service is our next step." |
| 2 | "ML Profit Regression" | Python trains a **HistGradientBoostingRegressor** on **10,000 synthetic samples**. The web app's `profitEngine.js` uses a calibrated formula and does not load the `.pkl`. | "The model is trained in Python with 5-fold CV. The live service uses a formula that mirrors its logic for sub-millisecond response." |
| 3 | README says "Lasso" | Code uses gradient boosting. | "Lasso was an early baseline; the final pipeline is gradient boosting." (Check the Colab notebook first.) |
| 4 | "Hourly sync" with Open-Meteo | Cron runs **every 3 hours**. | Say "periodic, every 3 hours". |
| 5 | "Cloud Image Storage" | Uploads go to local `uploads/` (or `/tmp` on Vercel). | "Image storage layer; moving to a cloud bucket is future work." |
| 6 | "Bangla-first UI (MTR-01 default)" | "MTR-01" not found in code. | Know what you meant by MTR-01. |
| 7 | "11-digit mobile number as ID" | ✅ Enforced in `routes/auth.js`, unique in `User.js`. | Accurate. |
| 8 | Disease accuracy | Not stored in repo. | Read it from your Colab output. |

---

## PART 01 — ABSTRACT

### 🎤 Speech
"Good [morning/afternoon], honourable faculty members. We are presenting **AgriMind**, a smart poultry health and profit decision support platform.

Poultry is a major source of protein and income in Bangladesh, and most of it is produced by smallholder farmers. These farmers usually manage their flocks with notebooks and memory. Because of this, they miss vaccination dates, notice disease late, and often do not know their real profit until the whole batch is sold.

AgriMind solves this with one simple, mobile-friendly web platform. A farmer registers a flock, and the system automatically calculates its age and generates breed-specific vaccination and milestone reminders. The farmer does one quick daily check-in, and the system tells them whether the farm is 'Looks Good' or 'Attention Required'. If a bird looks sick, the farmer uploads a photo of the droppings and our AI suggests the likely disease with a confidence score, treatment guidance and matching medicines. The platform also forecasts profit, warns about heat and ammonia risk using district weather, and connects farmers to trusted suppliers and veterinarians.

The most important point is that all of this needs **no extra hardware**. A phone and internet are enough."

### 🛠️ What we used
React 18 + Vite + Tailwind (frontend) · Node.js + Express (backend) · MongoDB Atlas + Mongoose (database) · TensorFlow/Keras EfficientNetB3 (disease) · scikit-learn (profit) · Open-Meteo (weather) · JWT + bcrypt (security) · node-cron + Luxon (scheduling).

### ❓ Q&A
**1. What problem does AgriMind solve?**
"Small poultry farmers rely on paper and memory, so they miss vaccinations, detect disease late and cannot see their profit in advance. AgriMind turns daily farm data into timely actions: reminders, alerts, diagnosis and a profit forecast."

**2. Why poultry?**
"Poultry has short production cycles, for example broilers are ready in about 35 days. That means one mistake quickly becomes a large loss, and decisions need to be fast. Also most poultry farms in Bangladesh are small and have limited access to vets and technology."

**3. Who are your users?**
"Mainly farmers. The system also supports employees, veterinarians through the doctor directory, and admin and support staff. These roles are defined in our user model: farmer, employee, admin, support."

**4. What is new compared to existing apps?**
"Existing tools usually do only one thing, like record keeping or a disease classifier. We combine lifecycle management, daily health status, AI diagnosis, profit forecasting, weather alerts and a marketplace in one platform. It is also designed for Bangladeshi farmers, and requires no sensors."

**5. Is it a mobile app or a web app?**
"It is a responsive web application. Farmers do not need to install anything; it works in a phone browser. A PWA or native wrapper is a possible next step."

**6. What does 'decision support' mean here?**
"The system does not just store data. It converts it into decisions: a status banner, due tasks, alerts, a diagnosis with treatment advice, and a profit forecast."

**7. Is the AI diagnosing or advising?**
"It is advising only. We always show a disclaimer. If the confidence is below 70 %, we return an 'unclear result' and do not suggest medicine. For serious or viral diseases we flag a veterinarian referral."

**8. What farm size is it for?**
"Smallholder to small-commercial farms. Our profit model data covers flocks from about 100 up to 15,000 birds."

---

## PART 02 — OBJECTIVE

### 🎤 Speech
"Our project has seven objectives, and each one maps to a working feature.

First, we **track poultry batches with automatic age calculation**. We never store the age, we calculate it every time from the start date, so it is never outdated.

Second, we **give breed-based vaccination and milestone reminders**. We have lifecycle templates for five breeds: Broiler, Layer, Sonali, Desi and Cock. The system turns these into dated tasks for each batch.

Third, **daily health status with one quick check-in**. The system checks seven conditions, such as missed check-ins, high mortality, overdue critical tasks, red-flag symptoms and weather alerts, and then shows either 'Looks Good' or 'Attention Required'.

Fourth, **AI-based disease risk detection from droppings photos**.

Fifth, **ML-based profit forecasting**.

Sixth, **weather-based heat and ammonia alerts**, using free district weather data.

And seventh, we **connect farmers with trusted suppliers and veterinarians** through the AgriShop marketplace and the doctor directory."

### 🛠️ What we used
| Objective | Implementation |
|---|---|
| Batch + auto age | `models/Batch.js`, `utils/ageCalc.js` |
| Reminders | `templates/*.json` + `schema.json`, `templateLoader.js`, `taskGenerator.js`, `models/Task.js` |
| Daily status | `DailyLog.js`, `DailyCheckInCard.jsx`, `statusEvaluator.js` |
| Disease detection | `routes/predict.js`, `diseaseEngine.js`, `infer_disease.py`, Colab CNN |
| Profit | `profitEngine.js`, `train_poultry_profit_model.py` |
| Weather alerts | `weatherService.js`, `alertService.js`, `jobs/weatherCronJob.js` |
| Marketplace/vets | `products.js`, `orders.js`, `doctors.js`, `Marketplace.jsx`, `DoctorDirectory.jsx` |

Status reason codes: MORNING_MISSED (after 11:00), EVENING_MISSED (after 20:00), NO_LOG_YESTERDAY, MORTALITY_HIGH, CRITICAL_TASK_OVERDUE, RED_FLAG_SYMPTOM, WEATHER_ALERT. All thresholds live in `config/thresholds.js`. Feature flag `SMART_POULTRY=true`.

### ❓ Q&A
**1. How do you calculate age?**
"Age = age at registration + days elapsed since the batch start date. We compute it on read and never store it, so it cannot go stale."

**2. What if the farmer registers a flock that is already 15 days old?**
"The task generator skips milestones before the starting age, so no false 'overdue' tasks appear. Vaccines the farmer says were already given are marked Completed."

**3. Why only one check-in per day?**
"Farmers have limited time and often limited literacy. A short check-in gets higher compliance than a long form, and compliance matters more than data volume. It has a morning and an evening routine."

**4. How does the system detect high mortality?**
"Two rules. One: a single day's deaths are at least 0.5 % of live birds. Two: a spike, meaning deaths are at least twice the previous 3-day average and at least 5 birds. Both values are configurable in the thresholds file."

**5. What if the farmer forgets to check in?**
"The status changes to 'Attention Required' with a reason such as 'morning routine missed' or 'no log yesterday'."

**6. How do you handle a 365-day Layer cycle?**
"Short cycles up to 35 days, like Broiler, generate all tasks upfront. Long cycles use a rolling 60-day window. A nightly job at 00:05 Dhaka time extends the window and marks overdue tasks, so we never create hundreds of tasks at once."

**7. How do you avoid duplicate tasks?**
"We use an idempotent bulk upsert with `$setOnInsert` keyed on batch ID plus template key. Re-running never duplicates tasks or overwrites completed ones."

**8. How will you measure success?**
"Check-in compliance, on-time task completion, mortality trend, disease-diagnosis accuracy, and forecast error compared with actual profit at batch close."

**9. Have you tested with real farmers?**
"[Answer truthfully.] Suggested: 'We tested with demo data and team scenarios. A field pilot with real farmers is planned. Our thresholds are designed to be tuned after the first pilot batch.'"

---

## PART 03 — ANALYSIS PIPELINE

### 🎤 Speech
"This diagram shows how a disease diagnosis request flows through the system.

The farmer first uploads a photo of the poultry droppings, together with farm details. The **React frontend** sends it to our **Express backend** as a multipart request. The backend validates the file, it must be an image under 10 MB, and saves it.

The image is then passed to our **deep learning model**. The model is an **EfficientNetB3 network** which we trained using transfer learning on a public poultry-disease image dataset, with four classes: Coccidiosis, Salmonella, Newcastle Disease and Healthy. It returns the predicted disease and a confidence score.

If the confidence is **70 % or higher**, the backend looks up a veterinary **treatment knowledge base** to get the active ingredients, supportive care and whether a vet referral is needed. It also finds matching products in the AgriShop. If the confidence is lower, we say the result is unclear and we do not recommend any medicine.

Finally, the result is stored in **MongoDB Atlas** as an audit record and returned to the farmer, with a disclaimer that this is AI-assisted guidance only. We also built a lightweight fallback engine so the system still responds if the model service is unavailable."

### 🛠️ What we used
- Multer (types: jpeg/jpg/png/gif/webp, limit 10 MB).
- `child_process.spawn` → `infer_disease.py`, **12 s timeout**, else Node `diseaseEngine.js` fallback (jpeg-js, pngjs).
- Confidence gate 0.70 (`thresholds.diagnosisConfidenceThreshold`).
- `DiseaseTreatmentMap` knowledge base, `findProductsByIngredients(…, 6)`.
- `Prediction` collection for history.

**CNN training summary**
| Item | Value |
|---|---|
| Dataset | Kaggle `kausthubkannan/poultry-diseases-detection` |
| Split | 70 / 15 / 15 (train/val/test), seed 123 |
| Input | 224×224, batch 32 |
| Imbalance | balanced class weights |
| Augmentation | flip, rotation 0.2, zoom 0.15, contrast 0.15, translation 0.1 |
| Backbone | EfficientNetB3 (ImageNet), top 50 % unfrozen in phase 2 |
| Head | GAP → BN → Dropout 0.4 → Dense 512 (L2) → BN → Dropout 0.4 → Dense 256 → Dropout 0.3 → Softmax 4 |
| Loss | Cross-entropy + label smoothing 0.1 |
| Phase 1 | Adam 1e-3, ≤20 epochs (head only) |
| Phase 2 | AdamW, cosine decay from 3e-5, 30 epochs |
| Callbacks | EarlyStopping (patience 7), ModelCheckpoint, ReduceLROnPlateau |
| Extras | Mixed precision, Test-Time Augmentation |
| Results | **[Test accuracy ___ %, macro-F1 ___, confusion matrix from Colab]** |

### ❓ Q&A
**1. Why EfficientNetB3?**
"It gives high accuracy for a relatively small number of parameters, it has strong ImageNet pretrained weights, and at 224 pixels it trains fast on a free Colab GPU."

**2. Why transfer learning?**
"Our dataset is small. A network pretrained on ImageNet already knows edges, colours and textures. We only need to adapt it to droppings, which avoids overfitting and saves training time."

**3. Why two-phase training?**
"In phase one we freeze the backbone and train only the new classification head, so random head weights don't damage pretrained features. In phase two we unfreeze the top half of the backbone and fine-tune it with a very small learning rate."

**4. What is label smoothing?**
"Instead of target 1 for the correct class and 0 for others, we use about 0.9 and a small value for the rest. It prevents over-confidence and improves generalisation."

**5. What is Test-Time Augmentation?**
"At prediction we average the model's outputs over slightly modified copies of the image, like a flip and small brightness changes. It makes predictions more stable."

**6. How did you handle class imbalance?**
"We computed balanced class weights, so mistakes on rarer classes are penalised more."

**7. How did you prevent overfitting?**
"Data augmentation, dropout, L2 regularisation, batch normalisation, label smoothing, early stopping, and a held-out test set that we never used for tuning."

**8. What are your accuracy and F1?**
"[Read from Colab.] Our test accuracy was [__ %] and macro-F1 was [__]. The most confusion was between [class A] and [class B], because their droppings can both look watery or greenish."

**9. Is your test set truly independent?**
"It is held out from training and validation, but it comes from the same public dataset, so it may share conditions. That's why we plan to validate on real Bangladeshi farm images. This is a limitation."

**10. Why droppings and not a photo of the bird?**
"Droppings are non-invasive, easy to photograph, and colour and texture are early indicators of Coccidiosis, Salmonella and Newcastle disease."

**11. What if the user uploads a non-dropping image?**
"Currently the 70 % confidence gate catches many uncertain cases, but a dedicated 'not a dropping' detector is future work."

**12. Why do you spawn Python from Node? Is it slow?**
"It lets us keep the ML code in Python. We use a 12-second timeout and a JavaScript fallback that answers in milliseconds. For production we would host the model as a separate service, such as FastAPI or TF Serving."

**13. Why is there a fallback engine?**
"Serverless platforms like Vercel can't easily run TensorFlow. The fallback guarantees the app always responds, and we are open that it is a simpler colour-feature method, not the full CNN."

**14. Where do the treatment recommendations come from?**
"From a curated knowledge base seeded in the backend, based on standard poultry practice: for example Amprolium or Toltrazuril for coccidiosis, Oxytetracycline or Enrofloxacin for Salmonella, and ND Lasota vaccination for Newcastle disease. [Mention if a vet reviewed it.] We list active ingredients, not brands, and always add a disclaimer and a withdrawal-period note."

**15. What is softmax and confidence?**
"Softmax converts the network's outputs into four probabilities that sum to one. The highest value is the confidence."

**16. Why 224 pixels?**
"It's about 50 % faster than larger sizes with very little accuracy loss for B3."

**17. Is each prediction stored?**
"Yes. The Prediction collection stores type, inputs, result and timestamp. It powers the history screen and gives an audit trail."

**18. Why 70 % threshold?**
"It is a conservative starting value to avoid showing medicine on weak predictions. It's configurable, and it could be calibrated using validation data."

---

## PART 04 — DATABASE DESIGN

### 🎤 Speech
"For data storage we use **MongoDB Atlas**, a cloud NoSQL database, with Mongoose schemas. This table shows our main collections and how they relate.

A **user** can own many **farms**, place many **orders**, and the user is identified by a unique 11-digit mobile number with a role such as farmer or employee. A **farm** belongs to one user and can have many **batches**. A **batch** is one complete production cycle, from chick placement to sale, so a farm can run several batches at once or one after another. Each batch has many **daily logs**, which store the daily check-in data like mortality, feed and symptoms.

**Predictions** store every diagnosis and profit result as an audit trail. The **disease treatment map** is our veterinary knowledge base linking each disease to active ingredients and supportive care. **Orders** record marketplace purchases. And **weather readings** store district-level weather, keyed by city so one reading serves every farm in that district. They expire automatically after seven days using a TTL index.

A few design decisions: age is never stored, only calculated; totals like cumulative feed, mortality and the latest profit forecast are cached on the batch so the dashboard loads instantly; and every route checks that the caller owns the farm before accessing a batch."

### 🛠️ What we used
| Collection | Relationship | Notes |
|---|---|---|
| users | 1:N farms, orders | unique mobile, bcrypt, role enum |
| farms | N:1 user; 1:N batches | `city` drives weather |
| batches | N:1 farm; 1:N dailylogs, tasks | cached totals + `latestForecast` |
| dailylogs | N:1 batch | mortality, symptoms, routines |
| predictions | refs user/farm | type disease/profit |
| diseasetreatmentmaps | referenced by predictions | unique `diseaseKey` |
| orders | N:1 user | marketplace |
| weatherreadings | by city | TTL 7 days |
| (also) tasks, alerts, adminauditlogs | | extra collections in code |

### ❓ Q&A
**1. Why MongoDB instead of SQL?**
"Our data is document-shaped and varies by breed and by prediction type. MongoDB gives flexible schemas, works naturally with JSON in Node, has a free cloud tier in Atlas, and supports embedded sub-documents like the forecast."

**2. What are its downsides?**
"No automatic joins or multi-collection ACID by default, so we must design references carefully, and cached totals must be kept consistent."

**3. How do you keep cumulative totals consistent?**
"They are updated atomically each time a daily log is written."

**4. Why not store age?**
"Because it changes every day. Computing on read prevents stale or inconsistent values."

**5. Why separate Farm and Batch?**
"A farm is the static place and owner. A batch is one dynamic production cycle. Separating them gives history and supports several batches."

**6. Why are daily logs separate documents and not embedded?**
"They grow every day without limit. Embedding would eventually reach MongoDB's 16 MB document limit and slow updates."

**7. What indexes do you have?**
"Index on `farmId` and `status` in batches, a unique index on user mobile, a unique `diseaseKey`, and a TTL index on weather readings."

**8. How is data secured?**
"Passwords are hashed with bcrypt, access uses JWT, every batch route verifies farm ownership, roles restrict admin routes, and admin actions are logged."

**9. What happens if MongoDB is unreachable?**
"We disabled command buffering so queries fail immediately instead of hanging. The routes then fall back to an in-memory store and the server keeps running. It's a resilience feature for demos and rural connectivity, but memory data is not persistent."

**10. How would it scale?**
"The API is stateless so it can scale horizontally or serverless. Atlas scales the data, indexes keep queries fast, and weather and forecast caching cuts repeated work."

**11. Why is weather keyed by city, not farm?**
"One API call serves all farms in a district, which saves cost and respects free-tier limits."

**12. What personal data do you store?**
"Only name, mobile number and farm details. Passwords are hashed. We store no payment data."

**13. Why is `farmId` a string in Prediction but ObjectId in Batch?**
"Prediction also accepts demo or in-memory IDs. We acknowledge this should be normalised in a later version."

---

## PART 05 — SYSTEM ARCHITECTURE

### 🎤 Speech
"AgriMind uses a **layered architecture** with five parts.

At the top is the **client layer**, built with React, Vite and Tailwind CSS. It has four portals: the farmer dashboard and diagnostics, the AgriShop marketplace, the vet doctor portal, and the admin and support panel.

The client talks to the backend through a **REST API using JSON**, and every protected request carries a **JWT token**.

The **backend and API gateway** is built with Node.js and Express. It has REST controllers, JWT authentication middleware, our **batch lifecycle engine** that generates tasks and evaluates farm status, and **node-cron schedulers**. One job runs every night to update overdue tasks, and another runs every three hours to fetch weather. Weather comes from the free **Open-Meteo API**, and we use it to raise heat-stress, ammonia and cold-snap alerts.

The **AI and intelligence engine** has the deep learning disease classifier, the profit regression model, and the treatment knowledge base.

Finally, the **data layer** uses MongoDB Atlas, an in-memory cache for offline resilience, and image storage.

This design separates concerns so we can replace any layer, for example host the AI model separately, without rewriting the rest. And the whole backend can run locally or as a serverless function on Vercel."

### 🛠️ What we used
- **Frontend:** React 18, Vite 5, Tailwind 3, @tanstack/react-query, axios, lucide-react.
- **Backend:** Node 22, Express 4, Mongoose, JWT, bcryptjs, Multer, Ajv, Luxon, node-cron, zod.
- **Weather rules** (`alertService.js`):
  - HEAT_STRESS: temp > 32 °C, or heat index > 35, or apparent temp > 35, or 24 h max > 34 (Critical if > 35 °C or HI > 39).
  - AMMONIA_MOISTURE: humidity > 80 % and temp > 28 °C.
  - COLD_SNAP: temp < 15 °C and flock ≤ 21 days.
  - **Hysteresis:** alert clears after 2 consecutive safe readings.
- **Weather cache order:** memory → MongoDB (TTL) → Open-Meteo (2.5 s timeout) → last known (stale flag) → static baseline.
- **Auth:** 11-digit mobile starting `01`, password ≥ 6 chars, bcrypt salt 10, JWT 30 days.
- **Deploy:** `npm run dev` (backend :3001, frontend :5173 with proxy), `api/index.js` for Vercel, `render.yaml`.

### ❓ Q&A
**1. Why a layered architecture?**
"Separation of concerns. Each layer can be changed or tested independently, for example swapping the ML engine or database."

**2. Why Node and Express?**
"JavaScript across the whole stack, non-blocking I/O for many small requests, a large ecosystem, and easy serverless deployment."

**3. Why React and Vite?**
"Reusable components, fast development builds, and a single-page app feels like a mobile app."

**4. Why Tailwind?**
"Quick mobile-first responsive styling with a small CSS output."

**5. What is react-query for?**
"It handles server data caching, refetching and loading or error states, so we make fewer API calls."

**6. How does JWT authentication work?**
"At login, the server signs a token containing the user's id and role. The client sends it with each request, the middleware verifies it and attaches the user. The server needs no session storage."

**7. What are the security weaknesses?**
"Honestly: the token is kept client-side, CORS is open during development, there is a default secret fallback in code, no rate limiting, and the prediction endpoint is public. We would use httpOnly cookies, environment-only secrets, restricted origins, rate limiting and remove demo seed accounts before production."

**8. How do you control roles?**
"The role is inside the token; admin routes check it, and admin actions are written to an audit log."

**9. How does it scale?**
"Stateless API, cloud database, caching, and the heavy ML part can be separated into its own service."

**10. What are the single points of failure?**
"The database and the weather API. We mitigate them with the in-memory fallback and cached or stale weather readings."

**11. Why not microservices?**
"For our team size and time, a modular monolith is simpler. Services are already separated in code, so it can be split later."

**12. Why Open-Meteo?**
"It is free, needs no API key, gives hourly forecasts and geocoding, and needs no hardware."

**13. What if rural internet is poor?**
"Weather is cached, responses are small, and the in-memory fallback keeps the app usable. A full offline PWA with sync is future work."

**14. How do scheduled jobs work on serverless?**
"Cron jobs run inside the long-running Node server. On Vercel we would move them to Vercel Cron or GitHub Actions. That's a known limitation."

**15. How did you test?**
"Unit tests in `__tests__` folders, for example heat index and weather service. Our evaluator and nightly job accept an injectable clock so time-based logic is testable."

**16. What are the response times?**
"Profit calculation takes under a millisecond, cached weather is near-instant, and the fallback disease engine answers in tens of milliseconds."

**17. Why a feature flag?**
"`SMART_POULTRY` lets us switch the new lifecycle features on or off without touching existing behaviour."

---

## PART 06 — KEY DESIGN DECISIONS

### 🎤 Speech
"This table summarises the major design decisions and why we made them. All of them come from one principle: **design for the real constraints of a smallholder farmer.**

**Platform:** we chose a responsive web app so farmers don't need to install anything.

**Identity:** we use the **11-digit mobile number** because almost every farmer has a phone, but not everyone has an email.

**Language:** the interface is **Bangla-first**, to remove the literacy barrier.

**Database:** MongoDB Atlas, because batches, logs and predictions have flexible structures.

**Offline strategy:** an in-memory cache and fallbacks, so the app keeps working when the network or database is unstable.

**Hardware:** **zero IoT**. Farmers do a software check-in instead, which means no capital cost or maintenance.

**AI diagnostics:** deep learning on droppings photos, because it's non-invasive and only needs a phone camera.

**Microclimate:** Open-Meteo through scheduled jobs gives district weather without any sensors.

**Decision support:** an automated feed-conversion-ratio and profit predictor that turns daily logs into a forecast of harvest profit.

Every choice has trade-offs. For example, self-reported data can be inaccurate and district weather is not the same as shed temperature. We are aware of this and list them as limitations and future work."

### 🛠️ What we used
| Decision | Chosen | Trade-off |
|---|---|---|
| Client | React + Vite web SPA | No native push/offline yet |
| Auth ID | Mobile number | No SMS OTP yet |
| Localization | Bangla-first | Translation upkeep |
| Database | MongoDB Atlas | Weaker relational integrity |
| Offline | In-memory + cache | Not persistent |
| Hardware | Zero IoT | Self-reported data |
| AI | Deep learning on photos | Dataset bias |
| Microclimate | Open-Meteo + cron | District-level only |
| Decision support | FCR + profit predictor | Depends on log accuracy |

Optimal FCR used in code: Broiler 1.6, Sonali 2.45, Desi 2.8, Cock 2.7, Layer 2.2. Forecast rules: min 3 logged days, 1-hour debounce, 8 s timeout, cached with `isStale` flag.

### ❓ Q&A
**1. Why no IoT sensors?**
"Sensors cost money, need power and maintenance, and can be stolen or fail in rural settings. A software-only solution can reach farmers immediately. Sensors can later plug into the same API."

**2. Isn't self-reported data unreliable?**
"Yes, it can be. We reduce this with reminders, validation, the status banner, and a very short check-in. In future we could add photo evidence or optional sensors."

**3. Why a mobile number instead of email?**
"Accessibility and uniqueness: nearly every farmer has a mobile number."

**4. Why Bangla-first?**
"Our users read Bangla. A native-language interface greatly improves adoption. [Explain what MTR-01 means.]"

**5. Why NoSQL?**
"Flexible, JSON-native, and fits varying batch and prediction data. See the database section."

**6. Why web and not an Android app?**
"A web app reaches all phones immediately with one codebase. It can later be wrapped as a PWA."

**7. What alternatives did you consider for disease detection?**
"SVM or random forest on hand-made colour features, a small custom CNN, and other backbones like MobileNet or ResNet50. We chose EfficientNet for its accuracy-to-size ratio."

**8. Why district-level weather?**
"It is free and scalable. Farm-level GPS or sensors can refine it later."

**9. How do new users start?**
"A batch wizard collects breed, number of chicks, starting age and vaccines already given, then generates the plan."

**10. What would you do with more time?**
"Host the trained model as a service, collect real farm data and retrain, add SMS OTP and alerts, build PWA offline sync, and optionally integrate IoT."

---

## PART 07 — PROTOTYPE & INTERFACE

### 🎤 Speech
"Here you can see our working prototype. It is a **mobile-first interface** with a dark theme, big cards and clear colour status, so that it is easy for non-technical farmers.

On the left is the **registration screen**. A new user chooses a role, farmer or employee, and registers with name, an 11-digit mobile number and a password.

Next is the **marketplace, called AgriShop**. Farmers can buy medicines, vaccines, feed and equipment, and they can also list their own produce like live chickens and eggs.

Third is the **profit prediction screen**. The farmer enters flock size, feed, prices and costs, and the system shows predicted profit with a full breakdown of revenue and cost, including egg production and mortality rate. We train the model in Python using gradient boosting, and the live app uses a calibrated formula that applies a biological efficiency factor based on feed conversion ratio and mortality.

The last screen is **disease detection**. The farmer uploads a droppings photo and sees the disease, a confidence meter, symptoms, recommended treatment, matching medicines from the shop, and a vet-referral warning if needed.

Beyond what is on the poster, the app also has a dashboard with live weather and a status banner, a batch dashboard with a milestone timeline, a daily check-in card, a doctor directory, prediction history and an admin panel."

### 🛠️ What we used
Screens: `RegisterPage.jsx`, `Marketplace.jsx`, `MyFarm.jsx` + `FarmSummary.jsx`, `DiseaseDetection.jsx`, `Dashboard.jsx`, `BatchDashboard.jsx`, `MilestoneTimeline.jsx`, `DailyCheckInCard.jsx`, `DoctorDirectory.jsx`, `PredictionHistory.jsx`, `AdminPanel.jsx`, `WeatherWidget.jsx`, `StatusBanner.jsx`.

Profit math (`profitEngine.js`):
```
feedCost    = feedKg × feedPricePerKg
totalCost   = feedCost + medicine + vaccination + labour + electricity + water + transport + other
chickenRev  = chickensSold × avgWeightKg × pricePerKg   (Layer × salvage factor by age)
eggRev      = eggsSold × eggPrice (+ broken eggs × broken price); default breakage 2.5 %
Meat breeds: efficiency = 1 − fcrPenalty(±8 %) − (mortality − 4 %) × 0.4
Others:      efficiency = 1 − (mortality − 5 %) × 0.3
predictedProfit = totalRevenue × efficiency − totalCost
```
Python model: median imputer → StandardScaler + OneHot(breed) → HistGradientBoostingRegressor (150 iters, lr 0.1, depth 6), 5-fold CV, metrics R², MAE, RMSE (BDT).

### ❓ Q&A
**1. How did you design for low-literacy users?**
"Large cards and icons, colour-coded status, Bangla labels, few input fields, and a one-tap daily check-in."

**2. Walk us through a farmer's journey.**
"Register, add a farm with its city, create a batch in the wizard, then the dashboard shows tasks, weather and status. Each day the farmer does the check-in. If a bird looks unwell, they upload a droppings photo, and they can buy recommended medicine in the marketplace."

**3. What does the profit screen output?**
"Predicted profit, actual calculated profit, total revenue, total cost, feed cost, egg statistics, mortality percentage and feed per bird."

**4. Why are predicted and actual profit different?**
"Actual profit is revenue minus cost. Predicted profit also applies an efficiency factor based on how the flock performed on feed conversion and mortality."

**5. What data trained the profit model?**
"Ten thousand synthetic samples generated from calibrated breed economics: realistic FCR, weights, prices, mortality ranges and about 2 % noise. We also have a small real dataset CSV with about 50 farm-month records. We know the limitation: the model learns our generator, so validation on real batches is needed."

**6. Why would your R² be very high?**
"Because synthetic data follows a formula with small noise. We do not claim that as real-world accuracy."

**7. Why gradient boosting instead of linear or Lasso?**
"It captures non-linear interactions such as breed × age × feed, handles missing values, and trains in under a second."

**8. Explain MAE and RMSE.**
"MAE is the average absolute error in taka. RMSE squares errors first, so it punishes large mistakes more."

**9. How is layer egg revenue computed?**
"Birds × lay rate, about 82 %, × laying days × egg price, minus about 2.5 % broken eggs."

**10. What does the marketplace add?**
"It closes the loop: diagnosis, then treatment, then purchase. Farmers can also sell their produce directly."

**11. How are products linked to diseases?**
"Each disease maps to active ingredients. We search the product catalogue for matching ingredients and show up to six."

**12. Is it tested on mobile?**
"The layout is responsive with Tailwind. [Say which devices you tested.]"

**13. How do veterinarians use it?**
"Farmers browse a directory of doctors and contact them; admins manage doctor listings."

**14. Who manages the platform?**
"Admin and support staff through the admin panel: users, products, doctors, homepage content, and an audit log."

---

## PART 08 — CONCLUSION

### 🎤 Speech
"To conclude, **AgriMind brings farm management, AI-based disease detection, profit forecasting, weather monitoring and veterinary and supplier support into one platform.** It helps poultry farmers make smarter decisions, reduce losses and improve productivity, without buying any extra hardware.

So far, we have implemented five breed-specific lifecycle templates with automatic task generation, a seven-rule daily health status engine, three weather alert rules with hysteresis, an EfficientNetB3 disease classification pipeline, a profit prediction pipeline with cross-validation, and a complete full-stack application with authentication, multi-farm and multi-batch management, a marketplace, a doctor directory and an admin panel.

We are also clear about our limitations. Our disease model was trained on a public dataset, not on Bangladeshi farm images. Our profit model uses calibrated synthetic data. Daily inputs are self-reported, and weather is district-level.

For future work, we plan to host the trained model as a service, collect real field data to retrain and validate, add SMS notifications, build offline support, and optionally integrate low-cost sensors.

Thank you. We would be happy to answer your questions."

### ❓ Q&A
**1. What did you achieve against your objectives?**
"All seven objectives have a working implementation, listed in the objectives section. The main area still to strengthen is validation with real data."

**2. Biggest limitation?**
"Data. The disease model uses a public dataset and the profit model uses synthetic data, so real-world validation is the top priority."

**3. How will you evaluate impact?**
"A field pilot measuring check-in compliance, vaccination adherence, mortality trend, forecast error and usability with a standard survey like SUS."

**4. What is next for the final thesis?**
"Field validation, deploying the model service, retraining with real data, and adding SMS and offline support."

**5. Is it commercially viable?**
"Core features can be free for farmers. Revenue can come from marketplace commission, vet consultation fees and premium analytics."

**6. What are the ethical concerns?**
"A wrong AI result could cause harm, so we use disclaimers, a confidence threshold and vet referral. We also protect user data, and we recommend medicine by active ingredient with withdrawal notes to discourage antibiotic misuse."

**7. Who did what?**
"[Read CONTRIBUTIONS.md and state your own part clearly.]"

---

# MASTER Q&A — Whole Project (with answers)

## A. General
**1. What is AgriMind in one sentence?**
"A mobile-friendly platform that combines batch management, AI disease detection, profit forecasting, weather alerts and a marketplace for smallholder poultry farmers."

**2. Why this topic?**
"Poultry is important for Bangladesh's food and income, and small farmers lack affordable digital tools. Losses from disease and poor planning are large and preventable."

**3. What is the research gap?**
"Most solutions focus on one task or need hardware. Few combine lifecycle, health, finance and weather for Bangladeshi smallholders in their own language."

**4. Who is the target user and how did you identify their needs?**
"Smallholder poultry farmers. We used domain research on typical problems: missed vaccines, late disease detection and unknown profit. [Add any interview or survey you did.]"

**5. What is in and out of scope?**
"In scope: five breeds, four droppings classes, district weather, marketplace. Out of scope: IoT, payments, video consultation, other livestock."

**6. Which SDG does it support?**
"SDG 2 Zero Hunger, SDG 8 Decent Work and Economic Growth, and SDG 9 Industry, Innovation and Infrastructure."

**7. How is it different from a spreadsheet?**
"A spreadsheet only stores data. AgriMind automatically schedules tasks, evaluates health, raises alerts, diagnoses disease and forecasts profit."

**8. Hardest technical problem?**
"[Your answer.] Good options: making task generation idempotent and mid-cycle-safe, avoiding alert flicker with hysteresis, or making the system resilient when MongoDB or the model is unavailable."

**9. What did you learn?**
"Full-stack integration, applying transfer learning, designing around real user constraints, and the importance of real data."

## B. ML — Disease
**10. Dataset?**
"Public Kaggle poultry-disease droppings dataset with four classes: Coccidiosis, Healthy, Newcastle disease and Salmonella. [Add image counts.]"

**11. Explain transfer learning and fine-tuning.**
"Transfer learning reuses a network pretrained on a large dataset. Fine-tuning then unfreezes some layers and trains them slowly on our data."

**12. What is EfficientNet?**
"A CNN family that scales depth, width and resolution together using a compound coefficient, giving high accuracy with fewer parameters."

**13. Read your results.**
"[Accuracy ___, precision/recall/F1 per class ___, confusion matrix.]"

**14. Which classes are confused and why?**
"[From your matrix.] Typically Salmonella and Newcastle, because both can appear watery or greenish-yellow."

**15. What is overfitting?**
"When the model memorises training data and performs poorly on new data. We reduced it with augmentation, dropout, L2, early stopping and a held-out test set."

**16. Which augmentations and why?**
"Flips, rotation, zoom, contrast and translation. They make the model robust to camera angle, distance and lighting."

**17. Why label smoothing, AdamW, cosine decay and mixed precision?**
"Label smoothing for calibration, AdamW for better regularisation, cosine decay for smooth fine-tuning, and mixed precision for faster training."

**18. What is TTA?**
"Averaging predictions over modified copies of the input at test time."

**19. How does the model behave on bad images?**
"Blurry or dark images lower confidence and often trigger the 'unclear result'. A dedicated out-of-distribution check is future work."

**20. What is data leakage? Could you have it?**
"Information from test data influencing training. We split before training and never tuned on the test set, but near-duplicate images in the public dataset are a possible risk."

**21. Why softmax and categorical cross-entropy?**
"Four mutually exclusive classes, so softmax gives a probability distribution and cross-entropy is the standard loss."

**22. Why a 0.70 threshold and how to calibrate it?**
"Conservative safety value. It could be calibrated using validation data and temperature scaling."

**23. How would you deploy the model?**
"As a FastAPI or TF Serving microservice, or convert to TFLite or ONNX for on-device inference."

**24. Why isn't the web fallback the CNN?**
"The fallback is for serverless reliability. It uses colour features. The CNN is used when the checkpoint is available. Hosting it is our next step."

**25. How to add a new disease?**
"Collect labelled images, retrain with the new class, add an entry in the treatment knowledge base and class list."

**26. Explainability?**
"We could use Grad-CAM to highlight the image regions behind a prediction, to build trust with vets and farmers."

## C. ML — Profit
**27. Problem type and target?**
"Regression. Target is batch profit in BDT."

**28. Features?**
"Initial and average chickens, age in months, feed in kg, feed price, egg and chicken market prices, mortality rate, feed per chicken, other cost per chicken, and breed (one-hot)."

**29. Why synthetic data and what are the risks?**
"Large real datasets are not available. The risk is that the model learns our assumptions, so we calibrated ranges from domain knowledge and plan to validate with real batches."

**30. Why HistGradientBoosting and how does boosting work?**
"Boosting builds many shallow trees sequentially, each correcting the previous errors. The histogram version is fast and handles non-linearity and missing values."

**31. What is cross-validation and R²?**
"Cross-validation trains and tests on different data folds to estimate generalisation; we used 5 folds. R² measures how much variance the model explains."

**32. Why use a Pipeline?**
"It applies imputation, scaling and encoding inside each fold, preventing leakage, and packages everything into one saved object."

**33. How does the Node formula relate to the Python model?**
"Both encode the same economics. The Node version is a fast approximation for the live app."

**34. What is FCR?**
"Feed Conversion Ratio: kg of feed per kg of weight gained. Lower is better. Broilers are typically about 1.45–1.85."

**35. How does mortality affect profit?**
"Fewer birds are sold, and costs are spread over fewer birds, so profit drops. We apply a penalty above 4 % for meat breeds."

**36. How would you add uncertainty?**
"Our batch schema already has low and high bounds. We could use quantile regression or bootstrap residuals."

**37. How would you retrain with real data and monitor drift?**
"Store batch-close outcomes, compare forecast with actual, and retrain periodically when error grows."

## D. Backend and database
**38. Walk through one request.**
"React sends an axios call with the JWT. Express runs auth middleware, then the controller and service logic, reads or writes MongoDB through Mongoose, and returns JSON."

**39. Main endpoints?**
"`/api/auth`, `/api/farms`, `/api/batches`, `/api/predict/disease`, `/api/weather`, `/api/products`, `/api/orders`, `/api/doctors`, `/api/admin`, `/api/health`."

**40. What is middleware?**
"A function that runs before the route handler, for example to verify the JWT and attach the user."

**41. How do you stop one farmer reading another's batch?**
"Every batch route checks that the batch's farm belongs to the logged-in user."

**42. Why disable command buffering?**
"So that when the DB is offline, queries fail instantly instead of hanging, and we can switch to the fallback."

**43. Which cron jobs?**
"Nightly at 00:05 Asia/Dhaka for task sync and status, and weather every 3 hours."

**44. Why Luxon and timezones?**
"So 'today', cutoffs and due dates are computed in the farm's local day, avoiding off-by-one errors around midnight."

**45. What is idempotency?**
"Running an operation many times gives the same result. We use it for task generation."

**46. What is hysteresis?**
"Requiring two consecutive safe readings before clearing an alert so the banner does not flicker on and off."

**47. How are lifecycle templates validated?**
"With Ajv against `schema.json` at startup; the server fails fast if a template is invalid."

**48. How do you secure uploads?**
"Type whitelist, 10 MB limit, and unique random filenames."

**49. Purpose of `/api/health`?**
"Quick check that the server is up and which feature flags are on."

**50. How would you add pagination and rate limiting?**
"Use limit/skip or cursor queries, and express-rate-limit middleware."

## E. Frontend
**51. Why SPA and react-query; how is auth state kept?**
"SPA for app-like feel; react-query for server-state caching; an `AuthContext` stores the token and user and provides language settings."

**52. How is language switching implemented?**
"Through the context with Bangla and English text sets. [Confirm in `AuthContext.jsx`.]"

**53. How are errors handled?**
"An `ErrorBoundary` component catches UI crashes, and API calls handle loading, error and empty states."

**54. Where does the status banner data come from?**
"From the backend status evaluator, which returns the status and list of reasons."

**55. How is responsiveness done?**
"Tailwind breakpoints with a mobile-first layout."

**56. How does the Vite proxy help?**
"In development it forwards `/api` and `/uploads` to port 3001, avoiding CORS issues."

## F. Weather and domain
**57. Why heat stress above 32 °C?**
"Chickens cannot sweat; above about 32 °C they pant, eat less and growth and egg production drop. Thresholds are tuned for Bangladesh and configurable."

**58. Why does high humidity cause ammonia problems?**
"Warm, humid conditions wet the litter, which boosts bacterial breakdown of uric acid and releases ammonia, harming respiratory health."

**59. Why is cold snap only for chicks up to 21 days?**
"Young chicks cannot regulate body temperature and need brooder warmth."

**60. What is heat index?**
"A feels-like temperature combining temperature and humidity, a better stress indicator than temperature alone."

**61. Why vaccinate on specific days?**
"Maternal antibodies fade and immunity must be built before the disease challenge. Our templates encode the schedule per breed."

**62. Describe the three diseases.**
"Coccidiosis: bloody droppings from Eimeria parasites, treated with anticoccidials. Salmonella (Pullorum / Fowl typhoid): white or yellow watery droppings, treated with antibiotics and isolation. Newcastle disease: green watery droppings, twisted neck and respiratory distress, a viral disease with no cure, prevented by vaccination."

**63. What is an antibiotic withdrawal period?**
"The time after treatment before meat or eggs may be sold, so drug residues are safe. We show a 5–7 day note."

## G. Engineering practice
**64. How is the project organised?**
"A monorepo: `app/backend`, `app/frontend`, and `ml` for training and inference scripts."

**65. Git and contributions?**
"We used Git; the split is documented in `CONTRIBUTIONS.md`."

**66. Testing strategy?**
"Unit tests for pure logic such as heat index, weather and task generation, using injectable clocks."

**67. How do you manage secrets?**
"Environment variables in `.env`, with `.env.example` committed; we should rotate credentials and never commit real secrets."

**68. How is it deployed?**
"Locally with `npm run dev` or `run-agrimind.bat`; in the cloud through Vercel serverless (`api/index.js`) or Render."

**69. Scalability, monitoring and logging plan?**
"Stateless API, Atlas scaling, caching; add structured logging and monitoring such as Sentry or Atlas alerts."

## H. Business, ethics, future
**70. Cost and monetisation?**
"Free core for farmers; marketplace commission, consultation fees and premium analytics."

**71. How to get farmers to adopt it?**
"Bangla interface, simple check-in, training through extension officers and local dealers."

**72. Liability if the AI is wrong?**
"We provide advisory results with disclaimers, confidence gating and vet referral, never a prescription."

**73. Data ownership and privacy?**
"The farmer owns their farm data; we store minimal personal data and hash passwords."

**74. Future roadmap?**
"Hosted model, real-data retraining, SMS OTP and alerts, PWA offline, Bangla voice input, optional sensors, more diseases, payments."

**75. Can it extend to other livestock?**
"Yes, by adding new lifecycle templates, disease classes and profit parameters; the architecture is template-driven."

**76. Why Bangladesh?**
"Large poultry sector, many smallholders, high mobile penetration, and limited veterinary access."

## I. Pressure questions
**77. "Is your CNN actually running in the app?"**
"The CNN is trained and evaluated in Colab. The app uses the Keras checkpoint when present, and otherwise a lightweight fallback for serverless reliability. Deploying the model service is our next milestone."

**78. "Is your profit data real?"**
"Mostly synthetic and domain-calibrated, with a small real sample. We plan validation with real batch outcomes."

**79. "Why is confidence always 82–96 %?"**
"In the fallback engine, confidence is clamped to a band for user experience. It is not a statistical probability. The CNN's confidence is the raw softmax value. We acknowledge that this should be calibrated properly."

**80. "Can I trust the treatment advice?"**
"It is guidance from a curated knowledge base, listed by active ingredient, with vet-referral flags and disclaimers. It is not a prescription."

**81. "What if two diseases occur together?"**
"Our classifier is single-label. Multi-label classification is future work."

**82. "What is your contribution compared to a tutorial?"**
"The integration and domain logic: the lifecycle engine with mid-cycle handling, the seven-rule status evaluator, weather alerts with hysteresis, the treatment-to-marketplace cross-link, the calibrated profit pipeline, and a resilient architecture for Bangladesh."

---

## Final Checklist Before the Viva
- [ ] Fill every **[bracket]**: Colab accuracy, F1, confusion matrix, dataset size, your own contribution, what MTR-01 means.
- [ ] Decide your wording for Section 0 items 1, 2, 3, 6.
- [ ] Practise each speech aloud with a timer (target 60–90 s each, about 8–10 minutes total).
- [ ] Rehearse the demo: register → farm → batch → check-in → upload image → profit → marketplace.
- [ ] Read `CONTRIBUTIONS.md`.
- [ ] Don't show `.env` (it contains the DB password). Consider rotating the MongoDB password.
- [ ] Keep a backup demo video in case Wi-Fi or MongoDB fails.
