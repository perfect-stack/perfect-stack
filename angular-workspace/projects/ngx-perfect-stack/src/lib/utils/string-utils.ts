export const makeLabel = (name: string): string => {
  if (!name) return name;

  // Step 1: Find capital letters that aren't at the very start (^).
  // If they don't have a space before them, add one, then lowercase the letter.
  const spacedAndLowered = name.replace(/(?!^)([A-Z])/g, (match, char, index) => {
    // Check if the character right before this capital is already a space
    const hasSpaceBefore = name.charAt(index - 1) === ' ';
    return hasSpaceBefore ? char.toLowerCase() : ` ${char.toLowerCase()}`;
  });

  // Step 2: Collapse any accidental double spaces down to a single space
  return spacedAndLowered.replace(/\s+/g, ' ').trim();
};

export const toTitleCase = (str: string): string => {
  if (!str) return str;
  return str
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/\s+/)
    .map(w => (w.length > 1 && w === w.toUpperCase() ? w : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join(' ')
    .trim();
};
