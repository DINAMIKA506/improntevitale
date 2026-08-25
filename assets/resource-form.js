(function () {
  const root = document.querySelector("[data-resource-app]");
  if (!root || !window.IMPRONTE_RESOURCES) return;

  const requestedId = root.dataset.resourceApp === "dynamic" ? new URLSearchParams(location.search).get("id") : root.dataset.resourceApp;
  const resourceId = String(requestedId || "");
  let resource = window.IMPRONTE_RESOURCES[resourceId] || null;
  const frame = root.querySelector(".resource-frame");
  const storageKey = `impronte-resource-${resourceId}`;
  const resourceCovers = {
    "madurez-vocacional": "/assets/recurso-madurez-vocacional.webp",
    "estilos-aprendizaje": "/assets/recurso-estilos-aprendizaje.webp",
    "ruta-decision": "/assets/recurso-ruta-decision.webp",
    "proyecto-vida": "/assets/recurso-proyecto-vida.webp",
    "ficha-tecnica": "/assets/recurso-ficha-tecnica.webp"
  };
  let currentStep = -1;
  let answers = {};

  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey) || "null");
    if (saved && typeof saved === "object") answers = saved;
  } catch (_) {
    answers = {};
  }

  const identityStep = {
    title: "Antes de comenzar",
    description: "¿A nombre de quién registramos esta experiencia?",
    questions: [
      { id: "participant_name", label: "Nombre completo", type: "text", required: true },
      { id: "participant_email", label: "Correo electrónico", type: "email", required: false }
    ]
  };
  let steps = [];

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  })[character]);

  const ikigaiCoverMarkup = () => '<div class="ikigai-card-cover ikigai-intro-cover" role="img" aria-label="Diagrama de Ikigai con cuatro círculos"><span class="ikigai-mini-circle ikigai-mini-love"></span><span class="ikigai-mini-circle ikigai-mini-good"></span><span class="ikigai-mini-circle ikigai-mini-world"></span><span class="ikigai-mini-circle ikigai-mini-paid"></span><strong>CREANDO<br>MI IKIGAI</strong></div>';

  function persist() {
    try { sessionStorage.setItem(storageKey, JSON.stringify(answers)); } catch (_) {}
  }

  function renderIntro() {
    const cover = resourceCovers[resourceId];
    const coverMarkup = cover
      ? `<img class="resource-intro-cover" src="${cover}" alt="Portada de ${escapeHtml(resource.title)}" width="1000" height="519">`
      : resourceId === "creando-mi-ikigai" ? ikigaiCoverMarkup() : "";
    frame.innerHTML = `
      <div class="resource-intro">
        ${coverMarkup}
        <p class="resource-kicker">${escapeHtml(resource.kicker)}</p>
        <h1 class="resource-title">${escapeHtml(resource.title)}</h1>
        <p class="lead">${escapeHtml(resource.description)}</p>
        <div class="resource-meta"><span>${escapeHtml(resource.duration)}</span><span>${steps.length} etapas</span><span>Avance guardado temporalmente</span></div>
        <p class="privacy-note">${escapeHtml(resource.note)}</p>
        <div class="button-row" style="margin-top:1.5rem"><button class="primary-button" type="button" data-start>${Object.keys(answers).length ? "Continuar" : "Comenzar"}</button><a class="secondary-button" href="/recursos/">Ver otros recursos</a></div>
      </div>`;
    frame.querySelector("[data-start]").addEventListener("click", () => {
      currentStep = 0;
      renderStep();
    });
  }

  function renderQuestion(question) {
    const required = question.required ? "required" : "";
    const maxLength = Number(question.maxLength) > 0 ? `maxlength="${Math.min(2000, Number(question.maxLength))}"` : "";
    const value = answers[question.id] ?? "";
    const label = `<span>${escapeHtml(question.label)}${question.required ? " *" : ""}</span>`;
    if (question.type === "radio") {
      return `<fieldset class="question-card"><legend style="position:absolute;left:-10000px">${escapeHtml(question.label)}</legend>${label}<div class="option-list">${question.options.map((option) => `<label class="option"><input type="radio" name="${question.id}" value="${escapeHtml(option.value)}" ${String(value) === String(option.value) ? "checked" : ""} ${required}><span>${escapeHtml(option.label)}</span></label>`).join("")}</div></fieldset>`;
    }
    if (question.type === "checkbox") {
      const values = Array.isArray(value) ? value : [];
      return `<fieldset class="question-card"><legend style="position:absolute;left:-10000px">${escapeHtml(question.label)}</legend>${label}<div class="option-list">${question.options.map((option) => `<label class="option"><input type="checkbox" name="${question.id}" value="${escapeHtml(option.value)}" ${values.includes(option.value) ? "checked" : ""}><span>${escapeHtml(option.label)}</span></label>`).join("")}</div></fieldset>`;
    }
    if (question.type === "select") {
      return `<label class="question-card">${label}<select name="${question.id}" ${required}><option value="">Seleccioná una opción</option>${question.options.map((option) => `<option value="${escapeHtml(option.value)}" ${String(value) === String(option.value) ? "selected" : ""}>${escapeHtml(option.label)}</option>`).join("")}</select></label>`;
    }
    if (question.type === "textarea") {
      return `<label class="question-card">${label}<textarea name="${question.id}" ${required} ${maxLength}>${escapeHtml(value)}</textarea></label>`;
    }
    return `<label class="question-card">${label}<input name="${question.id}" type="${escapeHtml(question.type || "text")}" value="${escapeHtml(value)}" ${required} ${maxLength}></label>`;
  }

  function collectStep(form) {
    const step = steps[currentStep];
    step.questions.forEach((question) => {
      if (question.type === "checkbox") {
        answers[question.id] = Array.from(form.querySelectorAll(`[name="${question.id}"]:checked`)).map((input) => input.value);
      } else if (question.type === "radio") {
        const checked = form.querySelector(`[name="${question.id}"]:checked`);
        if (checked) answers[question.id] = checked.value;
        else delete answers[question.id];
      } else {
        const input = form.querySelector(`[name="${question.id}"]`);
        if (input) answers[question.id] = input.value.trim ? input.value.trim() : input.value;
      }
    });
    persist();
  }

  function renderStep() {
    const step = steps[currentStep];
    const progress = Math.round(((currentStep + 1) / steps.length) * 100);
    frame.innerHTML = `
      <div class="progress-wrap"><div class="progress-label"><span>Etapa ${currentStep + 1} de ${steps.length}</span><span>${progress}%</span></div><div class="progress-track"><div class="progress-bar" style="width:${progress}%"></div></div></div>
      <form class="form-step" data-step-form>
        <p class="resource-kicker">${escapeHtml(resource.title)}</p>
        <h2>${escapeHtml(step.title)}</h2>
        <p>${escapeHtml(step.description || "")}</p>
        <div class="question-list">${step.questions.map(renderQuestion).join("")}</div>
        ${currentStep === steps.length - 1 ? `<label class="consent-row"><input type="checkbox" name="consent" required><span>${resource.sensitive ? "Confirmo que los datos son correctos y autorizo su envío privado a Impronte Vitale para gestionar este proceso." : "Autorizo el envío de mis respuestas a Impronte Vitale para su revisión profesional."} Leí la <a href="/privacidad/" target="_blank" rel="noopener">información de privacidad</a>.</span></label>` : ""}
        <p class="status-message" data-step-status aria-live="polite"></p>
        <div class="step-actions"><button class="secondary-button" type="button" data-previous>${currentStep === 0 ? "Salir" : "Anterior"}</button><button class="primary-button" type="submit">${currentStep === steps.length - 1 ? "Finalizar y enviar" : "Continuar"}</button></div>
      </form>`;

    const form = frame.querySelector("[data-step-form]");
    form.addEventListener("input", () => collectStep(form));
    frame.querySelector("[data-previous]").addEventListener("click", () => {
      collectStep(form);
      if (currentStep === 0) {
        currentStep = -1;
        renderIntro();
      } else {
        currentStep -= 1;
        renderStep();
      }
    });
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      collectStep(form);
      if (currentStep < steps.length - 1) {
        currentStep += 1;
        renderStep();
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      await submitResource(form);
    });
  }

  async function submitResource(form) {
    const button = form.querySelector('[type="submit"]');
    const status = form.querySelector("[data-step-status]");
    button.disabled = true;
    button.textContent = "Enviando…";
    status.textContent = "Estamos guardando tus respuestas de forma segura.";
    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceId, answers, consent: true, website: "" })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || "No se pudo completar el envío.");
      try { sessionStorage.removeItem(storageKey); } catch (_) {}
      renderResult(true);
    } catch (error) {
      status.textContent = `${error.message} Tus respuestas siguen guardadas en este dispositivo; podés intentarlo nuevamente.`;
      button.disabled = false;
      button.textContent = "Intentar de nuevo";
    }
  }

  function renderIkigaiDiagram() {
    const value = (key) => escapeHtml(answers[key] || "Por descubrir");
    return `<div class="ikigai-result-scroll"><div class="ikigai-diagram" data-ikigai-diagram>
      <span class="ikigai-shape ikigai-shape-love" aria-hidden="true"></span>
      <span class="ikigai-shape ikigai-shape-good" aria-hidden="true"></span>
      <span class="ikigai-shape ikigai-shape-world" aria-hidden="true"></span>
      <span class="ikigai-shape ikigai-shape-paid" aria-hidden="true"></span>
      <div class="ikigai-answer ikigai-answer-love"><strong>Amo</strong><span>${value("ik_love")}</span></div>
      <div class="ikigai-answer ikigai-answer-good"><strong>Soy buena/o en</strong><span>${value("ik_good")}</span></div>
      <div class="ikigai-answer ikigai-answer-world"><strong>El mundo necesita</strong><span>${value("ik_world")}</span></div>
      <div class="ikigai-answer ikigai-answer-paid"><strong>Me pueden pagar por</strong><span>${value("ik_paid")}</span></div>
      <strong class="ikigai-intersection ikigai-passion">PASIÓN</strong>
      <strong class="ikigai-intersection ikigai-mission">MISIÓN</strong>
      <strong class="ikigai-intersection ikigai-profession">PROFESIÓN</strong>
      <strong class="ikigai-intersection ikigai-vocation">VOCACIÓN</strong>
      <div class="ikigai-core"><strong>MI IKIGAI</strong><span>${value("ik_core")}</span></div>
    </div></div>`;
  }

  function canvasLines(context, value, maxWidth, maxLines) {
    const words = String(value || "Por descubrir").replace(/\s+/g, " ").trim().split(" ");
    const lines = [];
    let line = "";
    words.forEach((word) => {
      const candidate = line ? `${line} ${word}` : word;
      if (context.measureText(candidate).width <= maxWidth || !line) line = candidate;
      else { lines.push(line); line = word; }
    });
    if (line) lines.push(line);
    if (lines.length > maxLines) {
      const visible = lines.slice(0, maxLines);
      let last = visible[maxLines - 1];
      while (context.measureText(`${last}…`).width > maxWidth && last.length > 1) last = last.slice(0, -1);
      visible[maxLines - 1] = `${last}…`;
      return visible;
    }
    return lines;
  }

  function drawCanvasBlock(context, title, body, x, y, maxWidth, options = {}) {
    context.save();
    context.textAlign = "center";
    context.textBaseline = "top";
    context.fillStyle = options.titleColor || "#162f56";
    context.font = `800 ${options.titleSize || 38}px "Open Sans", Arial, sans-serif`;
    context.fillText(title, x, y);
    context.fillStyle = options.bodyColor || "#394b63";
    context.font = `600 ${options.bodySize || 25}px "Open Sans", Arial, sans-serif`;
    const lines = canvasLines(context, body, maxWidth, options.maxLines || 5);
    const lineHeight = options.lineHeight || 33;
    lines.forEach((line, index) => context.fillText(line, x, y + (options.titleSize || 38) + 18 + (index * lineHeight)));
    context.restore();
  }

  async function downloadIkigai() {
    if (document.fonts?.ready) await document.fonts.ready;
    const canvas = document.createElement("canvas");
    canvas.width = 1400;
    canvas.height = 1400;
    const context = canvas.getContext("2d");
    context.fillStyle = "#fffafc";
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.textAlign = "center";
    context.fillStyle = "#162f56";
    context.font = '800 54px "Open Sans", Arial, sans-serif';
    context.fillText("CREANDO MI IKIGAI", 700, 70);
    const participant = answers.participant_name || answers.nombre || "";
    if (participant) {
      context.fillStyle = "#5f6f85";
      context.font = '600 25px "Open Sans", Arial, sans-serif';
      context.fillText(participant, 700, 112);
    }

    const circles = [
      [700, 410, "rgba(238,143,141,.68)"],
      [430, 680, "rgba(222,213,140,.58)"],
      [970, 680, "rgba(175,190,215,.58)"],
      [700, 950, "rgba(247,181,165,.62)"]
    ];
    circles.forEach(([x, y, color]) => {
      context.beginPath();
      context.arc(x, y, 350, 0, Math.PI * 2);
      context.fillStyle = color;
      context.fill();
    });

    drawCanvasBlock(context, "AMO", answers.ik_love, 700, 175, 430, { titleColor: "#ffffff", bodyColor: "#26374d", maxLines: 5 });
    drawCanvasBlock(context, "SOY BUENA/O EN", answers.ik_good, 260, 620, 290, { titleSize: 31, bodySize: 23, lineHeight: 30, maxLines: 6 });
    drawCanvasBlock(context, "EL MUNDO NECESITA", answers.ik_world, 1140, 620, 300, { titleSize: 31, bodySize: 23, lineHeight: 30, maxLines: 6 });
    drawCanvasBlock(context, "ME PUEDEN PAGAR POR", answers.ik_paid, 700, 1085, 440, { titleSize: 31, bodySize: 23, lineHeight: 30, maxLines: 5 });

    context.font = '800 28px "Open Sans", Arial, sans-serif';
    context.fillStyle = "#c96f79";
    context.fillText("PASIÓN", 470, 470);
    context.fillText("MISIÓN", 930, 470);
    context.fillText("PROFESIÓN", 470, 905);
    context.fillText("VOCACIÓN", 930, 905);
    drawCanvasBlock(context, "MI IKIGAI", answers.ik_core, 700, 625, 310, { titleColor: "#ffffff", bodyColor: "#162f56", titleSize: 38, bodySize: 22, lineHeight: 29, maxLines: 5 });

    await new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) { reject(new Error("No se pudo crear la imagen.")); return; }
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const safeName = String(participant || "mi-ikigai").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        link.href = url;
        link.download = `${safeName || "mi-ikigai"}-ikigai.png`;
        document.body.append(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        resolve();
      }, "image/png");
    });
  }

  function renderResult(sent) {
    const name = answers.participant_name || answers.nombre || "";
    let visual = `<div class="result-orb"><strong>✓</strong></div>`;
    let detail = "Completaste todas las etapas. Valerie podrá revisar tus respuestas y acompañarte a interpretarlas en contexto.";
    if (resource.resultType === "maturity") {
      const values = Object.entries(answers).filter(([key]) => /^m\d+$/.test(key)).map(([, value]) => Number(value));
      const total = values.reduce((sum, value) => sum + value, 0);
      const max = values.length * 4;
      visual = `<div class="result-orb"><strong>${total}</strong><small>de ${max}</small></div>`;
      detail = "Este puntaje resume tus respuestas, pero no define por sí solo tu madurez vocacional. La interpretación profesional considera también tu historia, contexto y momento actual.";
    }
    if (resource.resultType === "learning") {
      const scores = { V: 0, A: 0, K: 0 };
      Object.entries(answers).filter(([key]) => /^e\d+$/.test(key)).forEach(([, value]) => { if (scores[value] !== undefined) scores[value] += 1; });
      const dominant = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
      const labels = { V: "Visual", A: "Auditiva", K: "Kinestésica" };
      visual = `<div class="result-orb"><strong>${labels[dominant]}</strong></div><div class="result-breakdown"><div><strong>${scores.V}</strong>Visual</div><div><strong>${scores.A}</strong>Auditiva</div><div><strong>${scores.K}</strong>Kinestésica</div></div>`;
      detail = "La puntuación muestra una tendencia, no una categoría rígida. Podés aprender usando los tres canales y combinarlos según cada actividad.";
    }
    let actions = '<button class="primary-button" type="button" data-print>Guardar o imprimir resumen</button>';
    if (resource.resultType === "ikigai") {
      visual = renderIkigaiDiagram();
      detail = "Este mapa reúne tus respuestas actuales. Podés descargarlo, revisarlo con calma y volver a construirlo cuando tus intereses o tu contexto cambien.";
      actions = '<button class="primary-button" type="button" data-download-ikigai>Descargar mi Ikigai</button><button class="secondary-button" type="button" data-print>Imprimir resumen</button>';
    }
    const resultTitle = resource.resultType === "ikigai"
      ? (name ? `¡Este es tu mapa, ${escapeHtml(name)}!` : "¡Este es tu mapa!")
      : (name ? `¡Gracias, ${escapeHtml(name)}!` : "¡Gracias!");
    frame.innerHTML = `<div class="resource-result"><p class="resource-kicker">Experiencia completada</p><h1 class="resource-title">${resultTitle}</h1>${visual}<p class="lead">${escapeHtml(detail)}</p><p class="privacy-note">${sent ? "Tus respuestas fueron enviadas correctamente para revisión." : "Tus respuestas permanecen en este dispositivo."}</p><div class="button-row result-actions">${actions}<a class="secondary-button" href="https://wa.me/50689437609" target="_blank" rel="noopener">Agendar sesión 1:1</a></div></div>`;
    frame.querySelector("[data-print]")?.addEventListener("click", () => window.print());
    frame.querySelector("[data-download-ikigai]")?.addEventListener("click", async (event) => {
      const button = event.currentTarget;
      const original = button.textContent;
      button.disabled = true;
      button.textContent = "Preparando imagen…";
      try { await downloadIkigai(); button.textContent = original; }
      catch (_) { button.textContent = "No se pudo descargar. Intentá imprimir."; }
      finally { button.disabled = false; }
    });
  }

  async function initialize() {
    if (/^[a-z0-9][a-z0-9-]{1,78}[a-z0-9]$/.test(resourceId)) {
      try {
        const response = await fetch(`/api/resources?id=${encodeURIComponent(resourceId)}`);
        if (response.status === 410) {
          resource = null;
        } else if (response.ok) {
          const payload = await response.json();
          if (payload.result) resource = payload.result;
        }
      } catch (_) {}
    }
    if (!resource) {
      frame.innerHTML = "<h1>Recurso no disponible</h1><p>Este recurso no existe o todavía no está publicado.</p><a class='secondary-button' href='/recursos/'>Volver a recursos</a>";
      return;
    }
    steps = resource.collectIdentity ? [identityStep, ...(resource.steps || [])] : (resource.steps || []);
    if (!steps.length) {
      frame.innerHTML = "<h1>Recurso en preparación</h1><p>Estamos terminando de configurar esta experiencia.</p><a class='secondary-button' href='/recursos/'>Volver a recursos</a>";
      return;
    }
    renderIntro();
  }

  initialize();
})();
