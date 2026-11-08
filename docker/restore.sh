#!/usr/bin/env bash
# ==============================================================================
# RSR Factory360 - Database Disaster Recovery & Restore Script
# Usage: ./restore.sh <path_to_backup.tar.gz>
# ==============================================================================

set -euo pipefail

if [ "$#" -ne 1 ]; then
    echo "Error: Backup archive path required."
    echo "Usage: $0 /path/to/rsrfactory360_backup_YYYYMMDD_HHMMSS.tar.gz"
    exit 1
fi

ARCHIVE_PATH="$1"

if [ ! -f "${ARCHIVE_PATH}" ]; then
    echo "Error: Archive file '${ARCHIVE_PATH}' does not exist."
    exit 1
fi

MONGO_HOST="${MONGO_HOST:-mongo}"
MONGO_PORT="${MONGO_PORT:-27017}"
MONGO_DB="${MONGO_DB:-rsrfactory360}"
TMP_RESTORE_DIR="/tmp/rsrfactory360_restore_$(date +%s)"

echo "=========================================================="
echo " WARNING: RSR Factory360 Database Restoration Initialized"
echo " Target DB: ${MONGO_DB} on ${MONGO_HOST}:${MONGO_PORT}"
echo " Source Archive: ${ARCHIVE_PATH}"
echo "=========================================================="

read -p "Are you sure you want to overwrite database '${MONGO_DB}'? (yes/NO): " CONFIRM
if [ "${CONFIRM}" != "yes" ]; then
    echo "Restoration aborted by operator."
    exit 0
fi

mkdir -p "${TMP_RESTORE_DIR}"
echo "[1/3] Extracting archive..."
tar -xzf "${ARCHIVE_PATH}" -C "${TMP_RESTORE_DIR}"

DUMP_DIR=$(find "${TMP_RESTORE_DIR}" -mindepth 1 -maxdepth 1 -type d | head -n 1)

echo "[2/3] Restoring database records via mongorestore (--drop)..."
mongorestore --host="${MONGO_HOST}" --port="${MONGO_PORT}" --db="${MONGO_DB}" --drop "${DUMP_DIR}/${MONGO_DB}"

echo "[3/3] Cleaning up temporary extraction files..."
rm -rf "${TMP_RESTORE_DIR}"

echo "=========================================================="
echo " Database restoration completed successfully!"
echo " System is ready for production operation."
echo "=========================================================="
