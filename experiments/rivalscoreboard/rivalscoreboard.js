"use strict";

//match time variables
let matchTimeMinute = 2;
let matchTimeSecond = 30;
let matchTimeMillisecond = 1000;

let minute = matchTimeMinute;
let second = matchTimeSecond;
let millisecond = matchTimeMillisecond;

let cron;

let redScore = 0;
let blueScore = 0;

document.scoreboardContainer.start.onclick = () => start();
document.scoreboardContainer.pause.onclick = () => pause();
document.scoreboardContainer.reset.onclick = () => reset();

document.scoreboardContainer.pause.style.display = 'none';
document.scoreboardContainer.reset.style.display = 'none';

function start() {
  pause();
  cron = setInterval(() => { timer(); }, 10);
  document.scoreboardContainer.start.style.display = 'none';
  document.scoreboardContainer.pause.style.display = 'inline-block';
  document.scoreboardContainer.reset.style.display = 'inline-block';
}

function pause() {
  clearInterval(cron);
  document.scoreboardContainer.pause.style.display = 'none';
  document.scoreboardContainer.start.style.display = 'inline-block';
  document.scoreboardContainer.reset.style.display = 'inline-block';
}

function reset() {
  minute = matchTimeMinute;
  second = matchTimeSecond;
  millisecond = matchTimeMillisecond;
  clearInterval(cron);
  document.querySelectorAll('.minute').forEach(el => el.innerText = matchTimeMinute);
  document.querySelectorAll('.second').forEach(el => el.innerText = matchTimeSecond);
  document.scoreboardContainer.reset.style.display = 'none';
  document.scoreboardContainer.pause.style.display = 'none';
  document.scoreboardContainer.start.style.display = 'inline-block';

  redScore = 0;
  blueScore = 0;

  document.getElementById('redScore').innerText = redScore;
  document.getElementById('blueScore').innerText = blueScore;

}

function timer() {
  if ((millisecond -= 10) < 0 && (minute != 0 || second != 0)) {
    millisecond = 999;
    second--;
  }
  if (second < 0 && minute > 0) {
    second = 59;
    minute--;
  }
  document.querySelectorAll('.minute').forEach(el => el.innerText = minute);
  document.querySelectorAll('.second').forEach(el => el.innerText = returnData(second));
}

function returnData(input) {
  return input >= 10 ? input : `0${input}`
}

document.scoreboardContainer.redScore.onclick = () => incrementRedScore();
document.scoreboardContainer.blueScore.onclick = () => incrementBlueScore();

function incrementRedScore() {
  redScore++;
  pause();
  document.getElementById('redScore').innerText = redScore;
}
function incrementBlueScore() {
  blueScore++;
  pause();
  document.getElementById('blueScore').innerText = blueScore;
}

document.addEventListener("keypress", function(event) {
  if (event.keyCode == 32) {
      pause();
  }
});

document.addEventListener("keypress", function(event) {
  if (event.key == "Enter") {
      start();
  }
});


