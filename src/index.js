import { salvarDados, lerDados, deletarDados } from '../config/firebase-config.js';

// ============================================
// VARIÁVEIS GLOBAIS
// ============================================
let pacientes = [];
let consultas = [];
let exames = [];
let medicamentos = [];
let cargos = [];
let usuarios = [];
let medicamentosConfig = [];
let medicamentosSelecionados = {}; // Rastrear medicamentos selecionados

// ============================================
// INICIALIZAÇÃO
// ============================================
let appReady = false;

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM carregado');
    appReady = true;
    carregarDados();
    configurarEventos();
});

// ============================================
// CONFIGURAR EVENTOS DOS FORMULÁRIOS
// ============================================
function configurarEventos() {
    document.getElementById('formPaciente').addEventListener('submit', (e) => {
        e.preventDefault();
        adicionarPaciente();
    });

    document.getElementById('formConsulta').addEventListener('submit', (e) => {
        e.preventDefault();
        adicionarConsulta();
    });

    document.getElementById('formExame').addEventListener('submit', (e) => {
        e.preventDefault();
        adicionarExame();
    });

    document.getElementById('formMedicamento').addEventListener('submit', (e) => {
        e.preventDefault();
        adicionarMedicamentoNovo();
    });

    // Eventos de Configuração
    document.getElementById('formCargo').addEventListener('submit', (e) => {
        e.preventDefault();
        adicionarCargo();
    });

    document.getElementById('formUsuario').addEventListener('submit', (e) => {
        e.preventDefault();
        adicionarUsuario();
    });

    document.getElementById('formMedicamentoConfig').addEventListener('submit', (e) => {
        e.preventDefault();
        adicionarMedicamentoConfig();
    });
}

// ============================================
// NAVEGAÇÃO E SECTIONS
// ============================================
function showSection(sectionId) {
    // Esconder todas as sections
    document.querySelectorAll('section').forEach(section => {
        section.classList.add('modal-hidden');
    });

    // Mostrar a section selecionada
    document.getElementById(sectionId).classList.remove('modal-hidden');

    // Atualizar botão ativo na sidebar
    document.querySelectorAll('aside button').forEach(btn => {
        btn.classList.remove('bg-red-600', 'text-white');
        btn.classList.add('hover:bg-gray-100', 'text-gray-700');
    });

    const activeBtn = event.target.closest('button');
    if (activeBtn) {
        activeBtn.classList.remove('hover:bg-gray-100', 'text-gray-700');
        activeBtn.classList.add('bg-red-600', 'text-white');
    }
}

// ============================================
// MODAL PACIENTE
// ============================================
function openModalPaciente() {
    document.getElementById('modalPaciente').classList.remove('modal-hidden');
    limparFormularioPaciente();
}

function closeModalPaciente() {
    document.getElementById('modalPaciente').classList.add('modal-hidden');
}

function limparFormularioPaciente() {
    document.getElementById('formPaciente').reset();
}

async function adicionarPaciente() {
    const id = document.getElementById('pacienteId').value;
    const nome = document.getElementById('pacienteNome').value;
    const idade = document.getElementById('pacienteIdade').value;
    const observacao = document.getElementById('pacienteObservacao').value;

    if (!id || !nome || !idade) {
        mostrarErro('Campos Obrigatórios', 'Preencha todos os campos obrigatórios!');
        return;
    }

    const novoPaciente = {
        id,
        nome,
        idade: parseInt(idade),
        observacao,
        dataCriacao: new Date().toLocaleDateString('pt-BR')
    };

    pacientes.push(novoPaciente);

    // Salvar no Firebase (opcional)
    try {
        await salvarDados(`pacientes/${id}`, novoPaciente);
    } catch (erro) {
        console.warn('Firebase não configurado, dados salvos localmente apenas', erro);
    }

    closeModalPaciente();
    atualizarListaPacientes();
    atualizarDashboard();

    mostrarNotificacao('Paciente cadastrado com sucesso!', 'success');
}

