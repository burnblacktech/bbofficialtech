// =====================================================
// DEADLINES & URGENCY COMPONENTS
// Behavioral psychology-driven deadline components
// =====================================================

import React from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertTriangle, DollarSign, Users } from 'lucide-react';

// Deadline Countdown Component
export const DeadlineCountdown = ({ deadline, onUrgent, ...props }) => {
  const [timeLeft, setTimeLeft] = React.useState({ days: 0, hours: 0, minutes: 0 });
  const [isUrgent, setIsUrgent] = React.useState(false);

  React.useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const deadlineTime = new Date(deadline).getTime();
      const difference = deadlineTime - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

        setTimeLeft({ days, hours, minutes });
        setIsUrgent(days <= 7);

        if (days <= 7 && onUrgent) {
          onUrgent();
        }
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000); // Update every minute
    return () => clearInterval(timer);
  }, [deadline, onUrgent]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`
        p-4 rounded-lg border-2 transition-all duration-300
        ${isUrgent ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}
      `}
      {...props}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Clock className={`w-5 h-5 mr-2 ${isUrgent ? 'text-red-600' : 'text-yellow-600'}`} />
          <div>
            <p className={`font-semibold ${isUrgent ? 'text-red-800' : 'text-yellow-800'}`}>
              {isUrgent ? '⚠️ Urgent: File Now!' : '⏰ Deadline Approaching'}
            </p>
            <p className={`text-sm ${isUrgent ? 'text-red-600' : 'text-yellow-600'}`}>
              {timeLeft.days} days, {timeLeft.hours} hours left to avoid penalty
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-bold ${isUrgent ? 'text-red-600' : 'text-yellow-600'}`}>
            {timeLeft.days}
          </p>
          <p className={`text-xs ${isUrgent ? 'text-red-500' : 'text-yellow-500'}`}>
            days left
          </p>
        </div>
      </div>
    </motion.div>
  );
};

// Refund Estimator Component
export const RefundEstimator = ({ estimatedRefund, onFileNow, ...props }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-green-50 border border-green-200 rounded-lg p-4"
      {...props}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <DollarSign className="w-5 h-5 mr-2 text-green-600" />
          <div>
            <p className="font-semibold text-green-800">Estimated Refund</p>
            <p className="text-sm text-green-600">File today to claim faster</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-green-600">₹{estimatedRefund?.toLocaleString()}</p>
          <button
            onClick={onFileNow}
            className="mt-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
          >
            File Now
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// Social Proof Component
export const SocialProof = ({ stats, ...props }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-blue-50 border border-blue-200 rounded-lg p-4"
      {...props}
    >
      <div className="flex items-center">
        <Users className="w-5 h-5 mr-2 text-blue-600" />
        <div>
          <p className="font-semibold text-blue-800">{stats.users} users filed with us last year</p>
          <p className="text-sm text-blue-600">Join thousands of satisfied customers</p>
        </div>
      </div>
    </motion.div>
  );
};

export default { DeadlineCountdown, RefundEstimator, SocialProof };