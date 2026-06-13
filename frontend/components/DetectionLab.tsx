import { motion } from 'framer-motion';
import { useState } from 'react';
import { useInView } from 'react-intersection-observer';

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

interface DetectionLabProps {
  onFileUpload: (file: File) => void;
  isLoading: boolean;
  result: BatchResult | null;
  error: string | null;
}

const LABEL_META: Record<string, { color: string; badge: string }> = {
  confirmed:      { color: 'bg-emerald-600', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  candidate:      { color: 'bg-amber-500',   badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  false_positive: { color: 'bg-red-600',     badge: 'bg-red-50 text-red-700 border-red-200' },
};

function getLabelMeta(prediction: string) {
  const key = prediction.toLowerCase().replace(' ', '_');
  return LABEL_META[key] ?? { color: 'bg-blue-600', badge: 'bg-blue-50 text-blue-700 border-blue-200' };
}

export default function DetectionLab({ onFileUpload, isLoading, result, error }: DetectionLabProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.endsWith('.csv') && !file.name.endsWith('.json')) {
        alert('Please upload a CSV or JSON file');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (!file.name.endsWith('.csv') && !file.name.endsWith('.json')) {
        alert('Please upload a CSV or JSON file');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleAnalyze = () => { if (selectedFile) onFileUpload(selectedFile); };

  // Summary counts
  const counts = result
    ? result.predictions.reduce((acc, p) => {
        const k = p.prediction.toLowerCase().replace(' ', '_');
        acc[k] = (acc[k] ?? 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    : {};

  return (
    <section id="detection-lab" className="relative py-16 lg:py-24 border-b border-[#E5E7EB] bg-gray-50" ref={ref}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">

        {/* Section Header */}
        <motion.div
          className="text-center mb-12 lg:mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-[#111827]">
            Detection Laboratory
          </h2>
          <p className="text-base sm:text-lg text-gray-500 max-w-3xl mx-auto px-4">
            Upload observation records to evaluate potential exoplanet transit signatures using classification models.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start max-w-6xl mx-auto">

          {/* ── Upload Section ── */}
          <motion.div
            className="bg-white border border-[#E5E7EB] p-6 lg:p-8 rounded-xl shadow-sm w-full"
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-lg font-bold text-gray-900 mb-5 text-center lg:text-left">
              Data Upload Interface
            </h3>

            {/* Drop Zone */}
            <motion.div
              className={`relative border-2 border-dashed rounded-lg p-6 lg:p-8 text-center transition-all duration-200 w-full ${
                dragActive ? 'border-[#1A56DB] bg-[#1A56DB]/5' : 'border-gray-300 hover:border-gray-400 bg-gray-50/50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.1 }}
            >
              <input
                type="file"
                accept=".csv,.json"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              
              {selectedFile ? (
                <div className="py-2">
                  <svg className="w-10 h-10 mx-auto text-[#1A56DB] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm font-semibold text-gray-900 mb-1 truncate max-w-xs mx-auto">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                </div>
              ) : (
                <div className="py-2">
                  <svg className="w-10 h-10 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <p className="text-sm font-semibold text-gray-800 mb-1">Drag &amp; drop target data here</p>
                  <p className="text-xs text-gray-500">or click to browse local files</p>
                </div>
              )}
            </motion.div>

            {/* Format hints */}
            <motion.div
              className="mt-6 p-4 bg-gray-50 border border-[#E5E7EB] rounded-lg"
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.6 }}
            >
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2 text-center lg:text-left">Supported Formats</h4>
              <ul className="text-xs text-gray-600 space-y-1 text-center lg:text-left">
                <li>• CSV: Kepler KOI features (koi_period, koi_prad, etc.)</li>
                <li>• CSV: Normalized light curve flux timeseries</li>
                <li>• JSON: Target metadata or pre-computed structures</li>
              </ul>
            </motion.div>

            {/* Analyze button */}
            {selectedFile && (
              <motion.button
                className="w-full mt-6 py-3 bg-[#1A56DB] hover:bg-[#2563EB] text-white font-semibold rounded-lg shadow-sm text-sm transition-colors"
                onClick={handleAnalyze}
                disabled={isLoading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <motion.div
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2.5"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                    Running Analysis Pipeline…
                  </div>
                ) : (
                  'Run Classification Pipeline'
                )}
              </motion.button>
            )}
          </motion.div>

          {/* ── Results Section ── */}
          <motion.div
            className="space-y-6 w-full"
            initial={{ opacity: 0, x: 20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            {/* Error */}
            {error && (
              <motion.div
                className="p-4 bg-red-50 border border-red-200 rounded-lg"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-0.5">
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-semibold text-red-800">Analysis Error</h3>
                    <p className="text-red-700 text-xs mt-1">{error}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Batch Results */}
            {result && result.predictions.length > 0 && (
              <motion.div
                className="bg-white border border-[#E5E7EB] p-6 lg:p-8 rounded-xl shadow-sm w-full"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
              >
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  Analysis Report
                </h3>
                <p className="text-gray-500 text-xs mb-4">{result.message}</p>

                {/* Summary pills */}
                <div className="flex flex-wrap gap-2.5 mb-5">
                  {Object.entries(counts).map(([label, count]) => {
                    const meta = getLabelMeta(label);
                    return (
                      <span key={label} className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${meta.badge} capitalize`}>
                        {label.replace('_', ' ')}: {count}
                      </span>
                    );
                  })}
                </div>

                {/* Predictions Table */}
                <div className="overflow-x-auto border border-[#E5E7EB] rounded-lg">
                  <table className="min-w-full divide-y divide-[#E5E7EB] text-left">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Row</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Classification</th>
                        <th scope="col" className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Confidence</th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Details</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-[#E5E7EB]">
                      {result.predictions.map((p, i) => {
                        const meta = getLabelMeta(p.prediction);
                        const isOpen = expandedRow === i;
                        return (
                          <React.Fragment key={p.row_index}>
                            <tr 
                              className={`cursor-pointer transition-colors ${
                                isOpen ? 'bg-blue-50/20' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                              } hover:bg-gray-100/50`}
                              onClick={() => setExpandedRow(isOpen ? null : i)}
                            >
                              <td className="px-4 py-3 whitespace-nowrap text-xs font-mono text-gray-500">
                                #{String(p.row_index + 1).padStart(2, '0')}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${meta.badge} capitalize`}>
                                  {p.prediction.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right text-xs font-mono font-semibold text-gray-900">
                                {(p.confidence * 100).toFixed(1)}%
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-center text-xs text-gray-400 font-semibold select-none">
                                {isOpen ? '▲' : '▼'}
                              </td>
                            </tr>
                            
                            {/* Expandable feature importances */}
                            {isOpen && p.explain?.top_features?.length > 0 && (
                              <tr>
                                <td colSpan={4} className="bg-gray-50/60 px-5 py-4 border-t border-[#E5E7EB]">
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">Key Model Decision Factors</p>
                                  <div className="space-y-2 max-w-xl">
                                    {p.explain.top_features.map((f) => (
                                      <div key={f.name} className="flex items-center gap-3">
                                        <span className="text-xs text-gray-600 w-32 truncate shrink-0">{f.name}</span>
                                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                          <div
                                            className={`h-full ${meta.color}`}
                                            style={{ width: `${(f.value * 100).toFixed(1)}%` }}
                                          />
                                        </div>
                                        <span className="text-xs font-mono text-gray-500 w-10 text-right shrink-0">
                                          {(f.value * 100).toFixed(1)}%
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* Idle state */}
            {!result && !error && !isLoading && (
              <motion.div
                className="bg-white border border-[#E5E7EB] p-8 text-center w-full rounded-xl shadow-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364.364l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Pipeline Idle</h3>
                <p className="text-gray-500 text-xs max-w-xs mx-auto">
                  Upload space observatory datasets to begin target evaluations.
                </p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

import React from 'react';

