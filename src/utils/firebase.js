// ============================================
// OPERAÇÕES COM FIREBASE
// ============================================

import { salvarDados, lerDados, deletarDados } from '../../config/firebase-config.js';

export async function carregarDadosFirebase() {
    try {

        const [pacientes, consultas, exames, medicamentos, cargos, usuarios, medicamentosConfig, solicitacoesCadastro, valoresAtendimentos, doacoesSangue, examesConfig] = await Promise.all([
            lerDados('pacientes'),
            lerDados('consultas'),
            lerDados('exames'),
            lerDados('medicamentos'),
            lerDados('cargos'),
            lerDados('usuarios'),
            lerDados('medicamentosConfig'),
            lerDados('solicitacoes_cadastro'),
            lerDados('valoresAtendimentos'),
            lerDados('doacoesSangue'),
            lerDados('examesConfig')
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
            examesConfig: converterParaArray(examesConfig),
            solicitacoesCadastro: converterParaArray(solicitacoesCadastro),
            valoresAtendimentos: valoresAtendimentos?.valoresAtendimentos || valoresAtendimentos || {},
            doacoesSangue: converterParaArray(doacoesSangue)
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
            valoresAtendimentos: {},
            doacoesSangue: []
        };
    }
}

export async function salvarNoFirebase(colecao, dados) {
    try {
        if (!dados || !dados.id) {
            throw new Error('Dados inválidos: ID é obrigatório para salvamento');
        }
        console.log(`📝 Salvando ${colecao}:`, dados);
        await salvarDados(`${colecao}/${dados.id}`, dados);
        console.log(`✅ ${colecao} salvo com sucesso:`, dados.id);
    } catch (erro) {
        console.error(`❌ Erro ao salvar ${colecao}:`, erro);
        throw erro;
    }
}

export async function deletarDoFirebase(colecao, id) {
    try {
        if (!id) {
            throw new Error('ID é obrigatório para deletar');
        }
        console.log(`🗑️ Deletando ${colecao}:`, id);
        await deletarDados(`${colecao}/${id}`);
        console.log(`✅ ${colecao} deletado com sucesso:`, id);
    } catch (erro) {
        console.error(`❌ Erro ao deletar ${colecao}:`, erro);
        throw erro;
    }
}
