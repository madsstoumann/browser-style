export default function formatBytes(bytes) {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.trunc(Math.log(bytes) / Math.log(1024));
  return bytes > 0 ? `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`:'0 B';
}