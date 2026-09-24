export interface MediaInfo {
  path: string;
  filename: string;
  extension: string;
  size: number;
  duration_seconds: number;
  formatted_duration: string;
  formatted_size: string;
  has_audio: boolean;
  has_video: boolean;
  /** Imagem estática embutida (capa do álbum) */
  has_cover?: boolean;
  cover_width?: number;
  cover_height?: number;
  audio_codec?: string;
  video_codec?: string;
  width?: number;
  height?: number;
  is_valid: boolean;
}

export type ConversionStatus = 'idle' | 'converting' | 'completed' | 'error' | 'cancelled';

export interface QueueItem {
  id: string;
  mediaInfo: MediaInfo;
  targetFormat: string;
  quality: string;
  extractAudio: boolean;
  status: ConversionStatus;
  progress: number; // 0 to 100
  currentTimeSeconds: number;
  outputPath?: string;
  errorMessage?: string;
}

export interface FolderInfo {
  name: string;
  path: string;
  count: number;
}

export interface FolderScanResult {
  folder_name: string;
  folder_path: string;
  total_files_found: number;
  media_files: MediaInfo[];
}

export interface GlobalSettings {
  targetFormat: string;
  quality: string;
  extractAudio: boolean;
  outputFolderMode: 'same_as_input' | 'custom';
  customOutputFolder: string;
}
