#!/bin/bash
# ────────────────────────────────────────────────────────────
# Image Optimization Script (requires ImageMagick 7+)
#
# Usage:
#   ./optimize-images.sh                  # Process all images in assets/
#   ./optimize-images.sh assets/instagram # Process a specific directory
#
# What it does:
#   1. Backs up originals to assets/originals/ (first run only)
#   2. Resizes images exceeding max width (preserves aspect ratio)
#   3. Compresses and strips metadata
#   4. Generates WebP — only kept if actually smaller than the source
#
# Note: Already-optimized images (e.g., Instagram exports) may not
# benefit from re-compression. The script detects this and skips
# re-encoding when it would increase file size.
# ────────────────────────────────────────────────────────────

set -euo pipefail

MAX_WIDTH=1600
JPG_QUALITY=75
WEBP_QUALITY=70
TARGET_DIR="${1:-assets}"
BACKUP_DIR="assets/originals"

if ! command -v magick &> /dev/null; then
    echo "Error: ImageMagick 7+ is required. Install with: brew install imagemagick"
    exit 1
fi

echo "=== Image Optimization ==="
echo "Target: $TARGET_DIR"
echo "Max width: ${MAX_WIDTH}px | JPG quality: $JPG_QUALITY | WebP quality: $WEBP_QUALITY"
echo ""

find "$TARGET_DIR" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) \
    ! -path "$BACKUP_DIR/*" | sort | while read -r file; do

    filename=$(basename "$file")
    dir=$(dirname "$file")
    name="${filename%.*}"
    webp_path="${dir}/${name}.webp"

    width=$(magick identify -format "%w" "$file")
    original_size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file")

    # Back up original (only if backup doesn't exist)
    backup_subdir="${BACKUP_DIR}/${dir#assets/}"
    if [ ! -f "${backup_subdir}/${filename}" ]; then
        mkdir -p "$backup_subdir"
        cp "$file" "${backup_subdir}/${filename}"
    fi

    # Optimize: resize if oversized, compress, strip metadata
    tmp_file="${file}.tmp"
    if [ "$width" -gt "$MAX_WIDTH" ]; then
        magick "$file" -resize "${MAX_WIDTH}x>" -quality "$JPG_QUALITY" -strip "$tmp_file"
        echo "  Resized: $file (was ${width}px wide)"
    else
        magick "$file" -quality "$JPG_QUALITY" -strip "$tmp_file"
    fi

    # Only keep re-encoded version if it's actually smaller
    new_size=$(stat -f%z "$tmp_file" 2>/dev/null || stat -c%s "$tmp_file")
    if [ "$new_size" -lt "$original_size" ]; then
        mv "$tmp_file" "$file"
        savings=$(( (original_size - new_size) * 100 / original_size ))
        echo "  Compressed: $file (${savings}% smaller)"
    else
        rm "$tmp_file"
        echo "  Skipped: $file (already optimized)"
    fi

    # Generate WebP — only keep if smaller than the source
    if [ ! -f "$webp_path" ] || [ "$file" -nt "$webp_path" ]; then
        source_size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file")
        magick "$file" -quality "$WEBP_QUALITY" -strip "$webp_path"
        webp_size=$(stat -f%z "$webp_path" 2>/dev/null || stat -c%s "$webp_path")

        if [ "$webp_size" -lt "$source_size" ]; then
            savings=$(( (source_size - webp_size) * 100 / source_size ))
            echo "  Created WebP: $webp_path (${savings}% smaller)"
        else
            rm "$webp_path"
            echo "  WebP skipped: would be larger than source"
        fi
    fi

done

echo ""
echo "=== Done ==="
