"use client";

import { useState, useCallback, useEffect } from "react";

const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!<>-_\\/[]{}—=+*^?#_";

export const useScramble = (finalString: string, duration: number = 1000, delay: number = 0) => {
  const [text, setText] = useState("");

  const scramble = useCallback(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const progress = (now - start) / duration;
      if (progress >= 1) {
        setText(finalString);
        clearInterval(interval);
        return;
      }

      const scrambled = finalString
        .split("")
        .map((char, index) => {
          if (char === " " || char === "\n") return char;
          if (progress > index / finalString.length) return char;
          return chars[Math.floor(Math.random() * chars.length)];
        })
        .join("");
      setText(scrambled);
    }, 30);
  }, [finalString, duration]);

  useEffect(() => {
    const timer = setTimeout(() => {
      scramble();
    }, delay);
    return () => clearTimeout(timer);
  }, [scramble, delay]);

  return text;
};
