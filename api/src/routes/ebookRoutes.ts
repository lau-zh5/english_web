import { Router } from 'express';
import { uploadEbookMiddleware, uploadEbook, getEbookInfo, deleteEbook } from '../controllers/ebookController';

const router = Router();

router.post('/upload', uploadEbookMiddleware.single('file'), uploadEbook);
router.get('/:wordbookId', getEbookInfo);
router.delete('/:wordbookId', deleteEbook);

export default router;