#!/bin/bash

# extract_frame.sh - Extract first frame from MP4 files
# Usage: ./extract_frame.sh input.mp4 [output] [quality]

input="$1"

# Generate proper local filename for URLs
if [[ "$input" =~ ^https?:// ]]; then
  # Extract filename from URL and remove query parameters
  url_filename=$(basename "$input" | cut -d'?' -f1)
  default_output="${url_filename%.*}_frame.png"
else
  default_output="${input%.*}_frame.png"
fi

output="${2:-$default_output}"
frame_number="${3:-1}"
quality="${4:-2}"

# Help message
if [ -z "$input" ] || [ "$input" = "-h" ] || [ "$input" = "--help" ]; then
  echo "Extract specific frame from MP4 files"
  echo ""
  echo "Usage: $0 <input.mp4> [output] [frame_number] [quality]"
  echo ""
  echo "Examples:"
  echo "  $0 video.mp4"
  echo "  $0 video.mp4 thumbnail.jpg"
  echo "  $0 video.mp4 frame.png 60"
  echo "  $0 video.mp4 frame.png 60 1"
  echo "  $0 https://assets.stoumann.dk/video/river.mp4"
  echo "  $0 https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4 bunny.jpg 60"
  echo ""
  echo "Frame number: 1 = first frame, 60 = 60th frame, etc."
  echo "Quality: 1 (best) - 31 (worst)"
  echo "Default: frame 1, quality 2"
  exit 0
fi

# Check if input is a file or URL
if [[ "$input" =~ ^https?:// ]]; then
  echo "Processing online video: $input"
elif [ ! -f "$input" ]; then
  echo "✗ Error: Input file '$input' not found"
  exit 1
fi

# Check if ffmpeg is available
if ! command -v ffmpeg &> /dev/null; then
  echo "✗ Error: ffmpeg is not installed"
  echo "Install with:"
  echo "  macOS: brew install ffmpeg"
  echo "  Ubuntu: sudo apt install ffmpeg"
  echo "  CentOS: sudo yum install ffmpeg"
  exit 1
fi

echo "Extracting frame $frame_number from: $input"

# Extract specific frame using ffmpeg (frames are 0-indexed, so subtract 1)
frame_index=$((frame_number - 1))
if ffmpeg -i "$input" -vf "select=eq(n\,$frame_index)" -vframes 1 -q:v "$quality" -y "$output" 2>/dev/null; then
  echo "✓ Frame $frame_number extracted: $input → $output"
  
  # Get file size for confirmation
  if command -v stat &> /dev/null; then
    size=$(stat -f%z "$output" 2>/dev/null || stat -c%s "$output" 2>/dev/null)
    if [ -n "$size" ]; then
      echo "  File size: $(echo "$size" | awk '{printf "%.1f KB", $1/1024}')"
    fi
  fi
  
  # Get image dimensions if identify is available (ImageMagick)
  if command -v identify &> /dev/null; then
    dimensions=$(identify -format "%wx%h" "$output" 2>/dev/null)
    if [ -n "$dimensions" ]; then
      echo "  Dimensions: $dimensions"
    fi
  fi
else
  echo "✗ Error: Failed to extract frame from $input"
  exit 1
fi 