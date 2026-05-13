const videoId = 'b-2a6aOOSso';
const DEFAULT_REST_SECONDS = 10;
const STORAGE_KEY = 'stretching-app-state-v2';

const timeline = [
  { name: 'Intro', start: 0 },
  { name: 'Double Knees to Chest', start: 15 },
  { name: 'Supine Hamstring Stretch (Left)', start: 55 },
  { name: 'Supine Hamstring Stretch (Right)', start: 93 },
  { name: 'Glute Stretch (Left)', start: 132 },
  { name: 'Glute Stretch (Right)', start: 170 },
  { name: 'Seated Butterfly', start: 208 },
  { name: 'Left Quad Stretch', start: 247 },
  { name: 'Right Quad Stretch', start: 285 },
  { name: 'Calf Stretch (Left)', start: 324 },
  { name: 'Calf Stretch (Right)', start: 362 },
  { name: 'Kneeling Lunge Stretch (Left)', start: 401 },
  { name: 'Kneeling Lunge Stretch (Right)', start: 439 }
];

const exerciseName = document.getElementById('exerciseName');
const timer = document.getElementById('timer');
const stepMeta = document.getElementById('stepMeta');
const finishSection = document.getElementById('finishSection');
const exerciseList = document.getElementById('exerciseList');
const exerciseHint = document.getElementById('exerciseHint');
const skipExerciseBtn = document.getElementById('skipExerciseBtn');
const skipRestBtn = document.getElementById('skipRestBtn');
const addRestBtn = document.getElementById('addRestBtn');
const activeControls = document.getElementById('activeControls');
const restVisual = document.getElementById('restVisual');
const restSecondsText = document.getElementById('restSecondsText');

let player;
let syncInterval = null;
let index = 0;
let isRestPhase = false;
let secondsLeft = 0;

exerciseList.innerHTML = timeline.map((step) => `<li>${step.name}</li>`).join('');

function stepDuration(i) {
  if (i === timeline.length - 1) return 38;
  return Math.max(1, timeline[i + 1].start - timeline[i].start);
}

function formatTime(total) {
  const m = String(Math.floor(total / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function paintProgress() {
  [...exerciseList.children].forEach((li, i) => {
    li.classList.toggle('done', i < index);
    li.classList.toggle('current', i === index && !isRestPhase);
  });
}

function persistState() {
  const state = { index, isRestPhase, secondsLeft, savedAt: Date.now() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function restoreState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const s = JSON.parse(raw);
    if (typeof s.index === 'number') index = Math.min(Math.max(s.index, 0), timeline.length - 1);
    if (typeof s.isRestPhase === 'boolean') isRestPhase = s.isRestPhase;
    if (typeof s.secondsLeft === 'number') secondsLeft = Math.max(0, Math.floor(s.secondsLeft));
    if (s.savedAt && secondsLeft > 0) {
      const elapsed = Math.floor((Date.now() - s.savedAt) / 1000);
      secondsLeft = Math.max(0, secondsLeft - elapsed);
    }
  } catch (_) {}
}

function tryUnmute() {
  if (!player?.unMute) return;
  try {
    player.unMute();
    player.setVolume(100);
  } catch (_) {}
}

function clearSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}

function maybeGoToNextStep() {
  if (index >= timeline.length - 1) return completeRoutine();
  index += 1;
  startStep(index);
}

function startRestPhase(initialLeft = DEFAULT_REST_SECONDS) {
  isRestPhase = true;
  clearSync();
  restVisual.classList.remove('hidden');
  skipRestBtn.disabled = false;
  addRestBtn.disabled = false;
  secondsLeft = initialLeft;
  exerciseName.textContent = 'Rest / Recovery';
  stepMeta.textContent = `Rest after step ${index + 1}`;
  exerciseHint.textContent = `Auto-next in ${secondsLeft}s. You can skip rest or add +10s.`;
  timer.textContent = formatTime(secondsLeft);
  restSecondsText.textContent = String(secondsLeft);

  syncInterval = setInterval(() => {
    secondsLeft -= 1;
    const safe = Math.max(0, secondsLeft);
    timer.textContent = formatTime(safe);
    restSecondsText.textContent = String(safe);
    persistState();
    if (safe <= 0) {
      clearSync();
      maybeGoToNextStep();
    }
  }, 1000);
}

function startStep(i, resumeSeconds = null) {
  isRestPhase = false;
  clearSync();
  restVisual.classList.add('hidden');
  skipRestBtn.disabled = true;
  addRestBtn.disabled = true;

  const current = timeline[i];
  const duration = stepDuration(i);
  const end = current.start + duration;

  stepMeta.textContent = `Step ${i + 1} of ${timeline.length}`;
  exerciseName.textContent = current.name;
  exerciseHint.textContent = 'Auto mode ON. Voice and next step run automatically.';
  paintProgress();

  player.loadVideoById({ videoId, startSeconds: current.start, endSeconds: end, suggestedQuality: 'large' });
  tryUnmute();

  syncInterval = setInterval(() => {
    const now = player.getCurrentTime ? player.getCurrentTime() : current.start;
    const left = Math.max(0, Math.ceil(end - now));
    secondsLeft = left;
    timer.textContent = formatTime(left);
    persistState();

    if (now >= end - 0.2 || left <= 0) {
      clearSync();
      if (i === timeline.length - 1) {
        completeRoutine();
      } else if (i === 0) {
        index += 1;
        startStep(index);
      } else {
        startRestPhase();
      }
    }
  }, 500);

  if (resumeSeconds !== null) {
    const seekTo = Math.max(current.start, end - resumeSeconds);
    player.seekTo(seekTo, true);
  }
}

function completeRoutine() {
  clearSync();
  localStorage.removeItem(STORAGE_KEY);
  restVisual.classList.add('hidden');
  activeControls.classList.add('hidden');
  finishSection.classList.remove('hidden');
  stepMeta.textContent = 'Completed';
  exerciseName.textContent = 'Routine Complete';
  exerciseHint.textContent = 'Excellent work! Tap button below to return to your main website.';
  timer.textContent = '00:00';
  paintProgress();
}

skipExerciseBtn.addEventListener('click', () => {
  if (!isRestPhase) maybeGoToNextStep();
});

skipRestBtn.addEventListener('click', () => {
  if (!isRestPhase) return;
  clearSync();
  maybeGoToNextStep();
});

addRestBtn.addEventListener('click', () => {
  if (!isRestPhase) return;
  secondsLeft += 10;
  timer.textContent = formatTime(secondsLeft);
  restSecondsText.textContent = String(secondsLeft);
  exerciseHint.textContent = `Auto-next in ${secondsLeft}s. You can still skip rest.`;
  persistState();
});

window.addEventListener('beforeunload', persistState);
['click', 'touchstart', 'keydown'].forEach((ev) => {
  window.addEventListener(ev, tryUnmute, { passive: true });
});

window.onYouTubeIframeAPIReady = () => {
  restoreState();
  player = new YT.Player('ytPlayer', {
    videoId,
    playerVars: { autoplay: 1, playsinline: 1, rel: 0, controls: 1, modestbranding: 1 },
    events: {
      onReady: () => {
        tryUnmute();
        if (isRestPhase) {
          startRestPhase(secondsLeft || DEFAULT_REST_SECONDS);
        } else {
          startStep(index, secondsLeft > 0 ? secondsLeft : null);
        }
      }
    }
  });
};
