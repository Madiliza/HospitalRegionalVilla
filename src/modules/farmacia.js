// ============================================
// MÓDULO DE FARMÁCIA
// ============================================

import { mostrarNotificacao, mostrarConfirmacao, mostrarErro } from '../utils/dialogs.js';
import { salvarNoFirebase, deletarDoFirebase } from '../utils/firebase.js';
import { buscarPacientes as buscarPacientesGlobal } from './pacientes.js';
import { temPermissao } from '../utils/permissoes.js';

export let medicamentos = [];
export let medicamentosConfig = [];
let medicamentosSelecionados = {};

export function init(dadosCarregados) {
    medicamentos = dadosCarregados.medicamentos || [];
    medicamentosConfig = dadosCarregados.medicamentosConfig || [];
    configurarEventos();
    
    // Chamar atualizarLista de forma assíncrona para garantir que o DOM está pronto
    Promise.resolve().then(() => {
        setTimeout(() => {
            atualizarLista();
        }, 50);
    });
}

function configurarEventos() {
    const formMedicamento = document.getElementById('formMedicamento');
    if (formMedicamento) {
        formMedicamento.addEventListener('submit', (e) => {
            e.preventDefault();
            adicionarMedicamento();
        });
    }
}

// ============================================
// MODAL MEDICAMENTO
// ============================================
// HELPERS SEGUROS
// ============================================
function safeSetClass(id, operation, className) {
    const elem = document.getElementById(id);
    if (elem) {
        if (operation === 'add') elem.classList.add(className);
        else if (operation === 'remove') elem.classList.remove(className);
    }
}

function safeSetHTML(id, html) {
    const elem = document.getElementById(id);
    if (elem) elem.innerHTML = html;
}

function safeSetValue(id, value) {
    const elem = document.getElementById(id);
    if (elem) elem.value = value;
}

function safeSetText(id, text) {
    const elem = document.getElementById(id);
    if (elem) elem.textContent = text;
}

function safeResetForm(id) {
    const elem = document.getElementById(id);
    if (elem && elem.reset) elem.reset();
}

// ============================================
export function openModal() {
    safeSetClass('modalMedicamento', 'remove', 'modal-hidden');
    limparFormulario();
    atualizarListaMedicamentosNoModal();
}

export function closeModal() {
    safeSetClass('modalMedicamento', 'add', 'modal-hidden');
}

function limparFormulario() {
    safeResetForm('formMedicamento');
    safeSetValue('buscaPacienteId', '');
    safeSetValue('medicamentoPacienteId', '');
    safeSetHTML('resumoMedicamentos', '<p class="text-gray-600">Nenhum medicamento selecionado</p>');
    safeSetText('totalItens', '0');
    safeSetText('valorTotal', '0.00');
    safeSetClass('dadosPacienteDiv', 'add', 'hidden');
    safeSetClass('sugestoesPacientes', 'add', 'hidden');
    safeSetClass('secaoMedicamentosSelecionados', 'add', 'hidden');
    const atendimento = document.getElementById('atendimentoParceria');
    if (atendimento) atendimento.checked = false;
    safeSetHTML('tipoPrecoBadge', '<span class="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold">Preço Normal</span>');
    medicamentosSelecionados = {};
}

// Busca de paciente
export function buscarPacientes() {
    const buscaInput = document.getElementById('buscaPacienteId');
    const sugestoes = document.getElementById('sugestoesPacientes');
    const listaSugestoes = document.getElementById('listaSugestoes');
    
    if (!buscaInput || !sugestoes || !listaSugestoes) {
        return;
    }
    
    const termo = buscaInput.value.toLowerCase().trim();

    if (termo.length === 0) {
        sugestoes.classList.add('hidden');
        return;
    }

    const pacientesFiltrados = buscarPacientesGlobal(termo);

    if (pacientesFiltrados.length === 0) {
        listaSugestoes.innerHTML = '<p class="px-4 py-2 text-gray-500">Nenhum paciente encontrado</p>';
        sugestoes.classList.remove('hidden');
        return;
    }

    listaSugestoes.innerHTML = pacientesFiltrados.map(p => `
        <div onclick="window.moduloFarmacia.selecionarPaciente('${p.id}', '${p.nome}', '${p.idade}')" class="px-4 py-2 hover:bg-orange-100 cursor-pointer border-b border-gray-200 last:border-b-0">
            <div class="font-semibold text-gray-800">${p.id}</div>
            <div class="text-sm text-gray-600">${p.nome} - ${p.idade} anos</div>
        </div>
    `).join('');

    sugestoes.classList.remove('hidden');
}

