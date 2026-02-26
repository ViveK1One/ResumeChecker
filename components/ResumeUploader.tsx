'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, AlertCircle, Loader2, Sparkles, CheckCircle, FileUp, Crown, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface ResumeUploaderProps {
  onAnalysisComplete: (result: any) => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

export default function ResumeUploader({ 
  onAnalysisComplete, 
  isLoading, 
  setIsLoading 
}: ResumeUploaderProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [error, setError] = useState<string>('')
  const [limitReached, setLimitReached] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError('')
    setLimitReached(false)
    const file = acceptedFiles[0]
    
    if (file) {
      // Validate file type
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      if (!validTypes.includes(file.type)) {
        setError('Please upload a PDF or DOCX file')
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB')
        return
      }
      
      setUploadedFile(file)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: false
  })

  const handleAnalyze = async () => {
    if (!uploadedFile) return

    setIsLoading(true)
    
    try {
      const formData = new FormData()
      formData.append('resume', uploadedFile)

      const response = await fetch('/api/analyze-resume', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setLimitReached(!!data?.limitReached)
        const details = data?.details || data?.error || 'Unknown error'
        const hint = data?.hint ? ` ${data.hint}` : ''
        throw new Error(`${details}${hint}`)
      }
      setLimitReached(false)
      onAnalysisComplete(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to analyze resume. Please try again.'
      setError(message)
      onAnalysisComplete(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveFile = () => {
    setUploadedFile(null)
    setError('')
    setLimitReached(false)
  }

  return (
    <div className="space-y-8 w-full flex flex-col items-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8 w-full flex flex-col items-center border-2 border-gray-700 rounded-3xl p-8 bg-gray-900/50 backdrop-blur-sm"
      >
        {/* Header */}
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-blue-800 rounded-full mb-6 shadow-lg"
          >
            <Sparkles className="w-10 h-10 text-white" />
          </motion.div>
          <h2 className="text-4xl font-bold text-white mb-4">
            Upload Your Resume
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Get instant AI-powered analysis with detailed feedback on formatting, 
            ATS optimization, and professional recommendations.
          </p>
        </div>

        {/* Upload Area */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="relative w-full max-w-3xl"
        >
          <div
            {...getRootProps()}
            className={`relative border-3 border-dashed rounded-3xl p-16 text-center cursor-pointer transition-all duration-300 ${
              isDragActive
                ? 'border-blue-400 bg-blue-900/20 shadow-2xl shadow-blue-500/20'
                : 'border-gray-500 hover:border-blue-400 hover:bg-gray-800/50 hover:shadow-xl'
            }`}
          >
            <input {...getInputProps()} />
            
            <div className="space-y-8">
              {/* Upload Icon */}
              <motion.div 
                animate={{ 
                  scale: isDragActive ? 1.15 : 1,
                  rotate: isDragActive ? 10 : 0,
                  y: isDragActive ? -5 : 0
                }}
                transition={{ duration: 0.3 }}
                className="mx-auto w-24 h-24 bg-gradient-to-r from-blue-600 to-blue-800 rounded-full flex items-center justify-center shadow-lg"
              >
                <FileUp className="w-12 h-12 text-white" />
              </motion.div>
              
              {/* Upload Text */}
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-white">
                  {isDragActive ? 'Drop your resume here' : 'Upload your resume'}
                </h3>
                <p className="text-lg text-gray-300">
                  Drag and drop your PDF or DOCX file here, or click to browse
                </p>
                
                {/* File Type Indicators */}
                <div className="flex items-center justify-center space-x-8 text-sm">
                  <div className="flex items-center space-x-2 text-gray-400">
                    <div className="w-3 h-4 bg-red-500 rounded-sm"></div>
                    <span>PDF</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-400">
                    <div className="w-3 h-4 bg-blue-500 rounded-sm"></div>
                    <span>DOCX</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-400">
                    <div className="w-4 h-4 bg-gray-500 rounded-sm"></div>
                    <span>Max 5MB</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-8 left-8 w-12 h-12 border-2 border-blue-400 rounded-lg"></div>
              <div className="absolute top-16 right-16 w-8 h-8 bg-blue-400 rounded-full"></div>
              <div className="absolute bottom-16 left-16 w-10 h-10 border-2 border-blue-500 rounded-full"></div>
            </div>
          </div>
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-4 rounded-xl backdrop-blur-sm ${limitReached ? 'bg-red-900/50 border border-red-700 flex flex-col gap-4' : 'flex items-center space-x-3 bg-red-900/50 border border-red-700'}`}
            >
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
                <span className="text-red-200 font-medium">{error}</span>
              </div>
              {limitReached && (
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-500 hover:to-blue-600 transition-all shadow-lg w-fit"
                >
                  <Crown className="w-4 h-4" />
                  Upgrade to Pro
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Uploaded File */}
        <AnimatePresence>
          {uploadedFile && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex items-center justify-between p-6 bg-gradient-to-r from-green-900/50 to-emerald-900/50 border border-green-700 rounded-xl shadow-lg backdrop-blur-sm w-full max-w-3xl"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-800 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-300" />
                </div>
                <div>
                  <p className="font-semibold text-green-100 text-lg">{uploadedFile.name}</p>
                  <p className="text-sm text-green-300">
                    {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB • Ready to analyze
                  </p>
                </div>
              </div>
              <button
                onClick={handleRemoveFile}
                className="text-green-300 hover:text-green-100 transition-colors font-medium px-4 py-2 rounded-lg hover:bg-green-800/30"
              >
                Remove
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Analyze Button */}
        <AnimatePresence>
          {uploadedFile && !isLoading && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAnalyze}
              className="w-full max-w-3xl bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white font-semibold py-5 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-3 text-xl"
            >
              <FileText className="w-7 h-7" />
              <span>Analyze Resume with AI</span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Loading State */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center py-16 w-full max-w-3xl"
            >
              <div className="relative mb-8">
                <Loader2 className="w-16 h-16 text-blue-300 animate-spin mx-auto" />
                <div className="absolute inset-0 w-16 h-16 border-4 border-gray-700 border-t-blue-300 rounded-full animate-spin mx-auto"></div>
              </div>
              <h3 className="text-2xl font-semibold text-white mb-3">
                Analyzing your resume...
              </h3>
              <p className="text-gray-300 mb-6 text-lg">
                Our AI is examining your resume for optimization opportunities
              </p>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
                <div className="w-3 h-3 bg-blue-300 rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-blue-300 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-3 h-3 bg-blue-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
