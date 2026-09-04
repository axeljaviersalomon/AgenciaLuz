/* =============================================================
   AGENCIA LUZ — lógica del sitio

   Patrón: una sola IIFE, sin imports ni módulos ES. Motivo: así el
   sitio funciona igual servido por HTTP que abierto con doble clic
   (file://), y el cache-busting del HTML alcanza a todo el código.

   Orden de arranque (boot):
     1. Cosas que no dependen de GSAP (nav, formulario, luz, año).
     2. Animaciones GSAP, sólo si la librería cargó de verdad.

   Cada init va envuelto en safe(): si uno falla, los demás siguen.
   ============================================================= */
(function () {
  "use strict";

  var DATA = window.__LUZ__ || {};

  /* ---------- Helpers ---------------------------------------- */
  var $  = function (sel, scope) { return (scope || document).querySelector(sel); };
  var $$ = function (sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); };

  // Preferencias del usuario / capacidades del dispositivo.
  // Se leen una sola vez al arrancar: no cambian durante la sesión.
  var reduced   = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePoint = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var isMobile  = window.matchMedia("(max-width: 719px)").matches;

  function safe(fn, name) {
    try { fn(); } catch (e) { console.warn("[" + name + "]", e); }
  }


  /* =============================================================
     AÑO DEL FOOTER
     Evita tener que actualizar el copyright a mano cada enero.
     ============================================================= */
  function initYear() {
    var el = $("#year");
    if (el) el.textContent = String(new Date().getFullYear());
  }


  /* =============================================================
     NAVEGACIÓN
     - Fondo sólido al pasar los 40px de scroll.
     - Menú hamburguesa en mobile: se cierra al elegir un enlace,
       al pulsar Escape y al pasar a viewport de escritorio.
     ============================================================= */
  function initNav() {
    var nav    = $("#nav");
    var toggle = $("#navToggle");
    var menu   = $("#navMenu");
    if (!nav || !toggle || !menu) return;

    // Fondo del nav. Se usa un flag para no tocar el DOM en cada píxel scrolleado.
    var solid = false;
    function onScroll() {
      var should = window.scrollY > 40;
      if (should === solid) return;
      solid = should;
      nav.classList.toggle("is-scrolled", should);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    function setMenu(open) {
      menu.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    }

    toggle.addEventListener("click", function () {
      setMenu(toggle.getAttribute("aria-expanded") !== "true");
    });

    // Cerrar al navegar a una sección
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });

    // Cerrar con Escape y devolver el foco al botón (accesibilidad de teclado)
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setMenu(false);
        toggle.focus();
      }
    });

    // Al pasar a escritorio el menú es una barra: hay que limpiar el estado abierto
    var desktop = window.matchMedia("(min-width: 960px)");
    var onChange = function (e) { if (e.matches) setMenu(false); };
    if (desktop.addEventListener) desktop.addEventListener("change", onChange);
    else if (desktop.addListener) desktop.addListener(onChange);
  }


  /* =============================================================
     SCROLL A ANCLAS
     Scroll nativo (no hay librería de smooth scroll: es la opción
     que se comporta igual en todas las máquinas). Se intercepta
     sólo para descontar la altura del nav fijo.
     ============================================================= */
  function initAnchors() {
    document.addEventListener("click", function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;

      var id = a.getAttribute("href");
      if (!id || id === "#") return;

      var target = document.querySelector(id);
      if (!target) return;

      e.preventDefault();
      var offset = 78; // alto aproximado del nav
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.scrollY - offset,
        behavior: reduced ? "auto" : "smooth"
      });

      // Mantener la URL sincronizada sin provocar un segundo salto
      if (history.replaceState) history.replaceState(null, "", id);
    });
  }


  /* =============================================================
     LA LUZ — interacción firma de la marca
     Un gradiente cálido sigue al cursor. Se interpola (lerp) para
     que el movimiento sea suave y se actualiza dentro de un único
     requestAnimationFrame, escribiendo dos custom properties.

     - Con puntero fino: sigue al mouse.
     - Sin puntero fino (táctil): deriva sola, muy lento.
     - Con movimiento reducido: queda quieta en su posición inicial.
     ============================================================= */
  function initLuz() {
    if (reduced) return;

    var root = document.documentElement;
    var targetX = 50, targetY = 22;   // en % del viewport
    var currentX = 50, currentY = 22;
    var running = false;

    function render() {
      // Interpolación: 12% de la distancia por frame → estela suave
      currentX += (targetX - currentX) * 0.12;
      currentY += (targetY - currentY) * 0.12;

      root.style.setProperty("--mx", currentX.toFixed(2) + "%");
      root.style.setProperty("--my", currentY.toFixed(2) + "%");

      // Se detiene cuando ya está prácticamente en destino: no gasta batería de más
      if (Math.abs(targetX - currentX) > 0.05 || Math.abs(targetY - currentY) > 0.05) {
        requestAnimationFrame(render);
      } else {
        running = false;
      }
    }

    function kick() {
      if (running) return;
      running = true;
      requestAnimationFrame(render);
    }

    if (finePoint) {
      window.addEventListener("mousemove", function (e) {
        targetX = (e.clientX / window.innerWidth) * 100;
        targetY = (e.clientY / window.innerHeight) * 100;
        kick();
      }, { passive: true });
    } else {
      // En táctil la luz respira sola: un vaivén lentísimo, casi imperceptible
      setInterval(function () {
        targetX = 35 + Math.random() * 30;
        targetY = 15 + Math.random() * 25;
        kick();
      }, 4000);
    }
  }


  /* =============================================================
     REVEALS CON GSAP + SCROLLTRIGGER
     Criterio de animación (según el brief):
       - Sólo fade + desplazamiento corto (18px, 12px en mobile).
       - Duración 0.6s, easing power3.out (sin rebotes).
       - Stagger corto entre elementos hermanos.
       - Con movimiento reducido: sólo fade, sin desplazamiento.

     Regla de seguridad: la clase .anim en <html> se agrega DESDE
     ACÁ, no en el HTML. Si GSAP no cargó, nunca se oculta nada y
     la página se lee igual.
     ============================================================= */
  function initReveals() {
    var els = $$(".reveal");
    if (!els.length) return;

    document.documentElement.classList.add("anim");

    var distance = reduced ? 0 : (isMobile ? 12 : 18);
    gsap.set(els, { opacity: 0, y: distance });

    function show(batch) {
      gsap.to(batch, {
        opacity: 1,
        y: 0,
        duration: reduced ? 0.35 : 0.6,
        ease: "power3.out",
        stagger: reduced ? 0 : 0.08,
        overwrite: "auto",
        onStart: function () {
          batch.forEach(function (el) { el.classList.add("is-in"); });
        }
      });
    }

    ScrollTrigger.batch(els, {
      // start bajo: el elemento se revela apenas asoma, nunca "tarde"
      start: "top 92%",
      once: true,
      onEnter: show
    });

    // Red de seguridad: si algo quedó sin revelar (trigger mal calculado,
    // cambio de layout, imagen que movió el flujo), a los 6 segundos se
    // muestra todo lo que ya esté dentro o por encima del viewport.
    setTimeout(function () {
      var pending = els.filter(function (el) {
        return !el.classList.contains("is-in") &&
               el.getBoundingClientRect().top < window.innerHeight;
      });
      if (pending.length) {
        gsap.set(pending, { opacity: 1, y: 0 });
        pending.forEach(function (el) { el.classList.add("is-in"); });
      }
    }, 6000);
  }


  /* =============================================================
     ENTRADA DEL HERO
     El único refuerzo animado del primer viewport: los bloques
     aparecen escalonados de arriba hacia abajo. Distancias cortas
     y duraciones de 0.7s como máximo — el texto tiene que poder
     leerse enseguida, no esperar a que termine una coreografía.
     ============================================================= */
  function initHero() {
    var parts = [
      ".hero__kicker",
      ".hero__title",
      ".hero__sub",
      ".hero__actions",
      ".hero__pillars"
    ].map(function (sel) { return $(sel); }).filter(Boolean);

    if (!parts.length) return;

    gsap.set(parts, { opacity: 0, y: reduced ? 0 : 16 });
    gsap.to(parts, {
      opacity: 1,
      y: 0,
      duration: reduced ? 0.4 : 0.7,
      ease: "power3.out",
      stagger: reduced ? 0 : 0.09,
      delay: 0.1
    });
  }


  /* =============================================================
     FRASE DE LA BANDA — entrada palabra por palabra.
     Envuelve cada palabra del texto en un <span class="word"> (sin
     tocar el <br> ni el <em>: sólo reemplaza los nodos de texto) y
     las anima con blur + opacidad + un pequeño ascenso, en cascada.
     Es el único lugar del sitio con esta animación "de cierre": le da
     un remate distinto a la frase-eslogan sin repetir el fade genérico
     de .reveal en el resto de las secciones.
     ============================================================= */
  function initBandaQuote() {
    var el = $(".banda__quote");
    if (!el) return;

    function wrapWords(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (chunk) {
            if (chunk === "") return;
            if (/^\s+$/.test(chunk)) {
              frag.appendChild(document.createTextNode(chunk));
            } else {
              var span = document.createElement("span");
              span.className = "word";
              span.textContent = chunk;
              frag.appendChild(span);
            }
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1) {
          wrapWords(child);
        }
      });
    }
    wrapWords(el);

    var words = $$(".word", el);
    if (!words.length) return;

    gsap.set(words, {
      opacity: 0,
      y: reduced ? 0 : 22,
      filter: reduced ? "none" : "blur(8px)"
    });
    gsap.to(words, {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      duration: reduced ? 0.4 : 0.9,
      ease: "power3.out",
      stagger: reduced ? 0 : 0.045,
      scrollTrigger: {
        trigger: el,
        start: "top 82%",
        once: true
      }
    });
  }


  /* =============================================================
     PARALLAX SUAVE EN IMÁGENES
     Recorrido total de un 8% de la altura de la imagen (±4%), que en
     una banda de 400px son unos 32px: se percibe como profundidad,
     no como "la foto se mueve". Las imágenes están escaladas a 1.12–1.15
     en CSS justamente para tener ese margen sin mostrar bordes vacíos.

     scrub: 0.6 → el movimiento sigue al scroll con una inercia mínima.
     Se desactiva por completo con movimiento reducido.
     ============================================================= */
  function initParallax() {
    if (reduced) return;

    $$("[data-parallax]").forEach(function (img) {
      var section = img.closest("section");
      if (!section) return;

      gsap.fromTo(img,
        { yPercent: -4 },
        {
          yPercent: 4,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top bottom",   // empieza cuando la sección asoma por abajo
            end: "bottom top",     // termina cuando sale por arriba
            scrub: 0.6
          }
        }
      );
    });
  }


  /* =============================================================
     FORMULARIO DE CONTACTO
     Sin backend propio: si el atributo data-endpoint del <form>
     está vacío, el envío se simula y se muestra el estado de éxito.
     Para activarlo de verdad basta con poner ahí una URL que acepte
     POST (FormSubmit, Formspree, webhook propio…).

     Incluye: validación nativa + mensajes en español, honeypot
     anti-spam y bloqueo del botón mientras se envía (evita el
     doble submit).
     ============================================================= */
  function initForm() {
    var form = $("#contactForm");
    var status = $("#formStatus");
    if (!form || !status) return;

    var textos = DATA.form || {};

    function setStatus(msg, kind) {
      status.textContent = msg || "";
      status.classList.remove("is-ok", "is-error");
      if (kind) status.classList.add(kind);
    }

    // Marca visualmente el campo inválido y limpia la marca al corregirlo
    function markInvalid(el) {
      var field = el.closest(".field");
      if (!field) return;
      field.classList.add("has-error");
      el.addEventListener("input", function once() {
        field.classList.remove("has-error");
        el.removeEventListener("input", once);
      });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      // Honeypot: si viene completo, es un bot. Se finge éxito y no se envía nada.
      if (form.querySelector('[name="_honey"]').value) {
        setStatus(textos.ok, "is-ok");
        return;
      }

      // Validación nativa, con foco en el primer campo con problema
      var invalid = null;
      $$("input, select, textarea", form).forEach(function (el) {
        if (el.name === "_honey") return;
        if (!el.checkValidity()) {
          markInvalid(el);
          if (!invalid) invalid = el;
        }
      });
      if (invalid) {
        setStatus(textos.incompleto, "is-error");
        invalid.focus();
        return;
      }

      form.classList.add("is-sending");
      setStatus(textos.enviando, null);

      var endpoint = form.getAttribute("data-endpoint");

      // Sin endpoint configurado → envío simulado (900ms para que el
      // cambio de estado se perciba como una respuesta real)
      if (!endpoint) {
        setTimeout(function () {
          form.classList.remove("is-sending");
          form.reset();
          setStatus(textos.ok, "is-ok");
        }, 900);
        return;
      }

      fetch(endpoint, {
        method: "POST",
        headers: { "Accept": "application/json" },
        body: new FormData(form)
      })
        .then(function (res) {
          if (!res.ok) throw new Error("HTTP " + res.status);
          form.reset();
          setStatus(textos.ok, "is-ok");
        })
        .catch(function () {
          setStatus(textos.error, "is-error");
        })
        .then(function () {
          form.classList.remove("is-sending");
        });
    });
  }


  /* =============================================================
     MALLA DE PUNTOS — fondo animado de la sección "Para quién".
     Grilla de puntos cuyo tamaño/brillo ondula con una onda seno
     (dos ejes, para que no se vea un simple barrido lineal), en los
     colores de la marca. Canvas 2D nativo: nada de librerías.
     Se pausa fuera de pantalla (IntersectionObserver) para no gastar
     batería de más, y con movimiento reducido dibuja un único frame
     estático en vez de animar.
     ============================================================= */
  function initDotWave() {
    var canvases = $$(".dotwave");
    if (!canvases.length) return;

    var css = getComputedStyle(document.documentElement);
    var dotColor    = (css.getPropertyValue("--ink-mute") || "#6B6459").trim();
    var accentColor = (css.getPropertyValue("--clay") || "#C4562F").trim();
    var GAP = 26;                 // separación entre puntos, en px CSS
    var dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Cada canvas es independiente (resize/tiempo/observer propios) —
    // una sección puede estar en pantalla mientras la otra no.
    canvases.forEach(function (canvas) {
      if (!canvas.getContext) return;
      var ctx = canvas.getContext("2d");
      if (!ctx) return;

      var w = 0, h = 0, t = Math.random() * 100, running = false;

      function resize() {
        var rect = canvas.parentElement.getBoundingClientRect();
        w = rect.width;
        h = rect.height;
        canvas.width  = Math.max(1, Math.round(w * dpr));
        canvas.height = Math.max(1, Math.round(h * dpr));
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      function draw() {
        ctx.clearRect(0, 0, w, h);
        var cols = Math.ceil(w / GAP) + 1;
        var rows = Math.ceil(h / GAP) + 1;
        for (var i = 0; i < cols; i++) {
          for (var j = 0; j < rows; j++) {
            var x = i * GAP;
            var y = j * GAP;
            var wave = Math.sin(x * 0.02 + t) * Math.cos(y * 0.028 + t * 0.7);
            var lift = Math.max(0, wave);
            ctx.beginPath();
            ctx.fillStyle = wave > 0.72 ? accentColor : dotColor;
            ctx.globalAlpha = 0.05 + lift * 0.24;
            ctx.arc(x, y, 1 + lift * 1.7, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.globalAlpha = 1;
      }

      function frame() {
        if (!running) return;
        t += 0.006;
        draw();
        requestAnimationFrame(frame);
      }
      function start() { if (!running) { running = true; requestAnimationFrame(frame); } }
      function stop()  { running = false; }

      resize();
      draw();
      if (reduced) return;   // se queda con el frame estático de arriba

      window.addEventListener("resize", function () { resize(); draw(); }, { passive: true });

      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (entries) {
          if (entries[0].isIntersecting) start(); else stop();
        }, { threshold: 0.05 }).observe(canvas);
      } else {
        start();
      }
    });
  }


  /* =============================================================
     BOOT
     ============================================================= */
  function boot() {
    safe(initYear, "initYear");
    safe(initNav, "initNav");
    safe(initAnchors, "initAnchors");
    safe(initLuz, "initLuz");
    safe(initForm, "initForm");
    safe(initDotWave, "initDotWave");

    // GSAP se usa sólo si cargó. Si el archivo faltara, el sitio
    // sigue siendo perfectamente legible y navegable.
    if (window.gsap && window.ScrollTrigger) {
      try { gsap.registerPlugin(ScrollTrigger); } catch (err) {}
      safe(initHero, "initHero");
      safe(initBandaQuote, "initBandaQuote");
      safe(initReveals, "initReveals");
      safe(initParallax, "initParallax");
    }

    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
