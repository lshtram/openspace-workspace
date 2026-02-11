const ESC = 0x1b;
const C1_CSI = 0x9b;
const BEL = 0x07;

const isCsiFinalByte = (code: number) => code >= 0x40 && code <= 0x7e;

const skipCsiSequence = (input: string, start: number): number => {
  let index = start;
  while (index < input.length && !isCsiFinalByte(input.charCodeAt(index))) {
    index += 1;
  }
  return index < input.length ? index + 1 : index;
};

const skipStringTerminatedSequence = (input: string, start: number): number => {
  let index = start;
  while (index < input.length) {
    const code = input.charCodeAt(index);
    if (code === BEL) return index + 1;
    if (code === ESC && index + 1 < input.length && input.charCodeAt(index + 1) === 0x5c) {
      return index + 2;
    }
    index += 1;
  }
  return index;
};

export function stripAnsi(input: unknown): string {
  if (arguments.length === 0) {
    throw new Error('stripAnsi requires input');
  }
  if (typeof input !== 'string') {
    return String(input);
  }

  let result = '';
  let index = 0;
  while (index < input.length) {
    const code = input.charCodeAt(index);
    if (code === ESC) {
      if (index + 1 >= input.length) break;
      const next = input.charCodeAt(index + 1);
      if (next === 0x5b) {
        index = skipCsiSequence(input, index + 2);
        continue;
      }
      if (next === 0x5d || next === 0x50 || next === 0x5f || next === 0x5e) {
        index = skipStringTerminatedSequence(input, index + 2);
        continue;
      }
      index += 2;
      continue;
    }
    if (code === C1_CSI) {
      index = skipCsiSequence(input, index + 1);
      continue;
    }
    result += input[index];
    index += 1;
  }

  return result;
}
