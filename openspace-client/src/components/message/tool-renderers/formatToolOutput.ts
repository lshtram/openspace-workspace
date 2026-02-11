export function formatToolOutput(output: unknown): string {
  if (arguments.length === 0) {
    throw new Error('formatToolOutput requires output');
  }
  if (output === null || output === undefined) return '';
  if (typeof output === 'string') return output;
  try {
    return JSON.stringify(output, null, 2);
  } catch (error) {
    return String(output);
  }
}
