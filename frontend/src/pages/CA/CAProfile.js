// =====================================================
// CA PROFILE PAGE
// Detailed view of a CA firm with reviews, pricing, and booking
// =====================================================

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Star,
  Users,
  Briefcase,
  DollarSign,
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  ArrowLeft,
  CheckCircle,
  Clock,
} from 'lucide-react';
import {
  useCAFirmDetails,
  useCAFirmReviews,
  useSendInquiry,
} from '../../features/ca-marketplace/hooks/use-ca-marketplace';
import CAInquiryModal from '../../components/CA/CAInquiryModal';
import CABookingModal from '../../components/CA/CABookingModal';
import toast from 'react-hot-toast';

const CAProfile = () => {
  const { firmId } = useParams();
  const navigate = useNavigate();
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);

  const { data: firmData, isLoading: isLoadingFirm } = useCAFirmDetails(firmId);
  const { data: reviewsData, isLoading: isLoadingReviews } = useCAFirmReviews(firmId, { page: 1, limit: 10 });
  const sendInquiryMutation = useSendInquiry();

  const firm = firmData?.data?.firm;
  const reviews = reviewsData?.data?.reviews || [];
  const pagination = reviewsData?.data?.pagination || {};

  const rating = firm?.metadata?.rating || 0;
  const reviewCount = firm?.metadata?.reviewCount || 0;
  const startingPrice = firm?.metadata?.startingPrice;
  const specialization = firm?.metadata?.specialization || 'General Tax';
  const description = firm?.metadata?.description || 'Experienced Chartered Accountant providing comprehensive tax services.';
  const services = firm?.metadata?.services || ['ITR Filing', 'Tax Planning', 'GST Filing'];
  const experience = firm?.metadata?.experience || '5+ years';

  const handleSendInquiry = async (inquiryData) => {
    try {
      await sendInquiryMutation.mutateAsync({
        firmId,
        inquiryData,
      });
      setShowInquiryModal(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  if (isLoadingFirm) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500 mx-auto mb-4"></div>
            <p className="text-body-md text-gray-600">Loading CA profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!firm) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-error-50 border border-error-200 rounded-lg p-6 text-center">
            <p className="text-error-800">CA firm not found</p>
            <button
              onClick={() => navigate('/ca/marketplace')}
              className="mt-4 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600"
            >
              Back to Marketplace
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/ca/marketplace')}
          className="flex items-center gap-2 text-body-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Marketplace
        </button>

        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left: Info */}
            <div className="flex-1">
              <h1 className="text-display-sm text-gray-900 font-bold mb-2">{firm.name}</h1>
              <div className="flex items-center gap-2 text-body-md text-gray-600 mb-4">
                <MapPin className="h-5 w-5" />
                <span>{firm.address || 'Address not specified'}</span>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${
                        star <= Math.round(rating)
                          ? 'text-gold-500 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-heading-sm font-semibold text-gray-900">
                  {rating.toFixed(1)}
                </span>
                <span className="text-body-sm text-gray-600">
                  ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
                </span>
              </div>

              {/* Specialization & Experience */}
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="flex items-center gap-2 text-body-sm text-gray-600">
                  <Briefcase className="h-4 w-4" />
                  <span>{specialization}</span>
                </div>
                <div className="flex items-center gap-2 text-body-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>{experience} experience</span>
                </div>
                {firm.stats && (
                  <div className="flex items-center gap-2 text-body-sm text-gray-600">
                    <Users className="h-4 w-4" />
                    <span>{firm.stats.clientCount || 0} clients</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <p className="text-body-md text-gray-700 mb-6">{description}</p>

              {/* Services */}
              <div className="mb-6">
                <h3 className="text-heading-sm font-semibold text-gray-900 mb-3">Services Offered</h3>
                <div className="flex flex-wrap gap-2">
                  {services.map((service, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gold-50 text-gold-700 rounded-full text-body-sm font-medium"
                    >
                      {service}
                    </span>
                  ))}
                </div>
              </div>

              {/* Contact Info */}
              <div className="flex flex-wrap gap-4 text-body-sm text-gray-600">
                {firm.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>{firm.phone}</span>
                  </div>
                )}
                {firm.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>{firm.email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Pricing & Actions */}
            <div className="md:w-80">
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-5 w-5 text-gray-600" />
                    <span className="text-body-sm text-gray-600">Starting from</span>
                  </div>
                  <div className="text-heading-lg font-bold text-gray-900">
                    {startingPrice
                      ? `₹${startingPrice.toLocaleString('en-IN')}`
                      : 'Contact for pricing'}
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => setShowBookingModal(true)}
                    className="w-full px-4 py-3 bg-gold-500 text-white rounded-lg hover:bg-gold-600 font-medium flex items-center justify-center gap-2"
                  >
                    <Calendar className="h-5 w-5" />
                    Book Consultation
                  </button>
                  <button
                    onClick={() => setShowInquiryModal(true)}
                    className="w-full px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="h-5 w-5" />
                    Send Inquiry
                  </button>
                </div>

                {/* Trust Indicators */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-body-sm text-gray-600 mb-2">
                    <CheckCircle className="h-4 w-4 text-success-500" />
                    <span>Verified CA Firm</span>
                  </div>
                  <div className="flex items-center gap-2 text-body-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-success-500" />
                    <span>Secure Communication</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-heading-lg font-semibold text-gray-900 mb-6">Reviews</h2>
          {isLoadingReviews ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500 mx-auto"></div>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              <p>No reviews yet. Be the first to review!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          )}
        </div>

        {/* Modals */}
        {showInquiryModal && (
          <CAInquiryModal
            firmId={firmId}
            firmName={firm.name}
            isOpen={showInquiryModal}
            onClose={() => setShowInquiryModal(false)}
            onSubmit={handleSendInquiry}
          />
        )}

        {showBookingModal && (
          <CABookingModal
            firmId={firmId}
            firmName={firm.name}
            isOpen={showBookingModal}
            onClose={() => setShowBookingModal(false)}
          />
        )}
      </div>
    </div>
  );
};

// Review Card Component
const ReviewCard = ({ review }) => {
  const rating = review.rating || 0;
  const userName = review.userName || 'Anonymous';
  const date = review.createdAt
    ? new Date(review.createdAt).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  return (
    <div className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-heading-sm font-semibold text-gray-900">{userName}</span>
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= rating ? 'text-gold-500 fill-current' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
          {date && <span className="text-body-xs text-gray-500">{date}</span>}
        </div>
      </div>
      {review.comment && (
        <p className="text-body-md text-gray-700">{review.comment}</p>
      )}
    </div>
  );
};

export default CAProfile;

