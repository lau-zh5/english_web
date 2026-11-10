import { Router } from 'express';
import { getAllWords, getWordById, createWord, batchCreateWords, updateWord, uploadWordAudio, uploadWordAudioMiddleware, deleteWord, streamWordAudio, getReadingWords, getGroupedWords } from '../controllers/wordController';

const router = Router();

router.get('/', getAllWords);
router.get('/reading', getReadingWords);
router.get('/grouped/list', getGroupedWords);
router.get('/:id', getWordById);
router.post('/', createWord);
router.post('/batch', batchCreateWords);
router.put('/:id', updateWord);
router.post('/audio', uploadWordAudioMiddleware.single('audio'), uploadWordAudio);
router.delete('/:id', deleteWord);
router.get('/:id/audio', streamWordAudio);

export default router;
