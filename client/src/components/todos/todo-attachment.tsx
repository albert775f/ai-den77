import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Image, Music, Upload, X, Download } from "lucide-react";

interface TodoAttachmentProps {
  attachmentUrl?: string;
  attachmentType?: string;
  attachmentName?: string;
  onAttachmentChange?: (file: File | null) => void;
  readOnly?: boolean;
}

export default function TodoAttachment({
  attachmentUrl,
  attachmentType,
  attachmentName,
  onAttachmentChange,
  readOnly = false
}: TodoAttachmentProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      onAttachmentChange?.(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    onAttachmentChange?.(null);
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "image":
        return <Image className="w-4 h-4" />;
      case "audio":
        return <Music className="w-4 h-4" />;
      case "text":
        return <FileText className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const isImage = (type: string) => type === "image";
  const isAudio = (type: string) => type === "audio";
  const isText = (type: string) => type === "text";

  if (readOnly && !attachmentUrl) {
    return null;
  }

  return (
    <div className="space-y-4">
      {!readOnly && (
        <div className="space-y-2">
          <Label htmlFor="attachment">Attachment</Label>
          <Input
            id="attachment"
            type="file"
            accept="image/*,audio/*,.txt,.md,.doc,.docx,.pdf"
            onChange={handleFileSelect}
          />
          <p className="text-sm text-gray-600">
            Upload an image, audio file, or document to show progress when completed.
          </p>
        </div>
      )}

      {/* Show current attachment */}
      {attachmentUrl && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getFileIcon(attachmentType || "")}
                <div>
                  <p className="font-medium">{attachmentName || "Attachment"}</p>
                  <p className="text-sm text-gray-600 capitalize">{attachmentType} file</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(attachmentUrl, "_blank")}
                >
                  <Download className="w-4 h-4 mr-1" />
                  View
                </Button>
                {!readOnly && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleRemoveFile}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Preview for images */}
            {isImage(attachmentType || "") && (
              <div className="mt-3">
                <img 
                  src={attachmentUrl} 
                  alt="Attachment preview"
                  className="max-w-full h-auto max-h-48 rounded-lg border"
                />
              </div>
            )}

            {/* Preview for audio */}
            {isAudio(attachmentType || "") && (
              <div className="mt-3">
                <audio controls className="w-full">
                  <source src={attachmentUrl} />
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}

            {/* Preview for text files */}
            {isText(attachmentType || "") && (
              <div className="mt-3">
                <iframe
                  src={attachmentUrl}
                  className="w-full h-32 border rounded-lg"
                  title="Text file preview"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Show selected file preview */}
      {selectedFile && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getFileIcon(selectedFile.type.startsWith("image/") ? "image" : 
                            selectedFile.type.startsWith("audio/") ? "audio" : "text")}
                <div>
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-gray-600">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRemoveFile}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}