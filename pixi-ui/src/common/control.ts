import {
  Container,
  DisplayObject,
  FederatedPointerEvent,
  FederatedWheelEvent,
  Graphics,
  IHitArea,
  MaskData,
  Rectangle,
  Sprite,
  Ticker,
  utils,
} from 'pixi.js';
import { UtilsMath } from '../utils/utils-math';

/**
 * Control is a basic gui element. Any element (sprite, text, etc.) must be created by a composite in the corresponding
 * extensible control, e.g. BitmapTextControl.
 * The entry point is the control that is created in the abstract-scene.
 * Any control instance is marked dirty by default. And the next time the render ticker is updated,
 * the layout() method is run on the root controller, the root control starts the layout() method,
 * which runs the layout() method on its children all the way down. If any control has been marked as dirty,
 * all controls on the same level and all controls above it are marked along with it.
 * So the next update of the renderer-ticker will call the layout() method on the root control
 */
export class Control extends Container {
  protected readonly _permissibleError: number = 0.01;

  /**
   * A boolean indicating that the control needs to update its layout
   */
  protected _isDirty: boolean = true;

  /**
   * A boolean indicating if control is Enabled
   */
  protected _isEnabled: boolean = true;

  /**
   * A boolean indicating whether the controller reacts to pointer events
   */
  protected _isInteractive: boolean = false;

  /**
   * A boolean indicating if cursor should be pointer
   */
  protected _isCursorPointer: boolean = false;

  /**
   * Current width
   */
  protected _w: number = 0;

  /**
   * Current height
   */
  protected _h: number = 0;

  /**
   * Set inside the set width() method, set to _w on the next run of the layout() method
   */
  protected _width: number = 0;

  /**
   * Set inside the set height() method, set to _w on the next run of the layout() method
   */
  protected _height: number = 0;

  /**
   * Scaling factor by which all dimensions are multiplied.
   * Calculated in the abstract scene per resize
   */
  protected _scaleRatio: number = 1;

  protected _childrenScaleRatio: number = 1;

  /**
   * Scaling factor by which width and height are multiplied
   */
  protected _scaleSize: number = 1;

  /**
   * A boolean indicating if the control should try to adapt to its parent width
   */
  protected _adaptWidthToParent: boolean = true;

  /**
   * A boolean indicating if the control should try to adapt to its parent height
   */
  protected _adaptHeightToParent: boolean = true;

  /**
   * A boolean indicating if the control should try to adapt to its children width
   */
  protected _adaptWidthToChildren: boolean = false;

  /**
   * A boolean indicating if the control should try to adapt to its children height
   */
  protected _adaptHeightToChildren: boolean = false;

  private _minWidth: number = 0;

  private _minHeight: number = 0;

  private _maxWidth: number = Infinity;

  private _maxHeight: number = Infinity;

  protected _x: number = 0;

  protected _y: number = 0;

  /**
   * A value in the range 0 - 1, by which the width is multiplied to correctly calculate the pivot.x
   * With subsequent offset by x (transform.position.x += pivotX * width)
   */
  private _pivotX: number = 0;

  /**
   * A value in the range 0 - 1, by which the height is multiplied to correctly calculate the pivot.y
   * With subsequent offset by x (transform.position.y += pivotY * height)
   */
  private _pivotY: number = 0;

  /**
   * A value in the range 0 - 1, by which the width is multiplied to correctly calculate the pivot.x
   * Without subsequent offset by x (transform.position.x += pivotX * width)
   */
  private _anchorX: number = 0;

  /**
   * A value in the range 0 - 1, by which the height is multiplied to correctly calculate the pivot.y
   * Without subsequent offset by x (transform.position.y += pivotY * height)
   */
  private _anchorY: number = 0;

  /**
   * Paddings around a control: [left, top, right, bottom]
   */
  private _padding: [number, number, number, number] = [0, 0, 0, 0];

  /**
   * Horizontal alignment: 0 - 1
   */
  private _originX: number = 0.5;

  /**
   * Vertical alignment: 0 - 1
   */
  private _originY: number = 0.5;

  /**
   * The host is root uiLayer.
   * Set to each control that has been added by a child
   */
  private _host: Container;

