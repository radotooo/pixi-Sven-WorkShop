import { Container, Sprite } from 'pixi.js';
import Entity from './Entity';
import svenAniamtions from './svenAnimations';
import sheepAnimations from './sheepAnimations';
import Sven from './Sven';
import gsap from 'gsap';

import Map from './Map';

// import svenAniamtions from './svenAnimations';

/**
 * Main game stage, manages scenes/levels.
 *
 * @extends {PIXI.Container}
 */
export default class Game extends Container {
  constructor() {
    super();
    this.map = new Map();
    this.herd = [];
    this.pressedKeys = [];
  }

  async start() {
    this.attachKeyboardListeners();
    this.addChild(new Sprite.from('background'));
    this.createSven();
    this.createHerd();
  }

  createSven() {
    const svenMapPos = this.map.posById(this.map.IDS.SVEN)[0];
    const svenCoords = this.map.coordsFromPos(svenMapPos);
    this.sven = new Sven(svenAniamtions);
    this.sven.init(svenCoords);
    this.addChild(this.sven.anim);
  }

  createHerd() {
    const sheepPositions = this.map.posById(this.map.IDS.SHEEP);

    sheepPositions.forEach((sheepPos) => {
      const sheepCoords = this.map.coordsFromPos(sheepPos);
      const sheep = new Entity(sheepAnimations);
      sheep.init(sheepCoords);

      sheep.hunpedCount = 0;
      sheep.col = sheepPos.col;
      sheep.row = sheepPos.row;

      this.addChild(sheep.anim);
      this.herd.push(sheep);
    });
    // this.sven = new Entity(svenAniamtions);
    // this.sven.init(svenCoords);
    // this.addChild(this.sven.anim);
  }

  attachKeyboardListeners() {
    document.addEventListener('keydown', this.onKeyDown.bind(this));
    document.addEventListener('keyup', this.onKeyUp.bind(this));
  }

  onKeyDown({ code }) {
    if (this.pressedKeys.includes(code)) {
      return;
    }
    this.pressedKeys.push(code);
    this.svenAction();
  }
  onKeyUp({ code }) {
    this.pressedKeys.splice(this.pressedKeys.indexOf(code), 1);
  }

  svenAction() {
    if (this.sven.moving) {
      return;
    }

    const directionKey = this.pressedKeys.find((k) =>
      ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(k)
    );

    if (directionKey) {
      const direction = directionKey.replace('Arrow', '');

      return this.svenMove(direction);
    }

    if (this.pressedKeys.includes('Space')) {
      return this.svenHump();
    }

    this.sven.standStill();
  }

  svenHump() {
    const svenDirection = this.sven.direction;

    const svenPos = this.map.posById(this.map.IDS.SVEN)[0];
    const targetPos = this.map.getDestination(svenPos, svenDirection);

    const hitSheep = this.map.getTile(targetPos) === this.map.IDS.SHEEP;

    if (!hitSheep) {
      return this.sven.standStill();
    }

    const sheep = this.herd.find(
      (s) => s.row === targetPos.row && s.col === targetPos.col
    );

    console.log(this.sven.direction, sheep, 'tyka');
    if (this.sven.direction !== sheep.direction) {
      return this.sven.standStill();
    }

    if (this.sven.isHumping) {
      return this.sven.standStill();
    }

    if (sheep.hunpedCount > 4) {
      return this.sven.standStill();
    }
    sheep.anim.visible = false;
    this.sven.hump(() => {
      sheep.hunpedCount++;
      sheep.anim.visible = true;
      this.sven.standStill();
      if (sheep.hunpedCount > 4) {
        this.removeSheep(sheep);
      }
      this.svenAction();
    });
  }

  removeSheep(sheep) {
    gsap.to(sheep.anim, {
      alpha: 0.4,
      duration: 0.5,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        sheep.anim.textures = sheep.animations[`disappear`];
        sheep.anim.gotoAndPlay(0);
        sheep.anim.onComplete = () => {
          const sheepIndex = this.herd.indexOf(sheep);
          this.herd.splice(sheepIndex, 1);
          this.removeChild(sheep.anim);
          this.map.setTileOnMap(
            { row: sheep.row, col: sheep.col },
            this.map.IDS.EMPTY
          );

          sheep.anim.onComplete = null;
        };
      },
    });
  }

  async svenMove(direction) {
    const oldPos = this.map.posById(this.map.IDS.SVEN)[0];
    const newPost = this.map.getDestination(oldPos, direction);

    if (this.map.outOfBounds(newPost) || this.map.collide(newPost)) {
      return this.sven.standStill(direction);
    }

    const targetPos = this.map.coordsFromPos(newPost);

    await this.sven.move(targetPos, direction);

    this.map.setTileOnMap(oldPos, this.map.IDS.EMPTY);
    this.map.setTileOnMap(newPost, this.map.IDS.SVEN);
    this.svenAction();
  }
}
