/**
 * CodeAnalysisService Implementation
 *
 * Service for analyzing TypeScript/JavaScript code to identify empty catch blocks
 * and extract context information for migration planning.
 */

import {
  CodeAnalysisService as ICodeAnalysisService,
  EmptyCatchBlock,
} from "../../../specs/011-improve-error-logging/contracts/error-migration";

export interface FileAnalysisResult {
  filePath: string;
  emptyCatchBlocks: EmptyCatchBlock[];
  totalCatchBlocks: number;
  analysisTime: number;
}

export class CodeAnalysisService implements ICodeAnalysisService {
  private fs: {
    readFileSync?: (path: string, encoding: string) => string;
    existsSync?: (path: string) => boolean;
    writeFileSync?: (path: string, data: string, encoding?: string) => void;
  } | null = null;
  private path: {
    join?: (...paths: string[]) => string;
    dirname?: (path: string) => string;
    basename?: (path: string) => string;
  } | null = null;
  private glob:
    | ((pattern: string | string[], options?: unknown) => string[])
    | null = null;

  constructor() {
    this.initializeDependencies();
  }

  /**
   * Extract context information from code around catch block
   */
  async extractCatchBlockContext(
    filePath: string,
    lineNumber: number,
  ): Promise<{
    functionName?: string;
    operation: string;
    tryBlockCode: string;
    surroundingCode: string;
    imports: string[];
    errorType:
      | "Network"
      | "Database"
      | "Logic"
      | "UI"
      | "Authentication"
      | "Storage";
    isTransient: boolean;
  }> {
    try {
      const content = await this.readFile(filePath);
      const lines = content.split("\n");

      return this.buildContextFromLines(lines, lineNumber);
    } catch (error) {
      throw new Error(
        `Failed to extract context for ${filePath}:${lineNumber}: ${error}`,
      );
    }
  }

  private buildContextFromLines(lines: string[], lineNumber: number) {
    const surroundingCode = this.getSurroundingCode(lines, lineNumber, 5).join(
      "\n",
    );
    const functionName = this.getFunctionContext(lines, lineNumber);
    const imports = this.extractImports(lines);
    const operation =
      this.extractOperation(lines, lineNumber) || "unknown-operation";
    const tryBlockCode = this.extractTryBlockCode(lines, lineNumber);
    const errorType = this.inferErrorType(lines, lineNumber);
    const isTransient = this.isTransientError(errorType);

    return {
      functionName,
      operation,
      tryBlockCode,
      surroundingCode,
      imports,
      errorType,
      isTransient,
    };
  }

  /**
   * Analyze try block to determine appropriate error handling strategy
   */
  analyzeTryBlock(
    tryBlockCode: string,
    _imports: string[],
  ): {
    errorType:
      | "Network"
      | "Database"
      | "Logic"
      | "UI"
      | "Authentication"
      | "Storage";
    isTransient: boolean;
    suggestedAction:
      | "log-only"
      | "log-and-retry"
      | "log-and-fail"
      | "log-and-fallback";
    confidence: number;
  } {
    const content = tryBlockCode.toLowerCase();
    const { errorType, confidence } = this.analyzeErrorTypeFromContent(content);
    const isTransient = this.isTransientError(errorType);
    const suggestedAction = this.determineSuggestedAction(
      errorType,
      isTransient,
    );

    return {
      errorType,
      isTransient,
      suggestedAction,
      confidence,
    };
  }

  private analyzeErrorTypeFromContent(content: string): {
    errorType:
      | "Network"
      | "Database"
      | "Logic"
      | "UI"
      | "Authentication"
      | "Storage";
    confidence: number;
  } {
    const errorTypeIndicators = new Map([
      [
        "Network",
        {
          keywords: ["fetch", "api", "request", "http", "axios"],
          confidence: 0.9,
        },
      ],
      [
        "Database",
        { keywords: ["supabase", "database", "query", "sql"], confidence: 0.9 },
      ],
      [
        "Storage",
        {
          keywords: ["asyncstorage", "localstorage", "storage", "setitem"],
          confidence: 0.8,
        },
      ],
      [
        "Authentication",
        { keywords: ["auth", "login", "token", "signin"], confidence: 0.8 },
      ],
      [
        "UI",
        {
          keywords: ["render", "component", "jsx", "usestate"],
          confidence: 0.7,
        },
      ],
    ]);

    for (const [errorType, { keywords, confidence }] of errorTypeIndicators) {
      if (keywords.some((keyword) => content.includes(keyword))) {
        return {
          errorType: errorType as
            | "Network"
            | "Database"
            | "Logic"
            | "UI"
            | "Authentication"
            | "Storage",
          confidence,
        };
      }
    }

    return { errorType: "Logic" as const, confidence: 0.5 };
  }