function atualizarListaPacientes() {
    const lista = document.getElementById('pacientesList');

    if (pacientes.length === 0) {
        lista.innerHTML = '<p class="text-gray-500 text-center py-8">Nenhum paciente cadastrado ainda</p>';
        return;
    }

    lista.innerHTML = pacientes.map(paciente => `
        <div class="bg-gradient-to-r from-red-50 to-red-100 p-6 rounded-lg border-l-4 border-red-600">
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <h3 class="text-lg font-bold text-gray-800">${paciente.nome}</h3>
                    <p class="text-gray-600"><i class="fas fa-id-card mr-2"></i>ID: ${paciente.id}</p>
                    <p class="text-gray-600"><i class="fas fa-birthday-cake mr-2"></i>Idade: ${paciente.idade} anos</p>
                    <p class="text-gray-600"><i class="fas fa-calendar mr-2"></i>Cadastro: ${paciente.dataCriacao}</p>
                    ${paciente.observacao ? `<p class="text-gray-700 mt-2"><i class="fas fa-sticky-note mr-2"></i><strong>Observação:</strong> ${paciente.observacao}</p>` : ''}
                </div>
                <button onclick="deletarPaciente('${paciente.id}')" class="text-red-600 hover:text-red-800 transition">
                    <i class="fas fa-trash text-xl"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function deletarPaciente(id) {
    mostrarConfirmacao(
        'Deletar Paciente',
        'Tem certeza que deseja deletar este paciente?',
        async () => {
            pacientes = pacientes.filter(p => p.id !== id);
            
            // Deletar do Firebase
            try {
                await deletarDados(`pacientes/${id}`);
            } catch (erro) {
                console.warn('Erro ao deletar do Firebase:', erro);
            }
            
            atualizarListaPacientes();
            atualizarDashboard();
            mostrarNotificacao('Paciente removido!', 'info');
        }
    );
}

// ============================================
// MODAL CONSULTA
// ============================================
function openModalConsulta() {
    document.getElementById('modalConsulta').classList.remove('modal-hidden');
    limparFormularioConsulta();
}

function closeModalConsulta() {
    document.getElementById('modalConsulta').classList.add('modal-hidden');
}

function limparFormularioConsulta() {
    document.getElementById('formConsulta').reset();
    document.getElementById('buscaPacienteConsulta').value = '';
    document.getElementById('consultaPacienteId').value = '';
    document.getElementById('dadosPacienteConsultaDiv').classList.add('hidden');
    document.getElementById('sugestoesPacientesConsulta').classList.add('hidden');
}

// Funções de busca de paciente para Consulta
function buscarPacientesConsulta() {
    const termo = document.getElementById('buscaPacienteConsulta').value.toLowerCase().trim();
    const sugestoes = document.getElementById('sugestoesPacientesConsulta');
    const listaSugestoes = document.getElementById('listaSugestoesConsulta');

    if (termo.length === 0) {
        sugestoes.classList.add('hidden');
        return;
    }

    // Filtrar pacientes pelo ID ou nome
    const pacientesFiltrados = pacientes.filter(p => 
        p.id.toLowerCase().includes(termo) || 
        p.nome.toLowerCase().includes(termo)
    );

    if (pacientesFiltrados.length === 0) {
        listaSugestoes.innerHTML = '<div class="px-4 py-2 text-gray-500 text-sm">Nenhum paciente encontrado</div>';
        sugestoes.classList.remove('hidden');
        return;
    }

    listaSugestoes.innerHTML = pacientesFiltrados.map(p => `
        <div onclick="selecionarPacienteConsulta('${p.id}', '${p.nome}', '${p.idade}')" class="px-4 py-2 hover:bg-green-100 cursor-pointer border-b border-gray-200 last:border-b-0">
            <div class="font-semibold text-gray-800">${p.id}</div>
            <div class="text-sm text-gray-600">${p.nome} - ${p.idade} anos</div>
        </div>
    `).join('');

    sugestoes.classList.remove('hidden');
}

function selecionarPacienteConsulta(id, nome, idade) {
    document.getElementById('buscaPacienteConsulta').value = id;
    document.getElementById('consultaPacienteId').value = id;
    document.getElementById('idPacienteConsultaExibicao').textContent = id;
    document.getElementById('nomePacienteConsultaExibicao').textContent = nome;
    document.getElementById('idadePacienteConsultaExibicao').textContent = idade;
    document.getElementById('dadosPacienteConsultaDiv').classList.remove('hidden');
    document.getElementById('sugestoesPacientesConsulta').classList.add('hidden');
}

function limparSelecaoPacienteConsulta() {
    document.getElementById('buscaPacienteConsulta').value = '';
    document.getElementById('consultaPacienteId').value = '';
    document.getElementById('dadosPacienteConsultaDiv').classList.add('hidden');
    document.getElementById('sugestoesPacientesConsulta').classList.add('hidden');
}

async function adicionarConsulta() {
    const pacienteId = document.getElementById('consultaPacienteId').value;
    const especialidade = document.getElementById('consultaEspecialidade').value;
    const data = document.getElementById('consultaData').value;
    const hora = document.getElementById('consultaHora').value;

    if (!pacienteId || !especialidade || !data || !hora) {
        mostrarErro('Campos Obrigatórios', 'Preencha todos os campos!');
        return;
    }

    // Verificar se paciente existe
    if (!pacientes.find(p => p.id === pacienteId)) {
        mostrarErro('Paciente Não Encontrado', 'Paciente não encontrado!');
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

    // Salvar no Firebase
    try {
        await salvarDados(`consultas/${novaConsulta.id}`, novaConsulta);
    } catch (erro) {
        console.warn('Firebase não configurado, dados salvos localmente apenas', erro);
    }

    closeModalConsulta();
    atualizarListaConsultas();
    atualizarDashboard();

    mostrarNotificacao('Consulta agendada com sucesso!', 'success');
}

function atualizarListaConsultas() {
    const lista = document.getElementById('consultasList');

    if (consultas.length === 0) {
        lista.innerHTML = '<p class="text-gray-500 text-center py-8">Nenhuma consulta agendada</p>';
        return;
    }

    lista.innerHTML = consultas.map(consulta => {
        const paciente = pacientes.find(p => p.id === consulta.pacienteId);
        return `
            <div class="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg border-l-4 border-green-600">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <h3 class="text-lg font-bold text-gray-800">${paciente ? paciente.nome : 'Paciente não encontrado'}</h3>
                        <p class="text-gray-600"><i class="fas fa-stethoscope mr-2"></i>Especialidade: ${consulta.especialidade}</p>
                        <p class="text-gray-600"><i class="fas fa-calendar mr-2"></i>Data: ${consulta.data}</p>
                        <p class="text-gray-600"><i class="fas fa-clock mr-2"></i>Hora: ${consulta.hora}</p>
                        <span class="inline-block mt-2 px-3 py-1 bg-green-200 text-green-800 rounded-full text-sm">${consulta.id}</span>
                    </div>
                    <button onclick="deletarConsulta('${consulta.id}')" class="text-red-600 hover:text-red-800 transition">
                        <i class="fas fa-trash text-xl"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function deletarConsulta(id) {
    mostrarConfirmacao(
        'Cancelar Consulta',
        'Tem certeza que deseja cancelar esta consulta?',
        async () => {
            consultas = consultas.filter(c => c.id !== id);
            
            // Deletar do Firebase
            try {
                await deletarDados(`consultas/${id}`);
            } catch (erro) {
                console.warn('Erro ao deletar do Firebase:', erro);
            }
            
            atualizarListaConsultas();
            atualizarDashboard();
            mostrarNotificacao('Consulta cancelada!', 'info');
        }
    );
}

// ============================================
// MODAL EXAME
// ============================================
function openModalExame() {
    document.getElementById('modalExame').classList.remove('modal-hidden');
    limparFormularioExame();
}

function closeModalExame() {
    document.getElementById('modalExame').classList.add('modal-hidden');
}

function limparFormularioExame() {
    document.getElementById('formExame').reset();
    document.getElementById('buscaPacienteExame').value = '';
    document.getElementById('examePacienteId').value = '';
    document.getElementById('dadosPacienteExameDiv').classList.add('hidden');
    document.getElementById('sugestoesPacientesExame').classList.add('hidden');
}

// Funções de busca de paciente para Exame
function buscarPacientesExame() {
    const termo = document.getElementById('buscaPacienteExame').value.toLowerCase().trim();
    const sugestoes = document.getElementById('sugestoesPacientesExame');
    const listaSugestoes = document.getElementById('listaSugestoesExame');

    if (termo.length === 0) {
        sugestoes.classList.add('hidden');
        return;
    }

    // Filtrar pacientes pelo ID ou nome
    const pacientesFiltrados = pacientes.filter(p => 
        p.id.toLowerCase().includes(termo) || 
        p.nome.toLowerCase().includes(termo)
    );

    if (pacientesFiltrados.length === 0) {
        listaSugestoes.innerHTML = '<div class="px-4 py-2 text-gray-500 text-sm">Nenhum paciente encontrado</div>';
        sugestoes.classList.remove('hidden');
        return;
    }

    listaSugestoes.innerHTML = pacientesFiltrados.map(p => `
        <div onclick="selecionarPacienteExame('${p.id}', '${p.nome}', '${p.idade}')" class="px-4 py-2 hover:bg-purple-100 cursor-pointer border-b border-gray-200 last:border-b-0">
            <div class="font-semibold text-gray-800">${p.id}</div>
            <div class="text-sm text-gray-600">${p.nome} - ${p.idade} anos</div>
        </div>
    `).join('');

    sugestoes.classList.remove('hidden');
}

function selecionarPacienteExame(id, nome, idade) {
    document.getElementById('buscaPacienteExame').value = id;
    document.getElementById('examePacienteId').value = id;
    document.getElementById('idPacienteExameExibicao').textContent = id;
    document.getElementById('nomePacienteExameExibicao').textContent = nome;
    document.getElementById('idadePacienteExameExibicao').textContent = idade;
    document.getElementById('dadosPacienteExameDiv').classList.remove('hidden');
    document.getElementById('sugestoesPacientesExame').classList.add('hidden');
}

function limparSelecaoPacienteExame() {
    document.getElementById('buscaPacienteExame').value = '';
    document.getElementById('examePacienteId').value = '';
    document.getElementById('dadosPacienteExameDiv').classList.add('hidden');
    document.getElementById('sugestoesPacientesExame').classList.add('hidden');
}

async function adicionarExame() {
    const pacienteId = document.getElementById('examePacienteId').value;
    const tipo = document.getElementById('exameTipo').value;
    const data = document.getElementById('exameData').value;
    const hora = document.getElementById('exameHora').value;

    if (!pacienteId || !tipo || !data || !hora) {
        mostrarErro('Campos Obrigatórios', 'Preencha todos os campos!');
        return;
    }

    // Verificar se paciente existe
    if (!pacientes.find(p => p.id === pacienteId)) {
        mostrarErro('Paciente Não Encontrado', 'Paciente não encontrado!');
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

    // Salvar no Firebase
    try {
        await salvarDados(`exames/${novoExame.id}`, novoExame);
    } catch (erro) {
        console.warn('Firebase não configurado, dados salvos localmente apenas', erro);
    }

    closeModalExame();
    atualizarListaExames();
    atualizarDashboard();

    mostrarNotificacao('Exame agendado com sucesso!', 'success');
}

function atualizarListaExames() {
    const lista = document.getElementById('examesList');

    if (exames.length === 0) {
        lista.innerHTML = '<p class="text-gray-500 text-center py-8">Nenhum exame agendado</p>';
        return;
    }

    lista.innerHTML = exames.map(exame => {
        const paciente = pacientes.find(p => p.id === exame.pacienteId);
        return `
            <div class="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-lg border-l-4 border-purple-600">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <h3 class="text-lg font-bold text-gray-800">${paciente ? paciente.nome : 'Paciente não encontrado'}</h3>
                        <p class="text-gray-600"><i class="fas fa-flask mr-2"></i>Tipo: ${exame.tipo}</p>
                        <p class="text-gray-600"><i class="fas fa-calendar mr-2"></i>Data: ${exame.data}</p>
                        <p class="text-gray-600"><i class="fas fa-clock mr-2"></i>Hora: ${exame.hora}</p>
                        <span class="inline-block mt-2 px-3 py-1 bg-purple-200 text-purple-800 rounded-full text-sm">${exame.id}</span>
                    </div>
                    <button onclick="deletarExame('${exame.id}')" class="text-red-600 hover:text-red-800 transition">
                        <i class="fas fa-trash text-xl"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function deletarExame(id) {
    mostrarConfirmacao(
        'Cancelar Exame',
        'Tem certeza que deseja cancelar este exame?',
        async () => {
            exames = exames.filter(e => e.id !== id);
            
            // Deletar do Firebase
            try {
                await deletarDados(`exames/${id}`);
            } catch (erro) {
                console.warn('Erro ao deletar do Firebase:', erro);
            }
            
            atualizarListaExames();
            atualizarDashboard();
            mostrarNotificacao('Exame cancelado!', 'info');
        }
    );
}

// ============================================
// MODAL MEDICAMENTO (FARMÁCIA)
// ============================================
function openModalMedicamento() {
    document.getElementById('modalMedicamento').classList.remove('modal-hidden');
    limparFormularioMedicamento();
    atualizarListaMedicamentosNoModal();
}

function buscarPacientes() {
    const termo = document.getElementById('buscaPacienteId').value.toLowerCase().trim();
    const sugestoes = document.getElementById('sugestoesPacientes');
    const listaSugestoes = document.getElementById('listaSugestoes');

    if (termo.length === 0) {
        sugestoes.classList.add('hidden');
        return;
    }

    // Filtrar pacientes pelo ID ou nome
    const pacientesFiltrados = pacientes.filter(p => 
        p.id.toLowerCase().includes(termo) || 
        p.nome.toLowerCase().includes(termo)
    );

    if (pacientesFiltrados.length === 0) {
        listaSugestoes.innerHTML = '<div class="px-4 py-2 text-gray-500 text-sm">Nenhum paciente encontrado</div>';
        sugestoes.classList.remove('hidden');
        return;
    }

    listaSugestoes.innerHTML = pacientesFiltrados.map(p => `
        <div onclick="selecionarPaciente('${p.id}', '${p.nome}', '${p.idade}')" class="px-4 py-2 hover:bg-orange-100 cursor-pointer border-b border-gray-200 last:border-b-0">
            <div class="font-semibold text-gray-800">${p.id}</div>
            <div class="text-sm text-gray-600">${p.nome} - ${p.idade} anos</div>
        </div>
    `).join('');

    sugestoes.classList.remove('hidden');
}

function selecionarPaciente(id, nome, idade) {
    document.getElementById('buscaPacienteId').value = id;
    document.getElementById('medicamentoPacienteId').value = id;
    document.getElementById('idPacienteExibicao').textContent = id;
    document.getElementById('nomePacienteExibicao').textContent = nome;
    document.getElementById('idadePacienteExibicao').textContent = idade;
    document.getElementById('dadosPacienteDiv').classList.remove('hidden');
    document.getElementById('sugestoesPacientes').classList.add('hidden');
}

function limparSelecaoPaciente() {
    document.getElementById('buscaPacienteId').value = '';
    document.getElementById('medicamentoPacienteId').value = '';
    document.getElementById('dadosPacienteDiv').classList.add('hidden');
    document.getElementById('sugestoesPacientes').classList.add('hidden');
}

function closeModalMedicamento() {
    document.getElementById('modalMedicamento').classList.add('modal-hidden');
}

function limparFormularioMedicamento() {
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
    limparAvisos();
}

function limparAvisos() {
    // Avisos foram removidos na refatoração
}

function atualizarConsumosDia() {
    // Função removida - elementos Kits, Ataduras e Analgésicos foram removidos
}

function atualizarTotal() {
    // Esta função foi refatorada - o total é calculado em atualizarResume()
}

async function adicionarMedicamento() {
    // Esta função foi substituída por adicionarMedicamentoNovo() que usa medicamentosSelecionados
}

function atualizarListaMedicamentos() {
    const lista = document.getElementById('farmaciaList');

    if (medicamentos.length === 0) {
        lista.innerHTML = '<p class="text-gray-500 text-center py-8">Nenhum medicamento registrado</p>';
        return;
    }

    // Agrupar medicamentos por paciente
    const medicamentosPorPaciente = {};
    medicamentos.forEach(med => {
        if (!medicamentosPorPaciente[med.pacienteId]) {
            medicamentosPorPaciente[med.pacienteId] = {
                meds: [],
                pacienteName: med.pacienteNome
            };
        }
        medicamentosPorPaciente[med.pacienteId].meds.push(med);
    });

    // Renderizar medicamentos agrupados
    lista.innerHTML = Object.entries(medicamentosPorPaciente).map(([pacienteId, dados]) => {
        // Agrupar medicamentos por tipo dentro do paciente
        const medsPorTipo = {};
        dados.meds.forEach(med => {
            if (!medsPorTipo[med.nome]) {
                medsPorTipo[med.nome] = [];
            }
            medsPorTipo[med.nome].push(med);
        });

        const medicamentosHtml = Object.entries(medsPorTipo).map(([tipo, meds]) => {
            const totalQtd = meds.reduce((acc, m) => acc + m.quantidade, 0);
            const itemsHtml = meds.map(med => `
                <div class="flex justify-between items-center p-2 bg-white rounded border border-orange-200">
                    <span class="text-sm text-gray-700">Qtd: ${med.quantidade}</span>
                    <button onclick="deletarMedicamento('${med.id}')" class="text-red-600 hover:text-red-800 transition text-sm">
                        <i class="fas fa-trash"></i> Remover
                    </button>
                </div>
            `).join('');

            return `
                <div class="mb-3">
                    <div class="font-semibold text-gray-800 mb-2 flex justify-between items-center">
                        <span>${tipo}</span>
                        <span class="text-orange-600 text-sm font-normal">Total: ${totalQtd}</span>
                    </div>
                    <div class="space-y-1">
                        ${itemsHtml}
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="bg-gradient-to-r from-orange-50 to-orange-100 p-6 rounded-lg border-l-4 border-orange-600 mb-4">
                <div class="mb-4 flex justify-between items-start">
                    <div class="flex-1">
                        <h3 class="text-lg font-bold text-gray-800">${dados.pacienteName}</h3>
                        <p class="text-gray-600"><i class="fas fa-id-card mr-2"></i>ID: ${pacienteId}</p>
                        <span class="inline-block mt-2 px-3 py-1 bg-orange-200 text-orange-800 rounded-full text-xs">Paciente</span>
                    </div>
                    <button onclick="apagarAtendimento('${pacienteId}')" class="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm">
                        <i class="fas fa-trash-alt mr-1"></i> Apagar Tudo
                    </button>
                </div>
                <div class="border-t pt-4 space-y-3">
                    ${medicamentosHtml}
                </div>
            </div>
        `;
    }).join('');
    
    // Atualizar lista de medicamentos disponíveis na farmácia
    atualizarListaMedicamentosDisponiveis();
}

function deletarMedicamento(id) {
    mostrarConfirmacao(
        'Remover Medicamento',
        'Tem certeza que deseja remover este medicamento?',
        async () => {
            medicamentos = medicamentos.filter(m => m.id !== id);
            
            // Deletar do Firebase
            try {
                await deletarDados(`medicamentos/${id}`);
            } catch (erro) {
                console.warn('Erro ao deletar do Firebase:', erro);
            }
            
            atualizarListaMedicamentos();
            atualizarDashboard();
            mostrarNotificacao('Medicamento removido!', 'info');
        }
    );
}

function apagarAtendimento(pacienteId) {
    const paciente = pacientes.find(p => p.id === pacienteId);
    const nomePaciente = paciente ? paciente.nome : pacienteId;
    
    mostrarConfirmacao(
        'Apagar Atendimento',
        `Tem certeza que deseja apagar TODO o atendimento de ${nomePaciente}?\n\nTodos os medicamentos registrados serão removidos permanentemente.`,
        async () => {
            // Obter IDs dos medicamentos a remover
            const medicamentosRemover = medicamentos.filter(m => m.pacienteId === pacienteId);
            const ids = medicamentosRemover.map(m => m.id);
            
            // Remover da lista local
            medicamentos = medicamentos.filter(m => m.pacienteId !== pacienteId);
            
            // Deletar do Firebase
            try {
                for (const id of ids) {
                    await deletarDados(`medicamentos/${id}`);
                }
            } catch (erro) {
                console.warn('Erro ao deletar do Firebase:', erro);
            }
            
            atualizarListaMedicamentos();
            atualizarDashboard();
            mostrarNotificacao(`✅ Atendimento de ${nomePaciente} removido completamente!`, 'success');
        }
    );
}

// ============================================
// ATUALIZAR DASHBOARD
// ============================================
function atualizarDashboard() {
    document.getElementById('totalPacientes').textContent = pacientes.length;
    document.getElementById('totalConsultas').textContent = consultas.length;
    document.getElementById('totalExames').textContent = exames.length;
    document.getElementById('totalMedicamentos').textContent = medicamentos.length;
}

// ============================================
// CARREGAR DADOS DO FIREBASE
// ============================================
async function carregarDados() {
    try {
        // Carregar pacientes do Firebase
        const dadosPacientes = await lerDados('pacientes');
        if (dadosPacientes) {
            pacientes = Object.values(dadosPacientes);
            atualizarListaPacientes();
            console.log('Pacientes carregados:', pacientes.length);
        }

        // Carregar consultas do Firebase
        const dadosConsultas = await lerDados('consultas');
        if (dadosConsultas) {
            consultas = Object.values(dadosConsultas);
            atualizarListaConsultas();
            console.log('Consultas carregadas:', consultas.length);
        }

        // Carregar exames do Firebase
        const dadosExames = await lerDados('exames');
        if (dadosExames) {
            exames = Object.values(dadosExames);
            atualizarListaExames();
            console.log('Exames carregados:', exames.length);
        }

        // Carregar medicamentos do Firebase
        const dadosMedicamentos = await lerDados('medicamentos');
        if (dadosMedicamentos) {
            medicamentos = Object.values(dadosMedicamentos);
            atualizarListaMedicamentos();
            console.log('Medicamentos carregados:', medicamentos.length);
        }

        // Carregar cargos do Firebase
        const dadosCargos = await lerDados('cargos');
        if (dadosCargos) {
            cargos = Object.values(dadosCargos);
            atualizarListaCargos();
            console.log('Cargos carregados:', cargos.length);
        }

        // Carregar usuários do Firebase
        const dadosUsuarios = await lerDados('usuarios');
        if (dadosUsuarios) {
            usuarios = Object.values(dadosUsuarios);
            atualizarListaUsuarios();
            console.log('Usuários carregados:', usuarios.length);
        }

        // Carregar medicamentos config do Firebase
        const dadosMedicamentosConfig = await lerDados('medicamentosConfig');
        if (dadosMedicamentosConfig) {
            medicamentosConfig = Object.values(dadosMedicamentosConfig);
            atualizarListaMedicamentosConfig();
            atualizarListaMedicamentosDisponiveis();
            console.log('Medicamentos configurados carregados:', medicamentosConfig.length);
        }

        atualizarDashboard();
        console.log('✅ Todos os dados carregados com sucesso!');
    } catch (erro) {
        console.error('⚠️ Erro ao carregar dados:', erro);
        // Continua funcionando mesmo se o Firebase não estiver configurado
        atualizarDashboard();
    }
}

// ============================================
// DIÁLOGO CUSTOMIZADO (substitui alert)
// ============================================
function getDialogoElementos() {
    if (!appReady) {
        return {
            dialog: null,
            dialogIcon: null,
            dialogTitle: null,
            dialogMessage: null,
            dialogButtons: null
        };
    }
    
    return {
        dialog: document.getElementById('customDialog'),
        dialogIcon: document.getElementById('dialogIcon'),
        dialogTitle: document.getElementById('dialogTitle'),
        dialogMessage: document.getElementById('dialogMessage'),
        dialogButtons: document.getElementById('dialogButtons')
    };
}

function mostrarDialog(titulo, mensagem, tipo = 'info', botoes = null) {
    // Se o app ainda não está pronto, aguardar
    if (!appReady) {
        console.warn('App não está pronto ainda, aguardando...');
        setTimeout(() => mostrarDialog(titulo, mensagem, tipo, botoes), 50);
        return;
    }
    
    // Obter elementos
    const elementos = getDialogoElementos();
    const { dialog, dialogIcon, dialogTitle, dialogMessage, dialogButtons } = elementos;
    
    // Se algum elemento não existe, tentar novamente
    if (!dialog || !dialogIcon || !dialogTitle || !dialogMessage || !dialogButtons) {
        console.warn('Elementos do diálogo não encontrados, tentando novamente...');
        setTimeout(() => mostrarDialog(titulo, mensagem, tipo, botoes), 100);
        return;
    }

    // Definir ícone e cor baseado no tipo
    const iconesETitulos = {
        success: { icon: '✅', color: '#10b981' },
        error: { icon: '❌', color: '#ef4444' },
        warning: { icon: '⚠️', color: '#f59e0b' },
        info: { icon: 'ℹ️', color: '#3b82f6' },
        question: { icon: '❓', color: '#8b5cf6' }
    };

    const config = iconesETitulos[tipo] || iconesETitulos.info;

    dialogIcon.textContent = config.icon;
    dialogIcon.style.color = config.color;
    dialogTitle.textContent = titulo;
    dialogMessage.textContent = mensagem;

    // Criar botões
    if (!botoes) {
        botoes = [
            {
                texto: 'OK',
                tipo: 'primary',
                callback: () => fecharDialog()
            }
        ];
    }

    // Armazenar callbacks ANTES de criar os botões
    window.dialogCallbacks = botoes.map(b => b.callback);

    dialogButtons.innerHTML = botoes.map((botao, indice) => `
        <button class="px-6 py-2 rounded-lg font-semibold transition ${
            botao.tipo === 'primary'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : botao.tipo === 'danger'
                ? 'bg-red-600 text-white hover:bg-red-700'
                : botao.tipo === 'secondary'
                ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                : 'bg-blue-600 text-white hover:bg-blue-700'
        }" onclick="executarBotaoDialog(${indice})">
            ${botao.texto}
        </button>
    `).join('');

    dialog.classList.remove('modal-hidden');
}

function executarBotaoDialog(indice) {
    if (window.dialogCallbacks && window.dialogCallbacks[indice]) {
        const callback = window.dialogCallbacks[indice];
        // Executar o callback (pode ser async ou não)
        const resultado = callback();
        
        // Se for uma Promise, aguardar antes de fechar
        if (resultado && typeof resultado.then === 'function') {
            resultado.then(() => {
                fecharDialog();
            }).catch(erro => {
                console.error('Erro ao executar callback:', erro);
                fecharDialog();
            });
        } else {
            fecharDialog();
        }
    } else {
        fecharDialog();
    }
}

function fecharDialog() {
    const dialog = document.getElementById('customDialog');
    if (dialog) {
        dialog.classList.add('modal-hidden');
    }
    window.dialogCallbacks = null;
}

// Funções auxiliares para tipos específicos
function mostrarAlerta(titulo, mensagem) {
    mostrarDialog(titulo, mensagem, 'info');
}

function mostrarErro(titulo, mensagem) {
    mostrarDialog(titulo, mensagem, 'error');
}

function mostrarSucesso(titulo, mensagem) {
    mostrarDialog(titulo, mensagem, 'success');
}

function mostrarAviso(titulo, mensagem) {
    mostrarDialog(titulo, mensagem, 'warning');
}

function mostrarConfirmacao(titulo, mensagem, callbackSim, callbackNao = null) {
    const botoesConfirmacao = [
        {
            texto: 'Sim',
            tipo: 'primary',
            callback: async () => {
                if (callbackSim) {
                    await callbackSim();
                }
                fecharDialog();
            }
        },
        {
            texto: 'Não',
            tipo: 'secondary',
            callback: () => {
                if (callbackNao) {
                    callbackNao();
                }
                fecharDialog();
            }
        }
    ];
    
    mostrarDialog(titulo, mensagem, 'question', botoesConfirmacao);
}

// ============================================
// NOTIFICAÇÕES
// ============================================
function mostrarNotificacao(mensagem, tipo = 'info') {
    // Cria um elemento de notificação simples
    const notificacao = document.createElement('div');
    notificacao.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        border-radius: 8px;
        color: white;
        font-weight: bold;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;

    const cores = {
        success: '#10b981',
        info: '#3b82f6',
        error: '#ef4444',
        warning: '#f59e0b'
    };

    notificacao.style.backgroundColor = cores[tipo] || cores.info;
    notificacao.textContent = mensagem;

    document.body.appendChild(notificacao);

    // Remover após 3 segundos
    setTimeout(() => {
        notificacao.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notificacao.remove(), 300);
    }, 3000);
}

// ============================================
// CONFIGURAÇÕES - ABAS
// ============================================
function mostrarAbaConfig(aba) {
    // Esconder todas as abas
    document.getElementById('aba-cargos').classList.add('hidden');
    document.getElementById('aba-usuarios').classList.add('hidden');
    document.getElementById('aba-medicamentos').classList.add('hidden');

    // Mostrar aba selecionada
    document.getElementById(`aba-${aba}`).classList.remove('hidden');

    // Atualizar botões ativos
    document.querySelectorAll('.tab-btn-config').forEach(btn => {
        btn.classList.remove('border-b-2', 'border-blue-600', 'text-blue-600');
        btn.classList.add('border-b-2', 'border-gray-300', 'text-gray-600');
    });

    event.target.closest('button').classList.remove('border-b-2', 'border-gray-300', 'text-gray-600');
    event.target.closest('button').classList.add('border-b-2', 'border-blue-600', 'text-blue-600');
}

// ============================================
// CARGOS
// ============================================
function openModalCargo() {
    document.getElementById('modalCargo').classList.remove('modal-hidden');
    limparFormularioCargo();
}

function closeModalCargo() {
    document.getElementById('modalCargo').classList.add('modal-hidden');
}

function limparFormularioCargo() {
    document.getElementById('formCargo').reset();
    document.querySelectorAll('#formCargo input[type="checkbox"]').forEach(cb => cb.checked = false);
}

async function adicionarCargo() {
    const nome = document.getElementById('cargoNome').value;
    const descricao = document.getElementById('cargoDescricao').value;

    if (!nome) {
        mostrarErro('Validação', 'Preencha o nome do cargo!');
        return;
    }

    // Coletar permissões
    const permissoes = {
        paciente: Array.from(document.querySelectorAll('input[name="permissaoPaciente"]:checked')).map(cb => cb.value),
        consulta: Array.from(document.querySelectorAll('input[name="permissaoConsulta"]:checked')).map(cb => cb.value),
        exame: Array.from(document.querySelectorAll('input[name="permissaoExame"]:checked')).map(cb => cb.value),
        farmacia: Array.from(document.querySelectorAll('input[name="permissaoFarmacia"]:checked')).map(cb => cb.value),
        cargo: Array.from(document.querySelectorAll('input[name="permissaoCargo"]:checked')).map(cb => cb.value)
    };

    const novoCargo = {
        id: Date.now().toString(),
        nome,
        descricao,
        permissoes,
        dataCriacao: new Date().toLocaleString('pt-BR')
    };

    cargos.push(novoCargo);

    try {
        await salvarDados(`cargos/${novoCargo.id}`, novoCargo);
        closeModalCargo();
        atualizarListaCargos();
        atualizarSelectCargoUsuario();
        mostrarSucesso('Sucesso', 'Cargo criado com sucesso!');
    } catch (erro) {
        mostrarErro('Erro', 'Erro ao salvar cargo: ' + erro.message);
    }
}

function atualizarListaCargos() {
    const lista = document.getElementById('cargosList');
    
    if (cargos.length === 0) {
        lista.innerHTML = '<p class="text-gray-500 text-center py-8">Nenhum cargo cadastrado</p>';
        return;
    }

    lista.innerHTML = cargos.map(cargo => `
        <div class="bg-blue-50 rounded-lg p-6 border border-blue-200 hover:shadow-lg transition">
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h3 class="text-xl font-bold text-gray-800">${cargo.nome}</h3>
                    <p class="text-gray-600 text-sm mt-1">${cargo.descricao || 'Sem descrição'}</p>
                </div>
                <div class="flex space-x-2">
                    <button onclick="editarCargo('${cargo.id}')" class="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button onclick="apagarCargo('${cargo.id}')" class="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm">
                        <i class="fas fa-trash"></i> Apagar
                    </button>
                </div>
            </div>

            <div class="border-t pt-4">
                <p class="text-sm font-semibold text-gray-700 mb-3">Permissões:</p>
                <div class="grid grid-cols-2 gap-2 text-xs">
                    <div>
                        <strong class="text-red-600">Pacientes:</strong>
                        <div class="text-gray-600">${cargo.permissoes?.paciente?.join(', ') || 'Nenhuma'}</div>
                    </div>
                    <div>
                        <strong class="text-green-600">Consultas:</strong>
                        <div class="text-gray-600">${cargo.permissoes?.consulta?.join(', ') || 'Nenhuma'}</div>
                    </div>
                    <div>
                        <strong class="text-purple-600">Exames:</strong>
                        <div class="text-gray-600">${cargo.permissoes?.exame?.join(', ') || 'Nenhuma'}</div>
                    </div>
                    <div>
                        <strong class="text-orange-600">Farmácia:</strong>
                        <div class="text-gray-600">${cargo.permissoes?.farmacia?.join(', ') || 'Nenhuma'}</div>
                    </div>
                </div>
            </div>

            <p class="text-xs text-gray-500 mt-4">Criado em: ${cargo.dataCriacao}</p>
        </div>
    `).join('');
}

function editarCargo(id) {
    mostrarAlerta('Em Desenvolvimento', 'Funcionalidade de edição em desenvolvimento');
}

function apagarCargo(id) {
    mostrarConfirmacao(
        'Remover Cargo',
        'Tem certeza que deseja remover este cargo?',
        async () => {
            cargos = cargos.filter(c => c.id !== id);
            
            try {
                await deletarDados(`cargos/${id}`);
            } catch (erro) {
                console.warn('Erro ao deletar do Firebase:', erro);
            }
            
            atualizarListaCargos();
            atualizarSelectCargoUsuario();
            mostrarNotificacao('Cargo removido!', 'info');
        }
    );
}

// ============================================
// USUÁRIOS
// ============================================
function openModalUsuario() {
    document.getElementById('modalUsuario').classList.remove('modal-hidden');
    limparFormularioUsuario();
    atualizarSelectCargoUsuario();
}

function closeModalUsuario() {
    document.getElementById('modalUsuario').classList.add('modal-hidden');
}

function limparFormularioUsuario() {
    document.getElementById('formUsuario').reset();
}

function atualizarSelectCargoUsuario() {
    const select = document.getElementById('usuarioCargo');
    select.innerHTML = '<option value="">Selecione um cargo</option>';
    
    cargos.forEach(cargo => {
        const option = document.createElement('option');
        option.value = cargo.id;
        option.textContent = cargo.nome;
        select.appendChild(option);
    });
}

async function adicionarUsuario() {
    const email = document.getElementById('usuarioEmail').value;
    const nome = document.getElementById('usuarioNome').value;
    const senha = document.getElementById('usuarioSenha').value;
    const cargoId = document.getElementById('usuarioCargo').value;

    if (!email || !nome || !senha || !cargoId) {
        mostrarErro('Validação', 'Preencha todos os campos obrigatórios!');
        return;
    }

    const novoUsuario = {
        id: Date.now().toString(),
        email,
        nome,
        cargoId,
        cargoNome: cargos.find(c => c.id === cargoId)?.nome || '',
        dataCriacao: new Date().toLocaleString('pt-BR'),
        ativo: true
    };

    usuarios.push(novoUsuario);

    try {
        // Aqui você poderia integrar com Firebase Auth para criar o usuário
        // Por enquanto, apenas salva no banco de dados
        await salvarDados(`usuarios/${novoUsuario.id}`, novoUsuario);
        closeModalUsuario();
        atualizarListaUsuarios();
        mostrarSucesso('Sucesso', 'Usuário criado com sucesso!');
    } catch (erro) {
        mostrarErro('Erro', 'Erro ao salvar usuário: ' + erro.message);
    }
}

function atualizarListaUsuarios() {
    const lista = document.getElementById('usuariosList');
    
    if (usuarios.length === 0) {
        lista.innerHTML = '<p class="text-gray-500 text-center py-8">Nenhum usuário cadastrado</p>';
        return;
    }

    lista.innerHTML = usuarios.map(usuario => `
        <div class="bg-purple-50 rounded-lg p-6 border border-purple-200 hover:shadow-lg transition">
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h3 class="text-xl font-bold text-gray-800">${usuario.nome}</h3>
                    <p class="text-gray-600 text-sm">${usuario.email}</p>
                    <div class="mt-2 flex items-center space-x-2">
                        <span class="px-3 py-1 bg-purple-200 text-purple-800 rounded-full text-xs font-semibold">${usuario.cargoNome}</span>
                        <span class="px-3 py-1 ${usuario.ativo ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'} rounded-full text-xs">
                            ${usuario.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                    </div>
                </div>
                <div class="flex space-x-2">
                    <button onclick="editarUsuario('${usuario.id}')" class="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button onclick="apagarUsuario('${usuario.id}')" class="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm">
                        <i class="fas fa-trash"></i> Apagar
                    </button>
                </div>
            </div>
            <p class="text-xs text-gray-500">Criado em: ${usuario.dataCriacao}</p>
        </div>
    `).join('');
}

function editarUsuario(id) {
    mostrarAlerta('Em Desenvolvimento', 'Funcionalidade de edição em desenvolvimento');
}

function apagarUsuario(id) {
    mostrarConfirmacao(
        'Remover Usuário',
        'Tem certeza que deseja remover este usuário?',
        async () => {
            usuarios = usuarios.filter(u => u.id !== id);
            
            try {
                await deletarDados(`usuarios/${id}`);
            } catch (erro) {
                console.warn('Erro ao deletar do Firebase:', erro);
            }
            
            atualizarListaUsuarios();
            mostrarNotificacao('Usuário removido!', 'info');
        }
    );
}

// ============================================
// MEDICAMENTOS CONFIGURAÇÃO
// ============================================
function openModalMedicamentoConfig() {
    document.getElementById('modalMedicamentoConfig').classList.remove('modal-hidden');
    limparFormularioMedicamentoConfig();
}

function closeModalMedicamentoConfig() {
    document.getElementById('modalMedicamentoConfig').classList.add('modal-hidden');
    document.getElementById('modalMedicamentoConfigTitle').textContent = 'Novo Medicamento';
}

function limparFormularioMedicamentoConfig() {
    document.getElementById('formMedicamentoConfig').reset();
    document.getElementById('medicamentoConfigId').value = '';
}

async function adicionarMedicamentoConfig() {
    const id = document.getElementById('medicamentoConfigId').value;
    const nome = document.getElementById('medicamentoConfigNome').value;
    const preco = document.getElementById('medicamentoConfigPreco').value;
    const qtdMax = document.getElementById('medicamentoConfigQtdMax').value;

    if (!nome || !preco || !qtdMax) {
        mostrarErro('Validação', 'Preencha todos os campos obrigatórios!');
        return;
    }

    // Verificar se é edição ou criação
    if (id) {
        // EDIÇÃO
        const medicamentoExistente = medicamentosConfig.find(m => m.id === id);
        if (medicamentoExistente) {
            medicamentoExistente.nome = nome;
            medicamentoExistente.preco = parseFloat(preco);
            medicamentoExistente.quantidadeMaxima = parseInt(qtdMax);
            
            try {
                await salvarDados(`medicamentosConfig/${id}`, medicamentoExistente);
                closeModalMedicamentoConfig();
                atualizarListaMedicamentosConfig();
                mostrarSucesso('Sucesso', 'Medicamento atualizado com sucesso!');
            } catch (erro) {
                mostrarErro('Erro', 'Erro ao atualizar medicamento: ' + erro.message);
            }
        }
    } else {
        // CRIAÇÃO
        const novoMedicamento = {
            id: Date.now().toString(),
            nome,
            preco: parseFloat(preco),
            quantidadeMaxima: parseInt(qtdMax),
            dataCriacao: new Date().toLocaleString('pt-BR')
        };

        medicamentosConfig.push(novoMedicamento);

        try {
            await salvarDados(`medicamentosConfig/${novoMedicamento.id}`, novoMedicamento);
            closeModalMedicamentoConfig();
            atualizarListaMedicamentosConfig();
            mostrarSucesso('Sucesso', 'Medicamento configurado com sucesso!');
        } catch (erro) {
            mostrarErro('Erro', 'Erro ao salvar medicamento: ' + erro.message);
        }
    }
}

function atualizarListaMedicamentosConfig() {
    const lista = document.getElementById('medicamentosConfigList');
    
    if (medicamentosConfig.length === 0) {
        lista.innerHTML = '<p class="text-gray-500 text-center py-8">Nenhum medicamento configurado</p>';
        return;
    }

    lista.innerHTML = medicamentosConfig.map(med => `
        <div class="bg-orange-50 rounded-lg p-6 border border-orange-200 hover:shadow-lg transition">
            <div class="flex justify-between items-start mb-4">
                <div class="flex-1">
                    <h3 class="text-xl font-bold text-gray-800">${med.nome}</h3>
                </div>
                <div class="flex space-x-2">
                    <button onclick="editarMedicamentoConfig('${med.id}')" class="px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button onclick="apagarMedicamentoConfig('${med.id}')" class="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm">
                        <i class="fas fa-trash"></i> Apagar
                    </button>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4 border-t pt-4">
                <div>
                    <p class="text-xs text-gray-500 uppercase font-semibold">Preço</p>
                    <p class="text-lg font-bold text-orange-600">R$ ${med.preco.toFixed(2)}</p>
                </div>
                <div>
                    <p class="text-xs text-gray-500 uppercase font-semibold">Máximo por Paciente</p>
                    <p class="text-lg font-bold text-blue-600">${med.quantidadeMaxima || 'N/A'} unid.</p>
                </div>
            </div>

            <p class="text-xs text-gray-500 mt-4">Criado em: ${med.dataCriacao}</p>
        </div>
    `).join('');
}

function editarMedicamentoConfig(id) {
    const medicamento = medicamentosConfig.find(m => m.id === id);
    
    if (!medicamento) {
        mostrarErro('Erro', 'Medicamento não encontrado!');
        return;
    }
    
    // Preencher formulário com dados existentes
    document.getElementById('medicamentoConfigId').value = id;
    document.getElementById('medicamentoConfigNome').value = medicamento.nome;
    document.getElementById('medicamentoConfigPreco').value = medicamento.preco.toFixed(2);
    document.getElementById('medicamentoConfigQtdMax').value = medicamento.quantidadeMaxima || '';
    
    // Mudar título da modal
    document.getElementById('modalMedicamentoConfigTitle').textContent = 'Editar Medicamento';
    
    // Abrir modal
    document.getElementById('modalMedicamentoConfig').classList.remove('modal-hidden');
}

function apagarMedicamentoConfig(id) {
    mostrarConfirmacao(
        'Remover Medicamento',
        'Tem certeza que deseja remover este medicamento?',
        async () => {
            medicamentosConfig = medicamentosConfig.filter(m => m.id !== id);
            
            try {
                await deletarDados(`medicamentosConfig/${id}`);
            } catch (erro) {
                console.warn('Erro ao deletar do Firebase:', erro);
            }
            
            atualizarListaMedicamentosConfig();
            atualizarListaMedicamentosDisponiveis();
            mostrarNotificacao('Medicamento removido!', 'info');
        }
    );
}

// ============================================
// MEDICAMENTOS - FARMÁCIA
// ============================================
function atualizarListaMedicamentosDisponiveis() {
    const container = document.getElementById('medicamentosDisponiveis');
    
    if (medicamentosConfig.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-8 col-span-3">Nenhum medicamento configurado</p>';
        return;
    }

    container.innerHTML = medicamentosConfig.map(med => `
        <div class="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200 hover:shadow-lg transition">
            <div class="mb-3">
                <h4 class="font-bold text-gray-800">${med.nome}</h4>
            </div>
            <div class="mb-3 pb-3 border-b">
                <p class="text-xs text-gray-600">Preço Unitário</p>
                <p class="text-lg font-bold text-orange-600">R$ ${med.preco.toFixed(2)}</p>
            </div>
            <button onclick="window.location.hash='farmacia'; setTimeout(() => openModalMedicamento(), 100)" class="w-full px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm font-semibold">
                <i class="fas fa-plus"></i> Usar
            </button>
        </div>
    `).join('');
}

function atualizarListaMedicamentosNoModal() {
    const lista = document.getElementById('listaMedicamentosDisponiveis');
    
    if (medicamentosConfig.length === 0) {
        lista.innerHTML = '<p class="text-gray-500 text-center py-4">Nenhum medicamento configurado</p>';
        return;
    }

    lista.innerHTML = medicamentosConfig.map(med => `
        <div class="p-4 bg-orange-50 rounded-lg border border-orange-200 hover:shadow-md transition cursor-pointer" onclick="selecionarMedicamento('${med.id}', '${med.nome}', ${med.preco})">
            <div class="flex justify-between items-start mb-2">
                <div class="flex-1">
                    <h5 class="font-bold text-gray-800">${med.nome}</h5>
                </div>
                <div class="text-right">
                    <p class="text-xs text-gray-600">R$</p>
                    <p class="text-lg font-bold text-orange-600">${med.preco.toFixed(2)}</p>
                </div>
            </div>
            <div class="flex items-center justify-center bg-white rounded px-2 py-1 mt-2">
                <span class="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-semibold">Clique para usar</span>
            </div>
        </div>
    `).join('');
}

function selecionarMedicamento(id, nome, preco) {
    if (!medicamentosSelecionados[id]) {
        medicamentosSelecionados[id] = {
            nome,
            preco,
            quantidade: 0
        };
    }
    medicamentosSelecionados[id].quantidade += 1;
    
    atualizarListaMedicamentosSelecionados();
    atualizarResume();
}

function removerMedicamentoSelecionado(id) {
    if (medicamentosSelecionados[id]) {
        medicamentosSelecionados[id].quantidade -= 1;
        if (medicamentosSelecionados[id].quantidade <= 0) {
            delete medicamentosSelecionados[id];
        }
    }
    atualizarListaMedicamentosSelecionados();
    atualizarResume();
}

function atualizarQuantidadeMedicamento(id, novaQuantidade) {
    novaQuantidade = parseInt(novaQuantidade) || 0;
    
    if (novaQuantidade < 0) {
        mostrarErro('Quantidade Inválida', 'A quantidade não pode ser negativa!');
        return;
    }
    
    if (novaQuantidade === 0) {
        delete medicamentosSelecionados[id];
    } else {
        if (medicamentosSelecionados[id]) {
            medicamentosSelecionados[id].quantidade = novaQuantidade;
        }
    }
    
    atualizarListaMedicamentosSelecionados();
    atualizarResume();
}

function atualizarListaMedicamentosSelecionados() {
    const secao = document.getElementById('secaoMedicamentosSelecionados');
    const div = document.getElementById('medicamentosSelecionadosDiv');

    const selecionados = Object.entries(medicamentosSelecionados).filter(([_, m]) => m.quantidade > 0);

    if (selecionados.length === 0) {
        secao.classList.add('hidden');
        div.innerHTML = '<p class="text-gray-500 text-sm">Nenhum medicamento selecionado</p>';
        return;
    }

    secao.classList.remove('hidden');
    div.innerHTML = selecionados.map(([id, med]) => `
        <div class="flex justify-between items-center p-4 bg-orange-50 rounded-lg border border-orange-200 hover:border-orange-400 transition">
            <div class="flex-1">
                <p class="font-semibold text-gray-800">${med.nome}</p>
                <p class="text-sm text-gray-600">Preço unitário: R$ ${med.preco.toFixed(2)}</p>
            </div>
            <div class="flex items-center space-x-3">
                <div class="flex items-center space-x-2 bg-white p-2 rounded border border-gray-300">
                    <button type="button" onclick="atualizarQuantidadeMedicamento('${id}', ${med.quantidade - 1})" class="px-2 py-1 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition">
                        <i class="fas fa-minus text-sm"></i>
                    </button>
                    <input type="number" value="${med.quantidade}" min="0" onchange="atualizarQuantidadeMedicamento('${id}', this.value)" class="w-12 text-center border-0 focus:ring-0 font-semibold" />
                    <button type="button" onclick="atualizarQuantidadeMedicamento('${id}', ${med.quantidade + 1})" class="px-2 py-1 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition">
                        <i class="fas fa-plus text-sm"></i>
                    </button>
                </div>
                <div class="text-right min-w-fit">
                    <p class="text-sm text-gray-600">Subtotal:</p>
                    <p class="font-bold text-orange-600">R$ ${(med.preco * med.quantidade).toFixed(2)}</p>
                </div>
                <button type="button" onclick="removerMedicamentoSelecionado('${id}')" class="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function atualizarResume() {
    const selecionados = Object.values(medicamentosSelecionados).filter(m => m.quantidade > 0);
    
    let totalItens = 0;
    let valorTotal = 0;
    const resumo = [];

    selecionados.forEach(med => {
        totalItens += med.quantidade;
        valorTotal += med.preco * med.quantidade;
        resumo.push(`<p class="text-gray-700">✓ ${med.quantidade}x ${med.nome} - R$ ${(med.preco * med.quantidade).toFixed(2)}</p>`);
    });

    if (resumo.length === 0) {
        document.getElementById('resumoMedicamentos').innerHTML = '<p class="text-gray-600">Nenhum medicamento selecionado</p>';
        document.getElementById('totalItens').textContent = '0';
        document.getElementById('valorTotal').textContent = '0.00';
    } else {
        document.getElementById('resumoMedicamentos').innerHTML = resumo.join('');
        document.getElementById('totalItens').textContent = totalItens;
        document.getElementById('valorTotal').textContent = valorTotal.toFixed(2);
    }
}

function adicionarMedicamentoNovo() {
    const pacienteId = document.getElementById('medicamentoPacienteId').value;
    
    const selecionados = Object.entries(medicamentosSelecionados).filter(([_, m]) => m.quantidade > 0);
    
    if (!pacienteId) {
        mostrarErro('Paciente Obrigatório', 'Selecione um paciente!');
        return;
    }

    if (selecionados.length === 0) {
        mostrarErro('Medicamentos Obrigatórios', 'Selecione pelo menos um medicamento!');
        return;
    }

    // Buscar paciente
    const paciente = pacientes.find(p => p.id === pacienteId);
    if (!paciente) {
        mostrarErro('Paciente Não Encontrado', 'Paciente não encontrado!');
        return;
    }

    const hoje = new Date().toISOString().split('T')[0];
    
    // Validar limite diário por paciente E limite individual por medicamento
    const medicamentosHoje = medicamentos.filter(m => m.pacienteId === pacienteId && m.dataRegistro === hoje);
    const qtdHoje = medicamentosHoje.length;
    
    // Calcular quantidade total a adicionar
    let quantidadeTotal = 0;
    selecionados.forEach(([_, med]) => {
        quantidadeTotal += med.quantidade;
    });
    
    // Verificar limite individual por medicamento
    for (const [medId, med] of selecionados) {
        const configMed = medicamentosConfig.find(m => m.nome === med.nome);
        if (configMed && configMed.quantidadeMaxima) {
            const qtdMedHoje = medicamentosHoje.filter(m => m.nome === med.nome).length;
            if (qtdMedHoje + med.quantidade > configMed.quantidadeMaxima) {
                mostrarErro(
                    'Limite do Medicamento Excedido',
                    `Medicamento: ${med.nome}\n\nLimite máximo: ${configMed.quantidadeMaxima} unidades\nJá registrado hoje: ${qtdMedHoje}\nTentando adicionar: ${med.quantidade}\n\nReduz a quantidade deste medicamento.`
                );
                return;
            }
        }
    }
    
    // Limite de 20 medicamentos por dia por paciente
    const LIMITE_DIARIO = 20;
    if (qtdHoje + quantidadeTotal > LIMITE_DIARIO) {
        mostrarErro(
            'Limite Diário Excedido',
            `Limite de ${LIMITE_DIARIO} medicamentos por dia atingido.\n\nJá registrados hoje: ${qtdHoje}\nTentando adicionar: ${quantidadeTotal}\nTotal: ${qtdHoje + quantidadeTotal}\n\nReduz a quantidade de medicamentos selecionados.`
        );
        return;
    }
    
    // Salvar medicamentos
    let valorTotal = 0;
    selecionados.forEach(([id, med]) => {
        for (let i = 0; i < med.quantidade; i++) {
            const novoMedicamento = {
                id: `MED-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                nome: med.nome,
                quantidade: 1,
                preco: med.preco,
                valor: med.preco,
                pacienteId: paciente.id,
                pacienteNome: paciente.nome,
                dataCriacao: new Date().toLocaleDateString('pt-BR'),
                dataRegistro: hoje
            };
            
            valorTotal += med.preco;
            medicamentos.push(novoMedicamento);

            // Salvar no Firebase
            try {
                salvarDados(`medicamentos/${novoMedicamento.id}`, novoMedicamento);
            } catch (erro) {
                console.warn('Firebase não configurado, dados salvos localmente apenas', erro);
            }
        }
    });

    closeModalMedicamento();
    atualizarListaMedicamentos();
    atualizarDashboard();
    mostrarNotificacao(`✅ Atendimento registrado! Valor total: R$ ${valorTotal.toFixed(2)}`, 'success');
}


window.showSection = showSection;
window.openModalPaciente = openModalPaciente;
window.closeModalPaciente = closeModalPaciente;
window.deletarPaciente = deletarPaciente;
window.openModalConsulta = openModalConsulta;
window.closeModalConsulta = closeModalConsulta;
window.deletarConsulta = deletarConsulta;
window.openModalExame = openModalExame;
window.closeModalExame = closeModalExame;
window.deletarExame = deletarExame;
window.openModalMedicamento = openModalMedicamento;
window.closeModalMedicamento = closeModalMedicamento;
window.deletarMedicamento = deletarMedicamento;
window.apagarAtendimento = apagarAtendimento;
window.buscarPacientes = buscarPacientes;
window.selecionarPaciente = selecionarPaciente;
window.limparSelecaoPaciente = limparSelecaoPaciente;
window.buscarPacientesConsulta = buscarPacientesConsulta;
window.selecionarPacienteConsulta = selecionarPacienteConsulta;
window.limparSelecaoPacienteConsulta = limparSelecaoPacienteConsulta;
window.buscarPacientesExame = buscarPacientesExame;
window.selecionarPacienteExame = selecionarPacienteExame;
window.limparSelecaoPacienteExame = limparSelecaoPacienteExame;
window.atualizarTotal = atualizarTotal;
window.atualizarConsumosDia = atualizarConsumosDia;
window.executarBotaoDialog = executarBotaoDialog;
window.fecharDialog = fecharDialog;
// Configurações - Abas
window.mostrarAbaConfig = mostrarAbaConfig;

// Cargos
window.openModalCargo = openModalCargo;
window.closeModalCargo = closeModalCargo;
window.adicionarCargo = adicionarCargo;
window.editarCargo = editarCargo;
window.apagarCargo = apagarCargo;

// Usuários
window.openModalUsuario = openModalUsuario;
window.closeModalUsuario = closeModalUsuario;
window.adicionarUsuario = adicionarUsuario;
window.editarUsuario = editarUsuario;
window.apagarUsuario = apagarUsuario;

// Medicamentos Config
window.openModalMedicamentoConfig = openModalMedicamentoConfig;
window.closeModalMedicamentoConfig = closeModalMedicamentoConfig;
window.adicionarMedicamentoConfig = adicionarMedicamentoConfig;
window.editarMedicamentoConfig = editarMedicamentoConfig;
window.apagarMedicamentoConfig = apagarMedicamentoConfig;

// Medicamentos - Farmácia
window.atualizarListaMedicamentosDisponiveis = atualizarListaMedicamentosDisponiveis;
window.atualizarListaMedicamentosNoModal = atualizarListaMedicamentosNoModal;
window.selecionarMedicamento = selecionarMedicamento;
window.removerMedicamentoSelecionado = removerMedicamentoSelecionado;
window.atualizarQuantidadeMedicamento = atualizarQuantidadeMedicamento;
window.adicionarMedicamentoNovo = adicionarMedicamentoNovo;