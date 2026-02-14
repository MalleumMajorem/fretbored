// --- APPLICATION STATE ---
let startFret = 0;
let numFrets = 12;
let selectedKey = "G";
let stringStates = ["", "", "", "", "", ""];
let markers = [];

const canvas = document.getElementById("fretboard");
const ctx = canvas.getContext("2d");
const readout = document.getElementById("detector-readout");
const sidebar = document.getElementById("sidebar");
const tabBtn = document.getElementById("toggle-tab");

// --- SIDEBAR TAB TOGGLE ---
tabBtn.addEventListener("click", () => {
  sidebar.classList.toggle("collapsed");
  tabBtn.innerText = sidebar.classList.contains("collapsed") ? "◀" : "▶";
});

// --- THE NEW "USER-FIRST" SMART ACCORDION ---
const accordionSections = Array.from(
  document.querySelectorAll(".smart-accordion"),
);

function enforceSpace(protectedSection = null) {
  if (sidebar.classList.contains("collapsed")) return;

  // Start from the bottom of the sidebar and work up
  for (let i = accordionSections.length - 1; i >= 0; i--) {
    let section = accordionSections[i];

    // If the sidebar is overflowing...
    if (sidebar.scrollHeight > sidebar.clientHeight + 5) {
      // And this section is open, AND it's not the one you just clicked...
      if (section !== protectedSection && section.open) {
        section.open = false; // Close it to make room!
      }
    } else {
      break; // If we made enough room, stop closing things!
    }
  }
}

// 1. When you physically click a box, it opens, and forces room for itself.
accordionSections.forEach((el) => {
  el.addEventListener("toggle", (e) => {
    if (el.open) {
      enforceSpace(el); // Passes itself as the VIP protected section
    }
  });
});

// 2. Only automatically crunch boxes if you physically resize the browser window.
window.addEventListener("resize", () => {
  enforceSpace(null); // No VIP section, just crunch if needed
});

// --- CORE APP LOGIC ---
function getActivePitches() {
  let pitches = new Set();
  for (let s = 0; s < 6; s++) {
    if (stringStates[s] === "X") continue;
    if (stringStates[s] === "O") pitches.add(tuningPitches[s] % 12);
  }
  for (let m of markers) {
    if (stringStates[m.s] === "X" || stringStates[m.s] === "O") continue;
    if (m.f > startFret && m.f <= startFret + numFrets) {
      pitches.add((tuningPitches[m.s] + m.f) % 12);
    }
  }
  return Array.from(pitches);
}

function detectScale() {
  let uniquePitches = getActivePitches();
  if (uniquePitches.length === 0) {
    readout.innerText = "Detected: No Notes Placed";
    return;
  }

  let globalRoot = keyRoots[selectedKey];

  if (uniquePitches.length >= 5) {
    let distances = uniquePitches.map((p) => (p - globalRoot + 12) % 12);
    distances = Array.from(new Set(distances)).sort((a, b) => a - b);
    let sortedIntervals = distances
      .map((d) => getGrammarLabel(d, distances))
      .join(",");

    if (scaleDict[sortedIntervals]) {
      readout.innerText = `Detected: ${selectedKey} ${scaleDict[sortedIntervals]}`;
    } else {
      readout.innerText = `Pattern: ${sortedIntervals.replace(/,/g, ", ")}`;
    }
    return;
  }

  let matches = [];
  for (let candidateRoot of uniquePitches) {
    let distances = uniquePitches.map((p) => (p - candidateRoot + 12) % 12);
    distances = distances.sort((a, b) => a - b);
    let sortedIntervals = distances
      .map((d) => getGrammarLabel(d, distances))
      .join(",");

    if (scaleDict[sortedIntervals]) {
      let chordType = scaleDict[sortedIntervals];
      let rootName = keySpellings[selectedKey][candidateRoot];
      matches.push(`${rootName} ${chordType}`);
    }
  }

  if (matches.length > 0) {
    readout.innerText = "Detected: " + matches.join(" / ");
  } else {
    let distances = uniquePitches.map((p) => (p - globalRoot + 12) % 12);
    distances = Array.from(new Set(distances)).sort((a, b) => a - b);
    let sortedIntervals = distances
      .map((d) => getGrammarLabel(d, distances))
      .join(",");
    readout.innerText = `Pattern: ${sortedIntervals.replace(/,/g, ", ")}`;
  }
}

