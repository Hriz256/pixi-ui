import { FederatedPointerEvent, Point } from 'pixi.js';
import { UtilsMath } from '../utils/utils-math';
import { Control } from './control';
import { ProgressBarControl } from './progress-bar-control';

/**
 * Slider with progress bar adjustment:
 * 1) by clicking on the progress bar
 * 2) by dragging thumb
 *
 * @example
 *  const slider = new Slider();
 *  this.addChild(slider);
 *
 *  const thumb = new ImageControl('buttons/Checkbox_off');
 *  thumb.autoScale = true;
 *  this._slider.thumb = thumb;
 *
 *  const progressBarControl = new ProgressBarControl(false);
 *  this._slider.progressBarControl = progressBarControl;
 */
export class SliderControl extends Control {
  private _thumb: Control;

  private _progressBar: ProgressBarControl;

  /**
   * point.x - thumb anchor at progress === 0
   * point.y - thumb anchor at progress === 1
   */
  private _thumbAnchorsLimits: Point = new Point(0.3, 0.7);

  private _progress: number = 0;

  public onProgressChangedCallback = (progress: number) => {};

  public set progress(value: number) {
    this._progress = UtilsMath.clamp(value, 0, 1);

    this.updateProgressBar();
  }

  public get progress() {
    return this._progress;
  }

  public set progressBarControl(control: ProgressBarControl) {
    this._progressBar?.removeFromParent();

    this._progressBar = control;
    this._progressBar.setInteractive(true);
    this._progressBar.cursorPointer = true;
    this.addChildAt(this._progressBar, 0);

    this._progressBar.onDownCallback = this.onChangeProgress;
    this._progressBar.onGlobalMove = this.onChangeProgress;

    this.updateProgressBar();
  }

  /**
   * Optional setting
   */
  public set thumb(control: Control) {
    this._thumb?.removeFromParent();

    this._thumb = control;
    this._thumb.setInteractive(true);
    this._thumb.cursorPointer = true;
    this._thumb.originX = 0;
    this.addChild(this._thumb);

    this._thumb.onDownCallback = this.onChangeProgress;
    this._thumb.onGlobalMove = this.onChangeProgress;
  }

  public set thumbAnchorsLimits(anchors: Point) {
    this._thumbAnchorsLimits = anchors;
    this.setThumbPosition();
  }

  private updateProgressBar() {
    if (this._progressBar) {
      this._progressBar.progress = this._progress;
    }

    this.setThumbPosition();
  }

  protected onWidthUpdate() {
    this.setThumbPosition();
  }

  private setThumbPosition() {
    if (this._thumb) {
      this._thumb.x = Math.floor((this.width / this.scaleRatio) * this._progress);
      this._thumb.anchorX = UtilsMath.lerp(this._thumbAnchorsLimits.x, this._thumbAnchorsLimits.y, this._progress);
    }
  }

  private onChangeProgress = (e: FederatedPointerEvent) => {
    if (!this._progressBar.isPointerDown && !this._thumb?.isPointerDown) {
      return;
    }

    const { x } = this.worldTransform.applyInverse(e.global);
    this.progress = x / this.width;

    this.onProgressChangedCallback(this.progress);
  };
}
