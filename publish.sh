#!/usr/bin/env bash
# ============================================================
# publish.sh — push the latest sweepstake state live.
#
# Use it after you've run the draw (or updated scores) in the app
# with ?host on the URL, hit "Publish", and saved the downloaded
# state.json into THIS folder (replacing the old one).
#
#   ./publish.sh
#
# GitHub Pages redeploys in ~1 minute and the whole family sees it.
# ============================================================
set -e
cd "$(dirname "$0")"

# If a freshly-downloaded state.json is sitting in ~/Downloads, offer to use it.
DL="$HOME/Downloads/state.json"
if [ -f "$DL" ] && [ "$DL" -nt "state.json" ]; then
  echo "Found a newer state.json in ~/Downloads — copying it in."
  cp "$DL" state.json
fi

git add -A
if git diff --cached --quiet; then
  echo "Nothing to publish — state.json is unchanged."
  exit 0
fi
git commit -m "Update sweepstake state ($(date '+%Y-%m-%d %H:%M'))"
git push
echo
echo "✅ Published. Live in ~1 minute at your GitHub Pages URL."
