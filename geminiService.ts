import { GoogleGenAI } from "@google/genai";
import { AnalysisResult, MarketIndex, TradingStrategy } from "../types";

// Configuration
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL_NAME = "gemini-2.0-flash-exp";

// Validation
if (!API_KEY || API_KEY === 'PLACEHOLDER_API_KEY') {
  console.error('⚠️ Gemini API key not configured. Please set VITE_GEMINI_API_KEY in .env file.');
}

const SYSTEM_INSTRUCTION = `
You are an Elite Indian Market Options Strategist specializing in NIFTY and BANKNIFTY analysis.

ROLE:
- Analyze technical chart patterns, support/resistance levels, and market structure
- Provide actionable CE (Call) or PE (Put) trading signals
- Use Hinglish (Hindi+English mix) for reasoning to connect with Indian traders
- Consider market context, news sentiment, and risk management

OUTPUT FORMAT - JSON ONLY:
{
  "signal": "LONG" | "SHORT" | "NO TRADE",
  "entry": "Entry price or zone (e.g., 48500-48550)",
  "sl": "Stop loss level (e.g., 48350)",
  "targets": "Target levels (e.g., 48750, 48900)",
  "confidence": 65-95 (number),
  "reason": "Detailed Hinglish explanation mixing technical + fundamental logic",
  "marketRegime": "TRENDING" | "RANGING" | "VOLATILE",
  "suggestedStrategy": "e.g., Breakout Pullback, Mean Reversion, Trend Following",
  "expiry": "Nearest weekly/monthly expiry date",
  "newsSentiment": "POSITIVE" | "NEGATIVE" | "NEUTRAL",
  "newsSummary": "1-2 sentence news context affecting market",
  "sources": [{"title": "source name", "uri": "url"}] (optional, if news sources available)
}

RULES:
1. If chart is unclear or no clear setup → signal: "NO TRADE"
2. Always provide SL (stop loss) for risk management
3. Confidence based on: pattern clarity, volume, market context
4. Use Hinglish for 'reason' - makes it relatable (e.g., "Chart mein clear breakout dikh raha hai, volume bhi strong hai")
5. Consider Indian market hours (9:15 AM - 3:30 PM IST)
6. Factor in Indian market news, global cues, FII/DII data if relevant
7. For INTRADAY: Focus on shorter timeframes (5min-15min charts)
8. For SCALPING: Ultra-short timeframes (1min-5min), tight stops

ANALYSIS CHECKLIST:
✓ Trend direction (higher highs/lows or lower highs/lows)
✓ Support/Resistance zones
✓ Chart patterns (triangles, flags, head & shoulders, etc.)
✓ Volume confirmation
✓ Moving averages (20, 50, 200 EMA)
✓ Momentum indicators (RSI, MACD if visible)
✓ Market structure breaks
✓ Round number levels (psychological levels)
✓ Previous day high/low
✓ Opening range breakout/breakdown

EXPIRY CONTEXT:
- NIFTY: Thursday weekly expiry
- BANKNIFTY: Wednesday weekly expiry
- Consider expiry-related volatility and time decay

RISK MANAGEMENT:
- Risk:Reward minimum 1:1.5, ideally 1:2 or better
- No trade if setup is ambiguous
- Always specify clear entry, SL, and target zones
`;

// Initialize Gemini AI
let genAI: GoogleGenAI | null = null;

function initializeAI(): GoogleGenAI {
  if (!genAI && API_KEY && API_KEY !== 'PLACEHOLDER_API_KEY') {
    genAI = new GoogleGenAI({ apiKey: API_KEY });
  }
  
  if (!genAI) {
    throw new Error('Gemini AI not initialized. Please configure API key.');
  }
  
  return genAI;
}

/**
 * Convert base64 data URI to raw base64 string
 */
function extractBase64(dataUri: string): string {
  const match = dataUri.match(/^data:image\/\w+;base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid image data URI format');
  }
  return match[1];
}

/**
 * Get MIME type from base64 data URI
 */
function getMimeType(dataUri: string): string {
  const match = dataUri.match(/^data:(image\/\w+);base64,/);
  if (!match) {
    return 'image/jpeg'; // Default fallback
  }
  return match[1];
}

/**
 * Validate and sanitize analysis result
 */
