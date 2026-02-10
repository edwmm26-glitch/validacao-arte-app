const API_URL = "https://script.google.com/macros/s/AKfycbzqKPGVkMtRWyChtI4jB_0kt1IKn-wOUPoN_eHXTYQwQ1rvrtmqrsuvGtaxEtl7RTHuGQ/exec";
const IMGBB_API_KEY = "253ceec16b75eac72edeeb76a5a7fd48";

const USUARIOS = {
  comunicacao: { senha:"Com123", nome:"Comunicação", perfil:"com" },
  juridico: { senha:"Jur456", nome:"Jurídico", perfil:"jur" }
};

let USUARIO = {};
let SOLICITACAO_ATUAL = null;

// ---------- UI helpers ----------
function loading(on=true){
  loadingOverlay.classList.toggle("d-none", !on);
}

function toast(msg){
  toastText.textContent = msg;
  new bootstrap.Toast(toastMsg).show();
}

// ---------- LOGIN ----------
loginForm.onsubmit = e=>{
  e.preventDefault();
  const u = loginInput.value.toLowerCase();
  const s = senhaInput.value;

  if(!USUARIOS[u] || USUARIOS[u].senha!==s){
    loginError.textContent="Login inválido";
    loginError.classList.remove("d-none");
    return;
  }

  USUARIO = USUARIOS[u];
  loginPage.classList.add("d-none");
  mainPage.classList.remove("d-none");
  carregar();
};

// ---------- CARREGAR ----------
async function carregar(){
  loading(true);
  const r = await fetch(API_URL);
  let dados = await r.json();

  const ordem = { "Crítica":1,"Alta":2,"Média":3,"Baixa":4 };

  dados.sort((a,b)=>{
    if(ordem[a.Prioridade]!==ordem[b.Prioridade])
      return ordem[a.Prioridade]-ordem[b.Prioridade];
    return new Date(b["Data Criação"]) - new Date(a["Data Criação"]);
  });

  let html = `<table class="table">
    <tr><th>Descrição</th><th>Prioridade</th><th>Status</th><th>Ações</th></tr>`;

  dados.forEach(d=>{
    html+=`
    <tr class="priority-${d.Prioridade}">
      <td>${d.Descrição}</td>
      <td>${d.Prioridade}</td>
      <td>${d.Status}</td>
      <td>
        <button class="btn btn-sm btn-info" onclick="verMidias('${d.Pasta Drive||""}')">Mídias</button>
        ${USUARIO.perfil==="jur" && d.Status==="Pendente"
          ? `<button class="btn btn-sm btn-warning ms-1" onclick="abrirDecisao('${d.ID}')">Decidir</button>`
          : ``}
      </td>
    </tr>`;
  });

  tableArea.innerHTML = html+"</table>";
  loading(false);
}

// ---------- CRIAR ----------
createForm.onsubmit = async e=>{
  e.preventDefault();
  loading(true);

  let midias=[];
  for(let f of imagens.files) midias.push(await upload(f));
  if(video.files[0]) midias.push(await upload(video.files[0]));

  const fd = new FormData();
  fd.append("action","create");
  fd.append("data",JSON.stringify({
    descricao:descricao.value,
    prioridade:prioridade.value,
    nome:USUARIO.nome,
    midias:midias.join(",")
  }));

  await fetch(API_URL,{method:"POST",body:fd});
  bootstrap.Modal.getInstance(createModal).hide();
  createForm.reset();
  toast("Solicitação criada com sucesso");
  carregar();
};

// ---------- UPLOAD ----------
async function upload(file){
  toast("Anexando mídia...");
  const fd=new FormData();
  fd.append("key",IMGBB_API_KEY);
  fd.append("image",file);
  const r=await fetch("https://api.imgbb.com/1/upload",{method:"POST",body:fd});
  return (await r.json()).data.url;
}

// ---------- GALERIA ----------
function verMidias(str){
  gallery.innerHTML="";
  videoPlayer.classList.add("d-none");

  str.split(",").forEach(u=>{
    if(u.includes(".mp4")){
      videoPlayer.src=u;
      videoPlayer.classList.remove("d-none");
    }else{
      gallery.innerHTML+=`
      <div class="col-md-4">
        <img src="${u}" class="img-fluid gallery-img" onclick="window.open('${u}','_blank')">
      </div>`;
    }
  });

  new bootstrap.Modal(mediaModal).show();
}

// ---------- JURÍDICO ----------
function abrirDecisao(id){
  SOLICITACAO_ATUAL=id;
  justificativa.value="";
  new bootstrap.Modal(decisaoModal).show();
}

async function decidir(status){
  if(status==="Reprovado" && !justificativa.value.trim()){
    alert("Justificativa obrigatória");
    return;
  }

  loading(true);

  const fd=new FormData();
  fd.append("action","update");
  fd.append("data",JSON.stringify({
    id:SOLICITACAO_ATUAL,
    status,
    avaliadoPor:USUARIO.nome,
    justificativa:justificativa.value
  }));

  await fetch(API_URL,{method:"POST",body:fd});
  bootstrap.Modal.getInstance(decisaoModal).hide();
  toast(`Solicitação ${status.toLowerCase()}`);
  carregar();
}

function logout(){ location.reload(); }
