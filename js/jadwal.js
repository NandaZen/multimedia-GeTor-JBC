// js/jadwal.js
import{db}from"./firebase-config.js";
import{collection,onSnapshot,query,orderBy}from"https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import{renderLoading,renderEmpty,renderError,debounce,escapeHtml,toDateObj,formatTanggal}from"./utils.js";

const list=document.getElementById("jadwal-list");
const searchInput=document.getElementById("search-jadwal");
const filter=document.getElementById("filter-jadwal");
let allJadwal=[];

renderLoading(list,"Memuat jadwal pelayanan...");
const q=query(collection(db,"jadwal"),orderBy("tanggal","asc"));

onSnapshot(q,snapshot=>{
allJadwal=snapshot.docs.map(doc=>({id:doc.id,...doc.data()}));
applyFilters();
},error=>{
console.error(error);
renderError(list,"Tidak dapat mengambil jadwal. Periksa koneksi atau Firestore Rules.");
});

function applyFilters(){
const term=(searchInput.value||"").toLowerCase().trim();
const status=filter.value;
const now=new Date();now.setHours(0,0,0,0);

const result=allJadwal.filter(item=>{
const date=toDateObj(item.tanggal);
const text=[
item.judul,
item.kegiatan,
item.keterangan,
...(Array.isArray(item.petugas)?item.petugas.map(p=>typeof p==="string"?p:`${p.nama||""} ${p.tugas||""}`):[])
].join(" ").toLowerCase();

const matchSearch=!term||text.includes(term);
const isPast=date&&date<now;
const matchStatus=!status||(status==="mendatang"&&!isPast)||(status==="selesai"&&isPast);
return matchSearch&&matchStatus;
});

renderJadwal(result,now);
}

function renderJadwal(data,now){
if(!data.length){
renderEmpty(list,"Tidak ada jadwal.","Coba ubah pencarian atau filter.");
return;
}

list.innerHTML=data.map(item=>{
const date=toDateObj(item.tanggal);
const isPast=date&&date<now;
const day=date?String(date.getDate()).padStart(2,"0"):"--";
const month=date?date.toLocaleDateString("id-ID",{month:"short"}):"";
const time=item.jam||item.waktu||"";
const title=item.judul||item.kegiatan||"Pelayanan Multimedia";
const petugas=Array.isArray(item.petugas)?item.petugas:[];

return `<article class="schedule-card${isPast?" is-past":""}">
<div class="schedule-date">
<span class="day">${day}</span>
<span class="month">${escapeHtml(month)}</span>
${time?`<span class="time">${escapeHtml(time)}</span>`:""}
</div>
<div class="schedule-main">
<h3>${escapeHtml(title)}</h3>
${petugas.length?`<div class="member-list">${petugas.map(p=>{
if(typeof p==="string")return `<div class="member-chip"><span class="nama">${escapeHtml(p)}</span></div>`;
return `<div class="member-chip"><span class="nama">${escapeHtml(p.nama||"-")}</span><span class="tugas">${escapeHtml(p.tugas||"")}</span></div>`;
}).join("")}</div>`:`<p class="schedule-note">Belum ada pembagian petugas.</p>`}
${item.keterangan?`<p class="schedule-note">${escapeHtml(item.keterangan)}</p>`:""}
</div>
</article>`;
}).join("");
}

searchInput.addEventListener("input",debounce(applyFilters,200));
filter.addEventListener("change",applyFilters);