import { Router } from 'express';
import { getAllChapters, getChaptersByWordbook, getChapterById, createChapter, uploadChapterAudio, uploadChapterAudioMiddleware, updateChapter, deleteChapter, streamChapterAudio } from '../controllers/chapterController';

const router = Router();

router.get('/', getAllChapters);
router.get('/wordbook/:wordbookId', getChaptersByWordbook);
router.get('/:id', getChapterById);
router.post('/', createChapter);
router.post('/audio', uploadChapterAudioMiddleware.single('audio'), uploadChapterAudio);
router.put('/:id', updateChapter);
router.delete('/:id', deleteChapter);
router.get('/:id/audio', streamChapterAudio);

export default router;
