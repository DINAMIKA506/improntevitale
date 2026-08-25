(function () {
  const article = document.querySelector("[data-cms-article]");
  if (!article) return;
  const slug = new URLSearchParams(location.search).get("slug") || "";
  const appendText = (tagName, text) => { const node = document.createElement(tagName); node.textContent = text; article.append(node); };
  fetch(`/api/posts?slug=${encodeURIComponent(slug)}`)
    .then((response) => response.ok ? response.json() : Promise.reject(new Error("No encontramos este artículo.")))
    .then(({ result: post }) => {
      if (!post) throw new Error("No encontramos este artículo.");
      article.replaceChildren();
      appendText("h1", post.title);
      const meta = document.createElement("p"); meta.className = "post-meta"; meta.textContent = `${new Intl.DateTimeFormat("es-CR", { dateStyle: "long" }).format(new Date(post.publishedAt))}${post.readTime ? ` · ${post.readTime}` : ""}`; article.append(meta);
      if (post.image) { const image = document.createElement("img"); image.className = "post-cover"; image.src = post.image; image.alt = post.imageAlt || ""; article.append(image); }
      (post.body || []).forEach((block) => {
        if (block._type === "image" && block.url) {
          const image = document.createElement("img"); image.className = "post-cover"; image.src = block.url; image.alt = block.alt || ""; article.append(image); return;
        }
        if (block._type !== "block") return;
        const content = (block.children || []).map((child) => child.text || "").join("");
        if (!content) return;
        const tag = ["h2", "h3", "blockquote"].includes(block.style) ? block.style : "p";
        appendText(tag, content);
      });
      const actions = document.createElement("div"); actions.className = "post-actions"; actions.innerHTML = '<a class="secondary-button" href="/blog/">← Volver al blog</a><a class="primary-button" href="https://wa.me/50689437609" target="_blank" rel="noopener">Agendar sesión 1:1</a>'; article.append(actions);
      document.title = `${post.title} | Impronte Vitale`;
      const comments = document.querySelector("[data-comments]");
      if (comments) comments.dataset.comments = slug;
    })
    .catch((error) => { article.innerHTML = `<h1>${error.message}</h1><a class="secondary-button" href="/blog/">Volver al blog</a>`; });
})();
