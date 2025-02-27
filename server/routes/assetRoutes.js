import express from 'express';
import { getAsset, uploadAsset, getAssetList, setDefaultAsset } from '../controllers/assetController.js';
import { upload } from '../middleware/fileUpload.js';
import { validateAssetRequest } from '../middleware/validation.js';

const router = express.Router();

// GET asset by ID with optional dimensions and DPI
router.get('/asset/:id', validateAssetRequest('get'), getAsset);

// POST upload a new asset
router.post('/asset/:id', validateAssetRequest('post'), upload.single('asset'), uploadAsset);

// GET list of assets in a folder
router.get('/asset-list/:id', validateAssetRequest('list'), getAssetList);

// PUT set asset as default
router.put('/asset/:id/default/:filename', validateAssetRequest('default'), setDefaultAsset);

export default router;
