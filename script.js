const API_URL = "https://script.google.com/macros/s/AKfycbxrGUkQ2DQut4YA9bYBKNSoWTpC-8RHVZv9ynEYQ8NpT8luR_GM9a8tzDkuNDC-CeZ0Ow/exec";

async function criarSolicitacao() {
  const payload = {
    nome: document.getElementById("nome").value,
    email: document.getElementById("email").value,
    prioridade: document.getElementById("prioridade").value,
    descricao: document.getElementById("descricao").value,
    pastaDrive: ""
  };

  document.getElementById("msg").innerText = "Enviando...";

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!data.success) {
      document.getElementById("msg").innerText = "Erro: " + data.error;
      return;
    }

    document.getElementById("msg").innerText =
      "Solicitação criada com sucesso! ID: " + data.id;

  } catch (err) {
    document.getElementById("msg").innerText = "Erro ao conectar.";
    console.error(err);
  }
}
