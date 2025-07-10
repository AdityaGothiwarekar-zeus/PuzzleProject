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
