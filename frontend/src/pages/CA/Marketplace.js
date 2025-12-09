// =====================================================
// CA MARKETPLACE PAGE
// Browse and search for CA firms
// =====================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, MapPin, Star, Users, Briefcase, DollarSign, X } from 'lucide-react';
import { useCAFirms } from '../../features/ca-marketplace/hooks/use-ca-marketplace';
import toast from 'react-hot-toast';

const CAMarketplace = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    location: '',
    specialization: '',
    minRating: '',
    minPrice: '',
    maxPrice: '',
    search: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
  });
  const [showFilters, setShowFilters] = useState(false);

  const { data: firmsData, isLoading, error } = useCAFirms(filters, pagination);

  const firms = firmsData?.data?.firms || [];
  const paginationInfo = firmsData?.data?.pagination || {};

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page on filter change
  };

  const clearFilters = () => {
    setFilters({
      location: '',
      specialization: '',
      minRating: '',
      minPrice: '',
      maxPrice: '',
      search: '',
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewProfile = (firmId) => {
    navigate(`/ca/${firmId}`);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-error-50 border border-error-200 rounded-lg p-6 text-center">
            <p className="text-error-800">Failed to load CA firms. Please try again later.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-display-md text-gray-900 font-bold mb-2">CA Marketplace</h1>
          <p className="text-body-lg text-gray-600">
            Find the right Chartered Accountant for your tax filing needs
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by CA name, specialization, or location..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-body-sm font-medium"
            >
              <Filter className="h-4 w-4" />
              Filters
              {(filters.location || filters.specialization || filters.minRating || filters.minPrice || filters.maxPrice) && (
                <span className="bg-gold-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {[
                    filters.location,
                    filters.specialization,
                    filters.minRating,
                    filters.minPrice,
                    filters.maxPrice,
                  ].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Location */}
                <div>
                  <label className="block text-body-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="City, State"
                    value={filters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 text-body-sm"
                  />
                </div>

                {/* Specialization */}
                <div>
                  <label className="block text-body-sm font-medium text-gray-700 mb-1">
                    Specialization
                  </label>
                  <select
                    value={filters.specialization}
                    onChange={(e) => handleFilterChange('specialization', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 text-body-sm"
                  >
                    <option value="">All Specializations</option>
                    <option value="individual">Individual ITR</option>
                    <option value="business">Business Tax</option>
                    <option value="audit">Audit & Compliance</option>
                    <option value="consulting">Tax Consulting</option>
                    <option value="gst">GST Filing</option>
                  </select>
                </div>

                {/* Min Rating */}
                <div>
                  <label className="block text-body-sm font-medium text-gray-700 mb-1">
                    Min Rating
                  </label>
                  <select
                    value={filters.minRating}
                    onChange={(e) => handleFilterChange('minRating', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 text-body-sm"
                  >
                    <option value="">Any Rating</option>
                    <option value="4.5">4.5+ Stars</option>
                    <option value="4">4+ Stars</option>
                    <option value="3.5">3.5+ Stars</option>
                    <option value="3">3+ Stars</option>
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-body-sm font-medium text-gray-700 mb-1">
                    Min Price (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 text-body-sm"
                  />
                </div>

                <div>
                  <label className="block text-body-sm font-medium text-gray-700 mb-1">
                    Max Price (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="No limit"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 text-body-sm"
                  />
                </div>
              </div>

              {/* Clear Filters */}
              {(filters.location || filters.specialization || filters.minRating || filters.minPrice || filters.maxPrice) && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="text-body-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                  >
                    <X className="h-4 w-4" />
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500 mx-auto mb-4"></div>
            <p className="text-body-md text-gray-600">Loading CA firms...</p>
          </div>
        ) : firms.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-heading-md text-gray-900 mb-2">No CA firms found</h3>
            <p className="text-body-md text-gray-600 mb-4">
              Try adjusting your filters or search terms
            </p>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <>
            {/* Results Count */}
            <div className="mb-4 text-body-sm text-gray-600">
              Showing {firms.length} of {paginationInfo.total || 0} CA firms
            </div>

            {/* CA Firms Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {firms.map((firm) => (
                <CAFirmCard key={firm.id} firm={firm} onViewProfile={handleViewProfile} />
              ))}
            </div>

            {/* Pagination */}
            {paginationInfo.totalPages > 1 && (
              <div className="flex justify-center items-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-body-sm text-gray-600">
                  Page {pagination.page} of {paginationInfo.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= paginationInfo.totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// CA Firm Card Component
const CAFirmCard = ({ firm, onViewProfile }) => {
  const rating = firm.metadata?.rating || 0;
  const reviewCount = firm.metadata?.reviewCount || 0;
  const price = firm.metadata?.startingPrice || 'Contact for pricing';
  const specialization = firm.metadata?.specialization || 'General Tax';
  const location = firm.address?.split(',')[0] || 'Location not specified';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
         onClick={() => onViewProfile(firm.id)}>
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-heading-md font-semibold text-gray-900 mb-2">{firm.name}</h3>
        <div className="flex items-center gap-2 text-body-sm text-gray-600">
          <MapPin className="h-4 w-4" />
          <span>{location}</span>
        </div>
      </div>

      {/* Rating */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-4 w-4 ${
                star <= Math.round(rating)
                  ? 'text-gold-500 fill-current'
                  : 'text-gray-300'
              }`}
            />
          ))}
        </div>
        <span className="text-body-sm text-gray-600">
          {rating.toFixed(1)} ({reviewCount} reviews)
        </span>
      </div>

      {/* Specialization */}
      <div className="mb-4">
        <div className="flex items-center gap-2 text-body-sm text-gray-600 mb-1">
          <Briefcase className="h-4 w-4" />
          <span>{specialization}</span>
        </div>
      </div>

      {/* Stats */}
      {firm.stats && (
        <div className="flex items-center gap-4 mb-4 text-body-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{firm.stats.clientCount || 0} clients</span>
          </div>
        </div>
      )}

      {/* Price */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-gray-600" />
          <span className="text-heading-sm font-semibold text-gray-900">
            {typeof price === 'number' ? `₹${price.toLocaleString('en-IN')}` : price}
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewProfile(firm.id);
          }}
          className="px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 text-body-sm font-medium"
        >
          View Profile
        </button>
      </div>
    </div>
  );
};

export default CAMarketplace;

