#!/bin/bash
# Installs a LaunchAgent that watches for a second display and starts jarvis.py.
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLIST="$HOME/Library/LaunchAgents/com.raphael.jarvis-watch.plist"
mkdir -p "$DIR/.cache"

cat > "$PLIST" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.raphael.jarvis-watch</string>
    <key>ProgramArguments</key>
    <array>
        <string>$DIR/.venv/bin/python</string>
        <string>$DIR/watch_screen.py</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>$DIR/.cache/jarvis_watch_stdout.log</string>
    <key>StandardErrorPath</key>
    <string>$DIR/.cache/jarvis_watch_stderr.log</string>
</dict>
</plist>
EOF

launchctl unload "$PLIST" 2>/dev/null || true
launchctl load "$PLIST"
echo "Guetteur installé et lancé : $PLIST"
echo "Il surveille en continu le nombre d'écrans et lance jarvis.py dès qu'un 2e écran apparaît."
