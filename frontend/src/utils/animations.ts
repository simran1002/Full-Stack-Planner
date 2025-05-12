// anime.js is imported from CDN in index.html
// <script src="https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js"></script>

// Define the anime type for TypeScript
declare global {
  interface Window {
    anime: any;
  }
}

// Helper to access the global anime instance
const getAnime = () => {
  if (typeof window !== 'undefined' && window.anime) {
    return window.anime;
  }
  return null;
};

export const fadeIn = (element: Element, duration = 800, delay = 0) => {
  const anime = getAnime();
  if (!anime || !element) {
    // Fallback to CSS if anime.js is not available
    const el = element as HTMLElement;
    if (!el) return;
    
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`;
    el.style.transitionDelay = `${delay}ms`;
    
    void el.offsetWidth;
    
    setTimeout(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, 10);
    
    return new Promise(resolve => setTimeout(resolve, duration + delay));
  }
  
  // Use anime.js if available
  return anime({
    targets: element,
    opacity: [0, 1],
    translateY: [20, 0],
    duration,
    delay,
    easing: 'easeOutExpo'
  });
};

export const fadeOut = (element: Element, duration = 800, delay = 0) => {
  const anime = getAnime();
  if (!anime || !element) {
    // Fallback to CSS if anime.js is not available
    const el = element as HTMLElement;
    if (!el) return;
    
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
    el.style.transition = `opacity ${duration}ms ease-in, transform ${duration}ms ease-in`;
    el.style.transitionDelay = `${delay}ms`;
    
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
    }, 10);
    
    return new Promise(resolve => setTimeout(resolve, duration + delay));
  }
  
  // Use anime.js if available
  return anime({
    targets: element,
    opacity: [1, 0],
    translateY: [0, 20],
    duration,
    delay,
    easing: 'easeInExpo'
  });
};

export const pulseAnimation = (element: Element, scale = 1.05, duration = 300) => {
  const anime = getAnime();
  if (!anime || !element) {
    // Fallback to CSS if anime.js is not available
    const el = element as HTMLElement;
    if (!el) return;
    
    el.style.transform = 'scale(1)';
    el.style.transition = `transform ${duration / 2}ms ease-in-out`;
    
    setTimeout(() => {
      el.style.transform = `scale(${scale})`;
      
      setTimeout(() => {
        el.style.transform = 'scale(1)';
      }, duration / 2);
    }, 10);
    
    return new Promise(resolve => setTimeout(resolve, duration));
  }
  
  // Use anime.js if available
  return anime({
    targets: element,
    scale: [1, scale, 1],
    duration,
    easing: 'easeInOutQuad'
  });
};

export const staggerItems = (elements: Element[], staggerDelay = 50, duration = 800) => {
  const anime = getAnime();
  if (!anime || !elements || elements.length === 0) return;
  
  if (!anime) {
    // Fallback to CSS if anime.js is not available
    elements.forEach((element, index) => {
      const el = element as HTMLElement;
      if (!el) return;
      
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`;
      el.style.transitionDelay = `${index * staggerDelay}ms`;
      
      void el.offsetWidth;
      
      setTimeout(() => {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, 10);
    });
    
    const totalDuration = duration + (elements.length - 1) * staggerDelay;
    return new Promise(resolve => setTimeout(resolve, totalDuration));
  }
  
  // Use anime.js if available
  return anime({
    targets: elements,
    opacity: [0, 1],
    translateY: [20, 0],
    delay: anime.stagger(staggerDelay),
    duration,
    easing: 'easeOutExpo'
  });
};

export const slideIn = (element: Element, direction = 'right', distance = 50, duration = 800, delay = 0) => {
  const anime = getAnime();
  if (!anime || !element) {
    // Fallback to CSS if anime.js is not available
    const el = element as HTMLElement;
    if (!el) return;
    
    el.style.opacity = '0';
    
    let initialTransform = '';
    if (direction === 'right') {
      initialTransform = `translateX(${distance}px)`;
    } else if (direction === 'left') {
      initialTransform = `translateX(-${distance}px)`;
    } else if (direction === 'down') {
      initialTransform = `translateY(${distance}px)`;
    } else if (direction === 'up') {
      initialTransform = `translateY(-${distance}px)`;
    }
    
    el.style.transform = initialTransform;
    el.style.transition = `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`;
    el.style.transitionDelay = `${delay}ms`;
    
    void el.offsetWidth;
    
    setTimeout(() => {
      el.style.opacity = '1';
      el.style.transform = 'translate(0, 0)';
    }, 10);
    
    return new Promise(resolve => setTimeout(resolve, duration + delay));
  }
  
  // Use anime.js if available
  const translateX = direction === 'right' ? [distance, 0] : direction === 'left' ? [-distance, 0] : [0, 0];
  const translateY = direction === 'down' ? [distance, 0] : direction === 'up' ? [-distance, 0] : [0, 0];
  
  return anime({
    targets: element,
    translateX,
    translateY,
    opacity: [0, 1],
    duration,
    delay,
    easing: 'easeOutExpo'
  });
};

