"use client";

import { useRef } from "react";

type Props = {
  className?: string;
  children: React.ReactNode;
};

export default function SpotlightCard({ className, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      onMouseMove={(event) => {
        const node = ref.current;
        if (!node) return;
        const rect = node.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        node.style.setProperty("--mouse-x", `${x}px`);
        node.style.setProperty("--mouse-y", `${y}px`);
      }}
      className={`spotlight-card ${className ?? ""}`}
    >
      <div className="spotlight-content">{children}</div>
    </div>
  );
}

