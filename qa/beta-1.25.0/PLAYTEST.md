# Verificação da integração local 1.25.0

Execução automatizada real em Chrome 158, por HTTP. Este registro não substitui campanha humana integral.

- 149 verificações estruturais passaram em validate_alpha.rb.
- 30 testes VM dos efeitos passaram, incluindo ciclo, clipping, destinos, colisão dos projéteis, redução de movimento e limpeza.
- 11 padrões reais de inimigos gravados e decodificados, com tempo de reprodução correspondente ao update nativo de 20 Hz. Seis tipos e variações do Difícil; GIFs identificam o snapshot de origem.
- Tambor/Flautim também gravados no snapshot com correção do toque; captura vertical do Flautim e horizontal do Tambor disponíveis.
- 42 verificações dos novos painéis/HUDs passaram; incluem 14 verificações horizontais com teste geométrico contra todos os controles, em nove estados de HUD. Sem erros de página ou interseções medidas.
- A/B da abertura mobile da Usina: a falha original foi reproduzida; após o guard do mesmo gesto, o primeiro toque mantém o painel aberto, o próximo toca a referência, e Voltar fecha normalmente.
- Revisões técnica e artística independentes realizadas; os seis efeitos foram vistos antes, durante e depois dos golpes nas gravações.

Resultados completos, tentativas e falhas originais ficam em `../integration-1.25.0/native-flows/REPORT.json` e logs. As correções de fixtures referentes à interface antiga são explicitadas separadamente da correção de produção do toque. A última verificação de textos por plataforma é registrada no relatório de liberação da integração.

Teclado, toque e controle foram automatizados/emulados; sem teste em aparelho físico. A jornada inteira, da criação de um save à conclusão de todos os capítulos, não foi jogada manualmente nesta entrega.

Última distribuição: `da197840`. As 12 suítes têm última execução aprovada; módulo da Lumi foi repetido por teclado/toque e rodapé horizontal em três estados no artefato final, sem injeção de CSS. Relatório de proveniência: `../integration-1.25.0/RELEASE.json`.

Em 26/11/2026, o usuário informou ter testado a campanha completa e autorizou o merge. Este é um registro de confirmação do usuário, separado dos testes automatizados do agente.
