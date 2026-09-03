// ============================================
// GALLERY COMPONENT with Debug Mode
// ============================================

const CFG = {
    minWidth: 225,
    maxColumns: 4,
    selector: '.gallery_justified',
    itemSelector: '.gallery_item',
    lightbox: '#custom-lightbox',
    lbImg: '#lightbox-img',
    lbCounter: '#lb-counter',
    lbPrev: '#lb-prev',
    lbNext: '#lb-next',
    imgSelector: '.gallery_image',
    debug: true // Set to false to disable random gallery fallback
};

// ----- Styles -----
function injectStyles() {
    if (document.querySelector('#gallery-styles')) return;
    const style = document.createElement('style');
    style.id = 'gallery-styles';
    style.textContent = `
        .gallery_justified { display: flex; flex-wrap: wrap; margin: -5px; }
        .gallery_item { padding: 5px; box-sizing: border-box; }
        .gallery_image {
            height: 100%; width: 100%; display: block;
            object-fit: cover; cursor: pointer;
            transition: transform 0.3s ease, outline 0.1s ease;
            transform: scale(1); outline: 0 solid transparent;
        }
        .gallery_image:hover { outline: 2px solid #0084ff; transform: scale(1.01); }
    `;
    document.head.appendChild(style);
}

// ----- Generate Random Gallery (Debug) -----
function generateRandomGallery(wrapper) {
    const maxCols = parseInt(wrapper.getAttribute('maxImages')) || CFG.maxColumns;
    const spacing = wrapper.getAttribute('image-spacing') || '5px';
    const count = Math.floor(Math.random() * 15) + 6; // 6-20 images
    
    const gallery = document.createElement('div');
    gallery.className = 'gallery_justified';
    gallery.style.gap = spacing;
    gallery.style.margin = `-${spacing}`;
    gallery.dataset.maxColumns = maxCols;

    for (let i = 0; i < count; i++) {
        const width = Math.floor(Math.random() * 400) + 300;
        const height = Math.floor(Math.random() * 400) + 300;
        
        const item = document.createElement('div');
        item.className = 'gallery_item';
        item.style.padding = spacing;
        
        // Randomly force break for some items (10% chance)
        if (Math.random() < 0.1) {
            item.dataset.forceBreak = 'true';
        }

        const img = document.createElement('img');
        img.className = 'gallery_image';
        img.src = `https://picsum.photos/${width}/${height}?random=${i + Date.now()}`;
        img.alt = `random-${i}`;
        img.loading = 'lazy';

        item.appendChild(img);
        gallery.appendChild(item);
    }

    wrapper.innerHTML = '';
    wrapper.appendChild(gallery);
}

// ----- Lightbox -----
function injectLightbox() {
    if (document.querySelector('#custom-lightbox')) return;
    document.body.insertAdjacentHTML('beforeend', `
        <div id="custom-lightbox" style="display:none;position:fixed;z-index:9999;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.95);align-items:center;justify-content:center;flex-direction:column;">
            <div id="lb-counter" style="color:#fff;margin-bottom:15px;font-family:sans-serif;opacity:.7;font-size:14px;"></div>
            <div style="position:relative;display:flex;align-items:center;justify-content:center;width:100%;height:85%;">
                <img id="lightbox-img" style="max-width:90%;max-height:100%;object-fit:contain;border-radius:2px;">
                <button id="lb-prev" style="position:absolute;left:20px;background:none;border:none;color:#fff;font-size:40px;cursor:pointer;padding:20px;">&#10094;</button>
                <button id="lb-next" style="position:absolute;right:20px;background:none;border:none;color:#fff;font-size:40px;cursor:pointer;padding:20px;">&#10095;</button>
            </div>
        </div>
    `);
}

// ----- Generate Gallery -----
function buildGallery(wrapper) {
    const path = wrapper.getAttribute('folder-path');
    const list = wrapper.getAttribute('images');
    
    // If in debug mode and missing attributes, generate random gallery
    if (CFG.debug && (!path || !list)) {
        console.log('🔧 Debug: Generating random gallery');
        generateRandomGallery(wrapper);
        return;
    }

    if (!path || !list) {
        wrapper.innerHTML = '<p style="color:red;padding:20px;">⚠️ Missing folder-path or images attribute</p>';
        return;
    }

    const maxCols = parseInt(wrapper.getAttribute('maxImages')) || CFG.maxColumns;
    const spacing = wrapper.getAttribute('image-spacing') || '5px';

    const gallery = document.createElement('div');
    gallery.className = 'gallery_justified';
    gallery.style.gap = spacing;
    gallery.style.margin = `-${spacing}`;
    gallery.dataset.maxColumns = maxCols;

    list.split(',').forEach(function(entry) {
        const isBreak = entry.endsWith('*');
        const name = isBreak ? entry.slice(0, -1).trim() : entry.trim();
        
        const item = document.createElement('div');
        item.className = 'gallery_item';
        item.style.padding = spacing;
        if (isBreak) item.dataset.forceBreak = 'true';

        const img = document.createElement('img');
        img.className = 'gallery_image';
        img.src = path + '/' + name;
        img.alt = name;
        img.loading = 'lazy';

        item.appendChild(img);
        gallery.appendChild(item);
    });

    wrapper.innerHTML = '';
    wrapper.appendChild(gallery);
}

