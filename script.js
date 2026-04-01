// ── Utilities ──────────────────────────────────────────────

function debounce(fn, delay) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

// Shared swipe detection mixin
const SWIPE_THRESHOLD = 50;
const SWIPE_VERTICAL_LIMIT = 75; // Max vertical movement before treated as scroll

function createSwipeHandler(el, { onSwipeLeft, onSwipeRight }) {
    let startX = 0;
    let startY = 0;
    let distX = 0;
    let distY = 0;
    let tracking = false;

    el.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
        distX = 0;
        distY = 0;
        tracking = true;
    }, { passive: true });

    el.addEventListener('touchmove', (e) => {
        if (!tracking) return;
        const touch = e.touches[0];
        distX = touch.clientX - startX;
        distY = touch.clientY - startY;

        // If mostly horizontal, prevent vertical scroll
        if (Math.abs(distX) > Math.abs(distY) && Math.abs(distX) > 10) {
            e.preventDefault();
        }
    }, { passive: false });

    el.addEventListener('touchend', () => {
        if (!tracking) return;
        tracking = false;

        // Only trigger if horizontal movement exceeds threshold
        // and vertical movement is within limit
        if (Math.abs(distY) > SWIPE_VERTICAL_LIMIT) return;
        if (distX < -SWIPE_THRESHOLD && onSwipeLeft) onSwipeLeft();
        if (distX > SWIPE_THRESHOLD && onSwipeRight) onSwipeRight();
    }, { passive: true });
}

// ── Project Carousel ──────────────────────────────────────

class ProjectCarousel {
    constructor(carouselElement) {
        this.carousel = carouselElement;
        this.container = carouselElement.querySelector('.carousel-container');
        this.slides = carouselElement.querySelectorAll('.carousel-slide');
        this.dots = carouselElement.querySelectorAll('.carousel-dot');
        this.prevBtn = carouselElement.querySelector('.carousel-prev');
        this.nextBtn = carouselElement.querySelector('.carousel-next');
        this.currentSlide = 0;
        this.totalSlides = this.slides.length;

        if (this.totalSlides > 1) this.init();
    }

    init() {
        this.prevBtn?.addEventListener('click', () => this.prevSlide());
        this.nextBtn?.addEventListener('click', () => this.nextSlide());

        this.dots.forEach((dot, index) => {
            dot.addEventListener('click', () => this.goToSlide(index));
        });

        // Touch/swipe support
        createSwipeHandler(this.carousel, {
            onSwipeLeft: () => this.nextSlide(),
            onSwipeRight: () => this.prevSlide(),
        });

        this.updateCarousel();
    }

    nextSlide() {
        this.currentSlide = (this.currentSlide + 1) % this.totalSlides;
        this.updateCarousel();
    }

    prevSlide() {
        this.currentSlide = (this.currentSlide - 1 + this.totalSlides) % this.totalSlides;
        this.updateCarousel();
    }

    goToSlide(index) {
        this.currentSlide = index;
        this.updateCarousel();
    }

    updateCarousel() {
        this.container.style.transform = `translateX(-${this.currentSlide * 100}%)`;
        this.dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentSlide);
        });
    }
}

// ── Photo Gallery ─────────────────────────────────────────

class PhotoGallery {
    constructor(galleryElement) {
        this.gallery = galleryElement;
        this.track = galleryElement.querySelector('.photo-track');
        this.photos = galleryElement.querySelectorAll('.photo-card');
        this.prevBtn = galleryElement.querySelector('.gallery-prev');
        this.nextBtn = galleryElement.querySelector('.gallery-next');
        this.indicators = galleryElement.querySelectorAll('.indicator');

        this.currentIndex = 0;
        this.totalPhotos = this.photos.length;
        this.autoScrollInterval = null;
        this.resumeTimeout = null;
        this.isUserInteracting = false;

        // Cached measurements (updated on resize)
        this._cachedCardWidth = 0;
        this._cachedGalleryWidth = 0;
        this.photosPerView = 1;
        this.maxIndex = 0;

        this.init();
    }

