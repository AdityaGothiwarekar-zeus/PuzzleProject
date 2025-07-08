// Components/DraggableShape.jsx
import React, { useState, useRef } from "react";
import { RotateCw } from "lucide-react";

export default function DraggableShape({
  type,
  position,
  onMouseDown,
  onDoubleClick,
  imageSrc,
  rotation = 0,
  onRotateStart,
  onRotateMove,
  onRotateEnd,
  animate = false,
  isSelected = false,
  isDragging = false,
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

  const handleMouseDown = (e) => {
    // Prevent drag on double-click
    if (e.detail === 2) {
      e.preventDefault();
      return;
    }
    // Call the parent's onMouseDown handler to start dragging
    if (onMouseDown) {
      onMouseDown(e);
    }
  };

  const handleDoubleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Use requestAnimationFrame for immediate response
    requestAnimationFrame(() => {
      if (onDoubleClick) {
        onDoubleClick(e);
      }
    });
  };

  return (
    
    <div
      ref={shapeRef}
      className={`shape-wrapper ${animate ? 'animate' : ''}`}
      style={{
        position: "absolute",
        left: position.x,
        top: position.y,
        transform: `rotate(${rotation}deg)`,
        transformOrigin: "center center",
        width: "100px",
        height: "100px",
        border: "1px dashed red", // temporary boundary for collision testing
        zIndex: 1,
        backgroundColor: "transparent",
        cursor: isSelected ? "pointer" : "grab",
        filter: isDragging ? "drop-shadow(4px 4px 10px rgba(0,0,0,0.4))" : "none",
      }}

      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseDown={handleMouseDown}  // Add this back to the wrapper div
      onDoubleClick={handleDoubleClick}
    >
      <img
        src={imageSrc}
        alt={`Draggable ${type}`}
        style={{
          width: "100%",
          height: "100%",
          userSelect: "none",
          pointerEvents: "none",
          opacity: isSelected ? 0.9 : 1,
        }}
        draggable={false}
      />

      {(hovered || isSelected) && (
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