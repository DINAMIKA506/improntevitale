(function () {
  const section = document.querySelector("[data-comments]");
  if (!section) return;
  const slug = section.dataset.comments || new URLSearchParams(location.search).get("slug") || "";
  const list = section.querySelector("[data-comments-list]");
  const form = section.querySelector("[data-comment-form]");
  const status = section.querySelector("[data-comment-status]");

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  })[character]);

  async function loadComments() {
    try {
      const response = await fetch(`/api/comments?slug=${encodeURIComponent(slug)}`);
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || "No pudimos cargar los comentarios.");
      if (!payload.comments.length) {
        list.innerHTML = '<p class="form-note">Todavía no hay comentarios publicados. Podés ser la primera persona en compartir.</p>';
        return;
      }
      list.innerHTML = payload.comments.map((comment) => `<article class="comment"><div class="comment-header"><strong>${escapeHtml(comment.author_name)}</strong><time datetime="${escapeHtml(comment.created_at)}">${new Intl.DateTimeFormat("es-CR", { dateStyle: "medium" }).format(new Date(comment.created_at))}</time></div><p>${escapeHtml(comment.body)}</p></article>`).join("");
    } catch (error) {
      list.innerHTML = `<p class="form-note">${escapeHtml(error.message)}</p>`;
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const button = form.querySelector('[type="submit"]');
    button.disabled = true;
    button.textContent = "Enviando…";
    status.textContent = "";
    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, name: data.get("name"), body: data.get("comment"), website: data.get("website") })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || "No se pudo enviar el comentario.");
      form.reset();
      status.textContent = payload.message;
    } catch (error) {
      status.textContent = error.message;
    } finally {
      button.disabled = false;
      button.textContent = "Enviar comentario";
    }
  });

  loadComments();
})();
