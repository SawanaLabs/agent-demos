import {
  type CanvasGraph,
  type CanvasNode,
  createNode,
  editGraph,
  parseGraph,
} from "./graph";

export const isGenerator = (node: CanvasNode) =>
  ["text", "image"].includes(node.kind);
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

function promptInput(node: CanvasNode) {
  return {
    ...createNode("prompt", 0),
    label: `${node.label.slice(0, 94)} · 提示词`,
    prompt: node.prompt,
    position: { x: node.position.x - 400, y: node.position.y },
  };
}

export function addCanvasNode(
  graph: CanvasGraph,
  node: CanvasNode,
  inputs: Input[] = []
) {
  const prompt =
    isGenerator(node) && (node.prompt.trim() || inputs.length === 0)
      ? promptInput(node)
      : undefined;
  const next = editGraph(graph, {
    nodes: [
      ...graph.nodes,
      ...(prompt ? [prompt] : []),
      { ...node, prompt: isGenerator(node) ? "" : node.prompt },
    ],
    edges: [
      ...graph.edges,
      ...(prompt ? [{ source: prompt.id, target: node.id }] : []),
      ...inputs.flatMap((input) =>
        resultConnections(graph, input).map((source) => ({
          ...source,
          target: node.id,
        }))
      ),
    ],
  });
  return { graph: next, nodeId: node.id, promptNodeId: prompt?.id };
}

// Boundary migration preserves outputs: moving an instruction into a material does not regenerate it.
export function migrateGenerationInputs(graph: CanvasGraph): CanvasGraph {
  const nodes: CanvasNode[] = [];
  const outputs = { ...graph.outputs };
  const edges = graph.edges.flatMap((edge) =>
    resultConnections(graph, edge).map((input) => ({ ...edge, ...input }))
  );
  for (const node of graph.nodes) {
    if (isGenerator(node) && node.prompt.trim()) {
      const prompt = promptInput(node);
      nodes.push(prompt, { ...node, prompt: "" });
      outputs[prompt.id] = { text: prompt.prompt };
      // Local instructions previously preceded upstream text; keep that ordering.
      edges.unshift({ source: prompt.id, target: node.id });
    } else {
      nodes.push(node);
    }
  }
  return parseGraph({ ...graph, nodes, edges, outputs });
}

export function generationFeedback(
  graph: CanvasGraph,
  nodeId: string,
  promptNodeId?: string
) {
  const node = graph.nodes.find((item) => item.id === nodeId);
  return {
    nodeId,
    kind: node?.kind,
    executionTarget:
      node && ["text", "image", "gif"].includes(node.kind) ? nodeId : null,
    ...(promptNodeId ? { promptNodeId } : {}),
    inputs: graph.edges.filter((edge) => edge.target === nodeId),
    results:
      node && ["text", "image", "gif"].includes(node.kind)
        ? Array.from(
            { length: node.kind === "gif" ? 1 : (node.resultCount ?? 1) },
            (_, resultIndex) => ({ source: nodeId, resultIndex })
          )
        : [],
    inputContract:
      "Connected text is passed in full as the generation prompt, in connection order. Connected images are model image inputs. Edit the prompt material node to change instructions; generators have no inline prompt. Use returned results as addNode.sourceResults, or connectNodes with source and resultIndex. Result previews already exist; do not add an output node to continue.",
  };
}
