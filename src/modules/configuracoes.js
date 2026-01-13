// ============================================
// MÓDULO DE CONFIGURAÇÕES
// ============================================

import { mostrarNotificacao, mostrarConfirmacao, mostrarErro } from '../utils/dialogs.js';
import { salvarNoFirebase, deletarDoFirebase } from '../utils/firebase.js';

export let cargos = [];
export let usuarios = [];
export let medicamentosConfig = [];

export function init(dadosCarregados) {
    cargos = dadosCarregados.cargos || [];
    usuarios = dadosCarregados.usuarios || [];
    medicamentosConfig = dadosCarregados.medicamentosConfig || [];
    configurarEventos();
    atualizarListaCargos();
    atualizarListaUsuarios();
    atualizarListaMedicamentosConfig();
}

function configurarEventos() {
    const formCargo = document.getElementById('formCargo');
    if (formCargo) {
        formCargo.addEventListener('submit', (e) => {
            e.preventDefault();
            adicionarCargo();
        });
    }

    const formUsuario = document.getElementById('formUsuario');
    if (formUsuario) {
        formUsuario.addEventListener('submit', (e) => {
            e.preventDefault();
            adicionarUsuario();
        });
    }

    const formMedicamentoConfig = document.getElementById('formMedicamentoConfig');
    if (formMedicamentoConfig) {
        formMedicamentoConfig.addEventListener('submit', (e) => {
            e.preventDefault();
            adicionarMedicamentoConfig();
        });
    }
}

// ============================================
// ABAS DE CONFIGURAÇÃO
// ============================================
export function mostrarAba(aba) {
    document.getElementById('aba-cargos').classList.add('hidden');
    document.getElementById('aba-usuarios').classList.add('hidden');
    document.getElementById('aba-medicamentos').classList.add('hidden');

    document.getElementById(`aba-${aba}`).classList.remove('hidden');

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
export function openModalCargo() {
    document.getElementById('modalCargo').classList.remove('modal-hidden');
    limparFormularioCargo();
}

export function closeModalCargo() {
    document.getElementById('modalCargo').classList.add('modal-hidden');
}

function limparFormularioCargo() {
    document.getElementById('formCargo').reset();
    document.querySelectorAll('#formCargo input[type="checkbox"]').forEach(cb => cb.checked = false);
}

export async function adicionarCargo() {
    const nome = document.getElementById('cargoNome').value;
    const descricao = document.getElementById('cargoDescricao').value;

    if (!nome) {
        mostrarErro('Campo Obrigatório', 'Digite o nome do cargo');
        return;
    }

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
        await salvarNoFirebase('cargos', novoCargo);
    } catch (erro) {
        console.error('Erro ao salvar cargo:', erro);
    }

    closeModalCargo();
    atualizarListaCargos();
    atualizarSelectCargoUsuario();
    mostrarNotificacao('Cargo criado com sucesso!', 'success');
}

export function atualizarListaCargos() {
    const lista = document.getElementById('cargosList');
    
    if (cargos.length === 0) {
        lista.innerHTML = '<p class="text-gray-500 text-center py-8">Nenhum cargo configurado</p>';
        return;
    }

    lista.innerHTML = cargos.map(cargo => `
        <div class="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-lg transition">
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h3 class="text-lg font-bold text-gray-800">${cargo.nome}</h3>
                    <p class="text-sm text-gray-600">${cargo.descricao}</p>
                </div>
                <div class="flex gap-2">
                    <button onclick="window.moduloConfig.editarCargo('${cargo.id}')" class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm">
                        Editar
                    </button>
                    <button onclick="window.moduloConfig.apagarCargo('${cargo.id}')" class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm">
                        Apagar
                    </button>
                </div>
            </div>
            <div class="text-xs text-gray-500">${cargo.dataCriacao}</div>
        </div>
    `).join('');
}

export function editarCargo(id) {
    mostrarErro('Em Desenvolvimento', 'Função de edição será implementada em breve');
}

export function apagarCargo(id) {
    mostrarConfirmacao(
        'Apagar Cargo',
        'Tem certeza que deseja apagar este cargo?',
        async () => {
            cargos = cargos.filter(c => c.id !== id);
            await deletarDoFirebase('cargos', id);
            atualizarListaCargos();
            atualizarSelectCargoUsuario();
            mostrarNotificacao('Cargo apagado com sucesso!', 'success');
        }
    );
}

