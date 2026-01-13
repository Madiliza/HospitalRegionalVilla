// ============================================
// ARQUIVO PRINCIPAL - ORGANIZADOR DE MÓDULOS
// ============================================

// Importar utilitários
import { setAppReady, mostrarNotificacao } from './utils/dialogs.js';
import { carregarDadosFirebase } from './utils/firebase.js';
import { verificarAutenticacao, fazerLogout, alterarSenha, getUsuarioAtual } from '../config/firebase-config.js';
import { inicializarPermissoes, temPermissao, controlarVisibilidade, controlarHabilitacao, obterUsuarioAtual, obterCargoAtual } from './utils/permissoes.js';

// Importar módulos
import * as moduloPacientes from './modules/pacientes.js';
import * as moduloConsultas from './modules/consultas.js';
import * as moduloExames from './modules/exames.js';
import * as moduloFarmacia from './modules/farmacia.js';
import * as moduloConfig from './modules/configuracoes.js';

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
    usuarios: []
};

let usuarioLogado = null;

// Carregador de componentes HTML
async function carregarComponentes() {
    const componentes = ['pacientes', 'consultas', 'exames', 'farmacia', 'configuracoes'];
    const containerComponentes = document.getElementById('componentes');
    
    for (const nome of componentes) {
        try {
            const response = await fetch(`./src/components/${nome}.html`);
            const html = await response.text();
            const div = document.createElement('div');
            div.innerHTML = html;
            containerComponentes.appendChild(div);
        } catch (error) {
            console.error(`Erro ao carregar componente ${nome}:`, error);
        }
    }
}

// Verificar autenticação antes de inicializar
verificarAutenticacao(async (user) => {
    // Verificar se está logado localmente (por ID)
    const usuarioLogadoLocal = localStorage.getItem('usuarioLogado');
    
    if (!user && !usuarioLogadoLocal) {
        // Usuário não autenticado, redirecionar para login
        console.log('Usuário não autenticado. Redirecionando para login...');
        window.location.href = '/login.html';
        return;
    }
    
    // Usuário autenticado
    usuarioLogado = user || { uid: usuarioLogadoLocal };
    console.log('Usuário autenticado:', usuarioLogado.uid || usuarioLogadoLocal);
    
    // Atualizar nome do usuário no navbar
    atualizarInfoUsuario(usuarioLogado);
    
    // Inicializar o sistema
    await inicializarSistema();
});

