import type {
  ImageGeneratorNode,
  ImageResultNode,
  ReferenceImageNode,
  UpdateNodeCommand,
  WorkflowGraph,
  WorkflowNode,
  WorkflowPosition,
  WorkflowReferenceImage,
  WorkflowResultImage,
} from "./workflow-contract";

const maxReferenceImageBytes = 4 * 1024 * 1024;
const imageDataUrlPattern =
  /^data:(?<mediaType>image\/[a-z0-9.+-]+);base64,[a-z0-9+/]+=*$/i;
const invalidNodeDataError = "Workflow graph node data is invalid.";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isImageMediaType(mediaType: string) {
  return /^image\/[a-z0-9.+-]+$/i.test(mediaType);
}

function assertValidImageDataUrl(
  dataUrl: string,
  mediaType: string,
  label: string
) {
  const match = imageDataUrlPattern.exec(dataUrl);

  if (!match) {
    throw new Error(`${label} data URL is invalid.`);
  }

  if (match.groups?.mediaType !== mediaType) {
    throw new Error(`${label} media type is invalid.`);
  }
}

function getBase64ByteLength(dataUrl: string) {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  let padding = 0;

  if (base64.endsWith("==")) {
    padding = 2;
  } else if (base64.endsWith("=")) {
    padding = 1;
  }

  return Math.floor((base64.length * 3) / 4) - padding;
}

export function assertValidReferenceImage(image: WorkflowReferenceImage) {
  if (!isImageMediaType(image.mediaType)) {
    throw new Error("Reference image media type is invalid.");
  }

  assertValidImageDataUrl(image.dataUrl, image.mediaType, "Reference image");

  if (
    !Number.isFinite(image.sizeBytes) ||
    image.sizeBytes < 0 ||
    image.sizeBytes > maxReferenceImageBytes ||
    getBase64ByteLength(image.dataUrl) > maxReferenceImageBytes
  ) {
    throw new Error("Reference image exceeds the 4 MiB limit.");
  }
}

export function assertValidResultImage(image: WorkflowResultImage) {
  if (!isImageMediaType(image.mediaType)) {
    throw new Error("Result image media type is invalid.");
  }

  assertValidImageDataUrl(image.dataUrl, image.mediaType, "Result image");
}

export function assertValidWorkflowPosition(position: WorkflowPosition) {
  if (!(Number.isFinite(position.x) && Number.isFinite(position.y))) {
    throw new Error("Workflow node position is invalid.");
  }
}

function assertValidNodeShell(node: WorkflowNode) {
  if (
    !isRecord(node) ||
    typeof node.id !== "string" ||
    !node.id.trim() ||
    !isRecord(node.position) ||
    !isRecord(node.data)
  ) {
    throw new Error(invalidNodeDataError);
  }

  assertValidWorkflowPosition(node.position);
}

function assertValidReferenceNodeData(node: ReferenceImageNode) {
  if (
    typeof node.data.label !== "string" ||
    !(node.data.image === null || isRecord(node.data.image))
  ) {
    throw new Error(invalidNodeDataError);
  }

  if (!node.data.image) {
    return;
  }

  const image = node.data.image as WorkflowReferenceImage;

  if (
    typeof image.dataUrl !== "string" ||
    typeof image.filename !== "string" ||
    typeof image.mediaType !== "string" ||
    typeof image.sizeBytes !== "number"
  ) {
    throw new Error(invalidNodeDataError);
  }

  assertValidReferenceImage(image);
}

function assertValidGeneratorNodeData(node: ImageGeneratorNode) {
  if (
    typeof node.data.prompt !== "string" ||
    !["1:1", "16:9", "9:16"].includes(node.data.aspectRatio)
  ) {
    throw new Error(invalidNodeDataError);
  }
}

function assertValidResultNodeBaseData(node: ImageResultNode) {
  const data = node.data;
  const hasValidTypes =
    (data.activeRunId === null || typeof data.activeRunId === "string") &&
    (data.errorMessage === null || typeof data.errorMessage === "string") &&
    (data.prompt === null || typeof data.prompt === "string") &&
    (data.image === null || isRecord(data.image)) &&
    ["idle", "running", "succeeded", "failed"].includes(data.status);

  if (!hasValidTypes) {
    throw new Error(invalidNodeDataError);
  }

  if (!data.image) {
    return;
  }

  const image = data.image as WorkflowResultImage;

  if (
    typeof image.dataUrl !== "string" ||
    typeof image.mediaType !== "string"
  ) {
    throw new Error(invalidNodeDataError);
  }

  assertValidResultImage(image);
}

