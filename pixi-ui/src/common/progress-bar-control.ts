import { Graphics } from 'pixi.js';
import { UtilsMath } from '../utils/utils-math';
import { Control } from './control';

/**
 * A control with a background image and a progress bar whose length is changed by changing the progress:
 * 1) with mask
 * 2) with simply changing its width
 *
 * @example
 *  const progressBarControl = new ProgressBarControl(false);
 *
 *  const bg = new ImageControl('backgrounds/Bg_Music', ImageControlType.SLICE9);
 *  progressBarControl.addChild(bg);
 *
 *  const progressBar = new ImageControl('backgrounds/Bg_Music', ImageControlType.SLICE9);
 *  progressBarControl.progressBar = progressBar;
 */
export class ProgressBarControl extends Control {
  private readonly _progressBarMask: Graphics;

  protected _minProgressBarWidth: number = 0;

  protected _progressBar: Control;

  protected _progress: number = 0;

  public constructor(needMask: boolean) {
    super();

    if (needMask) {
      this._progressBarMask = new Graphics();
    }
  }

  public set progressBar(control: Control) {
    this._progressBar?.removeFromParent();

    this._progressBar = control;
    this._progressBar.originX = 0;
    this.addChild(this._progressBar);

    if (this._progressBarMask) {
      this._progressBar.maskAutoScale = false;
      this._progressBar.mask = this._progressBarMask;
    }
  }

  public set minProgressBarWidth(v: number) {
    this._minProgressBarWidth = v;
  }

  public set progress(v: number) {
    this._progress = UtilsMath.clamp(v, 0, 1);
    this.setProgressBarWidth();
  }

  public get progress() {
    return this._progress;
  }

  protected setProgressBarWidth() {
    if (this._progressBarMask) {
      this._progressBarMask.width = Math.floor(this.width * this._progress);
    } else if (this._progressBar) {
      const width = Math.floor((this.width / this.scaleRatio) * this._progress);
      const minWidth = this._minProgressBarWidth;
      this._progressBar.width = Math.max(width, minWidth);
    }
  }

  protected onWidthUpdate(width: number) {
    this.setProgressBarWidth();
  }

  protected onHeightUpdate(height: number) {
    if (this._progressBarMask) {
      this._progressBarMask.height = this.h;
    }
  }
}
