/**
 * =============================================================================
 * Tests: Lifecycle Template Loader Service
 * Component: /app/backend/services/__tests__/templateLoader.test.js
 * Description: Unit tests verifying template loading, Ajv JSON Schema validation,
 *              rejection of invalid templates, stage resolution by flock age,
 *              and boundary conditions.
 * =============================================================================
 */

'use strict';

const templateLoader = require('../templateLoader');

describe('Phase 5: Breed Lifecycle Templates & Loader', () => {

  describe('Template Loading & Availability', () => {
    test('loads all 5 standard poultry breed templates', () => {
      const templates = templateLoader.getAllTemplates();
      const breeds = Object.keys(templates);

      expect(breeds).toContain('Broiler');
      expect(breeds).toContain('Sonali');
      expect(breeds).toContain('Desi');
      expect(breeds).toContain('Cock');
      expect(breeds).toContain('Layer');
      expect(breeds.length).toBe(5);
    });

    test('getTemplate returns valid breed template with required structure', () => {
      ['Broiler', 'Sonali', 'Desi', 'Cock', 'Layer'].forEach(breed => {
        const tmpl = templateLoader.getTemplate(breed);
        expect(tmpl.chickenType).toBe(breed);
        expect(tmpl.version).toMatch(/^\d+\.\d+\.\d+$/);
        expect(tmpl.cycleLengthDays).toBeGreaterThan(0);
        expect(Array.isArray(tmpl.stages)).toBe(true);
        expect(tmpl.stages.length).toBeGreaterThan(0);

        tmpl.stages.forEach(stage => {
          expect(stage.name).toBeDefined();
          expect(stage.fromDay).toBeLessThanOrEqual(stage.toDay);
          expect(stage.targetTempC.length).toBe(2);
          expect(stage.targetHumidityPct.length).toBe(2);
          expect(Array.isArray(stage.tips)).toBe(true);
          expect(stage.tips.length).toBeGreaterThan(0);

          (stage.milestones || []).forEach(m => {
            expect(m.day).toBeGreaterThanOrEqual(stage.fromDay);
            expect(m.day).toBeLessThanOrEqual(stage.toDay);
            expect(m.key).toMatch(/^[a-z0-9_-]+$/);
            expect(['Vaccination', 'Feed Transition', 'Weighing', 'Medication']).toContain(m.category);
            expect(typeof m.critical).toBe('boolean');
          });
        });
      });
    });

    test('getTemplate throws descriptive error for unknown breed', () => {
      expect(() => {
        templateLoader.getTemplate('Pigeon');
      }).toThrow(/No lifecycle template found for chickenType: "Pigeon"/);
    });
  });

  describe('getStageForAge Lookup & Boundary Cases', () => {
    test('correctly maps Broiler flock age across all stages', () => {
      // Broiler: Brooding (0-7), Starter (8-14), Grower (15-24), Finisher (25-35)
      const day3 = templateLoader.getStageForAge('Broiler', 3);
      expect(day3.stage.name).toBe('Brooding');
      expect(day3.stageIndex).toBe(0);
      expect(day3.isPastCycleEnd).toBe(false);
      expect(day3.daysRemainingInStage).toBe(4); // 7 - 3

      const day7 = templateLoader.getStageForAge('Broiler', 7);
      expect(day7.stage.name).toBe('Brooding');
      expect(day7.daysRemainingInStage).toBe(0);

      const day8 = templateLoader.getStageForAge('Broiler', 8);
      expect(day8.stage.name).toBe('Starter');
      expect(day8.stageIndex).toBe(1);

      const day14 = templateLoader.getStageForAge('Broiler', 14);
      expect(day14.stage.name).toBe('Starter');

      const day15 = templateLoader.getStageForAge('Broiler', 15);
      expect(day15.stage.name).toBe('Grower');
      expect(day15.stageIndex).toBe(2);

      const day25 = templateLoader.getStageForAge('Broiler', 25);
      expect(day25.stage.name).toBe('Finisher');
      expect(day25.stageIndex).toBe(3);
    });

    test('handles negative or pre-start age gracefully by clamping to first stage', () => {
      const res = templateLoader.getStageForAge('Broiler', -3);
      expect(res.stage.name).toBe('Brooding');
      expect(res.stageIndex).toBe(0);
      expect(res.isPastCycleEnd).toBe(false);
    });

    test('handles age exceeding cycleLengthDays by returning final stage with isPastCycleEnd=true', () => {
      // Broiler cycle is 35 days
      const res = templateLoader.getStageForAge('Broiler', 42);
      expect(res.stage.name).toBe('Finisher');
      expect(res.stageIndex).toBe(3);
      expect(res.isPastCycleEnd).toBe(true);
      expect(res.daysRemainingInStage).toBe(0);
    });

    test('correctly maps Layer 365-day stages', () => {
      // Brooding (0-28), Grower (29-70), Developer (71-126), Production (127-365)
      expect(templateLoader.getStageForAge('Layer', 10).stage.name).toBe('Brooding');
      expect(templateLoader.getStageForAge('Layer', 50).stage.name).toBe('Grower');
      expect(templateLoader.getStageForAge('Layer', 100).stage.name).toBe('Developer & Pre-Lay');
      expect(templateLoader.getStageForAge('Layer', 200).stage.name).toBe('Production & Laying');
      expect(templateLoader.getStageForAge('Layer', 370).isPastCycleEnd).toBe(true);
    });
  });

  describe('Ajv Schema Validation & Fast-Fail Guarantees', () => {
    test('valid inline template passes validation', () => {
      const validTmpl = {
        chickenType: 'Broiler',
        version: '1.0.0',
        reviewedBy: 'Dr. Test',
        cycleLengthDays: 35,
        stages: [
          {
            name: 'Brooding',
            fromDay: 0,
            toDay: 7,
            feed: 'Starter Crumble',
            targetTempC: [32, 35],
            targetHumidityPct: [60, 70],
            tips: ['Keep warm'],
            milestones: [
              {
                day: 4,
                key: 'test-vaccine',
                title: 'Test Vaccine',
                category: 'Vaccination',
                critical: true,
                instructions: 'Inject gently',
              },
            ],
          },
        ],
      };

      expect(templateLoader.validateTemplate(validTmpl)).toBe(true);
    });

    test('fails if chickenType is invalid', () => {
      const invalidTmpl = {
        chickenType: 'Turkey',
        version: '1.0.0',
        cycleLengthDays: 35,
        stages: [
          {
            name: 'Stage 1',
            fromDay: 0,
            toDay: 10,
            feed: 'Feed',
            targetTempC: [25, 30],
            targetHumidityPct: [50, 60],
            tips: ['Tip'],
          },
        ],
      };

      expect(() => {
        templateLoader.validateTemplate(invalidTmpl);
      }).toThrow(/Template validation failed/);
    });

    test('fails if stage toDay is less than fromDay', () => {
      const invalidTmpl = {
        chickenType: 'Broiler',
        version: '1.0.0',
        cycleLengthDays: 35,
        stages: [
          {
            name: 'Backwards Stage',
            fromDay: 10,
            toDay: 5,
            feed: 'Feed',
            targetTempC: [25, 30],
            targetHumidityPct: [50, 60],
            tips: ['Tip'],
          },
        ],
      };

      expect(() => {
        templateLoader.validateTemplate(invalidTmpl);
      }).toThrow(/has toDay \(5\) less than fromDay \(10\)/);
    });

    test('fails if stages overlap chronologically', () => {
      const invalidTmpl = {
        chickenType: 'Broiler',
        version: '1.0.0',
        cycleLengthDays: 35,
        stages: [
          {
            name: 'Stage 1',
            fromDay: 0,
            toDay: 10,
            feed: 'Feed 1',
            targetTempC: [25, 30],
            targetHumidityPct: [50, 60],
            tips: ['Tip'],
          },
          {
            name: 'Stage 2',
            fromDay: 8, // overlaps with Stage 1 (toDay = 10)
            toDay: 20,
            feed: 'Feed 2',
            targetTempC: [20, 25],
            targetHumidityPct: [50, 60],
            tips: ['Tip'],
          },
        ],
      };

      expect(() => {
        templateLoader.validateTemplate(invalidTmpl);
      }).toThrow(/overlaps with previous stage toDay/);
    });

    test('fails if milestone day falls outside its stage bounds', () => {
      const invalidTmpl = {
        chickenType: 'Broiler',
        version: '1.0.0',
        cycleLengthDays: 35,
        stages: [
          {
            name: 'Stage 1',
            fromDay: 0,
            toDay: 7,
            feed: 'Feed 1',
            targetTempC: [25, 30],
            targetHumidityPct: [50, 60],
            tips: ['Tip'],
            milestones: [
              {
                day: 14, // outside [0, 7]
                key: 'misplaced-milestone',
                title: 'Misplaced Milestone',
                category: 'Vaccination',
                critical: true,
                instructions: 'Instructions',
              },
            ],
          },
        ],
      };

      expect(() => {
        templateLoader.validateTemplate(invalidTmpl);
      }).toThrow(/milestone "misplaced-milestone" at day 14 is outside stage "Stage 1" bounds/);
    });
  });
});
