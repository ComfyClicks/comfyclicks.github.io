const retailGallery = document.querySelector('#retail-dashboard-gallery');
const retailGalleryItems = [...(retailGallery?.querySelectorAll('.dashboard-gallery-item') ?? [])];
const retailGalleryTriggers = [...document.querySelectorAll('.dashboard-gallery-trigger')];
const retailGalleryClose = retailGallery?.querySelector('.dashboard-gallery-close');
const retailGalleryPrevious = retailGallery?.querySelector('.dashboard-gallery-previous');
const retailGalleryNext = retailGallery?.querySelector('.dashboard-gallery-next');
const retailGalleryCounter = retailGallery?.querySelector('.dashboard-gallery-counter');
let retailGalleryIndex = 0;
let lastRetailGalleryTrigger = null;
let retailTouchStartX = 0;

function showRetailGalleryItem(index) {
    retailGalleryIndex = (index + retailGalleryItems.length) % retailGalleryItems.length;
    retailGalleryItems.forEach((item, itemIndex) => {
        const isActive = itemIndex === retailGalleryIndex;
        item.classList.toggle('is-active', isActive);
        item.hidden = !isActive;
    });
    if (retailGalleryCounter) {
        retailGalleryCounter.textContent = `${retailGalleryIndex + 1} / ${retailGalleryItems.length}`;
    }
}

function openRetailGallery(index, trigger) {
    if (!retailGallery || !retailGalleryItems[index]) return;
    lastRetailGalleryTrigger = trigger;
    showRetailGalleryItem(index);
    retailGallery.showModal();
    requestAnimationFrame(() => retailGalleryClose?.focus());
}

retailGalleryTriggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
        openRetailGallery(Number(trigger.dataset.galleryIndex), trigger);
    });
});

retailGalleryPrevious?.addEventListener('click', () => showRetailGalleryItem(retailGalleryIndex - 1));
retailGalleryNext?.addEventListener('click', () => showRetailGalleryItem(retailGalleryIndex + 1));
retailGalleryClose?.addEventListener('click', () => retailGallery?.close());

retailGallery?.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') showRetailGalleryItem(retailGalleryIndex - 1);
    if (event.key === 'ArrowRight') showRetailGalleryItem(retailGalleryIndex + 1);
});

retailGallery?.addEventListener('touchstart', (event) => {
    retailTouchStartX = event.touches[0].clientX;
}, { passive: true });

retailGallery?.addEventListener('touchend', (event) => {
    const distance = event.changedTouches[0].clientX - retailTouchStartX;
    if (Math.abs(distance) < 50) return;
    showRetailGalleryItem(retailGalleryIndex + (distance < 0 ? 1 : -1));
}, { passive: true });

retailGallery?.addEventListener('click', (event) => {
    if (event.target === retailGallery) retailGallery.close();
});

retailGallery?.addEventListener('close', () => lastRetailGalleryTrigger?.focus());