    init() {
        this.cacheMeasurements();

        this.prevBtn?.addEventListener('click', () => this.navigateWithPause('prev'));
        this.nextBtn?.addEventListener('click', () => this.navigateWithPause('next'));

        this.indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => {
                this.goToIndicator(index);
                this.pauseAndResume();
            });
        });

        // Touch/swipe support
        createSwipeHandler(this.gallery, {
            onSwipeLeft: () => this.navigateWithPause('next'),
            onSwipeRight: () => this.navigateWithPause('prev'),
        });

        // Pause auto-scroll on hover
        this.gallery.addEventListener('mouseenter', () => {
            this.isUserInteracting = true;
            this.clearAutoScroll();
        });
        this.gallery.addEventListener('mouseleave', () => {
            this.isUserInteracting = false;
            this.startAutoScroll();
        });

        // Debounced resize handler
        window.addEventListener('resize', debounce(() => {
            this.cacheMeasurements();
            this.updateGallery();
        }, 200), { passive: true });

        this.updateGallery();
        this.startAutoScroll();
    }

    cacheMeasurements() {
        this._cachedCardWidth = this.photos[0]?.offsetWidth || 300;
        this._cachedGalleryWidth = this.gallery.offsetWidth;
        this.photosPerView = this.getPhotosPerView();
        this.maxIndex = Math.max(0, this.totalPhotos - this.photosPerView);
        // Clamp current index after resize
        if (this.currentIndex > this.maxIndex) {
            this.currentIndex = this.maxIndex;
        }
    }

    getPhotosPerView() {
        const gap = 16;
        const padding = 64;
        const availableWidth = this._cachedGalleryWidth - padding;
        return Math.max(1, Math.floor(availableWidth / (this._cachedCardWidth + gap)));
    }

    navigateWithPause(direction) {
        if (direction === 'next') {
            this.currentIndex = Math.min(this.currentIndex + 1, this.maxIndex);
        } else {
            this.currentIndex = Math.max(this.currentIndex - 1, 0);
        }
        this.updateGallery();
        this.pauseAndResume();
    }

    goToIndicator(indicatorIndex) {
        if (this.indicators.length <= 1) return;
        const positionsPerIndicator = this.maxIndex / (this.indicators.length - 1);
        this.currentIndex = Math.round(
            Math.min(Math.max(indicatorIndex * positionsPerIndicator, 0), this.maxIndex)
        );
        this.updateGallery();
    }

    updateGallery() {
        const cardWidth = this._cachedCardWidth;
        const gap = 16;
        const padding = 32;
        const galleryWidth = this._cachedGalleryWidth;

        const totalContentWidth = (this.totalPhotos * cardWidth) + ((this.totalPhotos - 1) * gap) + (padding * 2);
        const maxOffset = Math.max(0, totalContentWidth - galleryWidth);

        let offset = this.currentIndex * (cardWidth + gap);
        offset = Math.min(offset, maxOffset);

        this.track.style.transform = `translateX(-${offset}px)`;

        // Update indicators
        const progress = this.maxIndex > 0 ? this.currentIndex / this.maxIndex : 0;
        const activeIdx = Math.round(progress * (this.indicators.length - 1));
        this.indicators.forEach((indicator, i) => {
            indicator.classList.toggle('active', i === activeIdx);
        });
    }

    startAutoScroll() {
        this.clearAutoScroll();
        if (this.isUserInteracting) return;
        this.autoScrollInterval = setInterval(() => {
            this.currentIndex = this.currentIndex >= this.maxIndex ? 0 : this.currentIndex + 1;
            this.updateGallery();
        }, 4000);
    }

    clearAutoScroll() {
        if (this.autoScrollInterval) {
            clearInterval(this.autoScrollInterval);
            this.autoScrollInterval = null;
        }
    }

    // Pause auto-scroll on user interaction, resume after inactivity
    pauseAndResume() {
        this.clearAutoScroll();
        clearTimeout(this.resumeTimeout);
        this.resumeTimeout = setTimeout(() => {
            if (!this.isUserInteracting) this.startAutoScroll();
        }, 6000);
    }
}

// ── Image Modal ───────────────────────────────────────────

class ImageModal {
    constructor() {
        this.modal = document.getElementById('imageModal');
        this.image = document.getElementById('modalImage');
        this.caption = document.getElementById('modalCaption');
        this.closeBtn = document.querySelector('.modal-close');
        this.prevBtn = document.getElementById('modalPrev');
        this.nextBtn = document.getElementById('modalNext');

        this.images = [];
        this.currentIndex = 0;
        this.isOpen = false;

        if (this.modal) this.init();
    }

