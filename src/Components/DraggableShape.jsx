// import React, { useState, useRef } from "react";
// import { RotateCw, Trash2 } from "lucide-react";
// import id from "../App"

// export default function DraggableShape({
//   type,
//   position,
//   onMouseDown,
//   onDoubleClick,
//   imageSrc,
//   rotation = 0,
//   onRotateStart,
//   onRotateMove,
//   onRotateEnd,
//   animate = false,
//   isSelected = false,
//   isDragging = false,
//   onDelete,
//   onClick,
// }) {
//   const rotationStartedRef = useRef(false);
//   const [hovered, setHovered] = useState(false);
//   const shapeRef = useRef(null);

//   const handleRotateMouseDown = (e) => {
//     rotationStartedRef.current = true;
//     e.stopPropagation();
//     if (!shapeRef.current) return;

//     const rect = shapeRef.current.getBoundingClientRect();
//     const center = {
//       x: rect.left + rect.width / 2,
//       y: rect.top + rect.height / 2,
//     };

//     onRotateStart(center, e.clientX, e.clientY);

//     const handleMouseMove = (moveEvent) => {
//       onRotateMove(moveEvent.clientX, moveEvent.clientY);
//     };

//     const handleMouseUp = () => {
//       window.removeEventListener("mousemove", handleMouseMove);
//       window.removeEventListener("mouseup", handleMouseUp);
//       onRotateEnd();
//     };

//     window.addEventListener("mousemove", handleMouseMove);
//     window.addEventListener("mouseup", handleMouseUp);
//   };

//   const handleMouseDown = (e) => {
//     if (e.detail === 2) {
//       e.preventDefault();
//       return;
//     }
//     if (onMouseDown) {
//       onMouseDown(e);
//     }
//   };

//   // const handleDoubleClick = (e) => {
//   //   e.preventDefault();
//   //   e.stopPropagation();
//   //   requestAnimationFrame(() => {
//   //     if (onDoubleClick) {
//   //       onDoubleClick(e);
//   //     }
//   //   });
//   // };

//   // Get border style based on shape type
//   const getBorderStyle = () => {
//     const baseStyle = {
//       position: "absolute",
//       top: 0,
//       left: 0,
//       width: "100%",
//       height: "100%",
//       pointerEvents: "none",
//       stroke: "red",
//       strokeWidth: 2,
//       strokeDasharray: "5,5",
//       fill: "none",
//     };

//     switch (type?.toLowerCase()) {
//       case "triangle":
//         return (
//           <svg style={baseStyle} viewBox="0 0 100 100">
//             <polygon points="50,5 95,95 5,95" />
//           </svg>
//         );
//       case "hexagon":
//         return (
//           <svg style={baseStyle} viewBox="0 0 100 100">
//             <polygon points="50,5 85,25 85,75 50,95 15,75 15,25" />
//           </svg>
//         );
//       case "circle":
//         return (
//           <svg style={baseStyle} viewBox="0 0 100 100">
//             <circle cx="50" cy="50" r="45" />
//           </svg>
//         );
//       case "diamond":
//         return (
//           <svg style={baseStyle} viewBox="0 0 100 100">
//             <polygon points="50,5 95,50 50,95 5,50" />
//           </svg>
//         );
//       case "pentagon":
//         return (
//           <svg style={baseStyle} viewBox="0 0 100 100">
//             <polygon points="50,5 90,35 75,85 25,85 10,35" />
//           </svg>
//         );
//       case "octagon":
//         return (
//           <svg style={baseStyle} viewBox="0 0 100 100">
//             <polygon points="30,5 70,5 95,30 95,70 70,95 30,95 5,70 5,30" />
//           </svg>
//         );
//       case "star":
//         return (
//           <svg style={baseStyle} viewBox="0 0 100 100">
//             <polygon points="50,2 61,35 95,35 68,57 79,91 50,69 21,91 32,57 5,35 39,35" />
//           </svg>
//         );
//       case "parallelogram":
//         return (
//           <svg style={baseStyle} viewBox="0 0 100 100">
//             <polygon points="15,5 95,5 85,95 5,95" transform="rotate(4 60 60)" />
//           </svg>
//         );
//       case "trapezoid":
//         return (
//           <svg style={baseStyle} viewBox="0 0 100 100">
//             <polygon points="25,10 75,10 90,90 10,90" />
//           </svg>
//         );
//       case "square":
//       case "rectangle":
//       default:
//         return (
//           <svg style={baseStyle} viewBox="0 0 100 100">
//             <rect x="5" y="5" width="90" height="90" />
//           </svg>
//         );
//     }
//   };

//   return (
//     <div
//       ref={shapeRef}
//       data-shape-id={id} 
//       className={`shape-wrapper ${animate ? 'animate' : ''}`}
//       style={{
//         position: "absolute",
//         left: position.x,
//         top: position.y,
//         transform: `rotate(${rotation}deg)`,
//         transformOrigin: "center center",
//         width: "100px",
//         height: "100px",
//         zIndex: 1,
//         backgroundColor: "transparent",
//         cursor: isSelected ? "pointer" : "grab",
//         filter: isDragging ? "drop-shadow(4px 4px 10px rgba(0,0,0,0.4))" : "none",
//       }}
//       onMouseEnter={() => setHovered(true)}
//       onMouseLeave={() => setHovered(false)}
//       onMouseDown={handleMouseDown}
//       // onDoubleClick={handleDoubleClick}
//       onClick={(e) => {
//     e.stopPropagation(); // prevent bubbling to canvas
//     if (onClick) onClick(e); //call shape click handler
//   }}
//     >
//       <img
//         src={imageSrc}
//         alt={`Draggable ${type}`}
//         style={{
//           width: "100%",
//           height: "100%",
//           userSelect: "none",
//           pointerEvents: "none",
//           opacity: isSelected ? 0.9 : 1,
//           position: "relative",
//           zIndex: 1,
//         }}
//         draggable={false}
//       />

