import {RayCaster, MouseRayCaster} from 'ovrui';

const ORIGIN = [0, 0, 0];
const NEGATIVE_Z = [0, 0, -1];

export default class VrAwareRayCaster extends RayCaster {
  constructor(options = {}) {
    super();

    // Default to using gaze cursor in VR only.
    this._useOnMobile = options.hasOwnProperty('useOnMobile') ? options.useOnMobile : false;
    this._active = this._useOnMobile;
    this._mouseRayCaster = new MouseRayCaster();

    // If not using on mobile, toggle active/inactive when entering/leaving VR.
    if (!this._useOnMobile) {
      window.addEventListener('vrdisplaypresentchange', e => {
        this._active = e.display.isPresenting;
      });
    }
  }

  disable() {
    if (this._active) this._active = false;
  }

  enable() {
    if (!this._active) this._active = true;
  }

  getType() {
    return 'gaze';
  }

  getRayOrigin(camera) {
    if (!this._active) {
      return this._mouseRayCaster.getRayOrigin(camera);
    }
    return ORIGIN;
  }

  getRayDirection(camera) {
    if (!this._active) {
      return this._mouseRayCaster.getRayDirection(camera);
    }
    return NEGATIVE_Z;
  }

  drawsCursor() {
    return this._active;
  }
}
