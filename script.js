/************* CONFIG *************/
const API_URL = 'https://script.google.com/macros/s/AKfycbw2I3Uw_4xplzsnzob2O4_TANJimygLevfO09UhTjMzbljFDbroHLDgzIRSuKRkRFTgfg/exec';
const IMGBB_API_KEY = '253ceec16b75eac72edeeb76a5a7fd48';

/************* USUÁRIOS *************/
const USUARIOS = {
  comunicacao: { senha: 'Com123', role: 'Comunicacao', nome: 'Equipe Comunicação' },
  juridico: { senha: 'Jur456', role: 'Juridico', nome: 'Equipe Jurídico' }
};

let currentId = null;

/************* INIT *************/
document.addEventListener('DOMContentLoaded', () => {
  const savedRole = sessionStorage.getItem('role');
  if (savedRole) {
    loginPage.classList.add('d-none');
    mainPage.classList.remove('d-none');
    renderContent();
    loadRequests();
  }

  loginForm?.addEventListener('submit', login);
  createForm?.addEventListener('submit', createSolicitacao);
  btnReprovar?.addEventListener('click', confirmarReprovacao);
});

/************* LOGIN *************/
function login(e) {
  e.preventDefault();
  const login = loginInput.value.trim().toLowerCase();
  const senha = senhaInput.value.trim();
  const user = USUARIOS[login];

  if (user && user.senha === senha) {
    sessionStorage.setItem('role', user.role);
    sessionStorage.setItem('nome', user.nome);
    loginPage.classList.add('d-none');
    mainPage.classList.remove('d-none');
    renderContent();
    loadRequests();
    showSuccessToast(`Bem-vindo, ${user.nome}!`);
  } else {
    loginError.textContent = 'Login ou senha inválidos';
    loginError.classList.remove('d-none');
  }
}

function logout() {
  sessionStorage.clear();
  location.reload();
}

/************* UI *************/
function renderContent() {
  let html = '';

  if (sessionStorage.getItem('role') === 'Comunicacao') {
    html += `
      <button class="btn btn-success mb-3" data-bs-toggle="modal" data-bs-target="#createModal">
        + Nova Solicitação
      </button>`;
  }

  html += `
    <div id="tableArea" class="card shadow-sm">
      <div class="card-body text-center py-5">
        <div class="spinner-border"></div>
        <p class="mt-3">Carregando solicitações...</p>
      </div>
    </div>`;

  content.innerHTML = html;
}

/************* LISTAR *************/
async function loadRequests() {
  try {
    const res = await fetch(API_URL);
    const rows = await res.json();

    let html = `
      <table class="table table-striped">
        <thead>
          <tr>
            <th>ID</th><th>Descrição</th><th>Prioridade</th>
            <th>Status</th><th>Solicitante</th><th>Data</th><th>Ações</th>
          </tr>
        </thead><tbody>`;

    if (!rows.length) {
      html += `<tr><td colspan="7" class="text-center">Nenhuma solicitação</td></tr>`;
    }

    rows.forEach(r => {
      html += `
        <tr>
          <td>${r.ID}</td>
          <td>${r['Descrição']}</td>
          <td>${r.Prioridade}</td>
          <td>${r.Status}</td>
          <td>${r['Solicitante Nome']}</td>
          <td>${r['Data Criação']}</td>
          <td>
            <button class="btn btn-sm btn-outline-info" onclick="verMidia('${r['Pasta Drive'] || ''}')">
              Ver Mídia
            </button>
          </td>
        </tr>`;
    });

    html += '</tbody></table>';
    tableArea.innerHTML = html;

  } catch {
    showErrorToast('Erro ao carregar dados');
  }
}

/************* CRIAR *************/
async function createSolicitacao(e) {
  e.preventDefault();

  const desc = descricao.value.trim();
  const prio = prioridade.value;

  if (!desc) return showErrorToast('Descrição obrigatória');

  const media = [];

  for (const f of imagens.files) {
    const url = await uploadToImgBB(f);
    if (url) media.push(url);
  }

  if (video.files.length) {
    const url = await uploadToImgBB(video.files[0]);
    if (url) media.push(url);
  }

  const payload = {
    descricao: desc,
    prioridade: prio,
    email: 'comunicacao@interno',
    nome: sessionStorage.getItem('nome'),
    pastaDrive: media.join(',')
  };

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await res.json();

  if (!data.success) {
    return showErrorToast('Erro ao salvar');
  }

  bootstrap.Modal.getInstance(createModal).hide();
  createForm.reset();
  loadRequests();
  showSuccessToast('Solicitação criada!');
}

/************* IMGBB *************/
async function uploadToImgBB(file) {
  const fd = new FormData();
  fd.append('key', IMGBB_API_KEY);
  fd.append('image', file);

  const res = await fetch('https://api.imgbb.com/1/upload', {
    method: 'POST',
    body: fd
  });

  const data = await res.json();
  return data?.data?.url || null;
}

/************* TOAST *************/
function showSuccessToast(msg) {
  document.querySelector('#toastSuccess .toast-body').textContent = msg;
  new bootstrap.Toast(toastSuccess).show();
}

function showErrorToast(msg) {
  document.querySelector('#toastError .toast-body').textContent = msg;
  new bootstrap.Toast(toastError).show();
}
