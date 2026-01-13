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
        return false;
    }
    
    // Buscar cargo do usuário
    // O cargo pode estar armazenado como nome (string) ou como ID
    // Primeiro tenta buscar por ID, depois por nome
    cargoAtual = cargos.find(c => c.id === usuarioAtual.cargo || c.nome === usuarioAtual.cargo);
    
    if (!cargoAtual) {
        console.error('❌ Cargo não encontrado:', usuarioAtual.cargo);
        // Se nenhum cargo foi encontrado, criar um cargo padrão com acesso total (para DEV)
        if (usuarioAtual.cargo === 'Desenvolvedor' || usuarioAtual.cargo === 'DEV' || usuarioAtual.cargo === 'Admin') {
            cargoAtual = {
                id: 'cargo_dev_temp',
                nome: usuarioAtual.cargo,
                permissoes: {
                    'paciente': ['criar', 'visualizar', 'editar', 'apagar'],
                    'consulta': ['criar', 'visualizar', 'editar', 'apagar'],
                    'exame': ['criar', 'visualizar', 'editar', 'apagar'],
                    'farmacia': ['criar', 'visualizar', 'editar', 'apagar'],
                    'cargo': ['criar', 'visualizar', 'editar', 'apagar'],
                    'usuario': ['criar', 'visualizar', 'editar', 'apagar']
                }
            };
        } else {
            cargoAtual = {
                id: 'cargo_padrao_temp',
                nome: usuarioAtual.cargo || 'Padrão',
                permissoes: {
                    'paciente': ['visualizar'],
                    'consulta': ['visualizar'],
                    'exame': ['visualizar'],
                    'farmacia': ['visualizar'],
                    'usuario': ['visualizar'],
                    'cargo': []
                }
            };
        }
    }
    
    return true;
}

/**
 * Verificar se o usuário tem uma permissão específica
 * 
 * IMPORTANTE: Este função é tolerante e robusta:
 * - Converte módulo e ação para minúsculas automaticamente
 * - Retorna false de forma segura se cargo/permissões não existirem
 * - Suporta arrays tanto em permissões quanto em checks
 * 
 * @param {string} modulo - Módulo (paciente, consulta, exame, farmacia, cargo, usuario)
 * @param {string} acao - Ação (criar, visualizar, editar, apagar)
 * @returns {boolean} true se tem permissão, false caso contrário
 * 
 * @example
 * temPermissao('cargo', 'visualizar')     // Verificar acesso
 * temPermissao('CARGO', 'VISUALIZAR')     // Case-insensitive
 * temPermissao('usuario', 'criar')         // Novo módulo de usuários
 */
export function temPermissao(modulo, acao) {
    // Validação defensiva: se cargo não foi inicializado, retorna false
    if (!cargoAtual || !cargoAtual.permissoes) {
        console.warn('⚠️ [Permissões] Cargo não inicializado. Retornando acesso negado.');
        return false;
    }
    
    // Normalizar entrada para minúsculas para evitar erros de case
    const moduloNormalizado = (modulo || '').toLowerCase().trim();
    const acaoNormalizada = (acao || '').toLowerCase().trim();
    
    // Validação: módulo e ação devem ser strings não-vazias
    if (!moduloNormalizado || !acaoNormalizada) {
        console.warn(`⚠️ [Permissões] Parâmetros inválidos: modulo="${modulo}", acao="${acao}"`);
        return false;
    }
    
    // Obter permissões do módulo
    const permissoesDoModulo = cargoAtual.permissoes[moduloNormalizado];
    
    // Se o módulo não existe, retorna false
    if (!permissoesDoModulo) {
        console.warn(`⚠️ [Permissões] Módulo "${moduloNormalizado}" não encontrado no cargo "${cargoAtual.nome}"`);
        return false;
    }
    
    // Validação: permissões deve ser um array
    if (!Array.isArray(permissoesDoModulo)) {
        console.warn(`⚠️ [Permissões] Permissões do módulo "${moduloNormalizado}" não é um array`);
        return false;
    }
    
    // Verificar se a ação está na lista de permissões (normalizado para minúsculas)
    const temAcesso = permissoesDoModulo.some(p => 
        (p || '').toLowerCase().trim() === acaoNormalizada
    );
    
    // Log detalhado apenas se acesso foi negado (evita spam)
    if (!temAcesso) {
        console.warn(`❌ [Permissões] Acesso negado: ${cargoAtual.nome} não pode "${acaoNormalizada}" em "${moduloNormalizado}"`);
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
