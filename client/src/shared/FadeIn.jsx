import React from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * FadeIn
 *
 * Props:
 *  - delayStep: number (stagger between children)
 *  - immediate: boolean (if true, animate on mount instead of waiting for viewport)
 *  - className: string (optional passthrough classes)
 *
 * Behavior:
 *  - When `immediate` is true, uses initial/animate so elements are visible immediately.
 *  - When `immediate` is false (default), uses whileInView with once=true for perf.
 */
const FadeIn = ({ children, delayStep = 0.3, immediate = false, className = "" }) => {
  const shouldReduceMotion = useReducedMotion();

  const container = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: delayStep, // controls the spacing between each child animation
      },
    },
  };

  const childVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }, // smooth fade/slide in
    },
  };

  return (
    <motion.div
      variants={container}
      {...(immediate
        ? { initial: "hidden", animate: "visible" }
        : { initial: "hidden", whileInView: "visible", viewport: { once: true, margin: "0px 0px -100px" } })}
      className={`w-full ${className}`}
    >
      {React.Children.map(children, (child, index) =>
        React.isValidElement(child) ? (
          <motion.div variants={childVariants} key={child.key ?? index}>
            {child}
          </motion.div>
        ) : (
          <motion.div variants={childVariants} key={index}>
            {child}
          </motion.div>
        )
      )}
    </motion.div>
  );
};

export default FadeIn;