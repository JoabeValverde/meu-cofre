// ---- CONFIGURAÇÃO DO SUPABASE ----
const SUPABASE_URL = "https://dqvsvzsmywoxtjgxvulj.supabase.co"; // Mantenha sua URL que já estava aqui
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxdnN2enNteXdveHRqZ3h2dWxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2MTQ5NDYsImV4cCI6MjA3NTE5MDk0Nn0.tG1JqQTydWxfUbTJzYInCps6d8F-awQNjIPSP138iMo"; // Mantenha sua chave que já estava aqui

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
// ---------------------------------

document.addEventListener("DOMContentLoaded", () => {
  // --- FUNÇÃO DE AUXÍLIO ---
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
  const totalReceitasEl = getElement("total-receitas");
  const totalDespesasEl = getElement("total-despesas");
  const saldoAtualEl = getElement("saldo-atual");
  const filtroTipo = getElement("filtro-tipo");
  const filtroCartao = getElement("filtro-cartao");
  const authSection = getElement("auth-section");
  const appSection = getElement("app-section");
  const loginView = getElement("login-view");
  const signupView = getElement("signup-view");
  const loginForm = getElement("login-form");
  const signupForm = getElement("signup-form");
  const showSignup = getElement("show-signup");
  const showLogin = getElement("show-login");
  const btnLogout = getElement("btn-logout");

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

  // --- FUNÇÕES DE AUTENTICAÇÃO E CONTROLE DE TELA ---
  const checkUserSession = async () => {
    const {
      data: { session },
    } = await supabaseClient.auth.getSession();
    if (session) {
      // Usuário está logado
      authSection.classList.add("hidden");
      appSection.classList.remove("hidden");
      await carregarTransacoes();
    } else {
      // Usuário não está logado
      appSection.classList.add("hidden");
      authSection.classList.remove("hidden");
    }
  };

  // --- FUNÇÕES PRINCIPAIS DA APLICAÇÃO ---
  const carregarTransacoes = async () => {
    // ... (resto da função carregarTransacoes - NENHUMA MUDANÇA AQUI)
  };
  // ... (todas as outras funções como formatarMoeda, atualizarDashboard, etc. - NENHUMA MUDANÇA AQUI)

  // --- LISTENERS DE EVENTOS ---

  // Listener para o formulário de LOGIN
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = getElement("login-email").value;
      const password = getElement("login-password").value;
      const { error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        alert("Erro no login: " + error.message);
      }
      // O onAuthStateChange vai cuidar de atualizar a tela
    });
  }

  // Listener para o formulário de CADASTRO
  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = getElement("signup-email").value;
      const password = getElement("signup-password").value;
      if (password.length < 6) {
        alert("A senha deve ter no mínimo 6 caracteres.");
        return;
      }
      const { error } = await supabaseClient.auth.signUp({ email, password });
      if (error) {
        alert("Erro ao criar conta: " + error.message);
      } else {
        alert(
          "Conta criada! Verifique seu email para confirmar e depois faça o login."
        );
        // Volta para a tela de login
        signupView.classList.add("hidden");
        loginView.classList.remove("hidden");
      }
    });
  }

  // Listener para o botão de SAIR
  if (btnLogout) {
    btnLogout.addEventListener("click", async () => {
      const { error } = await supabaseClient.auth.signOut();
      if (error) {
        alert("Erro ao sair: " + error.message);
      }
      // O onAuthStateChange vai cuidar de atualizar a tela
    });
  }

  // Lógica para alternar entre as telas de login e cadastro
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

  // ... (todos os outros listeners como form.addEventListener, tipoSelect.addEventListener, etc. - NENHUMA MUDANÇA AQUI)

  // --- INICIALIZAÇÃO E CONTROLE DE ESTADO DE AUTENTICAÇÃO ---
  // Ouve as mudanças de estado (login, logout) e atualiza a UI
  supabaseClient.auth.onAuthStateChange((_event, session) => {
    checkUserSession();
  });

  // Função init agora só precisa setar a data, o onAuthStateChange cuida do resto
  const init = () => {
    if (dataInput) dataInput.valueAsDate = new Date();
  };

  init();
});
