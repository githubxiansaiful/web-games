#!/usr/bin/env bash
# ==============================================================================
# Xian's Game World - PostgreSQL Automated Backup Script
# ==============================================================================

set -euo pipefail

BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="xian_games_backup_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

echo "Starting PostgreSQL backup: ${FILENAME}..."

# Export database dump compressed directly
docker exec -i xian-games-db-prod pg_dump -U postgres xian_games | gzip > "${BACKUP_DIR}/${FILENAME}"

echo "✓ Backup created successfully at ${BACKUP_DIR}/${FILENAME}"
echo "Size: $(du -h "${BACKUP_DIR}/${FILENAME}" | cut -f1)"

# Keep last 14 backups
find "${BACKUP_DIR}" -type f -name "xian_games_backup_*.sql.gz" -mtime +14 -delete
echo "✓ Old backups pruned."
