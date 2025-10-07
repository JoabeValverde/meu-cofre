// ---- CONFIGURAÇÃO DO SUPABASE ----
const SUPABASE_URL =
  "https://dqvsvzsmywoxtjgxvulj.supabase.chttps://dqvsvzsmywoxtjgxvulj.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxdnN2enNteXdveHRqZ3h2dWxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2MTQ5NDYsImV4cCI6MjA3NTE5MDk0Nn0.tG1JqQTydWxfUbTJzYInCps6d8F-awQNjIPSP138iMo";

  const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  // ---------------------------------

  document.addEventListener("DOMContentLoaded", () => {
    console.log(
      "Script de Diagnóstico INICIADO. Aguardando sinal do Supabase..."
    );

    supabaseClient.auth.onAuthStateChange((event, session) => {
      // Esta é a parte mais importante.
      // Ele vai nos dizer o nome exato do evento que o Supabase está enviando.
      console.log("SINAL RECEBIDO DO SUPABASE!");
      console.log("NOME DO EVENTO:", event);
      console.log("DADOS DA SESSÃO:", session);

      if (event === "PASSWORD_RECOVERY") {
        console.log(
          "SUCESSO: O evento 'PASSWORD_RECOVERY' foi detectado corretamente!"
        );
      } else {
        console.warn(
          "AVISO: O evento detectado NÃO foi 'PASSWORD_RECOVERY'. O nome do evento foi:",
          event
        );
      }
    });
  });
