// ============================================
// MÓDULO DE PACIENTES
// ============================================

import { mostrarNotificacao, mostrarConfirmacao, mostrarErro } from '../utils/dialogs.js';
import { salvarNoFirebase, deletarDoFirebase } from '../utils/firebase.js';
import { temPermissao } from '../utils/permissoes.js';
export let pacientes = [];

export function init(dadosCarregados) {
    pacientes = dadosCarregados.pacientes || [];
    configurarEventos();
    
    // Chamar atualizarLista de forma assíncrona para garantir que o DOM está pronto
    Promise.resolve().then(() => {
        setTimeout(() => {
            atualizarLista();
        }, 50);
    });
}

function configurarEventos() {
    const formPaciente = document.getElementById('formPaciente');
    if (formPaciente) {
        formPaciente.addEventListener('submit', (e) => {
            e.preventDefault();
            adicionarPaciente();
        });
    }
}

// ============================================
// MODAL PACIENTE
// ============================================
export function openModal() {
    document.getElementById('modalPaciente').classList.remove('modal-hidden');
    limparFormulario();
    document.getElementById('modalTitle').textContent = 'Novo Paciente';
    document.getElementById('pacienteId').disabled = false;
    document.getElementById('pacienteEditId').value = '';
}

export function closeModal() {
    document.getElementById('modalPaciente').classList.add('modal-hidden');
}

function limparFormulario() {
    document.getElementById('formPaciente').reset();
}

export function openEditModal(id) {
    // Verificar permissão
    if (!temPermissao('paciente', 'editar')) {
        mostrarErro('Acesso Negado', 'Você não tem permissão para editar pacientes');
        return;
    }

    const paciente = pacientes.find(p => p.id === id);
    if (!paciente) {
        mostrarErro('Erro', 'Paciente não encontrado');
        return;
    }

    // Preencher formulário
    document.getElementById('pacienteId').value = paciente.id;
    document.getElementById('pacienteNome').value = paciente.nome;
    document.getElementById('pacienteIdade').value = paciente.idade;
    document.getElementById('pacienteTipoSanguineo').value = paciente.tipoSanguineo;
    document.getElementById('pacienteObservacao').value = paciente.observacao || '';
    document.getElementById('pacienteEditId').value = id;

    // Desabilitar campo de ID
    document.getElementById('pacienteId').disabled = true;

    // Atualizar título
    document.getElementById('modalTitle').textContent = 'Editar Paciente';

    // Abrir modal
    document.getElementById('modalPaciente').classList.remove('modal-hidden');
}

export async function adicionarPaciente() {
    const editId = document.getElementById('pacienteEditId').value;
    const isEdicao = !!editId;

    // Verificar permissão
    if (isEdicao) {
        if (!temPermissao('paciente', 'editar')) {
            mostrarErro('Acesso Negado', 'Você não tem permissão para editar pacientes');
            return;
        }
    } else {
        if (!temPermissao('paciente', 'criar')) {
            mostrarErro('Acesso Negado', 'Você não tem permissão para criar pacientes');
            return;
        }
    }
    
    const id = document.getElementById('pacienteId').value;
    const nome = document.getElementById('pacienteNome').value;
    const idade = document.getElementById('pacienteIdade').value;
    const tipoSanguineo = document.getElementById('pacienteTipoSanguineo').value;
    const observacao = document.getElementById('pacienteObservacao').value;

    if (!id || !nome || !idade || !tipoSanguineo) {
        mostrarErro('Campos Obrigatórios', 'Por favor, preencha ID, Nome, Idade e Tipo Sanguíneo');
        return;
    }

    if (isEdicao) {
        // Editar paciente existente
        const indexPaciente = pacientes.findIndex(p => p.id === editId);
        if (indexPaciente === -1) {
            mostrarErro('Erro', 'Paciente não encontrado');
            return;
        }

        const pacienteAtualizado = {
            ...pacientes[indexPaciente],
            nome,
            idade: parseInt(idade),
            tipoSanguineo,
            observacao
        };

        pacientes[indexPaciente] = pacienteAtualizado;

        // Salvar no Firebase
        try {
            await salvarNoFirebase('pacientes', pacienteAtualizado);
        } catch (erro) {
            // Erro silencioso
        }

        closeModal();
        atualizarLista();
        mostrarNotificacao('Paciente atualizado com sucesso!', 'success');
    } else {
        // Criar novo paciente
        // Verificar se ID já existe
        if (pacientes.some(p => p.id === id)) {
            mostrarErro('Erro', 'Já existe um paciente com este ID');
            return;
        }

        const novoPaciente = {
            id,
            nome,
            idade: parseInt(idade),
            tipoSanguineo,
            observacao,
            dataCriacao: new Date().toLocaleDateString('pt-BR')
        };

        pacientes.push(novoPaciente);

        // Salvar no Firebase
        try {
            await salvarNoFirebase('pacientes', novoPaciente);
        } catch (erro) {
            // Erro silencioso
        }

        closeModal();
        atualizarLista();
        mostrarNotificacao('Paciente cadastrado com sucesso!', 'success');
    }
}

