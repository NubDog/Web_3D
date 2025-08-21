import './App.css'
import BabylonTankViewer from './components/babylon'
import FileUpload from './components/FileUpload'
import FileManager from './components/FileManager'
import { R2File } from './hooks/useR2'
import { useState } from 'react'

function App() {
  const [selectedFile, setSelectedFile] = useState<R2File | null>(null);

  const handleUploadSuccess = (fileName: string, url: string) => {
    console.log('✅ Upload successful:', fileName, url);
    // Có thể thêm logic khác ở đây nếu cần
  };

  const handleUploadError = (error: string) => {
    console.error('❌ Upload error:', error);
    // Có thể thêm logic khác ở đây nếu cần
  };

  const handleFileSelect = (file: R2File) => {
    setSelectedFile(file);
    console.log('📁 Selected file:', file);
    // Có thể load file này vào Babylon viewer nếu là 3D model
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          color: '#333', 
          marginBottom: '10px',
          background: 'linear-gradient(45deg, #007bff, #28a745)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          🎲 3D Model Manager & Viewer
        </h1>
        <p style={{ fontSize: '1.1rem', color: '#666' }}>
          Upload, manage, and view your 3D models with Cloudflare R2 storage
        </p>
      </header>

      {/* Upload Section */}
      <section style={{ marginBottom: '40px' }}>
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '30px',
          borderRadius: '12px',
          border: '1px solid #e9ecef'
        }}>
          <h2 style={{ 
            fontSize: '1.5rem', 
            color: '#333', 
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            📤 Upload New Files
          </h2>
          <FileUpload 
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
            acceptedTypes=".glb,.gltf,.obj,.fbx,.babylon,.png,.jpg,.jpeg,.gif,.mp4,.mov,.zip,.pdf"
            maxFileSize={200 * 1024 * 1024} // 200MB
          />
        </div>
      </section>

      {/* File Manager Section */}
      <section style={{ marginBottom: '40px' }}>
        <div style={{
          backgroundColor: '#ffffff',
          padding: '30px',
          borderRadius: '12px',
          border: '1px solid #e9ecef',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <FileManager 
            onFileSelect={handleFileSelect}
            showActions={true}
          />
        </div>
      </section>

      {/* Selected File Info */}
      {selectedFile && (
        <section style={{ marginBottom: '40px' }}>
          <div style={{
            backgroundColor: '#e7f3ff',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #b3d9ff'
          }}>
            <h3 style={{ color: '#0066cc', marginBottom: '15px' }}>
              📋 Selected File Details
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              <div>
                <strong>📁 Name:</strong> {selectedFile.key}
              </div>
              <div>
                <strong>📊 Size:</strong> {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </div>
              <div>
                <strong>📅 Uploaded:</strong> {new Date(selectedFile.uploaded).toLocaleString()}
              </div>
              <div>
                <strong>🔗 URL:</strong> 
                <a 
                  href={selectedFile.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ marginLeft: '5px', color: '#007bff' }}
                >
                  Open File
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3D Viewer Section */}
      <section>
        <div style={{
          backgroundColor: '#ffffff',
          padding: '30px',
          borderRadius: '12px',
          border: '1px solid #e9ecef',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ 
            fontSize: '1.5rem', 
            color: '#333', 
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            🎮 3D Viewer
          </h2>
          
          {selectedFile && selectedFile.key.match(/\.(glb|gltf|obj|fbx|babylon)$/i) ? (
            <div style={{ marginBottom: '15px', textAlign: 'center' }}>
              <p style={{ color: '#28a745', fontWeight: 'bold' }}>
                🎲 Selected 3D Model: {selectedFile.key}
              </p>
              <p style={{ fontSize: '14px', color: '#666' }}>
                You can integrate this file URL into your Babylon.js viewer
              </p>
            </div>
          ) : (
            <div style={{ marginBottom: '15px', textAlign: 'center' }}>
              <p style={{ color: '#6c757d' }}>
                Select a 3D model file (.glb, .gltf, .obj, .fbx, .babylon) to view
              </p>
            </div>
          )}

          <BabylonTankViewer />
        </div>
      </section>

      {/* Footer */}
      <footer style={{ 
        marginTop: '60px', 
        padding: '20px', 
        textAlign: 'center', 
        borderTop: '1px solid #e9ecef',
        color: '#666'
      }}>
        <p>
          🚀 Powered by <strong>Cloudflare R2</strong> • ⚛️ <strong>React</strong> • 🎲 <strong>Babylon.js</strong>
        </p>
        <p style={{ fontSize: '14px', marginTop: '10px' }}>
          Built with ❤️ for 3D content management
        </p>
      </footer>
    </div>
  )
}

export default App
