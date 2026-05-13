const videoId = 'b-2a6aOOSso';
const DEFAULT_REST_SECONDS = 10;

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

const player = document.getElementById('ytPlayer');
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

let index = 0;
let secondsLeft = 0;
let timerId;
let isRestPhase = false;
let restSeconds = DEFAULT_REST_SECONDS;

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

function setIframe(start, end) {
  player.src = `https://www.youtube.com/embed/${videoId}?start=${start}&end=${end}&autoplay=1&mute=1&playsinline=1&rel=0`;
}

function paintProgress() {
  [...exerciseList.children].forEach((li, i) => {
    li.classList.toggle('done', i < index);
    li.classList.toggle('current', i === index && !isRestPhase);
  });
}

function clearPhaseTimer() {
  clearInterval(timerId);
}

function maybeGoToNextStep() {
  if (index >= timeline.length - 1) {
    completeRoutine();
    return;
  }
  index += 1;
  startStep(index);
}

function startRestPhase() {
  isRestPhase = true;
  player.src = '';
  exerciseName.textContent = 'Rest / Recovery';
  exerciseHint.textContent = `Auto-next in ${restSeconds}s. You can skip rest or add +10s.`;
  stepMeta.textContent = `Rest after step ${index + 1}`;
  secondsLeft = restSeconds;
  timer.textContent = formatTime(secondsLeft);
  skipRestBtn.disabled = false;
  addRestBtn.disabled = false;

  clearPhaseTimer();
  timerId = setInterval(() => {
    secondsLeft -= 1;
    timer.textContent = formatTime(Math.max(0, secondsLeft));
    if (secondsLeft <= 0) {
      clearPhaseTimer();
      maybeGoToNextStep();
    }
  }, 1000);
}

function startStep(i) {
  clearPhaseTimer();
  isRestPhase = false;
  skipRestBtn.disabled = true;
  addRestBtn.disabled = true;

  const current = timeline[i];
  const duration = stepDuration(i);
  const end = current.start + duration;

  stepMeta.textContent = `Step ${i + 1} of ${timeline.length}`;
  exerciseName.textContent = current.name;
  exerciseHint.textContent = 'Auto mode: current exercise will move to next automatically.';
  secondsLeft = duration;
  timer.textContent = formatTime(secondsLeft);
  paintProgress();
  setIframe(current.start, end);

  timerId = setInterval(() => {
    secondsLeft -= 1;
    timer.textContent = formatTime(Math.max(0, secondsLeft));

    if (secondsLeft <= 0) {
      clearPhaseTimer();
      if (i === timeline.length - 1) {
        completeRoutine();
      } else if (i === 0) {
        // No rest after Intro.
        index += 1;
        startStep(index);
      } else {
        startRestPhase();
      }
    }
  }, 1000);
}

function completeRoutine() {
  clearPhaseTimer();
  player.src = '';
  activeControls.classList.add('hidden');
  finishSection.classList.remove('hidden');
  stepMeta.textContent = 'Completed';
  exerciseName.textContent = 'Routine Complete';
  exerciseHint.textContent = 'Excellent work! Tap button below to return to your main website.';
  timer.textContent = '00:00';
  paintProgress();
}

skipExerciseBtn.addEventListener('click', () => {
  if (isRestPhase) return;
  maybeGoToNextStep();
});

skipRestBtn.addEventListener('click', () => {
  if (!isRestPhase) return;
  clearPhaseTimer();
  maybeGoToNextStep();
});

addRestBtn.addEventListener('click', () => {
  if (!isRestPhase) return;
  secondsLeft += 10;
  restSeconds += 10;
  timer.textContent = formatTime(secondsLeft);
  exerciseHint.textContent = `Auto-next in ${secondsLeft}s. You can still skip rest.`;
});

startStep(index);
