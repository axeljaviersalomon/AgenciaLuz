/* =============================================================
   AGENCIA LUZ — datos de marca
   Único objeto global del sitio: window.__LUZ__.
   Acá viven los datos que pueden cambiar sin tocar la lógica.

   ⚠️ PLACEHOLDERS: reemplazar los valores marcados con TU-... por
   los datos reales antes de publicar. Los mismos valores aparecen
   en index.html (enlaces de WhatsApp, email e Instagram) — cambiar
   en los dos lugares.
   ============================================================= */
(function () {
  "use strict";

  window.__LUZ__ = {
    name: "Agencia Luz",

    contacto: {
      whatsapp: "TU-NUMERO",              // formato internacional sin signos, ej. 5491122334455
      email: "TU-EMAIL@dominio.com",
      instagram: "TU-USUARIO"
    },

    // Textos de estado del formulario, centralizados para poder ajustarlos rápido
    form: {
      enviando: "Enviando…",
      ok: "¡Listo! Recibimos tu mensaje. Te respondemos dentro de las próximas 24 horas hábiles.",
      error: "No pudimos enviar el formulario. Escribinos por WhatsApp y lo resolvemos al toque.",
      incompleto: "Revisá los campos marcados: falta completar algo."
    }
  };
})();
