(function(){
  "use strict";

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Loader (lets the drawn mark + wordmark animation play out before revealing the page)
  var loader = document.getElementById('loader');
  if (loader) {
    var hideLoader = function(){ loader.classList.add('is-hidden'); };
    if (reduceMotion) {
      hideLoader();
    } else {
      // keep the loader up until the focus, shine and star flare have played (~3.6s from navigation start)
      var hideAfterIntro = function(){
        setTimeout(hideLoader, Math.max(0, 3600 - performance.now()));
      };
      if (document.readyState === 'complete') hideAfterIntro();
      else window.addEventListener('load', hideAfterIntro);
      // safety net so a slow load never traps the visitor behind the loader
      setTimeout(hideLoader, 5500);
    }
  }

  // Contact form: sent through Formspree (same endpoint as helionsax.com), with an inline confirmation
  var contactForm = document.getElementById('contactForm');
  if (contactForm) {
    var formStatus = contactForm.querySelector('.contact-form-status');
    var submitBtn = contactForm.querySelector('button[type="submit"]');
    var setStatus = function(text, state){
      if (!formStatus) return;
      formStatus.textContent = text;
      formStatus.setAttribute('data-state', state);
    };
    contactForm.addEventListener('submit', function(e){
      e.preventDefault();
      var name = contactForm.name.value.trim();
      var type = contactForm.type.value;
      var data = new FormData(contactForm);
      data.append('_subject', 'Demande Solor : ' + type + (name ? ' - ' + name : ''));
      submitBtn.disabled = true;
      setStatus('Envoi en cours...', 'pending');
      fetch(contactForm.action, { method: 'POST', body: data, headers: { 'Accept': 'application/json' } })
        .then(function(res){
          if (!res.ok) throw new Error('send failed');
          contactForm.reset();
          setStatus('Merci, votre demande est bien envoyée. On revient vers vous sous 48h.', 'ok');
        })
        .catch(function(){
          setStatus("L'envoi n'a pas fonctionné. Écrivez-nous directement à contact@helionsax.com.", 'error');
        })
        .then(function(){ submitBtn.disabled = false; });
    });
  }

  // Nav scroll state
  var nav = document.querySelector('.nav');
  var onScroll = function(){
    if (!nav) return;
    if (window.scrollY > 40) nav.classList.add('is-scrolled');
    else nav.classList.remove('is-scrolled');
  };
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile nav toggle
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if (toggle && links) {
    var closeMenu = function(){
      toggle.classList.remove('is-open');
      links.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    };
    toggle.addEventListener('click', function(){
      var open = links.classList.toggle('is-open');
      toggle.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    links.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', closeMenu);
    });
    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape') closeMenu();
    });
  }

  // Scroll reveal
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    revealEls.forEach(function(el){ io.observe(el); });
  } else {
    revealEls.forEach(function(el){ el.classList.add('is-visible'); });
  }

  // Pause hero video off-screen to save battery/CPU
  var heroVideo = document.querySelector('.hero-media video');
  if (heroVideo && 'IntersectionObserver' in window) {
    var vio = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting) heroVideo.play().catch(function(){});
        else heroVideo.pause();
      });
    }, { threshold: 0.05 });
    vio.observe(heroVideo);
  }
  // Immersion clips: click-to-play with sound, one at a time
  var clips = document.querySelectorAll('.immersion-clip');
  clips.forEach(function(clip){
    var video = clip.querySelector('video');
    var playBtn = clip.querySelector('.immersion-play');
    if (!video || !playBtn) return;
    var start = function(){
      clips.forEach(function(other){
        if (other !== clip) {
          other.classList.remove('is-playing');
          var ov = other.querySelector('video');
          if (ov) ov.pause();
        }
      });
      video.muted = false;
      video.play().catch(function(){});
      clip.classList.add('is-playing');
    };
    playBtn.addEventListener('click', start);
    video.addEventListener('click', function(){
      if (clip.classList.contains('is-playing')) {
        if (video.paused) { video.play().catch(function(){}); }
        else { video.pause(); }
      } else {
        start();
      }
    });
    video.addEventListener('ended', function(){ clip.classList.remove('is-playing'); });
  });
  if ('IntersectionObserver' in window) {
    var clipIO = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (!entry.isIntersecting) {
          var v = entry.target.querySelector('video');
          if (v && !v.paused) v.pause();
        }
      });
    }, { threshold: 0.1 });
    clips.forEach(function(clip){ clipIO.observe(clip); });
  }

  // Reference gallery: click a photo to browse all of them full size
  document.querySelectorAll('.reference-gallery').forEach(function(gallery){
    var items = Array.prototype.slice.call(gallery.querySelectorAll('.reference-item'));
    if (!items.length) return;
    var box = document.createElement('div');
    box.className = 'lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'Photos de la soirée');
    box.innerHTML = '<img alt="">'
      + '<button type="button" class="lightbox-close" aria-label="Fermer">&times;</button>'
      + '<button type="button" class="lightbox-prev" aria-label="Photo précédente">&#8249;</button>'
      + '<button type="button" class="lightbox-next" aria-label="Photo suivante">&#8250;</button>'
      + '<p class="lightbox-count"></p>';
    document.body.appendChild(box);
    var img = box.querySelector('img');
    var count = box.querySelector('.lightbox-count');
    var current = 0, lastFocus = null;
    var show = function(i){
      current = (i + items.length) % items.length;
      var item = items[current];
      var thumb = item.querySelector('img');
      img.src = item.getAttribute('href');
      img.alt = thumb ? thumb.alt : (item.getAttribute('data-alt') || '');
      count.textContent = (current + 1) + ' / ' + items.length;
    };
    var open = function(i){
      lastFocus = document.activeElement;
      show(i);
      box.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      box.querySelector('.lightbox-close').focus();
    };
    var close = function(){
      box.classList.remove('is-open');
      document.body.style.overflow = '';
      if (lastFocus) lastFocus.focus();
    };
    items.forEach(function(item, i){
      item.addEventListener('click', function(e){ e.preventDefault(); open(i); });
    });
    box.querySelector('.lightbox-close').addEventListener('click', close);
    box.querySelector('.lightbox-prev').addEventListener('click', function(){ show(current - 1); });
    box.querySelector('.lightbox-next').addEventListener('click', function(){ show(current + 1); });
    box.addEventListener('click', function(e){ if (e.target === box) close(); });
    document.addEventListener('keydown', function(e){
      if (!box.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') show(current - 1);
      else if (e.key === 'ArrowRight') show(current + 1);
    });
    var touchX = null;
    box.addEventListener('touchstart', function(e){ touchX = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', function(e){
      if (touchX === null) return;
      var dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 40) show(current + (dx < 0 ? 1 : -1));
      touchX = null;
    });
  });
})();
