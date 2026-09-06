// Fictional fixtures only. Nothing in this module reads the accounting report.
export const TOOLS = [
  ['actions','Generate actions','PPC, SEO, stock & pricing presets'],
  ['discounts','Discount lab','Build a hypothetical offer'],
  ['voice','Voice rehearsal','Scripted conversation, no microphone'],
  ['faq','Support / FAQ','Answers about this demo'],
  ['files','File desk','Your local image and file previews'],
  ['search','Search','Find a message across conversations'],
  ['pins','Saved messages','Pin ideas for later'],
  ['notes','Scratchpad','A private note for each conversation'],
  ['tasks','Task board','Create and complete demo tasks'],
  ['calculator','Profit calculator','Try your own price and cost'],
  ['export','Export chat','Download a text transcript'],
  ['compare','Compare products','Side-by-side fictional metrics'],
  ['approvals','Approval queue','Review draft actions without applying'],
  ['handoff','Team handoff','Assign a mock brief to a specialist'],
  ['brief','Daily briefing','Generate a sample executive summary']
];
export const FAQ = [
  ['Is this live AI?', 'No. Team members, replies and business figures are scripted demo fixtures.'],
  ['Where do my files go?', 'Nowhere. Selected images are previewed locally; other files show their name and size. No files are uploaded or analyzed.'],
  ['Does voice use my microphone?', 'No. Voice rehearsal uses a scripted transcript. The Listen button can use an on-device browser voice when available.'],
  ['Will an action or discount change my store?', 'No. Approval buttons only change a demo card status on this page. Nothing is submitted or applied.'],
  ['Can I save my work?', 'Export downloads the current conversation as text. This demo keeps state only in memory; refreshing clears chats, notes, tasks and files.'],
  ['How do I reach support?', 'Open the Support conversation and ask a question. The response is automatic; this prototype does not contact a support team.']
];
export const PRODUCTS = [
  {name:'Kataifi sample',price:27.99,cost:11.30,units:42,stock:320},
  {name:'Pistachio sample',price:19.99,cost:10.70,units:28,stock:140},
  {name:'Chocolate sample',price:24.99,cost:9.40,units:36,stock:210}
];
const PRESETS={
  PPC:['Review three sample search terms with spend but no orders.','Draft a 10% bid-reduction experiment for review.','Compare seven-day results before changing a budget.'],
  SEO:['Review the sample title for clear size and pack count.','Draft two alternative feature bullets.','Prepare an image checklist for the listing team.'],
  STOCK:['Check sample stock cover against a 21-day target.','Draft a replenishment note for the lowest-stock item.','Ask the warehouse to verify counts in a future live workflow.'],
  PRICING:['Compare two hypothetical price points.','Check contribution before fees and advertising.','Send the preferred scenario to the demo approval queue.']
};
export function createState(){
  const rooms=[
    ['team','AI Team','HQ','Nova · Atlas · Echo','NOVA','Your demo command room is ready. Ask a question or try Actions. Every result here is simulated.'],
    ['actions','Action Lab','AC','Plans, drafts & decisions','ATLAS','Choose PPC, SEO, Stock or Pricing. I will build a sample action pack for your review.'],
    ['discounts','Discounts','DC','Hypothetical offer sandbox','ECHO','Try a discount in the lab. Prices and margins are sample figures, not your live store.'],
    ['support','Support','SP','Product help & FAQs','GUIDE','Need help? Ask about files, voice, saving chats or how the demo works.'],
    ['brief','Daily Brief','DB','A fictional business snapshot','NOVA','A briefing, product comparison and task board are ready to explore under Tools.']
  ].map(([id,title,short,subtitle,author,text])=>({id,title,short,subtitle,unread:0,draft:'',note:'',pending:[],messages:[{id:id+'-intro',author,role:'ai',text,time:'DEMO',attachments:[]}]}));
  return {rooms,active:'team',sequence:0,pins:[],tasks:[],approvals:[],greeted:false};
}
export const roomById=(state,id=state.active)=>state.rooms.find(room=>room.id===id);
export function addMessage(state,roomId,message){
  const room=roomById(state,roomId);if(!room)return null;
  const result={id:'m'+(++state.sequence),author:'NOVA',role:'ai',time:'DEMO',attachments:[],...message};
  room.messages.push(result);if(roomId!==state.active&&result.role!=='user')room.unread++;
  return result;
}
export function createRoom(state){
  const id='new'+(++state.sequence),room={id,title:'New chat '+state.sequence,short:'+',subtitle:'A fresh local conversation',unread:0,draft:'',note:'',pending:[],messages:[]};
  state.rooms.push(room);state.active=id;addMessage(state,id,{text:'New demo conversation. What would you like to explore?'});return room;
}
export function automaticReply(text,roomId){
  const words=text.toLowerCase();
  if(/file|image|photo|attach/.test(words))return {author:'GUIDE',text:'Your attachment stays in this local demo. I have not read or analyzed its contents. Open File desk to view the preview and metadata.',tool:'files'};
  if(/discount|coupon|offer/.test(words)||roomId==='discounts')return {author:'ECHO',text:'Demo idea: compare a 10% offer with a 15% offer before deciding. Discount lab calculates both using fictional product figures; no price will change.',tool:'discounts'};
  if(/voice|call|speak/.test(words))return {author:'NOVA',text:'Let’s rehearse a voice conversation. You can play a scripted sample turn and hear an on-device voice if your browser supports it. No microphone is used.',tool:'voice'};
  if(/help|support|how|faq/.test(words)||roomId==='support')return {author:'GUIDE',text:'I’m your scripted demo guide. Chats, file previews, drafts and approvals are local only. The FAQ explains each control and what is not connected.',tool:'faq'};
  if(/stock|restock|ppc|seo|action|price/.test(words)||roomId==='actions')return {author:'ATLAS',text:'I can prepare a sample plan with three review steps. Pick a preset in Generate actions, then add it to the demo approval queue.',tool:'actions'};
  if(/sales|report|brief|profit|summary/.test(words)||roomId==='brief')return {author:'NOVA',text:'Here’s a fictional briefing to explore: sample revenue $2,480, sample ad spend $310 and three open review items. These numbers are not taken from your accounting sheet.',tool:'brief'};
  return {author:'NOVA',text:'Got it. This is an automatic demo reply, not live AI. We can turn your idea into an action draft, compare sample products, or hand a brief to a demo specialist.',tool:'handoff'};
}
export function actionPack(preset){const key=Object.hasOwn(PRESETS,preset)?preset:'PPC';return {title:key+' / sample action pack',text:PRESETS[key].map((line,index)=>(index+1)+'. '+line).join('\n')};}
export function discountScenario(price,cost,percent){
  if(![price,cost,percent].every(Number.isFinite)||price<=0||cost<0||percent<0||percent>90)return null;
  const discounted=Math.round(price*(1-percent/100)*100)/100;
  if(discounted<=0)return null;
  const contribution=Math.round((discounted-cost)*100)/100;
  return {price:discounted,saving:Math.round((price-discounted)*100)/100,contribution,margin:Math.round(contribution/discounted*1000)/10};
}
export function searchMessages(state,query){const q=query.toLowerCase().trim();return q?state.rooms.flatMap(room=>room.messages.filter(message=>message.text.toLowerCase().includes(q)).map(message=>({room,message}))):[];}
export function exportConversation(room){return ['DOLCE AGENT / DEMO TRANSCRIPT','Scripted AI. Local only. No business actions were executed.',room.title,'',...room.messages.map(message=>`${message.author} / ${message.role==='user'?'YOU':'DEMO AI'}\n${message.text}${message.attachments.length?'\nFiles: '+message.attachments.map(file=>file.name).join(', '):''}`)].join('\n\n');}
export const money=value=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(value);
