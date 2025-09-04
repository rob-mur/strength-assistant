#!/usr/bin/env bash

set -e

# Change to project root directory (relative to scripts folder)
cd "$(dirname "$0")/.."

npm test

