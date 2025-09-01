// Image Carousel Functionality
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

        this.init();
    }

    init() {
        if (this.totalSlides <= 1) return; // Don't initialize if only one image

        // Add event listeners
        this.prevBtn?.addEventListener('click', () => this.prevSlide());
        this.nextBtn?.addEventListener('click', () => this.nextSlide());
        
        this.dots.forEach((dot, index) => {
            dot.addEventListener('click', () => this.goToSlide(index));
        });

        // Auto-play (optional - uncomment if you want auto-advance)
        // this.startAutoPlay();

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
        // Move container
        this.container.style.transform = `translateX(-${this.currentSlide * 100}%)`;
        
        // Update dots
        this.dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentSlide);
        });
    }

    startAutoPlay() {
        setInterval(() => {
            this.nextSlide();
        }, 5000); // Change slide every 5 seconds
    }
}

// Photo Gallery Functionality
class PhotoGallery {
    constructor(galleryElement) {
        this.gallery = galleryElement;
        this.track = galleryElement.querySelector('.photo-track');
        this.photos = galleryElement.querySelectorAll('.photo-card');
        this.prevBtn = galleryElement.querySelector('.gallery-prev');
        this.nextBtn = galleryElement.querySelector('.gallery-next');
        this.indicators = galleryElement.querySelectorAll('.indicator');
        
        this.currentIndex = 0;
        this.photosPerView = this.getPhotosPerView();
        this.totalPhotos = this.photos.length;
        this.maxIndex = Math.max(0, this.totalPhotos - this.photosPerView);
        
        this.init();
    }
    
    init() {
        this.prevBtn?.addEventListener('click', () => this.prev());
        this.nextBtn?.addEventListener('click', () => this.next());
        
        // Add click listeners to indicators
        this.indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => this.goToIndicator(index));
        });
        
        // Auto-scroll (optional)
        this.startAutoScroll();
        
        // Pause auto-scroll on hover
        this.gallery.addEventListener('mouseenter', () => this.pauseAutoScroll());
        this.gallery.addEventListener('mouseleave', () => this.startAutoScroll());
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.photosPerView = this.getPhotosPerView();
            this.maxIndex = Math.max(0, this.totalPhotos - this.photosPerView);
            this.updateGallery();
        });
        
        // Initial update
        this.updateGallery();
    }
    
    getPhotosPerView() {
        const containerWidth = this.gallery.offsetWidth;
        const cardWidth = 300; // Your photo card width
        const gap = 16;
        const padding = 64; // 2rem on each side
        
        const availableWidth = containerWidth - padding;
        const photosPerView = Math.floor(availableWidth / (cardWidth + gap));
        
        return Math.max(1, photosPerView);
    }
    
    next() {
        this.currentIndex = Math.min(this.currentIndex + 1, this.maxIndex);
        this.updateGallery();
    }
    
    prev() {
        this.currentIndex = Math.max(this.currentIndex - 1, 0);
        this.updateGallery();
    }
    
    goToIndicator(indicatorIndex) {
        // Calculate which photo to show based on indicator clicked
        // Divide the total scrollable positions by number of indicators
        const positionsPerIndicator = this.maxIndex / (this.indicators.length - 1);
        let targetIndex = Math.round(indicatorIndex * positionsPerIndicator);
        
        // Ensure we don't exceed bounds
        targetIndex = Math.min(targetIndex, this.maxIndex);
        targetIndex = Math.max(targetIndex, 0);
        
        this.currentIndex = targetIndex;
        this.updateGallery();
    }
    
    updateGallery() {
        const cardWidth = this.photos[0].offsetWidth;
        const gap = 16; // 1rem gap
        const padding = 32; // 2rem padding on each side
        
        // Calculate the maximum offset to prevent clipping
        const containerWidth = this.gallery.offsetWidth;
        const totalContentWidth = (this.totalPhotos * cardWidth) + ((this.totalPhotos - 1) * gap) + (padding * 2);
        const maxOffset = Math.max(0, totalContentWidth - containerWidth);
        
        // Calculate desired offset
        let offset = this.currentIndex * (cardWidth + gap);
        
        // Limit offset to prevent clipping on the right side
        offset = Math.min(offset, maxOffset);
        
        this.track.style.transform = `translateX(-${offset}px)`;
        
        // Update indicators based on current position
        const currentProgress = this.maxIndex > 0 ? this.currentIndex / this.maxIndex : 0;
        const activeIndicatorIndex = Math.round(currentProgress * (this.indicators.length - 1));
        
        this.indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === activeIndicatorIndex);
        });
    }
    
    startAutoScroll() {
        this.autoScrollInterval = setInterval(() => {
            if (this.currentIndex >= this.maxIndex) {
                this.currentIndex = 0;
            } else {
                this.currentIndex++;
            }
            this.updateGallery();
        }, 4000); // Change every 4 seconds
    }
    
    pauseAutoScroll() {
        if (this.autoScrollInterval) {
            clearInterval(this.autoScrollInterval);
        }
    }
}

