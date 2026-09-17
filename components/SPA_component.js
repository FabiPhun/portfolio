// ============================================
// SPA ROUTER WITH FADE-IN
// ============================================

(function () {
    'use strict';

    const HOME_PAGE = '/index.html';
    const PORTFOLIO_PAGE = '/index.html';

    const pageMap = {
        'home': HOME_PAGE,
        'about': '/aboutme.html',
        'resume': '/resume.html',
        'graphical-design': '/portfolio/graphical_design.html',
        'gd-smmk': '/portfolio/graphical-design/gd_smmk.html',
        'gd-animal-crossing': '/portfolio/graphical-design/gd_animal_crossing.html',
        'gd-odd-print': '/portfolio/graphical-design/gd_odd_print.html',
        'gd-bees': '/portfolio/graphical-design/gd_bees.html',
        'gd-miscellaneous': '/portfolio/graphical-design/gd_miscellaneous.html',
        'animation': '/portfolio/animation.html',
        'animation-was': '/portfolio/animation/animation_was.html',
        'animation-animschool': '/portfolio/animation/animation_animschool.html',
        'animation-miscellaneous': '/portfolio/animation/animation_miscellaneous.html',
        'storyboards': '/portfolio/storyboards.html',
        'storyboards-schopperle': '/portfolio/storyboards/storyboards_schöpperle.html',
        'storyboards-was': '/portfolio/storyboards/storyboards_was.html',
        'storyboards-christmas': '/portfolio/storyboards/storyboards_christmas.html',
        'storyboards-miscellaneous': '/portfolio/storyboards/storyboards_miscellaneous.html',
        'icarus': '/portfolio/icarus.html',
        'icarus-gdd': '/portfolio/icarus/icarus_gdd.html',
        'modelling': '/portfolio/modelling_and_rigging.html',
        'character-design': '/portfolio/character_design.html',
        'environment-art': '/portfolio/environment_art.html',
        'programming': '/portfolio/programming.html'
    };

    // ============================================
    // Datei-Pfad -> URL
    // /portfolio/graphical-design/gd_smmk.html -> /graphical-design/gd-smmk
    // /portfolio/graphical_design.html         -> /graphical-design
    // /aboutme.html                            -> /aboutme
    // ============================================
    function fileToUrl(file) {
        if (!file || file === HOME_PAGE || file === PORTFOLIO_PAGE) return '/';
        let url = file.replace(/\.html$/, '');   // .html weg
        url = url.replace(/^\/portfolio/, '');   // /portfolio weg
        url = url.replace(/_/g, '-');            // _ -> -
        if (!url.startsWith('/')) url = '/' + url;
        return url;
    }

    const pageToUrl  = {};
    const urlToPage  = {};
    const fileToPage = {};

    Object.keys(pageMap).forEach(function (key) {
        const url = fileToUrl(pageMap[key]);
        pageToUrl[key] = url;
        urlToPage[url] = key;
        fileToPage[pageMap[key]] = key;
    });

    let galleryLoaded = false;

    function loadGallery(callback) {
        if (galleryLoaded) {
            if (callback) callback();
            return;
        }
        const script = document.createElement('script');
        script.src = 'components/gallery_component.js';
        script.onload = function () {
            galleryLoaded = true;
            if (callback) callback();
        };
        script.onerror = function () {
            console.error('Failed to load gallery component');
            if (callback) callback();
        };
        document.head.appendChild(script);
    }

    function waitForEverything(callback) {
        let checks = 3;

        function done() {
            checks--;
            if (checks === 0) callback();
        }

        const scripts = document.querySelectorAll('.body_content script');
        if (scripts.length === 0) {
            done();
        } else {
            let scriptChecks = scripts.length;
            scripts.forEach(script => {
                if (script.src) {
                    script.addEventListener('load', () => {
                        scriptChecks--;
                        if (scriptChecks === 0) done();
                    });
                    script.addEventListener('error', () => {
                        scriptChecks--;
                        if (scriptChecks === 0) done();
                    });
                } else {
                    scriptChecks--;
                    if (scriptChecks === 0) done();
                }
            });
            setTimeout(() => {
                if (scriptChecks > 0) {
                    scriptChecks = 0;
                    done();
                }
            }, 1000);
        }

        const images = document.querySelectorAll('.body_content img');
        if (images.length === 0) {
            done();
        } else {
            let imageChecks = images.length;
            images.forEach(img => {
                if (img.complete) {
                    imageChecks--;
                    if (imageChecks === 0) done();
                } else {
                    img.addEventListener('load', () => {
                        imageChecks--;
                        if (imageChecks === 0) done();
                    });
                    img.addEventListener('error', () => {
                        imageChecks--;
                        if (imageChecks === 0) done();
                    });
                }
            });
            setTimeout(() => {
                if (imageChecks > 0) {
                    imageChecks = 0;
                    done();
                }
            }, 2000);
        }

        setTimeout(done, 50);
    }

    function showContent(bodyContent) {
        bodyContent.style.display = 'block';
        bodyContent.style.opacity = '0';
        void bodyContent.offsetHeight;
        bodyContent.style.transition = 'opacity 0.4s ease';
        bodyContent.style.opacity = '1';
    }

    function hideContent(bodyContent) {
        bodyContent.style.opacity = '0';
        bodyContent.style.display = 'none';
    }

    function navigateTo(page) {
        if (!page || page === 'portfolio' || page === '') {
            window.location.href = PORTFOLIO_PAGE;
            return;
        }

        const targetPath = pageMap[page];
        if (!targetPath) {
            console.error('Page not found:', page);
            return;
        }

        if (targetPath.startsWith('http://') || targetPath.startsWith('https://')) {
            window.location.href = targetPath;
            return;
        }

        const bodyContent = document.querySelector('.body_content');
        if (bodyContent) hideContent(bodyContent);

        fetch(targetPath)
            .then(response => response.text())
            .then(html => {
                const doc = new DOMParser().parseFromString(html, 'text/html');
                const content = doc.querySelector('.body_content');
                const bodyContent = document.querySelector('.body_content');

                if (!content || !bodyContent) {
                    window.location.href = targetPath;
                    return;
                }

                bodyContent.innerHTML = content.innerHTML;

                // ---- URL automatisch aus Datei-Pfad ----
                history.pushState({ page: page }, '', pageToUrl[page] || '/');

                const title = doc.querySelector('title');
                if (title) document.title = title.textContent;

                bodyContent.style.display = 'none';
                bodyContent.style.opacity = '0';

                bodyContent.querySelectorAll('script').forEach(function (oldScript) {
                    const newScript = document.createElement('script');
                    Array.from(oldScript.attributes).forEach(function (attr) {
                        newScript.setAttribute(attr.name, attr.value);
                    });
                    newScript.textContent = oldScript.textContent;
                    oldScript.parentNode.replaceChild(newScript, oldScript);
                });

                const hasGalleries = bodyContent.querySelectorAll('.gallery_wrapper').length > 0;
                if (hasGalleries) {
                    loadGallery(function () {
                        if (window.reinitGalleries) window.reinitGalleries();
                        waitForEverything(() => showContent(bodyContent));
                    });
                } else {
                    if (galleryLoaded && window.removeGalleries) window.removeGalleries();
                    waitForEverything(() => showContent(bodyContent));
                }

                window.scrollTo(0, 0);
            })
            .catch(function (error) {
                console.error('Failed to load page:', error);
                window.location.href = targetPath;
            });
    }

    document.addEventListener('navigate', function (e) {
        navigateTo(e.detail.page);
    });

    window.addEventListener('popstate', function (e) {
        const page = e.state?.page || urlToPage[location.pathname] || 'portfolio';
        navigateTo(page);
    });

    window.navigateTo = navigateTo;

    // ============================================
    // GLOBAL LINK HANDLER
    // ============================================
    document.addEventListener('click', function (e) {
        const link = e.target.closest('a');
        if (!link) return;

        const href = link.getAttribute('href');
        if (!href) return;

        if (
            href.startsWith('http://') ||
            href.startsWith('https://') ||
            href.startsWith('mailto:') ||
            href.startsWith('tel:') ||
            href.startsWith('#') ||
            link.getAttribute('target') === '_blank' ||
            link.hasAttribute('download')
        ) {
            return;
        }

        if (!document.body.hasAttribute('data-spa-mode')) return;

        let page = link.getAttribute('data-page');

        if (!page) {
            const cleanHref = href.split('#')[0].split('?')[0];

            // 1) Datei-Match
            if (fileToPage[cleanHref]) {
                page = fileToPage[cleanHref];
            }
            // 2) URL-Match
            else if (urlToPage[cleanHref]) {
                page = urlToPage[cleanHref];
            }
            else if (urlToPage[cleanHref + '/']) {
                page = urlToPage[cleanHref + '/'];
            }
            // 3) Fallback: Dateiname ohne .html
            else {
                const fileName = cleanHref.split('/').pop().replace('.html', '');
                if (fileName === 'index' || cleanHref === PORTFOLIO_PAGE) {
                    page = 'portfolio';
                } else if (pageMap[fileName]) {
                    page = fileName;
                }
            }
        }

        if (!page || !pageMap[page]) return;

        e.preventDefault();
        e.stopPropagation();

        const mobileMenu = document.getElementById('mobileMenu');
        if (mobileMenu && mobileMenu.classList.contains('active')) {
            mobileMenu.classList.remove('active');
            const overlay = document.querySelector('.mobile-nav-overlay');
            if (overlay) overlay.classList.remove('active');
            document.body.classList.remove('menu-open');
        }

        document.dispatchEvent(new CustomEvent('navigate', {
            detail: { page: page }
        }));
    });

    // ============================================
    // INITIAL LOAD
    // ============================================
    const bodyContent = document.querySelector('.body_content');

    if (bodyContent) {
        hideContent(bodyContent);
        const hasGalleries = document.querySelectorAll('.gallery_wrapper').length > 0;
        if (hasGalleries) {
            loadGallery(function () {
                if (window.reinitGalleries) window.reinitGalleries();
                waitForEverything(() => showContent(bodyContent));
            });
        } else {
            waitForEverything(() => showContent(bodyContent));
        }
    }

    const initialPath = location.pathname.replace(/\/$/, '') || '/';
    if (
        initialPath !== '/' &&
        initialPath !== '/index.html' &&
        !initialPath.includes('/portfolio/') &&
        urlToPage[initialPath]
    ) {
        setTimeout(function () {
            navigateTo(urlToPage[initialPath]);
        }, 300);
    }

})();