const puppeteer = require('puppeteer');

const BASENAME = 'DraxLogo';
const SHOTS = [
  { simple: false, width: 512, height: 512, scale: 1, outputName: `${BASENAME}.png` },
  { simple: true,  width: 512, height: 512, scale: 1, outputName: `${BASENAME}Simple.png` },
  { simple: false,  width: 876, height: 438, scale: 1, outputName: `${BASENAME}-sm.png` },
  { simple: true,  width: 876, height: 438, scale: 1, outputName: `${BASENAME}Simple-sm.png` },

  { simple: true, width:  16, height:  16, scale: 1, outputName: `favicon-16.png` },
  { simple: true, width:  24, height:  24, scale: 1, outputName: `favicon-24.png` },
  { simple: true, width:  32, height:  32, scale: 1, outputName: `favicon-32.png` },
  { simple: true, width:  48, height:  48, scale: 1, outputName: `favicon-48.png` },
  { simple: true, width:  57, height:  57, scale: 1, outputName: `favicon-57.png` },
  { simple: true, width:  64, height:  64, scale: 1, outputName: `favicon-64.png` },
  { simple: true, width:  72, height:  72, scale: 1, outputName: `favicon-72.png` },
  { simple: true, width:  76, height:  76, scale: 1, outputName: `favicon-76.png` },
  { simple: true, width:  96, height:  96, scale: 1, outputName: `favicon-96.png` },
  { simple: true, width: 114, height: 114, scale: 1, outputName: `favicon-114.png` },
  { simple: true, width: 120, height: 120, scale: 1, outputName: `favicon-120.png` },
  { simple: true, width: 128, height: 128, scale: 1, outputName: `favicon-128.png` },
  { simple: true, width: 128, height: 128, scale: 1, outputName: `smalltile.png` },
  { simple: true, width: 144, height: 144, scale: 1, outputName: `favicon-144.png` },
  { simple: true, width: 152, height: 152, scale: 1, outputName: `favicon-152.png` },
  { simple: true, width: 180, height: 180, scale: 1, outputName: `favicon-180.png` },
  { simple: true, width: 192, height: 192, scale: 1, outputName: `favicon-192.png` },
  { simple: true, width: 196, height: 196, scale: 1, outputName: `favicon-196.png` },
  { simple: true, width: 228, height: 228, scale: 1, outputName: `favicon-228.png` },
  { simple: true, width: 270, height: 270, scale: 1, outputName: `mediumtile.png` },
  { simple: true, width: 558, height: 270, scale: 1, outputName: `widetile.png` },
  { simple: true, width: 558, height: 558, scale: 1, outputName: `largetile.png` },
];

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const fullPage = `file://${__dirname}/../out/DraxLogo.svg`;
  const simplePage = `file://${__dirname}/../out/DraxLogoSimple.svg`;

  for (const shot of SHOTS) {
    if (shot.simple) {
      await page.goto(simplePage);
    }
    else {
      await page.goto(fullPage);
    }
    console.log(`Generating ${shot.width}x${shot.height}@${shot.scale}x: ${shot.outputName}`);
    page.setViewport({ width: shot.width, height: shot.height, deviceScaleFactor: shot.scale });
    await page.screenshot({path: `../out/${shot.outputName}`})
  }

  await browser.close();
})();
