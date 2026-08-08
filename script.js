(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  document.addEventListener('click', (event) => {
    const whatsappLink = event.target.closest('a[href^="https://wa.me/"]');
    if (!whatsappLink || typeof window.oaiq !== 'function') return;

    try {
      window.oaiq(
        'measure',
        'custom',
        { type: 'custom' },
        { custom_event_name: 'whatsapp_cta_clicked' }
      );
    } catch (_) {
      // Measurement must never interrupt the WhatsApp navigation.
    }
  });

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
    const indexLabel = caseCarousel.querySelector('[data-case-index]');
    let carouselFrame = 0;
    let isDragging = false;
    let dragStartX = 0;
    let dragStartScroll = 0;
    let wheelFrame = 0;
    let wheelDelta = 0;
    let wheelStopTimer = 0;

    const cardStep = () => {
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      return (cards[0]?.getBoundingClientRect().width || track.clientWidth) + gap;
    };
    const updateCaseCarousel = () => {
      const visibleCards = Math.max(1, Math.floor(track.clientWidth / cardStep()));
      const maxStart = Math.max(0, cards.length - visibleCards);
      const index = clamp(Math.round(track.scrollLeft / cardStep()), 0, maxStart);
      const lastVisible = Math.min(index + visibleCards, cards.length);
      const firstLabel = String(index + 1).padStart(2, '0');
      const lastLabel = String(lastVisible).padStart(2, '0');
      indexLabel.textContent = visibleCards > 1 ? `${firstLabel}–${lastLabel}` : firstLabel;
      previous.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 8;
      carouselFrame = 0;
    };
    const scheduleCaseUpdate = () => {
      if (carouselFrame) return;
      carouselFrame = requestAnimationFrame(updateCaseCarousel);
    };
    const goToCase = (direction) => {
      track.scrollBy({ left: direction * cardStep(), behavior: reducedMotion ? 'auto' : 'smooth' });
    };

    previous.addEventListener('click', () => goToCase(-1));
    next.addEventListener('click', () => goToCase(1));
    track.addEventListener('scroll', scheduleCaseUpdate, { passive: true });
    track.addEventListener('wheel', (event) => {
      if (event.ctrlKey) return;
      const rawDelta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (!rawDelta) return;
      event.preventDefault();
      const deltaUnit = event.deltaMode === 1 ? 24 : event.deltaMode === 2 ? track.clientWidth : 1;
      wheelDelta += rawDelta * deltaUnit;
      track.classList.add('is-wheeling');

      if (!wheelFrame) {
        wheelFrame = requestAnimationFrame(() => {
          track.scrollBy({ left: wheelDelta, behavior: 'auto' });
          wheelDelta = 0;
          wheelFrame = 0;
        });
      }

      clearTimeout(wheelStopTimer);
      wheelStopTimer = window.setTimeout(() => {
        track.classList.remove('is-wheeling');
        scheduleCaseUpdate();
      }, 140);
    }, { passive: false });
    track.addEventListener('pointerdown', (event) => {
      if (event.pointerType !== 'mouse' || event.button !== 0) return;
      isDragging = true;
      dragStartX = event.clientX;
      dragStartScroll = track.scrollLeft;
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
    window.addEventListener('resize', scheduleCaseUpdate, { passive: true });
    updateCaseCarousel();
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
