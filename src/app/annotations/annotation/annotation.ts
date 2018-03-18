
import * as CodeMirror from 'codemirror';
import * as JSDiff from 'diff';

export class Annotation {
  from: CodeMirror.Position;
  to: CodeMirror.Position;
  author: string;
  timestamp: number;
  uuid: string;
  text: string;

  marker: CodeMirror.TextMarker = null;
  extents: { left: number, top: number, bottom: number } = null;
  displayHeight: number;
  removed = false;
}

export function AnnotationSort(a: Annotation, b: Annotation): number {
  if (a.from.line < b.from.line) {
    return -1;
  }
  if (a.from.line === b.from.line) {
    if (a.from.ch < b.from.ch) {
      return -1;
    }
    if ((a.from.ch === b.from.ch) && (a.timestamp < b.timestamp)) {
      return -1;
    }
  }
  return 1;
}

// It's possible to do this without using a CodeMirror doc, but the math just
//   gets too annoying. CodeMirror's functionality for updating text markers as
//   the contents are edited is robust and well-tested, so there's no need to
//   try to reproduce our own for the sake of some hypothetical performance gain.
// It would be easier if we stored ranges as pure file offsets instead of line/ch
//   but the latter makes other operations sync easily with CodeMirror, so this is the
//   price we pay.
export function AdjustAnnotations(inputAnns: Annotation[], originalText: string, newText: string): Annotation[] {

  const anns = inputAnns.slice(0);
  const doc = CodeMirror.Doc(originalText);

  const markerMaps: {ann: Annotation, marker: CodeMirror.TextMarker}[] = [];
  for (const ann of anns) {
    const marker = doc.markText(ann.from, ann.to, {
      inclusiveLeft: ann.from.ch > 0,
      inclusiveRight: ann.to.ch < doc.getLine(ann.to.line).length
    });
    markerMaps.push({ann: ann, marker: marker});
  }

  let lineIndex = 0;
  let chIndex = 0;

  const diffs = JSDiff.diffChars(originalText, newText);
  for (const change of diffs) {
    if (change.added === undefined && change.removed === undefined) {
      for (const c of change.value) {
        if (c === '\n') {
          lineIndex += 1;
          chIndex = 0;
        }
        else {
          chIndex += 1;
        }
      }
    }
    else if (change.removed === true) {
      const from = { line: lineIndex, ch: chIndex };
      const to = { line: lineIndex, ch: chIndex };
      for (const c of change.value) {
        if (c === '\n') {
          to.line += 1;
          to.ch = 0;
        }
        else {
          to.ch += 1;
        }
      }
      doc.replaceRange('', from, to);
    }
    else if (change.added === true) {
      const from = { line: lineIndex, ch: chIndex };
      doc.replaceRange(change.value, from);
      for (const c of change.value) {
        if (c === '\n') {
          lineIndex += 1;
          chIndex = 0;
        }
        else {
          chIndex += 1;
        }
      }
    }
  }

  for (const mm of markerMaps) {
    const range = mm.marker.find();
    if (range === undefined) {
      anns.splice(anns.indexOf(mm.ann), 1);
    }
    else {
      mm.ann.from = range.from;
      mm.ann.to = range.to;
    }
    mm.marker.clear();
  }

  return anns;
}
