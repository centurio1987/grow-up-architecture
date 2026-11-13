import { chromium } from '/Users/centurio/resume/node_modules/playwright/index.mjs';
import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root=dirname(fileURLToPath(import.meta.url));
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1050},deviceScaleFactor:1});
await page.emulateMedia({reducedMotion:'reduce'});
const errors=[], requests=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
const assert=(v,m)=>{if(!v)throw new Error(m);};
await mkdir(join(root,'verification'),{recursive:true});
try {
 await page.goto(new URL('./index.html',import.meta.url).href);
 await page.evaluate(()=>document.fonts.ready);
 const structure=await page.evaluate(()=>{
   const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);
   return {
     sections:document.querySelectorAll('main section').length,
     artifacts:document.querySelectorAll('.artifact').length,
     sources:document.querySelectorAll('.sources li').length,
     images:[...document.images].map(i=>({loaded:i.complete&&i.naturalWidth>0,alt:!!i.alt})),
     duplicateIds:ids.filter((v,i)=>ids.indexOf(v)!==i),
     brokenAnchors:[...document.querySelectorAll('a[href^="#"]')].filter(a=>!document.getElementById(a.hash.slice(1))).map(a=>a.hash),
     overflow:document.documentElement.scrollWidth>innerWidth,
     words:document.querySelector('main').innerText.length,
   };
 });
 assert(structure.sections===15&&structure.artifacts===14&&structure.sources===20,'section counts');
 assert(structure.images.length===4&&structure.images.every(i=>i.loaded&&i.alt),'image loading');
 assert(!structure.duplicateIds.length&&!structure.brokenAnchors.length,'anchor integrity');
 assert(!structure.overflow,'desktop horizontal overflow');
 await page.screenshot({path:join(root,'verification','desktop.png')});
 await page.locator('#decisions').scrollIntoViewIfNeeded();
 await page.screenshot({path:join(root,'verification','decisions.png')});
 await page.locator('#artifact-search').fill('A09');
 assert(await page.locator('.artifact:not([hidden])').count()>=1,'artifact search');
 await page.locator('#artifact-search').fill('zzzz-no-artifact');
 assert(await page.locator('.artifact:not([hidden])').count()===0,'empty search result');
 await page.locator('#artifact-search').fill('');
 await page.locator('#collapse-all').click();
 assert(await page.locator('.artifact[open]').count()===0,'collapse');
 await page.locator('#expand-all').click();
 assert(await page.locator('.artifact[open]').count()===14,'expand');
 const answers=[];
 for(const past of ['yes','no'])for(const rebuild of ['yes','no'])for(const cost of ['yes','no']){
   await page.selectOption('#past',past);await page.selectOption('#rebuild',rebuild);await page.selectOption('#cost',cost);
   const answer=await page.locator('#decision-result').innerText();assert(answer.length>35,'decision result');answers.push({past,rebuild,cost,answer});
 }
 await page.locator('.checklist input').first().check();
 assert(await page.locator('#check-progress').innerText()==='1 / 10 확인','check progress');
 const downloadPromise=page.waitForEvent('download');await page.locator('#download-worksheet').click();
 const download=await downloadPromise;assert(download.suggestedFilename()==='db-schema-design-worksheet.txt','worksheet download');
 await page.locator('.checklist input').first().uncheck();
 await page.selectOption('#past','yes');await page.selectOption('#rebuild','no');await page.selectOption('#cost','yes');
 await page.setViewportSize({width:390,height:844});
 await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';scrollTo(0,0);});
 await page.locator('header').screenshot({path:join(root,'verification','mobile.png')});
 const mobile=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth}));
 assert(mobile.width===mobile.scrollWidth,'mobile horizontal overflow');
 await page.emulateMedia({media:'print'});
 await page.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));
 assert(await page.locator('details:not([open])').count()===0,'print details');
 await page.evaluate(()=>window.dispatchEvent(new Event('afterprint')));
 assert(errors.length===0,'browser runtime errors');assert(requests.length===0,'offline external requests');
 const report={checkedAt:new Date().toISOString(),structure,mobile,decisionCombinations:answers.length,interactions:['filter','expand/collapse','8 decision combinations','checklist','worksheet download','print expansion'],runtimeErrors:errors,externalRequests:requests,sqlExecution:'Not run: PostgreSQL executable unavailable. SQL is an educational example, not a production enforcement layer.'};
 await writeFile(join(root,'verification','report.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify(report,null,2));
} finally {await browser.close();}
