#!/usr/bin/env node
/**
 * Chrome Console Capture Script
 * Connects to Chrome DevTools Protocol to capture console logs
 */

const CDP = require('chrome-remote-interface');
const fs = require('fs');
const path = require('path');

class ConsoleCapture {
  constructor(outputFile, port = 9222) {
    this.outputFile = outputFile;
    this.port = port;
    this.client = null;
    this.logs = [];
    this.isActive = false;
  }

  async start() {
    try {
      console.log(`🔍 Starting console capture, connecting to Chrome on port ${this.port}`);
      
      // Wait for Chrome to be ready
      let retries = 0;
      const maxRetries = 10;
      let client = null;
      
      while (retries < maxRetries) {
        try {
          client = await CDP({ port: this.port });
          break;
        } catch (error) {
          console.log(`⏳ Waiting for Chrome DevTools (attempt ${retries + 1}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          retries++;
        }
      }
      
      if (!client) {
        throw new Error(`Failed to connect to Chrome DevTools after ${maxRetries} attempts`);
      }
      
      this.client = client;
      const { Console, Runtime, Page } = this.client;

      // Enable Console and Runtime domains
      await Console.enable();
      await Runtime.enable();
      await Page.enable();
      
      console.log(`✅ Connected to Chrome DevTools on port ${this.port}`);

      // Listen for console messages
      Console.messageAdded((params) => {
        this.captureConsoleMessage(params);
      });

      // Listen for runtime console API calls
      Runtime.consoleAPICalled((params) => {
        this.captureRuntimeConsole(params);
      });

      // Listen for JavaScript exceptions
      Runtime.exceptionThrown((params) => {
        this.captureException(params);
      });

      this.isActive = true;
      console.log('✅ Console capture started successfully');

      // Save logs periodically
      this.saveInterval = setInterval(() => {
        this.saveLogs();
      }, 1000);

      return true;
    } catch (error) {
      console.error('❌ Failed to start console capture:', error.message);
      return false;
    }
  }

  captureConsoleMessage(params) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      type: 'console',
      level: params.message.level || 'log',
      text: params.message.text || '',
      url: params.message.url || '',
      line: params.message.line || 0,
      source: 'console'
    };

    this.logs.push(logEntry);
    console.log(`📝 [${logEntry.level.toUpperCase()}] ${logEntry.text}`);
  }

  captureRuntimeConsole(params) {
    const timestamp = new Date().toISOString();
    const args = params.args || [];
    const text = args.map(arg => {
      if (arg.value !== undefined) return String(arg.value);
      if (arg.description) return arg.description;
      return arg.type || 'undefined';
    }).join(' ');

    const logEntry = {
      timestamp,
      type: 'runtime',
      level: params.type || 'log',
      text,
      source: 'runtime'
    };

    this.logs.push(logEntry);
    console.log(`📝 [${logEntry.level.toUpperCase()}] ${logEntry.text}`);
  }

  captureException(params) {
    const timestamp = new Date().toISOString();
    const exception = params.exceptionDetails;
    const text = exception.exception?.description || exception.text || 'Unknown exception';

    const logEntry = {
      timestamp,
      type: 'exception',
      level: 'error',
      text,
      stack: exception.stackTrace?.callFrames?.map(frame => 
        `  at ${frame.functionName || 'anonymous'} (${frame.url}:${frame.lineNumber}:${frame.columnNumber})`
      ).join('\n') || '',
      source: 'exception'
    };

    this.logs.push(logEntry);
    console.log(`📝 [ERROR] ${logEntry.text}`);
    if (logEntry.stack) {
      console.log(logEntry.stack);
    }
  }

  saveLogs() {
    if (this.logs.length === 0) return;

    try {
      const logContent = this.logs.map(log => {
        let line = `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.text}`;
        if (log.url) line += ` (${log.url}:${log.line})`;
        if (log.stack) line += `\n${log.stack}`;
        return line;
      }).join('\n') + '\n';

      fs.appendFileSync(this.outputFile, logContent);
      this.logs = []; // Clear captured logs after saving
    } catch (error) {
      console.error('❌ Failed to save logs:', error.message);
    }
  }

  async stop() {
    if (this.isActive && this.client) {
      try {
        // Save any remaining logs
        this.saveLogs();
        
        // Clear interval
        if (this.saveInterval) {
          clearInterval(this.saveInterval);
        }

        // Close connection
        await this.client.close();
        console.log('✅ Console capture stopped');
      } catch (error) {
        console.error('❌ Error stopping console capture:', error.message);
      }
    }
  }
}

// CLI usage
if (require.main === module) {
  const outputFile = process.argv[2] || '/tmp/chrome-console.log';
  const port = parseInt(process.argv[3]) || 9222;

  console.log(`🔍 Chrome Console Capture starting...`);
  console.log(`📄 Output file: ${outputFile}`);
  console.log(`🔌 Chrome DevTools port: ${port}`);

  const capture = new ConsoleCapture(outputFile, port);

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT, stopping console capture...');
    await capture.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n🛑 Received SIGTERM, stopping console capture...');
    await capture.stop();
    process.exit(0);
  });

  // Start capture
  capture.start().then((success) => {
    if (!success) {
      console.error('❌ Failed to start console capture');
      process.exit(1);
    }
    
    // Keep process running
    console.log('🔄 Console capture is running... Press Ctrl+C to stop');
  });
}

module.exports = ConsoleCapture;