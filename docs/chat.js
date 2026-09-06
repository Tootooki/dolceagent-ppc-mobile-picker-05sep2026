import {chatViewportInsets} from './chat-viewport.mjs?v=74';
import {TOOLS,FAQ,PRODUCTS,createState,roomById,addMessage,createRoom,automaticReply,actionPack,discountScenario,searchMessages,exportConversation,money} from './chat-model.mjs?v=65';

const byId=id=>document.getElementById(id);
const widget=byId('chat-widget'),panel=byId('chat-popup'),launcher=byId('chat-launcher'),menu=byId('menu-backdrop'),shell=document.querySelector('.workbook-shell');
const input=byId('chat-input'),messages=byId('chat-messages'),submit=byId('chat-submit'),tray=byId('chat-tool-panel'),content=byId('chat-tool-content');
const state=createState(),timers=new Set(),objectURLs=new Set();
let currentTool=null,toolOpener=null,voiceTimer=null,voiceSeconds=0,voiceMuted=false,voiceRoom=null,speechOwned=false;
const element=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node};
const button=(text,callback,className='')=>{const node=element('button',className,text);node.type='button';node.addEventListener('click',callback);return node};
const status=text=>byId('chat-status').textContent=text;
const room=()=>roomById(state);
const later=(callback,delay)=>{const id=setTimeout(()=>{timers.delete(id);callback()},delay);timers.add(id);return id};
const scrollEnd=()=>{messages.scrollTop=messages.scrollHeight};
const setRoomsOpen=open=>{panel.dataset.rooms=open?'open':'closed';byId('chat-rooms-toggle').setAttribute('aria-expanded',String(open))};
const closeTool=({focus=false}={})=>{const hadFocus=tray.contains(document.activeElement);tray.hidden=true;panel.dataset.toolOpen='false';currentTool=null;messages.inert=false;if(focus||hadFocus)(toolOpener?.isConnected&&!toolOpener.closest('[hidden]')?toolOpener:byId('chat-tools')).focus({preventScroll:true})};
const refreshComposer=()=>{room().draft=input.value;input.placeholder=room().pending.length?'Message… · '+room().pending.length+' attached':'Message your AI team…';input.style.height='44px';input.style.height=Math.min(88,Math.max(44,input.scrollHeight))+'px';submit.disabled=!input.value.trim()&&!room().pending.length};