  /**
   * A free variable that can contain a reference to any emitter (conveniently window's emitter).
   * This reference will be passed to all children of this control
   */
  private _emitter?: utils.EventEmitter;

  /**
   * Set only to host in abstract-scene
   */
  private _ticker: Ticker;

  private _maskAutoScale: boolean = true;

  /**
   * A boolean indicating if the events should stop propagation
   */
  private _isStopPropagation: boolean = false;

  /**
   * A boolean indicating if the wheel events should stop propagation
   */
  private _isStopWheelPropagation: boolean = false;

  protected _isPointerDown: boolean = false;

  protected _isPointerHover: boolean = false;

  protected _isPointerEnter: boolean = false;

  protected _hitArea: Rectangle;

  /**
   * Hit area whose values are multiplied by the current scaleRatio
   */
  protected _calculatedHitArea: Rectangle;

  /**
   * Layout callback, runs at the end of the layout method
   */
  public onLayoutCallback(): void {}

  /**
   * Callback called after a full recalculation of all control parameters has occurred and this._isDirty is false
   */
  public onAfterAllMeasuresCallback(): void {}

  /**
   * Click callback to override outside of a control
   */
  public onClickCallback(e?: FederatedPointerEvent): void {}

  /**
   * Pointer move callback to override outside of a control
   */
  public onMoveCallback(e?: FederatedPointerEvent): void {}

  /**
   * Pointer down callback to override outside of a control
   */
  public onDownCallback(e?: FederatedPointerEvent): void {}

  /**
   * Pointer up callback to override outside of a control
   */
  public onUpCallback(e?: FederatedPointerEvent): void {}

  /**
   * Pointer hover callback to override outside of a control
   */
  public onHoverCallback(e?: FederatedPointerEvent): void {}

  /**
   * Pointer out callback to override outside of a control
   */
  public onOutCallback(e?: FederatedPointerEvent): void {}

  /**
   * Pointer leave callback to override outside of a control
   */
  public onLeaveCallback(e?: FederatedPointerEvent): void {}

  /**
   * Hit area update callback to override outside of a control
   */
  public onUpdateHitAreaCallback(): void {}

  /**
   * Click callback to override within extensible controls
   */
  public onClick(e?: FederatedPointerEvent) {}

  /**
   * Pointer move callback to override within extensible controls
   */
  public onMove(e?: FederatedPointerEvent) {}

  /**
   * Pointer global move callback to override within extensible controls
   */
  public onGlobalMove(e?: FederatedPointerEvent) {}

  /**
   * Pointer down callback to override within extensible controls
   */
  public onDown(e?: FederatedPointerEvent) {}

  /**
   * Pointer up callback to override within extensible controls
   */
  public onUp(e?: FederatedPointerEvent) {}

  /**
   * Pointer hover callback to override within extensible controls
   */
  public onHover(e?: FederatedPointerEvent) {}

  /**
   * Pointer out callback to override within extensible controls
   */
  public onOut(e?: FederatedPointerEvent) {}

  /**
   * Pointer leave callback to override within extensible controls
   */
  public onLeave(e?: FederatedPointerEvent) {}

  /**
   * Wheel callback to override within extensible controls
   */
  public onWheel(e?: FederatedWheelEvent) {}

  /**
   * Visible callback on change visible
   */
  public onVisible(value: boolean) {}

  /**
   * Called when the width / scale of this control is changed
   * Callback to override within extensible controls
   */
  protected onWidthUpdate(width: number) {}

  /**
   * Called when the height / scale of this control is changed
   * Callback to override within extensible controls
   */
  protected onHeightUpdate(height: number) {}

  /**
   * Called when the scale of this control is changed
   * Callback to override within extensible controls
   */
  protected onScaleUpdate(scaleRatio: number) {}

  /**
   * Called if this control is set to host
   * Callback to override within extensible controls
   */
  protected onHostLinked() {}

  /**
   * Called if this control is set to event emitter
   * Callback to override within extensible controls
   */
  protected onEmitterLinked(oldEmmiter: utils.EventEmitter | undefined) {}

