// App.js
import React, { useState, useRef, useEffect, useCallback } from "react";
import Canvas from "./Components/Canvas.jsx";
import DraggableShape from "./Components/DraggableShape.jsx";
import PaletteShape from "./Components/PaletteShape.jsx";
import "./App.css";
import { getParallelogramPath, getTrianglePath, getHexagonPath , getShapePoints, rotatePoints, getBoundingBox } from "./Utils.js";
// import rotationStartedRef from "./Components/DraggableShape.jsx";

const SHAPE_CONFIG = {
  size: 100,
  rotationTolerance: 10,
  snapOffsets: {
    parallelogram: { x: 85, y: 90 },
    triangle: { x: 97, y: 6 },
    hexagon: { x: 250, y: 120 },
  },
  collisionPolicies: {
    parallelogram: "strict",   // prevent any overlap
    triangle: "partial",       // prevent 50%+ overlap
    hexagon: "none",           // allow overlaps
  },
  // Grid configuration
  grid: {
    enabled: true,
    spacing: 50, // Distance between grid points
    snapDistance: 75, // Maximum distance to snap to a grid point
  }
};

// Generate grid points based on canvas dimensions
const generateGridPoints = (canvasWidth, canvasHeight, spacing) => {
  const points = [];
  const cols = Math.floor(canvasWidth / spacing) + 1;
  const rows = Math.floor(canvasHeight / spacing) + 1;
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      points.push({
        x: col * spacing,
        y: row * spacing
      });
    }
  }
  return points;
};

// Calculate Euclidean distance between two points
const calculateDistance = (point1, point2) => {
  const dx = point1.x - point2.x;
  const dy = point1.y - point2.y;
  return Math.sqrt(dx * dx + dy * dy);
};

// Find the nearest grid point to a given position
const findNearestGridPoint = (position, gridPoints, maxDistance = Infinity) => {
  let nearestPoint = null;
  let minDistance = maxDistance;
  
  for (const gridPoint of gridPoints) {
    const distance = calculateDistance(position, gridPoint);
    if (distance < minDistance) {
      minDistance = distance;
      nearestPoint = gridPoint;
    }
  }
  
  return nearestPoint;
};

// Get snapped position based on shape center and grid
const getSnappedPosition = (shapeCenter, canvasWidth, canvasHeight, shapeSize) => {
  if (!SHAPE_CONFIG.grid.enabled) return null;
  
  const gridPoints = generateGridPoints(canvasWidth, canvasHeight, SHAPE_CONFIG.grid.spacing);
  const nearestPoint = findNearestGridPoint(shapeCenter, gridPoints, SHAPE_CONFIG.grid.snapDistance);
  
  if (nearestPoint) {
    // Convert grid point to shape position (top-left corner)
    return {
      x: Math.max(0, Math.min(nearestPoint.x - shapeSize / 2, canvasWidth - shapeSize)),
      y: Math.max(0, Math.min(nearestPoint.y - shapeSize / 2, canvasHeight - shapeSize))
    };
  }
  
  return null;
};

