// ============================================
// ARQUIVO PRINCIPAL - ORGANIZADOR DE MÓDULOS
// ============================================

// Importar utilitários
import { setAppReady, mostrarNotificacao } from './utils/dialogs.js';
import { carregarDadosFirebase } from './utils/firebase.js';

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

document.addEventListener('DOMContentLoaded', async () => {
    console.log(' Sistema Hospital Regional Villa - Iniciando...');
    
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
    
    // Atualizar dashboard
    atualizarDashboard();
    
    // Marcar app como pronto
    setAppReady(true);
    
    console.log(' Sistema inicializado com sucesso!');
});

// ============================================
// NAVEGAÇÃO E SECTIONS
// ============================================
function showSection(sectionId) {
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
// EXPOR FUNÇÕES GLOBALMENTE
// ============================================

// Navegação
window.showSection = showSection;

// Módulos completos
window.moduloPacientes = moduloPacientes;
window.moduloConsultas = moduloConsultas;
window.moduloExames = moduloExames;
window.moduloFarmacia = moduloFarmacia;
window.moduloConfig = moduloConfig;

console.log(' Aplicação pronta para uso!');
