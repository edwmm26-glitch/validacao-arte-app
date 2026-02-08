/************* CONFIG *************/
const API_URL = "https://script.google.com/macros/s/AKfycbzrbK0RJMBy9qzA5V1HaY37dRkL7PJLUEJ9Tp8HeGNN8cvzsTMDQH-2elg5ECIgv4iTxg/exec";

/************* USUÁRIOS *************/
const USUARIOS = {
  comunicacao: {
    senha: "Com123",
    role: "COM",
    nome: "Equipe Comunicação"
  },
  juridico: {
    senha: "Jur456",
    role: "JUR",
    nome: "Equipe Jurídico"
  }
};

let ROLE = null;
let NOME = null;

/************* LOGIN *************/
(function loginInicial() {
  const usuario = prompt("Usuário (comunicacao ou juridico):");
  const senha = prompt("Senha:");

  if (
    !usuario ||
    !senha ||
    !USUARIOS[usuario] ||
    USUARIOS[usuario].senha !== senha
  ) {
    alert("Login inválido");
    location.reload();
    return;
  }

  ROLE = USUARIOS[usuario].role;
  NOME = USUARIOS[usuario].nome;

  if (ROLE === "JUR") {
    document.querySelector("form").style.display = "none";
  }

  carregarSolicitacoes();
})();

/************* CRIAR SOLICITAÇÃO *************/
document.getElementById("form").addEventListener("submit", async e => {
  e.preventDefault();

  if (ROLE !== "COM") {
    alert("Apenas Comunicação pode criar solicitações");
    return;
  }

  const descricao = document.getElementById("descricao").value.trim();
  const prioridade = document.getElementById("prioridade").value;

  if (!descricao) {
    alert("Descrição obrigatória");
    return;
  }

  const fd = new FormData();
  fd.append("action", "create");
  fd.append(
    "data",
    JSON.stringify({
      descricao,
      prioridade,
      nome: NOME,
      email: "interno@prefeitura",
      midias: ""
    })
  );

  const res = await fetch(API_URL, { method: "POST", body: fd });
  const json = await res.json();

  if (!json.success) {
    alert("Erro ao salvar");
    return;
  }

  document.getElementById("form").reset();
  carregarSolicitacoes();
});

/************* LISTAR *************/
async function carregarSolicitacoes() {
  const res = await fetch(API_URL);
  const dados = await res.json();

  const lista = document.getElementById("lista");
  lista.innerHTML = "";

  dados.forEach(r => {
    if (ROLE === "JUR" && r.Status !== "Pendente") return;

    const li = document.createElement("li");
    li.style.marginBottom = "10px";

    li.innerHTML = `
      <strong>${r["Descrição"]}</strong><br>
      Prioridade: ${r.Prioridade}<br>
      Status: <b>${r.Status}</b><br>
      Solicitante: ${r["Solicitante Nome"]}<br>
    `;

    if (ROLE === "JUR" && r.Status === "Pendente") {
      const btnAprovar = document.createElement("button");
      btnAprovar.textContent = "Aprovar";
      btnAprovar.onclick = () => atualizarStatus(r.ID, "Aprovado", "");

      const btnReprovar = document.createElement("button");
      btnReprovar.textContent = "Reprovar";
      btnReprovar.style.marginLeft = "5px";
      btnReprovar.onclick = () => {
        const j = prompt("Justificativa:");
        if (j) atualizarStatus(r.ID, "Reprovado", j);
      };

      li.appendChild(document.createElement("br"));
      li.appendChild(btnAprovar);
      li.appendChild(btnReprovar);
    }

    lista.appendChild(li);
  });
}

/************* ATUALIZAR STATUS *************/
async function atualizarStatus(id, status, justificativa) {
  const fd = new FormData();
  fd.append("action", "update");
  fd.append(
    "data",
    JSON.stringify({
      id,
      status,
      avaliadoPor: NOME,
      justificativa
    })
  );

  await fetch(API_URL, { method: "POST", body: fd });
  carregarSolicitacoes();
}
