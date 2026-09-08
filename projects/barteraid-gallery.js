const gallery = document.querySelector('#barteraid-gallery');
const galleryStage = gallery?.querySelector('.gallery-stage');
const galleryItems = [...(gallery?.querySelectorAll('.gallery-item') ?? [])];
const galleryTriggers = [...document.querySelectorAll('.screenshot-trigger')];
const galleryClose = gallery?.querySelector('.gallery-close');
const galleryPrevious = gallery?.querySelector('.gallery-previous');
const galleryNext = gallery?.querySelector('.gallery-next');
const galleryCounter = gallery?.querySelector('.gallery-counter');
let currentGalleryIndex = 0;
let lastGalleryTrigger = null;
let touchStartX = 0;

function showGalleryItem(index) {
  currentGalleryIndex = (index + galleryItems.length) % galleryItems.length;
  galleryItems.forEach((item, itemIndex) => {
    const isActive = itemIndex === currentGalleryIndex;
    item.classList.toggle('is-active', isActive);
    item.hidden = !isActive;
  });
  if (galleryCounter) galleryCounter.textContent = `${currentGalleryIndex + 1} / ${galleryItems.length}`;
}

function openGallery(index, trigger) {
  if (!gallery || !galleryItems[index]) return;
  lastGalleryTrigger = trigger;
  showGalleryItem(index);
  gallery.showModal();
  requestAnimationFrame(() => galleryClose?.focus());
}

galleryTriggers.forEach((trigger) => {
  trigger.addEventListener('click', () => openGallery(Number(trigger.dataset.galleryIndex), trigger));
});

galleryPrevious?.addEventListener('click', () => showGalleryItem(currentGalleryIndex - 1));
galleryNext?.addEventListener('click', () => showGalleryItem(currentGalleryIndex + 1));
galleryClose?.addEventListener('click', () => gallery?.close());

gallery?.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft') showGalleryItem(currentGalleryIndex - 1);
  if (event.key === 'ArrowRight') showGalleryItem(currentGalleryIndex + 1);
});

galleryStage?.addEventListener('touchstart', (event) => {
  touchStartX = event.touches[0].clientX;
}, { passive: true });

galleryStage?.addEventListener('touchend', (event) => {
  const distance = event.changedTouches[0].clientX - touchStartX;
  if (Math.abs(distance) < 50) return;
  showGalleryItem(currentGalleryIndex + (distance < 0 ? 1 : -1));
}, { passive: true });

gallery?.addEventListener('click', (event) => {
  if (event.target === gallery) gallery.close();
});

gallery?.addEventListener('close', () => lastGalleryTrigger?.focus());
