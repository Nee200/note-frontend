import { test } from 'node:test';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';
import { preview } from '../scripts/preview.mjs';

const catalog = [
 {id:'DUFTROLLER',category:'duftroller',name:'Duftroller',images:['images_website/duftroller/note-duftroller-trio-v1.webp'],variants:{6:{price:12.5},10:{price:16},14:{price:19.5}}},
 {id:'G1',category:'men',publicName:'Beyond Bergamot',name:'G1',inspiredBy:'Armani Acqua',description:'Frisch',images:['logo.webp'],variants:{30:{price:34.99},50:{price:44.99}}},
 {id:'L1',category:'women',publicName:'Rosé <Duft>',name:'L1',inspiredBy:'Chanel',description:'Blumig',images:['logo.webp'],variants:{30:{price:34.99},50:{price:44.99}}}
];
async function setup(t) {
 const server=await preview(0), origin=`http://127.0.0.1:${server.address().port}`;
 const browser=await puppeteer.launch({headless:true,...(process.platform==='win32'?{executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}:{}),args:process.platform==='linux'?['--no-sandbox']:[]});
 t.after(async()=>{await browser.close();await new Promise(resolve=>server.close(resolve));});
 return {browser,origin};
}
async function pageFor(browser,origin,width=390) {
 const context=await browser.createBrowserContext();
 const page=await context.newPage(), state={fail:false,requests:[],errors:[],products:catalog};
 await page.setViewport({width,height:844,isMobile:width<600,hasTouch:width<600});
 await page.evaluateOnNewDocument(()=>{localStorage.setItem('cookie_consent','necessary');localStorage.setItem('nl_dismissed','1');});
 page.on('pageerror',error=>state.errors.push(error.message));
 await page.setRequestInterception(true);
 page.on('request',request=>{
  const url=new URL(request.url());
  if(url.pathname.startsWith('/api/')||url.pathname.startsWith('/create-')){
   const headers={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'content-type, x-csrf-token, idempotency-key'};
   if(request.method()==='OPTIONS')return request.respond({status:204,headers});
   state.requests.push({url:url.pathname,method:request.method(),data:request.postData()});
   let body={};
   if(url.pathname==='/api/products')body=state.products;
   if(url.pathname.endsWith('/reviews'))body={reviews:[],summary:{count:0,average:0}};
   if(url.pathname==='/api/csrf-token')body={csrfToken:'synthetic-test'};
   if(url.pathname==='/create-checkout-session')body={safeMode:true};
   if(url.pathname.includes('newsletter'))body={message:'Bitte bestätige deine Anmeldung.'};
   return request.respond({status:state.fail&&url.pathname==='/api/products'?503:200,headers,contentType:'application/json',body:JSON.stringify(body)});
  }
  if(!['localhost','127.0.0.1'].includes(url.hostname))return request.abort();
  return request.continue();
 });
 return {page,state,go:()=>page.goto(origin+'/duftroller.html',{waitUntil:'load'})};
}
async function ready(page){await page.waitForFunction(()=>!document.querySelector('#add-btn').disabled && !document.querySelector('#add-btn').textContent.includes('laden'));}
async function selectScent(page,query,id){
 await page.click('#open-selector');
 await page.waitForSelector('#scent-modal.is-visible');
 await page.type('#scent-search',query);
 await page.waitForSelector(`[data-scent-id="${id}"]`);
 assert.equal(await page.$$eval('.scent-card',nodes=>nodes.length),1);
 await page.click(`[data-scent-id="${id}"]`);
 await page.waitForFunction(()=>document.querySelector('#scent-modal').hidden);
}

