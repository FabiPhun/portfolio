// ============================================
// NAVBAR - COMPLETE FIXED VERSION
// ============================================

(function() {
    'use strict';

    // ---------- PATH DETECTION ----------
    function getNavbarPath() {
        const scripts = document.getElementsByTagName('script');
        let navbarScriptPath = '';

        for (let i = 0; i < scripts.length; i++) {
            if (scripts[i].src && scripts[i].src.includes('navbar.js')) {
                navbarScriptPath = scripts[i].src;
                break;
            }
        }

        if (!navbarScriptPath) {
            console.error('Could not find navbar.js');
            return null;
        }

        return navbarScriptPath.substring(0, navbarScriptPath.lastIndexOf('/') + 1);
    }

    // ---------- LOAD CSS ----------
    function loadNavbarCSS(navbarDir) {
        const existingCSS = document.querySelector('link[href*="navbar.css"]');
        if (!existingCSS) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = navbarDir + 'navbar.css';
            document.head.appendChild(link);
        }
    }

    // ---------- LOAD HTML ----------
    function loadNavbarHTML(navbarDir, callback) {
        const navbarContainer = document.getElementById('navbar-container');
        if (!navbarContainer) {
            console.error('<div id="navbar-container"></div> missing!');
            return;
        }

        // If already loaded, just call callback
        if (navbarContainer.children.length > 0) {
            if (callback) callback();
            setTimeout(adjustBodyContentPadding, 50);
            return;
        }

        fetch(navbarDir + 'navbar.html')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(data => {
                navbarContainer.innerHTML = data;

                // Check if we should show desktop/mobile nav
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
                setTimeout(adjustBodyContentPadding, 100);
            })
            .catch(error => {
                console.error('Failed to load navbar:', error);
            });
    }

    // ---------- INIT NAVIGATION ----------
    function initNavigation() {
        const elements = {
            menuToggle: document.getElementById('menuToggle'),
            mobileNav: document.getElementById('mobileNav'),
            mobileMenu: document.getElementById('mobileMenu'),
            desktopNav: document.getElementById('desktopNav'),
            template: document.getElementById('navContentTemplate')
        };

        // If no mobile nav, just populate desktop nav
        if (!elements.mobileNav) {
            if (elements.desktopNav && elements.template) {
                const content = elements.template.content.cloneNode(true);
                if (elements.desktopNav.children.length === 0) {
                    elements.desktopNav.appendChild(content);
                }
                setupNavLinks();
            }
            setTimeout(adjustBodyContentPadding, 50);
            return;
        }

        // Wait for toggle button if not available
        if (!elements.menuToggle) {
            setTimeout(initNavigation, 100);
            return;
        }

        // Create overlay
        createOverlay();

        // Populate navs
        if (elements.template) {
            const content = elements.template.content.cloneNode(true);

            if (elements.desktopNav && elements.desktopNav.children.length === 0) {
                elements.desktopNav.appendChild(content.cloneNode(true));
            }

            if (elements.mobileMenu && elements.mobileMenu.children.length === 0) {
                elements.mobileMenu.appendChild(content.cloneNode(true));
            }
        }

        // Setup mobile functionality
        if (elements.mobileMenu) {
            mobileNavbarFunctionality(elements.menuToggle, elements.mobileMenu);
        }

        // Setup navigation links
        setupNavLinks();

        // Adjust padding
        setTimeout(adjustBodyContentPadding, 0);
        setTimeout(adjustBodyContentPadding, 50);
        setTimeout(adjustBodyContentPadding, 150);

        // Listen for resize
        window.addEventListener('resize', adjustBodyContentPadding);
        window.addEventListener('orientationchange', adjustBodyContentPadding);

        // Watch for changes
        watchForNavbarChanges();
    }

    // ---------- SETUP NAV LINKS ----------
    function setupNavLinks() {
        // Check if we're in SPA mode
        const isSPA = document.body.hasAttribute('data-spa-mode') || 
                      window.location.pathname.includes('/portfolio/') ||
                      window.location.pathname.includes('portfolio.html');

        // Get all nav links
        const links = document.querySelectorAll('.nav-main-section-link, .nav-category-link, .nav-category-sublink');
        
        links.forEach(link => {
            // Remove old listeners
            link.removeEventListener('click', navLinkHandler);
            link.removeEventListener('click', spaNavLinkHandler);
            
            // Add appropriate listener
            if (isSPA) {
                link.addEventListener('click', spaNavLinkHandler);
            } else {
                link.addEventListener('click', navLinkHandler);
            }
        });
    }

    // ---------- SPA NAV LINK HANDLER ----------
    function spaNavLinkHandler(e) {
        e.preventDefault();
        e.stopPropagation();

        // Get page from data-page attribute or from href
        let page = this.getAttribute('data-page');
        if (!page) {
            const href = this.getAttribute('href');
            if (href) {
                // Extract page name from href
                const parts = href.split('/');
                const fileName = parts[parts.length - 1];
                page = fileName.replace('.html', '');
                
                // Handle special cases
                if (page === 'index' || page === 'portfolio') {
                    page = 'portfolio';
                }
            }
        }

        if (!page) {
            console.warn('No page specified for link:', this);
            return;
        }

        // Check if it's an external link
        const href = this.getAttribute('href');
        if (href && (href.startsWith('http') || href.startsWith('www'))) {
            window.open(href, '_blank');
            return;
        }

        // Close mobile menu if open
        const mobileMenu = document.getElementById('mobileMenu');
        if (mobileMenu && mobileMenu.classList.contains('active')) {
            const toggle = document.getElementById('menuToggle');
            if (toggle) {
                mobileMenu.classList.remove('active');
                const overlay = document.querySelector('.mobile-nav-overlay');
                if (overlay) overlay.classList.remove('active');
                document.body.classList.remove('menu-open');
            }
        }

        // Dispatch navigation event
        document.dispatchEvent(new CustomEvent('navigate', { 
            detail: { page: page }
        }));
    }

    // ---------- ORIGINAL NAV LINK HANDLER ----------
    function navLinkHandler(e) {
        e.preventDefault();

        const targetFile = this.getAttribute('href');
        
        if (targetFile.startsWith('http') || targetFile.startsWith('www')) {
            window.location.href = targetFile.startsWith('www') ? 'https://' + targetFile : targetFile;
            return;
        }

        const navbarContainer = document.getElementById('navbar-container');
        let baseDir = navbarContainer?.getAttribute('directoryFix') || '';
        
        let fullPath = baseDir + targetFile;
        window.location.href = fullPath;
    }

    // ---------- MOBILE NAV FUNCTIONALITY ----------
    function createOverlay() {
        if (!document.querySelector('.mobile-nav-overlay')) {
            const overlay = document.createElement('div');
            overlay.className = 'mobile-nav-overlay';
            document.body.appendChild(overlay);
        }
    }

    function mobileNavbarFunctionality(toggleButton, menuElement) {
        if (!toggleButton || !menuElement) {
            return;
        }

        const overlay = document.querySelector('.mobile-nav-overlay');
        if (!overlay) return;

        // Clone toggle to remove old listeners
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

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (menuElement.classList.contains('active') &&
                !menuElement.contains(e.target) &&
                !newToggle.contains(e.target)) {
                closeMenu();
            }
        });

        // Close on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && menuElement.classList.contains('active')) {
                closeMenu();
            }
        });

        // Close on link click
        menuElement.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                closeMenu();
            });
        });
    }

    // ---------- ADJUST BODY CONTENT PADDING ----------
    function adjustBodyContentPadding() {
        const bodyContent = document.querySelector('.body_content');
        if (!bodyContent) return;

        if (window.innerWidth <= 991) {
            const mobileNav = document.querySelector('.mobile-nav-container');
            if (mobileNav) {
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
            bodyContent.style.padding = '';
        }
    }

    // ---------- WATCH FOR NAVBAR CHANGES ----------
    function watchForNavbarChanges() {
        const navbarContainer = document.getElementById('navbar-container');
        if (!navbarContainer) return;

        const observer = new MutationObserver(() => {
            adjustBodyContentPadding();
        });

        observer.observe(navbarContainer, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class']
        });

        const mobileNav = document.querySelector('.mobile-nav-container');
        if (mobileNav) {
            observer.observe(mobileNav, {
                attributes: true,
                attributeFilter: ['style', 'class']
            });
        }
    }

    // ---------- INIT ----------
    document.addEventListener('DOMContentLoaded', function() {
        const navbarDir = getNavbarPath();
        if (!navbarDir) return;

        loadNavbarCSS(navbarDir);
        loadNavbarHTML(navbarDir, function() {
            initNavigation();
        });
    });

    // If DOM is already loaded, run immediately
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        const navbarDir = getNavbarPath();
        if (navbarDir) {
            loadNavbarCSS(navbarDir);
            loadNavbarHTML(navbarDir, function() {
                initNavigation();
            });
        }
    }

    console.log('Navbar initialized');

})();