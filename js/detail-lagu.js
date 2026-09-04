import{db}from"./firebase-config.js";
import{doc,getDoc}from"https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import{renderLoading,renderEmpty,renderError,escapeHtml}from"./utils.js";

const container=document.getElementById("detail-lagu");
const id=new URLSearchParams(window.location.search).get("id");
let slides=[];
let current=0;

if(!id){
renderEmpty(container,"Lagu tidak ditemukan.");
}else{
loadLagu();
}

async function loadLagu(){
renderLoading(container,"Memuat lagu...");
try{
const snap=await getDoc(doc(db,"lagu",id));
if(!snap.exists()){
renderEmpty(container,"Lagu tidak ditemukan.");
return;
}
renderLagu({id:snap.id,...snap.data()});
}catch(error){
console.error(error);
renderError(container,"Tidak dapat mengambil data lagu.");
}
}

function renderLagu(lagu){
slides=Array.isArray(lagu.slides)?lagu.slides:[];
current=0;

container.innerHTML=`
<section class="song-detail">
<div class="song-detail-head">
${lagu.cover?`<img class="song-detail-cover" src="${lagu.cover}" alt="Cover ${escapeHtml(lagu.judul)}">`:""}
<div>
<h1>${escapeHtml(lagu.judul||"Tanpa judul")}</h1>
<div class="card-tags">
${lagu.nomor!=null?`<span class="tag">No. ${lagu.nomor}</span>`:""}
${lagu.kategori?`<span class="tag">${escapeHtml(lagu.kategori)}</span>`:""}
${lagu.bahasa?`<span class="tag tag-muted">${escapeHtml(lagu.bahasa)}</span>`:""}
</div>
</div>
</div>
${slides.length?`
<div class="slide-viewer">
<div class="slide-counter" id="slide-counter"></div>
<button class="slide-nav slide-prev" id="slide-prev" aria-label="Slide sebelumnya">‹</button>
<img id="current-slide" src="" alt="">
<button class="slide-nav slide-next" id="slide-next" aria-label="Slide berikutnya">›</button>
</div>
<div class="slide-thumbnails" id="slide-thumbnails"></div>
`:`<p class="slide-empty">Belum ada slide untuk lagu ini.</p>`}
</section>`;

if(slides.length)initViewer(lagu.judul||"Lagu");
}

function initViewer(judul){
const image=document.getElementById("current-slide");
const counter=document.getElementById("slide-counter");
const thumbnails=document.getElementById("slide-thumbnails");
const prev=document.getElementById("slide-prev");
const next=document.getElementById("slide-next");

thumbnails.innerHTML=slides.map((url,i)=>`
<button class="slide-thumb${i===0?" active":""}" data-index="${i}">
<img src="${url}" alt="Slide ${i+1}">
</button>`).join("");

function showSlide(index){
current=(index+slides.length)%slides.length;
image.src=slides[current];
image.alt=`Slide ${current+1} - ${judul}`;
counter.textContent=`${current+1} / ${slides.length}`;

thumbnails.querySelectorAll(".slide-thumb").forEach((el,i)=>{
el.classList.toggle("active",i===current);
});

thumbnails.querySelector(`.slide-thumb[data-index="${current}"]`)?.scrollIntoView({
behavior:"smooth",
block:"nearest",
inline:"center"
});
}

prev.addEventListener("click",()=>showSlide(current-1));
next.addEventListener("click",()=>showSlide(current+1));

thumbnails.querySelectorAll(".slide-thumb").forEach(btn=>{
btn.addEventListener("click",()=>showSlide(Number(btn.dataset.index)));
});

document.addEventListener("keydown",e=>{
if(e.key==="ArrowLeft")showSlide(current-1);
if(e.key==="ArrowRight")showSlide(current+1);
});

let startX=0;

image.addEventListener("touchstart",e=>{
startX=e.touches[0].clientX;
},{passive:true});

image.addEventListener("touchend",e=>{
const endX=e.changedTouches[0].clientX;
const diff=endX-startX;

if(Math.abs(diff)<50)return;

if(diff>0){
showSlide(current-1);
}else{
showSlide(current+1);
}
},{passive:true});

showSlide(0);
}