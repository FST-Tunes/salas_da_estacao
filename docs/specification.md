# Sistema de Gestão de Salas de Ensaio

## Objetivo

Desenvolver uma aplicação web para gerir as reservas das salas da Estação musical de Monção.

A aplicação deverá permitir que qualquer pessoa consulte a disponibilidade das salas e submeta pedidos de reserva, enquanto um administrador poderá aprovar, rejeitar e gerir esses pedidos.

---

# Salas

## Estrutura Inicial

* 8 salas de ensaio no piso superior.
* 1 sala grande no piso inferior.

Total inicial: **9 salas**.

## Configuração

O número de salas não deverá estar fixo no código.

O administrador deverá conseguir:

* Adicionar salas.
* Remover salas.
* Alterar nomes das salas.

---

# Utilizadores

## Utilizador Normal

Não necessita de criar conta.

Pode:

* Consultar disponibilidade das salas.
* Submeter pedidos de reserva.
* Ver reservas aprovadas.

## Administrador

Acede através de login.

Pode:

* Aprovar reservas.
* Rejeitar reservas.
* Alterar reservas.
* Mover reservas entre salas.
* Criar reservas recorrentes.
* Configurar parâmetros do sistema.

---

# Reservas

## Dados da Reserva

Cada pedido de reserva contém:

* Nome.
* Número de telemóvel (opcional).
* Data.
* Hora de início.
* Hora de fim.
* Sala específica ou opção "Qualquer sala disponível".

## Número de Telemóvel

O número de telemóvel é opcional.

Deve existir uma mensagem informativa:

> Se fornecer o seu número de telemóvel poderá ser notificado quando o pedido for aprovado, rejeitado ou alterado.

---

# Seleção de Horários

Os horários não devem ser introduzidos manualmente.

A interface deverá funcionar através de blocos de tempo de 30 minutos.

Exemplo:

* 18:00
* 18:30
* 19:00
* 19:30
* 20:00

O utilizador seleciona visualmente os blocos pretendidos.

## Duração Mínima

* 30 minutos.

## Duração Máxima

Ainda não definida.

---

# Disponibilidade

Os horários devem ser apresentados visualmente.

Estados sugeridos:

* Verde → Disponível.
* Amarelo → Pedido pendente.
* Vermelho → Reserva aprovada.

---

# Escolha de Sala

O utilizador pode:

## Opção 1

Selecionar uma sala específica.

Exemplo:

* Sala 1
* Sala 2
* Sala Grande

## Opção 2

Selecionar:

> Qualquer sala disponível

Neste caso o sistema poderá indicar as salas disponíveis para o período escolhido.

O administrador poderá decidir qual atribuir.

---

# Processo de Reserva

## Criação

1. Utilizador seleciona data.
2. Seleciona horário.
3. Escolhe sala específica ou qualquer sala disponível.
4. Introduz nome.
5. Introduz telemóvel (opcional).
6. Submete o pedido.

## Resultado

O pedido fica com estado:

* Pendente

---

# Estados da Reserva

Uma reserva pode estar nos seguintes estados:

* Pendente
* Aprovada
* Rejeitada
* Cancelada
* Concluída
* Expirada

---

# Reservas Pendentes

As reservas pendentes bloqueiam imediatamente o horário solicitado.

Não devem ser permitidos pedidos sobrepostos com:

* Reservas aprovadas.
* Reservas pendentes.

---

# Aprovação

Os pedidos não são aprovados automaticamente.

Devem ser analisados pelo administrador.

O administrador pode:

* Aprovar.
* Rejeitar.
* Alterar sala.
* Alterar horário.
* Encurtar duração.

---

# Expiração Automática

Se a hora de início da reserva for atingida e o pedido continuar pendente:

Pendente → Expirada

A reserva deixa de bloquear o horário.

---

# Reservas Recorrentes

Apenas administradores podem criar reservas recorrentes.

Exemplos:

* Todas as terças-feiras das 20h às 22h.
* Todos os sábados das 14h às 17h.

Utilizadores normais não podem criar reservas recorrentes.

---

# Visibilidade Pública

Todos os utilizadores podem visualizar:

* Sala.
* Horário.
* Nome da pessoa que efetuou a reserva.

Não devem visualizar:

* Número de telemóvel.

---

# Notificações

## Quando Notificar

O utilizador deve ser notificado quando:

* A reserva é aprovada.
* A reserva é rejeitada.
* A reserva é alterada.

## Condição

Apenas se tiver fornecido número de telemóvel.

## Canal

Por definir.

Possíveis opções:

* WhatsApp.
* SMS.

---

# Histórico

Todas as reservas devem ficar guardadas permanentemente.

Objetivos:

* Consulta histórica.
* Auditoria.
* Estatísticas futuras.

Nenhuma reserva deve ser eliminada automaticamente.

---

# Administração

## Login

Login único de administrador.

## Dashboard

O painel deverá apresentar:

* Pedidos pendentes.
* Reservas do dia.
* Reservas expiradas.
* Ocupação das salas.

## Gestão de Reservas

O administrador pode:

* Aprovar.
* Rejeitar.
* Editar.
* Mover.
* Cancelar.

---

# Configurações

O administrador deverá conseguir configurar:

## Número de Salas

Adicionar ou remover salas.

## Nomes das Salas

Alterar a designação das salas.

## Antecedência Máxima de Reserva

Valor por defeito:

* 30 dias

Deve ser configurável.

## Horário de Funcionamento

Valor inicial sugerido:

* 08:00 às 00:00

Deve ser configurável.

Nota: o horário poderá depender da disponibilidade de alguém para abrir as instalações.
