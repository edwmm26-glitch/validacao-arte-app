const SHEET_ID = '1mv2lrB_C5YF9bKeVjW1QKhxD7y-6jSZkPgQmKiuMIXA'; // ID da sua planilha
const API_KEY = 'AIzaSyAbtKINtBgTDdhnM3BemIFsiVAyxG6MfJs'; // Sua chave Google Sheets API
const IMGBB_API_KEY = '253ceec16b75eac72edeeb76a5a7fd48'; // Sua chave ImgBB

const USUARIOS = {
  'comunicacao': { senha: 'Com123', role: 'Comunicacao', nome: 'Equipe Comunicação' },
  'juridico': { senha: 'Jur456', role: 'Juridico', nome: 'Equipe Jurídico' }
};

let currentId = null; // Para justificativa

document.addEventListener('DOMContentLoaded', () => {
  const savedRole = sessionStorage.getItem('role');
  if (savedRole) {
    document.getElementById('loginPage').classList.add('d-none');
    document.getElementById('mainPage').classList.remove('d-none');
    renderContent();
    loadRequests();
  }

  // Login
  document.getElementById('loginForm')?.addEventListener('submit', e => {
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
  });

  // Form de criação
  document.getElementById('createForm')?.addEventListener('submit', createSolicitacao);

  // Botão reprovar
  document.getElementById('btnReprovar')?.addEventListener('click', confirmarReprovacao);
});

function logout() {
  sessionStorage.clear();
  document.getElementById('mainPage').classList.add('d-none');
  document.getElementById('loginPage').classList.remove('d-none');
  document.getElementById('loginForm').reset();
  document.getElementById('loginError').classList.add('d-none');
  showSuccessToast('Sessão encerrada');
}

function renderContent() {
  const content = document.getElementById('content');
  let html = '';
  if (sessionStorage.getItem('role') === 'Comunicacao') {
    html += '<button class="btn btn-success mb-3" data-bs-toggle="modal" data-bs-target="#createModal">+ Nova Solicitação</button>';
  }
  html += '<div id="tableArea" class="card border-0 shadow-sm"><div class="card-body text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-3">Carregando solicitações...</p></div></div>';
  content.innerHTML = html;
}

async function loadRequests() {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Solicitacoes!A:K?key=${API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Erro ao carregar dados da planilha');
    const data = await response.json();
    const rows = data.values?.slice(1) || [];
    let html = '<table class="table table-striped table-hover"><thead><tr><th>ID</th><th>Descrição</th><th>Prioridade</th><th>Status</th><th>Solicitante</th><th>Criação</th><th>Ações</th></tr></thead><tbody>';
    if (rows.length === 0) {
      html += '<tr><td colspan="7" class="text-center py-5 text-muted">Nenhuma solicitação encontrada.</td></tr>';
    } else {
      rows.forEach(row => {
        const descCurta = row[1]?.length > 60 ? row[1].substring(0,57) + '...' : row[1] || '';
        html += `<tr>
          <td>${row[0] || '-'}</td>
          <td title="${row[1] || ''}">${descCurta}</td>
          <td>${row[2] || '-'}</td>
          <td>${row[3] || 'Aguardando'}</td>
          <td>${row[5] || '-'}</td>
          <td>${row[6] || '-'}</td>
          <td>`;
        if (sessionStorage.getItem('role') === 'Juridico' && row[3] === 'Aguardando') {
          html += `
            <button class="btn btn-primary btn-sm me-1" onclick="aprovar('${row[0]}')">Aprovar</button>
            <button class="btn btn-danger btn-sm me-1" onclick="mostrarJustificativa('${row[0]}')">Reprovar</button>`;
        }
        html += `<button class="btn btn-outline-info btn-sm" onclick="verMidia('${row[10] || ''}')">Ver Mídia</button></td></tr>`;
      });
    }
    html += '</tbody></table>';
    document.getElementById('tableArea').innerHTML = html;
  } catch (e) {
    showErrorToast('Erro ao carregar solicitações: ' + e.message);
  }
}

