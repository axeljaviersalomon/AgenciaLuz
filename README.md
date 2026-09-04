# Agencia Luz — landing page

Sitio estático: HTML + CSS + JavaScript vanilla. Sin build, sin npm, sin frameworks.
Se sube tal cual a cualquier hosting (FTP, Netlify, Cloudflare Pages, GitHub Pages).

## Archivos

```
index.html      → todo el contenido, sección por sección (comentado)
styles.css      → estilos (índice numerado en la cabecera del archivo)
main.js         → interacción y animaciones GSAP
lib/gsap.min.js + lib/ScrollTrigger.min.js  → librerías locales (no CDN)
lib/manifest.js → datos de marca y textos del formulario
.htaccess       → cabeceras de caché para hostings Apache/LiteSpeed
```

## Ver el sitio

Doble clic en `index.html` alcanza. Para verlo como en producción:
`npx serve` o cualquier servidor estático desde esta carpeta.

## ⚠️ Antes de publicar: reemplazar los placeholders

| Dato | Dónde aparece |
|---|---|
| `TU-NUMERO` (WhatsApp, formato internacional sin signos, ej. `5491122334455`) | `index.html` (botón hero, sección contacto, botón flotante) y `lib/manifest.js` |
| `TU-EMAIL@dominio.com` | `index.html` (contacto y JSON-LD) y `lib/manifest.js` |
| `TU-USUARIO` (Instagram) | `index.html` (contacto y JSON-LD) |
| `TU-DOMINIO.com` | `index.html` (canonical, Open Graph, JSON-LD) |

Buscar con Ctrl+F `TU-` para encontrarlos todos.

## Formulario

Hoy el envío está **simulado**: valida, muestra "enviando" y confirma el éxito, pero
no manda nada a ningún lado. Para activarlo, poner una URL que acepte `POST` en el
atributo `data-endpoint` del `<form id="contactForm">` en `index.html`. Por ejemplo:

```html
<form class="form" id="contactForm" novalidate data-endpoint="https://formsubmit.co/ajax/TU-EMAIL@dominio.com">
```

El campo oculto `_honey` es un honeypot anti-spam: no tocarlo.

## Caché al actualizar

`index.html` carga el CSS y el JS con `?v=20260903-3`. **Cada vez que se edite
`styles.css` o `main.js`, cambiar ese número por la fecha del día** en las cuatro
referencias del final del HTML. Si no, el navegador puede seguir sirviendo la
versión vieja.

El `.htaccess` ya le pide al servidor que no cachee HTML/CSS/JS y sí las imágenes.
Funciona en Apache y LiteSpeed; en Netlify o Cloudflare Pages se ignora (usan
`_headers`) y en Nginx hay que configurarlo desde el panel.

## Imágenes

Las tres fotos de `assets/img/` son **placeholders de stock** (archivo de Unsplash vía
Lorem Picsum, detalle en `assets/credits.json`). Comparten un mismo hilo visual —luces:
ciudad al atardecer, luces nocturnas, luces de escenario— que es de donde sale el rosa
de la paleta. Reemplazarlas por trabajo real de la agencia manteniendo los nombres de
archivo y las proporciones:

| Archivo | Dónde | Proporción |
|---|---|---|
| `luz-ciudad.jpg` | banda entre manifiesto y servicios | 16:9 |
| `luz-noche.jpg` | bloque oscuro de Desarrollo | 16:10 |
| `luz-escena.jpg` | columna del proceso | 4:5 vertical |

Si cambia la proporción, ajustar el `width`/`height` del `<img>` en `index.html`
(están puestos para evitar saltos de layout al cargar).

## Notas de diseño

- Paleta y tipografías salen de las variables CSS en `:root` (bloque 1 de `styles.css`).
- La paleta es papel claro + tres acentos:
  `--accent` azul profundo `#16325C` (CTAs y énfasis) · `--sun` ámbar `#E8A317`
  (el resplandor de "la luz", sólo decorativo — sobre papel no llega al contraste
  mínimo para texto chico) · `--clay` terracota `#C4562F` (números, etiquetas y
  micro-beneficios).
- El gradiente cálido que sigue al cursor es la interacción firma ("Luz").
  En pantallas táctiles deriva solo; con `prefers-reduced-motion` queda fijo.
- El bloque de Desarrollo es el único en oscuro (`--dark`, casi negro violáceo). Es
  el corte visual de la página y le da jerarquía propia al servicio estrella.
- Las animaciones GSAP son fade + 18px de desplazamiento (12px en mobile), 0.6s,
  `power3.out`, más un parallax de ±4% en las imágenes. Sin scroll hijack.
- Movimiento continuo: los blobs de color (28s) y la cinta de palabras del bloque
  oscuro (38s). Ambos se detienen con `prefers-reduced-motion`.
- El contenido es visible por defecto: si el JS falla o está desactivado, la página
  se lee completa igual.
