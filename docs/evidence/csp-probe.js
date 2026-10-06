// Temporary browser verification hook: loaded before shell.js, removed from index after audit.
const audit=document.createElement('meta');audit.id='csp-audit';document.head.append(audit);
let display;
const report={events:[],mounts:[],styleCount:0,inlineHandlers:0};
const sync=()=>{
 report.styleCount=document.querySelectorAll('[style]').length;
 report.inlineHandlers=[...document.querySelectorAll('*')].reduce((n,e)=>n+[...e.attributes].filter(a=>/^on/i.test(a.name)).length,0);
 const header=document.querySelector('.uhead');
 if(header){report.header={flexGrow:getComputedStyle(header.children[0]).flexGrow,rightGap:header.getBoundingClientRect().right-header.children[1].getBoundingClientRect().right};}
 const json=JSON.stringify(report);audit.setAttribute('content',json);
 if(display&&display.textContent!==json)display.textContent=json;
};
document.addEventListener('securitypolicyviolation',event=>{
 report.events.push({directive:event.effectiveDirective,blockedURI:event.blockedURI,disposition:event.disposition,readyState:document.readyState});sync();
});
document.addEventListener('csp-audit-mounted',event=>{report.mounts.push({module:event.detail,styleCount:document.querySelectorAll('[style]').length});sync();});
new MutationObserver(sync).observe(document.documentElement,{childList:true,subtree:true});
sync();

document.addEventListener('DOMContentLoaded',()=>{report.afterRender={styleCount:document.querySelectorAll('[style]').length,events:report.events.length};display=document.createElement('output');display.id='csp-audit-display';display.className='csp-audit-display';display.setAttribute('aria-label','CSP audit');document.body.append(display);sync();});
