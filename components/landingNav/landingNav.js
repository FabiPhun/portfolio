function loadLandingNav() {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'components/landingNav/landingNav.css';
  document.head.appendChild(link);

  fetch('components/landingNav/landingNav.html')
    .then(response => response.text())
    .then(data => {
      const navMenu = document.querySelector('.nav-menu');
      navMenu.insertAdjacentHTML('beforeend', data);
      
      // Aktuelle Datei aus der URL extrahieren
      const currentPath = window.location.pathname;
      const currentFile = currentPath.split('/').pop() || 'home.html';
      
      // Alle Nav-Links durchgehen
      document.querySelectorAll('.landing-nav-item').forEach(link => {
        const href = link.getAttribute('href');
        const hrefFile = href.split('/').pop();
        
        // Vergleiche nur die Dateinamen
        if (currentFile === hrefFile) {
          link.setAttribute('current', '');
        }
        
        // Spezialfall für Home (wenn keine Datei in der URL)
        if (currentPath === '/' || currentPath === '') {
          if (href === 'index.html' || href === '/') {
            link.setAttribute('current', '');
          }
        }
      });
    })
    .catch(error => console.error('Error loading navbar:', error));
}

document.addEventListener('DOMContentLoaded', loadLandingNav);