// =====================================================
// CA BOOKING MODAL COMPONENT
// Modal for booking consultation with CA firm
// =====================================================

import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, Clock, Video, Phone, MessageSquare } from 'lucide-react';
import { useAvailableSlots, useBookConsultation } from '../../features/ca-marketplace/hooks/use-ca-marketplace';
import toast from 'react-hot-toast';

const CABookingModal = ({ firmId, firmName, isOpen, onClose }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [consultationType, setConsultationType] = useState('video');
  const [notes, setNotes] = useState('');
  const modalRef = useRef(null);
  const firstInputRef = useRef(null);
  const previousActiveElement = useRef(null);

  const { data: slotsData, isLoading: isLoadingSlots } = useAvailableSlots(
    firmId,
    selectedDate,
    !!selectedDate,
  );
  const bookConsultationMutation = useBookConsultation();

  const availableSlots = slotsData?.data?.slots || [];
  const minDate = new Date().toISOString().split('T')[0]; // Today

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  // Handle focus management
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement;
      setTimeout(() => {
        if (firstInputRef.current) {
          firstInputRef.current.focus();
        } else if (modalRef.current) {
          const firstFocusable = modalRef.current.querySelector(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
          );
          firstFocusable?.focus();
        }
      }, 100);
    } else {
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    }
  }, [isOpen]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const modal = modalRef.current;
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTab = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    modal.addEventListener('keydown', handleTab);
    return () => modal.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  // Reset time when date changes
  useEffect(() => {
    setSelectedTime('');
  }, [selectedDate]);

  const handleClose = () => {
    setSelectedDate('');
    setSelectedTime('');
    setConsultationType('video');
    setNotes('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedDate || !selectedTime) {
      toast.error('Please select date and time');
      return;
    }

    try {
      await bookConsultationMutation.mutateAsync({
        firmId,
        bookingData: {
          date: selectedDate,
          time: selectedTime,
          type: consultationType,
          notes: notes.trim() || null,
        },
      });
      handleClose();
    } catch (error) {
      // Error handled by mutation
    }
  };

  // Generate time slots (mock - should come from API)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 17; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour < 17) {
        slots.push(`${hour.toString().padStart(2, '0')}:30`);
      }
    }
    return slots;
  };

  const timeSlots = availableSlots.length > 0 ? availableSlots : generateTimeSlots();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity duration-200 bg-black bg-opacity-50"
          onClick={handleClose}
          aria-hidden="true"
        />

        {/* Modal panel */}
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="booking-modal-title"
          className="inline-block align-bottom bg-white rounded-3xl text-left overflow-hidden shadow-overlay transform sm:my-8 sm:align-middle sm:max-w-lg sm:w-full animate-scale-in"
        >
          <div className="bg-white p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-gold-600 mr-2" />
                <h3 id="booking-modal-title" className="text-heading-lg text-gray-800 font-semibold">
                  Book Consultation
                </h3>
              </div>
              <button
                onClick={handleClose}
                className="text-slate-400 hover:text-slate-500 transition-colors"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* CA Firm Name */}
            <div className="mb-4 p-3 bg-slate-50 rounded-xl">
              <p className="text-body-sm text-slate-600">With:</p>
              <p className="text-body-md font-medium text-slate-900">{firmName}</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Consultation Type */}
              <div>
                <label className="block text-body-sm font-medium text-slate-700 mb-2">
                  Consultation Type
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'video', label: 'Video Call', icon: Video },
                    { value: 'phone', label: 'Phone Call', icon: Phone },
                    { value: 'chat', label: 'Chat', icon: MessageSquare },
                  ].map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setConsultationType(type.value)}
                        className={`p-3 border-2 rounded-xl transition-colors flex flex-col items-center gap-2 ${
                          consultationType === type.value
                            ? 'border-gold-500 bg-gold-50'
                            : 'border-slate-300 hover:border-gray-400'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-body-xs font-medium">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Date Selection */}
              <div>
                <label htmlFor="date" className="block text-body-sm font-medium text-slate-700 mb-2">
                  Select Date <span className="text-error-500">*</span>
                </label>
                <input
                  ref={firstInputRef}
                  type="date"
                  id="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={minDate}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                  required
                />
              </div>

              {/* Time Selection */}
              {selectedDate && (
                <div>
                  <label htmlFor="time" className="block text-body-sm font-medium text-slate-700 mb-2">
                    Select Time <span className="text-error-500">*</span>
                  </label>
                  {isLoadingSlots ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gold-500 mx-auto"></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                      {timeSlots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedTime(slot)}
                          className={`p-2 border-2 rounded-xl text-body-sm font-medium transition-colors ${
                            selectedTime === slot
                              ? 'border-gold-500 bg-gold-50 text-gold-700'
                              : 'border-slate-300 hover:border-gray-400'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-body-sm font-medium text-slate-700 mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any specific topics you'd like to discuss..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-body-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bookConsultationMutation.isPending || !selectedDate || !selectedTime}
                  className="px-4 py-2 text-body-sm font-medium text-white bg-gold-500 rounded-xl hover:bg-gold-600 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bookConsultationMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Booking...
                    </>
                  ) : (
                    <>
                      <Calendar className="h-4 w-4 mr-2" />
                      Book Consultation
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CABookingModal;

