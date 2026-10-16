# Backup estável SST Comercial — 16/10/2026

Base de recuperação do sistema comercial SST.

## Código estável
- Commit de origem: `6c1dde7c27ae51bd8c4e84243027c2d3710dc326`
- Versão pública: `corefix02`
- Branch estável imutável de referência: `stable-corefix02-2026-10-16`

## Estado validado
- Login + Senha comercial funcionando.
- Empresa vinculada ao Login.
- Relatórios separados por `company_id`.
- RLS habilitada nas tabelas comerciais.
- Salvar inspeção funcionando no Supabase.
- Histórico e visualização funcionando.
- PDF testado e baixado com sucesso.
- Ata da CIPA salvando na nuvem comercial e pré-visualizando dentro do sistema.
- Interface móvel com módulos pesados sob demanda.

## Regra de recuperação
Não usar esta branch para desenvolvimento. Ela existe para restaurar o sistema em caso de regressão.
