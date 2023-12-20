const bubbles = []
let frames = 0, isPaused = false
// requestAnimationFrame(addBubble)

function addBubble() {
  frames++
  if (frames % 10 === 0) {
    bubbles.push(new Bubble())
  }
}

let width, height, max = 1000
class Bubble {
  constructor(options = {}) {
    const defaults = {
      x: random(width),
      y: height - 1,
      r: random(10, 40),
      // r: random(120, 180),
      vector: createVector(random(-0.02, 0.02), random(-1.5, -2))
    };

    const { x, y, r, vector } = { ...defaults, ...options };

    this.x = x;
    this.y = y;
    this.r = r;
    this.vector = vector;
  }
}

function setup() {
  setDimensions()
  console.log({ width, height })
  let canvas = createCanvas(width, height);
  canvas.parent('p5'); // Attach canvas to div with id "p5"
  // frameRate(20)
}


let wasPaused = false
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

window.addEventListener('click', () => {
  isPaused = !isPaused
})

window.addEventListener('resize', throttle(() => {
  // isPaused = true;
  // moveObjectsTowardsCenter()
  setDimensions()
  // readjustObjects()
  resizeCanvas(width, height);

  // moveObjectsTowardsCenter()
  // isPaused = false;
}, 10)); // Adjust the delay (in milliseconds) as per your requirement


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

function setDimensions() {
  width = window.innerWidth
  height = window.innerHeight

  // console.log({ width, height })

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

function radiusToVector(radius) {
  return -(radius * 5) / 100
}

function draw() {
  if (isPaused) return
  // background('#607D8B')
  // background('rgb(90,105,110)')
  // background('rgb(180,180,180)')
  background('white')
  background('rgba(255, 255, 0, 0.2)')
  background('lightgrey')
  frames++
  if (frames % 10 === 0) {
    bubbles.push(new Bubble())
  }
  for (let i = bubbles.length - 1; i >= 0; i--) {
    let bubble = bubbles[i]
    bubble.x += bubble.vector.x
    bubble.y += radiusToVector(bubble.r)
    if (bubble.x > width + bubble.r * 2 || bubble.x < 0 - bubble.r * 2) {
      // remove bubble
      bubbles.splice(i, 1)
    } else if (bubble.y > height + bubble.r * 2 || bubble.y < 0 - bubble.r * 2) {
      // remove bubble
      bubbles.splice(i, 1)
    } else {
      const deltaVector = random(-.03, .03)
      bubble.vector.x += deltaVector
    }

    for (let j = bubbles.length - 1; j >= 0; j--) {
      if (j == i) continue
      let otherBubble = bubbles[j]
      let distance = dist(bubble.x, bubble.y, otherBubble.x, otherBubble.y)
      if (distance < (bubble.r + otherBubble.r) / 2) {
        // remove bubble
        bubbles.splice(i, 1)
        bubbles.splice(j, 1)
        bubbles.push(new Bubble({
          x: (bubble.x + otherBubble.x) / 2,
          y: (bubble.y + otherBubble.y) / 2,
          r: Math.sqrt((bubble.r * bubble.r + otherBubble.r * otherBubble.r)),
          // r: (bubble.r + otherBubble.r) / 2,
          // r: (bigger(bubble.r, otherBubble.r) + smaller(bubble.r, otherBubble.r) / 2),
          vector: createVector((bubble.vector.x + otherBubble.vector.x) / 2, (bubble.vector.y + otherBubble.vector.y) / 2)//.normalize()
        }))
        break
      }

    }

    function bigger(x, y) {
      return x > y ? x : y
    }
    function smaller(x, y) {
      return x < y ? x : y
    }

    const hexToRGBA = (hex, alpha) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    // fill(hexToRGBA('#E1F5FE', 0.2)); // Very light blue in RGBA format
    fill('rgba(255,255,255,0.2)'); // Very light blue in RGBA format
    strokeWeight(0.5)
    stroke('rgba(255,255,255,0.5)')
    ellipse(bubble.x, bubble.y, bubble.r, bubble.r)
    // fill('rgba(255,255,255,0.5)')
    // const offset = 4.5
    // push()
    // translate(bubble.x - bubble.r / offset, bubble.y - bubble.r / offset)
    // rotate(PI / 4)
    // strokeWeight(0)
    // ellipse(0, 0, bubble.r / (offset / 0.5), bubble.r / (offset / 1.4))
    // pop()
    // push()
    // translate(bubble.x, bubble.y - bubble.r / (offset / 1.6))
    // ellipse(0, 0, bubble.r / (offset / 0.6), bubble.r / (offset / 0.6))
    // pop()

    noFill();
    stroke('rgba(255,255,255,0.5)')
    strokeWeight(bubble.r / 10)
    arc(bubble.x + bubble.r / 30, bubble.y + bubble.r / 15, bubble.r / 1.1, bubble.r / 1.1, PI + PI / 6, PI + PI / 2.5);
  }
  // background(random(255), random(255), random(255));
  // Add your drawing code here
}
