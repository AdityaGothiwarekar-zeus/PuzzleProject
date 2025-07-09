// App.js
import React, { useState, useRef, useEffect, useCallback } from "react";
import Canvas from "./Components/Canvas.jsx";
import DraggableShape from "./Components/DraggableShape.jsx";
import PaletteShape from "./Components/PaletteShape.jsx";
import "./App.css";
import { getParallelogramPath, getTrianglePath ,getHexagonPath} from "./Utils.js";

const SHAPE_CONFIG = {
  size: 100,
  rotationTolerance: 10,
  snapOffsets: {
    parallelogram: { x: 85, y: 90 },
    triangle: { x: 97, y: 6 },
    hexagon: { x: 250, y: 150 },
    
  },
};

export default function App() {
  const [droppedShapes, setDroppedShapes] = useState([]);
  const [ghostShape, setGhostShape] = useState(null);
  const [draggingShapeId, setDraggingShapeId] = useState(null);
  const [selectedShapeId, setSelectedShapeId] = useState(null);
  const [placedShapeTypes, setPlacedShapeTypes] = useState([]);

  const canvasRef = useRef(null);
  const dragDataRef = useRef({ isDragging: false, shapeId: null, offset: { x: 0, y: 0 } });
  const rotationDataRef = useRef({
    isRotating: false,
    shapeId: null,
    center: { x: 0, y: 0 },
    startAngle: 0,
    initialRotation: 0,
  });
  const lastValidPositionRef = useRef({});
  const visualPositionRef = useRef({});
  const collisionPauseRef = useRef({}); // New ref to track collision pause state

  const getSnapPosition = (type) => SHAPE_CONFIG.snapOffsets[type] || { x: 0, y: 0 };

  const isSnapped = (posX, posY, snapX, snapY, tolerance = 5) =>
    Math.abs(posX - snapX) <= tolerance && Math.abs(posY - snapY) <= tolerance;

  const startGhostDrag = (type, imageSrc) => (e) => {
    e.preventDefault();
    const offset = { x: 50, y: 50 };
    setGhostShape({
      id: "ghost",
      type,
      imageSrc,
      position: {
        x: e.clientX - offset.x,
        y: e.clientY - offset.y,
      },
    });

    const handleMouseMove = (moveEvent) => {
      setGhostShape((prev) =>
        prev
          ? {
              ...prev,
              position: {
                x: moveEvent.clientX - offset.x,
                y: moveEvent.clientY - offset.y,
              },
            }
          : null
      );
    };

    const handleMouseUp = (upEvent) => {
      const wrapperBounds = canvasRef.current.getBoundingClientRect();
      const insideWrapper =
        upEvent.clientX >= wrapperBounds.left &&
        upEvent.clientX <= wrapperBounds.right &&
        upEvent.clientY >= wrapperBounds.top &&
        upEvent.clientY <= wrapperBounds.bottom;

      if (insideWrapper) {
        const canvasX = upEvent.clientX - wrapperBounds.left - offset.x;
        const canvasY = upEvent.clientY - wrapperBounds.top - offset.y;
        const id = Date.now();

        setDroppedShapes((prev) => [
          ...prev,
          {
            id,
            type,
            imageSrc,
            position: {
              x: Math.max(0, Math.min(canvasX, wrapperBounds.width - SHAPE_CONFIG.size)),
              y: Math.max(0, Math.min(canvasY, wrapperBounds.height - SHAPE_CONFIG.size)),
            },
            rotation: 0,
            animate: false,
            isSelected: false,
          },
        ]);
      }

      setGhostShape(null);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const getAngle = (center, x, y) => Math.atan2(y - center.y, x - center.x) * (180 / Math.PI);

  const normalizeAngle = (angle) => {
    angle = angle % 360;
    if (angle < 0) angle += 360;
    return angle;
  };

  const checkShapeFit = (shape, ctx) => {
    const shapeCenterX = shape.position.x + SHAPE_CONFIG.size / 2;
    const shapeCenterY = shape.position.y + SHAPE_CONFIG.size / 2;
    const typeToPath = {
      parallelogram: getParallelogramPath,
      triangle: getTrianglePath,
      hexagon: getHexagonPath,
    };
    const targetPath = typeToPath[shape.type]?.(40);

    const angle = normalizeAngle(shape.rotation);
    const fitsRotation =
      angle <= SHAPE_CONFIG.rotationTolerance ||
      angle >= 360 - SHAPE_CONFIG.rotationTolerance;

    ctx.save();
    ctx.translate(shapeCenterX, shapeCenterY);
    ctx.rotate((shape.rotation * Math.PI) / 180);
    ctx.translate(-shapeCenterX, -shapeCenterY);
    const fitsPath = ctx.isPointInPath(targetPath, shapeCenterX, shapeCenterY);
    ctx.restore();

    return { fits: fitsPath && fitsRotation };
  };

  const isColliding = (newX, newY, shapeId) => {
    const size = SHAPE_CONFIG.size;
    return droppedShapes.some((shape) => {
      if (shape.id === shapeId) return false;
      const snapPos = getSnapPosition(shape.type);
      if (isSnapped(shape.position.x, shape.position.y, snapPos.x, snapPos.y)) return false;
      return (
        newX < shape.position.x + size &&
        newX + size > shape.position.x &&
        newY < shape.position.y + size &&
        newY + size > shape.position.y
      );
    });
  };

  const handleMouseMove = useCallback((e) => {
    if (!dragDataRef.current.isDragging) return;
    const { shapeId, offset } = dragDataRef.current;
    const currentShape = droppedShapes.find((s) => s.id === shapeId);
    if (!currentShape) return;

    // Check if this shape is currently paused due to collision
    if (collisionPauseRef.current[shapeId]) {
      return; // Skip all movement during pause
    }

    const canvasBounds = canvasRef.current.getBoundingClientRect();
    const wrapperWidth = canvasRef.current.offsetWidth;
    const wrapperHeight = canvasRef.current.offsetHeight;
    const size = SHAPE_CONFIG.size;

    let toX = e.clientX - canvasBounds.left - offset.x;
    let toY = e.clientY - canvasBounds.top - offset.y;

    // Constrain within canvas bounds
    toX = Math.max(0, Math.min(toX, wrapperWidth - size));
    toY = Math.max(0, Math.min(toY, wrapperHeight - size));

    // Check collision
    if (isColliding(toX, toY, shapeId)) {
      // Set collision pause for 2 seconds
      collisionPauseRef.current[shapeId] = true;
      
      setTimeout(() => {
        collisionPauseRef.current[shapeId] = false;
      }, 2000);
      
      return; // Don't update position during collision
    }

    // Store visual position for immediate DOM update
    visualPositionRef.current[shapeId] = { x: toX, y: toY };

    // Update state position
    setDroppedShapes((prevShapes) =>
      prevShapes.map((shape) =>
        shape.id === shapeId ? { ...shape, position: { x: toX, y: toY } } : shape
      )
    );
  }, [droppedShapes]);

  const handleMouseUp = useCallback(() => {
    if (!dragDataRef.current.isDragging) return;
    const { shapeId } = dragDataRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.querySelector("canvas").getContext("2d");

    setDroppedShapes((prevShapes) =>
      prevShapes.map((shape) => {
        if (shape.id !== shapeId) return shape;
        const { fits } = checkShapeFit(shape, ctx);

        if (fits) {
          const snapPos = getSnapPosition(shape.type);
          return {
            ...shape,
            animate: true,
            rotation: 0,
            position: snapPos,
          };
        }
        return shape;
      })
    );

    // Clean up references for this shape
    delete visualPositionRef.current[shapeId];
    delete collisionPauseRef.current[shapeId];
    
    dragDataRef.current = { isDragging: false, shapeId: null, offset: { x: 0, y: 0 } };
    setDraggingShapeId(null);
  }, [checkShapeFit]);

  const handleRotateMove = useCallback((currentX, currentY) => {
    if (!rotationDataRef.current.isRotating) return;
    const { shapeId, center, startAngle, initialRotation } = rotationDataRef.current;
    const currentAngle = getAngle(center, currentX, currentY);
    const angleDiff = currentAngle - startAngle;
    const newRotation = initialRotation + angleDiff;
    setDroppedShapes((prevShapes) =>
      prevShapes.map((shape) =>
        shape.id === shapeId ? { ...shape, rotation: newRotation } : shape
      )
    );
  }, []);

  const handleRotationMouseMove = useCallback((e) => {
    if (!rotationDataRef.current.isRotating) return;
    handleRotateMove(e.clientX, e.clientY);
  }, [handleRotateMove]);

  const handleRotationMouseUp = useCallback(() => {
    if (!rotationDataRef.current.isRotating) return;
    handleRotateEnd();
  }, []);

  const handleRotateEnd = useCallback(() => {
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
    const bounds = canvasRef.current.getBoundingClientRect();
    
    // Initialize visual position and clear any existing collision pause
    visualPositionRef.current[shapeId] = { ...shape.position };
    collisionPauseRef.current[shapeId] = false;
    
    dragDataRef.current = {
      isDragging: true,
      shapeId,
      offset: {
        x: e.clientX - bounds.left - shape.position.x,
        y: e.clientY - bounds.top - shape.position.y,
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
    const updatedTypes = droppedShapes.reduce((acc, shape) => {
      const snap = getSnapPosition(shape.type);
      if (isSnapped(shape.position.x, shape.position.y, snap.x, snap.y)) {
        acc.push(shape.type);
      }
      return acc;
    }, []);
    setPlacedShapeTypes([...new Set(updatedTypes)]);
  }, [droppedShapes]);

  return (
    <div
      className="container"
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "22%",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          top: "30%",
          zIndex: 10,
        }}
      >
        <PaletteShape
          type="parallelogram"
          imageSrc="/pb_s5/parallelogram.svg"
          onMouseDown={startGhostDrag("parallelogram", "/pb_s5/parallelogram.svg")}
        />
        <PaletteShape
          type="triangle"
          imageSrc="/pb_s5/triangle-_active.svg"
          onMouseDown={startGhostDrag("triangle", "/pb_s5/triangle-_active.svg")}
        />
        <PaletteShape
          type="hexagon"
          imageSrc="/pb_s5/hexagon_active.svg"
          onMouseDown={startGhostDrag("hexagon", "/pb_s5/hexagon_active.svg")}
        />

      </div>

      <div
        className="canvas-wrapper"
        ref={canvasRef}
        style={{
          width: "600px",
          height: "400px",
          position: "relative",
          border: "2px dashed #999",
          overflow: "hidden",
        }}
      >
        <Canvas placedShapeTypes={placedShapeTypes} />
        {droppedShapes.map((shape) => {
          const isDragging = draggingShapeId === shape.id;
          const displayPosition = isDragging && visualPositionRef.current[shape.id] 
            ? visualPositionRef.current[shape.id] 
            : shape.position;
            
          return (
            <DraggableShape
            key={shape.id}
            type={shape.type}
            position={displayPosition}
            onMouseDown={handleShapeMouseDown(shape.id)}
            onDoubleClick={handleDoubleClick(shape.id)}
            imageSrc={shape.imageSrc}
            rotation={shape.rotation}
            animate={shape.animate}
            isSelected={selectedShapeId === shape.id}
            isDragging={isDragging}
            onRotateStart={handleRotateStart(shape.id)}
            onRotateMove={handleRotateMove}
            onRotateEnd={handleRotateEnd}
            onDelete={() => {
              setDroppedShapes((prev) => prev.filter((s) => s.id !== shape.id));
              delete visualPositionRef.current[shape.id];
              delete collisionPauseRef.current[shape.id];
              if (draggingShapeId === shape.id) setDraggingShapeId(null);
              if (selectedShapeId === shape.id) setSelectedShapeId(null);
            }}
            />

          );
        })}
      </div>

      {/* Ghost Shape */}
      {ghostShape && (
        <img
          src={ghostShape.imageSrc}
          alt={ghostShape.type}
          style={{
            position: "fixed",
            pointerEvents: "none",
            left: ghostShape.position.x,
            top: ghostShape.position.y,
            width: SHAPE_CONFIG.size,
            height: SHAPE_CONFIG.size,
            opacity: 0.8,
            zIndex: 9999,
          }}
        />
      )}
    </div>
  );
}