import Sentiment from "https://cdn.jsdelivr.net/npm/sentiment/+esm";

export const PALETTE = [
  
  "#d24224",
  "#ddd234",
  "#a32342",
  "#824444",
  "#921921",
  "#e23433",
  "#0262e3",
  "#0293e3",
  "#0e83c4",
  "#0f92d2",
  "#0663a7",
  

];

document.querySelector("#downloadButton").addEventListener("click", downloadSVG);
document.querySelector("#drawButton").addEventListener("click", drawSpirograph);

class CircleSpirograph {
  constructor({
    vertices = 4,
    gearRatio = 0.4,
    penOffset = 0.1,
    strokeColor = "white",
    strokeWidth = 1,
    symmetrySkew = 0,
    dashPattern = null,
  }) {
    this.vertices = vertices;
    this.gearRatio = gearRatio;
    this.penOffset = penOffset;
    this.strokeColor = strokeColor;
    this.strokeWidth = strokeWidth;
    this.symmetrySkew = symmetrySkew;
    this.dashPattern = dashPattern;
    console.log(strokeColor);
  }

  draw(svgEl) {
    const path = this.buildPath();
    path.setAttribute("stroke", this.strokeColor);
    path.setAttribute("stroke-width", this.strokeWidth);
    if (this.dashPattern) {
      path.setAttribute("stroke-dasharray", this.dashPattern.join(","));
    }
    svgEl.appendChild(path);
  }

  buildPath() {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");

    const baseRadius = 150;
    const gearRadius = baseRadius * this.gearRatio;
    const penOffset = gearRadius * this.penOffset;
    //const penOffset = 80;
    const dTheta = 0.009; // Angular increment in radians
    const maxSteps = 60000;

    const baseVertices = this.vertices;
    const polygonAngleStep = (2 * Math.PI) / baseVertices;

    const symmetrySkew = this.symmetrySkew || 0;

    let d = "";
    let t = 0;

    // Start position (used for repeat detection)
    const start = this.computePenPosition(
      t,
      baseRadius,
      gearRadius,
      penOffset,
      polygonAngleStep,
      symmetrySkew
    );

    d += `M ${start.x},${start.y}`;

    for (let i = 1; i < maxSteps; i++) {
      t += dTheta;

      const pos = this.computePenPosition(
        t,
        baseRadius,
        gearRadius,
        penOffset,
        polygonAngleStep,
        symmetrySkew
      );

      d += ` L ${pos.x},${pos.y}`;

      // Check for loop closure
      const dx = pos.x - start.x;
      const dy = pos.y - start.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Also check that we're roughly back at the *same angle*
      const angleDiff = Math.abs((t % (2 * Math.PI)) - 0);

      if (distance < 0.02 && angleDiff < 0.0005) {
        break; // Completed one full loop
      }
    }

    path.setAttribute("d", d);
    path.setAttribute("fill", "none");

    return path;
  }

  computePenPosition(
    t,
    baseRadius,
    gearRadius,
    penOffset,
    polygonAngleStep,
    symmetrySkew
  ) {
    const gearX = baseRadius * Math.cos(t);
    const gearY = baseRadius * Math.sin(t);

    const rollingRotation = -t * (1 / this.gearRatio);
    const penAngle = rollingRotation + symmetrySkew * Math.sin(t * 3);

    const penX = gearX + penOffset * Math.cos(penAngle);
    const penY = gearY + penOffset * Math.sin(penAngle);

    return { x: penX, y: penY };
  }

  draw(svgEl) {
    // Clear previous drawing

    // Create the SVG path
    const path = this.buildPath();

    // Apply styling attributes
    path.setAttribute("stroke", this.strokeColor || "white");
    path.setAttribute("stroke-width", this.strokeWidth || 1);
    path.setAttribute("fill", "none");
    if (this.dashPattern) {
      path.setAttribute("stroke-dasharray", this.dashPattern.join(","));
    }

    // Append to SVG
    svgEl.appendChild(path);
  }
}

class Spirograph {
  constructor(R, r, d) {
    this.R = R; // Big circle radius
    this.r = r; // Small circle radius
    this.d = d; // Distance from small circle center to pen
    this.gradientColors = ["turquoise", "black"];
    this.createGradient();
  }

  createGradient() {
    const defs = document.getElementById("definitions");
    const gradient = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "linearGradient"
    );

