'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, ArrowLeft, Eye, Edit, Layers, User } from 'lucide-react'
import MediaUpload from '@/components/create/MediaUpload'
import MetadataForm from '@/components/create/MetadataForm'
import CreatePreview from '@/components/create/CreatePreview'
import CollectionSelect from '@/components/create/CollectionSelect'

type CreationType = 'collection' | 'personal' | 'token'

export default function CreatePage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [creationType, setCreationType] = useState<CreationType | null>(null)
  const [formData, setFormData] = useState({
    // Common fields
    title: '',
    description: '',
    tags: [] as string[],
    price: '',
    mintDuration: '', // For custom price NFTs
    networkId: 8453, // Base network as default
    file: null as File | null,
    filePreview: null as string | null,
    
    // Layers-specific fields
    collectionName: '',
    collectionSymbol: '',
    collectionDescription: '',
    existingLayers: '', // For adding tokens to existing collections
    
    // NFT/Token specific fields
    isCustomPrice: false,
    mintEndTime: '',
    maxSupply: 1000, // Default max supply for ERC-1155
    
    // Personal collection flag
    isPersonal: false
  })

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const getSteps = () => {
    if (!creationType) {
      return [{ number: 1, title: 'Choose Type', icon: Layers }]
    }
    
    const baseSteps = [
      { number: 1, title: 'Choose Type', icon: Layers },
      { number: 2, title: 'Upload Media', icon: Upload },
      { number: 3, title: 'Add Details', icon: Edit },
      { number: 4, title: 'Preview & Create', icon: Eye }
    ]
    
    return baseSteps
  }

  const steps = getSteps()

  const renderCreationTypeSelector = () => (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-text-primary mb-2">What would you like to create?</h2>
        <p className="text-text-secondary">Choose how you want to structure your NFT</p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6">
        {/* Create New Layers */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-background-secondary border border-border rounded-xl p-6 cursor-pointer hover:border-purple-primary/50 transition-all"
          onClick={() => {
            setCreationType('collection')
            setFormData(prev => ({ ...prev, isPersonal: false }))
            setCurrentStep(2)
          }}
        >
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-purple-primary/10 flex items-center justify-center">
              <Layers className="w-8 h-8 text-purple-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">New Layers</h3>
              <p className="text-text-secondary text-sm">
                Create a new collection that can hold multiple NFTs. Perfect for artists launching a series.
              </p>
            </div>
            <div className="text-xs text-text-tertiary">
              <span className="bg-purple-primary/10 text-purple-primary px-2 py-1 rounded">ERC-1155</span>
            </div>
          </div>
        </motion.div>

        {/* Create Personal Layers */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-background-secondary border border-border rounded-xl p-6 cursor-pointer hover:border-blue-primary/50 transition-all"
          onClick={() => {
            setCreationType('personal')
            setFormData(prev => ({ ...prev, isPersonal: true }))
            setCurrentStep(2)
          }}
        >
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-blue-primary/10 flex items-center justify-center">
              <User className="w-8 h-8 text-blue-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">Personal NFT</h3>
              <p className="text-text-secondary text-sm">
                Create a single NFT in its own personal collection. Quick and simple for one-off pieces.
              </p>
            </div>
            <div className="text-xs text-text-tertiary">
              <span className="bg-blue-primary/10 text-blue-primary px-2 py-1 rounded">ERC-1155</span>
            </div>
          </div>
        </motion.div>

        {/* Add to Existing Layers */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-background-secondary border border-border rounded-xl p-6 cursor-pointer hover:border-green-primary/50 transition-all"
          onClick={() => {
            setCreationType('token')
            setFormData(prev => ({ ...prev, isPersonal: false }))
            setCurrentStep(2)
          }}
        >
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-primary/10 flex items-center justify-center">
              <Upload className="w-8 h-8 text-green-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">Add to Layers</h3>
              <p className="text-text-secondary text-sm">
                Add a new NFT token to one of your existing collections.
              </p>
            </div>
            <div className="text-xs text-text-tertiary">
              <span className="bg-green-primary/10 text-green-primary px-2 py-1 rounded">ERC-1155</span>
            </div>
          </div>
        </motion.div>
      </div>
      
      <div className="mt-8 text-center">
        <div className="inline-flex items-center space-x-2 text-text-tertiary text-sm">
          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
          <span>All NFTs created use the new ERC-1155 standard with advanced features</span>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button 
            className="flex items-center text-text-secondary hover:text-text-primary mb-4 transition-colors"
            onClick={() => {
              if (currentStep === 1 && creationType) {
                setCreationType(null)
              } else if (currentStep > 1) {
                setCurrentStep(prev => prev - 1)
              }
            }}
          >
            <ArrowLeft size={20} className="mr-2" />
            Back
          </button>
          <h1 className="text-4xl font-bold text-text-primary mb-2">
            {!creationType ? 'Create NFT' : 
             creationType === 'collection' ? 'Create Layers' :
             creationType === 'personal' ? 'Create Personal NFT' :
             'Add to Layers'
            }
          </h1>
          <p className="text-text-secondary">
            {!creationType ? 'Choose how you want to create your NFT' :
             creationType === 'collection' ? 'Create a new collection that can hold multiple NFTs' :
             creationType === 'personal' ? 'Create a single NFT in its own personal collection' :
             'Add a new NFT token to an existing collection'
            }
          </p>
        </div>

        {/* Progress Steps */}
        {creationType && (
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
        )}

        {/* Step Content */}
        <motion.div
          key={`${currentStep}-${creationType}`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Step 1: Choose Creation Type */}
          {currentStep === 1 && !creationType && renderCreationTypeSelector()}

          {/* Step 2: Upload Media */}
          {currentStep === 2 && creationType && (
            <MediaUpload
              formData={formData}
              updateFormData={updateFormData}
              onNext={() => setCurrentStep(3)}
              creationType={creationType}
            />
          )}

          {/* Step 3: Add Details */}
          {currentStep === 3 && creationType && (
            <div>
              {creationType === 'token' && (
                <CollectionSelect
                  formData={formData}
                  updateFormData={updateFormData}
                />
              )}
              <MetadataForm
                formData={formData}
                updateFormData={updateFormData}
                onNext={() => setCurrentStep(4)}
                onBack={() => setCurrentStep(2)}
                creationType={creationType}
              />
            </div>
          )}

          {/* Step 4: Preview & Create */}
          {currentStep === 4 && creationType && (
            <CreatePreview
              formData={formData}
              onBack={() => setCurrentStep(3)}
              creationType={creationType}
            />
          )}
        </motion.div>
      </div>
    </div>
  )
}