'use strict';

const Canva = require(__dirname + '/canva.js');

const {
  styles,
  COMPUTER_MODE,
  USER_MODE,
  WHITE_CHIP_MATRIX_VALUE,
  RESULT_TEXTS,
} = require(__dirname + '/../utils/constants');

const myselfModeButton = document.getElementById('myself-mode');
const computerModeButton = document.getElementById('computer-mode');
const currPlayerMarker = document.getElementById('curr-player');
const blackChipsCounter = document.getElementById('black-counter');
const whiteChipsCounter = document.getElementById('white-counter');
const gameResultText = document.getElementById('game-result-text');

class GiveawayController extends Canva {
  constructor(canvasContainer) {
    super(canvasContainer);
    this.whiteScore = 0;
    this.blackScore = 0;
  }

  onModeChange(listener) {
    myselfModeButton.onclick = () => {
      myselfModeButton.classList.add('selected');
      computerModeButton.classList.remove('selected');
      listener(USER_MODE);
    };

    computerModeButton.onclick = () => {
      computerModeButton.classList.add('selected');
      myselfModeButton.classList.remove('selected');
      listener(COMPUTER_MODE);
    };
  }

  setCurrPlayer(player) {
    const { fill } = styles[player];
    currPlayerMarker.style.setProperty('background', fill);
  }

  chipCounterIncrement(player, incrementCount) {
    if (player === WHITE_CHIP_MATRIX_VALUE) {
      this.whiteScore += incrementCount;
      whiteChipsCounter.innerText = this.whiteScore;
    } else {
      this.blackScore += incrementCount;
      blackChipsCounter.innerText = this.blackScore;
    }
  }

  handleGameFinish() {
    if (this.whiteScore > this.blackScore) {
      gameResultText.innerText = RESULT_TEXTS.white;
    } else if (this.blackScore > this.whiteScore) {
      gameResultText.innerText = RESULT_TEXTS.black;
    } else {
      gameResultText.innerText = RESULT_TEXTS.draw;
    }
  }
}

module.exports = GiveawayController;
