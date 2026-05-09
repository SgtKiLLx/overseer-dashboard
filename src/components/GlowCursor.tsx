"use client";
import { useEffect, useState } from "react";
import { motion, useSpring } from "framer-motion";

export default function GlowCursor() {
  const mouseX = useSpring(0, { stiffness: 500, damping: 50 });
  const mouseY = useSpring(0, { stiffness: 500, damping: 50 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-30 hidden lg:block"
      style={{
        background: `radial-gradient(600px circle at var(--x) var(--y), rgba(0, 255, 255, 0.06), transparent 40%)`,
      }}
    >
      <motion.div
        className="absolute h-full w-full"
        style={{ x: mouseX, y: mouseY }}
      />
    </motion.div>
  );
}
