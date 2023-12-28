const variety = 10, radiusOffset = 40, radiusStep = 10, max = 1000, thick = 50, dropRate = 200
const maxRadius = radiusStep + radiusOffset
const bgColor = 'rgba(0,0,0,0)'
const soundUrl = "public/pop.";
const isSleeping = false, density = 0.01, friction = 0.1, frictionStatic = 0.5, slop = 0.0001, restitution = 0.2
const Engine = Matter.Engine, Render = Matter.Render, World = Matter.World, Bodies = Matter.Bodies, Events = Matter.Events, Body = Matter.Body;
let timeoutId, render, engine, world, width, height, smallerMultiplyer, isPortrait, sound
let muted = true, isPaused = false, wasPaused = false, currentlyPlaying = 0, playLimit = 5
let fruits = [], pics = [], combos = []
let filenames = ["aceofspades.svg", "apple.svg", "basketball.svg", "clover.svg", "coke.svg", "dice.svg", "eightball.svg", "fish.svg", "flower1.svg", "flower2.svg", "frog.svg", "golfball.svg", "hamburger.svg", "heart.svg", "horse.svg", "lemon.svg", "marble.svg", "pig.svg", "saturn.svg", "seashell.svg", "skye.svg", "snowflake.svg", "soccer.svg", "starfish.svg", "strawberry.svg", "teddy.svg", "watermelon.svg"]

const description = `Suika Stay Home is a zero-player game and artwork by Billy Rennekamp and Joon Yeon Park.`
const dr = new DetRan()

// -----------------
// start
// -----------------
init()

// -----------------
// functions
// -----------------
async function init() {
  resetTimeout();
  loadSound();
  makePics()
  makeFruit()
  buildWorldEngine()
  resize()
  if (hl.context.previewMode) {
    prePopulate()
    setTimeout(() => {
      hl.token.capturePreview()
    }, 5000)
  }
  run()
  addFruit()
  setInterval(() => {
    if (!isPaused) {
      addFruit()
    }
  }, dropRate)
}

function resetTimeout() {
  clearTimeout(timeoutId);
  timeoutId = setTimeout(hideMuteElement, 3000);
}

function loadSound() {
  sound = new Howl({
    src: [soundUrl + 'webm', soundUrl + 'mp3'],
    sprite: {
      0: [1570, 2250],
      1: [2914, 3450],
      2: [4213, 4787],
      3: [5557, 6222],
      4: [6781, 7400],
      5: [8775, 9000],
      6: [9700, 10100]
    },
    volume: 0.3,
    autoUnlock: true,
    mobileAutoEnable: true,
    html5: true,
    pool: playLimit,
    onplayerror: function () {
      if (!muted) {
        currentlyPlaying--
      }
    },
    onend: function () {
      if (!muted) {
        currentlyPlaying--
      }
    },
  });
}

function setDimensions(width = window.innerWidth, height = window.innerHeight) {
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
  return { width, height }
}

async function makePics() {
  pics = Array.from({ length: variety }, (_, index) => (index + 1).toString());
  for (let i = 0; i < filenames.length; i++) {
    for (let j = 0; j < filenames.length; j++) {
      if (j == i) continue
      combos.push([i, j])
    }
  }
  combos = shuffle(combos)

  const comboIndex = hl.token.id
  const combo = combos[comboIndex];
  for (let i = 0; i < combo.length; i++) {
    const prize = combo[i];
    const filename = `public/fin/prize_${prize + 1}.png`;
    const image = document.createElement('img');
    image.src = filename;
    image.classList.add('load');
    document.body.appendChild(image);
  }

  hl.token.setName(`Suika #${hl.token.id}`);
  hl.token.setDescription(description)
  hl.token.setTraits({
    FirstPrize: capitalize(filenames[combo[0]].replace('.svg', '')),
    SecondPrize: capitalize(filenames[combo[1]].replace('.svg', '')),
  });
  console.log(JSON.stringify({
    tokenId: hl.token.id,
    name: hl.token.getName(),
    description: hl.token.getDescription(),
    traits: hl.token.getTraits()
  }, null, 2))
}

function makeFruit() {
  for (let i = 0; i < variety; i++) {
    const radius = i < 8 ? i * radiusStep + radiusOffset : 9 * radiusStep + radiusOffset;
    fruits.push({
      radius
    })
  }
}