export default function App() {
  const [droppedShapes, setDroppedShapes] = useState([]);
  const [ghostShape, setGhostShape] = useState(null);
  const [draggingShapeId, setDraggingShapeId] = useState(null);
  const [selectedShapeId, setSelectedShapeId] = useState(null);
  const [selectedPaletteShape, setSelectedPaletteShape] = useState(null);
  const [selectedCanvasShape, setSelectedCanvasShape] = useState(null);
  const [pendingShape, setPendingShape] = useState(null);
  const [isDraggingFromPalette, setIsDraggingFromPalette] = useState(false);
  const canvasRef = useRef(null);
  const dragDataRef = useRef({ isDragging: false, shapeId: null, offset: { x: 0, y: 0 } });
  const rotationDataRef = useRef({ isRotating: false, shapeId: null, center: { x: 0, y: 0 }, startAngle: 0, initialRotation: 0 });
  const visualPositionRef = useRef({});
  const collisionPauseRef = useRef({});
  const [rotationStarted, setRotationStarted] = useState(false);

  const getSnapPosition = (type) => SHAPE_CONFIG.snapOffsets[type] || { x: 0, y: 0 };
  const isSnapped = (x, y, snapX, snapY, tol = 5) => Math.abs(x - snapX) <= tol && Math.abs(y - snapY) <= tol;

  const isColliding = (newX, newY, shapeId, shapeType) => {
    const size = SHAPE_CONFIG.size;
    const policy = SHAPE_CONFIG.collisionPolicies[shapeType];
    if (policy === "none") return false;

    return droppedShapes.some((shape) => {
      if (shape.id === shapeId) return false;
      const other = shape.position;
      const overlapW = Math.max(0, Math.min(newX + size, other.x + size) - Math.max(newX, other.x));
      const overlapH = Math.max(0, Math.min(newY + size, other.y + size) - Math.max(newY, other.y));
      const overlapArea = overlapW * overlapH;
      const totalArea = size * size;

      if (isSnapped(other.x, other.y, getSnapPosition(shape.type).x, getSnapPosition(shape.type).y)) return false;

      if (policy === "strict") return overlapArea > 0;
      if (policy === "partial") return overlapArea > 0.5 * totalArea;
      return false;
    });
  };

  // Handle palette shape double-click
  const handlePaletteDoubleClick = (type, imageSrc) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (selectedPaletteShape?.type === type) {
      setSelectedPaletteShape(null);
    } else {
      setSelectedPaletteShape({ type, imageSrc });
      setSelectedCanvasShape(null);
      setPendingShape(null);
    }
  };

  // Handle canvas double-click to render selected shape
  const handleCanvasDoubleClick = (e) => {
    if (draggingShapeId || rotationDataRef.current.isRotating || isDraggingFromPalette) return;
    if (e.target.closest('[data-shape-id]')) return;

    const bounds = canvasRef.current.getBoundingClientRect();
    const canvasX = e.clientX - bounds.left - SHAPE_CONFIG.size / 2;
    const canvasY = e.clientY - bounds.top - SHAPE_CONFIG.size / 2;

    const clampedX = Math.max(0, Math.min(canvasX, bounds.width - SHAPE_CONFIG.size));
    const clampedY = Math.max(0, Math.min(canvasY, bounds.height - SHAPE_CONFIG.size));

    // Calculate shape center for grid snapping
    const shapeCenter = {
      x: clampedX + SHAPE_CONFIG.size / 2,
      y: clampedY + SHAPE_CONFIG.size / 2
    };

    // Get snapped position
    const snappedPosition = getSnappedPosition(shapeCenter, bounds.width, bounds.height, SHAPE_CONFIG.size);
    const finalPosition = snappedPosition || { x: clampedX, y: clampedY };

    // If a canvas shape is selected, move it to new location
    if (selectedCanvasShape) {
      setDroppedShapes((prev) =>
        prev.map((shape) => {
          if (shape.id === selectedCanvasShape.id) {
            const tempShape = {
              ...shape,
              position: finalPosition,
              rotation: 0,
            };

            const shouldClip = checkShapeFit(tempShape);

            return {
              ...shape,
              position: shouldClip ? getSnapPosition(shape.type) : finalPosition,
              rotation: shouldClip ? 0 : shape.rotation,
              animate: shouldClip,
            };
          }
          return shape;
        })
      );

      setSelectedCanvasShape(null);
      setSelectedShapeId(null);
      return;
    }

    // Create pending shape if palette shape is selected
    if (selectedPaletteShape) {
      const pendingShapeData = {
        id: `pending-${Date.now()}`,
        type: selectedPaletteShape.type,
        imageSrc: selectedPaletteShape.imageSrc,
        position: finalPosition,
        rotation: 0,
        animate: false,
        isSelected: false,
        isPending: true,
      };

      setPendingShape(pendingShapeData);
      setSelectedPaletteShape(null);
    }
  };

  // Handle canvas single click to place selected shape
  const handleCanvasClick = (e) => {
    if (rotationStarted) {
    setRotationStarted(false);
    return; // suppress click
  }
    if (draggingShapeId || rotationDataRef.current.isRotating || isDraggingFromPalette || pendingShape) return;
    if (!selectedCanvasShape) return;

    const bounds = canvasRef.current.getBoundingClientRect();
    const canvasX = e.clientX - bounds.left - SHAPE_CONFIG.size / 2;
    const canvasY = e.clientY - bounds.top - SHAPE_CONFIG.size / 2;
    const clampedX = Math.max(0, Math.min(canvasX, bounds.width - SHAPE_CONFIG.size));
    const clampedY = Math.max(0, Math.min(canvasY, bounds.height - SHAPE_CONFIG.size));

    // Calculate shape center for grid snapping
    const shapeCenter = {
      x: clampedX + SHAPE_CONFIG.size / 2,
      y: clampedY + SHAPE_CONFIG.size / 2
    };

    // Get snapped position
    const snappedPosition = getSnappedPosition(shapeCenter, bounds.width, bounds.height, SHAPE_CONFIG.size);
    const finalPosition = snappedPosition || { x: clampedX, y: clampedY };

    setDroppedShapes((prevShapes) =>
      prevShapes.map((shape) => {
        if (shape.id === selectedCanvasShape.id) {
          const tempShape = {
            ...shape,
            position: finalPosition,
          };

          const shouldClip = checkShapeFit(tempShape);

          return {
            ...shape,
            position: shouldClip ? getSnapPosition(shape.type) : finalPosition,
            rotation: shouldClip ? 0 : shape.rotation,
            animate: shouldClip,
          };
        }
        return shape;
      })
    );

    setSelectedCanvasShape(null);
    setSelectedShapeId(null);
  };

  // Handle pending shape click to place it permanently
  const handlePendingShapeClick = (e) => {
    e.stopPropagation();
    if (pendingShape) {
      const shouldClip = checkShapeFit(pendingShape);
      
      const finalShape = {
        ...pendingShape,
        id: Date.now(),
        isPending: false,
        animate: shouldClip,
        position: shouldClip ? getSnapPosition(pendingShape.type) : pendingShape.position,
        rotation: shouldClip ? 0 : pendingShape.rotation,
      };
      
      setDroppedShapes((prev) => [...prev, finalShape]);
      setPendingShape(null);
    }
  };

  // Check if a shape fits within the designated area
  const checkShapeFit = (shape) => {
    const canvas = canvasRef.current;
    const canvasElement = canvas.querySelector("canvas");
    if (!canvasElement) return false;
    
    const ctx = canvasElement.getContext("2d");
    const cx = shape.position.x + SHAPE_CONFIG.size / 2;
    const cy = shape.position.y + SHAPE_CONFIG.size / 2;
    
    const paths = {
      parallelogram: getParallelogramPath,
      triangle: getTrianglePath,
      hexagon: getHexagonPath,
    };
    
    const path = paths[shape.type]?.(40);
    if (!path) return false;
    
    const angle = normalizeAngle(shape.rotation);
    const fitsRotation =
      angle <= SHAPE_CONFIG.rotationTolerance ||
      angle >= 360 - SHAPE_CONFIG.rotationTolerance;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((shape.rotation * Math.PI) / 180);
    ctx.translate(-cx, -cy);
    const fit = ctx.isPointInPath(path, cx, cy);
    ctx.restore();

    return fit && fitsRotation;
  };

  const startGhostDrag = (type, imageSrc) => (e) => {
    e.preventDefault();
    setIsDraggingFromPalette(true);
    const offset = { x: 50, y: 50 };
    setGhostShape({
      id: "ghost",
      type,
      imageSrc,
      position: { x: e.clientX - offset.x, y: e.clientY - offset.y },
    });

    const handleMouseMove = (moveEvent) => {
      setGhostShape((prev) =>
        prev ? { ...prev, position: { x: moveEvent.clientX - offset.x, y: moveEvent.clientY - offset.y } } : null
      );
    };

    const handleMouseUp = (upEvent) => {
      const bounds = canvasRef.current.getBoundingClientRect();
      const inside =
        upEvent.clientX >= bounds.left &&
        upEvent.clientX <= bounds.right &&
        upEvent.clientY >= bounds.top &&
        upEvent.clientY <= bounds.bottom;

      if (inside) {
        const id = Date.now();
        const canvasX = upEvent.clientX - bounds.left - offset.x;
        const canvasY = upEvent.clientY - bounds.top - offset.y;
        const clampedX = Math.max(0, Math.min(canvasX, bounds.width - SHAPE_CONFIG.size));
        const clampedY = Math.max(0, Math.min(canvasY, bounds.height - SHAPE_CONFIG.size));
        
        // Calculate shape center for grid snapping
        const shapeCenter = {
          x: clampedX + SHAPE_CONFIG.size / 2,
          y: clampedY + SHAPE_CONFIG.size / 2
        };

        // Get snapped position
        const snappedPosition = getSnappedPosition(shapeCenter, bounds.width, bounds.height, SHAPE_CONFIG.size);
        const finalPosition = snappedPosition || { x: clampedX, y: clampedY };
        
        // Check if the shape should be clipped
        const tempShape = {
          type,
          position: finalPosition,
          rotation: 0,
        };
        
        const shouldClip = checkShapeFit(tempShape);
        
        setDroppedShapes((prev) => [
          ...prev,
          {
            id,
            type,
            imageSrc,
            position: shouldClip ? getSnapPosition(type) : finalPosition,
            rotation: shouldClip ? 0 : 0,
            animate: shouldClip,
            isSelected: false,
          },
        ]);
      }

      setGhostShape(null);
      setIsDraggingFromPalette(false);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const getAngle = (center, x, y) => Math.atan2(y - center.y, x - center.x) * (180 / Math.PI);
  const normalizeAngle = (angle) => ((angle % 360) + 360) % 360;

  const handleMouseMove = useCallback((e) => {
    if (!dragDataRef.current.isDragging) return;
    const { shapeId, offset } = dragDataRef.current;
    const shape = droppedShapes.find((s) => s.id === shapeId);
    if (!shape || collisionPauseRef.current[shapeId]) return;

    const canvasBounds = canvasRef.current.getBoundingClientRect();
    let toX = e.clientX - canvasBounds.left - offset.x;
    let toY = e.clientY - canvasBounds.top - offset.y;
    const size = SHAPE_CONFIG.size;

    toX = Math.max(0, Math.min(toX, canvasBounds.width - size));
    toY = Math.max(0, Math.min(toY, canvasBounds.height - size));

    if (isColliding(toX, toY, shapeId, shape.type)) {
      if (collisionPauseRef.current[shapeId]) return;
      collisionPauseRef.current[shapeId] = true;
      setTimeout(() => {
        collisionPauseRef.current[shapeId] = false;
      }, 10000);
      return;
    }

    visualPositionRef.current[shapeId] = { x: toX, y: toY };
    setDroppedShapes((prev) =>
      prev.map((s) => (s.id === shapeId ? { ...s, position: { x: toX, y: toY } } : s))
    );
  }, [droppedShapes]);

 // Modified handleMouseUp function - replace the existing one
const handleMouseUp = useCallback(() => {
  if (!dragDataRef.current.isDragging) return;

  const { shapeId } = dragDataRef.current;
  const canvas = canvasRef.current;
  const canvasBounds = canvas.getBoundingClientRect();
  const ctx = canvas.querySelector("canvas").getContext("2d");

  const checkFit = (shape) => {
    const cx = shape.position.x + SHAPE_CONFIG.size / 2;
    const cy = shape.position.y + SHAPE_CONFIG.size / 2;
    const paths = {
      parallelogram: getParallelogramPath,
      triangle: getTrianglePath,
      hexagon: getHexagonPath,
    };
    const path = paths[shape.type]?.(40);
    const angle = normalizeAngle(shape.rotation);
    const fitsRotation =
      angle <= SHAPE_CONFIG.rotationTolerance ||
      angle >= 360 - SHAPE_CONFIG.rotationTolerance;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((shape.rotation * Math.PI) / 180);
    ctx.translate(-cx, -cy);
    const fit = ctx.isPointInPath(path, cx, cy);
    ctx.restore();

    return fit && fitsRotation;
  };

  setDroppedShapes((prevShapes) => {
    let updated = prevShapes.map((s) => {
      if (s.id !== shapeId) return s;
      
      // Only apply grid snapping if the shape has no rotation or minimal rotation
      const normalizedRotation = normalizeAngle(s.rotation);
      const isNearZeroRotation = normalizedRotation <= SHAPE_CONFIG.rotationTolerance || 
                                normalizedRotation >= 360 - SHAPE_CONFIG.rotationTolerance;
      
      let finalPosition = s.position;
      
      // Apply grid snapping only for non-rotated shapes
      if (isNearZeroRotation) {
        const shapeCenter = {
          x: s.position.x + SHAPE_CONFIG.size / 2,
          y: s.position.y + SHAPE_CONFIG.size / 2
        };
        
        const snappedPosition = getSnappedPosition(shapeCenter, canvasBounds.width, canvasBounds.height, SHAPE_CONFIG.size);
        finalPosition = snappedPosition || s.position;
      }
      
      const updatedShape = { ...s, position: finalPosition };
      
      if (checkFit(updatedShape)) {
        return {
          ...updatedShape,
          animate: true,
          rotation: 0,
          position: getSnapPosition(s.type),
        };
      }
      return updatedShape;
    });

    // Rest of the function remains the same...
    const toRemove = new Set();
    const flashSet = new Set();
    const shapesByType = new Map();

    for (const shape of updated) {
      if (!shapesByType.has(shape.type)) {
        shapesByType.set(shape.type, []);
      }
      shapesByType.get(shape.type).push(shape);
    }

    for (const [, group] of shapesByType) {
      const len = group.length;
      for (let i = 0; i < len; i++) {
        const a = group[i];
        for (let j = i + 1; j < len; j++) {
          const b = group[j];
          if (toRemove.has(a.id) || toRemove.has(b.id)) continue;

          const overlapW = Math.max(
            0,
            Math.min(a.position.x + SHAPE_CONFIG.size, b.position.x + SHAPE_CONFIG.size) -
              Math.max(a.position.x, b.position.x)
          );
          const overlapH = Math.max(
            0,
            Math.min(a.position.y + SHAPE_CONFIG.size, b.position.y + SHAPE_CONFIG.size) -
              Math.max(a.position.y, b.position.y)
          );
          const overlapArea = overlapW * overlapH;
          const totalArea = SHAPE_CONFIG.size * SHAPE_CONFIG.size;

          if (overlapArea > 0.2 * totalArea) {
            const centerX = a.position.x;
            const centerY = a.position.y;
            a.position = { x: centerX, y: centerY };

            flashSet.add(b.id);
            toRemove.add(b.id);
          }
        }
      }
    }

    // Flash animation
    flashSet.forEach((id) => {
      const el = document.getElementById(`shape-${id}`);
      if (el) {
        el.classList.add("shape-flash");
        setTimeout(() => el.classList.remove("shape-flash"), 100);
      }
    });

    setTimeout(() => {
      setDroppedShapes((prevFinal) =>
        prevFinal.filter((s) => !toRemove.has(s.id))
      );
    }, 500);

    return updated;
  });

  delete visualPositionRef.current[shapeId];
  delete collisionPauseRef.current[shapeId];
  dragDataRef.current = {
    isDragging: false,
    shapeId: null,
    offset: { x: 0, y: 0 },
  };
  setDraggingShapeId(null);
}, [normalizeAngle]);

  const handleRotateMove = useCallback((x, y) => {
    if (!rotationDataRef.current.isRotating) return;
    const { shapeId, center, startAngle, initialRotation } = rotationDataRef.current;
    const currentAngle = getAngle(center, x, y);
    const angleDiff = currentAngle - startAngle;
    const newRotation = initialRotation + angleDiff;
    setDroppedShapes((prev) =>
      prev.map((s) => (s.id === shapeId ? { ...s, rotation: newRotation } : s))
    );
  }, []);

  const handleRotateStart = (shapeId) => (center, startX, startY) => {
    setRotationStarted(true);
    const shape = droppedShapes.find((s) => s.id === shapeId);
    if (!shape) return;
    rotationDataRef.current = {
      isRotating: true,
      shapeId,
      center,
      startAngle: getAngle(center, startX, startY),
      initialRotation: shape.rotation,
    };
    window.addEventListener("mousemove", handleRotationMouseMove);
    window.addEventListener("mouseup", handleRotationMouseUp);
  };

  const handleRotationMouseMove = useCallback((e) => {
    handleRotateMove(e.clientX, e.clientY);
  }, [handleRotateMove]);

  const handleRotationMouseUp = useCallback(() => {
    window.removeEventListener("mousemove", handleRotationMouseMove);
    window.removeEventListener("mouseup", handleRotationMouseUp);
    rotationDataRef.current = {
      isRotating: false,
      shapeId: null,
      center: { x: 0, y: 0 },
      startAngle: 0,
      initialRotation: 0,
    };
  }, []);

  const handleShapeMouseDown = (shapeId) => (e) => {
    const shape = droppedShapes.find((s) => s.id === shapeId);
    const bounds = canvasRef.current.getBoundingClientRect();
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

  const handleDoubleClick = (id) => () => {
    const shape = droppedShapes.find((s) => s.id === id);
    if (!shape) return;

    setSelectedPaletteShape(null);

    if (selectedCanvasShape && selectedCanvasShape.id === id) {
      setSelectedCanvasShape(null);
    } else {
      setSelectedCanvasShape({
        id: shape.id,
        type: shape.type,
        imageSrc: shape.imageSrc,
      });
    }

    setSelectedShapeId((prev) => (prev === id ? null : id));
  };

  const handleCanvasShapeClick = (id) => () => {
    const shape = droppedShapes.find((s) => s.id === id);
    if (rotationStarted) {
    setRotationStarted(false);
    return; // suppress click
  }
    if (!shape) return;

    setSelectedCanvasShape({
      id: shape.id,
      type: shape.type,
      imageSrc: shape.imageSrc,
    });
    setSelectedPaletteShape(null);
    setSelectedShapeId(id);
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

  return (
    <div className="container" style={{ width: "100vw", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
      <div style={{ position: "absolute", left: "22%", top: "30%", display: "flex", flexDirection: "column", gap: "4px", zIndex: 10 }}>
        <div
          style={{
            border: selectedPaletteShape?.type === "parallelogram" ? "3px solid #007bff" : "3px solid transparent",
            borderRadius: "8px",
            padding: "2px",
            backgroundColor: selectedPaletteShape?.type === "parallelogram" ? "#e7f3ff" : "transparent",
          }}
          onDoubleClick={handlePaletteDoubleClick("parallelogram", "/pb_s5/parallelogram.svg")}
        >
          <PaletteShape 
            type="parallelogram" 
            imageSrc="/pb_s5/parallelogram.svg" 
            onMouseDown={startGhostDrag("parallelogram", "/pb_s5/parallelogram.svg")}
          />
        </div>
        <div
          style={{
            border: selectedPaletteShape?.type === "triangle" ? "3px solid #007bff" : "3px solid transparent",
            borderRadius: "8px",
            padding: "2px",
            backgroundColor: selectedPaletteShape?.type === "triangle" ? "#e7f3ff" : "transparent",
          }}
          onDoubleClick={handlePaletteDoubleClick("triangle", "/pb_s5/triangle-_active.svg")}
        >
          <PaletteShape 
            type="triangle" 
            imageSrc="/pb_s5/triangle-_active.svg" 
            onMouseDown={startGhostDrag("triangle", "/pb_s5/triangle-_active.svg")}
          />
        </div>
        <div
          style={{
            border: selectedPaletteShape?.type === "hexagon" ? "3px solid #007bff" : "3px solid transparent",
            borderRadius: "8px",
            padding: "2px",
            backgroundColor: selectedPaletteShape?.type === "hexagon" ? "#e7f3ff" : "transparent",
          }}
          onDoubleClick={handlePaletteDoubleClick("hexagon", "/pb_s5/hexagon_active.svg")}
        >
          <PaletteShape 
            type="hexagon" 
            imageSrc="/pb_s5/hexagon_active.svg" 
            onMouseDown={startGhostDrag("hexagon", "/pb_s5/hexagon_active.svg")}
          />
        </div>
      </div>

      <div 
        ref={canvasRef} 
        className="canvas-wrapper" 
        style={{ width: "600px", height: "400px", border: "2px dashed gray", position: "relative", overflow: "hidden" }}
        onClick={handleCanvasClick}
        onDoubleClick={handleCanvasDoubleClick}
      >
        <Canvas droppedShapes={droppedShapes} />
        
        {/* Render pending shape */}
        {pendingShape && (
          <div
            onClick={handlePendingShapeClick}
            style={{
              position: "absolute",
              left: pendingShape.position.x,
              top: pendingShape.position.y,
              width: SHAPE_CONFIG.size,
              height: SHAPE_CONFIG.size,
              cursor: "pointer",
              border: checkShapeFit(pendingShape) ? "2px dashed #28a745" : "2px dashed #007bff",
              borderRadius: "8px",
              backgroundColor: checkShapeFit(pendingShape) ? "rgba(40, 167, 69, 0.1)" : "rgba(0, 123, 255, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
          >
            <img
              src={pendingShape.imageSrc}
              alt={pendingShape.type}
              style={{
                width: "90%",
                height: "90%",
                opacity: 0.8,
                pointerEvents: "none",
              }}
            />
            {checkShapeFit(pendingShape) && (
              <div
                style={{
                  position: "absolute",
                  top: -25,
                  left: "50%",
                  transform: "translateX(-50%)",
                  backgroundColor: "#28a745",
                  color: "white",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  fontWeight: "bold",
                  whiteSpace: "nowrap",
                }}
              >
                
              </div>
            )}
          </div>
        )}
        
        {/* Render dropped shapes */}
        {droppedShapes.map((shape) => {
          const isDragging = draggingShapeId === shape.id;
          const isCanvasSelected = selectedCanvasShape && selectedCanvasShape.id === shape.id;
          const displayPosition = isDragging && visualPositionRef.current[shape.id]
            ? visualPositionRef.current[shape.id]
            : shape.position;
          return (
            <DraggableShape
              key={shape.id}
              {...shape}
              position={displayPosition}
              isSelected={selectedShapeId === shape.id || isCanvasSelected}
              isDragging={isDragging}
              onMouseDown={handleShapeMouseDown(shape.id)}
              onClick={handleCanvasShapeClick(shape.id)}
              onRotateStart={handleRotateStart(shape.id)}
              onRotateMove={handleRotateMove}
              onRotateEnd={handleRotationMouseUp}
              onDelete={() => {
                setDroppedShapes((prev) => prev.filter((s) => s.id !== shape.id));
                delete visualPositionRef.current[shape.id];
                delete collisionPauseRef.current[shape.id];
                if (draggingShapeId === shape.id) setDraggingShapeId(null);
                if (selectedShapeId === shape.id) setSelectedShapeId(null);
                if (selectedCanvasShape && selectedCanvasShape.id === shape.id) setSelectedCanvasShape(null);
              }}
            />
          );
        })}
      </div>

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