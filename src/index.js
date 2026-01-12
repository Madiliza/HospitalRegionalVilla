import { salvarDados, lerDados } from '../config/firebase-config.js';

// ============================================
// VARIÁVEIS GLOBAIS
// ============================================
let pacientes = [];
let consultas = [];
let exames = [];
let medicamentos = [];

// ============================================
// INICIALIZAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM carregado');
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
        adicionarMedicamento();
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
        btn.classList.remove('bg-blue-600', 'text-white');
        btn.classList.add('hover:bg-gray-100', 'text-gray-700');
    });

    const activeBtn = event.target.closest('button');
    if (activeBtn) {
        activeBtn.classList.remove('hover:bg-gray-100', 'text-gray-700');
        activeBtn.classList.add('bg-blue-600', 'text-white');
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
        alert('Preencha todos os campos obrigatórios!');
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
        <div class="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg border-l-4 border-blue-600">
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
    if (confirm('Tem certeza que deseja deletar este paciente?')) {
        pacientes = pacientes.filter(p => p.id !== id);
        atualizarListaPacientes();
        atualizarDashboard();
        mostrarNotificacao('Paciente removido!', 'info');
    }
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
}

async function adicionarConsulta() {
    const pacienteId = document.getElementById('consultaPacienteId').value;
    const especialidade = document.getElementById('consultaEspecialidade').value;
    const data = document.getElementById('consultaData').value;
    const hora = document.getElementById('consultaHora').value;

    if (!pacienteId || !especialidade || !data || !hora) {
        alert('Preencha todos os campos!');
        return;
    }

    // Verificar se paciente existe
    if (!pacientes.find(p => p.id === pacienteId)) {
        alert('Paciente não encontrado!');
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
    if (confirm('Tem certeza que deseja cancelar esta consulta?')) {
        consultas = consultas.filter(c => c.id !== id);
        atualizarListaConsultas();
        atualizarDashboard();
        mostrarNotificacao('Consulta cancelada!', 'info');
    }
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
}

async function adicionarExame() {
    const pacienteId = document.getElementById('examePacienteId').value;
    const tipo = document.getElementById('exameTipo').value;
    const data = document.getElementById('exameData').value;
    const hora = document.getElementById('exameHora').value;

    if (!pacienteId || !tipo || !data || !hora) {
        alert('Preencha todos os campos!');
        return;
    }

    // Verificar se paciente existe
    if (!pacientes.find(p => p.id === pacienteId)) {
        alert('Paciente não encontrado!');
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
    if (confirm('Tem certeza que deseja cancelar este exame?')) {
        exames = exames.filter(e => e.id !== id);
        atualizarListaExames();
        atualizarDashboard();
        mostrarNotificacao('Exame cancelado!', 'info');
    }
}

// ============================================
// MODAL MEDICAMENTO (FARMÁCIA)
// ============================================
function openModalMedicamento() {
    document.getElementById('modalMedicamento').classList.remove('modal-hidden');
    limparFormularioMedicamento();
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
    atualizarConsumosDia();
}

function limparSelecaoPaciente() {
    document.getElementById('buscaPacienteId').value = '';
    document.getElementById('medicamentoPacienteId').value = '';
    document.getElementById('dadosPacienteDiv').classList.add('hidden');
    document.getElementById('sugestoesPacientes').classList.add('hidden');
    document.getElementById('qtdKits').value = '0';
    document.getElementById('qtdAtaduras').value = '0';
    document.getElementById('qtdAnalgesicos').value = '0';
    atualizarTotal();
}

function closeModalMedicamento() {
    document.getElementById('modalMedicamento').classList.add('modal-hidden');
}

function limparFormularioMedicamento() {
    document.getElementById('formMedicamento').reset();
    document.getElementById('buscaPacienteId').value = '';
    document.getElementById('medicamentoPacienteId').value = '';
    document.getElementById('qtdKits').value = '0';
    document.getElementById('qtdAtaduras').value = '0';
    document.getElementById('qtdAnalgesicos').value = '0';
    document.getElementById('resumoMedicamentos').innerHTML = '<p class="text-gray-600">Selecione medicamentos acima</p>';
    document.getElementById('totalItens').textContent = '0';
    document.getElementById('dadosPacienteDiv').classList.add('hidden');
    document.getElementById('sugestoesPacientes').classList.add('hidden');
    limparAvisos();
}

function limparAvisos() {
    document.getElementById('avisoKits').classList.add('hidden');
    document.getElementById('avisoAtaduras').classList.add('hidden');
    document.getElementById('avisoAnalgesicos').classList.add('hidden');
}

function atualizarConsumosDia() {
    const pacienteId = document.getElementById('medicamentoPacienteId').value;
    if (!pacienteId) return;

    const hoje = new Date().toISOString().split('T')[0];

    // Medicamentos do dia para este paciente
    const medicamentosHoje = {
        'Kits': 0,
        'Ataduras': 0,
        'Analgésicos': 0
    };

    medicamentos.forEach(m => {
        if (m.pacienteId === pacienteId) {
            medicamentosHoje[m.nome] = (medicamentosHoje[m.nome] || 0) + m.quantidade;
        }
    });

    // Atualizar displays de consumo
    document.getElementById('kitsDiaInfo').innerHTML = `Registrado hoje: ${medicamentosHoje['Kits']}/5`;
    document.getElementById('atadurasDiaInfo').innerHTML = `Registrado hoje: ${medicamentosHoje['Ataduras']}/10`;
    document.getElementById('analgesicoDiaInfo').innerHTML = `Registrado hoje: ${medicamentosHoje['Analgésicos']}/10`;

    // Adicionar avisos se limite atingido
    if (medicamentosHoje['Kits'] >= 5) {
        document.getElementById('avisoKits').textContent = '⚠️ Limite diário atingido!';
        document.getElementById('avisoKits').classList.remove('hidden');
        document.getElementById('qtdKits').disabled = true;
    } else {
        document.getElementById('qtdKits').disabled = false;
    }

    if (medicamentosHoje['Ataduras'] >= 10) {
        document.getElementById('avisoAtaduras').textContent = '⚠️ Limite diário atingido!';
        document.getElementById('avisoAtaduras').classList.remove('hidden');
        document.getElementById('qtdAtaduras').disabled = true;
    } else {
        document.getElementById('qtdAtaduras').disabled = false;
    }

    if (medicamentosHoje['Analgésicos'] >= 10) {
        document.getElementById('avisoAnalgesicos').textContent = '⚠️ Limite diário atingido!';
        document.getElementById('avisoAnalgesicos').classList.remove('hidden');
        document.getElementById('qtdAnalgesicos').disabled = true;
    } else {
        document.getElementById('qtdAnalgesicos').disabled = false;
    }

    atualizarTotal();
}

function atualizarTotal() {
    const qtdKits = parseInt(document.getElementById('qtdKits').value) || 0;
    const qtdAtaduras = parseInt(document.getElementById('qtdAtaduras').value) || 0;
    const qtdAnalgesicos = parseInt(document.getElementById('qtdAnalgesicos').value) || 0;

    const resumo = [];
    if (qtdKits > 0) resumo.push(`${qtdKits} Kit${qtdKits > 1 ? 's' : ''}`);
    if (qtdAtaduras > 0) resumo.push(`${qtdAtaduras} Atadura${qtdAtaduras > 1 ? 's' : ''}`);
    if (qtdAnalgesicos > 0) resumo.push(`${qtdAnalgesicos} Analgésico${qtdAnalgesicos > 1 ? 's' : ''}`);

    const totalItens = qtdKits + qtdAtaduras + qtdAnalgesicos;

    if (resumo.length === 0) {
        document.getElementById('resumoMedicamentos').innerHTML = '<p class="text-gray-600">Selecione medicamentos acima</p>';
    } else {
        document.getElementById('resumoMedicamentos').innerHTML = resumo.map(item => `<p class="text-gray-700">✓ ${item}</p>`).join('');
    }

    document.getElementById('totalItens').textContent = totalItens;
}

async function adicionarMedicamento() {
    const pacienteId = document.getElementById('medicamentoPacienteId').value;
    const qtdKits = parseInt(document.getElementById('qtdKits').value) || 0;
    const qtdAtaduras = parseInt(document.getElementById('qtdAtaduras').value) || 0;
    const qtdAnalgesicos = parseInt(document.getElementById('qtdAnalgesicos').value) || 0;

    if (!pacienteId) {
        alert('Selecione um paciente!');
        return;
    }

    const totalItens = qtdKits + qtdAtaduras + qtdAnalgesicos;
    if (totalItens === 0) {
        alert('Adicione pelo menos um medicamento!');
        return;
    }

    // Buscar paciente
    const paciente = pacientes.find(p => p.id === pacienteId);
    if (!paciente) {
        alert('Paciente não encontrado!');
        return;
    }

    const hoje = new Date().toISOString().split('T')[0];

    // Verificar limites
    const medicamentosHoje = {
        'Kits': 0,
        'Ataduras': 0,
        'Analgésicos': 0
    };

    medicamentos.forEach(m => {
        if (m.pacienteId === pacienteId) {
            medicamentosHoje[m.nome] = (medicamentosHoje[m.nome] || 0) + m.quantidade;
        }
    });

    // Validar limites
    const limites = { 'Kits': 5, 'Ataduras': 10, 'Analgésicos': 10 };

    if (medicamentosHoje['Kits'] + qtdKits > limites['Kits']) {
        alert(`Limite de Kits excedido! Já registrados: ${medicamentosHoje['Kits']}, Limite: ${limites['Kits']}`);
        return;
    }
    if (medicamentosHoje['Ataduras'] + qtdAtaduras > limites['Ataduras']) {
        alert(`Limite de Ataduras excedido! Já registrados: ${medicamentosHoje['Ataduras']}, Limite: ${limites['Ataduras']}`);
        return;
    }
    if (medicamentosHoje['Analgésicos'] + qtdAnalgesicos > limites['Analgésicos']) {
        alert(`Limite de Analgésicos excedido! Já registrados: ${medicamentosHoje['Analgésicos']}, Limite: ${limites['Analgésicos']}`);
        return;
    }

    // Registrar medicamentos
    const medicamentosParaRegistrar = [];

    if (qtdKits > 0) {
        medicamentosParaRegistrar.push({
            nome: 'Kits',
            quantidade: qtdKits
        });
    }
    if (qtdAtaduras > 0) {
        medicamentosParaRegistrar.push({
            nome: 'Ataduras',
            quantidade: qtdAtaduras
        });
    }
    if (qtdAnalgesicos > 0) {
        medicamentosParaRegistrar.push({
            nome: 'Analgésicos',
            quantidade: qtdAnalgesicos
        });
    }

    // Salvar medicamentos
    for (const med of medicamentosParaRegistrar) {
        const novoMedicamento = {
            id: `MED-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            nome: med.nome,
            quantidade: med.quantidade,
            pacienteId: paciente.id,
            pacienteNome: paciente.nome,
            dataCriacao: new Date().toLocaleDateString('pt-BR'),
            dataRegistro: hoje
        };

        medicamentos.push(novoMedicamento);

        // Salvar no Firebase
        try {
            await salvarDados(`medicamentos/${novoMedicamento.id}`, novoMedicamento);
        } catch (erro) {
            console.warn('Firebase não configurado, dados salvos localmente apenas', erro);
        }
    }

    closeModalMedicamento();
    atualizarListaMedicamentos();
    atualizarDashboard();

    mostrarNotificacao('✅ Medicamentos registrados com sucesso!', 'success');
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
                <div class="mb-4">
                    <h3 class="text-lg font-bold text-gray-800">${dados.pacienteName}</h3>
                    <p class="text-gray-600"><i class="fas fa-id-card mr-2"></i>ID: ${pacienteId}</p>
                    <span class="inline-block mt-2 px-3 py-1 bg-orange-200 text-orange-800 rounded-full text-xs">Paciente</span>
                </div>
                <div class="border-t pt-4 space-y-3">
                    ${medicamentosHtml}
                </div>
            </div>
        `;
    }).join('');
}

function deletarMedicamento(id) {
    if (confirm('Tem certeza que deseja remover este medicamento?')) {
        medicamentos = medicamentos.filter(m => m.id !== id);
        atualizarListaMedicamentos();
        atualizarDashboard();
        mostrarNotificacao('Medicamento removido!', 'info');
    }
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
// CARREGAR DADOS (simulado - conectar ao Firebase depois)
// ============================================
async function carregarDados() {
    try {
        // Aqui você pode carregar dados do Firebase
        // const dadosPacientes = await lerDados('pacientes');
        // const dadosConsultas = await lerDados('consultas');
        // etc...

        // Por enquanto, apenas atualiza o dashboard
        atualizarDashboard();
        console.log('Dados carregados com sucesso');
    } catch (erro) {
        console.error('Erro ao carregar dados:', erro);
        // Continua funcionando mesmo se o Firebase não estiver configurado
        atualizarDashboard();
    }
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

// Exposer funções globais
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
window.buscarPacientes = buscarPacientes;
window.selecionarPaciente = selecionarPaciente;
window.limparSelecaoPaciente = limparSelecaoPaciente;
window.atualizarTotal = atualizarTotal;
window.atualizarConsumosDia = atualizarConsumosDia;
