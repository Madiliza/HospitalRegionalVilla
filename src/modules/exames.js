// ============================================
// MÓDULO DE EXAMES
// ============================================

import { mostrarNotificacao, mostrarConfirmacao, mostrarErro } from '../utils/dialogs.js';
import { salvarNoFirebase, deletarDoFirebase } from '../utils/firebase.js';
import { buscarPacientes as buscarPacientesGlobal } from './pacientes.js';
import { temPermissao } from '../utils/permissoes.js';
import { paginar, gerarControlesHTML } from '../utils/paginacao.js';
import { examesConfig } from './configuracoes.js';

export let exames = [];
let paginaAtual = 1;
const itensPorPagina = 10;
let exameEmEdicaoId = null;

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
            salvarExame();
        });
    }
}

// ============================================
// MODAL EXAME
// ============================================
export function openModal() {
    document.getElementById('modalExame').classList.remove('modal-hidden');
    renderizarOpcoesExames(); // Renderizar opções sempre ao abrir
    limparFormulario();
}

export function closeModal() {
    document.getElementById('modalExame').classList.add('modal-hidden');
}

function limparFormulario() {
    exameEmEdicaoId = null;
    document.getElementById('formExame').reset();
    document.getElementById('buscaPacienteExame').value = '';
    document.getElementById('examePacienteId').value = '';
    document.getElementById('dadosPacienteExameDiv').classList.add('hidden');
    document.getElementById('sugestoesPacientesExame').classList.add('hidden');
    document.getElementById('exameResumo').value = '';

    // Limpar checkboxes
    document.querySelectorAll('input[name="exameTipo"]').forEach(cb => cb.checked = false);

    const btnSubmit = document.querySelector('#formExame button[type="submit"]');
    if (btnSubmit) {
        btnSubmit.innerHTML = 'Agendar Exame';
    }
}