function updateCribNotes() {
  let rootPitch = keyRoots[selectedKey];
  let spellings = keySpellings[selectedKey];
  let getNote = (interval) => spellings[(rootPitch + interval) % 12];
  let n = [0, 2, 4, 5, 7, 9, 11].map(getNote);

  document.getElementById("sb-title").innerText = `Key of ${selectedKey} Major`;
  document.getElementById("sb-rel-minor").innerText =
    `(Relative Minor: ${n[5]}m)`;
  document.getElementById("sb-scale-notes").innerText = n.join(" - ");

  let getTriad = (i) => `(${n[i]} - ${n[(i + 2) % 7]} - ${n[(i + 4) % 7]})`;
  let chordsText =
    `I:   ${n[0]} Major ${getTriad(0)}\n` +
    `ii:  ${n[1]} Minor ${getTriad(1)}\n` +
    `iii: ${n[2]} Minor ${getTriad(2)}\n` +
    `IV:  ${n[3]} Major ${getTriad(3)}\n` +
    `V:   ${n[4]} Major ${getTriad(4)}\n` +
    `vi:  ${n[5]} Minor ${getTriad(5)}\n` +
    `vii°: ${n[6]} Diminished ${getTriad(6)}`;
  document.getElementById("sb-chords").innerText = chordsText;

  let modes = [
    "Ionian (Maj)",
    "Dorian (min)",
    "Phrygian (min)",
    "Lydian (Maj)",
    "Mixolydian (Maj)",
    "Aeolian (min)",
    "Locrian (dim)",
  ];
  let modesText = modes.map((m, i) => `${i + 1}. ${n[i]} ${m}`).join("\n");
  document.getElementById("sb-modes").innerText = modesText;

  document.getElementById("sb-prog-pop").innerText =
    `${n[0]} Maj  |  ${n[4]} Maj  |  ${n[5]} min  |  ${n[3]} Maj`;
  document.getElementById("sb-prog-jazz").innerText =
    `${n[1]} min  |  ${n[4]} Maj  |  ${n[0]} Maj`;
  document.getElementById("sb-prog-blues").innerText =
    `${n[0]} Maj  |  ${n[3]} Maj  |  ${n[4]} Maj`;
  document.getElementById("sb-targets-text").innerText =
    `To create a strong ${selectedKey} Major resolution, emphasize the Root (${n[0]}), the Major 3rd (${n[2]}), and the leading 7th tone (${n[6]}).`;
}

// --- RENDERING ENGINE ---
let fretXPositions = {};

