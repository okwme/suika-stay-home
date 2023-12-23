import { Common, Constraint, Composite, Bodies, Engine, Body, Events, Collision, Render, World, Vertices, Svg } from "matter-js";

// var clone = require('clone');
import decomp from 'poly-decomp';

const variety = 10
const pickVariety = 1
const radiusOffset = 40;
const radiusStep = 10;
const frameType = "square"
const soundUrl = "pop.wav";
const max = 1000
const thick = 50
const dropRate = 200
const maxRadius = pickVariety * radiusStep + radiusOffset
const bgColor = '#ddd'//randomHexColor()
const wallColor = 'rgba(0,0,0,0)'//bgColor//'#999'//randomHexColor()

let loadedAudio, timeoutId, render, engine, world, width, height, smallerMultiplyer, isPortrait
let muted = false
let currentlyPlaying = 0
let isPaused = false;
let fruits = [], pics = []

// -----------------
// start
// -----------------
init()

// -----------------
// functions
// -----------------
function init() {
  resetTimeout();
  fetch(soundUrl)
    .then((response) => response.blob())
    .then((blob) => {
      loadedAudio = URL.createObjectURL(blob);
    });
  scramblePics()
  setDimensions()
  makeFruit()
  buildWorldEngine()
  makeFrame(frameType)
  run()
  addFruit()
  setInterval(() => {
    if (!isPaused) {
      addFruit()
    }
  }, dropRate)
}

function makeFruit() {
  for (let i = 0; i < variety; i++) {
    fruits.push({
      radius: i * radiusStep + radiusOffset
    })
  }
}

function buildWorldEngine() {
  engine = Engine.create();
  render = Render.create({
    engine,
    element: document.body,
    options: {
      wireframes: false,
      background: bgColor,
      width,
      height,
      // showIds: true,
      // showSeparations: true,
    }
  });
  world = engine.world;
  Render.run(render);
}

function setDimensions() {
  width = window.innerWidth
  height = window.innerHeight

  isPortrait = width < height
  let bigger = width > height ? width : height
  let smaller = width < height ? width : height

  smallerMultiplyer = max / smaller

  smaller *= smallerMultiplyer
  bigger *= smallerMultiplyer

  if (isPortrait) {
    width = smaller
    height = bigger
  } else {
    width = bigger
    height = smaller
  }
}


function makeFrame(FRAME) {
  // remove all static elements
  const bodies = world.bodies.filter((body) => body.isStatic);
  World.remove(world, bodies);
  // const FRAME = FRAMES[index]
  switch (FRAME) {
    case 'triangle':
      makeTriangleFrame()
      break
    default:
      makeSquareFrame()
  }
  drawFruits()
}

function makeTriangleFrame() {
  const leftVertices = [
    { x: 0, y: thick }, { x: width / 2, y: height - thick }, { x: 0, y: height - thick }
  ]
  const center = Vertices.centre(leftVertices)
  const leftWall = Bodies.fromVertices(center.x, center.y, leftVertices, {
    isStatic: true,
    render: { fillStyle: wallColor }
  });

  const rightVertices = [
    { x: width / 2, y: height - thick }, { x: width, y: thick }, { x: width, y: height - thick }
  ]
  const rightCenter = Vertices.centre(rightVertices)
  const rightWall = Bodies.fromVertices(rightCenter.x, rightCenter.y, rightVertices, {
    isStatic: true,
    render: { fillStyle: wallColor }
  });

  const ground = Bodies.rectangle(width / 2, height - thick / 2, width, thick, {
    isStatic: true,
    render: { fillStyle: wallColor }
  });

  const topLine = Bodies.rectangle(width / 2, thick / 2, width, thick, {
    name: "topLine",
    isStatic: true,
    isSensor: true,
    render: { fillStyle: wallColor }
  })

  World.add(world, [leftWall, rightWall, topLine]);
}

