// Importar Firebase
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, child } from 'firebase/database';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updatePassword, EmailAuthProvider, reauthenticateWithCredential, sendPasswordResetEmail } from 'firebase/auth';

// Configuração do Firebase (Use variáveis de ambiente do Vite)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

// Função para salvar dados no Realtime Database
export async function salvarDados(caminho, dados) {
  try {
    // Sanitizar dados para remover undefined
    const dadosSanitizados = JSON.parse(JSON.stringify(dados));
    
    await set(ref(database, caminho), dadosSanitizados);
    console.log('✅ Dados salvos com sucesso em:', caminho);
  } catch (erro) {
    console.error('❌ Erro ao salvar dados em', caminho, ':', erro);
    throw erro;
  }
}

// Função para ler dados do Realtime Database
export async function lerDados(caminho) {
  try {
    const snapshot = await get(child(ref(database), caminho));
    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      return null;
    }
  } catch (erro) {
    return null;
  }
}

// Função para deletar dados do Realtime Database
export async function deletarDados(caminho) {
  try {
    await set(ref(database, caminho), null);
    console.log('✅ Dados deletados com sucesso em:', caminho);
  } catch (erro) {
    console.error('❌ Erro ao deletar dados em', caminho, ':', erro);
    throw erro;
  }
}

// Função para criar usuário
export async function criarUsuario(email, senha) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
    return userCredential.user;
  } catch (erro) {
    // Erro silencioso
  }
}

// Função para fazer login
export async function fazerLogin(email, senha) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, senha);
    return userCredential.user;
  } catch (erro) {
    throw erro; // Propagar erro para tratamento na UI
  }
}

// Função para fazer logout
export async function fazerLogout() {
  try {
    await signOut(auth);
    return true;
  } catch (erro) {
    throw erro;
  }
}

// Função para alterar senha
export async function alterarSenha(senhaAtual, novaSenha) {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Usuário não autenticado');
    
    // Reautenticar usuário
    const credential = EmailAuthProvider.credential(user.email, senhaAtual);
    await reauthenticateWithCredential(user, credential);
    
    // Alterar senha
    await updatePassword(user, novaSenha);
    return true;
  } catch (erro) {
    throw erro;
  }
}

// Função para enviar email de recuperação de senha
export async function enviarEmailRecuperacao(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    return true;
  } catch (erro) {
    throw erro;
  }
}

// Função para verificar autenticação
export function verificarAutenticacao(callback) {
  return onAuthStateChanged(auth, callback);
}

// Obter usuário atual
export function getUsuarioAtual() {
  return auth.currentUser;
}

export { database, auth, app };
