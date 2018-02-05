
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

export function AnnotationSort(a: Annotation, b: Annotation): number {
  if (a.extents.top < b.extents.top) {
    return -1;
  }
  if (a.extents.top === b.extents.top) {
    if (a.extents.left < b.extents.left) {
      return -1;
    }
    if (a.extents.left === b.extents.left) {
      if (a.timestamp < b.timestamp) {
        return -1;
      }
      else {
        return 1;
      }
    }
  }
  return 1;
}
