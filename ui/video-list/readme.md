# Video List Component

## How to use

### Basic Implementation

1. **Include the CSS file:**
   ```html
   <link rel="stylesheet" href="ui-video-list.css">
   ```

2. **Add the HTML structure:**
   ```html
   <ul class="ui-video-list">
     <li>
       <img src="thumbnail.jpg" alt="Video description" width="320" height="180" loading="lazy" decoding="async">
       <time datetime="2024-12-15T10:30:00Z">Dec 15, 2024</time>
       <h3>Video Title</h3>
       <button type="button" popovertarget="video-1" popovertargetaction="show">Open video in modal overlay</button>
       <div id="video-1" popover>
         <button type="button" popovertarget="video-1" popovertargetaction="hide" aria-label="Close and hide the modal overlay">✕</button>
         <video preload="metadata" src="video.mp4" controls></video>
       </div>
     </li>
   </ul>
   ```

3. **Add the JavaScript:**
   ```html
   <script>
     document.querySelectorAll('.ui-video-list div[popover]').forEach(p => {
       const v = p.querySelector('video');
       if (!v) return;
       p.addEventListener('toggle', ({ newState }) => {
         newState === 'open' 
           ? 'autoplay' in v.dataset && v.play()
           : (v.pause(), 'reset' in v.dataset && (v.currentTime = 0));
       });
     });
   </script>
   ```

### Video Attributes

- **`data-autoplay`** - Add to `<video>` to auto-play when modal opens
- **`data-reset`** - Add to `<video>` to reset to beginning when modal closes
- **`controls`** - Standard HTML5 attribute to show video controls
- **`muted`** - Standard HTML5 attribute to start video muted
- **`playsinline`** - Prevents iOS fullscreen takeover, keeps video in popover
- **`preload="metadata"`** - Recommended for better performance

### Example with all features:
```html
<video preload="metadata" src="video.mp4" controls muted playsinline data-autoplay data-reset></video>
```

### Accessibility

- Always include meaningful `alt` text for thumbnails
- Use proper `aria-label` for close buttons

## Example Data Model for CMS

```json
{
  "videos": [
    {
      "id": "video-1",
      "title": "Headline Video 1",
      "publishDate": "2024-12-15T10:30:00Z",
      "thumbnail": {
        "src": "/thumb1.jpg",
        "alt": "Image description",
        "width": 320,
        "height": 180
      },
      "video": {
        "src": "/video1.mp4",
        "preload": "metadata",
        "controls": true,
        "muted": false,
        "autoplay": true,
        "reset": true
      }
    },
    {
      "id": "video-2", 
      "title": "Headline Video 2",
      "publishDate": "2025-03-22T14:45:00Z",
      "thumbnail": {
        "src": "/thumb2.jpg",
        "alt": "Image description",
        "width": 320,
        "height": 180
      },
      "video": {
        "src": "/video2.mp4",
        "preload": "metadata",
        "controls": true,
        "muted": true,
        "autoplay": true,
        "reset": false
      }
    }
  ]
}
```

## Using with React

### React Component Implementation

```jsx
import React, { useEffect, useRef } from 'react';
import './ui-video-list.css';

const VideoList = ({ videos }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    // Initialize video list functionality
    if (containerRef.current) {
      containerRef.current.querySelectorAll('div[popover]').forEach(p => {
        const v = p.querySelector('video');
        if (!v) return;
        
        const handleToggle = ({ newState }) => {
          newState === 'open' 
            ? 'autoplay' in v.dataset && v.play()
            : (v.pause(), 'reset' in v.dataset && (v.currentTime = 0));
        };
        
        p.addEventListener('toggle', handleToggle);
        
        // Cleanup
        return () => p.removeEventListener('toggle', handleToggle);
      });
    }
  }, [videos]);

  return (
    <ul className="ui-video-list" ref={containerRef}>
      {videos.map((video) => (
        <li key={video.id}>
          <img 
            src={video.thumbnail.src} 
            alt={video.thumbnail.alt}
            width={video.thumbnail.width}
            height={video.thumbnail.height}
            loading="lazy"
            decoding="async"
          />
          <time dateTime={video.publishDate}>
            {new Date(video.publishDate).toLocaleDateString()}
          </time>
          <h3>{video.title}</h3>
          <button 
            type="button" 
            popoverTarget={video.id}
            popoverTargetAction="show"
          >
            Open video in modal overlay
          </button>
          <div id={video.id} popover="auto">
            <button 
              type="button" 
              popoverTarget={video.id}
              popoverTargetAction="hide"
              aria-label="Close and hide the modal overlay"
            >
              ✕
            </button>
            <video 
              preload={video.video.preload}
              src={video.video.src}
              controls={video.video.controls}
              muted={video.video.muted}
              playsInline
              data-autoplay={video.video.autoplay ? '' : undefined}
              data-reset={video.video.reset ? '' : undefined}
            />
          </div>
        </li>
      ))}
    </ul>
  );
};

export default VideoList;
```

### Usage Example

```jsx
import VideoList from './VideoList';

const App = () => {
  const videoData = [
    {
      id: "video-1",
      title: "Peaceful River Journey",
      publishDate: "2024-12-15T10:30:00Z",
      thumbnail: {
        src: "/thumb1.jpg",
        alt: "River flowing through forest",
        width: 320,
        height: 180
      },
      video: {
        src: "/video1.mp4",
        preload: "metadata",
        controls: true,
        muted: false,
        autoplay: true,
        reset: true
      }
    }
    // ... more videos
  ];

  return (
    <div>
      <h1>My Video Gallery</h1>
      <VideoList videos={videoData} />
    </div>
  );
};
```

### React Notes

- **Popover Support**: Ensure your React version supports the Popover API or use a polyfill
- **Event Cleanup**: The component properly removes event listeners on unmount
- **Data Attributes**: React handles `data-*` attributes correctly when passed as props
- **Type Safety**: Consider adding TypeScript interfaces for better type safety

### TypeScript Interface (Optional)

```typescript
interface VideoData {
  id: string;
  title: string;
  publishDate: string;
  thumbnail: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
  video: {
    src: string;
    preload: 'none' | 'metadata' | 'auto';
    controls: boolean;
    muted: boolean;
    autoplay: boolean;
    reset: boolean;
  };
}

interface VideoListProps {
  videos: VideoData[];
}
```