async function createSolicitacao(e) {
  e.preventDefault();
  const desc = document.getElementById('descricao').value.trim();
  const prio = document.getElementById('prioridade').value;
  const imgs = document.getElementById('imagens').files;
  const vid = document.getElementById('video').files;

  if (!desc) return showErrorToast('Descrição obrigatória');
  if (imgs.length > 6) return showErrorToast('Máx 6 imagens');
  if (vid.length > 1) return showErrorToast('Máx 1 vídeo');

  showSuccessToast('Enviando solicitação... aguarde');

  const mediaUrls = [];

  // Upload imagens
  for (let file of imgs) {
    const url = await uploadToImgBB(file);
    if (url) mediaUrls.push(url);
  }

  // Upload vídeo
  if (vid.length) {
    const url = await uploadToImgBB(vid[0]);
    if (url) mediaUrls.push(url);
  }

  // Salvar na planilha
  const newRow = [
    Date.now(),
    desc,
    prio,
    'Aguardando',
    'N/A',
    sessionStorage.getItem('nome') || 'Usuário',
    new Date().toLocaleString('pt-BR'),
    '',
    '',
    '',
    mediaUrls.join(',')  // links separados por vírgula
  ];

  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Solicitacoes!A:K:append?valueInputOption=RAW&key=${API_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [newRow] })
    });

    if (response.ok) {
      showSuccessToast('Solicitação criada com sucesso!');
      bootstrap.Modal.getInstance(document.getElementById('createModal')).hide();
      document.getElementById('createForm').reset();
      loadRequests();
    } else {
      const err = await response.json();
      showErrorToast('Erro ao salvar na planilha: ' + (err.error?.message || 'Desconhecido'));
    }
  } catch (e) {
    showErrorToast('Erro na conexão com a planilha: ' + e.message);
  }
}

async function uploadToImgBB(file) {
  const formData = new FormData();
  formData.append('key', IMGBB_API_KEY);
  formData.append('image', file);
  formData.append('expiration', '0'); // nunca expira

  try {
    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData
    });
    const data = await response.json();
    if (data.success) {
      return data.data.url;
    } else {
      showErrorToast('Erro ao enviar arquivo para ImgBB: ' + (data.error?.message || 'Desconhecido'));
      return null;
    }
  } catch (e) {
    showErrorToast('Erro ao conectar com ImgBB: ' + e.message);
    return null;
  }
}

// Aprovar (simples por agora)
function aprovar(id) {
  showSuccessToast(`Aprovado ID ${id}`);
  loadRequests();
}

// Reprovar
function mostrarJustificativa(id) {
  currentId = id;
  new bootstrap.Modal(document.getElementById('justifyModal')).show();
}

function confirmarReprovacao() {
  const just = document.getElementById('justificativa').value.trim();
  if (!just) return showErrorToast('Justificativa obrigatória');
  showSuccessToast(`Reprovado ID ${currentId} - Justificativa: ${just}`);
  bootstrap.Modal.getInstance(document.getElementById('justifyModal')).hide();
  loadRequests();
}

// Ver Mídia
function verMidia(mediaString) {
  if (!mediaString) return showErrorToast('Nenhuma mídia associada');
  const urls = mediaString.split(',');
  const gallery = document.getElementById('gallery');
  gallery.innerHTML = '';
  urls.forEach(url => {
    if (url.endsWith('.mp4') || url.endsWith('.webm') || url.includes('video')) {
      document.getElementById('videoPlayer').src = url;
      document.getElementById('videoPlayer').style.display = 'block';
    } else {
      gallery.innerHTML += `<div class="col-md-4 mb-3"><img src="${url}" class="gallery-img" loading="lazy"></div>`;
    }
  });
  new bootstrap.Modal(document.getElementById('mediaModal')).show();
}

function showSuccessToast(msg) {
  const toast = new bootstrap.Toast(document.getElementById('toastSuccess'));
  document.getElementById('toastSuccess').querySelector('.toast-body').textContent = msg;
  toast.show();
}

function showErrorToast(msg) {
  const toast = new bootstrap.Toast(document.getElementById('toastError'));
  document.getElementById('toastError').querySelector('.toast-body').textContent = msg;
  toast.show();
}
