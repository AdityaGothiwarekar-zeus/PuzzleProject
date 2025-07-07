// App.js
import React, { useState, useRef, useEffect, useCallback } from "react";
import Canvas from "./Components/Canvas.jsx";
import DraggableShape from "./Components/DraggableShape.jsx";
import TapPlacementHandler from "./TapPlacementHandler.jsx";
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

  const [selectedShape, setSelectedShape] = useState(null);

  const canvasRef = useRef(null);
  const rotateDataRef = useRef({ shape: null, center: null, startAngle: 0 });
  const dragDataRef = useRef({ isDragging: false, shape: null, offset: { x: 0, y: 0 } });

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
    // Don't start dragging if shape is already dropped
    if (
      (shape === "parallelogram" && isParallelogramDropped) ||
      (shape === "triangle" && isTriangleDropped)
    )
      return;

    // Don't start dragging on double-click
    if (e.detail === 2) return;

    const currentPos = shape === "parallelogram" ? posParallelogram : posTriangle;

    // Store drag data in ref for better performance
    dragDataRef.current = {
      isDragging: true,
      shape,
      offset: {
        x: e.pageX - currentPos.x,
        y: e.pageY - currentPos.y,
      }
    };

    setDraggingShape(shape);
  };

  const handleDoubleClick = (shape) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Use requestAnimationFrame for immediate response
    requestAnimationFrame(() => {
      if (selectedShape === shape) {
        setSelectedShape(null);
      } else {
        setSelectedShape(shape);
      }
    });
  };

  // Optimized mouse handlers using useCallback
  const handleMouseMove = useCallback((e) => {
    if (!dragDataRef.current.isDragging) return;

    const { shape, offset } = dragDataRef.current;
    const newPos = {
      x: e.pageX - offset.x,
      y: e.pageY - offset.y,
    };

    // Use requestAnimationFrame for smooth animation
    requestAnimationFrame(() => {
      if (shape === "parallelogram") {
        setPosParallelogram(newPos);
      } else if (shape === "triangle") {
        setPosTriangle(newPos);
      }
    });
  }, []);

  const handleMouseUp = useCallback((e) => {
    if (!dragDataRef.current.isDragging) return;

    const { shape } = dragDataRef.current;
    const canvas = canvasRef.current;
    
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const ctx = canvas.getContext("2d");
      const offsetY = 40;

      if (shape === "parallelogram") {
        const path = getParallelogramPath(offsetY);
        const isInside = ctx.isPointInPath(path, mouseX, mouseY);
        const isCorrectRotation = Math.abs(rotationParallelogram - CORRECT_ROTATION_PARALLELOGRAM) <= ROTATION_TOLERANCE;

        if (isInside && isCorrectRotation) {
          setIsParallelogramDropped(true);
          setAnimateParallelogram(true);
          setPosParallelogram({ x: rect.left + 80, y: rect.top + 90 });
        }
      }

      if (shape === "triangle") {
        const path = getTrianglePath(offsetY);
        const isInside = ctx.isPointInPath(path, mouseX, mouseY);
        const isCorrectRotation = Math.abs(rotationTriangle - CORRECT_ROTATION_TRIANGLE) <= ROTATION_TOLERANCE;

        if (isInside && isCorrectRotation) {
          setIsTriangleDropped(true);
          setAnimateTriangle(true);
          setPosTriangle({ x: rect.left + 80, y: rect.top + 70 });
        }
      }
    }

    // Reset drag state
    dragDataRef.current = { isDragging: false, shape: null, offset: { x: 0, y: 0 } };
    setDraggingShape(null);
  }, [rotationParallelogram, rotationTriangle]);

  // Optimized useEffect with minimal dependencies
  useEffect(() => {
    if (draggingShape) {
      window.addEventListener("mousemove", handleMouseMove, { passive: true });
      window.addEventListener("mouseup", handleMouseUp);
      
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [draggingShape, handleMouseMove, handleMouseUp]);

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
          onDoubleClick={handleDoubleClick("parallelogram")}
          imageSrc="/pb_s5/parallelogram.svg"
          rotation={rotationParallelogram}
          onRotateStart={handleRotateStart("parallelogram")}
          onRotateMove={handleRotateMove}
          onRotateEnd={handleRotateEnd}
          animate={animateParallelogram}
          isSelected={selectedShape === "parallelogram"}
        />
      )}

      {!isTriangleDropped && (
        <DraggableShape
          type="triangle"
          position={posTriangle}
          onMouseDown={handleMouseDown("triangle")}
          onDoubleClick={handleDoubleClick("triangle")}
          imageSrc="/pb_s5/triangle-_active.svg"
          rotation={rotationTriangle}
          onRotateStart={handleRotateStart("triangle")}
          onRotateMove={handleRotateMove}
          onRotateEnd={handleRotateEnd}
          animate={animateTriangle}
          isSelected={selectedShape === "triangle"}
        />
      )}

      <TapPlacementHandler
        canvasRef={canvasRef}
        selectedShape={selectedShape}
        setSelectedShape={setSelectedShape}
        setPosParallelogram={setPosParallelogram}
        setPosTriangle={setPosTriangle}
        isParallelogramDropped={isParallelogramDropped}
        isTriangleDropped={isTriangleDropped}
        rotationParallelogram={rotationParallelogram}
        rotationTriangle={rotationTriangle}
        setIsParallelogramDropped={setIsParallelogramDropped}
        setIsTriangleDropped={setIsTriangleDropped}
        setAnimateParallelogram={setAnimateParallelogram}
        setAnimateTriangle={setAnimateTriangle}
        CORRECT_ROTATION_PARALLELOGRAM={CORRECT_ROTATION_PARALLELOGRAM}
        CORRECT_ROTATION_TRIANGLE={CORRECT_ROTATION_TRIANGLE}
        ROTATION_TOLERANCE={ROTATION_TOLERANCE}
      />
    </div>
  );
}