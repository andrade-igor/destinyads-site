(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  document.getElementById('year').textContent = new Date().getFullYear();
  requestAnimationFrame(() => document.body.classList.add('is-ready'));

  const cursorLight = document.querySelector('.cursor-light');
  if (!reducedMotion && cursorLight) {
    let pointerFrame = 0;
    window.addEventListener('pointermove', (event) => {
      if (pointerFrame) cancelAnimationFrame(pointerFrame);
      pointerFrame = requestAnimationFrame(() => {
        cursorLight.style.transform = `translate3d(${event.clientX - 220}px, ${event.clientY - 220}px, 0)`;
        pointerFrame = 0;
      });
    }, { passive: true });
  }

  const pageProgress = document.getElementById('page-progress');
  const methodSection = document.getElementById('metodo');
  const methodMeter = document.getElementById('method-meter');
  const updateScrollState = () => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
    pageProgress.style.transform = `scaleX(${clamp(progress, 0, 1)})`;

    const rect = methodSection.getBoundingClientRect();
    const methodDistance = methodSection.offsetHeight + window.innerHeight;
    const methodProgress = (window.innerHeight - rect.top) / methodDistance;
    methodMeter.style.transform = `scaleX(${clamp(methodProgress, 0, 1)})`;
  };
  let scrollFrame = 0;
  const scheduleScrollState = () => {
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => {
      updateScrollState();
      scrollFrame = 0;
    });
  };
  updateScrollState();
  window.addEventListener('scroll', scheduleScrollState, { passive: true });
  window.addEventListener('resize', scheduleScrollState, { passive: true });

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -5% 0px' });
  document.querySelectorAll('[data-reveal]').forEach((element) => revealObserver.observe(element));

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting || reducedMotion) return;
      const element = entry.target;
      const target = Number(element.dataset.count);
      const startedAt = performance.now();
      const duration = 950;
      const tick = (now) => {
        const t = clamp((now - startedAt) / duration, 0, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        element.textContent = Math.round(target * eased);
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      counterObserver.unobserve(element);
    });
  }, { threshold: 0.7 });
  document.querySelectorAll('[data-count]').forEach((element) => counterObserver.observe(element));

  document.querySelectorAll('.spotlight-card').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--spot-x', `${event.clientX - rect.left}px`);
      card.style.setProperty('--spot-y', `${event.clientY - rect.top}px`);
    }, { passive: true });
  });

  const caseCarousel = document.querySelector('[data-case-carousel]');
  if (caseCarousel) {
    const track = caseCarousel.querySelector('.portfolio-case-grid');
    const cards = [...track.querySelectorAll('.portfolio-case')];
    const previous = caseCarousel.querySelector('[data-case-prev]');
    const next = caseCarousel.querySelector('[data-case-next]');
    let carouselFrame = 0;
    let groupWidth = 0;
    let isDragging = false;
    let dragStartX = 0;
    let dragStartScroll = 0;
    let pauseUntil = 0;
    let carouselVisible = false;
    let autoFrame = 0;
    let lastAutoTime = 0;

    const makeClone = (card) => {
      const clone = card.cloneNode(true);
      clone.removeAttribute('data-reveal');
      clone.classList.add('is-visible', 'is-carousel-clone');
      clone.setAttribute('aria-hidden', 'true');
      clone.inert = true;
      return clone;
    };
    track.prepend(...cards.map(makeClone));
    track.append(...cards.map(makeClone));

    const cardStep = () => {
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      return (cards[0]?.getBoundingClientRect().width || track.clientWidth) + gap;
    };
    const updateCaseCarousel = () => {
      if (!groupWidth) groupWidth = cardStep() * cards.length;
      if (track.scrollLeft < groupWidth * 0.45) track.scrollLeft += groupWidth;
      if (track.scrollLeft > groupWidth * 1.55) track.scrollLeft -= groupWidth;
      carouselFrame = 0;
    };
    const scheduleCaseUpdate = () => {
      if (carouselFrame) return;
      carouselFrame = requestAnimationFrame(updateCaseCarousel);
    };
    const goToCase = (direction) => {
      pauseUntil = performance.now() + 1800;
      track.scrollBy({ left: direction * cardStep(), behavior: reducedMotion ? 'auto' : 'smooth' });
    };

    previous.addEventListener('click', () => goToCase(-1));
    next.addEventListener('click', () => goToCase(1));
    track.addEventListener('scroll', scheduleCaseUpdate, { passive: true });
    track.addEventListener('pointerdown', (event) => {
      if (event.pointerType !== 'mouse' || event.button !== 0) return;
      isDragging = true;
      dragStartX = event.clientX;
      dragStartScroll = track.scrollLeft;
      pauseUntil = performance.now() + 2500;
      track.classList.add('is-dragging');
      track.setPointerCapture(event.pointerId);
      event.preventDefault();
    });
    track.addEventListener('pointermove', (event) => {
      if (!isDragging) return;
      track.scrollLeft = dragStartScroll - (event.clientX - dragStartX);
    });
    const stopDragging = (event) => {
      if (!isDragging) return;
      isDragging = false;
      track.classList.remove('is-dragging');
      if (track.hasPointerCapture(event.pointerId)) track.releasePointerCapture(event.pointerId);
    };
    track.addEventListener('pointerup', stopDragging);
    track.addEventListener('pointercancel', stopDragging);
    track.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      goToCase(event.key === 'ArrowRight' ? 1 : -1);
    });
    window.addEventListener('resize', () => {
      groupWidth = cardStep() * cards.length;
      track.scrollLeft = groupWidth;
    }, { passive: true });

    const runAutoCarousel = (now) => {
      if (!carouselVisible) {
        autoFrame = 0;
        lastAutoTime = 0;
        return;
      }
      if (!lastAutoTime) lastAutoTime = now;
      const elapsed = Math.min(now - lastAutoTime, 32);
      if (!reducedMotion && !isDragging && now > pauseUntil) track.scrollLeft += elapsed * 0.018;
      lastAutoTime = now;
      autoFrame = requestAnimationFrame(runAutoCarousel);
    };
    const carouselObserver = new IntersectionObserver(([entry]) => {
      carouselVisible = entry.isIntersecting;
      if (carouselVisible && !autoFrame) autoFrame = requestAnimationFrame(runAutoCarousel);
    }, { threshold: 0.12 });
    carouselObserver.observe(caseCarousel);

    requestAnimationFrame(() => {
      groupWidth = cardStep() * cards.length;
      track.scrollLeft = groupWidth;
      updateCaseCarousel();
    });
  }

  if (!reducedMotion && window.matchMedia('(pointer: fine)').matches) {
    document.querySelectorAll('[data-tilt]').forEach((card) => {
      card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `rotateX(${-y * 4}deg) rotateY(${x * 5}deg) translateZ(0)`;
      });
      card.addEventListener('pointerleave', () => {
        card.style.transform = '';
      });
    });

    document.querySelectorAll('.magnetic').forEach((element) => {
      element.addEventListener('pointermove', (event) => {
        const rect = element.getBoundingClientRect();
        const x = (event.clientX - rect.left - rect.width / 2) * 0.14;
        const y = (event.clientY - rect.top - rect.height / 2) * 0.14;
        element.style.transform = `translate(${x}px, ${y}px)`;
      });
      element.addEventListener('pointerleave', () => {
        element.style.transform = '';
      });
    });
  }

})();
