import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MainContent = ({ children, activeTab }) => {
  return (
    <div className="flex-1 overflow-hidden bg-gray-50">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="h-full overflow-y-auto"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default MainContent;