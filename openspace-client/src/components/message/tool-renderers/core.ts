import React from 'react';
import type { ToolPart } from '../../../lib/opencode/v2/gen/types.gen';

export interface ToolRendererProps {
  part: ToolPart;
  isStep?: boolean;
}

export type ToolRendererComponent = React.ComponentType<ToolRendererProps>;

export const toolRenderers: Record<string, ToolRendererComponent> = {};

export function registerToolRenderer(name: string, component: ToolRendererComponent) {
  if (!name) {
    throw new Error('registerToolRenderer requires a name');
  }
  if (!component) {
    throw new Error('registerToolRenderer requires a component');
  }
  toolRenderers[name] = component;
}

export function getToolRenderer(name: string): ToolRendererComponent | undefined {
  if (!name) {
    throw new Error('getToolRenderer requires a name');
  }
  return toolRenderers[name];
}
