import { useState, useRef } from 'react'
import { Upload, X, FileImage, FileVideo, Image } from 'lucide-react'

interface MediaUploadProps {
  formData: any
  updateFormData: (field: string, value: any) => void
  onNext: () => void
}

export default function MediaUpload({ formData, updateFormData, onNext }: MediaUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleFileSelect = (file: File) => {
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'video/mp4', 'video/mov']
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image or video file')
      return
    }

    // Validate file size (100MB limit)
    const maxSize = 100 * 1024 * 1024 // 100MB
    if (file.size > maxSize) {
      alert('File size must be less than 100MB')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      updateFormData('filePreview', e.target?.result as string)
    }
    reader.readAsDataURL(file)

    updateFormData('file', file)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const removeFile = () => {
    updateFormData('file', null)
    updateFormData('filePreview', null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <FileImage size={32} className="text-purple-primary" />
    } else if (file.type.startsWith('video/')) {
      return <FileVideo size={32} className="text-purple-primary" />
    }
    return <Image size={32} className="text-purple-primary" />
  }

  return (
    <div className="bg-background-secondary rounded-xl border border-border p-8">
      <h2 className="text-2xl font-bold text-text-primary mb-6">Upload Media</h2>
      
      {!formData.file ? (
        <div
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
            isDragging 
              ? 'border-purple-primary bg-purple-primary/5' 
              : 'border-border hover:border-purple-primary/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="mb-4">
            <Upload size={48} className="text-text-secondary mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-text-primary mb-2">
            Upload media (image, video, gif)
          </h3>
          <p className="text-text-secondary mb-6">
            Drag and drop your file here, or click to browse
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-primary"
          >
            Browse Files
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileInputChange}
            className="hidden"
          />
          <p className="text-text-secondary text-sm mt-4">
            Supported formats: JPG, PNG, GIF, MP4, MOV " Max size: 100MB
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* File Preview */}
          <div className="bg-background-tertiary rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                {formData.filePreview ? (
                  formData.file.type.startsWith('image/') ? (
                    <img
                      src={formData.filePreview}
                      alt="Preview"
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  ) : (
                    <video
                      src={formData.filePreview}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  )
                ) : (
                  getFileIcon(formData.file)
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-text-primary font-semibold mb-1">
                  {formData.file.name}
                </h3>
                <p className="text-text-secondary text-sm">
                  {(formData.file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              <button
                onClick={removeFile}
                className="text-text-secondary hover:text-red-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Large Preview */}
          {formData.filePreview && (
            <div className="bg-background-tertiary rounded-xl p-6">
              <h3 className="text-text-primary font-semibold mb-4">Preview</h3>
              <div className="max-w-md mx-auto">
                {formData.file.type.startsWith('image/') ? (
                  <img
                    src={formData.filePreview}
                    alt="Preview"
                    className="w-full rounded-lg border border-border"
                  />
                ) : (
                  <video
                    src={formData.filePreview}
                    controls
                    className="w-full rounded-lg border border-border"
                  />
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between">
            <button
              onClick={removeFile}
              className="btn-secondary"
            >
              Remove File
            </button>
            <button
              onClick={onNext}
              className="btn-primary"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  )
}