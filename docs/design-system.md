# Identidade Estética — Sistema de Gestão de Salas de Ensaio
### Estação Musical de Monção (EMM)

Documento de referência para o desenvolvimento (vibe code) da webapp. Define a linguagem visual, os tokens de design e as regras de aplicação, derivados do brandbook da EMM.

---

## 1. Essência da marca

A identidade da EMM é **clássica-moderna**: tipografia com serifa elegante e de alto contraste, uma paleta sóbria ancorada no azul-marinho, e um sistema gráfico construído a partir de **símbolos de notação musical** (modernos, bizantinos e gregos) que podem ser espelhados e rodados para formar composições ornamentais. As marcas usam ainda **chaves e colchetes `{ }` `[ ]`** como elemento gráfico recorrente — um motivo que vale a pena trazer para a interface.

A inspiração patrimonial vem da **Antiga Estação Ferroviária de Monção**, e o símbolo da EMM evoca esse edifício (a lanterna/candeeiro sobre o arco).

**Três palavras-guia para a UI:** *serena, institucional, musical.*

Princípio prático: a interface deve respirar (muito espaço em branco/azul claro), ser legível e sóbria no dia-a-dia, e reservar os apontamentos decorativos (símbolos musicais, molduras em chaveta) para momentos pontuais — cabeçalhos, estados vazios, separadores. Nada de "ruído" decorativo nas zonas de trabalho (grelha de horários, formulários).

---

## 2. Paleta de cores

### Cores de marca (brandbook)

| Papel | Nome | HEX | RGB | Notas |
|---|---|---|---|---|
| **Tinta principal / estrutura** | Azul-marinho | `#1D1A55` | 29, 26, 85 | Texto, títulos, barras, botões primários |
| **Fundo / superfície** | Azul-claro | `#DBF0FA` | 219, 240, 250 | Fundo geral da aplicação |
| **Destaque / alerta** | Vermelho | `#C21A26` | 194, 26, 38 | Acentos fortes, ocupado/aprovado, ações destrutivas |
| **Acento secundário** | Dourado | `#A8966B` *(a confirmar)* | ~168, 150, 107 | Detalhes, ícones, estado pendente |

> ⚠️ **Nota sobre o dourado:** no brandbook o swatch dourado (Pantone 871 U) aparece com o HEX `#C21A26`, que é claramente um erro de copy-paste (é o vermelho). O valor `#A8966B` acima é uma estimativa a partir da amostra visível. **Confirma o HEX/RGB correto com quem fez o brandbook** antes de fechar a paleta — Pantone 871 é um dourado metálico, que em ecrã ronda os `#85714D`–`#A8966B` consoante a interpretação.

### Tons derivados (para UI, não estão no brandbook)

Para uma interface utilizável precisas de variações que não existem no brandbook. Estas mantêm-se fiéis à paleta:

| Token | HEX | Uso |
|---|---|---|
| Navy 90 | `#2A2770` | Hover de botões primários |
| Navy 60 | `#5A5790` | Texto secundário / labels |
| Navy 30 | `#A9A7C4` | Bordas subtis, ícones inativos |
| Surface 0 | `#FFFFFF` | Cartões sobre o fundo azul-claro |
| Surface 1 | `#EAF6FC` | Fundos alternados, linhas de tabela |
| Surface 2 | `#DBF0FA` | Fundo base da app |
| Hairline | `#C5E3F0` | Linhas divisórias sobre azul-claro |

---

## 3. Estados de disponibilidade (o coração da UX)

A spec pede **verde / amarelo / vermelho**, mas a paleta de marca **não tem verde**. Recomendação: manter a semântica universal (verde = livre, âmbar = pendente, vermelho = ocupado) mas **dessaturar e afinar** os tons para conviverem com o azul-marinho — nada de verdes/amarelos berrantes que partem a elegância da marca. O vermelho usa-se da própria marca; o âmbar puxa para o dourado; o verde é introduzido de forma sóbria (sálvia).

| Estado | Significado | Preenchimento | Borda / Texto | HEX fill / accent |
|---|---|---|---|---|
| 🟢 **Disponível** | Bloco livre | verde-sálvia suave | verde profundo | `#DCEFE6` / `#2E8B6B` |
| 🟡 **Pendente** | Pedido por aprovar (bloqueia o horário) | dourado claro | dourado/âmbar | `#F3EAD3` / `#B58A1E` |
| 🔴 **Aprovada / Ocupada** | Reserva confirmada | vermelho claro | vermelho de marca | `#F7DEE0` / `#C21A26` |
| ⚫ **Indisponível / fora de horário** | Fora do horário de funcionamento | cinza-azulado | navy 30 | `#E3EAEF` / `#8A93A8` |

Estados adicionais do ciclo de vida da reserva (não são cores de grelha, mas etiquetas/badges):

| Estado | Cor da badge |
|---|---|
| Rejeitada | vermelho `#C21A26` |
| Cancelada | navy 60 `#5A5790` |
| Concluída | dourado `#A8966B` |
| Expirada | cinza `#8A93A8` |

