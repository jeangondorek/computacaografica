# 🚀 Explorador Estelar — Trabalho Final de Computação Gráfica

Aplicação gráfica interativa desenvolvida em **Three.js** com modelagem 3D, simulação espacial e dinâmica de jogo em terceira pessoa.

---

## 🎯 Proposta e Mecânicas Implementadas

- **Universo e Proporções Cósmicas:**
  - **Sol Central (Sol Prime):** Fonte de luz pontual com coroa incandescente de plasma e iluminação dinâmica de todo o sistema.
  - **Planeta Ignis (Lava):** Planeta menor (tamanho da nossa Lua, raio 125) com crosta basáltica e fissuras de magma emissivas, orbitado pela lua vulcânica *Piro*.
  - **Planeta Gaea (Floresta):** Planeta mediano (tamanho entre a Terra e a Lua, raio 260) com continentes verdes, oceanos azuis, camada de nuvens rotativa independente e a lua craterada *Selene*.
  - **Planeta Cryo (Gelo):** Super-planeta gigante (raio 480) com placas glaciais, fissuras azuis, sistema de anéis de gelo e duas luas (*Frost-1* e *Glacies*).
  - **Escala e Navegabilidade:** A nave possui proporção reduzida diante dos planetas gigantes, com distâncias de 3.400 a 14.200 unidades, exigindo planejamento e uso da propulsão turbo para viagens interplanetárias.

- **Objetivo Científico:**
  - Em cada um dos 3 planetas, há **5 amostras científicas** (cristais facetados e reluzentes) orbitando em altitudes diferentes.
  - Cada planeta possui 10 amostras em posições aleatórias. O estoque começa com apenas 1 espaço e pode ser ampliado até 15 espaços, com no máximo 5 amostras de cada planeta.
  - Ao vender um contrato, as amostras entregues saem do estoque e podem ser coletadas novamente.
  - Depois que todas as 30 amostras forem esgotadas, novas amostras são geradas em posições diferentes após 5 minutos.

- **Mercado Orbital:**
  - Uma nave cargueira funciona como comprador e base de operações, sem exigir pouso nos planetas.
  - Próximo dela, a tecla **M** abre três contratos aleatórios de coleta.
  - Os contratos rendem créditos para comprar tanque de turbo maior e upgrades de motor.
  - O item **Conserto** recupera 10 pontos de vida por compra, até o máximo do casco.
  - A exploração continua depois que todas as amostras são coletadas; a tela de vitória não encerra mais o jogo.

- **Obstáculos e Dano:**
  - Dois extensos cinturões de asteroides posicionados entre as órbitas planetárias (*Cinturão de Brasas* e *Cinturão Glacial*).
  - Detecção de colisão física por esferas delimitadoras; cada impacto causa dano ao casco da nave, aciona o escudo de força e empurra a nave.
  - Se a integridade da nave chegar a zero, a nave é destruída e a tentativa é reiniciada desde o início, perdendo estoque, créditos e upgrades.

- **HUD e Telemetria em Tempo Real:**
  - Barra de integridade do casco e medidor de combustível do turbo (Boost/Warp).
  - Velocímetro em tempo real.
  - Radar com bússola 3D angular apontando em tempo real para a amostra ativa mais próxima.
  - Contador de estoque de amostras por planeta.

- **Conteúdo Autoral e Conceitos de Computação Gráfica (Avaliação da Disciplina):**
  - **Texturas 100% Autorais e Procedurais:** Geradas dinamicamente via código com ruído Perlin/Simplex no HTML5 Canvas (`TextureGenerator.js`), sem depender de imagens baixadas da internet.
  - **Transformações Hierárquicas:** Grupos de translação orbital e rotação axial em cascata (Sol -> Planetas -> Nuvens -> Luas -> Cristais).
  - **Materiais e Iluminação:** `MeshStandardMaterial` e `MeshPhysicalMaterial` com mapas difusos, emissivos, rugosidade, metalicidade e transparência.
  - **Sintetizador de Áudio Procedural:** Sons sintetizados via Web Audio API (zumbido de motor espacial, propulsão turbo, carrilhão de coleta de cristais, explosão e impacto metálico).

---

## 🕹️ Controles de Pilotagem

| Tecla | Ação |
| :--- | :--- |
| **W** / **S** | Arfagem (*Pitch*): Inclina o bico da nave para baixo / cima |
| **A** / **D** | Guinada (*Yaw*): Gira a nave para a esquerda / direita (com inclinação suave de asa) |
| **Q** / **E** | Rolagem (*Roll*): Gira a nave no próprio eixo lateral |
| **ESPAÇO** | Acelerar propulsor frontal |
| **SHIFT** | Propulsão Turbo (*Warp Boost* para cruzar o espaço interplanetário) |
| **X** / **B** | Freio de emergência / Ré |
| **C** | Alternar Câmera (3ª Pessoa próxima / 3ª Pessoa ampla / Cockpit) |
| **H** | Exibir / ocultar guia de comandos na tela |
| **G** (segurar) | Coletar a amostra quando a nave estiver próxima |
| **9** | Atalho de teste: preencher o estoque com 5 amostras de cada planeta |
| **5** | Atalho de teste: adicionar 1000 créditos |
| **0** | Atalho de teste: zerar as amostras coletadas |
| **8** | Ativar / desativar turbo infinito |
| **M** | Abrir o mercado perto da nave cargueira |

---

## 🚀 Como Executar o Projeto

Como o Three.js utiliza módulos ES6 nativos (`import`/`export`), basta rodar um servidor HTTP local:

### Opção 1: Via script pronto
```bash
cd /home/jean/GIT/computacaografica/trabalho
./run.sh
```

### Opção 2: Via Python diretamente
```bash
cd /home/jean/GIT/computacaografica/trabalho
python3 -m http.server 8000
```

Abra no seu navegador: **[http://localhost:8000](http://localhost:8000)**

---

## 📁 Estrutura de Arquivos

```
trabalho/
├── index.html                   # Estrutura HTML principal e interface HUD
├── run.sh                       # Script facilitador de execução
├── README.md                    # Documentação do projeto
├── css/
│   └── style.css                # Estilização sci-fi glassmorphism do HUD
├── libs/
│   └── three/                   # Biblioteca Three.js 0.185.1 (100% local e offline)
└── src/
    ├── main.js                  # Laço principal de animação e orquestração
    ├── config.js                # Parâmetros de distâncias, escalas, velocidades e cores
    ├── audio.js                 # Sintetizador Web Audio API procedural
    ├── controls/
    │   └── ShipControls.js      # Dinâmica inercial da nave e câmera em 3ª pessoa (chase)
    ├── entities/
    │   ├── Sun.js               # Sol com iluminação pontual e coroa de plasma
    │   ├── CelestialSystem.js   # 3 planetas (Ignis, Gaea, Cryo) e luas hierárquicas
    │   ├── AsteroidField.js     # Campos de asteroides procedurais e detecção de colisão
    │   ├── Collectible.js       # 12 amostras de cristais em órbita com detecção
    │   ├── Ship.js              # Modelo 3D autoral da nave e escudos de força
    │   ├── MerchantShip.js      # Nave cargueira/comprador orbital
    │   └── MarketManager.js     # Contratos, créditos e upgrades
    ├── environment/
    │   └── Starfield.js         # Campo estelar e partículas de velocidade warp
    ├── ui/
    │   └── HUD.js               # Atualização e lógica em tempo real do HUD
    └── utils/
        └── TextureGenerator.js  # Gerador procedural de texturas autorais no Canvas
```
