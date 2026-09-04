// js/lagu.js
import { db } from "./firebase-config.js";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { renderLoading, renderEmpty, renderError, debounce, escapeHtml } from "./utils.js";

const grid = document.getElementById("lagu-grid");
const searchInput = document.getElementById("search-lagu");
const filterKategori = document.getElementById("filter-kategori");
const filterBahasa = document.getElementById("filter-bahasa");
const sortSelect = document.getElementById("sort-lagu");

let allLagu = [];

renderLoading(grid, "Memuat kumpulan lagu...");

const q = query(collection(db, "lagu"), orderBy("nomor", "asc"));

onSnapshot(
  q,
  (snapshot) => {
    allLagu = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    populateFilters(allLagu);
    applyFilters();
  },
  (error) => {
    console.error(error);
    renderError(grid, "Tidak dapat mengambil data lagu dari server. Periksa koneksi internet kamu.");
  }
);

function populateFilters(data) {
  const kategoriSet = new Set(data.map((l) => l.kategori).filter(Boolean));
  const bahasaSet = new Set(data.map((l) => l.bahasa).filter(Boolean));

  fillSelect(filterKategori, kategoriSet, "Semua Kategori");
  fillSelect(filterBahasa, bahasaSet, "Semua Bahasa");
}

function fillSelect(select, values, defaultLabel) {
  const current = select.value;
  select.innerHTML = `<option value="">${defaultLabel}</option>`;
  [...values].sort().forEach((v) => {
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = v;
    select.appendChild(opt);
  });
  if ([...values].includes(current)) select.value = current;
}

function applyFilters() {
  const term = (searchInput.value || "").toLowerCase().trim();
  const kategori = filterKategori.value;
  const bahasa = filterBahasa.value;
  const sortBy = sortSelect.value;

  let result = allLagu.filter((l) => {
    const judulLower = l.judul_lower || (l.judul || "").toLowerCase();
    const matchTerm = !term || judulLower.includes(term) || String(l.nomor ?? "").includes(term);
    const matchKategori = !kategori || l.kategori === kategori;
    const matchBahasa = !bahasa || l.bahasa === bahasa;
    return matchTerm && matchKategori && matchBahasa;
  });

  result.sort((a, b) => {
    if (sortBy === "judul") return (a.judul || "").localeCompare(b.judul || "");
    return (a.nomor ?? 0) - (b.nomor ?? 0);
  });

  renderGrid(result);
}

function renderGrid(list) {
  if (list.length === 0) {
    renderEmpty(grid, "Lagu tidak ditemukan.", "Coba ubah kata kunci atau filter pencarian.");
    return;
  }

  grid.innerHTML = list
    .map(
      (l) => `
      <article class="song-card" data-id="${l.id}" tabindex="0" role="button" aria-label="Lihat detail lagu ${escapeHtml(l.judul)}">
        <div class="card-cover">
          ${
            l.cover
              ? `<img src="${l.cover}" alt="Cover ${escapeHtml(l.judul)}" loading="lazy" />`
              : `<div class="no-image">Tanpa cover</div>`
          }
          ${l.nomor != null ? `<span class="card-number">#${l.nomor}</span>` : ""}
        </div>
        <div class="card-body">
          <h3>${escapeHtml(l.judul || "Tanpa judul")}</h3>
          <div class="card-tags">
            ${l.kategori ? `<span class="tag">${escapeHtml(l.kategori)}</span>` : ""}
            ${l.bahasa ? `<span class="tag tag-muted">${escapeHtml(l.bahasa)}</span>` : ""}
          </div>
        </div>
      </article>
    `
    )
    .join("");

  grid.querySelectorAll(".song-card").forEach((card) => {
    const open = () => openModal(card.dataset.id);
    card.addEventListener("click", open);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
    });
  });
}

searchInput.addEventListener("input", debounce(applyFilters, 200));
filterKategori.addEventListener("change", applyFilters);
filterBahasa.addEventListener("change", applyFilters);
sortSelect.addEventListener("change", applyFilters);

/* ---------- Modal detail lagu ---------- */
const modalOverlay = document.getElementById("modal-overlay");
const modalCover = document.getElementById("modal-cover");
const modalTitle = document.getElementById("modal-title");
const modalTags = document.getElementById("modal-tags");
const slideGallery = document.getElementById("slide-gallery");
const modalClose = document.getElementById("modal-close");

const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");

function openModal(id) {
  const lagu = allLagu.find((l) => l.id === id);
  if (!lagu) return;

  modalCover.src = lagu.cover || "";
  modalCover.alt = `Cover ${lagu.judul || ""}`;
  modalCover.style.display = lagu.cover ? "block" : "none";
  modalTitle.textContent = lagu.judul || "Tanpa judul";

  modalTags.innerHTML = `
    ${lagu.nomor != null ? `<span class="tag">No. ${lagu.nomor}</span>` : ""}
    ${lagu.kategori ? `<span class="tag">${escapeHtml(lagu.kategori)}</span>` : ""}
    ${lagu.bahasa ? `<span class="tag tag-muted">${escapeHtml(lagu.bahasa)}</span>` : ""}
  `;

  const slides = Array.isArray(lagu.slides) ? lagu.slides : [];
  if (slides.length === 0) {
    slideGallery.innerHTML = "";
    slideGallery.insertAdjacentHTML(
      "afterend",
      `<p class="slide-empty" id="slide-empty-msg">Belum ada slide untuk lagu ini.</p>`
    );
  } else {
    document.getElementById("slide-empty-msg")?.remove();
    slideGallery.innerHTML = slides
      .map(
        (url, i) =>
          `<img src="${url}" alt="Slide ${i + 1} - ${escapeHtml(lagu.judul)}" loading="lazy" data-full="${url}" />`
      )
      .join("");
    slideGallery.querySelectorAll("img").forEach((img) => {
      img.addEventListener("click", () => openLightbox(img.dataset.full));
    });
  }

  modalOverlay.classList.add("is-open");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  modalOverlay.classList.remove("is-open");
  document.body.style.overflow = "";
}

function openLightbox(src) {
  lightboxImg.src = src;
  lightbox.classList.add("is-open");
}
function closeLightbox() {
  lightbox.classList.remove("is-open");
  lightboxImg.src = "";
}

modalClose.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", (e) => { if (e.target === modalOverlay) closeModal(); });
lightbox.addEventListener("click", closeLightbox);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { closeModal(); closeLightbox(); }
});