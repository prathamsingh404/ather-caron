"use client";

import React, { useEffect, useRef } from "react";

const HeroCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let width: number, height: number;
    type NodeData = {
      ox: number;
      oy: number;
      oz: number;
      color: string;
      radius: number;
      seed: number;
    };
    let nodes: NodeData[] = [];
    let rotationAngle = 0;
    let mouseX = 0;
    let mouseY = 0;

    const colorPalette = [
      { c: "#22c55e", weight: 0.4 }, // Primary Green
      { c: "#3b82f6", weight: 0.2 }, // Blue
      { c: "#f59e0b", weight: 0.15 }, // Amber
      { c: "#10b981", weight: 0.15 }, // Emerald
      { c: "#94a3b8", weight: 0.1 }, // Slate
    ];

    const getRandomColor = () => {
      const r = Math.random();
      let sum = 0;
      for (const p of colorPalette) {
        sum += p.weight;
        if (r <= sum) return p.c;
      }
      return colorPalette[0].c;
    };

    const resizeCanvas = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    const initNodes = () => {
      nodes = [];
      const numNodes = 130;
      const clusterCenters = [
        { x: 200, y: -100, z: 100 },
        { x: -250, y: 150, z: -50 },
        { x: 0, y: -200, z: -200 },
        { x: 300, y: 200, z: 150 },
        { x: -150, y: -250, z: 200 },
        { x: 100, y: 300, z: -100 },
      ];

      for (let i = 0; i < numNodes; i++) {
        const cluster =
          clusterCenters[Math.floor(Math.random() * clusterCenters.length)];
        const spread = 180;
        nodes.push({
          ox: cluster.x + (Math.random() - 0.5) * spread,
          oy: cluster.y + (Math.random() - 0.5) * spread,
          oz: cluster.z + (Math.random() - 0.5) * spread,
          color: getRandomColor(),
          radius: 1 + Math.random() * 4,
          seed: Math.random() * 100,
        });
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    const drawGraph = () => {
      // Clear with background color (hardcoded since it's on canvas)
      // We'll use a slightly dynamic color if possible, but slate-50 is #f8fafc
      const isDark = document.documentElement.classList.contains("dark");
      ctx.fillStyle = isDark ? "#0f172a" : "#f8fafc";
      ctx.fillRect(0, 0, width, height);

      rotationAngle += 0.0008;
      const focalLength = 1000;
      const cx = width / 2;
      const cy = height / 2;

      type ProjectedNode = {
        x: number;
        y: number;
        z: number;
        scale: number;
        node: NodeData;
      };
      const projectedNodes: ProjectedNode[] = [];
      const time = Date.now() * 0.001;

      nodes.forEach((node) => {
        let y = node.oy + Math.sin(time * 0.4 + node.seed) * 15;
        let x =
          node.ox * Math.cos(rotationAngle) - node.oz * Math.sin(rotationAngle);
        const z =
          node.oz * Math.cos(rotationAngle) + node.ox * Math.sin(rotationAngle);

        x -= mouseX * (z + focalLength) * 0.02;
        y -= mouseY * (z + focalLength) * 0.02;

        const scale = focalLength / (focalLength + z);
        const x2d = x * scale + cx;
        const y2d = y * scale + cy;

        projectedNodes.push({ x: x2d, y: y2d, z, scale, node });
      });

      projectedNodes.sort((a, b) => b.z - a.z);

      ctx.globalCompositeOperation = "source-over";
      ctx.lineWidth = 0.5;
      for (let i = 0; i < projectedNodes.length; i++) {
        for (let j = i + 1; j < projectedNodes.length; j++) {
          const p1 = projectedNodes[i];
          const p2 = projectedNodes[j];
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (dist < 70 * p1.scale) {
            const alpha =
              (1 - dist / (70 * p1.scale)) * 0.15 * Math.min(1, p1.scale);
            ctx.strokeStyle = isDark
              ? `rgba(148, 163, 184, ${alpha})`
              : `rgba(156, 163, 175, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      projectedNodes.forEach((p) => {
        if (p.z > -focalLength) {
          const breathe = 0.92 + 0.08 * Math.sin(time * 0.6 + p.node.seed);
          const r = p.node.radius * p.scale * breathe;

          if (r > 0.1) {
            const fogZ = 500;
            let alpha = 1;
            if (p.z > fogZ) alpha = Math.max(0, 1 - (p.z - fogZ) / 500);

            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
            ctx.fillStyle = p.node.color;
            ctx.fill();
          }
        }
      });

      ctx.globalAlpha = 1;
      requestAnimationFrame(drawGraph);
    };

    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("mousemove", handleMouseMove);
    resizeCanvas();
    initNodes();
    const animId = requestAnimationFrame(drawGraph);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0 w-full h-full pointer-events-auto opacity-100"
    />
  );
};

export default HeroCanvas;
