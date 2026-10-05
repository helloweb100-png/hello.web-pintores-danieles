/* ============================================================
   PINTORES DANIELES - Interacciones
   JavaScript nativo, sin dependencias.

   01 Utilidades y datos      02 Tema               03 Loader
   04 Navegación y menú       05 Titular rotativo   06 Partículas del hero
   07 Reveal y contadores     08 Motor de scroll    09 Galería y lightbox
   10 FAQ                     11 Formulario         12 Microinteracciones

   Nota de rendimiento: no se usa ningún listener de "scroll".
   Un único bucle requestAnimationFrame lee scrollY y solo escribe
   en el DOM cuando algo cambió (transform y opacity únicamente).
   ============================================================ */
(function () {
  'use strict';

  /* ------------------------------------------------------------
     01 UTILIDADES Y DATOS
     ------------------------------------------------------------ */
  var doc = document.documentElement;
  var body = document.body;
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* Contacto del negocio (de la tarjeta): 272 129 1460 */
  var WA_NUMBER = '522721291460';
  var WA_MESSAGES = {
    general: 'Hola, vi su página web y quiero pedir un presupuesto.',
    acabado: 'Hola, vi su página y quiero un acabado decorativo para mi espacio. ¿Me pueden orientar?',
    listo:   'Hola, estoy listo para renovar mi espacio. ¿Me pueden dar un presupuesto?',
    duda:    'Hola, tengo una duda sobre sus servicios de pintura.'
  };
  function waUrl(text) {
    return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(text);
  }

  /* Enlaces de WhatsApp con mensaje prellenado */
  $$('[data-wa]').forEach(function (a) {
    var msg = WA_MESSAGES[a.getAttribute('data-wa')] || WA_MESSAGES.general;
    a.href = waUrl(msg);
  });

  /* Empezar siempre arriba (salvo que se llegue con #ancla) */
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (!location.hash) window.scrollTo(0, 0);

  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();


  /* ------------------------------------------------------------
     02 TEMA CLARO / OSCURO
     ------------------------------------------------------------ */
  var themeBtn = $('#themeToggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = doc.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      doc.setAttribute('data-theme', next);
      try { localStorage.setItem('pd-theme', next); } catch (e) { /* almacenamiento bloqueado */ }
    });
  }


  /* ------------------------------------------------------------
     03 LOADER
     Anillo de progreso real: espera la imagen del hero y las
     fuentes (con tiempo mínimo y tope de seguridad).
     ------------------------------------------------------------ */
  var loader = $('#loader');
  var ldBar = $('#ldBar');
  var ldCount = $('#ldCount');
  var LD_CIRC = 326.73;           /* 2 * PI * 52 */
  var started = false;

  function afterWithTimeout(promise, ms) {
    return Promise.race([promise, new Promise(function (r) { setTimeout(r, ms); })]);
  }

  function startSite() {
    if (started) return;
    started = true;
    body.classList.remove('is-loading');
    body.classList.add('ready');
    if (loader) {
      loader.classList.add('is-done');
      setTimeout(function () { if (loader.parentNode) loader.parentNode.removeChild(loader); }, 1500);
    }
    requestAnimationFrame(function () { engine.measure(); });
    setTimeout(function () { engine.measure(); }, 1300);
    var wa = $('#wa');
    if (wa) {                                   /* aviso breve del botón de WhatsApp */
      setTimeout(function () { wa.classList.add('show-tip'); }, 6500);
      setTimeout(function () { wa.classList.remove('show-tip'); }, 11000);
    }
  }

  function runLoader() {
    if (!loader) { startSite(); return; }

    var heroImg = $('.hero__bg img');
    var minTime = reduceMotion ? 400 : 2400;
    var resolved = false;
    var t0 = performance.now();
    var shown = 0;

    var imgReady = heroImg && heroImg.decode ? heroImg.decode().catch(function () {}) : Promise.resolve();
    var fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    Promise.all([afterWithTimeout(imgReady, 6000), afterWithTimeout(fontsReady, 4000)]).then(function () { resolved = true; });
    setTimeout(function () { resolved = true; }, 7000);

    function ease(t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

    function step(now) {
      var tp = clamp((now - t0) / minTime, 0, 1);
      var cap = resolved ? 100 : 90;
      var target = Math.min(cap, ease(tp) * 100);
      shown += (target - shown) * .14;
      if (resolved && tp >= 1 && shown > 99.2) shown = 100;

      ldCount.textContent = Math.round(shown);
      ldBar.style.strokeDashoffset = (LD_CIRC * (1 - shown / 100)).toFixed(2);

      if (shown < 100) { requestAnimationFrame(step); }
      else { setTimeout(startSite, 260); }
    }
    requestAnimationFrame(step);
  }


  /* ------------------------------------------------------------
     04 NAVEGACIÓN Y MENÚ MÓVIL
     ------------------------------------------------------------ */
  var nav = $('#nav');
  var sentinel = $('#sentinel');
  if (nav && sentinel && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      nav.classList.toggle('is-solid', !entries[0].isIntersecting);
    }).observe(sentinel);
  }

  var burger = $('#burger');
  var menu = $('#menu');
  function setMenu(open) {
    if (!burger || !menu) return;
    menu.classList.toggle('is-open', open);
    nav.classList.toggle('is-open', open);
    body.classList.toggle('menu-lock', open);
    menu.inert = !open;
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  }
  if (burger && menu) {
    burger.addEventListener('click', function () { setMenu(!menu.classList.contains('is-open')); });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
    window.matchMedia('(min-width: 1100px)').addEventListener('change', function (m) { if (m.matches) setMenu(false); });
  }


  /* ------------------------------------------------------------
     05 TITULAR ROTATIVO
     ------------------------------------------------------------ */
  (function rotator() {
    var wrap = $('#rotator');
    if (!wrap) return;
    var words = $$('.rotator__w', wrap);
    var i = 0;
    function fit() { wrap.style.width = words[i].offsetWidth + 'px'; }
    fit();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    window.addEventListener('resize', fit);
    if (reduceMotion) return;

    setInterval(function () {
      var prev = words[i];
      i = (i + 1) % words.length;
      var next = words[i];
      prev.classList.remove('is-active');
      prev.classList.add('is-leaving');
      prev.setAttribute('aria-hidden', 'true');
      next.classList.add('is-active');
      next.removeAttribute('aria-hidden');
      fit();
      setTimeout(function () { prev.classList.remove('is-leaving'); }, 900);
    }, 2700);
  })();


  /* ------------------------------------------------------------
     06 PARTÍCULAS DEL HERO
     Motas suaves en los colores de la marca. Se pausan fuera de
     pantalla y con la pestaña oculta.
     ------------------------------------------------------------ */
  (function particles() {
    var canvas = $('#particles');
    if (!canvas || reduceMotion) return;
    var ctx = canvas.getContext('2d');
    var hero = canvas.parentElement;
    var w = 0, h = 0, parts = [], raf = 0, running = false;
    var mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    var palette = ['255,255,255', '255,255,255', '255,255,255', '245,165,36', '245,165,36', '31,165,219', '217,50,73'];

    function spawn(initial) {
      return {
        x: Math.random() * w,
        y: initial ? Math.random() * h : h + 20,
        r: Math.random() * 2.6 + .6,
        vy: Math.random() * .32 + .08,
        vx: (Math.random() - .5) * .16,
        z: Math.random() * .8 + .2,
        a: Math.random() * .5 + .15,
        ph: Math.random() * 6.283,
        c: palette[(Math.random() * palette.length) | 0]
      };
    }

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = clamp(Math.round(w * h / 20000), 26, 80);
      parts = [];
      for (var i = 0; i < n; i++) parts.push(spawn(true));
    }

    function frame(t) {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      mouse.x += (mouse.tx - mouse.x) * .05;
      mouse.y += (mouse.ty - mouse.y) * .05;

      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.y -= p.vy;
        p.x += p.vx + Math.sin(t * .0004 + p.ph) * .12;
        if (p.y < -20) { parts[i] = p = spawn(false); }

        var tw = .65 + .35 * Math.sin(t * .0012 + p.ph);
        var x = p.x + mouse.x * p.z * 34;
        var y = p.y + mouse.y * p.z * 22;
        var alpha = p.a * tw;

        if (p.r > 1.6) {
          var g = ctx.createRadialGradient(x, y, 0, x, y, p.r * 6);
          g.addColorStop(0, 'rgba(' + p.c + ',' + (alpha * .55).toFixed(3) + ')');
          g.addColorStop(1, 'rgba(' + p.c + ',0)');
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(x, y, p.r * 6, 0, 6.283); ctx.fill();
        }
        ctx.fillStyle = 'rgba(' + p.c + ',' + alpha.toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(x, y, p.r, 0, 6.283); ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    }

    function start() { if (!running) { running = true; raf = requestAnimationFrame(frame); } }
    function stop() { running = false; cancelAnimationFrame(raf); }

    resize();
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
    else window.addEventListener('resize', resize);

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { if (e[0].isIntersecting) start(); else stop(); }).observe(hero);
    } else { start(); }

    if (finePointer) {
      hero.addEventListener('pointermove', function (e) {
        var r = hero.getBoundingClientRect();
        mouse.tx = (e.clientX - r.left) / r.width - .5;
        mouse.ty = (e.clientY - r.top) / r.height - .5;
      });
    }
  })();


  /* ------------------------------------------------------------
     07 REVEAL, CONTADORES Y TEXTO POR PALABRAS
     ------------------------------------------------------------ */
  var revealTargets = $$('.reveal, .wipe');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        io.unobserve(en.target);
      });
    }, { threshold: .14, rootMargin: '0px 0px -6% 0px' });
    revealTargets.forEach(function (el) { io.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add('in'); });
  }

  /* Contadores: de 0 al valor final al entrar en pantalla */
  function animateCount(el) {
    var end = parseFloat(el.getAttribute('data-count'));
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduceMotion || isNaN(end)) { el.textContent = end + suffix; return; }
    var dur = 1800, t0 = performance.now();
    function tick(now) {
      var p = clamp((now - t0) / dur, 0, 1);
      var e = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);      /* easeOutExpo */
      el.textContent = Math.round(end * e) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  var counters = $$('[data-count]');
  if ('IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        animateCount(en.target);
        cio.unobserve(en.target);
      });
    }, { threshold: .6 });
    counters.forEach(function (el) { el.textContent = '0' + (el.getAttribute('data-suffix') || ''); cio.observe(el); });
  }

  /* Texto del manifiesto: una palabra por <span> para iluminarlas con el scroll */
  var manifestoText = $('[data-words]');
  var manifestoWords = [];
  if (manifestoText) {
    var words = manifestoText.textContent.trim().split(/\s+/);
    manifestoText.textContent = '';
    words.forEach(function (word, idx) {
      var s = document.createElement('span');
      s.className = 'w';
      s.textContent = word;
      manifestoText.appendChild(s);
      if (idx < words.length - 1) manifestoText.appendChild(document.createTextNode(' '));
      manifestoWords.push(s);
    });
  }


  /* ------------------------------------------------------------
     08 MOTOR DE SCROLL
     Un bucle rAF. Suaviza el scroll (efecto "slow motion") y reparte
     el valor a: barra de progreso, hero, manifiesto, galería anclada,
     parallax de fotos y línea del proceso.
     ------------------------------------------------------------ */
  var heroSec = $('#inicio');
  var heroContent = $('#heroContent');
  var progressBar = $('#progress');
  var stepsEl = $('#steps');
  var stepItems = stepsEl ? $$('.step', stepsEl) : [];
  var galSec = $('#proyectos');
  var galPin = $('#galPin');
  var galTrack = $('#galTrack');
  var galBar = $('#galBar');
  var parallaxImgs = $$('[data-speed]');
  var pinQuery = window.matchMedia('(min-width: 900px) and (min-height: 540px)');
  var stepsDesktop = window.matchMedia('(min-width: 900px)');

  var engine = (function () {
    var vh = window.innerHeight;
    var docH = doc.scrollHeight;
    var ys = window.scrollY;
    var lastBar = -1, litCount = -1, heroDone = false, panX = 0, panTarget = 0;

    var M = {
      heroH: 0,
      man: { top: 0, h: 0 },
      gal: { on: false, top: 0, dist: 0 },
      steps: { top: 0, h: 0, th: [] },
      par: []
    };

    function absTop(el) { return el.getBoundingClientRect().top + window.scrollY; }

    function measure() {
      var sy = window.scrollY;
      vh = window.innerHeight;

      /* Galería anclada: la altura de la sección = recorrido horizontal + 1 pantalla */
      if (galSec && galPin && galTrack) {
        var on = !reduceMotion && pinQuery.matches;
        galSec.classList.toggle('is-pinned', on);
        galSec.style.height = '';
        galTrack.style.transform = '';
        M.gal.on = on;
        if (on) {
          var dist = Math.max(0, galTrack.scrollWidth - galPin.clientWidth);
          galSec.style.height = (dist + vh) + 'px';
          M.gal.dist = dist;
          M.gal.top = absTop(galSec);
        }
      }

      docH = doc.scrollHeight;
      M.heroH = heroSec ? heroSec.offsetHeight : 0;

      if (manifestoText) { M.man.top = absTop(manifestoText); M.man.h = manifestoText.offsetHeight; }

      if (stepsEl && stepItems.length) {
        var last = stepItems[stepItems.length - 1];
        var desk = stepsDesktop.matches;
        if (!desk) stepsEl.style.setProperty('--line-h', last.offsetTop + 'px');
        M.steps.top = absTop(stepsEl);
        M.steps.h = stepsEl.offsetHeight;
        M.steps.th = stepItems.map(function (s, i) {
          if (desk || last.offsetTop === 0) return i / (stepItems.length - 1);
          return s.offsetTop / last.offsetTop;
        });
      }

      M.par = parallaxImgs.map(function (img) {
        var box = img.parentElement;
        return { img: img, speed: parseFloat(img.getAttribute('data-speed')) || 0.06, top: absTop(box), h: box.offsetHeight };
      });
    }

    function frame() {
      var cur = window.scrollY;
      ys += (cur - ys) * .1;                       /* suavizado del scroll */
      if (Math.abs(cur - ys) < .1) ys = cur;

      /* Barra de progreso (sin suavizar para que sea precisa) */
      var maxScroll = docH - vh;
      var bar = maxScroll > 0 ? clamp(cur / maxScroll, 0, 1) : 0;
      if (progressBar && Math.abs(bar - lastBar) > .0005) {
        progressBar.style.transform = 'scaleX(' + bar.toFixed(4) + ')';
        lastBar = bar;
      }

      /* Hero: el contenido sube más lento y se desvanece */
      if (heroContent && !reduceMotion && M.heroH) {
        if (ys < M.heroH * 1.15) {
          var t = clamp(ys / M.heroH, 0, 1);
          heroContent.style.setProperty('--py', (ys * .26).toFixed(1) + 'px');
          heroContent.style.setProperty('--po', clamp(1 - t * 1.25, 0, 1).toFixed(3));
          heroDone = false;
        } else if (!heroDone) {
          heroContent.style.setProperty('--po', '0');
          heroDone = true;
        }
      }

      /* Manifiesto: ilumina palabras */
      if (manifestoWords.length) {
        var mp = clamp((ys + vh * .82 - M.man.top) / (M.man.h + vh * .37), 0, 1);
        var lit = Math.round(mp * manifestoWords.length);
        if (lit !== litCount) {
          for (var i = 0; i < manifestoWords.length; i++) {
            manifestoWords[i].classList.toggle('lit', i < lit);
          }
          litCount = lit;
        }
      }

      /* Galería anclada: scroll vertical -> desplazamiento horizontal */
      if (M.gal.on && M.gal.dist > 0) {
        var gp = clamp((ys - M.gal.top) / M.gal.dist, 0, 1);
        panTarget = -M.gal.dist * gp;
        panX += (panTarget - panX) * .14;
        if (Math.abs(panTarget - panX) < .2) panX = panTarget;
        galTrack.style.transform = 'translate3d(' + panX.toFixed(1) + 'px,0,0)';
        if (galBar) galBar.style.transform = 'scaleX(' + gp.toFixed(4) + ')';
      }

      /* Parallax de fotos */
      if (!reduceMotion) {
        for (var k = 0; k < M.par.length; k++) {
          var pz = M.par[k];
          var center = pz.top + pz.h / 2 - ys - vh / 2;
          if (Math.abs(center) < vh + pz.h) {
            pz.img.style.setProperty('--ty', (-center * pz.speed).toFixed(1) + 'px');
          }
        }
      }

      /* Proceso: la línea avanza y activa cada paso */
      if (stepsEl && M.steps.h) {
        var span = stepsDesktop.matches ? vh * .32 : M.steps.h * .95;
        var sp = clamp((ys + vh * .72 - M.steps.top) / span, 0, 1);
        stepsEl.style.setProperty('--p', sp.toFixed(4));
        for (var j = 0; j < stepItems.length; j++) {
          stepItems[j].classList.toggle('on', sp >= M.steps.th[j] - .001 && sp > 0);
        }
      }

      requestAnimationFrame(frame);
    }

    /* Re-medir cuando cambia el tamaño del documento o la ventana */
    var pending = false;
    function schedule() {
      if (pending) return;
      pending = true;
      requestAnimationFrame(function () { pending = false; measure(); });
    }
    if ('ResizeObserver' in window) new ResizeObserver(schedule).observe(body);
    window.addEventListener('resize', schedule);
    window.addEventListener('orientationchange', schedule);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
    window.addEventListener('load', schedule);

    /* El tamaño de la sección anclada se ajusta a sí mismo; evitar bucle del observer */
    measure();
    requestAnimationFrame(frame);

    return { measure: measure };
  })();


  /* ------------------------------------------------------------
     09 GALERÍA: teclado dentro de la pista anclada + LIGHTBOX
     ------------------------------------------------------------ */
  if (galTrack && galPin) {
    /* Si una foto recibe el foco con Tab, llevar el scroll de la página hasta ella */
    galTrack.addEventListener('focusin', function (e) {
      var item = e.target.closest ? e.target.closest('.g-item, .g-end, .g-intro') : null;
      galPin.scrollLeft = 0;
      if (!item || !galSec.classList.contains('is-pinned')) return;
      var offset = item.offsetLeft - parseFloat(getComputedStyle(galTrack).paddingLeft || 0);
      var y = absTopOf(galSec) + clamp(offset, 0, engineGalDist());
      window.scrollTo({ top: y, behavior: 'auto' });
    });
  }
  function absTopOf(el) { return el.getBoundingClientRect().top + window.scrollY; }
  function engineGalDist() { return Math.max(0, galTrack.scrollWidth - galPin.clientWidth); }

  var lightbox = $('#lightbox');
  var lbImg = $('#lbImg');
  var lbCap = $('#lbCap');
  var gItems = $$('.g-item');
  var lbIndex = 0;

  function lbShow(i) {
    lbIndex = (i + gItems.length) % gItems.length;
    var fig = gItems[lbIndex];
    var img = $('img', fig);
    lbImg.src = img.currentSrc || img.src;
    lbImg.alt = img.alt;
    var strong = $('strong', fig), span = $('span', fig);
    lbCap.textContent = (strong ? strong.textContent : '') + (span ? '. ' + span.textContent : '');
  }
  function lbOpen(i) {
    if (!lightbox || typeof lightbox.showModal !== 'function') return;
    lbShow(i);
    lightbox.showModal();
    body.classList.add('menu-lock');
  }
  if (lightbox) {
    gItems.forEach(function (fig, i) {
      var btn = $('.g-btn', fig);
      if (btn) btn.addEventListener('click', function () { lbOpen(i); });
    });
    $('#lbClose').addEventListener('click', function () { lightbox.close(); });
    $('#lbPrev').addEventListener('click', function () { lbShow(lbIndex - 1); });
    $('#lbNext').addEventListener('click', function () { lbShow(lbIndex + 1); });
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox || e.target.classList.contains('lightbox__fig')) lightbox.close();
    });
    lightbox.addEventListener('close', function () { body.classList.remove('menu-lock'); });
    lightbox.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') lbShow(lbIndex - 1);
      if (e.key === 'ArrowRight') lbShow(lbIndex + 1);
    });
  }


  /* ------------------------------------------------------------
     10 FAQ (acordeón accesible, uno abierto a la vez)
     ------------------------------------------------------------ */
  var faqItems = $$('.faq__item');
  faqItems.forEach(function (item) {
    var q = $('.faq__q', item);
    q.addEventListener('click', function () {
      var willOpen = q.getAttribute('aria-expanded') !== 'true';
      faqItems.forEach(function (other) {
        other.classList.remove('open');
        $('.faq__q', other).setAttribute('aria-expanded', 'false');
      });
      if (willOpen) {
        item.classList.add('open');
        q.setAttribute('aria-expanded', 'true');
      }
    });
  });


  /* ------------------------------------------------------------
     11 FORMULARIO -> WHATSAPP
     Valida en línea, arma el mensaje y abre el chat del negocio.
     ------------------------------------------------------------ */
  var form = $('#quoteForm');
  if (form) {
    var formBtn = $('#formBtn');
    var status = $('#formStatus');
    var validators = {
      nombre:   function (v) { return v.trim().length >= 2 ? '' : 'Escribe tu nombre.'; },
      telefono: function (v) { return v.replace(/\D/g, '').length >= 10 ? '' : 'Escribe un teléfono de 10 dígitos.'; },
      servicio: function (v) { return v ? '' : 'Elige el servicio que necesitas.'; }
    };
    var errIds = { nombre: 'e-nombre', telefono: 'e-tel', servicio: 'e-servicio' };

    function setError(name, msg) {
      var input = form.elements[name];
      var out = document.getElementById(errIds[name]);
      var field = input.closest('.field');
      out.textContent = msg;
      field.classList.toggle('has-error', !!msg);
      input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    }

    Object.keys(validators).forEach(function (name) {
      var input = form.elements[name];
      input.addEventListener('input', function () { if (input.getAttribute('aria-invalid') === 'true') setError(name, validators[name](input.value)); });
      input.addEventListener('blur', function () { if (input.value) setError(name, validators[name](input.value)); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstBad = null;
      Object.keys(validators).forEach(function (name) {
        var msg = validators[name](form.elements[name].value);
        setError(name, msg);
        if (msg && !firstBad) firstBad = form.elements[name];
      });
      if (firstBad) { firstBad.focus(); status.textContent = ''; return; }

      var f = form.elements;
      var lines = [
        'Hola, soy ' + f.nombre.value.trim() + '. Quiero un presupuesto con Pintores Danieles.',
        'Servicio: ' + f.servicio.value,
        'Tipo de inmueble: ' + f.inmueble.value,
        'Mi teléfono: ' + f.telefono.value.trim()
      ];
      if (f.mensaje.value.trim()) lines.push('Detalles: ' + f.mensaje.value.trim());
      var url = waUrl(lines.join('\n'));

      formBtn.classList.add('is-loading');
      window.open(url, '_blank', 'noopener');
      setTimeout(function () {
        formBtn.classList.remove('is-loading');
        status.innerHTML = 'Listo. Se abrió WhatsApp con tu mensaje. Si no ves la ventana, <a href="' + url + '" target="_blank" rel="noopener noreferrer">toca aquí</a>.';
        form.reset();
      }, 900);
    });
  }


  /* ------------------------------------------------------------
     12 MICROINTERACCIONES
     ------------------------------------------------------------ */
  if (finePointer && !reduceMotion) {
    /* Botones magnéticos */
    $$('.magnetic').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = e.clientX - (r.left + r.width / 2);
        var y = e.clientY - (r.top + r.height / 2);
        el.style.setProperty('--mx', (x * .22).toFixed(1) + 'px');
        el.style.setProperty('--my', (y * .3).toFixed(1) + 'px');
      });
      el.addEventListener('pointerleave', function () {
        el.style.setProperty('--mx', '0px');
        el.style.setProperty('--my', '0px');
      });
    });

    /* Foco de luz que sigue al cursor en las celdas de servicios */
    $$('.cell').forEach(function (cell) {
      cell.addEventListener('pointermove', function (e) {
        var r = cell.getBoundingClientRect();
        cell.style.setProperty('--sx', (e.clientX - r.left) + 'px');
        cell.style.setProperty('--sy', (e.clientY - r.top) + 'px');
      });
    });
  }


  /* ------------------------------------------------------------
     ARRANQUE
     ------------------------------------------------------------ */
  runLoader();
})();