export function renderizarOpcoesExames() {
    const container = document.getElementById('listaOpcoesExames');
    if (!container) return;

    if (examesConfig.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center text-gray-500 py-4">
                <p>Nenhum tipo de exame configurado.</p>
                <p class="text-xs">Vá em Configurações > Tipos de Exame para adicionar.</p>
            </div>
        `;
        return;
    }

    // Ordenar alfabeticamente
    const examesOrdenados = [...examesConfig].sort((a, b) => a.nome.localeCompare(b.nome));

    container.innerHTML = examesOrdenados.map(exame => `
        <label class="flex items-center space-x-2 cursor-pointer hover:bg-purple-50 p-1 rounded">
            <input type="checkbox" name="exameTipo" value="${exame.nome}" class="w-4 h-4 text-purple-600 rounded focus:ring-purple-500">
            <span class="text-gray-700 text-sm">${exame.nome}</span>
        </label>
    `).join('');
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

export async function salvarExame() {
    // Verificar permissão
    const acao = exameEmEdicaoId ? 'editar' : 'criar';

    if (!temPermissao('exame', acao)) {
        mostrarErro('Acesso Negado', `Você não tem permissão para ${acao} exames`);
        return;
    }

    const pacienteId = document.getElementById('examePacienteId').value;
    const tiposSelecionados = Array.from(document.querySelectorAll('input[name="exameTipo"]:checked')).map(cb => cb.value);
    const tipo = tiposSelecionados.join(', ');
    const data = document.getElementById('exameData').value;
    const hora = document.getElementById('exameHora').value;
    const resumo = document.getElementById('exameResumo').value;

    if (!pacienteId || tiposSelecionados.length === 0 || !data || !hora) {
        mostrarErro('Campos Obrigatórios', 'Por favor, preencha todos os campos e selecione pelo menos um tipo de exame');
        return;
    }

    const pacienteExiste = buscarPacientesGlobal('').some(p => p.id === pacienteId);
    if (!pacienteExiste) {
        mostrarErro('Paciente Inválido', 'Paciente não encontrado');
        return;
    }

    if (exameEmEdicaoId) {
        // EDIÇÃO
        const index = exames.findIndex(e => e.id === exameEmEdicaoId);
        if (index !== -1) {
            const exameAtualizado = {
                ...exames[index],
                pacienteId,
                tipo,
                data,
                hora,
                resumo
                // Mantém id e dataCriacao originais
            };

            exames[index] = exameAtualizado;

            try {
                await salvarNoFirebase('exames', exameAtualizado);
                mostrarNotificacao('Exame atualizado com sucesso!', 'success');
            } catch (erro) {
                console.error(erro);
                mostrarErro('Erro', 'Falha ao atualizar exame no banco de dados');
            }
        }
    } else {
        // CRIAÇÃO
        const novoExame = {
            id: `EXAM-${Date.now()}`,
            pacienteId,
            tipo,
            data,
            hora,
            resumo,
            dataCriacao: new Date().toLocaleDateString('pt-BR')
        };

        exames.push(novoExame);

        try {
            await salvarNoFirebase('exames', novoExame);
            mostrarNotificacao('Exame agendado com sucesso!', 'success');
        } catch (erro) {
            // Erro silencioso ou log
            console.error(erro);
        }
    }

    closeModal();
    atualizarLista();
}

export function editar(id) {
    const exame = exames.find(e => e.id === id);
    if (!exame) return;

    // Abrir modal e limpar estado anterior
    document.getElementById('modalExame').classList.remove('modal-hidden');
    renderizarOpcoesExames(); // Garantir que opções estão renderizadas
    limparFormulario();

    // Configurar estado de edição
    exameEmEdicaoId = id;

    // Preencher campos
    document.getElementById('buscaPacienteExame').value = exame.pacienteId;
    document.getElementById('examePacienteId').value = exame.pacienteId;
    document.getElementById('exameData').value = exame.data;
    document.getElementById('exameHora').value = exame.hora;
    document.getElementById('exameResumo').value = exame.resumo || '';

    // Marcar checkboxes
    const tipos = exame.tipo.split(', ');
    const checkboxes = document.querySelectorAll('input[name="exameTipo"]');
    checkboxes.forEach(cb => {
        if (tipos.includes(cb.value)) {
            cb.checked = true;
        }
    });

    // Preencher dados do paciente na UI
    const paciente = buscarPacientesGlobal('').find(p => p.id === exame.pacienteId);
    if (paciente) {
        selecionarPaciente(paciente.id, paciente.nome, paciente.idade);
    } else {
        // Caso fallback se paciente não for achado na lista global (improvável mas possível)
        // Apenas setar o ID nos campos hidden já foi feito acima
        // Pode-se tentar mostrar algo genérico ou apenas deixar o ID
        selecionarPaciente(exame.pacienteId, 'Paciente não encontrado', '?');
    }

    // Atualizar botão
    const btnSubmit = document.querySelector('#formExame button[type="submit"]');
    if (btnSubmit) {
        btnSubmit.innerHTML = 'Salvar Alterações';
    }
}

export function mudarPagina(novaPagina) {
    paginaAtual = novaPagina;
    atualizarLista();
}

export function atualizarLista() {
    const lista = document.getElementById('examesList');

    if (!lista) {
        return;
    }

    if (exames.length === 0) {
        lista.innerHTML = '<p class="text-gray-500 text-center py-8">Nenhum exame realizados</p>';
        return;
    }

    // Paginar
    const resultadoPaginacao = paginar(exames, paginaAtual, itensPorPagina);
    const examesExibidos = resultadoPaginacao.dadosPaginados;

    let html = examesExibidos.map(exame => `
        <div class="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-lg border-l-4 border-purple-600">
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <h3 class="text-lg font-bold text-gray-800">Exame: ${exame.tipo}</h3>
                    <p class="text-gray-600"><i class="fas fa-user mr-2"></i>Paciente ID: ${exame.pacienteId}</p>
                    <p class="text-gray-600"><i class="fas fa-calendar-alt mr-2"></i>${exame.data} às ${exame.hora}</p>
                    <p class="text-gray-600"><i class="fas fa-clock mr-2"></i>Agendado em: ${exame.dataCriacao}</p>
                    ${exame.resumo ? `<p class="text-gray-700 mt-3"><strong>Resumo:</strong> ${exame.resumo}</p>` : ''}
                </div>
                <div class="flex gap-2">
                    <button onclick="window.moduloExames.editar('${exame.id}')" class="text-blue-600 hover:text-blue-800 transition" title="Editar">
                        <i class="fas fa-edit text-xl"></i>
                    </button>
                    <button onclick="window.moduloExames.deletar('${exame.id}')" class="text-red-600 hover:text-red-800 transition" title="Deletar">
                        <i class="fas fa-trash text-xl"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    // Adicionar controles de paginação
    html += gerarControlesHTML(resultadoPaginacao.totalPaginas, resultadoPaginacao.paginaAtual, 'moduloExames', 'purple');

    lista.innerHTML = html;
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
    editar,
    atualizarLista,
    mudarPagina
};
