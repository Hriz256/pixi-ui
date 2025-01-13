import { DisplayObject } from 'pixi.js';
import { Control } from './control';

/**
 * Default button.
 * The button is interactive control by default and passes on all of the pointer events to its children
 */
export class ButtonControl extends Control {
  protected _offsetY: number = 0;

  public constructor() {
    super();

    this.setInteractive(true);
    this.cursorPointer = true;
    this.setHitArea();
  }

  public onHover() {
    (this.children as Control[]).forEach((control) => {
      control.onHover();
    });
  }

  public onUp() {
    (this.children as Control[]).forEach((control) => {
      control.onUp();
    });

    this._offsetY = 0;
    this.calculatePivotY();
  }

  public onDown() {
    (this.children as Control[]).forEach((control) => {
      control.onDown();
    });

    this._offsetY = 3;
    this.calculatePivotY();
  }

  public onOut() {
    (this.children as Control[]).forEach((control) => {
      control.onOut();
    });
  }

  protected checkEnabled() {
    (this.children as Control[]).forEach((control) => {
      control.enabled = this._isEnabled;
    });
  }

  public addChild<U extends DisplayObject[]>(...children): any {
    for (const child of children) {
      if (child instanceof Control) {
        child.enabled = this._isEnabled;
      }
    }

    return super.addChild(...children);
  }

  public addChildAt<U extends DisplayObject>(child: U, index: number) {
    super.addChildAt(child, index);

    if (child instanceof Control) {
      child.enabled = this._isEnabled;
    }

    return child;
  }

  public calculatePivotY() {
    this.pivot.y = this.pivotY * this.h - this._offsetY;
  }
}
