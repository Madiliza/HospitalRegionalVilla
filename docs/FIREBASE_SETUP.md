# Firebase Project Configuration

Este arquivo contém instruções sobre como configurar o projeto com suas credenciais do Firebase.

## Obtendo suas Credenciais

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Vá para "Configurações do Projeto" (ícone de engrenagem no canto superior esquerdo)
4. Na seção "Teus apps", clique em "SDK do Firebase"
5. Copie a configuração JSON

## Substituindo as Credenciais

### Para index.html (Web):

Localize este trecho no arquivo `index.html`:

```javascript
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "seu-projeto.firebaseapp.com",
  databaseURL: "https://seu-projeto.firebaseio.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "seu-messaging-sender-id",
  appId: "seu-app-id"
};
```

E substitua pelos seus valores:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxx",
  authDomain: "meu-app.firebaseapp.com",
  databaseURL: "https://meu-app.firebaseio.com",
  projectId: "meu-app",
  storageBucket: "meu-app.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:xxxxxxxxxxxxx"
};
```

### Para firebase-config.js (Node.js):

O mesmo processo acima, localize a seção `firebaseConfig` e substitua.

## Ativar Autenticação

1. No Firebase Console, vá para **Autenticação**
2. Clique em **Começar**
3. Selecione **Email/Senha**
4. Ative a opção e clique **Salvar**

## Ativar Realtime Database

1. No Firebase Console, vá para **Realtime Database**
2. Clique em **Criar banco de dados**
3. Selecione a localização (Brasil é recomendado para la região Latin America South)
4. Para desenvolvimento, comece em **Modo de teste** (não recomendado para produção)
5. Clique **Ativar**

## Regras de Segurança (Importante!)

Para proteger seus dados, defina as regras de segurança do Realtime Database:

### Desenvolvimento (teste apenas):
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

### Produção (recomendado):
```json
{
  "rules": {
    "usuarios": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    }
  }
}
```

Onde `$uid` é o ID do usuário autenticado.

## Variáveis de Ambiente (Node.js)

Para maior segurança, use um arquivo `.env`:

1. Crie um arquivo `.env` na raiz do projeto:

```env
FIREBASE_API_KEY=sua_chave
FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
FIREBASE_DATABASE_URL=https://seu-projeto.firebaseio.com
FIREBASE_PROJECT_ID=seu-projeto
FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
FIREBASE_MESSAGING_SENDER_ID=seu-id
FIREBASE_APP_ID=seu-app-id
```

2. Instale dotenv:
```bash
npm install dotenv
```

3. Use no seu código:
```javascript
import dotenv from 'dotenv';
dotenv.config();

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  // ... resto das chaves
};
```

## Teste de Conexão

Para testar sua configuração:

1. **No navegador:** Abra `index.html` e tente criar uma conta
2. **No Node.js:** Execute `npm run dev` e veja as mensagens de console

Se funcionar, você deve ver mensagens de sucesso no console.

## Troubleshooting

**Erro: "apiKey is invalid"**
- Verifique se copiou a chave corretamente
- Certifique-se de que o projeto está ativado no Firebase Console

**Erro: "Database does not exist"**
- Ative o Realtime Database conforme instruções acima

**Erro: "auth/operation-not-allowed"**
- Ative a autenticação por email/senha no Firebase Console

**Erro: "Network error"**
- Verifique sua conexão de internet
- Confirme que a databaseURL está correta

## Próximos Passos

Após configurar:
1. Teste criar uma conta no `index.html`
2. Teste salvar e carregar dados
3. Explore os dados no Firebase Console
4. Implemente a autenticação no seu projeto

Para mais informações, consulte a [documentação do Firebase](https://firebase.google.com/docs).
