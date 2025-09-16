
import React, { createContext, useContext } from "react";
import { motion } from "framer-motion";

const FadeInContext = createContext(false);

const FadeIn = ({ children, className = "", ...props }) => {
  const stagger = useContext(FadeInContext);

  if (stagger) {
    return <>{children}</>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, ease: "easeIn" }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

const FadeInStagger = ({ children }) => {
  return (
    <FadeInContext.Provider value={true}>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.15,
            },
          },
        }}
      >
        {children}
      </motion.div>
    </FadeInContext.Provider>
  );
};

export { FadeIn, FadeInStagger };
