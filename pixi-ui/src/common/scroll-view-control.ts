import { DisplayObject, FederatedPointerEvent, FederatedWheelEvent, Graphics, IDestroyOptions, Point } from 'pixi.js';
import { Tween } from 'tweedle.js';
import { UtilsMath } from '../utils/utils-math';
import { Control } from './control';
import { IScrollable } from './interfaces/scrollable-interface';

/**
 * Wraps UI control in to scrollable viewport.
 * The control can be scrolled in one of directions: horizontally or vertically
 * Scroll view supports drag and drop and the mouse wheel
 *
 * @example
   const list = new GridStatefulControl(2);
   list.setCellSize(380, 580);
   list.setCellItem = () => new ShopWindowCardAvailable();
   list.setDataArray(array);
   list.paddingLeft = 30;
   list.paddingRight = 30;

   const scroll = new ScrollView(list, false);
   scroll.height = 580;
   this._content.addChild(scroll);
*/
export class ScrollViewControl extends Control {
  /** Scrollable container */
  protected readonly _mainContainer: IScrollable;

  /** A boolean indicating if the stack panel is vertical or horizontal */
  private readonly _isVertical: boolean;

  /** Multiplication factor of the scroll-wheel delta */
  protected readonly _wheelSpeed: number = 0.4;

  /** Inertia damping coefficient */
  private readonly _inertiaDamping: number = 0.9;

  /** Value-progress of content shift */
  protected readonly _progress: Point = new Point(0, 0);

  /** The value of the last drag shift. Used in inertia and multiplied by _inertiaDamping */
  private readonly _lastOffset: Point = new Point(0, 0);

  /** Inertia switches on after the drag has finished */
  protected _hasInertia: boolean = false;

  /** Starting point of drag event */
  private readonly _startDragPoint: Point = new Point(0, 0);

  private _scrollBar: Control;

  /** Scroll bar offset from the start and the end */
  private _scrollBarOffset = new Point(0, 0);

  /** Enables sticking to values using inertia  */
  private _enableStickyInertia = false;

  /** Indicates whether inertia has been applied for sticking */
  private _stickyInertiaApplied = false;

  /** Stores calculated progress value when it should stop scrolling when sticking */
  private _targetBarValue: number;

  /**
   * Index & animate flag of the item to be scrolled to
   */
  protected _scrollItemData: {
    index: number;
    tween?: { run(params: { onProgressCallback: (progress: number) => void; to: number }) };
  };

  private _scrollTween: Tween<any>;

  public onScrollCallback = (progress: number): void => {};

  public onProgressChanged = () => {};

  protected get minH() {
    return Math.min(this.height - (this._mainContainer.height + this._mainContainer.paddingBottom), this.maxH);
  }

  protected get maxH() {
    return this._mainContainer.paddingTop;
  }

  protected get minW() {
    return Math.min(this.width - (this._mainContainer.width + this._mainContainer.paddingRight), this.maxW);
  }

  protected get maxW() {
    return this._mainContainer.paddingLeft;
  }

  public constructor(container: IScrollable, isVertical = true, needMask = true, enableStickyInertia = false) {
    super();

    this.setHitArea();

    this.setInteractive(true);
    this._isVertical = isVertical;

    this._mainContainer = container;
    this._mainContainer.isVertical = isVertical;
    super.addChild(this._mainContainer);

    this._enableStickyInertia = enableStickyInertia;

    if (isVertical) {
      this._mainContainer.originY = 0;
    } else {
      this._mainContainer.originX = 0;
    }

    if (needMask) {
      const mask = new Graphics();
      this.mask = mask;
      super.addChild(mask);
    }
  }

  private resetInertia() {
    this._hasInertia = false;
    this._stickyInertiaApplied = false;
    this._targetBarValue = undefined;
  }

  public onDown(e: FederatedPointerEvent) {
    this.resetInertia();

    this._startDragPoint.set(e.x, e.y);
  }

  public onUp(e: FederatedPointerEvent) {
    this._hasInertia = true;

    if (Math.hypot(this._lastOffset.x, this._lastOffset.y) < 1) {
      this.resetInertia();
    }

    this._startDragPoint.set(0, 0);
  }

  public onGlobalMove(e: FederatedPointerEvent) {
    if (!this._isPointerDown) {
      return;
    }

    this.resetInertia();

    if (this._isVertical && e.y !== this._startDragPoint.y) {
      this._lastOffset.y = e.y - this._startDragPoint.y;
      this.calculateProgress(this._lastOffset.y);
    }

    if (!this._isVertical && e.x !== this._startDragPoint.x) {
      this._lastOffset.x = e.x - this._startDragPoint.x;
      this.calculateProgress(this._lastOffset.x);
    }

    this._startDragPoint.set(e.x, e.y);

    this._mainContainer.markAsDirty();
  }

