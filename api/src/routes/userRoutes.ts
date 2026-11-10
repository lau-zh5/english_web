import express from 'express';
import multer from 'multer';
import { login, register, getUserById, updateUser, uploadAvatar } from '../controllers/userController';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/login', login);
router.post('/register', register);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.post('/:id/avatar', upload.single('avatar'), uploadAvatar);

export default router;
