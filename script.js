const API_URL = "https://script.google.com/macros/s/AKfycbxVFFoQ6iOX9ZUBDTBYtaL9HtSeB8zOqzQLhx9YlzI0GYUj_wXC9Cdt_mh3789z1IO0KQ/exec";

document.getElementById("form").addEventListener("submit", enviar);
carregar();

async function enviar(e) {
  e.preventDefault();

  const descricao = document.getElementById("descricao").value;
  const prioridade = document.getElementById("prioridade").value;
  const imagens = document.getElementById("imagens").files;

  let midias = [];

  for (const img of imagens) {
    const url = await uploadImg(img);
    if (url) midias.push(url);
  }

  const payload = {
    descricao,
    prioridade,
    nome: "Equipe Comunicação",
    email: "comunicacao@interno",
    midias: midias.join(",")
  };

  const form = new FormData();
  form.append("data", JSON.stringify(payload));

  const res = await fetch(API_URL, {
    method: "POST",
    body: form
  });

  const json = await res.json();

  if (json.success) {
    alert("Salvo com sucesso");
    document.getElementById("form").reset();
    carregar();
  } else {
    alert("Erro: " + json.error);
  }
}

async function carregar() {
  const res = await fetch(API_URL);
  const data = await res.json();

  const ul = document.getElementById("lista");
  ul.innerHTML = "";

  data.forEach(r => {
    const li = document.createElement("li");
    li.textContent = `${r["Descrição"]} - ${r["Status"]}`;
    ul.appendChild(li);
  });
}

async function uploadImg(file) {
  const fd = new FormData();
  fd.append("key", "SUA_CHAVE_IMGBB");
  fd.append("image", file);

  const res = await fetch("https://api.imgbb.com/1/upload", {
    method: "POST",
    body: fd
  });

  const json = await res.json();
  return json?.data?.url || null;
}
