// App.js
import React, { useState, useRef, useEffect, useCallback } from "react";
import Canvas from "./Components/Canvas.jsx";
import DraggableShape from "./Components/DraggableShape.jsx";
import PaletteShape from "./Components/PaletteShape.jsx";
import "./App.css";
import { getParallelogramPath, getTrianglePath } from "./Utils.js";

export default function App() {
  const [droppedShapes, setDroppedShapes] = useState([]);
  const [draggingShapeId, setDraggingShapeId] = useState(null);
  const [selectedShapeId, setSelectedShapeId] = useState(null);
  const [placedShapeTypes, setPlacedShapeTypes] = useState([]);
  const [pendingNewShape, setPendingNewShape] = useState(null);

  const canvasRef = useRef(null);
  const dragDataRef = useRef({ isDragging: false, shapeId: null, offset: { x: 0, y: 0 } });
  const rotationDataRef = useRef({ 
    isRotating: false, 
    shapeId: null, 
    center: { x: 0, y: 0 }, 
    startAngle: 0, 
    initialRotation: 0 
  });

  const ROTATION_TOLERANCE = 10;

  const startDraggingNewShape = (type, imageSrc) => (e) => {
    e.preventDefault();
    const id = Date.now();

    const newShape = {
      id,
      type,
      imageSrc,
      position: { x: e.pageX - 50, y: e.pageY - 50 },
      rotation: 0,
      animate: false,
      isSelected: false,
    };

    setDroppedShapes((prev) => [...prev, newShape]);
    setDraggingShapeId(id);
    dragDataRef.current = {
      isDragging: true,
      shapeId: id,
      offset: { x: 50, y: 50 }
    };
  };

  const getAngle = (center, x, y) => {
    return Math.atan2(y - center.y, x - center.x) * (180 / Math.PI);
  };

  const normalizeAngle = (angle) => {
    angle = angle % 360;
    if (angle < 0) angle += 360;
    return angle;
  };

  const checkShapeFit = (shape, ctx, canvasRect) => {
    const shapeCenterX = shape.position.x - canvasRect.left + 50;
    const shapeCenterY = shape.position.y - canvasRect.top + 50;

    const offsetY = 40;
    let targetPath, correctRotation;

    if (shape.type === "parallelogram") {
      targetPath = getParallelogramPath(offsetY);
      correctRotation = 0;
    } else if (shape.type === "triangle") {
      targetPath = getTrianglePath(offsetY);
      correctRotation = 0;
    } else {
      return { fits: false };
    }

    const isInside = ctx.isPointInPath(targetPath, shapeCenterX, shapeCenterY);
    const normalizedRotation = normalizeAngle(shape.rotation);
    const isRotationCorrect = Math.abs(normalizedRotation - correctRotation) <= ROTATION_TOLERANCE;

    return { fits: isInside && isRotationCorrect };
  };

  const isColliding = (newX, newY, shapeId) => {
    const shapeSize = 100;
    const canvasRect = canvasRef.current.getBoundingClientRect();

    return droppedShapes.some((shape) => {
      if (shape.id === shapeId) return false;

      const isSnapped =
        (shape.type === "parallelogram" &&
          shape.position.x === canvasRect.left + 85 &&
          shape.position.y === canvasRect.top + 90) ||
        (shape.type === "triangle" &&
          shape.position.x === canvasRect.left + 97 &&
          shape.position.y === canvasRect.top + 6);

      if (isSnapped) return false;

      const otherX = shape.position.x;
      const otherY = shape.position.y;

      return (
        newX < otherX + shapeSize &&
        newX + shapeSize > otherX &&
        newY < otherY + shapeSize &&
        newY + shapeSize > otherY
      );
    });
  };

  const handleMouseMove = useCallback((e) => {
    if (!dragDataRef.current.isDragging) return;

    const { shapeId, offset } = dragDataRef.current;
    const currentShape = droppedShapes.find((s) => s.id === shapeId);
    if (!currentShape) return;

    const fromX = currentShape.position.x;
    const fromY = currentShape.position.y;
    const toX = e.pageX - offset.x;
    const toY = e.pageY - offset.y;

    const steps = 10;
    let blocked = false;

    for (let i = 1; i <= steps; i++) {
      const stepX = fromX + ((toX - fromX) * i) / steps;
      const stepY = fromY + ((toY - fromY) * i) / steps;

      if (isColliding(stepX, stepY, shapeId)) {
        blocked = true;
        break;
      }
    }

    if (blocked) return;

    setDroppedShapes((prevShapes) =>
      prevShapes.map((shape) =>
        shape.id === shapeId
          ? { ...shape, position: { x: toX, y: toY } }
          : shape
      )
    );
  }, [droppedShapes]);

  const handleMouseUp = useCallback(() => {
    if (!dragDataRef.current.isDragging) return;

    const { shapeId } = dragDataRef.current;
    const canvas = canvasRef.current;
    const canvasRect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");

    setDroppedShapes((prevShapes) =>
      prevShapes.map((shape) => {
        if (shape.id !== shapeId) return shape;

        const { fits } = checkShapeFit(shape, ctx, canvasRect);
        if (fits) {
          let snapX, snapY, finalRotation;

          if (shape.type === "parallelogram") {
            snapX = canvasRect.left + 85;
            snapY = canvasRect.top + 90;
            finalRotation = 0;
          } else if (shape.type === "triangle") {
            snapX = canvasRect.left + 97;
            snapY = canvasRect.top + 6;
            finalRotation = 2;
          }

          return {
            ...shape,
            animate: true,
            rotation: finalRotation,
            position: { x: snapX, y: snapY },
          };
        }

        return shape;
      })
    );

    dragDataRef.current = { isDragging: false, shapeId: null, offset: { x: 0, y: 0 } };
    setDraggingShapeId(null);
  }, []);

  // Rotation handlers - reordered to fix circular dependency
  const handleRotateMove = useCallback((currentX, currentY) => {
    if (!rotationDataRef.current.isRotating) return;

    const { shapeId, center, startAngle, initialRotation } = rotationDataRef.current;
    const currentAngle = getAngle(center, currentX, currentY);
    const angleDiff = currentAngle - startAngle;
    const newRotation = initialRotation + angleDiff;

    setDroppedShapes((prevShapes) =>
      prevShapes.map((shape) =>
        shape.id === shapeId
          ? { ...shape, rotation: newRotation }
          : shape
      )
    );
  }, []);

  // Handle rotation mouse events - defined before handleRotateEnd
  const handleRotationMouseMove = useCallback((e) => {
    if (!rotationDataRef.current.isRotating) return;
    handleRotateMove(e.clientX, e.clientY);
  }, [handleRotateMove]);

  const handleRotationMouseUp = useCallback(() => {
    if (!rotationDataRef.current.isRotating) return;
    handleRotateEnd();
  }, []);

  const handleRotateEnd = useCallback(() => {
    // Remove event listeners when rotation ends
    window.removeEventListener("mousemove", handleRotationMouseMove);
    window.removeEventListener("mouseup", handleRotationMouseUp);
    
    rotationDataRef.current = {
      isRotating: false,
      shapeId: null,
      center: { x: 0, y: 0 },
      startAngle: 0,
      initialRotation: 0,
    };
  }, [handleRotationMouseMove, handleRotationMouseUp]);

  const handleRotateStart = (shapeId) => (center, startX, startY) => {
    const shape = droppedShapes.find((s) => s.id === shapeId);
    if (!shape) return;

    const startAngle = getAngle(center, startX, startY);
    rotationDataRef.current = {
      isRotating: true,
      shapeId,
      center,
      startAngle,
      initialRotation: shape.rotation,
    };

    // Add event listeners immediately when rotation starts
    window.addEventListener("mousemove", handleRotationMouseMove);
    window.addEventListener("mouseup", handleRotationMouseUp);
  };

  useEffect(() => {
    if (draggingShapeId !== null) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [draggingShapeId, handleMouseMove, handleMouseUp]);

  const handleShapeMouseDown = (shapeId) => (e) => {
    const shape = droppedShapes.find((s) => s.id === shapeId);
    if (!shape) return;

    dragDataRef.current = {
      isDragging: true,
      shapeId,
      offset: {
        x: e.pageX - shape.position.x,
        y: e.pageY - shape.position.y,
      },
    };
    setDraggingShapeId(shapeId);
  };

  const handleDoubleClick = (shapeId) => () => {
    requestAnimationFrame(() => {
      setSelectedShapeId((prev) => (prev === shapeId ? null : shapeId));
    });
  };

  useEffect(() => {
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const updatedTypes = [];

    droppedShapes.forEach((shape) => {
      if (shape.type === "parallelogram") {
        if (shape.position.x === canvasRect.left + 85 && shape.position.y === canvasRect.top + 90)
          updatedTypes.push("parallelogram");
      }
      if (shape.type === "triangle") {
        if (shape.position.x === canvasRect.left + 97 && shape.position.y === canvasRect.top + 6)
          updatedTypes.push("triangle");
      }
    });

    setPlacedShapeTypes([...new Set(updatedTypes)]);
  }, [droppedShapes]);

  return (
    <div className="container">
      <div
        style={{
          position: "absolute",
          left: "380px",
          top: "320px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          zIndex: 10,
        }}
      >
        <PaletteShape
          type="parallelogram"
          imageSrc="/pb_s5/parallelogram.svg"
          onMouseDown={startDraggingNewShape("parallelogram", "/pb_s5/parallelogram.svg")}
        />
        <PaletteShape
          type="triangle"
          imageSrc="/pb_s5/triangle-_active.svg"
          onMouseDown={startDraggingNewShape("triangle", "/pb_s5/triangle-_active.svg")}
        />
      </div>

      <Canvas ref={canvasRef} placedShapeTypes={placedShapeTypes} />

      {droppedShapes.map((shape) => (
        <DraggableShape
          key={shape.id}
          type={shape.type}
          position={shape.position}
          onMouseDown={handleShapeMouseDown(shape.id)}
          onDoubleClick={handleDoubleClick(shape.id)}
          imageSrc={shape.imageSrc}
          rotation={shape.rotation}
          animate={shape.animate}
          isSelected={selectedShapeId === shape.id}
          isDragging={draggingShapeId === shape.id}
          onRotateStart={handleRotateStart(shape.id)}
          onRotateMove={handleRotateMove}
          onRotateEnd={handleRotateEnd}
        />
      ))}
    </div>
  );
}