function buildWorldEngine() {
  engine = Engine.create();
  render = Render.create({
    engine,
    element: document.getElementById('suika'),
    options: {
      showCollisions: false,
      wireframes: false,
      debug: false,
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

function makeFrame() {
  const bodies = world.bodies.filter((body) => body.isStatic);
  World.remove(world, bodies);
  const leftWall = Bodies.rectangle(-thick / 2, height / 2, thick, height, {
    isStatic: true,
    render: { fillStyle: bgColor }
  });
  const rightWall = Bodies.rectangle(width + thick / 2, height / 2, thick, height, {
    isStatic: true,
    render: { fillStyle: bgColor }
  });
  const ground = Bodies.rectangle(width / 2, height + thick / 2, width, thick, {
    isStatic: true,
    render: { fillStyle: bgColor }
  });
  World.add(world, [leftWall, rightWall, ground]);
}

function prePopulate() {
  hideMuteElement();
  const arr = Array.from(Array(variety).keys());
  const area = width * height;
  let addedArea = 0;
  let picks = [];
  let special = 0;
  for (let i = 0; i < 8; i++) {
    let count = 5 - Math.floor(i / 2);
    if (i > 5) {
      count = 3 - Math.floor((i - 6) / 2);
    }
    arr.push(...Array(count).fill(i));
  }
  while (addedArea < area * 0.8) {
    let index = weightedRandom();
    if (special < 2) {
      index = special === 0 ? 9 : 8;
      special++;
    }
    picks.push(index);
    const x = hl.random() * (width - thick * 2 - maxRadius) + thick + maxRadius / 2;
    const y = hl.random() * (height - thick * 2 - maxRadius) + thick + maxRadius / 2;
    addBody(x, y, index);
    const radius = fruits[index].radius;
    const add = Math.PI * Math.pow(radius, 2);
    addedArea += add;
  }
  function weightedRandom() {
    return arr[Math.floor(hl.random() * arr.length)];
  }
}

function run() {
  if (!isPaused) {
    Engine.update(engine, 1000 / 60);
  }
  requestAnimationFrame(run);
}

function addFruit(index = 0) {
  const x = (hl.random() * (width - thick * 2 - maxRadius)) + thick + maxRadius / 2;
  const y = -(maxRadius + (hl.random() * maxRadius * 2))
  addBody(x, y, index)
}

function addBody(x, y, index, inertia = 0) {
  const fruit = fruits[index];
  let filename, combo, comboIndex
  if (index < 8) {
    filename = `coin_${pics[index]}.png`
  } else {
    combo = combos[hl.token.id]
    comboIndex = combo[index - 8]
    filename = `prize_${comboIndex + 1}.png`
  }
  let shape, dimensions
  if (index > 7 && filenames[comboIndex].includes('aceofspades')) {
    shape = 'rectangle'
    const w = fruit.radius * 2 - 36 * 2
    const h = fruit.radius * 2
    dimensions = [w, h]
  } else if (index > 7 && filenames[comboIndex].includes('coke')) {
    shape = 'rectangle'
    const w = fruit.radius * 2 - 56 * 2
    const h = fruit.radius * 2
    dimensions = [w, h]
  } else if (index > 7 && filenames[comboIndex].includes('pig')) {
    shape = 'rectangle'
    const w = fruit.radius * 2
    const h = fruit.radius * 2 - 54 * 2
    dimensions = [w, h]
  } else if (index > 7 && (filenames[comboIndex].includes('dice') || filenames[comboIndex].includes('snowflake'))) {
    console.log('dice')
    shape = 'polygon'
    dimensions = [6, fruit.radius]
  } else {
    shape = 'circle'
    dimensions = [fruit.radius]
  }
  const body = Bodies[shape](x, y, ...dimensions, {
    index,
    isSleeping,
    density,
    friction,
    frictionStatic,
    slop,
    inertia,
    restitution,
    render: {
      sprite: {
        texture: `public/fin/${filename}`,
      }
    },
  });
  if (index > 7) {
    if (filenames[comboIndex].includes('aceofspades')) {
      Body.rotate(body, Math.PI / 5);
    } else if (filenames[comboIndex].includes('dice')) {
      Body.rotate(body, Math.PI / 9);
    }
  }
  World.add(world, body);

}

// -----------------
// sound functions
// -----------------

function mute() {
  muted = !muted
  if (!muted) {
    document.getElementById('mute').removeAttribute('muted')
  } else {
    document.getElementById('mute').setAttribute('muted', '')
    currentlyPlaying = 0
  }
}

function hideMuteElement() {
  const muteElement = document.getElementById('mute');
  muteElement.classList.add('hidden');
}

function showMuteElement() {
  const muteElement = document.getElementById('mute');
  muteElement.classList.remove('hidden');
}

function playSound(index) {
  if (muted) return
  index = index % 7
  if (currentlyPlaying < playLimit) {
    sound.play(index.toString())
    currentlyPlaying++
  }

}

// -----------------
// event listeners
// -----------------
Events.on(engine, "collisionStart", (event) => {
  let collisions = 0
  let collidedIds = []
  for (let i = event.pairs.length - 1; i >= 0; i--) {
    const bodyA = event.pairs[i].bodyA;
    const bodyB = event.pairs[i].bodyB;
    const collision = event.pairs[i].collision;
    if (bodyA.index === bodyB.index && !collidedIds.includes(bodyA.id) && !collidedIds.includes(bodyB.id)) {
      collidedIds.push(bodyA.id)
      collidedIds.push(bodyB.id)
      const index = bodyA.index;
      World.remove(world, [bodyA, bodyB], true);
      playSound(index);
      if (index !== fruits.length - 1) {
        const { x, y } = collision.supports[0];
        const combinedInertia = bodyA.inertia + bodyB.inertia;
        addBody(x, y, index + 1, combinedInertia);
        collisions++
        if (collisions > 10) {
          break; // Exit the for loop to avoid pileup
        }
      }
    }
  }
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    wasPaused = isPaused
    isPaused = true
  } else {
    if (!wasPaused) {
      isPaused = false
    }
  }
});
document.querySelector("canvas").addEventListener("pointerdown", () => {
  if (muted) {
    mute()
  }
});
document.getElementById('mute').addEventListener('click', () => {
  mute()
})
document.addEventListener('mousemove', throttle(() => {
  showMuteElement();
  resetTimeout();
}, 500));

function resize(w = window.innerWidth, h = window.innerHeight) {
  const results = setDimensions(w, h)
  const diffX = width - results.width
  width = results.width
  height = results.height
  render.bounds.max.x = width;
  render.bounds.max.y = height;
  render.options.width = width;
  render.options.height = height;
  render.canvas.width = width;
  render.canvas.height = height;
  makeFrame()
  let deltaX
  if (diffX > 0) {
    deltaX = -1 * Math.abs(diffX) / 2
  } else {
    deltaX = Math.abs(diffX) / 2
  }
  for (let i = 0; i < world.bodies.length; i++) {
    const body = world.bodies[i];
    if (!body.isStatic) {
      Body.translate(body, { x: deltaX, y: 0 });
    }
  }
}
const onResize = throttle(async () => {
  window.removeEventListener('resize', onResize);
  const diffLimit = 200
  const diffX = Math.abs(width - window.innerWidth)
  const diffY = Math.abs(height - window.innerHeight)
  const diff = diffX > diffY ? diffX : diffY
  if (diff > diffLimit) {
    await chunkResize(diff);
  } else {
    resize()
  }
  setResize()
}, 10)

async function chunkResize(diff) {

  const maxChunkSize = 4
  const results = setDimensions()
  const diffX = width - results.width
  const diffY = height - results.height
  const originalWidth = width
  const originalHeight = height
  // check total difference between old size and new size
  // determine how many chunks of tween is needed
  const chunks = Math.ceil(diff / maxChunkSize)
  // loop through each chunk
  // calculate each dimension
  // set dimension
  // wait some interval
  for (let i = 0; i < chunks; i++) {
    const w = originalWidth - ((diffX / chunks) * i)
    const h = originalHeight - ((diffY / chunks) * i)
    resize(w, h)
    await new Promise(resolve => setTimeout(resolve, 0))
  }
}
function setResize() {
  window.addEventListener('resize', onResize);
}
setResize()


// -----------------
// utils
// -----------------

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
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

function shuffle(unshuffled) {
  let shuffled = unshuffled
    .map(value => ({ value, sort: dr.random() }))
    .sort((a, b) => a.sort - b.sort)
  return shuffled.map(({ value }) => value)
}              