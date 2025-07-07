import React, { forwardRef, useRef, useEffect } from "react";
import { getParallelogramPath, getTrianglePath } from "../Utils"

const Canvas = forwardRef(({ isDropped, isTriangleDropped }, ref) => {
  const innerRef = useRef(null);
  const canvasRef = ref || innerRef;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const offsetY = 40;

    const clearAndDrawBaseShapes = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = "gray";
      ctx.lineWidth = 2;

      // Draw parallelogram outline
      const parallelogramPath = getParallelogramPath(offsetY);
      ctx.stroke(parallelogramPath);

      // Draw triangle outline
      const trianglePath = getTrianglePath(offsetY);
      ctx.stroke(trianglePath);
    };

    clearAndDrawBaseShapes();

    if (isDropped) {
      const parallelogramPath = getParallelogramPath(offsetY);
      ctx.fillStyle = "rgba(74, 222, 128, 0.3)";
      ctx.fill(parallelogramPath);
      ctx.setLineDash([]);
      ctx.strokeStyle = "brown";
      ctx.stroke(parallelogramPath);
    }

    if (isTriangleDropped) {
      const trianglePath = getTrianglePath(offsetY);
      ctx.fillStyle = "rgba(74, 222, 128, 0.3)";
      ctx.fill(trianglePath);
      ctx.setLineDash([]);
      ctx.strokeStyle = "brown";
      ctx.stroke(trianglePath);
    }
  }, [isDropped, isTriangleDropped, canvasRef]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={300}
      className="canvas"
    />
  );
});

export default Canvas;