export function selecionarPaciente(id, nome, idade) {
    document.getElementById('buscaPacienteId').value = id;
    document.getElementById('medicamentoPacienteId').value = id;
    document.getElementById('idPacienteExibicao').textContent = id;
    document.getElementById('nomePacienteExibicao').textContent = nome;
    document.getElementById('idadePacienteExibicao').textContent = idade;
    document.getElementById('dadosPacienteDiv').classList.remove('hidden');
    document.getElementById('sugestoesPacientes').classList.add('hidden');
}

export function limparSelecaoPaciente() {
    document.getElementById('buscaPacienteId').value = '';
    document.getElementById('medicamentoPacienteId').value = '';
    document.getElementById('dadosPacienteDiv').classList.add('hidden');
    document.getElementById('sugestoesPacientes').classList.add('hidden');
}

// Função para obter quantidade já dispensada hoje para um paciente
function getQuantidadeDispensadaHoje(pacienteId, medicamentoId) {
    const hoje = new Date().toLocaleDateString('pt-BR');
    return medicamentos
        .filter(m => m.pacienteId === pacienteId && m.dataAtendimento === hoje)
        .reduce((total, atendimento) => {
            const meds = atendimento.medicamentos || [];
            const med = meds.find(m => m.id === medicamentoId);
            return total + (med ? med.quantidade : 0);
        }, 0);
}

// Função para obter o limite máximo de um medicamento
function getLimiteMedicamento(medicamentoId) {
    const config = medicamentosConfig.find(m => m.id === medicamentoId);
    if (!config) return 999;
    
    const isParceria = isAtendimentoParceria();
    if (isParceria && config.qtdMaxParceria) {
        return parseInt(config.qtdMaxParceria) || 999;
    }
    return parseInt(config.qtdMax) || 999;
}

// Função para verificar se é atendimento com parceria
function isAtendimentoParceria() {
    const checkbox = document.getElementById('atendimentoParceria');
    return checkbox ? checkbox.checked : false;
}

// Função para obter o preço correto (normal ou parceria)
function getPrecoMedicamento(medicamentoId) {
    const config = medicamentosConfig.find(m => m.id === medicamentoId);
    if (!config) return 0;
    
    if (isAtendimentoParceria()) {
        return parseFloat(config.precoParceria) || parseFloat(config.preco) || 0;
    }
    return parseFloat(config.preco) || 0;
}

// Função para toggle de parceria - atualiza preços
export function toggleParceria() {
    const isParceria = isAtendimentoParceria();
    const badge = document.getElementById('tipoPrecoBadge');
    
    if (isParceria) {
        badge.innerHTML = '<span class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold"><i class="fas fa-handshake mr-1"></i>Preço Parceria</span>';
    } else {
        badge.innerHTML = '<span class="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold">Preço Normal</span>';
    }
    
    // Atualizar preços dos medicamentos já selecionados
    Object.keys(medicamentosSelecionados).forEach(id => {
        const config = medicamentosConfig.find(m => m.id === id);
        if (config) {
            medicamentosSelecionados[id].preco = getPrecoMedicamento(id);
            medicamentosSelecionados[id].precoParceria = parseFloat(config.precoParceria) || 0;
        }
    });
    
    atualizarListaMedicamentosNoModal();
    atualizarListaMedicamentosSelecionados();
    atualizarResume();
}

