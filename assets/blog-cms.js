(function () {
  const feed = document.querySelector(".blog-feed");
  if (!feed) return;

  function createCard(post) {
    const card = document.createElement("a");
    card.className = "feed-card";
    card.href = `/blog/articulo/?slug=${encodeURIComponent(post.slug)}`;
    card.dataset.blogCard = "";
    card.dataset.slug = post.slug;
    card.dataset.category = String(post.category || "psicopedagogia").toLocaleLowerCase("es");
    const image = document.createElement("img");
    image.src = post.image || "/assets/og-impronte.jpg";
    image.alt = post.imageAlt || "";
    const copy = document.createElement("div");
    copy.className = "feed-card-copy";
    const tag = document.createElement("span"); tag.className = "tag"; tag.textContent = post.category || "Impronte";
    const meta = document.createElement("p"); meta.className = "feed-meta"; meta.textContent = `${new Intl.DateTimeFormat("es-CR", { dateStyle: "medium" }).format(new Date(post.publishedAt))}${post.readTime ? ` · ${post.readTime}` : ""}`;
    const title = document.createElement("h2"); title.textContent = post.title;
    const excerpt = document.createElement("p"); excerpt.textContent = post.excerpt || "";
    const link = document.createElement("span"); link.className = "text-link"; link.textContent = "Leer artículo";
    copy.append(tag, meta, title, excerpt, link);
    card.append(image, copy);
    return card;
  }

  fetch("/api/posts")
    .then((response) => response.ok ? response.json() : Promise.reject())
    .then(({ result }) => {
      if (!Array.isArray(result) || !result.length) return;
      feed.querySelectorAll("[data-blog-card]").forEach((card) => card.remove());
      result.forEach((post) => feed.insertBefore(createCard(post), feed.querySelector("[data-blog-empty]")));

      const featured = document.querySelector("[data-featured-post]");
      const first = result[0];
      if (featured && first) {
        const image = featured.querySelector("img");
        const title = featured.querySelector("h1");
        const excerpt = featured.querySelector("[data-featured-excerpt]");
        const meta = featured.querySelector("[data-featured-meta]");
        const link = featured.querySelector("a.primary-button");
        if (image) { image.src = first.image || "/assets/og-impronte.jpg"; image.alt = first.imageAlt || ""; }
        if (title) title.textContent = first.title;
        if (excerpt) excerpt.textContent = first.excerpt || "";
        if (meta) meta.textContent = `Valerie Calderón · ${new Intl.DateTimeFormat("es-CR", { dateStyle: "medium" }).format(new Date(first.publishedAt))}${first.readTime ? ` · ${first.readTime}` : ""}`;
        if (link) link.href = `/blog/articulo/?slug=${encodeURIComponent(first.slug)}`;
      }
      document.dispatchEvent(new CustomEvent("impronte:blog-updated"));
    })
    .catch(() => {});
})();
