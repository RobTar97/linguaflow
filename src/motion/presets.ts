import type { Variants } from "framer-motion";

export const motionEase = [0.23, 1, 0.32, 1] as const;

export const contentListVariants: Variants = {
  hidden: {},
  visible: {},
};

export function contentItemVariants(
  reduceMotion: boolean,
  index = 0,
): Variants {
  return {
    hidden: {
      opacity: 0,
      transform: reduceMotion ? "none" : "translateY(8px)",
    },
    visible: {
      opacity: 1,
      transform: "none",
      transition: {
        duration: reduceMotion ? 0.12 : 0.2,
        delay: reduceMotion ? 0 : Math.min(index, 7) * 0.035,
        ease: motionEase,
      },
    },
    exit: {
      opacity: 0,
      transform: reduceMotion ? "none" : "scale(0.98)",
      transition: { duration: reduceMotion ? 0.1 : 0.16, ease: motionEase },
    },
  };
}

export function questionVariants(reduceMotion: boolean): Variants {
  return {
    hidden: {
      opacity: 0,
      transform: reduceMotion ? "none" : "translateY(8px)",
    },
    visible: {
      opacity: 1,
      transform: "none",
      transition: { duration: reduceMotion ? 0.12 : 0.18, ease: motionEase },
    },
    exit: {
      opacity: 0,
      transform: reduceMotion ? "none" : "translateY(-7px)",
      transition: { duration: reduceMotion ? 0.1 : 0.14, ease: motionEase },
    },
  };
}
