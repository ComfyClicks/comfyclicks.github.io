(() => {
  const preview = document.querySelector('#star-preview');
  const canvas = preview.querySelector('canvas');
  const context = canvas.getContext('2d');
  if (!context) return;

  const foreground = preview.querySelector('img[data-src]');
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const phoneViewport = matchMedia('(max-width: 650px) and (pointer: coarse)');
  const { width, height } = canvas;

  const stars = Array.from({ length: 240 }, () => ({
    x: Math.random() * 2 - 1,
    y: Math.random() * 2 - 1,
    depth: Math.random() * 0.9 + 0.1,
  }));
  let foregroundReady;
  let visible = false;
  let frame = 0;
  let previousTime;

  function draw(elapsed) {
    context.clearRect(0, 0, width, height);
    context.fillStyle = '#fff';
    context.beginPath();

    for (const star of stars) {
      star.depth -= elapsed * 0.08;
      if (star.depth <= 0.1) {
        star.depth = 1;
        star.x = Math.random() * 2 - 1;
        star.y = Math.random() * 2 - 1;
      }
      const x = width / 2 + star.x * width / (2 * star.depth);
      const y = height / 2 + star.y * height / (2 * star.depth);
      if (x < 0 || x > width || y < 0 || y > height) continue;
      const radius = Math.min(1.05, 0.3 / star.depth);
      context.moveTo(x + radius, y);
      context.arc(x, y, radius, 0, Math.PI * 2);
    }
    context.fill();
  }

  function sizeCanvas() {
    // Keep the same star coordinates and apparent sizes on a smaller pixel grid.
    const scale = phoneViewport.matches ? 0.8 : 1;
    const backingWidth = Math.round(width * scale);
    const backingHeight = Math.round(height * scale);
    if (canvas.width === backingWidth && canvas.height === backingHeight) return;
    canvas.width = backingWidth;
    canvas.height = backingHeight;
    context.setTransform(scale, 0, 0, scale, 0, 0);
    if (!canvas.hidden) draw(0);
  }

  function canAnimate() {
    return visible && !document.hidden && !preference.matches;
  }

  function animate(time) {
    frame = 0;
    if (!canAnimate()) return;
    const elapsed = previousTime === undefined ? 0 : time - previousTime;
    if (previousTime === undefined || elapsed >= 33) {
      previousTime = time;
      draw(Math.min(elapsed, 50) / 1000);
    }
    frame = requestAnimationFrame(animate);
  }

  async function updateMotion() {
    cancelAnimationFrame(frame);
    frame = 0;
    previousTime = undefined;

    if (preference.matches) {
      canvas.hidden = true;
      foreground.hidden = true;
    }
    if (!canAnimate()) return;

    if (!foregroundReady) {
      foreground.src = foreground.dataset.src;
      foregroundReady = foreground.decode().then(() => true, () => false);
    }
    if (await foregroundReady && canAnimate() && !frame) {
      draw(0);
      canvas.hidden = false;
      foreground.hidden = false;
      frame = requestAnimationFrame(animate);
    }
  }

  sizeCanvas();
  phoneViewport.addEventListener('change', sizeCanvas);

  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.intersectionRatio >= 0.1;
    updateMotion();
  }, { threshold: 0.1 });
  observer.observe(canvas.parentElement);
  document.addEventListener('visibilitychange', updateMotion);
  preference.addEventListener('change', updateMotion);
})();