  public constructor() {
    super();

    this.on('pointertap', this._onClick, this);
    this.on('pointermove', this._onMove, this);
    this.on('globalpointermove', this._onGlobalMove, this);
    this.on('pointerdown', this._onPointerDown, this);
    this.on('pointerup', this._onPointerUp, this);
    this.on('pointerupoutside', this._onPointerUp, this);
    this.on('pointerenter', this._onPointerHover, this);
    this.on('pointerout', this._onPointerOut, this);
    this.on('pointerleave', this._onPointerLeave, this);
    this.on('wheel', this._onWheel, this);
  }

  /**
   * Method called when the button clicked
   */
  private _onClick(e: FederatedPointerEvent) {
    if (!this._isEnabled) {
      return;
    }

    if (this._isStopPropagation) {
      e.stopPropagation();
    }

    this.onClick(e);
    this.onClickCallback(e);
  }

  /**
   * Method called when the pointer moves over the control
   */
  private _onMove(e: FederatedPointerEvent) {
    if (!this._isEnabled) {
      return;
    }

    if (this._isStopPropagation) {
      e.stopPropagation();
    }

    this.onMove(e);
    this.onMoveCallback(e);
  }

  private _onGlobalMove(e: FederatedPointerEvent) {
    if (!this._isEnabled) {
      return;
    }

    this.onGlobalMove(e);
  }

  /**
   * Method called when the control pressed
   */
  private _onPointerDown(e: FederatedPointerEvent) {
    if (!this._isEnabled) {
      return;
    }

    if (this._isStopPropagation) {
      e.stopPropagation();
    }

    this._isPointerDown = true;

    this.onDown(e);
    this.onDownCallback(e);
  }

  /**
   * Method called when the control is up
   */
  private _onPointerUp(e: FederatedPointerEvent) {
    if (!this._isEnabled || !this._isPointerDown) {
      return;
    }

    if (this._isStopPropagation) {
      e.stopPropagation();
    }

    this._isPointerDown = false;

    this.onUp(e);
    this.onUpCallback(e);
  }

  /**
   * Method called when the mouse hovers the control
   */
  private _onPointerHover(e: FederatedPointerEvent) {
    if (!this._isEnabled) {
      return;
    }

    if (this._isStopPropagation) {
      e.stopPropagation();
    }

    this._isPointerHover = true;
    this._isPointerEnter = true;

    this.onHover(e);
    this.onHoverCallback(e);
  }

  /**
   * Method called when the mouse out of control
   */
  private _onPointerOut(e: FederatedPointerEvent) {
    if (!this._isEnabled) {
      return;
    }

    if (this._isStopPropagation) {
      e.stopPropagation();
    }

    this._isPointerHover = false;

    this.onOut(e);
    this.onOutCallback(e);
  }

  /**
   * Method called when the mouse leaves the control
   */
  private _onPointerLeave(e: FederatedPointerEvent) {
    if (!this._isEnabled) {
      return;
    }

    if (this._isStopPropagation) {
      e.stopPropagation();
    }

    this._isPointerEnter = false;

    this.onLeave(e);
    this.onLeaveCallback(e);
  }

  private _onWheel(e: FederatedWheelEvent) {
    if (!this._isEnabled) {
      return;
    }

    if (this._isStopWheelPropagation) {
      e.stopPropagation();
    }
    this.onWheel(e);
  }

  public get isPointerDown() {
    return this._isPointerDown;
  }

  public set isPointerDown(value: boolean) {
    this._isPointerDown = value;
  }

  public get isPointerEnter() {
    return this._isPointerEnter;
  }

  public set mask(value: Container | MaskData | null) {
    super.mask = value;

    if (value instanceof Graphics && !value.currentPath && !value.geometry.graphicsData.length) {
      (value as Graphics).beginFill(0xffffff, 1);
      (value as Graphics).drawRect(0, 0, 1, 1);
    }

    this.markAsDirty();
  }

  public get mask(): Container | MaskData | null {
    return super.mask;
  }

  public setInteractive(value: boolean) {
    this._isInteractive = value;

    this.checkInteractive();
  }

  public set cursorPointer(value: boolean) {
    this._isCursorPointer = value;

    this.checkInteractive();
  }

