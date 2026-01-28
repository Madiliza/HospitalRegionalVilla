export function paginar(dados, paginaAtual, itensPorPagina) {
    const totalItens = dados.length;
    const totalPaginas = Math.ceil(totalItens / itensPorPagina);

    // Garantir que a página atual seja válida
    const pagina = Math.max(1, Math.min(paginaAtual, totalPaginas || 1));

    const inicio = (pagina - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    const dadosPaginados = dados.slice(inicio, fim);

    return {
        dadosPaginados,
        totalPaginas,
        paginaAtual: pagina,
        totalItens
    };
}

export function gerarControlesHTML(totalPaginas, paginaAtual, nomeModulo, cor = 'blue') {
    if (totalPaginas <= 1) return '';

    const criarBotao = (pagina, texto, ativo = false, disabled = false) => `
        <button 
            onclick="window.${nomeModulo}.mudarPagina(${pagina})"
            class="px-3 py-1 rounded-md border ${ativo
            ? `bg-${cor}-600 text-white border-${cor}-600`
            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'} 
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'transition duration-200'}"
            ${disabled ? 'disabled' : ''}>
            ${texto}
        </button>
    `;

    let html = '<div class="flex justify-center items-center space-x-2 mt-6 flex-wrap gap-y-2">';

    // Botão Anterior
    html += criarBotao(paginaAtual - 1, '<i class="fas fa-chevron-left"></i>', false, paginaAtual === 1);

    // Lógica para mostrar páginas (ex: 1 ... 4 5 6 ... 10)
    const maxBotoes = 5;
    let inicio = Math.max(1, paginaAtual - Math.floor(maxBotoes / 2));
    let fim = Math.min(totalPaginas, inicio + maxBotoes - 1);

    if (fim - inicio + 1 < maxBotoes) {
        inicio = Math.max(1, fim - maxBotoes + 1);
    }

    if (inicio > 1) {
        html += criarBotao(1, '1');
        if (inicio > 2) html += '<span class="text-gray-500 px-2">...</span>';
    }

    for (let i = inicio; i <= fim; i++) {
        html += criarBotao(i, i, i === paginaAtual);
    }

    if (fim < totalPaginas) {
        if (fim < totalPaginas - 1) html += '<span class="text-gray-500 px-2">...</span>';
        html += criarBotao(totalPaginas, totalPaginas);
    }

    // Botão Próximo
    html += criarBotao(paginaAtual + 1, '<i class="fas fa-chevron-right"></i>', false, paginaAtual === totalPaginas);

    html += '</div>';

    // Detalhes da paginação
    html += `
        <div class="text-center text-gray-500 text-sm mt-2">
            Pág ${paginaAtual} de ${totalPaginas}
        </div>
    `;

    return html;
}