**Acessibilidade:** não confiar apenas na cor. Cada bloco/badge deve ter também **rótulo de texto e/ou ícone** (ex.: um padrão diagonal subtil nos blocos ocupados, um ponto pendente a piscar suave). Garante contraste AA do texto sobre cada preenchimento.

---

## 4. Tipografia

### Fontes do brandbook

| Fonte | Papel | Pesos disponíveis |
|---|---|---|
| **Nocturne Serif** | Títulos e destaques | Light, Regular, Medium |
| **Apparat** | Apenas texto / UI | Light, Regular, Bold |
| **Noto Music** | Símbolos musicais decorativos | Regular |

- **Nocturne Serif** — serifa moderna, geométrica, de alto contraste. Usar em títulos, números grandes (horas, datas), nome da instituição. Não usar em corpo de texto longo.
- **Apparat** — sans geométrica humanista, muito legível. Todo o texto de interface: labels, botões, parágrafos, tabelas, formulários.
- **Noto Music** — **não é para texto**; é a fonte de símbolos que gera o grafismo da marca. Usar com muita parcimónia: ornamentos de cabeçalho, separadores, ícone de "sem resultados", marca de água em estados vazios. É gratuita (Google Fonts).

### Disponibilidade web e fallbacks

`Nocturne Serif` (Fontfabric) e `Apparat` (comercial) podem exigir licença para web. Antes de fechar, **confirma a licença webfont** de cada uma. Caso não haja licença ou para um protótipo rápido, sugestões de substitutas no Google Fonts que mantêm o espírito:

- Substituta de **Nocturne Serif** → **Fraunces** (serifa de alto contraste, caráter moderno) ou **Cormorant**.
- Substituta de **Apparat** → **Hanken Grotesk** ou **Mulish** (geométrica humanista, ótima legibilidade).

Stacks recomendadas:

```css
--font-display: "Nocturne Serif", "Fraunces", Georgia, serif;
--font-body:    "Apparat", "Hanken Grotesk", system-ui, sans-serif;
--font-music:   "Noto Music", serif;
```

### Escala tipográfica (sugestão, base 16px / 1rem)

| Token | Tamanho | Fonte / peso | Uso |
|---|---|---|---|
| Display | 2.5–3rem | Nocturne Medium | Título da app, hero |
| H1 | 2rem | Nocturne Medium | Título de página |
| H2 | 1.5rem | Nocturne Regular | Secções |
| H3 | 1.25rem | Nocturne Regular | Cartões, blocos |
| Body | 1rem | Apparat Regular | Texto corrente |
| Body-S | 0.875rem | Apparat Regular | Labels, ajudas |
| Caption | 0.75rem | Apparat Regular | Notas, metadados |
| Button | 0.9375rem | Apparat Bold | Botões |
| Numeral | conforme | Nocturne Medium | Horas e datas em destaque na grelha |

Altura de linha: ~1.5 para corpo, ~1.15–1.25 para títulos. Títulos em Nocturne podem usar `letter-spacing` ligeiramente negativo; rótulos pequenos em maiúsculas (à imagem dos logos: `ESTAÇÃO MUSICAL DE MONÇÃO`) com `letter-spacing` positivo (~0.08em).

---

## 5. Motivo gráfico das chaves `{ }`

As marcas EMM emolduram o conteúdo entre **chavetas / colchetes**. Trazer isto para a interface dá personalidade sem custo de legibilidade:

- Emoldurar o **título de secção** ou o **estado selecionado** com chavetas em dourado/navy: `{ Reservar }`.
- Usar a chaveta como elemento de **seleção** na grelha de horários: o intervalo escolhido pelo utilizador é "abraçado" por uma chaveta lateral (`{` no início, `}` no fim do bloco contíguo selecionado) — visualmente claro e fiel à marca.
- Botões primários e badges importantes podem ter um detalhe de chaveta em vez de simples cantos.

Manter discreto: é um tempero, não o prato principal.

---

## 6. Tokens visuais (forma, espaço, profundidade)

A estética é **elegante e clássica-moderna** → cantos pouco arredondados, sombras subtis, linhas finas. Evitar o look "app genérica" com cantos muito redondos e sombras pesadas.

