import React, { useRef, useState } from 'react';

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  currentImage: string | null;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ onImageSelect, currentImage }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (file.type.startsWith('image/')) {
      onImageSelect(file);
    } else {
      alert("Please upload an image file.");
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div 
        className={`
          relative flex-1 min-h-[300px] border-2 border-dashed rounded-xl transition-colors duration-200 ease-in-out flex flex-col items-center justify-center overflow-hidden
          ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-slate-600 bg-slate-800/50 hover:border-slate-500'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={inputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleChange}
        />
        
        {currentImage ? (
          <img 
            src={currentImage} 
            alt="Upload preview" 
            className="w-full h-full object-contain p-4"
          />
        ) : (
          <div className="text-center p-6 pointer-events-none">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-700 rounded-full flex items-center justify-center text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <p className="text-lg font-medium text-slate-200">Click or drag image here</p>
            <p className="text-sm text-slate-400 mt-2">Supports JPG, PNG, WEBP</p>
          </div>
        )}
        
        {currentImage && (
           <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
             <p className="text-white font-medium bg-black/50 px-4 py-2 rounded-full">Click to Change</p>
           </div>
        )}
      </div>
    </div>
  );
};
