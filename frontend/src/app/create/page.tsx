'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, ArrowLeft, Eye, Edit } from 'lucide-react'
import MediaUpload from '@/components/create/MediaUpload'
import MetadataForm from '@/components/create/MetadataForm'
import CreatePreview from '@/components/create/CreatePreview'

export default function CreatePage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    collection: '',
    tags: [] as string[],
    price: '',
    mintDuration: '', // For custom price NFTs
    networkId: 8453, // Base network as default
    file: null as File | null,
    filePreview: null as string | null
  })

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const steps = [
    { number: 1, title: 'Upload Media', icon: Upload },
    { number: 2, title: 'Add Details', icon: Edit },
    { number: 3, title: 'Preview & Mint', icon: Eye }
  ]

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button className="flex items-center text-text-secondary hover:text-text-primary mb-4 transition-colors">
            <ArrowLeft size={20} className="mr-2" />
            Back
          </button>
          <h1 className="text-4xl font-bold text-text-primary mb-2">Create NFT</h1>
          <p className="text-text-secondary">
            Upload your digital creation and mint it as an NFT on Zora Network
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-2 sm:space-x-4 lg:space-x-8">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = currentStep === step.number
              const isCompleted = currentStep > step.number
              
              return (
                <div key={step.number} className="flex items-center">
                  <div className={`flex items-center space-x-1 sm:space-x-2 ${
                    isActive ? 'text-purple-primary' : 
                    isCompleted ? 'text-green-500' : 'text-text-secondary'
                  }`}>
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 ${
                      isActive ? 'border-purple-primary bg-purple-primary/10' :
                      isCompleted ? 'border-green-500 bg-green-500/10' :
                      'border-border bg-background-secondary'
                    }`}>
                      <Icon size={16} className="sm:w-[18px] sm:h-[18px]" />
                    </div>
                    <span className="font-medium text-sm sm:text-base hidden sm:inline">{step.title}</span>
                    <span className="font-medium text-xs sm:hidden">{step.number}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-8 sm:w-16 h-px mx-2 sm:mx-4 ${
                      isCompleted ? 'bg-green-500' : 'bg-border'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Step Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {currentStep === 1 && (
            <MediaUpload
              formData={formData}
              updateFormData={updateFormData}
              onNext={() => setCurrentStep(2)}
            />
          )}

          {currentStep === 2 && (
            <MetadataForm
              formData={formData}
              updateFormData={updateFormData}
              onNext={() => setCurrentStep(3)}
              onBack={() => setCurrentStep(1)}
            />
          )}

          {currentStep === 3 && (
            <CreatePreview
              formData={formData}
              onBack={() => setCurrentStep(2)}
            />
          )}
        </motion.div>
      </div>
    </div>
  )
}