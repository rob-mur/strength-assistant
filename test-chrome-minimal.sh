#!/bin/bash
echo "Testing Chrome availability in minimal devbox..."

cd devbox/minimal

# Create a simple test script
cat > /tmp/test-chrome.sh << 'EOF'
#!/bin/bash
echo "=== Chrome Test ==="
echo "Checking for chromium..."
if command -v chromium >/dev/null 2>&1; then
    echo "✅ chromium found: $(command -v chromium)"
    echo "Version: $(chromium --version 2>/dev/null || echo 'Could not get version')"
else
    echo "❌ chromium not found"
fi

echo "Checking for chromedriver..."
if command -v chromedriver >/dev/null 2>&1; then
    echo "✅ chromedriver found: $(command -v chromedriver)"
    echo "Version: $(chromedriver --version 2>/dev/null || echo 'Could not get version')"
else
    echo "❌ chromedriver not found"
fi

echo "PATH: $PATH"
EOF

chmod +x /tmp/test-chrome.sh

# Run the test in minimal devbox
echo "Running test in minimal devbox..."
devbox shell -- /tmp/test-chrome.sh