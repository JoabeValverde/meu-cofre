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
  const forgotPasswordView = getElement("forgot-password-view");
  const loginForm = getElement("login-form");
  const signupForm = getElement("signup-form");
  const forgotPasswordForm = getElement("forgot-password-form");
  const showSignup = getElement("show-signup");
  const showLogin = getElement("show-login");
  const showForgotPassword = getElement("show-forgot-password");
  const backToLogin = getElement("back-to-login");
  const btnLogout = getElement("btn-logout");

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
  let config = { receitas: [], despesas: [], cartoes: [] };
  let idEmEdicao = null;
  let meuGraficoDespesas = null;
  let meuGraficoReceitas = null;

  // --- FUNÇÕES ---
  function showScreen(screenToShow) {
    [loginView, signupView, forgotPasswordView].forEach((screen) => {
      if (screen) screen.classList.add("hidden");
    });
    if (screenToShow) screenToShow.classList.remove("hidden");
  }

  async function carregarTudo(user) {
    // Esta função pode ser usada no futuro para carregar tudo de uma vez
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

  // ... (outras funções do localStorage)

  // --- LISTENERS ---
  if (showSignup) {
    showSignup.addEventListener("click", (e) => {
      e.preventDefault();
      showScreen(signupView);
    });
  }

  if (showLogin) {
    showLogin.addEventListener("click", (e) => {
      e.preventDefault();
      showScreen(loginView);
    });
  }

  if (showForgotPassword) {
    showForgotPassword.addEventListener("click", (e) => {
      e.preventDefault();
      showScreen(forgotPasswordView);
    });
  }

  if (backToLogin) {
    backToLogin.addEventListener("click", (e) => {
      e.preventDefault();
      showScreen(loginView);
    });
  }

  if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = getElement("forgot-email").value;
      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + window.location.pathname,
      });
      if (error) {
        alert("Erro ao enviar email de recuperação: " + error.message);
      } else {
        alert(
          "Link de recuperação enviado para seu email! Verifique sua caixa de entrada."
        );
        showScreen(loginView);
      }
    });
  }

  // Placeholder para os listeners antigos
  // ...

  // --- INICIALIZAÇÃO ---
  // Apenas para teste visual, a lógica de login virá depois
  appSection.classList.add("hidden");
  authSection.classList.remove("hidden");
  showScreen(loginView);
});
