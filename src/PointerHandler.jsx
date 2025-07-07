// Components/PointerHandler.jsx
import { useEffect } from "react";

export default function PointerHandler({
  canvasRef,
  draggingShape,
  setDraggingShape,
  dragStart,
  setDragStart,
  posParallelogram,
  setPosParallelogram,
  posTriangle,
  setPosTriangle,
  onDropValidate,
}) {
  useEffect(() => {
    const handlePointerMove = (e) => {
      if (!draggingShape) return;

      const newPos = {
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      };

      if (draggingShape === "parallelogram") {
        setPosParallelogram(newPos);
      } else if (draggingShape === "triangle") {
        setPosTriangle(newPos);
      }
    };

    const handlePointerUp = (e) => {
      if (!draggingShape || !canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (onDropValidate) {
        onDropValidate(draggingShape, x, y, rect);
      }

      setDraggingShape(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [
    draggingShape,
    dragStart,
    canvasRef,
    setPosParallelogram,
    setPosTriangle,
    setDraggingShape,
    onDropValidate,
  ]);

  return null;
}