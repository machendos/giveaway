'use strict';

const {
  BLACK_COLOR,
  FLIP_ITERATIONS,
  FLIP_ITERATIONS_INTERVAL,
  CANVAS_SAGE_PIXELS_COUNT,
  CELLS_IN_ROW,
  BOARD_COLOR,
  styles,
} = require(__dirname + '/../utils/constants');

class Canva {
  constructor(container) {
    this.container = container;
    this.board = container.getContext('2d');
  }

  init() {
    const minSize = Math.min(window.innerWidth, window.innerHeight);
    this.size = minSize * 0.8;
    this.rectSize = this.size / CELLS_IN_ROW;
    this.board.canvas.width = this.size;
    this.board.canvas.height = this.size;
    this.board.fillStyle = BOARD_COLOR;
    this.board.strokeRect(0, 0, this.size, this.size);
  }

  render() {
    this.board.fillStyle = BOARD_COLOR;
    this.board.strokeRect(0, 0, this.size, this.size);
    this.board.fillStyle = BLACK_COLOR;
    for (let rectRow = 0; rectRow < 8; rectRow++) {
      for (let rectColumt = 0; rectColumt < 8; rectColumt++) {
        this.board.strokeRect(
          rectRow * this.rectSize,
          rectColumt * this.rectSize,
          this.rectSize,
          this.rectSize
        );
      }
    }
  }

  put(row, column, style) {
    const { fill, def, border } = styles[style];
    const shiftedRow = row + 1;
    const shiftedColumn = column + 1;

    this.board.fillStyle = fill;
    this.board.beginPath();
    this.board.arc(
      this.rectSize * (shiftedColumn - 0.5),
      this.rectSize * (shiftedRow - 0.5),
      this.rectSize / 2 - 2,
      0,
      Math.PI * 2,
      true
    );

    if (border) {
      this.board.stroke();
    } else {
      this.board.fill();
    }

    return this;
  }

  remove(row, column) {
    const shiftedRow = row + 1;
    const shiftedColumn = column + 1;

    this.board.fillStyle = 'darkgreen';
    this.board.beginPath();
    this.board.arc(
      this.rectSize * (shiftedColumn - 0.5),
      this.rectSize * (shiftedRow - 0.5),
      this.rectSize / 2 - 0.5,
      0,
      Math.PI * 2,
      true
    );

    this.board.fill();
  }

  simpleChangeColor(row, column, style) {
    const colorPrev = styles[style].fill;
    const shiftedRow = row + 1;
    const shiftedColumn = column + 1;
    this.board.fillStyle = colorPrev;
    this.board.beginPath();
    this.board.arc(
      this.rectSize * (shiftedColumn - 0.5),
      this.rectSize * (shiftedRow - 0.5),
      this.rectSize / 2 - CANVAS_SAGE_PIXELS_COUNT,
      0,
      Math.PI * 2,
      true
    );
    this.board.fill();
  }

  move(oldRow, oldColumn, newRow, newColumn, style) {
    const colorPrev = styles[style].fill;
    const shiftedRow = oldRow + 1;
    const shiftedColumn = oldColumn + 1;

    const shiftedNewRow = oldRow + 1;
    const shiftedNewColumn = oldColumn + 1;
    this.board.fillStyle = 'darkgreen';
    this.board.beginPath();
    this.board.arc(
      this.rectSize * (shiftedColumn - 0.5),
      this.rectSize * (shiftedRow - 0.5),
      this.rectSize / 2 - CANVAS_SAGE_PIXELS_COUNT,
      0,
      Math.PI * 2,
      true
    );
    this.board.fill();

    this.board.fillStyle = style;

    this.board.arc(
      this.rectSize * (shiftedNewColumn - 0.5),
      this.rectSize * (shiftedNewRow - 0.5),
      this.rectSize / 2 - CANVAS_SAGE_PIXELS_COUNT,
      0,
      Math.PI * 2,
      true
    );
    this.board.fill();

  }

    changeColor(row, column, stylePrev, styleCurr) {
    const colorPrev = styles[stylePrev].fill;
    const colorCurr = styles[styleCurr].fill;
    const shiftedRow = row + 1;
    const shiftedColumn = column + 1;

    let iterationsLeft = FLIP_ITERATIONS;

    const interval = setInterval(() => {
      let coef = iterationsLeft / FLIP_ITERATIONS;
      this.board.fillStyle = 'darkgreen';
      this.board.beginPath();
      this.board.arc(
        this.rectSize * (shiftedColumn - 0.5),
        this.rectSize * (shiftedRow - 0.5),
        this.rectSize / 2 - CANVAS_SAGE_PIXELS_COUNT,
        0,
        Math.PI * 2,
        true
      );
      this.board.fill();
      this.board.fillStyle = colorPrev;
      coef = --iterationsLeft / FLIP_ITERATIONS;
      this.board.beginPath();
      this.board.ellipse(
        this.rectSize * (shiftedColumn - 0.5),
        this.rectSize * (shiftedRow - 0.5),
        (this.rectSize / 2) * coef - CANVAS_SAGE_PIXELS_COUNT < 0
          ? 0
          : (this.rectSize / 2) * coef - CANVAS_SAGE_PIXELS_COUNT,
        this.rectSize / 2 - CANVAS_SAGE_PIXELS_COUNT < 0
          ? 0
          : this.rectSize / 2 - CANVAS_SAGE_PIXELS_COUNT,
        0,
        0,
        Math.PI * 2,
        true
      );
      this.board.fill();
      if (iterationsLeft === 0) {
        clearInterval(interval);
        const intervalSecond = setInterval(() => {
          let coef = ++iterationsLeft / FLIP_ITERATIONS;
          this.board.fillStyle = colorCurr;
          coef = ++iterationsLeft / FLIP_ITERATIONS;
          this.board.beginPath();
          this.board.ellipse(
            this.rectSize * (shiftedColumn - 0.5),
            this.rectSize * (shiftedRow - 0.5),
            (this.rectSize / 2) * coef - CANVAS_SAGE_PIXELS_COUNT < 0
              ? 0
              : (this.rectSize / 2) * coef - CANVAS_SAGE_PIXELS_COUNT,
            this.rectSize / 2 - CANVAS_SAGE_PIXELS_COUNT < 0
              ? 0
              : this.rectSize / 2 - CANVAS_SAGE_PIXELS_COUNT,
            0,
            0,
            Math.PI * 2,
            true
          );
          this.board.fill();
          if (iterationsLeft === FLIP_ITERATIONS) {
            clearInterval(intervalSecond);
          }
        }, FLIP_ITERATIONS_INTERVAL);
      }
    }, FLIP_ITERATIONS_INTERVAL);
    return this;
  }

  onBoardClick(listener) {
    this.container.addEventListener('click', event => {
      const x =
        event.pageX - (this.container.offsetLeft + this.container.clientLeft);

      const y =
        event.pageY - (this.container.offsetTop + this.container.clientTop);

      const columnIndex = Math.ceil(x / this.rectSize) - 1;
      const rowIndex = Math.ceil(y / this.rectSize) - 1;

      listener({ rowIndex, columnIndex });
    });
    return this;
  }
}

module.exports = Canva;