// ----- Layout Engine -----
function layoutGallery(container) {
    const images = container.querySelectorAll('img');
    if (!images.length) return;

    const maxCols = parseInt(container.dataset.maxColumns) || CFG.maxColumns;
    const gap = parseFloat(getComputedStyle(container).gap) || 0;
    const width = container.clientWidth;

    let cols = Math.min(Math.max(Math.floor((width + gap) / (CFG.minWidth + gap)), 1), maxCols);
    let i = 0;

    while (i < images.length) {
        let end = Math.min(i + cols, images.length);
        
        // Check for forced breaks
        for (let j = i; j < end; j++) {
            const item = images[j].closest(CFG.itemSelector);
            if (item && item.dataset.forceBreak) { 
                end = j + 1; 
                break; 
            }
        }

        const actual = end - i;
        let totalRatio = 0;
        for (let j = i; j < end; j++) {
            totalRatio += images[j].naturalWidth / images[j].naturalHeight;
        }

        for (let j = i; j < end; j++) {
            const ratio = (images[j].naturalWidth / images[j].naturalHeight) / totalRatio;
            const item = images[j].closest(CFG.itemSelector);
            if (item) {
                item.style.width = 'calc((100% - ' + ((actual - 1) * gap) + 'px) * ' + ratio + ')';
            }
        }
        i = end;
    }
}

// ----- Initialize Galleries -----
function initGalleries() {
    const wrappers = document.querySelectorAll('.gallery_wrapper');
    if (!wrappers.length) {
        if (CFG.debug) {
            console.log('🔧 Debug: No galleries found');
        }
        return;
    }

    injectStyles();
    injectLightbox();

    wrappers.forEach(buildGallery);

    setTimeout(function() {
        document.querySelectorAll(CFG.selector).forEach(function(gallery) {
            const images = gallery.querySelectorAll('img');
            Promise.all(Array.from(images).map(function(img) {
                return img.complete ? Promise.resolve() : new Promise(function(resolve) {
                    img.onload = img.onerror = resolve;
                });
            })).then(function() {
                layoutGallery(gallery);
            });

            if (!gallery._resize) {
                gallery._resize = function() { layoutGallery(gallery); };
                window.addEventListener('resize', gallery._resize);
            }
        });
        initLightbox();
        
        if (CFG.debug) {
            console.log('🔧 Galleries initialized: ' + wrappers.length + ' galleries');
        }
    }, 100);
}

// ----- Lightbox Controls -----
function initLightbox() {
    const lb = document.querySelector(CFG.lightbox);
    if (!lb) return;

    const img = document.querySelector(CFG.lbImg);
    const counter = document.querySelector(CFG.lbCounter);
    let currentIndex = 0;
    let images = [];

    document.addEventListener('click', function(e) {
        const clicked = e.target.closest(CFG.imgSelector);
        if (!clicked) return;

        const gallery = clicked.closest(CFG.selector);
        if (!gallery) return;

        images = Array.from(gallery.querySelectorAll(CFG.imgSelector)).map(function(i) { return i.src; });
        currentIndex = images.indexOf(clicked.src);
        updateLightbox();
        lb.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    });

    function updateLightbox() {
        img.src = images[currentIndex];
        counter.textContent = (currentIndex + 1) + ' / ' + images.length;
    }

    function prev() { 
        currentIndex = (currentIndex - 1 + images.length) % images.length; 
        updateLightbox(); 
    }
    
    function next() { 
        currentIndex = (currentIndex + 1) % images.length; 
        updateLightbox(); 
    }

    const prevBtn = document.querySelector(CFG.lbPrev);
    const nextBtn = document.querySelector(CFG.lbNext);
    
    if (prevBtn) prevBtn.addEventListener('click', prev);
    if (nextBtn) nextBtn.addEventListener('click', next);
    
    lb.addEventListener('click', function(e) {
        if (e.target === lb || e.target === img) {
            lb.style.display = 'none';
            document.body.style.overflow = 'auto';
            img.src = '';
        }
    });

    document.addEventListener('keydown', function(e) {
        if (lb.style.display === 'flex') {
            if (e.key === 'ArrowRight') next();
            if (e.key === 'ArrowLeft') prev();
            if (e.key === 'Escape') {
                lb.style.display = 'none';
                document.body.style.overflow = 'auto';
                img.src = '';
            }
        }
    });
}

// ----- Public API -----
function reinitGalleries() {
    if (CFG.debug) console.log('🔧 Reinitializing galleries...');
    
    // Clean up
    document.querySelectorAll(CFG.selector).forEach(function(g) {
        if (g._resize) {
            window.removeEventListener('resize', g._resize);
            delete g._resize;
        }
    });
    document.querySelectorAll('.gallery_wrapper').forEach(function(w) {
        w.innerHTML = '';
    });
    
    // Remove lightbox
    var lb = document.querySelector(CFG.lightbox);
    if (lb) lb.remove();
    
    // Re-init
    initGalleries();
}

function removeGalleries() {
    if (CFG.debug) console.log('🔧 Removing galleries...');
    
    var styles = document.querySelector('#gallery-styles');
    if (styles) styles.remove();
    
    var lb = document.querySelector(CFG.lightbox);
    if (lb) lb.remove();
    
    document.querySelectorAll(CFG.selector).forEach(function(g) {
        if (g._resize) {
            window.removeEventListener('resize', g._resize);
            delete g._resize;
        }
    });
    
    document.querySelectorAll('.gallery_wrapper').forEach(function(w) {
        w.innerHTML = '';
    });
}

// Expose globally
window.reinitGalleries = reinitGalleries;
window.removeGalleries = removeGalleries;

// Auto-init if galleries exist
if (document.querySelectorAll('.gallery_wrapper').length) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGalleries);
    } else {
        setTimeout(initGalleries, 100);
    }
}