function draw() {
  if (startFret < 0) startFret = 0;
  if (startFret > 23) startFret = 23;
  if (numFrets < 1) numFrets = 1;
  if (startFret + numFrets > 24) {
    numFrets = 24 - startFret;
    document.getElementById("inp-frets").value = numFrets;
  }

  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;

  if (w === 0 || h === 0) return;

  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, w, h);
  updateCribNotes();
  detectScale();

  const padL = 80;
  const padR = 40;
  const drawW = w - padL - padR;

  const avgFretWidth = drawW / numFrets;

  let showTitle = document.getElementById("chk-title").checked;
  let topClearance = showTitle ? 90 : 40;
  let bottomClearance = 80;

  const absoluteMaxSpacing = 150;
  const maxSafeHeight = (h - (topClearance + bottomClearance)) / 5;

  const sSpace = Math.max(
    30,
    Math.min(avgFretWidth * 0.85, maxSafeHeight, absoluteMaxSpacing),
  );
  const padT = Math.max(topClearance, (h - sSpace * 5) / 2);

  let rawPositions = [];
  for (let i = startFret; i <= startFret + numFrets; i++)
    rawPositions.push(getFretDistance(i));
  let rawRange = rawPositions[rawPositions.length - 1] - rawPositions[0];
  if (rawRange === 0) rawRange = 1;

  fretXPositions = {};
  for (let i = 0; i < rawPositions.length; i++) {
    fretXPositions[i + startFret] =
      padL + ((rawPositions[i] - rawPositions[0]) / rawRange) * drawW;
  }

  const singleDots = [3, 5, 7, 9, 15, 17, 19, 21];
  const doubleDots = [12, 24];
  let minFw =
    fretXPositions[startFret + numFrets] -
    fretXPositions[startFret + numFrets - 1];
  let dotR = Math.min(minFw * 0.15, sSpace * 0.2);

  ctx.fillStyle = "#cccccc";
  for (let f = startFret + 1; f <= startFret + numFrets; f++) {
    let cx = (fretXPositions[f - 1] + fretXPositions[f]) / 2;
    if (singleDots.includes(f)) {
      let midY = padT + 2.5 * sSpace;
      ctx.beginPath();
      ctx.arc(cx, midY, dotR, 0, Math.PI * 2);
      ctx.fill();
    } else if (doubleDots.includes(f)) {
      let topY = padT + 1.5 * sSpace;
      let botY = padT + 3.5 * sSpace;
      ctx.beginPath();
      ctx.arc(cx, topY, dotR, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, botY, dotR, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  let toggleFontSize = Math.max(16, sSpace * 0.5);

  for (let i = 0; i < 6; i++) {
    let y = padT + i * sSpace;

    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(w - padR, y);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "#000";
    ctx.stroke();

    let state = stringStates[i];
    ctx.font = `bold ${toggleFontSize}px Arial`;

    if (state === "O") {
      ctx.fillStyle = "#1E90FF";
      ctx.fillText("O", padL - 40, y);
    } else if (state === "X") {
      ctx.fillStyle = "#FF4500";
      ctx.fillText("X", padL - 40, y);
    } else {
      ctx.fillStyle = "#bbbbbb";
      ctx.fillText("—", padL - 40, y);
    }
  }

  let bottomY = padT + 5 * sSpace;
  let labelY = bottomY + Math.max(25, sSpace * 0.6);
  let labelFontSize = Math.max(14, sSpace * 0.4);

  for (let f in fretXPositions) {
    f = parseInt(f);
    let x = fretXPositions[f];

    ctx.beginPath();
    ctx.moveTo(x, padT);
    ctx.lineTo(x, bottomY);
    ctx.lineWidth = f === 0 ? 5 : 2;
    ctx.stroke();

    let isMarked = singleDots.includes(f) || doubleDots.includes(f);
    if (f === 0) {
      ctx.fillStyle = "#000";
      ctx.font = `bold ${labelFontSize}px Arial`;
      ctx.fillText("Nut", x, labelY);
    } else if (isMarked) {
      ctx.fillStyle = "#000";
      ctx.font = `bold ${labelFontSize}px Arial`;
      ctx.fillText(f.toString(), x, labelY);
    }
  }

  let activePitches = getActivePitches();
  let allActiveSemitones = activePitches.map(
    (p) => (p - keyRoots[selectedKey] + 12) % 12,
  );
  let radius = Math.min(minFw * 0.38, sSpace * 0.45);

  for (let m of markers) {
    if (stringStates[m.s] === "X" || stringStates[m.s] === "O") continue;
    if (m.f <= startFret || m.f > startFret + numFrets) continue;

    let cx = (fretXPositions[m.f - 1] + fretXPositions[m.f]) / 2;
    let cy = padT + m.s * sSpace;

    let pitch = (tuningPitches[m.s] + m.f) % 12;
    let dist = (pitch - keyRoots[selectedKey] + 12) % 12;
    let label = getGrammarLabel(dist, allActiveSemitones);

    let isRoot = label === "R";
    ctx.fillStyle = isRoot ? "lightgray" : "black";
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = isRoot ? "black" : "white";
    let fontSize = Math.max(8, radius * 0.55);
    ctx.font = `bold ${fontSize}px Arial`;

    let noteName = keySpellings[selectedKey][pitch];
    ctx.fillText(noteName, cx, cy - radius * 0.2);
    ctx.font = `bold ${fontSize * 0.8}px Arial`;
    ctx.fillText(label, cx, cy + radius * 0.4);
  }

  if (showTitle) {
    let rawText = readout.innerText;
    if (rawText !== "Detected: No Notes Placed") {
      let cleanTitle = rawText.replace("Detected: ", "");
      ctx.fillStyle = "black";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      let titleFontSize = Math.max(28, w / 30);
      ctx.font = `bold ${titleFontSize}px Arial`;
      ctx.fillText(cleanTitle, w / 2, 25);
    }
  }
}

// --- INTERACTION ---
function getClicked(e) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  const drawW = w - 120;
  const avgFretWidth = drawW / numFrets;

  let showTitle = document.getElementById("chk-title").checked;
  let topClearance = showTitle ? 90 : 40;
  let bottomClearance = 80;

  const absoluteMaxSpacing = 150;
  const maxSafeHeight = (h - (topClearance + bottomClearance)) / 5;
  const sSpace = Math.max(
    30,
    Math.min(avgFretWidth * 0.85, maxSafeHeight, absoluteMaxSpacing),
  );
  const padT = Math.max(topClearance, (h - sSpace * 5) / 2);

  if (x < 75) {
    for (let i = 0; i < 6; i++) {
      if (Math.abs(y - (padT + i * sSpace)) < 20) {
        let curr = stringStates[i];
        stringStates[i] = curr === "" ? "O" : curr === "O" ? "X" : "";
        return { type: "toggle" };
      }
    }
    return null;
  }

  let sIdx = -1;
  for (let i = 0; i < 6; i++) {
    if (Math.abs(y - (padT + i * sSpace)) < sSpace * 0.5) sIdx = i;
  }
  if (sIdx === -1) return null;

  for (let f = startFret + 1; f <= startFret + numFrets; f++) {
    if (x < fretXPositions[f]) {
      return { type: "fret", s: sIdx, f: f };
    }
  }
  return null;
}

canvas.addEventListener("mousedown", (e) => {
  let hit = getClicked(e);
  if (!hit) return;

  if (hit.type === "toggle") {
    draw();
  } else if (hit.type === "fret") {
    if (stringStates[hit.s] === "X" || stringStates[hit.s] === "O") return;

    let existingIdx = markers.findIndex((m) => m.s === hit.s && m.f === hit.f);
    if (existingIdx >= 0) {
      markers.splice(existingIdx, 1);
    } else {
      markers.push({ s: hit.s, f: hit.f });
    }
    draw();
  }
});

// --- UI EVENT LISTENERS ---
document.getElementById("chk-title").addEventListener("change", draw);
document.getElementById("sel-key").addEventListener("change", (e) => {
  selectedKey = e.target.value;
  draw();
});

document.getElementById("inp-start").addEventListener("change", (e) => {
  startFret = parseInt(e.target.value) || 0;
  if (startFret > 23) {
    startFret = 23;
    e.target.value = 23;
  }
  if (startFret + numFrets > 24) {
    numFrets = 24 - startFret;
    document.getElementById("inp-frets").value = numFrets;
  }
  draw();
});

document.getElementById("inp-frets").addEventListener("change", (e) => {
  numFrets = parseInt(e.target.value) || 12;
  if (numFrets < 1) {
    numFrets = 1;
    e.target.value = 1;
  }
  if (startFret + numFrets > 24) {
    numFrets = 24 - startFret;
    e.target.value = numFrets;
  }
  draw();
});

document.getElementById("btn-clear").addEventListener("click", () => {
  markers = [];
  stringStates = ["", "", "", "", "", ""];
  draw();
});

// THE FIX: ResizeObserver ONLY watches the canvas to ensure fluid drawing.
// It no longer interferes with the sidebar at all!
const resizeObserver = new ResizeObserver(() => {
  draw();
});
resizeObserver.observe(document.getElementById("canvas-container"));

// --- EXPORT MAGIC ---
document.getElementById("btn-export").addEventListener("click", () => {
  let rawText = readout.innerText;
  let cleanTitle = rawText.replace("Detected: ", "");
  if (rawText === "Detected: No Notes Placed") cleanTitle = "Blank_Fretboard";

  let link = document.createElement("a");
  link.download = `Fretboard_${cleanTitle.replace(/[^a-zA-Z0-9#]/g, "_")}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
});

// Init
draw();
