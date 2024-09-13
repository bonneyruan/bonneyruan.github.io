"use strict";

let minute = 2;
let second = 30;
let millisecond = 0;

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
  minute = 2;
  second = 30;
  millisecond = 0;
  clearInterval(cron);
  document.querySelectorAll('.minute').forEach(el => el.innerText = "2");
  document.querySelectorAll('.second').forEach(el => el.innerText = "30");
  document.scoreboardContainer.reset.style.display = 'none';
  document.scoreboardContainer.pause.style.display = 'none';
  document.scoreboardContainer.start.style.display = 'inline-block';

  redScore = 0;
  blueScore = 0;

  document.getElementById('redScore').innerText = redScore;
  document.getElementById('blueScore').innerText = blueScore;

}

function timer() {
  if ((millisecond -= 10) < 0) {
    millisecond = 999;
    second--;
  }
  if (second < 0) {
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
  document.getElementById('redScore').innerText = redScore;
}
function incrementBlueScore() {
  blueScore++;
  document.getElementById('blueScore').innerText = blueScore;
}