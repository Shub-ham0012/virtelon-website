import test from 'node:test';
import assert from 'node:assert/strict';
import { createHandler } from '../api/contact.js';
const data = { name:'QA test',email:'contact@virtelon.com',company:'Virtelon',interest:'project',message:'A synthetic message for a local handler test.',consent:'yes',website:'' };
const request = (changes = {}) => ({method:'POST',headers:{accept:'application/json','content-type':'application/json',host:'example.com',origin:'https://example.com'},body:{...data},...changes});
async function invoke(req, options = {}) {
  const headers={};let body='';const res={setHeader:(k,v)=>headers[k]=v,end:value=>body=value};
  await createHandler(options)(req,res);return {status:res.statusCode,body,headers};
}
test('unconfigured provider returns 503, never fake success',async()=>{const r=await invoke(request(),{env:{}});assert.equal(r.status,503);assert.equal(JSON.parse(r.body).ok,false)});
test('valid submission accepted only after provider acknowledgment',async()=>{let payload;const r=await invoke(request(),{env:{WEB3FORMS_ACCESS_KEY:'test-only'},fetcher:async(u,o)=>{payload=JSON.parse(o.body);return {ok:true,json:async()=>({success:true})}}});assert.equal(r.status,200);assert.equal(JSON.parse(r.body).ok,true);assert.equal(payload.email,data.email);assert.ok(!r.body.includes('test-only'))});
test('provider rejection and timeout return honest errors',async()=>{for(const fetcher of [async()=>({ok:false,json:async()=>({success:false})}),async()=>{throw new Error('test secret not leaked')}]){const r=await invoke(request(),{env:{WEB3FORMS_ACCESS_KEY:'test-only'},fetcher});assert.equal(r.status,502);assert.ok(!r.body.includes('test secret'))}});
test('method, origin, format and size restrictions',async()=>{for(const [req,status] of [[request({method:'GET'}),405],[request({headers:{host:'example.com',origin:'https://evil.test'}}),403],[request({headers:{'content-type':'text/plain'}}),415],[request({headers:{'content-length':'13000'}}),413],[request({body:'{broken json'}),400]])assert.equal((await invoke(req,{env:{}})).status,status)});
test('invalid fields, consent and honeypot rejected',async()=>{for(const changed of [{email:'bad'},{message:'short'},{consent:''},{interest:'unknown'},{website:'spam'},{name:'bad\r\nheader'},{message:'x'.repeat(5001)}])assert.equal((await invoke(request({body:{...data,...changed}}),{env:{}})).status,400)});
test('no-JS form has a real confirmation document',async()=>{const r=await invoke(request({headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams(data).toString()}),{env:{WEB3FORMS_ACCESS_KEY:'test-only'},fetcher:async()=>({ok:true,json:async()=>({success:true})})});assert.equal(r.status,200);assert.match(r.body,/<h1>Enquiry accepted/)});
