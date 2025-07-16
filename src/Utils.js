// Enhanced Utils.js with SVG Path-Based Collision Detection

/**
 * A mapping of shape types to their corresponding image file paths.
 */
export const shapeImageMap = {
  parallelogram: "/pb_s5/parallelogram.svg",
  triangle: "/pb_s5/triangle-_active.svg",
  hexagon: "/pb_s5/hexagon_active.svg",
};

/**
 * Generates a Path2D object representing a parallelogram shape.
 */
export const getParallelogramPath = (offsetY = 0) => {
  const path = new Path2D();
  path.moveTo(105, 50 + offsetY);
  path.lineTo(185, 50 + offsetY);
  path.lineTo(165, 150 + offsetY);
  path.lineTo(85, 150 + offsetY);
  path.closePath();
  return path;
};

/**
 * Generates a Path2D object representing a triangle shape.
 */
export const getTrianglePath = (offsetY = 0) => {
  const path = new Path2D();
  path.moveTo(105, 50 + offsetY);
  path.lineTo(185, 50 + offsetY);
  path.lineTo(150, -30 + offsetY);
  path.closePath();
  return path;
};

/**
 * Generates a Path2D object representing a regular hexagon shape.
 */
export function getHexagonPath(size = 40) {
  const path = new Path2D();
  const centerX = 250;
  const centerY = 160;

  for (let i = 0; i < 6; i++) {
    const angleDeg = 60 * i - 30;
    const angleRad = (Math.PI / 180) * angleDeg;
    const x = centerX + size * Math.cos(angleRad);
    const y = centerY + size * Math.sin(angleRad);
    if (i === 0) {
      path.moveTo(x, y);
    } else {
      path.lineTo(x, y);
    }
  }

  path.closePath();
  return path;
}

/**
 * Get the actual polygon points for each shape type based on your SVG paths
 * These coordinates match your SVG path definitions
 */
export const getShapePolygonPoints = (type, centerX, centerY, size = 100, rotation = 0) => {
  let points = [];
  
  // Scale factor to match your shape size
  const scale = size / 100;
  
  switch (type?.toLowerCase()) {
    case 'parallelogram':
      // Based on your getParallelogramPath coordinates
      points = [
        { x: 105 - 135, y: 50 - 100 },   // Adjusted to center around 0,0
        { x: 185 - 135, y: 50 - 100 },
        { x: 165 - 135, y: 150 - 100 },
        { x: 85 - 135, y: 150 - 100 }
      ];
      break;
      
    case 'triangle':
      // Based on your getTrianglePath coordinates
      points = [
        { x: 105 - 145, y: 50 - 10 },    // Adjusted to center around 0,0
        { x: 185 - 145, y: 50 - 10 },
        { x: 150 - 145, y: -30 - 10 }
      ];
      break;
      
    case 'hexagon':
      // Based on your getHexagonPath - regular hexagon
      const hexRadius = 40;
      for (let i = 0; i < 6; i++) {
        const angleDeg = 60 * i - 30;
        const angleRad = (Math.PI / 180) * angleDeg;
        points.push({
          x: hexRadius * Math.cos(angleRad),
          y: hexRadius * Math.sin(angleRad)
        });
      }
      break;
      
    default:
      // Fallback to rectangle
      const halfSize = size / 2;
      points = [
        { x: -halfSize, y: -halfSize },
        { x: halfSize, y: -halfSize },
        { x: halfSize, y: halfSize },
        { x: -halfSize, y: halfSize }
      ];
      break;
  }
  
  // Apply scaling, rotation, and translation
  const rotationRad = (rotation * Math.PI) / 180;
  return points.map(point => {
    // Scale the point
    const scaledX = point.x * scale;
    const scaledY = point.y * scale;
    
    // Apply rotation
    const rotatedX = scaledX * Math.cos(rotationRad) - scaledY * Math.sin(rotationRad);
    const rotatedY = scaledX * Math.sin(rotationRad) + scaledY * Math.cos(rotationRad);
    
    // Translate to final position
    return {
      x: rotatedX + centerX,
      y: rotatedY + centerY
    };
  });
};

/**
 * Enhanced Path2D-based collision detection
 */
