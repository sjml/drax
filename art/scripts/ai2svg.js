const thisScriptFile = new File($.fileName);
const thisScriptPath = thisScriptFile.path;

const targetFilePath = thisScriptPath + "/../DraxLogo.ai";

var docHandle = null;
var fileWasOpen = false;
for (var i = 0; i < app.documents.length; i++) {
  if (app.documents[i].fullName == targetFilePath) {
    docHandle = app.documents[i];
  }
}
if (docHandle) {
  fileWasOpen = true;
}
else {
  const fileHandle = new File(targetFilePath);
  docHandle = app.open(fileHandle);
}

const outFile = new File(thisScriptPath + "/../out/DraxLogoExported");
const outSimpleFile = new File(thisScriptPath + "/../out/DraxLogoSimpleExported");
const options = new ExportOptionsSVG();
options.cssProperties = SVGCSSPropertyLocation.STYLEELEMENTS;

// turn on full; turn off small
var layer = null;
for (var i = 0; i < docHandle.layers.length; i++) {
  var layer = docHandle.layers[i];
  if ('full' === layer.name) {
    layer.visible = true;
  }
  else if ('small' === layer.name) {
    layer.visible = false;
  }
}
docHandle.exportFile(outFile, ExportType.SVG, options);

// turn on small; turn off full
for (var i = 0; i < docHandle.layers.length; i++) {
  var layer = docHandle.layers[i];
  if ('small' === layer.name) {
    layer.visible = true;
  }
  else if ('full' === layer.name) {
    layer.visible = false;
  }
}
docHandle.exportFile(outSimpleFile, ExportType.SVG, options);

if (!fileWasOpen) {
  docHandle.close();
}