  public get isDirty() {
    return this._isDirty;
  }

  public getIsInteractive() {
    return this._isInteractive;
  }

  public get enabled() {
    return this._isEnabled;
  }

  public set enabled(value: boolean) {
    this._isEnabled = value;

    this.checkInteractive();
    this.checkEnabled();
  }

  protected checkEnabled() {}

  private checkInteractive() {
    const interactive = this._isEnabled && this._isInteractive;

    this.eventMode = interactive ? 'static' : 'auto';
    this.cursor = interactive && this._isCursorPointer ? 'pointer' : 'default';
  }

  /**
   * Wrap around the visible property with a call to markAsDirty, to rebuild the layout.
   * For example, ListControl only displays visible items and by setting child.visible = false,
   * a ListControl will not rebuild its children
   */
  public setVisible(value: boolean, markAsDirty: boolean) {
    if (this.visible === value) {
      return;
    }

    this.visible = value;
    this.onVisible(value);

    if (markAsDirty) {
      this.markAsDirty();
    }
  }

  public set stopPropagation(value: boolean) {
    this._isStopPropagation = value;
  }

  public set stopWheelPropagation(value: boolean) {
    this._isStopWheelPropagation = value;
  }

  public get ticker() {
    return this._ticker;
  }

  public set ticker(value: Ticker) {
    this._ticker = value;
  }

  public get host() {
    return (this._host || this) as Control;
  }

  public set host(value: Control) {
    if (this._host === value) {
      return;
    }

    this._host = value;

    this.onHostLinked();
  }

  public get emitter() {
    return this._emitter;
  }

  public set emitter(value: utils.EventEmitter) {
    if (this._emitter === value) {
      return;
    }

    const oldEmmiter = this._emitter;

    this._emitter = value;

    this.onEmitterLinked(oldEmmiter);
  }

  public link() {
    this.children.forEach((child) => {
      if (child instanceof Control) {
        if (this._host) {
          child.host = this._host as Control;
        }

        if (this._emitter && !child.emitter) {
          child.emitter = this._emitter;
        }

        if (this._host || this._emitter) {
          child.link();
        }
      }
    });
  }

  public get w() {
    return this._w;
  }

  /**
   * Setting the width within layout() method
   * DON'T USE OUTSIDE CONTROL
   */
  protected set w(value: number) {
    const delta = Math.abs(this._w - value);

    if (delta < this._permissibleError) {
      return;
    }

    this._width = value / (this._adaptWidthToParent ? 1 : this._scaleRatio) / this._scaleSize;
    this._w = value;

    this.updateWidth();

    this.markAsDirty();
  }

  public get width() {
    return this._w;
  }

  /**
   * Manual setting of the width on the outside.
   * Removes the flag that the control should automatically expand by the parent's width
   */
  public set width(value: number) {
    this._adaptWidthToParent = false;
    this._adaptWidthToChildren = false;

    if (this._width === value) {
      return;
    }

    this._width = value;

    this.markAsDirty();
  }

  /**
   * Returns native width, without scale ratio
   */
  public get nativeWidth() {
    return this._width;
  }

  private _widthPercent: number = 1;

  public get widthPercent(): number {
    return this._widthPercent;
  }

  public set widthPercent(value: number) {
    this._adaptWidthToParent = true;
    this._adaptWidthToChildren = false;

    if (this._widthPercent === value) {
      return;
    }

    this._widthPercent = value;

    this.markAsDirty();
  }

  private _heightPercent: number = 1;

  public get heightPercent(): number {
    return this._heightPercent;
  }

  public set heightPercent(value: number) {
    this._adaptHeightToParent = true;
    this._adaptHeightToChildren = false;

    if (this._heightPercent === value) {
      return;
    }

    this._heightPercent = value;

    this.markAsDirty();
  }

  /**
   * Returns native height, without scale ratio
   */
  public get nativeHeight() {
    return this._height;
  }

  public get minWidth() {
    return this._minWidth * this._scaleRatio;
  }

  public set minWidth(value: number) {
    if (this._minWidth === value) {
      return;
    }

    this._minWidth = value;
    this.markAsDirty();
  }

  public get maxWidth() {
    return this._maxWidth * this._scaleRatio;
  }

