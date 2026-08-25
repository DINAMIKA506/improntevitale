const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");

if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    const open = siteNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(open));
  });
  siteNav.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      siteNav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    }
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
      `Mensaje: ${data.get("mensaje")}`
    ].join("\n");
    window.open(`https://wa.me/50689437609?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  });
}

const searchForm = document.querySelector("[data-blog-search]");
const filterButtons = Array.from(document.querySelectorAll("[data-blog-filter]"));
const emptyState = document.querySelector("[data-blog-empty]");
let activeFilter = "todos";

function filterBlog() {
  if (!searchForm) return;
  const query = searchForm.querySelector("input").value.trim().toLocaleLowerCase("es");
  let visible = 0;
  Array.from(document.querySelectorAll("[data-blog-card]")).forEach((card) => {
    const matchesCategory = activeFilter === "todos" || card.dataset.category.split(" ").includes(activeFilter);
    const matchesQuery = !query || card.textContent.toLocaleLowerCase("es").includes(query);
    const show = matchesCategory && matchesQuery;
    card.hidden = !show;
    if (show) visible += 1;
  });
  if (emptyState) emptyState.hidden = visible !== 0;
}

if (searchForm) {
  searchForm.addEventListener("submit", (event) => { event.preventDefault(); filterBlog(); });
  searchForm.querySelector("input").addEventListener("input", filterBlog);
  filterButtons.forEach((button) => button.addEventListener("click", () => {
    activeFilter = button.dataset.blogFilter;
    filterButtons.forEach((item) => item.classList.toggle("is-active", item === button));
    filterBlog();
  }));
}