  /**
   * Generate appropriate recovery action for error type
   */
  generateRecoveryAction(
    errorType:
      | "Network"
      | "Database"
      | "Logic"
      | "UI"
      | "Authentication"
      | "Storage",
    operation: string,
  ): {
    actionType: "Retry" | "Fallback" | "UserPrompt" | "FailGracefully";
    retryCount?: number;
    retryDelay?: number;
    maxRetries?: number;
    userMessage?: string;
  } {
    const recoveryStrategies = this.getRecoveryStrategies(operation);
    return (
      recoveryStrategies.get(errorType) ??
      this.getDefaultRecoveryAction(operation)
    );
  }

  private getRecoveryStrategies(operation: string): Map<
    string,
    {
      actionType: "Retry" | "Fallback" | "UserPrompt" | "FailGracefully";
      retryCount?: number;
      retryDelay?: number;
      maxRetries?: number;
      userMessage?: string;
    }
  > {
    return new Map([
      [
        "Network",
        {
          actionType: "Retry",
          retryCount: 0,
          retryDelay: 2000,
          maxRetries: 3,
          userMessage: `Network error during ${operation}. Retrying...`,
        },
      ],
      [
        "Database",
        {
          actionType: "Retry",
          retryCount: 0,
          retryDelay: 1000,
          maxRetries: 2,
          userMessage: `Database error during ${operation}. Please try again.`,
        },
      ],
      [
        "Authentication",
        {
          actionType: "UserPrompt",
          userMessage: `Authentication required for ${operation}. Please sign in again.`,
        },
      ],
      [
        "Storage",
        {
          actionType: "Fallback",
          userMessage: `Storage error during ${operation}. Using temporary storage.`,
        },
      ],
      [
        "UI",
        {
          actionType: "Fallback",
          userMessage: `Display issue detected. Using fallback interface.`,
        },
      ],
    ]);
  }

  private getDefaultRecoveryAction(operation: string) {
    return {
      actionType: "FailGracefully" as const,
      userMessage: `An error occurred during ${operation}. Please try again.`,
    };
  }

  /**
   * Find files matching patterns
   */
  async findFiles(
    rootPath: string,
    includePatterns: string[],
    excludePatterns: string[],
  ): Promise<string[]> {
    try {
      if (!this.glob) {
        // Fallback implementation without glob
        return this.findFilesRecursive(
          rootPath,
          includePatterns,
          excludePatterns,
        );
      }

      const files: string[] = [];

      // Handle both sync and async versions of glob
      if (typeof this.glob === "function") {
        // Try to call with all patterns at once (for jest mocks)
        try {
          const matches = this.glob(includePatterns, {
            cwd: rootPath,
            ignore: excludePatterns,
          });
          files.push(...matches);
        } catch {
          // If that fails, try one pattern at a time
          for (const pattern of includePatterns) {
            try {
              const matches = this.glob(pattern, {
                cwd: rootPath,
                ignore: excludePatterns,
              });
              files.push(...matches);
            } catch {
              // If sync fails, try async version
              const matches = await this.glob(pattern, {
                cwd: rootPath,
                ignore: excludePatterns,
              });
              files.push(...matches);
            }
          }
        }
      } else {
        // Fallback to recursive search
        const matches = await this.findFilesRecursive(
          rootPath,
          includePatterns,
          excludePatterns,
        );
        files.push(...matches);
      }

      return [...new Set(files)]; // Remove duplicates
    } catch (error) {
      throw new Error(`Failed to find files: ${error}`);
    }
  }

  /**
   * Validate syntax of a file
   */
  async validateSyntax(filePath: string): Promise<boolean> {
    try {
      const content = await this.readFile(filePath);
      return this.performBasicSyntaxCheck(content);
    } catch {
      return false;
    }
  }