async function inicializarSistema() {
    console.log('🏥 Sistema Hospital Regional Villa - Iniciando...');
    
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
    
    // Inicializar sistema de permissões
    const usuarioId = localStorage.getItem('usuarioLogado');
    if (usuarioId) {
        const permissoesOk = inicializarPermissoes(usuarioId, dadosGlobais.usuarios, dadosGlobais.cargos);
        
        if (permissoesOk) {
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
    
    console.log('✅ Sistema inicializado com sucesso!');
}

/**
 * Aplicar controle de permissões por módulo
 */
function aplicarPermissoesPorModulo(dados) {
    // Pacientes
    const btnNovoPaciente = document.querySelector('button[onclick="window.moduloPacientes.openModal()"]');
    if (btnNovoPaciente) {
        if (temPermissao('paciente', 'criar')) {
            btnNovoPaciente.style.display = '';
        } else {
            btnNovoPaciente.style.display = 'none';
        }
    }
    
    // Consultas
    const btnNovaConsulta = document.querySelector('button[onclick="window.moduloConsultas.openModal()"]');
    if (btnNovaConsulta) {
        if (temPermissao('consulta', 'criar')) {
            btnNovaConsulta.style.display = '';
        } else {
            btnNovaConsulta.style.display = 'none';
        }
    }
    
    // Exames
    const btnNovoExame = document.querySelector('button[onclick="window.moduloExames.openModal()"]');
    if (btnNovoExame) {
        if (temPermissao('exame', 'criar')) {
            btnNovoExame.style.display = '';
        } else {
            btnNovoExame.style.display = 'none';
        }
    }
    
    // Farmácia
    const btnRegistrarMedicamento = document.querySelector('button[onclick="window.moduloFarmacia.openModal()"]');
    if (btnRegistrarMedicamento) {
        if (temPermissao('farmacia', 'criar')) {
            btnRegistrarMedicamento.style.display = '';
        } else {
            btnRegistrarMedicamento.style.display = 'none';
        }
    }
    
    // Configurações (Cargos/Usuários)
    const btnNovoUsuario = document.querySelector('button[onclick="window.moduloConfig.openModalUsuario()"]');
    if (btnNovoUsuario) {
        if (temPermissao('cargo', 'criar')) {
            btnNovoUsuario.style.display = '';
        } else {
            btnNovoUsuario.style.display = 'none';
        }
    }
    
    // Esconder botões de navegação na sidebar baseado em permissões
    const btnPacientesSidebar = Array.from(document.querySelectorAll('aside button')).find(btn => 
        btn.textContent.includes('Pacientes') && btn.onclick.toString().includes('pacientes')
    );
    if (btnPacientesSidebar) {
        if (temPermissao('paciente', 'visualizar')) {
            btnPacientesSidebar.style.display = '';
        } else {
            btnPacientesSidebar.style.display = 'none';
        }
    }
    
    const btnConsultasSidebar = Array.from(document.querySelectorAll('aside button')).find(btn => 
        btn.textContent.includes('Consultas') && btn.onclick.toString().includes('consultas')
    );
    if (btnConsultasSidebar) {
        if (temPermissao('consulta', 'visualizar')) {
            btnConsultasSidebar.style.display = '';
        } else {
            btnConsultasSidebar.style.display = 'none';
        }
    }
    
    const btnExamesSidebar = Array.from(document.querySelectorAll('aside button')).find(btn => 
        btn.textContent.includes('Exames') && btn.onclick.toString().includes('exames')
    );
    if (btnExamesSidebar) {
        if (temPermissao('exame', 'visualizar')) {
            btnExamesSidebar.style.display = '';
        } else {
            btnExamesSidebar.style.display = 'none';
        }
    }
    
    const btnFarmaciaSidebar = Array.from(document.querySelectorAll('aside button')).find(btn => 
        btn.textContent.includes('Farmácia') && btn.onclick.toString().includes('farmacia')
    );
    if (btnFarmaciaSidebar) {
        if (temPermissao('farmacia', 'visualizar')) {
            btnFarmaciaSidebar.style.display = '';
        } else {
            btnFarmaciaSidebar.style.display = 'none';
        }
    }
    
    const btnConfiguracoesSidebar = Array.from(document.querySelectorAll('aside button')).find(btn => 
        btn.textContent.includes('Configurações') && btn.onclick.toString().includes('configuracoes')
    );
    if (btnConfiguracoesSidebar) {
        if (temPermissao('cargo', 'visualizar')) {
            btnConfiguracoesSidebar.style.display = '';
        } else {
            btnConfiguracoesSidebar.style.display = 'none';
        }
    }
    
    // Mostrar informações do usuário e cargo
    const usuarioAtual = obterUsuarioAtual();
    const cargoAtual = obterCargoAtual();
    
    if (usuarioAtual && cargoAtual) {
        console.log(`👤 Usuário: ${usuarioAtual.nome}`);
        console.log(`💼 Cargo: ${cargoAtual.nome}`);
        console.log(`📋 Permissões: ${Object.keys(cargoAtual.permissoes || {}).join(', ')}`);
    }
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
        'farmacia': ['farmacia', 'visualizar']
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
        console.error(`Seção "${sectionId}" não encontrada`);
        return;
    }

    // Atualizar botão ativo na sidebar
    document.querySelectorAll('aside button').forEach(btn => {
        btn.classList.remove('bg-red-600', 'text-white');
        btn.classList.add('hover:bg-gray-100', 'text-gray-700');
    });

    // Encontrar e destacar o botão clicado
    const buttons = document.querySelectorAll('aside button');
    buttons.forEach(btn => {
        if (btn.textContent.toLowerCase().includes(sectionId.toLowerCase()) || 
            btn.onclick.toString().includes(`'${sectionId}'`)) {
            btn.classList.remove('hover:bg-gray-100', 'text-gray-700');
            btn.classList.add('bg-red-600', 'text-white');
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
                console.error('Erro ao alterar senha:', error);
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
        console.error('Erro ao fazer logout:', error);
        mostrarNotificacao('Erro ao fazer logout', 'error');
    }
}

// Toggle visibilidade da senha
window.togglePasswordVisibility = function(inputId) {
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

// Inicializar dropdown após DOM carregar
document.addEventListener('DOMContentLoaded', () => {
    setupProfileDropdown();
    setupFormAlterarSenha();
});

console.log(' Aplicação pronta para uso!');