    gradient.setAttribute("id", "circleSpiroGradient");
    gradient.setAttribute("x1", "0%");
    gradient.setAttribute("y1", "0%");
    gradient.setAttribute("x2", "100%");
    gradient.setAttribute("y2", "0%");

    this.gradientColors.forEach((color, i) => {
      const stop = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "stop"
      );
      stop.setAttribute(
        "offset",
        `${(i / (this.gradientColors.length - 1)) * 100}%`
      );
      stop.setAttribute("stop-color", color);
      gradient.appendChild(stop);
    });

    defs.appendChild(gradient);
    const svg = document.getElementById("spiro");
    svg.appendChild(defs);
  }

  generatePoints(steps = 1000) {
    const points = [];
    const TWO_PI = Math.PI * 2;

    // Calculate how many loops until it closes
    const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
    const rotations = this.r / gcd(this.r, this.R);

    const maxTheta = rotations * TWO_PI;

    for (let i = 0; i <= steps; i++) {
      const theta = (i / steps) * maxTheta;

      const x =
        (this.R - this.r) * Math.cos(theta) +
        this.d * Math.cos(((this.R - this.r) / this.r) * theta);
      const y =
        (this.R - this.r) * Math.sin(theta) -
        this.d * Math.sin(((this.R - this.r) / this.r) * theta);

      points.push({ x, y });
    }

    return points;
  }
}

class PolygonGearSpirograph {
  constructor(polygon, r, d) {
    this.polygon = polygon; // Array of vertices [{x, y}, ...]
    this.r = r; // Rolling gear radius
    this.d = d; // Pen offset from rolling gear center
  }

  generatePoints(stepsPerEdge = 500, threshold = 0.5) {
    const points = [];
    let rotation = 0;
    const firstPoint = this.calcPenPos(
      this.polygon[0],
      this.polygon[1],
      0,
      rotation
    );
    points.push(firstPoint);

    let done = false;
    let loopCount = 0;

    while (!done && loopCount < 10000) {
      // Safe max to avoid infinite loop
      for (let i = 0; i < this.polygon.length; i++) {
        const p1 = this.polygon[i];
        const p2 = this.polygon[(i + 1) % this.polygon.length];
        const edgeVec = { x: p2.x - p1.x, y: p2.y - p1.y };
        const edgeLength = Math.hypot(edgeVec.x, edgeVec.y);
        const edgeAngle = Math.atan2(edgeVec.y, edgeVec.x);

        for (let s = 1; s <= stepsPerEdge; s++) {
          const t = s / stepsPerEdge;
          const cx = p1.x + edgeVec.x * t;
          const cy = p1.y + edgeVec.y * t;
          const arcLength = edgeLength * t;
          const localRot = arcLength / this.r;
          const penAngle = rotation + localRot;

          const px = this.d * Math.cos(penAngle);
          const py = this.d * Math.sin(penAngle);

          const rotatedPx = px * Math.cos(edgeAngle) - py * Math.sin(edgeAngle);
          const rotatedPy = px * Math.sin(edgeAngle) + py * Math.cos(edgeAngle);

          const penPos = { x: cx + rotatedPx, y: cy + rotatedPy };

          points.push(penPos);

          // Check if it closes near the start
          if (
            loopCount > 0 &&
            i === this.polygon.length - 1 &&
            s === stepsPerEdge
          ) {
            const dx = penPos.x - firstPoint.x;
            const dy = penPos.y - firstPoint.y;
            const dist = Math.hypot(dx, dy);
            if (dist < threshold) {
              // tolerance for closing loop
              done = true;
              break;
            }
          }
        }

        rotation += edgeLength / this.r;

        if (done) break;
      }
      loopCount++;
    }
    return points;
  }
  calcPenPos(p1, p2, t, rotation) {
    const edgeVec = { x: p2.x - p1.x, y: p2.y - p1.y };
    const edgeLength = Math.hypot(edgeVec.x, edgeVec.y);
    const edgeAngle = Math.atan2(edgeVec.y, edgeVec.x);
    const cx = p1.x + edgeVec.x * t;
    const cy = p1.y + edgeVec.y * t;
    const penAngle = rotation;
    const px = this.d * Math.cos(penAngle);
    const py = this.d * Math.sin(penAngle);
    const rotatedPx = px * Math.cos(edgeAngle) - py * Math.sin(edgeAngle);
    const rotatedPy = px * Math.sin(edgeAngle) + py * Math.cos(edgeAngle);
    return { x: cx + rotatedPx, y: cy + rotatedPy };
  }
}
function createDefinitions() {
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  defs.setAttribute("id", "definitions");
  const svg = document.getElementById("spiro");
  svg.appendChild(defs);
}

