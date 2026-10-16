import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer';
import { preview } from '../scripts/preview.mjs';
const fixture=JSON.parse(await readFile(new URL('./fixtures/id-mapping-2026-10.json',import.meta.url),'utf8'));

test('admin converter shows real counterparts, nine additions and unresolved rows on desktop/mobile', {timeout:60000}, async()=>{
 const site=await preview(0);
 const browser=await puppeteer.launch({headless:true,...(process.platform==='win32'?{executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}:{}),args:process.platform==='linux'?['--no-sandbox']:[]});
 try {
  const page=await browser.newPage(),errors=[],writes=[];
  await page.setViewport({width:1440,height:1050});
  page.on('pageerror',error=>errors.push(error.message));
  await page.evaluateOnNewDocument(()=>localStorage.setItem('cookie_consent','necessary'));
  await page.setRequestInterception(true);
  page.on('request',request=>{
   const url=new URL(request.url());
   if(url.pathname.startsWith('/api/')) {
    const headers={'Access-Control-Allow-Origin':`http://127.0.0.1:${site.address().port}`,'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Methods':'GET, OPTIONS','Access-Control-Allow-Headers':'content-type,x-csrf-token'};
    if(request.method()==='OPTIONS')return request.respond({status:204,headers});
    if(request.method()!=='GET')writes.push(url.pathname);
    let body={},status=200;
    if(url.pathname.endsWith('/admin/check'))body={features:{}};
    else if(url.pathname.endsWith('/csrf-token'))body={csrfToken:'synthetic-test-token'};
    else if(url.pathname.endsWith('/id-mapping/catalog'))body=fixture.catalog;
    else if(url.pathname.endsWith('/id-mapping')){body=fixture.queries[url.searchParams.get('id')]||{error:'Ungültiges ID-Format'};if(body.error)status=400;}
    else if(url.pathname.endsWith('/products'))body=[];
    return request.respond({status,headers,contentType:'application/json',body:JSON.stringify(body)});
   }
   if(!['127.0.0.1','localhost'].includes(url.hostname)&&url.protocol!=='data:')return request.abort();
   request.continue();
  });
  await page.goto(`http://127.0.0.1:${site.address().port}/admin.html`,{waitUntil:'load'});
  await page.waitForSelector('#dashboard',{visible:true});
  await page.click('[data-tab="idmapping"]');
  await page.waitForSelector('#supplier-men-list [data-supplier-id="M362"]');
  assert.equal(await page.$$eval('[data-supplier-id]',rows=>rows.length),581);
  assert.match(await page.$eval('[data-supplier-id="M1"]',el=>el.textContent),/G362/);
  assert.match(await page.$eval('[data-supplier-id="W103"]',el=>el.textContent),/leere Händlerzeile/);
  const query=async(value,expected)=>{
   await page.$eval('#id-mapping-input',(el,value)=>{el.value=value;},value);
   await page.click('#id-mapping-card button');
   await page.waitForFunction(text=>document.getElementById('id-mapping-result').textContent.includes(text),{},expected);
   return page.$eval('#id-mapping-result',el=>el.textContent);
  };
  const single=await query('M155','G1');
  assert.doesNotMatch(single,/G155\b/);assert.match(single,/Nach Duftname abgeglichen/);
  await query('M1, M11, M16, M23, M25, M53, M58, M126, M168','9 abgeglichen');
  const ids=await page.$$eval('#id-mapping-result tbody tr',rows=>rows.map(row=>row.children[1].textContent));
  assert.deepEqual(ids,Array.from({length:9},(_,i)=>'G'+(362+i)));
  await query('G1, M155, M1, W4, M351, M279, W103, G345, L178','4 abgeglichen');
  const mixed=await page.$eval('#id-mapping-result',el=>el.textContent);
  assert.match(mixed,/5 mit Hinweis/);assert.match(mixed,/Bewusst ausgelassen/);assert.match(mixed,/Variante offen/);
  assert.match(mixed,/Händlerzeile leer/);assert.match(mixed,/Gleicher Name in anderer Liste/);
  if(process.env.NOTE_TEST_SCREENSHOT){await mkdir(path.dirname(process.env.NOTE_TEST_SCREENSHOT),{recursive:true});await page.screenshot({path:process.env.NOTE_TEST_SCREENSHOT,fullPage:true});}
  await page.setViewport({width:390,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
  await query('M351','Bewusst ausgelassen');
  await query('bad','Ungültiges ID-Format');
  assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
 } finally {await browser.close();await new Promise(resolve=>site.close(resolve));}
});
