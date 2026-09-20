import {
  type CanvasGraph,
  type CanvasNode,
  editGraph,
  parseGraph,
} from "./graph";

interface Input {
  resultIndex?: number;
  source: string;
}

export function resultConnections(graph: CanvasGraph, input: Input) {
  const source = graph.nodes.find((node) => node.id === input.source);
  if (
    source &&
    ["text", "image", "gif"].includes(source.kind) &&
    input.resultIndex === undefined
  ) {
    return Array.from(
      { length: source.kind === "gif" ? 1 : (source.resultCount ?? 1) },
      (_, resultIndex) => ({ ...input, resultIndex })
    );
  }
  return [input];
}

export function addCanvasNode(
  graph: CanvasGraph,
  node: CanvasNode,
  inputs: Input[] = []
) {
  const next = editGraph(graph, {
    nodes: [...graph.nodes, node],
    edges: [
      ...graph.edges,
      ...inputs.flatMap((input) =>
        resultConnections(graph, input).map((source) => ({
          ...source,
          target: node.id,
        }))
      ),
    ],
  });
  return { graph: next, nodeId: node.id };
}

// Preserve existing inputs and outputs while making result selection explicit.
export function migrateGenerationInputs(graph: CanvasGraph): CanvasGraph {
  return parseGraph({
    ...graph,
    edges: graph.edges.flatMap((edge) =>
      resultConnections(graph, edge).map((input) => ({ ...edge, ...input }))
    ),
  });
}

export function generationFeedback(graph: CanvasGraph, nodeId: string) {
  const node = graph.nodes.find((item) => item.id === nodeId);
  return {
    nodeId,
    kind: node?.kind,
    executionTarget:
      node && ["text", "image", "gif"].includes(node.kind) ? nodeId : null,
    inputs: graph.edges.filter((edge) => edge.target === nodeId),
    results:
      node && ["text", "image", "gif"].includes(node.kind)
        ? Array.from(
            { length: node.kind === "gif" ? 1 : (node.resultCount ?? 1) },
            (_, resultIndex) => ({ source: nodeId, resultIndex })
          )
        : [],
    inputContract:
      "Connected text is passed in full as the generation prompt, in connection order. Connected images are model image inputs. Generators accept inline prompt instructions; connected text is appended in full. Separate prompt materials are optional. Use returned results as addNode.sourceResults, or connectNodes with source and resultIndex. Result previews already exist; do not add an output node to continue.",
  };
}
