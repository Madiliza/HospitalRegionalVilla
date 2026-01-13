// ============================================
// OPERAÇÕES COM FIREBASE
// ============================================

import { salvarDados, lerDados, deletarDados } from '../../config/firebase-config.js';

export async function carregarDadosFirebase() {
    try {
        
        const [pacientes, consultas, exames, medicamentos, cargos, usuarios, medicamentosConfig, solicitacoesCadastro, valoresAtendimentos] = await Promise.all([
            lerDados('pacientes'),
            lerDados('consultas'),
            lerDados('exames'),
            lerDados('medicamentos'),
            lerDados('cargos'),
            lerDados('usuarios'),
            lerDados('medicamentosConfig'),
            lerDados('solicitacoes_cadastro'),
            lerDados('valoresAtendimentos')
        ]);

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
            solicitacoesCadastro: converterParaArray(solicitacoesCadastro),
            valoresAtendimentos: valoresAtendimentos?.valoresAtendimentos || valoresAtendimentos || {}
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
            solicitacoesCadastro: [],
            valoresAtendimentos: {}
        };
    }
}

export async function salvarNoFirebase(colecao, dados) {
    try {
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
