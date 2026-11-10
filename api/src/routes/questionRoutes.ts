import { Router } from 'express';
import { getQuestionsByArticle, createQuestion, createQuestionsBatch, deleteQuestion, deleteQuestionsByArticle } from '../controllers/questionController';

const router = Router();

router.get('/article/:articleId', getQuestionsByArticle);
router.post('/', createQuestion);
router.post('/batch', createQuestionsBatch);
router.delete('/:id', deleteQuestion);
router.delete('/article/:articleId', deleteQuestionsByArticle);

export default router;