function makeSquareFrame() {
  const height_ = height
  const width_ = width
  const heightDiff = (height - height_) / 2
  const widthDiff = (width - width_) / 2
  const leftWall = Bodies.rectangle(widthDiff + thick / 2, height_ / 2, thick, height_, {
    isStatic: true,
    render: { fillStyle: wallColor }
  });

  const rightWall = Bodies.rectangle(widthDiff + width_ - thick / 2, height_ / 2, thick, height_, {
    isStatic: true,
    render: { fillStyle: wallColor }
  });

  const ground = Bodies.rectangle(widthDiff + width_ / 2, height_ - thick / 2, width_, thick, {
    isStatic: true,
    render: { fillStyle: wallColor }
  });

  const topLine = Bodies.rectangle(widthDiff + width_ / 2, thick / 2, width_, thick, {
    name: "topLine",
    isStatic: true,
    // isSensor: true,
    render: { fillStyle: wallColor }
  })
  World.add(world, [leftWall, rightWall, ground, topLine]);
}


function scramblePics() {
  // const totalPics = 28;
  // const picArray = Array.from({ length: totalPics }, (_, index) => index + 1);
  // pics = picArray.sort(() => Math.random() - 0.5);
  pics = Array.from({ length: 10 }, (_, index) => (index + 1).toString());

}

function drawFruits() {
  for (let i = 0; i < variety; i++) {
    const rad = (width - thick * 2) / variety
    const x = rad * i + thick + rad / 2
    // add one body of each variety and make is isSleeping = true
    const body = Bodies.circle(x, rad / 3, rad / 2, {
      isStatic: true,
      isSensor: true, // Make the body non-interactive
      render: {
        // fillStyle: colors[i] // Set the fillStyle to the color
        sprite: {
          texture: `fin/${pics[i]}-thumb.png`,
          xScale: 1,//rad / 400, // Adjust the x-scale of the sprite based on the radius
          yScale: 1,//rad / 400 // Adjust the y-scale of the sprite based on the radius
        }
      }
    });
    World.add(world, body);
  }
}

function run() {
  // Runner.run(engine);
  if (!isPaused) {
    Engine.update(engine, 1000 / 60); // update the engine
  }
  requestAnimationFrame(run);
}

function addFruit() {
  const index = Math.floor(Math.random() * pickVariety);
  const x = (Math.random() * (width - thick * 2 - maxRadius)) + thick + maxRadius / 2;
  const y = thick + maxRadius;
  addBody(x, y, index)
}

var globalGroup = false
async function addFish(x, y, index) {
  if (globalGroup) {
    console.log({ globalGroup })
    // const copiedGroup = Common.clone(globalGroup);
    const newClone = structuralClone(globalGroup)
    newClone.bodies.forEach((body) => {
      body.id = Common.nextId()
    })
    const currentLocation = newClone.bodies[0].position
    const deltaX = x - currentLocation.x
    const deltaY = y - currentLocation.y

    // Composite.setPosition(newClone, { x, y });
    Composite.translate(newClone, { x: deltaX, y: deltaY });
    Composite.add(world, newClone);
    return;
  }
  const response = await fetch('svg/goldfish.svg');
  const svgText = await response.text();
  console.log({ svgText })
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
  console.log({ svgDoc })
  const svgPaths = svgDoc.getElementsByTagName('path');
  console.log({ svgPaths })
  const vertices = [...svgPaths].map((path) => {
    console.log({ path })
    const vertice = Svg.pathToVertices(path);
    console.log({ vertice })
    return vertice
  })
  console.log({ vertices });
  const body = Bodies.fromVertices(x, y, vertices, {
    isStatic: false,
    index: 9,
    render: {
      visible: false,
      sprite: {
        fillStyle: 'none',
        strokeStyle: 'none',
        lineWidth: 1,
        slop: 1,
        // texture: `svg/goldfish.png`,
        // xScale: 0.05,
        // yScale: 0.05
      }
    }
  }, true, false, undefined, true);
  const scaleBy = 0.21
  Body.scale(body, scaleBy, scaleBy);
  // Body.rotate(body, -0.02);
  let spriteHolder = Bodies.rectangle(
    body.bounds.min.x,
    body.bounds.min.y,
    (body.bounds.max.x - body.bounds.min.x),
    (body.bounds.max.y - body.bounds.min.y),
    {
      collisionFilter: {
        mask: 0
      },
      render: {
        // visible: false,
        fillStyle: 'none',
        strokeStyle: 'rgba(0,0,0,0)',
        sprite: {
          texture: `svg/goldfish.png`,
          xOffset: -0.02,
          yOffset: 0.04,
          xScale: scaleBy * 0.2476190476,
          yScale: scaleBy * 0.2476190476,
        }
      }
    }
  )
  let constraint = Constraint.create({
    bodyA: body,
    pointA: { x: 0, y: 100 },
    bodyB: spriteHolder,
    pointB: { x: 0, y: 100 },
    length: 0,
    stiffness: 1.1,
    render: {
      visible: false
    }
  })
  let constraint2 = Constraint.create({
    bodyA: body,
    pointA: { x: 0, y: -100 },
    bodyB: spriteHolder,
    pointB: { x: 0, y: -100 },
    length: 0,
    stiffness: 1.1,
    render: {
      visible: false
    }
  })
  let group = Composite.create({ label: `group` })
  // Body.scale(group, 0.2, 0.2);
  Composite.add(group, [body, spriteHolder, constraint, constraint2])
  Composite.add(world, group)
  globalGroup = structuralClone(group)

  // body.parts.forEach((part, i) => {
  //   if (i == 0) return
  //   part.sprite = null
  // })
  // console.log({ body })
  // World.add(world, body);
  // return group
}
function structuralClone(obj) {
  return new Notification('', { data: obj, silent: true }).data;
}

