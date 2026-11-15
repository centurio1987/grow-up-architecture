export class DomainError extends Error { constructor(code){super(code);this.code=code;} }
const fail=c=>{throw new DomainError(c);};
export function uuid(v){if(typeof v!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v))fail('INVALID_ID');return v.toLowerCase();}
const integer=(v,min,max)=>{if(!Number.isSafeInteger(v)||v<min||v>max)fail('INVALID_NUMBER');return v;};
function instant(v){if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v).toISOString()!==v)fail('INVALID_INSTANT');return v;}
function name(v){if(typeof v!=='string'||[...v].length<1||[...v].length>100)fail('INVALID_NAME');return v;}
function revision(v){if(typeof v!=='string'||!/^[A-Za-z0-9._-]{1,100}$/.test(v))fail('INVALID_REVISION');return v;}
function freeze(s){return Object.freeze({...s,lines:Object.freeze(s.lines.map(l=>Object.freeze({...l})))});}
function validateSnapshot(s){
  const id=uuid(s.id),buyerId=uuid(s.buyerId),placedAt=instant(s.placedAt);
  if(!Array.isArray(s.lines)||s.lines.length<1||s.lines.length>20)fail('INVALID_LINE_COUNT');
  if(!((s.state==='PLACED'&&s.version===1)||(['CONFIRMED','CANCELLED'].includes(s.state)&&s.version===2)))fail('INVALID_STATE_VERSION');
  const seen=new Set();const lines=s.lines.map((l,i)=>{if(l.lineNo!==i+1)fail('INVALID_LINE_SEQUENCE');const productId=uuid(l.productId);if(seen.has(productId))fail('DUPLICATE_PRODUCT');seen.add(productId);return {lineNo:i+1,productId,productName:name(l.productName),quantity:integer(l.quantity,1,99),unitPriceKrw:integer(l.unitPriceKrw,0,1000000),offerRevision:revision(l.offerRevision)};});
  return freeze({id,buyerId,placedAt,state:s.state,version:s.version,lines});
}
export function canonicalRequest(items){
  if(!Array.isArray(items)||items.length<1||items.length>20)fail('INVALID_LINE_COUNT');
  const seen=new Set();const tuples=items.map(i=>{const id=uuid(i.productId);if(seen.has(id))fail('DUPLICATE_PRODUCT');seen.add(id);return [id,integer(i.quantity,1,99),revision(i.expectedOfferRevision)];});
  return JSON.stringify(['place-order/v1',tuples]); // SHA-256 is performed by the application adapter.
}
export class Order {
  #data;
  constructor(snapshot){this.#data=validateSnapshot(snapshot);}
  static place({id,buyerId,placedAt,items,offers}){
    const tuples=JSON.parse(canonicalRequest(items))[1];
    if(!Array.isArray(offers))fail('CATALOG_CONTRACT_ERROR');
    const map=new Map();for(const o of offers){const key=uuid(o.productId);if(map.has(key))fail('CATALOG_CONTRACT_ERROR');map.set(key,o);}
    const lines=tuples.map(([productId,quantity,expected],i)=>{const offer=map.get(productId);if(!offer||offer.offerable!==true)fail('PRODUCT_UNAVAILABLE');if(offer.offerRevision!==expected)fail('OFFER_CHANGED');return {lineNo:i+1,productId,quantity,productName:offer.name,unitPriceKrw:offer.unitPriceKrw,offerRevision:offer.offerRevision};});
    return new Order({id,buyerId,placedAt,state:'PLACED',version:1,lines});
  }
  static rehydrate(snapshot){return new Order(snapshot);} // Validates persisted structure without consulting today's catalog.
  get snapshot(){return this.#data;}
  get totalKrw(){return this.#data.lines.reduce((s,l)=>s+l.quantity*l.unitPriceKrw,0);}
  #transition(to,expectedVersion){integer(expectedVersion,1,2);if(this.#data.state!=='PLACED'||this.#data.version!==expectedVersion)fail('CONFLICT');this.#data=freeze({...this.#data,state:to,version:2});}
  cancel(expectedVersion){this.#transition('CANCELLED',expectedVersion);}
  confirm(expectedVersion){this.#transition('CONFIRMED',expectedVersion);}
  acceptanceReceipt(){return {orderId:this.#data.id,acceptedAt:this.#data.placedAt,acceptedTotalKrw:this.totalKrw};}
  buyerView(actorId){if(uuid(actorId)!==this.#data.buyerId)fail('NOT_FOUND');return {...this.pendingView(),state:this.#data.state,canCancel:this.#data.state==='PLACED'};}
  pendingView(){return {orderId:this.#data.id,placedAt:this.#data.placedAt,version:this.#data.version,lines:this.#data.lines.map(({offerRevision,...l})=>({...l,lineTotalKrw:l.quantity*l.unitPriceKrw})),totalKrw:this.totalKrw};}
}
// Projection helpers are included here for the executable lesson. A larger codebase
// may place DTO projections in the application layer. No HTTP or SQL dependency is present.
