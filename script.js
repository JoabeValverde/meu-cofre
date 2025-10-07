// ---- CONFIGURAÇÃO DO SUPABASE ----
const SUPABASE_URL = "https://dqvsvzsmywoxtjgxvulj.supabase.co"; // Mantenha sua URL que já estava aqui
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxdnN2enNteXdveHRqZ3h2dWxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2MTQ5NDYsImV4cCI6MjA3NTE5MDk0Nn0.tG1JqQTydWxfUbTJzYInCps6d8F-awQNjIPSP138iMo"; // Mantenha sua chave que já estava aqui

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
// ---------------------------------

document.addEventListener("DOMContentLoaded", () => {
  const getElement = (id) => {
    const element = document.getElementById(id);
    if (!element) {
      console.error(
        `ERRO: Elemento com ID '${id}' não foi encontrado no HTML.`
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
  const btnSubmit = getElement("btn-submit");
  const totalReceitasEl = getElement("total-receitas");
  const totalDespesasEl = getElement("total-despesas");
  const saldoAtualEl = getElement("saldo-atual");
  const authSection = getElement("auth-section");
  const appSection = getElement("app-section");
  const loginView = getElement("login-view");
  const signupView = getElement("signup-view");
  const loginForm = getElement("login-form");
  const signupForm = getElement("signup-form");
  const showSignup = getElement("show-signup");
  const showLogin = getElement("show-login");
  const btnLogout = getElement("btn-logout");

  // --- ESTADO DA APLICAÇÃO ---
  let transacoes = [];
  let config = {
    receitas: [],
    despesas: [],
    cartoes: [],
  };
  let idEmEdicao = null;
  let meuGrafico = null;
  let meuGraficoReceitas = null;

  // --- FUNÇÕES DE AUTENTICAÇÃO E UI ---
  const carregarConfiguracoesUsuario = async (user) => {
    const { data: categoriasData, error: categoriasError } =
      await supabaseClient
        .from("categorias")
        .select("nome, tipo")
        .eq("user_id", user.id);
    const { data: cartoesData, error: cartoesError } = await supabaseClient
      .from("cartoes")
      .select("nome")
      .eq("user_id", user.id);

    if (categoriasError || cartoesError) {
      console.error(
        "Erro ao carregar configurações:",
        categoriasError || cartoesError
      );
      alert("Não foi possível carregar suas configurações personalizadas.");
      return;
    }

    const fallbackConfig = {
      receitas: ["Salário", "Freelance", "Vendas", "Outros"],
      despesas: [
        "Alimentação",
        "Transporte",
        "Moradia",
        "Lazer",
        "Saúde",
        "Outros",
      ],
      cartoes: ["Nubank", "Inter", "Caixa"],
    };

    config.receitas = categoriasData
      .filter((c) => c.tipo === "Receita")
      .map((c) => c.nome);
    config.despesas = categoriasData
      .filter((c) => c.tipo === "Despesa")
      .map((c) => c.nome);
    config.cartoes = cartoesData.map((c) => c.nome);

    if (config.receitas.length === 0) config.receitas = fallbackConfig.receitas;
    if (config.despesas.length === 0) config.despesas = fallbackConfig.despesas;
    if (config.cartoes.length === 0) config.cartoes = fallbackConfig.cartoes;
  };

  const checkUserSession = async () => {
    const {
      data: { session },
    } = await supabaseClient.auth.getSession();
    if (session) {
      authSection.classList.add("hidden");
      appSection.classList.remove("hidden");
      await carregarConfiguracoesUsuario(session.user);
      await carregarTransacoes(session.user);
    } else {
      appSection.classList.add("hidden");
      authSection.classList.remove("hidden");
    }
  };

  // --- FUNÇÕES DA APLICAÇÃO ---
  const carregarTransacoes = async (user) => {
    if (!user) return;
    const { data, error } = await supabaseClient
      .from("transacoes")
      .select("*")
      .eq("user_id", user.id)
      .order("data", { ascending: false });
    if (error) {
      console.error("Erro ao buscar transações:", error);
      alert("Não foi possível carregar os dados. Verifique o console.");
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
    const dadosPorCategoria = transacoesFiltradas.reduce((acc, t) => {
      acc[t.categoria] = (acc[t.categoria] || 0) + t.valor;
      return acc;
    }, {});
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
        '<tr><td colspan="10" style="text-align:center; padding: 20px;">Nenhuma transação encontrada.</td></tr>';
      return;
    }
    transacoes.forEach((t) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
              <td class="tipo-${t.tipo}">${t.tipo}</td><td>${
        t.descricao || ""
      }</td><td>${t.categoria}</td>
              <td>${t.subcategoria || ""}</td><td>${formatarMoeda(t.valor)}</td>
              <td>${new Date(t.data + "T00:00:00").toLocaleDateString(
                "pt-BR"
              )}</td>
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
    const filtroCartao = getElement("filtro-cartao");
    cartaoSelect.innerHTML = '<option value="">Nenhum</option>';
    if (filtroCartao)
      filtroCartao.innerHTML = '<option value="Todos">Todos</option>';
    config.cartoes.forEach((cartao) => {
      const optionForm = document.createElement("option");
      optionForm.value = cartao;
      option.textContent = cartao;
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
    descricaoInput.value = transacao.descricao || "";
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
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();
      const { error } = await supabaseClient
        .from("transacoes")
        .delete()
        .eq("id", id);
      if (error) {
        console.error("Erro ao deletar:", error);
        alert("Não foi possível deletar a transação.");
      } else {
        await carregarTransacoes(user);
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

  // --- LISTENERS DE EVENTOS ---
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const { error } = await supabaseClient.auth.signInWithPassword({
        email: getElement("login-email").value,
        password: getElement("login-password").value,
      });
      if (error) {
        alert("Erro no login: " + error.message);
      }
    });
  }

  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const password = getElement("signup-password").value;
      if (password.length < 6) {
        alert("A senha deve ter no mínimo 6 caracteres.");
        return;
      }
      const { error } = await supabaseClient.auth.signUp({
        email: getElement("signup-email").value,
        password: password,
      });
      if (error) {
        alert("Erro ao criar conta: " + error.message);
      } else {
        alert(
          "Conta criada! Verifique seu email para confirmar e depois faça o login."
        );
        signupView.classList.add("hidden");
        loginView.classList.remove("hidden");
      }
    });
  }

  if (btnLogout) {
    btnLogout.addEventListener("click", async () => {
      await supabaseClient.auth.signOut();
    });
  }

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

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();
      if (!user) {
        alert("Você precisa estar logado para criar uma transação.");
        return;
      }

      const valorTotal = parseFloat(valorInput.value);
      const numeroParcelas = parseInt(parcelasInput.value, 10);
      const formaPagamento = formaPagamentoSelect.value;
      const descricao = descricaoInput.value.trim();

      let transacoesParaSalvar = [];
      let error = null;

      if (formaPagamento === "Cartão de crédito" && numeroParcelas > 1) {
        const valorParcela = parseFloat(
          (valorTotal / numeroParcelas).toFixed(2)
        );
        const dataInicial = new Date(dataInput.value + "T03:00:00");
        const grupoParcelaUUID = crypto.randomUUID();
        let somaParcelas = 0;

        for (let i = 0; i < numeroParcelas; i++) {
          const dataParcela = new Date(dataInicial);
          dataParcela.setMonth(dataInicial.getMonth() + i);
          let valorDaParcelaAtual = valorParcela;
          somaParcelas += valorParcela;
          if (i === numeroParcelas - 1) {
            valorDaParcelaAtual += valorTotal - somaParcelas;
            valorDaParcelaAtual = parseFloat(valorDaParcelaAtual.toFixed(2));
          }
          transacoesParaSalvar.push({
            tipo: "Despesa",
            categoria: categoriaSelect.value,
            subcategoria: subcategoriaInput.value.trim(),
            descricao: `${descricao || "Parcelado"} (${
              i + 1
            }/${numeroParcelas})`,
            valor: valorDaParcelaAtual,
            data: dataParcela.toISOString().split("T")[0],
            forma: formaPagamento,
            status: "Pendente",
            cartao: cartaoSelect.value,
            user_id: user.id,
            grupo_parcela: grupoParcelaUUID,
          });
        }

        const { error: insertError } = await supabaseClient
          .from("transacoes")
          .insert(transacoesParaSalvar)
          .select();
        error = insertError;
      } else {
        const dadosDaTransacao = {
          tipo: tipoSelect.value,
          categoria: categoriaSelect.value,
          subcategoria: subcategoriaInput.value.trim(),
          descricao: descricao,
          valor: valorTotal,
          data: dataInput.value,
          forma: formaPagamento,
          status: statusSelect.value,
          cartao:
            formaPagamento === "Cartão de crédito" ? cartaoSelect.value : null,
          user_id: user.id,
        };

        const { error: dbError } =
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
        error = dbError;
      }

      if (error) {
        console.error("Erro detalhado do Supabase:", error);
        alert(
          "Não foi possível salvar a transação. Verifique o console (F12) para detalhes."
        );
      } else {
        await carregarTransacoes(user);
        cancelarEdicao();
      }
    });
  }

  if (tipoSelect) tipoSelect.addEventListener("change", popularSelects);
  if (formaPagamentoSelect) {
    formaPagamentoSelect.addEventListener("change", () => {
      const isCartao = formaPagamentoSelect.value === "Cartão de crédito";
      if (cartaoGroup) cartaoGroup.style.display = isCartao ? "flex" : "none";
      if (parcelasGroup) parcelasGroup.classList.toggle("hidden", !isCartao);
    });
  }

  // --- INICIALIZAÇÃO E CONTROLE DE ESTADO DE AUTENTICAÇÃO ---
  supabaseClient.auth.onAuthStateChange((_event, session) => {
    checkUserSession();
  });

  const init = () => {
    if (dataInput) dataInput.valueAsDate = new Date();
  };

  init();
});
