//-----------!! setup !!-----------//

(function() {
    // Finde heraus wo navbar.js geladen wurde
    const scripts = document.getElementsByTagName('script');
    let navbarScriptPath = '';
    
    for (let i = 0; i < scripts.length; i++) {
        if (scripts[i].src.includes('navbar.js')) {
            navbarScriptPath = scripts[i].src;
            break;
        }
    }
    
    console.log('RAW navbar.js path:', navbarScriptPath);
    
    // BEREINIGE DEN PFAD KORREKT
    // 1. Entferne mehrfache Slashes (/// -> /)
    navbarScriptPath = navbarScriptPath.replace(/\/\/+/g, '/');
    // 2. Stelle sicher, dass file:/// korrekt ist (3 Slashes nach file:)
    navbarScriptPath = navbarScriptPath.replace('file:/', 'file:///');
    
    console.log('CLEANED navbar.js path:', navbarScriptPath);
    
    // Extrahiere das Verzeichnis von navbar.js
    const navbarDir = navbarScriptPath.substring(0, navbarScriptPath.lastIndexOf('/') + 1);
    console.log('navbar Verzeichnis:', navbarDir);
    
    function loadNavbarCSS() {
        if (!document.querySelector('link[href*="navbar.css"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            
            // navbar.css ist im gleichen Verzeichnis wie navbar.js
            link.href = navbarDir + 'navbar.css';
            
            document.head.appendChild(link);
            console.log('CSS geladen von:', link.href);
        }
    }
    
    function loadNavbarHTML(callback) {
        const navbarContainer = document.getElementById('navbar-container');
        
        if (!navbarContainer) {
            console.error('<div id="navbar-container"></div> missing!');
            return;
        }

        if (navbarContainer.children.length > 0) {
            if (callback) callback();
            // Add this: ensure padding is set even if navbar already exists
            setTimeout(adjustBodyContentPadding, 50);
            return;
        }

        // navbar.html ist im gleichen Verzeichnis wie navbar.js
        const navbarPath = navbarDir + 'navbar.html';
        console.log('Fetch HTML von:', navbarPath);

        fetch(navbarPath)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(data => {
                navbarContainer.innerHTML = data;
                
                const showDesktop = navbarContainer.getAttribute('desktopNav') !== 'false';
                const showMobile = navbarContainer.getAttribute('mobileNav') !== 'false';
                
                if (!showDesktop) {
                    const desktopNav = document.getElementById('desktopNav');
                    if (desktopNav) desktopNav.remove();
                }
                
                if (!showMobile) {
                    const mobileNav = document.getElementById('mobileNav');
                    const mobileMenu = document.getElementById('mobileMenu');
                    if (mobileNav) mobileNav.remove();
                    if (mobileMenu) mobileMenu.remove();
                }
                
                if (callback) callback();
                // Add this: ensure padding is set after HTML is injected
                setTimeout(adjustBodyContentPadding, 100);
            })
            .catch(error => {
                console.error('Fetch failed:', error);
            });
    }

 
    //replace placeholder by fetched html
    function initNavigation() {       
        const elements = {
            menuToggle: document.getElementById('menuToggle'),
            mobileNav: document.getElementById('mobileNav'),
            mobileMenu: document.getElementById('mobileMenu'),
            desktopNav: document.getElementById('desktopNav'),
            template: document.getElementById('navContentTemplate')
        };

        if (!elements.mobileNav) {
            console.log('Mobile Navigation ist deaktiviert');
            if (elements.desktopNav && elements.template) {
                const content = elements.template.content.cloneNode(true);
                if (elements.desktopNav.children.length === 0) {
                    elements.desktopNav.appendChild(content);
                }
            }
            // Still adjust padding for desktop if needed
            setTimeout(adjustBodyContentPadding, 50);
            return;
        }

        if (!elements.menuToggle || !elements.mobileNav) {
            setTimeout(initNavigation, 100);
            return;
        }

        createOverlay();

        if (elements.template) {
            const content = elements.template.content.cloneNode(true);

            if (elements.desktopNav && elements.desktopNav.children.length === 0) {
                elements.desktopNav.appendChild(content.cloneNode(true));
            }

            if (elements.mobileMenu && elements.mobileMenu.children.length === 0) {
                elements.mobileMenu.appendChild(content.cloneNode(true));
            }
        }

        if (elements.mobileMenu) {
            mobileNavbarFunctionality(elements.menuToggle, elements.mobileMenu);
        }

        // Call padding adjustment multiple times to ensure it works
        setTimeout(adjustBodyContentPadding, 0);  // Immediate after sync code
        setTimeout(adjustBodyContentPadding, 50); // After potential reflows
        setTimeout(adjustBodyContentPadding, 150); // After everything is settled
        
        window.addEventListener('resize', adjustBodyContentPadding);
        // Also listen for orientation changes on mobile
        window.addEventListener('orientationchange', adjustBodyContentPadding);
        
        //-----------!! LINK HANDLER HIER EINGEFÜGT !!-----------//
        setupNavLinks();
    }

    //-----------!! LINK HANDLER FUNKTION !!-----------//
    function setupNavLinks() {
        document.querySelectorAll('.nav-link-main, .nav-link-sub').forEach(link => {
            link.removeEventListener('click', navLinkHandler);
            link.addEventListener('click', navLinkHandler);
        });
    }
    
    function navLinkHandler(e) {
        e.preventDefault();
        
        const targetFile = this.getAttribute('href');
        const currentPath = window.location.pathname;
        
        let currentDir = currentPath.substring(0, currentPath.lastIndexOf('/') + 1);
        let depth = 0;
        let maxDepth = 10;
        
        function checkFile(path) {
            fetch(path, { method: 'HEAD' })
                .then(response => {
                    if (response.ok) {
                        window.location.href = path;
                    } else {
                        depth++;
                        if (depth <= maxDepth) {
                            currentDir = currentDir + '../';
                            checkFile(currentDir + targetFile);
                        } else {
                            window.location.href = targetFile;
                        }
                    }
                })
                .catch(() => {
                    depth++;
                    if (depth <= maxDepth) {
                        currentDir = currentDir + '../';
                        checkFile(currentDir + targetFile);
                    } else {
                        window.location.href = targetFile;
                    }
                });
        }
        
        checkFile(currentDir + targetFile);
    }

    //-----------!! mobile stuff !!-----------//

    // create the overlay that darkens the bg when mobile navbar is opened
    function createOverlay() {
        if (!document.querySelector('.mobile-nav-overlay')) {
            const overlay = document.createElement('div');
            overlay.className = 'mobile-nav-overlay';
            document.body.appendChild(overlay);
        }
    }

    // adjust the padding between mobile navbar and body content so it looks neat :)
    function adjustBodyContentPadding() {
        if (window.innerWidth <= 991) {
            const mobileNav = document.querySelector('.mobile-nav-container');
            const bodyContent = document.querySelector('.body_content');
            
            if (mobileNav && bodyContent) {
                const navHeight = mobileNav.offsetHeight;
                const rootStyles = getComputedStyle(document.documentElement);
                const basePadding = rootStyles.getPropertyValue('--mobile-body-content-container-padding').trim();
                
                if (basePadding) {
                    const paddingParts = basePadding.split(' ');
                    
                    let newPadding;
                    if (paddingParts.length === 3) {
                        newPadding = `calc(${navHeight}px + ${paddingParts[0]}) ${paddingParts[1]} ${paddingParts[2]} ${paddingParts[1]}`;
                    } else if (paddingParts.length === 4) {
                        newPadding = `calc(${navHeight}px + ${paddingParts[0]}) ${paddingParts[1]} ${paddingParts[2]} ${paddingParts[3]}`;
                    } else if (paddingParts.length === 1) {
                        newPadding = `calc(${navHeight}px + ${basePadding})`;
                    } else {
                        newPadding = `${navHeight}px ${basePadding}`;
                    }
                    
                    bodyContent.style.padding = newPadding;
                } else {
                    bodyContent.style.paddingTop = navHeight + 'px';
                }
            }
        } else {
            const bodyContent = document.querySelector('.body_content');
            if (bodyContent) {
                bodyContent.style.padding = '';
            }
        }
    }

    // mobile navbar functionality
    function mobileNavbarFunctionality(toggleButton, menuElement) {
        if (!toggleButton || !menuElement) {
            return;
        }

        const overlay = document.querySelector('.mobile-nav-overlay');
        if (!overlay) return;

        const newToggle = toggleButton.cloneNode(true);
        toggleButton.parentNode.replaceChild(newToggle, toggleButton);

        function openMenu() {
            menuElement.classList.add('active');
            overlay.classList.add('active');
            document.body.classList.add('menu-open');
        }

        function closeMenu() {
            menuElement.classList.remove('active');
            overlay.classList.remove('active');
            document.body.classList.remove('menu-open');
        }

        newToggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (menuElement.classList.contains('active')) {
                closeMenu();
            } else {
                openMenu();
            }
        });

        document.addEventListener('click', (e) => {
            if (menuElement.classList.contains('active') && 
                !menuElement.contains(e.target) && 
                !newToggle.contains(e.target)) {
                closeMenu();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && menuElement.classList.contains('active')) {
                closeMenu();
            }
        });

        menuElement.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                closeMenu();
            });
        });
    }

    // NEW FUNCTION: Watch for navbar changes
    function watchForNavbarChanges() {
        const navbarContainer = document.getElementById('navbar-container');
        if (!navbarContainer) return;
        
        const observer = new MutationObserver(function(mutations) {
            // Check if the navbar height might have changed
            adjustBodyContentPadding();
        });
        
        observer.observe(navbarContainer, { 
            childList: true, 
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class']
        });
        
        // Also observe the navbar elements directly
        const mobileNav = document.querySelector('.mobile-nav-container');
        if (mobileNav) {
            observer.observe(mobileNav, {
                attributes: true,
                attributeFilter: ['style', 'class']
            });
        }
    }

    // UPDATED DOMContentLoaded event listener
    document.addEventListener('DOMContentLoaded', function() {
        loadNavbarCSS();
        loadNavbarHTML(function() {
            initNavigation();
            watchForNavbarChanges(); // Add this line
        });
    });
})();