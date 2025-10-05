// ---- CONFIGURAÇÃO DO SUPABASE ----
const SUPABASE_URL = 'https://dqvsvzsmywoxtjgxvulj.supabase.co'; // Mantenha sua URL que já estava aqui
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxdnN2enNteXdveHRqZ3h2dWxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2MTQ5NDYsImV4cCI6MjA3NTE5MDk0Nn0.tG1JqQTydWxfUbTJzYInCps6d8F-awQNjIPSP138iMo'; // Mantenha sua chave que já estava aqui

// CORREÇÃO: A variável agora se chama 'supabaseClient' para evitar conflito.
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
// ---------------------------------

document.addEventListener('DOMContentLoaded', () => {

    // --- SELEÇÃO DE ELEMENTOS DO DOM ---
    const form = document.getElementById('form-transacao');
    const tipoSelect = document.getElementById('tipo');
    const categoriaSelect = document.getElementById('categoria');
    const valorInput = document.getElementById('valor');
    const dataInput = document.getElementById('data');
    const formaPagamentoSelect = document.getElementById('forma');
    const cartaoGroup = document.getElementById('group-cartao');
    const cartaoSelect = document.getElementById('cartao');
    const statusSelect = document.getElementById('status');
    const listaTransacoes = document.getElementById('lista-transacoes');
    const btnSubmit = document.getElementById('btn-submit');

    const totalReceitasEl = document.getElementById('total-receitas');
    const totalDespesasEl = document.getElementById('total-despesas');
    const saldoAtualEl = document.getElementById('saldo-atual');

    // ... (o resto dos seletores de elementos não muda)

    // --- ESTADO DA APLICAÇÃO (DADOS) ---
    let transacoes = [];

    let config = {
        receitas: ['Salário', 'Freelance', 'Vendas', 'Outros'],
        despesas: ['Alimentação', 'Transporte', 'Moradia', 'Lazer', 'Saúde', 'Outros'],
        cartoes: ['Nubank', 'Inter', 'Caixa']
    };

    let idEmEdicao = null;
    let meuGrafico = null;
    let meuGraficoReceitas = null;

    // --- FUNÇÕES ---

    // CORREÇÃO: Nova função para carregar os dados do Supabase
    const carregarTransacoes = async () => {
        const { data, error } = await supabaseClient // Usando a variável corrigida
            .from('transacoes')
            .select('*')
            .order('data', { ascending: false });

        if (error) {
            console.error('Erro ao buscar transações:', error);
            alert('Não foi possível carregar os dados. Verifique o console (F12).');
        } else {
            transacoes = data;
            atualizarTudo();
        }
    };

    const formatarMoeda = (valor) => {
        return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const atualizarDashboard = () => {
        const transacoesConcluidas = transacoes.filter(t => t.status === 'Concluído');
        const receitas = transacoesConcluidas.filter(t => t.tipo === 'Receita').reduce((acc, t) => acc + t.valor, 0);
        const despesas = transacoesConcluidas.filter(t => t.tipo === 'Despesa').reduce((acc, t) => acc + t.valor, 0);
        const saldo = receitas - despesas;
        totalReceitasEl.textContent = formatarMoeda(receitas);
        totalDespesasEl.textContent = formatarMoeda(despesas);
        saldoAtualEl.textContent = formatarMoeda(saldo);
        saldoAtualEl.style.color = saldo < 0 ? 'var(--secondary-color)' : 'var(--accent-color)';
    };

    const atualizarGraficoDespesas = () => {
        const ctx = document.getElementById('graficoDespesas').getContext('2d');
        const despesas = transacoes.filter(t => t.tipo === 'Despesa' && t.status === 'Concluído');
        const despesasPorCategoria = {};
        despesas.forEach(d => {
            despesasPorCategoria[d.categoria] = (despesasPorCategoria[d.categoria] || 0) + d.valor;
        });
        const labels = Object.keys(despesasPorCategoria);
        const dataValues = Object.values(despesasPorCategoria);
        if (meuGrafico) meuGrafico.destroy();
        if (labels.length === 0) {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            return;
        }
        meuGrafico = new Chart(ctx, { type: 'pie', data: { labels, datasets: [{ label: 'Despesas por Categoria', data: dataValues, backgroundColor: ['#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722'], hoverOffset: 4 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } } } });
    };

    const atualizarGraficoReceitas = () => {
        const ctx = document.getElementById('graficoReceitas').getContext('2d');
        const receitas = transacoes.filter(t => t.tipo === 'Receita' && t.status === 'Concluído');
        const receitasPorCategoria = {};
        receitas.forEach(r => {
            receitasPorCategoria[r.categoria] = (receitasPorCategoria[r.categoria] || 0) + r.valor;
        });
        const labels = Object.keys(receitasPorCategoria);
        const dataValues = Object.values(receitasPorCategoria);
        if (meuGraficoReceitas) meuGraficoReceitas.destroy();
        if (labels.length === 0) {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            return;
        }
        meuGraficoReceitas = new Chart(ctx, { type: 'pie', data: { labels, datasets: [{ label: 'Receitas por Categoria', data: dataValues, backgroundColor: ['#4CAF50', '#8BC34A', '#00BCD4', '#03A9F4', '#2196F3', '#CDDC39', '#009688', '#3F51B5'], hoverOffset: 4 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } } } });
    };

    const renderizarTransacoes = () => {
        const listaTransacoes = document.getElementById('lista-transacoes');
        listaTransacoes.innerHTML = '';
        transacoes.forEach(t => { // Simplificado para sempre renderizar o que está na variável global
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="tipo-${t.tipo}">${t.tipo}</td>
                <td>${t.categoria}</td>
                <td>${formatarMoeda(t.valor)}</td>
                <td>${new Date(t.data + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                <td>${t.forma}</td>
                <td>${t.cartao || 'N/A'}</td>
                <td><span class="status-${t.status.toLowerCase().replace('í', 'i')}">${t.status}</span></td>
                <td>
                    <button class="action-button edit-button" onclick="prepararEdicao(${t.id})">✏️</button>
                    <button class="action-button" onclick="deletarTransacao(${t.id})">🗑️</button>
                </td>
            `;
            listaTransacoes.appendChild(tr);
        });
    };

    window.prepararEdicao = (id) => {
        const transacao = transacoes.find(t => t.id === id);
        if (!transacao) return;
        tipoSelect.value = transacao.tipo;
        tipoSelect.dispatchEvent(new Event('change'));
        categoriaSelect.value = transacao.categoria;
        valorInput.value = transacao.valor;
        dataInput.value = transacao.data;
        formaPagamentoSelect.value = transacao.forma;
        formaPagamentoSelect.dispatchEvent(new Event('change'));
        if (transacao.cartao) cartaoSelect.value = transacao.cartao;
        statusSelect.value = transacao.status;
        idEmEdicao = id;
        btnSubmit.textContent = 'Salvar Alterações';
        form.scrollIntoView({ behavior: 'smooth' });
    };

    const cancelarEdicao = () => {
        idEmEdicao = null;
        form.reset();
        dataInput.valueAsDate = new Date();
        btnSubmit.textContent = 'Adicionar Transação';
        formaPagamentoSelect.dispatchEvent(new Event('change'));
        tipoSelect.dispatchEvent(new Event('change'));
    };

    const popularSelects = () => {
        const tipoAtual = tipoSelect.value;
        const categorias = tipoAtual === 'Receita' ? config.receitas : config.despesas;
        categoriaSelect.innerHTML = '';
        categorias.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            categoriaSelect.appendChild(option);
        });
        // O resto da função continua igual...
    };

    // CORREÇÃO: Função de deletar agora é async e usa o Supabase
    window.deletarTransacao = async (id) => {
        if (confirm('Tem certeza que deseja deletar esta transação?')) {
            const { error } = await supabaseClient // Usando a variável corrigida
                .from('transacoes')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Erro ao deletar:', error);
                alert('Não foi possível deletar a transação.');
            } else {
                await carregarTransacoes();
            }
        }
    };

    const atualizarTudo = () => {
        atualizarDashboard();
        renderizarTransacoes();
        popularSelects();
        atualizarGraficoDespesas();
        atualizarGraficoReceitas();
    };

    // CORREÇÃO: Listener do formulário agora é async e usa o Supabase
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const dadosDaTransacao = {
            tipo: tipoSelect.value,
            categoria: categoriaSelect.value,
            valor: parseFloat(valorInput.value),
            data: dataInput.value,
            forma: formaPagamentoSelect.value,
            cartao: formaPagamentoSelect.value === 'Cartão de crédito' ? cartaoSelect.value : null,
            status: statusSelect.value
        };
        let error;
        if (idEmEdicao !== null) {
            const { data, error: updateError } = await supabaseClient.from('transacoes').update(dadosDaTransacao).eq('id', idEmEdicao);
            error = updateError;
        } else {
            const { data, error: insertError } = await supabaseClient.from('transacoes').insert([dadosDaTransacao]);
            error = insertError;
        }
        if (error) {
            console.error('Erro ao salvar transação:', error);
            alert('Não foi possível salvar a transação.');
        } else {
            await carregarTransacoes();
            cancelarEdicao();
        }
    });

    tipoSelect.addEventListener('change', popularSelects);
    formaPagamentoSelect.addEventListener('change', () => {
        cartaoGroup.style.display = formaPagamentoSelect.value === 'Cartão de crédito' ? 'flex' : 'none';
    });

    // ... (O resto do seu código, como os listeners de config e import/export, pode continuar aqui, embora as funções de config não salvem mais na nuvem)

    // CORREÇÃO: init agora é async
    const init = async () => {
        dataInput.valueAsDate = new Date();
        await carregarTransacoes();
    };

    init();
});