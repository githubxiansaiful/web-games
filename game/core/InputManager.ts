export class InputManager {
  public keys: { [key: string]: boolean } = {};
  public justPressed: { [key: string]: boolean } = {};
  public justReleased: { [key: string]: boolean } = {};

  public mouseDeltaX: number = 0;
  public mouseDeltaY: number = 0;
  public isPointerLocked: boolean = false;

  public mouseButtons: { [btn: number]: boolean } = {};
  public mouseButtonsJustPressed: { [btn: number]: boolean } = {};

  // Virtual mobile joystick/button inputs
  public virtualForward: number = 0;
  public virtualRight: number = 0;
  public virtualSprint: boolean = false;
  public virtualJump: boolean = false;
  public virtualActionF: boolean = false;
  public virtualActionE: boolean = false;
  public virtualShoot: boolean = false;
  public virtualAim: boolean = false;

  private domElement: HTMLElement | null = null;
  private boundKeyDown: (e: KeyboardEvent) => void;
  private boundKeyUp: (e: KeyboardEvent) => void;
  private boundMouseMove: (e: MouseEvent) => void;
  private boundMouseDown: (e: MouseEvent) => void;
  private boundMouseUp: (e: MouseEvent) => void;
  private boundPointerLockChange: () => void;
  private boundBlur: () => void;

  constructor() {
    this.boundKeyDown = this.onKeyDown.bind(this);
    this.boundKeyUp = this.onKeyUp.bind(this);
    this.boundMouseMove = this.onMouseMove.bind(this);
    this.boundMouseDown = this.onMouseDown.bind(this);
    this.boundMouseUp = this.onMouseUp.bind(this);
    this.boundPointerLockChange = this.onPointerLockChange.bind(this);
    this.boundBlur = this.onBlur.bind(this);
  }

  public attach(element: HTMLElement): void {
    this.domElement = element;

    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);
    window.addEventListener('blur', this.boundBlur);

    element.addEventListener('mousedown', this.boundMouseDown);
    window.addEventListener('mouseup', this.boundMouseUp);
    window.addEventListener('mousemove', this.boundMouseMove);
    document.addEventListener('pointerlockchange', this.boundPointerLockChange);
  }

  public detach(): void {
    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('keyup', this.boundKeyUp);
    window.removeEventListener('blur', this.boundBlur);

    if (this.domElement) {
      this.domElement.removeEventListener('mousedown', this.boundMouseDown);
    }
    window.removeEventListener('mouseup', this.boundMouseUp);
    window.removeEventListener('mousemove', this.boundMouseMove);
    document.removeEventListener('pointerlockchange', this.boundPointerLockChange);

    this.exitPointerLock();
  }

  public requestPointerLock(): void {
    if (this.domElement && !document.pointerLockElement) {
      this.domElement.requestPointerLock?.();
    }
  }

  public exitPointerLock(): void {
    if (document.pointerLockElement) {
      document.exitPointerLock?.();
    }
  }

  public update(): void {
    // Reset frame-specific single-trigger flags
    this.justPressed = {};
    this.justReleased = {};
    this.mouseButtonsJustPressed = {};
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;
    this.virtualActionF = false;
    this.virtualActionE = false;
    this.virtualJump = false;
  }

  private onKeyDown(e: KeyboardEvent): void {
    const code = e.code;
    if (!this.keys[code]) {
      this.justPressed[code] = true;
    }
    this.keys[code] = true;

    // Prevent scrolling with Space / Arrow keys in game
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)) {
      e.preventDefault();
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    const code = e.code;
    this.keys[code] = false;
    this.justReleased[code] = true;
  }

  private onMouseMove(e: MouseEvent): void {
    if (document.pointerLockElement === this.domElement) {
      this.mouseDeltaX += e.movementX || 0;
      this.mouseDeltaY += e.movementY || 0;
    }
  }

  private onMouseDown(e: MouseEvent): void {
    if (!this.mouseButtons[e.button]) {
      this.mouseButtonsJustPressed[e.button] = true;
    }
    this.mouseButtons[e.button] = true;

    // Request pointer lock on canvas left-click
    if (e.button === 0 && !document.pointerLockElement) {
      this.requestPointerLock();
    }
  }

  private onMouseUp(e: MouseEvent): void {
    this.mouseButtons[e.button] = false;
  }

  private onPointerLockChange(): void {
    this.isPointerLocked = document.pointerLockElement === this.domElement;
  }

  private onBlur(): void {
    this.keys = {};
    this.mouseButtons = {};
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;
  }

  // Helper querying methods
  public isDown(code: string): boolean {
    return !!this.keys[code];
  }

  public wasJustPressed(code: string): boolean {
    return !!this.justPressed[code];
  }

  public isMouseDown(button: number): boolean {
    return !!this.mouseButtons[button];
  }

  public wasMouseJustPressed(button: number): boolean {
    return !!this.mouseButtonsJustPressed[button];
  }

  // Composite movement axes
  public getForwardAxis(): number {
    let val = 0;
    if (this.isDown('KeyW') || this.isDown('ArrowUp')) val += 1;
    if (this.isDown('KeyS') || this.isDown('ArrowDown')) val -= 1;
    if (this.virtualForward !== 0) val += this.virtualForward;
    return Math.max(-1, Math.min(1, val));
  }

  public getRightAxis(): number {
    let val = 0;
    if (this.isDown('KeyD') || this.isDown('ArrowRight')) val += 1;
    if (this.isDown('KeyA') || this.isDown('ArrowLeft')) val -= 1;
    if (this.virtualRight !== 0) val += this.virtualRight;
    return Math.max(-1, Math.min(1, val));
  }

  public isSprinting(): boolean {
    return this.isDown('ShiftLeft') || this.isDown('ShiftRight') || this.virtualSprint;
  }

  public isJumping(): boolean {
    return this.wasJustPressed('Space') || this.virtualJump;
  }

  public isInteractingF(): boolean {
    return this.wasJustPressed('KeyF') || this.virtualActionF;
  }

  public isInteractingE(): boolean {
    return this.wasJustPressed('KeyE') || this.virtualActionE;
  }

  public isReloading(): boolean {
    return this.wasJustPressed('KeyR');
  }

  public isAiming(): boolean {
    return this.isMouseDown(2) || this.virtualAim;
  }

  public isShooting(): boolean {
    return this.isMouseDown(0) || this.virtualShoot;
  }
}
