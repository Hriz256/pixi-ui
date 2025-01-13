import { DisplayObject, Point } from 'pixi.js';
import { Control } from './control';
import { IScrollable } from './interfaces/scrollable-interface';

/**
 * Grid control.
 * Places children in grid cells
 *
 * @example
   const grid = new GridControl(5);
   this.addChild(grid);
 */
export class GridControl extends Control implements IScrollable {
  /** A boolean indicating if the stack panel is vertical or horizontal */
  protected _isVertical: boolean;

  /** Size of cells in pixels */
  protected _cellSize: Point;

  /** Count of grid columns */
  protected _columns: number;

  /** Count of grid rows */
  protected _rows: number;

  /** Array of all grid cells */
  protected _cells: Control[] = [];

  /** Count of cells in cross orientation */
  protected _cross: number;

  /**
   * Create grid
   * @param cross Count of cells in cross orientation
   * @param isVertical Is vertical orientation
   */
  public constructor(cross: number, isVertical = true) {
    super();
    this._cross = cross;
    this._isVertical = isVertical;

    this.adaptWidthToChildren = true;
    this.adaptHeightToChildren = true;

    this._cellSize = new Point(100, 100);
    this.updateOrientation();
  }

  protected measure() {
    let main: number;
    let cross: number;

    this._cells.forEach((cell, index) => {
      if (this._isVertical) {
        cross = Math.floor(index / this._columns);
        main = index % this._columns;
      } else {
        cross = Math.floor(index / this._rows);
        main = index % this._rows;
      }

      cell.layout();
      const [col, row] = this._isVertical ? [main, cross] : [cross, main];
      const { position } = cell.transform;

      position.x = col * this._cellSize.x * this._scaleRatio;
      position.y = row * this._cellSize.y * this._scaleRatio;
    });

    this.updateSize();
  }

  protected updateSize() {
    if (this.adaptWidthToChildren) {
      if (this._isVertical) {
        this.w = this._columns * this._cellSize.x * this._scaleRatio;
      } else {
        this.w = Math.ceil(this._cells.length / this._rows) * this._cellSize.x * this._scaleRatio;
      }
    }

    if (this.adaptHeightToChildren) {
      if (this._isVertical) {
        this.h = Math.ceil(this._cells.length / this._columns) * this._cellSize.y * this._scaleRatio;
      } else {
        this.h = this._rows * this._cellSize.y * this._scaleRatio;
      }
    }
  }

  private updateOrientation() {
    if (this._isVertical) {
      this._columns = this._cross;
      this._rows = 1;
    } else {
      this._rows = this._cross;
      this._columns = 1;
    }
  }

  /**
   * Set cells size in pixels
   * @param width Cell width
   * @param height Cell height
   */
  public setCellSize(width: number, height: number) {
    this._cellSize.set(width, height);
    this.markAsDirty();
  }

  /**
   * Add child to new cell
   * @param child Control to add to the Cell
   * @returns Created Cell
   */
  public addChild<U extends DisplayObject>(...children: U[]) {
    const cells = children.map((child) => this.createCell(child));
    super.addChild(...cells);
    this._cells.push(...cells);

    return cells[0];
  }

  protected createCell(child: DisplayObject) {
    const cell = new Control();
    cell.name = 'Cell';
    cell.width = this._cellSize.x;
    cell.height = this._cellSize.y;
    cell.addChild(child);

    return cell;
  }

  public get isVertical(): boolean {
    return this._isVertical;
  }

  public set isVertical(value: boolean) {
    if (this._isVertical === value) {
      return;
    }

    this._isVertical = value;

    this.updateOrientation();
    this.markAsDirty();
  }

  public get columns(): number {
    return this._columns;
  }

  public set columns(value: number) {
    if (this._columns === value) {
      return;
    }

    this._columns = value;
    this.markAsDirty();
  }

  public get rows(): number {
    return this._rows;
  }

  public set rows(value: number) {
    if (this._rows === value) {
      return;
    }

    this._rows = value;
    this.markAsDirty();
  }

  public get cells(): Control[] {
    return this._cells;
  }
}
