import React, { useState } from 'react';
import { ImageUpload } from './components/ImageUpload';
import { Button } from './components/Button';
import { generateRefinedCharacter } from './services/geminiService';
import { AppState, ProcessingStatus } from './types';
import { removeWhiteBackground } from './utils/imageProcessor';

// Updated prompt to avoid checkerboard patterns
const DEFAULT_PROMPT = "Refine this character image. \n1. Complete the upper body and arms if they are cut off (outpainting) so the character is whole. \n2. Scale down the character slightly to add padding around the edges. \n3. Remove any watermarks. \n4. IMPORTANT: Isolate the character on a SOLID WHITE background. Do NOT draw a checkerboard transparency grid.";

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    originalImage: null,
    originalImagePreview: null,
    generatedImage: null,
    status: ProcessingStatus.IDLE,
    prompt: DEFAULT_PROMPT,
    errorMessage: null
  });
  
  const [autoRemoveBackground, setAutoRemoveBackground] = useState(true);

  const handleImageSelect = (file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setState(prev => ({
      ...prev,
      originalImage: file,
      originalImagePreview: previewUrl,
      generatedImage: null, // Reset previous generation
      status: ProcessingStatus.IDLE,
      errorMessage: null
    }));
  };

  const handleGenerate = async () => {
    if (!state.originalImage) return;

    setState(prev => ({ ...prev, status: ProcessingStatus.PROCESSING, errorMessage: null }));

    try {
      // 1. Generate image from Gemini
      const result = await generateRefinedCharacter(state.originalImage, state.prompt);
      
      // 2. Post-process to remove background if enabled
      let finalUrl = result.url;
      if (autoRemoveBackground) {
        try {
           finalUrl = await removeWhiteBackground(result.url);
        } catch (bgError) {
          console.warn("Failed to remove background automatically:", bgError);
          // Continue with original result if processing fails
        }
      }

      setState(prev => ({
        ...prev,
        status: ProcessingStatus.SUCCESS,
        generatedImage: {
          url: finalUrl,
          mimeType: 'image/png' // Canvas export is always PNG
        }
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        status: ProcessingStatus.ERROR,
        errorMessage: error.message || "Something went wrong while generating the image."
      }));
    }
  };

  const handleDownload = () => {
    if (state.generatedImage) {
      const link = document.createElement('a');
      link.href = state.generatedImage.url;
      link.download = `refined-character-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
                <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813a3.75 3.75 0 002.576-2.576l.813-2.846A.75.75 0 019 4.5zM6.97 11.03a.75.75 0 111.06-1.06l1.097 1.096a.75.75 0 11-1.06 1.062L6.97 11.03zm10.5-3.5a.75.75 0 11-1.06-1.06l1.06-1.06a.75.75 0 111.06 1.06l-1.06 1.06zM5 19.5a.75.75 0 11-1.06-1.06l1.06-1.06a.75.75 0 111.06 1.06l-1.06 1.06z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="font-bold text-xl tracking-tight">CharFix AI</h1>
          </div>
          <div className="text-sm text-slate-400">
            Powered by Gemini 2.5
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 gap-8 flex flex-col lg:flex-row">
        
        {/* Left Column: Input */}
        <div className="flex-1 flex flex-col gap-6 min-w-0">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-slate-200">1. Upload Character Image</h2>
            <p className="text-sm text-slate-400">Upload an image containing a character you want to fix.</p>
          </div>
          
          <div className="h-96 lg:h-[500px]">
            <ImageUpload 
              onImageSelect={handleImageSelect} 
              currentImage={state.originalImagePreview} 
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-200">2. Refinement Instructions</h2>
              <button 
                onClick={() => setState(prev => ({ ...prev, prompt: DEFAULT_PROMPT }))}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                Reset Default
              </button>
            </div>
            <textarea
              className="w-full h-32 bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
              value={state.prompt}
              onChange={(e) => setState(prev => ({ ...prev, prompt: e.target.value }))}
              placeholder="Describe how you want to fix the character..."
            />
            
            <div className="flex items-center gap-2 py-2">
              <input 
                type="checkbox" 
                id="autoRemoveBg"
                checked={autoRemoveBackground}
                onChange={(e) => setAutoRemoveBackground(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="autoRemoveBg" className="text-sm text-slate-300 cursor-pointer select-none">
                Auto-remove white background (Fixes "fake" transparency)
              </label>
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={handleGenerate} 
                disabled={!state.originalImage}
                isLoading={state.status === ProcessingStatus.PROCESSING}
                className="w-full lg:w-auto px-8 py-3 text-lg"
              >
                Generate Refined Character
              </Button>
            </div>
            {state.errorMessage && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                Error: {state.errorMessage}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Output */}
        <div className="flex-1 flex flex-col gap-6 min-w-0">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-slate-200">3. Result</h2>
            <p className="text-sm text-slate-400">The AI will attempt to fix arms, scale, and remove background.</p>
          </div>

          <div className="h-96 lg:h-[500px] bg-slate-800/50 rounded-xl border border-slate-700 flex items-center justify-center relative overflow-hidden">
            {/* Custom Checkerboard background via CSS for true transparency visualization */}
             <div className="absolute inset-0 z-0" style={{
                backgroundImage: `
                  linear-gradient(45deg, #1e293b 25%, transparent 25%), 
                  linear-gradient(-45deg, #1e293b 25%, transparent 25%), 
                  linear-gradient(45deg, transparent 75%, #1e293b 75%), 
                  linear-gradient(-45deg, transparent 75%, #1e293b 75%)
                `,
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                backgroundColor: '#0f172a' 
            }} />

            {state.status === ProcessingStatus.PROCESSING && (
              <div className="flex flex-col items-center gap-4 z-10 animate-pulse">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-blue-400 font-medium">Refining & processing transparency...</p>
              </div>
            )}

            {state.status === ProcessingStatus.IDLE && !state.generatedImage && (
              <div className="text-slate-500 text-center p-8 z-10">
                <p className="mb-2 text-4xl opacity-30">✨</p>
                <p>Generated image will appear here</p>
              </div>
            )}

            {state.generatedImage && (
              <img 
                src={state.generatedImage.url} 
                alt="Generated Result" 
                className="max-w-full max-h-full object-contain relative z-10 shadow-2xl drop-shadow-lg"
              />
            )}
          </div>

          <div className="flex justify-end gap-3">
             {state.generatedImage && (
                <Button variant="secondary" onClick={handleDownload}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  Download PNG
                </Button>
             )}
          </div>
        </div>

      </main>

      <footer className="border-t border-slate-800 p-6 text-center text-slate-500 text-sm">
        <p>&copy; {new Date().getFullYear()} CharFix AI. Uses Google Gemini 2.5 Flash Image.</p>
      </footer>
    </div>
  );
};

export default App;