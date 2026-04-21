#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="${UPSTAY_BACKUP_DIR:-$HOME/upstay-backups}"
KEEP=14
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
OUTFILE="$BACKUP_DIR/upstay-$TIMESTAMP.tar.gz"

mkdir -p "$BACKUP_DIR"

if ! command -v railway >/dev/null 2>&1; then
  echo "[backup] railway CLI not found" >&2
  exit 1
fi

if ! railway status >/dev/null 2>&1; then
  echo "[backup] railway not linked to project" >&2
  exit 1
fi

echo "[backup] streaming /app/data from railway..."
railway ssh "tar czf - -C /app data" >"$OUTFILE.tmp"

SIZE=$(stat -f%z "$OUTFILE.tmp" 2>/dev/null || stat -c%s "$OUTFILE.tmp")
if [ "$SIZE" -lt 1000 ]; then
  echo "[backup] downloaded archive too small ($SIZE bytes), aborting" >&2
  rm -f "$OUTFILE.tmp"
  exit 1
fi

mv "$OUTFILE.tmp" "$OUTFILE"
echo "[backup] saved: $OUTFILE ($((SIZE / 1024 / 1024))MB)"

echo "[backup] rotating, keeping last $KEEP..."
cd "$BACKUP_DIR"
ls -1t upstay-*.tar.gz 2>/dev/null | tail -n +$((KEEP + 1)) | while read -r old; do
  echo "[backup] remove $old"
  rm -f "$old"
done

echo "[backup] done"
