const videoId = 'b-2a6aOOSso';
const REST_SECONDS = 12;

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
const nextBtn = document.getElementById('nextBtn');
const finishSection = document.getElementById('finishSection');
const exerciseList = document.getElementById('exerciseList');
const exerciseHint = document.getElementById('exerciseHint');

let index = 0;
let secondsLeft = 0;
let timerId;
let isRestPhase = false;

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
  player.src = `https://www.youtube.com/embed/${videoId}?start=${start}&end=${end}&autoplay=1&rel=0`;
}

function paintProgress() {
  [...exerciseList.children].forEach((li, i) => {
    li.classList.toggle('done', i < index);
    li.classList.toggle('current', i === index && !isRestPhase);
  });
}

function startRestPhase() {
  isRestPhase = true;
  player.src = '';
  exerciseName.textContent = 'Rest / Recovery';
  exerciseHint.textContent = `Great! Take ${REST_SECONDS} sec rest, then press Next for the next exercise.`;
  stepMeta.textContent = `Rest after step ${index + 1}`;
  secondsLeft = REST_SECONDS;
  timer.textContent = formatTime(secondsLeft);
  nextBtn.disabled = true;

  timerId = setInterval(() => {
    secondsLeft -= 1;
    timer.textContent = formatTime(Math.max(0, secondsLeft));
    if (secondsLeft <= 0) {
      clearInterval(timerId);
      nextBtn.disabled = false;
    }
  }, 1000);
}

function startStep(i) {
  clearInterval(timerId);
  isRestPhase = false;
  const current = timeline[i];
  const duration = stepDuration(i);
  const end = current.start + duration;

  stepMeta.textContent = `Step ${i + 1} of ${timeline.length}`;
  exerciseName.textContent = current.name;
  exerciseHint.textContent = 'Watch the movement and hold the stretch with calm breathing.';
  secondsLeft = duration;
  timer.textContent = formatTime(secondsLeft);
  nextBtn.disabled = true;
  paintProgress();
  setIframe(current.start, end);

  timerId = setInterval(() => {
    secondsLeft -= 1;
    timer.textContent = formatTime(Math.max(0, secondsLeft));
    if (secondsLeft <= 0) {
      clearInterval(timerId);
      if (i === timeline.length - 1) {
        nextBtn.disabled = false;
        return;
      }
      startRestPhase();
    }
  }, 1000);
}

nextBtn.addEventListener('click', () => {
  if (isRestPhase) {
    index += 1;
    startStep(index);
    return;
  }

  if (index >= timeline.length - 1) {
    player.src = '';
    nextBtn.classList.add('hidden');
    finishSection.classList.remove('hidden');
    stepMeta.textContent = 'Completed';
    exerciseName.textContent = 'Routine Complete';
    exerciseHint.textContent = 'Excellent work! Click below to continue.';
    timer.textContent = '00:00';
    paintProgress();
    return;
  }

  startRestPhase();
});

startStep(index);
