import React from 'react';
import { useMutationStore } from '../context/MutationContext';
import { Check, X, FileEdit } from 'lucide-react';

/**
 * @implements REQ-EDT-012
 */
export const MutationPreviewPanel: React.FC = () => {
  const { pendingMutations, resolveMutation } = useMutationStore();

  if (pendingMutations.length === 0) return null;

  const mutation = pendingMutations[0]; // Process one at a time for MVP

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-os-bg-2 border border-os-line rounded-lg shadow-2xl z-50 overflow-hidden flex flex-col">
      <div className="px-4 py-3 bg-os-bg-1 border-b border-os-line flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <FileEdit size={16} className="text-os-accent" />
          <span>Agent Proposed Edits</span>
        </div>
        <button 
          type="button"
          onClick={() => resolveMutation(mutation.id, 'reject')}
          className="text-text-weak hover:text-text-strong"
        >
          <X size={16} />
        </button>
      </div>
      
      <div className="p-4 flex flex-col gap-2">
        <p className="text-xs text-text-weak">
          The agent wants to modify <code className="bg-os-bg-3 px-1 rounded">{mutation.path}</code>. 
          Since you have unsaved changes, please review the proposed edit.
        </p>
        
        <div className="mt-2 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => resolveMutation(mutation.id, 'apply-buffer')}
            className="w-full py-2 px-4 bg-os-accent text-white text-sm font-medium rounded hover:opacity-90 flex items-center justify-center gap-2"
          >
            <Check size={16} />
            Apply to Buffer (Default)
          </button>
          
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => resolveMutation(mutation.id, 'apply-disk')}
              className="py-2 px-3 border border-os-line text-text-strong text-xs font-medium rounded hover:bg-os-bg-3"
            >
              Apply to Disk
            </button>
            <button
              type="button"
              onClick={() => resolveMutation(mutation.id, 'reject')}
              className="py-2 px-3 border border-os-line text-red-500 text-xs font-medium rounded hover:bg-red-500/10"
            >
              Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
