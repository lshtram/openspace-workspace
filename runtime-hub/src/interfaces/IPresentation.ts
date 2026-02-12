export type SlideOperation =
  | { type: 'REPLACE_SLIDE'; index: number; content: string }
  | { type: 'INSERT_SLIDE'; index: number; content: string }
  | { type: 'DELETE_SLIDE'; index: number };
