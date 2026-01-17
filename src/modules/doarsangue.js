// ============================================
// MÓDULO DE DOAÇÕES DE SANGUE
// ============================================

import { mostrarNotificacao, mostrarConfirmacaoPromise, mostrarErro } from '../utils/dialogs.js';
import { salvarNoFirebase, deletarDoFirebase } from '../utils/firebase.js';
import { temPermissao } from '../utils/permissoes.js';
import { lerDados } from '../../config/firebase-config.js';

// Variáveis globais
let pacientes = [];
let doacoes = [];
let graficoDoadores = null;

export async function init(dadosCarregados) {
    pacientes = dadosCarregados.pacientes || [];
    
    // Garantir que doacoesSangue é um array
    const doadosRaw = dadosCarregados.doacoesSangue || [];
    if (Array.isArray(doadosRaw)) {
        doacoes = doadosRaw;
    } else if (typeof doadosRaw === 'object') {
        doacoes = Object.values(doadosRaw);
    } else {
        doacoes = [];
    }
    
    // Aguardar o DOM estar pronto antes de configurar eventos
    setTimeout(async () => {
        configurarEventos();
        preencherDataAtual();
        preencherListaPacientes();
        atualizarTabelaDoacoes();
        
        // Só renderizar gráfico se a seção estiver visível
        const secaoDoarSangue = document.getElementById('doarSangue');
        if (secaoDoarSangue && !secaoDoarSangue.classList.contains('modal-hidden')) {
            atualizarGraficoSemanal();
        }
        
        inicializarSemanasResetadas();
        
        // Carregar dados do Firebase após renderização inicial
        await carregarDoacoes();
    }, 500);
}

// ============================================
// INICIALIZAÇÃO E CARREGAMENTO
// ============================================

function configurarEventos() {
    // Evento de registro de doação
    const btnRegistrar = document.getElementById('btnRegistrarDoacao');
    if (btnRegistrar) {
        btnRegistrar.addEventListener('click', registrarDoacao);
    }

    // Evento de busca de paciente
    const inputPaciente = document.getElementById('doadorPacienteId');
    if (inputPaciente) {
        inputPaciente.addEventListener('blur', buscarPaciente);
        inputPaciente.addEventListener('change', buscarPaciente);
    }

    // Eventos de filtro no histórico
    const filtroId = document.getElementById('filtroIdHistorico');
    const filtroMes = document.getElementById('filtroMesHistorico');
    const btnLimpar = document.getElementById('btnLimparFiltrosHistorico');

    if (filtroId) filtroId.addEventListener('input', atualizarTabelaDoacoes);
    if (filtroMes) filtroMes.addEventListener('change', atualizarTabelaDoacoes);
    if (btnLimpar) btnLimpar.addEventListener('click', limparFiltrosHistorico);

    // Mostrar/ocultar botão de reset para admins
    const btnReset = document.getElementById('btnResetarSemana');
    if (btnReset && temPermissao('admin', 'gerenciar')) {
        btnReset.style.display = 'inline-block';
        btnReset.addEventListener('click', resetarSemanaDoacoes);
    }

    // Observar quando a seção de doações fica visível para renderizar gráfico
    const secaoDoarSangue = document.getElementById('doarSangue');
    if (secaoDoarSangue) {
        const observer = new MutationObserver(() => {
            // Se a seção ficou visível (removeu modal-hidden), renderizar gráfico
            if (!secaoDoarSangue.classList.contains('modal-hidden')) {
                // Renderizar gráfico com os dados atuais
                setTimeout(() => atualizarGraficoSemanal(), 100);
                // Parar de observar após primeira renderização
                observer.disconnect();
            }
        });
        observer.observe(secaoDoarSangue, { attributes: true, attributeFilter: ['class'] });
    }
}

async function carregarDoacoes() {
    try {
        const doadosCarregadas = await lerDados('doacoesSangue');
        if (doadosCarregadas) {
            // Se for um objeto (Firebase Realtime retorna objeto quando há múltiplas entradas)
            if (typeof doadosCarregadas === 'object' && !Array.isArray(doadosCarregadas)) {
                doacoes = Object.values(doadosCarregadas);
            } else if (Array.isArray(doadosCarregadas)) {
                doacoes = doadosCarregadas;
            } else {
                doacoes = [];
            }
        } else {
            doacoes = [];
        }
        
        // Atualizar a interface
        preencherListaPacientes();
        atualizarTabelaDoacoes();
        atualizarGraficoSemanal();
    } catch (erro) {
        console.error('Erro ao carregar doações:', erro);
        doacoes = [];
    }
}

