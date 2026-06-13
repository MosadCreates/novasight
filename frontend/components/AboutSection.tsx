import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

export default function AboutSection() {
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true });

  const features = [
    {
      num: '01',
      title: 'Statistical Learning Pipelines',
      description: 'Fully connected and convolutional neural network models trained on Kepler Data Release 25 transit profiles to analyze light curves.'
    },
    {
      num: '02',
      title: 'Batch Signature Parsing',
      description: 'Processes large-scale multi-target tables and yields instantaneous predictions, confidence indices, and classification reports.'
    },
    {
      num: '03',
      title: 'Exoplanet Archive Baseline',
      description: 'Integrated directly with targets sourced from the NASA Exoplanet Archive to cross-reference classifications against ground truth.'
    },
    {
      num: '04',
      title: 'Explainable AI Decision Paths',
      description: 'Identifies feature attribution (e.g. transit duration, depth, impact parameter) to evaluate prediction validity and model transparency.'
    }
  ];

  return (
    <section id="about" className="relative py-20 lg:py-24 bg-white border-b border-[#E5E7EB]" ref={ref}>
      {/* Grid Background */}
      <div className="absolute inset-0 grid-bg opacity-30" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
        {/* Section Header */}
        <motion.div 
          className="text-center mb-12 lg:mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-[#111827]">
            System Architecture &amp; Methodology
          </h2>
          <p className="text-base sm:text-lg text-gray-500 max-w-3xl mx-auto leading-relaxed px-4">
            The NovaSight platform bridges astronomical observations and data science, delivering robust classification of exoplanetary transit signals.
          </p>
        </motion.div>

        {/* Statistics */}
        <motion.div 
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-16 max-w-5xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          {[
            { label: 'Verified Discovered Targets', value: '5,000+' },
            { label: 'Evaluated Observatory Curves', value: '200K+' },
            { label: 'Model Validation F1-Score', value: '94.2%' },
            { label: 'Active Observatory Inputs', value: '3' }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              className="text-center bg-gray-50 border border-[#E5E7EB] p-5 lg:p-6 rounded-xl shadow-sm"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              whileHover={{ scale: 1.01 }}
            >
              <div className="text-xl lg:text-2xl font-bold text-[#1A56DB] mb-1">{stat.value}</div>
              <div className="text-xs lg:text-sm text-gray-500 font-medium leading-tight">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Features Grid */}
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 mb-16 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="bg-white border border-[#E5E7EB] p-6 lg:p-8 rounded-xl shadow-sm w-full"
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.05 }}
              whileHover={{ scale: 1.01 }}
            >
              <div className="flex items-start space-x-4">
                <div className="text-xs font-mono font-bold text-[#1A56DB] bg-blue-50 px-2.5 py-1 rounded border border-blue-100 flex-shrink-0">
                  {feature.num}
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-500 leading-relaxed text-sm">
                    {feature.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Technology Stack */}
        <motion.div 
          className="text-center max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6">Pipeline Integration</h3>
          <div className="flex flex-wrap justify-center items-center gap-3 lg:gap-4">
            {[
              'TensorFlow',
              'NASA Exoplanet Archive',
              'Kepler Mission Data',
              'FastAPI',
              'Next.js',
              'Docker'
            ].map((tech, index) => (
              <motion.div
                key={tech}
                className="flex items-center space-x-1.5 bg-gray-50 border border-[#E5E7EB] px-3.5 py-1.5 rounded-full"
                whileHover={{ scale: 1.03 }}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.4, delay: index * 0.03 }}
              >
                <span className="text-xs font-semibold text-gray-700">{tech}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
