// ============================================
// MÓDULO DE FARMÁCIA
// ============================================

import { mostrarNotificacao, mostrarConfirmacao, mostrarErro } from '../utils/dialogs.js';
import { salvarNoFirebase, deletarDoFirebase } from '../utils/firebase.js';
import { buscarPacientes as buscarPacientesGlobal } from './pacientes.js';

export let medicamentos = [];
export let medicamentosConfig = [];
let medicamentosSelecionados = {};

export function init(dadosCarregados) {
    medicamentos = dadosCarregados.medicamentos || [];
    medicamentosConfig = dadosCarregados.medicamentosConfig || [];
    configurarEventos();
    atualizarLista();
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
export function openModal() {
    document.getElementById('modalMedicamento').classList.remove('modal-hidden');
    limparFormulario();
    atualizarListaMedicamentosNoModal();
}

export function closeModal() {
    document.getElementById('modalMedicamento').classList.add('modal-hidden');
}

function limparFormulario() {
    document.getElementById('formMedicamento').reset();
    document.getElementById('buscaPacienteId').value = '';
    document.getElementById('medicamentoPacienteId').value = '';
    document.getElementById('resumoMedicamentos').innerHTML = '<p class="text-gray-600">Nenhum medicamento selecionado</p>';
    document.getElementById('totalItens').textContent = '0';
    document.getElementById('valorTotal').textContent = '0.00';
    document.getElementById('dadosPacienteDiv').classList.add('hidden');
    document.getElementById('sugestoesPacientes').classList.add('hidden');
    document.getElementById('secaoMedicamentosSelecionados').classList.add('hidden');
    medicamentosSelecionados = {};
}

// Busca de paciente
export function buscarPacientes() {
    const termo = document.getElementById('buscaPacienteId').value.toLowerCase().trim();
    const sugestoes = document.getElementById('sugestoesPacientes');
    const listaSugestoes = document.getElementById('listaSugestoes');

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

export function atualizarListaMedicamentosNoModal() {
    const lista = document.getElementById('listaMedicamentosDisponiveis');

    if (medicamentosConfig.length === 0) {
        lista.innerHTML = '<p class="text-gray-500 text-center py-4">Nenhum medicamento configurado</p>';
        return;
    }

    lista.innerHTML = medicamentosConfig.map(med => `
        <div class="p-4 bg-white rounded-lg border border-gray-200 flex items-center justify-between">
            <div>
                <h5 class="font-semibold text-gray-800">${med.nome}</h5>
                <p class="text-sm text-gray-600">R$ ${parseFloat(med.preco).toFixed(2)}</p>
            </div>
            <button type="button" onclick="window.moduloFarmacia.selecionarMedicamento('${med.id}', '${med.nome}', ${med.preco})" class="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition">
                Adicionar
            </button>
        </div>
    `).join('');
}

export function selecionarMedicamento(id, nome, preco) {
    if (!medicamentosSelecionados[id]) {
        medicamentosSelecionados[id] = {
            id,
            nome,
            preco: parseFloat(preco),
            quantidade: 1
        };
    } else {
        medicamentosSelecionados[id].quantidade++;
    }

    document.getElementById('secaoMedicamentosSelecionados').classList.remove('hidden');
    atualizarListaMedicamentosSelecionados();
    atualizarResume();
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
    } else {
        medicamentosSelecionados[id].quantidade = quantidade;
        atualizarResume();
    }
}

export function atualizarListaMedicamentosSelecionados() {
    const div = document.getElementById('medicamentosSelecionadosDiv');

    if (Object.keys(medicamentosSelecionados).length === 0) {
        div.innerHTML = '<p class="text-gray-500 text-sm">Nenhum medicamento selecionado</p>';
        return;
    }

    div.innerHTML = Object.entries(medicamentosSelecionados).map(([id, med]) => `
        <div class="p-3 bg-gray-50 rounded-lg flex items-center justify-between border border-gray-200">
            <div class="flex-1">
                <p class="font-semibold text-gray-800">${med.nome}</p>
                <p class="text-sm text-gray-600">R$ ${med.preco.toFixed(2)}</p>
            </div>
            <div class="flex items-center space-x-2">
                <input type="number" value="${med.quantidade}" min="1" onchange="window.moduloFarmacia.atualizarQuantidadeMedicamento('${id}', this.value)" class="w-16 px-2 py-1 border border-gray-300 rounded">
                <button type="button" onclick="window.moduloFarmacia.removerMedicamentoSelecionado('${id}')" class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm">
                    Remover
                </button>
            </div>
        </div>
    `).join('');
}

export function atualizarResume() {
    const medicatmentosArray = Object.values(medicamentosSelecionados);
    const totalItens = medicatmentosArray.reduce((sum, med) => sum + med.quantidade, 0);
    const valorTotal = medicatmentosArray.reduce((sum, med) => sum + (med.preco * med.quantidade), 0);

    document.getElementById('totalItens').textContent = totalItens;
    document.getElementById('valorTotal').textContent = valorTotal.toFixed(2);

    const resumo = document.getElementById('resumoMedicamentos');
    if (medicatmentosArray.length === 0) {
        resumo.innerHTML = '<p class="text-gray-600">Nenhum medicamento selecionado</p>';
    } else {
        resumo.innerHTML = medicatmentosArray.map(med => `
            <div class="flex justify-between text-sm text-gray-700">
                <span>${med.nome} x${med.quantidade}</span>
                <span>R$ ${(med.preco * med.quantidade).toFixed(2)}</span>
            </div>
        `).join('');
    }
}

export async function adicionarMedicamento() {
    const pacienteId = document.getElementById('medicamentoPacienteId').value;

    if (!pacienteId) {
        mostrarErro('Paciente Obrigatório', 'Selecione um paciente');
        return;
    }

    if (Object.keys(medicamentosSelecionados).length === 0) {
        mostrarErro('Medicamentos Obrigatórios', 'Selecione pelo menos um medicamento');
        return;
    }

    const medicamentosArray = Object.values(medicamentosSelecionados);
    const novoAtendimento = {
        id: `MED-${Date.now()}`,
        pacienteId,
        medicamentos: medicamentosArray,
        dataAtendimento: new Date().toLocaleDateString('pt-BR'),
        horaAtendimento: new Date().toLocaleTimeString('pt-BR'),
        valorTotal: medicamentosArray.reduce((sum, med) => sum + (med.preco * med.quantidade), 0)
    };

    medicamentos.push(novoAtendimento);

    try {
        await salvarNoFirebase('medicamentos', novoAtendimento);
    } catch (erro) {
        console.error('Erro ao salvar medicamentos:', erro);
    }

    closeModal();
    atualizarLista();

    mostrarNotificacao('Atendimento registrado com sucesso!', 'success');
}

export function atualizarLista() {
    const lista = document.getElementById('farmaciaList');

    if (medicamentos.length === 0) {
        lista.innerHTML = '<p class="text-gray-500 text-center py-8">Nenhum atendimento registrado</p>';
        return;
    }

    const medicamentosPorPaciente = {};
    medicamentos.forEach(med => {
        if (!medicamentosPorPaciente[med.pacienteId]) {
            medicamentosPorPaciente[med.pacienteId] = [];
        }
        medicamentosPorPaciente[med.pacienteId].push(med);
    });

    lista.innerHTML = Object.entries(medicamentosPorPaciente).map(([pacienteId, atendimentos]) => {
        const totalValor = atendimentos.reduce((sum, a) => sum + a.valorTotal, 0);
        const totalMedicamentos = atendimentos.reduce((sum, a) => sum + a.medicamentos.reduce((s, m) => s + m.quantidade, 0), 0);

        return `
            <div class="bg-gradient-to-r from-orange-50 to-orange-100 p-6 rounded-lg border-l-4 border-orange-600">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <h3 class="text-lg font-bold text-gray-800">Paciente: ${pacienteId}</h3>
                        <p class="text-gray-600 mt-2"><i class="fas fa-pills mr-2"></i>Total de Medicamentos: ${totalMedicamentos}</p>
                        <p class="text-gray-600"><i class="fas fa-money-bill mr-2"></i>Valor Total: R$ ${totalValor.toFixed(2)}</p>
                        <div class="mt-3 space-y-1">
                            ${atendimentos.map(a => `
                                <div class="text-sm text-gray-700">
                                    <span class="font-semibold">${a.dataAtendimento} ${a.horaAtendimento}</span> - 
                                    ${a.medicamentos.map(m => `${m.nome} (${m.quantidade})`).join(', ')}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <button onclick="window.moduloFarmacia.apagarAtendimento('${pacienteId}')" class="text-red-600 hover:text-red-800 transition">
                        <i class="fas fa-trash text-xl"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

export function apagarAtendimento(pacienteId) {
    mostrarConfirmacao(
        'Apagar Atendimento',
        `Tem certeza que deseja apagar TODO o atendimento do paciente ${pacienteId}?\n\nTodos os medicamentos registrados serão removidos permanentemente.`,
        async () => {
            medicamentos = medicamentos.filter(m => m.pacienteId !== pacienteId);
            await deletarDoFirebase('medicamentos', pacienteId);
            atualizarLista();
            mostrarNotificacao('Atendimento removido com sucesso!', 'success');
        }
    );
}

export function deletar(id) {
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
    deletar,
    apagarAtendimento,
    atualizarLista
};
