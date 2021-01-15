'use strict';

const startedPosition = require(__dirname + '/../started-position.json');

const {
  RED_COLOR,
  CELLS_IN_ROW,
  COMPUTER_MODE,
  NO_CHIP_MATRIX_VALUE,
  WHITE_CHIP_MATRIX_VALUE,
  BLACK_CHIP_MATRIX_VALUE,
  AVAILABLE_STEP_MATRIX_VALUE,
  BLACK_HOLE_MATRIX_VALUE,
  COMPUTER_THINK_TIMEOUT,
} = require(__dirname + '/../utils/constants');

const stepAvailabilityCheckStates = {
  WAIT_OPPONENT: 1,
  WAIT_NOT_EMPTY: 2,
};

const offsets = [-1, 1];

const offsetsPairs = offsets
  .map(rowOffset => offsets.map(columnOffset => [rowOffset, columnOffset]))
  .flat()
  .filter(([rowOffset, columnOffset]) => rowOffset || columnOffset);

function* offsetIndexesGenerator([row, column], [rowOffset, columnOffset]) {
  row += rowOffset;
  column += columnOffset;

  while (row >= 0 && row < 8 && column >= 0 && column < 8) {
    yield [row, column];
    row += rowOffset;
    column += columnOffset;
  }
}

class GiveawayModel {
  constructor(input) {
    this.countChipsTotal = 0;
    this.blackCount = 0;
    this.whiteCount = 0;
    this.availableSteps = [];
    this.input = input;
    this.gameFinished = false;
    this.currPlayer = BLACK_CHIP_MATRIX_VALUE;
    this.computerMode = false;
    this.isOneOfPlayersStuck = false;
    this.selected = null;
    this.waitSelect = true;
    this.allAvailable = [];

    this.input.onModeChange(mode => {
      // set init state of GiveawayModel
      this.countChipsTotal = 0;
      this.availableSteps = [];
      this.input = input;
      this.gameFinished = false;
      this.computerMode = mode === COMPUTER_MODE;
      this.currPlayer = BLACK_CHIP_MATRIX_VALUE;
      this.isOneOfPlayersStuck = false;
      this.waitSelect = true;

      // set init state of GiveawayController
      this.input.whiteScore = 0;
      this.input.blackScore = 0;

      // redraw game field
      this.input.init();
      this.input.render();
      this.initModel();

      this.tryComputerStep();
    });

    this.input.onBoardClick(({ rowIndex, columnIndex }) => {
      if (this.computerMode && this.currPlayer === BLACK_CHIP_MATRIX_VALUE)
        return;
      if (this.waitSelect) {
        if (this.matrix[rowIndex][columnIndex] !== this.currPlayer) return this.makeStep(rowIndex, columnIndex);
        this.selected = { rowIndex, columnIndex }
        this.matrix.map((row, rowIndex) => {
          row.map((element, columnIndex) => {
            this.input.simpleChangeColor(rowIndex, columnIndex, element);
          })
        })
        this.input.changeColor(rowIndex, columnIndex, this.currPlayer, 4)
        this.setNewAvailableSteps()

      }
      this.makeStep(rowIndex, columnIndex);
    });
  }

  makeStep(rowIndex, columnIndex) {
    console.log(rowIndex, columnIndex)
    const available = this.availableSteps.find(
      (availableStep) =>
        availableStep.rowIndex === rowIndex &&
        availableStep.columnIndex === columnIndex
    );

    if (!available) return;
    if (++this.countChipsTotal >= Math.pow(CELLS_IN_ROW, 2))
      this.gameFinished = true;

    this.availableSteps.splice(this.availableSteps.indexOf(available), 1);
    this.matrix[rowIndex][columnIndex] = this.currPlayer;
    this.input.put(rowIndex, columnIndex, this.currPlayer);
    const opponentMatrixValue = this.currPlayer === 1 ? 2 : 1;

    this.matrix[rowIndex][columnIndex] = this.currPlayer;
    this.matrix[this.selected.rowIndex][this.selected.columnIndex] = 0;


    this.input.remove(this.selected.rowIndex, this.selected.columnIndex);
    this.input.simpleChangeColor(rowIndex, columnIndex, this.currPlayer);

    console.log(available)

    available.willChanged.forEach(({rowIndex, columnIndex}) => {
      this.matrix[rowIndex][columnIndex] = NO_CHIP_MATRIX_VALUE;
      this.input.changeColor(
        rowIndex,
        columnIndex,
        this.currPlayer === WHITE_CHIP_MATRIX_VALUE
          ? BLACK_CHIP_MATRIX_VALUE
          : WHITE_CHIP_MATRIX_VALUE,
        // TODO: just delete, not change color
        NO_CHIP_MATRIX_VALUE
      );
      this.input.chipCounterIncrement(opponentMatrixValue, -1);
    });

    if (this.gameFinished) {
      this.input.handleGameFinish()
    } else {
      this.prepareForNextStep()
    };
  }