// addFish(width / 2, height / 2)
function addBody(x, y, index, inertia = 0) {
  // addFish(x, y)
  // return
  const fruit = fruits[index];
  // const color = colors[index]; // Get the color from colors array
  const xScale = 1
  console.log({ fruit })
  const body = Bodies.circle(x, y, fruit.radius, {
    index: index,
    isSleeping: false,
    density: 0.01, // 0.001
    friction: 0.1, // 0.1
    frictionStatic: 0.5, // 0.5
    // mass: 1, // function of density and area
    slop: 0.0001, // 0.05 // boundary tolerance
    render: {
      // fillStyle: 'rgb(255,0,0)', // Set the fillStyle to the color
      sprite: {
        texture: `fin/${pics[index]}.png`,
        xScale: xScale, // Adjust the x-scale of the sprite based on the radius
        yScale: xScale // Adjust the y-scale of the sprite based on the radius
      },
      strokeStyle: 'black', // Set the outline color
      lineWidth: 2 // Set the outline width
    },
    inertia: inertia,
    restitution: 0.2,
  });
  World.add(world, body);
}



function mute() {
  muted = !muted
  document.getElementById('mute').toggleAttribute('muted')
}
function hideMuteElement() {
  const muteElement = document.getElementById('mute');
  muteElement.classList.add('hidden');
}
function showMuteElement() {
  const muteElement = document.getElementById('mute');
  muteElement.classList.remove('hidden');
}
function resetTimeout() {
  clearTimeout(timeoutId);
  timeoutId = setTimeout(hideMuteElement, 3000);
}
function playSound(index) {
  // const uid = Math.random().toString(36).substr(2, 9);
  let sound = new Audio(loadedAudio);

  const numSounds = 7
  index = index % numSounds
  let start, end
  switch (index) {
    case 0:
      start = 1.570;
      end = 2.250
      break
    case 1:
      start = 2.914
      end = 3.450
      break
    case 2:
      start = 4.213
      end = 4.787
      break
    case 3:
      start = 5.557
      end = 6.222
      break
    case 4:
      start = 6.781
      end = 7.400
      break
    case 5:
      start = 8.775
      end = 9
      break
    case 6:
      start = 9.7
      end = 10.1
      break
    default:
      throw new Error('no sound for index')
  }
  const nowMilliseconds = new Date().getTime()
  const volume = ((index + 1) / 10)
  sound.volume = volume
  sound.currentTime = start
  function onPlay() {
    currentlyPlaying++
    const totalBodies = world.bodies.length
    const newNowMilliseconds = new Date().getTime()
    const timeToPlay = newNowMilliseconds - nowMilliseconds
    // console.log({ timeToPlay, currentlyPlaying, totalBodies })
    // console.log(`play ${index + 1} - ${volume} - ${uid}`)
    if (timeToPlay > 200) {
      sound.pause()
      currentlyPlaying--
      setTimeout(() => {
        sound = null
      }, 150)
    } else {
      setTimeout(() => {
        // console.log(`pause ${index + 1} - ${volume} - ${uid}`)
        sound.pause();
        currentlyPlaying--
        setTimeout(() => {
          sound = null
        }, 150)
      }, Math.floor((end - start) * 1000));
    }
    sound.removeEventListener('playing', onPlay)
  }
  sound.addEventListener('playing', onPlay)
  if (!muted) {
    sound.play().catch((e) => {
      mute()
      console.error({ e })
    })
  }
}


