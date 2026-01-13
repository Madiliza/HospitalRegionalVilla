// Importar Firebase
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, child } from 'firebase/database';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';

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
    console.log("Dados salvos com sucesso!");
  } catch (erro) {
    console.error("Erro ao salvar dados:", erro);
  }
}

// Função para ler dados do Realtime Database
export async function lerDados(caminho) {
  try {
    const snapshot = await get(child(ref(database), caminho));
    if (snapshot.exists()) {
      console.log(`Dados de ${caminho}:`, snapshot.val());
      return snapshot.val();
    } else {
      console.log(`Nenhum dado encontrado em ${caminho}`);
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
    console.log("Dados deletados com sucesso!");
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
  }
}

// Função para fazer logout
export async function fazerLogout() {
  try {
    await signOut(auth);
    console.log("Logout realizado com sucesso!");
  } catch (erro) {
    console.error("Erro ao fazer logout:", erro.message);
  }
}

export { database, auth, app };
