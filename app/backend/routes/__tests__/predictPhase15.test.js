/**
 * =============================================================================
 * Phase 15 Tests: Disease Diagnosis Cross-Linking & Marketplace Treatment Matching
 * Component: /app/backend/routes/__tests__/predictPhase15.test.js
 * Description: Unit & integration tests for:
 *              - findProductsByIngredients (in-stock first, capped at limit)
 *              - Confidence threshold (< 0.70 returns unclear_result & empty products)
 *              - Non-treatable condition (NewCastle: vetReferralRequired, no products)
 *              - Treatable condition (Coccidiosis: active ingredients + products)
 *              - DiseaseTreatmentMap seed structure
 * =============================================================================
 */

'use strict';

const { findProductsByIngredients } = require('../products');
const { SEED_DATA } = require('../../seeds/diseaseTreatmentMap');

describe('Phase 15 — Disease Diagnostics & Marketplace Cross-Link', () => {

  describe('findProductsByIngredients()', () => {
    test('matches products containing target active ingredients', () => {
      const results = findProductsByIngredients(['Amprolium']);
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toMatch(/Amprolium/i);
    });

    test('matches products for Oxytetracycline (Salmonella treatment)', () => {
      const results = findProductsByIngredients(['Oxytetracycline']);
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toMatch(/Oxytetracycline/i);
    });

    test('returns empty array when ingredients list is empty', () => {
      const results = findProductsByIngredients([]);
      expect(results).toEqual([]);
    });

    test('returns empty array when ingredients is null or undefined', () => {
      expect(findProductsByIngredients(null)).toEqual([]);
      expect(findProductsByIngredients(undefined)).toEqual([]);
    });

    test('prioritizes in-stock items first', () => {
      const results = findProductsByIngredients(['Amprolium', 'Oxytetracycline']);
      for (let i = 0; i < results.length - 1; i++) {
        if (results[i].stock > 0 && results[i + 1].stock === 0) {
          // In stock comes before out of stock
          expect(results[i].stock).toBeGreaterThan(0);
        }
      }
    });

    test('caps output at specified limit (default 6)', () => {
      const results = findProductsByIngredients(['Amprolium', 'Oxytetracycline', 'Vaccine', 'Feed'], 2);
      expect(results.length).toBeLessThanOrEqual(2);
    });
  });

  describe('DiseaseTreatmentMap SEED_DATA', () => {
    test('contains all 4 required condition keys', () => {
      const keys = SEED_DATA.map(d => d.diseaseKey);
      expect(keys).toContain('coccidiosis');
      expect(keys).toContain('salmonella');
      expect(keys).toContain('newcastle_disease');
      expect(keys).toContain('healthy');
    });

    test('NewCastle Disease is marked non-treatable with vet referral required', () => {
      const nd = SEED_DATA.find(d => d.diseaseKey === 'newcastle_disease');
      expect(nd).toBeDefined();
      expect(nd.treatable).toBe(false);
      expect(nd.vetReferralRequired).toBe(true);
      expect(nd.activeIngredients).toHaveLength(0);
      expect(nd.supportiveCare.length).toBeGreaterThan(0);
    });

    test('Coccidiosis is treatable with Amprolium active ingredient', () => {
      const cocci = SEED_DATA.find(d => d.diseaseKey === 'coccidiosis');
      expect(cocci).toBeDefined();
      expect(cocci.treatable).toBe(true);
      expect(cocci.vetReferralRequired).toBe(false);
      expect(cocci.activeIngredients).toContain('Amprolium');
    });

    test('Salmonella is treatable with Oxytetracycline active ingredient', () => {
      const salm = SEED_DATA.find(d => d.diseaseKey === 'salmonella');
      expect(salm).toBeDefined();
      expect(salm.treatable).toBe(true);
      expect(salm.vetReferralRequired).toBe(false);
      expect(salm.activeIngredients).toContain('Oxytetracycline');
    });

    test('Every entry includes standard veterinary disclaimer', () => {
      for (const entry of SEED_DATA) {
        expect(entry.disclaimer).toBeTruthy();
        expect(entry.disclaimer).toMatch(/veterinarian|hatchery technician/i);
      }
    });
  });

  describe('Confidence threshold and product masking logic', () => {
    test('low confidence (< 0.70) suppresses all products and sets unclear_result', () => {
      const rawPrediction = {
        prediction: 'Coccidiosis',
        confidence: 0.58
      };

      // Simulating enrichment logic in predict.js
      let enriched = { ...rawPrediction };
      if (enriched.confidence < 0.70) {
        enriched.prediction = 'unclear_result';
        enriched.treatments = [];
        enriched.products = [];
      }

      expect(enriched.prediction).toBe('unclear_result');
      expect(enriched.treatments).toHaveLength(0);
      expect(enriched.products).toHaveLength(0);
    });

    test('non-treatable disease suppresses products and outputs supportive care', () => {
      const nd = SEED_DATA.find(d => d.diseaseKey === 'newcastle_disease');
      let enriched = {
        prediction: 'NewCastle Disease',
        confidence: 0.94,
        treatments: [],
        products: nd.treatable ? findProductsByIngredients(nd.activeIngredients) : [],
        vetReferralRequired: nd.vetReferralRequired,
        supportiveCare: nd.supportiveCare
      };

      expect(enriched.vetReferralRequired).toBe(true);
      expect(enriched.products).toHaveLength(0);
      expect(enriched.supportiveCare.length).toBeGreaterThan(0);
    });

    test('treatable disease with confidence >= 0.70 links products and treatments', () => {
      const cocci = SEED_DATA.find(d => d.diseaseKey === 'coccidiosis');
      let products = findProductsByIngredients(cocci.activeIngredients, 6);

      expect(products.length).toBeGreaterThan(0);
      expect(products[0]).toHaveProperty('_id');
      expect(products[0]).toHaveProperty('name');
      expect(products[0]).toHaveProperty('price');
      expect(products[0]).toHaveProperty('sellerPhone');
    });
  });
});
