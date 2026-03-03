const GALLERY_SETTINGS = {
  minWidth: 250,
  maxColumns: 4,
  gallerySelector: '[fc-gallery=list]',
  galleryItemSelector: '[fc-gallery=item]',
  lightboxSelector: '#custom-lightbox',
  lightboxImgSelector: '#lightbox-img',
  lightboxCounterSelector: '#lb-counter',
  lightboxPrevSelector: '#lb-prev',
  lightboxNextSelector: '#lb-next',
  galleryImageSelector: '.gallery_image',
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

function generateGalleryFromList() {
  const galleryLists = document.querySelectorAll(GALLERY_SETTINGS.gallerySelector);
  if (galleryLists.length === 0) return false;

  galleryLists.forEach(galleryList => {
    applyCSSToElement(galleryList, GALLERY_SETTINGS.css.wrapper);
    
    const imageSpacing = galleryList.getAttribute('image-spacing');
    if (imageSpacing) {
      galleryList.style.gap = imageSpacing;
    }
    
    const folder = galleryList.getAttribute('folder-path') || './img';
    const imageString = galleryList.getAttribute('images') || '';
    if (!imageString) return;

    const imageFiles = imageString.split(',').map(name => name.trim()).filter(Boolean);
    
    const itemsHtml = imageFiles.map(fileName => {
      const imgSrc = `${folder}/${fileName}`;
      return `
        <div fc-gallery="item">
          <img src="${imgSrc}" class="gallery_image" alt="${fileName}" loading="lazy">
        </div>
      `;
    }).join('');

    galleryList.innerHTML = itemsHtml;
    
    const items = galleryList.querySelectorAll(GALLERY_SETTINGS.galleryItemSelector);
    items.forEach(item => applyCSSToElement(item, GALLERY_SETTINGS.css.item));
  });
  
  return true;
}

function setGalleryLayout(container, galleryImages, gapPx) {
  if (galleryImages.length === 0) return;
  
  // Nur Bilder mit gültigen Dimensionen verwenden
  const validImages = Array.from(galleryImages).filter(img => 
    img.naturalWidth > 0 && img.naturalHeight > 0
  );
  
  if (validImages.length === 0) return;
  
  const containerWidth = container.clientWidth;
  const shouldStretchLastRow = container.getAttribute('row-stretch') !== '0';
  
  // maxImages aus Attribut
  const maxImagesAttr = container.getAttribute('maxImages');
  const maxColumns = maxImagesAttr ? parseInt(maxImagesAttr, 10) : GALLERY_SETTINGS.maxColumns;

  let columns = Math.floor((containerWidth + gapPx) / (GALLERY_SETTINGS.minWidth + gapPx));
  columns = Math.max(columns, 1);
  columns = Math.min(columns, maxColumns, validImages.length);

  for (let i = 0; i < validImages.length; i += columns) {
    let sumRatios = 0;
    let actualItemsInRow = 0;
    for (let j = 0; j < columns; j++) {
      if (i + j >= validImages.length) break;
      sumRatios += validImages[i + j].naturalWidth / validImages[i + j].naturalHeight;
      actualItemsInRow++;
    }

    let targetSum = sumRatios;
    if (!shouldStretchLastRow && i + columns >= validImages.length && actualItemsInRow < columns) {
      targetSum = (sumRatios / actualItemsInRow) * columns;
    }

    for (let j = 0; j < columns; j++) {
      if (i + j >= validImages.length) break;
      const ratio = (validImages[i + j].naturalWidth / validImages[i + j].naturalHeight) / targetSum;
      const galleryItem = validImages[i + j].closest(GALLERY_SETTINGS.galleryItemSelector);
      if (galleryItem) {
        galleryItem.style.width = `calc((100% - ${(columns - 1) * gapPx}px) * ${ratio})`;
      }
    }
  }
}

function initLayout() {
  const galleryLists = document.querySelectorAll(GALLERY_SETTINGS.gallerySelector);
  
  galleryLists.forEach(galleryList => {
    // CSS auf Wrapper anwenden
    applyCSSToElement(galleryList, GALLERY_SETTINGS.css.wrapper);
    
    // Gap aus image-spacing Attribut
    const imageSpacing = galleryList.getAttribute('image-spacing');
    if (imageSpacing) {
      galleryList.style.gap = imageSpacing;
    }
    
    let galleryImages = galleryList.querySelectorAll(GALLERY_SETTINGS.galleryImageSelector);
    
    // CSS auf Items anwenden
    const items = galleryList.querySelectorAll(GALLERY_SETTINGS.galleryItemSelector);
    items.forEach(item => applyCSSToElement(item, GALLERY_SETTINGS.css.item));
    
    // CSS auf Bilder anwenden
    galleryImages.forEach(img => applyCSSToElement(img, GALLERY_SETTINGS.css.image));

    const gap = getComputedStyle(galleryList).gap !== 'normal' ? getComputedStyle(galleryList).gap : '0px';
    const gapPx = parseFloat(gap);

    const runLayout = () => setGalleryLayout(galleryList, galleryImages, gapPx);

    // Warte auf alle Bilder
    Promise.all(Array.from(galleryImages).map(img => {
      if (img.complete && img.naturalHeight > 0) return Promise.resolve();
      return new Promise(resolve => { 
        img.onload = resolve; 
        img.onerror = resolve; 
      });
    })).then(runLayout);
    
    window.addEventListener('resize', runLayout);
  });
}

function injectLightboxHTML() {
  if (document.querySelector(GALLERY_SETTINGS.lightboxSelector)) return;
  
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
}

function initLightbox() {
  const lightbox = document.querySelector(GALLERY_SETTINGS.lightboxSelector);
  const lbImg = document.querySelector(GALLERY_SETTINGS.lightboxImgSelector);
  const lbCounter = document.querySelector(GALLERY_SETTINGS.lightboxCounterSelector);
  
  let currentIndex = 0;
  let currentGalleryImages = [];

  document.addEventListener('click', function(e) {
    const clickedImg = e.target.closest(GALLERY_SETTINGS.galleryImageSelector);
    if (!clickedImg) return;

    e.preventDefault();
    const parentGallery = clickedImg.closest(GALLERY_SETTINGS.gallerySelector);
    const allImgsInGallery = Array.from(parentGallery.querySelectorAll(GALLERY_SETTINGS.galleryImageSelector));
    
    currentGalleryImages = allImgsInGallery.map(img => img.getAttribute('src'));
    currentIndex = allImgsInGallery.indexOf(clickedImg);
    
    updateLightbox();
    if (lightbox) lightbox.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  });

  function updateLightbox() {
    if (!lbImg) return;
    lbImg.src = currentGalleryImages[currentIndex];
    if (lbCounter) lbCounter.innerText = `${currentIndex + 1} / ${currentGalleryImages.length}`;
  }

  const next = (e) => { 
    if(e) e.stopPropagation(); 
    currentIndex = (currentIndex + 1) % currentGalleryImages.length; 
    updateLightbox(); 
  };
  
  const prev = (e) => { 
    if(e) e.stopPropagation(); 
    currentIndex = (currentIndex - 1 + currentGalleryImages.length) % currentGalleryImages.length; 
    updateLightbox(); 
  };

  const btnNext = document.querySelector(GALLERY_SETTINGS.lightboxNextSelector);
  const btnPrev = document.querySelector(GALLERY_SETTINGS.lightboxPrevSelector);
  
  if (btnNext) btnNext.onclick = next;
  if (btnPrev) btnPrev.onclick = prev;
  
  if (lightbox) {
    lightbox.addEventListener('click', function(e) {
      const isClickOnImage = e.target.closest('#lightbox-img');
      const isClickOnPrev = e.target.closest('#lb-prev');
      const isClickOnNext = e.target.closest('#lb-next');
      
      if (!isClickOnImage && !isClickOnPrev && !isClickOnNext) {
        lightbox.style.display = 'none';
        document.body.style.overflow = 'auto';
        if (lbImg) lbImg.src = "";
      }
    });
  }

  document.onkeydown = (e) => {
    if (lightbox && lightbox.style.display === 'flex') {
      if (e.key === "ArrowRight") { e.preventDefault(); next(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
      if (e.key === "Escape") { 
        lightbox.style.display = 'none';
        document.body.style.overflow = 'auto';
        if (lbImg) lbImg.src = "";
      }
    }
  };
}

// --- INIT ---
document.addEventListener('DOMContentLoaded', function() {
  injectLightboxHTML();
  generateGalleryFromList();
  setTimeout(() => {
    initLayout();
  }, 50);
  initLightbox();
});