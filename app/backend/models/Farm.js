/**
 * =============================================================================
 * Module: Poultry Farm Model Schema
 * Authorship: Machine Learning & Farm Intelligence Team (ML_Project)
 * Component: /app/backend/models/Farm.js
 * Description: Schema for poultry farms, flock specs, operational overhead,
 *              and automated ML profit prediction results.
 * =============================================================================
 */

const mongoose = require('mongoose');

const FarmSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    farmName: {
      type: String,
      required: true,
      trim: true
    },
    ownerName: {
      type: String,
      required: true,
      trim: true
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true
    },
    country: {
      type: String,
      required: true,
      trim: true,
      default: 'Bangladesh'
    },
    city: {
      type: String,
      required: true,
      trim: true,
      default: 'Dhaka'
    },
    chickenType: {
      type: String,
      enum: ['Sonali', 'Broiler', 'Desi', 'Cock', 'Layer'],
      default: 'Broiler'
    },
    initialChickens: {
      type: Number,
      default: 1700
    },
    averageChickens: {
      type: Number,
      default: 1650
    },
    ageMonths: {
      type: Number,
      default: 2
    },
    feedKg: {
      type: Number,
      default: 5500
    },
    mortality: {
      type: Number,
      default: 50
    },
    feedPricePerKg: {
      type: Number,
      default: 53.25
    },
    averageMarketEggPrice: {
      type: Number,
      default: 11.8
    },
    averageMarketChickenPrice: {
      type: Number,
      default: 195.0
    },
    medicineCost: {
      type: Number,
      default: 30000
    },
    vaccinationCost: {
      type: Number,
      default: 12000
    },
    laborCost: {
      type: Number,
      default: 48000
    },
    electricityCost: {
      type: Number,
      default: 21000
    },
    waterCost: {
      type: Number,
      default: 6000
    },
    transportCost: {
      type: Number,
      default: 15000
    },
    otherCost: {
      type: Number,
      default: 9000
    },
    eggsProduced: {
      type: Number,
      default: 0
    },
    brokenEggs: {
      type: Number,
      default: 0
    },
    eggsSold: {
      type: Number,
      default: 0
    },
    brokenEggPrice: {
      type: Number,
      default: 0
    },
    chickensSold: {
      type: Number,
      default: 1550
    },
    averageWeightKg: {
      type: Number,
      default: 2.2
    },
    chickenPricePerKg: {
      type: Number,
      default: 195.0
    },
    eggPrice: {
      type: Number,
      default: 11.8
    },
    profitResult: {
      type: Object,
      default: null
    },
    totalChickens: {
      type: Number,
      default: function() {
        return this.initialChickens || 1700;
      }
    },
    location: {
      type: String,
      default: function() {
        return `${this.city || 'Dhaka'}, ${this.country || 'Bangladesh'}`;
      }
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Farm', FarmSchema);
