"""
=============================================================================
# Module: Machine Learning Profit Estimation Pipeline
# Authorship: Machine Learning Engineering Team (ML_Project)
# Component: /ml/pipelines/calc_profit.py
# Description: Automated Gradient Boosting Regression model evaluation with
#              partial-cycle projection wrapper for rolling lifecycle forecasting.
=============================================================================
"""

import sys
import json
import os
import joblib
import pandas as pd
import numpy as np

# Standard average harvest weights by breed (in kg)
BREED_DEFAULT_WEIGHTS = {
    "Broiler": 2.1,
    "Sonali": 1.05,
    "Desi": 1.25,
    "Cock": 1.15,
    "Layer": 1.65
}

BREED_CYCLE_DAYS = {
    "Broiler": 35,
    "Sonali": 70,
    "Desi": 84,
    "Cock": 60,
    "Layer": 365
}

def calculate_profit(data):
    try:
        # Extract inputs with defaults
        chicken_type = str(data.get("chicken_type", data.get("chickenType", "Broiler"))).strip()
        cycle_length_days = float(data.get("cycle_length_days", data.get("cycleLengthDays", BREED_CYCLE_DAYS.get(chicken_type, 35))))
        initial_chickens = float(data.get("initial_chickens", data.get("initialChickens", 1700)))

        # Check for partial-cycle telemetry from daily check-ins
        current_age_days = float(data.get("current_age_days", data.get("currentAge", data.get("currentAgeDays", 0))))
        cumulative_feed_kg = float(data.get("cumulative_feed_kg", data.get("cumulativeFeedKg", 0)))
        cumulative_mortality = float(data.get("cumulative_mortality", data.get("cumulativeMortality", 0)))
        live_birds = float(data.get("live_birds", data.get("liveBirds", max(0, initial_chickens - cumulative_mortality))))

        is_partial_cycle = current_age_days > 0 and current_age_days < cycle_length_days
        projection_metadata = None

        if is_partial_cycle:
            # ─── Projection Wrapper: Partial-to-End-of-Cycle Extrapolation ───
            days_elapsed = max(1.0, current_age_days)
            days_remaining = max(0.0, cycle_length_days - current_age_days)
            avg_live_so_far = max(1.0, (initial_chickens + live_birds) / 2.0)

            # Daily rate per bird
            if cumulative_feed_kg > 0:
                daily_feed_per_bird = cumulative_feed_kg / (days_elapsed * avg_live_so_far)
            else:
                daily_feed_per_bird = 0.12 if chicken_type == "Broiler" else 0.055

            daily_mortality_rate = cumulative_mortality / days_elapsed

            projected_additional_feed = daily_feed_per_bird * live_birds * days_remaining
            projected_total_feed = cumulative_feed_kg + projected_additional_feed
            projected_total_mortality = min(initial_chickens * 0.5, cumulative_mortality + (daily_mortality_rate * days_remaining))
            projected_average_chickens = max(1.0, initial_chickens - (projected_total_mortality / 2.0))
            projected_age_months = max(1.0, cycle_length_days / 30.0)

            feed_kg = projected_total_feed
            mortality = projected_total_mortality
            average_chickens = projected_average_chickens
            age_months = projected_age_months

            projection_metadata = {
                "is_projected": True,
                "current_age_days": current_age_days,
                "cycle_length_days": cycle_length_days,
                "days_remaining": days_remaining,
                "projected_total_feed_kg": round(projected_total_feed, 1),
                "projected_total_mortality": round(projected_total_mortality, 1)
            }
        else:
            mortality = float(data.get("mortality", data.get("cumulativeMortality", 50)))
            average_chickens = float(data.get("average_chickens", initial_chickens - mortality / 2.0))
            age_months = float(data.get("age_months", (cycle_length_days / 30.0)))
            feed_kg = float(data.get("feed_kg", data.get("cumulativeFeedKg", 5500)))

        feed_price_per_kg = float(data.get("feed_price_per_kg", data.get("feedCostPerKg", 53.25)))
        average_market_egg_price = float(data.get("average_market_egg_price", 11.8 if chicken_type == "Layer" else 0.0))
        average_market_chicken_price = float(data.get("average_market_chicken_price", data.get("expectedSalePricePerKg", 195.0)))
        
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

        # Breed-aware harvest weight and egg logic
        default_weight = BREED_DEFAULT_WEIGHTS.get(chicken_type, 2.0)
        average_weight_kg = float(data.get("average_weight_kg", data.get("targetHarvestWeightKg", default_weight)))
        chicken_price_per_kg = float(data.get("chicken_price_per_kg", average_market_chicken_price))
        chickens_sold = float(data.get("chickens_sold", max(0, initial_chickens - mortality)))
        
        # Egg revenue calculation
        egg_price = float(data.get("eggPrice") or data.get("egg_price") or data.get("averageMarketEggPrice") or data.get("average_market_egg_price") or 12.0)
        broken_egg_price = float(data.get("brokenEggPrice") or data.get("broken_egg_price") or 0.0)
        eggs_produced = 0.0
        
        if "eggsProduced" in data and float(data["eggsProduced"]) > 0:
            eggs_produced = float(data["eggsProduced"])
        elif "eggs_produced" in data and float(data["eggs_produced"]) > 0:
            eggs_produced = float(data["eggs_produced"])
        elif "totalEggs" in data and float(data["totalEggs"]) > 0:
            eggs_produced = float(data["totalEggs"])
        elif chicken_type == "Layer":
            lay_days = max(1.0, (age_months - 4.5) * 30 if age_months > 4.5 else age_months * 30)
            eggs_produced = average_chickens * 0.80 * lay_days

        broken_eggs = 0.0
        if "brokenEggs" in data and data["brokenEggs"] is not None and str(data["brokenEggs"]) != '':
            broken_eggs = float(data["brokenEggs"])
        elif "broken_eggs" in data and data["broken_eggs"] is not None and str(data["broken_eggs"]) != '':
            broken_eggs = float(data["broken_eggs"])
        elif eggs_produced > 0:
            broken_eggs = round(eggs_produced * 0.025)

        eggs_sold = 0.0
        if "eggsSold" in data and data["eggsSold"] is not None and str(data["eggsSold"]) != '':
            eggs_sold = float(data["eggsSold"])
        elif "eggs_sold" in data and data["eggs_sold"] is not None and str(data["eggs_sold"]) != '':
            eggs_sold = float(data["eggs_sold"])
        else:
            eggs_sold = max(0.0, eggs_produced - broken_eggs)

        egg_revenue = round((eggs_sold * egg_price) + (broken_eggs * broken_egg_price), 2)
        broken_egg_loss = round(broken_eggs * max(0.0, egg_price - broken_egg_price), 2)
        eps = 1e-9
        breakage_rate_percent = round((broken_eggs / (eggs_produced + eps)) * 100, 2) if eggs_produced > 0 else 0.0
        
        if chicken_type == "Layer":
            salvage_factor = 1.0 if age_months >= 14 else (0.35 if age_months >= 8 else 0.05)
            chicken_revenue = chickens_sold * average_weight_kg * chicken_price_per_kg * salvage_factor
        else:
            chicken_revenue = chickens_sold * average_weight_kg * chicken_price_per_kg

        total_revenue = round(egg_revenue + chicken_revenue, 2)
        actual_profit = round(total_revenue - total_cost, 2)

        # Feature engineering matching training pipeline
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
            os.path.join(script_dir, '..', '..', 'ml', 'models', 'poultry_profit_model.pkl'),
            os.path.join(script_dir, '..', '..', 'poultry_profit_model (2).pkl'),
            os.path.join(script_dir, 'poultry_profit_model.pkl'),
            'poultry_profit_model.pkl'
        ]
        model_path = None
        for p in possible_paths:
            if os.path.exists(p):
                model_path = p
                break

        active_days = max(1.0, age_months * 30)
        daily_eggs = round(eggs_produced / active_days)
        calculated_lay_rate = round((daily_eggs / (average_chickens + eps)) * 100, 2) if average_chickens > 0 else 0.0

        if not model_path:
            profit_est = round(float(actual_profit), 2)
            return {
                "success": True,
                "used_ml_model": False,
                "predicted_profit": profit_est,
                "predictedProfit": profit_est,
                "low": round(profit_est * 0.85, 2),
                "high": round(profit_est * 1.15, 2),
                "isStale": False,
                "is_stale": False,
                "projection": projection_metadata,
                "actual_calculated_profit": profit_est,
                "breakdown": {
                    "total_revenue": round(total_revenue, 2),
                    "total_cost": round(total_cost, 2),
                    "feed_cost": round(feed_cost, 2),
                    "non_feed_cost": round(non_feed_cost, 2),
                    "egg_revenue": round(egg_revenue, 2),
                    "chicken_revenue": round(chicken_revenue, 2),
                    "eggs_produced": round(eggs_produced),
                    "eggs_sold": round(eggs_sold),
                    "broken_eggs": round(broken_eggs),
                    "broken_egg_loss": round(broken_egg_loss, 2),
                    "breakage_rate_percent": breakage_rate_percent,
                    "egg_price": round(egg_price, 2),
                    "daily_eggs": daily_eggs,
                    "lay_rate_percent": calculated_lay_rate,
                    "average_weight_kg": round(average_weight_kg, 2),
                    "mortality_rate_percent": round(mortality_rate * 100, 2),
                    "feed_per_chicken_kg": round(feed_consumption_per_chicken, 2),
                    "other_cost_per_chicken": round(other_operating_cost_per_chicken, 2)
                }
            }

        model = joblib.load(model_path)
        pred = model.predict(features_df)
        predicted_profit = float(pred[0])
        profit_final = round(predicted_profit, 2)

        return {
            "success": True,
            "used_ml_model": True,
            "predicted_profit": profit_final,
            "predictedProfit": profit_final,
            "low": round(profit_final * 0.85, 2),
            "high": round(profit_final * 1.15, 2),
            "isStale": False,
            "is_stale": False,
            "projection": projection_metadata,
            "actual_calculated_profit": round(actual_profit, 2),
            "breakdown": {
                "total_revenue": round(total_revenue, 2),
                "total_cost": round(total_cost, 2),
                "feed_cost": round(feed_cost, 2),
                "non_feed_cost": round(non_feed_cost, 2),
                "egg_revenue": round(egg_revenue, 2),
                "chicken_revenue": round(chicken_revenue, 2),
                "eggs_produced": round(eggs_produced),
                "eggs_sold": round(eggs_sold),
                "broken_eggs": round(broken_eggs),
                "broken_egg_loss": round(broken_egg_loss, 2),
                "breakage_rate_percent": breakage_rate_percent,
                "egg_price": round(egg_price, 2),
                "daily_eggs": daily_eggs,
                "lay_rate_percent": calculated_lay_rate,
                "average_weight_kg": round(average_weight_kg, 2),
                "mortality_rate_percent": round(mortality_rate * 100, 2),
                "feed_per_chicken_kg": round(feed_consumption_per_chicken, 2),
                "other_cost_per_chicken": round(other_operating_cost_per_chicken, 2)
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": "PREDICTION_ERROR",
            "message": str(e),
            "isStale": True,
            "is_stale": True
        }

if __name__ == '__main__':
    if len(sys.argv) > 1:
        try:
            payload = json.loads(sys.argv[1])
            res = calculate_profit(payload)
            print(json.dumps(res))
        except Exception as err:
            print(json.dumps({'success': False, 'error': str(err), 'isStale': True}))
    else:
        res = calculate_profit({})
        print(json.dumps(res, indent=2))
