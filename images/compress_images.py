#!/usr/bin/env python3
"""
compress_images.py

Recursively walks a folder (and all its subfolders), finds every image file,
backs the originals up untouched into a `backup/` folder at the root
(mirroring the same folder structure), and then compresses the images
IN PLACE for web use with settings tuned to be visually near-lossless
(similar to what Squoosh.app produces at ~80-85 quality).

USAGE
    python3 compress_images.py                  # scans current folder
    python3 compress_images.py /path/to/folder  # scans a specific folder
    python3 compress_images.py . --quality 85   # adjust JPEG/WEBP quality
    python3 compress_images.py . --dry-run      # just list what it would do

INSTALL
    pip install Pillow

OPTIONAL (better, fully lossless PNG compression — used automatically if present)
    Install the "oxipng" command-line tool (same PNG engine Squoosh uses):
      - macOS:   brew install oxipng
      - Linux:   cargo install oxipng   (or your distro's package manager)
      - Windows: scoop install oxipng   (or download from GitHub releases)
    If oxipng isn't installed, Pillow's built-in lossless PNG optimizer is
    used instead — it works fine, just compresses a bit less.

HOW IT WORKS
    1. Scans the folder tree and records every image's name and location.
    2. Copies every found image, untouched, into <root>/backup/<same path>.
    3. Only after the backup is fully written does it recompress and
       overwrite the originals in their original location and format.
    4. Prints a before/after size report and writes backup/manifest.txt.

Supported formats: JPEG, PNG, WEBP, GIF (incl. animated), BMP, TIFF.
"""

import argparse
import logging
import os
import shutil
import subprocess
import sys
from pathlib import Path

try:
    from PIL import Image, ImageFile
    ImageFile.LOAD_TRUNCATED_IMAGES = True
except ImportError:
    print("Pillow is required. Install it with:\n    pip install Pillow")
    sys.exit(1)

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tif", ".tiff", ".gif"}
BACKUP_DIRNAME = "backup"

logging.basicConfig(level=logging.INFO, format="%(message)s")
log = logging.getLogger("compress_images")


def find_images(root: Path, backup_dir: Path):
    images = []
    for dirpath, dirnames, filenames in os.walk(root):
        dirpath = Path(dirpath)
        # never descend into or touch the backup folder itself
        if dirpath == backup_dir or backup_dir in dirpath.parents:
            dirnames[:] = []
            continue
        for fname in filenames:
            fpath = dirpath / fname
            if fpath.suffix.lower() in IMAGE_EXTENSIONS:
                images.append(fpath)
    return images


def backup_images(root: Path, backup_dir: Path, images):
    log.info(f"\nBacking up {len(images)} images to {backup_dir} ...")
    manifest_lines = []
    for img in images:
        rel = img.relative_to(root)
        dest = backup_dir / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(img, dest)
        manifest_lines.append(f"{rel}\t{img.stat().st_size} bytes")
    manifest_path = backup_dir / "manifest.txt"
    manifest_path.write_text("\n".join(manifest_lines), encoding="utf-8")
    log.info(f"Backup complete. Full list of original files saved to {manifest_path}")


def has_oxipng():
    return shutil.which("oxipng") is not None


def compress_png(path: Path):
    if has_oxipng():
        subprocess.run(
            ["oxipng", "-o", "4", "--strip", "safe", str(path)],
            check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        )
    else:
        with Image.open(path) as im:
            im.save(path, format="PNG", optimize=True)


def compress_jpeg(path: Path, quality: int):
    with Image.open(path) as im:
        if im.mode in ("RGBA", "P", "LA"):
            im = im.convert("RGB")
        im.save(path, format="JPEG", quality=quality, optimize=True, progressive=True)


def compress_webp(path: Path, quality: int):
    with Image.open(path) as im:
        im.save(path, format="WEBP", quality=quality, method=6)


def compress_gif(path: Path):
    with Image.open(path) as im:
        frames = []
        try:
            while True:
                frames.append(im.copy())
                im.seek(im.tell() + 1)
        except EOFError:
            pass
        if len(frames) > 1:
            frames[0].save(
                path, format="GIF", save_all=True, append_images=frames[1:],
                optimize=True, loop=im.info.get("loop", 0),
                duration=im.info.get("duration", 100),
            )
        else:
            im.save(path, format="GIF", optimize=True)


def compress_bmp_tiff(path: Path):
    with Image.open(path) as im:
        im.save(path)


def compress_image(path: Path, quality: int):
    ext = path.suffix.lower()
    try:
        if ext in (".jpg", ".jpeg"):
            compress_jpeg(path, quality)
        elif ext == ".png":
            compress_png(path)
        elif ext == ".webp":
            compress_webp(path, quality)
        elif ext == ".gif":
            compress_gif(path)
        elif ext in (".bmp", ".tif", ".tiff"):
            compress_bmp_tiff(path)
        return True
    except Exception as e:
        log.warning(f"  FAILED: {path} -> {e}")
        return False


def main():
    parser = argparse.ArgumentParser(description="Back up and compress all images in a folder tree for web use.")
    parser.add_argument("folder", nargs="?", default=".", help="Root folder to scan (default: current directory)")
    parser.add_argument("--quality", type=int, default=82,
                         help="JPEG/WEBP quality 1-100 (default: 82 — visually near-lossless, ~Squoosh default)")
    parser.add_argument("--dry-run", action="store_true", help="Only list found images, do not back up or compress")
    args = parser.parse_args()

    root = Path(args.folder).resolve()
    backup_dir = root / BACKUP_DIRNAME

    if not root.is_dir():
        log.error(f"{root} is not a folder")
        sys.exit(1)

    images = find_images(root, backup_dir)
    log.info(f"Found {len(images)} images under {root}")
    for img in images:
        log.info(f"  {img.relative_to(root)}")

    if args.dry_run or not images:
        if not images:
            log.info("Nothing to do.")
        return

    if backup_dir.exists():
        log.warning(f"\nNote: backup folder {backup_dir} already exists — matching files there will be overwritten.")

    backup_images(root, backup_dir, images)

    log.info("\nCompressing images in place ...")
    total_before = total_after = ok = 0
    for img in images:
        before = img.stat().st_size
        total_before += before
        if compress_image(img, args.quality):
            after = img.stat().st_size
            total_after += after
            ok += 1
            saved = 100 * (1 - after / before) if before else 0
            log.info(f"  {img.relative_to(root)}: {before/1024:.1f} KB -> {after/1024:.1f} KB ({saved:.0f}% smaller)")
        else:
            total_after += before

    log.info(f"\nDone. Compressed {ok}/{len(images)} images.")
    if total_before:
        log.info(
            f"Total size: {total_before/1024/1024:.2f} MB -> {total_after/1024/1024:.2f} MB "
            f"({100*(1-total_after/total_before):.1f}% smaller)"
        )
    log.info(f"Originals are safely backed up in: {backup_dir}")


if __name__ == "__main__":
    main()
