// --- THE MUSIC THEORY REFERENCE LIBRARY ---

const tuningPitches = [4, 11, 7, 2, 9, 4];

const keySpellings = {
  C: ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"],
  G: ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"],
  D: ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"],
  A: ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"],
  E: ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"],
  B: ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"],
  "F#": ["C", "C#", "D", "D#", "E", "E#", "F#", "G", "G#", "A", "A#", "B"],
  "C#": ["B#", "C#", "D", "D#", "E", "E#", "F#", "G", "G#", "A", "A#", "B"],
  F: ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"],
  Bb: ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"],
  Eb: ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"],
  Ab: ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"],
  Db: ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"],
  Gb: ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "Cb"],
};

const keyRoots = {
  C: 0,
  G: 7,
  D: 2,
  A: 9,
  E: 4,
  B: 11,
  "F#": 6,
  "C#": 1,
  F: 5,
  Bb: 10,
  Eb: 3,
  Ab: 8,
  Db: 1,
  Gb: 6,
};
const intervals = {
  0: "R",
  1: "b2nd",
  2: "2nd",
  3: "b3rd",
  4: "3rd",
  5: "4th",
  6: "b5th",
  7: "5th",
  8: "b6th",
  9: "6th",
  10: "b7th",
  11: "7th",
};

const scaleDict = {
  "R,5th": "Power Chord (5)",
  "R,3rd,5th": "Major Triad",
  "R,b3rd,5th": "Minor Triad",
  "R,b3rd,b5th": "Diminished Triad",
  "R,3rd,#5th": "Augmented Triad",
  "R,2nd,5th": "Sus2 Chord",
  "R,4th,5th": "Sus4 Chord",
  "R,2nd,3rd,5th": "Major Add 9",
  "R,2nd,b3rd,5th": "Minor Add 9",
  "R,3rd,5th,6th": "Major 6th Chord",
  "R,b3rd,5th,6th": "Minor 6th Chord",
  "R,3rd,5th,7th": "Major 7th Chord",
  "R,b3rd,5th,b7th": "Minor 7th Chord",
  "R,3rd,5th,b7th": "Dominant 7th Chord",
  "R,b3rd,b5th,b7th": "Half-Diminished Chord (m7b5)",
  "R,b3rd,b5th,6th": "Diminished 7th Chord",
  "R,2nd,3rd,5th,7th": "Major 9th Chord",
  "R,2nd,b3rd,5th,b7th": "Minor 9th Chord",
  "R,2nd,3rd,5th,b7th": "Dominant 9th Chord",
  "R,#9th,3rd,5th,b7th": "Hendrix Chord (7#9)",
  "R,2nd,3rd,5th,6th": "Major Pentatonic Scale",
  "R,b3rd,4th,5th,b7th": "Minor Pentatonic Scale",
  "R,b3rd,4th,b5th,5th,b7th": "Blues Scale",
  "R,2nd,3rd,4th,5th,6th,7th": "Major Scale (Ionian)",
  "R,2nd,b3rd,4th,5th,6th,b7th": "Dorian Mode",
  "R,b2nd,b3rd,4th,5th,b6th,b7th": "Phrygian Mode",
  "R,2nd,3rd,#4th,5th,6th,7th": "Lydian Mode",
  "R,2nd,3rd,4th,5th,6th,b7th": "Mixolydian Mode",
  "R,2nd,b3rd,4th,5th,b6th,b7th": "Minor Scale (Aeolian)",
  "R,b2nd,b3rd,4th,b5th,b6th,b7th": "Locrian Mode",
  "R,2nd,b3rd,4th,5th,b6th,7th": "Harmonic Minor",
};

// Pure math functions
function getFretDistance(n, scaleLength = 1000) {
  return scaleLength * (1 - Math.pow(2, -(n / 12.0)));
}

function getGrammarLabel(semitone, allActiveSemitones) {
  let label = intervals[semitone];
  if (
    semitone === 6 &&
    allActiveSemitones.includes(7) &&
    !allActiveSemitones.includes(5)
  )
    return "#4th";
  if (semitone === 3 && allActiveSemitones.includes(4)) return "#9th";
  if (
    semitone === 8 &&
    allActiveSemitones.includes(4) &&
    !allActiveSemitones.includes(7)
  )
    return "#5th";
  return label;
}
