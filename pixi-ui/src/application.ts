import { Application} from 'pixi.js';
import { Control } from './common/control';

class App {
  private readonly _application: Application;

  private _uiLayer: Control;

  public constructor() {
    this._application = new Application({
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0x5dc729,
      resolution: window.devicePixelRatio,
      resizeTo: window,
      antialias: false,
    });

    this._application.stage.eventMode = 'static';

    this.addUI();
    this._application.renderer.on('resize', this.onResize);
    this.onResize();
  }

  private addUI() {
    this._uiLayer = new Control();
    this._uiLayer.host = this._uiLayer;
    this._uiLayer.ticker = this._application.ticker;
    this._uiLayer.sortableChildren = true;
    this._application.stage.addChild(this._uiLayer);

    this._application.ticker.add(() => this._uiLayer.layout());
  }

  private onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this._uiLayer.width = width;
    this._uiLayer.height = height;

    const wratio = width / 1920;
    const hratio = height / 1080;
    const ratio = wratio < hratio ? wratio : hratio;

    this._uiLayer.childrenScaleRatio = Math.round(ratio * 100) / 100;
  }
}

new App();
