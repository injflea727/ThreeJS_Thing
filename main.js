import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

import {FirstPersonControls} from 'https://cdn.skypack.dev/three@0.136/examples/jsm/controls/FirstPersonControls.js';

function clamp(x, a, b) {
  return Math.min(Math.max(x, a), b);
}

class InputController{
  constructor() {
    this.Initialize_();
  }
  Initialize_(){
this.current_ = {
      leftbutton: false,
      rightbutton: false,
      mouseXDelta: 0,
      mouseYDelta: 0,
      mouseX: 0,
      mouseY: 0,
    };
    this.previous_ = null;
    this.keys_ = {};
    this.previousKeys_ = {};

    document.addEventListener('mousedown',(e) => this.onMouseDown_(e),false);
    document.addEventListener('mouseup',(e) => this.onMouseUp_(e),false);
    document.addEventListener('mousemove',(e) => this.onMouseMove_(e),false);
    document.addEventListener('keydown',(e) => this.onKeyDown_(e),false);
    document.addEventListener('keyup',(e) => this.onKeyUp_(e),false);
  }

    onMouseDown_(e){
    switch(e.button){
      case 0: {
        this.current_.leftbutton = true;
        break;
      }
      case 2: {
        this.current_.rightbutton = true;
        break;
      }
    }
  }

  onMouseUp_(e){
    switch(e.button){
      case 0: {
        this.current_.leftbutton = false;
        break;
      }
      case 2: {
        this.current_.rightbutton = false;
        break;
      }
    }
  }

  onMouseMove_(e) {
  this.current_.mouseX = e.pageX - window.innerWidth/2;
  this.current_.mouseY = e.pageY - window.innerHeight/2;

  if (this.previous_ === null) {
      this.previous_ ={...this.current_};
    }

    this.current_.mouseXDelta = this.current_.mouseX - this.previous_.mouseX;
    this.current_.mouseYDelta = this.current_.mouseY - this.previous_.mouseY;
  }

  onKeyDown_(e) {
    this.keys_[e.keyCode] = true;
  }

  onKeyUp_ (e) {
    this.keys_[e.keyCode] = true;
  }

  update_() {
    this.previous_ = {...this.current_};
  }
}

class FirstPersonCamera{
  constructor(camera){
    this.camera_ = camera;
    this.input_ = new InputController();
    this.rotation_ = new THREE.Quaternion();
    this.translation_ = new THREE.Vector3();
    this.phi_ = 0;

    this.theta_ = 0;
  }

  update_(timeElapsedS) {
    this.updadeRotation_(timeElapsedS);
    this.updateCamera_(timeElapsedS);
  }

  updateCamera_(_) {
    this.camera_.quaternion.copy(this.rotation_);
  }

  updateTranslation_(timeElapsedS){
    const forwardVelocity =  (this.input_.key(KEYS.w) ? 1 : 0) + (this.input_.key(KEYS.s) ? -1 : 0);
    const strafeVelocity =  (this.input_.key(KEYS.a) ? 1 : 0) + (this.input_.key(KEYS.d) ? -1 : 0);

    const qx = new THREE.Quaternion();
    qx.setFromAxisAngle(new THREE.Vector3(0,1,0), this.phi_);

    const forward = new THREE.Vector3(0,0,-1);
    forward.applyQuaternion(qx);
    forward.multiplyScalar(forwardVelocity * timeElapsedS * 10);

    const left = new THREE.Vector3(-1,0,0);
    left.applyQuaternion(qx);
    left.multiplyScalar(strafeVelocity * timeElapsedS * 10);

    this.translation_.add(forward);
    this.translation_.add(left);
  }

  updadeRotation_(timeElapsedS){
    const xh = this.input_.current_.mouseXDelta / window.innerWidth;
    const yh = this.input_.current_.mouseYDelta / window.innerHeight;
    this.phi_ += -xh * 5; 
    this.theta_ = clamp(this.theta_ + -yh * 5, Math.PI / 3, Math.PI / 3);

    const qx = new THREE.Quaternion();
    qx.setFromAxisAngle(new THREE.Vector3(0,1,0), this.phi_);
    const qz = new THREE.Quaternion();
    qz.setFromAxisAngle(new THREE.Vector3(1,0,0), this.theta_);

    const q = new THREE.Quaternion();
    q.multiply(qx);
    q.multiply(qz);
    
    this.rotation_.copy(q);
  }
}

class BasicCharacterController {
  constructor(params) {
    this._Init(params);
  }

  _Init(params) {
    this._params = params;
    this._LoadModels();
  }

