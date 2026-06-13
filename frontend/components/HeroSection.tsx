import { motion } from 'framer-motion';

export default function HeroSection() {
  return (
    <section className="relative py-20 lg:py-32 flex items-center justify-center overflow-hidden border-b border-[#E5E7EB] bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-5xl">
        <div className="flex flex-col items-center justify-center">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mb-6 w-full"
          >
            <h1 
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#111827] mb-4"
            >
              NovaSight — Exoplanet Classification Platform
            </h1>
            
            <motion.h2 
              className="text-lg sm:text-xl font-medium text-[#6B7280]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Advanced Machine Learning for Transit Data Analysis
            </motion.h2>
          </motion.div>

          <motion.p 
            className="text-base sm:text-lg text-gray-500 max-w-3xl mx-auto mb-10 leading-relaxed px-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Identify and analyze candidate signals in Kepler, K2, and TESS datasets using pre-trained neural network architectures. Receive instant classifications, confidence ratings, and model feature importances.
          </motion.p>

          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-md mx-auto"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <motion.button
              className="w-full sm:w-auto px-6 py-3 bg-[#1A56DB] hover:bg-[#2563EB] text-white font-semibold rounded-lg shadow-sm text-sm transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => document.getElementById('detection-lab')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Open Detection Lab
            </motion.button>
            
            <motion.button
              className="w-full sm:w-auto px-6 py-3 border border-[#E5E7EB] hover:bg-gray-50 text-gray-700 font-semibold rounded-lg shadow-sm text-sm transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
            >
              View Documentation
            </motion.button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
