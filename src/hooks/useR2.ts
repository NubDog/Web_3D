import { useState, useCallback } from 'react';

// Worker URL của bạn
const API_BASE_URL = 'https://r2-api.sharkeatrice.workers.dev';

export interface R2File {
  key: string;
  size: number;
  uploaded: string;
  url: string;
}

export interface UploadResult {
  success: boolean;
  fileName?: string;
  url?: string;
  size?: number;
  type?: string;
  error?: string;
}

export interface DeleteResult {
  success: boolean;
  message?: string;
  error?: string;
}

export interface FilesListResult {
  success: boolean;
  files?: R2File[];
  error?: string;
}

export const useR2 = () => {
  const [files, setFiles] = useState<R2File[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Test connection to API
  const testConnection = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      const result = await response.json();
      console.log('🔗 API Connection test:', result);
      return result.success;
    } catch (error) {
      console.error('❌ API Connection failed:', error);
      return false;
    }
  }, []);

  // Upload file to R2
  const uploadFile = useCallback(async (file: File): Promise<UploadResult> => {
    console.log('📤 Starting upload:', file.name, `(${file.size} bytes)`);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      const result: UploadResult = await response.json();

      console.log('📤 Upload result:', result);

      if (result.success) {
        // Refresh file list after successful upload
        await fetchFiles();
      }

      return result;
    } catch (error) {
      console.error('❌ Upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    } finally {
      setUploading(false);
    }
  }, []);

  // Fetch all files from R2
  const fetchFiles = useCallback(async (): Promise<FilesListResult> => {
    console.log('📋 Fetching files...');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/files`);
      const result: FilesListResult = await response.json();

      console.log('📋 Files fetched:', result);

      if (result.success && result.files) {
        setFiles(result.files);
      }

      return result;
    } catch (error) {
      console.error('❌ Fetch files error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch files'
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete file from R2
  const deleteFile = useCallback(async (fileName: string): Promise<DeleteResult> => {
    console.log('🗑️ Deleting file:', fileName);
    setDeleting(fileName);

    try {
      const response = await fetch(`${API_BASE_URL}/delete/${encodeURIComponent(fileName)}`, {
        method: 'DELETE',
      });

      const result: DeleteResult = await response.json();

      console.log('🗑️ Delete result:', result);

      if (result.success) {
        // Refresh file list after successful delete
        await fetchFiles();
      }

      return result;
    } catch (error) {
      console.error('❌ Delete error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed'
      };
    } finally {
      setDeleting(null);
    }
  }, [fetchFiles]);

  // Get file URL for direct access
  const getFileUrl = useCallback((fileName: string): string => {
    const file = files.find(f => f.key === fileName);
    return file?.url || `${API_BASE_URL}/file/${encodeURIComponent(fileName)}`;
  }, [files]);

  return {
    // State
    files,
    loading,
    uploading,
    deleting,

    // Methods
    testConnection,
    uploadFile,
    fetchFiles,
    deleteFile,
    getFileUrl,
  };
};