    init() {
        this.closeBtn.addEventListener('click', () => this.close());
        this.prevBtn.addEventListener('click', () => this.showImage(-1));
        this.nextBtn.addEventListener('click', () => this.showImage(1));

        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.close();
        });

        document.addEventListener('keydown', (e) => {
            if (!this.isOpen) return;
            if (e.key === 'Escape') this.close();
            else if (e.key === 'ArrowLeft') this.showImage(-1);
            else if (e.key === 'ArrowRight') this.showImage(1);
        });

        // Touch/swipe support for modal
        createSwipeHandler(this.modal, {
            onSwipeLeft: () => this.showImage(1),
            onSwipeRight: () => this.showImage(-1),
        });

        this.bindProjectImages();
        this.bindGalleryImages();
    }

    open(images, startIndex) {
        this.images = images;
        this.currentIndex = startIndex;
        this.image.src = images[startIndex].src;
        this.image.alt = images[startIndex].alt;
        this.modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        this.isOpen = true;
    }

    close() {
        this.modal.style.display = 'none';
        document.body.style.overflow = '';
        this.isOpen = false;
    }

    showImage(direction) {
        const len = this.images.length;
        this.currentIndex = (this.currentIndex + direction + len) % len;
        const img = this.images[this.currentIndex];
        this.image.src = img.src;
        this.image.alt = img.alt;
    }

    bindProjectImages() {
        document.querySelectorAll('.project-card').forEach(card => {
            const images = this.collectImages(card, '.carousel-slide img');
            card.querySelectorAll('.carousel-slide img').forEach((img, index) => {
                if (!img.src || img.src.includes('data:')) return;
                img.style.cursor = 'pointer';
                img.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.open(images, index);
                });
            });
        });
    }

    bindGalleryImages() {
        const galleryImgs = document.querySelectorAll('.photo-card img');
        const images = Array.from(galleryImgs).map(img => ({ src: img.src, alt: img.alt }));
        galleryImgs.forEach((img, index) => {
            img.style.cursor = 'pointer';
            img.addEventListener('click', (e) => {
                e.preventDefault();
                this.open(images, index);
            });
        });
    }

    collectImages(container, selector) {
        return Array.from(container.querySelectorAll(selector))
            .filter(img => img.src && !img.src.includes('data:'))
            .map(img => ({ src: img.src, alt: img.alt }));
    }
}

// ── Smooth Scroll Navigation ──────────────────────────────

function initSmoothScroll() {
    const header = document.querySelector('header');
    let cachedHeaderHeight = header ? header.offsetHeight : 0;

    // Update cached height on resize
    window.addEventListener('resize', debounce(() => {
        cachedHeaderHeight = header ? header.offsetHeight : 0;
    }, 200), { passive: true });

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                const targetPosition = targetSection.offsetTop - cachedHeaderHeight - 5;
                window.scrollTo({ top: targetPosition, behavior: 'smooth' });
            }
        });
    });
}

// ── Mobile Hamburger Menu ─────────────────────────────────

function initHamburgerMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    if (!hamburger || !navMenu) return;

    const backdrop = document.createElement('div');
    backdrop.className = 'nav-backdrop';
    document.body.appendChild(backdrop);

    function toggleMenu(open) {
        const action = open ? 'add' : 'remove';
        hamburger.classList[action]('active');
        navMenu.classList[action]('active');
        backdrop.classList[action]('active');
    }

    hamburger.addEventListener('click', () => {
        const isOpen = navMenu.classList.contains('active');
        toggleMenu(!isOpen);
    });

    navMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => toggleMenu(false));
    });

    backdrop.addEventListener('click', () => toggleMenu(false));
}

// ── Scroll Animations (IntersectionObserver) ──────────────

function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target); // Stop observing once animated
            }
        });
    }, {
        threshold: 0.02,
        rootMargin: '0px 0px -100px 0px'
    });

    const selectors = '.project-card, .skill-category, .certification-card, .photo-card';
    document.querySelectorAll(selectors).forEach(el => observer.observe(el));
}

// ── Initialize ────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', function () {
    initSmoothScroll();
    initHamburgerMenu();

    // Initialize carousels
    document.querySelectorAll('.project-image-carousel').forEach(el => {
        new ProjectCarousel(el);
    });

    // Initialize photo gallery
    const galleryEl = document.querySelector('.photo-gallery');
    if (galleryEl) new PhotoGallery(galleryEl);

    initScrollAnimations();
    new ImageModal();
});