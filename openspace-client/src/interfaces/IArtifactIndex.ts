import type { IModality } from './IModality';

/**
 * Multi-dimensional classification for artifacts.
 */
export interface IArtifactMetadata {
  type: 'requirement' | 'sketch' | 'presentation' | 'code' | 'log' | 'summary';
  feature?: string;
  flowStage?: 'draft' | 'review' | 'verified' | 'archived';
  linkedRequirementIds?: string[];
  lastModified: number;
  tags?: string[];
}

export interface IArtifact {
  path: string;
  name: string;
  metadata: IArtifactMetadata;
}

/**
 * The Artifact Index provides a semantic view of the project, 
 * independent of the raw filesystem structure.
 */
export interface IArtifactIndex extends IModality {
  /** Search artifacts by query string or metadata */
  search(query: string, filters?: Partial<IArtifactMetadata>): Promise<IArtifact[]>;
  
  /** Get all artifacts grouped by a specific dimension (e.g., 'feature') */
  getGroupedBy(dimension: keyof IArtifactMetadata): Promise<Record<string, IArtifact[]>>;
  
  /** Update metadata for a specific artifact */
  updateMetadata(path: string, patch: Partial<IArtifactMetadata>): Promise<void>;
  
  /** Manually trigger a re-index of the project */
  refresh(): Promise<void>;
}