```css
:root {
  /* Cores de marca */
  --color-navy:        #1D1A55;
  --color-navy-90:     #2A2770;
  --color-navy-60:     #5A5790;
  --color-navy-30:     #A9A7C4;
  --color-red:         #C21A26;
  --color-gold:        #A8966B;
  --color-sky:         #DBF0FA;

  /* Superfícies */
  --surface-0:         #FFFFFF;
  --surface-1:         #EAF6FC;
  --surface-2:         #DBF0FA;
  --hairline:          #C5E3F0;

  /* Texto */
  --text-strong:       #1D1A55;
  --text-muted:        #5A5790;
  --text-on-dark:      #DBF0FA;

  /* Estados de disponibilidade */
  --avail-free-fill:    #DCEFE6;  --avail-free-ink:    #2E8B6B;
  --avail-pending-fill: #F3EAD3;  --avail-pending-ink: #B58A1E;
  --avail-busy-fill:    #F7DEE0;  --avail-busy-ink:    #C21A26;
  --avail-off-fill:     #E3EAEF;  --avail-off-ink:     #8A93A8;

  /* Tipografia */
  --font-display: "Nocturne Serif", "Fraunces", Georgia, serif;
  --font-body:    "Apparat", "Hanken Grotesk", system-ui, sans-serif;
  --font-music:   "Noto Music", serif;

  /* Espaçamento (escala 4px) */
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px; --space-4: 16px;
  --space-5: 24px; --space-6: 32px; --space-7: 48px; --space-8: 64px;

  /* Raio de canto (sóbrio) */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;   /* máximo, para cartões grandes */

  /* Sombras (subtis, tom navy) */
  --shadow-sm: 0 1px 2px rgba(29,26,85,0.08);
  --shadow-md: 0 4px 12px rgba(29,26,85,0.10);

  /* Bordas */
  --border-hairline: 1px solid var(--hairline);
}
```

Layout: largura de conteúdo confortável (~1100–1200px máx.), grelha generosa, muito espaço em branco sobre `--surface-2`. Mobile-first (vão consultar disponibilidade no telemóvel).

---

## 7. Diretrizes por componente-chave

**Cabeçalho / logo.** Símbolo da EMM + "Estação Musical de Monção" em Nocturne (ou versão responsiva). Fundo azul-claro ou branco; tinta navy.

**Grelha de horários (blocos de 30 min).** O ecrã mais importante. Colunas = salas (ou um dia, conforme a vista); linhas = blocos de 30 min (08:00 → 00:00 por defeito, configurável). Cada célula colorida pelo estado (§3), com rótulo/ícone além da cor. Seleção do utilizador: arrastar ou tocar blocos contíguos → conjunto "abraçado" por chaveta (§5), em navy. Horas em Nocturne para legibilidade e caráter.

**Formulário de reserva.** Apparat, campos espaçados, navy sobre branco. Telemóvel marcado como *opcional* com a mensagem informativa exata: *"Se fornecer o seu número de telemóvel poderá ser notificado quando o pedido for aprovado, rejeitado ou alterado."* (texto em Body-S, --text-muted). Opção "Qualquer sala disponível" com destaque visual claro vs. salas específicas.

**Botões.** Primário: fundo navy, texto azul-claro, Apparat Bold. Secundário: contorno navy, fundo transparente. Destrutivo (rejeitar/cancelar): vermelho de marca. Hover: navy-90. Cantos `--radius-sm/md`.

**Badges de estado.** Pequenas, Apparat, com a cor do estado correspondente (§3), fill claro + texto/borda na cor forte.

**Dashboard do administrador.** Cartões sobre `--surface-1/0`: Pedidos pendentes, Reservas do dia, Reservas expiradas, Ocupação das salas. Números grandes em Nocturne. Acento dourado para títulos de cartão. Sóbrio e tabular — é uma ferramenta de gestão.

**Visibilidade pública.** Mostrar sala, horário e nome de quem reservou. **Nunca** mostrar o telemóvel — garantir isto no front e no back.

**Estados vazios / loading.** Boa oportunidade para um símbolo musical em Noto Music (marca de água grande, em navy-30 ou azul-claro) com uma frase curta. Ex.: ecrã sem reservas → ornamento musical + "Ainda sem pedidos para este dia."

---

## 8. Iconografia e ornamento

- **Ícones de UI:** conjunto linear, fino e consistente (ex.: Lucide/Phosphor), tingidos a navy — combina com a serifa de alto contraste.
- **Símbolos musicais (Noto Music):** apenas ornamento. Composições espelhadas/rodadas (à imagem da página "composição identitária contemporânea") podem servir de **fundo decorativo subtil** em zonas não-funcionais (cabeçalho de página, rodapé, ecrãs vazios), sempre em azul-claro muito suave para não competir com o conteúdo.

---

## 9. Tom de voz (microcopy)

Português europeu, claro e cordial, institucional mas acessível (é uma associação musical da comunidade). Frases curtas, sem jargão. Tratamento por "você"/impessoal ("pode consultar", "submeta o pedido"). Confirmações calorosas mas sóbrias: *"Pedido submetido. Fica pendente até aprovação."* Erros úteis e não-culpabilizantes: *"Este horário já está reservado. Escolha outro bloco disponível."*

---

## 10. Checklist

- [ ] Confirmar **licenças webfont** de Nocturne Serif e Apparat; senão, usar fallbacks (Fraunces / Hanken Grotesk).
- [ ] Carregar **Noto Music** (Google Fonts) só para ornamento.
- [ ] Colar o bloco de `:root` (§6) como base de tokens.
- [ ] Implementar a grelha de horários com os 4 estados (§3) — cor **+** ícone/rótulo.
- [ ] Garantir que o telemóvel nunca é exposto na vista pública.
- [ ] Validar contraste AA do texto sobre cada estado.