function getInput() {
  //Get the textarea element by its ID
  const textarea = document.getElementById("prompt");

  const textareaValue = textarea.value;
  //const params = analyzeTextToSpiroParams(textareaValue);

  return textareaValue;
}

function analyzeTextToSpiroParams(text, isShadow) {
  const sentimentObj = new Sentiment();
  const sentiment = sentimentObj.analyze(text);

  // Raw stats
  const wordCount = text.trim().split(/\s+/).length;
  const charCount = text.length;
  const avgWordLength = charCount / wordCount || 1;
  const uppercaseCount = (text.match(/[A-Z]/g) || []).length;
  const punctuationCount = (text.match(/[.,!?;:]/g) || []).length;
  const exclamations = (text.match(/!/g) || []).length;
  const newlines = (text.match(/\n/g) || []).length;

  // Normalized sentiment score: from -1 to +1
  const normSentiment = Math.max(-1, Math.min(1, sentiment.comparative));

  // Text complexity and style mappings
  const vertices = Math.max(3, Math.min(10, Math.floor(avgWordLength))); // 3–10

  const letterScore = scoreLetters(text); //apply nice letter weighting
  console.log("letter score:" + letterScore);
  const gearRatio =
    0.1 + (0.6 * (Math.sin(wordCount * 0.3) * 0.5) + 0.1 * (5 - letterScore)); // 0.2–0.7
  const penOffset = 0.8 + Math.abs(normSentiment) * 8.2; // 0.1–0.5

  console.log(sentiment);

  const strokeColor = getColorFromText(sentiment, isShadow);

  console.log(strokeColor);
  const symmetrySkew = (punctuationCount + exclamations) * 0.01; // Subtle irregularity
  const shape = exclamations % 5;
  //const strokeWidth = 1 + Math.min(2, uppercaseCount * 0.1); // Bold if intense
  const strokeWidth = 1 + (uppercaseCount % 2); //odd = bolder
  const dashPattern = newlines > 0 ? [10, 1] : null; // If multiline, dashed

  return {
    vertices,
    gearRatio,
    penOffset,
    strokeColor,
    strokeWidth,
    symmetrySkew,
    dashPattern,
  };
}

const letterScores = {
  g: 5,
  y: 4,
  k: 4,
  j: 3,
  b: 3,
};

function scoreLetters(text) {
  const cleaned = text.toLowerCase().replace(/[^a-z]/g, "");
  let score = 0;
  let count = 0;

  for (let char of cleaned) {
    const bonus = letterScores[char] || 0;
    score += bonus;
    count++;
  }

  return score / count || 0;
}

function getColorFromText(result, shadow = false) {
  const scoreCount = new Map();

  // Count frequency of each sentiment score
  result.calculation.forEach((entry) => {
    const score = Object.values(entry)[0];
    if (typeof score === "number") {
      scoreCount.set(
        score,
        (scoreCount.get(shadow ? score : 11 - score) || 0) + 1
      );
    }
  });

  // Find the most frequent score
  let dominantScore = 0;
  let maxCount = 0;
  for (const [score, count] of scoreCount.entries()) {
    if (count > maxCount || (count === maxCount && score > dominantScore)) {
      dominantScore = score;
      maxCount = count;
    }
  }

  console.log("Dominant Score" + dominantScore);

  // Normalize to 0–10 index (–5 to +5)
  const colorIndex = dominantScore + 5;
  return PALETTE[colorIndex];
}

function getSignalWords(text) {
  const doc = nlp(text);
  const nouns = doc.nouns().out("text");
  const mainVerbs = doc.verbs().isPlural().out("text"); // optional: structural verbs
  return [...nouns, ...mainVerbs];
}

function getShadowWords(text) {
  const doc = nlp(text);
  const adjectives = doc.adjectives().out("array");
  const adverbs = doc.adverbs().out("array");
  const emotiveVerbs = doc.verbs().not("#Infinitive").out("array"); // expressive verbs
  return [...adjectives, ...adverbs, ...emotiveVerbs];
}