export const createShapePath2D = (type, centerX, centerY, size = 100, rotation = 0) => {
  const path = new Path2D();
  const scale = size / 100;
  
  // Create a temporary canvas context for path operations
  const tempCanvas = document.createElement('canvas');
  const ctx = tempCanvas.getContext('2d');
  
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.scale(scale, scale);
  ctx.rotate((rotation * Math.PI) / 180);
  
  switch (type?.toLowerCase()) {
    case 'parallelogram':
      // Centered parallelogram path
      path.moveTo(105 - 135, 50 - 100);
      path.lineTo(185 - 135, 50 - 100);
      path.lineTo(165 - 135, 150 - 100);
      path.lineTo(85 - 135, 150 - 100);
      path.closePath();
      break;
      
    case 'triangle':
      // Centered triangle path
      path.moveTo(105 - 145, 50 - 10);
      path.lineTo(185 - 145, 50 - 10);
      path.lineTo(150 - 145, -30 - 10);
      path.closePath();
      break;
      
    case 'hexagon':
      // Centered hexagon path
      const hexRadius = 40;
      for (let i = 0; i < 6; i++) {
        const angleDeg = 60 * i - 30;
        const angleRad = (Math.PI / 180) * angleDeg;
        const x = hexRadius * Math.cos(angleRad);
        const y = hexRadius * Math.sin(angleRad);
        if (i === 0) {
          path.moveTo(x, y);
        } else {
          path.lineTo(x, y);
        }
      }
      path.closePath();
      break;
      
    default:
      // Rectangle fallback
      const halfSize = 50;
      path.rect(-halfSize, -halfSize, halfSize * 2, halfSize * 2);
      break;
  }
  
  ctx.restore();
  return path;
};

/**
 * Check if a point is inside a polygon using ray casting algorithm
 */
export const isPointInPolygon = (point, polygon) => {
  let inside = false;
  const { x, y } = point;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const { x: xi, y: yi } = polygon[i];
    const { x: xj, y: yj } = polygon[j];
    
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  
  return inside;
};

/**
 * Check if two polygons intersect using Separating Axis Theorem (SAT)
 */
export const doPolygonsIntersect = (poly1, poly2) => {
  const polygons = [poly1, poly2];
  
  for (let i = 0; i < polygons.length; i++) {
    const polygon = polygons[i];
    
    for (let j = 0; j < polygon.length; j++) {
      const current = polygon[j];
      const next = polygon[(j + 1) % polygon.length];
      
      // Get edge vector
      const edge = { x: next.x - current.x, y: next.y - current.y };
      
      // Get perpendicular (normal) vector
      const normal = { x: -edge.y, y: edge.x };
      
      // Normalize the normal
      const length = Math.sqrt(normal.x * normal.x + normal.y * normal.y);
      if (length === 0) continue;
      normal.x /= length;
      normal.y /= length;
      
      // Project both polygons onto the normal
      let min1 = Infinity, max1 = -Infinity;
      let min2 = Infinity, max2 = -Infinity;
      
      for (const point of poly1) {
        const projection = point.x * normal.x + point.y * normal.y;
        min1 = Math.min(min1, projection);
        max1 = Math.max(max1, projection);
      }
      
      for (const point of poly2) {
        const projection = point.x * normal.x + point.y * normal.y;
        min2 = Math.min(min2, projection);
        max2 = Math.max(max2, projection);
      }
      
      // Check if projections overlap
      if (max1 < min2 || max2 < min1) {
        return false; // Separating axis found, no intersection
      }
    }
  }
  
  return true; // No separating axis found, polygons intersect
};

/**
 * Main collision detection function using actual shape boundaries
 */
export const areShapesColliding = (shape1, shape2, shapeSize = 100) => {
  const center1 = {
    x: shape1.position.x + shapeSize / 2,
    y: shape1.position.y + shapeSize / 2
  };
  
  const center2 = {
    x: shape2.position.x + shapeSize / 2,
    y: shape2.position.y + shapeSize / 2
  };
  
  // Get actual shape boundaries
  const poly1 = getShapePolygonPoints(shape1.type, center1.x, center1.y, shapeSize, shape1.rotation || 0);
  const poly2 = getShapePolygonPoints(shape2.type, center2.x, center2.y, shapeSize, shape2.rotation || 0);
  
  return doPolygonsIntersect(poly1, poly2);
};

