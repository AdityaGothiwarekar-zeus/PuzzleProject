import React, { forwardRef, useEffect, useRef } from "react";
import { getParallelogramPath, getTrianglePath } from "../Utils";

const Canvas = forwardRef(({ placedShapeTypes = [] }, ref) => {
  const innerRef = useRef(null);
  const canvasRef = ref || innerRef;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const offsetY = 40;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // ------ PARALLELOGRAM ------
const parallelogramPath = getParallelogramPath(offsetY);

ctx.fillStyle = placedShapeTypes.includes("parallelogram") ? "#b36232" : "rgba(0,0,0,0)";
ctx.fill(parallelogramPath);

ctx.strokeStyle = placedShapeTypes.includes("parallelogram") ? "#b36232" : "gray";
ctx.setLineDash(placedShapeTypes.includes("parallelogram") ? [] : [5, 5]);
ctx.lineWidth = 2;
ctx.stroke(parallelogramPath);

// ------ TRIANGLE ------
const trianglePath = getTrianglePath(offsetY);

ctx.fillStyle = placedShapeTypes.includes("triangle") ? "#346819" : "rgba(0,0,0,0)";
ctx.fill(trianglePath);

ctx.strokeStyle = placedShapeTypes.includes("triangle") ? "#346819" : "gray";
ctx.setLineDash(placedShapeTypes.includes("triangle") ? [] : [5, 5]);
ctx.stroke(trianglePath);


  }, [placedShapeTypes, canvasRef]);

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
