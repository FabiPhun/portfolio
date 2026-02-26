const GALLERY_SETTINGS = {
  minWidth: 250,
  maxColumns: 4,
  gallery: '[fc-gallery=list]',
  item: '[fc-gallery=item]',
  lightbox: '#custom-lightbox',
  lightboxImg: '#lightbox-img',
  lightboxCounter: '#lb-counter',
  lightboxPrev: '#lb-prev',
  lightboxNext: '#lb-next',
  galleryImage: '.gallery_image',
  css: {
    wrapper: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '5px',
      margin: '0 auto',
      width: '100%'
    },
    item: {
      padding: '0',
      boxSizing: 'border-box',
      flex: '0 1 auto'
    },
    image: {
      height: '100%',
      width: '100%',
      display: 'block',
      marginBottom: '0',
      objectFit: 'cover',
      cursor: 'pointer'
    }
  }
};


const applyCSSToElement = (element, cssObject) => {
  if (!element) return;
  Object.assign(element.style, cssObject);
};

const areImagesLoaded = (images) => 
  Array.from(images).every(img => img.complete && img.naturalHeight > 0);


const injectLightboxHTML = () => {
  const lightboxHTML = `
    <div id="custom-lightbox" style="display:none; position:fixed; z-index:9999; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.95); align-items:center; justify-content:center; flex-direction:column;">
      <div id="lb-counter" style="color:white; margin-bottom:15px; font-family:sans-serif; opacity:0.7; font-size: 14px; letter-spacing: 1px;"></div>
      <div style="position:relative; display:flex; align-items:center; justify-content:center; width:100%; height:85%;">
        <img id="lightbox-img" src="" style="max-width:90%; max-height:100%; object-fit:contain; border-radius:2px;">
        <button id="lb-prev" style="position:absolute; left:20px; background:none; border:none; color:white; font-size:40px; cursor:pointer; padding:20px;">&#10094;</button>
        <button id="lb-next" style="position:absolute; right:20px; background:none; border:none; color:white; font-size:40px; cursor:pointer; padding:20px;">&#10095;</button>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', lightboxHTML);
};


const generateGalleryFromList = () => {
  const galleryLists = document.querySelectorAll(GALLERY_SETTINGS.gallery);
  if (galleryLists.length === 0) return false;

  galleryLists.forEach(galleryList => {
    // Basis Styles anwenden (ohne gap - das kommt separat)
    applyCSSToElement(galleryList, {
      display: 'flex',
      flexWrap: 'wrap',
      margin: '0 auto',
      width: '100%'
    });
    
    // 🔥 Gap aus image-spacing Attribut setzen, wenn vorhanden
    const imageSpacing = galleryList.getAttribute('image-spacing');
    if (imageSpacing) {
      galleryList.style.gap = imageSpacing;
    } else {
      // Sonst Default aus GALLERY_SETTINGS
      galleryList.style.gap = GALLERY_SETTINGS.css.wrapper.gap;
    }
    
    const folder = galleryList.getAttribute('folder-path') || './img';
    const imageString = galleryList.getAttribute('images') || '';
    if (!imageString) return;

    const imageFiles = imageString.split(',').map(name => name.trim()).filter(Boolean);
    
    const itemsHtml = imageFiles.map(fileName => {
      const imgSrc = `${folder}/${fileName}`;
      return `
        <div fc-gallery="item" style="padding: ${GALLERY_SETTINGS.css.item.padding}; box-sizing: ${GALLERY_SETTINGS.css.item.boxSizing};">
          <img src="${imgSrc}" class="gallery_image" alt="${fileName}" style="height: ${GALLERY_SETTINGS.css.image.height}; width: ${GALLERY_SETTINGS.css.image.width}; display: ${GALLERY_SETTINGS.css.image.display}; margin-bottom: ${GALLERY_SETTINGS.css.image.marginBottom}; object-fit: ${GALLERY_SETTINGS.css.image.objectFit}; cursor: ${GALLERY_SETTINGS.css.image.cursor};">
        </div>
      `;
    }).join('');

    galleryList.innerHTML = itemsHtml;
  });
  
  return true;
};


const setGalleryLayout = (container, galleryImages) => {
  if (galleryImages.length === 0 || !areImagesLoaded(galleryImages)) return;
  
  // 🔥 Gap aus dem style oder computed Style lesen
  const gapValue = container.style.gap || getComputedStyle(container).gap;
  const gapPx = parseFloat(gapValue) || 0;
  
  // 🔥 maxColumns aus maxImages Attribut oder Default
  const maxImagesAttr = container.getAttribute('maxImages');
  const maxColumns = maxImagesAttr ? parseInt(maxImagesAttr, 10) : GALLERY_SETTINGS.maxColumns;
  
  const containerWidth = container.clientWidth;
  const shouldStretchLastRow = container.getAttribute('row-stretch') !== '0';

  let columns = Math.floor(containerWidth / (GALLERY_SETTINGS.minWidth + gapPx));
  columns = Math.max(1, Math.min(columns, maxColumns, galleryImages.length));

  const availableWidth = containerWidth - ((columns - 1) * gapPx);
  
  // Reset widths
  Array.from(galleryImages).forEach(img => {
    const item = img.closest(GALLERY_SETTINGS.item);
    if (item) item.style.width = '';
  });

  for (let i = 0; i < galleryImages.length; i += columns) {
    let sumRatios = 0;
    let actualItemsInRow = 0;
    const rowImages = [];
    
    for (let j = 0; j < columns; j++) {
      if (i + j >= galleryImages.length) break;
      const img = galleryImages[i + j];
      sumRatios += img.naturalWidth / img.naturalHeight;
      actualItemsInRow++;
      rowImages.push(img);
    }

    const isLastRowWithFewerItems = !shouldStretchLastRow && 
                                    i + columns >= galleryImages.length && 
                                    actualItemsInRow < columns;

    if (isLastRowWithFewerItems) {
      // Letzte Reihe mit weniger Items
      const lastRowWidth = (availableWidth / columns) * actualItemsInRow;
      const lastRowGapWidth = (actualItemsInRow - 1) * gapPx;
      const lastRowAvailableWidth = lastRowWidth - lastRowGapWidth;
      
      rowImages.forEach(img => {
        const ratio = (img.naturalWidth / img.naturalHeight) / sumRatios;
        const item = img.closest(GALLERY_SETTINGS.item);
        if (item) item.style.width = `${lastRowAvailableWidth * ratio}px`;
      });
    } else {
      // Normale Reihen
      rowImages.forEach(img => {
        const ratio = (img.naturalWidth / img.naturalHeight) / sumRatios;
        const item = img.closest(GALLERY_SETTINGS.item);
        if (item) {
          item.style.width = `calc((100% - ${(columns - 1) * gapPx}px) * ${ratio})`;
        }
      });
    }
  }
  
  // Container Höhe zurücksetzen
  setTimeout(() => { container.style.height = 'auto'; }, 10);
};


const initLayout = () => {
  const galleryLists = document.querySelectorAll(GALLERY_SETTINGS.gallery);

  galleryLists.forEach(galleryList => {
    // Basis Styles anwenden
    applyCSSToElement(galleryList, {
      display: 'flex',
      flexWrap: 'wrap',
      margin: '0 auto',
      width: '100%'
    });
    
    // 🔥 Gap aus image-spacing Attribut setzen, wenn vorhanden (wichtig für init)
    const imageSpacing = galleryList.getAttribute('image-spacing');
    if (imageSpacing) {
      galleryList.style.gap = imageSpacing;
    } else if (!galleryList.style.gap) {
      // Nur setzen wenn nicht schon durch generateGalleryFromList gesetzt
      galleryList.style.gap = GALLERY_SETTINGS.css.wrapper.gap;
    }
    
    let galleryImages = galleryList.querySelectorAll(GALLERY_SETTINGS.galleryImage);
    if (galleryImages.length === 0) {
      galleryImages = galleryList.querySelectorAll('img');
    }

    // Fallback: Generiere zufällige Bilder wenn keine vorhanden
    if (galleryImages.length === 0) {
      for (let i = 0; i < 12; i++) {
        const randomId = Math.floor(Math.random() * 1000);
        const w = Math.floor(Math.random() * 600) + 400;
        const h = Math.floor(Math.random() * 600) + 300;

        const itemHtml = `
          <div fc-gallery="item" style="padding: ${GALLERY_SETTINGS.css.item.padding}; box-sizing: ${GALLERY_SETTINGS.css.item.boxSizing};">
            <img src="https://picsum.photos/seed/${randomId}/${w}/${h}" class="gallery_image" alt="Random" style="height: ${GALLERY_SETTINGS.css.image.height}; width: ${GALLERY_SETTINGS.css.image.width}; display: ${GALLERY_SETTINGS.css.image.display}; margin-bottom: ${GALLERY_SETTINGS.css.image.marginBottom}; object-fit: ${GALLERY_SETTINGS.css.image.objectFit}; cursor: ${GALLERY_SETTINGS.css.image.cursor};">
          </div>
        `;
        galleryList.insertAdjacentHTML('beforeend', itemHtml);
      }
      galleryImages = galleryList.querySelectorAll(GALLERY_SETTINGS.galleryImage);
    } else {
      // CSS auf bestehende Elemente anwenden
      galleryImages.forEach(img => {
        applyCSSToElement(img, GALLERY_SETTINGS.css.image);
        const galleryItem = img.closest(GALLERY_SETTINGS.item);
        if (galleryItem) {
          applyCSSToElement(galleryItem, GALLERY_SETTINGS.css.item);
        }
      });
    }

    const checkAllImagesLoaded = () => {
      if (areImagesLoaded(galleryImages)) {
        setGalleryLayout(galleryList, galleryImages);
      } else {
        setTimeout(checkAllImagesLoaded, 100);
      }
    };

    checkAllImagesLoaded();
    window.addEventListener('resize', checkAllImagesLoaded);
  });
};


const initLightbox = () => {
  const lightbox = document.querySelector(GALLERY_SETTINGS.lightbox);
  const lbImg = document.querySelector(GALLERY_SETTINGS.lightboxImg);
  const lbCounter = document.querySelector(GALLERY_SETTINGS.lightboxCounter);

  let currentIndex = 0;
  let currentGalleryImages = [];

  const closeLightbox = () => {
    if (lightbox) {
      lightbox.style.display = 'none';
      document.body.style.overflow = 'auto';
      if (lbImg) lbImg.src = "";
    }
  };

  const updateLightbox = () => {
    if (!lbImg) return;
    lbImg.src = currentGalleryImages[currentIndex];
    if (lbCounter) {
      lbCounter.innerText = `${currentIndex + 1} / ${currentGalleryImages.length}`;
    }
  };

  const next = (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    currentIndex = (currentIndex + 1) % currentGalleryImages.length;
    updateLightbox();
  };

  const prev = (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    currentIndex = (currentIndex - 1 + currentGalleryImages.length) % currentGalleryImages.length;
    updateLightbox();
  };

  // Event Listeners
  document.addEventListener('click', e => {
    const clickedImg = e.target.closest(GALLERY_SETTINGS.galleryImage);
    if (!clickedImg) return;

    e.preventDefault();
    const parentGallery = clickedImg.closest(GALLERY_SETTINGS.gallery);
    const allImgsInGallery = Array.from(parentGallery.querySelectorAll(GALLERY_SETTINGS.galleryImage));

    currentGalleryImages = allImgsInGallery.map(img => img.getAttribute('src'));
    currentIndex = allImgsInGallery.indexOf(clickedImg);

    updateLightbox();
    if (lightbox) {
      lightbox.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }
  });

  if (lightbox) {
    lightbox.addEventListener('click', e => {
      const isClickOnImage = e.target.closest('#lightbox-img');
      const isClickOnPrevButton = e.target.closest('#lb-prev');
      const isClickOnNextButton = e.target.closest('#lb-next');
      
      if (!isClickOnImage && !isClickOnPrevButton && !isClickOnNextButton) {
        closeLightbox();
      }
    });
  }

  const btnNext = document.querySelector(GALLERY_SETTINGS.lightboxNext);
  const btnPrev = document.querySelector(GALLERY_SETTINGS.lightboxPrev);

  if (btnNext) btnNext.addEventListener('click', next);
  if (btnPrev) btnPrev.addEventListener('click', prev);

  document.addEventListener('keydown', e => {
    if (lightbox && lightbox.style.display === 'flex') {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        closeLightbox();
      }
    }
  });
};


document.addEventListener('DOMContentLoaded', () => {
  injectLightboxHTML();
  generateGalleryFromList();
  initLayout();
  initLightbox();
});