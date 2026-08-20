"""
=============================================================================
# Module: Machine Learning Profit Estimation Pipeline
# Authorship: Machine Learning Engineering Team (ML_Project)
# Component: /ml/pipelines/calc_profit.py
# Description: Automated Lasso Regression model evaluation and cost breakdown
#              arithmetic for poultry farm financial intelligence.
=============================================================================
"""

import sys
import json
import os
import joblib
import pandas as pd
import numpy as np

def calculate_profit(data):
    try:
        # Extract inputs with defaults
        chicken_type = str(data.get("chicken_type", "Broiler")).strip()
        initial_chickens = float(data.get("initial_chickens", 1700))
        average_chickens = float(data.get("average_chickens", 1650))
        age_months = float(data.get("age_months", 2))
        feed_kg = float(data.get("feed_kg", 5500))
        feed_price_per_kg = float(data.get("feed_price_per_kg", 53.25))
        average_market_egg_price = float(data.get("average_market_egg_price", 11.8))
        average_market_chicken_price = float(data.get("average_market_chicken_price", 195.0))
        mortality = float(data.get("mortality", 50))
        
        # Operating costs
        medicine_cost = float(data.get("medicine_cost", 30000))
        vaccination_cost = float(data.get("vaccination_cost", 12000))
        labor_cost = float(data.get("labor_cost", 48000))
        electricity_cost = float(data.get("electricity_cost", 21000))
        water_cost = float(data.get("water_cost", 6000))
        transport_cost = float(data.get("transport_cost", 15000))
        other_cost = float(data.get("other_cost", 9000))
        
        non_feed_cost = medicine_cost + vaccination_cost + labor_cost + electricity_cost + water_cost + transport_cost + other_cost
        feed_cost = feed_kg * feed_price_per_kg
        total_cost = feed_cost + non_feed_cost

        # Revenues
        eggs_produced = float(data.get("eggs_produced", 0))
        egg_price = float(data.get("egg_price", average_market_egg_price))
        chickens_sold = float(data.get("chickens_sold", average_chickens))
        average_weight_kg = float(data.get("average_weight_kg", 2.2))
        chicken_price_per_kg = float(data.get("chicken_price_per_kg", average_market_chicken_price))
        
        egg_revenue = eggs_produced * egg_price
        chicken_revenue = chickens_sold * average_weight_kg * chicken_price_per_kg
        total_revenue = egg_revenue + chicken_revenue
        actual_profit = total_revenue - total_cost

        # Feature engineering matching training pipeline
        eps = 1e-9
        mortality_rate = mortality / (initial_chickens + eps)
        feed_consumption_per_chicken = feed_kg / (average_chickens + eps)
        other_operating_cost_per_chicken = non_feed_cost / (average_chickens + eps)

        features_df = pd.DataFrame([{
            "chicken_type": chicken_type,
            "initial_chickens": initial_chickens,
            "average_chickens": average_chickens,
            "age_months": age_months,
            "feed_kg": feed_kg,
            "feed_price_per_kg": feed_price_per_kg,
            "average_market_egg_price": average_market_egg_price,
            "average_market_chicken_price": average_market_chicken_price,
            "mortality_rate": mortality_rate,
            "feed_consumption_per_chicken": feed_consumption_per_chicken,
            "other_operating_cost_per_chicken": other_operating_cost_per_chicken
        }], columns=[
            "chicken_type",
            "initial_chickens",
            "average_chickens",
            "age_months",
            "feed_kg",
            "feed_price_per_kg",
            "average_market_egg_price",
            "average_market_chicken_price",
            "mortality_rate",
            "feed_consumption_per_chicken",
            "other_operating_cost_per_chicken"
        ])

        # Model location resolver
        script_dir = os.path.dirname(os.path.abspath(__file__))
        possible_paths = [
            os.path.join(script_dir, '..', 'models', 'poultry_profit_model.pkl'),
            os.path.join(script_dir, '..', 'models', 'poultry_profit_model (2).pkl'),
            os.path.join(script_dir, 'poultry_profit_model.pkl'),
            'poultry_profit_model.pkl'
        ]
        model_path = None
        for p in possible_paths:
            if os.path.exists(p):
                model_path = p
                break

        if not model_path:
            return {
                "success": True,
                "used_ml_model": False,
                "predicted_profit": round(float(actual_profit), 2),
                "actual_calculated_profit": round(float(actual_profit), 2),
                "breakdown": {
                    "total_revenue": round(total_revenue, 2),
                    "total_cost": round(total_cost, 2),
                    "feed_cost": round(feed_cost, 2),
                    "non_feed_cost": round(non_feed_cost, 2),
                    "egg_revenue": round(egg_revenue, 2),
                    "chicken_revenue": round(chicken_revenue, 2),
                    "mortality_rate_percent": round(mortality_rate * 100, 2),
                    "feed_per_chicken_kg": round(feed_consumption_per_chicken, 2),
                    "other_cost_per_chicken": round(other_operating_cost_per_chicken, 2)
                }
            }

        model = joblib.load(model_path)
        pred = model.predict(features_df)
        predicted_profit = float(pred[0])

        return {
            "success": True,
            "used_ml_model": True,
            "predicted_profit": round(predicted_profit, 2),
            "actual_calculated_profit": round(actual_profit, 2),
            "breakdown": {
                "total_revenue": round(total_revenue, 2),
                "total_cost": round(total_cost, 2),
                "feed_cost": round(feed_cost, 2),
                "non_feed_cost": round(non_feed_cost, 2),
                "egg_revenue": round(egg_revenue, 2),
                "chicken_revenue": round(chicken_revenue, 2),
                "mortality_rate_percent": round(mortality_rate * 100, 2),
                "feed_per_chicken_kg": round(feed_consumption_per_chicken, 2),
                "other_cost_per_chicken": round(other_operating_cost_per_chicken, 2)
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": "PREDICTION_ERROR",
            "message": str(e)
        }


if __name__ == '__main__':
    if len(sys.argv) > 1:
        try:
            payload = json.loads(sys.argv[1])
            res = calculate_profit(payload)
            print(json.dumps(res))
        except Exception as err:
            print(json.dumps({'success': False, 'error': str(err)}))
    else:
        res = calculate_profit({})
        print(json.dumps(res, indent=2))
