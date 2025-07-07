export const getParallelogramPath = (offsetY = 0) => {
  const path = new Path2D();
  path.moveTo(105, 50 + offsetY);
  path.lineTo(190, 50 + offsetY);
  path.lineTo(170, 150 + offsetY);
  path.lineTo(85, 150 + offsetY);
  path.closePath();
  return path;
};

export const getTrianglePath = (offsetY = 0) => {
  const path = new Path2D();
  path.moveTo(105, 50 + offsetY);
  path.lineTo(190, 50 + offsetY);
  path.lineTo(150, -30 + offsetY);
  path.closePath();
  return path;
};