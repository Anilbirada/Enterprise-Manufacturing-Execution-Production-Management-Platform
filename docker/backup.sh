#!/usr/bin/env bash
# ==============================================================================
# RSR Factory360 - Automated Database Backup Script
# Usage: ./backup.sh
# ==============================================================================

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/rsrfactory360}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="rsrfactory360_backup_${TIMESTAMP}"
TARGET_DIR="${BACKUP_DIR}/${BACKUP_NAME}"
ARCHIVE_PATH="${TARGET_DIR}.tar.gz"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

MONGO_HOST="${MONGO_HOST:-mongo}"
MONGO_PORT="${MONGO_PORT:-27017}"
MONGO_DB="${MONGO_DB:-rsrfactory360}"

echo "=========================================================="
echo " RSR Factory360 Database Backup Initialized"
echo " Time: $(date)"
echo " Target Database: ${MONGO_DB} on ${MONGO_HOST}:${MONGO_PORT}"
echo "=========================================================="

mkdir -p "${BACKUP_DIR}"

# Execute mongodump
echo "[1/3] Dumping MongoDB database collections..."
mongodump --host="${MONGO_HOST}" --port="${MONGO_PORT}" --db="${MONGO_DB}" --out="${TARGET_DIR}"

# Create compressed archive
echo "[2/3] Compressing backup archive..."
tar -czf "${ARCHIVE_PATH}" -C "${BACKUP_DIR}" "${BACKUP_NAME}"
rm -rf "${TARGET_DIR}"

# Clean up backups older than retention window
echo "[3/3] Enforcing ${RETENTION_DAYS}-day retention policy..."
find "${BACKUP_DIR}" -type f -name "rsrfactory360_backup_*.tar.gz" -mtime +"${RETENTION_DAYS}" -delete

BACKUP_SIZE=$(du -sh "${ARCHIVE_PATH}" | cut -f1)
echo "=========================================================="
echo " Backup successfully completed!"
echo " Location: ${ARCHIVE_PATH} (${BACKUP_SIZE})"
echo "=========================================================="
