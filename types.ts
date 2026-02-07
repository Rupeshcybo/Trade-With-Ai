export enum AnalysisStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  ANALYZING = 'ANALYZING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export type MarketIndex = 'NIFTY' | 'BANKNIFTY';
export type TradingStrategy = 'INTRADAY' | 'SCALPING';

export type MarketBias = 'BULLISH' | 'BEARISH' | 'NEUTRAL';
export type TradeType = 'LONG' | 'SHORT' | 'NO TRADE';
export type NewsSentiment = 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
export type MarketRegime = 'TRENDING' | 'RANGING' | 'VOLATILE';

export interface AnalysisResult {
  // Core Decision Card
  signal: TradeType;
  entry: string;
  sl: string;
  targets: string;
  confidence: number;
  reason: string;
  
  // Smart AI Insights
  marketRegime: MarketRegime;
  suggestedStrategy: string;
  
  // Context
  expiry: string;
  newsSentiment: NewsSentiment;
  newsSummary: string;
  sources?: NewsSource[];
  
  // Additional fields used by AnalysisDisplay component
  // These should be derived from the AI response or calculated
  marketBias?: MarketBias;
  tradeType?: TradeType;
  signalTitle?: string;
  entryZone?: string;
  stopLoss?: string;
  technicalLevels?: string[];
}

export interface NewsSource {
  title: string;
  uri: string;
}

export interface ChartData {
  imageUrl: string;
  base64: string;
  name: string;
}

// API Response types
export interface GeminiResponse {
  text: string;
  candidates?: any[];
  error?: string;
}

// Error types
export interface APIError {
  code: string;
  message: string;
  details?: any;
}
