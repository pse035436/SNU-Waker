const alarmTime = document.querySelector('#alarmTime');
const clock = document.querySelector('#clock');
const dateText = document.querySelector('#dateText');
const setButton = document.querySelector('#setButton');
const cancelButton = document.querySelector('#cancelButton');
const soundButton = document.querySelector('#soundButton');
const soundStatus = document.querySelector('#soundStatus');
const stateBadge = document.querySelector('#stateBadge');
const message = document.querySelector('#message');
const overlay = document.querySelector('#ringingOverlay');
const stopButton = document.querySelector('#stopButton');
const ringingTime = document.querySelector('#ringingTime');

let scheduledTime = null;
let hasRung = false;
let audioReady = false;
let audioContext;
let ringTimer;

function now() { return new Date(); }
function formatTime(date) { return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }); }
function updateClock() {
  const current = now();
  clock.textContent = formatTime(current);
  dateText.textContent = current.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' });
  if (scheduledTime && !hasRung && current >= scheduledTime) ringAlarm();
}
function prepareSound() {
  audioContext ??= new (window.AudioContext || window.webkitAudioContext)();
  audioContext.resume();
  audioReady = true;
  soundStatus.textContent = '기본 알람음이 준비되었습니다.';
  soundButton.textContent = '준비 완료';
  soundButton.disabled = true;
  playChime();
}
function playChime() {
  if (!audioReady || !audioContext) return;
  const start = audioContext.currentTime;
  [0, .22, .44].forEach((offset, index) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = [523.25, 659.25, 783.99][index];
    gain.gain.setValueAtTime(0, start + offset);
    gain.gain.linearRampToValueAtTime(.18, start + offset + .015);
    gain.gain.exponentialRampToValueAtTime(.001, start + offset + .35);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start(start + offset);
    oscillator.stop(start + offset + .36);
  });
}
function ringAlarm() {
  hasRung = true;
  overlay.hidden = false;
  ringingTime.textContent = formatTime(now());
  stateBadge.textContent = '알람 울림';
  stateBadge.className = 'badge active';
  if (navigator.vibrate) navigator.vibrate([400, 180, 400, 180, 700]);
  playChime();
  ringTimer = window.setInterval(playChime, 1500);
}
function setAlarm() {
  if (!alarmTime.value) { message.textContent = '알람 시간을 먼저 선택해 주세요.'; alarmTime.focus(); return; }
  if (!audioReady) { message.textContent = '먼저 “소리 사용”을 눌러 주세요.'; soundButton.focus(); return; }
  const [hours, minutes] = alarmTime.value.split(':').map(Number);
  const target = now(); target.setHours(hours, minutes, 0, 0);
  if (target <= now()) target.setDate(target.getDate() + 1);
  scheduledTime = target; hasRung = false;
  stateBadge.textContent = '설정됨'; stateBadge.className = 'badge active';
  cancelButton.hidden = false;
  message.textContent = `${target.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })} ${target.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}에 울립니다.`;
}
function cancelAlarm() {
  scheduledTime = null; hasRung = false; cancelButton.hidden = true;
  stateBadge.textContent = '대기 중'; stateBadge.className = 'badge'; message.textContent = '알람을 취소했습니다.';
}
function stopAlarm() {
  window.clearInterval(ringTimer); if (navigator.vibrate) navigator.vibrate(0);
  overlay.hidden = true; cancelAlarm();
}

soundButton.addEventListener('click', prepareSound);
setButton.addEventListener('click', setAlarm);
cancelButton.addEventListener('click', cancelAlarm);
stopButton.addEventListener('click', stopAlarm);
updateClock(); window.setInterval(updateClock, 500);