//       {/* Custom border based on shape type */}
//       {getBorderStyle()}

//       {(hovered || isSelected) && (
//         <>
//           {/* Rotate icon (top-right) */}
//           <div
//             className="rotate-icon"
//             onMouseDown={handleRotateMouseDown}
//             style={{
//               position: "absolute",
//               top: "-10px",
//               right: "-10px",
//               backgroundColor: "#fff",
//               borderRadius: "50%",
//               padding: "4px",
//               boxShadow: "0 0 5px rgba(0,0,0,0.3)",
//               cursor: "grab",
//               zIndex: 10,
//             }}
//           >
//             <RotateCw size={16} />
//           </div>

//           {/* Delete icon (bottom-left) */}
//           <div
//             className="delete-icon"
//             onClick={(e) => {
//               e.stopPropagation();
//               if (onDelete) onDelete();
//             }}
//             style={{
//               position: "absolute",
//               bottom: "-10px",
//               left: "-10px",
//               backgroundColor: "#fff",
//               borderRadius: "50%",
//               padding: "4px",
//               boxShadow: "0 0 5px rgba(0,0,0,0.3)",
//               cursor: "pointer",
//               zIndex: 10,
//             }}
//           >
//             <Trash2 size={16} />
//           </div>
//         </>
//       )}
//     </div>
//   );
// }
import React, { useState, useRef } from "react";
import { RotateCw, Trash2 } from "lucide-react";
import id from "../App"; // You may want to rename this if it's not a dynamic ID

export default function DraggableShape({
  type,
  position,
  onMouseDown,
  imageSrc,
  rotation = 0,
  onRotateStart,
  onRotateMove,
  onRotateEnd,
  animate = false,
  isSelected = false,
  isDragging = false,
  onDelete,
  onClick,
}) {
  const shapeRef = useRef(null);
  const rotationStartedRef = useRef(false);
  const [hovered, setHovered] = useState(false);

  const handleRotateMouseDown = (e) => {
    rotationStartedRef.current = true;
    e.stopPropagation();
    if (!shapeRef.current) return;

    const rect = shapeRef.current.getBoundingClientRect();
    const center = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };

    onRotateStart?.(center, e.clientX, e.clientY);

    const handleMouseMove = (moveEvent) => {
      onRotateMove?.(moveEvent.clientX, moveEvent.clientY);
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      onRotateEnd?.();
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const safeHandler = (fn, stop = true) => (e) => {
    if (stop) e.stopPropagation();
    fn?.(e);
  };

  const handleMouseDown = (e) => {
    if (e.detail === 2) {
      e.preventDefault();
      return;
    }
    onMouseDown?.(e);
  };

  const getBorderStyle = () => {
    const baseStyle = {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      pointerEvents: "none",
      stroke: "red",
      strokeWidth: 2,
      strokeDasharray: "5,5",
      fill: "none",
    };

    const shapes = {
      triangle: <polygon points="50,5 95,95 5,95" />,
      hexagon: <polygon points="50,5 85,25 85,75 50,95 15,75 15,25" />,
      circle: <circle cx="50" cy="50" r="45" />,
      diamond: <polygon points="50,5 95,50 50,95 5,50" />,
      pentagon: <polygon points="50,5 90,35 75,85 25,85 10,35" />,
      octagon: <polygon points="30,5 70,5 95,30 95,70 70,95 30,95 5,70 5,30" />,
      star: <polygon points="50,2 61,35 95,35 68,57 79,91 50,69 21,91 32,57 5,35 39,35" />,
      trapezoid: <polygon points="25,10 75,10 90,90 10,90" />,
      parallelogram: <polygon points="15,5 95,5 85,95 5,95" transform="rotate(4 60 60)" />,
      square: <rect x="5" y="5" width="90" height="90" />,
      rectangle: <rect x="5" y="5" width="90" height="90" />,
    };

    const shape = type?.toLowerCase();
    return (
      <svg style={baseStyle} viewBox="0 0 100 100">
        {shapes[shape] || shapes["rectangle"]}
      </svg>
    );
  };

  return (
    <div
      ref={shapeRef}
      data-shape-id={id}
      className={`shape-wrapper ${animate ? "animate" : ""}`}
      style={{
        position: "absolute",
        left: position.x,
        top: position.y,
        transform: `rotate(${rotation}deg)`,
        transformOrigin: "center center",
        width: "100px",
        height: "100px",
        zIndex: 1,
        backgroundColor: "transparent",
        cursor: isSelected ? "pointer" : "grab",
        filter: isDragging ? "drop-shadow(4px 4px 10px rgba(0,0,0,0.4))" : "none",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseDown={handleMouseDown}
      onClick={safeHandler(onClick)}
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
          position: "relative",
          zIndex: 1,
        }}
        draggable={false}
      />

      {getBorderStyle()}

      {(hovered || isSelected) && (
        <>
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

          <div
            className="delete-icon"
            onClick={safeHandler(onDelete)}
            style={{
              position: "absolute",
              bottom: "-10px",
              left: "-10px",
              backgroundColor: "#fff",
              borderRadius: "50%",
              padding: "4px",
              boxShadow: "0 0 5px rgba(0,0,0,0.3)",
              cursor: "pointer",
              zIndex: 10,
            }}
          >
            <Trash2 size={16} />
          </div>
        </>
      )}
    </div>
  );
}
