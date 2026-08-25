(function () {
  const textFields = new Set(["hero_kicker", "hero_title", "hero_accent", "hero_description", "primary_label", "secondary_label"]);
  fetch("/api/site-content")
    .then((response) => response.ok ? response.json() : Promise.reject())
    .then(({ result }) => {
      if (!result) return;
      textFields.forEach((key) => {
        if (!result[key]) return;
        document.querySelectorAll(`[data-cms-text="${key}"]`).forEach((node) => { node.textContent = result[key]; });
      });
      document.querySelectorAll('[data-cms-href="secondary_url"]').forEach((node) => {
        if (result.secondary_url) node.href = result.secondary_url;
      });
      if (result.booking_url) {
        document.querySelectorAll('a[href*="wa.me/50689437609"], [data-booking-link]').forEach((node) => { node.href = result.booking_url; });
      }
      if (result.booking_label) {
        document.querySelectorAll("[data-booking-label], .nav-cta").forEach((node) => { node.textContent = result.booking_label; });
      }
    })
    .catch(() => {});
})();
