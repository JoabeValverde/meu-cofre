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
  const resetPasswordView = getElement("reset-password-view");

  const loginForm = getElement("login-form");
  const signupForm = getElement("signup-form");
  const forgotPasswordForm = getElement("forgot-password-form");
  const resetPasswordForm = getElement("reset-password-form");

  const showSignup = getElement("show-signup");
  const showLogin = getElement("show-login");
  const showForgotPassword = getElement("show-forgot-password");
  const backToLogin = getElement("back-to-login");
  const btnLogout = getElement("btn-logout");

  const form = getElement("form-transacao");
  const tipoSelect = getElement("tipo");
  const categoriaSelect = getElement("categoria");
  // ... (resto dos seletores)

  let transacoes = [];
  let config = { receitas: [], despesas: [], cartoes: [] };
  // ... (resto do estado)

  // --- FUNÇÕES ---
  function showScreen(screenToShow) {
    [loginView, signupView, forgotPasswordView, resetPasswordView].forEach(
      (screen) => {
        if (screen) screen.classList.add("hidden");
      }
    );
    if (screenToShow) screenToShow.classList.remove("hidden");
  }

  async function checkUserSession(session) {
    if (session) {
      appSection.classList.remove("hidden");
      authSection.classList.add("hidden");
      await carregarTudo(session.user);
    } else {
      appSection.classList.add("hidden");
      authSection.classList.remove("hidden");
      showScreen(loginView);
    }
  }

  // ... (todas as outras funções que já tínhamos)

  // --- LISTENERS DE EVENTOS ---
  if (loginForm) {
    /* ... */
  }
  if (signupForm) {
    /* ... */
  }
  if (btnLogout) {
    /* ... */
  }
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
      /* ... código anterior ... */
    });
  }

  if (resetPasswordForm) {
    resetPasswordForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const newPassword = getElement("new-password").value;
      if (newPassword.length < 6) {
        return alert("A senha deve ter no mínimo 6 caracteres.");
      }
      const { error } = await supabaseClient.auth.updateUser({
        password: newPassword,
      });
      if (error) {
        alert("Erro ao atualizar a senha: " + error.message);
      } else {
        alert("Senha atualizada com sucesso! Faça o login.");
        location.hash = "";
        showScreen(loginView);
      }
    });
  }

  // ... (listeners da aplicação principal)

  // --- INICIALIZAÇÃO ---
  supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === "PASSWORD_RECOVERY") {
      appSection.classList.add("hidden");
      authSection.classList.remove("hidden");
      showScreen(resetPasswordView);
    } else {
      checkUserSession(session);
    }
  });
});
