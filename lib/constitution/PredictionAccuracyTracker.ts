/**
 * Prediction Accuracy Tracker Implementation
 * 
 * Implements comprehensive prediction accuracy tracking for Constitutional Amendment v2.6.0.
 * Records test outcome predictions, measures accuracy, analyzes trends, and generates learning insights.
 * 
 * Enables continuous improvement of task completion validation and prediction methodologies.
 */

import * as fs from 'fs';
import * as path from 'path';

export interface PredictionRecord {
  predictionId: string;
  taskId: string;
  timestamp: Date;
  prediction: {
    expectedOutcome: 'PASS' | 'FAIL';
    reasoning: string;
    confidence: number; // 0-100%
    implementationChanges: string[];
    affectedTests: string[];
    performanceImplications: string[];
  };
  actualResult?: {
    outcome: 'PASS' | 'FAIL';
    executionTime: number;
    exitCode: number;
    output: string;
    testResults: {
      total: number;
      passed: number;
      failed: number;
      skipped: number;
    };
    timestamp: Date;
  };
  accuracy?: 'CORRECT' | 'INCORRECT';
  analysisComplete: boolean;
  learningNotes?: string[];
}

export interface AccuracyMetrics {
  totalPredictions: number;
  correctPredictions: number;
  incorrectPredictions: number;
  overallAccuracy: number; // percentage
  passPredictionAccuracy: number;
  failPredictionAccuracy: number;
  averageConfidence: number;
  confidenceCalibration: number; // How well confidence matches accuracy
}

export interface TrendAnalysis {
  timeRange: {
    start: Date;
    end: Date;
  };
  dataPoints: number;
  accuracyTrend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  trendSlope: number; // Rate of change
  movingAverage: number[];
  significantChanges: Array<{
    date: Date;
    change: string;
    impactOnAccuracy: number;
  }>;
}

export interface LearningInsight {
  insightId: string;
  category: 'METHODOLOGY' | 'PATTERN' | 'TREND' | 'BIAS' | 'PERFORMANCE';
  title: string;
  description: string;
  confidence: number;
  actionableRecommendations: string[];
  supportingData: {
    sampleSize: number;
    correlationStrength: number;
    statisticalSignificance: number;
  };
  implementationPriority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface BiasAnalysis {
  optimismBias: {
    detected: boolean;
    strength: number; // -100 to 100, positive = optimistic
    examples: string[];
  };
  pessimismBias: {
    detected: boolean;
    strength: number;
    examples: string[];
  };
  overconfidenceBias: {
    detected: boolean;
    calibrationError: number; // How far off confidence is from accuracy
    examples: string[];
  };
  recommendations: string[];
}

export class PredictionAccuracyTrackerImpl {
  private readonly dataPath: string;
  private predictions: Map<string, PredictionRecord> = new Map();
  private accuracyHistory: AccuracyMetrics[] = [];

  constructor() {
    this.dataPath = path.join(process.cwd(), '.constitutional', 'predictions');
    this.ensureDataDirectory();
    this.loadExistingData();
  }

  /**
   * Records a new test outcome prediction
   */
  async recordPrediction(
    taskId: string,
    expectedOutcome: 'PASS' | 'FAIL',
    reasoning: string,
    confidence: number,
    implementationChanges: string[] = [],
    affectedTests: string[] = [],
    performanceImplications: string[] = []
  ): Promise<string> {
    const predictionId = this.generatePredictionId();
    
    const record: PredictionRecord = {
      predictionId,
      taskId,
      timestamp: new Date(),
      prediction: {
        expectedOutcome,
        reasoning,
        confidence: Math.max(0, Math.min(100, confidence)),
        implementationChanges,
        affectedTests,
        performanceImplications
      },
      analysisComplete: false
    };

    this.predictions.set(predictionId, record);
    await this.saveData();

    console.log(`📊 Prediction recorded: ${predictionId} (${expectedOutcome}, ${confidence}% confidence)`);
    
    return predictionId;
  }