  public set maxWidth(value: number) {
    if (this._maxWidth === value) {
      return;
    }

    this._maxWidth = value;
    this.markAsDirty();
  }

  protected updateWidth() {
    this.onWidthUpdate(this.w);

    if (this._maskAutoScale && this._mask) {
      (this._mask as Container).width = this.w;
    }
  }

  public get height() {
    return this._h;
  }

  /**
   * Manual setting of the height on the outside.
   * Removes the flag that the control should automatically expand by the parent's height
   */
  public set height(value: number) {
    this._adaptHeightToParent = false;
    this._adaptHeightToChildren = false;

    if (this._height === value) {
      return;
    }

    this._height = value;

    this.markAsDirty();
  }

  public get h() {
    return this._h;
  }

  /**
   * Setting the width within layout() method
   * DON'T USE OUTSIDE CONTROL
   */
  protected set h(value: number) {
    const delta = Math.abs(this.h - value);

    if (delta < this._permissibleError) {
      return;
    }

    this._height = value / (this._adaptHeightToParent ? 1 : this._scaleRatio) / this._scaleSize;
    this._h = value;

    this.updateHeight();

    this.markAsDirty();
  }

  public get minHeight() {
    return this._minHeight * this._scaleRatio;
  }

  public set minHeight(value: number) {
    if (this._minHeight === value) {
      return;
    }

    this._minHeight = value;
    this.markAsDirty();
  }

  public get maxHeight() {
    return this._maxHeight * this._scaleRatio;
  }

  public set maxHeight(value: number) {
    if (this._maxHeight === value) {
      return;
    }

    this._maxHeight = value;
    this.markAsDirty();
  }

  protected updateHeight() {
    this.onHeightUpdate(this.h);

    if (this._maskAutoScale && this._mask) {
      (this._mask as Container).height = this.h;
    }
  }

  public set scaleSize(value: number) {
    if (this._scaleSize === value) {
      return;
    }

    this._scaleSize = value;

    this.markAsDirty();
  }

  public get scaleSize() {
    return this._scaleSize;
  }

  public get scaleRatio() {
    return this._scaleRatio;
  }

  /**
   * It passes the scale on to all its children, including itself
   */
  public set scaleRatio(value: number) {
    if (this._scaleRatio === value) {
      return;
    }

    this._childrenScaleRatio = value;
    this._scaleRatio = value;
    this._isDirty = true;

    this.onScaleUpdate(this._scaleRatio);
    this.updateWidth();
    this.updateHeight();

    for (const child of this.children) {
      if (child instanceof Control) {
        child.scaleRatio = this._scaleRatio;
      }
    }
  }

  public get childrenScaleRatio() {
    return this._childrenScaleRatio;
  }

  /**
   * It passes the scale on to all its children, without itself
   */
  public set childrenScaleRatio(value: number) {
    this._childrenScaleRatio = value;
    this._isDirty = true;

    for (const child of this.children) {
      if (child instanceof Control) {
        child.scaleRatio = value;
      }
    }
  }

  public get originX() {
    return this._originX;
  }

  public set originX(value: number) {
    if (this._originX === value) {
      return;
    }

    this._originX = value;
    this.markAsDirty();
  }

  public get originY() {
    return this._originY;
  }

  public set originY(value: number) {
    if (this._originY === value) {
      return;
    }

    this._originY = value;
    this.markAsDirty();
  }

  public get adaptWidthToParent() {
    return this._adaptWidthToParent;
  }

  public set adaptWidthToParent(value: boolean) {
    if (this._adaptWidthToParent === value) {
      return;
    }

    this._adaptWidthToChildren = false;
    this._adaptWidthToParent = value;
    this.markAsDirty();
  }

  public get adaptHeightToParent() {
    return this._adaptHeightToParent;
  }

  public set adaptHeightToParent(value: boolean) {
    if (this._adaptHeightToParent === value) {
      return;
    }

    this._adaptHeightToChildren = false;
    this._adaptHeightToParent = value;
    this.markAsDirty();
  }

  public get adaptWidthToChildren() {
    return this._adaptWidthToChildren;
  }

