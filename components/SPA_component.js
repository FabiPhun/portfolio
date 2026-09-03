// ============================================
// SPA ROUTER WITH FADE-IN
// ============================================

(function () {
    'use strict';

    const pageMap = {
        'home': '/index.html',
        'about': '/aboutme.html',
        'resume': '/resume.html',
        'graphical-design': '/portfolio/graphical_design.html',
        'gd-smmk': '/portfolio/gd/gd_smmk.html',
        'gd-animal-crossing': '/portfolio/gd/gd_animal_crossing.html',
        'gd-odd-print': '/portfolio/gd/gd_odd_print.html',
        'gd-bees': '/portfolio/gd/gd_bees.html',
        'gd-miscellaneous': '/portfolio/gd/gd_miscellaneous.html',
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
            if (checks === 0) {
                callback();
            }
        }

        // 1. Wait for scripts
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

        // 2. Wait for images
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

        // 3. Wait for event loop
        setTimeout(done, 50);
    }

    function showContent(bodyContent) {
        // Make it visible but transparent
        bodyContent.style.display = 'block';
        bodyContent.style.opacity = '0';
        
        // Force reflow
        void bodyContent.offsetHeight;
        
        // Fade in
        bodyContent.style.transition = 'opacity 0.4s ease';
        bodyContent.style.opacity = '1';
    }

    function hideContent(bodyContent) {
        bodyContent.style.opacity = '0';
        bodyContent.style.display = 'none';
    }

    function navigateTo(page) {
        if (!page || page === 'portfolio' || page === '') {
            window.location.href = '/portfolio.html';
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
        if (bodyContent) {
            hideContent(bodyContent);
        }

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
                history.pushState({ page: page }, '', '#' + page);

                const title = doc.querySelector('title');
                if (title) document.title = title.textContent;

                // Keep hidden while loading
                bodyContent.style.display = 'none';
                bodyContent.style.opacity = '0';

                const hasGalleries = bodyContent.querySelectorAll('.gallery_wrapper').length > 0;
                if (hasGalleries) {
                    loadGallery(function () {
                        if (window.reinitGalleries) {
                            window.reinitGalleries();
                        }
                        waitForEverything(() => {
                            showContent(bodyContent);
                        });
                    });
                } else {
                    if (galleryLoaded && window.removeGalleries) {
                        window.removeGalleries();
                    }
                    waitForEverything(() => {
                        showContent(bodyContent);
                    });
                }

                bodyContent.querySelectorAll('script').forEach(function (oldScript) {
                    const newScript = document.createElement('script');
                    Array.from(oldScript.attributes).forEach(function (attr) {
                        newScript.setAttribute(attr.name, attr.value);
                    });
                    newScript.textContent = oldScript.textContent;
                    oldScript.parentNode.replaceChild(newScript, oldScript);
                });

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
        navigateTo(e.state?.page || 'portfolio');
    });

    window.navigateTo = navigateTo;

    // Initial load - hide content, then show with fade-in when ready
    const hash = location.hash.replace('#', '');
    const bodyContent = document.querySelector('.body_content');

    if (bodyContent) {
        // Start hidden
        hideContent(bodyContent);
        
        const hasGalleries = document.querySelectorAll('.gallery_wrapper').length > 0;
        
        if (hasGalleries) {
            loadGallery(function () {
                if (window.reinitGalleries) {
                    window.reinitGalleries();
                }
                waitForEverything(() => {
                    showContent(bodyContent);
                });
            });
        } else {
            waitForEverything(() => {
                showContent(bodyContent);
            });
        }
    }

    if (hash && !window.location.pathname.includes('/portfolio/')) {
        setTimeout(function () {
            navigateTo(hash);
        }, 300);
    }

})();