test('Duftroller purchase flow preserves sizes, brands, prices and gallery state on desktop and phone', {timeout:120000},async t=>{
 const {browser,origin}=await setup(t);
 for(const width of [390,1366]){
  const {page,state,go}=await pageFor(browser,origin,width);await go();await ready(page);
  assert.equal(await page.$$eval('[data-gallery-src]:not([hidden])',nodes=>nodes.length),4);
  assert.equal(await page.evaluate(()=>document.querySelector('#roller-main-image').src===new URL(window.NoteAssets.image('images_website/duftroller/note-duftroller-6-closed-v1.webp'),location.href).href),true);
  assert.equal(await page.$eval('#roller-price',node=>node.textContent.replace(/\s/g,'')),'12,50€');
  await selectScent(page,'armani','G1');
  for(const [size,price,unit] of [[6,'12,50','2.083,33'],[10,'16,00','1.600,00'],[14,'19,50','1.392,86']]){
   await page.click(`label.roller-size:has(input[value="${size}"])`);
   assert.match(await page.$eval('#roller-price',n=>n.textContent),new RegExp(price));
   assert.match(await page.$eval('#roller-unit-price',n=>n.textContent),new RegExp(unit));
   assert.equal(await page.$eval('#roller-gallery-size',n=>n.textContent),`${size} ml`);
   assert.deepEqual(await page.$$eval('[data-gallery-src]:not([hidden])',nodes=>nodes.map(n=>n.dataset.gallerySize)),Array(4).fill(String(size)));
   if(size!==6)await page.waitForFunction(s=>document.querySelector('#roller-main-image').src===new URL(window.NoteAssets.image(`images_website/duftroller/note-duftroller-${s}-closed-v1.webp`),location.href).href,{},size);
   for(const [index,imageState] of ['open','exploded','editorial','closed'].entries()){
    await page.click('[data-gallery-step="1"]');
    await page.waitForFunction((s,state)=>document.querySelector('#roller-main-image').src===new URL(window.NoteAssets.image(`images_website/duftroller/note-duftroller-${s}-${state}-v1.webp`),location.href).href,{},size,imageState);
    assert.equal(await page.$eval('#gallery-counter',n=>n.textContent),`${(index+1)%4+1} / 4`);
   }
   await page.click('#add-btn');
   await page.waitForFunction(()=>document.querySelector('[data-cart-drawer]').getAttribute('aria-hidden')==='false');
   await page.waitForFunction(()=>document.querySelector('[data-cart-drawer]').getBoundingClientRect().right<=innerWidth+1);
   await page.click('[data-cart-close]');
   await page.waitForFunction(()=>document.querySelector('[data-cart-drawer]').getAttribute('aria-hidden')==='true');
  }
  const cart=await page.evaluate(()=>window.NoteCart.read());
  assert.deepEqual(cart.map(({id,price,quantity})=>({id,price,quantity})),[6,10,14].map((size,i)=>({id:`DUFTROLLER-${size}-G1`,price:[12.5,16,19.5][i],quantity:1})));
  await page.reload({waitUntil:'load'});await ready(page);
  assert.equal(await page.$eval('input[name="roller-size"]:checked',n=>n.value),'14');
  assert.equal(await page.$eval('#selected-scent-title',n=>n.textContent),'NØTE. G1');
  await selectScent(page,'chanel','L1');
  assert.equal(await page.$eval('#selected-scent-description',n=>n.textContent),'Rosé <Duft>');
  assert.equal(await page.$eval('#selected-scent-description',n=>n.children.length),0);
  await page.click('#open-image-lightbox');
  await page.waitForFunction(()=>!document.querySelector('#image-lightbox').hidden);
  await page.keyboard.press('ArrowRight');
  await page.waitForFunction(()=>document.querySelector('#lightbox-counter').textContent==='2 / 4');
  await page.keyboard.press('Escape');
  assert.equal(await page.$eval('main',n=>n.inert),false);
  assert.equal(await page.evaluate(()=>document.body.style.position),'');
  await page.click('[data-select-roller="10"]');
  assert.equal(await page.$eval('input[name="roller-size"]:checked',n=>n.value),'10');
  assert.equal(await page.$eval('#roller-gallery-size',n=>n.textContent),'10 ml');
  assert.equal(await page.$eval('#selected-scent-title',n=>n.textContent),'NØTE. L1');
  assert.equal(await page.evaluate(()=>document.activeElement.value),'10');
  await page.evaluate(()=>sessionStorage.setItem('note_duftroller_selection',JSON.stringify({size:'constructor',scentId:'G1'})));
  await page.reload({waitUntil:'load'});await ready(page);
  assert.equal(await page.$eval('input[name="roller-size"]:checked',n=>n.value),'6');
  assert.equal(await page.$eval('#roller-price',n=>n.textContent.replace(/\s/g,'')),'12,50€');
  assert.deepEqual(state.errors,[]);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.close();
 }
});

