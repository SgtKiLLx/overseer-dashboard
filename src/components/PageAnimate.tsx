"use client";
import { motion } from "framer-motion";

export default function PageAnimate({ children, id }: { children: React.ReactNode, id: string }) {
  return (
    <motion.div
      key={id}
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