  public onWheel(e: FederatedWheelEvent) {
    this.resetInertia();
    this.calculateProgress(-e.deltaY * this._wheelSpeed - e.deltaX * this._wheelSpeed);

    this._mainContainer.markAsDirty();
  }

  protected calculateProgress(delta: number) {
    const { width, height, paddingRight, paddingBottom, paddingLeft, paddingTop } = this._mainContainer;
    const totalHeight = height + paddingTop + paddingBottom;
    const totalWidth = width + paddingLeft + paddingRight;

    if (this._isVertical && totalHeight > this.height && delta) {
      this._progress.y += delta / (this.height - totalHeight);
      this.onProgressChanged?.();
    }

    if (!this._isVertical && totalWidth > this.width && delta) {
      this._progress.x += delta / (this.width - totalWidth);
      this.onProgressChanged?.();
    }
  }

  public resetOffset() {
    this._progress.set(0, 0);
    this._mainContainer.markAsDirty();
  }

  /**
   * Sets visible scroll bar offset
   * @param start amount of offset from start in px
   * @param end amount of offset at the end
   */
  public setScrollBarOffset(start: number, end: number) {
    this._scrollBarOffset.set(start, end);

    this._mainContainer.markAsDirty();
  }

  /**
   * Set's scroll bar control.
   * @param control scroll bar view control
   * @returns void
   *
   * TODO: extract scroll bar logic to separate class
   * https://linear.app/faraway/issue/DEVL-555/refactoring-scrollviewcontrol-to-move-logic-to-scrollbarcontrol
   *
   * @example
   * const sv = new ScrollViewControl(list, false);
    this.addChild(sv);
    sv.originX = 0;
    sv.x = 303;
    sv.y = 63;
    sv.height = 236;
    sv.width = 930;
    sv.setScrollBar(scrollBar);
    sv.setScrollBarOffset(50, 30);
    sv.resetOffset();
   */
  public setScrollBar(control?: Control) {
    this._scrollBar = control;
    super.addChild(control);

    if (this._isVertical) {
      control.originX = 1;
      control.originY = 0;

      this._mainContainer.originX = 0;
    } else {
      control.originX = 0;
      control.originY = 1;

      this._mainContainer.originY = 0;
    }

    let isDown = false;

    control.cursorPointer = true;
    control.setInteractive(true);
    control.stopPropagation = true;
    control.onDown = (e) => {
      isDown = true;

      this._startDragPoint.set(e.x, e.y);
    };
    control.onGlobalMove = (e) => {
      if (!isDown) return;

      this.resetInertia();

      const scrollBarOffset = this._scrollBarOffset.x + this._scrollBarOffset.y;

      if (this._isVertical) {
        const { minH, maxH } = this;
        const delta = e.y - this._startDragPoint.y;
        const posY = delta / this.scaleRatio;
        const controlOffsetRatio = (this.nativeHeight - control.nativeHeight - scrollBarOffset) / (minH - maxH);

        this.calculateProgress(posY / controlOffsetRatio);

        if (this._progress.y >= 0 && this._progress.y <= 1) {
          this._startDragPoint.y = e.y;
        }
      } else {
        const { minW, maxW } = this;
        const delta = e.x - this._startDragPoint.x;
        const posX = delta / this.scaleRatio;
        const controlOffsetRatio = (this.nativeWidth - control.nativeWidth - scrollBarOffset) / (minW - maxW);

        this.calculateProgress(posX / controlOffsetRatio);

        if (this._progress.x >= 0 && this._progress.x <= 1) {
          this._startDragPoint.x = e.x;
        }
      }

      this._mainContainer.markAsDirty();
    };

    control.onUp = () => {
      isDown = false;
    };
  }