export const scaleIn = (element: Element, duration = 600, delay = 0) => {
  const anime = getAnime();
  if (!anime || !element) {
    // Fallback to CSS if anime.js is not available
    const el = element as HTMLElement;
    if (!el) return;
    
    el.style.transform = 'scale(0.8)';
    el.style.opacity = '0';
    el.style.transition = `transform ${duration}ms cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity ${duration}ms ease-out`;
    el.style.transitionDelay = `${delay}ms`;
    
    void el.offsetWidth;
    
    setTimeout(() => {
      el.style.transform = 'scale(1)';
      el.style.opacity = '1';
    }, 10);
    
    return new Promise(resolve => setTimeout(resolve, duration + delay));
  }
  
  // Use anime.js if available
  return anime({
    targets: element,
    scale: [0.8, 1],
    opacity: [0, 1],
    duration,
    delay,
    easing: 'spring(1, 80, 10, 0)'
  });
};

export const successAnimation = (element: Element) => {
  const anime = getAnime();
  if (!anime || !element) {
    // Fallback to CSS if anime.js is not available
    const el = element as HTMLElement;
    if (!el) return;
    
    el.style.transform = 'translateY(0)';
    el.style.backgroundColor = '#ffffff';
    el.style.transition = `transform 500ms ease-in-out, background-color 500ms ease-in-out`;
    
    setTimeout(() => {
      el.style.transform = 'translateY(-10px)';
      el.style.backgroundColor = '#10B981';
      
      setTimeout(() => {
        el.style.transform = 'translateY(0)';
        el.style.backgroundColor = '#ffffff';
      }, 500);
    }, 10);
    
    return new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Use anime.js if available
  return anime({
    targets: element,
    translateY: [0, -10, 0],
    backgroundColor: ['#ffffff', '#10B981', '#ffffff'],
    duration: 1000,
    easing: 'easeInOutQuad'
  });
};

export const dragAnimation = (element: Element) => {
  const anime = getAnime();
  if (!anime || !element) {
    // Fallback to CSS if anime.js is not available
    const el = element as HTMLElement;
    if (!el) return;
    
    el.style.transform = 'scale(1)';
    el.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.1)';
    el.style.transition = 'transform 200ms ease-out, box-shadow 200ms ease-out';
    
    setTimeout(() => {
      el.style.transform = 'scale(1.05)';
      el.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.1)';
    }, 10);
    
    return new Promise(resolve => setTimeout(resolve, 200));
  }
  
  // Use anime.js if available
  return anime({
    targets: element,
    scale: 1.05,
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
    duration: 200,
    easing: 'easeOutQuad'
  });
};

export const dropAnimation = (element: Element) => {
  const anime = getAnime();
  if (!anime || !element) {
    // Fallback to CSS if anime.js is not available
    const el = element as HTMLElement;
    if (!el) return;
    
    el.style.transform = 'scale(1.05)';
    el.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.1)';
    el.style.transition = 'transform 200ms ease-out, box-shadow 200ms ease-out';
    
    setTimeout(() => {
      el.style.transform = 'scale(1)';
      el.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.1)';
    }, 10);
    
    return new Promise(resolve => setTimeout(resolve, 200));
  }
  
  // Use anime.js if available
  return anime({
    targets: element,
    scale: 1,
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
    duration: 200,
    easing: 'easeOutQuad'
  });
};

export const shakeAnimation = (element: Element, intensity = 5) => {
  const anime = getAnime();
  if (!anime || !element) {
    // Fallback to CSS if anime.js is not available
    const el = element as HTMLElement;
    if (!el) return;
    
    el.style.transform = 'translateX(0)';
    
    // Apply the animation in steps
    const steps = [
      () => { el.style.transform = `translateX(-${intensity}px)`; },
      () => { el.style.transform = `translateX(${intensity}px)`; },
      () => { el.style.transform = `translateX(-${intensity}px)`; },
      () => { el.style.transform = `translateX(${intensity}px)`; },
      () => { el.style.transform = 'translateX(0)'; }
    ];
    
    const stepDuration = 500 / steps.length;
    
    // Execute each step with the appropriate timing
    steps.forEach((step, index) => {
      setTimeout(step, index * stepDuration);
    });
    
    return new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Use anime.js if available
  return anime({
    targets: element,
    translateX: [0, -intensity, intensity, -intensity, intensity, 0],
    duration: 500,
    easing: 'easeInOutQuad'
  });
};

export const statusChangeAnimation = (element: Element, color: string) => {
  const anime = getAnime();
  if (!anime || !element) {
    // Fallback to CSS if anime.js is not available
    const el = element as HTMLElement;
    if (!el) return;
    
    const originalColor = el.style.backgroundColor || window.getComputedStyle(el).backgroundColor;
    el.style.transition = `background-color 800ms ease-in-out, transform 800ms ease-in-out`;
    
    setTimeout(() => {
      el.style.backgroundColor = color;
      el.style.transform = 'scale(1.05)';
      
      setTimeout(() => {
        el.style.backgroundColor = originalColor;
        el.style.transform = 'scale(1)';
      }, 400);
    }, 10);
    
    return new Promise(resolve => setTimeout(resolve, 800));
  }
  
  // Use anime.js if available
  const originalColor = window.getComputedStyle(element).backgroundColor;
  
  return anime({
    targets: element,
    backgroundColor: [originalColor, color, originalColor],
    scale: [1, 1.05, 1],
    duration: 800,
    easing: 'easeInOutQuad'
  });
};