// -----------------
// event listeners
// -----------------

Events.on(engine, "collisionStart", (event) => {
  const filteredPairs = []
  event.pairs.forEach((pair) => {
    // console.log(pair.bodyA)
    // is bodyA and bodyB in the list already?
    if (pair.bodyA.index === pair.bodyB.index) {
      const bodyAIsInList = filteredPairs.find((item) => item.bodyA.id === pair.bodyA.id)
      const bodyBIsInList = filteredPairs.find((item) => item.bodyB.id === pair.bodyB.id)
      if (!bodyAIsInList && !bodyBIsInList) {
        filteredPairs.push(pair)
      }
    }
  })
  if (event.pairs.length > 100) {
    console.log({ event })
    console.log({ eventPairs: event.pairs.length })
    console.log(`Event has ${event.pairs.length} pairs`)
    console.log(`Filtered list has ${filteredPairs.length} pairs`)
  }
  filteredPairs.forEach((pair) => {
    if (pair.bodyA.index === pair.bodyB.index) {
      const index = pair.bodyA.index;
      World.remove(world, [pair.bodyA, pair.bodyB]);
      playSound(index)
      if (index !== fruits.length - 1) {
        const x = pair.collision.supports[0].x;
        const y = pair.collision.supports[0].y;
        const combinedInertia = pair.bodyA.inertia + pair.bodyB.inertia;
        addBody(x, y, index + 1, combinedInertia)
      }
    }
  });
});

document.querySelector("canvas").addEventListener("click", () => {
  console.log('click')
  isPaused = !isPaused;
});
document.getElementById('mute').addEventListener('click', () => {
  mute()
})
document.addEventListener('mousemove', () => {
  showMuteElement();
  resetTimeout();
});
window.addEventListener('resize', throttle(() => {
  // isPaused = true;
  // moveObjectsTowardsCenter()
  setDimensions()
  // readjustObjects()

  render.bounds.max.x = width;
  render.bounds.max.y = height;
  render.options.width = width;
  render.options.height = height;
  render.canvas.width = width;
  render.canvas.height = height;
  makeFrame(frameType)
  // moveObjectsTowardsCenter()
  // isPaused = false;
}, 10)); // Adjust the delay (in milliseconds) as per your requirement

function readjustObjects() {
  const bodies = world.bodies.filter((body) => !body.isStatic);
  bodies.forEach((body) => {
    const x = body.position.x;
    const y = body.position.y;
    console.log({ x, smallerMultiplyer })
    if (!isPortrait) {
      const newX = x * smallerMultiplyer;
      Body.setPosition(body, { x: newX, y });
    } else {
      const newY = y * smallerMultiplyer;
      Body.setPosition(body, { x, y: newY });
    }
    // Body.scale(body, smallerMultiplyer, smallerMultiplyer);
  });
}
function throttle(func, delay) {
  let timeoutId;
  let lastExecutedTime = 0;

  return function (...args) {
    const currentTime = Date.now();

    if (currentTime - lastExecutedTime > delay) {
      clearTimeout(timeoutId);
      lastExecutedTime = currentTime;
      func.apply(this, args);
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        lastExecutedTime = currentTime;
        func.apply(this, args);
      }, delay);
    }
  };
}


function moveObjectsTowardsCenter() {
  const center = {
    x: width / 2,
    y: height / 2
  };

  world.bodies.forEach((body) => {
    if (!body.isStatic) {
      if (isBodyInContactWithStatic(body)) {
        const deltaX = center.x - body.position.x;
        const deltaY = center.y - body.position.y;
        const forceMagnitude = 0.002; // Adjust the force magnitude as per your requirement
        Body.applyForce(body, body.position, {
          x: deltaX * forceMagnitude,
          y: deltaY * forceMagnitude
        });
      }
    }
  });
  // Determine if a body is in contact with a static element
  function isBodyInContactWithStatic(body) {
    const staticElements = world.bodies.filter((element) => element.isStatic);

    for (let i = 0; i < staticElements.length; i++) {
      const collision = Collision.collides(body, staticElements[i]);
      if (collision?.collided) {
        console.log({ collision })
        return true;
      }
    }

    return false;
  }
}

// -----------------
// utils
// -----------------