function hasValidResultLifecycle(node: ImageResultNode) {
  const data = node.data;

  if (data.status === "idle") {
    return (
      data.activeRunId === null &&
      data.errorMessage === null &&
      data.image === null &&
      data.prompt === null
    );
  }

  if (data.status === "succeeded") {
    return (
      data.activeRunId === null &&
      data.errorMessage === null &&
      data.image !== null &&
      Boolean(data.prompt?.trim())
    );
  }

  if (data.status === "failed") {
    return (
      data.activeRunId === null &&
      Boolean(data.errorMessage?.trim()) &&
      data.image === null &&
      Boolean(data.prompt?.trim())
    );
  }

  return false;
}

function assertValidResultNodeData(node: ImageResultNode) {
  assertValidResultNodeBaseData(node);

  if (!hasValidResultLifecycle(node)) {
    throw new Error("Workflow graph result state is invalid.");
  }
}

export function assertValidWorkflowNodeData(node: WorkflowNode) {
  assertValidNodeShell(node);

  if (node.kind === "reference-image") {
    assertValidReferenceNodeData(node);
    return;
  }

  if (node.kind === "image-generator") {
    assertValidGeneratorNodeData(node);
    return;
  }

  if (node.kind === "image-result") {
    assertValidResultNodeData(node);
    return;
  }

  throw new Error(invalidNodeDataError);
}

export function isAllowedConnection(
  sourceNode: WorkflowNode,
  targetNode: WorkflowNode
) {
  return (
    (sourceNode.kind === "reference-image" &&
      targetNode.kind === "image-generator") ||
    (sourceNode.kind === "image-generator" &&
      targetNode.kind === "image-result")
  );
}

function hasSupportedWorkflowShape(graph: WorkflowGraph) {
  const generatorCount = graph.nodes.filter(
    (node) => node.kind === "image-generator"
  ).length;
  const resultCount = graph.nodes.filter(
    (node) => node.kind === "image-result"
  ).length;
  const referenceCount = graph.nodes.filter(
    (node) => node.kind === "reference-image"
  ).length;
  const supportedNodeCount = generatorCount + resultCount + referenceCount;
  const nodeIds = new Set(graph.nodes.map((node) => node.id));

  return (
    generatorCount === 1 &&
    resultCount === 1 &&
    referenceCount <= 1 &&
    supportedNodeCount === graph.nodes.length &&
    nodeIds.size === graph.nodes.length
  );
}

export function assertUniqueNodeKinds(
  graph: WorkflowGraph,
  node: WorkflowNode
) {
  if (
    node.kind === "reference-image" &&
    graph.nodes.some((graphNode) => graphNode.kind === "reference-image")
  ) {
    throw new Error("Only one reference image node is allowed.");
  }

  if (
    node.kind === "image-generator" &&
    graph.nodes.some((graphNode) => graphNode.kind === "image-generator")
  ) {
    throw new Error("Only one image generator node is allowed.");
  }

  if (
    node.kind === "image-result" &&
    graph.nodes.some((graphNode) => graphNode.kind === "image-result")
  ) {
    throw new Error("Only one image result node is allowed.");
  }
}

export function isValidPatchForNode(
  node: WorkflowNode,
  patch: UpdateNodeCommand["patch"]
) {
  const patchRecord = patch as Record<string, unknown>;
  const patchKeys = Object.keys(patchRecord);

  if (node.kind === "reference-image") {
    const hasOnlyReferenceFields = patchKeys.every(
      (key) => key === "image" || key === "label"
    );
    const hasValidLabel =
      !("label" in patchRecord) || typeof patchRecord.label === "string";
    const hasValidImage =
      !("image" in patchRecord) ||
      patchRecord.image === null ||
      isRecord(patchRecord.image);

    return hasOnlyReferenceFields && hasValidLabel && hasValidImage;
  }

  if (node.kind !== "image-generator") {
    return false;
  }

  const hasOnlyGeneratorFields = patchKeys.every(
    (key) => key === "aspectRatio" || key === "prompt"
  );
  const hasValidPrompt =
    !("prompt" in patchRecord) || typeof patchRecord.prompt === "string";
  const hasValidAspectRatio =
    !("aspectRatio" in patchRecord) ||
    patchRecord.aspectRatio === "1:1" ||
    patchRecord.aspectRatio === "16:9" ||
    patchRecord.aspectRatio === "9:16";

  return hasOnlyGeneratorFields && hasValidPrompt && hasValidAspectRatio;
}

