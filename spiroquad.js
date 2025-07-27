import Sentiment from 'https://cdn.jsdelivr.net/npm/sentiment/+esm';

document.querySelector('#downloadButton').addEventListener('click', createdSVG);
document.querySelector('#drawButton').addEventListener('click', drawSpirograph);

class Spirograph {
  constructor(R, r, d) {
    this.R = R; // Big circle radius
    this.r = r; // Small circle radius
    this.d = d; // Distance from small circle center to pen
    this.gradientColors = ["turquoise", "black"];
    this.createGradient()
  }

  createGradient() {
    const defs = document.getElementById('definitions');
    const gradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");

    gradient.setAttribute("id", "circleSpiroGradient");
    gradient.setAttribute("x1", "0%");
    gradient.setAttribute("y1", "0%");
    gradient.setAttribute("x2", "100%");
    gradient.setAttribute("y2", "0%");

    this.gradientColors.forEach((color, i) => {
      const stop = document.createElementNS("http://www.w3.org/2000/svg", "stop");
      stop.setAttribute("offset", `${(i / (this.gradientColors.length - 1)) * 100}%`);
      stop.setAttribute("stop-color", color);
      gradient.appendChild(stop);
    });

    defs.appendChild(gradient);
    const svg = document.getElementById('spiro');
    svg.appendChild(defs);
  }

  generatePoints(steps = 1000) {
    const points = [];
    const TWO_PI = Math.PI * 2;

    // Calculate how many loops until it closes
    const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
    const rotations = this.r / gcd(this.r, this.R);

    const maxTheta = rotations * TWO_PI;

    for (let i = 0; i <= steps; i++) {
      const theta = (i / steps) * maxTheta;

      const x = (this.R - this.r) * Math.cos(theta) + this.d * Math.cos(((this.R - this.r) / this.r) * theta);
      const y = (this.R - this.r) * Math.sin(theta) - this.d * Math.sin(((this.R - this.r) / this.r) * theta);

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
      this.gradientColors = ["red", "var(--jupiterbyrd-orange)", "white"];
      this.createGradient()
    }
    createGradient() {
      const defs = document.getElementById('definitions');
      const gradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
  
      gradient.setAttribute("id", "polygonSpiroGradient");
      gradient.setAttribute("x1", "0%");
      gradient.setAttribute("y1", "0%");
      gradient.setAttribute("x2", "100%");
      gradient.setAttribute("y2", "0%");
  
      this.gradientColors.forEach((color, i) => {
        const stop = document.createElementNS("http://www.w3.org/2000/svg", "stop");
        stop.setAttribute("offset", `${(i / (this.gradientColors.length - 1)) * 100}%`);
        stop.setAttribute("stop-color", color);
        gradient.appendChild(stop);
      });
  
      defs.appendChild(gradient);
      
    }
  
    generatePoints(stepsPerEdge = 500, threshold= 0.5) {
        const points = [];
        let rotation = 0;
        const firstPoint = this.calcPenPos(this.polygon[0], this.polygon[1], 0, rotation);
        points.push(firstPoint);
    
        let done = false;
        let loopCount = 0;
    
        while (!done && loopCount < 10000) { // Safe max to avoid infinite loop
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
              if (loopCount > 0 && i === this.polygon.length - 1 && s === stepsPerEdge) {
                const dx = penPos.x - firstPoint.x;
                const dy = penPos.y - firstPoint.y;
                const dist = Math.hypot(dx, dy);
                if (dist < threshold) { // tolerance for closing loop
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
    
        console.log(`Finished after ${loopCount} polygon loops`);
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

function getSpiroParameters() {
  

  const sentiment = new Sentiment();
  const result = sentiment.analyze("I love the roses but the thorns hurt me");

  console.log(result.score); // e.g. 1 (positive), -2 (negative)
  console.log(result.comparative); // normalized by text length
  if (result.score < 0) {
    // tight spiral, short arm length
  } else if (result.score > 0) {
    // open spiral, wide arm length
  } else {
    // balanced, classic spiro
  }
}
function createDefinitions() {
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    defs.setAttribute("id", "definitions")
    const svg = document.getElementById('spiro');
    svg.appendChild(defs);
}

function getInput() {
  //Get the textarea element by its ID
  const textarea = document.getElementById("prompt");

  // Get the value of the textarea
  const textareaValue = textarea.value;
  
  const params = analyzeTextToSpiroParams("Quiet evening with a good book.");
  
  console.log(params)

  return params;

}


function analyzeTextToSpiroParams(text) {
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
  const gearRatio = 0.2 + 0.5 * (Math.sin(wordCount * 0.3) * 0.5 + 0.5);   // 0.2–0.7
  const penOffset = 0.1 + (Math.abs(normSentiment) * 0.4);               // 0.1–0.5

  const strokeHue = Math.floor(200 + normSentiment * 120); // blue→green→red
  const strokeColor = `hsl(${strokeHue}, 80%, 65%)`;

  const symmetrySkew = (punctuationCount + exclamations) * 0.01;         // Subtle irregularity
  const strokeWidth = 1 + Math.min(4, uppercaseCount * 0.1);             // Bold if intense
  const dashPattern = newlines > 0 ? [4, 2] : null;                      // If multiline, dashed

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


export function drawSpirograph() {
  createDefinitions()

  getInput()

  const rollingGearRadius = 86;
  const penOffset = 90;

//context.clearRect(0, 0, canvas.width, canvas.height);
// Square stationary gear

const ICECREAM_STICK = [
  { x: 0, y: 150 },

  { x: 0, y: -150 },
];
 

    const spiroGear = new PolygonGearSpirograph(ICECREAM_STICK, rollingGearRadius,penOffset);
    const points = spiroGear.generatePoints();

    const spiro = new Spirograph(200, 132, 80);
    //const points = spiro.generatePoints(stepsPerEdge=500, threshold=0.5);
    const circlepoints = spiro.generatePoints();
 
    drawAnimated(points, "var(--jupiterbyrd-orange)");
    

    drawAnimated(circlepoints, "white");

    
}

// Your function must be async
async function drawAnimated(points, color="white", waitTime = 50) {
  const waitThreshold = points.length/20;
  const svg = document.getElementById('spiro');
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  let d = `M ${points[0].x},${points[0].y}`;

  svg.appendChild(path); // add once, keep updating it
  
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i].x},${points[i].y}`;
    
    if (i % waitThreshold === 0) {
      path.setAttribute("d", d);
      path.setAttribute("stroke",color);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke-width", "1");
      svg.replaceChildren(path);
      console.log("waiting")
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
  return new Promise(resolve => setTimeout(resolve, ms));
}



export function createdSVG() {
  const svg = document.getElementById('spiro');
  
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svg);

    // Add namespaces if missing
    if (!source.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
      source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    if (!source.match(/^<svg[^>]+"http:\/\/www\.w3\.org\/1999\/xlink"/)) {
      source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
    }

    // Add XML declaration
    source = '<?xml version="1.0" standalone="no"?>\n' + source;

    // Create blob
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    // Find the same <a>
    const link = document.getElementById('download-link');
    link.href = url;
    link.download = 'spirograph.svg';
    link.click();
    // Revoke URL after download
    setTimeout(() => URL.revokeObjectURL(url), 1000);

}


//STYLING STUFFFFFF