  protected measure(): void {
    super.measure();

    this._progress.x = UtilsMath.clamp(this._progress.x, 0, 1);
    this._progress.y = UtilsMath.clamp(this._progress.y, 0, 1);

    const scrollbarOffset = this._scrollBarOffset.y + this._scrollBarOffset.x;
    const { minH, maxH, minW, maxW } = this;
    const offsetX = this._progress.x * (minW - maxW) + maxW;
    const offsetY = this._progress.y * (minH - maxH) + maxH;
    const width = this.width - this.paddingLeft - this.paddingRight;
    const height = this.height - this.paddingTop - this.paddingBottom;

    if (this._isVertical) {
      if (this._scrollBar) {
        this._scrollBar.visible = this.height < this._mainContainer.height;

        if (this._scrollBar.visible) {
          const deltaHeight = this.nativeHeight - this._scrollBar.nativeHeight;

          this._scrollBar.y = this._progress.y * (deltaHeight - scrollbarOffset) + this._scrollBarOffset.x;
        }
      }

      this._mainContainer.transform.position.y = offsetY;

      this.onScrollCallback(this._progress.y);
    } else {
      if (this._scrollBar) {
        this._scrollBar.visible = this.width < this._mainContainer.width;

        if (this._scrollBar.visible) {
          const deltaWidth = this.nativeWidth - this._scrollBar.nativeWidth;

          this._scrollBar.x = this._progress.x * (deltaWidth - scrollbarOffset) + this._scrollBarOffset.x;
        }
      }

      this._mainContainer.transform.position.x = offsetX;

      this.onScrollCallback(this._progress.x);
    }

    this._mainContainer.setViewPosition?.(offsetX, offsetY, width, height);
    this.checkItemScroll();
  }

  protected checkItemScroll() {
    if (this._scrollItemData) {
      const progress = this._mainContainer.getItemOffset(this._scrollItemData.index);

      if (this._scrollItemData.tween) {
        this._scrollItemData.tween.run({
          to: progress,
          onProgressCallback: (progressValue: number) => {
            this.progress = progressValue;
          },
        });
      } else {
        this.progress = progress;
      }

      this._scrollItemData = undefined;
    }
  }

  private applyInertia = () => {
    if (this._isVertical) {
      this._lastOffset.y *= this._inertiaDamping;
      this.calculateProgress(this._lastOffset.y);
    } else {
      this._lastOffset.x *= this._inertiaDamping;
      this.calculateProgress(this._lastOffset.x);
    }

    this._mainContainer.markAsDirty();
  };

  private applyStickyInertia = () => {
    const { minH, maxH, maxW, minW } = this;
    const { progress } = this;

    if (this._targetBarValue !== undefined) {
      const offset = this._isVertical ? this._lastOffset.y : this._lastOffset.x;

      if ((offset > 0 && progress <= this._targetBarValue) || (offset < 0 && progress >= this._targetBarValue)) {
        this._lastOffset.x = 0;
        this._lastOffset.y = 0;

        this.progress = this._targetBarValue;
        this.resetInertia();
      }
    }

    if (!this._stickyInertiaApplied && Math.hypot(this._lastOffset.x, this._lastOffset.y) < 1) {
      if (this._enableStickyInertia) {
        const additionalPower = 1.2;
        const count = this._mainContainer.children.length - 1;
        const target = count ? Math.round(progress * count) / count : 0;
        const offset = (target - progress) * (1 - this._inertiaDamping) * additionalPower;

        this._targetBarValue = Math.abs(target);

        if (this._isVertical) {
          this._lastOffset.y = offset * (minH - maxH);
        } else {
          this._lastOffset.x = offset * (minW - maxW);
        }
        this._stickyInertiaApplied = true;
      }
    }
  };

  protected onUpdate() {
    if (!this._hasInertia) {
      return;
    }

    this.applyInertia();
    this.applyStickyInertia();

    if (
      (this._stickyInertiaApplied || !this._enableStickyInertia) &&
      Math.hypot(this._lastOffset.x, this._lastOffset.y) < 1
    ) {
      this.resetInertia();
    }
  }

  public scrollToItem(
    index: number,
    tween?: { run(params: { onProgressCallback: (progress: number) => void; to: number | number[] }) }
  ) {
    this._scrollItemData = { index, tween };
    this.markAsDirty();
  }

  public get offset(): Point {
    return this._mainContainer.transform.position;
  }

  public get mainContainer(): IScrollable {
    return this._mainContainer;
  }

  public get progress() {
    if (this._isVertical) {
      return this._progress.y;
    }

    return this._progress.x;
  }

  public set progress(value: number) {
    if (this._isVertical) {
      this._progress.y = value;
    } else {
      this._progress.x = value;
    }

    this.markAsDirty();
  }

  protected onHostLinked() {
    this.host.ticker.add(this.onUpdate, this);
  }

  protected addInnerChild<U extends DisplayObject[]>(...children: U) {
    return super.addChild(...children);
  }

  public addChild<U extends DisplayObject[]>(...children: U) {
    return this._mainContainer.addChild(...children);
  }

  public addChildAt<U extends DisplayObject>(child: U, index: number) {
    return this._mainContainer.addChildAt(child, index);
  }

  public destroy(options?: IDestroyOptions | boolean) {
    this._scrollTween?.stop();
    this.host.ticker.remove(this.onUpdate, this);

    super.destroy(options);
  }
}
