import React from "react";
import { motion, useReducedMotion } from "framer-motion";

const FadeIn = ({ children, delayStep = 0.32 }) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "0px 0px -100px" }}
      transition={{ staggerChildren: delayStep }}
      className="w-full"
    >
      {React.Children.map(children, (child, i) => (
        <motion.div
          variants={{
            hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 24 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.6, delay: i * delayStep }}
          className="animate-fadeIn"
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

export default FadeIn;