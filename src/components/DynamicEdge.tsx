import React from "react";
import { BaseEdge, EdgeProps, getSmoothStepPath } from "@xyflow/react";

export const DynamicEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) => {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isWarning = data?.status === "warning";
  const isError = data?.status === "error";
  
  const strokeColor = isError ? "#ef4444" : isWarning ? "#eab308" : "#22d3ee"; // Default cyan

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={{ ...style, stroke: strokeColor, strokeWidth: 2 }} />
      {data?.label && (
        <foreignObject
          width={100}
          height={40}
          x={labelX - 50}
          y={labelY - 20}
          className="edgebutton-foreignobject pointer-events-none"
          requiredExtensions="http://www.w3.org/1999/xhtml"
        >
          <div className="flex items-center justify-center w-full h-full">
            <div className={`px-2 py-1 rounded text-[8px] font-mono border bg-zinc-950`}
                 style={{ borderColor: strokeColor, color: strokeColor }}>
              {data.label as string}
            </div>
          </div>
        </foreignObject>
      )}
    </>
  );
};
