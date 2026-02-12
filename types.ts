export interface GeneratedImage {
  url: string;
  mimeType: string;
}

export enum ProcessingStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface AppState {
  originalImage: File | null;
  originalImagePreview: string | null;
  generatedImage: GeneratedImage | null;
  status: ProcessingStatus;
  prompt: string;
  errorMessage: string | null;
}
