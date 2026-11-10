import { Router } from 'express';
import { getAllStudyRecords, getStudyRecordByDate, createOrUpdateStudyRecord } from '../controllers/studyRecordController';

const router = Router();

router.get('/', getAllStudyRecords);
router.get('/:date', getStudyRecordByDate);
router.post('/', createOrUpdateStudyRecord);

export default router;