export function atualizarLista() {
    const lista = document.getElementById('pacientesList');

    if (!lista) {
        return;
    }

    if (pacientes.length === 0) {
        lista.innerHTML = '<p class="text-gray-500 text-center py-8">Nenhum paciente cadastrado</p>';
        return;
    }

    lista.innerHTML = pacientes.map(paciente => `
        <div class="bg-gradient-to-r from-red-50 to-red-100 p-6 rounded-lg border-l-4 border-red-600">
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <h3 class="text-lg font-bold text-gray-800">${paciente.nome}</h3>
                    <p class="text-gray-600"><i class="fas fa-id-card mr-2"></i>Passaporte: ${paciente.id}</p>
                    <p class="text-gray-600"><i class="fas fa-birthday-cake mr-2"></i>Idade: ${paciente.idade} anos</p>
                    <p class="text-gray-600"><i class="fas fa-droplet mr-2"></i>Tipo Sanguíneo: <strong>${paciente.tipoSanguineo}</strong></p>
                    <p class="text-gray-600"><i class="fas fa-calendar mr-2"></i>Cadastro: ${paciente.dataCriacao}</p>
                    ${paciente.observacao ? `<p class="text-gray-700 mt-2"><i class="fas fa-sticky-note mr-2"></i><strong>Observação:</strong> ${paciente.observacao}</p>` : ''}
                </div>
                <div class="flex gap-2">
                    <button onclick="window.moduloPacientes.openEditModal('${paciente.id}')" class="text-blue-600 hover:text-blue-800 transition" title="Editar">
                        <i class="fas fa-edit text-xl"></i>
                    </button>
                    <button onclick="window.moduloPacientes.deletar('${paciente.id}')" class="text-red-600 hover:text-red-800 transition" title="Deletar">
                        <i class="fas fa-trash text-xl"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

export function deletar(id) {
    // Verificar permissão
    if (!temPermissao('paciente', 'apagar')) {
        mostrarErro('Acesso Negado', 'Você não tem permissão para deletar pacientes');
        return;
    }
    
    mostrarConfirmacao(
        'Deletar Paciente',
        'Tem certeza que deseja deletar este paciente?',
        async () => {
            pacientes = pacientes.filter(p => p.id !== id);
            await deletarDoFirebase('pacientes', id);
            atualizarLista();
            mostrarNotificacao('Paciente deletado com sucesso!', 'success');
        }
    );
}
        

export function buscarPacientes(termo) {
    return pacientes.filter(p => 
        p.id.toLowerCase().includes(termo.toLowerCase()) || 
        p.nome.toLowerCase().includes(termo.toLowerCase())
    );
}

// Exportar como global para onclick do HTML
window.moduloPacientes = {
    openModal,
    openEditModal,
    closeModal,
    deletar,
    buscarPacientes,
    atualizarLista
};
