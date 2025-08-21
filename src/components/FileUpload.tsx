import React, { useRef, useState } from 'react';
import { useR2 } from '../hooks/useR2';

interface FileUploadProps {
  onUploadSuccess?: (fileName: string, url: string) => void;
  onUploadError?: (error: string) => void;
  acceptedTypes?: string;
  maxFileSize?: number; // in bytes
}

const FileUpload: React.FC<FileUploadProps> = ({
  onUploadSuccess,
  onUploadError,
  acceptedTypes = '.glb,.gltf,.obj,.fbx,.babylon,.png,.jpg,.jpeg,.gif,.mp4,.mov',
  maxFileSize = 100 * 1024 * 1024 // 100MB default
}) => {
  const { uploadFile, uploading } = useR2();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  // Validate file before upload
  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize) {
      return `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds limit (${(maxFileSize / 1024 / 1024).toFixed(1)}MB)`;
    }

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const allowedTypes = acceptedTypes.split(',').map(type => type.trim().toLowerCase());
    
    if (!allowedTypes.includes(fileExtension)) {
      return `File type ${fileExtension} is not supported. Allowed types: ${acceptedTypes}`;
    }

    return null;
  };

  // Handle file upload
  const handleUpload = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      alert(`❌ ${validationError}`);
      onUploadError?.(validationError);
      return;
    }

    setUploadProgress(`Uploading ${file.name}...`);

    try {
      const result = await uploadFile(file);
      
      if (result.success && result.fileName && result.url) {
        setUploadProgress(`✅ Upload successful: ${result.fileName}`);
        alert(`✅ File uploaded successfully!\nFile: ${result.fileName}\nSize: ${((result.size || 0) / 1024 / 1024).toFixed(2)}MB`);
        onUploadSuccess?.(result.fileName, result.url);
        
        // Reset input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadProgress(`❌ Upload failed: ${errorMessage}`);
      alert(`❌ Upload failed: ${errorMessage}`);
      onUploadError?.(errorMessage);
    }

    // Clear progress after 3 seconds
    setTimeout(() => setUploadProgress(''), 3000);
  };

  // File input change handler
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await handleUpload(file);
    }
  };

  // Drag and drop handlers
  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
    
    const file = event.dataTransfer.files[0];
    if (file) {
      await handleUpload(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
  };

  const formatFileSize = (bytes: number): string => {
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  };

  return (
    <div style={{ margin: '20px 0' }}>
      {/* Upload Area */}
      <div 
        className={`upload-area ${dragOver ? 'drag-over' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !uploading && fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? '#007bff' : '#ccc'}`,
          borderRadius: '12px',
          padding: '40px 20px',
          textAlign: 'center',
          cursor: uploading ? 'not-allowed' : 'pointer',
          backgroundColor: dragOver ? '#f8f9fa' : '#ffffff',
          transition: 'all 0.3s ease',
          opacity: uploading ? 0.7 : 1
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          accept={acceptedTypes}
          disabled={uploading}
        />
        
        {uploading ? (
          <div>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#007bff' }}>
              Uploading...
            </div>
            <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
              Please wait while your file is being uploaded
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>
              {dragOver ? '📁' : '☁️'}
            </div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>
              {dragOver ? 'Drop your file here' : 'Click to upload or drag and drop'}
            </div>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
              Supported formats: {acceptedTypes.replace(/\./g, '').toUpperCase()}
            </div>
            <div style={{ fontSize: '12px', color: '#999' }}>
              Maximum file size: {formatFileSize(maxFileSize)}
            </div>
          </div>
        )}
      </div>

      {/* Upload Progress */}
      {uploadProgress && (
        <div style={{
          marginTop: '15px',
          padding: '10px',
          backgroundColor: uploadProgress.includes('✅') ? '#d4edda' : 
                          uploadProgress.includes('❌') ? '#f8d7da' : '#d1ecf1',
          border: `1px solid ${uploadProgress.includes('✅') ? '#c3e6cb' : 
                               uploadProgress.includes('❌') ? '#f5c6cb' : '#bee5eb'}`,
          borderRadius: '8px',
          color: uploadProgress.includes('✅') ? '#155724' : 
                uploadProgress.includes('❌') ? '#721c24' : '#0c5460',
          fontSize: '14px',
          textAlign: 'center'
        }}>
          {uploadProgress}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
