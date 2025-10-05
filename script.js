// ---- CONFIGURAÇÃO DO SUPABASE ----
const SUPABASE_URL = 'https://dqvsvzsmywoxtjgxvulj.supabase.co'; // Mantenha sua URL que já estava aqui
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxdnN2enNteXdveHRqZ3h2dWxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2MTQ5NDYsImV4cCI6MjA3NTE5MDk0Nn0.tG1JqQTydWxfUbTJzYInCps6d8F-awQNjIPSP138iMo'; // Mantenha sua chave que já estava aqui

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
    const btnConfig = document.getElementById('btn-config');
    const configSection = document.getElementById('config-section');
    const totalReceitasEl = document.getElementById('total-receitas');
    const totalDespesasEl = document.getElementById('total-despesas');
    const saldoAtualEl = document.getElementById('saldo-atual');
    const subcategoriaInput = getElement('subcategoria');

    // --- ESTADO DA APLICAÇÃO (DADOS) ---
    let transacoes = [];
    let config = {
        receitas: ['Salário PMI', 'Salário Ligmax', 'Extra Ligmax', 'Freelance', 'Vendas', 'Outros'],
        despesas: ['Alimentação', 'Fatura Cartao Bradesco', 'Fatura Cartao Nubank', 'Fatura Cartao Digio', 'Fatura Cartao Mercado Pago', 'Transporte', 'Moradia', 'Lazer', 'Saúde', 'Outros'],
        cartoes: ['Nubank', 'Bradesco', 'Caixa', 'Mercado Pago', 'Digio']
    };
    let idEmEdicao = null;
    let meuGrafico = null;
    let meuGraficoReceitas = null;

    // --- FUNÇÕES ---

    const carregarTransacoes = async () => {
        const { data, error } = await supabaseClient
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
        listaTransacoes.innerHTML = '';
        if (transacoes.length === 0) {
            listaTransacoes.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 20px;">Nenhuma transação encontrada.</td></tr>';
            return;
        }
        transacoes.forEach(t => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
            <td class="tipo-${t.tipo}">${t.tipo}</td>
            <td>${t.categoria}</td>
            <td>${t.subcategoria || ''}</td> <td>${formatarMoeda(t.valor)}</td>
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

    // CORREÇÃO: Função de popular selects agora está completa
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

        const filtroCartao = document.getElementById('filtro-cartao');
        cartaoSelect.innerHTML = '<option value="">Nenhum</option>';
        if (filtroCartao) filtroCartao.innerHTML = '<option value="Todos">Todos</option>';
        
        config.cartoes.forEach(cartao => {
            const optionForm = document.createElement('option');
            optionForm.value = cartao;
            optionForm.textContent = cartao;
            cartaoSelect.appendChild(optionForm.cloneNode(true));
            if(filtroCartao) filtroCartao.appendChild(optionForm);
        });
    };

    window.prepararEdicao = (id) => {
        const transacao = transacoes.find(t => t.id === id);
        if (!transacao) return;
        tipoSelect.value = transacao.tipo;
        tipoSelect.dispatchEvent(new Event('change'));
        categoriaSelect.value = transacao.categoria;
        subcategoriaInput.value = transacao.subcategoria || '';
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

    window.deletarTransacao = async (id) => {
        if (confirm('Tem certeza que deseja deletar esta transação?')) {
            const { error } = await supabaseClient
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

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const dadosDaTransacao = {
            tipo: tipoSelect.value,
            categoria: categoriaSelect.value,
            subcategoria: subcategoriaInput.value.trim(),
            valor: parseFloat(valorInput.value),
            data: dataInput.value,
            forma: formaPagamentoSelect.value,
            cartao: formaPagamentoSelect.value === 'Cartão de crédito' ? cartaoSelect.value : null,
            status: statusSelect.value
        };
        let error;
        if (idEmEdicao !== null) {
            const { data, error: updateError } = await supabaseClient.from('transacoes').update(dadosDaTransacao).eq('id', idEmEdicao).select();
            error = updateError;
        } else {
            const { data, error: insertError } = await supabaseClient.from('transacoes').insert([dadosDaTransacao]).select();
            error = insertError;
        }
        if (error) {
            console.error('Erro detalhado do Supabase:', error);
            alert('Não foi possível salvar a transação. Verifique o console (F12) para detalhes.');
        } else {
            await carregarTransacoes();
            cancelarEdicao();
        }
    });

    tipoSelect.addEventListener('change', popularSelects);
    formaPagamentoSelect.addEventListener('change', () => {
        cartaoGroup.style.display = formaPagamentoSelect.value === 'Cartão de crédito' ? 'flex' : 'none';
    });
    
    // As funções de config e import/export continuam aqui mas a de config não salva na nuvem.
    // Você pode decidir no futuro se quer removê-las ou adaptá-las para o Supabase.
    btnConfig.addEventListener('click', () => {
        const configReceitaTextarea = document.getElementById('config-receita');
        const configDespesaTextarea = document.getElementById('config-despesa');
        const configCartoesTextarea = document.getElementById('config-cartoes');
        const isHidden = configSection.style.display === 'none';
        configSection.style.display = isHidden ? 'block' : 'none';
        if (isHidden) {
            configReceitaTextarea.value = config.receitas.join('\n');
            configDespesaTextarea.value = config.despesas.join('\n');
            configCartoesTextarea.value = config.cartoes.join('\n');
        }
    });

    const init = async () => {
        dataInput.valueAsDate = new Date();
        await carregarTransacoes();
    };

    init();
});