  _LoadModels() {
  const boxGeometry = new THREE.BoxGeometry(2, 2, 2);
  const material = new THREE.MeshStandardMaterial({color: 0x000000,});
  this._target = new THREE.Mesh(boxGeometry,material);
  this._target.scale.setScalar(1);
  this._target.traverse(c => { c.castShadow = true;});
    this._params.scene.add(this._target);
    this._target.position.set(0,1,0);
  }
};

class CharacterControllerDemo {
  constructor() {
    this._Initialize();
  }
    
  _Initialize() {
    this.InitializeDemo_();
    this.InitializeRender_();
    this.InitializeLights_();
    this.InitializeScene_();

    this._previousRAF = null;
    this._OnWindowResize();
    this._RAF();
  }
    InitializeDemo_() {
      this.fpsCamera_ = new FirstPersonCamera(this.camera_);
    }

    InitializeRender_(){
    this._threejs = new THREE.WebGLRenderer({
      antialias: true,
    });
    
    this._threejs.outputEncoding = THREE.sRGBEncoding;
    this._threejs.shadowMap.enabled = true;
    this._threejs.shadowMap.type = THREE.PCFSoftShadowMap;
    this._threejs.setPixelRatio(window.devicePixelRatio);
    this._threejs.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(this._threejs.domElement);

    window.addEventListener('resize', () => {
      this._OnWindowResize();
    }, false);

    const fov = 60;
    const aspect = 1920 / 1080;
    const near = 1.0;
    const far = 1000.0;
    this.camera_ = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this.camera_.position.set(10, 2, 10);

    this._scene = new THREE.Scene();

    this.uiCamera_ = new THREE.OrthographicCamera(
      -1, 1, 1 * aspect, -1 * aspect, 1, 1000);
    this.uiScene_ = new THREE.Scene();
    }

    InitializeLights_() {
    let light = new THREE.DirectionalLight(0xFFFFFF, 1.0);
    light.position.set(-100, 100, 100);
    light.target.position.set(0, 0, 0);
    light.castShadow = true;
    light.shadow.bias = -0.001;
    light.shadow.mapSize.width = 4096;
    light.shadow.mapSize.height = 4096;
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = 500.0;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 500.0;
    light.shadow.camera.left = 50;
    light.shadow.camera.right = -50;
    light.shadow.camera.top = 50;
    light.shadow.camera.bottom = -50;
    this._scene.add(light);
    
    light = new THREE.AmbientLight(0xFFFFFF, 0.25);
    this._scene.add(light);
    }

    InitializeScene_(){
    const loader = new THREE.CubeTextureLoader();
    const texture = loader.load([
        './resources/posx.jpg',
        './resources/negx.jpg',
        './resources/posy.jpg',
        './resources/negy.jpg',
        './resources/posz.jpg',
        './resources/negz.jpg',
    ]);
    texture.encoding = THREE.sRGBEncoding;
    this._scene.background = texture;

    const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(100, 100, 10, 10),
        new THREE.MeshStandardMaterial({color: 0x808080,}));
    plane.castShadow = false;
    plane.receiveShadow = true;
    plane.rotation.x = -Math.PI / 2;
    this._scene.add(plane);

    const hotel = new THREE.Mesh(
      new THREE.BoxGeometry(35,75,35),
    new THREE.MeshStandardMaterial({color: 0x418782, }));

    hotel.castShadow = false;
    hotel.receiveShadow = true;
    hotel.position.set(40,37,0); 
    this._scene.add(hotel);

    const teleport = new THREE.Mesh(
      new THREE.BoxGeometry(10,10,10),
    new THREE.MeshStandardMaterial({color: 0x000000, }));
    teleport.position.set(23,5,0); 
    this._scene.add(teleport);
    }

  _OnWindowResize() {
    this.camera_.aspect = window.innerWidth / window.innerHeight;
    this.camera_.updateProjectionMatrix();
    this._threejs.setSize(window.innerWidth, window.innerHeight);
  }

  _RAF() {
    requestAnimationFrame((t) => {
      if (this._previousRAF === null) {
        this._previousRAF = t;
      }
      this._Step(t - this._previousRAF);
      this.threejs_.autoClear = true;
      this._threejs.render(this._scene, this.camera_);
      this.threejs_.autoClear = false;
      this._threejs.render(this.uiScene_, this.uiCamera_);
      this._previousRAF = t;
      this._RAF();
    });
  }

  _Step(timeElapsed) {
    const timeElapsedS = timeElapsed * 0.001;

      //this._controls.Update(timeElapsedS);
      this.fpsCamera_.Update(timeElapsedS);
  }
}

let _APP = null;

window.addEventListener('DOMContentLoaded', () => {
  _APP = new CharacterControllerDemo();
});