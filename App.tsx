import React, { useState } from 'react';
import InputForm from './components/InputForm';
import ResultDisplay from './components/ResultDisplay';
import { generateContent } from './services/geminiService';
import { sendToWebhook } from './services/webhookService';
import { GeneratedContent, ProductDetails } from './types';

const App: React.FC = () => {
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [webhookStatus, setWebhookStatus] = useState<string | null>(null);

  const handleGenerate = async (details: ProductDetails) => {
    setIsLoading(true);
    setError(null);
    setContent(null);
    setWebhookStatus(null);

    try {
      const result = await generateContent(details);
      setContent(result);

      // Send to Webhook
      setWebhookStatus('Sending data to webhook...');
      sendToWebhook(details, result).then(() => {
        setWebhookStatus('Data sent to webhook successfully!');
        setTimeout(() => setWebhookStatus(null), 3000);
      }).catch(err => {
        console.error("Webhook error in App:", err);
        const detailedMessage = err.message || 'Check console';
        setWebhookStatus(`Failed: ${detailedMessage}`);
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-20 selection:bg-rose-200">
      {/* Header */}
      <header className="glass sticky top-0 z-50 border-b border-rose-100/50">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-rose-400 to-rose-600 rounded-2xl flex items-center justify-center text-white font-serif font-bold text-2xl shadow-lg transform -rotate-3 hover:rotate-0 transition-transform duration-300">
              P
            </div>
            <div>
              <h1 className="text-2xl font-serif font-bold text-slate-900 tracking-tight leading-none mb-1">PolishedWhimsyNails</h1>
              <p className="text-[10px] text-rose-500 font-bold tracking-[0.2em] uppercase opacity-80">Aesthetic Intelligence • 2026</p>
            </div>
          </div>
          <div className="hidden sm:flex flex-col items-end gap-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Powered by</span>
            <span className="text-xs font-serif italic text-slate-600">Gemini 3 Pro Vision</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* Left Column: Input */}
          <div className="lg:col-span-12 xl:col-span-4">
            <div className="lg:sticky lg:top-32">
              <InputForm onSubmit={handleGenerate} isLoading={isLoading} />
              {webhookStatus && (
                <div className={`mt-6 p-4 rounded-2xl text-xs font-semibold text-center shadow-sm border animate-in fade-in slide-in-from-top-2 duration-300 ${webhookStatus.includes('Failed')
                  ? 'bg-red-50 text-red-600 border-red-100'
                  : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                  }`}>
                  <div className="flex items-center justify-center gap-2">
                    {webhookStatus.includes('Sending') && (
                      <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    {webhookStatus}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Output */}
          <div className="lg:col-span-12 xl:col-span-8 min-h-[600px]">
            {error && (
              <div className="bg-white border border-red-100 text-red-900 px-8 py-6 rounded-3xl mb-8 shadow-xl shadow-red-500/5 flex items-start gap-4 animate-in zoom-in-95 duration-300">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-serif font-bold text-lg">System Alert</h4>
                  <p className="text-sm mt-1 opacity-70 leading-relaxed">{error}</p>
                </div>
              </div>
            )}

            {content ? (
              <ResultDisplay content={content} />
            ) : (
              !isLoading && (
                <div className="h-full flex flex-col items-center justify-center bg-white/40 border-2 border-dashed border-rose-200/50 rounded-[40px] p-20 text-center text-slate-400 group hover:border-rose-300/50 transition-colors duration-500">
                  <div className="w-24 h-24 bg-rose-100/50 rounded-full flex items-center justify-center mb-8 text-rose-300 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                  <h3 className="text-3xl font-serif text-slate-800 mb-4 italic">Awaiting Inspiration</h3>
                  <p className="max-w-md mx-auto text-slate-500 leading-relaxed">
                    Upload your aesthetic product photography. Our AI will craft premium SEO copy and high-converting Pinterest packs instantly.
                  </p>
                </div>
              )
            )}

            {isLoading && !content && (
              <div className="h-full flex flex-col items-center justify-center bg-white rounded-[40px] shadow-2xl shadow-rose-200/20 border border-rose-100/50 p-20 text-center">
                <div className="w-32 h-32 relative mb-8">
                  <div className="absolute inset-0 border-4 border-rose-100 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-rose-500 rounded-full border-t-transparent animate-spin"></div>
                  <div className="absolute inset-4 bg-rose-50 rounded-full animate-pulse flex items-center justify-center">
                    <span className="text-rose-500 font-serif font-bold text-2xl">PW</span>
                  </div>
                </div>
                <h3 className="text-3xl font-serif text-slate-800 mb-4 italic">Curating Your Content...</h3>
                <div className="flex flex-col gap-2">
                  <p className="text-slate-400 text-sm font-medium tracking-wide animate-pulse">Analyzing visual aesthetics & color palettes</p>
                  <p className="text-rose-400/60 text-xs italic">Crafting SEO blog review & Pinterest descriptions</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
