const GALLERY_SETTINGS = {
  minWidth: 225,
  maxColumns: 4,
  gallerySelector: '.gallery_justified',
  galleryItemSelector: '.gallery_item',
  lightboxSelector: '#custom-lightbox',
  lightboxImgSelector: '#lightbox-img',
  lightboxCounterSelector: '#lb-counter',
  lightboxPrevSelector: '#lb-prev',
  lightboxNextSelector: '#lb-next',
  galleryImageSelector: '.gallery_image',
};

function injectStyles() {
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    .gallery_justified {
      display: flex;
      flex-wrap: wrap;
      margin: -5px; 
    }
    .gallery_item {
      padding: 5px; 
      box-sizing: border-box;
    }
    .gallery_image {
      height: 100%;
      width: 100%;
      display: block;
      margin-bottom: 0;
      object-fit: cover;
      cursor: pointer;
    }
  `;
  document.head.appendChild(styleElement);
}

function injectLightboxHTML() {
  if (document.querySelector('#custom-lightbox')) return;
  
  const lightboxHTML = `
    <div id="custom-lightbox" style="display:none; position:fixed; z-index:9999; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.95); align-items:center; justify-content:center; flex-direction:column;">
        <div id="lb-counter" style="color:white; margin-bottom:15px; font-family:sans-serif; opacity:0.7; font-size: 14px; letter-spacing: 1px;"></div>
        <div style="position:relative; display:flex; align-items:center; justify-content:center; width:100%; height:85%;">
            <img id="lightbox-img" src="" style="max-width:90%; max-height:100%; object-fit:contain; border-radius:2px;">
            <button id="lb-prev" style="position:absolute; left:20px; background:none; border:none; color:white; font-size:40px; cursor:pointer; padding:20px; transition: opacity 0.2s;">&#10094;</button>
            <button id="lb-next" style="position:absolute; right:20px; background:none; border:none; color:white; font-size:40px; cursor:pointer; padding:20px; transition: opacity 0.2s;">&#10095;</button>
        </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', lightboxHTML);
}

function generateRandomGallery(wrapper) {
  const maxColumns = parseInt(wrapper.getAttribute('maxImages')) || GALLERY_SETTINGS.maxColumns;
  const imageSpacing = wrapper.getAttribute('image-spacing') || '5px';
  const randomCount = Math.floor(Math.random() * 20) + 5;
  
  const galleryDiv = document.createElement('div');
  galleryDiv.className = 'gallery_justified';
  galleryDiv.style.gap = imageSpacing;
  galleryDiv.style.margin = `-${imageSpacing}`;
  galleryDiv.dataset.maxColumns = maxColumns; // Speichere maxColumns für diese Galerie
  
  for (let i = 0; i < randomCount; i++) {
    const width = Math.floor(Math.random() * 600) + 400;
    const height = Math.floor(Math.random() * 600) + 400;
    
    const itemDiv = document.createElement('div');
    itemDiv.className = 'gallery_item';
    itemDiv.style.padding = imageSpacing;
    
    const img = document.createElement('img');
    img.className = 'gallery_image';
    img.src = `https://picsum.photos/${width}/${height}?random=${i}`;
    img.alt = `random-${i}`;
    img.setAttribute('fc-gallery', 'item');
    
    itemDiv.appendChild(img);
    galleryDiv.appendChild(itemDiv);
  }
  
  wrapper.innerHTML = '';
  wrapper.appendChild(galleryDiv);
}

function generateGalleryFromWrapper(wrapper) {
  const folderPath = wrapper.getAttribute('folder-path');
  const imagesList = wrapper.getAttribute('images');
  
  if (!folderPath || !imagesList) {
    generateRandomGallery(wrapper);
    return;
  }

  const maxColumns = parseInt(wrapper.getAttribute('maxImages')) || GALLERY_SETTINGS.maxColumns;
  const imageSpacing = wrapper.getAttribute('image-spacing') || '5px';
  
  const imageEntries = imagesList.split(',').map(name => name.trim());
  
  const galleryDiv = document.createElement('div');
  galleryDiv.className = 'gallery_justified';
  galleryDiv.style.gap = imageSpacing;
  galleryDiv.style.margin = `-${imageSpacing}`;
  galleryDiv.dataset.maxColumns = maxColumns; // Speichere maxColumns für diese Galerie
  
  imageEntries.forEach(entry => {
    const hasBreak = entry.endsWith('*');
    const imageName = hasBreak ? entry.slice(0, -1).trim() : entry;
    
    const itemDiv = document.createElement('div');
    itemDiv.className = 'gallery_item';
    itemDiv.style.padding = imageSpacing;
    
    if (hasBreak) {
      itemDiv.setAttribute('data-force-break', 'true');
    }
    
    const img = document.createElement('img');
    img.className = 'gallery_image';
    img.src = `${folderPath}/${imageName}`;
    img.alt = imageName;
    img.setAttribute('fc-gallery', 'item');
    
    itemDiv.appendChild(img);
    galleryDiv.appendChild(itemDiv);
  });
  
  wrapper.innerHTML = '';
  wrapper.appendChild(galleryDiv);
}

