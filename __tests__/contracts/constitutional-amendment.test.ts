/**
 * Contract Test: Constitutional Amendment Management
 * 
 * Tests the ConstitutionalAmendmentManager interface contract to ensure
 * proper constitutional amendment and compliance functionality.
 * 
 * These tests MUST initially fail (RED phase) before implementation.
 */

import {
  ConstitutionalAmendmentManager,
  ConstitutionalAmendment,
  AmendmentTrackingInfo,
  AmendmentReview,
  EnforcementConfiguration,
  ConstitutionalRequirements,
  ComplianceTarget,
  ComplianceResult,
  AmendmentStatus,
  ReviewDecision,
  ConstitutionalSection
} from '../../specs/001-we-are-actually/contracts/constitutional-amendment';
import { ConstitutionalAmendmentManagerImpl } from '../../src/constitution/ConstitutionalAmendmentManager';

describe('Constitutional Amendment Management Contract', () => {
  let manager: ConstitutionalAmendmentManager;

  beforeEach(() => {
    manager = new ConstitutionalAmendmentManagerImpl();
  });

  describe('proposeAmendment', () => {
    it('should accept and track new constitutional amendments', async () => {
      const amendment: ConstitutionalAmendment = {
        id: 'test-amendment-001',
        title: 'Enhanced TypeScript Validation',
        description: 'Strengthen TypeScript compilation requirements',
        section: 'Testing (NON-NEGOTIABLE)' as ConstitutionalSection,
        newRequirements: [
          'TypeScript compilation errors must be resolved within 1 hour',
          'All code must pass strict type checking'
        ],
        newProhibitions: [
          'Using any type without explicit justification',
          'Committing code with TypeScript warnings'
        ],
        enforcementMechanisms: [
          {
            type: 'pre-commit-hook',
            description: 'Block commits with TypeScript errors',
            configuration: {
              command: 'npx tsc --noEmit',
              targets: ['**/*.ts', '**/*.tsx'],
              onFailure: 'block'
            }
          }
        ],
        rationale: 'Prevent TypeScript compilation issues in testing pipeline',
        expectedImpact: 'Zero TypeScript compilation failures in CI/CD'
      };

      const trackingInfo: AmendmentTrackingInfo = await manager.proposeAmendment(amendment);

      expect(trackingInfo).toBeDefined();
      expect(trackingInfo.amendmentId).toBe(amendment.id);
      expect(trackingInfo.status).toBe('proposed');
      expect(trackingInfo.createdAt).toBeInstanceOf(Date);
      expect(trackingInfo.updatedAt).toBeInstanceOf(Date);
      expect(Array.isArray(trackingInfo.reviews)).toBe(true);
      expect(trackingInfo.reviews).toHaveLength(0);
      expect(typeof trackingInfo.version).toBe('string');
    });

    it('should handle multiple amendments simultaneously', async () => {
      const amendment1: ConstitutionalAmendment = {
        id: 'test-amendment-002',
        title: 'Test Amendment 1',
        description: 'First test amendment',
        section: 'Testing (NON-NEGOTIABLE)',
        newRequirements: ['Requirement 1'],
        newProhibitions: ['Prohibition 1'],
        enforcementMechanisms: [],
        rationale: 'Test rationale 1',
        expectedImpact: 'Test impact 1'
      };

      const amendment2: ConstitutionalAmendment = {
        id: 'test-amendment-003',
        title: 'Test Amendment 2',
        description: 'Second test amendment',
        section: 'Simplicity',
        newRequirements: ['Requirement 2'],
        newProhibitions: ['Prohibition 2'],
        enforcementMechanisms: [],
        rationale: 'Test rationale 2',
        expectedImpact: 'Test impact 2'
      };

      const tracking1 = await manager.proposeAmendment(amendment1);
      const tracking2 = await manager.proposeAmendment(amendment2);

      expect(tracking1.amendmentId).toBe(amendment1.id);
      expect(tracking2.amendmentId).toBe(amendment2.id);
      expect(tracking1.amendmentId).not.toBe(tracking2.amendmentId);
    });
  });

  describe('reviewAmendment', () => {
    let amendmentId: string;

    beforeEach(async () => {
      const amendment: ConstitutionalAmendment = {
        id: 'test-review-amendment',
        title: 'Review Test Amendment',
        description: 'Amendment for testing review process',
        section: 'Testing (NON-NEGOTIABLE)',
        newRequirements: ['Test requirement'],
        newProhibitions: ['Test prohibition'],
        enforcementMechanisms: [],
        rationale: 'Test rationale',
        expectedImpact: 'Test impact'
      };

      const tracking = await manager.proposeAmendment(amendment);
      amendmentId = tracking.amendmentId;
    });

    it('should process amendment reviews and update status', async () => {
      const review: AmendmentReview = {
        reviewerId: 'reviewer-001',
        reviewedAt: new Date(),
        decision: 'approve' as ReviewDecision,
        comments: 'Amendment looks good and addresses TypeScript issues',
        suggestions: ['Consider adding performance metrics']
      };

      const updatedTracking = await manager.reviewAmendment(amendmentId, review);

      expect(updatedTracking.status).toBe('approved');
      expect(updatedTracking.reviews).toHaveLength(1);
      expect(updatedTracking.reviews[0]).toEqual(review);
      expect(updatedTracking.updatedAt.getTime()).toBeGreaterThan(updatedTracking.createdAt.getTime());
    });

    it('should handle rejection reviews', async () => {
      const review: AmendmentReview = {
        reviewerId: 'reviewer-002',
        reviewedAt: new Date(),
        decision: 'reject',
        comments: 'Amendment scope too broad',
        suggestions: ['Narrow scope to specific TypeScript issues']
      };

      const updatedTracking = await manager.reviewAmendment(amendmentId, review);

      expect(updatedTracking.status).toBe('rejected');
      expect(updatedTracking.reviews[0].decision).toBe('reject');
    });

    it('should handle change request reviews', async () => {
      const review: AmendmentReview = {
        reviewerId: 'reviewer-003',
        reviewedAt: new Date(),
        decision: 'request-changes',
        comments: 'Need more specific enforcement mechanisms',
        suggestions: ['Add specific TypeScript compiler flags', 'Define error handling procedures']
      };

      const updatedTracking = await manager.reviewAmendment(amendmentId, review);

      expect(updatedTracking.status).toBe('under-review');
      expect(updatedTracking.reviews[0].decision).toBe('request-changes');
    });

    it('should throw error for non-existent amendment', async () => {
      const review: AmendmentReview = {
        reviewerId: 'reviewer-004',
        reviewedAt: new Date(),
        decision: 'approve',
        comments: 'Test review'
      };

      await expect(manager.reviewAmendment('non-existent-id', review))
        .rejects.toThrow('Amendment non-existent-id not found');
    });
  });

  describe('enactAmendment', () => {
    let approvedAmendmentId: string;

    beforeEach(async () => {
      const amendment: ConstitutionalAmendment = {
        id: 'test-enact-amendment',
        title: 'Enactment Test Amendment',
        description: 'Amendment for testing enactment process',
        section: 'Testing (NON-NEGOTIABLE)',
        newRequirements: ['Enactment test requirement'],
        newProhibitions: ['Enactment test prohibition'],
        enforcementMechanisms: [
          {
            type: 'pre-commit-hook',
            description: 'Test enforcement',
            configuration: {
              command: 'test-command',
              onFailure: 'block'
            }
          }
        ],
        rationale: 'Test enactment rationale',
        expectedImpact: 'Test enactment impact'
      };

      await manager.proposeAmendment(amendment);
      
      const review: AmendmentReview = {
        reviewerId: 'reviewer-005',
        reviewedAt: new Date(),
        decision: 'approve',
        comments: 'Approved for enactment'
      };

      await manager.reviewAmendment(amendment.id, review);
      approvedAmendmentId = amendment.id;
    });

    it('should enact approved amendments and return enforcement configuration', async () => {
      const enforcementConfig: EnforcementConfiguration = await manager.enactAmendment(approvedAmendmentId);

      expect(enforcementConfig).toBeDefined();
      expect(enforcementConfig.amendmentId).toBe(approvedAmendmentId);
      expect(Array.isArray(enforcementConfig.mechanisms)).toBe(true);
      expect(typeof enforcementConfig.gracePeriodDays).toBe('number');
      expect(enforcementConfig.monitoring).toBeDefined();
      expect(typeof enforcementConfig.monitoring.enableMetrics).toBe('boolean');
      expect(enforcementConfig.monitoring.reportingInterval).toMatch(/^(daily|weekly|monthly)$/);
    });

    it('should throw error for non-approved amendments', async () => {
      const unapprovedAmendment: ConstitutionalAmendment = {
        id: 'unapproved-amendment',
        title: 'Unapproved Amendment',
        description: 'This amendment is not approved',
        section: 'Testing (NON-NEGOTIABLE)',
        newRequirements: [],
        newProhibitions: [],
        enforcementMechanisms: [],
        rationale: 'Test',
        expectedImpact: 'Test'
      };

      await manager.proposeAmendment(unapprovedAmendment);

      await expect(manager.enactAmendment(unapprovedAmendment.id))
        .rejects.toThrow('Amendment unapproved-amendment must be approved before enactment');
    });
  });

  describe('getCurrentRequirements', () => {
    it('should return current constitutional requirements', () => {
      const requirements: ConstitutionalRequirements = manager.getCurrentRequirements();

      expect(requirements).toBeDefined();
      expect(typeof requirements.version).toBe('string');
      expect(requirements.requirementsBySection).toBeDefined();
      expect(requirements.prohibitionsBySection).toBeDefined();
      expect(Array.isArray(requirements.activeEnforcements)).toBe(true);

      // Check that Testing section exists (our focus area)
      expect(requirements.requirementsBySection['Testing (NON-NEGOTIABLE)']).toBeDefined();
      expect(Array.isArray(requirements.requirementsBySection['Testing (NON-NEGOTIABLE)'])).toBe(true);
      expect(requirements.prohibitionsBySection['Testing (NON-NEGOTIABLE)']).toBeDefined();
      expect(Array.isArray(requirements.prohibitionsBySection['Testing (NON-NEGOTIABLE)'])).toBe(true);
    });

    it('should include TypeScript testing requirements', () => {
      const requirements = manager.getCurrentRequirements();
      const testingRequirements = requirements.requirementsBySection['Testing (NON-NEGOTIABLE)'];

      expect(testingRequirements).toContain('TypeScript compilation MUST succeed before test execution');
      expect(testingRequirements).toContain('devbox run test MUST pass completely before any commit');
      expect(testingRequirements).toContain('Pre-commit hooks MUST validate TypeScript compilation');
    });

    it('should include TypeScript testing prohibitions', () => {
      const requirements = manager.getCurrentRequirements();
      const testingProhibitions = requirements.prohibitionsBySection['Testing (NON-NEGOTIABLE)'];

      expect(testingProhibitions).toContain('Committing code that breaks TypeScript compilation');
      expect(testingProhibitions).toContain('Implementation before test');
      expect(testingProhibitions).toContain('Skipping RED phase');
    });
  });

  describe('validateCompliance', () => {
    it('should validate codebase compliance', async () => {
      const target: ComplianceTarget = {
        type: 'codebase',
        identifier: 'main-codebase',
        aspects: ['typescript', 'testing']
      };

      const result: ComplianceResult = await manager.validateCompliance(target);

      expect(result).toBeDefined();
      expect(typeof result.compliant).toBe('boolean');
      expect(Array.isArray(result.violations)).toBe(true);
      expect(typeof result.score).toBe('number');
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.validatedAt).toBeInstanceOf(Date);
    });

    it('should validate TypeScript compilation compliance', async () => {
      const target: ComplianceTarget = {
        type: 'codebase',
        identifier: 'typescript-validation',
        aspects: ['typescript']
      };

      const result = await manager.validateCompliance(target);

      // If TypeScript compilation fails, should report violations
      if (!result.compliant) {
        expect(result.violations.length).toBeGreaterThan(0);
        expect(result.score).toBeLessThan(100);
        
        const tsViolations = result.violations.filter(v => 
          v.requirement.includes('TypeScript compilation')
        );
        expect(tsViolations.length).toBeGreaterThan(0);
      }
    });

    it('should validate testing compliance', async () => {
      const target: ComplianceTarget = {
        type: 'codebase',
        identifier: 'testing-validation',
        aspects: ['testing']
      };

      const result = await manager.validateCompliance(target);

      // Should check if devbox run test passes
      expect(result).toBeDefined();
      
      if (!result.compliant) {
        const testViolations = result.violations.filter(v => 
          v.requirement.includes('devbox run test')
        );
        
        if (testViolations.length > 0) {
          expect(testViolations[0].severity).toBe('critical');
          expect(testViolations[0].resolution).toContain('devbox run test');
        }
      }
    });

    it('should provide helpful recommendations for violations', async () => {
      const target: ComplianceTarget = {
        type: 'codebase',
        identifier: 'recommendation-test',
        aspects: ['typescript', 'testing']
      };

      const result = await manager.validateCompliance(target);

      for (const recommendation of result.recommendations) {
        expect(typeof recommendation).toBe('string');
        expect(recommendation.length).toBeGreaterThan(0);
      }

      if (result.violations.length > 0) {
        expect(result.recommendations.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Constitutional Integration', () => {
    it('should enforce zero tolerance for TypeScript compilation failures', async () => {
      const requirements = manager.getCurrentRequirements();
      const activeEnforcements = requirements.activeEnforcements;

      const preCommitEnforcement = activeEnforcements.find(e => e.type === 'pre-commit-hook');
      expect(preCommitEnforcement).toBeDefined();
      expect(preCommitEnforcement?.active).toBe(true);
      expect(preCommitEnforcement?.configuration.onFailure).toBe('block');
    });

    it('should support immediate enforcement for TypeScript requirements', async () => {
      const amendment: ConstitutionalAmendment = {
        id: 'immediate-enforcement-test',
        title: 'Immediate Enforcement Test',
        description: 'Test immediate enforcement',
        section: 'Testing (NON-NEGOTIABLE)',
        newRequirements: ['Immediate TypeScript validation'],
        newProhibitions: [],
        enforcementMechanisms: [],
        rationale: 'Test immediate enforcement',
        expectedImpact: 'Zero grace period'
      };

      await manager.proposeAmendment(amendment);
      
      const review: AmendmentReview = {
        reviewerId: 'test-reviewer',
        reviewedAt: new Date(),
        decision: 'approve',
        comments: 'Approved for immediate enforcement'
      };

      await manager.reviewAmendment(amendment.id, review);
      const enforcement = await manager.enactAmendment(amendment.id);

      expect(enforcement.gracePeriodDays).toBe(0);
      expect(enforcement.monitoring.alertThresholds.violationCount).toBe(1);
    });
  });
});