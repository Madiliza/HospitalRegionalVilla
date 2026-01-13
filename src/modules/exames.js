// ============================================
// MÓDULO DE EXAMES
// ============================================

import { mostrarNotificacao, mostrarConfirmacao, mostrarErro } from '../utils/dialogs.js';
import { salvarNoFirebase, deletarDoFirebase } from '../utils/firebase.js';
import { buscarPacientes as buscarPacientesGlobal } from './pacientes.js';
import { temPermissao } from '../utils/permissoes.js';

export let exames = [];

export function init(dadosCarregados) {
    exames = dadosCarregados.exames || [];
    configurarEventos();
    
    // Chamar atualizarLista de forma assíncrona para garantir que o DOM está pronto
    Promise.resolve().then(() => {
        setTimeout(() => {
            atualizarLista();
        }, 50);
    });
}

function configurarEventos() {
    const formExame = document.getElementById('formExame');
    if (formExame) {
        formExame.addEventListener('submit', (e) => {
            e.preventDefault();
            adicionarExame();
        });
    }
}

// ============================================
// MODAL EXAME
// ============================================
export function openModal() {
    document.getElementById('modalExame').classList.remove('modal-hidden');
    limparFormulario();
}

export function closeModal() {
    document.getElementById('modalExame').classList.add('modal-hidden');
}

function limparFormulario() {
    document.getElementById('formExame').reset();
    document.getElementById('buscaPacienteExame').value = '';
    document.getElementById('examePacienteId').value = '';
    document.getElementById('dadosPacienteExameDiv').classList.add('hidden');
    document.getElementById('sugestoesPacientesExame').classList.add('hidden');
}

// Busca de paciente
export function buscarPacientes() {
    const termo = document.getElementById('buscaPacienteExame').value.toLowerCase().trim();
    const sugestoes = document.getElementById('sugestoesPacientesExame');
    const listaSugestoes = document.getElementById('listaSugestoesExame');

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
        <div onclick="window.moduloExames.selecionarPaciente('${p.id}', '${p.nome}', '${p.idade}')" class="px-4 py-2 hover:bg-purple-100 cursor-pointer border-b border-gray-200 last:border-b-0">
            <div class="font-semibold text-gray-800">${p.id}</div>
            <div class="text-sm text-gray-600">${p.nome} - ${p.idade} anos</div>
        </div>
    `).join('');

    sugestoes.classList.remove('hidden');
}

export function selecionarPaciente(id, nome, idade) {
    document.getElementById('buscaPacienteExame').value = id;
    document.getElementById('examePacienteId').value = id;
    document.getElementById('idPacienteExameExibicao').textContent = id;
    document.getElementById('nomePacienteExameExibicao').textContent = nome;
    document.getElementById('idadePacienteExameExibicao').textContent = idade;
    document.getElementById('dadosPacienteExameDiv').classList.remove('hidden');
    document.getElementById('sugestoesPacientesExame').classList.add('hidden');
}

export function limparSelecaoPaciente() {
    document.getElementById('buscaPacienteExame').value = '';
    document.getElementById('examePacienteId').value = '';
    document.getElementById('dadosPacienteExameDiv').classList.add('hidden');
    document.getElementById('sugestoesPacientesExame').classList.add('hidden');
}

export async function adicionarExame() {
    // Verificar permissão
    if (!temPermissao('exame', 'criar')) {
        mostrarErro('Acesso Negado', 'Você não tem permissão para criar exames');
        return;
    }
    
    const pacienteId = document.getElementById('examePacienteId').value;
    const tipo = document.getElementById('exameTipo').value;
    const data = document.getElementById('exameData').value;
    const hora = document.getElementById('exameHora').value;

    if (!pacienteId || !tipo || !data || !hora) {
        mostrarErro('Campos Obrigatórios', 'Por favor, preencha todos os campos');
        return;
    }

    const pacienteExiste = buscarPacientesGlobal('').some(p => p.id === pacienteId);
    if (!pacienteExiste) {
        mostrarErro('Paciente Inválido', 'Paciente não encontrado');
        return;
    }

    const novoExame = {
        id: `EXAM-${Date.now()}`,
        pacienteId,
        tipo,
        data,
        hora,
        dataCriacao: new Date().toLocaleDateString('pt-BR')
    };

    exames.push(novoExame);

    try {
        await salvarNoFirebase('exames', novoExame);
    } catch (erro) {
        // Erro silencioso
    }

    closeModal();
    atualizarLista();

    mostrarNotificacao('Exame agendado com sucesso!', 'success');
}

export function atualizarLista() {
    const lista = document.getElementById('examesList');

    if (!lista) {
        return;
    }

    if (exames.length === 0) {
        lista.innerHTML = '<p class="text-gray-500 text-center py-8">Nenhum exame agendado</p>';
        return;
    }

    lista.innerHTML = exames.map(exame => `
        <div class="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-lg border-l-4 border-purple-600">
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <h3 class="text-lg font-bold text-gray-800">Exame: ${exame.tipo}</h3>
                    <p class="text-gray-600"><i class="fas fa-user mr-2"></i>Paciente ID: ${exame.pacienteId}</p>
                    <p class="text-gray-600"><i class="fas fa-calendar-alt mr-2"></i>${exame.data} às ${exame.hora}</p>
                    <p class="text-gray-600"><i class="fas fa-clock mr-2"></i>Agendado em: ${exame.dataCriacao}</p>
                </div>
                <button onclick="window.moduloExames.deletar('${exame.id}')" class="text-red-600 hover:text-red-800 transition">
                    <i class="fas fa-trash text-xl"></i>
                </button>
            </div>
        </div>
    `).join('');
}

export function deletar(id) {
    // Verificar permissão
    if (!temPermissao('exame', 'apagar')) {
        mostrarErro('Acesso Negado', 'Você não tem permissão para deletar exames');
        return;
    }
    
    mostrarConfirmacao(
        'Cancelar Exame',
        'Tem certeza que deseja cancelar este exame?',
        async () => {
            exames = exames.filter(e => e.id !== id);
            await deletarDoFirebase('exames', id);
            atualizarLista();
            mostrarNotificacao('Exame cancelado com sucesso!', 'success');
        }
    );
}

// Exportar como global
window.moduloExames = {
    openModal,
    closeModal,
    buscarPacientes,
    selecionarPaciente,
    limparSelecaoPaciente,
    deletar,
    atualizarLista
};
