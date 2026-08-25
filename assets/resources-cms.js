(function () {
  const catalog = document.querySelector("[data-resource-catalog]");
  if (!catalog) return;
  const escapeText = (value) => String(value || "");
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
