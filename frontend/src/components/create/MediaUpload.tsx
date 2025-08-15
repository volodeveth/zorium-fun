import { useState, useRef, useEffect } from 'react'
import { Upload, X, FileImage, FileVideo, Image, Camera } from 'lucide-react'

type CreationType = 'collection' | 'personal' | 'token'

interface MediaUploadProps {
  formData: any
  updateFormData: (field: string, value: any) => void
  onNext: () => void
  creationType: CreationType
}

export default function MediaUpload({ formData, updateFormData, onNext, creationType }: MediaUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [thumbnailDragging, setThumbnailDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const thumbnailInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

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

  // Generate thumbnail from video
  const generateVideoThumbnail = (videoFile: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      video.addEventListener('loadeddata', () => {
        // Set canvas dimensions
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        
        // Seek to 1 second (or 10% of video duration)
        video.currentTime = Math.min(1, video.duration * 0.1)
      })
      
      video.addEventListener('seeked', () => {
        if (ctx) {
          // Draw video frame to canvas
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          
          // Convert canvas to data URL
          const thumbnailDataUrl = canvas.toDataURL('image/png', 0.8)
          resolve(thumbnailDataUrl)
        } else {
          reject(new Error('Canvas context not available'))
        }
      })
      
      video.addEventListener('error', () => {
        reject(new Error('Error loading video'))
      })
      
      // Load video
      const videoUrl = URL.createObjectURL(videoFile)
      video.src = videoUrl
      video.load()
    })
  }

  const handleFileSelect = async (file: File) => {
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

    // Generate thumbnail for video files
    if (file.type.startsWith('video/')) {
      try {
        const thumbnailDataUrl = await generateVideoThumbnail(file)
        updateFormData('thumbnail', thumbnailDataUrl)
        updateFormData('thumbnailType', 'generated')
      } catch (error) {
        console.error('Error generating thumbnail:', error)
      }
    } else {
      // For images, clear any existing thumbnail
      updateFormData('thumbnail', null)
      updateFormData('thumbnailType', null)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleThumbnailSelect = (file: File) => {
    // Validate file type (only images)
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image file for thumbnail')
      return
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      alert('Thumbnail file size must be less than 5MB')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      updateFormData('thumbnail', e.target?.result as string)
      updateFormData('thumbnailType', 'custom')
    }
    reader.readAsDataURL(file)
  }

  const handleThumbnailInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleThumbnailSelect(file)
    }
  }

  const handleThumbnailDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setThumbnailDragging(true)
  }

  const handleThumbnailDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setThumbnailDragging(false)
  }

  const handleThumbnailDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setThumbnailDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleThumbnailSelect(files[0])
    }
  }

  const removeThumbnail = () => {
    updateFormData('thumbnail', null)
    updateFormData('thumbnailType', null)
    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = ''
    }
  }

  const regenerateThumbnail = async () => {
    if (formData.file && formData.file.type.startsWith('video/')) {
      try {
        const thumbnailDataUrl = await generateVideoThumbnail(formData.file)
        updateFormData('thumbnail', thumbnailDataUrl)
        updateFormData('thumbnailType', 'generated')
      } catch (error) {
        console.error('Error regenerating thumbnail:', error)
        alert('Failed to generate thumbnail. Please try uploading a custom one.')
      }
    }
  }

  const removeFile = () => {
    updateFormData('file', null)
    updateFormData('filePreview', null)
    updateFormData('thumbnail', null)
    updateFormData('thumbnailType', null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = ''
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
      <h2 className="text-2xl font-bold text-text-primary mb-6">
        {creationType === 'collection' ? 'Upload First NFT Media' :
         creationType === 'personal' ? 'Upload NFT Media' :
         'Upload Token Media'}
      </h2>
      
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
            {creationType === 'collection' ? 'Upload first token media' :
             creationType === 'personal' ? 'Upload your NFT media' :
             'Upload token media'}
          </h3>
          <p className="text-text-secondary mb-6">
            {creationType === 'collection' ? 
              'Upload the media for the first NFT in your new collection' :
             creationType === 'personal' ? 
              'Upload the media for your personal NFT' :
              'Upload the media for the new token to add to your collection'}
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
                    ref={videoRef}
                    src={formData.filePreview}
                    controls
                    className="w-full rounded-lg border border-border"
                  />
                )}
              </div>
            </div>
          )}

          {/* Thumbnail Section for Videos */}
          {formData.file && formData.file.type.startsWith('video/') && (
            <div className="bg-background-tertiary rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Camera size={20} className="text-purple-primary" />
                <h3 className="text-text-primary font-semibold">Video Thumbnail</h3>
              </div>
              
              {formData.thumbnail ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <img
                      src={formData.thumbnail}
                      alt="Thumbnail"
                      className="w-32 h-20 object-cover rounded-lg border border-border"
                    />
                    <div className="flex-1">
                      <p className="text-text-primary font-medium mb-1">
                        {formData.thumbnailType === 'generated' ? 'Auto-generated thumbnail' : 'Custom thumbnail'}
                      </p>
                      <p className="text-text-secondary text-sm mb-3">
                        {formData.thumbnailType === 'generated' 
                          ? 'Generated from video frame' 
                          : 'Custom uploaded image'}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => thumbnailInputRef.current?.click()}
                          className="text-purple-primary hover:text-purple-hover text-sm font-medium"
                        >
                          Replace thumbnail
                        </button>
                        <span className="text-text-secondary">•</span>
                        <button
                          onClick={removeThumbnail}
                          className="text-red-500 hover:text-red-400 text-sm font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                      thumbnailDragging 
                        ? 'border-purple-primary bg-purple-primary/5' 
                        : 'border-border hover:border-purple-primary/50'
                    }`}
                    onDragOver={handleThumbnailDragOver}
                    onDragLeave={handleThumbnailDragLeave}
                    onDrop={handleThumbnailDrop}
                    onClick={() => thumbnailInputRef.current?.click()}
                  >
                    <Camera size={32} className="text-text-secondary mx-auto mb-2" />
                    <p className="text-text-primary font-medium mb-1">Upload custom thumbnail</p>
                    <p className="text-text-secondary text-sm">
                      PNG, JPG, GIF up to 5MB
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <button
                      onClick={regenerateThumbnail}
                      className="text-purple-primary hover:text-purple-hover text-sm font-medium"
                    >
                      Or auto-generate from video
                    </button>
                  </div>
                </div>
              )}
              
              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/*"
                onChange={handleThumbnailInputChange}
                className="hidden"
              />
              
              <p className="text-text-secondary text-xs mt-3">
                A thumbnail helps users preview your video content. You can upload a custom image or we'll auto-generate one from your video.
              </p>
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