export function atualizarListaMedicamentosNoModal() {
    const lista = document.getElementById('listaMedicamentosDisponiveis');
    const pacienteId = document.getElementById('medicamentoPacienteId');
    
    if (!lista || !pacienteId) {
        return;
    }
    
    const pacienteIdValue = pacienteId.value;
    const isParceria = isAtendimentoParceria();

    if (medicamentosConfig.length === 0) {
        lista.innerHTML = '<p class="text-gray-500 text-center py-4">Nenhum medicamento configurado</p>';
        return;
    }

    lista.innerHTML = medicamentosConfig.map(med => {
        // Usar limite de parceria se marcado, senão limite normal
        const qtdMaxAplicavel = isParceria && med.qtdMaxParceria ? parseInt(med.qtdMaxParceria) : parseInt(med.qtdMax);
        const qtdMax = qtdMaxAplicavel || 999;
        const jaDispensado = pacienteIdValue ? getQuantidadeDispensadaHoje(pacienteIdValue, med.id) : 0;
        const disponivel = qtdMax - jaDispensado;
        const desabilitado = disponivel <= 0;
        const precoNormal = parseFloat(med.preco) || 0;
        const precoParceria = parseFloat(med.precoParceria) || 0;
        const precoAtual = isParceria ? precoParceria : precoNormal;
        
        return `
        <div class="p-4 bg-white rounded-lg border border-gray-200 flex items-center justify-between ${desabilitado ? 'opacity-50' : ''}">
            <div>
                <h5 class="font-semibold text-gray-800">${med.nome}</h5>
                <div class="flex gap-3 text-sm">
                    <span class="${!isParceria ? 'text-orange-600 font-bold' : 'text-gray-400 line-through'}">R$ ${precoNormal.toFixed(2)}</span>
                    <span class="${isParceria ? 'text-green-600 font-bold' : 'text-gray-400'}"><i class="fas fa-handshake mr-1"></i>R$ ${precoParceria.toFixed(2)}</span>
                </div>
                <p class="text-xs ${desabilitado ? 'text-red-600 font-bold' : 'text-gray-500'}">Limite diário: ${qtdMax} | Dispensado hoje: ${jaDispensado} | Disponível: ${disponivel > 0 ? disponivel : 0}</p>
            </div>
            <button type="button" 
                onclick="window.moduloFarmacia.selecionarMedicamento('${med.id}', '${med.nome}', ${precoAtual}, ${qtdMax}, ${precoParceria})" 
                class="px-4 py-2 ${desabilitado ? 'bg-gray-400 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700'} text-white rounded-lg transition"
                ${desabilitado ? 'disabled' : ''}>
                ${desabilitado ? 'Limite atingido' : 'Adicionar'}
            </button>
        </div>
    `}).join('');
}

export function selecionarMedicamento(id, nome, preco, qtdMax, precoParceria) {
    const pacienteId = document.getElementById('medicamentoPacienteId').value;
    const limiteMax = qtdMax || getLimiteMedicamento(id);
    const jaDispensadoHoje = pacienteId ? getQuantidadeDispensadaHoje(pacienteId, id) : 0;
    const jaSelecionado = medicamentosSelecionados[id]?.quantidade || 0;
    const totalComNovo = jaDispensadoHoje + jaSelecionado + 1;

    if (totalComNovo > limiteMax) {
        mostrarErro('Limite Excedido', `O paciente já atingiu o limite diário de ${limiteMax} unidades para ${nome}. Já dispensado hoje: ${jaDispensadoHoje}, Selecionado: ${jaSelecionado}`);
        return;
    }

    const config = medicamentosConfig.find(m => m.id === id);
    const precoNormal = config ? parseFloat(config.preco) : parseFloat(preco);
    const precoParceriaVal = config ? parseFloat(config.precoParceria) || 0 : (precoParceria || 0);

    if (!medicamentosSelecionados[id]) {
        medicamentosSelecionados[id] = {
            id,
            nome,
            preco: isAtendimentoParceria() ? precoParceriaVal : precoNormal,
            precoNormal: precoNormal,
            precoParceria: precoParceriaVal,
            quantidade: 1,
            qtdMax: limiteMax
        };
    } else {
        medicamentosSelecionados[id].quantidade++;
    }

    document.getElementById('secaoMedicamentosSelecionados').classList.remove('hidden');
    atualizarListaMedicamentosSelecionados();
    atualizarResume();
    atualizarListaMedicamentosNoModal(); // Atualizar disponibilidade
}

