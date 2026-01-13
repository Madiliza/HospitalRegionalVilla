// ============================================
// SISTEMA DE PERMISSÕES
// ============================================

let usuarioAtual = null;
let cargoAtual = null;

/**
 * Inicializar sistema de permissões
 * @param {string} usuarioId - ID do usuário logado
 * @param {object} usuarios - Lista de usuários
 * @param {object} cargos - Lista de cargos
 */
export function inicializarPermissoes(usuarioId, usuarios, cargos) {
    // Buscar usuário
    usuarioAtual = usuarios.find(u => u.id === usuarioId);
    
    if (!usuarioAtual) {
        console.error('❌ Usuário não encontrado:', usuarioId);
        console.log('📋 Usuários disponíveis:', usuarios.map(u => `${u.nome} (${u.id})`).join(', '));
        return false;
    }
    
    // Buscar cargo do usuário
    // O cargo pode estar armazenado como nome (string) ou como ID
    // Primeiro tenta buscar por ID, depois por nome
    cargoAtual = cargos.find(c => c.id === usuarioAtual.cargo || c.nome === usuarioAtual.cargo);
    
    if (!cargoAtual) {
        console.error('❌ Cargo não encontrado:', usuarioAtual.cargo);
        console.log('Cargos disponíveis:', cargos.map(c => `${c.nome} (${c.id})`).join(', '));
        // Se nenhum cargo foi encontrado, criar um cargo padrão com acesso total (para DEV)
        if (usuarioAtual.cargo === 'Desenvolvedor' || usuarioAtual.cargo === 'DEV' || usuarioAtual.cargo === 'Admin') {
            console.log('⚠️ Criando cargo padrão com acesso total...');
            cargoAtual = {
                id: 'cargo_dev_temp',
                nome: usuarioAtual.cargo,
                permissoes: {
                    'paciente': ['criar', 'visualizar', 'editar', 'apagar'],
                    'consulta': ['criar', 'visualizar', 'editar', 'apagar'],
                    'exame': ['criar', 'visualizar', 'editar', 'apagar'],
                    'farmacia': ['criar', 'visualizar', 'editar', 'apagar'],
                    'cargo': ['criar', 'visualizar', 'editar', 'apagar']
                }
            };
        } else {
            console.log('⚠️ Cargo não encontrado e usuário não é DEV. Usando permissões mínimas...');
            cargoAtual = {
                id: 'cargo_padrao_temp',
                nome: usuarioAtual.cargo || 'Padrão',
                permissoes: {
                    'paciente': ['visualizar'],
                    'consulta': ['visualizar'],
                    'exame': ['visualizar'],
                    'farmacia': ['visualizar'],
                    'cargo': []
                }
            };
        }
    }
    
    console.log('✅ Permissões inicializadas para:', usuarioAtual.nome, '(' + cargoAtual.nome + ')');
    console.log('💼 Cargo:', cargoAtual.nome);
    console.log('📋 Permissões:', cargoAtual.permissoes);
    
    return true;
}

/**
 * Verificar se o usuário tem uma permissão específica
 * @param {string} modulo - Módulo (paciente, consulta, exame, farmacia, cargo)
 * @param {string} acao - Ação (criar, visualizar, editar, apagar)
 * @returns {boolean}
 */
export function temPermissao(modulo, acao) {
    if (!cargoAtual || !cargoAtual.permissoes) {
        console.warn('❌ Cargo ou permissões não inicializadas');
        return false;
    }
    
    const permissoesDoModulo = cargoAtual.permissoes[modulo];
    
    if (!permissoesDoModulo) {
        console.warn(`❌ Módulo ${modulo} não encontrado nas permissões`);
        return false;
    }
    
    const temAcesso = permissoesDoModulo.includes(acao);
    
    if (!temAcesso) {
        console.warn(`❌ Acesso negado para ${modulo}.${acao}`);
    }
    
    return temAcesso;
}

/**
 * Controlar visibilidade de elementos baseado em permissão
 * @param {string} selectorOuElemento - Seletor CSS ou elemento
 * @param {string} modulo - Módulo
 * @param {string} acao - Ação
 */