  public set adaptWidthToChildren(value: boolean) {
    if (this._adaptWidthToChildren === value) {
      return;
    }

    this._adaptWidthToParent = false;
    this._adaptWidthToChildren = value;
    this.markAsDirty();
  }

  public get adaptHeightToChildren() {
    return this._adaptHeightToChildren;
  }

  public set adaptHeightToChildren(value: boolean) {
    if (this._adaptHeightToChildren === value) {
      return;
    }

    this._adaptHeightToParent = false;
    this._adaptHeightToChildren = value;
    this.markAsDirty();
  }

  public get paddingLeft() {
    return this._padding[0] * this._scaleRatio;
  }

  public set paddingLeft(value: number) {
    if (this._padding[0] === value) {
      return;
    }

    this._padding[0] = value;
    this.markAsDirty();
  }

  public get paddingTop() {
    return this._padding[1] * this._scaleRatio;
  }

  public set paddingTop(value: number) {
    if (this._padding[1] === value) {
      return;
    }

    this._padding[1] = value;
    this.markAsDirty();
  }

  public get paddingRight() {
    return this._padding[2] * this._scaleRatio;
  }

  public set paddingRight(value: number) {
    if (this._padding[2] === value) {
      return;
    }

    this._padding[2] = value;
    this.markAsDirty();
  }

  public get paddingBottom() {
    return this._padding[3] * this._scaleRatio;
  }

  public set paddingBottom(value: number) {
    if (this._padding[3] === value) {
      return;
    }

    this._padding[3] = value;
    this.markAsDirty();
  }

  public get x() {
    return this._x * this._scaleRatio;
  }

  public set x(value: number) {
    const delta = Math.abs(this._x - value);

    if (delta < this._permissibleError) {
      return;
    }

    this._x = value;
    this.markAsDirty();
  }

  public get y() {
    return this._y * this._scaleRatio;
  }

  public set y(value: number) {
    const delta = Math.abs(this._y - value);

    if (delta < this._permissibleError) {
      return;
    }

    this._y = value;
    this.markAsDirty();
  }

  public calculatePivotX() {
    this.pivot.x = this.pivotX * this.w;
  }

  public calculatePivotY() {
    this.pivot.y = this.pivotY * this.h;
  }

  public get pivotX() {
    return this._pivotX;
  }

  public set pivotX(value: number) {
    if (this._pivotX === value) {
      return;
    }

    this._pivotX = value;
    this.markAsDirty();
  }

  public get pivotY() {
    return this._pivotY;
  }

  public set pivotY(value: number) {
    if (this._pivotY === value) {
      return;
    }

    this._pivotY = value;
    this.markAsDirty();
  }

  public get anchorX() {
    return this._anchorX;
  }

  public set anchorX(value: number) {
    if (this._anchorX === value) {
      return;
    }

    this._anchorX = value;
    this.markAsDirty();
  }

  public get anchorY() {
    return this._anchorY;
  }

  public set anchorY(value: number) {
    if (this._anchorY === value) {
      return;
    }

    this._anchorY = value;
    this.markAsDirty();
  }

  public get maskAutoScale() {
    return this._maskAutoScale;
  }

  public set maskAutoScale(value: boolean) {
    this._maskAutoScale = value;
  }

  public setHitArea(rect: Rectangle = new Rectangle()) {
    this._hitArea = rect;

    if (this._hitArea) {
      this._calculatedHitArea = this._hitArea.clone();
    } else {
      this._calculatedHitArea = undefined;
    }

    this.hitArea = this._calculatedHitArea;
    this.updateHitArea();
  }

  public get hitArea(): Rectangle {
    return super.hitArea as Rectangle;
  }

  public set hitArea(rectangle: IHitArea) {
    super.hitArea = rectangle;
  }

  protected updateHitArea() {
    if (!this._hitArea) {
      return;
    }

    this._calculatedHitArea.x = this._hitArea.x * this.scaleRatio;
    this._calculatedHitArea.y = this._hitArea.y * this.scaleRatio;
    this._calculatedHitArea.width = this._hitArea.width ? this._hitArea.width * this.scaleRatio : this.w;
    this._calculatedHitArea.height = this._hitArea.height ? this._hitArea.height * this.scaleRatio : this.height;

    this.onUpdateHitAreaCallback();
  }

