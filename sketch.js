
const variety = 10
const prizeSize = 27
const radiusOffset = 40;
const radiusStep = 10;
const soundUrl = "public/pop.wav";
const max = 1000
const thick = 50
const dropRate = 200
const maxRadius = radiusStep + radiusOffset
const bgColor = 'rgba(0,0,0,0)'
const wallColor = 'rgba(0,0,0,0)'
const isSleeping = false, density = 0.01, friction = 0.1, frictionStatic = 0.5, slop = 0.0001, restitution = 0.2
const Engine = Matter.Engine, Render = Matter.Render, World = Matter.World, Bodies = Matter.Bodies, Events = Matter.Events
let loadedAudio, timeoutId, render, engine, world, width, height, smallerMultiplyer, isPortrait
let muted = false, isPaused = false, wasPaused = false
let fruits = [], pics = [], combos = []

const description = `Suika Stay Home is...`
const dr = new DetRan()

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
  setDimensions()
  makePics()
  makeFruit()
  buildWorldEngine()
  makeFrame()
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

function makePics() {
  pics = Array.from({ length: variety }, (_, index) => (index + 1).toString());

  for (let i = 0; i < prizeSize; i++) {
    for (let j = 0; j < prizeSize; j++) {
      if (j == i) continue
      combos.push([i, j])
    }
  }
  combos = shuffle(combos)

  hl.token.setName(`Suika #${hl.token.id}`);
  hl.token.setDescription(description)

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
    render: { fillStyle: wallColor }
  });
  const rightWall = Bodies.rectangle(width + thick / 2, height / 2, thick, height, {
    isStatic: true,
    render: { fillStyle: wallColor }
  });
  const ground = Bodies.rectangle(width / 2, height + thick / 2, width, thick, {
    isStatic: true,
    render: { fillStyle: wallColor }
  });
  World.add(world, [leftWall, rightWall, ground]);
}

function prePopulate() {
  hideMuteElement();
  // const arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
  const arr = Array.from(Array(variety).keys());
  console.log({ arr }); // [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
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
    Engine.update(engine, 1000 / 60); // update the engine
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
  let filename
  if (index < 8) {
    filename = `coin_${pics[index]}.png`
  } else {
    const combo = combos[hl.token.id - 1]
    const comboIndex = combo[index - 8]
    filename = `prize_${comboIndex}.png`
  }

  const body = Bodies.circle(x, y, fruit.radius, {
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
  World.add(world, body);
}

// -----------------
// sound functions
// -----------------

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

function playSound(index) {
  if (muted) return
  const soundRanges = [
    [1.570, 2.250],
    [2.914, 3.450],
    [4.213, 4.787],
    [5.557, 6.222],
    [6.781, 7.400],
    [8.775, 9],
    [9.7, 10.1]
  ];
  let sound = new Audio(loadedAudio);
  index = index % soundRanges.length;
  const [start, end] = soundRanges[index];
  const nowMilliseconds = new Date().getTime();
  const volume = (index + 1) / 10;
  sound.volume = volume;
  sound.currentTime = start;
  function onPlay() {
    const newNowMilliseconds = new Date().getTime();
    const timeToPlay = newNowMilliseconds - nowMilliseconds;
    if (timeToPlay > 200) {
      sound.pause();
      setTimeout(() => {
        sound = null;
      }, 150);
    } else {
      setTimeout(() => {
        sound.pause();
        setTimeout(() => {
          sound = null;
        }, 150);
      }, Math.floor((end - start) * 1000));
    }
    sound.removeEventListener('playing', onPlay);
  }
  sound.addEventListener('playing', onPlay);
  sound.play().catch(() => {
    mute();
  });
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
document.querySelector("canvas").addEventListener("click", () => {
  if (muted) {
    mute()
  }
});
document.getElementById('mute').addEventListener('click', () => {
  if (!muted) {
    mute()
  }
})
document.addEventListener('mousemove', throttle(() => {
  showMuteElement();
  resetTimeout();
}, 500));
window.addEventListener('resize', throttle(() => {
  setDimensions()
  render.bounds.max.x = width;
  render.bounds.max.y = height;
  render.options.width = width;
  render.options.height = height;
  render.canvas.width = width;
  render.canvas.height = height;
  makeFrame()
}, 10));


// -----------------
// utils
// -----------------

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