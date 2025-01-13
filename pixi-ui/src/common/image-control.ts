import { Graphics, Matrix, Mesh, NineSlicePlane, Point, Sprite, Texture, Assets } from 'pixi.js';
import { Control } from './control';

export enum ImageControlType {
  SPRITE,
  SLICE9,
  TILE_SPRITE,
}

/**
 * Control with a sprite / 9slice / graphics.
 * Allows you to set 3 types of textures and tinting: out, hover and disabled
 * @example
   Sprite:
   const image = new ImageControl('icons/close_icon_big', ImageControlType.SPRITE);
   image.autoScale = true; // sprite can force its control to adapt its size
   this.addChild(image);

   9Slice:
   const image = new ImageControl('icons/close_icon_big', ImageControlType.SLICE9);
   image.set9SlicePaddings(lW, tH, rW, bH) // manual setting of the paddings
   this.addChild(image);

   Tile Sprite:
   const image = new ImageControl('icons/close_icon_big', ImageControlType.TILE_SPRITE);
   image.tileScale = 2;
   this.addChild(image);
 */
export class ImageControl extends Control {
  protected readonly _image: Sprite | Mesh | Graphics;

  /**
   * Default sprite's texture
   */
  protected _outTexture: Texture = Texture.WHITE;

  protected _outTextureName: string;

  private _outTint: number = 0xffffff;

  /**
   * Set to sprite if control is hover
   */
  protected _hoverTexture: Texture;

  private _hoverTextureName: string;

  private _hoverTint: number;

  /**
   * Set to sprite if control is disabled
   */
  protected _disabledTexture: Texture;

  private _disabledTextureName: string;

  private _disabledTint: number;

  private _flipX = false;

  private _flipY = false;

  /**
   * A boolean indicating if the sprite can force its control to adapt its size
   */
  protected _autoScale = false;

  /**
   * A boolean indicating whether the component should automatically set paddings to 9slice
   */
  private _autoPaddings = false;

  /**
   * The transformation matrix applied to the graphics
   */
  private _tileMatrix: Matrix;

  private _tileScale: number = 1;

  /**
   * @param textureName texture name
   * @param type image type
   */
  public constructor(textureName?: string, type: ImageControlType = ImageControlType.SPRITE) {
    super();

    switch (type) {
      case ImageControlType.SLICE9:
        this._image = new NineSlicePlane(this._outTexture);
        this._autoPaddings = true;

        break;
      case ImageControlType.TILE_SPRITE:
        this._image = new Graphics();
        this._tileMatrix = new Matrix();

        break;
      default:
        this._image = new Sprite(this._outTexture);

        break;
    }

    this.addChild(this._image);

    this.texture = textureName;
  }

  public set tint(value: number) {
    this._outTint = value;

    this.checkTint();
  }

  public get tint() {
    return this._outTint;
  }

  public set hoverTint(value: number) {
    this._hoverTint = value;

    this.checkTint();
  }

  public set disabledTint(value: number) {
    this._disabledTint = value;

    this.checkTint();
  }

  protected get outTextureName() {
    return this._outTextureName;
  }

  public set texture(textureName: string) {
    if (this._outTextureName === textureName || !textureName) {
      return;
    }

    this._outTextureName = textureName;

    this.setUpTexture(textureName);
  }

  public set hoverTexture(textureName: string) {
    if (this._hoverTextureName === textureName || !textureName) {
      return;
    }

    this._hoverTextureName = textureName;

    this.setUpHoverTexture(textureName);
  }

  public set disabledTexture(textureName: string) {
    if (this._disabledTextureName === textureName || !textureName) {
      return;
    }

    this._disabledTextureName = textureName;

    this.setUpDisabledTexture(textureName);
  }

  public get flipX(): boolean {
    return this._flipX;
  }

  public set flipX(v: boolean) {
    this._flipX = v;
    this.onWidthUpdate(this.w);
  }

  public get flipY(): boolean {
    return this._flipY;
  }

  public set flipY(v: boolean) {
    this._flipY = v;
    this.onHeightUpdate(this.h);
  }

  protected async setUpTexture(textureName: string) {
    const texture = await Assets.get<Texture>(textureName);

    if (this._outTextureName === textureName) {
      this._outTexture = texture;

      this.checkState();
    }
  }

  private async setUpHoverTexture(textureName: string) {
    const texture = await Assets.get<Texture>(textureName);

    if (this._hoverTextureName === textureName) {
      this._hoverTexture = texture;

      this.checkState();
    }
  }

  private async setUpDisabledTexture(textureName: string) {
    const texture = await Assets.get<Texture>(textureName);

    if (this._disabledTextureName === textureName) {
      this._disabledTexture = texture;

      this.checkState();
    }
  }

  public set autoScale(value: boolean) {
    this._autoScale = value;
    this._adaptWidthToParent = false;
    this._adaptHeightToParent = false;

    this.checkAutoScale();
  }