export function removerMedicamentoSelecionado(id) {
    delete medicamentosSelecionados[id];
    if (Object.keys(medicamentosSelecionados).length === 0) {
        document.getElementById('secaoMedicamentosSelecionados').classList.add('hidden');
    }
    atualizarListaMedicamentosSelecionados();
    atualizarResume();
}

export function atualizarQuantidadeMedicamento(id, novaQuantidade) {
    const quantidade = parseInt(novaQuantidade);
    if (quantidade <= 0) {
        removerMedicamentoSelecionado(id);
        return;
    }

    const pacienteId = document.getElementById('medicamentoPacienteId').value;
    const limiteMax = medicamentosSelecionados[id]?.qtdMax || getLimiteMedicamento(id);
    const jaDispensadoHoje = pacienteId ? getQuantidadeDispensadaHoje(pacienteId, id) : 0;
    const limiteDisponivel = limiteMax - jaDispensadoHoje;

    // Validação considerando soma com o que já foi dispensado hoje
    if (jaDispensadoHoje + quantidade > limiteMax) {
        mostrarErro('Limite Excedido', `Quantidade máxima disponível para hoje: ${limiteDisponivel}. Já dispensado: ${jaDispensadoHoje}, Limite diário: ${limiteMax}`);
        medicamentosSelecionados[id].quantidade = limiteDisponivel > 0 ? limiteDisponivel : 1;
        atualizarListaMedicamentosSelecionados();
        atualizarResume();
        return;
    }

    medicamentosSelecionados[id].quantidade = quantidade;
    atualizarResume();
}

export function atualizarListaMedicamentosSelecionados() {
    const div = document.getElementById('medicamentosSelecionadosDiv');
    const pacienteIdElement = document.getElementById('medicamentoPacienteId');

    if (!div || !pacienteIdElement) {
        return;
    }

    if (Object.keys(medicamentosSelecionados).length === 0) {
        div.innerHTML = '<p class="text-gray-500 text-sm">Nenhum medicamento selecionado</p>';
        return;
    }

    const pacienteId = pacienteIdElement.value;
    const isParceria = isAtendimentoParceria();
    
    div.innerHTML = Object.entries(medicamentosSelecionados).map(([id, med]) => {
        const limiteMax = med.qtdMax || getLimiteMedicamento(id);
        const jaDispensadoHoje = pacienteId ? getQuantidadeDispensadaHoje(pacienteId, id) : 0;
        const limiteDisponivel = limiteMax - jaDispensadoHoje;
        const precoAtual = isParceria ? (med.precoParceria || med.preco) : (med.precoNormal || med.preco);
        
        return `
        <div class="p-3 bg-gray-50 rounded-lg flex items-center justify-between border border-gray-200">
            <div class="flex-1">
                <p class="font-semibold text-gray-800">${med.nome}</p>
                <p class="text-sm ${isParceria ? 'text-green-600' : 'text-orange-600'}">R$ ${precoAtual.toFixed(2)} ${isParceria ? '<i class="fas fa-handshake ml-1"></i>' : ''}</p>
                <p class="text-xs text-gray-500">Limite: ${limiteMax} | Já dispensado hoje: ${jaDispensadoHoje} | Máx disponível: ${limiteDisponivel}</p>
            </div>
            <div class="flex items-center space-x-2">
                <input type="number" value="${med.quantidade}" min="1" max="${limiteDisponivel}" onchange="window.moduloFarmacia.atualizarQuantidadeMedicamento('${id}', this.value)" class="w-16 px-2 py-1 border border-gray-300 rounded">
                <button type="button" onclick="window.moduloFarmacia.removerMedicamentoSelecionado('${id}')" class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm">
                    Remover
                </button>
            </div>
        </div>
    `}).join('');
}

