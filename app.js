/* Hogar al Día — app 100% local, sin bibliotecas externas ni llamadas a servidores */
(() => {
  'use strict';
  const STORAGE_KEY = 'hogar-al-dia:v1';
  const VERSION = 1;
  const LIMIT = 9999999999;
  const categories = [
    ['Arriendo','🏠'],['Luz','💡'],['Agua','💧'],['Crédito banco','💳'],
    ['Celular','📱'],['TAG','🚘'],['Internet','🌐'],['Streaming','🎬'],
    ['Compras en efectivo','🛍️'],['Falabella CMR','💳'],['Gas','🔥'],
    ['Ahorro','🐷'],['Otros','📦'],['Bencina','⛽'],['Comida','🛒'],['Natura','🌿']
  ];
  const $ = (id) => document.getElementById(id);
  const fmt = (n) => `${n < 0 ? '−' : ''}$${Math.abs(Math.round(n)).toLocaleString('es-CL')}`;
  const number = (n) => Math.min(LIMIT, Math.max(0, Math.round(Number(n) || 0)));
  const uid = () => typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
  const safe = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const expenseTemplate = () => categories.map(([name, icon]) => ({id:uid(),name,icon, budget:0,paid:0,note:''}));
  const incomeTemplate = () => [{id:uid(),name:'Sueldo',budget:0,paid:0}];
  const newMonth = () => ({incomes:incomeTemplate(),expenses:expenseTemplate()});
  function sanitizeRow(row, income=false) {
    return {id:uid(),name:String(row?.name ?? '').slice(0,50).trim() || (income?'Ingreso':'Gasto'),
      ...(!income ? {icon:String(row?.icon ?? '📋').slice(0,5),note:String(row?.note ?? '').slice(0,300)} : {}),
      budget:number(row?.budget),paid:number(row?.paid)};
  }
  function sanitizeRoot(root) {
    if (!root || root.version !== VERSION || !root.months || typeof root.months !== 'object' || Array.isArray(root.months)) throw new Error('Formato incompatible');
    const months = Object.create(null);
    let found=0;
    for (const [key,month] of Object.entries(root.months)) {
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(key)) continue;
      if (!Array.isArray(month?.incomes) || !Array.isArray(month?.expenses) || month.incomes.length > 60 || month.expenses.length > 200) throw new Error('Contenido de respaldo inválido');
      months[key] = {incomes:month.incomes.map(x=>sanitizeRow(x,true)),expenses:month.expenses.map(x=>sanitizeRow(x))};
      if (++found > 120) throw new Error('Demasiados meses en respaldo');
    }
    if (!found) throw new Error('El respaldo no contiene meses válidos');
    return {version:VERSION,months};
  }
  function load() {
    try {const raw=localStorage.getItem(STORAGE_KEY);return raw?sanitizeRoot(JSON.parse(raw)):{version:VERSION,months:Object.create(null)};}
    catch(err){console.warn('Error al leer respaldo local',err);setTimeout(()=>toast('No se pudo leer la información guardada. No borres el navegador.'),400);return {version:VERSION,months:Object.create(null)};}
  }
  let app=load(), activeMonth=monthKey(new Date()), filter='all', editingId=null, toastTimer;
  function save() {try {localStorage.setItem(STORAGE_KEY,JSON.stringify(app));return true;}catch(err){console.error(err);toast('No se pudo guardar. Libera espacio o descarga un respaldo.');return false;}}
  function monthData(key=activeMonth) {
    if (!app.months[key]) {
      const closest=Object.keys(app.months).filter(x=>x<key).sort().pop();
      const previous=closest?app.months[closest]:newMonth();
      app.months[key]={incomes:previous.incomes.map(x=>({...x,id:uid(),paid:0})),expenses:previous.expenses.map(x=>({...x,id:uid(),paid:0}))};
      save();
    }
    return app.months[key];
  }
  function totals() {
    const month=monthData();const total=(items,field)=>items.reduce((s,x)=>s+number(x[field]),0);
    const incomePlan=total(month.incomes,'budget'), incomePaid=total(month.incomes,'paid'),spent=total(month.expenses,'paid'),expensePlan=total(month.expenses,'budget');
    return {incomePlan,incomePaid,spent,expensePlan,available:incomePaid-spent,
      balance:incomePlan-expensePlan,remaining:month.expenses.reduce((s,x)=>s+Math.max(0,x.budget-x.paid),0)};
  }
  function setText(id,text){$(id).textContent=text;}
  function setNegative(id,amount){$(id).classList.toggle('negative',amount<0);}
  function summary() {
    const t=totals();
    setText('availableAmount',fmt(t.available));setNegative('availableAmount',t.available);
    setText('availableFoot',t.incomePaid===0 && t.spent===0 && t.expensePlan===0 ? 'Ingresos recibidos menos gastos pagados' : `Tras cubrir el presupuesto pendiente quedarían ${fmt(t.available-t.remaining)}`);
    setText('plannedBalance',fmt(t.balance));setNegative('plannedBalance',t.balance);
    setText('remainingBudget',fmt(t.remaining));setText('receivedIncome',fmt(t.incomePaid));
    setText('incomeDifference',`De ${fmt(t.incomePlan)} presupuestados`);
    setText('expensePaid',fmt(t.spent));setText('expensePlanned',fmt(t.expensePlan));
    setText('incomePlanned',fmt(t.incomePlan));setText('incomeActual',fmt(t.incomePaid));
    setText('footBudget',fmt(t.expensePlan));setText('footPaid',fmt(t.spent));setText('footRemaining',fmt(t.remaining));
    const pct=t.expensePlan===0?(t.spent>0?100:0):Math.round(t.spent/t.expensePlan*100);
    setText('expensePercent',`${pct}%`);
    $('expenseProgressFill').style.width=`${Math.max(0,Math.min(pct,100))}%`;
    $('expenseProgress').setAttribute('aria-valuenow',String(Math.max(0,Math.min(pct,100))));
    $('expenseProgress').setAttribute('aria-label',`${pct}% del presupuesto de gastos utilizado`);
    $('expenseProgressFill').style.background=pct>100?'#d35c55':'';
    setText('expenseCount',String(monthData().expenses.length));
  }
  function status(row) {
    if(row.budget===0)return row.paid>0?{name:'Sin presupuesto',cls:'over',type:'over'}:{name:'Sin monto',cls:'blank',type:'blank'};
    if(row.paid>row.budget)return {name:'Excedido',cls:'over',type:'over'};
    if(row.paid===row.budget)return {name:'Pagado',cls:'paid',type:'paid'};
    if(row.paid===0)return {name:'Pendiente',cls:'pending',type:'pending'};
    return {name:'Pago parcial',cls:'partial',type:'pending'};
  }
  function iconFor(name){const lower=name.toLowerCase();const choice=categories.find(c=>c[0].toLowerCase()===lower);return choice?.[1]??'📋';}
  function displayed(row) {
    const s=status(row);
    return filter==='all'||(filter==='pending' && s.type==='pending')||(filter==='paid' && s.type==='paid')||(filter==='over' && s.type==='over');
  }
  function renderRows() {
    const list=$('expenseList');list.replaceChildren();const rows=monthData().expenses.filter(displayed);
    for(const row of rows){
      const node=document.createElement('div');node.className='expense-row';node.dataset.id=row.id;
      const s=status(row),left=row.budget-row.paid;
      node.innerHTML=`<div class="expense-name"><span class="expense-icon" aria-hidden="true">${safe(row.icon||iconFor(row.name))}</span><div class="expense-info"><strong title="${safe(row.name)}">${safe(row.name)}</strong>${row.note?`<small title="${safe(row.note)}">${safe(row.note)}</small>`:''}</div></div>
      <label class="money-field budget-field" data-label="Presupuestado"><input data-kind="budget" aria-label="Presupuesto de ${safe(row.name)}" type="number" inputmode="numeric" min="0" max="${LIMIT}" step="1" value="${row.budget}"></label>
      <label class="money-field paid-field" data-label="Pagado"><input data-kind="paid" aria-label="Pagado de ${safe(row.name)}" type="number" inputmode="numeric" min="0" max="${LIMIT}" step="1" value="${row.paid}"></label>
      <div class="rest"><strong class="rest-money ${left<0?'negative':''}">${fmt(Math.abs(left))}${left<0?' extra':''}</strong><span class="status ${s.cls}">${s.name}</span></div>
      <button class="icon-btn edit-expense" aria-label="Editar ${safe(row.name)}" title="Editar gasto">⋯</button>`;
      list.appendChild(node);
    }
    $('listEmpty').hidden=rows.length>0;
  }
  function refreshRow(node,row){const st=status(row),left=row.budget-row.paid;node.querySelector('.rest-money').textContent=`${fmt(Math.abs(left))}${left<0?' extra':''}`;node.querySelector('.rest-money').classList.toggle('negative',left<0);const badge=node.querySelector('.status');badge.className=`status ${st.cls}`;badge.textContent=st.name;}
  function render() {
    const parts=activeMonth.split('-');const date=new Date(Number(parts[0]),Number(parts[1])-1,1);
    setText('monthLabel',new Intl.DateTimeFormat('es-CL',{month:'long',year:'numeric'}).format(date));
    document.querySelectorAll('[data-filter]').forEach(el=>{const is=el.dataset.filter===filter;el.classList.toggle('active',is);el.setAttribute('aria-pressed',String(is));});
    summary();renderRows();
  }
  function moveMonth(offset){const [year,month]=activeMonth.split('-').map(Number);activeMonth=monthKey(new Date(year,month-1+offset,1));monthData();filter='all';render();}
  function toast(message){const n=$('toast');n.textContent=message;n.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>n.classList.remove('visible'),3300);}
  function openNotice(title,paragraphs){setText('noticeTitle',title);const n=$('noticeContent');n.replaceChildren();for(const para of paragraphs){const p=document.createElement('p');p.textContent=para;n.appendChild(p);}$('noticeDialog').showModal();}
  function openExpense(id=null){editingId=id;const existing=id?monthData().expenses.find(e=>e.id===id):null;
    setText('expenseDialogTitle',existing?'Editar gasto':'Agregar gasto');$('expenseName').value=existing?.name??'';
    $('expenseBudget').value=existing?.budget??0;$('expensePaidInput').value=existing?.paid??0;$('expenseNote').value=existing?.note??'';
    $('deleteExpense').hidden=!existing;$('expenseDialog').showModal();$('expenseName').focus();}
  function fieldIncome(name,budget,paid,id){return `<div class="income-edit-row" data-id="${safe(id)}"><div class="income-row-top"><input class="income-edit-name" type="text" maxlength="50" aria-label="Nombre de ingreso" placeholder="Ej. Sueldo" value="${safe(name)}"><button class="income-remove" type="button" aria-label="Eliminar ingreso" title="Eliminar ingreso">×</button></div><div class="field-grid"><div><label>Previsto ($)</label><input class="income-budget" inputmode="numeric" type="number" min="0" max="${LIMIT}" step="1" value="${budget}"></div><div><label>Recibido ($)</label><input class="income-paid" inputmode="numeric" type="number" min="0" max="${LIMIT}" step="1" value="${paid}"></div></div></div>`;}
  function openIncome(){$('incomeEditor').innerHTML=monthData().incomes.map(r=>fieldIncome(r.name,r.budget,r.paid,r.id)).join('');$('incomeDialog').showModal();}
  function fileDownload(name,type,body){const url=URL.createObjectURL(new Blob([body],{type}));const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),15000);}
  function csvValue(v){let val=String(v??'');if(/^[\s]*[=+\-@]/.test(val))val=`'${val}`;return `"${val.replace(/"/g,'""')}"`;}
  function exportCsv(){const month=monthData();const rows=[['tipo','concepto','presupuestado','pagado','pendiente','detalle','mes'],...month.incomes.map(r=>['Ingreso',r.name,r.budget,r.paid,'','',activeMonth]),...month.expenses.map(r=>['Gasto',r.name,r.budget,r.paid,Math.max(0,r.budget-r.paid),r.note,activeMonth])];fileDownload(`hogar-al-dia-${activeMonth}.csv`,'text/csv;charset=utf-8','\ufeff'+rows.map(r=>r.map(csvValue).join(';')).join('\r\n'));toast('CSV descargado.');}
  function exportBackup(){fileDownload(`hogar-al-dia-respaldo-${monthKey(new Date())}.json`,'application/json;charset=utf-8',JSON.stringify(app,null,2));toast('Respaldo descargado. Guárdalo en un lugar seguro.');}
  $('prevMonth').addEventListener('click',()=>moveMonth(-1));$('nextMonth').addEventListener('click',()=>moveMonth(1));
  document.querySelectorAll('.filter').forEach(btn=>btn.addEventListener('click',()=>{filter=btn.dataset.filter;render();}));
  $('newExpense').addEventListener('click',()=>openExpense());$('editIncome').addEventListener('click',openIncome);
  $('privacyBtn').addEventListener('click',()=>openNotice('Tus datos son locales',[
    'Tus montos no se suben a GitHub ni a un servidor. Solo se guardan en el almacenamiento de este navegador o acceso directo.',
    'No hay sincronización entre celulares, computadores ni navegadores. Si borras los datos del navegador o pierdes el dispositivo, podrías perder la información.',
    'Descarga respaldos JSON periódicamente y guárdalos de forma privada. El almacenamiento local no tiene cifrado propio: protege el acceso a tu dispositivo.'
  ]));
  $('infoAvailable').addEventListener('click',()=>openNotice('Cómo se calculan tus saldos',[
    'Disponible ahora = ingresos que ya recibiste − todos los gastos que marcaste como pagados.',
    'Saldo previsto = ingresos que presupuestaste − gastos que presupuestaste.',
    'Presupuesto pendiente = suma de la parte aún no gastada o pagada de cada categoría. No significa necesariamente deuda exigible: también incluye dinero reservado para comida, bencina, etc.',
    'Si el pago de un gasto supera su presupuesto, se marca como excedido y la diferencia extra se refleja en disponible ahora.'
  ]));
  $('expenseList').addEventListener('input',e=>{
    const inp=e.target.closest('input[data-kind]');if(!inp)return;const node=inp.closest('.expense-row');const row=monthData().expenses.find(x=>x.id===node?.dataset.id);if(!row)return;
    row[inp.dataset.kind]=number(inp.value);save();summary();refreshRow(node,row);
  });
  $('expenseList').addEventListener('change',e=>{if(e.target.matches('input[data-kind]'))renderRows();});
  $('expenseList').addEventListener('click',e=>{const btn=e.target.closest('.edit-expense');if(btn)openExpense(btn.closest('.expense-row').dataset.id);});
  $('expenseForm').addEventListener('submit',e=>{
    e.preventDefault();const name=$('expenseName').value.trim();if(!name){$('expenseName').focus();toast('Escribe el nombre del gasto.');return;}
    const budget=number($('expenseBudget').value),paid=number($('expensePaidInput').value),note=$('expenseNote').value.trim();const month=monthData();
    if(editingId){const row=month.expenses.find(x=>x.id===editingId);if(row)Object.assign(row,{name,budget,paid,note,icon:row.icon||iconFor(name)});}
    else month.expenses.push({id:uid(),name,budget,paid,note,icon:iconFor(name)});
    if(save()){$('expenseDialog').close();filter='all';render();toast('Gasto guardado.');}
  });
  $('deleteExpense').addEventListener('click',()=>{if(!editingId||!confirm('¿Eliminar este gasto solo del mes seleccionado?'))return;monthData().expenses=monthData().expenses.filter(x=>x.id!==editingId);if(save()){$('expenseDialog').close();render();toast('Gasto eliminado del mes.');}});
  $('incomeEditor').addEventListener('click',e=>{const btn=e.target.closest('.income-remove');if(btn){btn.closest('.income-edit-row').remove();}});
  $('addIncome').addEventListener('click',()=>{$('incomeEditor').insertAdjacentHTML('beforeend',fieldIncome('',0,0,uid()));const inputs=$('incomeEditor').querySelectorAll('.income-edit-name');inputs[inputs.length-1].focus();});
  $('incomeForm').addEventListener('submit',e=>{
    e.preventDefault();const incomes=[];for(const row of $('incomeEditor').querySelectorAll('.income-edit-row')){
      const name=row.querySelector('.income-edit-name').value.trim();if(!name){row.querySelector('.income-edit-name').focus();toast('Escribe el nombre de cada ingreso.');return;}
      incomes.push({id:uid(),name,budget:number(row.querySelector('.income-budget').value),paid:number(row.querySelector('.income-paid').value)});
    }
    monthData().incomes=incomes;if(save()){$('incomeDialog').close();render();toast('Ingresos guardados.');}
  });
  document.querySelectorAll('[data-close]').forEach(btn=>btn.addEventListener('click',()=>$(btn.dataset.close).close()));
  document.querySelectorAll('dialog').forEach(dlg=>dlg.addEventListener('click',(e)=>{if(e.target===dlg)dlg.close();}));
  $('exportBackup').addEventListener('click',exportBackup);$('exportCsv').addEventListener('click',exportCsv);
  $('importBackup').addEventListener('click',()=>$('backupFile').click());
  $('backupFile').addEventListener('change',async e=>{
    const file=e.target.files?.[0];e.target.value='';if(!file)return;
    try{if(file.size>2_000_000)throw new Error('El archivo supera 2 MB');const parsed=sanitizeRoot(JSON.parse(await file.text()));
      if(!confirm('Restaurar sustituirá TODOS los meses guardados en este dispositivo. ¿Ya descargaste un respaldo de lo actual?'))return;
      const old=app;app=parsed;if(!save()){app=old;return;}if(!app.months[activeMonth])activeMonth=Object.keys(app.months).sort().pop();filter='all';render();toast('Respaldo restaurado correctamente.');
    }catch(err){console.error(err);toast('El archivo no es un respaldo compatible de Hogar al Día.');}
  });
  monthData();render();
  if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));}
})();