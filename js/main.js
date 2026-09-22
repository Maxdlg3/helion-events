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
      var minTimer = setTimeout(function(){
        if (document.readyState === 'complete') hideLoader();
      }, 1300);
      window.addEventListener('load', function(){
        setTimeout(hideLoader, 1300);
        clearTimeout(minTimer);
      });
      // safety net so a slow load never traps the visitor behind the loader
      setTimeout(hideLoader, 3200);
    }
  }

  // Contact form: compose a pre-filled mailto (no backend on this static site)
  var contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function(e){
      e.preventDefault();
      var name = contactForm.name.value.trim();
      var email = contactForm.email.value.trim();
      var date = contactForm.date.value;
      var type = contactForm.type.value;
      var message = contactForm.message.value.trim();
      var subject = 'Demande ' + type + (name ? ' - ' + name : '');
      var bodyLines = [
        name ? 'Nom : ' + name : '',
        email ? 'Email : ' + email : '',
        date ? 'Date souhaitée : ' + date : '',
        'Type d\'événement : ' + type,
        '',
        message
      ].filter(Boolean);
      var mailto = 'mailto:bonjour@solor.paris'
        + '?subject=' + encodeURIComponent(subject)
        + '&body=' + encodeURIComponent(bodyLines.join('\n'));
      window.location.href = mailto;
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
})();