export function atualizarResume() {
    const medicatmentosArray = Object.values(medicamentosSelecionados);
    const isParceria = isAtendimentoParceria();
    const totalItens = medicatmentosArray.reduce((sum, med) => sum + med.quantidade, 0);
    const valorTotal = medicatmentosArray.reduce((sum, med) => {
        const preco = isParceria ? (med.precoParceria || med.preco) : (med.precoNormal || med.preco);
        return sum + (preco * med.quantidade);
    }, 0);

    safeSetText('totalItens', totalItens);
    safeSetText('valorTotal', valorTotal.toFixed(2));

    const resumo = document.getElementById('resumoMedicamentos');
    if (!resumo) {
        return;
    }
    
    if (medicatmentosArray.length === 0) {
        resumo.innerHTML = '<p class="text-gray-600">Nenhum medicamento selecionado</p>';
    } else {
        resumo.innerHTML = medicatmentosArray.map(med => {
            const preco = isParceria ? (med.precoParceria || med.preco) : (med.precoNormal || med.preco);
            return `
            <div class="flex justify-between text-sm text-gray-700">
                <span>${med.nome} x${med.quantidade}</span>
                <span>R$ ${(preco * med.quantidade).toFixed(2)}</span>
            </div>
        `}).join('');
    }
}

export async function adicionarMedicamento() {
    // Verificar permissão
    if (!temPermissao('farmacia', 'criar')) {
        mostrarErro('Acesso Negado', 'Você não tem permissão para registrar medicamentos');
        return;
    }
    
    const pacienteId = document.getElementById('medicamentoPacienteId').value;
    const isParceria = isAtendimentoParceria();

    if (!pacienteId) {
        mostrarErro('Paciente Obrigatório', 'Selecione um paciente');
        return;
    }

    if (Object.keys(medicamentosSelecionados).length === 0) {
        mostrarErro('Medicamentos Obrigatórios', 'Selecione pelo menos um medicamento');
        return;
    }

    // Validar limites antes de salvar
    const medicamentosArray = Object.values(medicamentosSelecionados).map(med => {
        const preco = isParceria ? (med.precoParceria || med.preco) : (med.precoNormal || med.preco);
        return {
            ...med,
            preco: preco
        };
    });
    const errosLimite = [];
    
    for (const med of medicamentosArray) {
        const limiteMax = med.qtdMax || getLimiteMedicamento(med.id);
        const jaDispensadoHoje = getQuantidadeDispensadaHoje(pacienteId, med.id);
        const totalAposAtendimento = jaDispensadoHoje + med.quantidade;
        
        if (totalAposAtendimento > limiteMax) {
            errosLimite.push(`${med.nome}: solicitado ${med.quantidade}, já dispensado ${jaDispensadoHoje}, limite ${limiteMax}`);
        }
    }

    if (errosLimite.length > 0) {
        mostrarErro('Limites Excedidos', `Os seguintes medicamentos excedem o limite diário:\n\n${errosLimite.join('\n')}`);
        return;
    }

    const novoAtendimento = {
        id: `MED-${Date.now()}`,
        pacienteId,
        medicamentos: medicamentosArray,
        dataAtendimento: new Date().toLocaleDateString('pt-BR'),
        horaAtendimento: new Date().toLocaleTimeString('pt-BR'),
        valorTotal: medicamentosArray.reduce((sum, med) => sum + (med.preco * med.quantidade), 0),
        isParceria: isParceria
    };

    medicamentos.push(novoAtendimento);

    try {
        await salvarNoFirebase('medicamentos', novoAtendimento);
    } catch (erro) {
        // Erro silencioso
    }

    closeModal();
    atualizarLista();

    mostrarNotificacao('Atendimento registrado com sucesso!', 'success');
}

