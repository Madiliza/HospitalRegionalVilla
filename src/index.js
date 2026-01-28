// ============================================
// ARQUIVO PRINCIPAL - ORGANIZADOR DE MÓDULOS
// ============================================

// Importar utilitários
import { setAppReady, mostrarNotificacao } from './utils/dialogs.js';
import { carregarDadosFirebase } from './utils/firebase.js';
import { verificarAutenticacao, fazerLogout, alterarSenha, getUsuarioAtual } from '../config/firebase-config.js';
import { inicializarPermissoes, temPermissao, controlarVisibilidade, controlarHabilitacao, obterUsuarioAtual, obterCargoAtual, debugPermissoes } from './utils/permissoes.js';

// Importar módulos
import * as moduloPacientes from './modules/pacientes.js';
import * as moduloConsultas from './modules/consultas.js';
import * as moduloExames from './modules/exames.js';
import * as moduloFarmacia from './modules/farmacia.js';
import * as moduloConfig from './modules/configuracoes.js';
import * as moduloCalculadora from './modules/calculadora.js';
import * as moduloDoacao from './modules/doarsangue.js';

// ============================================
// INICIALIZAÇÃO
// ============================================
let dadosGlobais = {
    pacientes: [],
    consultas: [],
    exames: [],
    medicamentos: [],
    medicamentosConfig: [],
    cargos: [],
    usuarios: [],
    solicitacoesCadastro: []
};

let usuarioLogado = null;

// Carregador de componentes HTML
async function carregarComponentes() {
    const componentes = ['pacientes', 'consultas', 'exames', 'farmacia', 'configuracoes', 'calculadora', 'doarsangue'];
    const containerComponentes = document.getElementById('componentes');

    // Aguardar que o container exista
    if (!containerComponentes) {
        return;
    }

    for (const nome of componentes) {
        try {
            const response = await fetch(`./src/components/${nome}.html`);
            const html = await response.text();
            const div = document.createElement('div');
            div.innerHTML = html;
            containerComponentes.appendChild(div);
        } catch (error) {
            // Erro silencioso ao carregar componente
        }
    }

    // Aguardar várias frames para garantir que o DOM foi atualizado e renderizado
    return new Promise(resolve => {
        // Use requestAnimationFrame para aguardar a renderização
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setTimeout(resolve, 200);
            });
        });
    });
}

// Verificar autenticação antes de inicializar
verificarAutenticacao(async (user) => {
    // Verificar se está logado localmente (por ID)
    const usuarioLogadoLocal = localStorage.getItem('usuarioLogado');

    if (!user && !usuarioLogadoLocal) {
        // Usuário não autenticado, redirecionar para login
        window.location.href = '/login.html';
        return;
    }

    // Usuário autenticado
    usuarioLogado = user || { uid: usuarioLogadoLocal };

    // Atualizar nome do usuário no navbar
    atualizarInfoUsuario(usuarioLogado);

    // Inicializar o sistema
    await inicializarSistema();
});

async function inicializarSistema() {

    // Carregar componentes HTML
    await carregarComponentes();

    // Carregar dados
    dadosGlobais = await carregarDadosFirebase();

    // Inicializar módulos
    moduloPacientes.init(dadosGlobais);
    moduloConsultas.init(dadosGlobais);
    moduloExames.init(dadosGlobais);
    moduloFarmacia.init(dadosGlobais);
    moduloConfig.init(dadosGlobais);
    moduloCalculadora.init(dadosGlobais);
    moduloDoacao.init(dadosGlobais);

    // Aguardar um pouco mais para garantir que o DOM está completamente pronto
    await new Promise(resolve => setTimeout(resolve, 300));

    // Inicializar sistema de permissões
    const usuarioId = localStorage.getItem('usuarioLogado');
    if (usuarioId) {
        const permissoesOk = inicializarPermissoes(usuarioId, dadosGlobais.usuarios, dadosGlobais.cargos);

        if (permissoesOk) {
            // Debug: mostrar permissões no console
            debugPermissoes();

            // Aplicar controle de permissões na interface
            aplicarPermissoesPorModulo(dadosGlobais);

            // Aplicar permissões específicas do módulo de configurações
            if (moduloConfig.aplicarPermissoesAbas) {
                moduloConfig.aplicarPermissoesAbas();
            }
        }
    }

    // Atualizar dashboard
    atualizarDashboard();

    // Marcar app como pronto
    setAppReady(true);
}

