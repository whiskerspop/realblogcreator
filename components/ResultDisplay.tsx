import React, { useState } from 'react';
import { GeneratedContent } from '../types';

interface ResultDisplayProps {
  content: GeneratedContent;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ content }) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'html' | 'pinterest' | 'images'>('preview');
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadImage = (dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const tabs = [
    { id: 'preview', label: 'Preview', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg> },
    { id: 'html', label: 'Blog HTML', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg> },
    { id: 'pinterest', label: 'Pins & Text', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
    { id: 'images', label: 'AI Assets', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>, count: content.images.length },
  ];

  return (
    <div className="bg-white rounded-[40px] shadow-2xl shadow-rose-200/30 border border-rose-100/50 overflow-hidden flex flex-col h-full animate-in zoom-in-95 duration-500">
      {/* Tabs Header */}
      <div className="px-8 pt-8 flex border-b border-rose-50 overflow-x-auto no-scrollbar gap-2 bg-gradient-to-b from-slate-50/50 to-white">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2.5 px-6 py-4 text-sm font-bold tracking-tight rounded-t-2xl transition-all duration-300 relative ${activeTab === tab.id
                ? 'bg-rose-50 text-rose-600 shadow-[0_-4px_10px_-4px_rgba(244,63,94,0.1)]'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50/50'
              }`}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {tab.count}
              </span>
            )}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-500"></div>
            )}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 p-0 relative overflow-hidden bg-white">
        {/* Copy Button (only for text tabs) */}
        {(activeTab === 'html' || activeTab === 'pinterest') && (
          <button
            onClick={() => handleCopy(activeTab === 'pinterest' ? content.pinterestPack : content.blogHtml)}
            className="absolute top-6 right-6 z-10 p-3 bg-slate-900/90 backdrop-blur text-white rounded-2xl shadow-xl hover:bg-slate-900 hover:scale-110 active:scale-95 transition-all duration-300 border border-white/10"
          >
            {copied ? (
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            ) : (
              <svg className="w-5 h-5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
            )}
          </button>
        )}

        <div className="h-[650px] overflow-y-auto custom-scrollbar">
          {activeTab === 'html' && (
            <div className="p-10 animate-in fade-in slide-in-from-bottom-2 duration-500 h-full">
              <textarea
                readOnly
                className="w-full h-full font-mono text-sm text-slate-600 bg-slate-50/50 border border-rose-100 rounded-[32px] p-8 focus:outline-none focus:border-rose-300 resize-none shadow-inner"
                value={content.blogHtml}
              />
            </div>
          )}

          {activeTab === 'preview' && (
            <div className="p-10 bg-white min-h-full animate-in fade-in duration-500">
              <div className="max-w-3xl mx-auto">
                <div
                  className="pwn-preview-content prose prose-rose max-w-none prose-headings:font-serif prose-headings:text-slate-900 prose-p:text-slate-700 prose-a:text-rose-500 prose-a:font-bold prose-img:rounded-[32px] prose-img:shadow-2xl prose-img:border prose-img:border-rose-100/30 prose-figcaption:text-center prose-figcaption:italic prose-figcaption:text-slate-400"
                  dangerouslySetInnerHTML={{ __html: content.blogHtml }}
                />
              </div>
            </div>
          )}

          {activeTab === 'pinterest' && (
            <div className="p-10 animate-in fade-in slide-in-from-bottom-2 duration-500 h-full">
              <textarea
                readOnly
                className="w-full h-full font-mono text-sm text-slate-600 bg-slate-50/50 border border-rose-100 rounded-[32px] p-8 focus:outline-none focus:border-rose-300 resize-none whitespace-pre-wrap shadow-inner"
                value={content.pinterestPack}
              />
            </div>
          )}

          {activeTab === 'images' && (
            <div className="p-10 min-h-full animate-in fade-in duration-500">
              {content.images.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[400px] text-slate-400 gap-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                  <p className="font-serif italic text-lg text-slate-400">No assets generated yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pb-12">
                  {content.images.map((img, idx) => (
                    <div key={idx} className={`group flex flex-col gap-4 ${img.aspectRatio === '16:9' ? 'md:col-span-2' : ''}`}>
                      <div className="bg-white p-4 rounded-[40px] border border-rose-100/50 shadow-xl shadow-rose-900/5 group-hover:shadow-rose-900/10 group-hover:-translate-y-1 transition-all duration-500">
                        <div className={`relative overflow-hidden rounded-[32px] bg-slate-50 ${img.aspectRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-video'}`}>
                          <img src={img.dataUrl} alt={img.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        </div>
                        <div className="flex items-center justify-between mt-6 px-2 pb-2">
                          <div>
                            <h4 className="font-serif font-bold text-slate-900 text-lg italic">{img.label}</h4>
                            <span className="text-[10px] text-rose-500 font-bold uppercase tracking-widest">{img.aspectRatio} Edition</span>
                          </div>
                          <button
                            onClick={() => downloadImage(img.dataUrl, `pwn-asset-${idx}.png`)}
                            className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all duration-300 shadow-sm active:scale-95"
                            title="Download Asset"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultDisplay;