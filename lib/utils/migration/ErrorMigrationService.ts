/**
 * ErrorMigrationService Implementation
 *
 * Service for systematically scanning and replacing empty catch blocks
 * throughout the codebase with proper error handling.
 */

import {
  ErrorMigrationService as IErrorMigrationService,
  EmptyCatchBlock,
  MigrationPlan,
  MigrationResult,
  MigrationPriority,
  ReplacementTemplate,
} from "../../../specs/011-improve-error-logging/contracts/error-migration";

import { CodeAnalysisService } from "./CodeAnalysisService";
import { LoggingService } from "../../../specs/011-improve-error-logging/contracts/logging-service";

export class ErrorMigrationService implements IErrorMigrationService {
  private readonly codeAnalysisService: CodeAnalysisService;
  private readonly templates: Map<string, ReplacementTemplate> = new Map();

  constructor() {
    this.codeAnalysisService = new CodeAnalysisService();
    this.initializeTemplates();
  }

  /**
   * Scan codebase for empty catch blocks
   */
  async scanForEmptyCatchBlocks(
    rootPath: string,
    filePatterns: string[],
    excludePatterns: string[] = [],
  ): Promise<EmptyCatchBlock[]> {
    try {
      const files = await this.codeAnalysisService.findFiles(
        rootPath,
        filePatterns,
        excludePatterns,
      );

      const emptyCatchBlocks: EmptyCatchBlock[] = [];

      for (const filePath of files) {
        try {
          const blocks = await this.analyzeFileForEmptyCatchBlocks(filePath);
          emptyCatchBlocks.push(...blocks);
        } catch (fileError) {
          console.warn(`Failed to analyze file ${filePath}:`, fileError);
        }
      }

      return emptyCatchBlocks;
    } catch (error) {
      throw new Error(`Failed to scan for empty catch blocks: ${error}`);
    }
  }

  /**
   * Create migration plan from empty catch blocks
   */
  createMigrationPlan(emptyCatchBlocks: EmptyCatchBlock[]): MigrationPlan {
    const blocksByFile = new Map<string, EmptyCatchBlock[]>();
    const blocksByErrorType = new Map<string, EmptyCatchBlock[]>();

    // Group blocks by file and error type
    for (const block of emptyCatchBlocks) {
      // Group by file
      if (!blocksByFile.has(block.filePath)) {
        blocksByFile.set(block.filePath, []);
      }
      blocksByFile.get(block.filePath)!.push(block);

      // Group by error type
      if (!blocksByErrorType.has(block.errorType)) {
        blocksByErrorType.set(block.errorType, []);
      }
      blocksByErrorType.get(block.errorType)!.push(block);
    }

    // Create priority order
    const priorityOrder = this.prioritizeBlocks(emptyCatchBlocks);

    return {
      totalEmptyCatchBlocks: emptyCatchBlocks.length,
      blocksByFile,
      blocksByErrorType,
      priorityOrder,
    };
  }