function renderRooms(){
  const nav=byId('chat-rooms');nav.replaceChildren();
  for(const item of state.rooms){
    const node=button('',()=>selectRoom(item.id),'room-button');node.setAttribute('aria-label',item.title+(item.unread?' · '+item.unread+' unread':''));node.title=item.title;
    if(item.id===state.active)node.setAttribute('aria-current','page');
    node.append(element('span','room-avatar',item.short));
    const copy=element('span','room-copy');copy.append(element('strong','',item.title),element('small','',item.messages.at(-1)?.text||'New conversation'));node.append(copy);
    if(item.unread)node.append(element('span','room-unread',String(item.unread)));
    nav.append(node);
  }
}
function attachmentView(file){
  const node=element('div','message-attachment');
  if(file.url){const img=element('img');img.src=file.url;img.alt=file.name+' local preview';node.append(img)}
  node.append(element('span','',file.name+' · '+Math.max(1,Math.round(file.size/1024))+' KB · local only'));return node;
}
function renderMessages(){
  const nearBottom=messages.scrollHeight-messages.scrollTop-messages.clientHeight<80,previousTop=messages.scrollTop;
  messages.replaceChildren();
  for(const item of room().messages){
    const article=element('article','chat-message'+(item.role==='user'?' from-user':''));article.dataset.messageId=item.id;
    article.append(element('small','',item.author+' / '+(item.role==='user'?'YOU · LOCAL':'DEMO AI')),element('p','',item.text));
    for(const file of item.attachments)article.append(attachmentView(file));
    if(item.card){const card=element('div','message-card');card.append(element('strong','',item.card.title),element('p','',item.card.value),element('small','',item.card.note||'DEMO · NOT APPLIED'));article.append(card)}
    const actions=element('div','message-actions');
    const pin=button(state.pins.includes(item.id)?'SAVED':'SAVE',()=>{state.pins.includes(item.id)?state.pins.splice(state.pins.indexOf(item.id),1):state.pins.push(item.id);renderMessages();status('Saved messages updated')});pin.setAttribute('aria-pressed',String(state.pins.includes(item.id)));actions.append(pin);
    if(item.tool)actions.append(button('OPEN '+(TOOLS.find(tool=>tool[0]===item.tool)?.[1]||'TOOL').toUpperCase(),event=>openTool(item.tool,event.currentTarget)));
    if(item.approvalId){const approval=state.approvals.find(a=>a.id===item.approvalId);actions.append(button(approval.status==='pending'?'REVIEW DRAFT':approval.status.toUpperCase()+' / DEMO',event=>openTool('approvals',event.currentTarget)))}
    article.append(actions);messages.append(article);
  }
  if(nearBottom)scrollEnd();else messages.scrollTop=previousTop;
}
function renderAttachments(){
  const target=byId('chat-attachments');target.hidden=!room().pending.length;target.replaceChildren();
  for(const file of room().pending){
    const chip=element('div','attachment-chip');if(file.url){const img=element('img');img.src=file.url;img.alt='Pending image';chip.append(img)}
    chip.append(element('span','',file.name),button('×',()=>{room().pending=room().pending.filter(value=>value!==file);releaseURL(file.url);renderAttachments();refreshComposer()}));target.append(chip);
  }
}
function selectRoom(id){
  if(!roomById(state,id))return;if(id!==state.active)stopVoice();room().draft=input.value;state.active=id;room().unread=0;
  closeTool();setRoomsOpen(false);byId('chat-room-title').textContent=room().title;byId('chat-room-subtitle').textContent=room().subtitle;
  input.value=room().draft;renderRooms();renderMessages();renderAttachments();refreshComposer();scrollEnd();status('Demo conversation · nothing is sent');
}
function post(roomId,data){
  const message=addMessage(state,roomId,data);renderRooms();if(roomId===state.active){renderMessages();if(data.role==='user')scrollEnd()}return message;
}
function receive(roomId,data,delay=900){
  if(roomId===state.active&&!panel.hidden)status(data.author+' is composing a demo reply…');
  later(()=>{post(roomId,data);if(roomId===state.active)status('Scripted reply received · not live AI')},delay);
}
function greet(){
  if(state.greeted)return;state.greeted=true;
  receive('team',{author:'NOVA',text:'Welcome aboard. Your AI team is here for a rehearsal. Try a question, an image or a voice conversation.',tool:'voice'},350);
  receive('team',{author:'ATLAS',text:'I have four action presets ready: PPC, SEO, Stock and Pricing. Choose one and I’ll draft a sample plan.',tool:'actions'},1700);
  receive('discounts',{author:'ECHO',text:'The discount sandbox is ready. Try a 10% or 15% scenario with fictional figures.',tool:'discounts'},2600);
}
function updateViewport(){
  if(panel.hidden)return;
  const typing=panel.contains(document.activeElement)&&['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName);
  const fit=chatViewportInsets({shell:shell.getBoundingClientRect(),viewport:window.visualViewport,
    typing,wasKeyboard:widget.dataset.keyboard==='true'});
  widget.style.setProperty('--chat-keyboard-inset',fit.bottom+'px');
  widget.style.setProperty('--chat-keyboard-top',fit.top+'px');
  widget.dataset.short=String(fit.short);
  widget.dataset.keyboard=String(fit.keyboard);
}
function stopVoice(){
  if(voiceTimer!==null)clearInterval(voiceTimer);voiceTimer=null;
  if(speechOwned&&window.speechSynthesis)window.speechSynthesis.cancel();speechOwned=false;
}
function closeChat({restoreFocus=true}={}){
  const wasOpen=!panel.hidden;stopVoice();panel.hidden=true;widget.dataset.open='false';widget.dataset.keyboard='false';widget.style.setProperty('--chat-keyboard-inset','0px');widget.style.setProperty('--chat-keyboard-top','0px');
  launcher.setAttribute('aria-expanded','false');launcher.setAttribute('aria-label','Open chat');
  if(panel.contains(document.activeElement))document.activeElement.blur();
  if(wasOpen&&restoreFocus&&!launcher.hidden)launcher.focus({preventScroll:true});
}
function openChat(){
  if(!menu.hidden)return;panel.hidden=false;widget.dataset.open='true';launcher.setAttribute('aria-expanded','true');launcher.setAttribute('aria-label','Close chat');
  selectRoom(state.active);updateViewport();panel.focus({preventScroll:true});greet();
}
function releaseURL(url){if(url&&objectURLs.has(url)){URL.revokeObjectURL(url);objectURLs.delete(url)}}
function attachFiles(files){
  let rejected=0;
  for(const file of [...files]){
    if(room().pending.length>=4||file.size>10*1024*1024){rejected++;continue}
    const isImage=['image/png','image/jpeg','image/webp','image/gif'].includes(file.type);
    const url=isImage?URL.createObjectURL(file):null;if(url)objectURLs.add(url);
    room().pending.push({name:file.name,size:file.size,type:file.type,url});
  }
  renderAttachments();refreshComposer();status(rejected?'Some files skipped. Limit: 4 files, 10 MB each.':'Attached locally. Files are never uploaded.');
}
function sendMessage(event){
  event.preventDefault();if(panel.hidden)return;const text=input.value.trim().slice(0,2000),attachments=[...room().pending];if(!text&&!attachments.length)return;
  const id=state.active;closeTool();post(id,{author:'YOU',role:'user',text:text||'Shared a local attachment',attachments});
  room().pending=[];room().draft='';input.value='';renderAttachments();refreshComposer();scrollEnd();
  const reply=automaticReply(attachments.length?'attachment '+text:text,id);receive(id,reply);
  input.focus({preventScroll:true});
}
function intro(text){content.append(element('p','tool-intro',text))}
function field(parent,labelText,type='text',value=''){
  const label=element('label','',labelText),control=element(type==='textarea'?'textarea':'input');if(type!=='textarea')control.type=type;control.value=value;
  label.append(control);parent.append(label);return control;
}
function selectField(parent,labelText,values){
  const label=element('label','',labelText),control=element('select');
  for(const [value,text] of values){const option=element('option','',text);option.value=value;control.append(option)}label.append(control);parent.append(label);return control;
}
function addTask(text){if(text.trim())state.tasks.push({id:'task'+(++state.sequence),text:text.trim().slice(0,300),done:false})}
function createApproval(title,text){
  const id='approval'+(++state.sequence);state.approvals.push({id,title,text,status:'pending',roomId:state.active});
  post(state.active,{author:'ATLAS',text,card:{title,value:'Ready for demo review',note:'Fictional draft · no external change'},approvalId:id});closeTool();scrollEnd();status('Draft added to the demo approval queue');
}
function showActions(){
  intro('Generate a sample plan. All presets create drafts only.');
  const form=element('div','tool-form'),preset=selectField(form,'Action preset',['PPC','SEO','STOCK','PRICING'].map(value=>[value,value]));
  const preview=element('div','tool-output');const render=()=>{const pack=actionPack(preset.value);preview.textContent=pack.text};preset.addEventListener('change',render);render();
  form.append(preview,button('GENERATE 3 ACTIONS',()=>{const pack=actionPack(preset.value);createApproval(pack.title,pack.text)}));content.append(form);
}
function showDiscounts(calculator=false){
  intro(calculator?'Enter your own scenario. Contribution excludes fees, ads and tax.':'Fictional product prices. A discount draft never changes your store.');
  const form=element('div','tool-form');
  const product=selectField(form,'Sample product',PRODUCTS.map((p,i)=>[String(i),p.name]));
  const price=field(form,'Price ($)','number',String(PRODUCTS[0].price)),cost=field(form,'Cost ($)','number',String(PRODUCTS[0].cost));
  price.min='0.01';price.step='0.01';cost.min='0';cost.step='0.01';
  const percent=field(form,'Discount (%)','number',calculator?'0':'10');percent.min='0';percent.max='90';percent.step='1';
  const result=element('output');let scenario;
  const calculate=()=>{scenario=discountScenario(Number(price.value),Number(cost.value),Number(percent.value));result.textContent=scenario?'New price '+money(scenario.price)+'\nSaving '+money(scenario.saving)+'\nContribution '+money(scenario.contribution)+'\nContribution margin '+scenario.margin+'%':'Enter valid price, cost and 0–90% discount.'};
  for(const control of [price,cost,percent])control.addEventListener('input',calculate);
  product.addEventListener('change',()=>{const value=PRODUCTS[Number(product.value)];price.value=String(value.price);cost.value=String(value.cost);calculate()});
  form.append(result,button(calculator?'INSERT RESULT IN CHAT':'CREATE DISCOUNT DRAFT',()=>{calculate();if(!scenario)return;
    const text=product.options[product.selectedIndex].text+' · '+percent.value+'% off\nNew price '+money(scenario.price)+'\nContribution before fees/ads/tax '+money(scenario.contribution)+' ('+scenario.margin+'%).';
    if(calculator){post(state.active,{author:'NOVA',text:'Scenario calculation\n'+text});closeTool();scrollEnd()}else createApproval('Discount / hypothetical offer',text);
  }));content.append(form);calculate();
}
function showFAQ(){
  intro('Everything in this workspace is a local demonstration.');
  for(const [question,answer] of FAQ){const row=element('div','tool-row'),details=element('details');details.append(element('summary','',question),element('p','',answer));row.append(details);content.append(row)}
  content.append(button('ASK IN SUPPORT CHAT',()=>{selectRoom('support');input.value='How does this demo work?';refreshComposer();input.focus({preventScroll:true})}));
}
function showSearch(){
  const form=element('div','tool-form'),query=field(form,'Search all conversations','search'),results=element('div');content.append(form,results);
  const render=()=>{results.replaceChildren();const found=searchMessages(state,query.value);for(const hit of found){const row=element('div','tool-row');row.append(element('p','',hit.room.title+' / '+hit.message.text.slice(0,180)),button('OPEN CONVERSATION',()=>{selectRoom(hit.room.id);const target=[...messages.children].find(node=>node.dataset.messageId===hit.message.id);target?.scrollIntoView({block:'nearest'})}));results.append(row)}if(!found.length)results.append(element('p','tool-intro',query.value?'No messages found.':'Type a word to search.'))};query.addEventListener('input',render);render();
}
function showPins(){
  intro('Save any message using its SAVE button.');
  const saved=state.rooms.flatMap(r=>r.messages.filter(m=>state.pins.includes(m.id)).map(message=>({r,message})));
  if(!saved.length)intro('No saved messages yet.');
  for(const {r,message} of saved){const row=element('div','tool-row');row.append(element('p','',r.title+' / '+message.text),button('OPEN CHAT',()=>selectRoom(r.id)),button('UNSAVE',()=>{state.pins=state.pins.filter(id=>id!==message.id);openTool('pins')}));content.append(row)}
}
function showNotes(){
  intro('Scratchpad for '+room().title+'. Saved only until this page is refreshed.');
  const target=room(),form=element('div','tool-form'),note=field(form,'Private note','textarea',target.note);note.rows=6;note.maxLength=4000;
  note.addEventListener('input',()=>{target.note=note.value;status('Note saved locally')});
  form.append(button('INSERT NOTE IN CHAT',()=>{if(!note.value.trim())return;post(target.id,{author:'YOU',role:'user',text:'Note: '+note.value.trim()});closeTool();scrollEnd()}));content.append(form);
}
function showTasks(){
  intro('A local checklist. Nothing is assigned outside this demo.');
  const form=element('form','tool-form'),text=field(form,'New task','text');text.maxLength=300;
  const add=element('button','','ADD TASK');add.type='submit';form.append(add);
  form.addEventListener('submit',event=>{event.preventDefault();addTask(text.value);openTool('tasks')});content.append(form);
  intro(state.tasks.filter(task=>task.done).length+' / '+state.tasks.length+' complete');
  for(const task of state.tasks){const row=element('div','tool-row'),toggle=button((task.done?'DONE ✓':'MARK DONE')+' · '+task.text,()=>{task.done=!task.done;openTool('tasks')});toggle.setAttribute('aria-pressed',String(task.done));row.append(toggle);content.append(row)}
}
function showApprovals(){
  intro('Approve or reject locally. No discount, price or campaign is applied.');
  if(!state.approvals.length)content.append(button('CREATE AN ACTION DRAFT',()=>openTool('actions')));
  for(const draft of state.approvals){const row=element('div','tool-row');row.append(element('strong','',draft.title),element('p','',draft.text),element('p','',draft.status.toUpperCase()+' / DEMO ONLY'));
    if(draft.status==='pending'){const actions=element('div','tool-actions');for(const choice of ['approved','rejected'])actions.append(button(choice==='approved'?'APPROVE DEMO':'REJECT',()=>{draft.status=choice;if(choice==='approved')addTask('Review draft: '+draft.title);renderMessages();openTool('approvals');status('Demo status updated. Nothing applied.')}));row.append(actions)}content.append(row)}
}
function showFiles(){
  intro('Files are local previews, not uploads or AI analysis. Refreshing removes them.');
  const actions=element('div','tool-actions');actions.append(button('+ IMAGE',()=>byId('chat-photo-input').click()),button('+ FILE',()=>byId('chat-file-input').click()));content.append(actions);
  const files=state.rooms.flatMap(r=>r.messages.flatMap(m=>m.attachments)).concat(room().pending);
  if(!files.length)intro('No attachments yet. Select a file, then send it into a demo conversation.');
  for(const file of files)content.append(attachmentView(file));
}
function showCompare(){
  intro('Side-by-side fictional product figures, unrelated to the accounting sheet.');
  const form=element('div','tool-form'),choices=PRODUCTS.map((p,i)=>[String(i),p.name]),left=selectField(form,'Product A',choices),right=selectField(form,'Product B',choices);right.value='1';
  const output=element('div','tool-output');let summary;
  const update=()=>{const a=PRODUCTS[Number(left.value)],b=PRODUCTS[Number(right.value)];summary=a.name+' vs '+b.name+'\nPrice: '+money(a.price)+' / '+money(b.price)+'\nSample units: '+a.units+' / '+b.units+'\nSample stock: '+a.stock+' / '+b.stock;output.textContent=summary};
  left.addEventListener('change',update);right.addEventListener('change',update);update();
  form.append(output,button('SEND COMPARISON TO CHAT',()=>{post(state.active,{author:'NOVA',text:'FICTIONAL COMPARISON\n'+summary});closeTool();scrollEnd()}));content.append(form);
}
function showHandoff(){
  intro('Assign a local rehearsal brief to a scripted specialist.');
  const form=element('div','tool-form'),agent=selectField(form,'Demo specialist',[['ATLAS','ATLAS / Actions'],['ECHO','ECHO / Offers'],['GUIDE','GUIDE / Support']]),brief=field(form,'Your brief','textarea',room().draft||'Review this idea and suggest next steps.');brief.rows=3;brief.maxLength=2000;
  form.append(button('HAND OFF IN DEMO',()=>{if(!brief.value.trim())return;const id=state.active;post(id,{author:'YOU',role:'user',text:'Demo brief to '+agent.value+': '+brief.value.trim()});receive(id,{author:agent.value,text:'Demo brief received. I would clarify the objective, check the evidence and prepare a reviewable draft. No real specialist has been contacted.',tool:'tasks'});closeTool();scrollEnd()}));content.append(form);
}
function showBrief(){
  intro('Sample report only. These figures are not your live business data.');
  const form=element('div','tool-form'),style=selectField(form,'Briefing style',[['short','Executive / short'],['detailed','Team / detailed']]);
  form.append(button('GENERATE DEMO BRIEF',()=>{const text='FICTIONAL DAILY BRIEF\nRevenue: $2,480 · Ads: $310 · Units: 106\nPriority: review stock coverage, test an offer scenario, and examine ad efficiency.'+(style.value==='detailed'?'\n\nNext steps:\n1. Confirm the real reporting period.\n2. Verify product-level costs and fees.\n3. Review all proposed changes before execution.':'');post(state.active,{author:'NOVA',text,tool:'actions'});closeTool();scrollEnd()}));content.append(form);
}
function showExport(){
  intro('Download this conversation as text. Attachment contents are not included.');
  content.append(element('p','tool-output',room().title+'\n'+room().messages.length+' messages'),button('DOWNLOAD TRANSCRIPT',()=>{
    const blob=new Blob([exportConversation(room())],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),link=element('a');link.href=url;link.download='dolce-demo-'+room().id+'.txt';document.body.append(link);link.click();link.remove();later(()=>URL.revokeObjectURL(url),1000);status('Demo transcript downloaded');
  }));
}
function speak(text){
  const synth=window.speechSynthesis,voice=synth?.getVoices().find(value=>value.localService&&value.lang.startsWith('en'))||synth?.getVoices().find(value=>value.localService);
  if(!synth||!voice||!window.SpeechSynthesisUtterance){status('On-device voice unavailable. The scripted transcript still works.');return}
  if(voiceMuted){status('Demo audio is muted');return}if(speechOwned)synth.cancel();
  const utterance=new SpeechSynthesisUtterance(text);utterance.voice=voice;utterance.rate=1;speechOwned=true;utterance.onend=()=>{speechOwned=false};synth.speak(utterance);
}
function showVoice(){
  intro('Scripted voice rehearsal. No microphone, recording or real AI call.');
  const time=element('div','voice-time',String(Math.floor(voiceSeconds/60)).padStart(2,'0')+':'+String(voiceSeconds%60).padStart(2,'0'));time.id='voice-clock';
  const bars=element('div','voice-bars'+(voiceTimer!==null?' running':''));bars.setAttribute('aria-hidden','true');for(let i=0;i<19;i++)bars.append(element('i'));
  const actions=element('div','tool-actions');
  actions.append(button(voiceTimer===null?'START DEMO CALL':'END DEMO CALL',()=>{
    if(voiceTimer!==null){stopVoice();post(voiceRoom,{author:'NOVA',text:'Demo voice rehearsal ended. No microphone or recording was used.'})}
    else{voiceSeconds=0;voiceRoom=state.active;voiceTimer=setInterval(()=>{voiceSeconds++;const clock=byId('voice-clock');if(clock)clock.textContent=String(Math.floor(voiceSeconds/60)).padStart(2,'0')+':'+String(voiceSeconds%60).padStart(2,'0')},1000);post(voiceRoom,{author:'NOVA',text:'Voice demo started. Choose a sample turn or Listen to hear the scripted introduction.'})}
    openTool('voice');
  }),button(voiceMuted?'UNMUTE DEMO':'MUTE DEMO',()=>{voiceMuted=!voiceMuted;if(voiceMuted&&speechOwned)window.speechSynthesis?.cancel();openTool('voice')}));
  content.append(time,bars,actions,button('LISTEN TO SAMPLE ANSWER',()=>speak('Welcome to Dolce Agent. This is a scripted demonstration. We can draft sample actions, compare hypothetical discounts, and prepare a briefing. No business changes will be made.')));
  const sample=button('SIMULATE MY TURN',()=>{if(voiceTimer===null){status('Start the demo call first');return}post(voiceRoom,{author:'YOU',role:'user',text:'[Simulated voice] What should we work on today?'});receive(voiceRoom,{author:'NOVA',text:'[Scripted voice answer] Let’s verify your data first, review a sample action pack and compare a hypothetical offer. No changes are executed.',tool:'actions'});status('Sample voice turn added to the transcript')});content.append(sample);
}
function openTool(id,opener){
  toolOpener=opener||toolOpener;currentTool=id;setRoomsOpen(false);tray.hidden=false;panel.dataset.toolOpen='true';messages.inert=true;content.replaceChildren();
  byId('chat-tool-title').textContent=id==='tools'?'Command desk':TOOLS.find(tool=>tool[0]===id)?.[1]||'Tools';
  const handlers={actions:showActions,discounts:()=>showDiscounts(false),calculator:()=>showDiscounts(true),faq:showFAQ,files:showFiles,search:showSearch,pins:showPins,notes:showNotes,tasks:showTasks,approvals:showApprovals,compare:showCompare,handoff:showHandoff,brief:showBrief,export:showExport,voice:showVoice};
  if(handlers[id])handlers[id]();else{intro('Everything happens inside this demo. Explore a tool, create a draft, or prepare a brief.');const grid=element('div','tool-grid');for(const [key,title,description] of TOOLS){const tile=button('',()=>openTool(key),'tool-tile');tile.append(element('b','',title.toUpperCase()),element('span','',description));grid.append(tile)}content.append(grid)}
  content.scrollTop=0;byId('chat-tool-close').focus({preventScroll:true});
}
launcher.addEventListener('click',()=>panel.hidden?openChat():closeChat());
byId('chat-close').addEventListener('click',()=>closeChat());
byId('chat-tool-close').addEventListener('click',()=>closeTool({focus:true}));
byId('chat-rooms-toggle').addEventListener('click',()=>setRoomsOpen(panel.dataset.rooms!=='open'));
byId('chat-expand').addEventListener('click',()=>{const expanded=panel.dataset.expanded!=='true';panel.dataset.expanded=String(expanded);byId('chat-expand').setAttribute('aria-pressed',String(expanded));byId('chat-expand').setAttribute('aria-label',expanded?'Restore chat size':'Expand chat');byId('chat-expand').textContent=expanded?'↙':'↗'});
byId('chat-new').addEventListener('click',()=>{room().draft=input.value;stopVoice();const created=createRoom(state);input.value='';selectRoom(created.id);status('New local conversation created')});
panel.querySelectorAll('[data-tool]').forEach(node=>node.addEventListener('click',()=>openTool(node.dataset.tool,node)));
byId('chat-photo').addEventListener('click',()=>byId('chat-photo-input').click());
byId('chat-file').addEventListener('click',()=>byId('chat-file-input').click());
for(const id of ['chat-photo-input','chat-file-input'])byId(id).addEventListener('change',event=>{attachFiles(event.target.files);event.target.value='';if(currentTool==='files')showFileRefresh()});
function showFileRefresh(){openTool('files')}
input.addEventListener('input',refreshComposer);byId('chat-form').addEventListener('submit',sendMessage);
input.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();byId('chat-form').requestSubmit()}});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!panel.hidden){event.preventDefault();if(!tray.hidden)closeTool({focus:true});else if(panel.dataset.rooms==='open')setRoomsOpen(false);else closeChat()}});
function syncMenu(){const open=!menu.hidden;if(open)closeChat({restoreFocus:false});launcher.hidden=open}
new MutationObserver(syncMenu).observe(menu,{attributes:true,attributeFilter:['hidden']});
byId('header-home').addEventListener('click',()=>closeChat({restoreFocus:false}));
panel.addEventListener('focusin',updateViewport);panel.addEventListener('focusout',()=>requestAnimationFrame(updateViewport));
window.addEventListener('pageshow',updateViewport);
window.addEventListener('resize',updateViewport,{passive:true});window.addEventListener('dolce:viewportchange',updateViewport);
window.visualViewport?.addEventListener('resize',updateViewport,{passive:true});window.visualViewport?.addEventListener('scroll',updateViewport,{passive:true});
window.addEventListener('pagehide',event=>{stopVoice();if(!event.persisted){for(const id of timers)clearTimeout(id);for(const url of [...objectURLs])releaseURL(url)}});
selectRoom('team');syncMenu();

document.addEventListener('dolce:ppc-controls-change',event=>{if(event.detail.open)closeChat({restoreFocus:false});});
