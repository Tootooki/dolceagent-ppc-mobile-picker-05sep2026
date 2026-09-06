// Local navigation prototype. Every non-accounting record is fictional.
import {ACTION_BRAND, ACTION_NOTICE, ACTION_STATUSES, ACTION_COLUMN_HEADERS, createActionStatuses, mockActionsFor} from './actions-model.mjs?v=76';
import {createTargetsState,targetsView} from './targets-model.mjs?v=83';
export const TABS = ['ACCOUNTING', 'PPC', 'SEO', 'REIMBURSEMENT', 'ACTIONS', 'HISTORY', 'AUTOMATION', 'SERVICES', 'SETTINGS'];
const field = (key, label, choices) => ({key, label, choices});
export const CONFIG = {
  ppc: {fields: [field('view', 'View', ['Campaigns', 'Targets', 'ASINs', 'Portfolios']), field('status', 'Status', ['All', 'Active', 'Paused'])]},
  seo: {fields: [field('view', 'View', ['Listings', 'Keywords']), field('status', 'Readiness', ['All', 'Review', 'Ready'])]},
  reimbursement: {fields: [field('view', 'View', ['Cases', 'Evidence']), field('status', 'Stage', ['All', 'Open', 'Review', 'Ready'])]},
  actions: {fields: [field('area', 'Team', ['All', 'PPC', 'SEO', 'Pricing', 'Stock', 'Reimbursement']), field('status', 'Status', ['All', ...ACTION_STATUSES])]},
  history: {fields: [field('area', 'Team', ['All', 'Accounting', 'PPC', 'SEO', 'Reimbursement']), field('order', 'Order', ['Newest first', 'Oldest first'])]},
  automation: {fields: [field('view', 'View', ['Rules', 'Runs']), field('status', 'State', ['All', 'Enabled', 'Paused'])]},
  services: {fields: [field('service', 'Service', ['All', 'Accounting', 'PPC', 'SEO', 'Reimbursement'])]},
};

const records = {
  seo: [
    {name: 'Kataifi pastry', keyword: 'shredded pastry', status: 'Review', note: 'Sample title review'},
    {name: 'Pistachio cream', keyword: 'pistachio spread', status: 'Ready', note: 'Sample content draft'},
    {name: 'Chocolate selection', keyword: 'chocolate gift box', status: 'Review', note: 'Sample image checklist'},
  ],
  reimbursement: [
    {id: 'DEMO-001', reason: 'Lost inventory', amount: '$84.00', status: 'Open', evidence: 'Sample inventory record'},
    {id: 'DEMO-002', reason: 'Damaged return', amount: '$28.00', status: 'Review', evidence: 'Sample return record'},
    {id: 'DEMO-003', reason: 'Fee discrepancy', amount: '$16.00', status: 'Ready', evidence: 'Sample fee calculation'},
  ],
  history: [
    {time: '09:40', area: 'Accounting', note: 'Sample report viewed'},
    {time: '09:25', area: 'PPC', note: 'Sample action drafted'},
    {time: '09:10', area: 'SEO', note: 'Sample content reviewed'},
    {time: '08:55', area: 'Reimbursement', note: 'Sample case prepared'},
  ],
  automation: [
    {name: 'Daily report preview', status: 'Enabled', run: 'Simulated completion', cadence: 'Every morning'},
    {name: 'Listing review preview', status: 'Paused', run: 'No simulated run', cadence: 'Weekly'},
    {name: 'Case review preview', status: 'Enabled', run: 'Simulated completion', cadence: 'Weekly'},
  ],
  services: [
    {name: 'Accounting', detail: 'Reporting and reconciliation', status: 'Preview only'},
    {name: 'PPC', detail: 'Campaign review workspace', status: 'Preview only'},
    {name: 'SEO', detail: 'Listing and keyword workspace', status: 'Preview only'},
    {name: 'Reimbursement', detail: 'Case and evidence workspace', status: 'Preview only'},
  ],
};

export function createWorkspaceState() {
  return {active: 'accounting', tab: 'accounting', density: 'compact', targets:createTargetsState(), actionStatuses:createActionStatuses(), removedActions:[], options: Object.fromEntries(
    Object.entries(CONFIG).map(([id, config]) => [id, Object.fromEntries(config.fields.map(f => [f.key, f.choices[0]]))]))};
}
export function selectWorkspace(state, id) {
  if (!TABS.some(tab => tab.toLowerCase() === id)) return false;
  state.tab = id;
  if (id !== 'settings') state.active = id;
  return true;
}
export function setOption(state, id, key, value) {
  const rule = CONFIG[id]?.fields.find(f => f.key === key);
  if (!rule?.choices.includes(value)) return false;
  state.options[id][key] = value;
  if(id==='ppc'&&key==='view'&&['Targets','ASINs'].includes(value))state.targets.kind=value==='ASINs'?'ASINs':'All';
  return true;
}
export function viewFor(state, id = state.active) {
  const options = state.options[id];
  if (!options) return null;
  if(id==='ppc')return targetsView(state.targets,options.status,options.view);
  if(id==='actions'){
    const actions=mockActionsFor(state);
    const products=[...new Set(actions.map(action=>action.item))];
    const actionSlots=products.map(item=>ACTION_COLUMN_HEADERS.map((_,slot)=>actions.find(action=>action.item===item&&action.slot===slot)||null));
    return {id,title:`${ACTION_BRAND} · ACTIONS`,headers:['PRODUCT',...ACTION_COLUMN_HEADERS],
      rows:products.map((item,index)=>[item,...actionSlots[index].map(action=>action?.summary||'')]),actions,actionSlots,
      summary:`${actions.length} actions · ${options.area} · ${options.status}`,notice:ACTION_NOTICE};
  }
  let rows = records[id].filter(row => (!options.status || options.status === 'All' || row.status === options.status)
    && (!options.area || options.area === 'All' || row.area === options.area)
    && (!options.service || options.service === 'All' || row.name === options.service));
  if (options.order === 'Oldest first') rows = [...rows].reverse();
  const tables = {
    seo: options.view === 'Keywords' ? [['Keyword', 'Readiness', 'Product'], r => [r.keyword, r.status, r.name]]
      : [['Listing', 'Readiness', 'Review'], r => [r.name, r.status, r.note]],
    reimbursement: options.view === 'Evidence' ? [['Case', 'Evidence', 'Stage'], r => [r.id, r.evidence, r.status]]
      : [['Case', 'Reason', 'Amount', 'Stage'], r => [r.id, r.reason, r.amount, r.status]],
    history: [['Time', 'Team', 'Event'], r => [r.time, r.area, r.note]],
    automation: options.view === 'Runs' ? [['Rule', 'State', 'Demo run'], r => [r.name, r.status, r.run]]
      : [['Rule', 'State', 'Cadence'], r => [r.name, r.status, r.cadence]],
    services: [['Service', 'Includes', 'Status'], r => [r.name, r.detail, r.status]],
  };
  const [headers, cells] = tables[id];
  return {id, title: id.toUpperCase(), headers, rows: rows.map(cells),
    summary: CONFIG[id].fields.map(f => options[f.key]).join(' · '),
    notice: id === 'automation' ? 'DEMO ONLY · No rules are running.' : id === 'services'
      ? 'DEMO ONLY · No service is booked or connected.' : 'DEMO ONLY · Fictional sample data. No account connected.'};
}
