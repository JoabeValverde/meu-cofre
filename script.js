// ---- CONFIGURAÇÃO DO SUPABASE ----
const SUPABASE_URL = 'https://dqvsvzsmywoxtjgxvulj.supabase.co'; // Mantenha sua URL que já estava aqui
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxdnN2enNteXdveHRqZ3h2dWxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2MTQ5NDYsImV4cCI6MjA3NTE5MDk0Nn0.tG1JqQTydWxfUbTJzYInCps6d8F-awQNjIPSP138iMo'; // Mantenha sua chave que já estava aqui

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
// ---------------------------------

document.addEventListener("DOMContentLoaded", () => {
  // --- FUNÇÃO DE AUXÍLIO ---
  // AQUI ESTÁ A FUNÇÃO QUE ESTAVA FALTANDO
  const getElement = (id) => {
    const element = document.getElementById(id);
    if (!element) {
      console.error(
        `ERRO CRÍTICO: Elemento com ID '${id}' não foi encontrado no HTML.`
      );
      return null;
    }
    return element;
  };

  // --- SELEÇÃO DE ELEMENTOS DO DOM ---
  const form = getElement("form-transacao");
  const tipoSelect = getElement("tipo");
  const categoriaSelect = getElement("categoria");
  const subcategoriaInput = getElement("subcategoria");
  const valorInput = getElement("valor");
  const dataInput = getElement("data");
  const formaPagamentoSelect = getElement("forma");
  const cartaoGroup = getElement("group-cartao");
  const cartaoSelect = getElement("cartao");
  const statusSelect = getElement("status");
  const listaTransacoes = getElement("lista-transacoes");
  const btnSubmit = getElement("btn-submit");
  const btnConfig = getElement("btn-config");
  const configSection = getElement("config-section");
  const totalReceitasEl = getElement("total-receitas");
  const totalDespesasEl = getElement("total-despesas");
  const saldoAtualEl = getElement("saldo-atual");
  const filtroTipo = getElement("filtro-tipo");
  const filtroCartao = getElement("filtro-cartao");

  // --- ESTADO DA APLICAÇÃO (DADOS) ---
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
  let meuGrafico = null;
  let meuGraficoReceitas = null;

  // --- FUNÇÕES ---
  const carregarTransacoes = async () => {
    const { data, error } = await supabaseClient
      .from("transacoes")
      .select("*")
      .order("data", { ascending: false });

    if (error) {
      console.error("Erro ao buscar transações do Supabase:", error);
      alert("Não foi possível carregar os dados. Verifique o console (F12).");
    } else {
      transacoes = data;
      atualizarTudo();
    }
  };

  const formatarMoeda = (valor) => {
    if (typeof valor !== "number") return "R$ 0,00";
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const atualizarDashboard = () => {
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
    saldoAtualEl.style.color =
      saldo < 0 ? "var(--secondary-color)" : "var(--accent-color)";
  };

  const atualizarGrafico = (idCanvas, tipoTransacao, cores) => {
    const canvas = getElement(idCanvas);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const transacoesFiltradas = transacoes.filter(
      (t) => t.tipo === tipoTransacao && t.status === "Concluído"
    );
    const dadosPorCategoria = {};
    transacoesFiltradas.forEach((t) => {
      dadosPorCategoria[t.categoria] =
        (dadosPorCategoria[t.categoria] || 0) + t.valor;
    });
    const labels = Object.keys(dadosPorCategoria);
    const dataValues = Object.values(dadosPorCategoria);
    let graficoExistente =
      tipoTransacao === "Despesa" ? meuGrafico : meuGraficoReceitas;
    if (graficoExistente) graficoExistente.destroy();
    if (labels.length === 0) {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      return;
    }
    const novoGrafico = new Chart(ctx, {
      type: "pie",
      data: {
        labels,
        datasets: [
          {
            label: `${tipoTransacao}s por Categoria`,
            data: dataValues,
            backgroundColor: cores,
            hoverOffset: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "top" } },
      },
    });
    if (tipoTransacao === "Despesa") {
      meuGrafico = novoGrafico;
    } else {
      meuGraficoReceitas = novoGrafico;
    }
  };

  const renderizarTransacoes = () => {
    if (!listaTransacoes) return;
    listaTransacoes.innerHTML = "";
    if (!transacoes || transacoes.length === 0) {
      listaTransacoes.innerHTML =
        '<tr><td colspan="9" style="text-align:center; padding: 20px;">Nenhuma transação encontrada.</td></tr>';
      return;
    }
    transacoes.forEach((t) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
                <td class="tipo-${t.tipo}">${t.tipo}</td><td>${
        t.categoria
      }</td><td>${t.subcategoria || ""}</td>
                <td>${formatarMoeda(t.valor)}</td><td>${new Date(
        t.data + "T00:00:00"
      ).toLocaleDateString("pt-BR")}</td>
                <td>${t.forma}</td><td>${t.cartao || "N/A"}</td>
                <td><span class="status-${t.status
                  .toLowerCase()
                  .replace("í", "i")}">${t.status}</span></td>
                <td>
                    <button class="action-button edit-button" onclick="prepararEdicao(${
                      t.id
                    })">✏️</button>
                    <button class="action-button" onclick="deletarTransacao(${
                      t.id
                    })">🗑️</button>
                </td>`;
      listaTransacoes.appendChild(tr);
    });
  };

  const popularSelects = () => {
    if (!tipoSelect || !categoriaSelect || !cartaoSelect) return;
    const tipoAtual = tipoSelect.value;
    const categorias =
      tipoAtual === "Receita" ? config.receitas : config.despesas;
    categoriaSelect.innerHTML = "";
    categorias.forEach((cat) => {
      const option = document.createElement("option");
      option.value = cat;
      option.textContent = cat;
      categoriaSelect.appendChild(option);
    });
    cartaoSelect.innerHTML = '<option value="">Nenhum</option>';
    if (filtroCartao)
      filtroCartao.innerHTML = '<option value="Todos">Todos</option>';
    config.cartoes.forEach((cartao) => {
      const optionForm = document.createElement("option");
      optionForm.value = cartao;
      optionForm.textContent = cartao;
      cartaoSelect.appendChild(optionForm.cloneNode(true));
      if (filtroCartao) filtroCartao.appendChild(optionForm);
    });
  };

  window.prepararEdicao = (id) => {
    const transacao = transacoes.find((t) => t.id === id);
    if (!transacao) return;
    tipoSelect.value = transacao.tipo;
    tipoSelect.dispatchEvent(new Event("change"));
    categoriaSelect.value = transacao.categoria;
    subcategoriaInput.value = transacao.subcategoria || "";
    valorInput.value = transacao.valor;
    dataInput.value = transacao.data;
    formaPagamentoSelect.value = transacao.forma;
    formaPagamentoSelect.dispatchEvent(new Event("change"));
    if (transacao.cartao) cartaoSelect.value = transacao.cartao;
    statusSelect.value = transacao.status;
    idEmEdicao = id;
    btnSubmit.textContent = "Salvar Alterações";
    form.scrollIntoView({ behavior: "smooth" });
  };

  const cancelarEdicao = () => {
    idEmEdicao = null;
    form.reset();
    dataInput.valueAsDate = new Date();
    btnSubmit.textContent = "Adicionar Transação";
    formaPagamentoSelect.dispatchEvent(new Event("change"));
    tipoSelect.dispatchEvent(new Event("change"));
  };

  window.deletarTransacao = async (id) => {
    if (confirm("Tem certeza que deseja deletar esta transação?")) {
      const { error } = await supabaseClient
        .from("transacoes")
        .delete()
        .eq("id", id);
      if (error) {
        console.error("Erro ao deletar:", error);
        alert("Não foi possível deletar a transação.");
      } else {
        await carregarTransacoes();
      }
    }
  };

  const atualizarTudo = () => {
    if (!document.body.isConnected) return;
    atualizarDashboard();
    renderizarTransacoes();
    popularSelects();
    atualizarGrafico("graficoDespesas", "Despesa", [
      "#F44336",
      "#E91E63",
      "#9C27B0",
      "#673AB7",
      "#3F51B5",
    ]);
    atualizarGrafico("graficoReceitas", "Receita", [
      "#4CAF50",
      "#8BC34A",
      "#00BCD4",
      "#03A9F4",
      "#2196F3",
    ]);
  };

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const dadosDaTransacao = {
        tipo: tipoSelect.value,
        categoria: categoriaSelect.value,
        subcategoria: subcategoriaInput.value.trim(),
        valor: parseFloat(valorInput.value),
        data: dataInput.value,
        forma: formaPagamentoSelect.value,
        status: statusSelect.value,
        cartao:
          formaPagamentoSelect.value === "Cartão de crédito"
            ? cartaoSelect.value
            : null,
      };
      const { error } =
        idEmEdicao !== null
          ? await supabaseClient
              .from("transacoes")
              .update(dadosDaTransacao)
              .eq("id", idEmEdicao)
              .select()
          : await supabaseClient
              .from("transacoes")
              .insert([dadosDaTransacao])
              .select();
      if (error) {
        console.error("Erro detalhado do Supabase:", error);
        alert(
          "Não foi possível salvar a transação. Verifique o console (F12) para detalhes."
        );
      } else {
        await carregarTransacoes();
        cancelarEdicao();
      }
    });
  }

  if (tipoSelect) tipoSelect.addEventListener("change", popularSelects);
  if (formaPagamentoSelect)
    formaPagamentoSelect.addEventListener("change", () => {
      if (cartaoGroup)
        cartaoGroup.style.display =
          formaPagamentoSelect.value === "Cartão de crédito" ? "flex" : "none";
    });

  if (btnConfig) {
    btnConfig.addEventListener("click", () => {
      if (configSection)
        configSection.style.display =
          configSection.style.display === "none" ? "block" : "none";
    });
  }

  const init = async () => {
    if (!form) {
      console.error(
        "ERRO CRÍTICO: Formulário principal não encontrado. O script será interrompido."
      );
      return;
    }
    dataInput.valueAsDate = new Date();
    await carregarTransacoes();
  };

  init();
});