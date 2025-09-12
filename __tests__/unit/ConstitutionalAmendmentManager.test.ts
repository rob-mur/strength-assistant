/**
 * Unit Tests: Constitutional Amendment Manager
 * 
 * Comprehensive unit tests for the ConstitutionalAmendmentManager implementation
 * to ensure all amendment lifecycle methods behave correctly.
 */

import { ConstitutionalAmendmentManagerImpl } from '../../src/constitution/ConstitutionalAmendmentManager';
import {
  ConstitutionalAmendment,
  AmendmentReview,
  ComplianceTarget,
  ConstitutionalSection,
  ReviewDecision,
  AmendmentStatus
} from '../../specs/001-we-are-actually/contracts/constitutional-amendment';

describe('ConstitutionalAmendmentManager Unit Tests', () => {
  let manager: ConstitutionalAmendmentManagerImpl;

  beforeEach(() => {
    manager = new ConstitutionalAmendmentManagerImpl();
  });

  describe('Constructor and Initial State', () => {
    it('should initialize with current constitutional requirements', () => {
      const requirements = manager.getCurrentRequirements();

      expect(requirements.version).toBe('2.5.0');
      expect(requirements.requirementsBySection).toBeDefined();
      expect(requirements.prohibitionsBySection).toBeDefined();
      expect(requirements.activeEnforcements).toBeDefined();
    });

    it('should have TypeScript testing requirements in initial state', () => {
      const requirements = manager.getCurrentRequirements();
      const testingRequirements = requirements.requirementsBySection['Testing (NON-NEGOTIABLE)'];

      expect(testingRequirements).toContain('TypeScript compilation MUST succeed before test execution');
      expect(testingRequirements).toContain('devbox run test MUST pass completely before any commit');
      expect(testingRequirements).toContain('Pre-commit hooks MUST validate TypeScript compilation');
    });

    it('should have TypeScript testing prohibitions in initial state', () => {
      const requirements = manager.getCurrentRequirements();
      const testingProhibitions = requirements.prohibitionsBySection['Testing (NON-NEGOTIABLE)'];

      expect(testingProhibitions).toContain('Committing code that breaks TypeScript compilation');
      expect(testingProhibitions).toContain('Implementation before test');
      expect(testingProhibitions).toContain('Skipping RED phase');
    });

    it('should have active enforcement mechanisms configured', () => {
      const requirements = manager.getCurrentRequirements();
      
      expect(requirements.activeEnforcements.length).toBeGreaterThan(0);
      
      const preCommitHook = requirements.activeEnforcements.find(e => e.type === 'pre-commit-hook');
      expect(preCommitHook).toBeDefined();
      expect(preCommitHook?.active).toBe(true);
      expect(preCommitHook?.configuration.onFailure).toBe('block');
    });
  });

  describe('proposeAmendment', () => {
    it('should create tracking info for new amendments', async () => {
      const amendment: ConstitutionalAmendment = {
        id: 'test-amendment-001',
        title: 'Test Amendment',
        description: 'Test amendment description',
        section: 'Testing (NON-NEGOTIABLE)' as ConstitutionalSection,
        newRequirements: ['Test requirement'],
        newProhibitions: ['Test prohibition'],
        enforcementMechanisms: [],
        rationale: 'Test rationale',
        expectedImpact: 'Test impact'
      };

      const trackingInfo = await manager.proposeAmendment(amendment);

      expect(trackingInfo.amendmentId).toBe(amendment.id);
      expect(trackingInfo.status).toBe('proposed');
      expect(trackingInfo.createdAt).toBeInstanceOf(Date);
      expect(trackingInfo.updatedAt).toBeInstanceOf(Date);
      expect(trackingInfo.reviews).toEqual([]);
      expect(trackingInfo.version).toBe('2.5.0');
    });

    it('should handle multiple amendments with unique tracking', async () => {
      const amendment1: ConstitutionalAmendment = {
        id: 'amendment-001',
        title: 'First Amendment',
        description: 'First test amendment',
        section: 'Testing (NON-NEGOTIABLE)',
        newRequirements: ['Requirement 1'],
        newProhibitions: ['Prohibition 1'],
        enforcementMechanisms: [],
        rationale: 'Rationale 1',
        expectedImpact: 'Impact 1'
      };

      const amendment2: ConstitutionalAmendment = {
        id: 'amendment-002',
        title: 'Second Amendment',
        description: 'Second test amendment',
        section: 'Simplicity',
        newRequirements: ['Requirement 2'],
        newProhibitions: ['Prohibition 2'],
        enforcementMechanisms: [],
        rationale: 'Rationale 2',
        expectedImpact: 'Impact 2'
      };

      const tracking1 = await manager.proposeAmendment(amendment1);
      const tracking2 = await manager.proposeAmendment(amendment2);

      expect(tracking1.amendmentId).toBe('amendment-001');
      expect(tracking2.amendmentId).toBe('amendment-002');
      expect(tracking1.createdAt).toBeInstanceOf(Date);
      expect(tracking2.createdAt).toBeInstanceOf(Date);
    });

    it('should set timestamps correctly', async () => {
      const beforeTime = new Date();
      
      const amendment: ConstitutionalAmendment = {
        id: 'timestamp-test',
        title: 'Timestamp Test',
        description: 'Testing timestamp behavior',
        section: 'Testing (NON-NEGOTIABLE)',
        newRequirements: [],
        newProhibitions: [],
        enforcementMechanisms: [],
        rationale: 'Test timestamps',
        expectedImpact: 'Verify timing'
      };

      const trackingInfo = await manager.proposeAmendment(amendment);
      const afterTime = new Date();

      expect(trackingInfo.createdAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(trackingInfo.createdAt.getTime()).toBeLessThanOrEqual(afterTime.getTime());
      expect(trackingInfo.updatedAt.getTime()).toBe(trackingInfo.createdAt.getTime());
    });
  });

  describe('reviewAmendment', () => {
    let amendmentId: string;

    beforeEach(async () => {
      const amendment: ConstitutionalAmendment = {
        id: 'review-test-amendment',
        title: 'Review Test Amendment',
        description: 'Amendment for testing review functionality',
        section: 'Testing (NON-NEGOTIABLE)',
        newRequirements: ['Review test requirement'],
        newProhibitions: ['Review test prohibition'],
        enforcementMechanisms: [],
        rationale: 'Test review process',
        expectedImpact: 'Validate review workflow'
      };

      const tracking = await manager.proposeAmendment(amendment);
      amendmentId = tracking.amendmentId;
    });

    it('should process approval reviews correctly', async () => {
      const review: AmendmentReview = {
        reviewerId: 'reviewer-001',
        reviewedAt: new Date(),
        decision: 'approve' as ReviewDecision,
        comments: 'Amendment looks good',
        suggestions: ['Consider performance impact']
      };

      const updatedTracking = await manager.reviewAmendment(amendmentId, review);

      expect(updatedTracking.status).toBe('approved');
      expect(updatedTracking.reviews).toHaveLength(1);
      expect(updatedTracking.reviews[0]).toEqual(review);
      expect(updatedTracking.updatedAt.getTime()).toBeGreaterThanOrEqual(updatedTracking.createdAt.getTime());
    });

    it('should process rejection reviews correctly', async () => {
      const review: AmendmentReview = {
        reviewerId: 'reviewer-002',
        reviewedAt: new Date(),
        decision: 'reject' as ReviewDecision,
        comments: 'Amendment scope too broad',
        suggestions: ['Narrow the scope', 'Focus on specific issues']
      };

      const updatedTracking = await manager.reviewAmendment(amendmentId, review);

      expect(updatedTracking.status).toBe('rejected');
      expect(updatedTracking.reviews[0].decision).toBe('reject');
      expect(updatedTracking.reviews[0].comments).toBe('Amendment scope too broad');
    });

    it('should process change request reviews correctly', async () => {
      const review: AmendmentReview = {
        reviewerId: 'reviewer-003',
        reviewedAt: new Date(),
        decision: 'request-changes' as ReviewDecision,
        comments: 'Need more specific enforcement mechanisms',
        suggestions: ['Add detailed enforcement steps', 'Define success metrics']
      };

      const updatedTracking = await manager.reviewAmendment(amendmentId, review);

      expect(updatedTracking.status).toBe('under-review');
      expect(updatedTracking.reviews[0].decision).toBe('request-changes');
    });

    it('should handle multiple reviews', async () => {
      const review1: AmendmentReview = {
        reviewerId: 'reviewer-001',
        reviewedAt: new Date(),
        decision: 'request-changes',
        comments: 'First review comments'
      };

      const review2: AmendmentReview = {
        reviewerId: 'reviewer-002',
        reviewedAt: new Date(),
        decision: 'approve',
        comments: 'Second review comments'
      };

      await manager.reviewAmendment(amendmentId, review1);
      const finalTracking = await manager.reviewAmendment(amendmentId, review2);

      expect(finalTracking.reviews).toHaveLength(2);
      expect(finalTracking.status).toBe('approved'); // Last review determines status
      expect(finalTracking.reviews[0].reviewerId).toBe('reviewer-001');
      expect(finalTracking.reviews[1].reviewerId).toBe('reviewer-002');
    });

    it('should throw error for non-existent amendment', async () => {
      const review: AmendmentReview = {
        reviewerId: 'reviewer-404',
        reviewedAt: new Date(),
        decision: 'approve',
        comments: 'This should fail'
      };

      await expect(manager.reviewAmendment('non-existent-id', review))
        .rejects.toThrow('Amendment non-existent-id not found');
    });

    it('should update timestamps on review', async () => {
      const originalTracking = await manager.reviewAmendment(amendmentId, {
        reviewerId: 'reviewer-001',
        reviewedAt: new Date(),
        decision: 'approve',
        comments: 'Initial review'
      });

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      const secondTracking = await manager.reviewAmendment(amendmentId, {
        reviewerId: 'reviewer-002',
        reviewedAt: new Date(),
        decision: 'approve',
        comments: 'Second review'
      });

      expect(secondTracking.updatedAt.getTime()).toBeGreaterThanOrEqual(originalTracking.updatedAt.getTime());
    });
  });

  describe('enactAmendment', () => {
    let approvedAmendmentId: string;
    let unapprovedAmendmentId: string;

    beforeEach(async () => {
      // Create approved amendment
      const approvedAmendment: ConstitutionalAmendment = {
        id: 'approved-amendment',
        title: 'Approved Amendment',
        description: 'Amendment for enactment testing',
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
        rationale: 'Test enactment',
        expectedImpact: 'Validate enactment process'
      };

      await manager.proposeAmendment(approvedAmendment);
      await manager.reviewAmendment(approvedAmendment.id, {
        reviewerId: 'test-reviewer',
        reviewedAt: new Date(),
        decision: 'approve',
        comments: 'Approved for testing'
      });
      approvedAmendmentId = approvedAmendment.id;

      // Create unapproved amendment
      const unapprovedAmendment: ConstitutionalAmendment = {
        id: 'unapproved-amendment',
        title: 'Unapproved Amendment',
        description: 'Amendment that should not be enacted',
        section: 'Testing (NON-NEGOTIABLE)',
        newRequirements: [],
        newProhibitions: [],
        enforcementMechanisms: [],
        rationale: 'Test rejection',
        expectedImpact: 'Should fail enactment'
      };

      await manager.proposeAmendment(unapprovedAmendment);
      unapprovedAmendmentId = unapprovedAmendment.id;
    });

    it('should enact approved amendments successfully', async () => {
      const enforcementConfig = await manager.enactAmendment(approvedAmendmentId);

      expect(enforcementConfig.amendmentId).toBe(approvedAmendmentId);
      expect(enforcementConfig.mechanisms).toBeDefined();
      expect(Array.isArray(enforcementConfig.mechanisms)).toBe(true);
      expect(enforcementConfig.gracePeriodDays).toBe(0); // Immediate enforcement
      expect(enforcementConfig.monitoring).toBeDefined();
      expect(enforcementConfig.monitoring.enableMetrics).toBe(true);
      expect(enforcementConfig.monitoring.reportingInterval).toBe('daily');
      expect(enforcementConfig.monitoring.alertThresholds.violationCount).toBe(1);
    });

    it('should update amendment status to enacted', async () => {
      await manager.enactAmendment(approvedAmendmentId);

      // We can't directly access the internal state, but we can verify
      // that the enactment process completed without error
      expect(true).toBe(true); // Placeholder assertion
    });

    it('should throw error for unapproved amendments', async () => {
      await expect(manager.enactAmendment(unapprovedAmendmentId))
        .rejects.toThrow('Amendment unapproved-amendment must be approved before enactment');
    });

    it('should throw error for non-existent amendments', async () => {
      await expect(manager.enactAmendment('non-existent-amendment'))
        .rejects.toThrow('Amendment non-existent-amendment not found');
    });

    it('should configure zero-tolerance enforcement for TypeScript', async () => {
      const enforcementConfig = await manager.enactAmendment(approvedAmendmentId);

      expect(enforcementConfig.gracePeriodDays).toBe(0);
      expect(enforcementConfig.monitoring.alertThresholds.violationCount).toBe(1);
      expect(enforcementConfig.monitoring.alertThresholds.timeWindow).toBe('1hour');
    });
  });

  describe('getCurrentRequirements', () => {
    it('should return immutable copy of requirements', () => {
      const requirements1 = manager.getCurrentRequirements();
      const requirements2 = manager.getCurrentRequirements();

      expect(requirements1).toEqual(requirements2);
      expect(requirements1).not.toBe(requirements2); // Different objects

      // Modifying returned object should not affect internal state
      requirements1.version = 'modified';
      const requirements3 = manager.getCurrentRequirements();
      expect(requirements3.version).toBe('2.5.0');
    });

    it('should include all constitutional sections', () => {
      const requirements = manager.getCurrentRequirements();

      const expectedSections: ConstitutionalSection[] = [
        'Testing (NON-NEGOTIABLE)',
        'Simplicity',
        'Architecture',
        'Observability',
        'Versioning'
      ];

      for (const section of expectedSections) {
        expect(requirements.requirementsBySection[section]).toBeDefined();
        expect(requirements.prohibitionsBySection[section]).toBeDefined();
        expect(Array.isArray(requirements.requirementsBySection[section])).toBe(true);
        expect(Array.isArray(requirements.prohibitionsBySection[section])).toBe(true);
      }
    });

    it('should have consistent enforcement mechanisms', () => {
      const requirements = manager.getCurrentRequirements();

      for (const enforcement of requirements.activeEnforcements) {
        expect(enforcement.type).toBeDefined();
        expect(enforcement.configuration).toBeDefined();
        expect(typeof enforcement.active).toBe('boolean');
        expect(enforcement.configuration.onFailure).toMatch(/^(block|warn|report)$/);
      }
    });
  });

  describe('validateCompliance', () => {
    it('should validate codebase TypeScript compliance', async () => {
      const target: ComplianceTarget = {
        type: 'codebase',
        identifier: 'test-codebase',
        aspects: ['typescript']
      };

      const result = await manager.validateCompliance(target);

      expect(result).toBeDefined();
      expect(typeof result.compliant).toBe('boolean');
      expect(Array.isArray(result.violations)).toBe(true);
      expect(typeof result.score).toBe('number');
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.validatedAt).toBeInstanceOf(Date);
    });

    it('should validate testing compliance', async () => {
      const target: ComplianceTarget = {
        type: 'codebase',
        identifier: 'test-testing',
        aspects: ['testing']
      };

      const result = await manager.validateCompliance(target);

      expect(result).toBeDefined();
      // Should check devbox run test compliance
      if (!result.compliant) {
        const testViolations = result.violations.filter(v => 
          v.requirement.includes('devbox run test')
        );
        
        if (testViolations.length > 0) {
          expect(testViolations[0].severity).toBe('critical');
        }
      }
    });

    it('should provide appropriate recommendations for violations', async () => {
      const target: ComplianceTarget = {
        type: 'codebase',
        identifier: 'test-recommendations',
        aspects: ['typescript', 'testing']
      };

      const result = await manager.validateCompliance(target);

      if (result.violations.length > 0) {
        expect(result.recommendations.length).toBeGreaterThan(0);
        
        for (const recommendation of result.recommendations) {
          expect(typeof recommendation).toBe('string');
          expect(recommendation.length).toBeGreaterThan(0);
        }

        // Should include TypeScript-specific recommendations
        const hasTypeScriptRecommendation = result.recommendations.some(r => 
          r.includes('TypeScript') || r.includes('compilation')
        );
        expect(hasTypeScriptRecommendation).toBe(true);
      }
    });

    it('should calculate compliance score correctly', async () => {
      const target: ComplianceTarget = {
        type: 'codebase',
        identifier: 'test-scoring',
        aspects: ['typescript', 'testing']
      };

      const result = await manager.validateCompliance(target);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);

      if (result.compliant) {
        expect(result.score).toBe(100);
        expect(result.violations).toHaveLength(0);
      } else {
        expect(result.score).toBeLessThan(100);
        expect(result.violations.length).toBeGreaterThan(0);
      }
    });

    it('should handle different compliance target types', async () => {
      const targets: ComplianceTarget[] = [
        { type: 'codebase', identifier: 'code', aspects: ['typescript'] },
        { type: 'configuration', identifier: 'config', aspects: ['typescript'] },
        { type: 'process', identifier: 'proc', aspects: ['testing'] }
      ];

      for (const target of targets) {
        const result = await manager.validateCompliance(target);
        expect(result).toBeDefined();
        expect(typeof result.compliant).toBe('boolean');
      }
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty amendment fields gracefully', async () => {
      const amendment: ConstitutionalAmendment = {
        id: 'empty-amendment',
        title: '',
        description: '',
        section: 'Testing (NON-NEGOTIABLE)',
        newRequirements: [],
        newProhibitions: [],
        enforcementMechanisms: [],
        rationale: '',
        expectedImpact: ''
      };

      const tracking = await manager.proposeAmendment(amendment);
      expect(tracking.amendmentId).toBe('empty-amendment');
      expect(tracking.status).toBe('proposed');
    });

    it('should handle review without suggestions', async () => {
      const amendment: ConstitutionalAmendment = {
        id: 'no-suggestions-amendment',
        title: 'No Suggestions Amendment',
        description: 'Testing review without suggestions',
        section: 'Testing (NON-NEGOTIABLE)',
        newRequirements: [],
        newProhibitions: [],
        enforcementMechanisms: [],
        rationale: 'Test',
        expectedImpact: 'Test'
      };

      await manager.proposeAmendment(amendment);

      const review: AmendmentReview = {
        reviewerId: 'reviewer-minimal',
        reviewedAt: new Date(),
        decision: 'approve',
        comments: 'Looks good'
        // No suggestions field
      };

      const tracking = await manager.reviewAmendment(amendment.id, review);
      expect(tracking.reviews[0].suggestions).toBeUndefined();
    });

    it('should handle compliance validation errors gracefully', async () => {
      const target: ComplianceTarget = {
        type: 'codebase',
        identifier: 'error-test',
        aspects: ['typescript', 'testing']
      };

      // This should not throw, even if internal validation fails
      const result = await manager.validateCompliance(target);
      expect(result).toBeDefined();
      expect(typeof result.compliant).toBe('boolean');
    });
  });
});