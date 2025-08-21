import React, { useEffect, useState } from 'react';
import { useR2, R2File } from '../hooks/useR2';

interface FileManagerProps {
  onFileSelect?: (file: R2File) => void;
  showActions?: boolean;
  filterByType?: string[];
}

const FileManager: React.FC<FileManagerProps> = ({
  onFileSelect,
  showActions = true,
  filterByType
}) => {
  const { files, loading, deleting, fetchFiles, deleteFile, testConnection } = useR2();
  const [connectionStatus, setConnectionStatus] = useState<boolean | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Test connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      const isConnected = await testConnection();
      setConnectionStatus(isConnected);
      
      if (isConnected) {
        fetchFiles();
      }
    };
    
    checkConnection();
  }, [testConnection, fetchFiles]);

  // Filter and sort files
  const filteredAndSortedFiles = React.useMemo(() => {
    let filtered = files;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(file => 
        file.key.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by file type
    if (filterByType && filterByType.length > 0) {
      filtered = filtered.filter(file => {
        const extension = '.' + file.key.split('.').pop()?.toLowerCase();
        return filterByType.includes(extension);
      });
    }

    // Sort files
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.key.localeCompare(b.key);
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        case 'date':
          comparison = new Date(a.uploaded).getTime() - new Date(b.uploaded).getTime();
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [files, searchTerm, filterByType, sortBy, sortOrder]);

  // Handle file deletion
  const handleDelete = async (fileName: string) => {
    const confirmMessage = `Are you sure you want to delete "${fileName}"?\n\nThis action cannot be undone.`;
    
    if (confirm(confirmMessage)) {
      const result = await deleteFile(fileName);
      
      if (result.success) {
        alert(`✅ File "${fileName}" deleted successfully`);
      } else {
        alert(`❌ Failed to delete "${fileName}": ${result.error}`);
      }
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Get file type icon
  const getFileIcon = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const iconMap: { [key: string]: string } = {
      'glb': '🎲', 'gltf': '🎲', 'obj': '🎲', 'fbx': '🎲', 'babylon': '🎲',
      'png': '🖼️', 'jpg': '🖼️', 'jpeg': '🖼️', 'gif': '🖼️', 'webp': '🖼️',
      'mp4': '🎬', 'mov': '🎬', 'avi': '🎬', 'mkv': '🎬',
      'pdf': '📄', 'doc': '📄', 'docx': '📄', 'txt': '📄',
      'zip': '📦', 'rar': '📦', '7z': '📦',
      'json': '📋', 'xml': '📋', 'csv': '📋'
    };
    
    return iconMap[extension || ''] || '📎';
  };

  // Connection status indicator
  if (connectionStatus === null) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '24px', marginBottom: '10px' }}>🔄</div>
        <div>Testing connection to R2 API...</div>
      </div>
    );
  }

  if (connectionStatus === false) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '40px',
        backgroundColor: '#f8d7da',
        border: '1px solid #f5c6cb',
        borderRadius: '8px',
        color: '#721c24'
      }}>
        <div style={{ fontSize: '24px', marginBottom: '10px' }}>❌</div>
        <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>
          Cannot connect to R2 API
        </div>
        <div style={{ fontSize: '14px' }}>
          Please check your Worker deployment and configuration
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: '15px',
            padding: '8px 16px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ margin: '20px 0' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: 0 }}>
          📁 Your Files ({filteredAndSortedFiles.length})
        </h3>
        
        <button
          onClick={fetchFiles}
          disabled={loading}
          style={{
            padding: '8px 12px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px'
          }}
        >
          {loading ? '🔄 Refreshing...' : '🔄 Refresh'}
        </button>
      </div>

      {/* Search and Sort Controls */}
      <div style={{
        display: 'flex',
        gap: '15px',
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        flexWrap: 'wrap'
      }}>
        {/* Search */}
        <div style={{ flex: '1', minWidth: '200px' }}>
          <input
            type="text"
            placeholder="🔍 Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        </div>

        {/* Sort By */}
        <div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'size' | 'date')}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            <option value="date">Sort by Date</option>
            <option value="name">Sort by Name</option>
            <option value="size">Sort by Size</option>
          </select>
        </div>

        {/* Sort Order */}
        <div>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            style={{
              padding: '8px 12px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {sortOrder === 'asc' ? '↑ A-Z' : '↓ Z-A'}
          </button>
        </div>
      </div>

      {/* Files List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
          <div>Loading files...</div>
        </div>
      ) : filteredAndSortedFiles.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          color: '#6c757d'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>📂</div>
          <div style={{ fontSize: '18px', marginBottom: '10px' }}>
            {files.length === 0 ? 'No files uploaded yet' : 'No files match your search'}
          </div>
          <div style={{ fontSize: '14px' }}>
            {files.length === 0 ? 'Upload your first file to get started!' : 'Try adjusting your search or filters'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {filteredAndSortedFiles.map((file) => (
            <div 
              key={file.key}
              style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '15px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'white',
                transition: 'all 0.2s ease',
                cursor: onFileSelect ? 'pointer' : 'default'
              }}
              onClick={() => onFileSelect?.(file)}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                e.currentTarget.style.borderColor = '#007bff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = '#ddd';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <div style={{ fontSize: '24px', marginRight: '12px' }}>
                  {getFileIcon(file.key)}
                </div>
                <div>
                  <div style={{ 
                    fontWeight: 'bold', 
                    marginBottom: '4px',
                    wordBreak: 'break-word'
                  }}>
                    {file.key}
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#666',
                    display: 'flex',
                    gap: '15px'
                  }}>
                    <span>📊 {formatFileSize(file.size)}</span>
                    <span>📅 {new Date(file.uploaded).toLocaleDateString()}</span>
                    <span>🕒 {new Date(file.uploaded).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
              
              {showActions && (
                <div style={{ display: 'flex', gap: '8px', marginLeft: '15px' }}>
                  <a 
                    href={file.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}
                  >
                    👁️ View
                  </a>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(file.key);
                    }}
                    disabled={deleting === file.key}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: deleting === file.key ? '#6c757d' : '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      cursor: deleting === file.key ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {deleting === file.key ? '⏳ Deleting...' : '🗑️ Delete'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileManager;
