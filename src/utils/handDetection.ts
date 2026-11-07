export interface LandmarkPoint {
  x: number;
  y: number;
  z: number;
}

export interface FingerState {
  thumb: boolean;
  index: boolean;
  middle: boolean;
  ring: boolean;
  pinky: boolean;
  count: number;
}

function distance(p1: LandmarkPoint, p2: LandmarkPoint): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = (p1.z || 0) - (p2.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Determine which fingers are extended using anatomical landmark geometry
 */
export function analyzeFingers(landmarks: LandmarkPoint[]): FingerState {
  if (!landmarks || landmarks.length < 21) {
    return { thumb: false, index: false, middle: false, ring: false, pinky: false, count: 0 };
  }

  const wrist = landmarks[0];

  // Helper for non-thumb fingers (Index: 5,6,7,8; Middle: 9,10,11,12; Ring: 13,14,15,16; Pinky: 17,18,19,20)
  const isExtended = (mcpIdx: number, pipIdx: number, dipIdx: number, tipIdx: number): boolean => {
    const mcp = landmarks[mcpIdx];
    const pip = landmarks[pipIdx];
    const tip = landmarks[tipIdx];

    const distTipWrist = distance(tip, wrist);
    const distPipWrist = distance(pip, wrist);
    const distTipMcp = distance(tip, mcp);
    const distPipMcp = distance(pip, mcp);

    // Tip should be further from wrist than PIP, and tip further from MCP than PIP is
    return distTipWrist > distPipWrist * 1.15 && distTipMcp > distPipMcp * 1.05;
  };

  const index = isExtended(5, 6, 7, 8);
  const middle = isExtended(9, 10, 11, 12);
  const ring = isExtended(13, 14, 15, 16);
  const pinky = isExtended(17, 18, 19, 20);

  // Thumb calculation: compare distance of thumb tip to pinky base (MCP 17) vs IP to pinky base
  const thumbTip = landmarks[4];
  const thumbIp = landmarks[3];
  const thumbMcp = landmarks[2];
  const pinkyMcp = landmarks[17];
  const indexMcp = landmarks[5];

  const thumbToPinkyTip = distance(thumbTip, pinkyMcp);
  const thumbToPinkyIp = distance(thumbIp, pinkyMcp);
  const thumbToIndexTip = distance(thumbTip, indexMcp);
  const thumbToIndexMcp = distance(thumbMcp, indexMcp);

  // Extended if thumb is stretched outward from palm
  const thumb = thumbToPinkyTip > thumbToPinkyIp * 1.12 && thumbToIndexTip > thumbToIndexMcp * 0.85;

  let count = 0;
  if (thumb) count++;
  if (index) count++;
  if (middle) count++;
  if (ring) count++;
  if (pinky) count++;

  return {
    thumb,
    index,
    middle,
    ring,
    pinky,
    count
  };
}

// MediaPipe standard 21-landmark hand connections
const HAND_CONNECTIONS: [number, number][] = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle
  [0, 9], [9, 10], [10, 11], [11, 12],
  // Ring
  [0, 13], [13, 14], [14, 15], [15, 16],
  // Pinky
  [0, 17], [17, 18], [18, 19], [19, 20],
  // Palm transverse
  [5, 9], [9, 13], [13, 17]
];

/**
 * Draw hand landmarks and bones on canvas with vibrant glowing science aesthetic
 */
export function drawHand(
  ctx: CanvasRenderingContext2D,
  landmarks: LandmarkPoint[],
  activeFingerCount: number,
  isHolding: boolean
) {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;

  // Clear previous frame
  ctx.clearRect(0, 0, width, height);

  if (!landmarks || landmarks.length === 0) return;

  // Mirror X coordinates since webcam is mirrored horizontally
  const toCanvas = (p: LandmarkPoint) => ({
    x: (1 - p.x) * width,
    y: p.y * height
  });

  // Determine line theme colors
  const strokeColor = isHolding
    ? 'rgba(56, 189, 248, 0.95)' // bright sky blue when active
    : 'rgba(148, 163, 184, 0.65)'; // sleek slate blue
  const glowColor = isHolding ? 'rgba(14, 165, 233, 0.6)' : 'rgba(51, 65, 85, 0.4)';

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Draw skeleton connections
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = strokeColor;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 8;

  for (const [startIdx, endIdx] of HAND_CONNECTIONS) {
    const p1 = toCanvas(landmarks[startIdx]);
    const p2 = toCanvas(landmarks[endIdx]);

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }

  // Draw joints/landmarks
  landmarks.forEach((p, idx) => {
    const { x, y } = toCanvas(p);
    const isTip = [4, 8, 12, 16, 20].includes(idx);

    ctx.beginPath();
    if (isTip) {
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = isHolding ? '#38bdf8' : '#38bdf8';
      ctx.shadowColor = '#0ea5e9';
      ctx.shadowBlur = 10;
    } else {
      ctx.arc(x, y, 3.5, 0, 2 * Math.PI);
      ctx.fillStyle = '#f8fafc';
      ctx.shadowBlur = 4;
    }
    ctx.fill();
  });

  // Draw gesture badge near the wrist or index tip
  if (activeFingerCount >= 1 && activeFingerCount <= 4) {
    const wristPos = toCanvas(landmarks[0]);
    const badgeY = Math.max(30, wristPos.y - 40);

    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = 'rgba(14, 165, 233, 0.5)';
    ctx.shadowBlur = 12;

    const text = `${activeFingerCount}번 선택 중`;
    ctx.font = 'bold 13px sans-serif';
    const textWidth = ctx.measureText(text).width;
    const padding = 12;
    const badgeW = textWidth + padding * 2;
    const badgeH = 28;
    const badgeX = Math.min(Math.max(10, wristPos.x - badgeW / 2), width - badgeW - 10);

    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY - badgeH / 2, badgeW, badgeH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, badgeX + badgeW / 2, badgeY);
    ctx.restore();
  }

  ctx.restore();
}