  public set9SlicePaddings(leftWidth?: number, topHeight?: number, rightWidth?: number, bottomHeight?: number) {
    this._autoPaddings = false;

    const slice9 = this._image as NineSlicePlane;

    if (leftWidth !== undefined) {
      slice9.leftWidth = leftWidth;
    }

    if (topHeight !== undefined) {
      slice9.topHeight = topHeight;
    }

    if (rightWidth !== undefined) {
      slice9.rightWidth = rightWidth;
    }

    if (bottomHeight !== undefined) {
      slice9.bottomHeight = bottomHeight;
    }
  }

  public onHover() {
    this._isPointerHover = true;

    this.checkState();
  }

  public onOut() {
    this._isPointerHover = false;

    this.checkState();
  }

  protected checkEnabled() {
    this.checkState();
  }

  private checkState() {
    let texture: Texture;

    if (this.destroyed) {
      return;
    }

    if (!this._isEnabled) {
      texture = this._disabledTexture || this._outTexture;
    } else if (this._isPointerHover) {
      texture = this._hoverTexture || this._outTexture;
    } else {
      texture = this._outTexture;
    }

    if (this._image instanceof Graphics) {
      if (this._image.fill.texture !== texture) {
        this._image.fill.texture = texture;
        this.updateGraphics();
      }
    } else if (this._image.texture !== texture) {
      this._image.texture = texture;
    }

    this.checkTint();
    this.checkAutoScale();
    this.checkPaddings();
  }

  private checkTint() {
    if (!this._isEnabled) {
      this._image.tint = this._disabledTint !== undefined ? this._disabledTint : this._outTint;
    } else if (this._isPointerHover) {
      this._image.tint = this._hoverTint !== undefined ? this._hoverTint : this._outTint;
    } else {
      this._image.tint = this._outTint;
    }
  }

  protected checkAutoScale() {
    if (this._autoScale) {
      let texture: Texture;

      if (this._image instanceof Graphics) {
        texture = this._image.fill.texture;
      } else {
        texture = this._image.texture;
      }

      this.width = texture.width;
      this.height = texture.height;
    }
  }

  private checkPaddings() {
    if (this._autoPaddings) {
      const slice9 = this._image as NineSlicePlane;

      slice9.leftWidth = Math.floor(slice9.texture.width / 2) - 1;
      slice9.rightWidth = Math.floor(slice9.texture.width / 2) - 1;
      slice9.topHeight = Math.floor(slice9.texture.height / 2) - 1;
      slice9.bottomHeight = Math.floor(slice9.texture.height / 2) - 1;
    }
  }

  public set tileScale(value: number) {
    if (this._image instanceof Graphics) {
      if (!this._tileMatrix) {
        this._tileMatrix = new Matrix();
      }

      this._tileScale = value;
      this._tileMatrix.scale(value, value);

      this.updateGraphics();
    }
  }

  public set tileOffset(offset: Point) {
    if (this._image instanceof Graphics) {
      if (!this._tileMatrix) {
        this._tileMatrix = new Matrix();
      }

      this._tileMatrix.translate(offset.x, offset.y);

      this.updateGraphics();
    }
  }

  protected updateGraphics() {
    const graphics = this._image as Graphics;

    const { texture } = graphics.fill;

    if (texture === Texture.WHITE) {
      return;
    }

    this._tileMatrix.set(
      this._tileScale * this.scaleRatio,
      this._tileMatrix.b,
      this._tileMatrix.c,
      this._tileScale * this.scaleRatio,
      this._tileMatrix.tx,
      this._tileMatrix.ty
    );

    graphics.clear();
    graphics.beginTextureFill({ texture, matrix: this._tileMatrix });
    graphics.drawRect(0, 0, this.w, this.h);

    graphics.fill.texture = texture;
  }

  protected onScaleUpdate(scaleRatio: number) {
    if (this._image instanceof NineSlicePlane) {
      this._image.scale.set(scaleRatio);
    }
  }

  protected onWidthUpdate(width: number) {
    if (this._image instanceof NineSlicePlane) {
      this._image.width = width / this._scaleRatio / this._invertScaleRatio;
    } else if (this._image instanceof Graphics) {
      this.updateGraphics();
    } else {
      (this._image as Sprite).width = width;
    }

    if (this._flipX) {
      this._image.scale.x = -Math.abs(this._image.scale.x);
      this._image.x = this._image.width;
    } else {
      this._image.scale.x = Math.abs(this._image.scale.x);
      this._image.x = 0;
    }
  }

  protected onHeightUpdate(height: number) {
    if (this._image instanceof NineSlicePlane) {
      this._image.height = height / this._scaleRatio / this._invertScaleRatio;
    } else if (this._image instanceof Graphics) {
      this.updateGraphics();
    } else {
      (this._image as Sprite).height = height;
    }

    if (this._flipY) {
      this._image.scale.y = -Math.abs(this._image.scale.y);
      this._image.y = this._image.height;
    } else {
      this._image.scale.y = Math.abs(this._image.scale.y);
      this._image.y = 0;
    }
  }
}
