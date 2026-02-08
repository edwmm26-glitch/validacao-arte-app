/************* CONFIG *************/
const SHEET_ID = '1mv2lrB_C5YF9bKeVjW1QKhxD7y-6jSZkPgQmKiuMIXA';
const API_KEY = 'AIzaSyAbtKINtBgTDdhnM3BemIFsiVAyxG6MfJs';
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
    document.getElementById('loginPage').classList.add('d-none');
    document.getElementById('mainPage').classList.remove('d-none');
    renderContent();
    loadRequests();
  }

  document.getElementById('loginForm')?.addEventListener('submit', login);
  document.getElementById('createForm')?.addEventListener('submit', createSolicitacao);
  document.getElementById('btnReprovar')?.addEventListener('click', confirmarReprovacao);
});

/************* LOGIN *************/
function login(e) {
  e.preventDefault();

  const login = document.getElementById('loginInput').value.trim().toLowerCase();
  const senha = document.getElementById('senhaInput').value.trim();
  const user = USUARIOS[login];

  if (user && user.senha === senha) {
    sessionStorage.setItem('role', user.role);
    sessionStorage.setItem('nome', user.nome);

    document.getElementById('loginPage').classList.add('d-none');
    document.getElementById('mainPage').classList.remove('d-none');

    renderContent();
    loadRequests();
    showSuccessToast(`Bem-vindo, ${user.nome}!`);
  } else {
    document.getElementById('loginError').textContent = 'Login ou senha inválidos';
    document.getElementById('loginError').classList.remove('d-none');
  }
}

function logout() {
  sessionStorage.clear();
  location.reload();
}

/************* UI *************/
function renderContent() {
  const content = document.getElementById('content');
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
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Solicitacoes!A:K?key=${API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Erro ao ler planilha');

    const data = await res.json();
    const rows = data.values?.slice(1) || [];

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

    rows.forEach(row => {
      const desc = row[1] || '';
      const curta = desc.length > 60 ? desc.slice(0, 57) + '...' : desc;

      html += `
        <tr>
          <td>${row[0] || '-'}</td>
          <td title="${desc}">${curta}</td>
          <td>${row[2] || '-'}</td>
          <td>${row[3] || 'Aguardando'}</td>
          <td>${row[5] || '-'}</td>
          <td>${row[6] || '-'}</td>
          <td>`;

      if (sessionStorage.getItem('role') === 'Juridico' && row[3] === 'Aguardando') {
        html += `
          <button class="btn btn-sm btn-primary me-1" onclick="aprovar('${row[0]}')">Aprovar</button>
          <button class="btn btn-sm btn-danger me-1" onclick="mostrarJustificativa('${row[0]}')">Reprovar</button>`;
      }

      html += `
          <button class="btn btn-sm btn-outline-info" onclick="verMidia('${row[10] || ''}')">Ver Mídia</button>
          </td>
        </tr>`;
    });

    html += '</tbody></table>';
    document.getElementById('tableArea').innerHTML = html;

  } catch (e) {
    showErrorToast(e.message);
  }
}

/************* CRIAR *************/
async function createSolicitacao(e) {
  e.preventDefault();

  const desc = descricao.value.trim();
  const prio = prioridade.value;
  const imgs = imagens.files;
  const vid = video.files;

  if (!desc) return showErrorToast('Descrição obrigatória');

  const media = [];

  for (const f of imgs) {
    const url = await uploadToImgBB(f);
    if (url) media.push(url);
  }

  if (vid.length) {
    const url = await uploadToImgBB(vid[0]);
    if (url) media.push(url);
  }

  const row = [
    Date.now(),
    desc,
    prio,
    'Aguardando',
    '',
    sessionStorage.getItem('nome'),
    new Date().toLocaleString('pt-BR'),
    '',
    '',
    '',
    media.join(',')
  ];

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Solicitacoes!A:K:append?valueInputOption=RAW&key=${API_KEY}`;

  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ values: [row] })
  });

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

/************* AÇÕES *************/
function aprovar(id) {
  showSuccessToast(`Aprovado ID ${id}`);
}

function mostrarJustificativa(id) {
  currentId = id;
  new bootstrap.Modal(justifyModal).show();
}

function confirmarReprovacao() {
  showSuccessToast(`Reprovado ID ${currentId}`);
  bootstrap.Modal.getInstance(justifyModal).hide();
}

/************* MÍDIA *************/
function verMidia(str) {
  if (!str) return showErrorToast('Sem mídia');
  const gallery = document.getElementById('gallery');
  gallery.innerHTML = '';

  str.split(',').forEach(url => {
    gallery.innerHTML += `
      <div class="col-md-4 mb-3">
        <img src="${url}" class="img-fluid rounded">
      </div>`;
  });

  new bootstrap.Modal(mediaModal).show();
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
