import { Control } from '../control';

export interface IScrollable extends Control {
  isVertical?: boolean;

  setViewPosition?: (x: number, y: number, w: number, h: number) => void;

  getItemOffset?: (index: number) => number;
}
