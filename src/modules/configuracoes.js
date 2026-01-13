// ============================================
// MÓDULO DE CONFIGURAÇÕES
// ============================================

import { mostrarNotificacao, mostrarConfirmacao, mostrarErro } from '../utils/dialogs.js';
import { salvarNoFirebase, deletarDoFirebase } from '../utils/firebase.js';
import { temPermissao } from '../utils/permissoes.js';

export let cargos = [];
export let usuarios = [];
export let medicamentosConfig = [];
export let solicitacoesCadastro = [];

export function init(dadosCarregados) {
    cargos = dadosCarregados.cargos || [];
    usuarios = dadosCarregados.usuarios || [];
    medicamentosConfig = dadosCarregados.medicamentosConfig || [];
    solicitacoesCadastro = dadosCarregados.solicitacoesCadastro || [];
    configurarEventos();
    aplicarPermissoesAbas(); // Aplicar permissões às abas
    atualizarListaCargos();
    atualizarListaUsuarios();
    atualizarListaMedicamentosConfig();
    atualizarListaSolicitacoes();
}

// Controlar visibilidade das abas baseado em permissões
// IMPORTANTE: Cada aba verifica seu módulo específico, não todos usam 'cargo'
export function aplicarPermissoesAbas() {
    
    // ============================================
    // ABA DE CARGOS - Verifica permissão do módulo 'cargo'
    // ============================================
    const btnCargos = document.querySelector('button[onclick="window.moduloConfig.mostrarAba(\'cargos\')"]');
    const abaCargos = document.getElementById('aba-cargos');
    if (btnCargos && abaCargos) {
        // Correção: Usar 'cargo' para aba de Cargos (estava correto)
        if (temPermissao('cargo', 'visualizar')) {
            btnCargos.style.display = '';
            abaCargos.style.display = '';
        } else {
            btnCargos.style.display = 'none';
            abaCargos.style.display = 'none';
        }
    }
    
    // ============================================
    // ABA DE USUÁRIOS - Verifica permissão do módulo 'usuario'
    // ============================================
    // Nota: Criamos um módulo 'usuario' específico para controlar acesso a gerenciamento de usuários
    // Se usar 'paciente', estaria misturando permissões de pacientes com usuários do sistema
    const btnUsuarios = document.querySelector('button[onclick="window.moduloConfig.mostrarAba(\'usuarios\')"]');
    const abaUsuarios = document.getElementById('aba-usuarios');
    if (btnUsuarios && abaUsuarios) {
        // CORREÇÃO: Mudado de 'cargo' para 'usuario' (módulo específico)
        if (temPermissao('usuario', 'visualizar')) {
            btnUsuarios.style.display = '';
            abaUsuarios.style.display = '';
        } else {
            btnUsuarios.style.display = 'none';
            abaUsuarios.style.display = 'none';
        }
    }
    
    // ============================================
    // ABA DE MEDICAMENTOS - Verifica permissão do módulo 'farmacia'
    // ============================================
    const btnMedicamentos = document.querySelector('button[onclick="window.moduloConfig.mostrarAba(\'medicamentos\')"]');
    const abaMedicamentos = document.getElementById('aba-medicamentos');
    if (btnMedicamentos && abaMedicamentos) {
        // CORREÇÃO: Mudado de 'cargo' para 'farmacia'
        if (temPermissao('farmacia', 'visualizar')) {
            btnMedicamentos.style.display = '';
            abaMedicamentos.style.display = '';
        } else {
            btnMedicamentos.style.display = 'none';
            abaMedicamentos.style.display = 'none';
        }
    }
    
    // ============================================
    // ABA DE SOLICITAÇÕES DE CADASTRO - Verifica permissão do módulo 'cargo'
    // ============================================
    // Nota: Gerenciar solicitações de cadastro é uma função administrativa
    // como gerenciar cargos, então usa a mesma permissão
    const btnSolicitacoes = document.querySelector('button[onclick="window.moduloConfig.mostrarAba(\'solicitacoes\')"]');
    const abaSolicitacoes = document.getElementById('aba-solicitacoes');

    
    if (btnSolicitacoes && abaSolicitacoes) {
        if (temPermissao('cargo', 'visualizar')) {
            btnSolicitacoes.style.display = '';
            abaSolicitacoes.style.display = '';
        } else {
            btnSolicitacoes.style.display = 'none';
            abaSolicitacoes.style.display = 'none';
        }
    } else {
        console.warn('⚠️ Elementos de Solicitações não encontrados no DOM');
    }
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
// IMPORTANTE: Cada aba deve verificar a permissão de seu módulo específico
export function mostrarAba(aba) {
    // Normalizar nome da aba para minúsculas
    const abaNormalizada = (aba || '').toLowerCase().trim();
    
    // Verificar permissão baseada na aba escolhida
    // Cada aba tem seu módulo específico
    let temAcessoAba = false;
    
    switch (abaNormalizada) {
        case 'cargos':
            // Aba de Cargos verifica permissão 'cargo'
            temAcessoAba = temPermissao('cargo', 'visualizar');
            break;
        case 'usuarios':
            // Aba de Usuários verifica permissão 'usuario' (módulo específico)
            temAcessoAba = temPermissao('usuario', 'visualizar');
            break;
        case 'solicitacoes':
            // Aba de Solicitações verifica permissão 'cargo' (função administrativa)
            temAcessoAba = temPermissao('cargo', 'visualizar');
            break;
        case 'medicamentos':
            // Aba de Medicamentos verifica permissão 'farmacia'
            temAcessoAba = temPermissao('farmacia', 'visualizar');
            break;
        default:
            console.warn(`⚠️ [Configurações] Aba desconhecida: ${aba}`);
            temAcessoAba = false;
    }
    
    // Se não tem acesso, mostrar erro e retornar
    if (!temAcessoAba) {
        mostrarErro('Acesso Negado', 'Você não tem permissão para acessar esta aba');
        return;
    }
    
    // Ocultar todas as abas
    document.getElementById('aba-cargos').classList.add('hidden');
    document.getElementById('aba-usuarios').classList.add('hidden');
    document.getElementById('aba-solicitacoes').classList.add('hidden');
    document.getElementById('aba-medicamentos').classList.add('hidden');

    // Mostrar aba selecionada
    document.getElementById(`aba-${abaNormalizada}`).classList.remove('hidden');

    // Atualizar estilo dos botões de aba
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
// NOTA: As operações em Cargos verificam permissão do módulo 'cargo'
// BOAS PRÁTICAS A IMPLEMENTAR:
// - openModalCargo() → deveria verificar temPermissao('cargo', 'criar')
// - adicionarCargo() → deveria verificar temPermissao('cargo', 'criar')
// - editarCargo() → deveria verificar temPermissao('cargo', 'editar')
// - apagarCargo() → deveria verificar temPermissao('cargo', 'apagar')
// Estas verificações foram deixadas para que você escolha mostrar erro ou permitir/bloquear a ação

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
        cargo: Array.from(document.querySelectorAll('input[name="permissaoCargo"]:checked')).map(cb => cb.value),
        usuario: Array.from(document.querySelectorAll('input[name="permissaoUsuario"]:checked')).map(cb => cb.value)
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
// NOTA: As operações em Usuários verificam permissão do módulo 'usuario'
// BOAS PRÁTICAS A IMPLEMENTAR:
// - openModalUsuario() → deveria verificar temPermissao('usuario', 'criar')
// - adicionarUsuario() → deveria verificar temPermissao('usuario', 'criar')
// - editarUsuario() → deveria verificar temPermissao('usuario', 'editar')
// - apagarUsuario() → deveria verificar temPermissao('usuario', 'apagar')
// Estas verificações foram deixadas para que você escolha mostrar erro ou permitir/bloquear a ação

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
    const usuarioId = document.getElementById('usuarioId')?.value;
    const nome = document.getElementById('usuarioNome')?.value;
    const senha = document.getElementById('usuarioSenha')?.value;
    const cargoId = document.getElementById('usuarioCargo')?.value;

    if (!usuarioId || !nome || !senha || !cargoId) {
        mostrarErro('Campos Obrigatórios', 'Por favor, preencha todos os campos (ID, Nome, Senha, Cargo)');
        return;
    }

    const novoUsuario = {
        id: usuarioId,
        nome,
        senha, // Em produção, isso deve ser criptografado
        cargoId,
        dataCriacao: new Date().toLocaleString('pt-BR'),
        ativo: true
    };

    usuarios.push(novoUsuario);

    try {
        await salvarNoFirebase('usuarios', novoUsuario);
    } catch (erro) {
        console.error('Erro ao salvar usuário:', erro);
        mostrarErro('Erro', 'Não foi possível salvar o usuário no Firebase');
        return;
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
        const statusBadge = usuario.ativo 
            ? '<span class="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-semibold">Ativo</span>'
            : '<span class="inline-block px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-semibold">Inativo</span>';
        
        return `
            <div class="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-lg transition">
                <div class="flex justify-between items-start mb-4">
                    <div class="flex-1">
                        <div class="flex items-center gap-3 mb-2">
                            <h3 class="text-lg font-bold text-gray-800">${usuario.nome}</h3>
                            ${statusBadge}
                        </div>
                        <p class="text-sm text-gray-600"><i class="fas fa-id-badge mr-2"></i>ID: ${usuario.id}</p>
                        <p class="text-sm text-gray-600"><i class="fas fa-briefcase mr-2"></i>Cargo: ${cargo ? cargo.nome : 'N/A'}</p>
                        <p class="text-sm text-gray-600"><i class="fas fa-calendar mr-2"></i>Criado em: ${usuario.dataCriacao}</p>
                    </div>
                    <div class="flex flex-col gap-2">
                        <button onclick="window.moduloConfig.abrirModalEditarSenha('${usuario.id}')" class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm">
                            <i class="fas fa-key mr-1"></i>Editar Senha
                        </button>
                        <button onclick="window.moduloConfig.abrirModalEditarCargoUsuario('${usuario.id}')" class="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm">
                            <i class="fas fa-briefcase mr-1"></i>Alterar Cargo
                        </button>
                        ${usuario.ativo 
                            ? `<button onclick="window.moduloConfig.inativarUsuario('${usuario.id}')" class="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm">
                                <i class="fas fa-ban mr-1"></i>Inativar
                            </button>`
                            : `<button onclick="window.moduloConfig.ativarUsuario('${usuario.id}')" class="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm">
                                <i class="fas fa-check mr-1"></i>Ativar
                            </button>`
                        }
                        <button onclick="window.moduloConfig.apagarUsuario('${usuario.id}')" class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm">
                            <i class="fas fa-trash mr-1"></i>Excluir
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

}

export function abrirModalEditarSenha(id) {
    const usuario = usuarios.find(u => u.id === id);
    if (!usuario) {
        mostrarErro('Erro', 'Usuário não encontrado');
        return;
    }
    
    const cargo = cargos.find(c => c.id === usuario.cargoId);
    
    document.getElementById('modalEditarSenha').classList.remove('modal-hidden');
    document.getElementById('usuarioIdSenha').value = id;
    document.getElementById('usuarioNomeSenha').textContent = usuario.nome;
    document.getElementById('usuarioCargoSenha').textContent = cargo ? cargo.nome : 'N/A';
    document.getElementById('novaSenha').value = '';
    document.getElementById('confirmarSenha').value = '';
}

export function fecharModalEditarSenha() {
    document.getElementById('modalEditarSenha').classList.add('modal-hidden');
    document.getElementById('formEditarSenha').reset();
}

export function abrirModalEditarCargoUsuario(id) {
    const usuario = usuarios.find(u => u.id === id);
    if (!usuario) {
        mostrarErro('Erro', 'Usuário não encontrado');
        return;
    }
    
    document.getElementById('modalEditarCargoUsuario').classList.remove('modal-hidden');
    document.getElementById('usuarioIdCargo').value = id;
    document.getElementById('usuarioNomeCargo').textContent = usuario.nome;
    atualizarSelectCargoEditarUsuario();
}

export function fecharModalEditarCargoUsuario() {
    document.getElementById('modalEditarCargoUsuario').classList.add('modal-hidden');
    document.getElementById('formEditarCargoUsuario').reset();
}

export function atualizarSelectCargoEditarUsuario() {
    const select = document.getElementById('novoCargo');
    select.innerHTML = '<option value="">Selecione um cargo</option>' + 
        cargos.map(cargo => `<option value="${cargo.id}">${cargo.nome}</option>`).join('');
}

export async function salvarNovoCargoUsuario() {
    const usuarioId = document.getElementById('usuarioIdCargo').value;
    const novoCargoId = document.getElementById('novoCargo').value;
    
    if (!novoCargoId) {
        mostrarErro('Erro', 'Selecione um cargo');
        return;
    }
    
    const usuario = usuarios.find(u => u.id === usuarioId);
    if (!usuario) {
        mostrarErro('Erro', 'Usuário não encontrado');
        return;
    }
    
    const cargo = cargos.find(c => c.id === novoCargoId);
    const cargoAnterior = cargos.find(c => c.id === usuario.cargoId);
    
    mostrarConfirmacao(
        'Alterar Cargo',
        `Deseja alterar o cargo de ${usuario.nome} de "${cargoAnterior ? cargoAnterior.nome : 'N/A'}" para "${cargo ? cargo.nome : 'N/A'}"?`,
        async () => {
            try {
                usuario.cargoId = novoCargoId;
                await salvarNoFirebase('usuarios', usuario);
                fecharModalEditarCargoUsuario();
                atualizarListaUsuarios();
                mostrarNotificacao(`Cargo alterado para ${cargo ? cargo.nome : 'N/A'} com sucesso!`, 'success');
            } catch (erro) {
                console.error('Erro ao alterar cargo:', erro);
                mostrarErro('Erro', 'Não foi possível alterar o cargo');
            }
        }
    );
}

export async function salvarNovaSenha() {
    const usuarioId = document.getElementById('usuarioIdSenha').value;
    const novaSenha = document.getElementById('novaSenha').value;
    const confirmarSenha = document.getElementById('confirmarSenha').value;
    
    if (!novaSenha || !confirmarSenha) {
        mostrarErro('Erro', 'Preencha todos os campos');
        return;
    }
    
    if (novaSenha !== confirmarSenha) {
        mostrarErro('Erro', 'As senhas não conferem');
        return;
    }
    
    if (novaSenha.length < 6) {
        mostrarErro('Erro', 'A senha deve ter no mínimo 6 caracteres');
        return;
    }
    
    const usuario = usuarios.find(u => u.id === usuarioId);
    if (!usuario) {
        mostrarErro('Erro', 'Usuário não encontrado');
        return;
    }
    
    mostrarConfirmacao(
        'Alterar Senha',
        `Deseja alterar a senha de ${usuario.nome}?`,
        async () => {
            try {
                usuario.senha = novaSenha;
                await salvarNoFirebase('usuarios', usuario);
                fecharModalEditarSenha();
                atualizarListaUsuarios();
                mostrarNotificacao('Senha alterada com sucesso!', 'success');
            } catch (erro) {
                console.error('Erro ao alterar senha:', erro);
                mostrarErro('Erro', 'Não foi possível alterar a senha');
            }
        }
    );
}

export function editarUsuario(id) {
    mostrarErro('Em Desenvolvimento', 'Função de edição será implementada em breve');
}

export function inativarUsuario(id) {
    const usuario = usuarios.find(u => u.id === id);
    if (!usuario) {
        mostrarErro('Erro', 'Usuário não encontrado');
        return;
    }
    
    mostrarConfirmacao(
        'Inativar Usuário',
        `Deseja inativar ${usuario.nome}? Este usuário não poderá mais fazer login.`,
        async () => {
            try {
                usuario.ativo = false;
                await salvarNoFirebase('usuarios', usuario);
                atualizarListaUsuarios();
                mostrarNotificacao(`${usuario.nome} foi inativado com sucesso!`, 'success');
            } catch (erro) {
                console.error('Erro ao inativar usuário:', erro);
                mostrarErro('Erro', 'Não foi possível inativar o usuário');
            }
        }
    );
}

export function ativarUsuario(id) {
    const usuario = usuarios.find(u => u.id === id);
    if (!usuario) {
        mostrarErro('Erro', 'Usuário não encontrado');
        return;
    }
    
    mostrarConfirmacao(
        'Ativar Usuário',
        `Deseja ativar ${usuario.nome}? Este usuário poderá fazer login novamente.`,
        async () => {
            try {
                usuario.ativo = true;
                await salvarNoFirebase('usuarios', usuario);
                atualizarListaUsuarios();
                mostrarNotificacao(`${usuario.nome} foi ativado com sucesso!`, 'success');
            } catch (erro) {
                console.error('Erro ao ativar usuário:', erro);
                mostrarErro('Erro', 'Não foi possível ativar o usuário');
            }
        }
    );
}

export function apagarUsuario(id) {
    const usuario = usuarios.find(u => u.id === id);
    if (!usuario) {
        mostrarErro('Erro', 'Usuário não encontrado');
        return;
    }
    
    mostrarConfirmacao(
        'Excluir Usuário',
        `Deseja excluir permanentemente ${usuario.nome}? Esta ação não pode ser desfeita.`,
        async () => {
            try {
                usuarios = usuarios.filter(u => u.id !== id);
                await deletarDoFirebase('usuarios', id);
                atualizarListaUsuarios();
                mostrarNotificacao('Usuário excluído com sucesso!', 'success');
            } catch (erro) {
                console.error('Erro ao excluir usuário:', erro);
                mostrarErro('Erro', 'Não foi possível excluir o usuário');
            }
        }
    );
}

// ============================================
// MEDICAMENTOS CONFIGURAÇÃO
// ============================================
// NOTA: As operações em Medicamentos verificam permissão do módulo 'farmacia'
// BOAS PRÁTICAS A IMPLEMENTAR:
// - openModalMedicamentoConfig() → deveria verificar temPermissao('farmacia', 'criar')
// - adicionarMedicamentoConfig() → deveria verificar temPermissao('farmacia', 'criar') ou 'editar'
// - editarMedicamentoConfig() → deveria verificar temPermissao('farmacia', 'editar')
// - apagarMedicamentoConfig() → deveria verificar temPermissao('farmacia', 'apagar')
// Estas verificações foram deixadas para que você escolha mostrar erro ou permitir/bloquear a ação

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
    const precoParceria = document.getElementById('medicamentoConfigPrecoParceria').value;
    const qtdMax = document.getElementById('medicamentoConfigQtdMax').value;

    if (!nome || !preco || !precoParceria || !qtdMax) {
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
            medicamentoExistente.precoParceria = precoParceria;
            medicamentoExistente.qtdMax = qtdMax;
            medicamentoParaSalvar = medicamentoExistente;
        }
    } else {
        // Criar novo
        const novoMedicamento = {
            id: Date.now().toString(),
            nome,
            preco,
            precoParceria,
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
                    <p class="text-sm text-gray-600"><i class="fas fa-tag text-orange-500 mr-1"></i>Preço Normal: R$ ${parseFloat(med.preco).toFixed(2)}</p>
                    <p class="text-sm text-green-600"><i class="fas fa-handshake text-green-500 mr-1"></i>Preço Parceria: R$ ${parseFloat(med.precoParceria || 0).toFixed(2)}</p>
                    <p class="text-sm text-gray-600"><i class="fas fa-boxes text-blue-500 mr-1"></i>Qtd. Máxima: ${med.qtdMax}</p>
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
        document.getElementById('medicamentoConfigPrecoParceria').value = medicamento.precoParceria || 0;
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

// ============================================
// SOLICITAÇÕES DE CADASTRO
// ============================================
export function atualizarListaSolicitacoes() {
    const lista = document.getElementById('solicitacoesList');
    
    if (!lista) return; // Se elemento não existe, não atualiza
    
    if (solicitacoesCadastro.length === 0) {
        lista.innerHTML = '<p class="text-gray-500 text-center py-8">Nenhuma solicitação pendente</p>';
        return;
    }

    lista.innerHTML = solicitacoesCadastro
        .filter(s => s.status === 'pendente') // Mostrar apenas pendentes
        .map(solicitacao => `
        <div class="bg-white p-6 rounded-lg border border-yellow-200 hover:shadow-lg transition">
            <div class="flex justify-between items-start mb-4">
                <div class="flex-1">
                    <h3 class="text-lg font-bold text-gray-800">${solicitacao.nome}</h3>
                    <p class="text-sm text-gray-600"><i class="fas fa-id-badge mr-1"></i>ID: ${solicitacao.id}</p>
                    <p class="text-sm text-gray-600"><i class="fas fa-calendar mr-1"></i>Solicitado em: ${solicitacao.dataSolicitacao}</p>
                </div>
                <div class="flex gap-2">
                    <button onclick="window.moduloConfig.aceitarSolicitacao('${solicitacao.id}')" class="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm">
                        <i class="fas fa-check mr-1"></i>Aceitar
                    </button>
                    <button onclick="window.moduloConfig.rejeitarSolicitacao('${solicitacao.id}')" class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm">
                        <i class="fas fa-times mr-1"></i>Rejeitar
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

export function aceitarSolicitacao(id) {
    const solicitacao = solicitacoesCadastro.find(s => s.id === id);
    
    if (!solicitacao) {
        mostrarErro('Erro', 'Solicitação não encontrada');
        return;
    }
    
    mostrarConfirmacao(
        'Aceitar Solicitação',
        `Deseja aceitar a solicitação de ${solicitacao.nome}?`,
        async () => {
            try {
                // Criar novo usuário com os dados da solicitação
                const novoUsuario = {
                    id: solicitacao.id,
                    nome: solicitacao.nome,
                    senha: solicitacao.senha,
                    dataCriacao: new Date().toLocaleString('pt-BR'),
                    ativo: true,
                    cargoId: 'cargo_padrao' // Cargo padrão para novos usuários
                };
                
                // Salvar usuário no Firebase
                usuarios.push(novoUsuario);
                await salvarNoFirebase('usuarios', novoUsuario);
                
                // Atualizar status da solicitação para 'aceita'
                solicitacao.status = 'aceita';
                await salvarNoFirebase('solicitacoes_cadastro', solicitacao);
                
                atualizarListaSolicitacoes();
                atualizarListaUsuarios();
                mostrarNotificacao(`Solicitação de ${solicitacao.nome} aceita com sucesso!`, 'success');
            } catch (erro) {
                console.error('Erro ao aceitar solicitação:', erro);
                mostrarErro('Erro', 'Não foi possível aceitar a solicitação');
            }
        }
    );
}

export function rejeitarSolicitacao(id) {
    const solicitacao = solicitacoesCadastro.find(s => s.id === id);
    
    if (!solicitacao) {
        mostrarErro('Erro', 'Solicitação não encontrada');
        return;
    }
    
    mostrarConfirmacao(
        'Rejeitar Solicitação',
        `Deseja rejeitar a solicitação de ${solicitacao.nome}?`,
        async () => {
            try {
                // Atualizar status da solicitação para 'rejeitada'
                solicitacao.status = 'rejeitada';
                await salvarNoFirebase('solicitacoes_cadastro', solicitacao);
                
                // Remover da lista local
                solicitacoesCadastro = solicitacoesCadastro.filter(s => s.id !== id);
                
                atualizarListaSolicitacoes();
                mostrarNotificacao(`Solicitação de ${solicitacao.nome} rejeitada!`, 'success');
            } catch (erro) {
                console.error('Erro ao rejeitar solicitação:', erro);
                mostrarErro('Erro', 'Não foi possível rejeitar a solicitação');
            }
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
    abrirModalEditarSenha,
    fecharModalEditarSenha,
    abrirModalEditarCargoUsuario,
    fecharModalEditarCargoUsuario,
    salvarNovaSenha,
    salvarNovoCargoUsuario,
    inativarUsuario,
    ativarUsuario,
    openModalMedicamentoConfig,
    closeModalMedicamentoConfig,
    adicionarMedicamentoConfig,
    editarMedicamentoConfig,
    apagarMedicamentoConfig,
    aceitarSolicitacao,
    rejeitarSolicitacao,
    aplicarPermissoesAbas
};