// ============================================
// USUÁRIOS
// ============================================
export function openModalUsuario() {
    document.getElementById('modalUsuario').classList.remove('modal-hidden');
    limparFormularioUsuario();
    atualizarSelectCargoUsuario();
}

export function closeModalUsuario() {
    document.getElementById('modalUsuario').classList.add('modal-hidden');
}

function limparFormularioUsuario() {
    document.getElementById('formUsuario').reset();
}

export function atualizarSelectCargoUsuario() {
    const select = document.getElementById('usuarioCargo');
    select.innerHTML = '<option value="">Selecione um cargo</option>' + 
        cargos.map(cargo => `<option value="${cargo.id}">${cargo.nome}</option>`).join('');
}

export async function adicionarUsuario() {
    const email = document.getElementById('usuarioEmail').value;
    const nome = document.getElementById('usuarioNome').value;
    const senha = document.getElementById('usuarioSenha').value;
    const cargoId = document.getElementById('usuarioCargo').value;

    if (!email || !nome || !senha || !cargoId) {
        mostrarErro('Campos Obrigatórios', 'Por favor, preencha todos os campos');
        return;
    }

    const novoUsuario = {
        id: Date.now().toString(),
        email,
        nome,
        senha: btoa(senha), // Codificar senha (não é seguro para produção)
        cargoId,
        dataCriacao: new Date().toLocaleString('pt-BR')
    };

    usuarios.push(novoUsuario);

    try {
        await salvarNoFirebase('usuarios', novoUsuario);
    } catch (erro) {
        console.error('Erro ao salvar usuário:', erro);
    }

    closeModalUsuario();
    atualizarListaUsuarios();
    mostrarNotificacao('Usuário criado com sucesso!', 'success');
}

export function atualizarListaUsuarios() {
    const lista = document.getElementById('usuariosList');
    
    if (usuarios.length === 0) {
        lista.innerHTML = '<p class="text-gray-500 text-center py-8">Nenhum usuário cadastrado</p>';
        return;
    }

    lista.innerHTML = usuarios.map(usuario => {
        const cargo = cargos.find(c => c.id === usuario.cargoId);
        return `
            <div class="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-lg transition">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3 class="text-lg font-bold text-gray-800">${usuario.nome}</h3>
                        <p class="text-sm text-gray-600">${usuario.email}</p>
                        <p class="text-sm text-gray-600">Cargo: ${cargo ? cargo.nome : 'N/A'}</p>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="window.moduloConfig.editarUsuario('${usuario.id}')" class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm">
                            Editar
                        </button>
                        <button onclick="window.moduloConfig.apagarUsuario('${usuario.id}')" class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm">
                            Apagar
                        </button>
                    </div>
                </div>
                <div class="text-xs text-gray-500">${usuario.dataCriacao}</div>
            </div>
        `;
    }).join('');
}

export function editarUsuario(id) {
    mostrarErro('Em Desenvolvimento', 'Função de edição será implementada em breve');
}

export function apagarUsuario(id) {
    mostrarConfirmacao(
        'Apagar Usuário',
        'Tem certeza que deseja apagar este usuário?',
        async () => {
            usuarios = usuarios.filter(u => u.id !== id);
            await deletarDoFirebase('usuarios', id);
            atualizarListaUsuarios();
            mostrarNotificacao('Usuário apagado com sucesso!', 'success');
        }
    );
}

// ============================================
// MEDICAMENTOS CONFIGURAÇÃO
// ============================================
export function openModalMedicamentoConfig() {
    document.getElementById('modalMedicamentoConfig').classList.remove('modal-hidden');
    limparFormularioMedicamentoConfig();
    document.getElementById('medicamentoConfigId').value = '';
    document.getElementById('modalMedicamentoConfigTitle').textContent = 'Novo Medicamento';
}

export function closeModalMedicamentoConfig() {
    document.getElementById('modalMedicamentoConfig').classList.add('modal-hidden');
}

function limparFormularioMedicamentoConfig() {
    document.getElementById('formMedicamentoConfig').reset();
}

