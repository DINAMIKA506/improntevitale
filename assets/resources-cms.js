(function () {
  const catalog = document.querySelector("[data-resource-catalog]");
  if (!catalog) return;
  const escapeText = (value) => String(value || "");
  const resourceCovers = {
    "madurez-vocacional": "/assets/recurso-madurez-vocacional.webp",
    "estilos-aprendizaje": "/assets/recurso-estilos-aprendizaje.webp",
    "ruta-decision": "/assets/recurso-ruta-decision.webp",
    "proyecto-vida": "/assets/recurso-proyecto-vida.webp",
    "ficha-tecnica": "/assets/recurso-ficha-tecnica.webp",
    "creando-mi-ikigai": "/assets/recurso-creando-mi-ikigai.webp"
  };
  fetch("/api/resources")
    .then((response) => response.ok ? response.json() : Promise.reject())
    .then(({ result }) => {
      (result || []).forEach((resource, index) => {
        let card = catalog.querySelector(`[data-resource-id="${CSS.escape(resource.id)}"]`);
        const href = card?.querySelector("a")?.getAttribute("href") || `/recursos/recurso/?id=${encodeURIComponent(resource.id)}`;
        if (!card) {
          card = document.createElement("article");
          card.className = "resource-card";
          card.dataset.resourceId = resource.id;
          catalog.append(card);
        }
        card.replaceChildren();
        const coverUrl = resourceCovers[resource.id];
        if (coverUrl) {
          const cover = document.createElement("img");
          cover.className = "resource-cover";
          cover.src = coverUrl;
          cover.alt = `Portada de ${escapeText(resource.title)}`;
          cover.width = resource.id === "creando-mi-ikigai" ? 1350 : 1000;
          cover.height = resource.id === "creando-mi-ikigai" ? 700 : 519;
          if (index > 0) cover.loading = "lazy";
          card.append(cover);
        }
        const indexRow = document.createElement("div"); indexRow.className = "resource-index";
        const number = document.createElement("span"); number.textContent = String(index + 1).padStart(2, "0");
        const duration = document.createElement("span"); duration.textContent = escapeText(resource.duration);
        const title = document.createElement("h3"); title.textContent = escapeText(resource.title);
        const description = document.createElement("p"); description.textContent = escapeText(resource.description);
        const link = document.createElement("a"); link.className = "text-link"; link.href = href; link.textContent = "Comenzar";
        indexRow.append(number, duration);
        card.append(indexRow, title, description, link);
      });
    })
    .catch(() => {});
})();
