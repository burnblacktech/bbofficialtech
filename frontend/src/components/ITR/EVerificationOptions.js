// =====================================================
// E-VERIFICATION OPTIONS COMPONENT
// Display available verification methods
// =====================================================

import { motion } from 'framer-motion';
import {
  Smartphone,
  Building2,
  Key,
  Send,
  ChevronRight,
  Star,
  Clock,
} from 'lucide-react';

const VERIFICATION_METHODS = [
  {
    id: 'aadhaar',
    title: 'Aadhaar OTP',
    description: 'Verify using OTP sent to your Aadhaar-linked mobile number',
    icon: Smartphone,
    iconBg: 'bg-success-100',
    iconColor: 'text-success-600',
    recommended: true,
    estimatedTime: '2 minutes',
    features: ['Instant verification', 'Most popular', 'Linked to Aadhaar'],
  },
  {
    id: 'netbanking',
    title: 'Net Banking',
    description: 'Verify through your bank\'s net banking portal',
    icon: Building2,
    iconBg: 'bg-info-100',
    iconColor: 'text-info-600',
    recommended: false,
    estimatedTime: '5 minutes',
    features: ['Bank login required', 'Secure', 'No OTP needed'],
  },
  {
    id: 'dsc',
    title: 'Digital Signature (DSC)',
    description: 'Sign using your registered Digital Signature Certificate',
    icon: Key,
    iconBg: 'bg-ember-100',
    iconColor: 'text-ember-600',
    recommended: false,
    estimatedTime: '3 minutes',
    features: ['For professionals', 'Hardware token required', 'Most secure'],
  },
  {
    id: 'physical',
    title: 'Physical ITR-V',
    description: 'Send signed ITR-V to CPC Bangalore via Speed Post',
    icon: Send,
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600',
    recommended: false,
    estimatedTime: '15-30 days',
    features: ['No digital verification', 'Postal delivery', '120 days deadline'],
  },
];

const EVerificationOptions = ({ onSelect }) => {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">
        Choose Verification Method
      </h2>

      <div className="space-y-3">
        {VERIFICATION_METHODS.map((method, index) => {
          const Icon = method.icon;

          return (
            <motion.button
              key={method.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onSelect(method.id)}
              className={`w-full text-left bg-white rounded-2xl shadow-card border-2 p-4 hover:shadow-card-hover hover:border-primary-200 transition-all group ${
                method.recommended ? 'border-primary-200' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`w-12 h-12 ${method.iconBg} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
                  <Icon className={`w-6 h-6 ${method.iconColor}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-900">{method.title}</h3>
                    {method.recommended && (
                      <span className="flex items-center gap-1 text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-medium">
                        <Star className="w-3 h-3" />
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mb-2 line-clamp-2">
                    {method.description}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {method.estimatedTime}
                    </span>
                    <span className="hidden sm:inline">•</span>
                    <span className="hidden sm:flex items-center gap-2">
                      {method.features.slice(0, 2).map((feature) => (
                        <span key={feature} className="bg-slate-100 px-2 py-0.5 rounded">
                          {feature}
                        </span>
                      ))}
                    </span>
                  </div>
                </div>

                {/* Arrow */}
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Help text */}
      <p className="text-xs text-slate-500 text-center mt-4">
        E-verification is mandatory. Choose the method that works best for you.
      </p>
    </div>
  );
};

export default EVerificationOptions;
