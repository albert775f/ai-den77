import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { parseFile } from 'music-metadata';
import ffmpeg from 'fluent-ffmpeg';

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
export const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const timestamp = Date.now();
      const ext = path.extname(file.originalname);
      cb(null, `audio_${timestamp}_${Math.random().toString(36).substr(2, 9)}${ext}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
});

// Get audio file metadata
export async function getAudioMetadata(filePath: string) {
  try {
    const metadata = await parseFile(filePath);
    return {
      duration: metadata.format.duration || 0,
      bitrate: metadata.format.bitrate || 0,
      sampleRate: metadata.format.sampleRate || 0,
      codec: metadata.format.codec,
    };
  } catch (error) {
    console.error('Error reading audio metadata:', error);
    return {
      duration: 0,
      bitrate: 0,
      sampleRate: 0,
      codec: 'unknown',
    };
  }
}

// Merge audio files
export async function mergeAudioFiles(
  inputFiles: string[], 
  outputPath: string, 
  removeSilence: boolean = false,
  outputFormat: 'mp3' | 'wav' = 'mp3',
  onProgress?: (progress: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Validate input files exist
      for (const file of inputFiles) {
        if (!fs.existsSync(file)) {
          reject(new Error(`Input file does not exist: ${file}`));
          return;
        }
      }

      console.log('Starting audio merge with files:', inputFiles);
      console.log('Output path:', outputPath);
      console.log('Remove silence:', removeSilence);

      const command = ffmpeg();

      // Add all input files
      inputFiles.forEach(file => {
        command.input(file);
      });

      // For simplicity, let's start with basic concatenation
      if (removeSilence) {
        // Apply silence removal and concatenation
        const filterComplex = inputFiles.map((_, index) => 
          `[${index}:0]silenceremove=stop_periods=-1:stop_duration=5:stop_threshold=-50dB[clean${index}]`
        ).join(';') + 
        ';' + inputFiles.map((_, index) => `[clean${index}]`).join('') + 
        `concat=n=${inputFiles.length}:v=0:a=1[out]`;
        
        command.complexFilter(filterComplex);
        command.outputOptions(['-map', '[out]']);
      } else {
        // Simple concatenation without silence removal
        const filterComplex = inputFiles.map((_, index) => `[${index}:0]`).join('') + 
                             `concat=n=${inputFiles.length}:v=0:a=1[out]`;
        
        command.complexFilter(filterComplex);
        command.outputOptions(['-map', '[out]']);
      }

      if (outputFormat === 'wav') {
        command
          .audioCodec('pcm_s16le')
          .audioFrequency(44100)
          .audioChannels(2)
          .output(outputPath);
      } else {
        command
          .audioCodec('libmp3lame')
          .audioBitrate(192)
          .output(outputPath);
      }

      command
        .on('start', (commandLine) => {
          console.log('FFmpeg command:', commandLine);
        })
        .on('progress', (progress) => {
          console.log('Processing progress:', progress.percent);
          if (onProgress) {
            onProgress(progress.percent || 0);
          }
        })
        .on('end', () => {
          console.log('Audio merge completed successfully');
          resolve();
        })
        .on('error', (error, stdout, stderr) => {
          console.error('FFmpeg error:', error.message);
          console.error('FFmpeg stderr:', stderr);
          reject(new Error(`Audio merge failed: ${error.message}`));
        })
        .run();
    } catch (error) {
      console.error('Error setting up audio merge:', error);
      reject(error);
    }
  });
}

// Get file URL for serving
export function getFileUrl(filename: string): string {
  return `/uploads/${filename}`;
}

// Delete file from filesystem
export function deleteFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
}