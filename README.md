# McTonny - Rota dos Romeiros

Minigame estilo "Lemmings": guie os romeiros do portal até o McTonny usando habilidades limitadas.

## Rodando localmente

Como o jogo usa apenas HTML/CSS/JS puro (sem build step), basta abrir `index.html` no navegador,
ou usar um servidor local simples:

```bash
npx serve .
# ou
python3 -m http.server 8000
```

## Estrutura

```
index.html          - estrutura da página (DOM/HUD)
style.css            - estilos
js/engine.js         - motor genérico (game loop, input, HUD, ciclo de vida da fase)
js/game-romeiros.js  - regras específicas deste minigame (Entity, física, nível)
```

Novos minigames podem reaproveitar `engine.js` criando seu próprio `game-*.js`
que define `createEntity`, `onAbilityUse`, `renderExtras` e a configuração da fase.

## Habilidades

- 🛑 **Bloquear**: para um romeiro no lugar, virando obstáculo para os demais
- 🪜 **Rampa**: constrói uma plataforma de 50px à frente do romeiro
- ☂️ **Chuva (Guarda-chuva)**: reduz a velocidade de queda, evitando morte por queda alta

## Status

Protótipo v0.3 — MVP jogável, com física de queda e colisão corrigidas.

## Deploy (GitHub Pages)

Após o push, ative em: `Settings > Pages > Deploy from branch > main / (root)`.
O jogo fica acessível em `https://SEU-USUARIO.github.io/NOME-DO-REPO/`.
