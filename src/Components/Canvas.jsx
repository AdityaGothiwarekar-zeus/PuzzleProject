import React, { forwardRef, useEffect, useRef } from "react";
import {
  getParallelogramPath,
  getTrianglePath,
  getHexagonPath,
} from "../Utils";
import "../App.css";

const getSnapOffsets = {
  parallelogram: { x: 85, y: 90 },
  triangle: { x: 97, y: 6 },
  hexagon: { x: 250, y: 150 },
};

const getFillColor = (type) => {
  switch (type) {
    case "parallelogram":
      return "#b36232";
    case "triangle":
      return "#346819";
    case "hexagon":
      return "#2a75a3";
    default:
      return "gray";
  }
};

const Canvas = forwardRef(({ droppedShapes = [] }, ref) => {
  const innerRef = useRef(null);
  const canvasRef = ref || innerRef;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Grid Dots
    const spacing = 50;
    ctx.fillStyle = "blue";
    for (let x = 0; x < canvas.width; x += spacing) {
      for (let y = 0; y < canvas.height; y += spacing) {
        ctx.beginPath();
        ctx.arc(x, y, 1.2, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    const offsetY = 40;
    const shapesMeta = [
      {
        type: "parallelogram",
        path: getParallelogramPath(offsetY),
      },
      {
        type: "triangle",
        path: getTrianglePath(offsetY),
      },
      {
        type: "hexagon",
        path: getHexagonPath(40),
      },
    ];

    for (const { type, path } of shapesMeta) {
      const snap = getSnapOffsets[type];

      const isSnapped = droppedShapes.some(
        (shape) =>
          shape.type === type &&
          shape.rotation === 0 &&
          Math.abs(shape.position.x - snap.x) < 2 &&
          Math.abs(shape.position.y - snap.y) < 2
      );

      ctx.fillStyle = isSnapped ? getFillColor(type) : "rgba(0,0,0,0)";
      ctx.strokeStyle = isSnapped ? getFillColor(type) : "gray";
      ctx.setLineDash(isSnapped ? [] : [5, 5]);
      ctx.lineWidth = 2;

      ctx.fill(path);
      ctx.stroke(path);
    }
  }, [droppedShapes]);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={400}
      className="canvas"
    />
  );
});

export default Canvas;
