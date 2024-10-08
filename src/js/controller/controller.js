import { Controls, MathUtils, Spherical, Vector3 } from 'three';

const _lookDirection = new Vector3();
const _spherical = new Spherical();
const _target = new Vector3();
const _targetPosition = new Vector3();

class TouchController extends Controls {
	constructor(object, domElement = null) {
		super(object, domElement);

		this._moves = document.querySelectorAll('.move');
		this._pan = document.querySelectorAll('.pan');

		// API

		this.movementSpeed = 1.0;
		this.lookSpeed = 0.005;

		this.lookVertical = true;
		this.autoForward = false;

		this.activeLook = true;

		this.heightSpeed = false;
		this.heightCoef = 1.0;
		this.heightMin = 0.0;
		this.heightMax = 1.0;

		this.constrainVertical = false;
		this.verticalMin = 0;
		this.verticalMax = Math.PI;

		// internals

		this._autoSpeedFactor = 0.0;

		this._moveForward = false;
		this._moveBackward = false;
		this._moveLeft = false;
		this._moveRight = false;

		this._lookLeft = false;
		this._lookRight = false;

		this._viewHalfX = 0;
		this._viewHalfY = 0;

		this._lat = 0;
		this._lon = 0;

		// event listeners
		this._onTouchStart = onTouchStart.bind(this);
		this._onTouchEnd = onTouchEnd.bind(this);

		if (domElement !== null) {
			this.connect();

			this.handleResize();
		}

		this._setOrientation();
	}

	connect() {
		this._moves.forEach((move) => {
			move.addEventListener('touchstart', this._onTouchStart);
		});
		this._moves.forEach((move) => {
			move.addEventListener('touchend', this._onTouchEnd);
		});
		this._pan.forEach((pan) => {
			pan.addEventListener('touchstart', this._onTouchStart);
		});
		this._pan.forEach((pan) => {
			pan.addEventListener('touchend', this._onTouchEnd);
		});
	}

	disconnect() {
		this._moves.removeEventListener('touchstart', this._onTouchStart);
		this._moves.removeEventListener('touchend', this._onTouchEnd);
		this._pan.removeEventListener('touchstart', this._onTouchStart);
		this._pan.removeEventListener('touchend', this._onTouchEnd);
	}

	dispose() {
		this.disconnect();
	}

	handleResize() {
		if (this.domElement === document) {
			this._viewHalfX = window.innerWidth / 2;
			this._viewHalfY = window.innerHeight / 2;
		} else {
			this._viewHalfX = this.domElement.offsetWidth / 2;
			this._viewHalfY = this.domElement.offsetHeight / 2;
		}
	}

	lookAt(x, y, z) {
		if (x.isVector3) {
			_target.copy(x);
		} else {
			_target.set(x, y, z);
		}

		this.object.lookAt(_target);

		this._setOrientation();

		return this;
	}

	update(delta) {
		if (this.enabled === false) return;

		if (this.heightSpeed) {
			const y = MathUtils.clamp(
				this.object.position.y,
				this.heightMin,
				this.heightMax
			);
			const heightDelta = y - this.heightMin;

			this._autoSpeedFactor = delta * (heightDelta * this.heightCoef);
		} else {
			this._autoSpeedFactor = 0.0;
		}

		const actualMoveSpeed = delta * this.movementSpeed;

		if (this._moveForward || (this.autoForward && !this._moveBackward))
			this.object.translateZ(-(actualMoveSpeed + this._autoSpeedFactor));
		if (this._moveBackward) this.object.translateZ(actualMoveSpeed);

		if (this._moveLeft) this.object.translateX(-actualMoveSpeed);
		if (this._moveRight) this.object.translateX(actualMoveSpeed);

		if (this._moveUp) this.object.translateY(actualMoveSpeed);
		if (this._moveDown) this.object.translateY(-actualMoveSpeed);

		let actualLookSpeed = delta * this.lookSpeed;

		if (!this.activeLook) {
			actualLookSpeed = 0;
		}

		let verticalLookRatio = 1;

		if (this.constrainVertical) {
			verticalLookRatio = Math.PI / (this.verticalMax - this.verticalMin);
		}

		if (this._lookLeft) {
			this.object.rotateY(MathUtils.degToRad(3) * delta * 10);
		}
		if (this._lookRight) {
			this.object.rotateY(MathUtils.degToRad(-3) * delta * 10);
		}
	}

	_setOrientation() {
		const quaternion = this.object.quaternion;

		_lookDirection.set(0, 0, -1).applyQuaternion(quaternion);
		_spherical.setFromVector3(_lookDirection);

		this._lat = 90 - MathUtils.radToDeg(_spherical.phi);
		this._lon = MathUtils.radToDeg(_spherical.theta);
	}
}

function onTouchStart(event) {
	if (event.currentTarget.classList.contains('side-left')) {
		this._moveLeft = true;
	} else if (event.currentTarget.classList.contains('side-right')) {
		this._moveRight = true;
	} else if (event.currentTarget.classList.contains('forward')) {
		this._moveForward = true;
	} else if (event.currentTarget.classList.contains('back')) {
		this._moveBackward = true;
	} else if (event.currentTarget.classList.contains('pan-left')) {
		this._lookLeft = true;
	} else if (event.currentTarget.classList.contains('pan-right')) {
		this._lookRight = true;
	}
}

function onTouchEnd(event) {
	if (event.currentTarget.classList.contains('side-left')) {
		this._moveLeft = false;
	} else if (event.currentTarget.classList.contains('side-right')) {
		this._moveRight = false;
	} else if (event.currentTarget.classList.contains('forward')) {
		this._moveForward = false;
	} else if (event.currentTarget.classList.contains('back')) {
		this._moveBackward = false;
	} else if (event.currentTarget.classList.contains('pan-left')) {
		this._lookLeft = false;
	} else if (event.currentTarget.classList.contains('pan-right')) {
		this._lookRight = false;
	}
}

export { TouchController };