test('Duftroller retries failed catalog loading, keeps filters accessible and fits short phone viewports', {timeout:120000},async t=>{
 const {browser,origin}=await setup(t);
 const {page,state,go}=await pageFor(browser,origin);state.fail=true;
 await page.evaluateOnNewDocument(()=>sessionStorage.setItem('note_duftroller_selection',JSON.stringify({size:'10',scentId:'L1'})));
 await go();
 await page.waitForFunction(()=>document.querySelector('#add-btn').textContent==='Erneut laden');
 assert.equal(await page.$eval('#roller-gallery-size',n=>n.textContent),'10 ml');
 assert.equal(await page.evaluate(()=>JSON.parse(sessionStorage.getItem('note_duftroller_selection')).scentId),'L1');
 await page.click('label.roller-size:has(input[value="14"])');
 assert.equal(await page.$eval('#add-btn',n=>n.disabled),false);
 state.products=catalog.map(product=>product.id==='DUFTROLLER'?{...product,variants:{6:{price:13},10:{price:17},14:{price:21}}}:product);
 state.fail=false;await page.click('#add-btn');await ready(page);
 await page.waitForFunction(()=>document.querySelector('#selected-scent-title').textContent==='NØTE. L1');
 assert.equal(await page.$eval('input[name="roller-size"]:checked',n=>n.value),'14');
 assert.match(await page.$eval('#add-btn',n=>n.textContent),/21,00/);
 assert.ok(await page.$$eval('[data-roller-price="14"]',nodes=>nodes.every(n=>n.textContent.includes('21,00'))));
 await page.click('#open-selector');
 await page.waitForSelector('#scent-modal.is-visible');
 assert.equal(await page.evaluate(()=>document.activeElement.id),'close-modal');
 await page.keyboard.down('Shift');await page.keyboard.press('Tab');await page.keyboard.up('Shift');
 assert.ok(await page.evaluate(()=>document.querySelector('#scent-modal').contains(document.activeElement)));
 await page.focus('#scent-tab-all');await page.keyboard.press('End');
 assert.equal(await page.$eval('#scent-tab-women',n=>n.getAttribute('aria-selected')),'true');
 assert.equal(await page.$eval('#scent-grid',n=>n.getAttribute('aria-labelledby')),'scent-tab-women');
 assert.equal(await page.$$eval('.scent-card',nodes=>nodes.length),1);
 await page.type('#scent-search','no matching fragrance');
 await page.waitForSelector('.empty-state');
 assert.match(await page.$eval('#result-count',n=>n.textContent),/0 Düfte/);
 assert.ok(await page.$eval('.modal-dialog',n=>n.getBoundingClientRect().height)<500);
 await page.keyboard.press('Escape');
 assert.equal(await page.evaluate(()=>document.activeElement.id),'open-selector');
 for(const [width,height] of [[320,568],[390,430],[578,1244],[844,390],[1024,768],[1883,1244]]){
  await page.setViewport({width,height,isMobile:width<600,hasTouch:width<600});
  await page.click('#open-selector');await page.waitForSelector('#scent-modal.is-visible');
  const bounds=await page.$eval('.modal-dialog',n=>{const r=n.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right}});
  assert.ok(bounds.top>=0 && bounds.bottom<=height+1 && bounds.left>=0 && bounds.right<=width+1,`${width}x${height}: ${JSON.stringify(bounds)}`);
  await page.keyboard.press('Escape');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 }
 assert.deepEqual(state.errors,[]);
});

test('retry inside the scent dialog preserves keyboard focus and Escape dismissal', {timeout:60000},async t=>{
 const {browser,origin}=await setup(t);
 const {page,state,go}=await pageFor(browser,origin);state.fail=true;await go();
 await page.waitForFunction(()=>document.querySelector('#add-btn').textContent==='Erneut laden');
 await page.click('#open-selector');
 await page.waitForSelector('#scent-modal .empty-state button');
 state.fail=false;
 await page.click('#scent-modal .empty-state button');
 await page.waitForSelector('#scent-modal .scent-card');
 assert.equal(await page.evaluate(()=>document.activeElement.id),'close-modal');
 await page.keyboard.press('Escape');
 assert.ok(await page.$eval('#scent-modal',node=>node.hidden));
 assert.equal(await page.$eval('main',node=>node.inert),false);
 assert.equal(await page.evaluate(()=>document.activeElement.id),'open-selector');
 assert.deepEqual(state.errors,[]);
});
