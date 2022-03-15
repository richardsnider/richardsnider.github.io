(()=>{var e={897:(e,t,n)=>{const o=n(440).loop,r=(e,t={})=>{const n=document.createElementNS(t.xmlns||"http://www.w3.org/1999/xhtml",t.tag||"div");return n.textContent=t.textContent||null,o(t.children,((e,t)=>r(n,t))),t.onclick&&n.addEventListener("click",t.onclick),delete t.xmlns,delete t.tag,delete t.textContent,delete t.children,delete t.onclick,o(t,((e,t)=>n.setAttribute(e,t||""))),e.appendChild(n)};e.exports=r},212:e=>{e.exports=function(e,t){this.key=e,this.value=t}},313:(e,t,n)=>{const o=n(212),r=(e,t)=>new o(e,t);e.exports=(e,t=r)=>{if(!e||isNaN(e)&&0==Object.keys(e).length)return;const n=Array.isArray(e);isFinite(e)&&(e=new Array(e).fill(!0));let s=0;const d={};for(const[r,i]of Object.entries(e)){const e=t(n?parseInt(r):r,i,s);null!=e&&(e instanceof o?d[e.key]=e.value:d[s]=e,s++)}return d}},440:(e,t,n)=>{const o=n(212),r=n(313);e.exports={keyValuePair:o,loop:(e,t)=>{const n=r(e,t);if(null==n)return;if(Object.keys(n).every(isFinite)){const t=Object.values(n);return"string"==typeof e&&t.every((e=>"string"==typeof e))?t.join(""):t}return n}}},205:(e,t,n)=>{const o=n(116),r=n(989),s=n(551),d=n(843),i=n(253);e.exports=async e=>{const t=e.detail||"",n=s(t),a=document.getElementById("request-status-banner"),c=document.getElementById("request-status-banner-message");a.classList.remove("hidden"),c.textContent=`Fetching ${t} . . .`,a.style.backgroundColor="grey";const l=document.getElementById("data-table-head"),h=document.getElementById("data-table-body");r.clearElement(l),r.clearElement(h);const g=await n;if(200!==g.status)return c.textContent=`Github returned status code ${g.status} ${await g.text()}`,void(a.style.backgroundColor="red");const p=await g.json();c.textContent=`${p.length} results returned!`,a.style.backgroundColor="green";const u=t.substr(0,t.lastIndexOf("/")||t.length-1);r.newElement(l,{tag:"tr",children:[{tag:"th",class:"padded",children:[d("back",{onclick:()=>{const e=new CustomEvent("LOAD_DATA",{detail:u});document.dispatchEvent(e)}})]},o("name"),o("type"),o("size"),o("sha")]}),r.loop(p,((e,t)=>r.newElement(h,i(`data-row-${e}`,t))))}},551:e=>{const t=`https://api.github.com/repos/${window.env.GITHUB_USERNAME}/${window.env.GITHUB_USERNAME}.github.io/contents`;e.exports=async(e="")=>fetch(`${t}/${e}`)},827:(e,t,n)=>{const o=n(843);e.exports=(e={})=>Object.assign({id:"action-buttons",children:[o("refresh",{onclick:()=>{const e=new URLSearchParams(location.search).get("directory")||"",t=new CustomEvent("LOAD_DATA",{detail:e});document.dispatchEvent(t)}}),o("add"),o("remove"),o("sort-down")]},e)},750:(e,t,n)=>{const o=n(912);e.exports=(e="<banner message>",t="banner")=>({id:t,class:"blue row",children:[{class:"row",children:[{},o("close",{height:"20px",width:"20px",fill:"#FFF",onclick:()=>document.getElementById(t).classList.toggle("hidden")})]},{id:`${t}-message`,class:"padded row",textContent:e}]})},843:(e,t,n)=>{const o=n(912);e.exports=(e,t={})=>o(e,Object.assign({width:"24px",height:"24px",class:"clickable padded curved grey-border"},t))},116:(e,t,n)=>{const o=n(843);e.exports=e=>({tag:"th",id:`${e}-header`,children:[{class:"padded resizable",textContent:`${e}`,children:[o("sort")]}]})},253:(e,t,n)=>{const o=n(843);e.exports=(e,t)=>Object.assign({tag:"tr",id:e,children:[{tag:"td",class:"padded grey-border",children:["dir"===t.type?o("folder",{height:"20px",width:"20px",fill:"#FFF",onclick:()=>{const e=new CustomEvent("LOAD_DATA",{detail:t.path});document.dispatchEvent(e)}}):{tag:"a",href:t.path,rel:"noreferrer noopener",target:"_blank",children:[o("view",{height:"20px",width:"20px",fill:"#FFF"})]}]},{tag:"td",class:"padded grey-border",children:[{tag:"a",href:"dir"===t.type?t.html_url:t.download_url,rel:"noreferrer noopener",target:"_blank",textContent:t.name}]},{tag:"td",class:"padded grey-border",textContent:t.type},{tag:"td",class:"padded grey-border",children:[{textContent:`${t.size}`}]},{tag:"td",class:"padded grey-border",children:[{textContent:t.sha}]}]})},941:(e,t,n)=>{const o=n(912);e.exports=(e={})=>Object.assign({id:"footer",class:"grey row",children:[{children:[{tag:"a",href:`https://linkedin.com/in/${window.env.LINKEDIN_USERNAME}`,rel:"noreferrer noopener",children:[o("linkedin",{fill:"#BBB"})]},{tag:"a",href:`https://github.com/${window.env.GITHUB_USERNAME}`,rel:"noreferrer noopener",children:[o("github",{fill:"#BBB"})]},{textContent:`Created by ${window.env.GITHUB_USERNAME}`}]}]},e)},561:(e,t,n)=>{const o=n(912);e.exports=(e={})=>Object.assign({id:"header",class:"grey-666 row",children:[{id:"left-header",children:[{id:"home-button",onclick:()=>{const e=new CustomEvent("LOAD_DATA",{detail:""});document.dispatchEvent(e)},children:[o("home")]},{id:"menu-button",onclick:()=>document.getElementById("menu").classList.toggle("hidden"),children:[o("menu")]},{onclick:()=>document.getElementById("search").classList.toggle("hidden"),children:[o("search")]}]},{id:"right-header",children:[{onclick:()=>document.getElementById("notifications").classList.toggle("hidden"),children:[o("notifications")]},{onclick:()=>document.getElementById("settings").classList.toggle("hidden"),children:[o("settings")]}]}]},e)},546:e=>{e.exports=(e={})=>Object.assign({id:"input-filter",class:"grey-222 padded curved input",contenteditable:"true",placeholder:"(work in progress) . . ."},e)},870:(e,t,n)=>{const o=n(546),r=n(827),s=n(750);e.exports=(e={})=>Object.assign({id:"main-row",class:"row",children:[{id:"action-bar",class:"grey-444 row",children:[r(),o({id:"filter-input"})]},s("Loading . . .","request-status-banner"),{tag:"table",id:"data-table",class:"row",children:[{tag:"thead",class:"grey-444",id:"data-table-head"},{tag:"tbody",id:"data-table-body"}]}]},e)},80:e=>{e.exports=(e={})=>Object.assign({id:"menu",class:"grey-333 hidden popup",children:[{class:"grey-border padded",textContent:"Section 1"},{class:"grey-border padded",textContent:"Section 2"},{class:"grey-border padded",textContent:"Section 3"}]},e)},1:e=>{e.exports=(e={})=>Object.assign({id:"notifications",class:"grey-333 hidden right-side popup",children:[{class:"grey-border padded",textContent:"Notification 1"},{class:"grey-border padded",textContent:"Notification 2"},{class:"grey-border padded",textContent:"Notification 3"}]},e)},409:e=>{e.exports=(e={})=>Object.assign({id:"settings",class:"grey-333 hidden right-side popup",children:[{class:"grey-border padded",textContent:"General Settings"},{class:"grey-border padded",textContent:"Profile"},{class:"grey-border padded",textContent:"Log out"}]},e)},912:e=>{e.exports=(e,t={})=>Object.assign({xmlns:"http://www.w3.org/2000/svg",tag:"svg",id:`${e}-svg`,width:"40px",height:"40px",class:"padded",viewBox:"0 0 24 24",children:[{xmlns:"http://www.w3.org/2000/svg",tag:"use",href:`#${e}-symbol`}]},t)},113:e=>{e.exports={bannerMessage:"Hello! Welcome to my github pages website (work in progress)! This UI uses github's web api to help you view files and directories I keep in this repo. I'm not a front-end expert and chose to develop and experiment with my own user interface library rather than just create another react app."}},989:(e,t,n)=>{const o=n(440),r=n(897),s=n(62);e.exports={keyValuePair:o.keyValuePair,loop:o.loop,newElement:r,clearElement:s}},62:e=>{e.exports=e=>{for(;e.firstChild;)e.removeChild(e.firstChild);e.innerHTML=""}},362:e=>{e.exports=(e,t)=>{const n=new URLSearchParams(location.search);n.set(e,t);const o=`${location.origin}${location.pathname}?${n.toString()}`;window.history.replaceState({},"",o)}}},t={};function n(o){var r=t[o];if(void 0!==r)return r.exports;var s=t[o]={exports:{}};return e[o](s,s.exports,n),s.exports}(()=>{const e=n(897),t=n(113),o=n(750),r=n(561),s=n(80),d=n(1),i=n(409),a=n(870),c=n(941),l=n(205),h=n(362),g=async()=>{console.log("Document intialized."),e(document.body,o(t.bannerMessage,"welcome-banner")),e(document.body,r()),e(document.body,s()),e(document.body,d()),e(document.body,i()),e(document.body,a()),e(document.body,c()),document.getElementById("filter-input").focus(),document.addEventListener("LOAD_DATA",l),document.addEventListener("LOAD_DATA",(e=>h("directory",e.detail)));const n=new URLSearchParams(location.search).get("directory")||"",g=new CustomEvent("LOAD_DATA",{detail:n});document.dispatchEvent(g)};(async()=>{document.addEventListener("DOMContentLoaded",g)})()})()})();
//# sourceMappingURL=main.js.map