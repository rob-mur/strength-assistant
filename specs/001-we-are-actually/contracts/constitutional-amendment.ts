/**
 * Contract: Constitutional Amendment Interface
 * 
 * Defines the interface for managing constitutional amendments
 * related to TypeScript testing requirements and enforcement.
 */

export interface ConstitutionalAmendmentManager {
  /**
   * Proposes a new constitutional amendment
   * @param amendment Amendment details to propose
   * @returns Promise resolving to amendment tracking information
   */
  proposeAmendment(amendment: ConstitutionalAmendment): Promise<AmendmentTrackingInfo>;
  
  /**
   * Reviews a proposed amendment
   * @param amendmentId Unique identifier of the amendment
   * @param review Review details and decision
   * @returns Promise resolving to updated tracking information
   */
  reviewAmendment(amendmentId: string, review: AmendmentReview): Promise<AmendmentTrackingInfo>;
  
  /**
   * Enacts an approved amendment
   * @param amendmentId Unique identifier of the amendment
   * @returns Promise resolving to enforcement configuration
   */
  enactAmendment(amendmentId: string): Promise<EnforcementConfiguration>;
  
  /**
   * Gets current constitutional requirements
   * @returns Current active constitutional requirements
   */
  getCurrentRequirements(): ConstitutionalRequirements;
  
  /**
   * Validates compliance with constitutional requirements
   * @param target System or component to validate
   * @returns Promise resolving to compliance status
   */
  validateCompliance(target: ComplianceTarget): Promise<ComplianceResult>;
}

export interface ConstitutionalAmendment {
  /** Unique identifier for the amendment */
  id: string;
  
  /** Human-readable title */
  title: string;
  
  /** Detailed description of the amendment */
  description: string;
  
  /** Constitutional section being amended */
  section: ConstitutionalSection;
  
  /** New requirements being added */
  newRequirements: string[];
  
  /** New prohibitions being added */
  newProhibitions: string[];
  
  /** Enforcement mechanisms */
  enforcementMechanisms: EnforcementMechanism[];
  
  /** Justification for the amendment */
  rationale: string;
  
  /** Expected impact and benefits */
  expectedImpact: string;
}

export type ConstitutionalSection = 
  | 'Testing (NON-NEGOTIABLE)'
  | 'Simplicity'
  | 'Architecture' 
  | 'Observability'
  | 'Versioning';

export interface AmendmentTrackingInfo {
  /** Amendment identifier */
  amendmentId: string;
  
  /** Current status */
  status: AmendmentStatus;
  
  /** Creation timestamp */
  createdAt: Date;
  
  /** Last update timestamp */
  updatedAt: Date;
  
  /** Review history */
  reviews: AmendmentReview[];
  
  /** Current version number */
  version: string;
}

export type AmendmentStatus = 
  | 'draft'
  | 'proposed' 
  | 'under-review'
  | 'approved'
  | 'enacted'
  | 'rejected';

export interface AmendmentReview {
  /** Reviewer identifier */
  reviewerId: string;
  
  /** Review timestamp */
  reviewedAt: Date;
  
  /** Review decision */
  decision: ReviewDecision;
  
  /** Review comments */
  comments: string;
  
  /** Suggested modifications */
  suggestions?: string[];
}

export type ReviewDecision = 
  | 'approve'
  | 'reject'
  | 'request-changes';

export interface EnforcementConfiguration {
  /** Amendment being enforced */
  amendmentId: string;
  
  /** Enforcement mechanisms to activate */
  mechanisms: ActiveEnforcementMechanism[];
  
  /** Grace period before enforcement begins */
  gracePeriodDays: number;
  
  /** Monitoring and reporting configuration */
  monitoring: EnforcementMonitoring;
}

export interface ActiveEnforcementMechanism {
  /** Type of enforcement */
  type: EnforcementType;
  
  /** Configuration for this enforcement */
  configuration: EnforcementMechanismConfig;
  
  /** Whether enforcement is active */
  active: boolean;
}

export type EnforcementType = 
  | 'pre-commit-hook'
  | 'ci-validation'
  | 'ide-integration'
  | 'documentation-update';

export interface EnforcementMechanism {
  type: EnforcementType;
  description: string;
  configuration: EnforcementMechanismConfig;
}

export interface EnforcementMechanismConfig {
  /** Command to execute for validation */
  command?: string;
  
  /** Files or patterns to validate */
  targets?: string[];
  
  /** Failure behavior */
  onFailure: 'block' | 'warn' | 'report';
  
  /** Additional configuration parameters */
  parameters?: Record<string, any>;
}

export interface EnforcementMonitoring {
  /** Whether to track compliance metrics */
  enableMetrics: boolean;
  
  /** Reporting frequency */
  reportingInterval: 'daily' | 'weekly' | 'monthly';
  
  /** Alert thresholds */
  alertThresholds: {
    violationCount: number;
    timeWindow: string;
  };
}

export interface ConstitutionalRequirements {
  /** Current constitutional version */
  version: string;
  
  /** Requirements by section */
  requirementsBySection: Record<ConstitutionalSection, string[]>;
  
  /** Prohibitions by section */
  prohibitionsBySection: Record<ConstitutionalSection, string[]>;
  
  /** Active enforcement mechanisms */
  activeEnforcements: ActiveEnforcementMechanism[];
}

export interface ComplianceTarget {
  /** Type of target being validated */
  type: 'codebase' | 'configuration' | 'process';
  
  /** Identifier for the target */
  identifier: string;
  
  /** Specific aspects to validate */
  aspects: string[];
}

export interface ComplianceResult {
  /** Overall compliance status */
  compliant: boolean;
  
  /** Violations found */
  violations: ComplianceViolation[];
  
  /** Compliance score (0-100) */
  score: number;
  
  /** Recommended actions */
  recommendations: string[];
  
  /** Validation timestamp */
  validatedAt: Date;
}

export interface ComplianceViolation {
  /** Constitutional requirement that was violated */
  requirement: string;
  
  /** Description of the violation */
  description: string;
  
  /** Severity level */
  severity: 'critical' | 'major' | 'minor';
  
  /** Specific location or context of violation */
  context: string;
  
  /** Suggested resolution */
  resolution: string;
}