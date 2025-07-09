export const getParallelogramPath = (offsetY = 0) => {
  const path = new Path2D();
  path.moveTo(105, 50 + offsetY);
  path.lineTo(185, 50 + offsetY);
  path.lineTo(165, 150 + offsetY);
  path.lineTo(85, 150 + offsetY);
  path.closePath();
  return path;
};

export const getTrianglePath = (offsetY = 0) => {
  const path = new Path2D();
  path.moveTo(105, 50 + offsetY);
  path.lineTo(185, 50 + offsetY);
  path.lineTo(150, -30 + offsetY);
  path.closePath();
  return path;
};

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

