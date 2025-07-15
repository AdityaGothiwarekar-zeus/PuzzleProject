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
 *
 * @param {number} [offsetY=0] - Vertical offset to shift the shape along the Y-axis.
 * @returns {Path2D} The Path2D object for the parallelogram.
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
 *
 * @param {number} [offsetY=0] - Vertical offset to shift the shape along the Y-axis.
 * @returns {Path2D} The Path2D object for the triangle.
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
 *
 * @param {number} [size=40] - The radius of the hexagon from its center to a vertex.
 * @returns {Path2D} The Path2D object for the hexagon.
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


export function snapToCanvasEdge(pos, canvasRect, size, threshold = 5) {
  const snapped = { ...pos };
  if (Math.abs(pos.x) <= threshold) snapped.x = 0;
  if (Math.abs(pos.y) <= threshold) snapped.y = 0;
  if (Math.abs((canvasRect.width - size) - pos.x) <= threshold)
    snapped.x = canvasRect.width - size;
  if (Math.abs((canvasRect.height - size) - pos.y) <= threshold)
    snapped.y = canvasRect.height - size;
  return snapped;
}

export const getNearestGridPoint = (x, y, spacing = 10) => {
  const snappedX = Math.round(x / spacing) * spacing;
  const snappedY = Math.round(y / spacing) * spacing;
  return { x: snappedX, y: snappedY };
};

//perfect polygon shape centers
export function getShapePoints(type) {
  if (!type || typeof type.toLowerCase !== 'function') return [];

  switch (type.toLowerCase()) {
    case 'parallelogram':
      return [/* your parallelogram points */];
    case 'triangle':
      return [/* triangle points */];
    case 'hexagon':
      return [/* hexagon points */];
    default:
      return [];
  }
}

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


export const isOverlappingWithExisting = (newPosition, size, droppedShapes, shapeType, allowOverlapTypes = []) => {
  if (allowOverlapTypes.includes(shapeType)) return false;

  for (const shape of droppedShapes) {
    if (allowOverlapTypes.includes(shape.type)) continue;

    const existing = shape.position;
    const overlapW = Math.max(0, Math.min(newPosition.x + size, existing.x + size) - Math.max(newPosition.x, existing.x));
    const overlapH = Math.max(0, Math.min(newPosition.y + size, existing.y + size) - Math.max(newPosition.y, existing.y));
    const overlapArea = overlapW * overlapH;

    if (overlapArea > 0) return true;
  }
  return false;
};



