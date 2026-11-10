import { Router } from 'express';
import { getAllWordbooks, getWordbookById, createWordbook, updateWordbook, deleteWordbook } from '../controllers/wordbookController';

const router = Router();

router.get('/', getAllWordbooks);
router.get('/:id', getWordbookById);
router.post('/', createWordbook);
router.put('/:id', updateWordbook);
router.delete('/:id', deleteWordbook);

export default router;
