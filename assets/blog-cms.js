(function () {
  const feed = document.querySelector(".blog-feed");
  if (!feed) return;
  const existing = new Set(Array.from(feed.querySelectorAll("[data-blog-card]")).map((card) => card.getAttribute("href")));
  fetch("/api/posts")
    .then((response) => response.ok ? response.json() : Promise.reject())
    .then(({ result }) => {
      (result || []).forEach((post) => {
        const href = `/blog/articulo/?slug=${encodeURIComponent(post.slug)}`;
        if (existing.has(href)) return;
        const card = document.createElement("a");
        card.className = "feed-card";
        card.href = href;
        card.dataset.blogCard = "";
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
        feed.insertBefore(card, feed.querySelector("[data-blog-empty]"));
      });
    })
    .catch(() => {});
})();
