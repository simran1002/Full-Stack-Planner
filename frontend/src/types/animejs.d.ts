declare module 'animejs' {
  function anime(params: anime.AnimeParams): anime.AnimeInstance;

  namespace anime {
    type EasingOptions =
      | 'easeInSine'
      | 'easeOutSine'
      | 'easeInOutSine'
      | 'easeInQuad'
      | 'easeOutQuad'
      | 'easeInOutQuad'
      | 'easeInCubic'
      | 'easeOutCubic'
      | 'easeInOutCubic'
      | 'easeInQuart'
      | 'easeOutQuart'
      | 'easeInOutQuart'
      | 'easeInQuint'
      | 'easeOutQuint'
      | 'easeInOutQuint'
      | 'easeInExpo'
      | 'easeOutExpo'
      | 'easeInOutExpo'
      | 'easeInCirc'
      | 'easeOutCirc'
      | 'easeInOutCirc'
      | 'easeInBack'
      | 'easeOutBack'
      | 'easeInOutBack'
      | 'easeInElastic'
      | 'easeOutElastic'
      | 'easeInOutElastic'
      | 'easeInBounce'
      | 'easeOutBounce'
      | 'easeInOutBounce'
      | 'linear'
      | string;

    interface AnimeParams {
      targets: Element | Element[] | string;
      duration?: number;
      delay?: number | Function;
      endDelay?: number;
      elasticity?: number;
      round?: number | boolean;
      loop?: number | boolean;
      direction?: 'normal' | 'reverse' | 'alternate';
      easing?: EasingOptions;
      autoplay?: boolean;
      [key: string]: any;
    }

    interface AnimeInstance {
      play(): void;
      pause(): void;
      restart(): void;
      reverse(): void;
      seek(time: number): void;
      [key: string]: any;
    }

    function stagger(value: number, options?: any): Function;
    function get(element: Element, property: string): string | number;
    function path(path: string | Element, percent?: number): Function;
    function setDashoffset(el: Element): number;
    function random(min: number, max: number): number;
    function timeline(params?: any): AnimeInstance;
  }

  export default anime;
}