function setGalleryLayout(container, galleryImages, gapPx) {
  if (galleryImages.length === 0) return;
  
  const containerMaxColumns = parseInt(container.dataset.maxColumns) || GALLERY_SETTINGS.maxColumns;
  
  const containerWidth = container.clientWidth;

  let columns = Math.floor((containerWidth + gapPx) / (GALLERY_SETTINGS.minWidth + gapPx));
  columns = Math.max(columns, 1);
  columns = Math.min(columns, containerMaxColumns);

  let i = 0;
  
  while (i < galleryImages.length) {
    let rowEnd = i + columns;
    
    for (let j = i; j < Math.min(i + columns, galleryImages.length); j++) {
      const galleryItem = galleryImages[j].closest(GALLERY_SETTINGS.galleryItemSelector);
      if (galleryItem && galleryItem.hasAttribute('data-force-break')) {
        rowEnd = j + 1;
        break;
      }
    }
    
    let sumRatios = 0;
    let actualItemsInRow = 0;
    for (let j = i; j < rowEnd; j++) {
      if (j >= galleryImages.length) break;
      sumRatios += galleryImages[j].naturalWidth / galleryImages[j].naturalHeight;
      actualItemsInRow++;
    }

    for (let j = i; j < rowEnd; j++) {
      if (j >= galleryImages.length) break;
      const ratio = (galleryImages[j].naturalWidth / galleryImages[j].naturalHeight) / sumRatios;
      const galleryItem = galleryImages[j].closest(GALLERY_SETTINGS.galleryItemSelector);
      if (galleryItem) {
        galleryItem.style.width = `calc((100% - ${(actualItemsInRow - 1) * gapPx}px) * ${ratio})`;
      }
    }
    
    i = rowEnd;
  }
}

function initLayout() {
  const galleryLists = document.querySelectorAll(GALLERY_SETTINGS.gallerySelector);
  galleryLists.forEach(galleryList => {
    const galleryImages = galleryList.querySelectorAll('img');
    const gap = getComputedStyle(galleryList).gap || '0px';
    const gapPx = parseFloat(gap);

    const runLayout = () => setGalleryLayout(galleryList, galleryImages, gapPx);

    Promise.all(Array.from(galleryImages).filter(img => !img.complete).map(img => new Promise(resolve => { img.onload = img.onerror = resolve; })))
      .then(runLayout);
    
    window.addEventListener('resize', runLayout);
  });
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
    lightbox.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  });

  function updateLightbox() {
    lbImg.src = currentGalleryImages[currentIndex];
    lbCounter.innerText = `${currentIndex + 1} / ${currentGalleryImages.length}`;
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

  const nextButton = document.querySelector(GALLERY_SETTINGS.lightboxNextSelector);
  const prevButton = document.querySelector(GALLERY_SETTINGS.lightboxPrevSelector);
  
  if (nextButton) nextButton.onclick = next;
  if (prevButton) prevButton.onclick = prev;
  
  lightbox.onclick = () => {
    lightbox.style.display = 'none';
    document.body.style.overflow = 'auto';
    lbImg.src = "";
  };

  document.onkeydown = (e) => {
    if (lightbox.style.display === 'flex') {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "Escape") lightbox.onclick();
    }
  };
}

function initGalleries() {
  injectStyles();
  injectLightboxHTML();
  
  const wrappers = document.querySelectorAll('.gallery_wrapper');
  
  if (wrappers.length === 0) {
    const randomWrapper = document.createElement('div');
    randomWrapper.className = 'gallery_wrapper';
    document.body.appendChild(randomWrapper);
    generateRandomGallery(randomWrapper);
  } else {
    wrappers.forEach(wrapper => {
      generateGalleryFromWrapper(wrapper);
    });
  }
  
  initLayout();
  initLightbox();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGalleries);
} else {
  initGalleries();
}