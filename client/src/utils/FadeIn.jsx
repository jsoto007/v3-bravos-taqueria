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

const FadeIn = ({ children, delayStep = 0.3, immediate = true, className = "" }) => {
  const shouldReduceMotion = useReducedMotion();
  const childCount = React.Children.toArray(children).filter(Boolean).length;
  const [shouldAnimate, setShouldAnimate] = React.useState(immediate && childCount > 0);

  React.useEffect(() => {
    if (!immediate && childCount > 0) {
      setShouldAnimate(true);
    }
  }, [childCount, immediate]);

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
        : {
            initial: "hidden",
            animate: shouldAnimate ? "visible" : "hidden",
            viewport: { once: true, amount: 0.2 },
          })}
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
