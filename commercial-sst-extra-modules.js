/* Módulos comerciais SST: registros isolados por empresa via commercial-supabase.js */
(()=>{
'use strict';
if(window.SSTCommercialModules)return;
const TYPES={
 apr:{title:'APR — Análise Preliminar de Riscos',fields:[['atividade','Atividade / serviço'],['local','Local'],['etapas','Etapas do trabalho'],['riscos','Perigos e riscos'],['controles','Medidas preventivas / EPIs'],['responsavel','Responsável técnico']]},
 extintores:{title:'Controle de Extintores',fields:[['identificacao','Identificação do extintor'],['local','Local / setor'],['tipo','Tipo / capacidade'],['validade','Validade (DD/MM/AAAA)'],['situacao','Situação / inspeção'],['providencias','Providências / recarga']]},
 mensal:{title:'Relatório Mensal SST',fields:[['competencia','Competência (MM/AAAA)'],['responsavel','Responsável técnico'],['atividades','Atividades realizadas'],['inspecoes','Inspeções e não conformidades'],['treinamentos','Treinamentos / DDS'],['pendencias','Pendências e ações corretivas'],['conclusao','Conclusão técnica']]},
 dds:{title:'Lista de Presença — DDS / Treinamento',fields:[['tema','Tema do treinamento'],['data','Data'],['turno','Turno'],['instrutor','Instrutor'],['participantes','Participantes (um por linha, com matrícula quando disponível)'],['observacoes','Observações']]}
};
const prefix='SST-COM-';let overlay=null,selected='',editing=null,rows=[];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cloud=()=>{const c=window.SSTCommercialCloud;if(!c?.configured)throw Error('Conexão comercial indisponível.');return c};
const isOurs=x=>String(x?.reportType||'').startsWith(prefix);
function docDef(record){
 const cfg=TYPES[record.module];const company=window.SST_DEMO_CONFIG||{};
 return {pageSize:'A4',pageMargins:[42,50,42,45],content:[
 {text:company.razaoSocial||company.nomeFantasia||'Sistema SST',fontSize:12,bold:true,alignment:'center',margin:[0,0,0,12]},
 {text:cfg.title,fontSize:16,bold:true,alignment:'center',margin:[0,0,0,18]},
 ...cfg.fields.map(([k,label])=>({stack:[{text:label,bold:true,fontSize:10,margin:[0,8,0,3]},{text:String(record.values?.[k]||'Não informado'),fontSize:10}]})),
 {text:'Documento gerado em '+new Date().toLocaleString('pt-BR'),fontSize:8,color:'#666666',margin:[0,25,0,0]}
 ],defaultStyle:{font:'Roboto'}};
}
function pdf(record){if(!window.pdfMake?.createPdf)throw Error('Gerador PDF indisponível.');window.pdfMake.createPdf(docDef(record)).download((record.module+'-'+(record.values?.competencia||record.values?.data||record.id)+'.pdf').replace(/[^a-z0-9._-]/gi,'_'))}
function ensureUI(){
 if(overlay)return;
 overlay=document.createElement('div');overlay.id='sst-commercial-modules';overlay.style='position:fixed;inset:0;background:#0009;z-index:99998;display:none;overflow:auto;padding:18px 8px';
 overlay.innerHTML='<section style="max-width:850px;margin:auto;background:white;color:#14202a;border-radius:14px;padding:20px;font:14px Arial,sans-serif;min-height:220px"><div style="display:flex;justify-content:space-between;gap:12px;align-items:center"><h2 id="scmTitle" style="margin:0;font-size:21px"></h2><button id="scmClose" type="button">✕ Fechar</button></div><p id="scmStatus" role="status" style="min-height:20px"></p><div id="scmBody"></div></section>';
 document.body.appendChild(overlay);
 overlay.querySelector('#scmClose').onclick=()=>{overlay.style.display='none'};
}
function status(msg,error=false){const e=overlay.querySelector('#scmStatus');e.textContent=msg;e.style.color=error?'#b91c1c':'#17613c'}
function button(label,fn){const b=document.createElement('button');b.type='button';b.textContent=label;b.style='margin:6px 7px 6px 0;padding:10px;border:1px solid #bbb;border-radius:7px;background:#f5f5f5;color:#111;cursor:pointer';b.onclick=fn;return b}
function form(record){
 const cfg=TYPES[selected],body=overlay.querySelector('#scmBody');body.replaceChildren();const f=document.createElement('form');
 const fields={};for(const [k,label] of cfg.fields){const wrap=document.createElement('label');wrap.style='display:block;margin:13px 0;font-weight:bold';wrap.textContent=label;const el=document.createElement('textarea');el.rows=k==='participantes'||k==='atividades'||k==='riscos'||k==='controles'?5:2;el.style='display:block;width:100%;box-sizing:border-box;padding:9px;margin-top:5px;border:1px solid #bbb;border-radius:5px;font:14px Arial';el.value=record?.values?.[k]||'';wrap.append(el);f.append(wrap);fields[k]=el}
 const actions=document.createElement('div');actions.append(button('← Histórico',()=>render()),button('💾 Salvar na nuvem',async()=>{const values=Object.fromEntries(Object.entries(fields).map(([k,e])=>[k,e.value.trim()]));if(!Object.values(values).some(Boolean)){status('Preencha os dados antes de salvar.',true);return}const save=actions.lastChild;save.disabled=true;status('Salvando...');try{const item={id:record?.id||prefix+selected+'-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),reportType:prefix+selected,module:selected,title:cfg.title,values,createdAt:record?.createdAt||new Date().toISOString()};await cloud().saveReport(item);status('Registro salvo na nuvem com sucesso.');await load();render()}catch(e){status('Não foi possível salvar: '+e.message,true)}finally{save.disabled=false}}));f.append(actions);body.append(f);
}
async function load(){rows=(await cloud().listReports()).filter(isOurs)}
function render(){
 const body=overlay.querySelector('#scmBody');body.replaceChildren();
 body.append(button('＋ Novo registro',()=>form(null)));
 const list=rows.filter(x=>x.module===selected);if(!list.length){const p=document.createElement('p');p.textContent='Nenhum registro salvo neste módulo.';body.append(p)}
 for(const item of list){const card=document.createElement('div');card.style='padding:12px;border:1px solid #ddd;margin:9px 0;border-radius:7px';const h=document.createElement('strong');h.textContent=(item.values?.atividade||item.values?.identificacao||item.values?.competencia||item.values?.tema||item.title||'Registro')+' — '+new Date(item.updatedAt||item.createdAt||Date.now()).toLocaleDateString('pt-BR');card.append(h,document.createElement('br'),button('Editar',()=>form(item)),button('Gerar PDF',()=>{try{pdf(item)}catch(e){status(e.message,true)}}));body.append(card)}
}
async function open(type){
 if(!TYPES[type])return;selected=type;ensureUI();overlay.style.display='block';overlay.querySelector('#scmTitle').textContent=TYPES[type].title;overlay.querySelector('#scmBody').replaceChildren();status('Carregando registros da empresa...');
 try{await cloud().loadContext();await load();status('');if(type==='apr'||type==='dds')form(null);else render()}catch(e){status('Não foi possível carregar os dados: '+e.message,true)}
}
window.SSTCommercialModules={open};
})();
