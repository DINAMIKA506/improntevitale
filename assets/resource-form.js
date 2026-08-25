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
    "ficha-tecnica": "/assets/recurso-ficha-tecnica.webp",
    "creando-mi-ikigai": "/assets/recurso-creando-mi-ikigai.webp"
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

  function persist() {
    try { sessionStorage.setItem(storageKey, JSON.stringify(answers)); } catch (_) {}
  }

  function renderIntro() {
    const cover = resourceCovers[resourceId];
    const coverSize = resourceId === "creando-mi-ikigai" ? [1350, 700] : [1000, 519];
    const coverMarkup = cover
      ? `<img class="resource-intro-cover" src="${cover}" alt="Portada de ${escapeHtml(resource.title)}" width="${coverSize[0]}" height="${coverSize[1]}">`
      : "";
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
    return `<div class="ikigai-result-scroll"><div class="ikigai-board" data-ikigai-diagram>
      <img class="ikigai-board-image" src="/assets/ikigai-resultado.webp" alt="Diagrama de Ikigai con las áreas pasión, misión, profesión y vocación" width="1120" height="896">
      <article class="ikigai-postit ikigai-postit-love"><strong>Lo que amás</strong><span>${value("ik_love")}</span></article>
      <article class="ikigai-postit ikigai-postit-good"><strong>Lo que sabés hacer bien</strong><span>${value("ik_good")}</span></article>
      <article class="ikigai-postit ikigai-postit-world"><strong>Lo que el mundo necesita</strong><span>${value("ik_world")}</span></article>
      <article class="ikigai-postit ikigai-postit-paid"><strong>Lo que te genera recursos</strong><span>${value("ik_paid")}</span></article>
      <article class="ikigai-postit ikigai-postit-core"><strong>Mi punto de encuentro</strong><span>${value("ik_core")}</span></article>
      <span class="ikigai-arrow ikigai-arrow-love" aria-hidden="true">↘</span>
      <span class="ikigai-arrow ikigai-arrow-good" aria-hidden="true">↗</span>
      <span class="ikigai-arrow ikigai-arrow-world" aria-hidden="true">↙</span>
      <span class="ikigai-arrow ikigai-arrow-paid" aria-hidden="true">↖</span>
      <span class="ikigai-arrow ikigai-arrow-core" aria-hidden="true">↑</span>
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

  function loadCanvasImage(source) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("No se pudo cargar el diagrama."));
      image.src = source;
    });
  }

  function drawCanvasPostIt(context, title, body, x, y, width, height, rotation = 0) {
    context.save();
    context.translate(x + (width / 2), y + (height / 2));
    context.rotate((rotation * Math.PI) / 180);
    context.shadowColor = "rgba(22, 47, 86, .16)";
    context.shadowBlur = 22;
    context.shadowOffsetY = 12;
    context.fillStyle = "#fff0df";
    context.fillRect(-(width / 2), -(height / 2), width, height);
    context.shadowColor = "transparent";
    context.fillStyle = "rgba(239, 143, 170, .58)";
    context.fillRect(-70, -(height / 2) - 7, 140, 34);
    context.textAlign = "center";
    context.textBaseline = "top";
    context.fillStyle = "#162f56";
    context.font = '800 29px "Open Sans", Arial, sans-serif';
    const titleLines = canvasLines(context, title.toUpperCase(), width - 52, 2);
    titleLines.forEach((line, index) => context.fillText(line, 0, -(height / 2) + 40 + (index * 34)));
    const titleHeight = titleLines.length * 34;
    context.fillStyle = "#394b63";
    context.font = '600 23px "Open Sans", Arial, sans-serif';
    const lines = canvasLines(context, body, width - 58, 7);
    lines.forEach((line, index) => context.fillText(line, 0, -(height / 2) + 54 + titleHeight + (index * 30)));
    context.restore();
  }

  function drawCanvasArrow(context, startX, startY, controlX, controlY, endX, endY) {
    context.save();
    context.strokeStyle = "#e97899";
    context.fillStyle = "#e97899";
    context.lineWidth = 5;
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(startX, startY);
    context.quadraticCurveTo(controlX, controlY, endX, endY);
    context.stroke();
    const angle = Math.atan2(endY - controlY, endX - controlX);
    context.beginPath();
    context.moveTo(endX, endY);
    context.lineTo(endX - (18 * Math.cos(angle - .5)), endY - (18 * Math.sin(angle - .5)));
    context.lineTo(endX - (18 * Math.cos(angle + .5)), endY - (18 * Math.sin(angle + .5)));
    context.closePath();
    context.fill();
    context.restore();
  }

  async function downloadIkigai() {
    if (document.fonts?.ready) await document.fonts.ready;
    const diagram = await loadCanvasImage("/assets/ikigai-resultado.webp");
    const canvas = document.createElement("canvas");
    canvas.width = 1800;
    canvas.height = 1400;
    const context = canvas.getContext("2d");
    context.fillStyle = "#fffafc";
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.textAlign = "center";
    context.fillStyle = "#162f56";
    context.font = '800 54px "Open Sans", Arial, sans-serif';
    context.fillText("CREANDO MI IKIGAI", 900, 70);
    const participant = answers.participant_name || answers.nombre || "";
    if (participant) {
      context.fillStyle = "#5f6f85";
      context.font = '600 25px "Open Sans", Arial, sans-serif';
      context.fillText(participant, 900, 112);
    }

    context.drawImage(diagram, 500, 240, 800, 640);
    drawCanvasArrow(context, 455, 350, 505, 285, 555, 310);
    drawCanvasArrow(context, 1345, 350, 1295, 285, 1245, 310);
    drawCanvasArrow(context, 465, 895, 520, 835, 565, 790);
    drawCanvasArrow(context, 1335, 895, 1280, 835, 1235, 790);
    drawCanvasArrow(context, 900, 1090, 900, 1025, 900, 925);

    drawCanvasPostIt(context, "Lo que amás", answers.ik_love, 60, 190, 380, 300, -5);
    drawCanvasPostIt(context, "Lo que el mundo necesita", answers.ik_world, 1360, 190, 380, 300, 5);
    drawCanvasPostIt(context, "Lo que sabés hacer bien", answers.ik_good, 70, 820, 390, 300, 4);
    drawCanvasPostIt(context, "Lo que te genera recursos", answers.ik_paid, 1340, 820, 390, 300, -4);
    drawCanvasPostIt(context, "Mi punto de encuentro", answers.ik_core, 610, 1110, 580, 230, 0);

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