function validateAnalysisResult(data: any): AnalysisResult {
  // Required fields validation
  if (!data.signal || !['LONG', 'SHORT', 'NO TRADE'].includes(data.signal)) {
    throw new Error('Invalid signal value');
  }
  
  if (typeof data.confidence !== 'number' || data.confidence < 0 || data.confidence > 100) {
    throw new Error('Invalid confidence value');
  }
  
  if (!data.marketRegime || !['TRENDING', 'RANGING', 'VOLATILE'].includes(data.marketRegime)) {
    throw new Error('Invalid market regime');
  }
  
  if (!data.newsSentiment || !['POSITIVE', 'NEGATIVE', 'NEUTRAL'].includes(data.newsSentiment)) {
    throw new Error('Invalid news sentiment');
  }
  
  // Construct validated result
  const result: AnalysisResult = {
    signal: data.signal,
    entry: String(data.entry || 'N/A'),
    sl: String(data.sl || 'N/A'),
    targets: String(data.targets || 'N/A'),
    confidence: Number(data.confidence),
    reason: String(data.reason || 'No reasoning provided'),
    marketRegime: data.marketRegime,
    suggestedStrategy: String(data.suggestedStrategy || 'Wait for confirmation'),
    expiry: String(data.expiry || 'Check current weekly expiry'),
    newsSentiment: data.newsSentiment,
    newsSummary: String(data.newsSummary || 'No significant news'),
    sources: Array.isArray(data.sources) ? data.sources.map((s: any) => ({
      title: String(s.title || 'Unknown'),
      uri: String(s.uri || '#')
    })) : []
  };
  
  return result;
}

/**
 * Main function to analyze chart image using Gemini AI
 */
export async function analyzeChartImage(
  imageDataUri: string,
  market: MarketIndex,
  strategy: TradingStrategy
): Promise<AnalysisResult> {
  try {
    // Initialize AI
    const ai = initializeAI();
    
    // Prepare image data
    const base64Data = extractBase64(imageDataUri);
    const mimeType = getMimeType(imageDataUri);
    
    // Build context-specific prompt
    const contextPrompt = `
MARKET: ${market}
STRATEGY: ${strategy}
CURRENT_DATE: ${new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
DAY_OF_WEEK: ${new Date().toLocaleDateString('en-IN', { weekday: 'long', timeZone: 'Asia/Kolkata' })}

Analyze this ${market} chart for ${strategy} trading opportunities.

${strategy === 'SCALPING' 
  ? 'Focus on: Quick 5-15 point moves, very tight stops, immediate execution setups.' 
  : 'Focus on: Intraday swings, 30-100 point moves, session high/low breaks.'}

${market === 'BANKNIFTY' 
  ? 'Remember: BANKNIFTY expiry is Wednesday. High volatility index, moves 200-500 points intraday.' 
  : 'Remember: NIFTY expiry is Thursday. Relatively stable, moves 50-150 points intraday.'}

Return ONLY valid JSON matching the schema specified in system instructions.
`;

    // Generate content with image
    const model = ai.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction: SYSTEM_INSTRUCTION,
    });
    
    const result = await model.generateContent([
      contextPrompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      }
    ]);
    
    const response = await result.response;
    const text = response.text();
    
    // Parse JSON response
    let jsonData;
    try {
      // Remove markdown code blocks if present
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      jsonData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', text);
      throw new Error('AI returned invalid JSON format. Please try again.');
    }
    
    // Validate and return
    const validatedResult = validateAnalysisResult(jsonData);
    
    // Log for debugging (remove in production or use proper logging)
    console.log('✅ Analysis completed:', {
      market,
      strategy,
      signal: validatedResult.signal,
      confidence: validatedResult.confidence
    });
    
    return validatedResult;
    
  } catch (error: any) {
    console.error('❌ Analysis error:', error);
    
    // Provide user-friendly error messages
    if (error.message?.includes('API key')) {
      throw new Error('API configuration error. Please contact support.');
    } else if (error.message?.includes('quota')) {
      throw new Error('API quota exceeded. Please try again later.');
    } else if (error.message?.includes('Invalid image')) {
      throw new Error('Invalid image format. Please upload a valid chart screenshot.');
    } else if (error.message?.includes('invalid JSON')) {
      throw new Error(error.message);
    } else {
      throw new Error('Analysis failed. Please try again or contact support.');
    }
  }
}

/**
 * Health check for API connection
 */
export async function checkAPIHealth(): Promise<boolean> {
  try {
    if (!API_KEY || API_KEY === 'PLACEHOLDER_API_KEY') {
      return false;
    }
    
    const ai = initializeAI();
    // Simple test to verify API key works
    const model = ai.getGenerativeModel({ model: MODEL_NAME });
    await model.generateContent('test');
    return true;
  } catch {
    return false;
  }
}

/**
 * Get API status for UI display
 */
export function getAPIStatus(): {
  configured: boolean;
  message: string;
} {
  if (!API_KEY) {
    return {
      configured: false,
      message: 'API key not found in environment variables'
    };
  }
  
  if (API_KEY === 'PLACEHOLDER_API_KEY') {
    return {
      configured: false,
      message: 'Using placeholder API key. Please configure real key.'
    };
  }
  
  return {
    configured: true,
    message: 'API configured successfully'
  };
}
