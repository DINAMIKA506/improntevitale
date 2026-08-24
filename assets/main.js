const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");

if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    const open = siteNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(open));
  });
}

document.querySelectorAll("[data-year]").forEach((element) => {
  element.textContent = String(new Date().getFullYear());
});

const contactForm = document.querySelector("[data-whatsapp-form]");

if (contactForm) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(contactForm);
    const message = [
      "Hola, Impronte Vitale. Me gustaría recibir información.",
      `Nombre: ${data.get("nombre")} ${data.get("apellido")}`,
      `Correo: ${data.get("correo")}`,
      `Mensaje: ${data.get("mensaje")}`,
    ].join("\n");
    window.open(`https://wa.me/50689437609?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  });
}
