import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { handleErrors } from './middleware/errorHandler'; // Assume this exists for error handling

const app = express();

app.use(cors());
app.use(express.json());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // Limit each IP to 100 requests per windowMs
});

app.use(limiter);

// Routes
app.use('/api/analyze', require('./routes/analyze'));

// Error handling middleware
app.use(handleErrors);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});