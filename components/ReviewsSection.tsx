'use client'

import { useState, useEffect } from 'react'
import { Star, MessageCircle, User, Send, CheckCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Review {
  _id: string
  rating: number
  message: string
  candidateName: string
  submittedAt: string
}

export default function ReviewsSection() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reviewSubmitted, setReviewSubmitted] = useState(false)

  useEffect(() => {
    fetchReviews()
  }, [])

  const fetchReviews = async () => {
    try {
      const response = await fetch('/api/get-reviews')
      if (response.ok) {
        const data = await response.json()
        setReviews(data.reviews || [])
      } else {
        setError('Failed to load reviews')
      }
    } catch (error) {
      setError('Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ))
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getAverageRating = () => {
    if (reviews.length === 0) return 0
    const total = reviews.reduce((sum, review) => sum + review.rating, 0)
    return Math.round((total / reviews.length) * 10) / 10
  }

  const handleReviewSubmit = async () => {
    if (rating === 0) return // Rating is mandatory
    
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/submit-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating,
          message,
          candidateName: 'Anonymous User',
          analysisId: null
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit review')
      }

      setReviewSubmitted(true)
      setShowReviewForm(false)
      // Refresh reviews after submission
      setTimeout(() => {
        fetchReviews()
      }, 1000)
    } catch (error) {
      console.error('Review submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getRatingLabel = (rating: number) => {
    switch (rating) {
      case 1: return 'Poor'
      case 2: return 'Fair'
      case 3: return 'Good'
      case 4: return 'Very Good'
      case 5: return 'Excellent'
      default: return 'Rate your experience'
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading reviews...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg">
        <div className="text-center text-gray-600">
          <p>Unable to load reviews at this time.</p>
        </div>
      </div>
    )
  }

  const averageRating = getAverageRating()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          What Our Users Say
        </h2>
        <p className="text-gray-600 text-lg">
          Real feedback from users who've analyzed their resumes
        </p>
      </div>

      {/* Overall Rating */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-2">
          {Array.from({ length: 5 }, (_, i) => (
            <Star
              key={i}
              className={`w-6 h-6 ${
                i < Math.floor(averageRating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
              }`}
            />
          ))}
        </div>
        <p className="text-2xl font-bold text-gray-900 mb-1">
          {averageRating.toFixed(1)} out of 5
        </p>
        <p className="text-gray-600">
          Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Reviews Grid */}
      {reviews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.slice(0, 6).map((review, index) => (
            <motion.div
              key={review._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow"
            >
              {/* Review Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {review.candidateName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDate(review.submittedAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  {getRatingStars(review.rating)}
                </div>
              </div>

              {/* Review Message */}
              {review.message && (
                <div className="mb-4">
                  <div className="flex items-start space-x-2">
                    <MessageCircle className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                    <p className="text-gray-700 text-sm leading-relaxed">
                      "{review.message}"
                    </p>
                  </div>
                </div>
              )}

              {/* Rating Display */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  Rated {review.rating}/5 stars
                </span>
                <div className="flex items-center space-x-1">
                  {getRatingStars(review.rating)}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Reviews Yet
          </h3>
          <p className="text-gray-600">
            Be the first to share your experience with our resume analysis service!
          </p>
        </div>
      )}

             {/* Review Call-to-Action */}
       <div className="text-center mt-12">
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.3 }}
           className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-8 border border-blue-200"
         >
           <h3 className="text-2xl font-bold text-gray-900 mb-4">
             Share Your Experience
           </h3>
           <p className="text-gray-600 mb-6">
             Help others by sharing your feedback about our resume analysis service
           </p>
           
           {!showReviewForm && !reviewSubmitted ? (
             <motion.button
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.95 }}
               onClick={() => setShowReviewForm(true)}
               className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg transition-colors duration-200"
             >
               <Star className="w-5 h-5 mr-2" />
               Write a Review
             </motion.button>
           ) : reviewSubmitted ? (
             <motion.div
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="inline-flex items-center px-6 py-3 bg-green-500 text-white font-semibold rounded-lg"
             >
               <CheckCircle className="w-5 h-5 mr-2" />
               Thank You for Your Review!
             </motion.div>
           ) : (
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="max-w-md mx-auto"
             >
               {/* Star Rating */}
               <div className="flex justify-center items-center mb-6">
                 <div className="flex items-center space-x-2">
                   {[1, 2, 3, 4, 5].map((star) => (
                     <motion.button
                       key={star}
                       whileHover={{ scale: 1.1 }}
                       whileTap={{ scale: 0.9 }}
                       onClick={() => setRating(star)}
                       onMouseEnter={() => setHoveredRating(star)}
                       onMouseLeave={() => setHoveredRating(0)}
                       className="focus:outline-none"
                     >
                       <Star
                         className={`w-8 h-8 transition-colors duration-200 ${
                           star <= (hoveredRating || rating)
                             ? 'text-yellow-400 fill-current'
                             : 'text-gray-300'
                         }`}
                       />
                     </motion.button>
                   ))}
                 </div>
               </div>

               {/* Rating Label */}
               <div className="text-center mb-6">
                 <p className="text-lg font-semibold text-gray-700">
                   {getRatingLabel(hoveredRating || rating)}
                 </p>
               </div>

               {/* Message Input */}
               <div className="mb-6">
                 <textarea
                   value={message}
                   onChange={(e) => setMessage(e.target.value)}
                   placeholder="Tell us what you liked or how we can improve..."
                   className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                   rows={4}
                   maxLength={500}
                 />
                 <div className="text-right mt-1">
                   <span className="text-sm text-gray-500">
                     {message.length}/500 characters
                   </span>
                 </div>
               </div>

               {/* Submit Button */}
               <div className="flex space-x-3">
                 <motion.button
                   whileHover={{ scale: 1.05 }}
                   whileTap={{ scale: 0.95 }}
                   onClick={() => setShowReviewForm(false)}
                   className="flex-1 px-4 py-3 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold rounded-lg transition-colors duration-200"
                 >
                   Cancel
                 </motion.button>
                 <motion.button
                   whileHover={{ scale: 1.05 }}
                   whileTap={{ scale: 0.95 }}
                   onClick={handleReviewSubmit}
                   disabled={rating === 0 || isSubmitting}
                   className={`flex-1 px-4 py-3 rounded-lg font-semibold text-white transition-colors duration-200 ${
                     rating === 0 || isSubmitting
                       ? 'bg-gray-400 cursor-not-allowed'
                       : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                   }`}
                 >
                   {isSubmitting ? (
                     <>
                       <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                       Submitting...
                     </>
                   ) : (
                     <>
                       <Send className="w-4 h-4 mr-2" />
                       Submit Review
                     </>
                   )}
                 </motion.button>
               </div>
               
               {rating === 0 && (
                 <p className="text-red-500 text-sm mt-2 text-center">
                   Please select a rating before submitting
                 </p>
               )}
             </motion.div>
           )}
         </motion.div>
       </div>

       {/* View More Button */}
       {reviews.length > 6 && (
         <div className="text-center mt-8">
           <motion.button
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
             className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg transition-colors duration-200"
           >
             View All Reviews
           </motion.button>
         </div>
       )}
     </motion.div>
   )
 }