// Initialize all carousels and galleries when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        const targetSection = document.querySelector(targetId);
        
        if (targetSection) {
            const headerHeight = document.querySelector('header').offsetHeight;
            const targetPosition = targetSection.offsetTop - headerHeight - 5; // 5px extra padding
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

    // Mobile hamburger menu
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    // Create backdrop element
    const backdrop = document.createElement('div');
    backdrop.className = 'nav-backdrop';
    document.body.appendChild(backdrop);
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
            backdrop.classList.toggle('active');
        });
        
        // Close menu when clicking on a link
        document.querySelectorAll('.nav-menu a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
                backdrop.classList.remove('active');
            });
        });
        
        // Close menu when clicking on backdrop
        backdrop.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            backdrop.classList.remove('active');
        });
    }

    // Initialize carousels
    const carousels = document.querySelectorAll('.project-image-carousel');
    carousels.forEach(carousel => {
        new ProjectCarousel(carousel);
    });

    // Initialize photo gallery
    const photoGallery = document.querySelector('.photo-gallery');
    if (photoGallery) {
        new PhotoGallery(photoGallery);
    }

    // Simple fade-in animation on scroll
    const observerOptions = {
        threshold: 0.02,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    // Observe fade in for different sections
    document.querySelectorAll('.project-card').forEach(card => {
        observer.observe(card);
    });

    document.querySelectorAll('.skill-category').forEach(card => {
        observer.observe(card);
    });

    document.querySelectorAll('.certification-card').forEach(card => {
        observer.observe(card);
    });

    document.querySelectorAll('.photo-card').forEach(card => {
        observer.observe(card);
    });

    // Image Modal Functionality
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const modalCaption = document.getElementById('modalCaption');
    const modalClose = document.querySelector('.modal-close');
    const modalPrev = document.getElementById('modalPrev');
    const modalNext = document.getElementById('modalNext');
    
    let currentImageIndex = 0;
    let currentImages = [];
    
    // Function to collect all images from a project card
    function getProjectImages(projectCard) {
        const images = [];
        const carouselSlides = projectCard.querySelectorAll('.carousel-slide img');
        carouselSlides.forEach(img => {
            if (img.src && !img.src.includes('data:')) {
                images.push({
                    src: img.src,
                    alt: img.alt
                });
            }
        });
        return images;
    }
    
    // Function to open modal
    function openModal(imageSrc, imageAlt, images, startIndex = 0) {
        currentImages = images;
        currentImageIndex = startIndex;
        
        modalImage.src = imageSrc;
        modalImage.alt = imageAlt;
        
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
    
    // Function to close modal
    function closeModal() {
        modal.style.display = 'none';
        document.body.style.overflow = ''; // Restore scrolling
    }
    
    // Function to show next/prev image with circular navigation
    function showImage(direction) {
        if (direction === 'next') {
            // Go to first image if at last image
            currentImageIndex = (currentImageIndex + 1) % currentImages.length;
        } else if (direction === 'prev') {
            // Go to last image if at first image
            currentImageIndex = currentImageIndex === 0 ? currentImages.length - 1 : currentImageIndex - 1;
        }
        
        const currentImg = currentImages[currentImageIndex];
        modalImage.src = currentImg.src;
        modalImage.alt = currentImg.alt;
    }
    
    // Add click listeners to all project card images
    document.querySelectorAll('.project-card').forEach(projectCard => {
        const images = getProjectImages(projectCard);
        const carouselImages = projectCard.querySelectorAll('.carousel-slide img');
        
        carouselImages.forEach((img, index) => {
            if (img.src && !img.src.includes('data:')) {
                img.style.cursor = 'pointer';
                img.addEventListener('click', function(e) {
                    e.preventDefault();
                    openModal(img.src, img.alt, images, index);
                });
            }
        });
    });
    
    // Also add to photography gallery images
    document.querySelectorAll('.photo-card img').forEach((img, index) => {
        img.style.cursor = 'pointer';
        img.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Collect all photo gallery images
            const allPhotoImages = Array.from(document.querySelectorAll('.photo-card img')).map(photoImg => ({
                src: photoImg.src,
                alt: photoImg.alt
            }));
            
            openModal(img.src, img.alt, allPhotoImages, index);
        });
    });
    
    // Modal event listeners
    modalClose.addEventListener('click', closeModal);
    modalPrev.addEventListener('click', () => showImage('prev'));
    modalNext.addEventListener('click', () => showImage('next'));
    
    // Close modal when clicking outside the image
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Keyboard navigation with circular scrolling
    document.addEventListener('keydown', function(e) {
        if (modal.style.display === 'block') {
            switch(e.key) {
                case 'Escape':
                    closeModal();
                    break;
                case 'ArrowLeft':
                    showImage('prev');
                    break;
                case 'ArrowRight':
                    showImage('next');
                    break;
            }
        }
    });
});