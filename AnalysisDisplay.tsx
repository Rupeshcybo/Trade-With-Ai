import React from 'react';
import { AnalysisResult } from '../types';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2, ArrowRight, Activity, ExternalLink } from './Icons';

interface AnalysisDisplayProps {
  result: AnalysisResult;
}

export const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ result }) => {
  // Derive or use the signal field as the primary source of truth
  const tradeType = result.signal;
  const isLong = tradeType === 'LONG';
  const isShort = tradeType === 'SHORT';
  const isNoTrade = tradeType === 'NO TRADE';
  
  // Derive market bias from signal and market regime
  const marketBias = isLong ? 'BULLISH' : isShort ? 'BEARISH' : 'NEUTRAL';
  const isBullish = marketBias === 'BULLISH';
  const isBearish = marketBias === 'BEARISH';

  // Generate signal title from signal type
  const signalTitle = isNoTrade 
    ? 'No Clear Setup' 
    : isLong 
    ? 'BUY CALL Options (CE)' 
    : 'BUY PUT Options (PE)';

  // Use entry and sl from result, with fallbacks
  const entryZone = result.entry || 'N/A';
  const stopLoss = result.sl || 'N/A';
  const targets = result.targets || 'N/A';

  // Parse technical levels from reason if available, or use empty array
  const technicalLevels = result.reason?.match(/\d{4,5}/g)?.slice(0, 5) || [];

  const getThemeColor = () => {
    if (isNoTrade) return 'text-slate-400 border-slate-600 bg-slate-800/50';
    if (isBullish) return 'text-emerald-400 border-emerald-500/50 bg-emerald-900/20';
    if (isBearish) return 'text-rose-400 border-rose-500/50 bg-rose-900/20';
    return 'text-slate-400';
  };

  const getBadgeColor = () => {
    if (isNoTrade) return 'bg-slate-700 text-slate-300';
    if (isBullish) return 'bg-emerald-500 text-black font-bold';
    if (isBearish) return 'bg-rose-500 text-white font-bold';
    return 'bg-slate-700';
  };

  return (
    <div className="w-full space-y-6 animate-fade-in-up">
      
      {/* 1. MAIN SIGNAL CARD */}
      <div className={`relative p-6 rounded-2xl border-2 ${getThemeColor()} shadow-2xl overflow-hidden`}>
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
          {isBullish ? <TrendingUp className="w-48 h-48" /> : isBearish ? <TrendingDown className="w-48 h-48" /> : <Minus className="w-48 h-48" />}
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-3 py-1 rounded-full text-xs uppercase tracking-wider ${getBadgeColor()}`}>
                {tradeType}
              </span>
              <span className="text-slate-400 text-sm font-medium tracking-wide">
                CONFIDENCE: {result.confidence}%
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-1">
              {signalTitle}
            </h2>
            <p className="text-slate-400 text-sm md:text-base">
              EXPIRY: <span className="text-slate-200">{result.expiry}</span>
            </p>
          </div>

          {!isNoTrade && (
            <div className="w-full md:w-auto grid grid-cols-3 gap-2 text-center bg-black/40 p-3 rounded-xl border border-white/10 backdrop-blur-sm">
              <div className="px-2 md:px-6">
                <div className="text-xs text-slate-500 uppercase font-bold mb-1">Entry</div>
                <div className="text-lg md:text-xl font-bold text-blue-400">{entryZone}</div>
              </div>
              <div className="px-2 md:px-6 border-l border-white/10">
                <div className="text-xs text-slate-500 uppercase font-bold mb-1">SL</div>
                <div className="text-lg md:text-xl font-bold text-rose-400">{stopLoss}</div>
              </div>
              <div className="px-2 md:px-6 border-l border-white/10">
                <div className="text-xs text-slate-500 uppercase font-bold mb-1">Target</div>
                <div className="text-lg md:text-xl font-bold text-emerald-400">{targets}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. LOGIC & LEVELS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* HINGLISH REASONING */}
        <div className="lg:col-span-8 bg-market-card border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" />
            Trade Logic (Hinglish)
          </h3>
          <div className="prose prose-invert max-w-none">
            <p className="text-slate-300 text-base leading-relaxed whitespace-pre-line border-l-4 border-blue-500 pl-4 bg-blue-500/5 py-2 rounded-r-lg">
              {result.reason}
            </p>
          </div>
          
          {technicalLevels.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-3">
              {technicalLevels.map((level, idx) => (
                <div key={idx} className="px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-lg text-xs font-mono text-slate-300">
                  {level}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* NEWS & SENTIMENT */}
        <div className="lg:col-span-4 space-y-6">
           <div className="bg-market-card border border-slate-700 rounded-xl p-6 h-full flex flex-col">
              <h3 className="text-lg font-bold text-white mb-4">Market Radar</h3>
              
              <div className="mb-4">
                 <div className="flex items-center justify-between text-sm mb-2 text-slate-400">
                    <span>Bias</span>
                    <span className={isBullish ? 'text-emerald-400' : isBearish ? 'text-rose-400' : 'text-slate-400'}>
                      {marketBias}
                    </span>
                 </div>
                 <div className="flex items-center justify-between text-sm mb-2 text-slate-400">
                    <span>Regime</span>
                    <span className="text-blue-400">{result.marketRegime}</span>
                 </div>
                 <div className="flex items-center justify-between text-sm mb-2 text-slate-400">
                    <span>News Sentiment</span>
                    <span className={
                      result.newsSentiment === 'POSITIVE' ? 'text-emerald-400' : 
                      result.newsSentiment === 'NEGATIVE' ? 'text-rose-400' : 
                      'text-slate-400'
                    }>
                      {result.newsSentiment}
                    </span>
                 </div>
                 <div className="w-full bg-slate-700 h-2 rounded-full mt-3 overflow-hidden">
                    <div 
                      className={`h-full ${isBullish ? 'bg-emerald-500' : isBearish ? 'bg-rose-500' : 'bg-slate-500'}`} 
                      style={{ width: `${result.confidence}%` }}
                    ></div>
                 </div>
              </div>

              <div className="text-sm text-slate-400 bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 flex-grow">
                 <p className="italic">"{result.newsSummary}"</p>
              </div>

              {result.sources && result.sources.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-700/50">
                  <p className="text-xs text-slate-500 mb-2">Sources:</p>
                  <ul className="space-y-1">
                    {result.sources.map((s, i) => (
                      <li key={i}>
                        <a 
                          href={s.uri} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-xs text-blue-400 hover:underline flex items-center gap-1 truncate"
                        >
                          <ExternalLink className="w-3 h-3 shrink-0" /> 
                          {s.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
           </div>
        </div>

      </div>

      {/* STRATEGY INSIGHT */}
      {result.suggestedStrategy && (
        <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/20 p-2 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase">Suggested Strategy</p>
              <p className="text-white font-semibold">{result.suggestedStrategy}</p>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER WARNING */}
      <div className="flex items-start gap-2 text-xs text-amber-500/80 bg-amber-900/10 border border-amber-900/20 p-4 rounded-xl text-center md:text-left justify-center md:justify-start">
        <AlertTriangle className="w-5 h-5 shrink-0" />
        <p>
          <strong>Risk Warning:</strong> NIFTY/BANKNIFTY options trading is high risk. 
          This AI analysis is for educational purposes only. Always use Stop Loss. 
          Avoid over-trading. Wait for candle confirmation before entry.
        </p>
      </div>

    </div>
  );
};
