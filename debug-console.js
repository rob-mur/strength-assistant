const WebSocket = require('ws');

// Tab ID from Chrome DevTools API
const tabId = '7BC73C2175438416D74F78A5CDD1BC52';
const wsUrl = `ws://localhost:9222/devtools/page/${tabId}`;

console.log('Connecting to Chrome DevTools...');
const ws = new WebSocket(wsUrl);

ws.on('open', () => {
  console.log('✅ Connected to Chrome DevTools WebSocket');
  
  // Enable Runtime and Console domains to capture console messages
  ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
  ws.send(JSON.stringify({ id: 2, method: 'Console.enable' }));
  ws.send(JSON.stringify({ id: 3, method: 'Log.enable' }));
  
  console.log('📡 Enabled Runtime and Console domains');
  console.log('🎧 Listening for console messages...');
  console.log('--- CONSOLE OUTPUT ---');
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data);
    
    // Handle different types of console messages
    if (message.method === 'Runtime.consoleAPICalled') {
      const { type, args, timestamp } = message.params;
      const logArgs = args.map(arg => {
        if (arg.value !== undefined) return arg.value;
        if (arg.description !== undefined) return arg.description;
        return '[object]';
      }).join(' ');
      
      const time = new Date(timestamp).toISOString();
      console.log(`[${type.toUpperCase()}] ${time}: ${logArgs}`);
      
    } else if (message.method === 'Runtime.exceptionThrown') {
      const { exceptionDetails } = message.params;
      console.log(`[ERROR] Exception: ${exceptionDetails.exception?.description || exceptionDetails.text}`);
      if (exceptionDetails.stackTrace) {
        console.log(`Stack: ${JSON.stringify(exceptionDetails.stackTrace, null, 2)}`);
      }
      
    } else if (message.method === 'Log.entryAdded') {
      const { level, text, timestamp } = message.params.entry;
      const time = new Date(timestamp).toISOString();
      console.log(`[${level.toUpperCase()}] ${time}: ${text}`);
    }
  } catch (e) {
    // Ignore JSON parsing errors
  }
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error);
});

ws.on('close', () => {
  console.log('🔌 WebSocket connection closed');
});

// Keep the script running for 20 seconds
setTimeout(() => {
  console.log('--- END CONSOLE OUTPUT ---');
  ws.close();
  process.exit(0);
}, 20000);