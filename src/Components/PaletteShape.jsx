import React from "react";

const PaletteShape = ({ type, imageSrc, onMouseDown }) => (
  <div
    onMouseDown={onMouseDown}
    style={{
  width: 100,
  height: 100,
  margin: 10,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "grab",
  borderRadius: "8px" // optional: adds smooth corners
}}

  >
    <img src={imageSrc} alt={type} style={{ width: "90%", pointerEvents: "none" }} />
  </div>
);

export default PaletteShape;
