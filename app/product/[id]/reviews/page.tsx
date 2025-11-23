"use client"
import { useState, useEffect } from "react"
import { Star, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { productsApi } from "@/lib/api"
import { useParams, useRouter } from "next/navigation"
import { getImageUrl } from "@/lib/utils"
import { useLanguage } from "@/contexts/LanguageContext"

// Star Rating Component with partial fill support
const StarRating = ({ rating, size = "w-4 h-4" }: { rating: number; size?: string }) => {
  const fullStars = Math.floor(rating)
  const hasPartialStar = rating % 1 !== 0
  const partialFill = rating % 1

  return (
    <div className="flex items-center">
      {[...Array(5)].map((_, i) => {
        if (i < fullStars) {
          return (
            <Star
              key={i}
              className={`${size} text-yellow-400 fill-current`}
            />
          )
        } else if (i === fullStars && hasPartialStar) {
          return (
            <div key={i} className={`${size} relative inline-block`}>
              <Star className={`${size} text-gray-300 absolute inset-0`} />
              <div
                className="absolute inset-0"
                style={{
                  clipPath: `inset(0 ${100 - partialFill * 100}% 0 0)`,
                }}
              >
                <Star className={`${size} text-yellow-400 fill-current`} />
              </div>
            </div>
          )
        } else {
          return (
            <Star
              key={i}
              className={`${size} text-gray-300`}
            />
          )
        }
      })}
    </div>
  )
}

export default function ProductReviewsPage() {
  const params = useParams()
  const router = useRouter()
  const { t } = useLanguage()
  const [product, setProduct] = useState<any>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadProductAndReviews = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const slug = params.id as string
        const productData = await productsApi.getDetail(slug)
        setProduct(productData)
        
        if (productData.reviews) {
          setReviews(productData.reviews)
        }
      } catch (err: any) {
        console.error('Failed to load product reviews:', err)
        setError(err.message || 'Failed to load reviews')
      } finally {
        setIsLoading(false)
      }
    }

    if (params.id) {
      loadProductAndReviews()
    }
  }, [params.id])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4"></div>
          <p className="text-gray-600">{t('product.reviews.loading')}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => router.back()} variant="outline">
            {t('common.back')}
          </Button>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{t('product.notFound')}</p>
          <Button onClick={() => router.push('/')} variant="outline">
            {t('common.goToHome')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/product/${params.id}`}
            className="inline-flex items-center text-brand hover:text-purple-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('product.reviews.backToProduct')}
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-black mb-2">
                {product.title}
              </h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>{t('product.sold')} {product.sold_count || 0}</span>
                <div className="flex items-center space-x-1">
                  <StarRating rating={product.rating_avg || 0} size="w-4 h-4" />
                  <span>
                    {product.rating_avg?.toFixed(1) || '0.0'} ({product.rating_count || 0})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl lg:text-2xl font-bold text-black mb-6">
            {t('product.reviews.allReviews')} ({reviews.length})
          </h2>

          {reviews.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">{t('product.noReviews')}</p>
              <p className="text-gray-400 text-sm mt-2">{t('product.reviews.beFirst')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews.map((review: any) => (
                <div key={review.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  {/* User Info Row */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      {/* User Profile Picture */}
                      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gray-200 flex items-center justify-center">
                        {review.user_profile_image ? (
                          <img
                            src={getImageUrl(review.user_profile_image)}
                            alt={review.user_name || t('product.buyer')}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-brand font-bold text-lg">
                            {review.user_name ? review.user_name.charAt(0).toUpperCase() : t('product.buyer').charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-black truncate mb-1">
                          {review.user_name || t('product.buyer')}
                        </h4>
                        {/* Star Rating */}
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < review.rating ? "text-yellow-400 fill-current" : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    {/* Date on the right */}
                    <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                      {(() => {
                        const date = new Date(review.created_at)
                        const day = String(date.getDate()).padStart(2, '0')
                        const month = String(date.getMonth() + 1).padStart(2, '0')
                        const year = date.getFullYear()
                        return `${day}/${month}/${year}`
                      })()}
                    </span>
                  </div>

                  {/* Review Title */}
                  {review.title && (
                    <h5 className="font-medium text-black mb-2">{review.title}</h5>
                  )}

                  {/* Review Images - Horizontal Row */}
                  {review.images && review.images.length > 0 && (
                    <div className="flex space-x-2 mb-3 overflow-x-auto">
                      {review.images.map((img: any, idx: number) => (
                        <div key={img.id || idx} className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          <img
                            src={getImageUrl(img.url)}
                            alt={`Review image ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Review Text */}
                  {review.text && (
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {review.text}
                    </p>
                  )}

                  {/* Verified Purchase Badge */}
                  {review.is_verified_purchase && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <span className="text-xs text-green-600 font-medium">
                        ✓ {t('product.reviews.verifiedPurchase')}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