  public addChild<U extends DisplayObject[]>(...children: U) {
    const child = super.addChild(...children);

    this.markAsDirty();
    this.link();

    return child;
  }

  public addChildAt<U extends DisplayObject>(child: U, index: number) {
    super.addChildAt(child, index);

    this.markAsDirty();
    this.link();

    return child;
  }

  /**
   * Update method, runs every frame.
   * If the control has been marked as dirty and it is not hidden, recalculate all dimensions and positions
   */
  public layout() {
    if (!this._isDirty) {
      return;
    }

    this._isDirty = false;

    const mask = this._mask as Sprite;

    if (mask && !mask.parent && this.parent) {
      this.parent.addChild(mask);
    }

    this.measure();

    if (!this._isDirty) {
      this.onAfterAllMeasuresCallback();
    }

    this.onLayoutCallback();
  }

  /**
   * Calculates the current size of the control and its position.
   */
  protected measure() {
    for (let i = 0; i < 2; i += 1) {
      const parent = this.parent as Control;

      this.scaleRatio = parent?.childrenScaleRatio || 1;

      let w = this._width * this._scaleSize * this._scaleRatio;
      let h = this._height * this._scaleSize * this._scaleRatio;

      if (this._adaptWidthToParent) {
        w = parent.w * this._widthPercent - parent.paddingLeft - parent.paddingRight || 0;
      }

      if (this._adaptHeightToParent) {
        h = parent.h * this._heightPercent - parent.paddingTop - parent.paddingBottom || 0;
      }

      this.w = UtilsMath.clamp(w, this.minWidth, this.maxWidth);
      this.h = UtilsMath.clamp(h, this.minHeight, this.maxHeight);

      let maxWidth = 0;
      let maxHeight = 0;

      for (const child of this.children) {
        if (child instanceof Control) {
          child.layout();

          this.applyChildPosition(child);

          child.calculatePivotX();
          child.calculatePivotY();

          if (child.visible) {
            if (!child.adaptWidthToParent) {
              maxWidth = Math.max(maxWidth, child.x + child.w + child.paddingLeft + child.paddingRight);
            }

            if (!child.adaptHeightToParent) {
              maxHeight = Math.max(maxHeight, child.y + child.h + child.paddingTop + child.paddingBottom);
            }
          }
        }
      }

      if (this._adaptWidthToChildren) {
        this.w = Math.max(maxWidth, this.minWidth);
      }

      if (this._adaptHeightToChildren) {
        this.h = Math.max(maxHeight, this.minHeight);
      }

      for (const child of this.children) {
        if (child instanceof Control) {
          if (child.adaptWidthToParent) {
            child.w = UtilsMath.clamp(
              this.w * child.widthPercent - this.paddingLeft - this.paddingRight,
              this.minWidth,
              this.maxWidth
            );
          }

          if (child.adaptHeightToParent) {
            child.h = UtilsMath.clamp(
              this.h * child.heightPercent - this.paddingTop - this.paddingBottom,
              this.minHeight,
              this.maxHeight
            );
          }
        }
      }
    }

    this.updateHitArea();
  }

  /**
   * Calculates and sets position for target child
   * @param child to update position
   */
  protected applyChildPosition(child: Control) {
    const childW = child.w + child.paddingLeft + child.paddingRight;
    const childH = child.h + child.paddingTop + child.paddingBottom;

    const originX = (this.w - childW) * child.originX;
    const originY = (this.h - childH) * child.originY;

    child.transform.position.x = child.x + (child.pivotX - child.anchorX) * child.w + child.paddingLeft + originX;
    child.transform.position.y = child.y + (child.pivotY - child.anchorY) * child.h + child.paddingTop + originY;
  }

  /**
   * Mark a control as dirty and with it all controls on the same level as it and all controls above it
   */
  public markAsDirty() {
    this._isDirty = true;

    if (this.parent && this.parent instanceof Control) {
      this.parent.markAsDirty();

      this.parent.children.forEach((child) => {
        (child as Control)._isDirty = true;
      });
    }
  }
}
