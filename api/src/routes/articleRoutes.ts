import { Router } from 'express';
import { getAllArticles, getArticleById, createArticle, updateArticle, deleteArticle } from '../controllers/articleController';

const router = Router();

router.get('/', getAllArticles);
router.get('/:id', getArticleById);
router.post('/', createArticle);
router.put('/:id', updateArticle);
router.delete('/:id', deleteArticle);

export default router;
