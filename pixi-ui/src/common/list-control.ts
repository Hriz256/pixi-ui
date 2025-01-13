import { Control } from './control';
import { IScrollable } from './interfaces/scrollable-interface';

/**
 * List of controls.
 * Sequentially places children one after the other with a spacing
 * @example
   const list = new ListControl();
   list.isVertical = false;
   list.spacing = 20;
   this.addChild(list);
 */
export class ListControl extends Control implements IScrollable {
  protected _adaptWidthToChildren: boolean = true;

  protected _adaptHeightToChildren: boolean = true;

  protected _adaptWidthToParent: boolean = false;

  protected _adaptHeightToParent: boolean = false;

  /**
   * A boolean indicating if the stack panel is vertical or horizontal
   */
  private _isVertical: boolean = true;

  /**
   * The spacing (in pixels) between each child.
   */
  private _spacing: number = 0;

  public get isVertical(): boolean {
    return this._isVertical;
  }

  public set isVertical(value: boolean) {
    if (this._isVertical === value) {
      return;
    }

    this._isVertical = value;
    this.markAsDirty();
  }

  public get spacing(): number {
    return this._spacing;
  }

  public set spacing(value: number) {
    if (this._spacing === value) {
      return;
    }

    this._spacing = value;
    this.markAsDirty();
  }

  /**
   * Returns all visible controls
   */
  protected get visibleChildren() {
    return this.children.filter((child) => {
      return child instanceof Control && child.visible;
    }) as Control[];
  }

  protected measure() {
    const children = this.visibleChildren;
    const childrenCount = children.length;

    const parent = this.parent as Control;
    let offset = 0;
    let maxW = 0;
    let maxH = 0;

    if (this._isVertical) {
      if (!this._adaptWidthToParent && !this._adaptWidthToChildren) {
        this.w = this._width * this.scaleRatio;
      } else if (this._adaptWidthToParent) {
        this.w = parent.w - parent.paddingLeft - parent.paddingRight || 0;
      }
    }

    if (!this._isVertical) {
      if (!this._adaptHeightToParent && !this._adaptHeightToChildren) {
        this.h = this._height * this.scaleRatio;
      } else if (this._adaptHeightToParent) {
        this.h = parent.h - parent.paddingTop - parent.paddingBottom || 0;
      }
    }

    this.scaleRatio = parent?.childrenScaleRatio || 1;

    for (let i = 0; i < childrenCount; i += 1) {
      const child = children[i];

      child.layout();

      const spacing = this._spacing * this.scaleRatio * this.invertScaleRatio;
      const deltaPivotX = (child.pivotX - child.anchorX) * child.w;
      const deltaPivotY = (child.pivotY - child.anchorY) * child.h;

      child.calculatePivotX();
      child.calculatePivotY();

      if (this._isVertical) {
        const originX = (this.w - (child.w + child.paddingLeft + child.paddingRight)) * child.originX;
        child.transform.position.x = deltaPivotX + child.paddingLeft + originX;
        child.transform.position.y = deltaPivotY + offset + child.paddingTop;

        offset += child.h + child.paddingTop + child.paddingBottom + (i < childrenCount - 1 ? spacing : 0);
        maxW = Math.max(maxW, child.w + child.paddingLeft + child.paddingRight);
      } else {
        const originY = (this.h - (child.h + child.paddingTop + child.paddingBottom)) * child.originY;
        child.transform.position.x = deltaPivotX + offset + child.paddingLeft;
        child.transform.position.y = deltaPivotY + child.paddingTop + originY;

        offset += child.w + child.paddingLeft + child.paddingRight + (i < childrenCount - 1 ? spacing : 0);
        maxH = Math.max(maxH, child.h + child.paddingTop + child.paddingBottom);
      }
    }

    if (this._isVertical) {
      this.h = offset;

      if (this._adaptWidthToChildren) {
        this.w = maxW;
      }
    } else {
      this.w = offset;

      if (this._adaptHeightToChildren) {
        this.h = maxH;
      }
    }
  }

  /**
   * Returns a child by index
   */
  public getChildByIndex(index: number) {
    return this.visibleChildren[index];
  }
}
