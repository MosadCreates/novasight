import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, signup, clearError } = useAuth();

  // Update mode when initialMode changes
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setPassword('');
      setFullName('');
      setLocalError(null);
      clearError();
    }
  }, [isOpen, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await signup(email, password, fullName);
      }
      onClose(); // Close modal on success
    } catch (err: any) {
      setLocalError(err.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setLocalError(null);
    clearError();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white border border-[#E5E7EB] rounded-xl p-8 w-full max-w-md shadow-2xl relative"
              initial={{ scale: 0.96, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 10 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Title */}
              <div className="text-center mb-6">
                <motion.h2
                  className="text-2xl font-bold text-gray-900 mb-1.5"
                  key={mode}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {mode === 'login' ? 'Account Authentication' : 'Create Platform Account'}
                </motion.h2>
                <p className="text-sm text-gray-500">
                  {mode === 'login' 
                    ? 'Sign in to access your detection history' 
                    : 'Start your exoplanet detection queries'}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg focus:border-[#1A56DB] focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/15 transition-all text-sm text-gray-950 placeholder-gray-400"
                      placeholder="John Doe"
                    />
                  </motion.div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg focus:border-[#1A56DB] focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/15 transition-all text-sm text-gray-950 placeholder-gray-400"
                    placeholder="name@organization.edu"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg focus:border-[#1A56DB] focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/15 transition-all text-sm text-gray-950 placeholder-gray-400"
                    placeholder="••••••••"
                  />
                  {mode === 'signup' && (
                    <p className="mt-1.5 text-[10px] text-gray-500 leading-tight">
                      Must be at least 8 characters with uppercase, lowercase, and number
                    </p>
                  )}
                </div>

                {/* Error Message */}
                <AnimatePresence>
                  {localError && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs"
                    >
                      {localError}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-[#1A56DB] hover:bg-[#2563EB] rounded-lg font-semibold text-white text-sm shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={!isSubmitting ? { scale: 1.01 } : {}}
                  whileTap={!isSubmitting ? { scale: 0.99 } : {}}
                >
                  {isSubmitting 
                    ? (mode === 'login' ? 'Authenticating...' : 'Registering Account...') 
                    : (mode === 'login' ? 'Sign In' : 'Register Account')}
                </motion.button>
              </form>

              {/* Switch Mode */}
              <div className="mt-5 text-center">
                <p className="text-gray-500 text-xs">
                  {mode === 'login' ? "New user? " : "Already registered? "}
                  <button
                    onClick={switchMode}
                    className="text-[#1A56DB] hover:text-[#2563EB] font-bold transition-colors"
                  >
                    {mode === 'login' ? 'Create an account' : 'Sign in to account'}
                  </button>
                </p>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

