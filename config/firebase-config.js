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
    await set(ref(database, caminho), dados);
  } catch (erro) {
    console.error("Erro ao salvar dados:", erro);
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
    console.error(`Erro ao ler dados de ${caminho}:`, erro);
    return null;
  }
}

// Função para deletar dados do Realtime Database
export async function deletarDados(caminho) {
  try {
    await set(ref(database, caminho), null);
  } catch (erro) {
    console.error("Erro ao deletar dados:", erro);
  }
}

// Função para criar usuário
export async function criarUsuario(email, senha) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
    console.log("Usuário criado:", userCredential.user.uid);
    return userCredential.user;
  } catch (erro) {
    console.error("Erro ao criar usuário:", erro.message);
  }
}

// Função para fazer login
export async function fazerLogin(email, senha) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, senha);
    console.log("Login realizado:", userCredential.user.uid);
    return userCredential.user;
  } catch (erro) {
    console.error("Erro ao fazer login:", erro.message);
    throw erro; // Propagar erro para tratamento na UI
  }
}

// Função para fazer logout
export async function fazerLogout() {
  try {
    await signOut(auth);
    return true;
  } catch (erro) {
    console.error("Erro ao fazer logout:", erro.message);
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
    console.log("Senha alterada com sucesso!");
    return true;
  } catch (erro) {
    console.error("Erro ao alterar senha:", erro.message);
    throw erro;
  }
}

// Função para enviar email de recuperação de senha
export async function enviarEmailRecuperacao(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    return true;
  } catch (erro) {
    console.error("Erro ao enviar email:", erro.message);
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
