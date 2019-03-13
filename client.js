/**
 * The examples provided by Oculus are for non-commercial testing and
 * evaluation purposes only.
 *
 * Oculus reserves all rights not expressly granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NON INFRINGEMENT. IN NO EVENT SHALL
 * OCULUS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN
 * AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * Example ReactVR app that allows a simple tour using linked 360 photos.
 */
import {VRInstance, Module} from 'react-vr-web';

import DOMOverlayModule from '../src/domoverlay/DOMOverlayModule';
import VrAwareRayCaster from './VrAwareRayCaster';
import '../src/util/process-env';

const options = {};
location.search.substr(1).split('&').forEach(function(item) {
  options[item.split('=')[0]] = item.split('=')[1];
});

function init(bundle, parent, options) {
  const persistentOverlayContainer = document.createElement('div');
  persistentOverlayContainer.id = 'persistent-overlay';
  const domOverlayContainer = document.createElement('div');
  domOverlayContainer.id = 'dom-overlay';

  const domOverlayModule = new DOMOverlayModule();

  const editorModule = new TourEditorModule();
  const controlModule = new ControlModule();
  const raycasterControllerModule = new RaycasterControllerModule();

  const raycaster = new VrAwareRayCaster();

  const vr = new VRInstance(bundle, 'BritishMuseumTour', parent, {
    allowCarmelDeeplink: true,
    antialias: true,
    // Show a gaze cursor.
    cursorVisibility: 'visible',
    hideFullscreen: true,
    nativeModules: [editorModule, controlModule, domOverlayModule, raycasterControllerModule],
    raycasters: [raycaster],
    ...options,
  });

  // Inject DOM overlay component inside OVRUI player's _wrapper
  // element so it shows up in full screen too.
  vr.player._wrapper.appendChild(domOverlayContainer);
  vr.player._wrapper.appendChild(persistentOverlayContainer);

  vr.render = function() {
    // Any custom behavior you want to perform on each frame goes here
  };

  // Start the editor module to allow communication with the separate
  // 2D react editor application.
  editorModule.init(vr);

  // and the control module to enable/disable mouse panning contols
  controlModule.init(vr);

  // and the module responsible for handling dom overlays.
  domOverlayModule.init(domOverlayContainer, persistentOverlayContainer, vr.rootView.context);

  // and the module responsible for controlling the raycaster.
  raycasterControllerModule.init(raycaster);

  // Begin the animation loop
  vr.start();
  return vr;
}

export class ControlModule extends Module {
  constructor() {
    super('ControlModule');

    this.startLocation = options.start;
  }

  init(vr) {
    this.vr = vr;
  }

  enablePanning() {
    this.vr.player.controls.nonVRControls.connect();
  }

  disablePanning() {
    this.vr.player.controls.nonVRControls.disconnect();
  }
}

export class RaycasterControllerModule extends Module {
  constructor() {
    super('RaycasterControllerModule');
  }

  init(raycaster) {
    this.raycaster = raycaster;
  }

  disable() {
    this.raycaster.disable();
  }

  enable() {
    this.raycaster.enable();
  }
}

// TourEditorModule
// Allows communication between the tour and the editor
export class TourEditorModule extends Module {
  constructor() {
    super('TourEditorModule');
  }

  init(vr) {
    this.vr = vr;
    window.addEventListener('message', this.recvMsg.bind(this), false);
  }

  //-------------------------------------------
  // Receive messages from parent editor window
  //-------------------------------------------
  recvMsg(msg) {
    console.log('recvMsg:', msg);
    // Forward messages to the window to the event emitter
    this.vr.rootView.context.callFunction('RCTDeviceEventEmitter', 'emit', [msg.data]);
  }

  //-------------------------------------------
  // Send messages to the editor window
  //-------------------------------------------
  postMessageToEditor(msg) {
    if (window.parent !== window) {
      window.parent.postMessage(msg, '*');
    }
  }

  addHotspot(yaw, pitch) {
    this.postMessageToEditor(['addHotspot', [yaw, pitch]]);
  }

  sendJsonToEditor(json) {
    this.postMessageToEditor(['jsonData', json]);
  }

  setActivePano(pano) {
    this.postMessageToEditor(['setActivePano', pano]);
  }

  informOrientation(yaw, pitch) {
    this.postMessageToEditor(['orientationUpdate', [yaw, pitch]]);
  }
}

window.ReactVR = {init};
