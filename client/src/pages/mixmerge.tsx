import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Upload, Play, Download, Trash2, Music, CheckCircle, XCircle, Clock, Plus } from "lucide-react";
import { formatFileSize, formatDuration } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { Waveform } from "@/components/waveform";

interface AudioFile {
  id: number;
  filename: string;
  originalName: string;
  size: number;
  duration: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: string;
  url?: string;
}

interface MergeJob {
  id: number;
  name: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  outputFile?: string;
  removeSilence: boolean;
  outputFormat: 'mp3' | 'wav';
  createdBy: string;
  createdAt: string;
  completedAt?: string;
}

export default function MixMerge() {
  const [selectedFiles, setSelectedFiles] = useState<number[]>([]);
  const [removeSilence, setRemoveSilence] = useState(false);
  const [outputFormat, setOutputFormat] = useState<'mp3' | 'wav'>('mp3');
  const [jobName, setJobName] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch audio files
  const { data: audioFiles = [], isLoading: filesLoading } = useQuery({
    queryKey: ["/api/mixmerge/files"],
  });

  // Fetch merge jobs
  const { data: mergeJobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ["/api/mixmerge/jobs"],
    refetchInterval: 2000, // Poll every 2 seconds for job updates
  });

  // Upload mutation with progress tracking
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      setIsUploading(true);
      setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

      return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append('audio', file);
        
        const xhr = new XMLHttpRequest();

        // Track upload progress
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100;
            setUploadProgress(prev => ({ ...prev, [file.name]: percentComplete }));
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
            setTimeout(() => {
              setUploadProgress(prev => {
                const newProgress = { ...prev };
                delete newProgress[file.name];
                return newProgress;
              });
              if (Object.keys(uploadProgress).length <= 1) {
                setIsUploading(false);
              }
            }, 1000);
            resolve(JSON.parse(xhr.responseText));
          } else {
            setUploadProgress(prev => {
              const newProgress = { ...prev };
              delete newProgress[file.name];
              return newProgress;
            });
            reject(new Error('Upload failed'));
          }
        });

        xhr.addEventListener('error', () => {
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[file.name];
            return newProgress;
          });
          reject(new Error('Upload failed'));
        });

        xhr.open('POST', '/api/mixmerge/upload');
        xhr.send(formData);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mixmerge/files"] });
      toast({
        title: "Upload successful",
        description: "Your audio file has been uploaded successfully.",
      });
    },
    onError: () => {
      setIsUploading(false);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your file.",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/mixmerge/files/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mixmerge/files"] });
      toast({
        title: "File deleted",
        description: "Audio file has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Delete failed",
        description: "There was an error deleting the file.",
        variant: "destructive",
      });
    },
  });

  // Job delete mutation
  const deleteJobMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/mixmerge/jobs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mixmerge/jobs"] });
      toast({
        title: "Job deleted",
        description: "Merge job has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Delete failed",
        description: "There was an error deleting the job.",
        variant: "destructive",
      });
    },
  });

  // Merge mutation
  const mergeMutation = useMutation({
    mutationFn: async ({ fileIds, removeSilence, outputFormat, name }: { fileIds: number[], removeSilence: boolean, outputFormat: 'mp3' | 'wav', name: string }) => {
      return await apiRequest('POST', '/api/mixmerge/merge', { fileIds, removeSilence, outputFormat, name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mixmerge/jobs"] });
      setSelectedFiles([]);
      toast({
        title: "Merge started",
        description: "Your audio files are being merged. Check the jobs section for progress.",
      });
    },
    onError: () => {
      toast({
        title: "Merge failed",
        description: "There was an error starting the merge process.",
        variant: "destructive",
      });
    },
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFiles = (files: FileList) => {
    Array.from(files).forEach(file => {
      if (file.type.startsWith('audio/')) {
        uploadMutation.mutate(file);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload audio files only.",
          variant: "destructive",
        });
      }
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const toggleFileSelection = (fileId: number) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleMerge = () => {
    if (selectedFiles.length < 2) {
      toast({
        title: "Select files",
        description: "Please select at least 2 files to merge.",
        variant: "destructive",
      });
      return;
    }
    
    mergeMutation.mutate({ fileIds: selectedFiles, removeSilence, outputFormat, name: jobName || "Untitled Merge" });
  };

  // Calculate total duration of selected files
  const getTotalDuration = () => {
    return selectedFiles.reduce((total, fileId) => {
      const file = audioFiles.find((f: AudioFile) => f.id === fileId);
      return total + (file?.duration || 0);
    }, 0);
  };

  // Calculate total size of selected files
  const getTotalSize = () => {
    return selectedFiles.reduce((total, fileId) => {
      const file = audioFiles.find((f: AudioFile) => f.id === fileId);
      return total + (file?.size || 0);
    }, 0);
  };

  const handleSelectAll = () => {
    if (selectedFiles.length === audioFiles.length) {
      // If all are selected, clear selection
      setSelectedFiles([]);
    } else {
      // Select all files
      setSelectedFiles(audioFiles.map((file: AudioFile) => file.id));
    }
  };

  const getStatusIcon = (status: MergeJob['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: MergeJob['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (filesLoading || jobsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Music className="w-8 h-8 mx-auto mb-4 text-gray-400 animate-pulse" />
          <p className="text-gray-500">Loading MixMerge...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">MixMerge</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Upload and merge multiple audio files with optional silence removal
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {selectedFiles.length > 0 && (
            <div className="text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg">
              <div className="font-medium">Selected: {selectedFiles.length} files</div>
              <div className="flex items-center space-x-4 text-xs">
                <span>Duration: {formatDuration(getTotalDuration())}</span>
                <span>Size: {formatFileSize(getTotalSize())}</span>
              </div>
            </div>
          )}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Label htmlFor="job-name">Job Name:</Label>
              <input
                id="job-name"
                type="text"
                value={jobName}
                onChange={(e) => setJobName(e.target.value)}
                placeholder="Enter job name (optional)"
                className="flex-1 px-3 py-2 border rounded-md text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
              />
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="remove-silence"
                  checked={removeSilence}
                  onCheckedChange={setRemoveSilence}
                />
                <Label htmlFor="remove-silence">Remove silence over 5s</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="output-format">Format:</Label>
                <select
                  id="output-format"
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value as 'mp3' | 'wav')}
                  className="px-3 py-1 border rounded-md text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                >
                  <option value="mp3">MP3</option>
                  <option value="wav">WAV</option>
                </select>
              </div>
            </div>
          </div>
          <Button
            onClick={handleMerge}
            disabled={selectedFiles.length < 2 || mergeMutation.isPending}
            className="flex items-center space-x-2"
          >
            <Music className="w-4 h-4" />
            <span>Merge Selected ({selectedFiles.length})</span>
          </Button>
        </div>
      </div>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="w-5 h-5" />
            <span>Upload Audio Files</span>
          </CardTitle>
          <CardDescription>
            Drag and drop audio files or click to browse. Supported formats: MP3, WAV, M4A, etc.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-blue-400 bg-blue-50 dark:bg-blue-950'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Plus className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-2">
              Drop your audio files here
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              or click to browse your computer
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="audio/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
          
          {/* Upload Progress */}
          {Object.keys(uploadProgress).length > 0 && (
            <div className="mt-6 space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="text-sm font-medium">Upload Progress</h4>
              {Object.entries(uploadProgress).map(([filename, progress]) => (
                <div key={filename}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="truncate max-w-[300px]" title={filename}>
                      {filename}
                    </span>
                    <span className="text-gray-500">
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audio Files */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Audio Files ({audioFiles.length})</CardTitle>
              <CardDescription>
                Select files to merge them together into a single audio file
                {selectedFiles.length > 0 && (
                  <span className="block mt-2 font-medium text-blue-600 dark:text-blue-400">
                    {selectedFiles.length} files selected • Total duration: {formatDuration(getTotalDuration())} • Total size: {formatFileSize(getTotalSize())}
                  </span>
                )}
              </CardDescription>
            </div>
            {audioFiles.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="text-xs"
              >
                {selectedFiles.length === audioFiles.length ? "Clear All" : "Select All"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {audioFiles.length === 0 ? (
            <div className="text-center py-8">
              <Music className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">No audio files uploaded yet</p>
              <p className="text-sm text-gray-400 mt-2">Upload some files to get started</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {audioFiles.map((file: AudioFile) => (
                <div
                  key={file.id}
                  className={`p-4 border rounded-lg transition-colors ${
                    selectedFiles.includes(file.id)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  {/* File Header */}
                  <div className="flex items-center mb-4">
                    <Checkbox
                      checked={selectedFiles.includes(file.id)}
                      onCheckedChange={() => toggleFileSelection(file.id)}
                      className="mr-4"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {file.originalName}
                      </h3>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                        <span>{formatFileSize(file.size)}</span>
                        <span>{formatDuration(file.duration)}</span>
                        <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(file.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Waveform */}
                  <Waveform
                    audioUrl={`/uploads/${file.filename}`}
                    height={80}
                    waveColor="#6b7280"
                    progressColor="#3b82f6"
                    backgroundColor="#f9fafb"
                    className="mb-2"
                    showControls={true}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Merge Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Merge Jobs</CardTitle>
          <CardDescription>
            Track the progress of your audio merging jobs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mergeJobs.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">No merge jobs yet</p>
              <p className="text-sm text-gray-400 mt-2">Start merging files to see jobs here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {mergeJobs.map((job: MergeJob) => (
                <div
                  key={job.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(job.status)}
                      <div>
                        <h3 className="font-medium">
                          {job.name || `Merge Job #${job.id}`}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {new Date(job.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(job.status)}>
                        {job.status}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteJobMutation.mutate(job.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {job.status === 'processing' && (
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>{job.progress}%</span>
                      </div>
                      <Progress value={job.progress} className="h-2" />
                    </div>
                  )}

                  {/* Waveform for completed jobs */}
                  {job.status === 'completed' && job.outputFile && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Merged Audio Preview
                      </h4>
                      <Waveform
                        audioUrl={`/uploads/${job.outputFile}`}
                        height={80}
                        waveColor="#10b981"
                        progressColor="#059669"
                        backgroundColor="#f0fdf4"
                        showControls={true}
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      {job.removeSilence && (
                        <span className="flex items-center">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Silence removal enabled
                        </span>
                      )}
                      <span className="flex items-center">
                        Format: {job.outputFormat.toUpperCase()}
                      </span>
                    </div>
                    {job.status === 'completed' && job.outputFile && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          window.open(`/uploads/${job.outputFile}`, '_blank');
                        }}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}