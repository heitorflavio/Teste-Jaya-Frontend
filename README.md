This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Executando o Projeto

### Executando (Ubuntu)

1. Certifique-se de ter o node v20.11.1 instalado. Se não tiver, siga as [instruções de instalação do node v20.11.1 no Ubuntu 20.04](https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-ubuntu-20-04).

2. Clone o repositório:

```bash
git clone https://github.com/heitorflavio/Teste-Jaya-Frontend.git
```

3. Acesse a pasta do projeto:

```bash
cd Teste-Jaya-Frontend
```

4. Altere a variável de ambiente `NEXT_PUBLIC_MP_KEY` no arquivo `.env` para a sua key.

4.1 Não é uma boa prática subir o arquivo `.env` para o repositório, mas para fins de teste, ele foi subido.

5. Instale as dependências:

```bash
npm install
```

6. Execute o projeto:

```bash
npm run dev
```

7. Abra [http://localhost:3000](http://localhost:3000) com seu navegador para ver o resultado.

8. Faça login com o usuário `test@example.com` e senha `password` que foram criados automaticamente no backend.

9. Pronto! Agora você pode efetuar pagamentos.

10. Obs: Usar CPF válido para efetuar pagamentos ou CNPJ (Sem Validação).
