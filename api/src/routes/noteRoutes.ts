import { Router } from 'express';
import { getAllNotes, getNotesByAudioId, createNote, deleteNote } from '../controllers/noteController';

const router = Router();

router.get('/', getAllNotes);
router.get('/audio/:audioId', getNotesByAudioId);
router.post('/', createNote);
router.delete('/:id', deleteNote);

export default router;