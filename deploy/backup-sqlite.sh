#!/usr/bin/env bash
set -euo pipefail

# Safe online SQLite WAL backup for VSMEKit (keep 14 days)
APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
DATA_DIR="${DATA_DIR:-${VSMEKIT_DATA_DIR:-$APP_DIR/data}}"
BACKUP_DIR="${BACKUP_DIR:-$APP_DIR/backups}"
STAMP="$(date -u +%Y%m%d-%H%M%S)"
TMP_SQLITE="$BACKUP_DIR/vsmekit-$STAMP.sqlite"
ARCHIVE="$BACKUP_DIR/vsmekit-backup-$STAMP.tar.gz"

mkdir -p "$BACKUP_DIR"

if [ ! -f "$DATA_DIR/vsmekit.sqlite" ]; then
  echo "No database found yet at $DATA_DIR/vsmekit.sqlite — skipping backup."
  exit 0
fi

node --no-warnings -e "
  import('node:sqlite').then(({ DatabaseSync }) => {
    const db = new DatabaseSync(process.argv[1]);
    const escaped = process.argv[2].replace(/'/g, \"''\");
    db.exec(\"VACUUM INTO '\" + escaped + \"'\");
    db.close();
  });
" "$DATA_DIR/vsmekit.sqlite" "$TMP_SQLITE"

tar -C "$BACKUP_DIR" -czf "$ARCHIVE" "$(basename "$TMP_SQLITE")"
rm -f "$TMP_SQLITE"
find "$BACKUP_DIR" -name 'vsmekit-backup-*.tar.gz' -type f -mtime +14 -delete
echo "Backup saved: $ARCHIVE"
