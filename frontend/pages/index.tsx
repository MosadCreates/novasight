import { useState, useEffect } from 'react';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import HeroSection from '../components/HeroSection';
import DetectionLab from '../components/DetectionLab';
import AboutSection from '../components/AboutSection';

interface FeatureImportance {
  name: string;
  value: number;
}

interface SinglePrediction {
  row_index: number;
  prediction: string;
  confidence: number;
  explain: { top_features: FeatureImportance[] };
}

interface BatchResult {
  message: string;
  rows_processed: number;
  predictions: SinglePrediction[];
}

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BatchResult | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/predict/batch', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Server responded with ${response.status}`);
      }

      const data: BatchResult = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Unexpected error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>NovaSight | NASA Space Apps</title>
        <meta name="description" content="Advanced machine learning system for detecting exoplanets using NASA space telescope data" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="relative bg-[#F8F9FA] text-[#111827] min-h-screen">
        
        {/* Navigation */}
        <motion.nav 
          className="fixed top-0 left-0 right-0 z-50 bg-[#F8F9FA]/90 backdrop-blur-md border-b border-[#E5E7EB]"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="flex items-center justify-between py-4">
              <motion.div 
                className="flex items-center space-x-2"
                whileHover={{ scale: 1.02 }}
              >
                <div className="text-lg lg:text-xl font-bold tracking-tight text-[#111827]">
                  NovaSight
                </div>
              </motion.div>
              
              <div className="hidden sm:flex items-center space-x-4 lg:space-x-6">
                <motion.a 
                  href="#detection-lab"
                  className="text-[#6B7280] hover:text-[#1A56DB] transition-colors font-medium text-sm lg:text-base"
                  whileHover={{ scale: 1.02 }}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('detection-lab')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Detection Lab
                </motion.a>
                <motion.a 
                  href="#about"
                  className="text-[#6B7280] hover:text-[#1A56DB] transition-colors font-medium text-sm lg:text-base"
                  whileHover={{ scale: 1.02 }}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  About
                </motion.a>
                
              </div>
              
              {/* Mobile Menu Button */}
              <div className="sm:hidden">
                <motion.button
                  className="text-gray-300 hover:text-cyan-400 transition-colors"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  <div className="w-6 h-6 flex flex-col justify-center items-center">
                    <motion.span 
                      className="w-4 h-0.5 bg-current mb-1"
                      animate={mobileMenuOpen ? { rotate: 45, y: 4 } : { rotate: 0, y: 0 }}
                    ></motion.span>
                    <motion.span 
                      className="w-4 h-0.5 bg-current mb-1"
                      animate={mobileMenuOpen ? { opacity: 0 } : { opacity: 1 }}
                    ></motion.span>
                    <motion.span 
                      className="w-4 h-0.5 bg-current"
                      animate={mobileMenuOpen ? { rotate: -45, y: -4 } : { rotate: 0, y: 0 }}
                    ></motion.span>
                  </div>
                </motion.button>
              </div>
            </div>
          </div>
          
          {/* Mobile Menu Dropdown */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                className="sm:hidden bg-white border-t border-[#E5E7EB] shadow-lg"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="container mx-auto px-4 py-4 space-y-3">
                  <motion.a
                    href="#detection-lab"
                    className="block py-2 text-gray-700 hover:text-[#1A56DB] transition-colors font-medium"
                    whileTap={{ scale: 0.98 }}
                    onClick={(e) => {
                      e.preventDefault();
                      setMobileMenuOpen(false);
                      document.getElementById('detection-lab')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    Detection Lab
                  </motion.a>
                  <motion.a
                    href="#about"
                    className="block py-2 text-gray-700 hover:text-[#1A56DB] transition-colors font-medium"
                    whileTap={{ scale: 0.98 }}
                    onClick={(e) => {
                      e.preventDefault();
                      setMobileMenuOpen(false);
                      document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    About
                  </motion.a>
                  

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.nav>

        {/* Main Content */}
        <main className="relative z-10">
          {/* Hero Section */}
          <HeroSection />

          {/* Detection Lab Section */}
          <DetectionLab 
            onFileUpload={handleFileUpload}
            isLoading={isLoading}
            result={result}
            error={error}
          />

          {/* About Section */}
          <AboutSection />
        </main>

        {/* Footer */}
        <motion.footer 
          className="relative z-10 py-8 lg:py-12 border-t border-[#E5E7EB] bg-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl text-center">
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-6 mb-6">
              <div className="text-center sm:text-left">
                <h3 className="text-lg font-semibold text-[#111827]">NASA Space Apps Challenge 2024</h3>
                <p className="text-gray-500 text-sm">NovaSight System</p>
              </div>
            </div>
            
            <p className="text-gray-500 mb-6 text-sm px-4">
              Designed for research and analysis of space observatory datasets.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-4 lg:space-x-8 text-xs lg:text-sm text-gray-500 font-medium">
              <span>NASA Exoplanet Archive</span>
              <span className="hidden sm:inline">•</span>
              <span>Kepler Mission Data</span>
              <span className="hidden sm:inline">•</span>
              <span>TESS Observatory</span>
            </div>
          </div>
        </motion.footer>
        
      </div>
    </>
  );
}

