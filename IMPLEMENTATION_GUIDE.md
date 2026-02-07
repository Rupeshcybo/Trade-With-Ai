# Production Implementation Guide

## Quick Start - Fix Critical Issues

### 1. Replace Broken Service File (CRITICAL - 5 minutes)

```bash
# Backup old file
mv services/geminiService.ts services/geminiService.ts.backup

# Use the improved version
cp services/geminiService-improved.ts services/geminiService.ts
```

### 2. Fix Type Definitions (CRITICAL - 2 minutes)

```bash
# Backup and replace
mv types.ts types.ts.backup
cp types-improved.ts types.ts
```

### 3. Update AnalysisDisplay Component (CRITICAL - 2 minutes)

```bash
# Backup and replace
mv components/AnalysisDisplay.tsx components/AnalysisDisplay.tsx.backup
cp components/AnalysisDisplay-improved.tsx components/AnalysisDisplay.tsx
```

### 4. Configure Environment (CRITICAL - 5 minutes)

```bash
# Copy example file
cp .env.example .env.local

# Edit .env.local and add your real Gemini API key
# Get key from: https://makersuite.google.com/app/apikey
nano .env.local
```

**Change this line:**
```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### 5. Test the Application (5 minutes)

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Test:
# 1. Upload a chart image
# 2. Select NIFTY/BANKNIFTY
# 3. Select strategy
# 4. Click "Get Signal"
# 5. Verify results display correctly
```

---

## Add Error Handling (RECOMMENDED - 15 minutes)

### 1. Add ErrorBoundary to App

**File: `index.tsx`**

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { initializeEnvironment } from './utils/env';
import './index.css';

// Validate environment before starting
const envValid = initializeEnvironment();

if (!envValid) {
  // Show error screen
  document.getElementById('root')!.innerHTML = `
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh; background: #0f172a; color: #ef4444; font-family: sans-serif; padding: 20px; text-align: center;">
      <div>
        <h1>Configuration Error</h1>
        <p>Please check your environment variables and try again.</p>
      </div>
    </div>
  `;
} else {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
}
```

### 2. Copy ErrorBoundary Component

```bash
cp components/ErrorBoundary.tsx components/
cp utils/env.ts utils/
```

---

## Add Image Compression (RECOMMENDED - 10 minutes)

### Update App.tsx to use compression

**File: `App.tsx` - Update `processFile` function:**

```typescript
import { processImageFile } from './utils/imageCompression';

// Replace the processFile function:
const processFile = async (file: File) => {
  try {
    setStatus(AnalysisStatus.UPLOADING);
    setErrorMsg(null);
    
    // Process and compress image
    const result = await processImageFile(file, {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 0.85,
      maxSizeMB: 5
    });
    
    setChartImage(result.base64);
    setResult(null);
    setStatus(AnalysisStatus.IDLE);
    
    console.log('Image processed:', {
      original: result.originalSize,
      compressed: result.compressedSize,
      dimensions: result.dimensions
    });
  } catch (err: any) {
    setErrorMsg(err.message || 'Failed to process image');
    setStatus(AnalysisStatus.ERROR);
  }
};
```

---

## Security Improvements (HIGH PRIORITY)

### Option A: Environment-based Development (Quick - 5 minutes)

Current setup is OK for development but **NEVER** deploy to production with client-side API key.

**For development:**
- Keep API key in `.env.local`
- Never commit `.env.local` to git
- Add `.env.local` to `.gitignore` ✓ (already done)

### Option B: Backend Proxy (Recommended for Production - 2 hours)

Create a serverless function to proxy API calls and hide the key.

**Using Vercel Serverless Functions:**

1. Create `api/analyze.ts`:

```typescript
import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageData, market, strategy } = req.body;
    
    // Your API key is now server-side only
    const genAI = new GoogleGenAI({ 
      apiKey: process.env.GEMINI_API_KEY 
    });
    
    // ... rest of analysis logic
    
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

2. Update frontend service to call your API:

```typescript
// services/geminiService.ts
export async function analyzeChartImage(imageDataUri, market, strategy) {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageData: imageDataUri, market, strategy })
  });
  
  if (!response.ok) throw new Error('Analysis failed');
  return response.json();
}
```

3. Move API key to Vercel environment variables

---

## Production Build Optimizations

