import React, { useState, useRef, useEffect } from "react";
import Canvas from "./Components/Canvas.jsx";
import DraggableShape from "./Components/DraggableShape.jsx";
import "./App.css";
import { getParallelogramPath, getTrianglePath } from "./Utils.js";

export default function App() {
  const [draggingShape, setDraggingShape] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [posParallelogram, setPosParallelogram] = useState({ x: 400, y: 400 });
  const [posTriangle, setPosTriangle] = useState({ x: 400, y: 520 });

  const [isParallelogramDropped, setIsParallelogramDropped] = useState(false);
  const [isTriangleDropped, setIsTriangleDropped] = useState(false);

  const [animateParallelogram, setAnimateParallelogram] = useState(false);
  const [animateTriangle, setAnimateTriangle] = useState(false);

  const [rotationParallelogram, setRotationParallelogram] = useState(0);
  const [rotationTriangle, setRotationTriangle] = useState(0);

  const canvasRef = useRef(null);
  const rotateDataRef = useRef({ shape: null, center: null, startAngle: 0 });

  const CORRECT_ROTATION_PARALLELOGRAM = 0;
  const CORRECT_ROTATION_TRIANGLE = 0;
  const ROTATION_TOLERANCE = 10;

  const getAngle = (center, x, y) => {
    return Math.atan2(y - center.y, x - center.x) * (180 / Math.PI);
  };

  const handleRotateStart = (shape) => (center, x, y) => {
    const startAngle = getAngle(center, x, y);
    rotateDataRef.current = { shape, center, startAngle };
  };

  const handleRotateMove = (x, y) => {
    const { shape, center, startAngle } = rotateDataRef.current;
    if (!shape || !center) return;

    const currentAngle = getAngle(center, x, y);
    const delta = currentAngle - startAngle;

    if (shape === "parallelogram") {
      setRotationParallelogram((prev) => prev + delta);
    } else if (shape === "triangle") {
      setRotationTriangle((prev) => prev + delta);
    }

    rotateDataRef.current.startAngle = currentAngle;
  };

  const handleRotateEnd = () => {
    rotateDataRef.current = { shape: null, center: null, startAngle: 0 };
  };

  const handleMouseDown = (shape) => (e) => {
    if (
      (shape === "parallelogram" && isParallelogramDropped) ||
      (shape === "triangle" && isTriangleDropped)
    )
      return;

    const currentPos =
      shape === "parallelogram" ? posParallelogram : posTriangle;

    setDraggingShape(shape);
    setDragStart({
      x: e.pageX - currentPos.x,
      y: e.pageY - currentPos.y,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!draggingShape) return;

      const newPos = {
        x: e.pageX - dragStart.x,
        y: e.pageY - dragStart.y,
      };

      if (draggingShape === "parallelogram") {
        setPosParallelogram(newPos);
      } else if (draggingShape === "triangle") {
        setPosTriangle(newPos);
      }
    };

    const handleMouseUp = (e) => {
      if (!draggingShape) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const ctx = canvas.getContext("2d");
      const offsetY = 40;

        if (draggingShape === "parallelogram") {
      const path = getParallelogramPath(offsetY);
      const isInside = ctx.isPointInPath(path, mouseX, mouseY);
      const isCorrectRotation = Math.abs(rotationParallelogram - CORRECT_ROTATION_PARALLELOGRAM) <= ROTATION_TOLERANCE;

        if (isInside && isCorrectRotation) {
          setIsParallelogramDropped(true);
          setAnimateParallelogram(true);
          setPosParallelogram({ x: rect.left + 80, y: rect.top + 90 });
        }
      }

        if (draggingShape === "triangle") {
          const path = getTrianglePath(offsetY);
          const isInside = ctx.isPointInPath(path, mouseX, mouseY);
          const isCorrectRotation = Math.abs(rotationTriangle - CORRECT_ROTATION_TRIANGLE) <= ROTATION_TOLERANCE;

          if (isInside && isCorrectRotation) {
            setIsTriangleDropped(true);
            setAnimateTriangle(true);
            setPosTriangle({ x: rect.left + 80, y: rect.top + 70 });
          }
}

      setDraggingShape(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [draggingShape, dragStart, rotationParallelogram, rotationTriangle]);

  return (
    <div className="container">
      <Canvas
        ref={canvasRef}
        isDropped={isParallelogramDropped}
        isTriangleDropped={isTriangleDropped}
      />

      {!isParallelogramDropped && (
        <DraggableShape
          type="parallelogram"
          position={posParallelogram}
          onMouseDown={handleMouseDown("parallelogram")}
          imageSrc="/pb_s5/parallelogram.svg"
          rotation={rotationParallelogram}
          onRotateStart={handleRotateStart("parallelogram")}
          onRotateMove={handleRotateMove}
          onRotateEnd={handleRotateEnd}
          animate={animateParallelogram}
        />
      )}

      {!isTriangleDropped && (
        <DraggableShape
          type="triangle"
          position={posTriangle}
          onMouseDown={handleMouseDown("triangle")}
          imageSrc="/pb_s5/triangle-_active.svg"
          rotation={rotationTriangle}
          onRotateStart={handleRotateStart("triangle")}
          onRotateMove={handleRotateMove}
          onRotateEnd={handleRotateEnd}
          animate={animateTriangle}
        />
      )}
    </div>
  );
}