  initModel() {
    this.matrix = new Array(8)
      .fill(null)
      .map(() => new Array(8).fill(NO_CHIP_MATRIX_VALUE));
    startedPosition.black.forEach(
      ({ row, column }) => (this.matrix[row][column] = BLACK_CHIP_MATRIX_VALUE)
    );
    startedPosition.white.forEach(
      ({ row, column }) => (this.matrix[row][column] = WHITE_CHIP_MATRIX_VALUE)
    );

    this.matrix.map((row, rowIndex) =>
      row.map((element, columnIndex) =>
        this.input.put(rowIndex, columnIndex, element)
      )
    );
    this.prepareForNextStep();

    this.input.chipCounterIncrement(
      BLACK_CHIP_MATRIX_VALUE,
      startedPosition.black.length
    );

    this.input.chipCounterIncrement(
      WHITE_CHIP_MATRIX_VALUE,
      startedPosition.white.length
    );

    this.blackCount += startedPosition.black.length;
    this.whiteCount += startedPosition.white.length;

    this.countChipsTotal +=
      startedPosition.black.length + startedPosition.white.length;
  }

  prepareForNextStep() {
    this.changeCurrPlayer();
    this.removeOldAvailableSteps();
    this.waitSelect = true;
    this.tryComputerStep();
  }

  changeCurrPlayer() {
    this.currPlayer =
      this.currPlayer === WHITE_CHIP_MATRIX_VALUE
        ? BLACK_CHIP_MATRIX_VALUE
        : WHITE_CHIP_MATRIX_VALUE;
    this.input.setCurrPlayer(this.currPlayer);
  }

  removeOldAvailableSteps() {
    this.availableSteps.forEach(({ rowIndex, columnIndex }) =>
      this.input.remove(rowIndex, columnIndex));
  }

  setNewAvailableSteps() {
    this.calculateAvailableSteps();

    console.log('HERE')
    console.log(this.availableSteps);

    if (!this.availableSteps.length) {
      if (!this.isOneOfPlayersStuck) {
        // if no available steps, we mark that one player is stuck
        // and move turn to his opponent
        this.isOneOfPlayersStuck = true;
        return this.prepareForNextStep();
      } else {
        // if player's opponent was stuck and now player don't have
        // available steps, game is finished
        this.input.handleGameFinish();
      }
    } else {
      // drop isOneOfPlayersStuck flag in case if player don't have
      // available steps, but his opponent has
      this.isOneOfPlayersStuck = false;
    }

    this.availableSteps.forEach(({ rowIndex, columnIndex }) => {
      this.input.put(rowIndex, columnIndex, AVAILABLE_STEP_MATRIX_VALUE);
    });
  }

  tryComputerStep() {
    if (this.gameFinished) return;

    if (this.computerMode && this.currPlayer === BLACK_CHIP_MATRIX_VALUE) {
      const randomStep = this.availableSteps[
        Math.floor(Math.random() * this.availableSteps.length)
      ];

      this.setNewAvailableSteps()

      const bestMoveIndex = this.getBestMoveIndex(this.availableSteps, false);
      const bestMove = this.availableSteps[bestMoveIndex];

      setTimeout(() => {
        this.makeStep(bestMove.rowIndex, bestMove.columnIndex);
      }, COMPUTER_THINK_TIMEOUT);
    }
  }

