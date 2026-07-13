export function sanitize(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export function limitLen(str: string, max: number): string {
  return str.slice(0, max);
}

export function wrapUserInput(label: string, value: string): string {
  return `${label}: ${sanitize(value.trim())}`;
}