/**
 * Aplicar controle de permissões por módulo
 * Usa IDs para seleção robusta de botões
 */
function aplicarPermissoesPorModulo(dados) {
    // Função auxiliar para controlar visibilidade de botões
    function controlarBotao(id, modulo, acao, nomeAmigavel) {
        const btn = document.getElementById(id);
        if (btn) {
            if (temPermissao(modulo, acao)) {
                btn.style.display = '';
            } else {
                btn.style.display = 'none';
            }
        }
    }

    // ============================================
    // BOTÕES PRINCIPAIS POR MÓDULO
    // ============================================
    controlarBotao('btnNovoPaciente', 'paciente', 'criar', 'Novo Paciente');
    controlarBotao('btnNovaConsulta', 'consulta', 'criar', 'Nova Consulta');
    controlarBotao('btnNovoExame', 'exame', 'criar', 'Novo Exame');
    controlarBotao('btnRegistrarAtendimento', 'farmacia', 'criar', 'Registrar Atendimento');

    // ============================================
    // CONFIGURAÇÕES
    // ============================================
    controlarBotao('btnNovoCargo', 'cargo', 'criar', 'Novo Cargo');
    controlarBotao('btnNovoUsuario', 'usuario', 'criar', 'Novo Usuário');
    controlarBotao('btnNovoMedicamento', 'farmacia', 'criar', 'Novo Medicamento');

    // ============================================
    // SIDEBAR - Usando IDs para seleção robusta
    // ============================================
    controlarBotao('sidebarPacientes', 'paciente', 'visualizar', 'Sidebar Pacientes');
    controlarBotao('sidebarConsultas', 'consulta', 'visualizar', 'Sidebar Consultas');
    controlarBotao('sidebarExames', 'exame', 'visualizar', 'Sidebar Exames');
    controlarBotao('sidebarFarmacia', 'farmacia', 'visualizar', 'Sidebar Farmácia');
    controlarBotao('sidebarCalculadora', 'cargo', 'visualizar', 'Sidebar Calculadora');
    controlarBotao('sidebarConfiguracoes', 'cargo', 'visualizar', 'Sidebar Configurações');
}

function atualizarInfoUsuario(user) {
    const userBtn = document.getElementById('userBtn');
    if (userBtn) {
        // Tentar obter nome do localStorage ou do usuário
        const nomeUsuario = localStorage.getItem('usuarioNome') ||
            user.displayName ||
            localStorage.getItem('usuarioLogado') ||
            'Usuário';
        userBtn.innerHTML = `<i class="fas fa-user-circle mr-2"></i>${nomeUsuario}<i class="fas fa-chevron-down ml-2 text-sm"></i>`;
    }
}

// ============================================
// NAVEGAÇÃO E SECTIONS
// ============================================
function showSection(sectionId) {
    // Verificar permissão antes de mostrar seção
    const permissoesModulos = {
        'pacientes': ['paciente', 'visualizar'],
        'consultas': ['consulta', 'visualizar'],
        'exames': ['exame', 'visualizar'],
        'farmacia': ['farmacia', 'visualizar'],
        'calculadora': ['cargo', 'visualizar'],
        'doarSangue': ['doacao', 'visualizar']
    };

    // Se é um módulo que requer permissão
    if (permissoesModulos[sectionId]) {
        const [modulo, acao] = permissoesModulos[sectionId];
        if (!temPermissao(modulo, acao)) {
            mostrarNotificacao(`❌ Você não tem permissão para acessar ${sectionId}`, 'error');
            return;
        }
    }

    // Esconder todas as sections
    document.querySelectorAll('section').forEach(section => {
        section.classList.add('modal-hidden');
    });

    // Mostrar a section selecionada
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.remove('modal-hidden');
    } else {
        return;
    }

    // Atualizar botão ativo na sidebar
    document.querySelectorAll('aside button').forEach(btn => {
        btn.classList.remove('bg-blue-600', 'text-white');
        btn.classList.add('hover:bg-gray-100', 'text-gray-700');
    });

    // Encontrar e destacar o botão clicado
    const buttons = document.querySelectorAll('aside button');
    buttons.forEach(btn => {
        if (btn.textContent.toLowerCase().includes(sectionId.toLowerCase()) ||
            btn.onclick.toString().includes(`'${sectionId}'`)) {
            btn.classList.remove('hover:bg-gray-100', 'text-gray-700');
            btn.classList.add('bg-blue-600', 'text-white');
        }
    });
}

