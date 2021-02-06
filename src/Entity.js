import { AnimatedSprite, Loader } from 'pixi.js';
import gsap from 'gsap';

const Resources = Loader.shared.resources;
const DIRECTIONS = ['Up', 'Down', 'Left', 'Right'];

export default class Entity {
  constructor(animations) {
    this.animations = [];

    const randomInndex = Math.floor(Math.random() * DIRECTIONS.length);
    this.direction = DIRECTIONS[randomInndex];

    this.prepareAnimations(animations);
  }

  prepareAnimations(animations) {
    for (const key in animations) {
      const animationTextures = [];

      animations[key].forEach((el) => {
        animationTextures.push(Resources[el].texture);
      });
      this.animations[key] = animationTextures;
    }
  }

  init(position) {
    this.anim = new AnimatedSprite(this.animations[`stand${this.direction}`]);
    this.anim.position = position;
    this.anim.animationSpeed = 0.2;
    this.anim.loop = false;
  }

  async move(targetPos, direction) {
    // console.log(targetPos, direction);

    this.moving = true;

    this.direction = direction;

    this.anim.textures = this.animations[`walk` + `${this.direction}`];

    this.anim.gotoAndPlay(0);

    await gsap.to(this.anim, {
      duration: 0.5,
      x: targetPos.x,
      y: targetPos.y,
    });

    this.moving = false;
  }

  standStill(direction = this.direction) {
    this.direction = direction;
    this.anim.textures = this.animations[`stand${this.direction}`];
    this.anim.gotoAndStop(0);
    this.anim.loop = false;
    this.moving = false;
  }
}
