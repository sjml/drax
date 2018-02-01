
export class Annotation {
  from: CodeMirror.Position;
  to: CodeMirror.Position;
  author: string;
  timestamp: number;
  text: string;

  marker: CodeMirror.TextMarker = null;
  extents: { left: number, top: number, bottom: number } = null;
  displayHeight: number;
  removed = false;
}