export function atualizarLista() {
    const lista = document.getElementById('farmaciaList');

    if (!lista) {
        return;
    }

    if (medicamentos.length === 0) {
        lista.innerHTML = '<p class="text-gray-500 text-center py-8">Nenhum atendimento registrado</p>';
        return;
    }

    // Ordenar por data/hora mais recente primeiro
    const atendimentosOrdenados = [...medicamentos].sort((a, b) => {
        const dataA = new Date(`${a.dataAtendimento} ${a.horaAtendimento}`);
        const dataB = new Date(`${b.dataAtendimento} ${b.horaAtendimento}`);
        return dataB - dataA;
    });

    lista.innerHTML = atendimentosOrdenados.map(atendimento => {
        const meds = atendimento.medicamentos || [];
        const totalMedicamentos = meds.reduce((sum, m) => sum + (m.quantidade || 0), 0);
        const isParceria = atendimento.isParceria || false;
        
        return `
            <div class="bg-gradient-to-r ${isParceria ? 'from-green-50 to-green-100 border-green-600' : 'from-orange-50 to-orange-100 border-orange-600'} p-6 rounded-lg border-l-4">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="flex items-center gap-3 mb-2">
                            <span class="${isParceria ? 'bg-green-600' : 'bg-orange-600'} text-white text-xs px-2 py-1 rounded">${atendimento.id}</span>
                            ${isParceria ? '<span class="bg-green-100 text-green-700 text-xs px-2 py-1 rounded"><i class="fas fa-handshake mr-1"></i>Parceria</span>' : ''}
                            <span class="text-sm text-gray-500">${atendimento.dataAtendimento || ''} às ${atendimento.horaAtendimento || ''}</span>
                        </div>
                        <h3 class="text-lg font-bold text-gray-800"><i class="fas fa-user mr-2"></i>Paciente: ${atendimento.pacienteId}</h3>
                        <div class="mt-3 bg-white p-3 rounded-lg">
                            <p class="text-sm font-semibold text-gray-700 mb-2"><i class="fas fa-pills mr-2"></i>Medicamentos (${totalMedicamentos} itens):</p>
                            <div class="space-y-1">
                                ${meds.length > 0 ? meds.map(m => `
                                    <div class="flex justify-between text-sm text-gray-600">
                                        <span>${m.nome} x${m.quantidade}</span>
                                        <span>R$ ${((m.preco || 0) * (m.quantidade || 0)).toFixed(2)}</span>
                                    </div>
                                `).join('') : '<p class="text-gray-500 text-sm">Sem medicamentos</p>'}
                            </div>
                        </div>
                        <p class="text-gray-800 font-bold mt-3"><i class="fas fa-money-bill mr-2"></i>Valor Total: R$ ${(atendimento.valorTotal || 0).toFixed(2)}</p>
                    </div>
                    <button onclick="window.moduloFarmacia.deletar('${atendimento.id}')" class="text-red-600 hover:text-red-800 transition">
                        <i class="fas fa-trash text-xl"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

export function apagarAtendimento(pacienteId) {
    mostrarConfirmacao(
        'Apagar Todos os Atendimentos',
        `Tem certeza que deseja apagar TODOS os atendimentos do paciente ${pacienteId}?\n\nTodos os medicamentos registrados serão removidos permanentemente.`,
        async () => {
            const idsParaDeletar = medicamentos.filter(m => m.pacienteId === pacienteId).map(m => m.id);
            medicamentos = medicamentos.filter(m => m.pacienteId !== pacienteId);
            
            // Deletar cada atendimento individualmente do Firebase
            for (const id of idsParaDeletar) {
                await deletarDoFirebase('medicamentos', id);
            }
            
            atualizarLista();
            mostrarNotificacao('Atendimento removido com sucesso!', 'success');
        }
    );
}

export function deletar(id) {
    // Verificar permissão
    if (!temPermissao('farmacia', 'apagar')) {
        mostrarErro('Acesso Negado', 'Você não tem permissão para deletar medicamentos');
        return;
    }
    
    mostrarConfirmacao(
        'Remover Medicamento',
        'Tem certeza que deseja remover este medicamento?',
        async () => {
            medicamentos = medicamentos.filter(m => m.id !== id);
            await deletarDoFirebase('medicamentos', id);
            atualizarLista();
            mostrarNotificacao('Medicamento removido com sucesso!', 'success');
        }
    );
}

// Exportar como global
window.moduloFarmacia = {
    openModal,
    closeModal,
    buscarPacientes,
    selecionarPaciente,
    limparSelecaoPaciente,
    selecionarMedicamento,
    removerMedicamentoSelecionado,
    atualizarQuantidadeMedicamento,
    toggleParceria,
    deletar,
    apagarAtendimento,
    atualizarLista
};