  /**
   * Records the actual test execution result and calculates accuracy
   */
  async recordActualResult(
    predictionId: string,
    outcome: 'PASS' | 'FAIL',
    executionTime: number,
    exitCode: number,
    output: string,
    testResults: PredictionRecord['actualResult']['testResults']
  ): Promise<void> {
    const record = this.predictions.get(predictionId);
    
    if (!record) {
      throw new Error(`Prediction ${predictionId} not found`);
    }

    record.actualResult = {
      outcome,
      executionTime,
      exitCode,
      output,
      testResults,
      timestamp: new Date()
    };

    record.accuracy = record.prediction.expectedOutcome === outcome ? 'CORRECT' : 'INCORRECT';
    
    await this.saveData();
    await this.updateAccuracyMetrics();

    const accuracyIcon = record.accuracy === 'CORRECT' ? '✅' : '❌';
    console.log(`${accuracyIcon} Accuracy recorded: ${predictionId} - ${record.accuracy}`);
    console.log(`   Predicted: ${record.prediction.expectedOutcome}, Actual: ${outcome}`);
  }

  /**
   * Calculates current accuracy metrics
   */
  async calculateAccuracyMetrics(): Promise<AccuracyMetrics> {
    const completedPredictions = Array.from(this.predictions.values())
      .filter(p => p.accuracy !== undefined);

    const totalPredictions = completedPredictions.length;
    const correctPredictions = completedPredictions.filter(p => p.accuracy === 'CORRECT').length;
    const incorrectPredictions = totalPredictions - correctPredictions;

    const overallAccuracy = totalPredictions > 0 ? (correctPredictions / totalPredictions) * 100 : 0;

    // Calculate prediction-specific accuracy
    const passPredictions = completedPredictions.filter(p => p.prediction.expectedOutcome === 'PASS');
    const failPredictions = completedPredictions.filter(p => p.prediction.expectedOutcome === 'FAIL');

    const passPredictionAccuracy = passPredictions.length > 0 
      ? (passPredictions.filter(p => p.accuracy === 'CORRECT').length / passPredictions.length) * 100 
      : 0;

    const failPredictionAccuracy = failPredictions.length > 0 
      ? (failPredictions.filter(p => p.accuracy === 'CORRECT').length / failPredictions.length) * 100 
      : 0;

    // Calculate average confidence
    const averageConfidence = completedPredictions.length > 0 
      ? completedPredictions.reduce((sum, p) => sum + p.prediction.confidence, 0) / completedPredictions.length
      : 0;

    // Calculate confidence calibration (how well confidence matches accuracy)
    const confidenceCalibration = this.calculateConfidenceCalibration(completedPredictions);

    return {
      totalPredictions,
      correctPredictions,
      incorrectPredictions,
      overallAccuracy,
      passPredictionAccuracy,
      failPredictionAccuracy,
      averageConfidence,
      confidenceCalibration
    };
  }

  /**
   * Analyzes accuracy trends over time
   */
  async analyzeTrends(days: number = 30): Promise<TrendAnalysis> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    const relevantPredictions = Array.from(this.predictions.values())
      .filter(p => 
        p.accuracy !== undefined && 
        p.timestamp >= startDate && 
        p.timestamp <= endDate
      )
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    const dataPoints = relevantPredictions.length;

    if (dataPoints < 5) {
      return {
        timeRange: { start: startDate, end: endDate },
        dataPoints,
        accuracyTrend: 'STABLE',
        trendSlope: 0,
        movingAverage: [],
        significantChanges: []
      };
    }

    // Calculate moving average with window size 5
    const movingAverage = this.calculateMovingAverage(relevantPredictions, 5);
    
    // Calculate trend slope using linear regression
    const trendSlope = this.calculateTrendSlope(movingAverage);
    