  /**
   * Migrate a single catch block
   */
  async migrateCatchBlock(
    block: EmptyCatchBlock,
    _loggingService: LoggingService,
  ): Promise<MigrationResult> {
    try {
      const replacementCode = this.generateReplacementCode(
        block,
        block.contextOperation,
      );

      // Read the file
      const content = await this.codeAnalysisService.readFile(block.filePath);
      const lines = content.split("\n");

      // Find and replace the catch block
      const updatedLines = this.replaceCatchBlock(
        lines,
        block,
        replacementCode,
      );
      const newContent = updatedLines.join("\n");

      // Write the updated file
      await this.codeAnalysisService.writeFile(block.filePath, newContent);

      return {
        blockId: `${block.filePath}:${block.lineNumber}`,
        filePath: block.filePath,
        lineNumber: block.lineNumber,
        migrationStatus: "success",
        newCodeSnippet: replacementCode,
      };
    } catch (error) {
      return {
        blockId: `${block.filePath}:${block.lineNumber}`,
        filePath: block.filePath,
        lineNumber: block.lineNumber,
        migrationStatus: "failed",
        errorMessage: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Migrate all catch blocks according to plan
   */
  async migrateAllCatchBlocks(
    plan: MigrationPlan,
    loggingService: LoggingService,
  ): Promise<MigrationResult[]> {
    const results: MigrationResult[] = [];

    for (const block of plan.priorityOrder) {
      const result = await this.migrateCatchBlock(block, loggingService);
      results.push(result);

      // Stop on first failure unless in force mode
      if (result.migrationStatus === "failed") {
        console.error(
          `Migration failed for ${block.filePath}:${block.lineNumber}`,
        );
      }
    }

    return results;
  }

  /**
   * Generate replacement code for empty catch block
   */
  generateReplacementCode(block: EmptyCatchBlock, operation: string): string {
    const template = this.getTemplateForBlock(block);

    let replacementCode = template.template;

    // Replace template variables
    replacementCode = replacementCode
      .replaceAll(/\{operation\}/g, operation)
      .replaceAll(/\{errorType\}/g, block.errorType)
      .replaceAll(
        /\{functionName\}/g,
        block.functionName || "unknown-function",
      );

    return replacementCode;
  }

  /**
   * Validate migration didn't break functionality
   */
  async validateMigration(filePath: string): Promise<{
    isValid: boolean;
    compilationErrors?: string[];
    testFailures?: string[];
  }> {
    try {
      const isValid = await this.codeAnalysisService.validateSyntax(filePath);
      return { isValid };
    } catch (error) {
      return {
        isValid: false,
        compilationErrors: [
          error instanceof Error ? error.message : String(error),
        ],
      };
    }
  }

  /**
   * Private helper methods
   */

  private async analyzeFileForEmptyCatchBlocks(
    filePath: string,
  ): Promise<EmptyCatchBlock[]> {
    const content = await this.codeAnalysisService.readFile(filePath);
    const lines = content.split("\n");
    const blocks: EmptyCatchBlock[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (this.isCatchBlockStart(line)) {
        if (this.isCatchBlockEmpty(lines, i)) {
          const context =
            await this.codeAnalysisService.extractCatchBlockContext(
              filePath,
              i + 1,
            );

          const block: EmptyCatchBlock = {
            filePath,
            lineNumber: i + 1,
            functionName: context.functionName,
            contextOperation: context.operation,
            errorType: context.errorType,
            isTransient: context.isTransient,
            currentHandling: "empty",
            suggestedAction: this.determineSuggestedAction(
              context.errorType,
              context.isTransient,
            ),
          };

          blocks.push(block);
        }
      }
    }

    return blocks;
  }

  private isCatchBlockStart(line: string): boolean {
    return /\s*catch\s*\(/.test(line);
  }

  private isCatchBlockEmpty(lines: string[], catchLineIndex: number): boolean {
    const openBraceIndex = this.findOpeningBrace(lines, catchLineIndex);
    if (openBraceIndex === -1) return false;

    const closeBraceIndex = this.findClosingBrace(lines, openBraceIndex);
    if (closeBraceIndex === -1) return false;

    // Check for meaningful content between braces
    for (let i = openBraceIndex + 1; i < closeBraceIndex; i++) {
      const line = lines[i].trim();
      if (line && !line.startsWith("//") && !line.startsWith("/*")) {
        return false;
      }
    }

    return true;
  }

  private findOpeningBrace(lines: string[], startIndex: number): number {
    for (let i = startIndex; i < lines.length; i++) {
      if (lines[i].includes("{")) {
        return i;
      }
    }
    return -1;
  }

  private findClosingBrace(lines: string[], startIndex: number): number {
    let braceCount = 0;

    for (let i = startIndex; i < lines.length; i++) {
      for (const char of lines[i]) {
        if (char === "{") braceCount++;
        else if (char === "}") {
          braceCount--;
          if (braceCount === 0) return i;
        }
      }
    }

    return -1;
  }

  private determineSuggestedAction(
    errorType: string,
    isTransient: boolean,
  ): "log-only" | "log-and-retry" | "log-and-fail" | "log-and-fallback" {
    if (isTransient && (errorType === "Network" || errorType === "Database")) {
      return "log-and-retry";
    }

    if (errorType === "Authentication") {
      return "log-and-fallback";
    }

    if (errorType === "Storage" || errorType === "Database") {
      return "log-and-fail";
    }

    return "log-only";
  }

  private prioritizeBlocks(blocks: EmptyCatchBlock[]): EmptyCatchBlock[] {
    return blocks.sort((a, b) => {
      const priorityA = this.getPriority(a);
      const priorityB = this.getPriority(b);

      return priorityA - priorityB; // Lower number = higher priority
    });
  }

  private getPriority(block: EmptyCatchBlock): MigrationPriority {
    const filePath = block.filePath.toLowerCase();

    // Critical: Storage operations
    if (filePath.includes("storage") || filePath.includes("asyncstorage")) {
      return MigrationPriority.Critical;
    }

    // High: Database and auth operations
    if (
      filePath.includes("supabase") ||
      filePath.includes("auth") ||
      filePath.includes("database") ||
      filePath.includes("repo")
    ) {
      return MigrationPriority.High;
    }

    // Medium: Network and service operations
    if (
      filePath.includes("service") ||
      filePath.includes("api") ||
      filePath.includes("sync") ||
      filePath.includes("data")
    ) {
      return MigrationPriority.Medium;
    }

    // Low: UI operations
    if (
      filePath.includes("component") ||
      filePath.includes("screen") ||
      filePath.includes("ui")
    ) {
      return MigrationPriority.Low;
    }

    // Deferred: Test files
    if (filePath.includes("test") || filePath.includes("spec")) {
      return MigrationPriority.Deferred;
    }

    return MigrationPriority.Medium;
  }

  private getTemplateForBlock(block: EmptyCatchBlock): ReplacementTemplate {
    const template = this.templates.get(block.errorType);
    return template || this.getDefaultTemplate();
  }

  private getDefaultTemplate(): ReplacementTemplate {
    return {
      errorType: "Logic",
      template: `catch (error) {
  loggingService.logError(error, '{operation}', 'Error', '{errorType}')
    .catch(loggingError => console.error('Logging failed:', loggingError));
}`,
      requiredImports: [
        "import { loggingService } from '@/lib/utils/logging';",
      ],
      contextVariables: ["operation", "errorType"],
    };
  }

  private replaceCatchBlock(
    lines: string[],
    block: EmptyCatchBlock,
    replacementCode: string,
  ): string[] {
    const newLines = [...lines];
    const catchStart = block.lineNumber - 1; // Convert to 0-based
    const openBraceIndex = this.findOpeningBrace(lines, catchStart);
    const closeBraceIndex = this.findClosingBrace(lines, openBraceIndex);

    if (openBraceIndex !== -1 && closeBraceIndex !== -1) {
      const replacementLines = replacementCode.split("\n");
      newLines.splice(
        catchStart,
        closeBraceIndex - catchStart + 1,
        ...replacementLines,
      );
    }

    return newLines;
  }

  private initializeTemplates(): void {
    // Network error template
    this.templates.set("Network", {
      errorType: "Network",
      template: `catch (error) {
  loggingService.logError(error, '{operation}', 'Error', 'Network')
    .catch(loggingError => console.error('Logging failed:', loggingError));

  userErrorDisplay?.showNetworkError('{operation}')
    .catch(() => console.warn('Failed to show network error'));

  // TODO: Add retry logic for network operations
}`,
      requiredImports: [
        "import { loggingService, userErrorDisplay } from '@/lib/utils/logging';",
      ],
      contextVariables: ["operation"],
    });

    // Database error template
    this.templates.set("Database", {
      errorType: "Database",
      template: `catch (error) {
  loggingService.logError(error, '{operation}', 'Error', 'Database')
    .catch(loggingError => console.error('Logging failed:', loggingError));

  userErrorDisplay?.showGenericError('{operation}', true)
    .catch(() => console.warn('Failed to show database error'));

  throw error; // Re-throw for upstream handling
}`,
      requiredImports: [
        "import { loggingService, userErrorDisplay } from '@/lib/utils/logging';",
      ],
      contextVariables: ["operation"],
    });

    // Authentication error template
    this.templates.set("Authentication", {
      errorType: "Authentication",
      template: `catch (error) {
  loggingService.logError(error, '{operation}', 'Warning', 'Authentication')
    .catch(loggingError => console.error('Logging failed:', loggingError));

  userErrorDisplay?.showAuthenticationError('{operation}')
    .catch(() => console.warn('Failed to show auth error'));
}`,
      requiredImports: [
        "import { loggingService, userErrorDisplay } from '@/lib/utils/logging';",
      ],
      contextVariables: ["operation"],
    });

    // Storage error template
    this.templates.set("Storage", {
      errorType: "Storage",
      template: `catch (error) {
  loggingService.logError(error, '{operation}', 'Error', 'Database')
    .catch(loggingError => console.error('Logging failed:', loggingError));

  console.warn('Storage operation failed for {operation}:', error.message);
  // TODO: Add storage fallback logic
}`,
      requiredImports: [
        "import { loggingService } from '@/lib/utils/logging';",
      ],
      contextVariables: ["operation"],
    });

    // UI error template
    this.templates.set("UI", {
      errorType: "UI",
      template: `catch (error) {
  loggingService.logError(error, '{operation}', 'Warning', 'UI')
    .catch(loggingError => console.error('Logging failed:', loggingError));

  console.warn('UI error in {operation}:', error.message);
  // TODO: Add UI fallback logic
}`,
      requiredImports: [
        "import { loggingService } from '@/lib/utils/logging';",
      ],
      contextVariables: ["operation"],
    });

    // Logic error template
    this.templates.set("Logic", this.getDefaultTemplate());
  }
}
