const LINE_SEPARATORS = /\r\n|\r|\n|\u2028|\u2029|\v|\f/g;

function isC0C1StrippableCodePoint(cp: number): boolean {
  if (cp <= 0x08) return true;
  if (cp === 0x0b || cp === 0x0c) return true;
  if (cp >= 0x0e && cp <= 0x1f) return true;
  if (cp === 0x7f) return true;
  if (cp >= 0x80 && cp <= 0x9f) return true;
  return false;
}

function stripC0C1Controls(value: string): string {
  let out = '';
  for (let i = 0; i < value.length; ) {
    const cp = value.codePointAt(i)!;
    if (!isC0C1StrippableCodePoint(cp)) {
      out += String.fromCodePoint(cp);
    }
    i += cp > 0xffff ? 2 : 1;
  }
  return out;
}

export function sanitizePlainTextEmailDisplay(value: string): string {
  return stripC0C1Controls(value.replace(LINE_SEPARATORS, ' ')).replace(/\s+/g, ' ').trim();
}

export function sanitizePlainTextEmailOpaque(value: string): string {
  return stripC0C1Controls(value.replace(LINE_SEPARATORS, '')).trim();
}
