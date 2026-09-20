"use client";

import { Button } from "@workspace/ui/components/button";
import {
  BaseEdge,
  type Edge,
  EdgeLabelRenderer,
  type EdgeProps,
  getBezierPath,
} from "@xyflow/react";
import { UnplugIcon } from "lucide-react";

type CanvasConnection = Edge<{ busy: boolean; disconnect: () => void }>;

export function CanvasEdgeView(props: EdgeProps<CanvasConnection>) {
  const [path, labelX, labelY] = getBezierPath(props);
  return (
    <>
      <BaseEdge
        id={props.id}
        interactionWidth={20}
        markerEnd={props.markerEnd}
        path={path}
        style={props.style}
      />
      {props.selected && props.data ? (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan pointer-events-auto absolute"
            style={{
              transform: `translate(-50%, -100%) translate(${labelX}px, ${labelY - 8}px)`,
            }}
          >
            <Button
              className="shadow-sm"
              disabled={props.data.busy}
              onClick={(event) => {
                event.stopPropagation();
                props.data?.disconnect();
              }}
              size="sm"
              variant="outline"
            >
              <UnplugIcon className="size-4" />
              断开连接
            </Button>
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}
