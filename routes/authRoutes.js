import express from 'express';
import { login, register, updateUser } from '../controller/authController.js';
import authenticateUser from '../middleware/auth.js';
import rateLimiter from 'express-rate-limit'

const apiLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: 'Too many requests from this IP, please try again after 15 minutes',
})

const router = express.Router();

router.route('/register').post(register,apiLimiter);
router.route('/login').post(login,apiLimiter);
router.route('/updateUser').patch(authenticateUser, updateUser);

export default router