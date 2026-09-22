import { parseGraph } from "./graph";

export const emptyCanvas = () =>
  parseGraph({
    assets: {},
    edges: [],
    errors: {},
    nodes: [],
    outputs: {},
    revision: 0,
  });
