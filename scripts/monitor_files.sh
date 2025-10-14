#!/bin/bash

TARGET_PROCESS_NAME="node"

while true; do
  PID=$(pgrep -f "$TARGET_PROCESS_NAME" | head -n 1)
  if [ -n "$PID" ]; then
    COUNT=$(lsof -p $PID | wc -l)
    echo "Open files for $TARGET_PROCESS_NAME (PID: $PID): $COUNT"
  fi
  sleep 1
done