export async function adicionarMedicamentoConfig() {
    const id = document.getElementById('medicamentoConfigId').value;
    const nome = document.getElementById('medicamentoConfigNome').value;
    const preco = document.getElementById('medicamentoConfigPreco').value;
    const qtdMax = document.getElementById('medicamentoConfigQtdMax').value;

    if (!nome || !preco || !qtdMax) {
        mostrarErro('Campos Obrigatórios', 'Por favor, preencha todos os campos');
        return;
    }

    let medicamentoParaSalvar;

    if (id) {
        // Editar
        const medicamentoExistente = medicamentosConfig.find(m => m.id === id);
        if (medicamentoExistente) {
            medicamentoExistente.nome = nome;
            medicamentoExistente.preco = preco;
            medicamentoExistente.qtdMax = qtdMax;
            medicamentoParaSalvar = medicamentoExistente;
        }
    } else {
        // Criar novo
        const novoMedicamento = {
            id: Date.now().toString(),
            nome,
            preco,
            qtdMax,
            dataCriacao: new Date().toLocaleString('pt-BR')
        };
        medicamentosConfig.push(novoMedicamento);
        medicamentoParaSalvar = novoMedicamento;
    }

    try {
        await salvarNoFirebase('medicamentosConfig', medicamentoParaSalvar);
    } catch (erro) {
        console.error('Erro ao salvar medicamento:', erro);
    }

    closeModalMedicamentoConfig();
    atualizarListaMedicamentosConfig();
    mostrarNotificacao('Medicamento salvo com sucesso!', 'success');
}

export function atualizarListaMedicamentosConfig() {
    const lista = document.getElementById('medicamentosList');
    
    if (medicamentosConfig.length === 0) {
        lista.innerHTML = '<p class="text-gray-500 text-center py-8">Nenhum medicamento configurado</p>';
        return;
    }

    lista.innerHTML = medicamentosConfig.map(med => `
        <div class="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-lg transition">
            <div class="flex justify-between items-start mb-4">
                <div class="flex-1">
                    <h3 class="text-lg font-bold text-gray-800">${med.nome}</h3>
                    <p class="text-sm text-gray-600">Preço: R$ ${parseFloat(med.preco).toFixed(2)}</p>
                    <p class="text-sm text-gray-600">Qtd. Máxima: ${med.qtdMax}</p>
                </div>
                <div class="flex gap-2">
                    <button onclick="window.moduloConfig.editarMedicamentoConfig('${med.id}')" class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm">
                        Editar
                    </button>
                    <button onclick="window.moduloConfig.apagarMedicamentoConfig('${med.id}')" class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm">
                        Apagar
                    </button>
                </div>
            </div>
            <div class="text-xs text-gray-500">${med.dataCriacao}</div>
        </div>
    `).join('');
}

export function editarMedicamentoConfig(id) {
    const medicamento = medicamentosConfig.find(m => m.id === id);
    if (medicamento) {
        document.getElementById('medicamentoConfigId').value = medicamento.id;
        document.getElementById('medicamentoConfigNome').value = medicamento.nome;
        document.getElementById('medicamentoConfigPreco').value = medicamento.preco;
        document.getElementById('medicamentoConfigQtdMax').value = medicamento.qtdMax;
        document.getElementById('modalMedicamentoConfigTitle').textContent = 'Editar Medicamento';
        document.getElementById('modalMedicamentoConfig').classList.remove('modal-hidden');
    }
}

export function apagarMedicamentoConfig(id) {
    mostrarConfirmacao(
        'Apagar Medicamento',
        'Tem certeza que deseja apagar este medicamento?',
        async () => {
            medicamentosConfig = medicamentosConfig.filter(m => m.id !== id);
            await deletarDoFirebase('medicamentosConfig', id);
            atualizarListaMedicamentosConfig();
            mostrarNotificacao('Medicamento apagado com sucesso!', 'success');
        }
    );
}

// Exportar como global
window.moduloConfig = {
    mostrarAba,
    openModalCargo,
    closeModalCargo,
    adicionarCargo,
    editarCargo,
    apagarCargo,
    openModalUsuario,
    closeModalUsuario,
    adicionarUsuario,
    editarUsuario,
    apagarUsuario,
    openModalMedicamentoConfig,
    closeModalMedicamentoConfig,
    adicionarMedicamentoConfig,
    editarMedicamentoConfig,
    apagarMedicamentoConfig
};
