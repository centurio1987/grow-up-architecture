// Input is a reviewed relational plan, not an unqualified conceptual diagram.
export function compile(plan,policy){
  if(plan.format!=='teaching-relational-plan/1'||policy.target!=='PostgreSQL 18')throw Error('Unsupported input or DB');
  if(policy.tableStrategy!=='separate-lines')throw Error('No mapping for this table strategy');
  if(!['uuid','text'].includes(policy.identity))throw Error('Identity representation unresolved');
  for(const [id,owner] of Object.entries(plan.unenforcedByDDL))if(policy.ruleOwners?.[id]!==owner)throw Error(`Missing rule responsibility: ${id}`);
  const name=x=>{if(!/^[a-z][a-z0-9_]*$/.test(x))throw Error('Invalid identifier');return x;};
  const typeMap={Identity:[policy.identity],Instant:['timestamptz(3)'],State:['text',"{c} IN ('PLACED','CONFIRMED','CANCELLED')"],Version:['smallint','{c} BETWEEN 1 AND 2'],LineNo:['smallint','{c} BETWEEN 1 AND 20'],Name:['varchar(100)','char_length({c}) BETWEEN 1 AND 100'],Quantity:['smallint','{c} BETWEEN 1 AND 99'],Price:['integer','{c} BETWEEN 0 AND 1000000'],Revision:['varchar(100)',"{c} ~ '^[A-Za-z0-9._-]{1,100}$'"],Fingerprint:['char(64)',"{c} ~ '^[a-f0-9]{64}$'"]};
  const out=['-- Generated from a reviewed relational plan + storage policy. PostgreSQL 18.\n-- Not a migration. Application-owned rules are listed in the trace.'];const trace=[];
  const tableNames=new Set();
  for(const t of plan.tables){
    if(tableNames.has(t.name))throw Error('Duplicate table');tableNames.add(t.name);
    const names=new Set(t.columns.map(c=>c.name));if(names.size!==t.columns.length)throw Error('Duplicate column');
    const parts=t.columns.map(c=>{const type=typeMap[c.type];if(!type)throw Error(`Unknown type ${c.type}`);if(c.checks?.length)throw Error('Custom checks need compiler support');const n=name(c.name);trace.push(`${t.source} -> ${t.name}.${n} (${type[0]})`);return '  '+n+' '+type[0]+(c.required?' NOT NULL':'')+(type[1]?' CHECK ('+type[1].replaceAll('{c}',n)+')':'');});
    const columns=xs=>xs.map(x=>{if(!names.has(x))throw Error('Unknown key column');return name(x);}).join(', ');
    if(!t.primaryKey.length)throw Error('Missing primary key');parts.push('  PRIMARY KEY ('+columns(t.primaryKey)+')');
    for(const u of t.unique)parts.push('  UNIQUE ('+columns(u)+')');
    for(const fk of t.foreignKeys){const target=plan.tables.find(x=>x.name===fk.table);if(!target||fk.columns.length!==fk.target.length||!fk.target.every(x=>target.columns.some(c=>c.name===x)))throw Error('Invalid FK');if(![target.primaryKey,...target.unique].some(k=>JSON.stringify(k)===JSON.stringify(fk.target)))throw Error('FK target is not unique');parts.push('  FOREIGN KEY ('+columns(fk.columns)+') REFERENCES '+name(fk.table)+' ('+fk.target.map(name).join(', ')+')'+(fk.deferrable?' DEFERRABLE INITIALLY DEFERRED':''));}
    if(t.name==='sales_order')parts.push("  CHECK ((state = 'PLACED' AND version = 1) OR (state IN ('CONFIRMED','CANCELLED') AND version = 2))");
    out.push('CREATE TABLE '+name(t.name)+' (\n'+parts.join(',\n')+'\n);');
  }
  for(const i of plan.indexes){if(i.optional&&!policy.includeBuyerHistoryIndex)continue;const t=plan.tables.find(t=>t.name===i.table);if(!t||!i.keys.every(k=>t.columns.some(c=>c.name===k)))throw Error('Invalid index');if(i.where&&i.where!=="state = 'PLACED'")throw Error('Unsupported predicate');out.push('CREATE INDEX '+name(i.name)+' ON '+name(i.table)+' ('+i.keys.map(name).join(', ')+')'+(i.where?' WHERE '+i.where:'')+';');trace.push(`${i.source} -> ${i.name}`);}
  return {sql:out.join('\n\n')+'\n',trace,obligations:Object.entries(plan.unenforcedByDDL).map(([id,v])=>`${id}: ${v}`)};
}
