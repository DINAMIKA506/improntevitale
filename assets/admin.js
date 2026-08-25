(function () {
  const loginShell = document.querySelector("[data-login-shell]");
  const loginForm = document.querySelector("[data-login-form]");
  const loginStatus = document.querySelector("[data-login-status]");
  const app = document.querySelector("[data-crm-app]");
  const main = document.querySelector("[data-crm-main]");
  const sidebar = document.querySelector(".crm-sidebar");
  const modal = document.querySelector("[data-modal]");
  const modalForm = document.querySelector("[data-modal-form]");
  const modalContent = document.querySelector("[data-modal-content]");
  const modalTitle = document.querySelector("[data-modal-title]");
  const modalSubmit = document.querySelector("[data-modal-submit]");
  const toastNode = document.querySelector("[data-toast]");

  const state = { currentView: "overview", cache: {}, modalHandler: null, resourceDraft: null };
  const inviteParams = new URLSearchParams(location.hash.replace(/^#/, ""));
  const inviteToken = ["invite", "recovery"].includes(inviteParams.get("type")) ? inviteParams.get("access_token") : "";
  const builtins = new Set(["madurez-vocacional", "estilos-aprendizaje", "ruta-decision", "proyecto-vida", "creando-mi-ikigai", "ficha-tecnica"]);
  const views = {
    overview: ["Panel general", "Hola, Valerie"],
    leads: ["Relaciones", "Consultas recibidas"],
    submissions: ["Acompañamiento", "Formularios y respuestas"],
    comments: ["Comunidad", "Comentarios del blog"],
    posts: ["Contenido", "Artículos del blog"],
    resources: ["Experiencias", "Recursos interactivos"],
    content: ["Sitio web", "Editar página de inicio"]
  };
  const statusNames = {
    new: "Nuevo", reviewing: "En revisión", completed: "Completado", archived: "Archivado",
    contacted: "Contactado", scheduled: "Sesión agendada", closed: "Cerrado",
    pending: "Pendiente", approved: "Aprobado", rejected: "Rechazado",
    draft: "Borrador", published: "Publicado"
  };

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  })[character]);
  const slugify = (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
  const answerLabels = {
    ik_love: "Lo que ama",
    ik_good: "En lo que es buena/o",
    ik_world: "Lo que el mundo necesita",
    ik_paid: "Por lo que pueden pagarle",
    ik_core: "Su Ikigai"
  };
  const prettyKey = (value) => answerLabels[value] || String(value || "").replace(/[_-]+/g, " ").replace(/^./, (letter) => letter.toUpperCase());
  const formatDate = (value, withTime = false) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("es-CR", withTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" }).format(date);
  };
  const inputDate = (value) => {
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) return "";
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  };
  const statusPill = (status) => `<span class="status-pill ${escapeHtml(status)}">${escapeHtml(statusNames[status] || status)}</span>`;

  async function api(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: { ...(options.body ? { "Content-Type": "application/json" } : {}), ...(options.headers || {}) }
    });
    const payload = await response.json().catch(() => ({}));
    if (response.status === 401 && !url.includes("/auth")) {
      showLogin();
      throw new Error("Tu sesión terminó. Ingresá nuevamente.");
    }
    if (!response.ok) throw new Error(payload.message || "No fue posible completar la operación.");
    return payload;
  }

  function crm(entity, method = "GET", body) {
    return api(`/api/admin/data?entity=${encodeURIComponent(entity)}`, { method, body: body ? JSON.stringify(body) : undefined });
  }

  let toastTimer;
  function toast(message, error = false) {
    clearTimeout(toastTimer);
    toastNode.textContent = message;
    toastNode.classList.toggle("is-error", error);
    toastNode.classList.add("is-visible");
    toastTimer = setTimeout(() => toastNode.classList.remove("is-visible"), 3500);
  }

  function showLogin() {
    app.hidden = true;
    loginShell.hidden = false;
    loginForm.password.value = "";
  }

  function prepareInvitation() {
    loginShell.querySelector("h1").textContent = "Creá tu contraseña privada.";
    loginShell.querySelector(".login-card > p:not(.login-eyebrow,.login-note)").textContent = "Tu invitación fue validada. Elegí una contraseña segura para entrar al CRM de Impronte Vitale.";
    loginForm.password.minLength = 12;
    loginForm.password.autocomplete = "new-password";
    loginForm.password.placeholder = "Mínimo 12 caracteres";
    loginForm.querySelector("button").textContent = "Crear contraseña e ingresar";
  }

  function showApp(email) {
    loginShell.hidden = true;
    app.hidden = false;
    document.querySelector("[data-admin-email]").textContent = email;
    loadView("overview");
  }

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = loginForm.querySelector("button");
    button.disabled = true;
    button.textContent = "Verificando…";
    loginStatus.textContent = "";
    try {
      if (inviteToken) {
        await api("/api/admin/password", { method: "POST", body: JSON.stringify({ accessToken: inviteToken, password: loginForm.password.value }) });
        history.replaceState(null, "", "/admin/");
      }
      const payload = await api("/api/admin/auth", {
        method: "POST",
        body: JSON.stringify({ email: loginForm.email.value, password: loginForm.password.value })
      });
      showApp(payload.email);
    } catch (error) {
      loginStatus.textContent = error.message;
    } finally {
      button.disabled = false;
      button.textContent = inviteToken ? "Crear contraseña e ingresar" : "Ingresar al CRM";
    }
  });

  document.querySelector("[data-logout]").addEventListener("click", async () => {
    try { await api("/api/admin/auth", { method: "DELETE", body: "{}" }); } catch (_) {}
    showLogin();
  });

  document.querySelector("[data-mobile-menu]").addEventListener("click", () => sidebar.classList.toggle("is-open"));
  document.querySelectorAll("[data-view-target]").forEach((button) => button.addEventListener("click", () => {
    loadView(button.dataset.viewTarget);
    sidebar.classList.remove("is-open");
  }));

  function setView(view) {
    state.currentView = view;
    const [eyebrow, title] = views[view];
    document.querySelector("[data-view-eyebrow]").textContent = eyebrow;
    document.querySelector("[data-view-title]").textContent = title;
    document.querySelectorAll("[data-view-target]").forEach((button) => button.classList.toggle("is-active", button.dataset.viewTarget === view));
    main.innerHTML = '<div class="loading-card">Cargando información…</div>';
  }

  async function loadView(view) {
    setView(view);
    try {
      const { result } = await crm(view);
      state.cache[view] = result;
      if (view === "overview") renderOverview(result);
      else if (view === "leads") renderLeads(result);
      else if (view === "submissions") renderSubmissions(result);
      else if (view === "comments") renderComments(result);
      else if (view === "posts") renderPosts(result);
      else if (view === "resources") renderResources(result);
      else if (view === "content") renderContent(result);
    } catch (error) {
      main.innerHTML = `<section class="panel-card empty-panel"><h2>No pudimos abrir esta sección</h2><p>${escapeHtml(error.message)}</p><button class="crm-secondary" type="button" data-retry>Intentar nuevamente</button></section>`;
      main.querySelector("[data-retry]")?.addEventListener("click", () => loadView(view));
    }
  }

  function viewHeading(title, description, action = "") {
    return `<div class="view-heading"><div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(description)}</p></div>${action}</div>`;
  }

  function activityItem(icon, title, subtitle, date) {
    return `<div class="activity-item"><span>${icon}</span><div><strong>${escapeHtml(title || "Sin nombre")}</strong><small>${escapeHtml(subtitle || "")}</small></div><time>${escapeHtml(formatDate(date))}</time></div>`;
  }

  function renderOverview(data) {
    const recent = [
      ...(data.recent?.leads || []).map((item) => ({ icon: "✦", title: `${item.first_name || ""} ${item.last_name || ""}`.trim(), subtitle: "Nueva consulta", date: item.created_at })),
      ...(data.recent?.submissions || []).map((item) => ({ icon: "✓", title: item.participant_name, subtitle: prettyKey(item.resource_id), date: item.created_at })),
      ...(data.recent?.comments || []).map((item) => ({ icon: "◌", title: item.author_name, subtitle: `Comentario en ${prettyKey(item.post_slug)}`, date: item.created_at }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);
    main.innerHTML = `
      ${viewHeading("Tu espacio hoy", "Un vistazo rápido a las personas y al contenido que necesitan tu atención.")}
      <section class="stats-grid">
        <article class="stat-card" style="--tone:#f8d7df"><span>Consultas recibidas</span><strong>${data.counts?.leads || 0}</strong></article>
        <article class="stat-card" style="--tone:#dcecf6"><span>Formularios</span><strong>${data.counts?.submissions || 0}</strong></article>
        <article class="stat-card" style="--tone:#fff0c7"><span>Comentarios pendientes</span><strong>${data.counts?.pendingComments || 0}</strong></article>
        <article class="stat-card" style="--tone:#dff4ea"><span>Artículos publicados</span><strong>${data.counts?.publishedPosts || 0}</strong></article>
      </section>
      <section class="dashboard-grid">
        <article class="panel-card"><div class="panel-header"><h3>Actividad reciente</h3></div><div class="activity-list">${recent.length ? recent.map((item) => activityItem(item.icon, item.title, item.subtitle, item.date)).join("") : '<div class="empty-panel">Todavía no hay actividad registrada.</div>'}</div></article>
        <article class="panel-card"><div class="panel-header"><h3>Acciones rápidas</h3></div><div class="quick-grid"><button type="button" data-go="posts" data-new-post>Nuevo artículo<span>Crear y publicar en el blog</span></button><button type="button" data-go="comments">Moderar<span>Revisar comentarios pendientes</span></button><button type="button" data-go="resources" data-new-resource>Nuevo recurso<span>Diseñar una experiencia</span></button><button type="button" data-go="content">Editar inicio<span>Cambiar textos y botones</span></button></div></article>
      </section>`;
  }

  function tableShell(title, description, rows, head, body, action = "") {
    return `${viewHeading(title, description, action)}<section class="panel-card table-card"><div class="table-toolbar"><input type="search" placeholder="Buscar en esta sección…" data-table-search><span>${rows.length} registro${rows.length === 1 ? "" : "s"}</span></div><div class="table-wrap"><table><thead>${head}</thead><tbody>${body || '<tr><td colspan="6"><div class="empty-panel">No hay registros todavía.</div></td></tr>'}</tbody></table></div></section>`;
  }

  function renderLeads(rows) {
    const body = rows.map((item) => `<tr data-search-row><td><strong>${escapeHtml(`${item.first_name} ${item.last_name}`)}</strong><small>${escapeHtml(item.email)}</small></td><td>${escapeHtml(String(item.message || "").slice(0, 95))}${String(item.message || "").length > 95 ? "…" : ""}</td><td>${statusPill(item.status)}</td><td>${escapeHtml(formatDate(item.created_at, true))}</td><td><div class="table-actions"><button class="table-action" data-action="view-lead" data-id="${item.id}">Abrir</button></div></td></tr>`).join("");
    main.innerHTML = tableShell("Consultas recibidas", "Contactos enviados desde la página Conversemos. Podés registrar seguimiento y estado.", rows, "<tr><th>Persona</th><th>Mensaje</th><th>Estado</th><th>Fecha</th><th>Acciones</th></tr>", body);
  }

  function renderSubmissions(rows) {
    const body = rows.map((item) => `<tr data-search-row><td><strong>${escapeHtml(item.participant_name || "Sin nombre")}</strong><small>${escapeHtml(item.participant_email || "Sin correo")}</small></td><td>${escapeHtml(prettyKey(item.resource_id))}</td><td>${statusPill(item.status)}</td><td>${escapeHtml(formatDate(item.created_at, true))}</td><td><div class="table-actions"><button class="table-action" data-action="view-submission" data-id="${item.id}">Revisar</button></div></td></tr>`).join("");
    main.innerHTML = tableShell("Formularios y respuestas", "Revisá tests, rutas reflexivas y fichas técnicas con notas privadas de seguimiento.", rows, "<tr><th>Participante</th><th>Recurso</th><th>Estado</th><th>Fecha</th><th>Acciones</th></tr>", body);
  }

  function renderComments(rows) {
    const body = rows.map((item) => `<tr data-search-row><td><strong>${escapeHtml(item.author_name)}</strong><small>${escapeHtml(prettyKey(item.post_slug))}</small></td><td>${escapeHtml(String(item.body || "").slice(0, 110))}${String(item.body || "").length > 110 ? "…" : ""}</td><td>${statusPill(item.status)}</td><td>${escapeHtml(formatDate(item.created_at))}</td><td><div class="table-actions"><button class="table-action approve" data-action="comment-status" data-status="approved" data-id="${item.id}">Aprobar</button><button class="table-action reject" data-action="comment-status" data-status="rejected" data-id="${item.id}">Rechazar</button><button class="table-action" data-action="view-comment" data-id="${item.id}">Ver</button></div></td></tr>`).join("");
    main.innerHTML = tableShell("Comentarios del blog", "Aprobá solamente los aportes que querás mostrar públicamente.", rows, "<tr><th>Autor</th><th>Comentario</th><th>Estado</th><th>Fecha</th><th>Acciones</th></tr>", body);
  }

  function renderPosts(rows) {
    const body = rows.map((item) => `<tr data-search-row><td><strong>${escapeHtml(item.title)}</strong><small>/${escapeHtml(item.slug)}</small></td><td>${escapeHtml(item.category || "Impronte")}</td><td>${statusPill(item.status)}</td><td>${escapeHtml(formatDate(item.published_at))}</td><td><div class="table-actions"><button class="table-action" data-action="edit-post" data-id="${item.id}">Editar</button><button class="table-action reject" data-action="delete-record" data-entity="posts" data-id="${item.id}">Eliminar</button></div></td></tr>`).join("");
    main.innerHTML = tableShell("Artículos del blog", "Creá borradores, subí imágenes y publicá sin tocar GitHub.", rows, "<tr><th>Artículo</th><th>Categoría</th><th>Estado</th><th>Publicación</th><th>Acciones</th></tr>", body, '<button class="crm-primary" type="button" data-new-post>+ Nuevo artículo</button>');
  }

  function resourceUrl(item) {
    return builtins.has(item.id) ? `/recursos/${item.id}/` : `/recursos/recurso/?id=${encodeURIComponent(item.id)}`;
  }

  function renderResources(rows) {
    const body = rows.map((item) => `<tr data-search-row><td><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.id)}</small></td><td>${escapeHtml(item.duration || "—")}</td><td>${item.enabled ? '<span class="status-pill approved">Visible</span>' : '<span class="status-pill archived">Oculto</span>'}</td><td>${escapeHtml(String(item.config?.steps?.length || 0))}</td><td><div class="table-actions"><a class="table-action" href="${resourceUrl(item)}" target="_blank" rel="noopener">Abrir</a><button class="table-action" data-action="edit-resource" data-id="${escapeHtml(item.id)}">Editar</button>${builtins.has(item.id) ? "" : `<button class="table-action reject" data-action="delete-record" data-entity="resources" data-id="${escapeHtml(item.id)}">Eliminar</button>`}</div></td></tr>`).join("");
    main.innerHTML = tableShell("Recursos interactivos", "Editá etapas y preguntas o creá una experiencia nueva para compartir desde la página.", rows, "<tr><th>Recurso</th><th>Duración</th><th>Visibilidad</th><th>Etapas</th><th>Acciones</th></tr>", body, '<button class="crm-primary" type="button" data-new-resource>+ Nuevo recurso</button>');
  }

  function renderContent(row) {
    const value = row?.value || {};
    main.innerHTML = `${viewHeading("Página de inicio", "Actualizá el mensaje principal y el enlace de agenda. Los cambios se reflejan sin editar archivos.")}
      <form class="panel-card" data-content-form><div class="field-grid">
        <label class="field">Texto pequeño<input name="hero_kicker" value="${escapeHtml(value.hero_kicker || "Orientación + Psicopedagogía")}"></label>
        <label class="field">Palabra destacada<input name="hero_accent" value="${escapeHtml(value.hero_accent || "tuya.")}"></label>
        <label class="field field-wide">Título principal<input name="hero_title" value="${escapeHtml(value.hero_title || "Tu proyecto de vida merece una ruta que se sienta")}"></label>
        <label class="field field-wide">Descripción<textarea name="hero_description">${escapeHtml(value.hero_description || "")}</textarea></label>
        <label class="field">Texto del botón principal<input name="primary_label" value="${escapeHtml(value.primary_label || "Agendar sesión 1:1")}"></label>
        <label class="field">Texto del botón secundario<input name="secondary_label" value="${escapeHtml(value.secondary_label || "Explorar recursos")}"></label>
        <label class="field">Enlace del botón secundario<input name="secondary_url" value="${escapeHtml(value.secondary_url || "/recursos/")}"></label>
        <label class="field">Enlace para agendar<input name="booking_url" value="${escapeHtml(value.booking_url || "https://wa.me/50689437609")}"></label>
        <label class="field">Texto corto de agenda<input name="booking_label" value="${escapeHtml(value.booking_label || "Agendar 1:1")}"></label>
      </div><div class="resource-actions"><button class="crm-primary" type="submit">Guardar cambios</button><a class="crm-secondary" href="/" target="_blank" rel="noopener">Ver la página</a></div></form>`;
  }

  function enableTableSearch() {
    const input = main.querySelector("[data-table-search]");
    if (!input) return;
    input.addEventListener("input", () => {
      const query = input.value.trim().toLocaleLowerCase("es");
      main.querySelectorAll("[data-search-row]").forEach((row) => { row.hidden = query && !row.textContent.toLocaleLowerCase("es").includes(query); });
    });
  }

  const observer = new MutationObserver(enableTableSearch);
  observer.observe(main, { childList: true });

  function showModal(title, html, submitLabel, handler, afterOpen) {
    modalTitle.textContent = title;
    modalContent.innerHTML = html;
    modalSubmit.textContent = submitLabel || "Guardar cambios";
    state.modalHandler = handler;
    modal.showModal();
    afterOpen?.();
  }

  function closeModal() {
    state.modalHandler = null;
    state.resourceDraft = null;
    modal.close();
  }

  document.querySelectorAll("[data-close-modal]").forEach((button) => button.addEventListener("click", closeModal));
  modal.addEventListener("click", (event) => { if (event.target === modal) closeModal(); });
  modalForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!modalForm.reportValidity() || !state.modalHandler) return;
    modalSubmit.disabled = true;
    const original = modalSubmit.textContent;
    modalSubmit.textContent = "Guardando…";
    try {
      const shouldClose = await state.modalHandler(new FormData(modalForm), modalForm);
      if (shouldClose !== false) closeModal();
    } catch (error) {
      toast(error.message, true);
    } finally {
      modalSubmit.disabled = false;
      modalSubmit.textContent = original;
    }
  });

  function findCached(view, id) {
    return (state.cache[view] || []).find((item) => String(item.id) === String(id));
  }

  function answerRows(answers) {
    return Object.entries(answers || {}).map(([key, value]) => {
      const shown = Array.isArray(value) ? value.join(", ") : value && typeof value === "object" ? JSON.stringify(value, null, 2) : String(value ?? "");
      return `<div class="answer-row"><dt>${escapeHtml(prettyKey(key))}</dt><dd>${escapeHtml(shown)}</dd></div>`;
    }).join("") || '<p class="empty-panel">No hay respuestas.</p>';
  }

  function openSubmission(item) {
    showModal("Revisar formulario", `<div class="detail-grid"><div class="detail-item"><small>Participante</small><strong>${escapeHtml(item.participant_name || "Sin nombre")}</strong></div><div class="detail-item"><small>Correo</small><strong>${escapeHtml(item.participant_email || "Sin correo")}</strong></div><div class="detail-item"><small>Recurso</small><strong>${escapeHtml(prettyKey(item.resource_id))}</strong></div><div class="detail-item"><small>Enviado</small><strong>${escapeHtml(formatDate(item.created_at, true))}</strong></div></div><h3>Respuestas</h3><dl class="answers-list">${answerRows(item.answers)}</dl><div class="field-grid"><label class="field">Estado<select name="status"><option value="new">Nuevo</option><option value="reviewing">En revisión</option><option value="completed">Completado</option><option value="archived">Archivado</option></select></label><label class="field field-wide">Notas privadas<textarea name="admin_notes" placeholder="Seguimiento, acuerdos o próximos pasos…">${escapeHtml(item.admin_notes || "")}</textarea></label></div>`, "Guardar seguimiento", async (form) => {
      await crm("submissions", "PATCH", { id: item.id, status: form.get("status"), admin_notes: form.get("admin_notes") });
      toast("Seguimiento actualizado."); await loadView("submissions"); return true;
    }, () => { modalForm.status.value = item.status; });
  }

  function openLead(item) {
    showModal("Seguimiento de consulta", `<div class="detail-grid"><div class="detail-item"><small>Nombre</small><strong>${escapeHtml(`${item.first_name} ${item.last_name}`)}</strong></div><div class="detail-item"><small>Correo</small><strong>${escapeHtml(item.email)}</strong></div><div class="detail-item field-wide"><small>Mensaje</small><strong>${escapeHtml(item.message)}</strong></div></div><div class="field-grid"><label class="field">Estado<select name="status"><option value="new">Nuevo</option><option value="contacted">Contactado</option><option value="scheduled">Sesión agendada</option><option value="closed">Cerrado</option><option value="archived">Archivado</option></select></label><label class="field field-wide">Notas privadas<textarea name="admin_notes" placeholder="Seguimiento y próximos pasos…">${escapeHtml(item.admin_notes || "")}</textarea></label></div>`, "Guardar seguimiento", async (form) => {
      await crm("leads", "PATCH", { id: item.id, status: form.get("status"), admin_notes: form.get("admin_notes") });
      toast("Consulta actualizada."); await loadView("leads"); return true;
    }, () => { modalForm.status.value = item.status; });
  }

  function openComment(item) {
    showModal("Moderar comentario", `<div class="detail-grid"><div class="detail-item"><small>Autor</small><strong>${escapeHtml(item.author_name)}</strong></div><div class="detail-item"><small>Artículo</small><strong>${escapeHtml(prettyKey(item.post_slug))}</strong></div><div class="detail-item field-wide"><small>Comentario</small><strong>${escapeHtml(item.body)}</strong></div></div><label class="field">Estado<select name="status"><option value="pending">Pendiente</option><option value="approved">Aprobado</option><option value="rejected">Rechazado</option></select></label>`, "Guardar estado", async (form) => {
      await crm("comments", "PATCH", { id: item.id, status: form.get("status") });
      toast("Comentario actualizado."); await loadView("comments"); return true;
    }, () => { modalForm.status.value = item.status; });
  }

  function openPostEditor(item = {}) {
    const isNew = !item.id;
    showModal(isNew ? "Nuevo artículo" : "Editar artículo", `<div class="field-grid">
      <label class="field field-wide">Título<input name="title" required maxlength="180" value="${escapeHtml(item.title || "")}"></label>
      <label class="field">Dirección corta<input name="slug" required pattern="[a-z0-9][a-z0-9-]{1,78}[a-z0-9]" value="${escapeHtml(item.slug || "")}"><small>Ejemplo: elegir-carrera-con-calma</small></label>
      <label class="field">Categoría<input name="category" value="${escapeHtml(item.category || "Psicopedagogía")}"></label>
      <label class="field field-wide">Resumen<textarea name="excerpt" maxlength="600" required>${escapeHtml(item.excerpt || "")}</textarea></label>
      <label class="field">Fecha de publicación<input name="published_at" type="datetime-local" value="${escapeHtml(inputDate(item.published_at))}"></label>
      <label class="field">Tiempo de lectura<input name="read_time" placeholder="4 min de lectura" value="${escapeHtml(item.read_time || "")}"></label>
      <label class="field field-wide">Imagen de portada<input name="image_file" type="file" accept="image/jpeg,image/png,image/webp,image/avif"><small>JPG, PNG, WEBP o AVIF · máximo 4 MB</small><input name="image_url" type="url" placeholder="O pegá la dirección de una imagen" value="${escapeHtml(item.image_url || "")}">${item.image_url ? `<img class="image-preview" src="${escapeHtml(item.image_url)}" alt="">` : ""}</label>
      <label class="field field-wide">Descripción de la imagen<input name="image_alt" value="${escapeHtml(item.image_alt || "")}" placeholder="Describí brevemente lo que aparece"></label>
      <label class="field field-wide">Contenido<textarea name="body" required style="min-height:360px" placeholder="Escribí el artículo aquí…">${escapeHtml(item.body || "")}</textarea><small>Separá los párrafos con una línea vacía. Usá ## antes de un subtítulo.</small></label>
      <label class="field">Estado<select name="status"><option value="draft">Borrador</option><option value="published">Publicado</option><option value="archived">Archivado</option></select></label>
    </div>`, isNew ? "Crear artículo" : "Guardar artículo", async (form) => {
      let imageUrl = String(form.get("image_url") || "");
      const imageFile = modalForm.image_file.files[0];
      if (imageFile) {
        const data = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(new Error("No se pudo leer la imagen.")); reader.readAsDataURL(imageFile); });
        const uploaded = await api("/api/admin/upload", { method: "POST", body: JSON.stringify({ type: imageFile.type, data }) });
        imageUrl = uploaded.url;
      }
      const payload = Object.fromEntries(form.entries());
      delete payload.image_file;
      payload.image_url = imageUrl;
      payload.id = item.id;
      await crm("posts", isNew ? "POST" : "PATCH", payload);
      toast(isNew ? "Artículo creado." : "Artículo actualizado."); await loadView("posts"); return true;
    }, () => {
      modalForm.status.value = item.status || "draft";
      const titleInput = modalForm.title;
      const slugInput = modalForm.slug;
      if (isNew) titleInput.addEventListener("input", () => { if (!slugInput.dataset.edited) slugInput.value = slugify(titleInput.value); });
      slugInput.addEventListener("input", () => { slugInput.dataset.edited = "1"; slugInput.value = slugify(slugInput.value); });
    });
  }

  function normalizeResource(item = {}) {
    const config = JSON.parse(JSON.stringify(item.config || {}));
    return {
      id: item.id || "",
      kicker: item.kicker || "Recurso interactivo",
      title: item.title || "",
      description: item.description || "",
      duration: item.duration || "5–8 minutos",
      note: item.note || "",
      enabled: item.enabled !== false,
      sort_order: item.sort_order || 10,
      config: {
        collectIdentity: config.collectIdentity !== false,
        resultType: config.resultType || "reflection",
        sensitive: config.sensitive === true,
        steps: Array.isArray(config.steps) ? config.steps : [{ title: "Primera etapa", description: "", questions: [{ id: "pregunta_1", label: "Escribí tu pregunta", type: "textarea", required: true }] }]
      }
    };
  }

  function optionLines(options) {
    return (options || []).map((option) => typeof option === "object" ? `${option.label}|${option.value}` : `${option}|${option}`).join("\n");
  }

  function parseOptions(value) {
    return String(value || "").split("\n").map((line) => line.trim()).filter(Boolean).map((line) => {
      const [label, ...rest] = line.split("|");
      return { label: label.trim(), value: (rest.join("|") || label).trim() };
    });
  }

  function renderResourceSteps() {
    const container = modalContent.querySelector("[data-resource-steps]");
    if (!container || !state.resourceDraft) return;
    container.innerHTML = state.resourceDraft.config.steps.map((step, stepIndex) => `<details class="resource-step" ${stepIndex === 0 ? "open" : ""}><summary class="resource-step-head"><strong>Etapa ${stepIndex + 1}: ${escapeHtml(step.title || "Sin título")}</strong><button class="table-action reject" type="button" data-resource-action="remove-step" data-step="${stepIndex}">Eliminar etapa</button></summary><div class="field-grid" style="margin-top:.8rem"><label class="field">Título<input data-step-field="title" data-step="${stepIndex}" value="${escapeHtml(step.title || "")}"></label><label class="field">Descripción<input data-step-field="description" data-step="${stepIndex}" value="${escapeHtml(step.description || "")}"></label></div><div>${(step.questions || []).map((question, questionIndex) => `<article class="question-editor"><div class="question-head"><strong>Pregunta ${questionIndex + 1}</strong><button class="table-action reject" type="button" data-resource-action="remove-question" data-step="${stepIndex}" data-question="${questionIndex}">Eliminar</button></div><div class="field-grid"><label class="field field-wide">Pregunta<input data-question-field="label" data-step="${stepIndex}" data-question="${questionIndex}" value="${escapeHtml(question.label || "")}"></label><label class="field">Identificador<input data-question-field="id" data-step="${stepIndex}" data-question="${questionIndex}" value="${escapeHtml(question.id || "")}"></label><label class="field">Tipo<select data-question-field="type" data-step="${stepIndex}" data-question="${questionIndex}">${["text","textarea","email","tel","date","select","radio","checkbox"].map((type) => `<option value="${type}" ${question.type === type ? "selected" : ""}>${prettyKey(type)}</option>`).join("")}</select></label><label class="inline-check"><input type="checkbox" data-question-field="required" data-step="${stepIndex}" data-question="${questionIndex}" ${question.required ? "checked" : ""}> Obligatoria</label><label class="field field-wide">Opciones<textarea data-question-field="options" data-step="${stepIndex}" data-question="${questionIndex}" placeholder="Una opción por línea: Texto|valor">${escapeHtml(optionLines(question.options))}</textarea><small>Solo para selección, botones o casillas.</small></label></div></article>`).join("")}</div><div class="resource-actions"><button class="crm-secondary" type="button" data-resource-action="add-question" data-step="${stepIndex}">+ Agregar pregunta</button></div></details>`).join("");
  }

  function openResourceEditor(item) {
    const isNew = !item;
    state.resourceDraft = normalizeResource(item);
    const draft = state.resourceDraft;
    showModal(isNew ? "Nuevo recurso" : "Editar recurso", `<div class="field-grid"><label class="field">Dirección corta<input name="id" required pattern="[a-z0-9][a-z0-9-]{1,78}[a-z0-9]" value="${escapeHtml(draft.id)}" ${isNew ? "" : "readonly"}></label><label class="field">Etiqueta<input name="kicker" value="${escapeHtml(draft.kicker)}"></label><label class="field field-wide">Nombre del recurso<input name="title" required value="${escapeHtml(draft.title)}"></label><label class="field field-wide">Descripción<textarea name="description">${escapeHtml(draft.description)}</textarea></label><label class="field">Duración<input name="duration" value="${escapeHtml(draft.duration)}"></label><label class="field">Orden<input name="sort_order" type="number" min="0" max="999" value="${escapeHtml(draft.sort_order)}"></label><label class="field">Tipo de resultado<select name="result_type"><option value="reflection">Reflexión</option><option value="submission">Solo envío</option><option value="maturity">Puntaje de madurez</option><option value="learning">Estilos de aprendizaje</option><option value="ikigai">Mapa de Ikigai</option></select></label><label class="inline-check"><input name="collect_identity" type="checkbox" ${draft.config.collectIdentity ? "checked" : ""}> Solicitar nombre al inicio</label><label class="inline-check"><input name="sensitive" type="checkbox" ${draft.config.sensitive ? "checked" : ""}> Contiene información sensible</label><label class="inline-check"><input name="enabled" type="checkbox" ${draft.enabled ? "checked" : ""}> Visible en la página</label><label class="field field-wide">Nota para la persona<textarea name="note">${escapeHtml(draft.note)}</textarea></label></div><div class="panel-header" style="margin-top:1.4rem"><div><h3>Etapas y preguntas</h3><p class="editor-help">Abrí cada etapa para editar sus preguntas.</p></div><button class="crm-secondary" type="button" data-resource-action="add-step">+ Agregar etapa</button></div><div data-resource-steps></div>`, isNew ? "Crear recurso" : "Guardar recurso", async (form) => {
      const body = {
        id: slugify(form.get("id")), kicker: form.get("kicker"), title: form.get("title"), description: form.get("description"), duration: form.get("duration"), note: form.get("note"), sort_order: form.get("sort_order"), enabled: form.has("enabled"),
        config: { ...state.resourceDraft.config, collectIdentity: form.has("collect_identity"), sensitive: form.has("sensitive"), resultType: form.get("result_type") }
      };
      await crm("resources", "POST", body);
      toast(isNew ? "Recurso creado." : "Recurso actualizado."); await loadView("resources"); return true;
    }, () => { modalForm.result_type.value = draft.config.resultType; renderResourceSteps(); });
  }

  modalContent.addEventListener("input", (event) => {
    if (!state.resourceDraft) return;
    const stepIndex = Number(event.target.dataset.step);
    if (event.target.dataset.stepField) {
      state.resourceDraft.config.steps[stepIndex][event.target.dataset.stepField] = event.target.value;
    }
    if (event.target.dataset.questionField) {
      const questionIndex = Number(event.target.dataset.question);
      const question = state.resourceDraft.config.steps[stepIndex].questions[questionIndex];
      const field = event.target.dataset.questionField;
      if (field === "required") question.required = event.target.checked;
      else if (field === "options") question.options = parseOptions(event.target.value);
      else question[field] = event.target.value;
    }
  });

  modalContent.addEventListener("click", (event) => {
    const button = event.target.closest("[data-resource-action]");
    if (!button || !state.resourceDraft) return;
    event.preventDefault();
    const steps = state.resourceDraft.config.steps;
    const stepIndex = Number(button.dataset.step);
    if (button.dataset.resourceAction === "add-step") steps.push({ title: `Etapa ${steps.length + 1}`, description: "", questions: [{ id: `pregunta_${Date.now()}`, label: "Nueva pregunta", type: "textarea", required: true }] });
    if (button.dataset.resourceAction === "remove-step" && steps.length > 1) steps.splice(stepIndex, 1);
    if (button.dataset.resourceAction === "add-question") steps[stepIndex].questions.push({ id: `pregunta_${Date.now()}`, label: "Nueva pregunta", type: "textarea", required: true });
    if (button.dataset.resourceAction === "remove-question" && steps[stepIndex].questions.length > 1) steps[stepIndex].questions.splice(Number(button.dataset.question), 1);
    renderResourceSteps();
  });

  main.addEventListener("submit", async (event) => {
    const form = event.target.closest("[data-content-form]");
    if (!form) return;
    event.preventDefault();
    const button = form.querySelector('[type="submit"]');
    button.disabled = true;
    try {
      await crm("content", "POST", { value: Object.fromEntries(new FormData(form).entries()) });
      toast("La página de inicio quedó actualizada.");
    } catch (error) { toast(error.message, true); }
    finally { button.disabled = false; }
  });

  main.addEventListener("click", async (event) => {
    const go = event.target.closest("[data-go]");
    if (go) { await loadView(go.dataset.go); if (go.hasAttribute("data-new-post")) openPostEditor(); if (go.hasAttribute("data-new-resource")) openResourceEditor(); return; }
    if (event.target.closest("[data-new-post]")) return openPostEditor();
    if (event.target.closest("[data-new-resource]")) return openResourceEditor();
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const id = button.dataset.id;
    const action = button.dataset.action;
    if (action === "view-lead") return openLead(findCached("leads", id));
    if (action === "view-submission") return openSubmission(findCached("submissions", id));
    if (action === "view-comment") return openComment(findCached("comments", id));
    if (action === "edit-post") return openPostEditor(findCached("posts", id));
    if (action === "edit-resource") return openResourceEditor((state.cache.resources || []).find((item) => item.id === id));
    if (action === "comment-status") {
      try { await crm("comments", "PATCH", { id, status: button.dataset.status }); toast("Comentario actualizado."); await loadView("comments"); } catch (error) { toast(error.message, true); }
      return;
    }
    if (action === "delete-record") {
      if (!confirm("¿Querés eliminar este registro de forma permanente? Esta acción no se puede deshacer.")) return;
      try { await crm(button.dataset.entity, "DELETE", { id }); toast("Registro eliminado."); await loadView(button.dataset.entity); } catch (error) { toast(error.message, true); }
    }
  });

  if (inviteToken) {
    prepareInvitation();
    showLogin();
  } else {
    api("/api/admin/auth")
      .then((payload) => showApp(payload.email))
      .catch(() => showLogin());
  }
})();
