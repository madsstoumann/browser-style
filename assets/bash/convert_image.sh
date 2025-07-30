#!/bin/bash

# convert_image.sh - Convert images to AVIF format with optional resizing
# Usage: ./convert_image.sh input.png [output.avif] [width] [quality]

input="$1"
output="${2:-${input%.*}.avif}"
width="${3:-350}"
quality="${4:-60}"

# Help message
if [ -z "$input" ] || [ "$input" = "-h" ] || [ "$input" = "--help" ]; then
  echo "Convert images to AVIF format with optional resizing"
  echo ""
  echo "Usage: $0 <input_image> [output] [width] [quality]"
  echo ""
  echo "Examples:"
  echo "  $0 photo.png"
  echo "  $0 photo.png photo.avif"
  echo "  $0 photo.png thumbnail.avif 400"
  echo "  $0 photo.png photo.avif 400 80"
  echo "  $0 image.jpg compressed.avif 280 50"
  echo ""
  echo "Parameters:"
  echo "  width: Maximum width in pixels (default: 350)"
  echo "  quality: AVIF quality 1-100 (default: 60)"
  echo ""
  echo "Supported formats: PNG, JPG, JPEG, WEBP, TIFF, GIF"
  exit 0
fi

# Check if input file exists
if [ ! -f "$input" ]; then
  echo "✗ Error: Input file '$input' not found"
  exit 1
fi

# Check if Node.js is available
if ! command -v node &> /dev/null; then
  echo "✗ Error: Node.js is not installed"
  echo "Install with:"
  echo "  macOS: brew install node"
  echo "  Ubuntu: sudo apt install nodejs npm"
  exit 1
fi

echo "Converting image: $input"
echo "Output: $output"
echo "Max width: ${width}px, Quality: $quality"

# Convert image using Sharp via npx
npx -p sharp node -e "
  const sharp = require('sharp');
  (async () => {
    try {
      const metadata = await sharp('$input').metadata();
      let processor = sharp('$input');
      
      if (metadata.width > $width) {
        processor = processor.resize($width);
        console.log(\`Resizing from \${metadata.width}px to $width px\`);
      } else {
        console.log(\`Keeping original size (\${metadata.width}px)\`);
      }
      
      await processor.avif({ quality: $quality }).toFile('$output');
      console.log('✓ Converted: $input → $output');
      
      // Show file size comparison
      const fs = require('fs');
      const inputStats = fs.statSync('$input');
      const outputStats = fs.statSync('$output');
      const inputSize = (inputStats.size / 1024).toFixed(1);
      const outputSize = (outputStats.size / 1024).toFixed(1);
      const savings = (((inputStats.size - outputStats.size) / inputStats.size) * 100).toFixed(1);
      
      console.log(\`File size: \${inputSize}KB → \${outputSize}KB (saved \${savings}%)\`);
    } catch (err) {
      console.error('✗ Error:', err.message);
      process.exit(1);
    }
  })();
"

if [ $? -eq 0 ]; then
  echo "✓ Image conversion completed successfully"
else
  echo "✗ Image conversion failed"
  exit 1
fi 