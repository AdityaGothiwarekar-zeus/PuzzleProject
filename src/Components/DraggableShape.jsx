import React, { useState, useRef, useEffect } from "react";
import { RotateCw } from "lucide-react";

export default function DraggableShape({
  type,
  position,
  onMouseDown,
  imageSrc,
  rotation = 0,
  onRotateStart,
  onRotateMove,
  onRotateEnd,
}) {
  const [hovered, setHovered] = useState(false);
  const shapeRef = useRef(null);

  const handleRotateMouseDown = (e) => {
    e.stopPropagation();
    if (!shapeRef.current) return;

    const rect = shapeRef.current.getBoundingClientRect();
    const center = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };

    onRotateStart(center, e.clientX, e.clientY);

    const handleMouseMove = (moveEvent) => {
      onRotateMove(moveEvent.clientX, moveEvent.clientY);
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      onRotateEnd();
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div
      ref={shapeRef}
      className="shape-wrapper"
      style={{
        position: "absolute",
        left: position.x,
        top: position.y,
        transform: "rotate(" + rotation + "deg)",
        transformOrigin: "center center",
        width: "100px",
        height: "100px",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <img
        src={imageSrc}
        alt={`Draggable ${type}`}
        style={{
          width: "100px",
          height: "100px",
          cursor: "grab",
          userSelect: "none",
        }}
        onMouseDown={onMouseDown}
        draggable={false}
      />

      {hovered && (
        <div
          className="rotate-icon"
          onMouseDown={handleRotateMouseDown}
          style={{
            position: "absolute",
            top: "-10px",
            right: "-10px",
            backgroundColor: "#fff",
            borderRadius: "50%",
            padding: "4px",
            boxShadow: "0 0 5px rgba(0,0,0,0.3)",
            cursor: "grab",
            zIndex: 10,
          }}
        >
          <RotateCw size={16} />
        </div>
      )}
    </div>
  );
}
