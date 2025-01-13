import { CheckboxControl } from './checkbox-control';
import { ImageControl } from './image-control';

/**
 * Checkbox with two ImageControls
 * @example
   const checkbox = new CheckboxImageControl();
   checkbox.adaptWidthToChildren = true;
   checkbox.adaptHeightToChildren = true;
   this.addChild(checkbox);

   const nonCheckedImage = new ImageControl('elements/Toggle_on_Green');
   nonCheckedImage.autoScale = true;
   checkbox.nonCheckedImage = nonCheckedImage;

   const checkedImage = new ImageControl('elements/Toggle_off');
   checkedImage.autoScale = true;
   checkbox.checkedImage = checkedImage;
 */
export class CheckboxImageControl extends CheckboxControl {
  /**
   * Displayed when state isChecked = false
   */
  private _nonCheckedImage: ImageControl;

  /**
   * Displayed when state isChecked = true
   */
  private _checkedImage: ImageControl;

  public set nonCheckedImage(image: ImageControl) {
    this._nonCheckedImage?.removeFromParent();

    this._nonCheckedImage = image;
    this._nonCheckedImage.visible = !this._isChecked;
    this.addChild(this._nonCheckedImage);
  }

  public set checkedImage(image: ImageControl) {
    this._checkedImage?.removeFromParent();

    this._checkedImage = image;
    this._checkedImage.visible = this._isChecked;
    this.addChild(this._checkedImage);
  }

  protected onChecked() {
    if (!this._nonCheckedImage || !this._checkedImage) {
      return;
    }

    this._nonCheckedImage.visible = !this._isChecked;
    this._checkedImage.visible = this._isChecked;
  }
}
