export function filterMeaning(meaning: string): string {
  if (!meaning) return '';
  
  return meaning.split('\n').filter(line => {
    const trimmed = line.trim();
    if (!trimmed) return false;
    if (/^\s*\d+\s*$/.test(trimmed)) return false;
    if (trimmed === '0') return false;
    if (trimmed === '\uFF10') return false;
    if (trimmed === '０') return false;
    if (trimmed.length === 1 && trimmed.charCodeAt(0) >= 48 && trimmed.charCodeAt(0) <= 57) return false;
    return true;
  }).join('\n');
}