export function getNodeById(graph: WorkflowGraph, nodeId: string) {
  const node = graph.nodes.find((graphNode) => graphNode.id === nodeId);

  if (!node) {
    throw new Error(`Workflow node "${nodeId}" does not exist.`);
  }

  return node;
}

function assertValidWorkflowEdges(graph: WorkflowGraph) {
  const edgeIds = new Set<string>();

  for (const edge of graph.edges) {
    const hasValidFields =
      typeof edge.id === "string" &&
      typeof edge.source === "string" &&
      typeof edge.target === "string";
    const sourceNode = graph.nodes.find((node) => node.id === edge.source);
    const targetNode = graph.nodes.find((node) => node.id === edge.target);

    if (!(hasValidFields && sourceNode && targetNode)) {
      throw new Error("Workflow graph edges are invalid.");
    }

    if (edge.id !== `${edge.source}->${edge.target}` || edgeIds.has(edge.id)) {
      throw new Error("Workflow graph edges are invalid.");
    }

    edgeIds.add(edge.id);

    if (!isAllowedConnection(sourceNode, targetNode)) {
      throw new Error("Workflow graph edges are invalid.");
    }
  }
}

export function assertValidWorkflowGraph(graph: WorkflowGraph) {
  const hasValidShell =
    isRecord(graph) &&
    Array.isArray(graph.nodes) &&
    Array.isArray(graph.edges) &&
    Number.isInteger(graph.revision);

  if (
    !hasValidShell ||
    graph.revision < 0 ||
    !graph.nodes.every(isRecord) ||
    !graph.edges.every(isRecord) ||
    !hasSupportedWorkflowShape(graph)
  ) {
    throw new Error("Workflow graph shape is invalid.");
  }

  for (const node of graph.nodes) {
    assertValidWorkflowNodeData(node);
  }

  assertValidWorkflowEdges(graph);
}

function getGeneratorAndResult(graph: WorkflowGraph) {
  const generator = graph.nodes.find(
    (node): node is ImageGeneratorNode => node.kind === "image-generator"
  );
  const result = graph.nodes.find(
    (node): node is ImageResultNode => node.kind === "image-result"
  );

  if (!(generator && result)) {
    throw new Error("Workflow must include one generator and one result node.");
  }

  return { generator, result };
}

function getConnectedReferenceNode(
  graph: WorkflowGraph,
  generatorId: string
): ReferenceImageNode | null {
  const referenceEdge = graph.edges.find(
    (edge) => edge.target === generatorId && edge.source !== generatorId
  );

  if (!referenceEdge) {
    return null;
  }

  return (
    graph.nodes.find(
      (node): node is ReferenceImageNode =>
        node.id === referenceEdge.source && node.kind === "reference-image"
    ) ?? null
  );
}

export function getRunnableWorkflowState(graph: WorkflowGraph) {
  const { generator, result } = getGeneratorAndResult(graph);
  const hasGeneratorResultConnection = graph.edges.some(
    (edge) => edge.source === generator.id && edge.target === result.id
  );

  if (!hasGeneratorResultConnection) {
    throw new Error(
      "Workflow must connect the image generator to the image result."
    );
  }

  const prompt = generator.data.prompt.trim();

  if (!prompt) {
    throw new Error("Image generator prompt is required.");
  }

  const referenceNode = getConnectedReferenceNode(graph, generator.id);

  if (referenceNode?.data.image) {
    assertValidReferenceImage(referenceNode.data.image);
  }

  if (referenceNode && !referenceNode.data.image) {
    throw new Error(
      "Reference image is required for the connected reference node."
    );
  }

  return {
    aspectRatio: generator.data.aspectRatio,
    prompt,
    referenceImage: referenceNode?.data.image ?? null,
    resultNodeId: result.id,
  };
}

export function getResultNode(
  graph: WorkflowGraph,
  nodeId: string
): ImageResultNode {
  const node = getNodeById(graph, nodeId);

  if (node.kind !== "image-result") {
    throw new Error(`Workflow node "${nodeId}" is not an image result node.`);
  }

  return node;
}

export function assertRunOwnership(resultNode: ImageResultNode, runId: string) {
  if (
    resultNode.data.activeRunId !== runId ||
    resultNode.data.status !== "running"
  ) {
    throw new Error(
      `Workflow run "${runId}" does not own result node "${resultNode.id}".`
    );
  }
}
