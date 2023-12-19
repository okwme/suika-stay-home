#!/usr/bin/env node
var commander = require('commander')
const fs = require('fs')
const sharp = require('sharp');
const xml2js = require('xml2js');
const { SVG, parse } = require('svg2js');
const { DOMParser } = require('xmldom');

commander
  .version('0.0.1')

commander
  .command('img')
  .description('generate sprites from svgs')
  .action(async () => {

    const directory = 'raw';
    const shapeDir = 'raw-shapes'
    const outputDirectory = 'public/fin';
    const outputShapeDirectory = 'public/shapes';
    const radiusOffset = 40;
    const radiusStep = 10;


    const variety = 10
    const thick = 50
    const width = 1000

    const files = fs.readdirSync(directory)
    // Remove existing files in the output directory
    fs.rmSync(outputDirectory, { recursive: true });
    fs.mkdirSync(outputDirectory);
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


    const shapeFiles = fs.readdirSync(shapeDir)
    fs.rmSync(outputShapeDirectory, { recursive: true });
    fs.mkdirSync(outputShapeDirectory);

    i = 0;
    for (const file of shapeFiles) {
      const sourceFilePath = `${shapeDir}/${file}`;
      const destinationFilePath = `${outputShapeDirectory}/${i + 1}.svg`;

      fs.copyFileSync(sourceFilePath, destinationFilePath)
      i++;
    }

    //   const radius = 2 * (i * radiusStep + radiusOffset);
    //   const outputFileName = `${outputShapeDirectory}/${i + 1}.svg`;
    //   try {
    //     const svgData = fs.readFileSync(`${shapeDir}/${file}`, 'utf-8')

    //     // const parser = new DOMParser();
    //     // const svgDoc = parser.parseFromString(svgData, 'image/svg+xml');

    //     const parser = new xml2js.Parser();
    //     const parsedSvg = await parser.parseStringPromise(svgData);
    //     console.log({ parsedSvg }, parsedSvg.svg)
    //     console.log(parsedSvg.svg.g)
    //     console.log(parsedSvg.svg.$.Box())
    //     // console.log({ svgDoc })
    //     // const cropped = cropSvgToContentOnly(svgDoc);
    //     // console.log({ cropped })
    //     // // Extract width and height of the SVG
    //     // const svgWidth = parseFloat(parsedSvg.svg.$.width);
    //     // const svgHeight = parseFloat(parsedSvg.svg.$.height);


    //     // Create a new SVG object
    //     // const newSvg = new SVG(svgWidth, svgHeight);

    //     // Find and add non-background elements
    //     // parsedSvg.svg.g.forEach((group) => {
    //     //   group.path.forEach((path) => {
    //     //     // Check if the path is not background (you can define your own criteria)
    //     //     if (!path.$.class || path.$.class !== 'background') {
    //     //       const pathData = parse(path.d[0]);
    //     //       newSvg.appendChild(pathData);
    //     //     }
    //     //   });
    //     // });

    //     // // Serialize the new SVG to XML
    //     // const builder = new xml2js.Builder();
    //     // const newSvgXml = builder.buildObject(newSvg.toXML());

    //     // Write the trimmed SVG to a file
    //     // fs.writeFileSync(outputFileName, newSvgXml);
    //   } catch (err) {
    //     console.error(err);
    //   }
    //   i++;
    // }


    // open main.js add a space to the end of the file
    fs.appendFileSync('main.js', ' ');
  })

const cropSvgToContentOnly = (svgElement) => {
  const {
    x,
    y,
    width,
    height,
  } = svgElement.getBBox();
  const viewBoxValue = [x, y, width, height].join(' ');
  svgElement.setAttribute('viewBox', viewBoxValue);
};


if (process.argv === 0) {
  commander.help()
  process.exit(1)
}

commander.parse(process.argv)