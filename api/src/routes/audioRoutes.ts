import { Router } from 'express';
import multer from 'multer';
import { getAllAudios, getAudioById, createAudio, deleteAudio, streamAudio } from '../controllers/audioController';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '../../../');
const INFO_DIR = path.join(PROJECT_ROOT, 'info');
const router = Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(INFO_DIR, 'music'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    const allowedExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.flac'];
    const extname = path.extname(file.originalname).toLowerCase();
    const allowedMimeTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/flac', 'audio/x-wav', 'audio/x-m4a'];
    
    const isValidExtension = allowedExtensions.includes(extname);
    const isValidMimeType = allowedMimeTypes.includes(file.mimetype);
    
    if (isValidExtension && isValidMimeType) {
      return cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed (mp3, wav, ogg, m4a, flac)'));
    }
  }
});

router.get('/', getAllAudios);
router.get('/:id', getAudioById);
router.post('/', upload.single('audio'), createAudio);
router.delete('/:id', deleteAudio);
router.get('/stream/:filename', streamAudio);

export default router;
