"""
=============================================================================
# Script: train_poultry_profit_model.py
# Purpose: Fast & accurate domain-calibrated Poultry Profit Machine Learning
#          Pipeline capable of handling all poultry breeds (Broiler, Layer,
#          Sonali, Desi, Cock), meat vs egg dynamics, zero-egg cases, and
#          operational variance.
=============================================================================
"""

import numpy as np
import pandas as pd
import joblib
import os
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.model_selection import KFold
from sklearn.metrics import mean_absolute_error, r2_score, mean_squared_error

def generate_poultry_dataset(n_samples=10000, random_seed=42):
    np.random.seed(random_seed)
    
    chicken_types = np.random.choice(['Broiler', 'Layer', 'Sonali', 'Desi', 'Cock'], size=n_samples, p=[0.35, 0.25, 0.20, 0.10, 0.10])
    
    initial_chickens = []
    average_chickens = []
    age_months = []
    feed_kg = []
    feed_price_per_kg = np.random.uniform(45.0, 65.0, size=n_samples)
    average_market_egg_price = []
    average_market_chicken_price = []
    mortality = []
    medicine_cost = []
    vaccination_cost = []
    labor_cost = []
    electricity_cost = []
    water_cost = []
    transport_cost = []
    other_cost = []
    profit = []

    for i in range(n_samples):
        ctype = chicken_types[i]
        
        if ctype == 'Broiler':
            init_c = int(np.random.choice([500, 1000, 1500, 2000, 3000, 5000, 8000, 10000]) * np.random.uniform(0.8, 1.2))
            init_c = max(100, init_c)
            age = np.random.uniform(1.2, 2.2) # ~35-65 days
            mort_rate = np.random.uniform(0.02, 0.08)
            mort = int(init_c * mort_rate)
            avg_c = max(1, init_c - mort // 2)
            
            # FCR 1.45 to 1.85, market weight 1.7 to 2.4 kg
            avg_wt = np.random.uniform(1.7, 2.4)
            fcr = np.random.uniform(1.45, 1.85)
            feed = avg_c * avg_wt * fcr
            chick_price = np.random.uniform(160.0, 230.0)
            egg_p = 0.0
            
            med = avg_c * np.random.uniform(5.0, 10.0)
            vac = avg_c * np.random.uniform(3.0, 5.0)
            lab = avg_c * np.random.uniform(10.0, 18.0)
            elec = avg_c * np.random.uniform(4.0, 7.0)
            wat = avg_c * np.random.uniform(1.0, 2.5)
            trans = avg_c * np.random.uniform(4.0, 7.0)
            oth = avg_c * np.random.uniform(2.0, 4.0)
            
            chick_sold = init_c - mort
            chick_rev = chick_sold * avg_wt * chick_price
            egg_rev = 0.0

        elif ctype == 'Layer':
            init_c = int(np.random.choice([500, 1000, 2000, 3000, 5000, 10000, 15000]) * np.random.uniform(0.8, 1.2))
            init_c = max(100, init_c)
            age = np.random.uniform(6.0, 18.0) # 6 to 18 months
            mort_rate = np.random.uniform(0.04, 0.12)
            mort = int(init_c * mort_rate)
            avg_c = max(1, init_c - mort // 2)
            
            daily_feed_g = np.random.uniform(105, 125)
            feed = avg_c * (daily_feed_g / 1000.0) * (age * 30)
            chick_price = np.random.uniform(120.0, 170.0)
            egg_p = np.random.uniform(10.5, 14.0)
            
            med = avg_c * np.random.uniform(2.0, 4.0) * age
            vac = avg_c * np.random.uniform(1.0, 2.0) * age
            lab = avg_c * np.random.uniform(3.0, 6.0) * age
            elec = avg_c * np.random.uniform(1.5, 3.5) * age
            wat = avg_c * np.random.uniform(0.5, 1.5) * age
            trans = avg_c * np.random.uniform(1.0, 2.5) * age
            oth = avg_c * np.random.uniform(1.0, 2.0) * age
            
            # Lay rate 75-90%
            lay_rate = np.random.uniform(0.75, 0.90)
            eggs_prod = avg_c * lay_rate * (age * 30)
            egg_rev = eggs_prod * egg_p
            
            spent_hen_wt = np.random.uniform(1.5, 1.9)
            chick_rev = (init_c - mort) * spent_hen_wt * chick_price * (1.0 if age >= 16 else 0.05)

        elif ctype == 'Sonali':
            init_c = int(np.random.choice([500, 1000, 2000, 3000, 5000, 8000]) * np.random.uniform(0.8, 1.2))
            init_c = max(100, init_c)
            age = np.random.uniform(2.2, 3.5)
            mort_rate = np.random.uniform(0.03, 0.09)
            mort = int(init_c * mort_rate)
            avg_c = max(1, init_c - mort // 2)
            
            avg_wt = np.random.uniform(0.85, 1.25)
            fcr = np.random.uniform(2.2, 2.8)
            feed = avg_c * avg_wt * fcr
            chick_price = np.random.uniform(270.0, 360.0)
            egg_p = 0.0
            
            med = avg_c * np.random.uniform(8.0, 14.0)
            vac = avg_c * np.random.uniform(4.0, 7.0)
            lab = avg_c * np.random.uniform(12.0, 20.0)
            elec = avg_c * np.random.uniform(5.0, 9.0)
            wat = avg_c * np.random.uniform(1.5, 3.5)
            trans = avg_c * np.random.uniform(5.0, 8.0)
            oth = avg_c * np.random.uniform(2.0, 5.0)
            
            chick_sold = init_c - mort
            chick_rev = chick_sold * avg_wt * chick_price
            egg_rev = 0.0

        else: # Desi / Cock
            init_c = int(np.random.choice([300, 500, 1000, 2000, 4000]) * np.random.uniform(0.8, 1.2))
            init_c = max(100, init_c)
            age = np.random.uniform(2.8, 5.0)
            mort_rate = np.random.uniform(0.04, 0.10)
            mort = int(init_c * mort_rate)
            avg_c = max(1, init_c - mort // 2)
            
            avg_wt = np.random.uniform(1.0, 1.5)
            fcr = np.random.uniform(2.5, 3.2)
            feed = avg_c * avg_wt * fcr
            chick_price = np.random.uniform(300.0, 440.0)
            egg_p = 0.0
            
            med = avg_c * np.random.uniform(6.0, 12.0)
            vac = avg_c * np.random.uniform(3.0, 6.0)
            lab = avg_c * np.random.uniform(14.0, 22.0)
            elec = avg_c * np.random.uniform(4.0, 7.0)
            wat = avg_c * np.random.uniform(1.0, 2.5)
            trans = avg_c * np.random.uniform(5.0, 9.0)
            oth = avg_c * np.random.uniform(2.0, 4.0)
            
            chick_sold = init_c - mort
            chick_rev = chick_sold * avg_wt * chick_price
            egg_rev = 0.0

        feed_c = feed * feed_price_per_kg[i]
        non_feed = med + vac + lab + elec + wat + trans + oth
        tot_cost = feed_c + non_feed
        tot_rev = egg_rev + chick_rev
        
        # Add small biological and market variance (+/- 2%)
        noise = np.random.normal(0, 0.02 * (tot_rev + 1000))
        p = tot_rev - tot_cost + noise
        
        initial_chickens.append(init_c)
        average_chickens.append(avg_c)
        age_months.append(round(age, 2))
        feed_kg.append(round(feed, 1))
        average_market_egg_price.append(round(egg_p, 2))
        average_market_chicken_price.append(round(chick_price, 2))
        mortality.append(mort)
        medicine_cost.append(round(med, 2))
        vaccination_cost.append(round(vac, 2))
        labor_cost.append(round(lab, 2))
        electricity_cost.append(round(elec, 2))
        water_cost.append(round(wat, 2))
        transport_cost.append(round(trans, 2))
        other_cost.append(round(oth, 2))
        profit.append(round(p, 2))

    df = pd.DataFrame({
        'chicken_type': chicken_types,
        'initial_chickens': initial_chickens,
        'average_chickens': average_chickens,
        'age_months': age_months,
        'feed_kg': feed_kg,
        'feed_price_per_kg': feed_price_per_kg,
        'average_market_egg_price': average_market_egg_price,
        'average_market_chicken_price': average_market_chicken_price,
        'mortality_rate': np.array(mortality) / (np.array(initial_chickens) + 1e-9),
        'feed_consumption_per_chicken': np.array(feed_kg) / (np.array(average_chickens) + 1e-9),
        'other_operating_cost_per_chicken': (np.array(medicine_cost) + np.array(vaccination_cost) + np.array(labor_cost) + np.array(electricity_cost) + np.array(water_cost) + np.array(transport_cost) + np.array(other_cost)) / (np.array(average_chickens) + 1e-9),
        'profit': profit
    })
    
    return df

def train_and_save_model():
    print("Generating calibrated poultry economics dataset (10,000 samples)...", flush=True)
    df = generate_poultry_dataset(n_samples=10000)
    
    numeric_features = [
        'initial_chickens', 'average_chickens', 'age_months',
        'feed_kg', 'feed_price_per_kg', 'average_market_egg_price',
        'average_market_chicken_price', 'mortality_rate',
        'feed_consumption_per_chicken', 'other_operating_cost_per_chicken'
    ]
    categorical_features = ['chicken_type']
    allowed_types = ['Sonali', 'Broiler', 'Desi', 'Cock', 'Layer']
    
    X = df[numeric_features + categorical_features]
    y = df['profit']
    
    num_pipe = Pipeline([
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])
    cat_pipe = Pipeline([
        ('imputer', SimpleImputer(strategy='most_frequent')),
        ('onehot', OneHotEncoder(categories=[allowed_types], handle_unknown='ignore'))
    ])
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', num_pipe, numeric_features),
            ('cat', cat_pipe, categorical_features)
        ]
    )
    
    # HistGradientBoostingRegressor: blazingly fast (<1 sec) & handles non-linear boundaries smoothly
    model = HistGradientBoostingRegressor(
        max_iter=150,
        learning_rate=0.1,
        max_depth=6,
        random_state=42
    )
    
    full_pipeline = Pipeline([
        ('preprocessor', preprocessor),
        ('model', model)
    ])
    
    print("Evaluating 5-Fold Cross Validation...", flush=True)
    kf = KFold(n_splits=5, shuffle=True, random_state=42)
    scores_r2, scores_mae, scores_rmse = [], [], []
    
    for train_idx, val_idx in kf.split(X, y):
        X_train, X_val = X.iloc[train_idx], X.iloc[val_idx]
        y_train, y_val = y.iloc[train_idx], y.iloc[val_idx]
        
        full_pipeline.fit(X_train, y_train)
        preds = full_pipeline.predict(X_val)
        
        scores_r2.append(r2_score(y_val, preds))
        scores_mae.append(mean_absolute_error(y_val, preds))
        scores_rmse.append(np.sqrt(mean_squared_error(y_val, preds)))
        
    print(f"Mean CV R2   : {np.mean(scores_r2):.4f}", flush=True)
    print(f"Mean CV MAE  : {np.mean(scores_mae):,.2f} BDT", flush=True)
    print(f"Mean CV RMSE : {np.mean(scores_rmse):,.2f} BDT", flush=True)
    
    print("\nFitting final pipeline on full dataset...", flush=True)
    full_pipeline.fit(X, y)
    
    # Verify on User's Demo Broiler Batch
    demo_input = pd.DataFrame([{
        'chicken_type': 'Broiler',
        'initial_chickens': 2000,
        'average_chickens': 1900,
        'age_months': 2.0,
        'feed_kg': 6000,
        'feed_price_per_kg': 55.0,
        'average_market_egg_price': 0.0,
        'average_market_chicken_price': 200.0,
        'mortality_rate': 100 / 2000,
        'feed_consumption_per_chicken': 6000 / 1900,
        'other_operating_cost_per_chicken': 82000 / 1900
    }])
    
    demo_pred = full_pipeline.predict(demo_input)[0]
    print("\n" + "="*50, flush=True)
    print(f"USER DEMO TEST (Broiler 2000 birds, 6000kg feed, egg_price=0):", flush=True)
    print(f"Predicted Profit : {demo_pred:,.2f} BDT", flush=True)
    print(f"Expected Range   : ~350,000 - 415,000 BDT", flush=True)
    print("="*50 + "\n", flush=True)
    
    # Save model to target directories
    save_targets = [
        r"c:\Users\LENOVO\OneDrive\Documents\ML_Project\agrimind-merged\ml\models\poultry_profit_model.pkl",
        r"c:\Users\LENOVO\OneDrive\Documents\ML_Project\poultry_profit_model (2).pkl"
    ]
    
    for path in save_targets:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        joblib.dump(full_pipeline, path)
        print(f"Successfully saved trained model to: {path}", flush=True)

if __name__ == '__main__':
    train_and_save_model()
