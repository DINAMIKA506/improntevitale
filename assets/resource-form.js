(function () {
  const root = document.querySelector("[data-resource-app]");
  if (!root || !window.IMPRONTE_RESOURCES) return;

  const requestedId = root.dataset.resourceApp === "dynamic" ? new URLSearchParams(location.search).get("id") : root.dataset.resourceApp;
  const resourceId = String(requestedId || "");
  let resource = window.IMPRONTE_RESOURCES[resourceId] || null;
  const frame = root.querySelector(".resource-frame");
  const storageKey = `impronte-resource-${resourceId}`;
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
    frame.innerHTML = `
      <div class="resource-intro">
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
      return `<label class="question-card">${label}<textarea name="${question.id}" ${required}>${escapeHtml(value)}</textarea></label>`;
    }
    return `<label class="question-card">${label}<input name="${question.id}" type="${escapeHtml(question.type || "text")}" value="${escapeHtml(value)}" ${required}></label>`;
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
    frame.innerHTML = `<div class="resource-result"><p class="resource-kicker">Experiencia completada</p><h1 class="resource-title">${name ? `¡Gracias, ${escapeHtml(name)}!` : "¡Gracias!"}</h1>${visual}<p class="lead">${escapeHtml(detail)}</p><p class="privacy-note">${sent ? "Tus respuestas fueron enviadas correctamente para revisión." : "Tus respuestas permanecen en este dispositivo."}</p><div class="button-row" style="justify-content:center;margin-top:1.5rem"><button class="primary-button" type="button" data-print>Guardar o imprimir resumen</button><a class="secondary-button" href="https://wa.me/50689437609" target="_blank" rel="noopener">Agendar sesión 1:1</a></div></div>`;
    frame.querySelector("[data-print]").addEventListener("click", () => window.print());
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
