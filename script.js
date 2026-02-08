/************* CONFIG *************/
const API_URL = "https://script.google.com/macros/s/AKfycbzrbK0RJMBy9qzA5V1HaY37dRkL7PJLUEJ9Tp8HeGNN8cvzsTMDQH-2elg5ECIgv4iTxg/exec";
const IMGBB_API_KEY = "253ceec16b75eac72edeeb76a5a7fd48";

/************* USUÁRIOS *************/
const USUARIOS = {
  comunicacao: { senha: "Com123", role: "COM", nome: "Equipe Comunicação" },
  juridico: { senha: "Jur456", role: "JUR", nome: "Equipe Jurídico" }
};

let ROLE = null;
let NOME = null;

/************* INIT *************/
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("loginForm").addEventListener("submit", login);
  document.getElementById("createForm").addEventListener("submit", criarSolicitacao);
});

/************* LOGIN *************/
function login(e) {
  e.preventDefault();

  const usuario = document.getElementById("loginInput").value.trim().toLowerCase();
  const senha = document.getElementById("senhaInput").value.trim();

  if (!USUARIOS[usuario] || USUARIOS[usuario].senha !== senha) {
    alert("Login ou senha inválidos");
    return;
  }

  ROLE = USUARIOS[usuario].role;
  NOME = USUARIOS[usuario].nome;

  document.getElementById("loginPage").classList.add("d-none");
  document.getElementById("mainPage").classList.remove("d-none");

  renderizarTela();
  carregarSolicitacoes();
}

function logout() {
  location.reload();
}

/************* UI *************/
function renderizarTela() {
  const content = document.getElementById("content");
  let html = "";

  if (ROLE === "COM") {
    html += `
      <button class="btn btn-success mb-3" data-bs-toggle="modal" data-bs-target="#createModal">
        + Nova Solicitação
      </button>
    `;
  }

  html += `
    <div id="tableArea" class="card shadow-sm">
      <div class="card-body text-center py-4">
        <div class="spinner-border"></div>
        <p class="mt-2">Carregando solicitações...</p>
      </div>
    </div>
  `;

  content.innerHTML = html;
}

/************* LISTAR *************/
async function carregarSolicitacoes() {
  const res = await fetch(API_URL);
  const dados = await res.json();

  let html = `
    <table class="table table-striped align-middle">
      <thead>
        <tr>
          <th>Descrição</th>
          <th>Prioridade</th>
          <th>Status</th>
          <th>Solicitante</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
  `;

  dados.forEach(r => {
    if (ROLE === "JUR" && r.Status !== "Pendente") return;

    html += `
      <tr>
        <td>${r["Descrição"]}</td>
        <td>${r.Prioridade}</td>
        <td>
          <span class="badge ${
            r.Status === "Pendente" ? "bg-warning" :
            r.Status === "Aprovado" ? "bg-success" : "bg-danger"
          }">${r.Status}</span>
        </td>
        <td>${r.Nome}</td>
        <td>
          <button class="btn btn-sm btn-outline-info me-1"
            onclick="verMidias('${r.Midias || ""}')">
            Mídias
          </button>

          ${
            ROLE === "JUR" && r.Status === "Pendente" ? `
              <button class="btn btn-sm btn-success me-1"
                onclick="aprovar('${r.ID}')">Aprovar</button>
              <button class="btn btn-sm btn-danger"
                onclick="reprovar('${r.ID}')">Reprovar</button>
            ` : ""
          }
        </td>
      </tr>
    `;
  });

  html += "</tbody></table>";
  document.getElementById("tableArea").innerHTML = html;
}

/************* CRIAR *************/
async function criarSolicitacao(e) {
  e.preventDefault();

  const descricao = document.getElementById("descricao").value.trim();
  const prioridade = document.getElementById("prioridade").value;
  const imagens = document.getElementById("imagens").files;
  const video = document.getElementById("video").files;

  if (!descricao) {
    alert("Descrição obrigatória");
    return;
  }

  let midias = [];

  for (const img of imagens) {
    const url = await uploadImgBB(img);
    if (url) midias.push(url);
  }

  if (video.length) {
    const url = await uploadImgBB(video[0]);
    if (url) midias.push(url);
  }

  const payload = {
    descricao,
    prioridade,
    nome: NOME,
    email: "interno@prefeitura",
    midias: midias.join(",")
  };

  const fd = new FormData();
  fd.append("action", "create");
  fd.append("data", JSON.stringify(payload));

  const res = await fetch(API_URL, {
    method: "POST",
    body: fd
  });

  const json = await res.json();

  if (!json.success) {
    alert("Erro ao salvar");
    return;
  }

  bootstrap.Modal.getInstance(document.getElementById("createModal")).hide();
  document.getElementById("createForm").reset();
  carregarSolicitacoes();
}

/************* APROVAR / REPROVAR *************/
function aprovar(id) {
  atualizarStatus(id, "Aprovado", "");
}

function reprovar(id) {
  const justificativa = prompt("Informe a justificativa:");
  if (!justificativa) return;

  atualizarStatus(id, "Reprovado", justificativa);
}

async function atualizarStatus(id, status, justificativa) {
  const fd = new FormData();
  fd.append("action", "update");
  fd.append("data", JSON.stringify({
    id,
    status,
    avaliadoPor: NOME,
    justificativa
  }));

  await fetch(API_URL, {
    method: "POST",
    body: fd
  });

  carregarSolicitacoes();
}

/************* MÍDIAS *************/
function verMidias(str) {
  if (!str) {
    alert("Sem mídias");
    return;
  }

  const gallery = document.getElementById("gallery");
  gallery.innerHTML = "";

  str.split(",").forEach(url => {
    gallery.innerHTML += `
      <div class="col-md-4">
        <img src="${url}" class="img-fluid rounded shadow">
      </div>
    `;
  });

  new bootstrap.Modal(document.getElementById("mediaModal")).show();
}

/************* IMGBB *************/
async function uploadImgBB(file) {
  const fd = new FormData();
  fd.append("key", IMGBB_API_KEY);
  fd.append("image", file);

  const res = await fetch("https://api.imgbb.com/1/upload", {
    method: "POST",
    body: fd
  });

  const json = await res.json();
  return json?.data?.url || null;
}

