import { ArtifactStore } from './ArtifactStore.js';
import {
  PatchRequestEnvelope,
  ValidationErrorEnvelope,
  assertPatchRequestEnvelope,
  createValidationErrorEnvelope,
} from '../interfaces/platform.js';
import { IDiagram, IOperation } from '../interfaces/IDrawing.js';

interface ReplaceContentOp {
  op: 'replace_content';
  content: string;
}

export interface PatchApplyResult {
  version: number;
  bytes: number;
}

class ValidationFailure extends Error implements ValidationErrorEnvelope {
  code: string;
  location: string;
  reason: string;
  remediation: string;

  constructor(envelope: ValidationErrorEnvelope) {
    super(envelope.reason);
    this.code = envelope.code;
    this.location = envelope.location;
    this.reason = envelope.reason;
    this.remediation = envelope.remediation;
  }
}

const parseReplaceContentOp = (ops: unknown[]): ReplaceContentOp => {
  if (ops.length !== 1) {
    throw new ValidationFailure(
      createValidationErrorEnvelope({
        code: 'UNSUPPORTED_PATCH_OPS',
        location: 'ops',
        reason: 'Exactly one replace_content operation is required',
        remediation: 'Provide one op: {"op":"replace_content","content":"..."}',
      }),
    );
  }

  const op = ops[0] as Record<string, unknown>;
  if (op.op !== 'replace_content' || typeof op.content !== 'string') {
    throw new ValidationFailure(
      createValidationErrorEnvelope({
        code: 'UNSUPPORTED_PATCH_OPS',
        location: 'ops[0]',
        reason: 'Unsupported patch operation',
        remediation: 'Use {"op":"replace_content","content":"..."}',
      }),
    );
  }

  return { op: 'replace_content', content: op.content };
};

const applyDiagramOperations = (diagram: IDiagram, ops: IOperation[]): IDiagram => {
  const next = { ...diagram, nodes: [...diagram.nodes], edges: [...diagram.edges] };

  for (const op of ops) {
    switch (op.type) {
      case 'addNode': {
        if (next.nodes.some((n) => n.id === op.node.id)) {
          throw new ValidationFailure(
            createValidationErrorEnvelope({
              code: 'DUPLICATE_ID',
              location: 'ops',
              reason: `Node with ID ${op.node.id} already exists`,
              remediation: 'Use a unique ID for the new node',
            }),
          );
        }
        next.nodes.push(op.node);
        break;
      }
      case 'updateNode': {
        const idx = next.nodes.findIndex((n) => n.id === op.nodeId);
        if (idx === -1) {
          throw new ValidationFailure(
            createValidationErrorEnvelope({
              code: 'NOT_FOUND',
              location: 'ops',
              reason: `Node with ID ${op.nodeId} not found`,
              remediation: 'Ensure the node ID exists before updating',
            }),
          );
        }
        next.nodes[idx] = { ...next.nodes[idx], ...op.patch };
        break;
      }
      case 'removeNode': {
        next.nodes = next.nodes.filter((n) => n.id !== op.nodeId);
        next.edges = next.edges.filter((e) => e.from !== op.nodeId && e.to !== op.nodeId);
        break;
      }
      case 'addEdge': {
        if (next.edges.some((e) => e.id === op.edge.id)) {
          throw new ValidationFailure(
            createValidationErrorEnvelope({
              code: 'DUPLICATE_ID',
              location: 'ops',
              reason: `Edge with ID ${op.edge.id} already exists`,
              remediation: 'Use a unique ID for the new edge',
            }),
          );
        }
        if (!next.nodes.some((n) => n.id === op.edge.from) || !next.nodes.some((n) => n.id === op.edge.to)) {
          throw new ValidationFailure(
            createValidationErrorEnvelope({
              code: 'INVALID_REFERENCE',
              location: 'ops',
              reason: `Edge references non-existent nodes: ${op.edge.from} -> ${op.edge.to}`,
              remediation: 'Ensure both source and target nodes exist',
            }),
          );
        }
        next.edges.push(op.edge);
        break;
      }
      case 'updateEdge': {
        const idx = next.edges.findIndex((e) => e.id === op.edgeId);
        if (idx === -1) {
          throw new ValidationFailure(
            createValidationErrorEnvelope({
              code: 'NOT_FOUND',
              location: 'ops',
              reason: `Edge with ID ${op.edgeId} not found`,
              remediation: 'Ensure the edge ID exists before updating',
            }),
          );
        }
        next.edges[idx] = { ...next.edges[idx], ...op.patch };
        break;
      }
      case 'removeEdge': {
        next.edges = next.edges.filter((e) => e.id !== op.edgeId);
        break;
      }
      case 'updateNodeLabel': {
        const idx = next.nodes.findIndex((n) => n.id === op.nodeId);
        if (idx === -1) {
          throw new ValidationFailure(
            createValidationErrorEnvelope({
              code: 'NOT_FOUND',
              location: 'ops',
              reason: `Node with ID ${op.nodeId} not found`,
              remediation: 'Ensure the node ID exists before updating',
            }),
          );
        }
        next.nodes[idx] = { ...next.nodes[idx], label: op.label };
        break;
      }
      case 'updateNodeLayout': {
        const idx = next.nodes.findIndex((n) => n.id === op.nodeId);
        if (idx === -1) {
          throw new ValidationFailure(
            createValidationErrorEnvelope({
              code: 'NOT_FOUND',
              location: 'ops',
              reason: `Node with ID ${op.nodeId} not found`,
              remediation: 'Ensure the node ID exists before updating',
            }),
          );
        }
        next.nodes[idx] = {
          ...next.nodes[idx],
          layout: { ...next.nodes[idx].layout, ...op.layout },
        };
        break;
      }
    }
  }

  next.metadata = {
    ...next.metadata,
    updatedAt: new Date().toISOString(),
  };

  return next;
};

export class PatchEngine {
  private versions = new Map<string, number>();

  constructor(private readonly store: ArtifactStore) {}

  getVersion(filePath: string): number {
    return this.versions.get(filePath) ?? 0;
  }

  async apply(filePath: string, envelopeBody: unknown): Promise<PatchApplyResult> {
    const envelope: PatchRequestEnvelope = assertPatchRequestEnvelope(envelopeBody);
    const currentVersion = this.getVersion(filePath);

    if (envelope.baseVersion !== currentVersion) {
      throw new ValidationFailure(
        createValidationErrorEnvelope({
          code: 'VERSION_CONFLICT',
          location: 'baseVersion',
          reason: `baseVersion ${envelope.baseVersion} does not match current version ${currentVersion}`,
          remediation: `Retry with baseVersion ${currentVersion}`,
        }),
      );
    }

    let nextContent: string;

    if (filePath.endsWith('.diagram.json')) {
      const currentBuffer = await this.store.read(filePath);
      const diagram = JSON.parse(currentBuffer.toString()) as IDiagram;
      const nextDiagram = applyDiagramOperations(diagram, envelope.ops as IOperation[]);
      nextContent = JSON.stringify(nextDiagram, null, 2);
    } else {
      const op = parseReplaceContentOp(envelope.ops);
      nextContent = op.content;
    }

    await this.store.write(filePath, nextContent, {
      actor: envelope.actor,
      reason: envelope.intent,
      createSnapshot: true,
    });

    const nextVersion = currentVersion + 1;
    this.versions.set(filePath, nextVersion);

    return {
      version: nextVersion,
      bytes: Buffer.byteLength(nextContent, 'utf8'),
    };
  }
}
