(() => {
  const BRANDED_TYPEFORM_HOSTS = new Set([
    "cuestionario.programadeprevencion.com",
    "entrevista.programadeprevencion.com",
    "kitfit.programadeprevencion.com",
    "recepcionmuestra.programadeprevencion.com",
    "enviolab.programadeprevencion.com",
    "recepcionresultados.programadeprevencion.com",
    "informeprograma.programadeprevencion.com",
  ]);

  const host = window.location.hostname.toLowerCase();
  if (!BRANDED_TYPEFORM_HOSTS.has(host)) return;

  if (window.location.pathname === "/typeform.html") return;

  const target = `/typeform.html${window.location.search}${window.location.hash}`;
  window.location.replace(target);
})();
