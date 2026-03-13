import express from 'express';
import { analyzeTrade } from '../services/geminiService';

const router = express.Router();

router.post('/analyze', analyzeTrade);

export default router;