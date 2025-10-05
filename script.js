
// ---- CONFIGURAÇÃO DO SUPABASE ----
const SUPABASE_URL = 'https://dqvsvzsmywoxtjgxvulj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxdnN2enNteXdveHRqZ3h2dWxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2MTQ5NDYsImV4cCI6MjA3NTE5MDk0Nn0.tG1JqQTydWxfUbTJzYInCps6d8F-awQNjIPSP138iMo';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
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

    const btnConfig = document.getElementById('btn-config');
    const configSection = document.getElementById('config-section');
    const configReceitaTextarea = document.getElementById('config-receita');
    const configDespesaTextarea = document.getElementById('config-despesa');
    const configCartoesTextarea = document.getElementById('config-cartoes');
    const btnSalvarConfig = document.getElementById('btn-salvar-config');

    const filtroTipo = document.getElementById('filtro-tipo');
    const filtroCartao = document.getElementById('filtro-cartao');
    const btnExportar = document.getElementById('btn-exportar');
    const btnImportar = document.getElementById('btn-importar');
    const inputImportar = document.getElementById('input-importar');

    // --- ESTADO DA APLICAÇÃO (DADOS) ---
    let transacoes = []; // Começa sempre vazio, pois os dados vêm da nuvem.

// As configurações agora usarão apenas os valores padrão do código.
let config = {
    receitas: ['Salário PMI', 'Salário Ligmax',  'Freelance', 'Vendas', 'Outros', 'Extras Ligmax'],
    despesas: ['Alimentação', 'Transporte', 'Moradia', 'Lazer', 'Saúde', 'Outros'],
    cartoes: ['Nubank', 'Bradesco', 'Digio', 'Mercado Pago']
};
    let idEmEdicao = null;
    let meuGrafico = null;
    let meuGraficoReceitas = null;

    // --- FUNÇÕES ---
    /*const salvarDados = () => {
        localStorage.setItem('transacoes', JSON.stringify(transacoes));
        localStorage.setItem('configReceitas', JSON.stringify(config.receitas));
        localStorage.setItem('configDespesas', JSON.stringify(config.despesas));
        localStorage.setItem('configCartoes', JSON.stringify(config.cartoes));
    };*/

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
            if (despesasPorCategoria[d.categoria]) {
                despesasPorCategoria[d.categoria] += d.valor;
            } else {
                despesasPorCategoria[d.categoria] = d.valor;
            }
        });

        const labels = Object.keys(despesasPorCategoria);
        const dataValues = Object.values(despesasPorCategoria);

        if (meuGrafico) {
            meuGrafico.destroy();
        }

        if (labels.length === 0) {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            return;
        }

        meuGrafico = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Despesas por Categoria',
                    data: dataValues,
                    backgroundColor: [
                        '#F44336', '#E91E63', '#9C27B0', '#673AB7',
                        '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4',
                        '#009688', '#4CAF50', '#8BC34A', '#CDDC39',
                        '#FFEB3B', '#FFC107', '#FF9800', '#FF5722'
                    ],
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                }
            }
        });
    };

    const atualizarGraficoReceitas = () => {
        const ctx = document.getElementById('graficoReceitas').getContext('2d');
        const receitas = transacoes.filter(t => t.tipo === 'Receita' && t.status === 'Concluído');
        const receitasPorCategoria = {};

        receitas.forEach(r => {
            if (receitasPorCategoria[r.categoria]) {
                receitasPorCategoria[r.categoria] += r.valor;
            } else {
                receitasPorCategoria[r.categoria] = r.valor;
            }
        });

        const labels = Object.keys(receitasPorCategoria);
        const dataValues = Object.values(receitasPorCategoria);

        if (meuGraficoReceitas) {
            meuGraficoReceitas.destroy();
        }

        if (labels.length === 0) {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            return;
        }

        meuGraficoReceitas = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Receitas por Categoria',
                    data: dataValues,
                    backgroundColor: [
                        '#4CAF50', '#8BC34A', '#00BCD4', '#03A9F4',
                        '#2196F3', '#CDDC39', '#009688', '#3F51B5'
                    ],
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                }
            }
        });
    };

    const renderizarTransacoes = () => {
        listaTransacoes.innerHTML = '';
        const tipoFiltrado = filtroTipo.value;
        const cartaoFiltrado = filtroCartao.value;
        const transacoesFiltradas = transacoes.filter(t => (tipoFiltrado === 'Todos' || t.tipo === tipoFiltrado) && (cartaoFiltrado === 'Todos' || t.cartao === cartaoFiltrado));

        if (transacoesFiltradas.length === 0) {
            listaTransacoes.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 20px;">Nenhuma transação encontrada.</td></tr>';
            return;
        }

        transacoesFiltradas.forEach(t => {
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
        if (transacao.cartao) {
            cartaoSelect.value = transacao.cartao;
        }
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

        cartaoSelect.innerHTML = '<option value="">Nenhum</option>';
        filtroCartao.innerHTML = '<option value="Todos">Todos</option>';

        config.cartoes.forEach(cartao => {
            const optionForm = document.createElement('option');
            optionForm.value = cartao;
            optionForm.textContent = cartao;
            cartaoSelect.appendChild(optionForm.cloneNode(true));
            filtroCartao.appendChild(optionForm);
        });
    };

    window.deletarTransacao = (id) => {
        if (confirm('Tem certeza que deseja deletar esta transação?')) {
            transacoes = transacoes.filter(t => t.id !== id);
            salvarDados();
            atualizarTudo();
        }
    };

    const atualizarTudo = () => {
        atualizarDashboard();
        renderizarTransacoes();
        popularSelects();
        atualizarGraficoDespesas();
        atualizarGraficoReceitas();
    };

    // SUBSTITUA O BLOCO form.addEventListener ANTIGO POR ESTE NOVO
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Cria um objeto com os dados do formulário
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

    // --- LÓGICA DE UPDATE (EDIÇÃO) ---
    if (idEmEdicao !== null) {
        const { data, error: updateError } = await supabase
            .from('transacoes')
            .update(dadosDaTransacao) // Envia o objeto com as novas informações
            .eq('id', idEmEdicao); // Onde o 'id' da linha for igual ao que estamos editando
        
        error = updateError;
    } 
    // --- LÓGICA DE CREATE (CRIAÇÃO) ---
    else {
        // O Supabase cria o 'id' e 'created_at' automaticamente
        const { data, error: insertError } = await supabase
            .from('transacoes')
            .insert([dadosDaTransacao]); // Envia o objeto dentro de um array
        
        error = insertError;
    }

    // --- TRATAMENTO DE ERRO E ATUALIZAÇÃO DA TELA ---
    if (error) {
        console.error('Erro ao salvar transação:', error);
        alert('Não foi possível salvar a transação.');
    } else {
        await carregarTransacoes(); // Recarrega TODOS os dados do banco para garantir consistência
        cancelarEdicao(); // Limpa o formulário e reseta o modo de edição
    }
});
    tipoSelect.addEventListener('change', popularSelects);

    formaPagamentoSelect.addEventListener('change', () => {
        cartaoGroup.style.display = formaPagamentoSelect.value === 'Cartão de crédito' ? 'flex' : 'none';
    });

    btnConfig.addEventListener('click', () => {
        const isHidden = configSection.style.display === 'none';
        configSection.style.display = isHidden ? 'block' : 'none';
        if (isHidden) {
            configReceitaTextarea.value = config.receitas.join('\n');
            configDespesaTextarea.value = config.despesas.join('\n');
            configCartoesTextarea.value = config.cartoes.join('\n');
        }
    });

    btnSalvarConfig.addEventListener('click', () => {
        config.receitas = configReceitaTextarea.value.split('\n').map(l => l.trim()).filter(l => l);
        config.despesas = configDespesaTextarea.value.split('\n').map(l => l.trim()).filter(l => l);
        config.cartoes = configCartoesTextarea.value.split('\n').map(l => l.trim()).filter(l => l);
        salvarDados();
        atualizarTudo();
        alert('Configurações salvas com sucesso!');
        configSection.style.display = 'none';
    });

    filtroTipo.addEventListener('change', renderizarTransacoes);
    filtroCartao.addEventListener('change', renderizarTransacoes);

    btnExportar.addEventListener('click', () => {
        const dataStr = JSON.stringify({ transacoes, config }, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `financas_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    });

    btnImportar.addEventListener('click', () => inputImportar.click());

    inputImportar.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (data.transacoes && data.config) {
                    if (confirm('Isso irá substituir todos os dados atuais. Deseja continuar?')) {
                        transacoes = data.transacoes;
                        config = data.config;
                        salvarDados();
                        atualizarTudo();
                        alert('Dados importados com sucesso!');
                    }
                } else { alert('Arquivo JSON inválido.'); }
            } catch (error) { alert('Erro ao ler o arquivo.'); }
        };
        reader.readAsText(file);
        inputImportar.value = '';
    });

    const init = () => {
        dataInput.valueAsDate = new Date();
        atualizarTudo();
    };

    init();
});