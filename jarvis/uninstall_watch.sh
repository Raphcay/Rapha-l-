#!/bin/bash
# Removes the LaunchAgent installed by install_watch.sh.
set -euo pipefail

PLIST="$HOME/Library/LaunchAgents/com.raphael.jarvis-watch.plist"
launchctl unload "$PLIST" 2>/dev/null || true
rm -f "$PLIST"
echo "Guetteur désinstallé."
