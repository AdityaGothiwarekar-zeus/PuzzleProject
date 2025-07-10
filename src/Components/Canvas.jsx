import React, { forwardRef, useEffect, useRef } from "react";
import {
  getParallelogramPath,
  getTrianglePath,
  getHexagonPath,
} from "../Utils";
import "../App.css";

/**
 * Predefined snap positions for each shape type.
 * Used to check if a dropped shape aligns correctly.
 */
const getSnapOffsets = {
  parallelogram: { x: 85, y: 90 },
  triangle: { x: 97, y: 6 },
  hexagon: { x: 250, y: 150 },
};

/**
 * Returns the fill color for a shape based on its type.
 * @param {string} type - The shape type ("parallelogram", "triangle", "hexagon")
 * @returns {string} - Corresponding color code
 */
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

/**
 * Canvas component for drawing shape outlines and highlighting snapped shapes.
 *
 * @param {Array} droppedShapes - List of dropped shape objects with properties:
 *   - type: string ("parallelogram", "triangle", "hexagon")
 *   - position: { x: number, y: number }
 *   - rotation: number (in degrees, 0 means no rotation)
 * @param {React.Ref} ref - Optional forwarded ref for the canvas element
 */
const Canvas = forwardRef(({ droppedShapes = [] }, ref) => {
  const innerRef = useRef(null);
  const canvasRef = ref || innerRef; // Support external ref or fallback to local one

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Clear previous drawing
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Base vertical offset to separate shapes visually
    const offsetY = 40;

    /**
     * Define each shape with a path function.
     * These functions return Path2D objects that describe the shape's geometry.
     */
    const shapesMeta = [
      {
        type: "parallelogram",
        path: getParallelogramPath(offsetY), // Apply vertical offset
      },
      {
        type: "triangle",
        path: getTrianglePath(offsetY), // Apply vertical offset
      },
      {
        type: "hexagon",
        path: getHexagonPath(40), // Radius only for hexagon
      },
    ];

    // Draw each shape outline on the canvas
    for (const { type, path } of shapesMeta) {
      const snap = getSnapOffsets[type];

      // Check if a matching sh   ape is "snapped" at the expected position
      const isSnapped = droppedShapes.some(
        (shape) =>
          shape.type === type &&
          shape.rotation === 0 &&
          Math.abs(shape.position.x - snap.x) < 2 &&
          Math.abs(shape.position.y - snap.y) < 2
      );

      // Use solid color if snapped, otherwise transparent fill and dashed outline
      ctx.fillStyle = isSnapped ? getFillColor(type) : "rgba(0,0,0,0)";
      ctx.strokeStyle = isSnapped ? getFillColor(type) : "gray";
      ctx.setLineDash(isSnapped ? [] : [5, 5]); // Dashed if not snapped
      ctx.lineWidth = 2;

      ctx.fill(path);   // Fill shape if snapped
      ctx.stroke(path); // Outline always drawn
    }
  }, [droppedShapes]); // Re-render shapes when droppedShapes change

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={300}
      className="canvas"
      // Optional inline styles can be added here
      // style={{ background: "#fff", left: "20px" }}
    />
  );
});

export default Canvas;
