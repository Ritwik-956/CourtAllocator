const Jimp = require('jimp');

async function main() {
  const image = await Jimp.read('assets/images/icon.png');
  const colors = {};
  for (let x = 0; x < 30; x++) {
    for (let y = 0; y < 30; y++) {
      const hex = image.getPixelColor(x, y).toString(16);
      colors[hex] = (colors[hex] || 0) + 1;
    }
  }
  console.log("Top-left 30x30 colors:", colors);
}
main();
