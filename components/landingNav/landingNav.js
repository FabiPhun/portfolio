function loadLandingNav() {
  // Einfach absolute Pfade - Server macht's möglich!
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/components/landingNav/landingNav.css';
  document.head.appendChild(link);

  fetch('/components/landingNav/landingNav.html')
    .then(response => response.text())
    .then(data => {
      const navMenu = document.querySelector('.nav-menu');
      if (navMenu) {
        navMenu.insertAdjacentHTML('beforeend', data);
        
        // Aktuelle Seite markieren
        const currentPath = window.location.pathname;
        const currentFile = currentPath.split('/').pop() || 'home.html';
        
        document.querySelectorAll('.landing-nav-item').forEach(link => {
          const href = link.getAttribute('href');
          const hrefFile = href.split('/').pop();
          
          if (currentFile === hrefFile) {
            link.setAttribute('current', '');
          }
        });
      }
    })
    .catch(error => console.error('Fehler:', error));
}

document.addEventListener('DOMContentLoaded', loadLandingNav);