(function () {
   'use strict';

   document.addEventListener('click', function (e) {
      const toggle = e.target.closest('.open-timeline');
      if (!toggle) return;

      const section = toggle.nextElementSibling;
      if (!section || !section.classList.contains('timeline-section')) return;

      const isOpen = section.classList.contains('is-open');

      if (isOpen) {

         section.style.height = section.scrollHeight + 'px';
         requestAnimationFrame(function () {
            section.style.height = '0px';
         });
         section.classList.remove('is-open');
         toggle.classList.remove('is-open');
      } else {

         section.style.display = 'block';
         const targetHeight = section.scrollHeight;
         section.style.height = '0px';
         requestAnimationFrame(function () {
            section.style.height = targetHeight + 'px';
         });
         section.classList.add('is-open');
         toggle.classList.add('is-open');
      }
   });

   document.addEventListener('transitionend', function (e) {
      const section = e.target;
      if (!section.classList || !section.classList.contains('timeline-section')) return;
      if (e.propertyName !== 'height') return;

      if (section.classList.contains('is-open')) {
         section.style.height = 'auto';
      } else {
         section.style.display = 'none';
      }
   });

})();