export function drawSpirograph() {
  document.getElementById("spiro").replaceChildren();
  createDefinitions();

  const rollingGearRadius = 74;
  const penOffset = 69.25;
  const FOUR_SQUARE = [
    { x: -150, y: -150 },
    { x: 150, y: -150 },
    { x: 150, y: 150 },
    { x: -150, y: 150 },
  ];

  /*const spiroGear = new PolygonGearSpirograph(
    FOUR_SQUARE,
    rollingGearRadius,
    penOffset
  );*/
  //const points = spiroGear.generatePoints();

  const text = getInput();

  const doc = nlp(text);
  const nouns = doc.nouns().out("text");
  const verbs = doc.verbs().isPlural().out("text");
  const signalWords = nouns + " " + verbs;
  console.log(signalWords);
  const signalParams = analyzeTextToSpiroParams(signalWords, false);
  console.log(signalParams);

  const circleSignalSpiro = new CircleSpirograph(signalParams);
  //const points = spiro.generatePoints(stepsPerEdge=500, threshold=0.5);

  //drawAnimated(points, "white");
  circleSignalSpiro.draw(document.getElementById("spiro"));

  const nounsArr = doc.nouns().out("array");
  const verbsArr = doc.verbs().out("array");
  const emotiveVerbs = doc.verbs().not("#Infinitive").out("array");
  console.log("emotiveVerbs:" + emotiveVerbs);
  const signalWordsArr = [
    ...nounsArr,
    ...verbsArr,
    ...emotiveVerbs,
    ...emotiveVerbs,
    ...emotiveVerbs,
  ];
  let shadowDoc = nlp(text);
  signalWordsArr.forEach((word) => {
    // Match exact word with word boundaries
    shadowDoc = shadowDoc.replace(new RegExp(`\\b${word}\\b`, "gi"), "");
  });

  const shadowWords = shadowDoc.text().replace(/\s+/g, " ").trim();
  console.log(shadowWords);
  const shadowParams = analyzeTextToSpiroParams(shadowWords, true);
  const circleShadowSpiro = new CircleSpirograph(shadowParams);
  console.log(shadowParams);
  circleShadowSpiro.draw(document.getElementById("spiro"));

  //const shadowParams = analyzeTextToSpiroParams(getShadowWords(text));
  //const signalParams = analyzeTextToSpiroParams(getSignalWords(text));

  //const circleShadowSpiro = new CircleSpirograph(shadowParams);
  //const points = spiro.generatePoints(stepsPerEdge=500, threshold=0.5);

  //drawAnimated(points, "white");
  //circleShadowSpiro.draw(document.getElementById("spiro"));
}

// Your function must be async
async function drawAnimated(points, color = "white", waitTime = 50) {
  const waitThreshold = points.length / 20;
  const svg = document.getElementById("spiro");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  let d = `M ${points[0].x},${points[0].y}`;

  svg.appendChild(path); // add once, keep updating it

  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i].x},${points[i].y}`;

    if (i % waitThreshold === 0) {
      path.setAttribute("d", d);
      path.setAttribute("stroke", color);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke-width", "1");
      svg.replaceChildren(path);
      console.log("WAITING");
      await wait(waitTime); // Let browser render!
    }
  }

  // Final update
  path.setAttribute("d", d);
  path.setAttribute("stroke", color);
  path.setAttribute("fill", "none");
  path.setAttribute("stroke-width", "1");
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getFilename() {
  let randomNumber = Math.random();
  console.log(randomNumber); // Outputs a random number like 0.23456789
  
}

function downloadSVG() {
  console.log("Downloading SVG...");
  const svg = document.getElementById("spiro");
  const serializer = new XMLSerializer();

  // Clone to avoid altering DOM
  const clone = svg.cloneNode(true);

  // Inject metadata
  const metadata = document.createElementNS("http://www.w3.org/2000/svg", "metadata");
  metadata.textContent = `
    Spiroquad v1.0 — A generative spirograph crafted from poetic inputs.
    https://jupiterbyrd.github.io/spiroquad
    Easter Egg: The spirograph hears your words.`;
  clone.insertBefore(metadata, clone.firstChild);

  // Serialize
  let source = serializer.serializeToString(clone);
  if (!source.match(/^<\?xml/)) {
    source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
  }

  const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "spiroquad.svg";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