function preencherListaPacientes() {
    const datalist = document.getElementById('listaPacientesDoacao');
    if (!datalist) return;

    datalist.innerHTML = '';
    pacientes.forEach(paciente => {
        const option = document.createElement('option');
        option.value = paciente.id;
        option.label = `${paciente.nome} (${paciente.id})`;
        datalist.appendChild(option);
    });
}

function preencherDataAtual() {
    const inputData = document.getElementById('doadorData');
    if (inputData) {
        const hoje = new Date();
        const dia = String(hoje.getDate()).padStart(2, '0');
        const mes = String(hoje.getMonth() + 1).padStart(2, '0');
        const ano = hoje.getFullYear();
        inputData.value = `${ano}-${mes}-${dia}`;
    }
}

// ============================================
// BUSCAR PACIENTE
// ============================================

function buscarPaciente() {
    const idPaciente = document.getElementById('doadorPacienteId').value.trim();
    
    if (!idPaciente) {
        document.getElementById('doadorNome').value = '';
        document.getElementById('doadorTipoSanguineo').value = '';
        return;
    }

    const paciente = pacientes.find(p => p.id === idPaciente);
    
    if (paciente) {
        document.getElementById('doadorNome').value = paciente.nome;
        document.getElementById('doadorTipoSanguineo').value = paciente.tipoSanguineo;
    } else {
        mostrarErro('Paciente Não Encontrado', `Nenhum paciente registrado com ID: ${idPaciente}`);
        document.getElementById('doadorNome').value = '';
        document.getElementById('doadorTipoSanguineo').value = '';
    }
}

// ============================================
// REGISTRAR DOAÇÃO
// ============================================

