# Projeto Incendeia - Capoeira

Este projeto foi configurado para ser implantado na **Vercel**.

## Instruções de Implantação

1. **Conecte ao GitHub:** Importe este repositório para o seu painel da Vercel.
2. **Framework:** Selecione **Vite** (geralmente detectado automaticamente).
3. **Build Command:** `npm run build`
4. **Output Directory:** `dist`
5. **Variáveis de Ambiente (CRÍTICO):**
   Adicione as seguintes variáveis no painel da Vercel:
   - `GEMINI_API_KEY`: Sua chave de API do Google Gemini.
6. **Deploy:** Clique em Deploy.

## Configuração do Firebase
Certifique-se de que as regras do Firestore (`firestore.rules`) foram implantadas no seu projeto Firebase usando o Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

As configurações do Firebase já estão incluídas no arquivo `firebase-applet-config.json`.
