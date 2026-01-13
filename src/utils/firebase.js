// ============================================
// OPERAÇÕES COM FIREBASE
// ============================================

import { salvarDados, lerDados, deletarDados } from '../../config/firebase-config.js';

export async function carregarDadosFirebase() {
    try {
        
        // Carregar todas as coleções em paralelo
        const [pacientes, consultas, exames, medicamentos, cargos, usuarios, medicamentosConfig, solicitacoesCadastro] = await Promise.all([
            lerDados('pacientes'),
            lerDados('consultas'),
            lerDados('exames'),
            lerDados('medicamentos'),
            lerDados('cargos'),
            lerDados('usuarios'),
            lerDados('medicamentosConfig'),
            lerDados('solicitacoes_cadastro')
        ]);

        // Converter objetos do Firebase para arrays
        const converterParaArray = (dados) => {
            if (!dados) return [];
            if (Array.isArray(dados)) return dados;
            return Object.values(dados);
        };

        const dadosCarregados = {
            pacientes: converterParaArray(pacientes),
            consultas: converterParaArray(consultas),
            exames: converterParaArray(exames),
            medicamentos: converterParaArray(medicamentos),
            cargos: converterParaArray(cargos),
            usuarios: converterParaArray(usuarios),
            medicamentosConfig: converterParaArray(medicamentosConfig),
            solicitacoesCadastro: converterParaArray(solicitacoesCadastro)
        };


        return dadosCarregados;
    } catch (erro) {
        return {
            pacientes: [],
            consultas: [],
            exames: [],
            medicamentos: [],
            cargos: [],
            usuarios: [],
            medicamentosConfig: [],
            solicitacoesCadastro: []
        };
    }
}

export async function salvarNoFirebase(colecao, dados) {
    try {
        // Salvar usando o ID do item como chave
        await salvarDados(`${colecao}/${dados.id}`, dados);

    } catch (erro) {
        throw erro;
    }
}

export async function deletarDoFirebase(colecao, id) {
    try {
        await deletarDados(`${colecao}/${id}`);

    } catch (erro) {
        throw erro;
    }
}
