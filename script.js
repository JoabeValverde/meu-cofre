// ---- CONFIGURAÇÃO DO SUPABASE ----
const SUPABASE_URL = "https://dqvsvzsmywoxtjgxvulj.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxdnN2enNteXdveHRqZ3h2dWxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2MTQ5NDYsImV4cCI6MjA3NTE5MDk0Nn0.tG1JqQTydWxfUbTJzYInCps6d8F-awQNjIPSP138iMo";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
// ---------------------------------

document.addEventListener("DOMContentLoaded", () => {
  const getElement = (id) => document.getElementById(id);

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
  const totalReceitasEl = getElement("total-receitas");
  const totalDespesasEl = getElement("total-despesas");
  const saldoAtualEl = getElement("saldo-atual");

  let transacoes =
    JSON.parse(localStorage.getItem("transacoes_meucofre")) || [];
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

  function salvarDados() {
    localStorage.setItem("transacoes_meucofre", JSON.stringify(transacoes));
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
    totalReceitasEl.textContent = formatarMoeda(receitas);
    totalDespesasEl.textContent = formatarMoeda(despesas);
    saldoAtualEl.textContent = formatarMoeda(saldo);
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
    const transacoesOrdenadas = transacoes.sort(
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
      }">✏️</button><button class="action-button" data-id="${
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
    const transacao = transacoes.find((t) => t.id === id);
    if (!transacao) return;
    idEmEdicao = id;
    tipoSelect.value = transacao.tipo;
    descricaoInput.value = transacao.descricao || "";
    subcategoriaInput.value = transacao.subcategoria || "";
    valorInput.value = transacao.valor;
    dataInput.value = transacao.data;
    formaPagamentoSelect.value = transacao.forma;
    statusSelect.value = transacao.status;

    tipoSelect.dispatchEvent(new Event("change"));
    setTimeout(() => {
      categoriaSelect.value = transacao.categoria;
    }, 0);

    formaPagamentoSelect.dispatchEvent(new Event("change"));
    setTimeout(() => {
      if (transacao.cartao) cartaoSelect.value = transacao.cartao;
    }, 0);

    getElement("btn-submit").textContent = "Salvar Alterações";
    form.scrollIntoView({ behavior: "smooth" });
  }

  function deletarTransacao(id) {
    if (confirm("Tem certeza?")) {
      transacoes = transacoes.filter((t) => t.id !== id);
      atualizarTudo();
    }
  }

  function atualizarTudo() {
    salvarDados();
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

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const valorTotal = parseFloat(valorInput.value);
    const numeroParcelas = parseInt(parcelasInput.value, 10);
    const formaPagamento = formaPagamentoSelect.value;

    if (idEmEdicao) {
      const index = transacoes.findIndex((t) => t.id === idEmEdicao);
      if (index !== -1) {
        transacoes[index] = {
          ...transacoes[index],
          tipo: tipoSelect.value,
          categoria: categoriaSelect.value,
          subcategoria: subcategoriaInput.value.trim(),
          descricao: descricaoInput.value.trim(),
          valor: valorTotal,
          data: dataInput.value,
          forma: formaPagamento,
          status: statusSelect.value,
          cartao:
            formaPagamento === "Cartão de crédito" ? cartaoSelect.value : null,
        };
      }
    } else if (formaPagamento === "Cartão de crédito" && numeroParcelas > 1) {
      const valorParcela = parseFloat((valorTotal / numeroParcelas).toFixed(2));
      const dataInicial = new Date(dataInput.value + "T03:00:00");
      let somaParcelas = 0;
      for (let i = 0; i < numeroParcelas; i++) {
        const dataParcela = new Date(dataInicial);
        dataParcela.setMonth(dataInicial.getMonth() + i);
        let valorDaParcelaAtual = valorParcela;
        somaParcelas += valorParcela;
        if (i === numeroParcelas - 1) {
          valorDaParcelaAtual += valorTotal - somaParcelas;
        }
        transacoes.push({
          id: Date.now() + i,
          tipo: "Despesa",
          categoria: categoriaSelect.value,
          subcategoria: subcategoriaInput.value.trim(),
          descricao: `${descricaoInput.value.trim() || "Parcelado"} (${
            i + 1
          }/${numeroParcelas})`,
          valor: parseFloat(valorDaParcelaAtual.toFixed(2)),
          data: dataParcela.toISOString().split("T")[0],
          forma: formaPagamento,
          status: "Pendente",
          cartao: cartaoSelect.value,
        });
      }
    } else {
      transacoes.push({
        id: Date.now(),
        tipo: tipoSelect.value,
        categoria: categoriaSelect.value,
        subcategoria: subcategoriaInput.value.trim(),
        descricao: descricaoInput.value.trim(),
        valor: valorTotal,
        data: dataInput.value,
        forma: formaPagamento,
        status: statusSelect.value,
        cartao:
          formaPagamento === "Cartão de crédito" ? cartaoSelect.value : null,
      });
    }

    idEmEdicao = null;
    form.reset();
    getElement("btn-submit").textContent = "Adicionar Transação";
    formaPagamentoSelect.dispatchEvent(new Event("change"));
    atualizarTudo();
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
    } else {
      deletarTransacao(id);
    }
  });

  atualizarTudo();
  if (dataInput) dataInput.valueAsDate = new Date();
});
