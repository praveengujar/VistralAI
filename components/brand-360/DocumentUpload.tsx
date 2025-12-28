'use client';

import { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';

interface DocumentUploadProps {
  brandId: string;
  onComplete?: () => void;
}

interface UploadedFile {
  file: any;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
  documentId?: string;
}

export default function DocumentUpload({ brandId, onComplete }: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const acceptedTypes = ['.pdf', '.docx', '.txt', '.csv'];
  const maxFileSize = 10 * 1024 * 1024; // 10MB

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    handleFiles(files);
  }, []);

  const handleFiles = async (files: any[]) => {
    const validFiles: UploadedFile[] = [];

    for (const file of files) {
      // Validate file type
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!acceptedTypes.includes(extension)) {
        alert(`File ${file.name} has an unsupported type. Accepted types: ${acceptedTypes.join(', ')}`);
        continue;
      }

      // Validate file size
      if (file.size > maxFileSize) {
        alert(`File ${file.name} is too large. Maximum size: 10MB`);
        continue;
      }

      validFiles.push({
        file,
        status: 'uploading',
        progress: 0,
      });
    }

    if (validFiles.length === 0) return;

    setUploadedFiles((prev) => [...prev, ...validFiles]);

    // Upload files one by one
    for (let i = 0; i < validFiles.length; i++) {
      await uploadFile(validFiles[i], uploadedFiles.length + i);
    }
  };

  const uploadFile = async (uploadedFile: UploadedFile, index: number) => {
    const { file } = uploadedFile;

    try {
      // Simulate progress
      for (let progress = 0; progress <= 90; progress += 10) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        updateFileStatus(index, { progress });
      }

      // Read file content (for MVP, we'll just send metadata)
      // In production, upload to S3/GCS first
      const fileType = file.name.split('.').pop()?.toLowerCase() as 'pdf' | 'docx' | 'txt' | 'csv';

      // Upload to API
      const response = await fetch('/api/brand-360/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brandId,
          fileName: file.name,
          fileType,
          fileSize: file.size,
        }),
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();

      updateFileStatus(index, {
        status: 'processing',
        progress: 100,
        documentId: data.data.id,
      });

      // Poll for processing status
      pollProcessingStatus(data.data.id, index);
    } catch (error: any) {
      updateFileStatus(index, {
        status: 'failed',
        error: error.message || 'Upload failed',
      });
    }
  };

  const pollProcessingStatus = async (documentId: string, index: number) => {
    const maxAttempts = 20; // 20 seconds max
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`/api/brand-360/upload?documentId=${documentId}`);
        const data = await response.json();

        const document = data.data.find((doc: any) => doc.id === documentId);

        if (document) {
          if (document.status === 'completed') {
            updateFileStatus(index, { status: 'completed' });
            if (onComplete) {
              setTimeout(onComplete, 1000); // Give user time to see completion
            }
            return;
          } else if (document.status === 'failed') {
            updateFileStatus(index, {
              status: 'failed',
              error: document.processingError || 'Processing failed',
            });
            return;
          }
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 1000);
        } else {
          updateFileStatus(index, {
            status: 'failed',
            error: 'Processing timeout',
          });
        }
      } catch (error) {
        updateFileStatus(index, {
          status: 'failed',
          error: 'Failed to check status',
        });
      }
    };

    poll();
  };

  const updateFileStatus = (index: number, updates: Partial<UploadedFile>) => {
    setUploadedFiles((prev) =>
      prev.map((file, i) => (i === index ? { ...file, ...updates } : file))
    );
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-primary-500 bg-primary-50'
            : 'border-border-secondary hover:border-border'
        }`}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileInput}
        />

        <div className="flex flex-col items-center">
          <Upload className={`h-12 w-12 mb-4 ${isDragging ? 'text-primary-600' : 'text-foreground-muted'}`} />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Drop your documents here
          </h3>
          <p className="text-sm text-foreground-secondary mb-4">
            or{' '}
            <label
              htmlFor="file-upload"
              className="text-primary-600 hover:text-primary-700 cursor-pointer font-medium"
            >
              browse files
            </label>
          </p>
          <p className="text-xs text-foreground-muted">
            Supported formats: PDF, DOCX, TXT, CSV • Max file size: 10MB
          </p>
        </div>
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">Uploaded Files</h4>
          {uploadedFiles.map((uploadedFile, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-background-secondary rounded-lg border border-border"
            >
              <div className="flex items-center space-x-3 flex-1">
                <FileText className="h-5 w-5 text-foreground-muted" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {uploadedFile.file.name}
                  </p>
                  <p className="text-xs text-foreground-muted">
                    {(uploadedFile.file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {uploadedFile.status === 'uploading' && (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-5 w-5 text-primary-600 animate-spin" />
                    <span className="text-sm text-foreground-secondary">{uploadedFile.progress}%</span>
                  </div>
                )}
                {uploadedFile.status === 'processing' && (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                    <span className="text-sm text-blue-600">Processing...</span>
                  </div>
                )}
                {uploadedFile.status === 'completed' && (
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="text-sm text-green-600">Complete</span>
                  </div>
                )}
                {uploadedFile.status === 'failed' && (
                  <div className="flex items-center space-x-2">
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span className="text-sm text-red-600">Failed</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
        <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">How it works:</p>
          <ul className="list-disc list-inside space-y-1 text-blue-700">
            <li>Upload brand guidelines, product catalogs, or marketing documents</li>
            <li>Our AI extracts key information automatically</li>
            <li>Review and edit the extracted data before saving</li>
            <li>Your profile strength will update in real-time</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