async function registrarDoacao() {
    // Validar permissão
    if (!temPermissao('doacao', 'criar')) {
        mostrarErro('Acesso Negado', 'Você não tem permissão para registrar doações');
        return;
    }

    // Validar campos
    const idPaciente = document.getElementById('doadorPacienteId').value.trim();
    const quantidade = parseInt(document.getElementById('doadorQuantidade').value);
    const data = document.getElementById('doadorData').value;
    const observacao = document.getElementById('doadorObservacao').value.trim();

    if (!idPaciente) {
        mostrarErro('Campo Obrigatório', 'Por favor, selecione um paciente');
        return;
    }

    if (!quantidade || quantidade < 1) {
        mostrarErro('Quantidade Inválida', 'Por favor, insira uma quantidade válida (maior que 0)');
        return;
    }

    if (!data) {
        mostrarErro('Data Obrigatória', 'Por favor, selecione uma data');
        return;
    }

    // Procurar paciente
    const paciente = pacientes.find(p => p.id === idPaciente);
    if (!paciente) {
        mostrarErro('Paciente Não Encontrado', `Paciente com ID ${idPaciente} não encontrado`);
        return;
    }

    // Validar tipo sanguíneo do paciente
    if (!paciente.tipoSanguineo) {
        mostrarErro('Tipo Sanguíneo Faltando', `O paciente ${paciente.nome} não tem tipo sanguíneo cadastrado. Por favor, atualize o cadastro do paciente.`);
        return;
    }

    // Criar objeto de doação (garantindo que não há valores undefined)
    const novaDoacao = {
        id: `doacao_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        pacienteId: paciente.id || '',
        pacienteNome: paciente.nome || '',
        tipoSanguineo: paciente.tipoSanguineo || 'O',
        quantidade: quantidade,
        data: data,
        dataTimestamp: new Date(data).getTime(),
        observacao: observacao || '',
        dataCadastro: new Date().toISOString()
    };

    // Salvar no Firebase
    try {
        await salvarNoFirebase('doacoesSangue', novaDoacao);
        
        doacoes.push(novaDoacao);
        
        // Limpar formulário
        document.getElementById('formRegistroDoacao') ? document.getElementById('formRegistroDoacao').reset() : null;
        document.getElementById('doadorPacienteId').value = '';
        document.getElementById('doadorNome').value = '';
        document.getElementById('doadorTipoSanguineo').value = '';
        document.getElementById('doadorQuantidade').value = '450';
        document.getElementById('doadorObservacao').value = '';
        
        preencherDataAtual();
        
        // Atualizar tabelas e gráfico
        atualizarTabelaDoacoes();
        atualizarGraficoSemanal();
        
        mostrarNotificacao('Doação registrada com sucesso!', 'success');
    } catch (erro) {
        console.error('❌ Erro detalhado ao registrar doação:', erro);
        mostrarErro('Erro ao Registrar', `Não foi possível registrar a doação. Detalhes: ${erro.message}`);
    }
}

// ============================================
// ATUALIZAR TABELA DE HISTÓRICO
// ============================================

function atualizarTabelaDoacoes() {
    const bodyTabela = document.getElementById('bodyTabelaDoacoes');
    if (!bodyTabela) {
        console.warn('Elemento bodyTabelaDoacoes não encontrado');
        return;
    }

    // Validar se doacoes é um array válido
    if (!Array.isArray(doacoes)) {
        console.error('doacoes não é um array:', typeof doacoes);
        doacoes = [];
    }

    // Aplicar filtros
    const filtroId = document.getElementById('filtroIdHistorico')?.value.trim().toLowerCase() || '';
    const filtroMes = document.getElementById('filtroMesHistorico')?.value || '';

    let doadoesFiltradas = doacoes.filter(doacao => {
        // Validar estrutura de doação
        if (!doacao || !doacao.data) return false;

        // Filtro por ID
        if (filtroId && !doacao.pacienteId?.toLowerCase().includes(filtroId)) {
            return false;
        }

        // Filtro por mês
        if (filtroMes) {
            const dataParts = doacao.data.split('-');
            const mesDoacaoParts = filtroMes.split('-');
            if (dataParts[0] !== mesDoacaoParts[0] || dataParts[1] !== mesDoacaoParts[1]) {
                return false;
            }
        }

        return true;
    });

    // Ordenar por data (mais recente primeiro)
    doadoesFiltradas.sort((a, b) => new Date(b.data) - new Date(a.data));

    // Atualizar tabela
    if (doadoesFiltradas.length === 0) {
        bodyTabela.innerHTML = '<tr><td colspan="7" class="sem-dados">Nenhuma doação registrada</td></tr>';
        return;
    }

    bodyTabela.innerHTML = doadoesFiltradas.map(doacao => `
        <tr>
            <td>${formatarData(doacao.data)}</td>
            <td>${doacao.pacienteNome || 'N/A'}</td>
            <td>${doacao.pacienteId || 'N/A'}</td>
            <td>${doacao.tipoSanguineo || 'N/A'}</td>
            <td>${doacao.quantidade || 0}</td>
            <td>${doacao.observacao || '-'}</td>
            <td>
                <button class="btn-danger" onclick="window.moduloDoacao.excluirDoacao('${doacao.id}')">Excluir</button>
            </td>
        </tr>
    `).join('');
}

function limparFiltrosHistorico() {
    document.getElementById('filtroIdHistorico').value = '';
    document.getElementById('filtroMesHistorico').value = '';
    atualizarTabelaDoacoes();
}

// ============================================
// GRÁFICO SEMANAL
// ============================================

async function atualizarGraficoSemanal() {
    try {
        const { dataInicio, dataFim } = obterIntervaloSemanaSemanal();
        const doadoresSemanais = getDoadoresSemanais(dataInicio, dataFim);
        
        
        // Validar e atualizar elementos do DOM
        const dataInicioEl = document.getElementById('dataInicioSemana');
        const dataFimEl = document.getElementById('dataFimSemana');
        
        if (dataInicioEl) dataInicioEl.textContent = formatarData(dataInicio);
        if (dataFimEl) dataFimEl.textContent = formatarData(dataFim);
        
        // Atualizar tabela de doadores
        atualizarTabelaDoadoresSemanais(doadoresSemanais);
        
        // Atualizar gráfico
        desenharGrafico(doadoresSemanais);
    } catch (erro) {
        console.error('❌ Erro ao atualizar gráfico semanal:', erro);
    }
}

function obterIntervaloSemanaSemanal() {
    const hoje = new Date();
    
    // Obter o dia da semana (0 = domingo, 1 = segunda, ..., 6 = sábado)
    const diaDaSemana = hoje.getDay();
    
    // Calcular o domingo da semana (0 = domingo)
    const diasParaSubtrair = diaDaSemana === 0 ? 0 : diaDaSemana;
    const dataInicio = new Date(hoje);
    dataInicio.setDate(hoje.getDate() - diasParaSubtrair);
    dataInicio.setHours(0, 0, 0, 0);
    
    // Calcular o sábado (6 dias depois do domingo)
    const dataFim = new Date(dataInicio);
    dataFim.setDate(dataInicio.getDate() + 6);
    dataFim.setHours(23, 59, 59, 999);
    
    return {
        dataInicio: dataInicio.toISOString().split('T')[0],
        dataFim: dataFim.toISOString().split('T')[0],
        timestampInicio: dataInicio.getTime(),
        timestampFim: dataFim.getTime()
    };
}

function getDoadoresSemanais(dataInicio, dataFim) {
    const doadoresMap = {};
    
    // Validar array de doações
    if (!Array.isArray(doacoes)) {
        doacoes = Object.values(doacoes || {});
    }
    
    
    doacoes.forEach(doacao => {
        // Validar estrutura mínima
        if (!doacao || !doacao.data || !doacao.pacienteId) {
            console.warn('⚠️ Doação com estrutura inválida:', doacao);
            return;
        }
        
        if (doacao.data >= dataInicio && doacao.data <= dataFim) {
            if (!doadoresMap[doacao.pacienteId]) {
                doadoresMap[doacao.pacienteId] = {
                    pacienteId: doacao.pacienteId,
                    pacienteNome: doacao.pacienteNome || 'Desconhecido',
                    totalMl: 0,
                    numeroDoacoes: 0,
                    tipoSanguineo: doacao.tipoSanguineo || 'N/A'
                };
            }
            doadoresMap[doacao.pacienteId].totalMl += doacao.quantidade || 0;
            doadoresMap[doacao.pacienteId].numeroDoacoes += 1;
        }
    });
    
    // Converter para array e ordenar por quantidade
    const resultado = Object.values(doadoresMap)
        .sort((a, b) => b.totalMl - a.totalMl)
        .slice(0, 10); // Top 10
    
 
    return resultado;
}

function atualizarTabelaDoadoresSemanais(doadores) {
    const bodyTabela = document.getElementById('bodyTabelaDoadoresSemanais');
    if (!bodyTabela) {
        console.warn('Elemento bodyTabelaDoadoresSemanais não encontrado');
        return;
    }

    // Validar entrada
    if (!Array.isArray(doadores)) {
        console.error('doadores não é um array:', typeof doadores);
        doadores = [];
    }

    if (doadores.length === 0) {
        bodyTabela.innerHTML = '<tr><td colspan="5" class="sem-dados">Nenhuma doação nesta semana</td></tr>';
        return;
    }

    bodyTabela.innerHTML = doadores.map((doador, index) => `
        <tr>
            <td><strong>${index + 1}º</strong></td>
            <td>${doador.pacienteNome || 'N/A'}</td>
            <td>${doador.pacienteId || 'N/A'}</td>
            <td><strong>${doador.totalMl || 0} ml</strong></td>
            <td>${doador.numeroDoacoes || 0}</td>
        </tr>
    `).join('');
}

function desenharGrafico(doadores) {
    // Verificar se a seção de doações está visível
    const secaoDoarSangue = document.getElementById('doarSangue');
    if (secaoDoarSangue && secaoDoarSangue.classList.contains('modal-hidden')) {
        // Seção oculta - é normal não ter canvas disponível
        // O gráfico será renderizado quando a seção ficar visível
        return;
    }

    const ctx = document.getElementById('graficoDoadores');
    if (!ctx) {
        console.warn('⚠️ Canvas graficoDoadores não encontrado no DOM');
        console.warn('Nota: Se a seção estiver com display:none (modal-hidden), isso é normal. O gráfico será renderizado quando a seção fica visível.');
        return;
    }

    // Validar entrada
    if (!Array.isArray(doadores)) {
        console.error('❌ doadores não é um array em desenharGrafico:', typeof doadores);
        doadores = [];
    }

    // Destruir gráfico anterior
    if (graficoDoadores) {
        graficoDoadores.destroy();
    }

    // Se não há dados, não desenhar
    if (doadores.length === 0) {
        // Mostrar mensagem de ausência de dados
        const container = document.getElementById('containerGrafico');
        if (container) {
            container.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;">Nenhum dado para exibir</div>';
        }
        return;
    }

    const labels = doadores.map(d => d.pacienteNome || 'Desconhecido');
    const dados = doadores.map(d => d.totalMl || 0);
    
    // Cores gradientes
    const cores = [
        '#FF6B6B', '#FF8C8C', '#FFA5A5', '#FFC2C2', '#FFD9D9',
        '#FF5252', '#FF3D3D', '#FF2E2E', '#FF1F1F', '#FF0000'
    ];

    graficoDoadores = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total de Sangue Doado (ml)',
                data: dados,
                backgroundColor: cores.slice(0, doadores.length),
                borderColor: '#ff6b6b',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value + ' ml';
                        }
                    }
                }
            }
        }
    });
}

// ============================================
// RESET SEMANAL
// ============================================

function inicializarSemanasResetadas() {
    // Verificar se precisa fazer reset
    verificarResetSemanalmente();
    
    // Agendar verificação diária
    const proximaVerificacao = obterProximaVerificacao();
    setTimeout(() => {
        verificarResetSemanalmente();
        // Agendar verificações a cada 24 horas
        setInterval(verificarResetSemanalmente, 24 * 60 * 60 * 1000);
    }, proximaVerificacao);
}

function obterProximaVerificacao() {
    const agora = new Date();
    const proximoDomingo = new Date(agora);
    
    // Se hoje é domingo, agendar para 00:00 de hoje
    // Senão, agendar para 00:00 do próximo domingo
    const diasAteDomingo = (7 - agora.getDay()) % 7;
    
    if (diasAteDomingo === 0 && agora.getHours() < 0) {
        // Hoje é domingo e ainda não passou das 00:00
        proximoDomingo.setDate(agora.getDate());
    } else {
        proximoDomingo.setDate(agora.getDate() + diasAteDomingo);
    }
    
    proximoDomingo.setHours(0, 0, 0, 0);
    
    const tempoAte = proximoDomingo.getTime() - agora.getTime();
    return Math.max(tempoAte, 60000); // Mínimo de 1 minuto
}

async function verificarResetSemanalmente() {
    const agora = new Date();
    
    // Verificar se é segunda-feira (dia 1) às 00:00
    // (reset acontece no domingo 23:59, que é o início de segunda-feira 00:00)
    if (agora.getDay() === 1) {
        // Segunda-feira
        const hojeDate = agora.toISOString().split('T')[0];
        const ultimoReset = localStorage.getItem('ultimoResetDoacoes');
        
        if (ultimoReset !== hojeDate) {
            // Fazer reset
            await resetarSemanaDoacoes(true);
            localStorage.setItem('ultimoResetDoacoes', hojeDate);
        }
    }
}

async function resetarSemanaDoacoes(automatico = false) {
    if (!automatico && !temPermissao('admin', 'gerenciar')) {
        mostrarErro('Acesso Negado', 'Apenas administradores podem resetar manualmente');
        return;
    }

    if (!automatico) {
        const confirmado = await mostrarConfirmacaoPromise(
            'Confirmar Reset',
            'Tem certeza que deseja resetar as doações da semana anterior?'
        );
        if (!confirmado) return;
    }

    // As doações não são deletadas, apenas as estatísticas semanais são resetadas
    // O gráfico será atualizado automaticamente pois filtra pela data
    atualizarGraficoSemanal();
    
    if (!automatico) {
        mostrarNotificacao('Semana resetada com sucesso!', 'success');
    }
}

// ============================================
// EXCLUIR DOAÇÃO
// ============================================

export async function excluirDoacao(idDoacao) {
    if (!temPermissao('doacao', 'apagar')) {
        mostrarErro('Acesso Negado', 'Você não tem permissão para apagar doações');
        return;
    }

    const confirmado = await mostrarConfirmacaoPromise(
        'Confirmar Exclusão',
        'Tem certeza que deseja excluir esta doação?'
    );

    if (!confirmado) return;

    try {
        await deletarDoFirebase('doacoesSangue', idDoacao);
        
        doacoes = doacoes.filter(d => d.id !== idDoacao);
        
        atualizarTabelaDoacoes();
        atualizarGraficoSemanal();
        
        mostrarNotificacao('Doação excluída com sucesso!', 'success');
    } catch (erro) {
        mostrarErro('Erro ao Excluir', 'Não foi possível excluir a doação. Tente novamente.');
    }
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function formatarData(data) {
    if (!data) return '';
    
    const partes = data.split('-');
    if (partes.length === 3) {
        const dia = partes[2];
        const mes = partes[1];
        const ano = partes[0];
        return `${dia}/${mes}/${ano}`;
    }
    
    return data;
}

// Expor funções globais
window.moduloDoacao = {
    excluirDoacao,
    init,
    carregarDoacoes
};
