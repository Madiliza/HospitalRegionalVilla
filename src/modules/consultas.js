// ============================================
// MÓDULO DE CONSULTAS
// ============================================

import { mostrarNotificacao, mostrarConfirmacao, mostrarErro } from '../utils/dialogs.js';
import { salvarNoFirebase, deletarDoFirebase } from '../utils/firebase.js';
import { buscarPacientes as buscarPacientesGlobal } from './pacientes.js';

export let consultas = [];

export function init(dadosCarregados) {
    consultas = dadosCarregados.consultas || [];
    configurarEventos();
    
    // Chamar atualizarLista de forma assíncrona para garantir que o DOM está pronto
    Promise.resolve().then(() => {
        setTimeout(() => {
            atualizarLista();
        }, 50);
    });
}

function configurarEventos() {
    const formConsulta = document.getElementById('formConsulta');
    if (formConsulta) {
        formConsulta.addEventListener('submit', (e) => {
            e.preventDefault();
            adicionarConsulta();
        });
    }
}

// ============================================
// MODAL CONSULTA
// ============================================
export function openModal() {
    document.getElementById('modalConsulta').classList.remove('modal-hidden');
    limparFormulario();
}

export function closeModal() {
    document.getElementById('modalConsulta').classList.add('modal-hidden');
}

function limparFormulario() {
    document.getElementById('formConsulta').reset();
    document.getElementById('buscaPacienteConsulta').value = '';
    document.getElementById('consultaPacienteId').value = '';
    document.getElementById('dadosPacienteConsultaDiv').classList.add('hidden');
    document.getElementById('sugestoesPacientesConsulta').classList.add('hidden');
}

// Busca de paciente
export function buscarPacientes() {
    const termo = document.getElementById('buscaPacienteConsulta').value.toLowerCase().trim();
    const sugestoes = document.getElementById('sugestoesPacientesConsulta');
    const listaSugestoes = document.getElementById('listaSugestoesConsulta');

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
        <div onclick="window.moduloConsultas.selecionarPaciente('${p.id}', '${p.nome}', '${p.idade}')" class="px-4 py-2 hover:bg-green-100 cursor-pointer border-b border-gray-200 last:border-b-0">
            <div class="font-semibold text-gray-800">${p.id}</div>
            <div class="text-sm text-gray-600">${p.nome} - ${p.idade} anos</div>
        </div>
    `).join('');

    sugestoes.classList.remove('hidden');
}

export function selecionarPaciente(id, nome, idade) {
    document.getElementById('buscaPacienteConsulta').value = id;
    document.getElementById('consultaPacienteId').value = id;
    document.getElementById('idPacienteConsultaExibicao').textContent = id;
    document.getElementById('nomePacienteConsultaExibicao').textContent = nome;
    document.getElementById('idadePacienteConsultaExibicao').textContent = idade;
    document.getElementById('dadosPacienteConsultaDiv').classList.remove('hidden');
    document.getElementById('sugestoesPacientesConsulta').classList.add('hidden');
}

export function limparSelecaoPaciente() {
    document.getElementById('buscaPacienteConsulta').value = '';
    document.getElementById('consultaPacienteId').value = '';
    document.getElementById('dadosPacienteConsultaDiv').classList.add('hidden');
    document.getElementById('sugestoesPacientesConsulta').classList.add('hidden');
}

export async function adicionarConsulta() {
    const pacienteId = document.getElementById('consultaPacienteId').value;
    const especialidade = document.getElementById('consultaEspecialidade').value;
    const data = document.getElementById('consultaData').value;
    const hora = document.getElementById('consultaHora').value;

    if (!pacienteId || !especialidade || !data || !hora) {
        mostrarErro('Campos Obrigatórios', 'Por favor, preencha todos os campos');
        return;
    }

    const pacienteExiste = buscarPacientesGlobal('').some(p => p.id === pacienteId);
    if (!pacienteExiste) {
        mostrarErro('Paciente Inválido', 'Paciente não encontrado');
        return;
    }

    const novaConsulta = {
        id: `CONS-${Date.now()}`,
        pacienteId,
        especialidade,
        data,
        hora,
        dataCriacao: new Date().toLocaleDateString('pt-BR')
    };

    consultas.push(novaConsulta);

    try {
        await salvarNoFirebase('consultas', novaConsulta);
    } catch (erro) {
        console.error('Erro ao salvar consulta:', erro);
    }

    closeModal();
    atualizarLista();

    mostrarNotificacao('Consulta agendada com sucesso!', 'success');
}

export function atualizarLista() {
    const lista = document.getElementById('consultasList');

    if (!lista) {
        console.warn('⚠️ Elemento consultasList não encontrado ainda');
        return;
    }

    if (consultas.length === 0) {
        lista.innerHTML = '<p class="text-gray-500 text-center py-8">Nenhuma consulta agendada</p>';
        return;
    }

    lista.innerHTML = consultas.map(consulta => `
        <div class="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg border-l-4 border-green-600">
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <h3 class="text-lg font-bold text-gray-800">Consulta: ${consulta.especialidade}</h3>
                    <p class="text-gray-600"><i class="fas fa-user mr-2"></i>Paciente ID: ${consulta.pacienteId}</p>
                    <p class="text-gray-600"><i class="fas fa-calendar-alt mr-2"></i>${consulta.data} às ${consulta.hora}</p>
                    <p class="text-gray-600"><i class="fas fa-clock mr-2"></i>Agendada em: ${consulta.dataCriacao}</p>
                </div>
                <button onclick="window.moduloConsultas.deletar('${consulta.id}')" class="text-red-600 hover:text-red-800 transition">
                    <i class="fas fa-trash text-xl"></i>
                </button>
            </div>
        </div>
    `).join('');
}

export function deletar(id) {
    mostrarConfirmacao(
        'Cancelar Consulta',
        'Tem certeza que deseja cancelar esta consulta?',
        async () => {
            consultas = consultas.filter(c => c.id !== id);
            await deletarDoFirebase('consultas', id);
            atualizarLista();
            mostrarNotificacao('Consulta cancelada com sucesso!', 'success');
        }
    );
}

// Exportar como global
window.moduloConsultas = {
    openModal,
    closeModal,
    buscarPacientes,
    selecionarPaciente,
    limparSelecaoPaciente,
    deletar,
    atualizarLista
};
