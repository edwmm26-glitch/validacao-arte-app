const API_URL = "https://script.google.com/macros/s/AKfycbzqKPGVkMtRWyChtI4jB_0kt1IKn-wOUPoN_eHXTYQwQ1rvrtmqrsuvGtaxEtl7RTHuGQ/exec";
const IMGBB_API_KEY = "253ceec16b75eac72edeeb76a5a7fd48";

const USUARIOS = {
  comunicacao: { senha: "Com123", nome: "Comunicação" },
  juridico: { senha: "Jur456", nome: "Jurídico" }
};

let NOME = "";

document.getElementById("loginForm").onsubmit = e => {
  e.preventDefault();
  const u = loginInput.value.toLowerCase();
  const s = senhaInput.value;

  if (!USUARIOS[u] || USUARIOS[u].senha !== s) {
    loginError.textContent = "Login inválido";
    loginError.classList.remove("d-none");
    return;
  }

  NOME = USUARIOS[u].nome;
  loginPage.classList.add("d-none");
  mainPage.classList.remove("d-none");
  carregar();
};

async function carregar() {
  const r = await fetch(API_URL);
  const dados = await r.json();

  let html = `<table class="table">
    <tr><th>Descrição</th><th>Prioridade</th><th>Status</th><th>Ações</th></tr>`;

  dados.forEach(d => {
    html += `
      <tr>
        <td>${d.Descrição}</td>
        <td>${d.Prioridade}</td>
        <td>${d.Status}</td>
        <td>
          <button class="btn btn-sm btn-info"
            onclick="verMidias('${d.Midias || ""}')">Mídias</button>
        </td>
      </tr>`;
  });

  html += "</table>";
  tableArea.innerHTML = html;
}

createForm.onsubmit = async e => {
  e.preventDefault();

  let midias = [];

  for (let f of imagens.files) midias.push(await upload(f));
  if (video.files[0]) midias.push(await upload(video.files[0]));

  const fd = new FormData();
  fd.append("action", "create");
  fd.append("data", JSON.stringify({
    descricao: descricao.value,
    prioridade: prioridade.value,
    nome: NOME,
    midias: midias.join(",")
  }));

  await fetch(API_URL, { method: "POST", body: fd });
  bootstrap.Modal.getInstance(createModal).hide();
  createForm.reset();
  carregar();
};

async function upload(file) {
  const fd = new FormData();
  fd.append("key", IMGBB_API_KEY);
  fd.append("image", file);
  const r = await fetch("https://api.imgbb.com/1/upload", { method:"POST", body:fd });
  return (await r.json()).data.url;
}

function verMidias(str) {
  gallery.innerHTML = "";
  videoPlayer.classList.add("d-none");

  str.split(",").forEach(u => {
    if (u.includes(".mp4")) {
      videoPlayer.src = u;
      videoPlayer.classList.remove("d-none");
    } else {
      gallery.innerHTML += `<div class="col-md-4"><img src="${u}" class="img-fluid"></div>`;
    }
  });

  new bootstrap.Modal(mediaModal).show();
}

function logout() {
  location.reload();
}