// Debounce function to limit the rate of execution
function debounce(func, delay) {
  let timer;
  return function () {
    clearTimeout(timer);
    timer = setTimeout(func, delay);
  };
}

// -----------------
// discarded code
// -----------------

const randomHexColor = () => '#' + Math.floor(Math.random() * 16777215).toString(16);

// function rotateWalls() {
//   console.log('rotateWalls');
//   const walls = world.bodies.filter((body) => body.isStatic);

//   const angle = Math.PI; // Specify the desired rotation angle

//   const centerX = width / 2; // Calculate the center X coordinate
//   const centerY = height / 2; // Calculate the center Y coordinate
//   console.log({ walls })
//   walls.forEach((body) => {
//     const x = body.position.x;
//     const y = body.position.y;

//     const newX = Math.cos(angle) * (x - centerX) - Math.sin(angle) * (y - centerY) + centerX;
//     const newY = Math.sin(angle) * (x - centerX) + Math.cos(angle) * (y - centerY) + centerY;

//     Body.setPosition(body, { x: newX, y: newY });
//     Body.setAngle(body, body.angle + angle);
//     // show updated body in world
//     // World.add(world, body);
//   });
// }
// rotateWalls()
// setInterval(rotateWalls, 50)

// import { Combination, Permutation } from 'js-combinatorics';

// const totalPics = 23;
// const picsOrdered = Array.from({ length: totalPics }, (_, index) => index + 1);
// let permutation = new Permutation(picsOrdered, 10)
// let combinations = new Combination(picsOrdered, 10);
// // for (const elem of combinations) {
// //   console.log(elem) // ['a', 'b', 'c', 'd'] ... ['e', 'f', 'g', 'h']
// // }
// console.log({ picsOrdered, length: picsOrdered.length })
// console.log({ permutation, length: permutation.length })
// console.log({ combinations, length: combinations.length })


// import { FRUITS_BASE, FRUITS_HLW } from "./fruits";
// import "./dark.css";

// let THEME = "base"; // { base, halloween }
// let fruits = FRUITS_BASE;

// switch (THEME) {
//   case "halloween":
//     fruits = FRUITS_HLW;
//     break;
//   default:
//     fruits = FRUITS_BASE;
// }


// function generateColors() {
//   const spectrum = 360; // Spectrum of rainbow colors
//   const chunkSize = spectrum / variety;
//   for (let j = 0; j < variety; j++) {
//     // colors.push(randomHexColor())
//     // continue
//     const hue = j * chunkSize;
//     const color = `hsl(${hue}, 80%, 80%)`;
//     colors.push(color);
//   }
// }


// const FRAMES = [
//   'square',
//   'portrait',
//   'triangle',
//   'landscape',
//   'tub',
//   'spike',
//   'diamond',
//   'circle',
//   'hexagon',
//   'pentagon',
//   'waves'
// ]



// function addTriangle() {
//   const triangle = Bodies.polygon(width / 2, height / 2, 3, 100, {
//     render: { fillStyle: randomHexColor() },
//     name: 'triangle'
//   })
//   World.add(world, triangle)
// }
// function addSquare() {
//   const square = Bodies.rectangle(width / 2, height / 2, 100, 100, {
//     render: { fillStyle: randomHexColor() },
//     name: 'square'
//   })
//   World.add(world, square)
// }
// addTriangle()
// addSquare()



// function rotateWalls() {
//   const bodies = world.bodies

//   const angle = 0.1; // Specify the desired rotation angle
//   const centerX = width / 2; // Calculate the center X coordinate
//   const centerY = height / 2; // Calculate the center Y coordinate

//   bodies.forEach((body) => {
//     if (body.isStatic) {
//       // Body.rotate(body, 0.1)
//       const x = body.position.x;
//       const y = body.position.y;

//       const newX = Math.cos(angle) * (x - centerX) - Math.sin(angle) * (y - centerY) + centerX;
//       const newY = Math.sin(angle) * (x - centerX) + Math.cos(angle) * (y - centerY) + centerY;

//       Body.setPosition(body, { x: newX, y: newY });
//       Body.setAngle(body, body.angle + angle);
//     }
//   })
// }


// Set gravity to 0 for both x and y axis
// engine.gravity.y = 0;
// engine.gravity.x = 0;

// let colors = []    
                                                                                                                                                                                            