//-----------!! setup !!-----------//

(function() {
    const scripts = document.getElementsByTagName('script');
    let navbarScriptPath = '';

    for (let i = 0; i < scripts.length; i++) {
        if (scripts[i].src && scripts[i].src.includes('navbar.js')) {
            navbarScriptPath = scripts[i].src;
            break;
        }
    }
    if (!navbarScriptPath) {
        console.error('couldnt find navbar.js');
        return;
    }

    const navbarDir = navbarScriptPath.substring(0, navbarScriptPath.lastIndexOf('/') + 1);

    function loadNavbarCSS() {
        if (document.getElementById('navbar-css')) {
            return;
        }

        const cssCacheKey = 'navbarCSS::' + navbarDir;
        let cachedCSS = null;
        try {
            cachedCSS = sessionStorage.getItem(cssCacheKey);
        } catch (e) {
            // sessionStorage unavailable (e.g. private browsing) - just skip caching
        }

        if (cachedCSS) {
            const style = document.createElement('style');
            style.id = 'navbar-css';
            style.textContent = cachedCSS;
            document.head.appendChild(style);
            return;
        }

        fetch(navbarDir + 'navbar.css')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(cssText => {
                try {
                    sessionStorage.setItem(cssCacheKey, cssText);
                } catch (e) {
                    // storage full or unavailable - fine, just won't cache
                }
                if (document.getElementById('navbar-css')) return;
                const style = document.createElement('style');
                style.id = 'navbar-css';
                style.textContent = cssText;
                document.head.appendChild(style);
            })
            .catch(error => {
                console.error('navbar.css fetch failed:', error);
            });
    }

    // Inject CSS as early as possible (before DOMContentLoaded) so a cached
    // stylesheet is already applied by the time the navbar HTML lands -
    // no flash of unstyled navbar on repeat visits.
    loadNavbarCSS();

    function loadNavbarHTML(callback) {
        const navbarContainer = document.getElementById('navbar-container');

        if (!navbarContainer) {
            console.error('<div id="navbar-container"></div> missing!');
            return;
        }

        if (navbarContainer.children.length > 0) {
            if (callback) callback();
            setTimeout(adjustBodyContentPadding, 50);
            return;
        }

        function applyMarkup(data, fromCache) {
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
            setTimeout(adjustBodyContentPadding, fromCache ? 20 : 100);
        }

        const cacheKey = 'navbarHTML::' + navbarDir;
        let cached = null;
        try {
            cached = sessionStorage.getItem(cacheKey);
        } catch (e) {
            // sessionStorage unavailable (e.g. private browsing) - just skip caching
        }

        if (cached) {
            applyMarkup(cached, true);
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
                try {
                    sessionStorage.setItem(cacheKey, data);
                } catch (e) {
                    // storage full or unavailable - fine, just won't cache
                }
                applyMarkup(data, false);
            })
            .catch(error => {
                console.error('Fetch failed:', error);
            });
    }

    function initNavigation() {
        const elements = {
            menuToggle: document.getElementById('menuToggle'),
            mobileNav: document.getElementById('mobileNav'),
            mobileMenu: document.getElementById('mobileMenu'),
            desktopNav: document.getElementById('desktopNav'),
            template: document.getElementById('navContentTemplate')
        };

        if (!elements.mobileNav) {
            if (elements.desktopNav && elements.template) {
                const content = elements.template.content.cloneNode(true);
                if (elements.desktopNav.children.length === 0) {
                    elements.desktopNav.appendChild(content);
                }
            }
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

        setTimeout(adjustBodyContentPadding, 0);
        setTimeout(adjustBodyContentPadding, 50);
        setTimeout(adjustBodyContentPadding, 150);

        window.addEventListener('resize', adjustBodyContentPadding);
        window.addEventListener('orientationchange', adjustBodyContentPadding);

        setupNavLinks();
    }

    function setupNavLinks() {
        // Update selectors to match new class names
        document.querySelectorAll('.nav-main-section-link, .nav-category-link, .nav-category-sublink').forEach(link => {
            link.removeEventListener('click', navLinkHandler);
            link.addEventListener('click', navLinkHandler);
        });
    }

    //-----------!! href link handeler !!-----------//

    function navLinkHandler(e) {
        e.preventDefault();

        const targetFile = this.getAttribute('href');

        let destinationURL;

        if (targetFile.startsWith('http') || targetFile.startsWith('www')) {
            destinationURL = targetFile.startsWith('www') ? 'https://' + targetFile : targetFile;
        } else {
            const navbarContainer = document.getElementById('navbar-container');
            let baseDir = navbarContainer?.getAttribute('directoryFix') || '';
            destinationURL = baseDir + targetFile;
        }

        // Resolve against the current location so relative paths, missing
        // trailing slashes, etc. compare correctly.
        let resolved;
        try {
            resolved = new URL(destinationURL, window.location.href);
        } catch (err) {
            window.location.href = destinationURL;
            return;
        }

        const normalize = (pathname) => pathname.replace(/\/+$/, '') || '/';

        const isSamePage =
            resolved.origin === window.location.origin &&
            normalize(resolved.pathname) === normalize(window.location.pathname) &&
            resolved.search === window.location.search;

        if (isSamePage) {
            // Already on this page - don't trigger a reload (and the
            // navbar flicker that comes with it). Still honor an in-page
            // hash if one was given.
            if (resolved.hash && resolved.hash !== window.location.hash) {
                window.location.hash = resolved.hash;
            }
            return;
        }

        window.location.href = destinationURL;
    }

    //-----------!! mobile stuff !!-----------//

    function createOverlay() {
        if (!document.querySelector('.mobile-nav-overlay')) {
            const overlay = document.createElement('div');
            overlay.className = 'mobile-nav-overlay';
            document.body.appendChild(overlay);
        }
    }

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

    function watchForNavbarChanges() {
        const navbarContainer = document.getElementById('navbar-container');
        if (!navbarContainer) return;

        const observer = new MutationObserver(adjustBodyContentPadding);

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

    document.addEventListener('DOMContentLoaded', function() {
        loadNavbarHTML(function() {
            initNavigation();
            watchForNavbarChanges();
        });
    });
})();