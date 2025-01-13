import { ButtonControl } from './button-control';

/**
 * A basic checkbox class whose only task is to toggle the isChecked state
 */
export class CheckboxControl extends ButtonControl {
  protected _isChecked: boolean = false;

  public get checked() {
    return this._isChecked;
  }

  public set checked(value: boolean) {
    if (this._isChecked === value) {
      return;
    }

    this._isChecked = value;
    this.onChecked();
  }

  protected onChecked() {
    for (const child of this.children) {
      if (child instanceof CheckboxControl) {
        child.checked = this._isChecked;
      }
    }
  }
}