    // Determine trend direction
    let accuracyTrend: 'IMPROVING' | 'STABLE' | 'DECLINING' = 'STABLE';
    if (trendSlope > 0.02) {
      accuracyTrend = 'IMPROVING';
    } else if (trendSlope < -0.02) {
      accuracyTrend = 'DECLINING';
    }

    // Identify significant changes
    const significantChanges = this.identifySignificantChanges(relevantPredictions, movingAverage);

    return {
      timeRange: { start: startDate, end: endDate },
      dataPoints,
      accuracyTrend,
      trendSlope,
      movingAverage,
      significantChanges
    };
  }

  /**
   * Generates learning insights from prediction data
   */
  async generateLearningInsights(): Promise<LearningInsight[]> {
    const insights: LearningInsight[] = [];
    const completedPredictions = Array.from(this.predictions.values())
      .filter(p => p.accuracy !== undefined);

    if (completedPredictions.length < 10) {
      return [{
        insightId: 'insufficient_data',
        category: 'METHODOLOGY',
        title: 'Insufficient Data for Learning',
        description: 'More prediction data needed to generate meaningful insights',
        confidence: 90,
        actionableRecommendations: ['Continue making predictions to build learning dataset'],
        supportingData: {
          sampleSize: completedPredictions.length,
          correlationStrength: 0,
          statisticalSignificance: 0
        },
        implementationPriority: 'MEDIUM'
      }];
    }

    // Analyze prediction patterns
    await this.analyzeReasoningPatterns(insights, completedPredictions);
    await this.analyzePerformancePatterns(insights, completedPredictions);
    await this.analyzeConfidencePatterns(insights, completedPredictions);
    await this.analyzeBiasPatterns(insights, completedPredictions);

    return insights.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Analyzes bias in predictions
   */
  async analyzeBias(): Promise<BiasAnalysis> {
    const completedPredictions = Array.from(this.predictions.values())
      .filter(p => p.accuracy !== undefined);

    // Optimism bias: tendency to predict PASS more often than warranted
    const passPredictions = completedPredictions.filter(p => p.prediction.expectedOutcome === 'PASS');
    const passAccuracy = passPredictions.length > 0 
      ? passPredictions.filter(p => p.accuracy === 'CORRECT').length / passPredictions.length
      : 0;

    const failPredictions = completedPredictions.filter(p => p.prediction.expectedOutcome === 'FAIL');
    const failAccuracy = failPredictions.length > 0 
      ? failPredictions.filter(p => p.accuracy === 'CORRECT').length / failPredictions.length
      : 0;

    const optimismBias = {
      detected: passPredictions.length > failPredictions.length * 2 && passAccuracy < 0.7,
      strength: (passPredictions.length / completedPredictions.length - 0.5) * 200, // -100 to 100
      examples: passPredictions
        .filter(p => p.accuracy === 'INCORRECT')
        .slice(0, 3)
        .map(p => `Task ${p.taskId}: ${p.prediction.reasoning.substring(0, 100)}...`)
    };

    const pessimismBias = {
      detected: failPredictions.length > passPredictions.length * 2 && failAccuracy < 0.7,
      strength: (failPredictions.length / completedPredictions.length - 0.5) * 200,
      examples: failPredictions
        .filter(p => p.accuracy === 'INCORRECT')
        .slice(0, 3)
        .map(p => `Task ${p.taskId}: ${p.prediction.reasoning.substring(0, 100)}...`)
    };

    // Overconfidence bias: confidence higher than accuracy
    const calibrationError = this.calculateConfidenceCalibration(completedPredictions);
    const overconfidenceBias = {
      detected: calibrationError > 15, // More than 15% calibration error
      calibrationError,
      examples: completedPredictions
        .filter(p => p.accuracy === 'INCORRECT' && p.prediction.confidence > 80)
        .slice(0, 3)
        .map(p => `Task ${p.taskId}: ${p.prediction.confidence}% confidence, but incorrect`)
    };

    const recommendations: string[] = [];
    
    if (optimismBias.detected) {
      recommendations.push('Consider implementation complexity and testing challenges more thoroughly');
      recommendations.push('Review past failures to understand common failure patterns');
    }
    
    if (pessimismBias.detected) {
      recommendations.push('Recognize test suite resilience and implementation quality');
      recommendations.push('Consider positive factors in change impact assessment');
    }
    
    if (overconfidenceBias.detected) {
      recommendations.push('Calibrate confidence more carefully with historical accuracy');
      recommendations.push('Use confidence ranges rather than point estimates');
    }

    return {
      optimismBias,
      pessimismBias,
      overconfidenceBias,
      recommendations
    };
  }

  /**
   * Gets prediction statistics for constitutional monitoring
   */
  getStatistics(): {
    totalPredictions: number;
    accuracy: number;
    recentTrend: string;
    topInsights: string[];
    performanceImpact: {
      averageExecutionTime: number;
      constitutionalCompliance: number;
    };
  } {
    const completedPredictions = Array.from(this.predictions.values())
      .filter(p => p.accuracy !== undefined);

    const totalPredictions = completedPredictions.length;
    const accuracy = totalPredictions > 0 
      ? (completedPredictions.filter(p => p.accuracy === 'CORRECT').length / totalPredictions) * 100
      : 0;

    // Get recent trend (last 10 predictions)
    const recentPredictions = completedPredictions.slice(-10);
    const recentAccuracy = recentPredictions.length > 0 
      ? (recentPredictions.filter(p => p.accuracy === 'CORRECT').length / recentPredictions.length) * 100
      : 0;

    let recentTrend = 'stable';
    if (recentAccuracy > accuracy + 5) {
      recentTrend = 'improving';
    } else if (recentAccuracy < accuracy - 5) {
      recentTrend = 'declining';
    }

    // Calculate performance impact
    const predictionsWithResults = completedPredictions.filter(p => p.actualResult);
    const averageExecutionTime = predictionsWithResults.length > 0
      ? predictionsWithResults.reduce((sum, p) => sum + p.actualResult!.executionTime, 0) / predictionsWithResults.length
      : 0;

    const constitutionalCompliance = predictionsWithResults.length > 0
      ? (predictionsWithResults.filter(p => p.actualResult!.executionTime <= 60).length / predictionsWithResults.length) * 100
      : 0;

    return {
      totalPredictions,
      accuracy,
      recentTrend,
      topInsights: [
        `${accuracy.toFixed(1)}% overall prediction accuracy`,
        `${recentTrend} trend in recent predictions`,
        `${averageExecutionTime.toFixed(1)}s average execution time`
      ],
      performanceImpact: {
        averageExecutionTime,
        constitutionalCompliance
      }
    };
  }

  // Private helper methods

  private ensureDataDirectory(): void {
    const dir = path.dirname(this.dataPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private async loadExistingData(): Promise<void> {
    const filePath = path.join(this.dataPath, 'predictions.json');
    
    if (fs.existsSync(filePath)) {
      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        // Convert dates back from JSON
        data.forEach((record: any) => {
          record.timestamp = new Date(record.timestamp);
          if (record.actualResult) {
            record.actualResult.timestamp = new Date(record.actualResult.timestamp);
          }
          this.predictions.set(record.predictionId, record);
        });
        
        console.log(`📊 Loaded ${this.predictions.size} prediction records`);
      } catch (error) {
        console.warn('Failed to load prediction data:', error);
      }
    }
  }

  private async saveData(): Promise<void> {
    const filePath = path.join(this.dataPath, 'predictions.json');
    const data = Array.from(this.predictions.values());
    
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to save prediction data:', error);
    }
  }

  private async updateAccuracyMetrics(): Promise<void> {
    const metrics = await this.calculateAccuracyMetrics();
    this.accuracyHistory.push(metrics);
    
    // Keep only last 100 metrics for memory efficiency
    if (this.accuracyHistory.length > 100) {
      this.accuracyHistory = this.accuracyHistory.slice(-100);
    }
  }

  private generatePredictionId(): string {
    return `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateConfidenceCalibration(predictions: PredictionRecord[]): number {
    if (predictions.length === 0) return 0;

    // Group by confidence buckets
    const buckets = new Array(10).fill(0).map(() => ({ total: 0, correct: 0 }));
    
    predictions.forEach(p => {
      const bucketIndex = Math.min(9, Math.floor(p.prediction.confidence / 10));
      buckets[bucketIndex].total++;
      if (p.accuracy === 'CORRECT') {
        buckets[bucketIndex].correct++;
      }
    });

    // Calculate calibration error
    let totalError = 0;
    let totalPredictions = 0;
    
    buckets.forEach((bucket, index) => {
      if (bucket.total > 0) {
        const expectedAccuracy = (index * 10 + 5) / 100; // Midpoint of bucket
        const actualAccuracy = bucket.correct / bucket.total;
        const error = Math.abs(expectedAccuracy - actualAccuracy);
        totalError += error * bucket.total;
        totalPredictions += bucket.total;
      }
    });

    return totalPredictions > 0 ? (totalError / totalPredictions) * 100 : 0;
  }

  private calculateMovingAverage(predictions: PredictionRecord[], windowSize: number): number[] {
    const movingAvg: number[] = [];
    
    for (let i = 0; i < predictions.length; i++) {
      const start = Math.max(0, i - windowSize + 1);
      const window = predictions.slice(start, i + 1);
      const accuracy = window.filter(p => p.accuracy === 'CORRECT').length / window.length;
      movingAvg.push(accuracy);
    }
    
    return movingAvg;
  }

  private calculateTrendSlope(values: number[]): number {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const sumX = (n * (n - 1)) / 2; // 0 + 1 + 2 + ... + (n-1)
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, index) => sum + val * index, 0);
    const sumX2 = values.reduce((sum, _, index) => sum + index * index, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  }

  private identifySignificantChanges(predictions: PredictionRecord[], movingAverage: number[]): TrendAnalysis['significantChanges'] {
    const changes: TrendAnalysis['significantChanges'] = [];
    
    for (let i = 1; i < movingAverage.length; i++) {
      const change = movingAverage[i] - movingAverage[i - 1];
      
      if (Math.abs(change) > 0.15) { // 15% change threshold
        changes.push({
          date: predictions[i].timestamp,
          change: change > 0 ? 'Accuracy improved significantly' : 'Accuracy declined significantly',
          impactOnAccuracy: change * 100
        });
      }
    }
    
    return changes;
  }

  private async analyzeReasoningPatterns(insights: LearningInsight[], predictions: PredictionRecord[]): Promise<void> {
    const incorrectPredictions = predictions.filter(p => p.accuracy === 'INCORRECT');
    
    if (incorrectPredictions.length >= 5) {
      // Analyze common reasoning patterns in incorrect predictions
      const reasoningWords = incorrectPredictions
        .map(p => p.prediction.reasoning.toLowerCase())
        .join(' ')
        .split(/\s+/);
      
      const wordCounts = reasoningWords.reduce((counts, word) => {
        counts[word] = (counts[word] || 0) + 1;
        return counts;
      }, {} as Record<string, number>);
      
      const commonWords = Object.entries(wordCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([word]) => word);

      insights.push({
        insightId: 'reasoning_patterns',
        category: 'PATTERN',
        title: 'Common Reasoning Patterns in Incorrect Predictions',
        description: `Analysis of ${incorrectPredictions.length} incorrect predictions reveals common reasoning patterns`,
        confidence: 75,
        actionableRecommendations: [
          'Review reasoning methodology for these common patterns',
          'Consider additional factors not captured in current reasoning',
          'Validate assumptions more thoroughly'
        ],
        supportingData: {
          sampleSize: incorrectPredictions.length,
          correlationStrength: 0.6,
          statisticalSignificance: incorrectPredictions.length >= 10 ? 0.8 : 0.6
        },
        implementationPriority: 'MEDIUM'
      });
    }
  }

  private async analyzePerformancePatterns(insights: LearningInsight[], predictions: PredictionRecord[]): Promise<void> {
    const performancePredictions = predictions.filter(p => 
      p.actualResult && p.prediction.performanceImplications.length > 0
    );

    if (performancePredictions.length >= 5) {
      const avgExecutionTime = performancePredictions.reduce(
        (sum, p) => sum + p.actualResult!.executionTime, 0
      ) / performancePredictions.length;

      const constitutionalCompliance = performancePredictions.filter(
        p => p.actualResult!.executionTime <= 60
      ).length / performancePredictions.length;

      insights.push({
        insightId: 'performance_patterns',
        category: 'PERFORMANCE',
        title: 'Performance Prediction Patterns',
        description: `Average execution time: ${avgExecutionTime.toFixed(1)}s, Constitutional compliance: ${(constitutionalCompliance * 100).toFixed(1)}%`,
        confidence: 80,
        actionableRecommendations: [
          avgExecutionTime > 45 ? 'Focus on performance optimization strategies' : 'Continue current performance approach',
          constitutionalCompliance < 0.8 ? 'Improve performance prediction accuracy' : 'Maintain performance prediction quality'
        ],
        supportingData: {
          sampleSize: performancePredictions.length,
          correlationStrength: 0.7,
          statisticalSignificance: 0.8
        },
        implementationPriority: avgExecutionTime > 60 ? 'HIGH' : 'MEDIUM'
      });
    }
  }

  private async analyzeConfidencePatterns(insights: LearningInsight[], predictions: PredictionRecord[]): Promise<void> {
    const highConfidencePredictions = predictions.filter(p => p.prediction.confidence >= 80);
    const highConfidenceAccuracy = highConfidencePredictions.length > 0
      ? (highConfidencePredictions.filter(p => p.accuracy === 'CORRECT').length / highConfidencePredictions.length) * 100
      : 0;

    if (highConfidencePredictions.length >= 5) {
      insights.push({
        insightId: 'confidence_patterns',
        category: 'BIAS',
        title: 'High Confidence Prediction Analysis',
        description: `${highConfidenceAccuracy.toFixed(1)}% accuracy for ${highConfidencePredictions.length} high-confidence predictions (≥80%)`,
        confidence: 85,
        actionableRecommendations: 
          highConfidenceAccuracy < 85 
            ? ['Recalibrate confidence assessment methodology', 'Be more conservative with high confidence ratings']
            : ['Continue current confidence calibration approach'],
        supportingData: {
          sampleSize: highConfidencePredictions.length,
          correlationStrength: 0.8,
          statisticalSignificance: 0.9
        },
        implementationPriority: highConfidenceAccuracy < 70 ? 'HIGH' : 'LOW'
      });
    }
  }

  private async analyzeBiasPatterns(insights: LearningInsight[], predictions: PredictionRecord[]): Promise<void> {
    const biasAnalysis = await this.analyzeBias();
    
    if (biasAnalysis.optimismBias.detected || biasAnalysis.pessimismBias.detected || biasAnalysis.overconfidenceBias.detected) {
      const detectedBiases = [];
      
      if (biasAnalysis.optimismBias.detected) detectedBiases.push('optimism');
      if (biasAnalysis.pessimismBias.detected) detectedBiases.push('pessimism');
      if (biasAnalysis.overconfidenceBias.detected) detectedBiases.push('overconfidence');

      insights.push({
        insightId: 'bias_patterns',
        category: 'BIAS',
        title: `Prediction Bias Detected: ${detectedBiases.join(', ')}`,
        description: `Analysis detected systematic bias in prediction patterns`,
        confidence: 90,
        actionableRecommendations: biasAnalysis.recommendations,
        supportingData: {
          sampleSize: predictions.length,
          correlationStrength: 0.9,
          statisticalSignificance: 0.95
        },
        implementationPriority: 'HIGH'
      });
    }
  }
}