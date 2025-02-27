export class AssetUploader extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Define template
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: system-ui, sans-serif;
        }
        
        .uploader {
          border: 2px dashed #ccc;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          transition: all 0.3s ease;
        }
        
        .uploader.drag-over {
          border-color: #4caf50;
          background-color: rgba(76, 175, 80, 0.1);
        }
        
        .file-input {
          display: none;
        }
        
        button {
          background-color: #4caf50;
          border: none;
          border-radius: 4px;
          color: white;
          cursor: pointer;
          font-size: 16px;
          margin-top: 10px;
          padding: 10px 15px;
          transition: background-color 0.3s;
        }
        
        button:hover {
          background-color: #45a049;
        }
        
        .progress-container {
          margin-top: 15px;
          display: none;
        }
        
        progress {
          width: 100%;
          height: 10px;
          border-radius: 5px;
        }
        
        .file-list {
          margin-top: 20px;
          text-align: left;
        }
        
        .file-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 5px 0;
          border-bottom: 1px solid #eee;
        }
        
        .error {
          color: #f44336;
          margin-top: 10px;
        }

        .default-badge {
          background-color: #4caf50;
          color: white;
          border-radius: 12px;
          padding: 2px 8px;
          font-size: 0.8em;
          margin-left: 10px;
        }
        
        .file-size {
          color: #666;
          font-size: 0.9em;
        }
        
        .empty-list {
          color: #666;
          font-style: italic;
          text-align: center;
          padding: 10px 0;
        }
        
        .loading {
          color: #666;
          text-align: center;
          padding: 10px 0;
        }
        
        .load-assets-btn {
          background-color: #2196F3;
          margin-right: 10px;
        }
        
        .load-assets-btn:hover {
          background-color: #0b7dda;
        }
        
        .button-group {
          display: flex;
          justify-content: center;
          margin-top: 10px;
        }

        .set-default-btn {
          background-color: #ff9800;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          padding: 2px 8px;
          margin-left: 10px;
        }
        
        .set-default-btn:hover {
          background-color: #e68a00;
        }
      </style>
      
      <div class="uploader" id="dropZone">
        <h2>Upload Assets</h2>
        <p>Drag & drop files here or</p>
        <input type="file" id="fileInput" class="file-input" multiple />
        <div class="button-group">
          <button id="loadAssetsButton" class="load-assets-btn">View Existing Assets</button>
          <button id="browseButton">Browse Files</button>
        </div>
        
        <div class="progress-container" id="progressContainer">
          <p id="uploadStatus">Uploading...</p>
          <progress id="uploadProgress" value="0" max="100"></progress>
        </div>
        
        <div class="file-list" id="fileList"></div>
        <p class="error" id="errorMessage"></p>
      </div>
    `;
    
    // Bind methods
    this.handleDragOver = this.handleDragOver.bind(this);
    this.handleDragLeave = this.handleDragLeave.bind(this);
    this.handleDrop = this.handleDrop.bind(this);
    this.handleFileSelect = this.handleFileSelect.bind(this);
    this.handleBrowseClick = this.handleBrowseClick.bind(this);
    this.uploadFiles = this.uploadFiles.bind(this);
    this.loadAssetList = this.loadAssetList.bind(this);
    this.setAsDefault = this.setAsDefault.bind(this);
  }
  
  connectedCallback() {
    // Get references to DOM elements
    this.dropZone = this.shadowRoot.getElementById('dropZone');
    this.fileInput = this.shadowRoot.getElementById('fileInput');
    this.browseButton = this.shadowRoot.getElementById('browseButton');
    this.loadAssetsButton = this.shadowRoot.getElementById('loadAssetsButton');
    this.progressContainer = this.shadowRoot.getElementById('progressContainer');
    this.uploadProgress = this.shadowRoot.getElementById('uploadProgress');
    this.uploadStatus = this.shadowRoot.getElementById('uploadStatus');
    this.fileList = this.shadowRoot.getElementById('fileList');
    this.errorMessage = this.shadowRoot.getElementById('errorMessage');
    
    // Add event listeners
    this.dropZone.addEventListener('dragover', this.handleDragOver);
    this.dropZone.addEventListener('dragleave', this.handleDragLeave);
    this.dropZone.addEventListener('drop', this.handleDrop);
    this.fileInput.addEventListener('change', this.handleFileSelect);
    this.browseButton.addEventListener('click', this.handleBrowseClick);
    this.loadAssetsButton.addEventListener('click', this.loadAssetList);
  }
  
  disconnectedCallback() {
    // Remove event listeners
    this.dropZone.removeEventListener('dragover', this.handleDragOver);
    this.dropZone.removeEventListener('dragleave', this.handleDragLeave);
    this.dropZone.removeEventListener('drop', this.handleDrop);
    this.fileInput.removeEventListener('change', this.handleFileSelect);
    this.browseButton.removeEventListener('click', this.handleBrowseClick);
    this.loadAssetsButton.removeEventListener('click', this.loadAssetList);
  }
  
  // Event handlers
  handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    this.dropZone.classList.add('drag-over');
  }
  
  handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    this.dropZone.classList.remove('drag-over');
  }
  
  handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    this.dropZone.classList.remove('drag-over');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      this.processFiles(files);
    }
  }
  
  handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
      this.processFiles(files);
    }
  }
  
  handleBrowseClick(e) {
    this.fileInput.click();
  }
  
  // Process and validate files
  processFiles(files) {
    this.errorMessage.textContent = '';
    const validFiles = [];
    
    // Get allowed types from attribute
    const allowedTypes = this.getAttribute('allowed-types') || 'image/jpeg,image/png,image/gif,application/pdf';
    const maxSize = parseInt(this.getAttribute('max-size') || '10') * 1024 * 1024; // Default 10MB
    
    const typeArray = allowedTypes.split(',');
    
    // Validate each file
    for (const file of files) {
      if (!typeArray.includes(file.type)) {
        this.errorMessage.textContent = `File type ${file.type} is not allowed. Allowed types: ${allowedTypes}`;
        continue;
      }
      
      if (file.size > maxSize) {
        this.errorMessage.textContent = `File ${file.name} is too large. Maximum size is ${maxSize/1024/1024}MB.`;
        continue;
      }
      
      validFiles.push(file);
    }
    
    if (validFiles.length > 0) {
      this.uploadFiles(validFiles);
    }
  }
  
  // Upload files to the server
  uploadFiles(files) {
    const api = this.getAttribute('api') || '';
    const uploadEndpoint = this.getAttribute('upload-url') || '/api/asset';
    const productId = this.getAttribute('product-id');
    
    // Construct the full URL - if api is provided, use it as a base
    const baseUrl = api ? `${api.replace(/\/$/, '')}` : '';
    const uploadUrl = `${baseUrl}${uploadEndpoint.startsWith('/') ? uploadEndpoint : '/' + uploadEndpoint}`;
    
    if (!productId) {
      this.errorMessage.textContent = 'Product ID is required';
      return;
    }
    
    // Show progress container
    this.progressContainer.style.display = 'block';
    
    // For each file, create a separate upload
    files.forEach(file => {
      const formData = new FormData();
      formData.append('asset', file);
      
      // Check if this should be set as default
      const isDefault = this.fileList.children.length === 0 && 
        (this.getAttribute('auto-default') !== 'false');
      
      // Create URL with product ID
      const url = `${uploadUrl}/${productId}${isDefault ? '?default=true' : ''}`;
      
      // Log the URL to help with debugging
      console.log(`Uploading to: ${url}`);
      
      const xhr = new XMLHttpRequest();
      
      // Create entry in the file list
      const fileItem = document.createElement('div');
      fileItem.className = 'file-item';
      fileItem.innerHTML = `
        <span>${file.name}</span>
        <span>0%</span>
      `;
      this.fileList.appendChild(fileItem);
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          fileItem.querySelector('span:last-child').textContent = `${percentComplete}%`;
          
          // Update overall progress (approximation if multiple files)
          this.uploadProgress.value = percentComplete;
          this.uploadStatus.textContent = `Uploading ${file.name} (${percentComplete}%)`;
        }
      });
      
      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status === 200 || xhr.status === 201) {
          fileItem.querySelector('span:last-child').textContent = 'Completed';
          
          // Dispatch success event
          let response;
          try {
            response = JSON.parse(xhr.responseText);
          } catch (e) {
            response = { message: 'Response received but could not parse JSON' };
          }
          
          this.dispatchEvent(new CustomEvent('upload-success', {
            detail: { file, response }
          }));
          
          // If all files are uploaded, refresh the asset list
          const allCompleted = Array.from(this.fileList.children).every(
            item => item.querySelector('span:last-child').textContent === 'Completed' ||
                  item.querySelector('span:last-child').textContent === 'Failed' ||
                  item.querySelector('span:last-child').textContent === 'Error'
          );
          
          if (allCompleted) {
            // Refresh the asset list after a short delay
            setTimeout(() => this.loadAssetList(), 500);
          }
        } else {
          fileItem.querySelector('span:last-child').textContent = 'Failed';
          this.errorMessage.textContent = `Failed to upload ${file.name}: ${xhr.statusText}`;
          
          // Dispatch error event
          this.dispatchEvent(new CustomEvent('upload-error', {
            detail: { file, error: xhr.statusText }
          }));
        }
      });
      
      // Handle errors
      xhr.addEventListener('error', () => {
        fileItem.querySelector('span:last-child').textContent = 'Error';
        this.errorMessage.textContent = `Network error occurred while uploading ${file.name}. This might be a CORS issue. Check that the server is running and CORS is properly configured.`;
        console.error('Upload failed. Possible CORS issue. Make sure your server is running and has proper CORS headers.');
        
        // Dispatch error event
        this.dispatchEvent(new CustomEvent('upload-error', {
          detail: { file, error: 'Network error (possible CORS issue)' }
        }));
      });
      
      // Open and send the request
      xhr.open('POST', url, true);
      xhr.send(formData);
    });
  }
  
  // Load the list of assets for a product
  loadAssetList() {
    const api = this.getAttribute('api') || '';
    const listEndpoint = '/api/asset-list';
    const productId = this.getAttribute('product-id');
    
    if (!productId) {
      this.errorMessage.textContent = 'Product ID is required to load assets';
      return;
    }
    
    // Construct the full URL
    const baseUrl = api ? `${api.replace(/\/$/, '')}` : '';
    const url = `${baseUrl}${listEndpoint}/${productId}`;
    
    // Clear the file list before loading
    this.fileList.innerHTML = '<div class="loading">Loading assets...</div>';
    
    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        // Clear the loading message
        this.fileList.innerHTML = '';
        
        if (data.assets && data.assets.length > 0) {
          data.assets.forEach(asset => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            
            // Add default indicator and set default button
            const defaultBadge = asset.isDefault 
              ? '<span class="default-badge">Default</span>' 
              : `<button class="set-default-btn" data-filename="${asset.name}">Set as Default</button>`;
            
            fileItem.innerHTML = `
              <span>${asset.name}</span>
              ${defaultBadge}
              <span class="file-size">${this.formatFileSize(asset.size)}</span>
            `;
            
            // Add event listener for set default buttons
            const setDefaultBtn = fileItem.querySelector('.set-default-btn');
            if (setDefaultBtn) {
              setDefaultBtn.addEventListener('click', (e) => {
                const filename = e.target.dataset.filename;
                this.setAsDefault(filename);
              });
            }
            
            this.fileList.appendChild(fileItem);
          });
        } else {
          this.fileList.innerHTML = '<div class="empty-list">No assets found for this product</div>';
        }
      })
      .catch(error => {
        console.error('Error loading assets:', error);
        this.errorMessage.textContent = `Failed to load assets: ${error.message}`;
        this.fileList.innerHTML = '';
      });
  }
  
  // Set a file as the default asset
  setAsDefault(filename) {
    const api = this.getAttribute('api') || '';
    const productId = this.getAttribute('product-id');
    
    if (!productId) {
      this.errorMessage.textContent = 'Product ID is required';
      return;
    }
    
    // Construct the URL
    const baseUrl = api ? `${api.replace(/\/$/, '')}` : '';
    const url = `${baseUrl}/api/asset/${productId}/default/${filename}`;
    
    // Show loading state
    this.errorMessage.textContent = `Setting ${filename} as default...`;
    
    fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      this.errorMessage.textContent = '';
      
      // Dispatch success event
      this.dispatchEvent(new CustomEvent('default-set', {
        detail: { filename, response: data }
      }));
      
      // Refresh the asset list
      this.loadAssetList();
    })
    .catch(error => {
      console.error('Error setting default asset:', error);
      this.errorMessage.textContent = `Failed to set as default: ${error.message}`;
    });
  }
  
  // Helper method to format file size
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  // Attribute handling
  static get observedAttributes() {
    return ['api', 'upload-url', 'product-id', 'allowed-types', 'max-size', 'auto-default'];
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    // Handle attribute changes if needed
    if (name === 'product-id' && newValue) {
      // Maybe fetch existing files for this product if needed
    }
  }
}
