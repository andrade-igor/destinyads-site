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