### 1. Update `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'icons': ['lucide-react'],
          'ai': ['@google/genai'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: 3000,
  },
});
```

### 2. Update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 3. Build and Test:

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Test the production build thoroughly
```

---

## Add Monitoring (Recommended)

### Option 1: Sentry (Error Tracking)

```bash
npm install @sentry/react
```

**File: `index.tsx`**

```typescript
import * as Sentry from "@sentry/react";

if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      new Sentry.BrowserTracing(),
      new Sentry.Replay(),
    ],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}
```

### Option 2: Google Analytics 4

```bash
npm install react-ga4
```

**File: `index.tsx`**

```typescript
import ReactGA from "react-ga4";

if (import.meta.env.PROD && import.meta.env.VITE_GA_MEASUREMENT_ID) {
  ReactGA.initialize(import.meta.env.VITE_GA_MEASUREMENT_ID);
}
```

---

## Deployment Checklist

### Pre-Deployment:

- [ ] All critical files replaced
- [ ] Real API key configured (or backend proxy set up)
- [ ] Environment variables validated
- [ ] Production build tested locally
- [ ] Error boundaries added
- [ ] Image compression implemented
- [ ] Console.logs removed from production build
- [ ] Security headers configured
- [ ] HTTPS enabled
- [ ] Rate limiting added (if using backend)

### Deployment Options:

**Option 1: Vercel (Recommended - Easiest)**
```bash
npm install -g vercel
vercel --prod
```

**Option 2: Netlify**
```bash
npm install -g netlify-cli
netlify deploy --prod
```

**Option 3: Self-hosted**
```bash
npm run build
# Upload dist/ folder to your server
```

### Post-Deployment:

- [ ] Test all features in production
- [ ] Monitor error rates
- [ ] Check API usage/costs
- [ ] Set up alerts
- [ ] Monitor performance metrics
- [ ] Test on mobile devices
- [ ] Run Lighthouse audit

---

## Testing Recommendations

### Unit Tests (Future Enhancement)

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

### E2E Tests (Future Enhancement)

```bash
npm install -D @playwright/test
```

---

## Maintenance

### Regular Tasks:

**Weekly:**
- Monitor error logs
- Check API usage
- Review user feedback

**Monthly:**
- Update dependencies: `npm update`
- Security audit: `npm audit fix`
- Performance review

**Quarterly:**
- Major dependency updates
- Feature additions
- UX improvements

---

## Cost Monitoring

### Track These Metrics:

1. **Gemini API Usage**
   - Requests per day
   - Cost per request
   - Monthly total

2. **Hosting Costs**
   - Bandwidth usage
   - Function executions (if using serverless)
   - Storage

3. **Monitoring Tools**
   - Sentry events
   - Analytics hits

### Set Budget Alerts:

- Gemini API: Alert at 80% of free tier
- Hosting: Alert at $50/month
- Total: Alert at $100/month

---

## Support & Resources

### Documentation:
- Gemini AI: https://ai.google.dev/docs
- Vite: https://vitejs.dev/
- React: https://react.dev/
- Tailwind: https://tailwindcss.com/

### Community:
- Report issues: GitHub Issues
- Get help: Stack Overflow
- Discussions: Discord/Reddit

---

## Quick Reference Commands

```bash
# Development
npm install          # Install dependencies
npm run dev         # Start dev server
npm run build       # Build for production
npm run preview     # Preview production build

# Maintenance
npm update          # Update dependencies
npm audit fix       # Fix security issues
npm run lint        # Lint code (if configured)
npm test            # Run tests (if configured)

# Deployment
vercel --prod       # Deploy to Vercel
netlify deploy      # Deploy to Netlify
```

---

## Emergency Procedures

### If Site Goes Down:

1. Check error monitoring (Sentry)
2. Review API quotas (Gemini)
3. Check server status (Vercel/Netlify)
4. Review recent deployments
5. Rollback if needed

### If API Quota Exceeded:

1. Enable rate limiting
2. Add request caching
3. Upgrade API plan
4. Notify users of temporary limitation

### If Security Breach:

1. Rotate all API keys immediately
2. Review access logs
3. Block suspicious IPs
4. Notify users if needed
5. Audit code for vulnerabilities

---

**Remember:** Start with fixing the critical issues, then gradually add improvements. Don't try to implement everything at once!
