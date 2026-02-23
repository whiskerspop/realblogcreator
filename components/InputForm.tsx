import React, { useState, ChangeEvent, useRef } from 'react';
import { ContentType, ProductDetails } from '../types';

interface InputFormProps {
  onSubmit: (details: ProductDetails) => void;
  isLoading: boolean;
}

const InputForm: React.FC<InputFormProps> = ({ onSubmit, isLoading }) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [contentType, setContentType] = useState<ContentType>(ContentType.Review);

  // Image handling
  const [imageMode, setImageMode] = useState<'upload' | 'url'>('upload');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlBlur = () => {
    if (imageUrlInput && imageMode === 'url') {
      setImagePreview(imageUrlInput);
      setImageFile(null);
    }
  };

  const handleImageError = () => {
    if (imageMode === 'url' && imagePreview) {
      // If image fails to load, clear preview or show error state (optional)
      // For now, we leave it as is, standard img tag alt text will show
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // If mode is upload, we use imageFile/imageBase64
    // If mode is url, we use imageUrlInput (and no file)

    onSubmit({
      title,
      url,
      contentType,
      imageFile: imageMode === 'upload' ? imageFile : null,
      imageBase64: imageMode === 'upload' ? imagePreview : null,
      imageUrl: imageMode === 'url' ? imageUrlInput : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-10 rounded-[40px] shadow-2xl shadow-rose-200/20 border border-rose-100/50 space-y-8 animate-in slide-in-from-left-4 duration-500">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-serif text-slate-900 italic font-bold">Content Studio</h2>
        <p className="text-rose-400 text-[10px] font-bold tracking-[0.2em] uppercase mt-2 opacity-70">Define Product Excellence</p>
      </div>

      {/* Product Image Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label className="block text-[10px] font-bold text-slate-400 tracking-widest uppercase">Visual Asset</label>
          <div className="flex text-[10px] font-bold bg-slate-50 border border-slate-100 rounded-full p-1">
            <button
              type="button"
              onClick={() => setImageMode('upload')}
              className={`px-4 py-1.5 rounded-full transition-all duration-300 ${imageMode === 'upload' ? 'bg-white text-slate-900 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
            >
              UPLOAD
            </button>
            <button
              type="button"
              onClick={() => setImageMode('url')}
              className={`px-4 py-1.5 rounded-full transition-all duration-300 ${imageMode === 'url' ? 'bg-white text-slate-900 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
            >
              URL
            </button>
          </div>
        </div>

        {imageMode === 'upload' ? (
          <div
            className="group relative border-2 border-dashed border-rose-100 rounded-[32px] p-2 flex flex-col items-center justify-center cursor-pointer hover:border-rose-300 hover:bg-rose-50/30 transition-all duration-500 min-h-[220px] overflow-hidden"
            onClick={() => fileInputRef.current?.click()}
          >
            {imagePreview ? (
              <div className="relative w-full h-[220px]">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-[28px]" />
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[28px]">
                  <span className="text-white text-xs font-bold tracking-widest">CHANGE PHOTO</span>
                </div>
              </div>
            ) : (
              <div className="text-center p-8">
                <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-xs font-bold text-slate-400 tracking-wider">SELECT AESTHETIC SHOT</span>
              </div>
            )}
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <input
                type="url"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                onBlur={handleUrlBlur}
                placeholder="Paste image URL here..."
                className="w-full pl-5 pr-12 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-rose-400 transition-all duration-300 outline-none text-sm placeholder:text-slate-300 font-medium"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.172 13.828a4 4 0 015.656 0l4-4a4 4 0 10-5.656-5.656l-1.102 1.101" /></svg>
              </div>
            </div>
            {imagePreview && (
              <div className="relative w-full h-[180px] rounded-[28px] bg-slate-50 overflow-hidden border border-slate-100 shadow-inner">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    const parent = (e.target as HTMLImageElement).parentElement;
                    if (parent) parent.innerHTML = '<div class="flex items-center justify-center h-full text-[10px] font-bold text-rose-300 p-8 text-center uppercase tracking-widest">Image Unavailable</div>';
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Inputs */}
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="block text-[10px] font-bold text-slate-400 tracking-widest uppercase px-1">Brand & Product Name</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Dior Vernis Glow"
            className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-rose-400 transition-all duration-300 outline-none font-medium text-slate-700"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-[10px] font-bold text-slate-400 tracking-widest uppercase px-1">Destination Link</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://amazon.com/..."
            className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-rose-400 transition-all duration-300 outline-none font-medium text-slate-700"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-[10px] font-bold text-slate-400 tracking-widest uppercase px-1">Editorial Style</label>
          <div className="flex gap-4 p-1 bg-slate-50 border border-slate-100 rounded-2xl">
            {[ContentType.Review, ContentType.Article].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setContentType(type)}
                className={`flex-1 py-3.5 rounded-xl font-bold text-[10px] tracking-widest uppercase transition-all duration-300 ${contentType === type
                    ? 'bg-white text-rose-500 shadow-sm border border-slate-100'
                    : 'text-slate-400 hover:text-slate-600'
                  }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading || !imagePreview}
        className={`group w-full py-5 rounded-[24px] font-bold text-xs tracking-[0.2em] uppercase transition-all duration-500 relative overflow-hidden ${isLoading || !imagePreview
            ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
            : 'bg-slate-900 text-white shadow-xl shadow-slate-900/10 hover:shadow-slate-900/20 hover:-translate-y-1 active:scale-95'
          }`}
      >
        <span className="relative z-10 flex items-center justify-center gap-3">
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              CURATING...
            </>
          ) : (
            'AUTHENTICATE & GENERATE'
          )}
        </span>
        {!isLoading && imagePreview && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-rose-400 via-rose-500 to-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        )}
      </button>
      <p className="text-[9px] text-slate-300 text-center font-bold tracking-[0.3em] uppercase opacity-50">Secure AI Link Active</p>
    </form>
  );
};

export default InputForm;