export function controlarVisibilidade(selectorOuElemento, modulo, acao) {
    let elemento;
    
    if (typeof selectorOuElemento === 'string') {
        elemento = document.querySelector(selectorOuElemento);
    } else {
        elemento = selectorOuElemento;
    }
    
    if (!elemento) return;
    
    if (temPermissao(modulo, acao)) {
        elemento.style.display = '';
        elemento.classList.remove('hidden');
    } else {
        elemento.style.display = 'none';
        elemento.classList.add('hidden');
    }
}

/**
 * Controlar se um botão está habilitado baseado em permissão
 * @param {string} selectorOuElemento - Seletor CSS ou elemento
 * @param {string} modulo - Módulo
 * @param {string} acao - Ação
 */
export function controlarHabilitacao(selectorOuElemento, modulo, acao) {
    let elemento;
    
    if (typeof selectorOuElemento === 'string') {
        elemento = document.querySelector(selectorOuElemento);
    } else {
        elemento = selectorOuElemento;
    }
    
    if (!elemento) return;
    
    if (temPermissao(modulo, acao)) {
        elemento.disabled = false;
        elemento.style.opacity = '1';
        elemento.style.cursor = 'pointer';
    } else {
        elemento.disabled = true;
        elemento.style.opacity = '0.5';
        elemento.style.cursor = 'not-allowed';
        elemento.title = `Você não tem permissão para ${acao} ${modulo}s`;
    }
}

/**
 * Obter todas as permissões do cargo atual
 * @returns {object}
 */
export function obterPermissoesAtuais() {
    return cargoAtual?.permissoes || {};
}

/**
 * Obter informações do usuário logado
 * @returns {object}
 */
export function obterUsuarioAtual() {
    return usuarioAtual;
}

/**
 * Obter informações do cargo atual
 * @returns {object}
 */
export function obterCargoAtual() {
    return cargoAtual;
}

/**
 * Exigir permissão ou mostrar erro
 * @param {string} modulo - Módulo
 * @param {string} acao - Ação
 * @returns {boolean}
 */
export function exigirPermissao(modulo, acao) {
    if (!temPermissao(modulo, acao)) {
        console.error(`❌ Acesso negado para ${modulo}.${acao}`);
        return false;
    }
    return true;
}

/**
 * Aplicar controle de permissões a toda a interface
 * @param {object} usuarios - Lista de usuários
 * @param {object} cargos - Lista de cargos
 */
export function aplicarControleDePermissoes(usuarios, cargos) {
    // Controlar botões de criar
    controlarHabilitacao('[onclick*="openModal"]', 'paciente', 'criar');
    
    // Controlar abas de módulos
    if (temPermissao('paciente', 'visualizar')) {
        controlarVisibilidade('#aba-pacientes', 'paciente', 'visualizar');
    }
    
    if (temPermissao('consulta', 'visualizar')) {
        controlarVisibilidade('#aba-consultas', 'consulta', 'visualizar');
    }
    
    if (temPermissao('exame', 'visualizar')) {
        controlarVisibilidade('#aba-exames', 'exame', 'visualizar');
    }
    
    if (temPermissao('farmacia', 'visualizar')) {
        controlarVisibilidade('#aba-farmacia', 'farmacia', 'visualizar');
    }
    
    if (temPermissao('cargo', 'visualizar')) {
        controlarVisibilidade('#aba-usuarios', 'cargo', 'visualizar');
    }
}

/**
 * Bloquear ação se não tiver permissão
 * @param {string} modulo - Módulo
 * @param {string} acao - Ação
 * @param {Function} callback - Função a executar
 */
export function executarComPermissao(modulo, acao, callback) {
    if (!temPermissao(modulo, acao)) {
        const nomeModulo = modulo.charAt(0).toUpperCase() + modulo.slice(1);
        console.error(`❌ Acesso negado: Você não tem permissão para ${acao} ${nomeModulo}s`);
        return;
    }
    
    if (typeof callback === 'function') {
        callback();
    }
}

// Exportar para uso global
window.permissoes = {
    inicializarPermissoes,
    temPermissao,
    controlarVisibilidade,
    controlarHabilitacao,
    obterPermissoesAtuais,
    obterUsuarioAtual,
    obterCargoAtual,
    exigirPermissao,
    aplicarControleDePermissoes,
    executarComPermissao
};
