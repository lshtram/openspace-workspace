/**
 * Utility functions for presentation handling
 */

/**
 * Parse markdown content into slides
 * Splits on '---' and handles frontmatter
 */
export const parseSlides = (markdown: string): string[] => {
  if (!markdown) return [];
  const sections = markdown.split('\n---\n');
  const hasFrontmatter = sections[0].trim().startsWith('---');
  const slides = hasFrontmatter ? sections.slice(1) : sections;
  return slides.map((s) => s.trim()).filter(Boolean);
};
