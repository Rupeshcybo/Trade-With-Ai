import axios from 'axios';

const API_KEY = process.env.GEMINI_API_KEY || ''; // Securely fetch the API key from environment variables
const API_URL = 'https://api.gemini.com/v1'; // Gemini API base URL

// Function to validate images
const validateImage = (image: string): boolean => {
    const validImageFormats = ['image/jpeg', 'image/png', 'image/gif'];
    const mimeType = getMimeType(image); // Assume there's a function to obtain MIME type from image url
    return validImageFormats.includes(mimeType);
};

// Function for market and strategy analysis
const analyzeMarket = async (marketSymbol: string) => {
    try {
        const response = await axios.get(`${API_URL}/pubticker/${marketSymbol}`);
        return formatResponse(response.data);
    } catch (error) {
        const errorMessage = handleError(error);
        throw new Error(errorMessage);
    }
};

// Function to handle errors with retries
const handleError = async (error: any, retries = 3): Promise<any> => {
    if (retries === 0) throw error;
    console.error('Error occurred:', error.message);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second before retrying
    return await handleError(error, retries - 1);
};

// Function to format response
const formatResponse = (data: any) => {
    return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
    };
};

export { analyzeMarket, validateImage };