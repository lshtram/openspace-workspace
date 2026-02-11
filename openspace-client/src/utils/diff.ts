export function generateSimpleDiff(oldStr: string, newStr: string): string {
  if (oldStr === undefined || newStr === undefined) {
    throw new Error('generateSimpleDiff requires old and new content');
  }
  const oldLines = oldStr.split('\n');
  const newLines = newStr.split('\n');
  
  // This is a VERY simple diff that just shows the old and new blocks
  // In a real scenario, we'd want a proper LCS diff
  // For now, let's just show them as removed and added
  
  const result: string[] = [];
  
  if (oldStr === newStr) {
    return oldStr;
  }

  // Very naive: find common prefix and suffix
  let prefixLines = 0;
  while (prefixLines < oldLines.length && prefixLines < newLines.length && oldLines[prefixLines] === newLines[prefixLines]) {
    prefixLines++;
  }

  let suffixLines = 0;
  while (suffixLines < (oldLines.length - prefixLines) && suffixLines < (newLines.length - prefixLines) && 
         oldLines[oldLines.length - 1 - suffixLines] === newLines[newLines.length - 1 - suffixLines]) {
    suffixLines++;
  }

  for (let i = 0; i < prefixLines; i++) {
    result.push(`  ${oldLines[i]}`);
  }

  for (let i = prefixLines; i < oldLines.length - suffixLines; i++) {
    result.push(`- ${oldLines[i]}`);
  }

  for (let i = prefixLines; i < newLines.length - suffixLines; i++) {
    result.push(`+ ${newLines[i]}`);
  }

  for (let i = oldLines.length - suffixLines; i < oldLines.length; i++) {
    result.push(`  ${oldLines[i]}`);
  }

  return result.join('\n');
}
