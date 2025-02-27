import { AssetUploader } from './asset-uploader.js';

// Define the element
if (!customElements.get('asset-uploader')) {
  customElements.define('asset-uploader', AssetUploader);
}

export { AssetUploader };
