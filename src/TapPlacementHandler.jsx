// TapPlacementHandler.jsx
import { useEffect } from "react";
import { getParallelogramPath, getTrianglePath } from "./Utils.js";

export default function TapPlacementHandler({
  canvasRef,
  selectedShape,
  setSelectedShape,
  setPosParallelogram,
  setPosTriangle,
  isParallelogramDropped,
  isTriangleDropped,
//   posParallelogram,
//   posTriangle,
  rotationParallelogram,
  rotationTriangle,
  setIsParallelogramDropped,
  setIsTriangleDropped,
  setAnimateParallelogram,
  setAnimateTriangle,
  CORRECT_ROTATION_PARALLELOGRAM,
  CORRECT_ROTATION_TRIANGLE,
  ROTATION_TOLERANCE
}) {
  useEffect(() => {
    const handleCanvasClick = (e) => {
      if (!selectedShape || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const ctx = canvas.getContext("2d");
      const offsetY = 40;

      // Check if clicking on the correct target area for the selected shape
      if (selectedShape === "parallelogram" && !isParallelogramDropped) {
        const path = getParallelogramPath(offsetY);
        const isInside = ctx.isPointInPath(path, mouseX, mouseY);
        const isCorrectRotation = Math.abs(rotationParallelogram - CORRECT_ROTATION_PARALLELOGRAM) <= ROTATION_TOLERANCE;

        if (isInside && isCorrectRotation) {
          // Snap to correct position with animation
          setIsParallelogramDropped(true);
          setAnimateParallelogram(true);
          setPosParallelogram({ x: rect.left + 80, y: rect.top + 90 });
        } else {
          // Place at clicked position
          setPosParallelogram({ 
            x: rect.left + mouseX - 50, // Center the shape on click point
            y: rect.top + mouseY - 50 
          });
        }
      } else if (selectedShape === "triangle" && !isTriangleDropped) {
        const path = getTrianglePath(offsetY);
        const isInside = ctx.isPointInPath(path, mouseX, mouseY);
        const isCorrectRotation = Math.abs(rotationTriangle - CORRECT_ROTATION_TRIANGLE) <= ROTATION_TOLERANCE;

        if (isInside && isCorrectRotation) {
          // Snap to correct position with animation
          setIsTriangleDropped(true);
          setAnimateTriangle(true);
          setPosTriangle({ x: rect.left + 80, y: rect.top + 70 });
        } else {
          // Place at clicked position
          setPosTriangle({ 
            x: rect.left + mouseX - 50, // Center the shape on click point
            y: rect.top + mouseY - 50 
          });
        }
      }

      // Deselect shape after placement
      setSelectedShape(null);
    };

    if (canvasRef.current) {
      canvasRef.current.addEventListener("click", handleCanvasClick);
    }

    return () => {
      if (canvasRef.current) {
        canvasRef.current.removeEventListener("click", handleCanvasClick);
      }
    };
  }, [
    selectedShape,
    canvasRef,
    setPosParallelogram,
    setPosTriangle,
    setSelectedShape,
    isParallelogramDropped,
    isTriangleDropped,
    rotationParallelogram,
    rotationTriangle,
    setIsParallelogramDropped,
    setIsTriangleDropped,
    setAnimateParallelogram,
    setAnimateTriangle,
    CORRECT_ROTATION_PARALLELOGRAM,
    CORRECT_ROTATION_TRIANGLE,
    ROTATION_TOLERANCE
  ]);

  return null; // This component doesn't render anything
}