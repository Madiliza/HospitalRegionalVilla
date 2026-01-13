// ============================================
// DIÁLOGOS E NOTIFICAÇÕES
// ============================================

let appReady = false;

/**
 * Helper para acessar elementos de forma segura
 * @param {string} id - ID do elemento
 * @returns {HTMLElement|null}
 */
export function safeGetElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.warn(`⚠️ Elemento ${id} não encontrado`);
        return null;
    }
    return element;
}

export function setAppReady(ready) {
    appReady = ready;
}

export function getDialogoElementos() {
    if (!appReady) {
        console.warn('App ainda não está pronto');
        return null;
    }
    
    return {
        dialog: document.getElementById('customDialog'),
        dialogIcon: document.getElementById('dialogIcon'),
        dialogTitle: document.getElementById('dialogTitle'),
        dialogMessage: document.getElementById('dialogMessage'),
        dialogButtons: document.getElementById('dialogButtons')
    };
}

export function mostrarDialog(titulo, mensagem, tipo = 'info', botoes = null) {
    // Se o app ainda não está pronto, aguardar
    if (!appReady) {
        console.warn('App não está pronto para mostrar dialogo');
        return;
    }
    
    // Obter elementos
    const elementos = getDialogoElementos();
    const { dialog, dialogIcon, dialogTitle, dialogMessage, dialogButtons } = elementos;
    
    // Se algum elemento não existe, tentar novamente
    if (!dialog || !dialogIcon || !dialogTitle || !dialogMessage || !dialogButtons) {
        console.warn('Elementos do diálogo não encontrados');
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

export function executarBotaoDialog(indice) {
    if (window.dialogCallbacks && window.dialogCallbacks[indice]) {
        const callback = window.dialogCallbacks[indice];
        fecharDialog();
        callback();
    } else {
        fecharDialog();
    }
}

export function fecharDialog() {
    const dialog = document.getElementById('customDialog');
    if (dialog) {
        dialog.classList.add('modal-hidden');
    }
    window.dialogCallbacks = null;
}

// Funções auxiliares para tipos específicos
export function mostrarAlerta(titulo, mensagem) {
    mostrarDialog(titulo, mensagem, 'info');
}

export function mostrarErro(titulo, mensagem) {
    mostrarDialog(titulo, mensagem, 'error');
}

export function mostrarSucesso(titulo, mensagem) {
    mostrarDialog(titulo, mensagem, 'success');
}

export function mostrarAviso(titulo, mensagem) {
    mostrarDialog(titulo, mensagem, 'warning');
}

export function mostrarConfirmacao(titulo, mensagem, callbackSim, callbackNao = null) {
    const botoesConfirmacao = [
        {
            texto: 'Sim',
            tipo: 'primary',
            callback: async () => {
                await callbackSim();
            }
        },
        {
            texto: 'Não',
            tipo: 'secondary',
            callback: () => {
                if (callbackNao) {
                    callbackNao();
                }
            }
        }
    ];
    
    mostrarDialog(titulo, mensagem, 'question', botoesConfirmacao);
}

// ============================================
// NOTIFICAÇÕES
// ============================================
export function mostrarNotificacao(mensagem, tipo = 'info') {
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
        notificacao.remove();
    }, 3000);
}

// Exportar como globais para uso em onclick do HTML
window.executarBotaoDialog = executarBotaoDialog;
window.fecharDialog = fecharDialog;
