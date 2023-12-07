#!/usr/bin/env node
var commander = require('commander')
const fs = require('fs')
const sharp = require('sharp');

commander
  .version('0.0.1')

commander
  .command('img')
  .description('generate sprites from svgs')
  .action(async () => {

    const directory = 'raw';
    const outputDirectory = 'public/fin';
    const radiusOffset = 40;
    const radiusStep = 10;


    const variety = 10
    const thick = 50
    const width = 1000

    fs.readdir(directory, async (err, files) => {
      if (err) {
        console.error(err);
        return;
      }
      // Remove existing files in the output directory
      fs.rmSync(outputDirectory, { recursive: true });
      fs.mkdirSync(outputDirectory);
      await new Promise((resolve, reject) => {
        setTimeout(resolve, 1000)
      })
      let i = 0;
      const thumb = ((width - thick * 2) / variety) / 2

      for (const file of files) {
        if (file.endsWith('.svg')) {
          const radius = 2 * (i * radiusStep + radiusOffset);
          const outputFileName = `${outputDirectory}/${i + 1}.png`;
          try {
            await sharp(`${directory}/${file}`)
              .trim()
              .resize(radius, radius, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
              .png({ background: { alpha: 0 } })
              .toFile(outputFileName)

            await sharp(outputFileName)
              .resize(thumb, thumb)
              .toFile(`${outputDirectory}/${i + 1}-thumb.png`)



          } catch (err) {
            console.error(err);
          }
          i++;
        }
      }

      // open main.js add a space to the end of the file
      fs.appendFileSync('main.js', ' ');


    })
  })


if (process.argv === 0) {
  commander.help()
  process.exit(1)
}

commander.parse(process.argv)