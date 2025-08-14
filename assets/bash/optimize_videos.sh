#!/bin/bash

# optimize_videos.sh - Optimize MP4 videos for web use
# Usage: ./optimize_videos.sh [video_directory] [quality]

video_dir="${1:-../video}"
quality="${2:-28}"

# Help message
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
  echo "Optimize MP4 videos for web use (removes audio, reduces file size)"
  echo ""
  echo "Usage: $0 [video_directory] [quality]"
  echo ""
  echo "Examples:"
  echo "  $0"
  echo "  $0 ../video"
  echo "  $0 ../video 30"
  echo "  $0 /path/to/videos 25"
  echo ""
  echo "Parameters:"
  echo "  video_directory: Path to video files (default: ../video)"
  echo "  quality: CRF value 18-32, lower = better quality (default: 28)"
  echo ""
  echo "Note: Creates optimized files with '_optimized' suffix"
  echo "      Skips 'river.mp4' as requested"
  exit 0
fi

# Check if video directory exists
if [ ! -d "$video_dir" ]; then
  echo "✗ Error: Video directory '$video_dir' not found"
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

# Validate quality parameter
if ! [[ "$quality" =~ ^[0-9]+$ ]] || [ "$quality" -lt 18 ] || [ "$quality" -gt 32 ]; then
  echo "✗ Error: Quality must be a number between 18-32"
  exit 1
fi

echo "Optimizing videos in: $video_dir"
echo "Quality (CRF): $quality"
echo "Skipping: river.mp4"
echo ""

# Counter for processed files
processed=0
skipped=0

# Process all MP4 files except river.mp4
for video in "$video_dir"/*.mp4; do
  # Check if file exists (handles case when no .mp4 files found)
  if [ ! -f "$video" ]; then
    echo "No MP4 files found in $video_dir"
    exit 0
  fi
  
  filename=$(basename "$video")
  
  # Skip river.mp4 as requested
  if [ "$filename" = "river.mp4" ]; then
    echo "⏭️  Skipping: $filename"
    skipped=$((skipped + 1))
    continue
  fi
  
  # Generate output filename
  name_without_ext="${filename%.*}"
  output="$video_dir/${name_without_ext}_optimized.mp4"
  
  echo "🎬 Processing: $filename"
  
  # Get original file size
  if command -v stat &> /dev/null; then
    original_size=$(stat -f%z "$video" 2>/dev/null || stat -c%s "$video" 2>/dev/null)
  fi
  
  # Optimize video with ffmpeg
  # -c:v libx264: Use H.264 codec
  # -crf: Constant Rate Factor (quality)
  # -preset slow: Better compression
  # -an: Remove audio
  # -movflags +faststart: Optimize for web streaming
  if ffmpeg -i "$video" \
    -c:v libx264 \
    -crf "$quality" \
    -preset slow \
    -an \
    -movflags +faststart \
    -y "$output" 2>/dev/null; then
    
    echo "   ✓ Optimized: $output"
    
    # Show file size comparison
    if [ -n "$original_size" ] && command -v stat &> /dev/null; then
      new_size=$(stat -f%z "$output" 2>/dev/null || stat -c%s "$output" 2>/dev/null)
      if [ -n "$new_size" ]; then
        original_mb=$(echo "$original_size" | awk '{printf "%.1f", $1/1048576}')
        new_mb=$(echo "$new_size" | awk '{printf "%.1f", $1/1048576}')
        reduction=$(echo "$original_size $new_size" | awk '{printf "%.1f", (($1-$2)/$1)*100}')
        echo "   📊 Size: ${original_mb}MB → ${new_mb}MB (${reduction}% reduction)"
      fi
    fi
    
    processed=$((processed + 1))
  else
    echo "   ✗ Error: Failed to optimize $filename"
  fi
  
  echo ""
done

echo "🏁 Summary:"
echo "   Processed: $processed videos"
echo "   Skipped: $skipped videos"
echo "   Quality used: CRF $quality"

if [ $processed -gt 0 ]; then
  echo ""
  echo "💡 Tip: Test the optimized videos and replace originals if satisfied"
  echo "   You can rename '_optimized.mp4' files to remove the suffix"
fi