  /**
   * Read file content
   */
  async readFile(filePath: string): Promise<string> {
    try {
      if (this.fs && this.fs.readFileSync) {
        return this.fs.readFileSync(filePath, "utf8");
      }

      // Fallback for environments without fs
      throw new Error("File system access not available");
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${error}`);
    }
  }

  /**
   * Write file content
   */
  async writeFile(filePath: string, content: string): Promise<void> {
    try {
      if (this.fs && this.fs.writeFileSync) {
        this.fs.writeFileSync(filePath, content, "utf8");
        return;
      }

      // Fallback for environments without fs
      throw new Error("File system access not available");
    } catch (error) {
      throw new Error(`Failed to write file ${filePath}: ${error}`);
    }
  }

  /**
   * Private helper methods
   */

  private initializeDependencies(): void {
    try {
      // Try to load Node.js modules
      try {
        const importModule = eval("require");
        this.fs = importModule("fs");
        this.path = importModule("path");
      } catch {
        // Node.js modules not available
      }

      try {
        // In test environment, check for jest mocks first
        const importModule = eval("require");
        const globModule = importModule("glob");
        this.glob = globModule.sync || globModule.glob;
      } catch {
        // Glob not available
      }
    } catch {
      // Running in environment without module loader
    }
  }

  private async findFilesRecursive(
    _rootPath: string,
    _includePatterns: string[],
    _excludePatterns: string[],
  ): Promise<string[]> {
    const files: string[] = [];

    // This is a simplified fallback implementation
    console.warn("Using fallback file discovery - glob not available");

    return files;
  }

  private getSurroundingCode(
    lines: string[],
    lineNumber: number,
    context: number = 5,
  ): string[] {
    const start = Math.max(0, lineNumber - context - 1);
    const end = Math.min(lines.length, lineNumber + context);
    return lines.slice(start, end);
  }

  private getFunctionContext(
    lines: string[],
    lineNumber: number,
  ): string | undefined {
    // Look backwards for function declaration
    for (let i = lineNumber - 1; i >= 0; i--) {
      const line = lines[i].trim();

      if (this.isFunctionDeclaration(line)) {
        return this.extractFunctionName(line);
      }

      // Stop if we hit another function or class
      if (line.includes("function") || line.includes("class")) {
        break;
      }
    }

    return undefined;
  }

  private isFunctionDeclaration(line: string): boolean {
    return /(?:function|async\s+function|\w+\s*\(|\w+\s*=\s*(?:async\s*)?\()/.test(
      line,
    );
  }

  private extractFunctionName(line: string): string {
    // Try to extract function name from various patterns
    const patterns = [
      /function\s+(\w+)/,
      /(\w+)\s*\(/,
      /(\w+)\s*=/,
      /async\s+(\w+)/,
    ];

    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return "anonymous";
  }

  private extractImports(lines: string[]): string[] {
    const imports: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (
        trimmed.startsWith("import ") ||
        (trimmed.startsWith("const ") && trimmed.includes("require("))
      ) {
        imports.push(trimmed);
      }
    }

    return imports;
  }

  private extractOperation(
    lines: string[],
    lineNumber: number,
  ): string | undefined {
    const contextLines = this.getSurroundingCode(lines, lineNumber, 3);

    // Look for function names or operation descriptors
    for (const line of contextLines) {
      const functionMatch = line.match(/(\w+)\s*\(/);
      if (functionMatch) {
        return functionMatch[1];
      }

      const commentMatch = line.match(/\/\/\s*(.+)/);
      if (commentMatch) {
        return commentMatch[1].trim();
      }
    }

    return undefined;
  }

  private extractTryBlockCode(
    lines: string[],
    catchLineNumber: number,
  ): string {
    // Find the try block that corresponds to this catch
    let tryStart = -1;
    let tryEnd = -1;

    // Look backwards for the try statement
    for (let i = catchLineNumber - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if (line.includes("try") && line.includes("{")) {
        tryStart = i;
        break;
      }
    }

    if (tryStart === -1) {
      return "";
    }

    // Find the end of the try block
    let braceCount = 0;
    for (let i = tryStart; i < lines.length; i++) {
      const line = lines[i];

      for (const char of line) {
        if (char === "{") braceCount++;
        else if (char === "}") {
          braceCount--;
          if (braceCount === 0) {
            tryEnd = i;
            break;
          }
        }
      }

      if (tryEnd !== -1) break;
    }

    if (tryEnd === -1) {
      return "";
    }

    return lines.slice(tryStart, tryEnd + 1).join("\n");
  }

  private inferErrorType(
    lines: string[],
    lineNumber: number,
  ): "Network" | "Database" | "Logic" | "UI" | "Authentication" | "Storage" {
    const contextLines = this.getSurroundingCode(lines, lineNumber, 5);
    const content = contextLines.join(" ").toLowerCase();

    const { errorType } = this.analyzeErrorTypeFromContent(content);
    return errorType as
      | "Network"
      | "Database"
      | "Logic"
      | "UI"
      | "Authentication"
      | "Storage";
  }

  private isTransientError(errorType: string): boolean {
    const transientTypes = ["Network", "Authentication"];
    return transientTypes.includes(errorType);
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

  private performBasicSyntaxCheck(content: string): boolean {
    try {
      // Basic bracket matching
      const brackets = { "(": ")", "[": "]", "{": "}" };
      const stack: string[] = [];

      for (const char of content) {
        if (Object.keys(brackets).includes(char)) {
          stack.push(char);
        } else if (Object.values(brackets).includes(char)) {
          const last = stack.pop();
          if (!last || (brackets as Record<string, string>)[last] !== char) {
            return false;
          }
        }
      }

      return stack.length === 0;
    } catch {
      return false;
    }
  }
}