/**
 * Enhanced collision detection with Path2D support
 */
export const areShapesCollidingPath2D = (shape1, shape2, shapeSize = 100, canvas) => {
  if (!canvas) return areShapesColliding(shape1, shape2, shapeSize);
  
  const ctx = canvas.getContext('2d');
  const center1 = {
    x: shape1.position.x + shapeSize / 2,
    y: shape1.position.y + shapeSize / 2
  };
  
  const center2 = {
    x: shape2.position.x + shapeSize / 2,
    y: shape2.position.y + shapeSize / 2
  };
  
  // Create Path2D objects for both shapes
  const path1 = createShapePath2D(shape1.type, center1.x, center1.y, shapeSize, shape1.rotation || 0);
  const path2 = createShapePath2D(shape2.type, center2.x, center2.y, shapeSize, shape2.rotation || 0);
  
  // Sample points around the perimeter of shape1 and test against shape2
  const poly1 = getShapePolygonPoints(shape1.type, center1.x, center1.y, shapeSize, shape1.rotation || 0);
  
  ctx.save();
  
  // Check if any point of shape1 is inside shape2
  for (const point of poly1) {
    if (ctx.isPointInPath(path2, point.x, point.y)) {
      ctx.restore();
      return true;
    }
  }
  
  // Check if any point of shape2 is inside shape1
  const poly2 = getShapePolygonPoints(shape2.type, center2.x, center2.y, shapeSize, shape2.rotation || 0);
  for (const point of poly2) {
    if (ctx.isPointInPath(path1, point.x, point.y)) {
      ctx.restore();
      return true;
    }
  }
  
  ctx.restore();
  return false;
};

/**
 * Check if shape overlaps with any existing shapes
 */
export const isOverlappingWithExisting = (newShape, existingShapes, shapeSize = 100, canvas = null) => {
  return existingShapes.some(existingShape => {
    if (canvas) {
      return areShapesCollidingPath2D(newShape, existingShape, shapeSize, canvas);
    } else {
      return areShapesColliding(newShape, existingShape, shapeSize);
    }
  });
};

/**
 * Main collision detection function for dragging
 */
export const isColliding = (newX, newY, shapeId, shapeType, shapeRotation, allShapes, shapeSize = 100, canvas = null) => {
  const newShape = {
    position: { x: newX, y: newY },
    type: shapeType,
    rotation: shapeRotation || 0
  };
  
  return allShapes.some(existingShape => {
    if (existingShape.id === shapeId) return false;
    
    if (canvas) {
      return areShapesCollidingPath2D(newShape, existingShape, shapeSize, canvas);
    } else {
      return areShapesColliding(newShape, existingShape, shapeSize);
    }
  });
};

// Legacy functions for backward compatibility
export const snapToCanvasEdge = (pos, canvasRect, size, threshold = 5) => {
  const snapped = { ...pos };
  if (Math.abs(pos.x) <= threshold) snapped.x = 0;
  if (Math.abs(pos.y) <= threshold) snapped.y = 0;
  if (Math.abs((canvasRect.width - size) - pos.x) <= threshold)
    snapped.x = canvasRect.width - size;
  if (Math.abs((canvasRect.height - size) - pos.y) <= threshold)
    snapped.y = canvasRect.height - size;
  return snapped;
};

export const getNearestGridPoint = (x, y, spacing = 10) => {
  const snappedX = Math.round(x / spacing) * spacing;
  const snappedY = Math.round(y / spacing) * spacing;
  return { x: snappedX, y: snappedY };
};

export const rotatePoints = (points, center, angleDeg) => {
  const angleRad = (angleDeg * Math.PI) / 180;
  return points.map(([x, y]) => {
    const dx = x - center[0];
    const dy = y - center[1];
    const rotatedX = center[0] + dx * Math.cos(angleRad) - dy * Math.sin(angleRad);
    const rotatedY = center[1] + dx * Math.sin(angleRad) + dy * Math.cos(angleRad);
    return [rotatedX, rotatedY];
  });
};

export const getBoundingBox = (points) => {
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys),
    centerX: (Math.max(...xs) + Math.min(...xs)) / 2,
    centerY: (Math.max(...ys) + Math.min(...ys)) / 2,
  };
};