  getBestMoveIndex(stepsArray, isEnemyTurn) {

    console.log({stepsArray})
    const { whiteScore, blackScore } = this.input;

    const arrayOfMovesCosts = stepsArray.map(({ willChanged }) => {
      if (isEnemyTurn) {
        // 1 for just placed chip
        // x2 because of chip flipping (- for you, + for enemy)
        return blackScore - whiteScore - 1 - (2 * willChanged.length);
      } else {
        // 1 for just placed chip
        // x2 because of chip flipping (+ for you, - for enemy)
        return blackScore - whiteScore + 1 + (2 * willChanged.length);
      }
    });

    // we need min() function here as we have an anti-giveaway in task
    const minMoveCost = Math.min(...arrayOfMovesCosts);
    return arrayOfMovesCosts.findIndex(moveCost => moveCost === minMoveCost);
  }

  calculateAvailableSteps(connect) {
    console.log('CALCULATE')
    const availableSteps = [];
    const opponentMatrixValue = this.currPlayer === 1 ? 2 : 1;

    const selectedRow = this.selected.rowIndex;
    const selectedColumn = this.selected.columnIndex;

    if (this.matrix[selectedRow - 1] && this.matrix[selectedRow - 1][selectedColumn - 1] === 0) {
      availableSteps.push({rowIndex: selectedRow - 1, columnIndex: selectedColumn - 1, willChanged: []});
    }
    if (this.matrix[selectedRow + 1] && this.matrix[selectedRow + 1][selectedColumn - 1] === 0) {
      availableSteps.push({rowIndex: selectedRow + 1, columnIndex: selectedColumn - 1, willChanged: []});
    }
    if (this.matrix[selectedRow - 1] && this.matrix[selectedRow - 1][selectedColumn + 1] === 0) {
      availableSteps.push({rowIndex: selectedRow - 1, columnIndex: selectedColumn + 1, willChanged: []});
    }
    if (this.matrix[selectedRow + 1] && this.matrix[selectedRow + 1][selectedColumn + 1] === 0) {
      availableSteps.push({rowIndex: selectedRow + 1, columnIndex: selectedColumn + 1, willChanged: []});
    }
    if (this.matrix[selectedRow - 2] && this.matrix[selectedRow - 2][selectedColumn - 2] === NO_CHIP_MATRIX_VALUE
      && this.matrix[selectedRow - 1][selectedColumn - 1] === opponentMatrixValue) {
      availableSteps.push({rowIndex: selectedRow - 2, columnIndex: selectedColumn - 2, willChanged: [{
        rowIndex: selectedRow - 1, columnIndex: selectedColumn - 1
        }]});
    }
    if (this.matrix[selectedRow - 2] && this.matrix[selectedRow - 2][selectedColumn + 2] === NO_CHIP_MATRIX_VALUE
      && this.matrix[selectedRow - 1][selectedColumn + 1] === opponentMatrixValue) {
      availableSteps.push({rowIndex: selectedRow - 2, columnIndex: selectedColumn + 2, willChanged: [{
          rowIndex: selectedRow - 1, columnIndex: selectedColumn + 1
        }]});
    }
    if (this.matrix[selectedRow + 2] && this.matrix[selectedRow + 2][selectedColumn - 2] === NO_CHIP_MATRIX_VALUE
      && this.matrix[selectedRow + 1][selectedColumn - 1] === opponentMatrixValue) {
      availableSteps.push({rowIndex: selectedRow + 2, columnIndex: selectedColumn - 2, willChanged: [{
          rowIndex: selectedRow + 1, columnIndex: selectedColumn - 1
        }]});
    }
    if (this.matrix[selectedRow + 2] && this.matrix[selectedRow + 2][selectedColumn + 2] === NO_CHIP_MATRIX_VALUE
      && this.matrix[selectedRow + 1][selectedColumn + 1] === opponentMatrixValue) {
      availableSteps.push({rowIndex: selectedRow + 2, columnIndex: selectedColumn + 2, willChanged: [{
          rowIndex: selectedRow + 1, columnIndex: selectedColumn + 1
        }]});
    }
    if (connect) {
    this.availableSteps = [...this.availableSteps, {from: {rowIndex, columnIndex}, moves: availableSteps}];
    } else this.availableSteps = availableSteps;
  }
}

module.exports = GiveawayModel;
