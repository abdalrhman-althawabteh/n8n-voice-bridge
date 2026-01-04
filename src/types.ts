export enum AppState {
  IDLE = 'IDLE',
  RECORDING = 'RECORDING',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface TranscriptionResponse {
  text?: string;
  output?: string;
  result?: string;
  [key: string]: any;
}

export interface Memory {
  id: string;
  text: string;
  timestamp: number;
}