// ============================================
// DASHBOARD
// ============================================
function atualizarDashboard() {
    document.getElementById('totalPacientes').textContent = moduloPacientes.pacientes.length;
    document.getElementById('totalConsultas').textContent = moduloConsultas.consultas.length;
    document.getElementById('totalExames').textContent = moduloExames.exames.length;
    document.getElementById('totalMedicamentos').textContent = moduloFarmacia.medicamentos.length;
}

// ============================================
// DROPDOWN DO PERFIL
// ============================================
function setupProfileDropdown() {
    const userBtn = document.getElementById('userBtn');
    const dropdown = document.getElementById('profileDropdown');

    if (userBtn && dropdown) {
        userBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('show');
        });

        // Fechar dropdown ao clicar fora
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target) && !userBtn.contains(e.target)) {
                dropdown.classList.remove('show');
            }
        });
    }
}

// ============================================
// ALTERAR SENHA
// ============================================
function abrirModalAlterarSenha() {
    const dropdown = document.getElementById('profileDropdown');
    dropdown.classList.remove('show');

    const modal = document.getElementById('modalAlterarSenha');
    if (modal) {
        modal.classList.remove('modal-hidden');
        document.getElementById('senhaAtual').value = '';
        document.getElementById('novaSenha').value = '';
        document.getElementById('confirmarSenha').value = '';
    }
}

function fecharModalAlterarSenha() {
    const modal = document.getElementById('modalAlterarSenha');
    if (modal) {
        modal.classList.add('modal-hidden');
    }
}

function setupFormAlterarSenha() {
    const form = document.getElementById('formAlterarSenha');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const senhaAtual = document.getElementById('senhaAtual').value;
            const novaSenha = document.getElementById('novaSenha').value;
            const confirmarSenha = document.getElementById('confirmarSenha').value;

            // Validações
            if (novaSenha !== confirmarSenha) {
                mostrarNotificacao('As senhas não coincidem!', 'error');
                return;
            }

            if (novaSenha.length < 6) {
                mostrarNotificacao('A nova senha deve ter pelo menos 6 caracteres!', 'error');
                return;
            }

            if (senhaAtual === novaSenha) {
                mostrarNotificacao('A nova senha deve ser diferente da atual!', 'error');
                return;
            }

            try {
                await alterarSenha(senhaAtual, novaSenha);
                mostrarNotificacao('Senha alterada com sucesso!', 'success');
                fecharModalAlterarSenha();
            } catch (error) {
                if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                    mostrarNotificacao('Senha atual incorreta!', 'error');
                } else if (error.code === 'auth/weak-password') {
                    mostrarNotificacao('A nova senha é muito fraca!', 'error');
                } else {
                    mostrarNotificacao('Erro ao alterar senha. Tente novamente.', 'error');
                }
            }
        });
    }
}

async function logout() {
    const dropdown = document.getElementById('profileDropdown');
    dropdown.classList.remove('show');

    try {
        // Limpar dados locais
        localStorage.removeItem('usuarioLogado');
        localStorage.removeItem('usuarioEmail');
        localStorage.removeItem('usuarioNome');

        // Tentar fazer logout no Firebase se existir
        try {
            await fazerLogout();
        } catch (e) {
            // Ignorar erro se não estiver usando Firebase Auth
        }

        mostrarNotificacao('Logout realizado com sucesso!', 'success');
        setTimeout(() => {
            window.location.href = '/login.html';
        }, 1000);
    } catch (error) {
        mostrarNotificacao('Erro ao fazer logout', 'error');
    }
}

// Toggle visibilidade da senha
window.togglePasswordVisibility = function (inputId) {
    const input = document.getElementById(inputId);
    const icon = input.nextElementSibling.querySelector('i');

    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
};

// ============================================
// EXPOR FUNÇÕES GLOBALMENTE
// ============================================

// Navegação
window.showSection = showSection;

// Perfil e senha
window.abrirModalAlterarSenha = abrirModalAlterarSenha;
window.fecharModalAlterarSenha = fecharModalAlterarSenha;
window.logout = logout;

// Módulos completos
window.moduloPacientes = moduloPacientes;
window.moduloConsultas = moduloConsultas;
window.moduloExames = moduloExames;
window.moduloFarmacia = moduloFarmacia;
window.moduloConfig = moduloConfig;
window.moduloDoacao = moduloDoacao;

// Inicializar dropdown após DOM carregar
document.addEventListener('DOMContentLoaded', () => {
    setupProfileDropdown();
    setupFormAlterarSenha();
});

