//-----------!! setup !!-----------//

(function() {
    //fetch html and css
    function loadNavbarCSS() {
        if (!document.querySelector('link[href*="navbar.css"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'components/navbar/navbar.css';
            document.head.appendChild(link);
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
            return;
        }

        fetch('components/navbar/navbar.html')
            .then(response => {
                if (!response.ok) {
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
            })
            .catch(error => {
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

        adjustBodyContentPadding();
        window.addEventListener('resize', adjustBodyContentPadding);
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

    document.addEventListener('DOMContentLoaded', function() {
        loadNavbarCSS();
        loadNavbarHTML(initNavigation);
    });
})();