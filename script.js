// ---- CONFIGURAÇÃO DO SUPABASE ----
const SUPABASE_URL =
  "https://dqvsvzsmywoxtjgxvulj.supabase.chttps://dqvsvzsmywoxtjgxvulj.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxdnN2enNteXdveHRqZ3h2dWxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2MTQ5NDYsImV4cCI6MjA3NTE5MDk0Nn0.tG1JqQTydWxfUbTJzYInCps6d8F-awQNjIPSP138iMo";

  const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  // ---------------------------------

  document.addEventListener("DOMContentLoaded", () => {
    const getElement = (id) => {
      const element = document.getElementById(id);
      if (!element) {
        console.error(`ERRO: Elemento com ID '${id}' não foi encontrado.`);
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
    const resetPasswordView = getElement("reset-password-view");
    const resetPasswordForm = getElement("reset-password-form");

    // --- ESTADO DA APLICAÇÃO ---
    let transacoes = [];
    let config = { receitas: [], despesas: [], cartoes: [] };
    let idEmEdicao = null;
    let meuGraficoDespesas = null;
    let meuGraficoReceitas = null;

    // --- FUNÇÕES DE AUTENTICAÇÃO E CONFIGURAÇÃO ---
    const carregarConfiguracoesUsuario = async (user) => {
      const fallbackConfig = {
        receitas: ["Salário", "Freelance", "Vendas", "Outros"],
        despesas: ["Alimentação", "Transporte", "Moradia", "Lazer", "Outros"],
        cartoes: ["Cartão Padrão"],
      };
      try {
        const [catRes, carRes] = await Promise.all([
          supabaseClient
            .from("categorias")
            .select("nome, tipo")
            .eq("user_id", user.id),
          supabaseClient.from("cartoes").select("nome").eq("user_id", user.id),
        ]);
        if (catRes.error) throw catRes.error;
        if (carRes.error) throw carRes.error;
        config.receitas = catRes.data
          .filter((c) => c.tipo === "Receita")
          .map((c) => c.nome);
        config.despesas = catRes.data
          .filter((c) => c.tipo === "Despesa")
          .map((c) => c.nome);
        config.cartoes = carRes.data.map((c) => c.nome);
        if (config.receitas.length === 0)
          config.receitas = fallbackConfig.receitas;
        if (config.despesas.length === 0)
          config.despesas = fallbackConfig.despesas;
        if (config.cartoes.length === 0)
          config.cartoes = fallbackConfig.cartoes;
      } catch (error) {
        console.error("Erro ao carregar configurações:", error);
        config = fallbackConfig;
      }
    };

    const checkUserSession = async (session) => {
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
      try {
        const { data, error } = await supabaseClient
          .from("transacoes")
          .select("*")
          .eq("user_id", user.id)
          .order("data", { ascending: false });
        if (error) throw error;
        transacoes = data || [];
        atualizarTudo();
      } catch (error) {
        console.error("Erro ao buscar transações:", error);
      }
    };

    const formatarMoeda = (valor) =>
      typeof valor !== "number"
        ? "R$ 0,00"
        : valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

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

    const atualizarGraficoDespesas = () => {
      const canvas = getElement("graficoDespesas");
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const dados = transacoes.filter(
        (t) => t.tipo === "Despesa" && t.status === "Concluído"
      );
      const dataMap = dados.reduce((acc, t) => {
        acc[t.categoria] = (acc[t.categoria] || 0) + t.valor;
        return acc;
      }, {});
      const labels = Object.keys(dataMap);
      const dataValues = Object.values(dataMap);
      if (meuGraficoDespesas) meuGraficoDespesas.destroy();
      if (labels.length === 0) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        return;
      }
      meuGraficoDespesas = new Chart(ctx, {
        type: "pie",
        data: {
          labels,
          datasets: [
            {
              data: dataValues,
              backgroundColor: [
                "#F44336",
                "#E91E63",
                "#9C27B0",
                "#673AB7",
                "#3F51B5",
              ],
              hoverOffset: 4,
            },
          ],
        },
        options: { plugins: { legend: { display: false } } },
      });
    };

    const atualizarGraficoReceitas = () => {
      const canvas = getElement("graficoReceitas");
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const dados = transacoes.filter(
        (t) => t.tipo === "Receita" && t.status === "Concluído"
      );
      const dataMap = dados.reduce((acc, t) => {
        acc[t.categoria] = (acc[t.categoria] || 0) + t.valor;
        return acc;
      }, {});
      const labels = Object.keys(dataMap);
      const dataValues = Object.values(dataMap);
      if (meuGraficoReceitas) meuGraficoReceitas.destroy();
      if (labels.length === 0) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        return;
      }
      meuGraficoReceitas = new Chart(ctx, {
        type: "pie",
        data: {
          labels,
          datasets: [
            {
              data: dataValues,
              backgroundColor: [
                "#4CAF50",
                "#8BC34A",
                "#00BCD4",
                "#03A9F4",
                "#2196F3",
              ],
              hoverOffset: 4,
            },
          ],
        },
        options: { plugins: { legend: { display: false } } },
      });
    };

    const renderizarTransacoes = () => {
      if (!listaTransacoes) return;
      listaTransacoes.innerHTML =
        !transacoes || transacoes.length === 0
          ? '<tr><td colspan="10" style="text-align:center; padding: 20px;">Nenhuma transação encontrada.</td></tr>'
          : "";
      if (transacoes)
        transacoes.forEach((t) => {
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
          }</span></td><td><button class="action-button edit-button" onclick="prepararEdicao(${
            t.id
          })">✏️</button><button class="action-button" onclick="deletarTransacao(${
            t.id
          })">🗑️</button></td>`;
          listaTransacoes.appendChild(tr);
        });
    };

    const popularSelects = () => {
      const filtroCartao = getElement("filtro-cartao");
      if (!tipoSelect || !categoriaSelect || !cartaoSelect) return;
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
      if (filtroCartao)
        filtroCartao.innerHTML = '<option value="Todos">Todos</option>';
      config.cartoes.forEach((cartao) => {
        const opt = document.createElement("option");
        opt.value = cartao;
        opt.textContent = cartao;
        cartaoSelect.appendChild(opt.cloneNode(true));
        if (filtroCartao) filtroCartao.appendChild(opt);
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
      if (confirm("Tem certeza que deseja deletar?")) {
        const {
          data: { user },
        } = await supabaseClient.auth.getUser();
        const { error } = await supabaseClient
          .from("transacoes")
          .delete()
          .eq("id", id);
        if (error) {
          console.error("Erro ao deletar:", error);
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
      atualizarGraficoDespesas();
      atualizarGraficoReceitas();
    };

    // --- LISTENERS DE EVENTOS ---
    if (loginForm)
      loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const { error } = await supabaseClient.auth.signInWithPassword({
          email: getElement("login-email").value,
          password: getElement("login-password").value,
        });
        if (error) alert("Erro: " + error.message);
      });
    if (signupForm)
      signupForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const pass = getElement("signup-password").value;
        if (pass.length < 6) {
          alert("Senha curta.");
          return;
        }
        const { error } = await supabaseClient.auth.signUp({
          email: getElement("signup-email").value,
          password: pass,
        });
        if (error) {
          alert("Erro: " + error.message);
        } else {
          alert("Conta criada! Verifique seu email.");
          signupView.classList.add("hidden");
          loginView.classList.remove("hidden");
        }
      });
    if (btnLogout)
      btnLogout.addEventListener(
        "click",
        async () => await supabaseClient.auth.signOut()
      );
    if (showSignup)
      showSignup.addEventListener("click", (e) => {
        e.preventDefault();
        loginView.classList.add("hidden");
        signupView.classList.remove("hidden");
      });
    if (showLogin)
      showLogin.addEventListener("click", (e) => {
        e.preventDefault();
        signupView.classList.add("hidden");
        loginView.classList.remove("hidden");
      });

    if (resetPasswordForm) {
      resetPasswordForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const newPassword = getElement("new-password").value;
        if (newPassword.length < 6) {
          alert("A nova senha deve ter no mínimo 6 caracteres.");
          return;
        }
        const { error } = await supabaseClient.auth.updateUser({
          password: newPassword,
        });
        if (error) {
          alert("Erro ao atualizar a senha: " + error.message);
        } else {
          alert(
            "Senha atualizada com sucesso! Por favor, faça o login com sua nova senha."
          );
          location.hash = "";
          resetPasswordView.classList.add("hidden");
          loginView.classList.remove("hidden");
        }
      });
    }

    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const {
          data: { user },
        } = await supabaseClient.auth.getUser();
        if (!user) {
          alert("Você precisa estar logado.");
          return;
        }
        try {
          const valorTotal = parseFloat(valorInput.value);
          const numeroParcelas = parseInt(parcelasInput.value, 10);
          const formaPagamento = formaPagamentoSelect.value;
          const descricao = descricaoInput.value.trim();
          if (formaPagamento === "Cartão de crédito" && numeroParcelas > 1) {
            const transacoesParaSalvar = [];
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
              }
              transacoesParaSalvar.push({
                tipo: "Despesa",
                categoria: categoriaSelect.value,
                subcategoria: subcategoriaInput.value.trim(),
                descricao: `${descricao || "Parcelado"} (${
                  i + 1
                }/${numeroParcelas})`,
                valor: parseFloat(valorDaParcelaAtual.toFixed(2)),
                data: dataParcela.toISOString().split("T")[0],
                forma: formaPagamento,
                status: "Pendente",
                cartao: cartaoSelect.value,
                user_id: user.id,
                grupo_parcela: grupoParcelaUUID,
              });
            }
            const { error } = await supabaseClient
              .from("transacoes")
              .insert(transacoesParaSalvar)
              .select();
            if (error) throw error;
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
                formaPagamento === "Cartão de crédito"
                  ? cartaoSelect.value
                  : null,
              user_id: user.id,
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
            if (error) throw error;
          }
          await carregarTransacoes(user);
          cancelarEdicao();
        } catch (error) {
          console.error("Erro detalhado do Supabase:", error);
          alert("Não foi possível salvar a transação.");
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

    // --- INICIALIZAÇÃO ---
    supabaseClient.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        authSection.classList.remove("hidden");
        appSection.classList.add("hidden");
        loginView.classList.add("hidden");
        signupView.classList.add("hidden");
        resetPasswordView.classList.remove("hidden");
      } else {
        checkUserSession(session);
      }
    });

    const init = () => {
      if (dataInput) dataInput.valueAsDate = new Date();
    };
    init();
  });
