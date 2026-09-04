// js/panduan.js
import { db } from "./firebase-config.js";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { renderLoading, renderEmpty, renderError, debounce, escapeHtml } from "./utils.js";

const grid = document.getElementById("panduan-grid");
const searchInput = document.getElementById("search-panduan");
const filterKategori = document.getElementById("filter-kategori-panduan");

let allPanduan = [];

renderLoading(grid, "Memuat panduan multimedia...");

const q = query(collection(db, "panduan"), orderBy("created_at", "desc"));

onSnapshot(
  q,
  (snapshot) => {
    allPanduan = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    populateFilter(allPanduan);
    applyFilters();
  },
  (error) => {
    console.error(error);
    renderError(grid, "Tidak dapat mengambil data panduan dari server. Periksa koneksi internet kamu.");
  }
);

function populateFilter(data) {
  const kategoriSet = new Set(data.map((p) => p.kategori).filter(Boolean));
  const current = filterKategori.value;
  filterKategori.innerHTML = `<option value="">Semua Kategori</option>`;
  [...kategoriSet].sort().forEach((k) => {
    const opt = document.createElement("option");
    opt.value = k;
    opt.textContent = k;
    filterKategori.appendChild(opt);
  });
  if ([...kategoriSet].includes(current)) filterKategori.value = current;
}

function applyFilters() {
  const term = (searchInput.value || "").toLowerCase().trim();
  const kategori = filterKategori.value;

  const result = allPanduan.filter((p) => {
    const judul = (p.judul || "").toLowerCase();
    const deskripsi = (p.deskripsi || "").toLowerCase();
    const matchTerm = !term || judul.includes(term) || deskripsi.includes(term);
    const matchKategori = !kategori || p.kategori === kategori;
    return matchTerm && matchKategori;
  });

  renderGrid(result);
}

function renderGrid(list) {
  if (list.length === 0) {
    renderEmpty(grid, "Panduan tidak ditemukan.", "Coba ubah kata kunci atau kategori.");
    return;
  }

  grid.innerHTML = list
    .map(
      (p) => `
      <article class="guide-card">
        <div class="card-cover">
          ${
            p.thumbnail
              ? `<img src="${p.thumbnail}" alt="Thumbnail ${escapeHtml(p.judul)}" loading="lazy" />`
              : `<div class="no-image">Tanpa thumbnail</div>`
          }
          ${p.tipe ? `<span class="guide-badge">${escapeHtml(p.tipe)}</span>` : ""}
        </div>
        <div class="card-body">
          <h3>${escapeHtml(p.judul || "Tanpa judul")}</h3>
          ${p.deskripsi ? `<p>${escapeHtml(p.deskripsi)}</p>` : ""}
          <div class="card-tags">
            ${p.kategori ? `<span class="tag">${escapeHtml(p.kategori)}</span>` : ""}
          </div>
          <a class="btn btn-primary" href="${p.link || "#"}" target="_blank" rel="noopener noreferrer">Buka Panduan</a>
        </div>
      </article>
    `
    )
    .join("");
}

searchInput.addEventListener("input", debounce(applyFilters, 200));
filterKategori.addEventListener("change", applyFilters);