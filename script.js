// ---- CONFIGURAÇÃO DO SUPABASE ----
const SUPABASE_URL = "https://dqvsvzsmywoxtjgxvulj.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxdnN2enNteXdveHRqZ3h2dWxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2MTQ5NDYsImV4cCI6MjA3NTE5MDk0Nn0.tG1JqQTydWxfUbTJzYInCps6d8F-awQNjIPSP138iMo";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
// ---------------------------------

document.addEventListener("DOMContentLoaded", () => {
  const getElement = (id) => document.getElementById(id);

  // --- SELEÇÃO DE ELEMENTOS DO DOM ---
  const appSection = getElement("app-section");
  const authSection = getElement("auth-section");
  const loginView = getElement("login-view");
  const signupView = getElement("signup-view");
  const showSignup = getElement("show-signup");
  const showLogin = getElement("show-login");

  const form = getElement("form-transacao");
  const tipoSelect = getElement("tipo");
  const categoriaSelect = getElement("categoria");
  const subcategoriaInput = getElement("subcategoria");
  const descricaoInput = getElement("descricao");
  const valorInput = getElement("valor");
  const dataInput = getElement("data");
  const formaPagamentoSelect = getElement("forma");
  const parcelasGroup = getElement("group-parcelas");
  const parcelasInput = getElement("parcelas");
  const cartaoGroup = getElement("group-cartao");
  const cartaoSelect = getElement("cartao");
  const statusSelect = getElement("status");
  const listaTransacoes = getElement("lista-transacoes");

  let transacoes = [];
  let config = {
    receitas: [
      "Salário PMI",
      "Salário Ligmax",
      "Extra Ligmax",
      "Freelance",
      "Vendas",
      "Outros",
    ],
    despesas: [
      "Alimentação",
      "Transporte",
      "Moradia",
      "Lazer",
      "Saúde",
      "Outros",
    ],
    cartoes: ["Nubank", "Bradesco", "Caixa", "Mercado Pago", "Digio"],
  };
  let idEmEdicao = null;
  let meuGraficoDespesas = null;
  let meuGraficoReceitas = null;

  // --- FUNÇÕES ---

  function checkUserSession(session) {
    if (session) {
      appSection.classList.remove("hidden");
      authSection.classList.add("hidden");
      atualizarTudo();
    } else {
      appSection.classList.add("hidden");
      authSection.classList.remove("hidden");
    }
  }

  function formatarMoeda(valor) {
    return typeof valor !== "number"
      ? "R$ 0,00"
      : valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function atualizarDashboard() {
    const transacoesConcluidas = transacoes.filter(
      (t) => t.status === "Concluído"
    );
    const receitas = transacoesConcluidas
      .filter((t) => t.tipo === "Receita")
      .reduce((acc, t) => acc + t.valor, 0);
    const despesas = transacoesConcluidas
      .filter((t) => t.tipo === "Despesa")
      .reduce((acc, t) => acc + t.valor, 0);
    const saldo = receitas - despesas;
    getElement("total-receitas").textContent = formatarMoeda(receitas);
    getElement("total-despesas").textContent = formatarMoeda(despesas);
    getElement("saldo-atual").textContent = formatarMoeda(saldo);
  }

  function atualizarGrafico(ctx, chartInstance, tipo) {
    const dados = transacoes.filter(
      (t) => t.tipo === tipo && t.status === "Concluído"
    );
    const dataMap = dados.reduce((acc, t) => {
      acc[t.categoria] = (acc[t.categoria] || 0) + t.valor;
      return acc;
    }, {});
    const labels = Object.keys(dataMap);
    const dataValues = Object.values(dataMap);
    const colors =
      tipo === "Receita"
        ? ["#4CAF50", "#8BC34A", "#00BCD4", "#03A9F4", "#2196F3"]
        : ["#F44336", "#E91E63", "#9C27B0", "#673AB7", "#3F51B5"];
    if (chartInstance) chartInstance.destroy();
    if (labels.length === 0) {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      return null;
    }
    return new Chart(ctx, {
      type: "pie",
      data: {
        labels,
        datasets: [
          { data: dataValues, backgroundColor: colors, hoverOffset: 4 },
        ],
      },
      options: { plugins: { legend: { display: false } } },
    });
  }

  function renderizarTransacoes() {
    listaTransacoes.innerHTML = "";
    if (transacoes.length === 0) {
      listaTransacoes.innerHTML =
        '<tr><td colspan="10" style="text-align:center; padding: 20px;">Nenhuma transação encontrada.</td></tr>';
      return;
    }
    const transacoesOrdenadas = [...transacoes].sort(
      (a, b) => new Date(b.data) - new Date(a.data)
    );
    transacoesOrdenadas.forEach((t) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${t.tipo}</td><td>${t.descricao || ""}</td><td>${
        t.categoria
      }</td><td>${t.subcategoria || ""}</td><td>${formatarMoeda(
        t.valor
      )}</td><td>${new Date(t.data + "T00:00:00").toLocaleDateString(
        "pt-BR"
      )}</td><td>${t.forma}</td><td>${
        t.cartao || "N/A"
      }</td><td><span class="status-${t.status
        .toLowerCase()
        .replace("í", "i")}">${
        t.status
      }</span></td><td><button class="action-button edit-button" data-id="${
        t.id
      }">✏️</button><button class="action-button delete-button" data-id="${
        t.id
      }">🗑️</button></td>`;
      listaTransacoes.appendChild(tr);
    });
  }

  function popularSelects() {
    const tipoAtual = tipoSelect.value;
    const categorias =
      tipoAtual === "Receita" ? config.receitas : config.despesas;
    categoriaSelect.innerHTML = "";
    categorias.forEach((cat) => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat;
      categoriaSelect.appendChild(opt);
    });
    cartaoSelect.innerHTML = '<option value="">Nenhum</option>';
    config.cartoes.forEach((cartao) => {
      const opt = document.createElement("option");
      opt.value = cartao;
      opt.textContent = cartao;
      cartaoSelect.appendChild(opt);
    });
  }

  function prepararEdicao(id) {
    /* ...código sem alteração... */
  }
  function deletarTransacao(id) {
    /* ...código sem alteração... */
  }

  function atualizarTudo() {
    atualizarDashboard();
    renderizarTransacoes();
    popularSelects();
    meuGraficoDespesas = atualizarGrafico(
      getElement("graficoDespesas").getContext("2d"),
      meuGraficoDespesas,
      "Despesa"
    );
    meuGraficoReceitas = atualizarGrafico(
      getElement("graficoReceitas").getContext("2d"),
      meuGraficoReceitas,
      "Receita"
    );
  }

  // --- LISTENERS DE EVENTOS ---
  if (showSignup) {
    showSignup.addEventListener("click", (e) => {
      e.preventDefault();
      loginView.classList.add("hidden");
      signupView.classList.remove("hidden");
    });
  }

  if (showLogin) {
    showLogin.addEventListener("click", (e) => {
      e.preventDefault();
      signupView.classList.add("hidden");
      loginView.classList.remove("hidden");
    });
  }

  form.addEventListener("submit", (e) => {
    /* ...código antigo do localStorage, por enquanto... */
  });
  tipoSelect.addEventListener("change", popularSelects);
  formaPagamentoSelect.addEventListener("change", () => {
    const isCartao = formaPagamentoSelect.value === "Cartão de crédito";
    cartaoGroup.style.display = isCartao ? "flex" : "none";
    parcelasGroup.classList.toggle("hidden", !isCartao);
  });
  listaTransacoes.addEventListener("click", (e) => {
    const target = e.target.closest(".action-button");
    if (!target) return;
    const id = parseInt(target.dataset.id, 10);
    if (target.classList.contains("edit-button")) {
      prepararEdicao(id);
    } else if (target.classList.contains("delete-button")) {
      deletarTransacao(id);
    }
  });

  // --- INICIALIZAÇÃO ---
  supabaseClient.auth.onAuthStateChange((event, session) => {
    console.log(`Evento de autenticação: ${event}`);
    checkUserSession(session);
  });
});
