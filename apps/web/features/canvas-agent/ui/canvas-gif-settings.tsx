import type { CanvasNodeData } from "./canvas-node";

export function CanvasGifSettings({ data }: { data: CanvasNodeData }) {
  const settings = data.node.gif ?? { rows: 2, columns: 2, fps: 4 };
  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-xs">
        连接一张网格图，按从左到右、从上到下的顺序切帧并循环播放。
      </p>
      <div className="nodrag grid grid-cols-3 gap-2">
        {(
          [
            { key: "rows", label: "行数", values: [1, 2, 3, 4] },
            { key: "columns", label: "列数", values: [1, 2, 3, 4] },
            { key: "fps", label: "帧率", values: [1, 2, 4, 6, 8, 12, 16, 24] },
          ] as const
        ).map(({ key, label, values }) => (
          <label className="space-y-1 text-xs" key={key}>
            <span>{label}</span>
            <select
              aria-label={label}
              className="block w-full rounded-md border bg-background p-1"
              disabled={data.busy}
              onChange={(event) =>
                data.update({
                  gif: { ...settings, [key]: Number(event.target.value) },
                })
              }
              value={settings[key]}
            >
              {Array.from(new Set([...values, settings[key]]))
                .sort((a, b) => a - b)
                .map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
            </select>
          </label>
        ))}
      </div>
    </div>
  );
}
