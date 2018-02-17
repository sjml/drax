const thisScriptFile = new File($.fileName);
const thisScriptPath = thisScriptFile.path;

const targetFilePath = thisScriptPath + "/DraxLogo.ai";

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

const outFile = new File(thisScriptPath + "/out/DraxLogoExported");
const options = new ExportOptionsSVG();
options.cssProperties = SVGCSSPropertyLocation.STYLEELEMENTS;

docHandle.exportFile(outFile, ExportType.SVG, options);

if (!fileWasOpen) {
  docHandle.close();
}
