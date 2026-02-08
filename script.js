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
let CURRENT_ID = null;

/************* INIT *************/
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("loginForm").addEventListener("submit", login);
  document.getElementById("createForm").addEventListener("submit", criarSolicitacao);
  document.getElementById("btnReprovar").addEventListener("click", confirmarReprovacao);
});

/************* LOGIN *************/
function login(e) {
  e.preventDefault();

  const usuario = loginInput.value.trim().toLowerCase();
  const senha = senhaInput.value.trim();

  if (!USUARIOS[usuario] || USUARIOS[usuario].senha !== senha) {
    loginError.textContent = "Login ou senha inválidos";
    loginError.classList.remove("d-none");
    return;
  }

  ROLE = USUARIOS[usuario].role;
  NOME = USUARIOS[usuario].nome;

  loginPage.classList.add("d-none");
  mainPage.classList.remove("d-none");

  renderizarTela();
  carregarSolicitacoes();
}

function logout() {
  location.reload();
}

/************* UI *************/
function renderizarTela() {
  let html = "";

  if (ROLE === "COM") {
    html += `
      <button class="btn btn-success mb-4" data-bs-toggle="modal" data-bs-target="#createModal">
        + Nova Solicitação
      </button>`;
  }

  html += `
    <div id="tableArea" class="card p-3 shadow-sm">
      <div class="text-center py-5">
        <div class="spinner-border"></div>
        <p class="mt-2">Carregando solicitações...</p>
      </div>
    </div>`;

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
      <tbody>`;

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
        <td>${r["Solicitante Nome"]}</td>
        <td>
          <button class="btn btn-sm btn-outline-info me-1"
            onclick="verMidias('${r.Midias || ""}')">Mídias</button>

          ${
            ROLE === "JUR" && r.Status === "Pendente" ? `
              <button class="btn btn-sm btn-success me-1"
                onclick="aprovar('${r.ID}')">Aprovar</button>
              <button class="btn btn-sm btn-danger"
                onclick="mostrarJustificativa('${r.ID}')">Reprovar</button>
            ` : ""
          }
        </td>
      </tr>`;
  });

  html += "</tbody></table>";
  document.getElementById("tableArea").innerHTML = html;
}

/************* CRIAR *************/
async function criarSolicitacao(e) {
  e.preventDefault();

  const descricao = descricao.value.trim();
  const prioridade = prioridade.value;
  const imagens = document.getElementById("imagens").files;

  if (!descricao) return
