# Bash Scripts Collection

This directory contains useful bash scripts for media processing and optimization.

## Scripts Overview

| Script | Purpose | Dependencies |
|--------|---------|--------------|
| `extract_frame.sh` | Extract specific frames from video files | ffmpeg |
| `convert_image.sh` | Convert images to AVIF format with resizing | Node.js + Sharp |

---

## 🎥 extract_frame.sh

Extract any frame from video files (local or online) as high-quality images.

### Usage
```bash
./extract_frame.sh <video> [output] [frame_number] [quality]
```

### Parameters
- **video**: Local file path or URL to video
- **output**: Output filename (optional, defaults to `[video_name]_frame.png`)
- **frame_number**: Which frame to extract (optional, default: 1)
- **quality**: Image quality 1-31 (optional, default: 2, where 1=best)

### Examples
```bash
# Basic usage - extracts frame 1
./extract_frame.sh video.mp4

# Extract frame 60 (good for avoiding black frames)
./extract_frame.sh video.mp4 thumbnail.png 60

# Extract from online video
./extract_frame.sh https://assets.stoumann.dk/video/river.mp4

# Extract frame 120 with best quality
./extract_frame.sh video.mp4 frame.png 120 1

# Extract from Big Buck Bunny at frame 60
./extract_frame.sh https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4 bunny.jpg 60
```

### Installation Requirements
```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg

# CentOS/RHEL
sudo yum install ffmpeg
```

---

## 🖼️ convert_image.sh

Convert images to modern AVIF format with optional resizing for web optimization.

### Usage
```bash
./convert_image.sh <input_image> [output] [width] [quality]
```

### Parameters
- **input_image**: Source image file
- **output**: Output filename (optional, defaults to `[input_name].avif`)
- **width**: Maximum width in pixels (optional, default: 350)
- **quality**: AVIF quality 1-100 (optional, default: 60)

### Examples
```bash
# Basic conversion
./convert_image.sh photo.png

# Custom output filename
./convert_image.sh photo.png optimized.avif

# Resize to 400px width
./convert_image.sh photo.png thumbnail.avif 400

# High quality conversion
./convert_image.sh photo.png photo.avif 400 80

# Small compressed version
./convert_image.sh image.jpg compressed.avif 280 50
```

### Supported Input Formats
PNG, JPG, JPEG, WEBP, TIFF, GIF

### Installation Requirements
```bash
# macOS
brew install node

# Ubuntu/Debian
sudo apt install nodejs npm

# CentOS/RHEL
sudo yum install nodejs npm
```

---

## 🚀 Quick Start

1. **Make scripts executable:**
   ```bash
   chmod +x extract_frame.sh convert_image.sh
   ```

2. **Install dependencies:**
   ```bash
   # For video processing
   brew install ffmpeg
   
   # For image conversion
   brew install node
   ```

3. **Test the scripts:**
   ```bash
   # Extract a video frame
   ./extract_frame.sh https://assets.stoumann.dk/video/river.mp4
   
   # Convert the extracted frame
   ./convert_image.sh river_frame.png river_optimized.avif 350 70
   ```

---

## 💡 Common Workflows

### Create Video Thumbnails
```bash
# Extract frame and convert to optimized AVIF
./extract_frame.sh video.mp4 temp_frame.png 60
./convert_image.sh temp_frame.png video_thumbnail.avif 350 70
rm temp_frame.png
```

### Batch Process Videos
```bash
# Create thumbnails for all MP4 files
for video in *.mp4; do
  ./extract_frame.sh "$video" "${video%.*}_thumb.png" 60
  ./convert_image.sh "${video%.*}_thumb.png" "${video%.*}_thumb.avif" 320 65
  rm "${video%.*}_thumb.png"
done
```

### Process Online Videos
```bash
# Create thumbnails from online video sources
./extract_frame.sh https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4 bunny.png 60
./convert_image.sh bunny.png bunny_thumb.avif 280 60
```

### Optimize Existing Images
```bash
# Batch convert all PNGs to AVIF
for img in *.png; do
  ./convert_image.sh "$img" "${img%.*}.avif" 350 65
done
```

---

## 🔧 Troubleshooting

### extract_frame.sh Issues
- **"ffmpeg not found"**: Install ffmpeg using your package manager
- **"Black frame extracted"**: Try a higher frame number (e.g., 60, 120)
- **Network issues**: Check your internet connection for online videos

### convert_image.sh Issues
- **"Node.js not found"**: Install Node.js using your package manager
- **"Sharp installation failed"**: Run `npm install -g sharp` manually
- **"Permission denied"**: Make sure the script is executable with `chmod +x`

### Getting Help
```bash
# Show help for any script
./extract_frame.sh --help
./convert_image.sh --help
```

---

## 📝 Notes

- **AVIF format**: Modern image format with excellent compression (often 50-90% smaller than JPEG)
- **Frame selection**: Frame 60-120 usually provides good thumbnails, avoiding intro/black frames
- **Quality settings**: Lower numbers = better quality for video frames, higher numbers = better quality for AVIF
- **Online videos**: Both scripts work with URLs - no need to download first
- **File safety**: Scripts won't overwrite existing files without confirmation

---

## 🎯 Perfect for

- **Web development**: Creating optimized thumbnails and images
- **Content management**: Generating video previews
- **Asset optimization**: Reducing file sizes for faster loading
- **Automation**: Batch processing media files
- **Modern web formats**: Using cutting-edge AVIF compression 