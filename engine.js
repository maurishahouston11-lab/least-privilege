(function(){
  var SCN = {};
  (function(){
    var pick = function(key, tag){ var d = window[key]; if(!d){ var el = document.getElementById(tag); if(el) try{ d = JSON.parse(el.textContent); }catch(e){} } return d; };
    var a = pick('LP_DATA', 'scenario-data'), b = pick('LP_DATA2', 'scenario-data-2'), c = pick('LP_DATA3', 'scenario-data-3'), f = pick('LP_DATA4', 'scenario-data-4'), g5 = pick('LP_DATA5', 'scenario-data-5'), g6 = pick('LP_DATA6', 'scenario-data-6'), g7 = pick('LP_DATA7', 'scenario-data-7'), g8 = pick('LP_DATA8', 'scenario-data-8'), g9 = pick('LP_DATA9', 'scenario-data-9'), g10 = pick('LP_DATA10', 'scenario-data-10'), g11 = pick('LP_DATA11', 'scenario-data-11'), g12 = pick('LP_DATA12', 'scenario-data-12'), g13 = pick('LP_DATA13', 'scenario-data-13'), g14 = pick('LP_DATA14', 'scenario-data-14'), g15 = pick('LP_DATA15', 'scenario-data-15'), g16 = pick('LP_DATA16', 'scenario-data-16');
    if(a) SCN.s1 = a; if(b) SCN.s2 = b; if(c) SCN.s3 = c; if(f) SCN.s4 = f; if(g5) SCN.s5 = g5; if(g6) SCN.s6 = g6; if(g7) SCN.s7 = g7; if(g8) SCN.s8 = g8; if(g9) SCN.s9 = g9; if(g10) SCN.s10 = g10; if(g11) SCN.s11 = g11; if(g12) SCN.s12 = g12; if(g13) SCN.s13 = g13; if(g14) SCN.s14 = g14; if(g15) SCN.s15 = g15; if(g16) SCN.s16 = g16;
    // The multi-file build ships one scenario eagerly and a manifest for the
    // rest: every data file used to load before the roster could paint, which
    // is a megabyte nobody needs to play one shift. A stub carries exactly what
    // the roster renders — date, headline, blurb — with the check counts shaped
    // as empty tickets so the existing roster code needs no special case.
    var man = window.LP_MANIFEST;
    if(man) man.forEach(function(m){
      if(SCN[m.id]) return;
      SCN[m.id] = {_stub:true, src:m.src, global:m.global, id:m.id, year:m.year, month:m.month,
        dayOffset:m.dayOffset, dates:m.dates, startClock:m.startClock, eyebrow:m.eyebrow,
        headline:m.headline, blurb:m.blurb,
        tickets:m.steps.map(function(n){ return {checks:new Array(n)}; })};
    });
  })();
  var D = SCN.s1 || SCN.s2;
  var DESK = !!(window.LPDesktop && window.LPDesktop.run);
  var META = {};
  try{ META = JSON.parse(localStorage.getItem('lp.console.meta') || '{}') || {}; }catch(e){}
  function saveMeta(){ try{ localStorage.setItem('lp.console.meta', JSON.stringify(META)); }catch(e){} }
  function scnKey(id){ return 'lp.console.v6.' + id; }
  var KEY = 'lp.console.v3';
  var DOM = D.domain;
  var ME = 'ia.analyst@' + DOM;
  var DN = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  var DATES = {'-3':'18','-2':'19','-1':'20','0':'21','1':'22','2':'23','3':'24','4':'25','5':'26','6':'27','7':'28'};
  function APPROVERS(){ return (D.approvers && D.approvers.length) ? D.approvers : ['r.shah','g.oyelaran','m.cole','l.park']; }
  var DISP = [
    ['completed','Resolve — completed as requested'],
    ['completed-diff','Resolve — completed differently than requested'],
    ['declined','Resolve — declined, reply sent to requester'],
    ['route','Request approval (ticket moves to Pending)'],
    ['security','Escalate to Security Operations'],
    ['nochange','Resolve — no action needed']
  ];
  var MY_ROLES = [
    {r:'User Administrator', type:'active', note:'Permanent · assigned by Ravi Shah'},
    {r:'Groups Administrator', type:'active', note:'Permanent · assigned by Ravi Shah'},
    {r:'Exchange Administrator', type:'active', note:'Permanent · assigned by Ravi Shah'},
    {r:'Privileged Role Administrator', type:'eligible', note:'Eligible · max 2 hours · requires justification, ticket number and MFA'}
  ];

  // ---------- helpers ----------
  function hash(s){ var h = 2166136261; for(var i=0;i<s.length;i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h>>>0; }
  function guid(seed){ var out = ''; for(var i=0;i<4;i++) out += ('00000000' + hash(seed + '#' + i).toString(16)).slice(-8); return out.slice(0,8)+'-'+out.slice(8,12)+'-4'+out.slice(13,16)+'-a'+out.slice(17,20)+'-'+out.slice(20,32); }
  function pad(n){ return (n<10?'0':'') + n; }
  function dayOf(m){ return Math.floor(m/1440); }
  function dayName(d){ return DN[(((d + (D.dayOffset||0))%7)+7)%7]; }
  function fmt(m){ var d = dayOf(m), r = m - d*1440; return dayName(d) + ' ' + pad(Math.floor(r/60)) + ':' + pad(r%60); }
  function fmtLong(m){ var d = dayOf(m), r = m - d*1440; return dayName(d) + ' ' + ((D.dates||DATES)[d] || '') + ' ' + (D.month || 'Sep') + ' · ' + pad(Math.floor(r/60)) + ':' + pad(r%60); }
  function hhmm(m){ return fmt(m).slice(4); }
  function parseT(s){ var p = /^(\w{3}) (\d\d):(\d\d)/.exec(s||''); if(!p) return 0; var i = DN.indexOf(p[1]); if(i<0) return 0; var d = i - (D.dayOffset||0); if(d > 3) d -= 7; if(d < -3) d += 7; return d*1440 + (+p[2])*60 + (+p[3]); }
  function dur(mins){ var neg = mins<0; mins = Math.abs(mins); var d = Math.floor(mins/1440), h = Math.floor(mins%1440/60), m = mins%60; var s = d ? d + 'd ' + h + 'h' : (h ? h + 'h ' + pad(m) + 'm' : m + 'm'); return neg ? s + ' overdue' : s; }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function mail(upn){ var u = (S.users||{})[upn]; return ((u && u.signIn) || upn) + '@' + DOM; }
  function upnTaken(v){ var hit = null; allUsers().forEach(function(x){ if(x.status==='Not created') return; if(x.upn===v || x.signIn===v) hit = x; }); return hit; }
  function clone(o){ return JSON.parse(JSON.stringify(o)); }

  function expandAdList(list){ var out = list.slice(); list.forEach(function(g){ var p = D.nest[g]; while(p){ if(out.indexOf(p)<0) out.push(p); p = D.nest[p]; } }); return out; }
  function gsrc(name){ for(var i=0;i<D.groups.length;i++){ if(D.groups[i].name===name) return D.groups[i].source; } return null; }
  function gmeta(n){ return (D.gmeta && D.gmeta[n]) || ['—','—']; }

  function fresh(){
    var users = {};
    D.users.forEach(function(u){
      var c = clone(u);
      ['roles','apps','rules','devices','delegates','odAccess','mfa','sessions','groups'].forEach(function(k){ if(!c[k]) c[k] = []; });
      c.groups = (u.groups||[]).map(function(g){ return {g:g, type:'perm', exp:'', why:'Pre-existing', at:-99999}; });
      users[u.upn] = c;
    });
    var tickets = {};
    D.tickets.forEach(function(t){ tickets[t.id] = {status:'open', arrived:!t.arrive, assignee:null, tl:[], rb:[], asked:[], created:t.created ? parseT(t.created) : null, due:t.due && t.due[0]!=='+' ? parseT(t.due) : null}; });
    Object.keys(users).forEach(function(k){ var u = users[k];
      if(u.ad && u.ad.exists) expandAdList(u.ad.groups).forEach(function(g){ if(gsrc(g)==='AD') u.groups.push({g:g, type:'perm', exp:'', why:'Synced from Active Directory', at:-99999, src:'ad'}); });
    });
    var owners = {}; D.groups.forEach(function(g){ owners[g.name] = g.owners.slice(); });
    return {screen:'intro', page:'home', arg:null, utab:'overview', users:users, tickets:tickets, owners:owners, audit:[], clock:D.startClock, secs:17,
      scn:CUR, shares:clone(D.shares), adOnly:clone(D.adOnly), openFiles:clone(D.openFiles), deleg:clone(D.delegations), ca:clone(D.caPolicies), sync:{last:D.startClock-45}, adou:'all', ps:[], psu:'', adtab:'accounts',
      review:{items:{}, submitted:null}, evidence:{}, appRegs:clone(D.appRegs||[]), scan:clone(D.scan||{hits:[]}), risk:clone(D.risk||[]), consents:clone(D.consents||[]), authPolicy:clone(D.authPolicy||null), bg:clone(D.breakGlass||[]), bgLog:[], trusts:clone(D.trusts||[]), krb:clone(D.krbtgt||null), gpos:clone(D.gpos||[]),
      q:'', sf:'', sfilt:'all', tfilt:'open', notes:[], queue:[], fired:{}, extra:[], reports:{}, verified:{}, contacted:{}, pim:0, mfaNum:null, authErr:''};
  }
  var CUR = SCN.s1 ? 's1' : 's2';
  var S = fresh();
  function save(){ try{ localStorage.setItem(scnKey(S.scn || CUR), JSON.stringify(S)); }catch(e){} }
  // Fetch a scenario's data file if this build did not inline it, then continue.
  function ensureScenario(id, cb){
    var s = SCN[id];
    if(!s || !s._stub) return cb();
    var el = document.createElement('script');
    el.src = s.src; el.async = false;
    el.onload = function(){
      var d = window[s.global];
      if(d){ SCN[id] = d; cb(); } else scnFailed(cb);
    };
    el.onerror = function(){ scnFailed(cb); };
    document.head.appendChild(el);
  }
  // Fast first paint should not cost offline support. Once the roster is up and
  // the browser is idle, quietly pull the remaining data files so the service
  // worker has them before anybody goes offline.
  function prefetchScenarios(){
    var pending = Object.keys(SCN).filter(function(id){ return SCN[id] && SCN[id]._stub; });
    if(!pending.length) return;
    var i = 0;
    var next = function(){
      if(i >= pending.length) return;
      var s = SCN[pending[i++]];
      if(!s || !s._stub) return next();
      fetch(s.src, {credentials:'same-origin'}).then(function(){ setTimeout(next, 120); }).catch(function(){});
    };
    if(window.requestIdleCallback) requestIdleCallback(next, {timeout:4000}); else setTimeout(next, 2000);
  }
  function scnFailed(cb){
    openModal('Could not load this shift', '<p>The data file for this shift did not load. If you are offline and have not opened this shift before, it will not be available until you are back online.</p>', null);
    if(cb) cb(true);
  }
  function loadScenario(id){
    CUR = id; D = SCN[id]; initialLic = {}; D.users.forEach(function(u){ if(u.lic && u.lic!=='Not assigned') initialLic[u.lic] = (initialLic[u.lic]||0) + 1; });
    var loaded = null;
    try{ var raw = localStorage.getItem(scnKey(id)); if(raw){ var o = JSON.parse(raw); if(o && o.users && o.tickets && o.owners) loaded = o; } }catch(e){}
    S = loaded || fresh();
    S.scn = id;
    if(S.screen==='pick') S.screen = 'intro';
    // Progress persists; the session does not. Returning to a shift you are part
    // way through puts you back through sign-in, which is what the policy the
    // console states on every sign-in actually describes. A finished shift goes
    // to its scorecard instead.
    if(S.screen==='console'){ S.screen = 'login'; S.authErr = ''; S.resumed = true; }
  }

  var root = document.getElementById('root'), modalEl = document.getElementById('modal'), toastEl = document.getElementById('toast'), progEl = document.getElementById('prog');
  function U(upn){ return S.users[upn]; }
  function G(name){ for(var i=0;i<D.groups.length;i++){ if(D.groups[i].name===name) return D.groups[i]; } return null; }
  function T(id){ for(var i=0;i<D.tickets.length;i++){ if(D.tickets[i].id===id) return D.tickets[i]; } return null; }
  function AR(name){ for(var i=0;i<D.adminRoles.length;i++){ if(D.adminRoles[i].name===name) return D.adminRoles[i]; } return null; }
  function APP(name){ for(var i=0;i<D.apps.length;i++){ if(D.apps[i].name===name) return D.apps[i]; } return null; }
  function allUsers(){ return Object.keys(S.users).map(U); }
  function visibleTickets(){ return D.tickets.filter(function(t){ return S.tickets[t.id].arrived; }); }
  function isDyn(g){ return !!(D.dynamic && D.dynamic[g]); }
  function dynMember(u){ return u.status==='Enabled' && u.dept!=='External' && !u.service; }
  function names(u){ var n = u.groups.map(function(a){ return a.g; }); if(dynMember(u)) n.unshift('GRP-AllStaff'); return n; }
  function members(g){ return isDyn(g) ? allUsers().filter(dynMember) : allUsers().filter(function(u){ return u.groups.some(function(a){ return a.g===g; }); }); }
  function initials(n){ return n.split(' ').map(function(x){ return x[0]; }).join('').slice(0,2).toUpperCase(); }
  function who(k){
    if(D.whoMap && D.whoMap[k]) return D.whoMap[k];
    if(k==='hr') return 'People Operations (HR)'; if(k==='monitor') return 'Sign-in monitor (automated)'; if(k==='secops') return 'Security Operations';
    if(k==='ext') return 'lena.park.mf@gmail.example'; if(k==='you') return 'You (IAM Analyst)';
    var u = U(k); return u ? u.name + ' · ' + u.title : k;
  }
  function whoShort(k){ if(D.whoMap && D.whoMap[k]) return D.whoMap[k].split(' · ')[0]; if(k==='ext') return 'lena.park.mf@gmail.example'; if(k==='you') return 'You'; if(k==='secops') return 'Security Ops'; if(k==='monitor') return 'Sign-in monitor'; if(k==='hr') return 'People Ops'; var u = U(k); return u ? u.name : k; }
  function statusPill(s){ var c = s==='Enabled'?'en':(s==='Not created'?'nc':'dis'); return '<span class="pill ' + c + '">' + esc(s) + '</span>'; }
  function isOpen(st){ return st.status!=='resolved'; }
  function openCount(){ return visibleTickets().filter(function(t){ return isOpen(S.tickets[t.id]); }).length; }
  function resolvedCount(){ return D.tickets.filter(function(t){ return S.tickets[t.id].status==='resolved' || S.tickets[t.id].status==='pending'; }).length; }
  function unread(){ return S.notes.filter(function(n){ return !n.read; }).length; }
  function stamp(){ S.secs = (S.secs + 23) % 60; return fmtLong(S.clock) + ':' + pad(S.secs); }
  function allSignins(){ return D.signins.concat(S.extra).map(function(s){ s.m = parseT(s.t); return s; }).filter(function(s){ return s.m <= S.clock; }).sort(function(a,b){ return b.m - a.m; }); }
  function lastSignin(u){ var l = allSignins().filter(function(s){ return s.upn===u.upn && /^Success/.test(s.res); }); return l.length ? l[0].t : (u.lastSeen || 'Never'); }
  function mine(){ return S.audit.filter(function(a){ return a.mine; }); }
  function prog(){ progEl.classList.remove('run'); void progEl.offsetWidth; progEl.classList.add('run'); }
  function pimOn(){ return S.pim > S.clock; }
  var initialLic = {};
  function licAvail(name){ var L = D.licenses.filter(function(l){ return l.name===name; })[0]; if(!L) return 0; var now = allUsers().filter(function(u){ return u.lic===name; }).length; return L.total - (L.used - (initialLic[name]||0) + now); }
  function hasLic(u){ return !!u.lic && u.lic!=='Not assigned'; }
  function isSync(u){ return !!u.ad; }
  function onPrem(u){ return !!(u.ad && u.ad.exists); }
  function cloudFromAd(u){ return onPrem(u) ? expandAdList(u.ad.groups).filter(function(g){ return gsrc(g)==='AD'; }) : []; }
  function adGroup(name){ for(var i=0;i<D.adGroups.length;i++){ if(D.adGroups[i].name===name) return D.adGroups[i]; } return null; }
  function dn(u){ var o = (u.ad.ou||'Users (default container)').replace(' (default container)','').split('/').reverse().map(function(p){ return (p==='Users' ? 'CN=Users' : 'OU=' + p); }).join(','); return 'CN=' + u.name + ',' + o + ',DC=meridian,DC=local'; }
  function pendingFor(u){
    var p = [];
    if(!onPrem(u)) return p;
    if(u.status==='Not created'){ p.push('new account'); return p; }
    if(u.status!==(u.ad.enabled ? 'Enabled' : 'Disabled')) p.push('accountEnabled');
    var cur = u.groups.filter(function(a){ return a.src==='ad'; }).map(function(a){ return a.g; }).sort().join(',');
    if(cur !== cloudFromAd(u).slice().sort().join(',')) p.push('memberOf');
    if(u.ad.ouChanged) p.push('distinguishedName');
    return p;
  }
  function pendingAll(){ return allUsers().filter(function(u){ return pendingFor(u).length; }); }
  function runSync(manual){
    var ch = [];
    allUsers().forEach(function(u){
      var p = pendingFor(u); if(!p.length) return;
      u.status = u.ad.enabled ? 'Enabled' : 'Disabled';
      if(u.created==='—') u.created = 'Sep 21, 2026';
      var des = cloudFromAd(u);
      u.groups = u.groups.filter(function(a){ return a.src!=='ad'; }).concat(des.map(function(g){ return {g:g, type:'perm', exp:'', why:'Synced from Active Directory', at:-99999, src:'ad'}; }));
      u.ad.ouChanged = false;
      ch.push(u.name + ' (' + p.join(', ') + ')');
    });
    S.sync.last = S.clock;
    if(ch.length) S.audit.unshift({tl:stamp(), actor:'MF-AADC01 (directory sync)', cat:'Directory sync', action:'Sync cycle completed', target:ch.length + ' object(s) updated', detail:ch.join('; '), refs:[], cid:guid('sy'+S.clock), mine:false});
    return ch.length;
  }
  function share(path){ for(var i=0;i<S.shares.length;i++){ if(S.shares[i].path===path) return S.shares[i]; } return null; }
  var RANK = {'Full control':3,'Modify':2,'Change':2,'Read':1,'':0};
  function rankName(n){ return ['No access','Read','Modify','Full control'][n] || 'No access'; }
  function principals(u){ var p = [u.upn, 'Everyone', 'Authenticated Users']; if(onPrem(u)) p = p.concat(expandAdList(u.ad.groups)); p = p.concat(names(u)); return p; }
  function effective(u, sh){
    var pr = principals(u), sr = 0, nr = 0, deny = false;
    sh.share.forEach(function(a){ if(pr.indexOf(a.p)>=0) sr = Math.max(sr, RANK[a.rights]||0); });
    sh.ntfs.forEach(function(a){ if(pr.indexOf(a.p)<0) return; if(a.deny) deny = true; else nr = Math.max(nr, RANK[a.rights]||0); });
    if(deny) return {n:0, why:'Denied by an explicit Deny permission — deny always wins'};
    var eff = Math.min(sr, nr);
    return {n:eff, why:eff===0 ? 'No matching permission' : 'Share allows ' + rankName(sr) + ', NTFS allows ' + rankName(nr) + ', so the result is the lower of the two'};
  }
  function delegFor(ou){ return S.deleg.filter(function(x){ return x.ou===ou; }); }
  function gposFor(ou){ var chain = ['Domain']; if(ou){ var parts = ou.replace(' (default container)','').split('/'); for(var i=0;i<parts.length;i++) chain.push(parts.slice(0,i+1).join('/')); } return (S.gpos||D.gpos).filter(function(g){ return chain.indexOf(g.link)>=0 || g.link===D.domainFqdn + ' (domain)'; }); }
  function reviewItems(){
    if(!D.review) return [];
    var out = [];
    D.review.scope.forEach(function(g){
      var ag = adGroup(g), cg = G(g);
      if(cg && cg.source!=='AD'){
        members(g).forEach(function(u){ var a = u.groups.filter(function(x){ return x.g===g; })[0]; out.push({g:g, id:u.upn, name:u.name, title:u.title, kind:'cloud', why:(a && a.why && a.why!=='Pre-existing' ? a.why : (u.note || u.title)), last:lastSignin(u), upn:u.upn}); });
      }
      if(ag){
        allUsers().filter(function(u){ return onPrem(u) && u.ad.groups.indexOf(g)>=0; }).forEach(function(u){ out.push({g:g, id:u.upn, name:u.name, title:u.title, kind:'ad', why:u.ad.desc || 'On-premises group', last:u.ad.lastLogon, upn:u.upn}); });
        S.adOnly.forEach(function(o, i){ if(o.groups.indexOf(g)>=0) out.push({g:g, id:o.sam, name:o.name, title:'Service account', kind:'adOnly', why:o.desc, last:o.lastLogon || o.last, idx:i}); });
      }
    });
    return out;
  }
  function reviewKey(it){ return it.g + '|' + it.id; }
  function reviewDone(){ var its = reviewItems(); return its.length>0 && its.every(function(it){ return S.review.items[reviewKey(it)]; }); }
  function sodHits(){
    var out = [];
    (D.sod || []).forEach(function(r){
      allUsers().forEach(function(u){
        var hold = function(side){
          if(side.group) return names(u).indexOf(side.group)>=0 || (onPrem(u) && u.ad.groups.indexOf(side.group)>=0);
          return u.apps.some(function(a){ return a.app===side.app && (!side.role || a.role===side.role); });
        };
        if(hold(r.a) && hold(r.b)) out.push({u:u, r:r});
      });
    });
    return out;
  }
  function evidencePool(){
    var out = [];
    if(S.review && S.review.submitted!=null) out.push({k:'review', label:'Access review ' + (D.review ? D.review.id : '') + ' — submitted ' + fmt(S.review.submitted), sub:reviewItems().length + ' decisions recorded'});
    Object.keys(S.reports || {}).forEach(function(r){ out.push({k:'case:' + r, label:'Security case — ' + (U(r) ? U(r).name : r), sub:String(S.reports[r]).slice(0, 90)}); });
    S.audit.slice(0, 40).forEach(function(a, i){ out.push({k:'audit:m' + i, label:a.tl + ' · ' + a.action + ' · ' + a.target, sub:a.detail || '', detail:a.detail || ''}); });
    (D.auditSeed || []).forEach(function(a, i){ out.push({k:'audit:s' + i, label:a.tl + ' · ' + a.action + ' · ' + a.target, sub:a.detail || '', detail:a.detail || ''}); });
    return out;
  }
  function evidenceOf(fid){ return (S.evidence && S.evidence[fid]) || []; }
  function riskFor(upn){ return S.risk.filter(function(r){ return r.upn===upn; }); }
  function riskState(upn){ var rs = riskFor(upn); if(!rs.length) return null; return rs.every(function(r){ return r.state==='confirmed'; }) ? 'confirmed' : rs.every(function(r){ return r.state!=='atRisk'; }) ? 'dismissed' : 'atRisk'; }
  function consentBy(id){ for(var i=0;i<S.consents.length;i++){ if(S.consents[i].id===id) return S.consents[i]; } return null; }
  function caBy(id){ var p = null; S.ca.forEach(function(x){ if(x.id===id) p = x; }); return p; }
  function pname(id){ var u = U(id); if(u) return u.name; var o = adOnlyBy(id); return o ? o.name : id; }
  function svcList(){ return S.adOnly.filter(function(o){ return o.kind==='svc' || (o.runsOn && o.runsOn.length); }); }
  function jobBy(name){ var hit = null; S.adOnly.forEach(function(o){ (o.runsOn||[]).forEach(function(j, i){ if(j.name===name) hit = {o:o, j:j, i:i}; }); }); return hit; }
  function jobOk(j){ return j.essential ? (j.enabled && j.cred==='current') : (!j.enabled || j.cred==='current'); }
  function appBy(n){ for(var i=0;i<D.apps.length;i++){ if(D.apps[i].name===n) return D.apps[i]; } return null; }
  // Single sign-on state lives on S so a shift can be replayed from saved state.
  // D.apps carries the starting configuration; sso(a) returns the live copy.
  function sso(a){ var n = typeof a==='string' ? a : a.name; S.sso = S.sso || {};
    if(!S.sso[n]){ var seed = (appBy(n)||{}).sso; S.sso[n] = seed ? JSON.parse(JSON.stringify(seed)) : null; }
    return S.sso[n]; }
  function scim(a){ var n = typeof a==='string' ? a : a.name; S.scim = S.scim || {};
    if(!S.scim[n]){ var seed = (appBy(n)||{}).scim; S.scim[n] = seed ? JSON.parse(JSON.stringify(seed)) : null; }
    return S.scim[n]; }
  function certExpired(c){ return !!(c && c.expired); }
  function appReg(id){ for(var i=0;i<S.appRegs.length;i++){ if(S.appRegs[i].id===id) return S.appRegs[i]; } return null; }
  function scanHit(id){ var h = null; (S.scan.hits||[]).forEach(function(x){ if(x.id===id) h = x; }); return h; }
  function adOnlyBy(sam){ for(var i=0;i<S.adOnly.length;i++){ if(S.adOnly[i].sam===sam) return S.adOnly[i]; } return null; }
  function adAccounts(){
    var l = allUsers().filter(onPrem).map(function(u){ return {sam:u.ad.sam, name:u.name, ou:u.ad.ou, enabled:u.ad.enabled, pwdSet:u.ad.pwdSet, pne:u.ad.pwdNeverExpires, last:u.ad.lastLogon, groups:u.ad.groups, desc:u.ad.desc, upn:u.upn}; });
    return l.concat(S.adOnly.map(function(o, i){ return {sam:o.sam, name:o.name, ou:o.ou, enabled:o.enabled, pwdSet:o.pwdSet, pne:o.pwdNeverExpires, last:o.lastLogon, groups:o.groups, desc:o.desc, idx:i}; }));
  }
  function syncGuard(what){
    openModal('Managed on-premises', '<p>This object is synced from <b>Active Directory</b>, so ' + esc(what) + ' can’t be changed in the cloud console (P12).</p><p class="faint">Make the change in Active Directory. Directory sync carries it to the cloud on the next cycle, or when you run one.</p>', 'Open Active Directory', function(){ S.utab = 'ad'; render(); });
  }

  // ---------- toast / notifications ----------
  var toastTimer;
  function toast(msg, undo){
    toastEl.innerHTML = '<div class="toast" role="status"><span>' + esc(msg) + '</span>' + (undo ? '<button type="button" id="undo">Undo</button>' : '') + '</div>';
    clearTimeout(toastTimer); toastTimer = setTimeout(function(){ toastEl.innerHTML=''; }, undo ? 6000 : 3400);
    if(undo) document.getElementById('undo').onclick = function(){ toastEl.innerHTML=''; undo(); };
  }
  function notify(kind, from, text, link){
    S.notes.unshift({t:fmt(S.clock), kind:kind, from:from, text:text, link:link||null, read:false});
    toast((kind==='chat' ? whoShort(from) + ': ' : '') + text.slice(0, 90) + (text.length>90?'…':''));
  }

  // ---------- event queue ----------
  function later(mins, ev, arg){ S.queue.push({at:S.clock + mins, ev:ev, arg:arg||null}); }
  function addSignin(o){ o.t = fmt(S.clock); S.extra.push(o); }
  function tl(tid, kind, from, text){ S.tickets[tid].tl.push({t:fmt(S.clock), kind:kind, from:from, text:text}); }
  var EV = {
    samCheck: function(){
      var s = U('s.whitfield'); if(s.status!=='Disabled') return;
      if(s.sessions.length){
        addSignin({upn:'s.whitfield', app:'Finance share › Payroll', ip:'73.114.x.x', loc:'Home broadband', dev:'Personal laptop', mfa:'Previously satisfied (token)', res:'Success — existing session token'});
        notify('alert', 'monitor', 'Disabled account Sam Whitfield accessed Finance share › Payroll from Personal laptop using an existing session.', {user:'s.whitfield', utab:'sessions'});
      } else addSignin({upn:'s.whitfield', app:'Finance share', ip:'73.114.x.x', loc:'Home broadband', dev:'Personal laptop', mfa:'Not reached', res:'Failure — account disabled'});
    },
    priyaFirst: function(){
      var p = U('p.nair'); if(p.status!=='Enabled' || !p.tap) return;
      addSignin({upn:'p.nair', app:'Windows sign-in', ip:'10.20.4.58', loc:'HQ office network', dev:'MF-LT-0244', mfa:'Temporary Access Pass → registered Authenticator', res:'Success'});
      p.sessions.push({dev:'MF-LT-0244 · Windows', loc:'HQ office network', ip:'10.20.4.58', app:'Workspace (web + desktop)', since:fmt(S.clock)});
      p.device = 'MF-LT-0244'; p.mfa = ['Authenticator app (push)']; p.pwd = 'Sep 21, 2026 (set at first sign-in)';
      p.devices = [{id:'MF-LT-0244', kind:'corp', os:'Windows 11', comp:'Compliant', seen:fmt(S.clock), state:'Active'}];
    },
    reply: function(a){ tl(a.tid, 'reply', a.from, a.text); notify('reply', a.from, 'replied on ' + a.tid + ': “' + a.text + '”', {ticket:a.tid}); },
    chat: function(a){ notify('chat', a.from, a.text, a.link); if(a.tid) tl(a.tid, 'msg', a.from, a.text); },
    approval: function(a){
      var st = S.tickets[a.tid], r = approvalResult(a.tid, a.to);
      if(st.status!=='pending') return;
      st.status = 'returned'; st.approval = {from:a.to, decision:r.d, at:S.clock};
      if(a.tid==='MF-1047' && a.to==='l.park') S.verified['l.park'] = true;
      tl(a.tid, 'approval', a.to, (r.d==='approved' ? 'APPROVED — ' : r.d==='declined' ? 'DECLINED — ' : 'RETURNED — ') + r.text);
      notify('ticket', a.to, a.tid + ' ' + (r.d==='approved' ? 'approved' : r.d==='declined' ? 'declined' : 'sent back') + ': ' + r.text, {ticket:a.tid});
    },
    secops: function(a){
      var st = S.tickets[a.tid], text = securityReply(a.tid);
      tl(a.tid, 'msg', 'secops', text);
      var keep = a.tid==='MF-1047' || !!((D.security||{})[a.tid] && (D.security||{})[a.tid].keep);
      if(!keep){ st.status = 'returned'; st.approval = {from:'secops', decision:'returned', at:S.clock}; }
      notify('chat', 'secops', text, {ticket:a.tid});
    },
    report: function(a){ notify('chat', 'secops', reportReply(a.upn), {user:a.upn}); },
    adExpire: function(a){
      var u = U(a.u); if(!u || !onPrem(u)) return;
      if(u.ad.groups.indexOf(a.g)<0) return;
      u.ad.groups = u.ad.groups.filter(function(g){ return g!==a.g; });
      S.audit.unshift({tl:stamp(), actor:'MF-PIM (scheduled)', cat:'Active Directory', action:'Time-bound assignment expired', target:a.g, detail:u.name + ' removed automatically at the end of the approved window.', refs:['u:'+a.u,'g:'+a.g], cid:guid('x'+a.u+a.g), mine:false});
      notify('alert', 'monitor', 'Scheduled removal ran: ' + u.name + ' removed from ' + a.g + '.', {user:a.u, utab:'ad'});
    }
  };
  function replyFor(tid){ return (D.replies || {})[tid] || null; }
  function approvalResult(tid, to){
    var t = (D.approvals || {})[tid];
    if(t && t[to]) return t[to];
    if(t && t._) return t._;
    return {d:'wrong', text:'I got an approval request for ' + tid + '. This doesn’t need me. Can you check who owns it?'};
  }
  function securityReply(tid){
    var m = D.security || {};
    if(m[tid]){ if(m[tid].marks) S.reports[m[tid].marks] = S.reports[m[tid].marks] || ('Escalated via ' + tid); return m[tid].text || m[tid]; }
    return m._ || ('Received ' + tid + '. We don’t see a security angle, so it’s back in your queue.');
  }
  function reportReply(upn){
    var m = D.secReports || {};
    return m[upn] || (m._ || 'Report received for ' + whoShort(upn) + '. We’ll review and follow up if we find anything.').replace('{who}', whoShort(upn));
  }
  function fireRule(r){
    if(r.cond && !test(r.cond)) return;
    if(r.notify) notify(r.notify.kind, r.notify.from, r.notify.text, r.notify.link || null);
    if(r.signin) addSignin(clone(r.signin));
  }
  function run(){
    if(S.screen!=='console') return;
    if(S.clock - S.sync.last >= 30) runSync(false);
    (D.timed || []).forEach(function(r){ var k = 't:' + r.id; if(S.fired[k]) return; if(S.clock < D.startClock + r.at) return; S.fired[k] = 1; fireRule(r); });
    (D.arrivals || []).forEach(function(a){
      var st = S.tickets[a.ticket]; if(!st || st.arrived) return;
      if(resolvedCount() >= (a.afterResolved==null ? 99 : a.afterResolved) || S.clock >= D.startClock + (a.at==null ? 9999 : a.at)){
        st.arrived = true; st.created = S.clock; st.due = S.clock + (a.sla || 60);
        notify('ticket', a.from || 'hr', a.text, {ticket:a.ticket});
      }
    });
    var due = S.queue.filter(function(q){ return q.at <= S.clock; });
    S.queue = S.queue.filter(function(q){ return q.at > S.clock; });
    due.forEach(function(q){ EV[q.ev](q.arg); });
  }

  function act(action, target, fn, msg, o){
    o = o || {};
    fn();
    S.audit.unshift({tl:stamp(), actor:ME, cat:o.cat||'User management', action:action, target:target, detail:o.detail||'', refs:o.refs||[], cid:guid('c'+S.audit.length+action+target), mine:true});
    S.clock += o.mins || 2; run(); save(); prog(); toast(msg || action, o.undo); render();
  }
  function nav(page, arg, utab){
    if(page==='scenarios'){ S.screen = 'pick'; save(); closePanel(); render(); window.scrollTo(0,0); return; } S.page = page; S.arg = arg||null; if(utab) S.utab = utab; else if(page==='user') S.utab='overview'; closePanel(); render(); window.scrollTo(0,0); }

  // ---------- modal ----------
  function openModal(title, body, okLabel, onOk, onMount, danger){
    modalEl.innerHTML = '<div class="modal-bg" id="mbg"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="mtitle"><div class="modal-h" id="mtitle">' + esc(title) + '</div><div class="modal-b">' + body + '</div><div class="modal-f">' + (okLabel ? '<button class="btn sec" id="mcancel" type="button">Cancel</button><button class="btn' + (danger?' dangerfill':'') + '" id="mok" type="button">' + esc(okLabel) + '</button>' : '<button class="btn" id="mcancel" type="button">Close</button>') + '</div></div></div>';
    var close = function(){ modalEl.innerHTML=''; document.removeEventListener('keydown', onKey); };
    var onKey = function(e){ if(e.key==='Escape') close(); };
    document.addEventListener('keydown', onKey);
    document.getElementById('mcancel').onclick = close;
    document.getElementById('mbg').onclick = function(e){ if(e.target.id==='mbg') close(); };
    var ok = document.getElementById('mok'); if(ok) ok.onclick = function(){ if(onOk()!==false) close(); };
    if(onMount) onMount(close);
    var f = modalEl.querySelector('select,input:not([type=radio]):not([type=checkbox]),textarea'); if(f) f.focus();
  }
  function confirmBox(title, html, okLabel, fn, danger){ openModal(title, html, okLabel, function(){ fn(); }, null, danger); }
  function impact(lines, faint){ return '<div class="impact"><div class="k">Impact</div>' + lines.map(function(l){ return '<p>' + l + '</p>'; }).join('') + (faint ? '<p class="faint">' + faint + '</p>' : '') + '</div>'; }
  function later2(fn){ setTimeout(fn, 30); }

  // ---------- PIM ----------
  function requirePim(then){
    if(pimOn()){ then(); return; }
    openModal('Privileged role required', '<p>This change needs <b>Privileged Role Administrator</b>. You hold it as <i>eligible</i>, so you have to activate it first (P9).</p><p class="faint">Your standing roles can’t change admin roles or role-assignable groups.</p>', 'Activate role', function(){ later2(function(){ activatePim(then); }); });
  }
  function activatePim(then){
    openModal('Activate — Privileged Role Administrator', '<label class="fld" for="p-dur">Duration</label><select class="in" id="p-dur"><option value="60">1 hour</option><option value="120">2 hours (maximum)</option></select>' +
      '<label class="fld" for="p-tk">Ticket number</label><input class="in" id="p-tk" placeholder="e.g. ' + esc(D.tickets[0] ? D.tickets[0].id : 'MF-1042') + '">' +
      '<label class="fld" for="p-why">Justification</label><input class="in" id="p-why" placeholder="What privileged change are you making?"><p class="hint" id="p-err"></p>', 'Continue', function(){
        var tk = document.getElementById('p-tk').value.trim(), why = document.getElementById('p-why').value.trim(), d = +document.getElementById('p-dur').value;
        if(!/^[A-Za-z]{2,4}-\d{3,5}$/.test(tk)){ document.getElementById('p-err').textContent = 'Enter a valid ticket number, like ' + (D.tickets[0] ? D.tickets[0].id : 'MF-1042') + '.'; return false; }
        if(why.length < 6){ document.getElementById('p-err').textContent = 'A justification is required.'; return false; }
        later2(function(){ stepUp('Activating a privileged role requires MFA.', function(){
          act('Activate eligible role', 'Privileged Role Administrator', function(){ S.pim = S.clock + d; }, 'Privileged Role Administrator active until ' + hhmm(S.clock + d), {cat:'Role management', detail:'PIM activation for ' + d + ' min. Ticket ' + tk.toUpperCase() + '. Justification: “' + why + '”', mins:1});
          if(then) later2(then);
        }); });
      });
  }
  function stepUp(msg, ok){
    var n = 10 + hash('s' + S.clock + S.audit.length) % 89, opts = [n, (n+29)%90+10, (n+53)%90+10].sort(function(a,b){ return (hash('q'+a)%5)-(hash('q'+b)%5); });
    openModal('Verify your identity', '<p>' + esc(msg) + '</p><p class="faint">Open your Authenticator app and enter this number.</p><div class="bignum sm" id="su-num">' + n + '</div><p class="hint" style="text-align:center">On your phone:</p><div class="ph-keys inline">' + opts.map(function(o){ return '<button type="button" data-su="' + o + '">' + o + '</button>'; }).join('') + '</div><p class="hint" id="su-err"></p>', null, null, function(close){
      modalEl.querySelectorAll('[data-su]').forEach(function(b){ b.onclick = function(){ if(+b.dataset.su===n){ close(); ok(); } else document.getElementById('su-err').textContent = 'Wrong number. Request denied. Try again.'; }; });
    });
  }

  // ---------- memberships, roles, apps, owners ----------
  var DURS = [['4h','4 hours from now',240],['8h','8 hours from now',480],['wknd','Scheduled: Sat 26 Sep 00:00 → Mon 28 Sep 06:00',0],['7d','7 days from now',10080],['30d','30 days from now',43200]];
  function durLabel(k){ if(k==='wknd') return 'Sat 26 Sep 00:00 → Mon 28 Sep 06:00'; if(k==='7d') return 'until Mon 28 Sep ' + hhmm(S.clock); if(k==='30d') return 'until Wed 21 Oct'; for(var i=0;i<DURS.length;i++){ if(DURS[i][0]===k) return 'until ' + fmt(S.clock + DURS[i][2]); } }
  function snap(u){ return clone({groups:u.groups, roles:u.roles, apps:u.apps}); }
  function undoFor(u, before, label){ return function(){ act('Revert change', u.name + ' · ' + label, function(){ u.groups = before.groups; u.roles = before.roles; u.apps = before.apps; }, 'Reverted: ' + label, {cat:'Group management', refs:['u:'+u.upn]}); }; }
  function markPriv(u){ u.privAt = S.clock; }

  function addMembership(upn, gname){
    var go = function(){
      var cands = allUsers().filter(function(u){ return u.status!=='Not created' && !u.service && !u.groups.some(function(a){ return a.g===gname; }); });
      var userSel = upn ? '' : '<label class="fld" for="m-user">User</label><select class="in" id="m-user">' + cands.map(function(u){ return '<option value="' + u.upn + '">' + esc(u.name) + ' (' + mail(u.upn) + ')</option>'; }).join('') + '</select>';
      var grpSel = gname ? '' : '<label class="fld" for="m-group">Group</label><select class="in" id="m-group">' + D.groups.filter(function(g){ return !isDyn(g.name) && g.source!=='AD' && !U(upn).groups.some(function(a){ return a.g===g.name; }); }).map(function(g){ return '<option value="' + g.name + '">' + g.name + (g.tier!=='standard' ? ' — ' + g.tier : '') + '</option>'; }).join('') + '</select><p class="hint" id="m-gdesc"></p>';
      var body = (upn ? '<p class="hint">Adding a membership for <b>' + esc(U(upn).name) + '</b>.</p>' : '<p class="hint">Adding a member to <b>' + esc(gname) + '</b>.</p>') + userSel + grpSel +
        '<div id="m-warn"></div><label class="fld">Assignment type</label>' +
        '<label class="radio on" id="r-perm"><input type="radio" name="atype" value="perm" id="at-perm" checked><span><b>Permanent</b><br><span class="faint">Stays until someone removes it</span></span></label>' +
        '<label class="radio" id="r-tb"><input type="radio" name="atype" value="tb" id="at-tb"><span><b>Time-bound</b><br><span class="faint">Starts and expires on a schedule</span></span></label>' +
        '<div id="durwrap" hidden><label class="fld" for="m-dur">Window</label><select class="in" id="m-dur">' + DURS.map(function(d){ return '<option value="' + d[0] + '">' + d[1] + '</option>'; }).join('') + '</select></div>' +
        '<label class="fld" for="m-why">Justification</label><input class="in" id="m-why" placeholder="Why is this access needed? Reference the ticket."><p class="hint" id="m-err"></p>';
      openModal('Add membership', body, 'Add', function(){
        var u = upn || document.getElementById('m-user').value, g = gname || document.getElementById('m-group').value;
        var why = document.getElementById('m-why').value.trim();
        if(!u || !g){ document.getElementById('m-err').textContent = 'Nothing available to add.'; return false; }
        if(G(g).roleAssignable && !pimOn()){ document.getElementById('m-err').textContent = g + ' is role-assignable. Activate Privileged Role Administrator first (P9).'; return false; }
        if(why.length < 4){ document.getElementById('m-err').textContent = 'Add a justification. It’s recorded in the audit log.'; return false; }
        var tb = document.getElementById('at-tb').checked, d = document.getElementById('m-dur').value, uu = U(u), before = snap(uu);
        act('Add member to group', g, function(){
          uu.groups.push({g:g, type:tb?'tb':'perm', exp:tb?durLabel(d):'', win:tb?d:'', why:why, at:S.clock});
        }, 'Added ' + uu.name + ' to ' + g, {cat:'Group management', refs:['u:'+u,'g:'+g], detail:uu.name + ' added' + (tb ? ', time-bound, ' + durLabel(d) : ', permanent') + '. Justification: “' + why + '”', undo:undoFor(uu, before, 'add to ' + g)});
      }, function(){
        var sync = function(){
          var tb = document.getElementById('at-tb').checked; document.getElementById('durwrap').hidden = !tb; document.getElementById('r-tb').classList.toggle('on', tb); document.getElementById('r-perm').classList.toggle('on', !tb);
          var g = G(gname || (document.getElementById('m-group')||{}).value); var gd = document.getElementById('m-gdesc'); if(gd && g) gd.textContent = 'Grants: ' + g.desc + ' · Owner: ' + g.owner;
          document.getElementById('m-warn').innerHTML = g && g.tier!=='standard' ? '<div class="note">' + (g.tier==='privileged' ? '⚠ Privileged group. Membership grants administrative rights.' : '⚠ Sensitive group. Contains confidential data.') + (g.roleAssignable ? ' Role-assignable: requires Privileged Role Administrator.' : '') + '</div>' : '';
        };
        document.getElementById('at-perm').onchange = sync; document.getElementById('at-tb').onchange = sync;
        var mg = document.getElementById('m-group'); if(mg) mg.onchange = sync; sync();
      });
    };
    if(gname && G(gname).roleAssignable) requirePim(go); else go();
  }
  function removeMembership(upn, idx){
    var u = U(upn), a = u.groups[idx], g = G(a.g), before = snap(u);
    var go = function(){
      confirmBox('Remove membership', '<p>Remove <b>' + esc(u.name) + '</b> from <span class="mono">' + esc(a.g) + '</span>?</p>' + impact([esc(u.name) + ' loses: ' + esc(g ? g.desc : a.g) + '.'], 'New sign-ins lose access right away. Open sessions keep their current token until it refreshes (up to about an hour) unless you revoke sessions.'), 'Remove', function(){
        act('Remove member from group', a.g, function(){ u.groups.splice(idx,1); if(g && g.tier==='privileged') markPriv(u); }, 'Removed ' + u.name + ' from ' + a.g, {cat:'Group management', refs:['u:'+upn,'g:'+a.g], detail:u.name + ' removed (' + (a.type==='tb'?'time-bound':'permanent') + ' assignment).', undo:undoFor(u, before, 'remove from ' + a.g)});
      }, true);
    };
    if(g && g.roleAssignable) requirePim(go); else go();
  }
  function removeRole(upn, idx){
    var u = U(upn), r = u.roles[idx], before = snap(u);
    requirePim(function(){
      var isBg = (S.bg||[]).some(function(x){ return x.id===u.upn; });
      confirmBox('Remove admin role', '<p>Remove <b>' + esc(r.r) + '</b> (' + (r.type==='active'?'active, permanent':'eligible') + ') from <b>' + esc(u.name) + '</b>?</p>' +
        (isBg ? '<div class="note bad">This is an <b>emergency access account</b>. Its standing role and its policy exclusions are deliberate: they are what let somebody back in when the systems that would normally grant access are the broken ones. Removing this makes the account look tidier and makes the next lockout unrecoverable (P42).</div>' : '') +
        impact([esc(AR(r.r).desc)], 'Open sessions keep admin claims until their token refreshes unless you revoke sessions.'), 'Remove role', function(){
        act('Remove role assignment', r.r, function(){ u.roles.splice(idx,1); markPriv(u); }, 'Removed ' + r.r + ' from ' + u.name, {cat:'Role management', refs:['u:'+upn,'r:'+r.r], detail:u.name + ' · ' + r.type + ' assignment removed.', undo:undoFor(u, before, 'remove role ' + r.r)});
      }, true);
    });
  }
  function addRole(upn){
    requirePim(function(){
      var u = U(upn);
      openModal('Assign admin role', '<p class="hint">Assigning a role to <b>' + esc(u.name) + '</b>.</p><label class="fld" for="ar-r">Role</label><select class="in" id="ar-r">' + D.adminRoles.map(function(r){ return '<option>' + esc(r.name) + '</option>'; }).join('') + '</select>' +
        '<label class="fld" for="ar-t">Assignment</label><select class="in" id="ar-t"><option value="eligible">Eligible — must activate with MFA and justification</option><option value="active">Active — standing access</option></select><label class="fld" for="ar-why">Justification</label><input class="in" id="ar-why"><p class="hint" id="ar-err"></p>', 'Assign', function(){
          var r = document.getElementById('ar-r').value, t = document.getElementById('ar-t').value, why = document.getElementById('ar-why').value.trim();
          if(why.length<4){ document.getElementById('ar-err').textContent = 'Justification required.'; return false; }
          act('Add role assignment', r, function(){ u.roles.push({r:r, type:t, since:'Sep 21, 2026', by:'ia.analyst', at:S.clock}); }, 'Assigned ' + r + ' to ' + u.name, {cat:'Role management', refs:['u:'+upn,'r:'+r], detail:t + ' assignment. “' + why + '”'});
        });
    });
  }
  function removeApp(upn, idx){
    var u = U(upn), a = u.apps[idx], before = snap(u);
    confirmBox('Remove app role assignment', '<p>Remove <b>' + esc(a.role) + '</b> in <b>' + esc(a.app) + '</b> from ' + esc(u.name) + '?</p>' + impact(['This is a direct assignment. Group changes don’t affect it.']), 'Remove', function(){
      act('Remove app role assignment', a.app, function(){ u.apps.splice(idx,1); if(/Admin/.test(a.role)) markPriv(u); }, 'Removed ' + a.role + ' in ' + a.app + ' from ' + u.name, {cat:'Application management', refs:['u:'+upn,'a:'+a.app], detail:u.name + ' · ' + a.role + ' (direct).', undo:undoFor(u, before, 'remove ' + a.app + ' role')});
    }, true);
  }
  function addApp(upn){
    var u = U(upn);
    openModal('Assign app role', '<label class="fld" for="ap-a">Application</label><select class="in" id="ap-a">' + D.apps.map(function(a){ return '<option>' + esc(a.name) + '</option>'; }).join('') + '</select><label class="fld" for="ap-r">Role</label><select class="in" id="ap-r"></select><label class="fld" for="ap-why">Justification</label><input class="in" id="ap-why"><p class="hint" id="ap-err"></p>', 'Assign', function(){
      var a = document.getElementById('ap-a').value, r = document.getElementById('ap-r').value, why = document.getElementById('ap-why').value.trim();
      if(why.length<4){ document.getElementById('ap-err').textContent = 'Justification required.'; return false; }
      act('Add app role assignment', a, function(){ u.apps.push({app:a, role:r, since:'Sep 21, 2026', by:'ia.analyst'}); }, 'Assigned ' + r + ' in ' + a, {cat:'Application management', refs:['u:'+upn,'a:'+a], detail:u.name + ' · ' + r + ' (direct). “' + why + '”'});
    }, function(){ var s = function(){ document.getElementById('ap-r').innerHTML = APP(document.getElementById('ap-a').value).roles.map(function(r){ return '<option>' + esc(r) + '</option>'; }).join(''); }; document.getElementById('ap-a').onchange = s; s(); });
  }
  function removeOwner(g, upn){
    var go = function(){
      var u = U(upn);
      confirmBox('Remove owner', '<p>Remove <b>' + esc(u.name) + '</b> as an owner of <span class="mono">' + esc(g) + '</span>?</p>' + impact(['Owners can add and remove members, including themselves.']), 'Remove owner', function(){
        act('Remove owner from group', g, function(){ S.owners[g] = S.owners[g].filter(function(x){ return x!==upn; }); if(G(g).tier==='privileged') markPriv(u); }, 'Removed ' + u.name + ' as owner of ' + g, {cat:'Group management', refs:['u:'+upn,'g:'+g], detail:u.name + ' removed from owners.'});
      }, true);
    };
    if(G(g).roleAssignable) requirePim(go); else go();
  }
  function addOwner(g){
    var go = function(){
      var cands = allUsers().filter(function(u){ return u.status==='Enabled' && !u.service && S.owners[g].indexOf(u.upn)<0; });
      openModal('Add owner', '<label class="fld" for="ow-u">User</label><select class="in" id="ow-u">' + cands.map(function(u){ return '<option value="' + u.upn + '">' + esc(u.name) + '</option>'; }).join('') + '</select>', 'Add owner', function(){
        var up = document.getElementById('ow-u').value; act('Add owner to group', g, function(){ S.owners[g].push(up); }, 'Added ' + U(up).name + ' as owner of ' + g, {cat:'Group management', refs:['u:'+up,'g:'+g]});
      });
    };
    if(G(g).roleAssignable) requirePim(go); else go();
  }

  // ---------- account lifecycle ----------
  function createAccount(upn){
    var u = U(upn), roles = Object.keys(D.roles);
    var others = allUsers().filter(function(x){ return x.status!=='Not created' && !x.service; });
    var mgr = U(u.mgrUpn);
    var body = '<p class="hint">Create the account for <b>' + esc(u.name) + '</b> (' + esc(u.title) + ', ' + esc(u.dept) + '). Identity attributes come from the HR record.</p>' +
      '<dl class="kv sm"><dt>Sign-in name</dt><dd class="mono">' + mail(u.upn) + '</dd><dt>Employee ID</dt><dd class="mono">' + esc(u.eid) + '</dd><dt>Manager</dt><dd>' + esc(u.mgr) + '</dd><dt>Start date</dt><dd>' + esc(u.hired) + '</dd><dt>Personal email (HR)</dt><dd class="mono">' + esc(u.hrEmail||'—') + '</dd></dl>' +
      (u.upnWanted ? '<label class="fld" for="c-upn">Sign-in name</label><div class="row" style="gap:4px;flex-wrap:nowrap"><input class="in mono" id="c-upn" value="' + esc(u.upnWanted) + '"><span class="mono faint nowrap">@' + esc(DOM) + '</span></div><p class="hint" id="c-upn-w"></p>' : '') +
      '<label class="fld">Initial group access</label>' +
      '<label class="radio on" data-m="role"><input type="radio" name="cm" value="role" id="cm-role" checked><span><b>Apply a role template</b></span></label>' +
      '<div id="w-role"><select class="in" id="c-role">' + roles.map(function(r){ return '<option' + (r===u.title?' selected':'') + '>' + esc(r) + '</option>'; }).join('') + '</select><p class="hint" id="c-role-g"></p></div>' +
      '<label class="radio" data-m="copy" style="margin-top:8px"><input type="radio" name="cm" value="copy" id="cm-copy"><span><b>Copy group memberships from an existing user</b></span></label>' +
      '<div id="w-copy" hidden><select class="in" id="c-copy">' + others.map(function(x){ return '<option value="' + x.upn + '">' + esc(x.name) + ' — ' + esc(x.title) + '</option>'; }).join('') + '</select><p class="hint" id="c-copy-g"></p></div>' +
      '<label class="radio" data-m="none" style="margin-top:8px"><input type="radio" name="cm" value="none" id="cm-none"><span><b>No initial group memberships</b></span></label>' +
      '<label class="fld" for="c-lic">License</label><select class="in" id="c-lic"><option value="">None — assign later</option>' + D.licenses.map(function(l){ var a = licAvail(l.name); return '<option value="' + esc(l.name) + '"' + (a<=0?' disabled':'') + '>' + esc(l.name) + ' — ' + a + ' of ' + l.total + ' available</option>'; }).join('') + '</select>' +
      '<label class="check"><input type="checkbox" id="c-tap" checked> Issue a Temporary Access Pass (one-time, valid 8 hours) for first sign-in and MFA registration</label>' +
      '<div id="c-tapw"><label class="fld" for="c-tapto">Deliver the pass</label><select class="in" id="c-tapto"><option value="mgr">To the manager on file (' + esc(mgr ? mgr.name : '—') + ')</option><option value="screen">Show on screen, hand over in person</option><option value="personal">Email to the personal address in the HR record</option></select></div>' +
      '<label class="fld" for="c-why">Justification</label><input class="in" id="c-why" placeholder="e.g. New hire per HR, ticket MF-1041"><p class="hint" id="c-err"></p>';
    openModal('Create account', body, 'Create account', function(){
      var why = document.getElementById('c-why').value.trim();
      if(why.length < 4){ document.getElementById('c-err').textContent = 'Add a justification. It’s recorded in the audit log.'; return false; }
      var sin = null;
      if(u.upnWanted){
        sin = (document.getElementById('c-upn').value||'').trim().toLowerCase();
        if(!/^[a-z0-9][a-z0-9._-]{1,30}$/.test(sin)){ document.getElementById('c-err').textContent = 'Enter a valid sign-in name.'; return false; }
        if(upnTaken(sin)){ document.getElementById('c-err').textContent = 'That sign-in name already belongs to ' + upnTaken(sin).name + '. Two people cannot share one.'; return false; }
      }
      var mode = document.querySelector('input[name=cm]:checked').value, groups = [], detail = '';
      if(mode==='role'){ var r = document.getElementById('c-role').value; groups = D.roles[r].filter(function(g){ return !isDyn(g); }); detail = 'role template “' + r + '”'; }
      else if(mode==='copy'){ var src = U(document.getElementById('c-copy').value); groups = src.groups.map(function(a){ return a.g; }); detail = 'copied from ' + src.name; }
      else detail = 'no initial groups';
      var lic = document.getElementById('c-lic').value, tap = document.getElementById('c-tap').checked, tapto = document.getElementById('c-tapto').value;
      act('Create user', u.name, function(){
        u.status = 'Enabled'; u.created = (D.dates && D.dates['0'] ? D.dates['0'] + ' ' + (D.month||'Sep') : 'today'); u.groups = groups.map(function(g){ return {g:g, type:'perm', exp:'', why:detail, at:S.clock}; });
        if(lic){ u.lic = lic; u.mbx = 'User'; u.od = '0 GB'; }
        if(sin) u.signIn = sin;
        if(tap){ u.tap = tapto; if(S.scn==='s1'){ later(8, 'priyaFirst'); if(tapto==='mgr') later(3, 'chat', {from:u.mgrUpn, text:'Got Priya’s access pass. Walking it down to her now, thanks!', tid:'MF-1041', link:{ticket:'MF-1041'}}); } }
      }, 'Created account for ' + u.name, {refs:['u:'+upn].concat(groups.map(function(g){ return 'g:'+g; })), detail:'Initial access: ' + detail + ' (' + (groups.join(', ') || 'none') + '). License: ' + (lic || 'none') + '. ' + (tap ? 'Temporary Access Pass issued (' + {mgr:'sent to manager', screen:'shown on screen', personal:'emailed to personal address'}[tapto] + '). ' : 'No Temporary Access Pass. ') + 'Justification: “' + why + '”'});
      if(tap && tapto==='screen') later2(function(){ openModal('Temporary Access Pass', '<p>One-time pass for ' + esc(u.name) + '. Valid 8 hours. It won’t be shown again.</p><div class="secret mono">' + guid('tap'+upn).slice(0,4).toUpperCase() + '-' + guid('tap2'+upn).slice(0,4).toUpperCase() + '-' + guid('tap3'+upn).slice(0,4).toUpperCase() + '</div>', null); });
    }, function(){
      var cu = document.getElementById('c-upn');
      if(cu){ var warn = function(){ var v = (cu.value||'').trim().toLowerCase(), t = upnTaken(v); document.getElementById('c-upn-w').innerHTML = t ? '<b style="color:var(--bad)">Already in use by ' + esc(t.name) + ' (' + esc(t.title) + ').</b> Two people cannot share a sign-in name, and mail sent to it would reach the wrong person.' : 'Free. This becomes their address and the name every log line shows.'; }; cu.oninput = warn; warn(); }
      var show = function(){
        var m = document.querySelector('input[name=cm]:checked').value;
        document.getElementById('w-role').hidden = m!=='role'; document.getElementById('w-copy').hidden = m!=='copy';
        modalEl.querySelectorAll('.radio').forEach(function(l){ l.classList.toggle('on', l.dataset.m===m); });
        document.getElementById('c-role-g').textContent = 'Groups: ' + D.roles[document.getElementById('c-role').value].join(', ');
        var s = U(document.getElementById('c-copy').value); document.getElementById('c-copy-g').textContent = 'Groups: ' + (s ? names(s).join(', ') : '');
        document.getElementById('c-tapw').hidden = !document.getElementById('c-tap').checked;
      };
      modalEl.querySelectorAll('input[name=cm]').forEach(function(r){ r.onchange = show; });
      document.getElementById('c-role').onchange = show; document.getElementById('c-copy').onchange = show; document.getElementById('c-tap').onchange = show; show();
    });
  }
  function resetPassword(upn){
    var u = U(upn);
    var body = '<p>Issue a temporary password for <b>' + esc(u.name) + '</b>.</p>' +
      '<label class="fld">Deliver the temporary password</label>' +
      '<label class="radio on" data-d="screen"><input type="radio" name="pd" value="screen" id="pd-screen" checked><span><b>Show it on screen</b><br><span class="faint">Give it to them in person or on a verified call</span></span></label>' +
      '<label class="radio" data-d="sms"><input type="radio" name="pd" value="sms" id="pd-sms"><span><b>Text it to the mobile on file</b><br><span class="faint mono">' + esc(u.phone) + '</span></span></label>' +
      '<label class="radio" data-d="other"><input type="radio" name="pd" value="other" id="pd-other"><span><b>Email it to another address</b></span></label>' +
      '<div id="pd-w" hidden><input class="in" id="pd-addr" type="email" placeholder="name@example.com"></div>' +
      '<label class="check"><input type="checkbox" id="pd-chg" checked> Require a password change at next sign-in</label>' +
      '<label class="check"><input type="checkbox" id="pd-rev"> Also sign the user out of all sessions</label><p class="hint" id="pd-err"></p>';
    openModal(isSync(u) ? 'Reset password — Active Directory' : 'Reset password', body, 'Reset password', function(){
      var how = document.querySelector('input[name=pd]:checked').value, addr = (document.getElementById('pd-addr').value||'').trim();
      if(how==='other' && !/@/.test(addr)){ document.getElementById('pd-err').textContent = 'Enter the address to send it to.'; return false; }
      var rev = document.getElementById('pd-rev').checked, n = u.sessions.length;
      var to = how==='screen' ? 'displayed to operator' : how==='sms' ? 'SMS to ' + u.phone : 'email to ' + addr;
      var tmp = 'Mf-' + guid(upn+S.clock).slice(0,4).toUpperCase() + '-' + guid(S.clock+upn).slice(9,13);
      act(isSync(u) ? 'Reset AD password' : 'Reset user password', u.name, function(){
        u.pwdReset = true; u.pwdAt = S.clock; u.pwd = 'Reset today (temporary)';
        u.pwdTo = how==='other' && addr.toLowerCase().slice(-DOM.length-1) !== '@' + DOM ? 'ext' : how;
        if(rev){ u.sessions = []; u.revokedAt = S.clock; }
      }, 'Password reset for ' + u.name, {cat:'Authentication', refs:['u:'+upn], detail:'Temporary password delivered by ' + to + '.' + (rev ? ' ' + n + ' session(s) revoked.' : '')});
      if(how==='screen') later2(function(){ openModal('Temporary password', '<p>Give this to ' + esc(u.name) + ' through a verified channel. It won’t be shown again.</p><div class="secret mono">' + tmp + '</div>', null); });
    }, function(){
      var sync = function(){ var v = document.querySelector('input[name=pd]:checked').value; document.getElementById('pd-w').hidden = v!=='other'; modalEl.querySelectorAll('.radio').forEach(function(l){ l.classList.toggle('on', l.dataset.d===v); }); };
      modalEl.querySelectorAll('input[name=pd]').forEach(function(r){ r.onchange = sync; });
    });
  }
  function contactUser(upn){
    var u = U(upn);
    openModal('Contact ' + u.name, '<label class="radio on" data-c="desk"><input type="radio" name="cc" value="desk" id="cc-desk" checked><span><b>Call desk line on file</b><br><span class="faint mono">' + esc(u.desk || 'none on file') + '</span></span></label><label class="radio" data-c="mobile"><input type="radio" name="cc" value="mobile" id="cc-mobile"><span><b>Call mobile on file</b><br><span class="faint mono">' + esc(u.phone) + '</span></span></label><label class="radio" data-c="chat"><input type="radio" name="cc" value="chat" id="cc-chat"><span><b>Send a chat message</b><br><span class="faint">Reaches their signed-in session</span></span></label><p class="hint">Numbers on file come from HR, not from the ticket.</p>', 'Contact', function(){
      var ch = document.querySelector('input[name=cc]:checked').value;
      var r = contactReply(upn, ch);
      act('Contact user', u.name, function(){ if(r.verify) S.verified[upn] = true; S.contacted[upn] = true; }, 'Contacted ' + u.name, {cat:'Ticketing', refs:['u:'+upn], detail:({desk:'Desk line ' + u.desk, mobile:'Mobile ' + u.phone, chat:'Chat'})[ch] + '. Response: “' + r.text + '”', mins:3});
      later2(function(){ openModal(({desk:'Call — ', mobile:'Call — ', chat:'Chat — '})[ch] + u.name, '<div class="msg"><div class="msg-h"><span>' + esc(u.name) + '</span><span>' + hhmm(S.clock) + '</span></div><div class="msg-b"><p>' + esc(r.text) + '</p></div></div>', null); });
    }, function(){ modalEl.querySelectorAll('input[name=cc]').forEach(function(x){ x.onchange = function(){ modalEl.querySelectorAll('.radio').forEach(function(l){ l.classList.toggle('on', l.dataset.c===x.value); }); }; }); });
  }
  function contactReply(upn, ch){
    var u = U(upn), c = (D.contacts || {})[upn];
    if(u.status==='Not created') return {text:'(No answer. The account and number aren’t active yet.)'};
    if(ch==='chat' && !u.sessions.length) return {text:'(Message not delivered. The user isn’t signed in anywhere.)'};
    if(!c) return {text:'(No answer. Left a voicemail.)'};
    if(c.ifRule && u.rules.some(function(r){ return r.ext; })) return {verify:c.verify, text:c.ifRule};
    return {verify:c.verify, text:c.text};
  }
  function reportSecurity(upn){
    var u = U(upn);
    openModal('Report to Security Operations', '<p>Open a security case about <b>' + esc(u.name) + '</b>.</p><label class="fld" for="rs-why">What did you find?</label><textarea class="in" id="rs-why" placeholder="The evidence: what, when, and where you saw it."></textarea><p class="hint" id="rs-err"></p>', 'Open case', function(){
      var why = document.getElementById('rs-why').value.trim(); if(why.length < 10){ document.getElementById('rs-err').textContent = 'Describe what you found in at least a sentence.'; return false; }
      act('Report to Security', u.name, function(){ S.reports[upn] = why; later(4, 'report', {upn:upn}); }, 'Security case opened for ' + u.name, {cat:'Security', refs:['u:'+upn], detail:'“' + why + '”'});
    });
  }
  function editProps(upn){
    var u = U(upn), cur = u.acctExp || 'Not set';
    openModal('Edit properties — ' + u.name, '<dl class="kv sm"><dt>Title</dt><dd>' + esc(u.title) + ' <span class="faint">(HR-managed)</span></dd><dt>Department</dt><dd>' + esc(u.dept) + ' <span class="faint">(HR-managed)</span></dd>' + (u.contractEnd ? '<dt>Contract end</dt><dd>' + esc(u.contractEnd) + ' <span class="faint">(from the SOW)</span></dd>' : '') + '</dl>' +
      '<label class="fld" for="ep-exp">Account expires</label><select class="in" id="ep-exp"><option>Not set</option>' + (u.contractEnd ? '<option>' + esc(u.contractEnd) + ' 23:59</option>' : '') + (D.expiryOptions||['Oct 1, 2026 23:59','Dec 31, 2026 23:59']).map(function(o){ return '<option>' + esc(o) + '</option>'; }).join('') + '</select>', 'Save', function(){
        var v = document.getElementById('ep-exp').value; if(v===cur) return;
        act('Update user', u.name, function(){ u.acctExp = v; }, 'Account expiration updated', {refs:['u:'+upn], detail:'accountExpires: ' + cur + ' → ' + v});
      }, function(){ document.getElementById('ep-exp').value = cur; });
  }
  function assignLicense(upn){
    var u = U(upn);
    openModal('Assign license', '<label class="fld" for="al-l">License</label><select class="in" id="al-l">' + D.licenses.map(function(l){ var a = licAvail(l.name); return '<option value="' + esc(l.name) + '"' + (a<=0?' disabled':'') + '>' + esc(l.name) + ' — ' + a + ' of ' + l.total + ' available</option>'; }).join('') + '</select><p class="hint">Assigning a license creates the mailbox and OneDrive if they don’t exist.</p>', 'Assign', function(){
      var l = document.getElementById('al-l').value;
      act('Assign license', u.name, function(){ u.lic = l; if(!u.mbx) u.mbx = 'User'; if(!u.od) u.od = '0 GB'; u.mbxDeleting = false; }, 'Assigned ' + l + ' to ' + u.name, {cat:'License management', refs:['u:'+upn], detail:l});
    });
  }
  function removeLicense(upn){
    var u = U(upn), held = !!u.hold, risky = u.mbx==='User' && !held;
    var lines = held ? ['<b>' + esc(u.name) + ' is on litigation hold (' + esc(u.hold.matter) + ').</b> Removing the license turns this into an <b>inactive mailbox</b>: the content is preserved in place and stays searchable for the matter.', 'The seat returns to the pool. Nothing is deleted while the hold is on.']
      : (u.mbx==='User' ? ['<b style="color:var(--bad)">This mailbox isn’t shared and isn’t on hold.</b> Removing the license starts a 30-day deletion of the mailbox and everything in it. After that it is gone — no export, no recovery, whoever asks.', 'Apps that need this license stop working.']
      : ['The seat returns to the pool.', 'The shared mailbox stays. Shared mailboxes under 50 GB don’t need a license.']);
    confirmBox('Remove license', '<p>Remove <b>' + esc(u.lic) + '</b> from ' + esc(u.name) + '?</p>' + impact(lines, held ? 'An inactive mailbox is how a departed person’s mail survives the licence being reclaimed.' : ''), 'Remove license', function(){
      act('Remove license', u.name, function(){ u.lic = ''; if(risky) u.mbxDeleting = true; if(held) u.mbxInactive = true; }, 'Removed license from ' + u.name, {cat:'License management', refs:['u:'+upn], detail:(held ? 'Mailbox became an inactive mailbox, preserved by hold ' + u.hold.matter + '.' : risky ? 'Mailbox scheduled for deletion in 30 days.' : 'Seat released.')});
    }, !held);
  }
  function holdAction(upn){
    var u = U(upn);
    if(u.hold){ confirmBox('Remove litigation hold', '<p>Remove the hold on <b>' + esc(u.name) + '</b> (' + esc(u.hold.matter) + ')?</p>' + impact(['Content stops being preserved. Anything the retention policy would have cleared can be cleared.'], 'A hold is released by Legal, not by IT. If nobody in Legal asked you for this in writing, do not do it.'), 'Remove hold', function(){
      act('Remove litigation hold', u.name, function(){ u.hold = null; }, 'Hold removed from ' + u.name, {cat:'Compliance', refs:['u:'+upn], detail:'LitigationHoldEnabled: true → false'});
    }, true); return; }
    openModal('Place on litigation hold', '<p>Preserve everything in <b>' + esc(u.name) + '</b>’s mailbox and OneDrive — including anything they delete — for as long as the hold is on.</p>' +
      '<label class="fld" for="lh-m">Matter reference</label><input class="in mono" id="lh-m" placeholder="e.g. LGL-2027-04">' +
      '<label class="fld" for="lh-w">Who asked for it</label><input class="in" id="lh-w" placeholder="The person in Legal who requested the hold"><p class="hint" id="lh-e">A hold is placed on Legal’s instruction and recorded against the matter it belongs to.</p>', 'Place hold', function(){
        var m = (document.getElementById('lh-m').value||'').trim(), w = (document.getElementById('lh-w').value||'').trim();
        if(!/^[A-Za-z]{2,4}-\d{2,4}-\d{1,4}$/.test(m)){ document.getElementById('lh-e').textContent = 'Enter the matter reference, like LGL-2027-04.'; return false; }
        if(w.length < 3){ document.getElementById('lh-e').textContent = 'Record who in Legal asked for the hold.'; return false; }
        act('Place litigation hold', u.name, function(){ u.hold = {matter:m.toUpperCase(), by:w, at:S.clock}; }, 'Litigation hold placed on ' + u.name, {cat:'Compliance', refs:['u:'+upn], detail:'LitigationHoldEnabled: false → true. Matter ' + m.toUpperCase() + ', requested by ' + w + '. Mailbox and OneDrive content preserved, deletions included.'});
      });
  }
  function mbxAction(upn, kind, i){
    var u = U(upn);
    if(kind==='rule'){ var r = u.rules[i]; confirmBox('Delete inbox rule', '<p>Delete the rule <b>“' + esc(r.name) + '”</b>?</p><p class="mono" style="font-size:12.5px">' + esc(r.action) + '</p>' + impact(['Messages stop forwarding immediately.'], 'Deleting the rule doesn’t tell anyone what was already forwarded. The message trace is kept for 90 days.'), 'Delete rule', function(){
        act('Remove inbox rule', u.name, function(){ u.rules.splice(i,1); }, 'Inbox rule deleted', {cat:'Exchange', refs:['u:'+upn], detail:'Rule “' + r.name + '”: ' + r.action});
      }, true); }
    if(kind==='shared') confirmBox('Convert to shared mailbox', '<p>Convert ' + esc(u.name) + '’s mailbox to a shared mailbox?</p>' + impact(['Nobody can sign in to it directly. People you grant access to can read and send from it.', 'Shared mailboxes under 50 GB don’t need a license.']), 'Convert', function(){
        act('Convert mailbox', u.name, function(){ u.mbx = 'Shared'; u.mbxDeleting = false; }, 'Mailbox converted to shared', {cat:'Exchange', refs:['u:'+upn], detail:'RecipientTypeDetails: UserMailbox → SharedMailbox'});
      });
    if(kind==='delegate'){
      var c = allUsers().filter(function(x){ return x.status==='Enabled' && x.upn!==upn && !x.service; });
      openModal('Grant mailbox access', '<label class="fld" for="md-u">Grant Full Access and Send As to</label><select class="in" id="md-u">' + c.map(function(x){ return '<option value="' + x.upn + '"' + (x.upn===u.mgrUpn?' selected':'') + '>' + esc(x.name) + (x.upn===u.mgrUpn?' (manager)':'') + '</option>'; }).join('') + '</select>', 'Grant', function(){
        var d = document.getElementById('md-u').value; act('Add mailbox permission', u.name, function(){ if(u.delegates.indexOf(d)<0) u.delegates.push(d); }, 'Mailbox access granted to ' + U(d).name, {cat:'Exchange', refs:['u:'+upn,'u:'+d], detail:'FullAccess, SendAs → ' + U(d).name});
      });
    }
    if(kind==='auto') openModal('Automatic reply', '<textarea class="in" id="ma-t">' + esc(u.name) + ' is no longer with Meridian Freight. Please contact ' + esc(U(u.mgrUpn) ? U(u.mgrUpn).name : 'the team') + '.</textarea>', 'Set reply', function(){
        var t = document.getElementById('ma-t').value.trim(); act('Set automatic reply', u.name, function(){ u.auto = t; }, 'Automatic reply set', {cat:'Exchange', refs:['u:'+upn], detail:'“' + t + '”'});
      });
  }
  function odShare(upn){
    var u = U(upn), m = U(u.mgrUpn);
    if(!m){ toast('No manager on file.'); return; }
    confirmBox('Grant OneDrive access', '<p>Give <b>' + esc(m.name) + '</b> (manager) access to ' + esc(u.name) + '’s OneDrive?</p>' + impact(['OneDrive for a deleted or unlicensed account is removed after 30 days. The manager should move what they need before then.']), 'Grant access', function(){
      act('Grant OneDrive access', u.name, function(){ if(u.odAccess.indexOf(m.upn)<0) u.odAccess.push(m.upn); }, 'OneDrive access granted to ' + m.name, {cat:'SharePoint', refs:['u:'+upn,'u:'+m.upn], detail:'Site collection admin → ' + m.name});
    });
  }
  function deviceAction(upn, i, kind){
    var u = U(upn), d = u.devices[i];
    var txt = {retire:['Retire device','Removes company data, apps and management from ' + d.id + '. Use after the device is returned.'], wipe:['Wipe device','Factory-resets ' + d.id + '. All data on the device is erased.'], selective:['Selective wipe','Removes corporate data and accounts from managed apps on ' + d.id + '. Personal files, photos and apps aren’t touched.']}[kind];
    confirmBox(txt[0], '<p>' + esc(txt[0]) + ' — <b>' + esc(d.id) + '</b> (' + esc(u.name) + ')?</p>' + impact([esc(txt[1])], 'Runs the next time the device checks in.'), txt[0], function(){
      act(txt[0], d.id, function(){ d.state = kind==='selective' ? 'Selective wipe pending' : kind==='retire' ? 'Retire pending' : 'Wipe pending'; d.wiped = kind; }, txt[0] + ' issued for ' + d.id, {cat:'Device management', refs:['u:'+upn], detail:u.name + ' · ' + d.id + ' (' + d.os + ')'});
    }, true);
  }
  function removeMfa(upn, i){
    var u = U(upn), all = i==='all';
    confirmBox(all ? 'Remove all MFA methods' : 'Remove MFA method', '<p>' + (all ? 'Remove every registered method for <b>' + esc(u.name) + '</b>?' : 'Remove <b>' + esc(u.mfa[i]) + '</b>?') + '</p>' + impact(['Registered devices can no longer approve sign-ins for this account.'], 'The user would need a Temporary Access Pass to register again.'), 'Remove', function(){
      var before = u.mfa.slice();
      act('Delete authentication method', u.name, function(){ if(all) u.mfa = []; else u.mfa.splice(i,1); u.mfaAt = S.clock; }, all ? 'All MFA methods removed' : 'MFA method removed', {cat:'Authentication', refs:['u:'+upn], detail:(all ? before.join(', ') : before[i])});
    }, true);
  }

  // ---------- on-premises actions ----------
  function adCreate(upn){
    var u = U(upn), roles = Object.keys(D.adTemplates);
    var others = allUsers().filter(onPrem);
    var body = '<p class="hint">Creating the on-premises account for <b>' + esc(u.name) + '</b>. The cloud account appears after the next directory sync (P12).</p>' +
      '<dl class="kv sm"><dt>Logon name</dt><dd class="mono">' + esc(D.netbios) + '\\' + esc(u.ad.sam) + '</dd>' + (u.upnWanted ? '' : '<dt>UPN</dt><dd class="mono">' + mail(u.upn) + '</dd>') + '<dt>Employee ID</dt><dd class="mono">' + esc(u.eid) + '</dd><dt>Manager</dt><dd>' + esc(u.mgr) + '</dd></dl>' +
      (u.upnWanted ? '<label class="fld" for="c-upn">Sign-in name (UPN)</label><div class="row" style="gap:4px;flex-wrap:nowrap"><input class="in mono" id="c-upn" value="' + esc(u.upnWanted) + '"><span class="mono faint nowrap">@' + esc(DOM) + '</span></div><p class="hint" id="c-upn-w"></p>' : '') +
      '<label class="fld" for="ad-ou">Organizational unit</label><select class="in" id="ad-ou">' + D.ous.map(function(o){ return '<option' + (o==='Users (default container)' ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</select>' +
      '<label class="fld">Security groups</label>' +
      '<label class="radio on" data-m="role"><input type="radio" name="am" value="role" id="am-role" checked><span><b>Apply a role template</b></span></label>' +
      '<div id="aw-role"><select class="in" id="ad-role">' + roles.map(function(r){ return '<option' + (r===u.title?' selected':'') + '>' + esc(r) + '</option>'; }).join('') + '</select><p class="hint" id="ad-roleg"></p></div>' +
      '<label class="radio" data-m="copy" style="margin-top:8px"><input type="radio" name="am" value="copy" id="am-copy"><span><b>Copy group memberships from an existing user</b></span></label>' +
      '<div id="aw-copy" hidden><select class="in" id="ad-copy">' + others.map(function(x){ return '<option value="' + x.upn + '">' + esc(x.name) + ' — ' + esc(x.title) + '</option>'; }).join('') + '</select><p class="hint" id="ad-copyg"></p></div>' +
      '<label class="radio" data-m="none" style="margin-top:8px"><input type="radio" name="am" value="none" id="am-none"><span><b>No groups</b></span></label>' +
      '<label class="check"><input type="checkbox" id="ad-chg" checked> User must change password at next logon</label>' +
      '<label class="fld" for="ad-why">Justification</label><input class="in" id="ad-why" placeholder="e.g. New hire per HR, ticket MF-1041"><p class="hint" id="ad-err"></p>';
    openModal('New AD user', body, 'Create in Active Directory', function(){
      var why = document.getElementById('ad-why').value.trim();
      if(why.length < 4){ document.getElementById('ad-err').textContent = 'Add a justification. It’s recorded in the audit log.'; return false; }
      var sin = null;
      if(u.upnWanted){
        sin = (document.getElementById('c-upn').value||'').trim().toLowerCase();
        if(!/^[a-z0-9][a-z0-9._-]{1,30}$/.test(sin)){ document.getElementById('ad-err').textContent = 'Enter a valid sign-in name.'; return false; }
        if(upnTaken(sin)){ document.getElementById('ad-err').textContent = 'That sign-in name already belongs to ' + upnTaken(sin).name + '. Two people cannot share one.'; return false; }
      }
      var mode = document.querySelector('input[name=am]:checked').value, groups = [], detail = '', ou = document.getElementById('ad-ou').value;
      if(mode==='role'){ var r = document.getElementById('ad-role').value; groups = D.adTemplates[r].groups.slice(); detail = 'role template “' + r + '”'; }
      else if(mode==='copy'){ var src = U(document.getElementById('ad-copy').value); groups = src.ad.groups.slice(); detail = 'copied from ' + src.name; }
      else detail = 'no groups';
      act('Create AD user', u.name, function(){
        u.ad.exists = true; u.ad.ou = ou; u.ad.enabled = true; u.ad.groups = groups; u.ad.pwdSet = (D.dates && D.dates['0'] ? D.dates['0'] + ' ' + (D.month||'Sep') : 'today'); u.ad.desc = u.title; if(sin) u.signIn = sin;
      }, 'Created ' + D.netbios + '\\' + u.ad.sam + ' in ' + ou, {cat:'Active Directory', refs:['u:'+upn], detail:'OU=' + ou + '. Groups: ' + (groups.join(', ') || 'none') + ' (' + detail + '). Justification: “' + why + '”'});
    }, function(){
      var cu = document.getElementById('c-upn');
      if(cu){ var warn = function(){ var v = (cu.value||'').trim().toLowerCase(), t = upnTaken(v); document.getElementById('c-upn-w').innerHTML = t ? '<b style="color:var(--bad)">Already in use by ' + esc(t.name) + ' (' + esc(t.title) + ').</b> Two people cannot share a sign-in name, and mail sent to it would reach the wrong person.' : 'Free. This becomes their address and the name every log line shows.'; }; cu.oninput = warn; warn(); }
      var show = function(){
        var m = document.querySelector('input[name=am]:checked').value;
        document.getElementById('aw-role').hidden = m!=='role'; document.getElementById('aw-copy').hidden = m!=='copy';
        modalEl.querySelectorAll('.radio').forEach(function(l){ l.classList.toggle('on', l.dataset.m===m); });
        var r = D.adTemplates[document.getElementById('ad-role').value];
        document.getElementById('ad-roleg').textContent = 'Groups: ' + r.groups.join(', ') + ' · suggested OU: ' + r.ou;
        var s = U(document.getElementById('ad-copy').value); document.getElementById('ad-copyg').textContent = s ? 'Groups: ' + s.ad.groups.join(', ') + ' · OU: ' + s.ad.ou : '';
      };
      modalEl.querySelectorAll('input[name=am]').forEach(function(r){ r.onchange = show; });
      document.getElementById('ad-role').onchange = show; document.getElementById('ad-copy').onchange = show; show();
    });
  }
  function adToggle(upn){
    var u = U(upn), dis = u.ad.enabled;
    confirmBox(dis ? 'Disable AD account' : 'Enable AD account', '<p>' + (dis?'Disable':'Enable') + ' <span class="mono">' + D.netbios + '\\' + esc(u.ad.sam) + '</span>?</p>' + impact([dis ? 'Domain sign-in, file shares and VPN stop working at once.' : 'Domain sign-in works again with the account’s existing groups.'], 'The cloud account follows on the next directory sync, not immediately. Kerberos tickets already issued stay valid for up to 10 hours.'), dis?'Disable':'Enable', function(){
      act(dis ? 'Disable AD account' : 'Enable AD account', u.name, function(){ u.ad.enabled = !dis; }, (dis?'Disabled ':'Enabled ') + D.netbios + '\\' + u.ad.sam, {cat:'Active Directory', refs:['u:'+upn], detail:'userAccountControl: ' + (dis ? 'enabled → disabled' : 'disabled → enabled') + '. Pending directory sync.'});
    }, dis);
  }
  function adMove(upn){
    var u = U(upn);
    openModal('Move object', '<p>Move <span class="mono">' + esc(u.ad.sam) + '</span> to a different organizational unit.</p><label class="fld" for="mv-ou">Destination OU</label><select class="in" id="mv-ou">' + D.ous.map(function(o){ return '<option' + (o===u.ad.ou?' selected':'') + '>' + esc(o) + '</option>'; }).join('') + '</select><p class="hint">Group policy, drive mappings and delegated admin rights follow the OU.</p>', 'Move', function(){
      var ou = document.getElementById('mv-ou').value; if(ou===u.ad.ou) return;
      var was = u.ad.ou;
      act('Move AD object', u.name, function(){ u.ad.ou = ou; u.ad.ouChanged = true; }, 'Moved to ' + ou, {cat:'Active Directory', refs:['u:'+upn], detail:'OU: ' + was + ' → ' + ou});
    });
  }
  function adGroups(upn, remove, idx){
    var u = U(upn);
    if(remove){
      var g = u.ad.groups[idx], meta = adGroup(g);
      confirmBox('Remove from AD group', '<p>Remove <b>' + esc(u.name) + '</b> from <span class="mono">' + esc(g) + '</span>?</p>' + impact([esc(meta ? meta.desc : g)], (meta && meta.synced ? 'The matching cloud group updates on the next sync.' : 'This group doesn’t sync to the cloud.') + ' File share access changes at the user’s next logon, because group membership is read into their token when they sign in.'), 'Remove', function(){
        act('Remove member from AD group', g, function(){ u.ad.groups.splice(idx,1); if(/Admin/.test(g)) markPriv(u); }, 'Removed ' + u.name + ' from ' + g, {cat:'Active Directory', refs:['u:'+upn,'g:'+g], detail:u.name + ' removed from ' + g + ' (on-premises).'});
      }, true);
      return;
    }
    var avail = D.adGroups.filter(function(g){ return u.ad.groups.indexOf(g.name)<0; });
    openModal('Add to AD group', '<label class="fld" for="ag-g">Security group</label><select class="in" id="ag-g">' + avail.map(function(g){ return '<option value="' + esc(g.name) + '">' + esc(g.name) + ' — ' + esc(g.scope) + '</option>'; }).join('') + '</select><p class="hint" id="ag-d"></p><div id="ag-w"></div>' +
      '<label class="fld" for="ag-dur">Duration</label><select class="in" id="ag-dur"><option value="0">Permanent</option><option value="120">Temporary — 2 hours</option><option value="240">Temporary — 4 hours</option><option value="480">Temporary — until end of shift</option></select>' +
      '<p class="hint">Active Directory has no expiry on group membership. A temporary grant here is a scheduled removal job, and it only exists because someone built it. Without one, “temporary” means you have to come back and do it yourself.</p>' +
      '<label class="fld" for="ag-why">Justification</label><input class="in" id="ag-why"><p class="hint" id="ag-err"></p>', 'Add', function(){
      var g = document.getElementById('ag-g').value, why = document.getElementById('ag-why').value.trim(), mins = +document.getElementById('ag-dur').value;
      if(why.length<4){ document.getElementById('ag-err').textContent = 'Justification required.'; return false; }
      act('Add member to AD group', g, function(){
        u.ad.groups.push(g);
        if(mins){ u.ad.tempUntil = u.ad.tempUntil || {}; u.ad.tempUntil[g] = S.clock + mins; later(mins, 'adExpire', {u:upn, g:g}); }
      }, 'Added ' + u.name + ' to ' + g + (mins ? ' until ' + hhmm(S.clock + mins) : ''), {cat:'Active Directory', refs:['u:'+upn,'g:'+g], detail:u.name + ' added to ' + g + ' (on-premises' + (mins ? ', scheduled removal at ' + hhmm(S.clock + mins) : ', permanent') + '). “' + why + '”'});
    }, function(){
      var s = function(){ var g = adGroup(document.getElementById('ag-g').value);
        document.getElementById('ag-d').textContent = g ? g.desc + (g.synced ? ' · syncs to the cloud' : ' · on-premises only') : '';
        document.getElementById('ag-w').innerHTML = g && /Domain Admins/.test(g.name) ? '<div class="note">⚠ Domain Admins grants full control of the domain. It doesn’t sync to the cloud, so it won’t show up in any cloud access review.</div>' : (g && g.memberOf ? '<div class="note">Nested inside ' + g.memberOf + '. Members get everything ' + g.memberOf + ' grants.</div>' : '');
      };
      document.getElementById('ag-g').onchange = s; s();
    });
  }
  function adOnlyGroupRemove(i, gi){
    var o = S.adOnly[i], g = o.groups[gi];
    confirmBox('Remove from AD group', '<p>Remove <span class="mono">' + esc(o.sam) + '</span> from <span class="mono">' + esc(g) + '</span>?</p>' +
      impact([/Admin/.test(g) ? 'A service account in a privileged group holds that privilege every minute of every day, on a password nobody rotates, with no MFA and nobody watching it sign in (P41).' : 'The account loses whatever this group grants at its next logon.'],
             'If the job genuinely needs a right, delegate that right on the object it acts on rather than putting the account in a group that grants everything.'), 'Remove', function(){
      act('Remove member from AD group', g, function(){ o.groups.splice(gi,1); }, 'Removed ' + o.sam + ' from ' + g, {cat:'Active Directory', detail:o.sam + ' removed from ' + g + ' (on-premises service account).'});
    }, true);
  }
  function adOnlyAction(i, kind){
    var o = S.adOnly[i];
    if(kind==='disable') confirmBox('Disable AD account', '<p>Disable <span class="mono">' + esc(o.sam) + '</span> (' + esc(o.name) + ')?</p>' + impact([esc(o.desc)], 'Service accounts break applications when disabled. Check what runs as this account first.'), 'Disable', function(){
      act('Disable AD account', o.name, function(){ o.enabled = false; }, 'Disabled ' + o.sam, {cat:'Active Directory', detail:'userAccountControl: enabled → disabled. ' + o.desc});
    }, true);
    if(kind==='move') openModal('Move object', '<label class="fld" for="mo-ou">Destination OU</label><select class="in" id="mo-ou">' + D.ous.map(function(x){ return '<option' + (x===o.ou?' selected':'') + '>' + esc(x) + '</option>'; }).join('') + '</select>', 'Move', function(){
      var ou = document.getElementById('mo-ou').value, was = o.ou; if(ou===was) return;
      act('Move AD object', o.name, function(){ o.ou = ou; }, 'Moved ' + o.sam + ' to ' + ou, {cat:'Active Directory', detail:'OU: ' + was + ' → ' + ou});
    });
  }
  function aceRemove(path, i){
    var sh = share(path), a = sh.acl[i];
    confirmBox('Remove permission', '<p>Remove <b>' + esc(a.rights) + '</b> for <span class="mono">' + esc(a.kind==='user' ? U(a.p).name : a.p) + '</span> on <span class="mono">' + esc(path) + '</span>?</p>' + impact([a.kind==='user' ? 'A permission granted straight to an account. Group membership changes never affect it (P13).' : 'Everyone in this group loses access to the folder.'], 'Applies immediately on the file server. Open files stay open until closed.'), 'Remove', function(){
      act('Remove share permission', path, function(){ sh.acl.splice(i,1); }, 'Removed ' + (a.kind==='user' ? U(a.p).name : a.p) + ' from ' + path, {cat:'File shares', refs:a.kind==='user' ? ['u:'+a.p] : ['g:'+a.p], detail:a.rights + ' removed from ' + path + ' (' + a.kind + ' ACE, granted ' + a.since + ' by ' + a.by + ').'});
    }, true);
  }
  function issueTap(upn){
    var u = U(upn), mgr = U(u.mgrUpn);
    openModal('Temporary Access Pass', '<p>Issue a one-time pass for <b>' + esc(u.name) + '</b>, valid 8 hours. It lets them sign in once and register MFA.</p><label class="fld" for="tp-to">Deliver the pass</label><select class="in" id="tp-to"><option value="mgr">To the manager on file (' + esc(mgr ? mgr.name : '—') + ')</option><option value="screen">Show on screen, hand over in person</option><option value="personal">Email to the personal address in the HR record</option></select>', 'Issue pass', function(){
      var to = document.getElementById('tp-to').value;
      act('Issue Temporary Access Pass', u.name, function(){ u.tap = to; later(8, 'priyaFirst'); if(to==='mgr' && u.mgrUpn) later(3, 'chat', {from:u.mgrUpn, text:'Got Priya’s access pass. Walking it down to her now, thanks!', tid:'MF-1041', link:{ticket:'MF-1041'}}); }, 'Temporary Access Pass issued', {cat:'Authentication', refs:['u:'+upn], detail:'One-time pass, 8 hours, ' + {mgr:'sent to the manager', screen:'shown on screen', personal:'emailed to the personal address on the HR record'}[to] + '.'});
      if(to==='screen') later2(function(){ openModal('Temporary Access Pass', '<p>One-time pass for ' + esc(u.name) + '. It won’t be shown again.</p><div class="secret mono">' + guid('tap'+upn).slice(0,4).toUpperCase() + '-' + guid('tap2'+upn).slice(0,4).toUpperCase() + '-' + guid('tap3'+upn).slice(0,4).toUpperCase() + '</div>', null); });
    });
  }
  function aceRemove(path, list, i){
    var sh = share(path), a = sh[list][i], label = list==='ntfs' ? 'NTFS permission' : 'share permission';
    if(a.inherited){ openModal('Inherited permission', '<p>This permission is inherited from <span class="mono">' + esc(sh.parent || 'the parent folder') + '</span>. Remove it there, or break inheritance on this folder first.</p>', null); return; }
    confirmBox('Remove ' + label, '<p>Remove <b>' + esc(a.deny ? 'Deny ' + a.rights : a.rights) + '</b> for <span class="mono">' + esc(a.kind==='user' && U(a.p) ? U(a.p).name : a.p) + '</span> on <span class="mono">' + esc(path) + '</span>?</p>' + impact([a.kind==='user' ? 'A permission written straight onto the account. No group change ever affects it (P13).' : a.deny ? 'Removing a Deny lets the underlying allow permissions through again.' : 'Everyone in this group loses this level of access.'], 'Applies at once on the file server. Handles that are already open stay open until they are closed.'), 'Remove', function(){
      act('Remove ' + label, path, function(){ sh[list].splice(i,1); }, 'Removed ' + (U(a.p) ? U(a.p).name : a.p) + ' from ' + path, {cat:'File shares', refs:a.kind==='user' ? ['u:'+a.p] : ['g:'+a.p], detail:(a.deny?'Deny ':'') + a.rights + ' removed from ' + path + ' (' + list.toUpperCase() + ', granted ' + a.since + ' by ' + a.by + ').'});
    }, true);
  }
  function closeHandle(i){
    var f = S.openFiles[i], u = U(f.upn);
    confirmBox('Close open file', '<p>Force close <span class="mono">' + esc(f.file) + '</span>, open by <b>' + esc(u.name) + '</b> from ' + esc(f.client) + '?</p>' + impact(['The SMB session for that file is dropped.'], 'Unsaved changes in the open file are lost. Disabling an account never closes handles that are already open.'), 'Close handle', function(){
      act('Close open file handle', f.file, function(){ S.openFiles.splice(i,1); }, 'Closed ' + f.file, {cat:'File shares', refs:['u:'+f.upn], detail:u.name + ' · ' + f.path + '\\' + f.file + ' (' + f.mode + ', open since ' + f.since + ', client ' + f.client + ')'});
    }, true);
  }
  function delegAdd(){
    var us = allUsers().filter(function(u){ return u.status==='Enabled' && !u.service; });
    openModal('Delegate rights on an OU', '<p>Write a right on an organizational unit so that a group can do one specific thing inside it, without holding anything at the domain level.</p>' +
      '<label class="fld" for="dl-ou">Organizational unit</label><select class="in" id="dl-ou">' + D.ous.map(function(o){ return '<option>' + esc(o) + '</option>'; }).join('') + '</select>' +
      '<label class="fld" for="dl-who">Grant to</label><select class="in" id="dl-who">' + D.adGroups.map(function(g){ return '<option value="g:' + esc(g.name) + '">' + esc(g.name) + ' (group)</option>'; }).join('') + us.map(function(u){ return '<option value="u:' + u.upn + '">' + esc(u.name) + ' — direct to the account</option>'; }).join('') + '</select>' +
      '<label class="fld" for="dl-r">Rights</label><select class="in" id="dl-r"><option>Reset password; Read all properties</option><option>Create, delete and manage user objects</option><option>Modify the membership of groups in this OU</option><option>Link and unlink group policy objects</option><option>Read all properties</option></select>' +
      '<label class="fld" for="dl-why">Justification</label><input class="in" id="dl-why"><p class="hint" id="dl-err">A right delegated on an OU is invisible to every cloud access review. Grant it to a group, never to a person, so that it is at least visible where group membership is.</p>', 'Delegate', function(){
        var ou = document.getElementById('dl-ou').value, who = document.getElementById('dl-who').value, r = document.getElementById('dl-r').value, why = document.getElementById('dl-why').value.trim();
        if(why.length < 4){ document.getElementById('dl-err').textContent = 'Justification required.'; return false; }
        var kind = who.slice(0,1)==='g' ? 'group' : 'user', target = who.slice(2);
        act('Delegate OU rights', ou, function(){ S.deleg.push({ou:ou, who:target, kind:kind, rights:r, since:fmt(S.clock), by:'ia.analyst', note:why}); },
          'Delegated ' + r.split(';')[0] + ' on ' + ou, {cat:'Active Directory', refs:[(kind==='user'?'u:':'g:')+target], detail:r + ' granted to ' + target + ' on OU=' + ou + '. “' + why + '”'});
      });
  }
  function delegRemove(i){
    var x = S.deleg[i];
    confirmBox('Remove delegation', '<p>Remove <b>' + esc(x.rights) + '</b> for <span class="mono">' + esc(x.kind==='user' && U(x.who) ? U(x.who).name : x.who) + '</span> on <span class="mono">OU=' + esc(x.ou) + '</span>?</p>' + impact([x.kind==='user' ? 'A right written on the OU itself and granted to one person. Group membership changes never touch it.' : 'Everyone in this group loses these rights over the OU.'], 'Takes effect at once for new operations.'), 'Remove', function(){
      act('Remove OU delegation', x.ou, function(){ S.deleg.splice(i,1); if(x.kind==='user') markPriv(U(x.who) || {}); }, 'Removed delegation for ' + (U(x.who) ? U(x.who).name : x.who), {cat:'Active Directory', refs:x.kind==='user' ? ['u:'+x.who] : ['g:'+x.who], detail:x.rights + ' removed from OU=' + x.ou + ' (granted ' + x.since + ' by ' + x.by + ').'});
    }, true);
  }
  // ---- conditional access: an evaluator, not a list --------------------
  // Policies were records with a state field; a sign-in showed a hand-written
  // list of outcomes. This reads the same policies and actually decides, so
  // What-If and the sign-in log can never disagree with each other or with the
  // policies as configured.
  function caNorm(p){
    var n = p.n;
    if(!n){
      // older scenarios describe assignment and controls in prose; parse it once
      var a = p.assign || '', x = p.exclude || '', ctl = p.controls || '', nm = p.name || '';
      n = {
        allUsers: /all users/i.test(a),
        admins: /administrator|admin role/i.test(a),
        groups: /all users|administrator/i.test(a) ? [] : a.split(/,\s*/).filter(Boolean),
        exclude: (!x || /^none$/i.test(x)) ? [] : x.split(/,\s*/).map(function(s){ return s.trim(); }).filter(Boolean),
        block: /block/i.test(ctl),
        mfa: /multi-?factor/i.test(ctl),
        compliant: /compliant/i.test(ctl),
        phish: /phishing-resistant|security key/i.test(ctl),
        onLegacy: /legacy auth/i.test(nm + ' ' + ctl),
        onAnon: /anonymis|anonymiz|tor exit|vpn/i.test(nm),
        onRisk: /risk/i.test(nm) ? 'medium' : '',
        apps: p.apps || null
      };
      p.n = n;
    }
    return n;
  }
  function caScopeText(p){
    var n = caNorm(p);
    return (n.allUsers ? 'All users' : n.admins ? 'Anyone holding an admin role' : n.groups.join(', ') || 'Nobody') +
      (n.exclude.length ? ' · except ' + n.exclude.join(', ') : '');
  }
  function caControlText(p){
    var n = caNorm(p), r = [];
    if(n.block) return 'Block access';
    if(n.mfa) r.push('Multi-factor authentication');
    if(n.compliant) r.push('A compliant device');
    if(n.phish) r.push('A phishing-resistant method');
    return r.join(' and ') || (p.controls || 'No control');
  }
  // does this policy's assignment cover the person in this context?
  function isBreakGlass(u){ return !!u && (/break-glass|emergency/i.test(u.title || '') || /^bg\./.test(u.upn || '')); }
  function caCovers(p, ctx){
    var n = caNorm(p), u = U(ctx.upn);
    var name = u ? u.name : ctx.upn;
    for(var i=0;i<n.exclude.length;i++){
      var ex = n.exclude[i];
      if(name === ex) return false;
      // exclusions are written as a category at least as often as a name
      if(/emergency|break-?glass/i.test(ex) && isBreakGlass(u)) return false;
      if(u && names(u).indexOf(ex) >= 0) return false;
      if(u && (u.roles||[]).some(function(r){ return r.r === ex; })) return false;
    }
    if(n.allUsers) return true;
    if(n.admins) return !!(u && (u.roles||[]).length);
    return !!(u && n.groups.some(function(g){ return names(u).indexOf(g) >= 0; }));
  }
  // does the condition side match? returns null when the policy simply does not apply
  function caCondition(p, ctx){
    var n = caNorm(p);
    if(n.onLegacy) return ctx.client === 'legacy' ? 'legacy authentication client' : null;
    if(n.onAnon) return ctx.anon ? 'sign-in from an anonymising service' : null;
    if(n.onRisk) return (ctx.risk && ctx.risk !== 'none') ? ctx.risk + ' sign-in risk' : null;
    if(n.apps && n.apps.length) return n.apps.indexOf(ctx.app) >= 0 ? 'application in scope' : null;
    return 'all sign-ins in scope';
  }
  function caEval(ctx){
    var rows = [], blocked = false, failed = null, required = [];
    S.ca.forEach(function(p){
      if(p.state === 'Off' || /^off/i.test(p.state)){ rows.push({p:p, applied:false, why:'Policy is off', res:'Not applied'}); return; }
      if(!caCovers(p, ctx)){ rows.push({p:p, applied:false, why:'User is out of scope or excluded', res:'Not applied'}); return; }
      var cond = caCondition(p, ctx);
      if(!cond){ rows.push({p:p, applied:false, why:'Conditions not met', res:'Not applied'}); return; }
      var n = caNorm(p), report = /report/i.test(p.state), out, ok = true, need = [];
      if(n.block){ ok = false; out = report ? 'Report-only: would have blocked' : 'Blocked'; if(!report) blocked = true; }
      else {
        if(n.phish && !ctx.phishResistant){ ok = false; need.push('a phishing-resistant method'); }
        if(n.compliant && !ctx.compliant){ ok = false; need.push('a compliant device'); }
        if(n.mfa && !ctx.mfa){ ok = false; need.push('multi-factor authentication'); }
        if(ok) out = 'Satisfied';
        else out = report ? 'Report-only: would have required ' + need.join(' and ') : 'Failed: requires ' + need.join(' and ');
        if(!ok && !report){ failed = failed || need.join(' and '); }
        if(n.mfa) required.push('MFA'); if(n.compliant) required.push('compliant device'); if(n.phish) required.push('phishing-resistant method');
      }
      rows.push({p:p, applied:true, why:cond, res:out, report:report});
    });
    var outcome = blocked ? 'Blocked by policy' : failed ? 'Interrupted — ' + failed : 'Success';
    return {rows:rows, outcome:outcome, required:required};
  }
  // a policy that can lock every administrator out of the tenant is the single
  // most expensive mistake available on this page, so it is surfaced by name
  function caRisks(){
    var out = [];
    var bg = allUsers().filter(isBreakGlass);
    S.ca.forEach(function(p){
      var n = caNorm(p);
      var unconditional = !n.onLegacy && !n.onAnon && !n.onRisk && !(n.apps && n.apps.length);
      if(p.state === 'On' && unconditional && (n.block || n.compliant || n.phish) && (n.allUsers || n.admins)){
        var unprotected = bg.filter(function(u){ return caCovers(p, {upn:u.upn}); });
        if(unprotected.length) out.push({id:p.id, text:p.id + ' applies to ' + (n.allUsers ? 'all users' : 'every admin role') + ' with no exclusion for ' + unprotected.map(function(u){ return u.name; }).join(' or ') + '. If it goes wrong there is no account left that can turn it off.'});
      }
      if(/report/i.test(p.state) && n.block) out.push({id:p.id, text:p.id + ' is in report-only and its control is Block access. It is recording what it would have stopped and stopping nothing.'});
    });
    return out;
  }
  function caWhatIf(){
    var w = S.whatif = S.whatif || {upn:(allUsers().filter(function(u){ return u.status==='Enabled' && !u.service; })[0]||{}).upn, app:(D.apps[0]||{}).name, client:'browser', mfa:true, compliant:false, anon:false, risk:'none', phishResistant:false};
    var r = caEval(w);
    var users = allUsers().filter(function(u){ return u.status!=='Not created'; });
    var rows = r.rows.map(function(x){
      return '<tr><td><span class="mono">' + esc(x.p.id) + '</span> ' + esc(x.p.name) + '</td>' +
        '<td class="faint">' + esc(x.why) + '</td>' +
        '<td class="' + (/^Blocked|^Failed/.test(x.res) ? 'res bad' : /^Report/.test(x.res) ? 'res warn' : x.applied ? 'res ok' : 'faint') + '">' + esc(x.res) + '</td></tr>';
    }).join('');
    return card('What if', '<span class="faint" style="font-size:12.5px">Evaluates the policies exactly as a sign-in would</span>',
      '<div class="card-b"><div class="row" style="gap:10px;flex-wrap:wrap">' +
      '<label class="fld" style="margin:0">User<select class="in" id="wi-u">' + users.map(function(u){ return '<option value="' + esc(u.upn) + '"' + (w.upn===u.upn?' selected':'') + '>' + esc(u.name) + '</option>'; }).join('') + '</select></label>' +
      '<label class="fld" style="margin:0">Application<select class="in" id="wi-a">' + D.apps.map(function(a){ return '<option' + (w.app===a.name?' selected':'') + '>' + esc(a.name) + '</option>'; }).join('') + '</select></label>' +
      '<label class="fld" style="margin:0">Client<select class="in" id="wi-c"><option value="browser"' + (w.client==='browser'?' selected':'') + '>Browser</option><option value="legacy"' + (w.client==='legacy'?' selected':'') + '>Legacy authentication client</option></select></label>' +
      '<label class="fld" style="margin:0">Sign-in risk<select class="in" id="wi-r"><option value="none"' + (w.risk==='none'?' selected':'') + '>None</option><option value="medium"' + (w.risk==='medium'?' selected':'') + '>Medium</option><option value="high"' + (w.risk==='high'?' selected':'') + '>High</option></select></label>' +
      '</div><div class="row" style="gap:14px;flex-wrap:wrap;margin-top:8px">' +
      '<label class="check"><input type="checkbox" id="wi-m"' + (w.mfa?' checked':'') + '> Completed multi-factor</label>' +
      '<label class="check"><input type="checkbox" id="wi-d"' + (w.compliant?' checked':'') + '> Managed, compliant device</label>' +
      '<label class="check"><input type="checkbox" id="wi-p"' + (w.phishResistant?' checked':'') + '> Used a phishing-resistant method</label>' +
      '<label class="check"><input type="checkbox" id="wi-n"' + (w.anon?' checked':'') + '> From an anonymising service</label>' +
      '</div>' +
      '<div class="k" style="margin-top:14px">Result: <span class="' + (/^Blocked/.test(r.outcome) ? 'res bad' : /^Interrupted/.test(r.outcome) ? 'res warn' : 'res ok') + '">' + esc(r.outcome) + '</span></div>' +
      '</div>' + table(['Policy','Why it applies','Outcome'], rows, ''));
  }
  function caEdit(id){
    var p = caBy(id), n = caNorm(p), groups = D.groups.map(function(g){ return g.name; });
    var people = allUsers().filter(function(u){ return u.status!=='Not created'; });
    openModal('Policy — ' + p.id,
      '<p class="hint">' + esc(p.name) + '</p>' +
      '<label class="fld" for="ce-s">State</label><select class="in" id="ce-s"><option value="On"' + (p.state==='On'?' selected':'') + '>On</option><option value="Report-only"' + (/report/i.test(p.state)?' selected':'') + '>Report-only</option><option value="Off (draft)"' + (/^off/i.test(p.state)?' selected':'') + '>Off</option></select>' +
      '<label class="fld" for="ce-a">Assigned to</label><select class="in" id="ce-a"><option value="all"' + (n.allUsers?' selected':'') + '>All users</option><option value="admins"' + (n.admins?' selected':'') + '>Anyone holding an admin role</option>' +
        groups.map(function(g){ return '<option value="' + esc(g) + '"' + (n.groups.indexOf(g)>=0?' selected':'') + '>' + esc(g) + '</option>'; }).join('') + '</select>' +
      '<label class="fld">Excluded</label>' +
      people.filter(function(u){ return /break-glass|emergency/i.test(u.title||'') || n.exclude.indexOf(u.name)>=0; }).map(function(u){
        return '<label class="check"><input type="checkbox" class="ce-x" value="' + esc(u.name) + '"' + (n.exclude.indexOf(u.name)>=0?' checked':'') + '> ' + esc(u.name) + '</label>'; }).join('') +
      '<p class="hint">Excluding the emergency accounts is not an exception to the policy. It is the thing that lets you undo the policy.</p>',
      'Save', function(){
        var st = document.getElementById('ce-s').value, as = document.getElementById('ce-a').value;
        var ex = [].slice.call(modalEl.querySelectorAll('.ce-x')).filter(function(x){ return x.checked; }).map(function(x){ return x.value; });
        act('Update conditional access policy', p.id, function(){
          p.state = st;
          p.assign = as==='all' ? 'All users' : as==='admins' ? 'Administrators' : as;
          p.exclude = ex.join(', ') || 'None';
          p.n = null;
        }, p.id + ' updated', {cat:'Security', detail:p.id + ' · ' + st + ' · assigned to ' + p.assign + ' · excluding ' + (p.exclude) + '.'});
      });
  }
  function caToggle(id){
    var p = null; S.ca.forEach(function(x){ if(x.id===id) p = x; });
    var next = p.state==='On' ? 'Report-only' : 'On';
    confirmBox('Change policy state', '<p>Set <b>' + esc(p.id + ' · ' + p.name) + '</b> to <b>' + next + '</b>?</p>' + impact([next==='On' ? 'The policy starts blocking or requiring controls for real sign-ins.' : 'The policy stops enforcing and only records what it would have done.'], 'Conditional access changes hit every sign-in in the tenant. Report-only first is the safe order.'), 'Set ' + next, function(){
      act('Update conditional access policy', p.id + ' · ' + p.name, function(){ p.state = next; }, p.id + ' set to ' + next, {cat:'Conditional access', detail:'state: ' + p.state + ' → ' + next});
    }, next==='On');
  }
  function unlockAccount(upn){
    var u = U(upn);
    act('Unlock AD account', u.name, function(){ u.ad.locked = false; u.ad.badPwd = 0; }, 'Unlocked ' + D.netbios + '\\' + u.ad.sam, {cat:'Active Directory', refs:['u:'+upn], detail:'lockoutTime cleared, badPwdCount reset.'});
  }
  function reportObj(sam){
    var o = adOnlyBy(sam);
    openModal('Report to Security Operations', '<p>Open a case about <b>' + esc(o.name) + '</b> <span class="mono">(' + esc(o.sam) + ')</span>.</p><p class="faint">' + esc(o.desc) + '</p><label class="fld" for="ro-why">What needs a decision?</label><textarea class="in" id="ro-why" placeholder="What you found, who owns it, what you are asking them to do."></textarea><p class="hint" id="ro-err"></p>', 'Open case', function(){
      var why = document.getElementById('ro-why').value.trim(); if(why.length<10){ document.getElementById('ro-err').textContent = 'Describe what you found in at least a sentence.'; return false; }
      act('Report to Security', o.name, function(){ S.reports[sam] = why; }, 'Security case opened for ' + o.sam, {cat:'Security', detail:'“' + why + '”'});
      later2(function(){ notify('chat', 'secops', 'Case SEC-2294 opened on ' + o.sam + '. We’ll get the owner to rotate the password and take it out of Domain Admins. Leave the account running until they confirm.', null); });
    });
  }
  function reviewDecide(key){
    var it = reviewItems().filter(function(x){ return reviewKey(x)===key; })[0]; if(!it) return;
    var cur = S.review.items[key];
    openModal('Review decision — ' + it.name, '<p>' + esc(it.name) + ' holds <span class="mono">' + esc(it.g) + '</span>.</p><dl class="kv sm"><dt>Why they have it</dt><dd>' + esc(it.why) + '</dd><dt>Last sign-in</dt><dd class="mono">' + esc(it.last || '—') + '</dd><dt>Source</dt><dd>' + (it.kind==='cloud' ? 'Cloud group' : it.kind==='ad' ? 'Active Directory' : 'Service account (AD)') + '</dd></dl>' +
      '<label class="fld">Decision</label>' +
      '<label class="radio' + (cur && cur.d==='certify' ? ' on' : ' on') + '" data-d="certify"><input type="radio" name="rv" value="certify" id="rv-c" checked><span><b>Certify — the access is justified</b><br><span class="faint">Nothing changes. Your reason is the evidence.</span></span></label>' +
      '<label class="radio" data-d="revoke"><input type="radio" name="rv" value="revoke" id="rv-r"><span><b>Revoke — remove the access now</b><br><span class="faint">Takes effect immediately. On-premises groups reach the cloud at the next sync.</span></span></label>' +
      '<label class="fld" for="rv-why">Reason (the auditor reads this)</label><textarea class="in" id="rv-why" placeholder="Why this access is needed, or why it is being removed."></textarea><p class="hint" id="rv-err"></p>', 'Record decision', function(){
        var dcs = document.getElementById('rv-r').checked ? 'revoke' : 'certify', why = document.getElementById('rv-why').value.trim();
        if(why.length < 8){ document.getElementById('rv-err').textContent = 'A reason is required. “Approved” is not a reason.'; return false; }
        act('Access review decision', it.g + ' · ' + it.name, function(){
          S.review.items[key] = {d:dcs, why:why, at:S.clock};
          if(dcs==='revoke'){
            if(it.kind==='cloud'){ var u = U(it.upn); u.groups = u.groups.filter(function(a){ return a.g!==it.g; }); if(G(it.g) && G(it.g).tier==='privileged') markPriv(u); }
            else if(it.kind==='ad'){ var u2 = U(it.upn); u2.ad.groups = u2.ad.groups.filter(function(g){ return g!==it.g; }); markPriv(u2); }
            else { var o = S.adOnly[it.idx]; o.groups = o.groups.filter(function(g){ return g!==it.g; }); }
          }
        }, (dcs==='revoke' ? 'Revoked ' : 'Certified ') + it.name + ' · ' + it.g, {cat:'Access review', refs:['u:'+(it.upn||''), 'g:'+it.g], detail:(dcs==='revoke' ? 'Revoked' : 'Certified') + ' · ' + it.name + ' · ' + it.g + '. Reason: “' + why + '”'});
      }, function(){
        modalEl.querySelectorAll('input[name=rv]').forEach(function(r){ r.onchange = function(){ modalEl.querySelectorAll('.radio').forEach(function(l){ l.classList.toggle('on', l.dataset.d===r.value); }); }; });
      });
  }
  function reviewSubmit(){
    if(!reviewDone()){ toast('Every member needs a decision before the review can be submitted.'); return; }
    var n = reviewItems().length, rev = reviewItems().filter(function(it){ return S.review.items[reviewKey(it)].d==='revoke'; }).length;
    confirmBox('Submit the review', '<p>Submit <b>' + esc(D.review.id) + '</b> with ' + n + ' decisions (' + rev + ' revoked, ' + (n-rev) + ' certified)?</p>' + impact(['The campaign is closed and becomes evidence you can attach to a finding.'], 'Decisions after this are ordinary changes, not part of the review.'), 'Submit review', function(){
      act('Submit access review', D.review.id, function(){ S.review.submitted = S.clock; }, 'Review ' + D.review.id + ' submitted', {cat:'Access review', detail:n + ' decisions · ' + rev + ' revoked · ' + (n-rev) + ' certified.'});
    });
  }
  function attachEvidence(fid){
    var f = (D.findings || []).filter(function(x){ return x.id===fid; })[0], pool = evidencePool(), have = evidenceOf(fid);
    if(!pool.length){ openModal('No evidence yet', '<p>There is nothing to attach yet. Evidence is produced by the work: a submitted access review, a security case, or the audit-log entry for a change you made.</p>', null); return; }
    openModal('Attach evidence — ' + fid, '<p class="hint" style="margin-top:0">' + esc(f ? f.title : '') + '</p><div class="evlist">' + pool.map(function(p, i){ return '<label class="check ev"><input type="checkbox" data-ev="' + esc(p.k) + '"' + (have.indexOf(p.k)>=0 ? ' checked' : '') + '><span><b>' + esc(p.label) + '</b><br><span class="faint">' + esc((p.sub||'').slice(0,140)) + '</span></span></label>'; }).join('') + '</div>', 'Attach', function(){
      var sel = []; modalEl.querySelectorAll('[data-ev]').forEach(function(c){ if(c.checked) sel.push(c.dataset.ev); });
      act('Attach evidence', fid, function(){ S.evidence[fid] = sel; }, sel.length + ' item(s) attached to ' + fid, {cat:'Audit', detail:fid + ': ' + (sel.join(', ') || 'none')});
    });
    modalEl.querySelector('.modal').classList.add('wide');
  }
  function svcSetOwner(sam){
    var o = adOnlyBy(sam), cands = allUsers().filter(function(u){ return u.status==='Enabled' && !u.shared && !u.service; });
    openModal('Assign an owner — ' + o.name, '<p class="hint">An owner is the person who decides what happens to this account: who approves a rotation, and who is called when the job it runs fails.</p><label class="fld" for="so-u">Owner</label><select class="in" id="so-u">' + cands.map(function(u){ return '<option value="' + u.upn + '">' + esc(u.name) + ' — ' + esc(u.title) + '</option>'; }).join('') + '</select>', 'Set owner', function(){
      var up = document.getElementById('so-u').value;
      act('Set service account owner', o.name, function(){ o.owner = up; }, 'Owner set to ' + U(up).name, {cat:'Service accounts', refs:['u:'+up], detail:o.name + ' · owner: ' + U(up).name});
    });
  }
  function svcInteractive(sam){
    var o = adOnlyBy(sam);
    confirmBox('Remove interactive logon', '<p>Deny interactive and remote desktop logon for <span class="mono">' + esc(o.sam) + '</span>?</p>' + impact(['The account can still run its service or scheduled task.', 'Nobody can sign in as it at a desk or over RDP.'], 'Applies at the next logon attempt. It does not end a session that is already open.'), 'Deny interactive logon', function(){
      act('Restrict service account logon', o.name, function(){ o.interactive = false; }, 'Interactive logon denied for ' + o.sam, {cat:'Service accounts', detail:o.name + ' · Deny log on locally and Deny log on through Remote Desktop Services applied.'});
    }, true);
  }
  function svcUnlock(sam){
    var o = adOnlyBy(sam);
    act('Unlock account', o.name, function(){ o.locked = false; o.badPwd = 0; }, 'Unlocked ' + o.sam, {cat:'Authentication', detail:o.name + ' · lockoutTime cleared. It will lock again if something keeps trying the old password.'});
  }
  function svcRotate(sam){
    var o = adOnlyBy(sam), jobs = o.runsOn || [];
    openModal('Rotate credential — ' + o.name, '<p>Set a new password for <span class="mono">' + esc(o.sam) + '</span>.</p>' +
      (jobs.length ? '<div class="impact"><div class="k">What uses this credential</div>' + jobs.map(function(j){ return '<p>' + esc(j.host) + ' · ' + esc(j.name) + ' <span class="faint">(' + esc(j.kind) + ')</span></p>'; }).join('') + '<p class="faint">Each of these stores the password. After a rotation they hold a stale copy until you update them.</p></div>' : '') +
      '<label class="fld">Timing</label>' +
      '<label class="radio on" data-t="window"><input type="radio" name="rt" value="window" id="rt-w" checked><span><b>Coordinated — tonight’s change window</b><br><span class="faint">The owner is told and you update each system in the window</span></span></label>' +
      '<label class="radio" data-t="now"><input type="radio" name="rt" value="now" id="rt-n"><span><b>Immediately — the credential is exposed</b><br><span class="faint">Accepts the outage. Correct when the password is known to be in the clear (P19)</span></span></label>' +
      '<label class="fld">Where the new password goes</label>' +
      '<label class="radio on" data-v="vault"><input type="radio" name="rv" value="vault" id="rv-v" checked><span><b>Into the password vault</b><br><span class="faint">Only the systems that need it read it from there</span></span></label>' +
      '<label class="radio" data-v="person"><input type="radio" name="rv" value="person" id="rv-p"><span><b>Send it to a person</b></span></label>' +
      '<div id="rv-w" hidden><input class="in" id="rv-who" placeholder="name@meridianfreight.example"></div>' +
      '<label class="fld" for="rt-why">Reason</label><input class="in" id="rt-why" placeholder="Why the credential is being rotated"><p class="hint" id="rt-err"></p>', 'Rotate', function(){
        var why = document.getElementById('rt-why').value.trim();
        if(why.length < 5){ document.getElementById('rt-err').textContent = 'A reason is required.'; return false; }
        var now = document.getElementById('rt-n').checked, toPerson = document.getElementById('rv-p').checked, who = (document.getElementById('rv-who').value||'').trim();
        if(toPerson && !/@/.test(who)){ document.getElementById('rt-err').textContent = 'Enter the address to send it to.'; return false; }
        act('Rotate service account credential', o.name, function(){
          o.pwdSet = 'Today'; o.rotated = true; o.rotatedAt = S.clock; o.rotateMode = now ? 'immediate' : 'window';
          if(toPerson) o.shared = who;
          (o.runsOn||[]).forEach(function(j){ j.cred = 'stale'; });
        }, 'Credential rotated for ' + o.sam + (jobs.length ? ' · ' + jobs.length + ' system(s) now hold a stale copy' : ''), {cat:'Service accounts', detail:o.name + ' · ' + (now ? 'rotated immediately (exposed credential)' : 'rotated in the coordinated window') + '. Delivered ' + (toPerson ? 'to ' + who : 'to the password vault') + '. Reason: “' + why + '”'});
      }, function(){
        modalEl.querySelectorAll('input[name=rt]').forEach(function(r){ r.onchange = function(){ modalEl.querySelectorAll('[data-t]').forEach(function(l){ l.classList.toggle('on', l.dataset.t===r.value); }); }; });
        modalEl.querySelectorAll('input[name=rv]').forEach(function(r){ r.onchange = function(){ modalEl.querySelectorAll('[data-v]').forEach(function(l){ l.classList.toggle('on', l.dataset.v===r.value); }); document.getElementById('rv-w').hidden = !document.getElementById('rv-p').checked; }; });
      });
  }
  function jobAction(sam, i, kind){
    var o = adOnlyBy(sam), j = o.runsOn[i];
    if(kind==='update') confirmBox('Update stored credential', '<p>Update the stored password for <b>' + esc(j.name) + '</b> on <span class="mono">' + esc(j.host) + '</span>?</p>' + impact(['The job reads the current password from the vault and stores it.'], j.essential ? 'This is a job the business depends on.' : 'This job is not marked essential.'), 'Update', function(){
      act('Update stored credential', j.name, function(){ j.cred = 'current'; j.last = 'Updated ' + fmt(S.clock); }, 'Credential updated on ' + j.host, {cat:'Service accounts', detail:j.host + ' · ' + j.name + ' now holds the current password for ' + o.name});
    });
    if(kind==='disable') confirmBox('Disable job', '<p>Disable <b>' + esc(j.name) + '</b> on <span class="mono">' + esc(j.host) + '</span>?</p>' + impact([esc(j.note || '')], j.essential ? '⚠ This job is marked essential. Disabling it stops work the business depends on.' : 'This job is not marked essential.'), 'Disable job', function(){
      act('Disable scheduled job', j.name, function(){ j.enabled = false; j.last = 'Disabled ' + fmt(S.clock); }, 'Disabled ' + j.name + ' on ' + j.host, {cat:'Service accounts', detail:j.host + ' · ' + j.name + ' disabled. Runs as ' + o.name + '.'});
    }, j.essential);
    if(kind==='enable') act('Enable scheduled job', j.name, function(){ j.enabled = true; }, 'Enabled ' + j.name, {cat:'Service accounts', detail:j.host + ' · ' + j.name});
  }
  function secretAdd(id){
    var a = appReg(id);
    openModal('Add a client secret — ' + a.name, '<p class="hint">Adding a secret does not remove the old one. Both work until you revoke the old, which is what makes a cutover possible.</p><label class="fld" for="sc-n">Description</label><input class="in" id="sc-n" value="' + esc(a.name.toLowerCase().split(" ")[0]) + '-' + '2026-rotation">' +
      '<label class="fld" for="sc-e">Expires</label><select class="in" id="sc-e"><option value="6">6 months</option><option value="12" selected>12 months</option><option value="24">24 months (maximum)</option></select>', 'Create secret', function(){
      var n = document.getElementById('sc-n').value.trim() || 'new-secret', mo = document.getElementById('sc-e').value;
      act('Add client secret', a.name, function(){ a.secrets.push({id:'S' + (a.secrets.length+1), name:n, created:'Today', expires:'in ' + mo + ' months', state:'active', lastUsed:'never', isNew:true}); }, 'New secret created for ' + a.name, {cat:'Application management', detail:a.name + ' · secret “' + n + '”, expires in ' + mo + ' months. The old secret is still active for the cutover.'});
      later2(function(){ openModal('Client secret value', '<p>Copy this into the vault now. It is not shown again.</p><div class="secret mono">' + guid('sec'+id+S.clock).slice(0,8) + '~' + guid('sec2'+id).slice(0,16) + '</div>', null); });
    });
  }
  function secretRevoke(id, sid){
    var a = appReg(id), s = a.secrets.filter(function(x){ return x.id===sid; })[0];
    confirmBox('Revoke secret', '<p>Revoke <b>' + esc(s.name) + '</b> on ' + esc(a.name) + '?</p>' + impact(['Anything still using this secret stops authenticating at once.'], 'Last used: ' + esc(s.lastUsed) + '. Revoke after the owner has cut over, not before.'), 'Revoke', function(){
      act('Revoke client secret', a.name, function(){ s.state = 'revoked'; }, 'Secret revoked on ' + a.name, {cat:'Application management', detail:a.name + ' · “' + s.name + '” revoked.'});
    }, true);
  }
  function regOwners(id){
    var a = appReg(id), cands = allUsers().filter(function(u){ return u.status==='Enabled' && !u.shared; });
    openModal('Owners — ' + a.name, '<p class="hint">Owners get the expiry warnings and approve changes. An owner who has left gets nothing.</p>' +
      '<div class="evlist">' + a.owners.map(function(o){ var u = U(o); return '<div class="check ev"><span><b>' + esc(u ? u.name : o) + '</b> ' + (u && u.status!=='Enabled' ? '<span class="pill dis">' + esc(u.status) + '</span>' : '') + '<br><span class="faint">' + esc(u ? u.title : '') + '</span></span><button class="btn danger sm" data-ro="' + esc(o) + '" type="button">Remove</button></div>'; }).join('') + '</div>' +
      '<label class="fld" for="ro-add">Add an owner</label><select class="in" id="ro-add"><option value="">—</option>' + cands.map(function(u){ return '<option value="' + u.upn + '">' + esc(u.name) + ' — ' + esc(u.title) + '</option>'; }).join('') + '</select>', 'Save', function(){
        var add = document.getElementById('ro-add').value;
        if(add && a.owners.indexOf(add)<0) act('Update application owners', a.name, function(){ a.owners.push(add); }, 'Owner added to ' + a.name, {cat:'Application management', refs:['u:'+add], detail:a.name + ' · owner added: ' + U(add).name});
      }, function(close){
        modalEl.querySelectorAll('[data-ro]').forEach(function(b){ b.onclick = function(){ var o = b.dataset.ro; close(); act('Update application owners', a.name, function(){ a.owners = a.owners.filter(function(x){ return x!==o; }); }, 'Owner removed from ' + a.name, {cat:'Application management', detail:a.name + ' · owner removed: ' + (U(o) ? U(o).name : o)}); }; });
      });
  }
  function quarantine(hid){
    var hgt = scanHit(hid);
    confirmBox('Quarantine the file', '<p>Move <span class="mono">' + esc(hgt.file) + '</span> out of <span class="mono">' + esc(hgt.path) + '</span> into the security quarantine?</p>' + impact(['The file is removed from the share and kept for Security to review.'], 'Copies people already took are not affected, which is why the credential has to be rotated as well.'), 'Quarantine', function(){
      act('Quarantine file', hgt.file, function(){ hgt.state = 'quarantined'; }, hgt.file + ' quarantined', {cat:'Security', detail:hgt.path + '\\' + hgt.file + ' moved to quarantine. ' + (hgt.svc ? 'Credential for ' + hgt.svc + ' must be treated as exposed.' : '')});
    }, true);
  }
  function riskDecide(upn, kind){
    var u = U(upn), rs = riskFor(upn);
    var body = '<p>' + esc(u.name) + ' has ' + rs.length + ' open detection(s).</p><div class="evlist">' + rs.map(function(r){ return '<div class="check ev"><span><b>' + esc(r.type) + '</b> <span class="mono faint">' + esc(r.t) + '</span><br><span class="faint">' + esc(r.detail) + '</span></span></div>'; }).join('') + '</div>' +
      '<label class="fld" for="rk-why">' + (kind==='confirmed' ? 'What confirms the compromise?' : 'Why is this not an attack?') + '</label><textarea class="in" id="rk-why" placeholder="' + (kind==='confirmed' ? 'The evidence: sign-ins, registrations, what was changed.' : 'The innocent explanation, and what in the record supports it.') + '"></textarea><p class="hint" id="rk-err"></p>';
    openModal(kind==='confirmed' ? 'Confirm compromised — ' + u.name : 'Dismiss risk — ' + u.name, body, kind==='confirmed' ? 'Confirm compromised' : 'Dismiss risk', function(){
      var why = document.getElementById('rk-why').value.trim();
      if(why.length < 10){ document.getElementById('rk-err').textContent = 'A written reason is required — this is the record of your judgement.'; return false; }
      act(kind==='confirmed' ? 'Confirm user compromised' : 'Dismiss user risk', u.name, function(){ rs.forEach(function(r){ r.state = kind; r.why = why; }); u.riskState = kind; }, kind==='confirmed' ? u.name + ' confirmed compromised' : 'Risk dismissed for ' + u.name, {cat:'Identity protection', refs:['u:'+upn], detail:rs.length + ' detection(s) marked ' + kind + '. “' + why + '”'});
    });
  }
  function consentAction(id, kind){
    var c = consentBy(id);
    if(kind==='revoke') confirmBox('Revoke consent', '<p>Revoke the access granted to <b>' + esc(c.app) + '</b>?</p>' + impact(['The application loses its tokens and can no longer read or send mail as ' + c.users.map(function(x){ return esc(U(x) ? U(x).name : x); }).join(', ') + '.'], 'Consent is a standing grant. It survives password changes and MFA, so revoking is what actually stops it.'), 'Revoke consent', function(){
      act('Revoke application consent', c.app, function(){ c.state = 'revoked'; }, 'Consent revoked for ' + c.app, {cat:'Application management', refs:c.users.map(function(x){ return 'u:'+x; }), detail:c.app + ' · ' + c.perms.join(', ') + ' revoked for ' + c.users.join(', ')});
    }, true);
    if(kind==='block') confirmBox('Block the application', '<p>Block <b>' + esc(c.app) + '</b> for everyone in the tenant?</p>' + impact(['Nobody can consent to it, and existing grants stop working.'], 'Revoking one person’s consent does nothing about the next person who gets the same email.'), 'Block app', function(){
      act('Block application', c.app, function(){ c.state = 'blocked'; }, c.app + ' blocked tenant-wide', {cat:'Application management', detail:c.app + ' blocked. Publisher: ' + c.publisher});
    }, true);
  }
  function authToggle(key){
    var p = S.authPolicy, on = !p[key];
    var names = {numberMatching:'Number matching for push approvals', pushLocation:'Show the sign-in location in the prompt', legacyBlocked:'Block legacy authentication'};
    confirmBox(on ? 'Turn on ' + names[key] : 'Turn off ' + names[key], '<p>' + (on ? 'Enable' : 'Disable') + ' <b>' + esc(names[key]) + '</b> for everyone?</p>' + impact([key==='numberMatching' ? (on ? 'Approving a prompt now requires typing a number shown on the sign-in screen. A one-tap approval is no longer possible.' : 'Approvals go back to a single tap.') : 'Applies to every sign-in in the tenant.'], 'Authentication method policy changes affect everyone at once.'), on ? 'Turn on' : 'Turn off', function(){
      act('Update authentication methods policy', names[key], function(){ p[key] = on; }, names[key] + (on ? ' turned on' : ' turned off'), {cat:'Authentication', detail:names[key] + ': ' + (on ? 'off → on' : 'on → off')});
    }, !on);
  }
  function syncNow(){
    var p = pendingAll().length;
    confirmBox('Run directory sync', '<p>Start a sync cycle on <span class="mono">MF-AADC01</span>?</p>' + impact([p ? p + ' object(s) have on-premises changes waiting.' : 'No pending changes. The cycle will run and find nothing.'], 'A full cycle normally runs every 30 minutes.'), 'Run sync', function(){
      act('Start sync cycle', 'MF-AADC01', function(){ runSync(true); }, p ? 'Sync complete · ' + p + ' object(s) updated' : 'Sync complete · nothing to update', {cat:'Directory sync', mins:3, detail:'Delta sync started by the operator.'});
    });
  }

  // ---------- PowerShell ----------
  function psOut(s, t){ S.ps.push({s:s, t:t||'out'}); }
  function psAudit(action, target, detail, cat, refs){ S.audit.unshift({tl:stamp(), actor:ME + ' (PowerShell)', cat:cat||'Active Directory', action:action, target:target, detail:detail, refs:refs||[], cid:guid('ps'+S.clock+action), mine:true}); S.clock += 1; }
  function psFind(id){
    id = (id||'').toLowerCase().replace(/^meridian\\/,'');
    var u = null; allUsers().forEach(function(x){ if(x.upn.toLowerCase()===id || mail(x.upn).toLowerCase()===id || (x.ad && x.ad.sam.toLowerCase()===id) || x.name.toLowerCase()===id) u = x; });
    return u;
  }
  function psOu(p){ if(!p) return null; if(D.ous.indexOf(p)>=0) return p;
    var parts = (p.match(/OU=([^,]+)/gi)||[]).map(function(s){ return s.slice(3); }).reverse().filter(function(x){ return x!=='Meridian'; });
    if(/CN=Users/i.test(p)) return 'Users (default container)';
    var j = parts.join('/'); return D.ous.indexOf(j)>=0 ? j : null;
  }
  function psTable(rows, cols){ var w = cols.map(function(c, i){ return Math.max(c.length, Math.max.apply(null, rows.map(function(r){ return String(r[i]).length; }).concat([0]))); });
    var line = function(cells){ return cells.map(function(c, i){ return String(c) + Array(Math.max(1, w[i] - String(c).length + 2)).join(' '); }).join(''); };
    psOut(''); psOut(line(cols)); psOut(line(w.map(function(n){ return Array(n+1).join('-'); })));
    rows.forEach(function(r){ psOut(line(r)); }); psOut('');
  }
  var PS_HELP = [
    'ActiveDirectory module:',
    '  Get-ADUser <identity> [-Properties *]        Get-ADUser -Filter * | -Filter {PasswordNeverExpires -eq $true}',
    '  Search-ADAccount -AccountInactive [-TimeSpan 90]',
    '  Get-ADGroupMember <group> [-Recursive]        Get-ADGroup <group>',
    '  Add-ADGroupMember -Identity <group> -Members <user>',
    '  Remove-ADGroupMember -Identity <group> -Members <user>',
    '  Disable-ADAccount -Identity <user>            Enable-ADAccount -Identity <user>',
    '  Unlock-ADAccount -Identity <user>             Set-ADUser -Identity <user> -Description "text"',
    '  Move-ADObject -Identity <user> -TargetPath "OU=Ops,OU=Corp Users,DC=meridian,DC=local"',
    '  Start-ADSyncSyncCycle -PolicyType Delta',
    '',
    'MeridianIdentity module (cloud):',
    '  Get-MfUser <upn>                              Get-MfSignInLog -UserId <upn>',
    '  Revoke-MfUserSession -UserId <upn>            Remove-MfUserAuthMethod -UserId <upn> -All',
    '  Set-MfMailbox -Identity <upn> -Type Shared    Add-MfMailboxPermission -Identity <upn> -User <upn>',
    '  Remove-MfUserLicense -UserId <upn>            Get-MfShareAccess -Path <path> [-User <upn>]',
    '',
    'Cmdlets that emit objects (these can be piped):',
    '  Get-ADUser -Filter *      Get-MgUser        Get-MgGroup',
    '  Get-MgSignIn              Get-MgAuditLog    Get-MfTicket',
    '',
    'Pipeline:',
    '  Where-Object { $_.Property -eq \'value\' }     also -ne -gt -lt -like -match -contains, and -and',
    '  Sort-Object <Property> [-Descending]          Select-Object <A,B> [-First n]',
    '  Measure-Object                                ForEach-Object { $_.Property }',
    '  Format-Table [<A,B>]                          Format-List',
    '',
    'Variables:',
    '  $stale = Get-ADUser -Filter * | Where-Object { $_.Enabled -eq $false }',
    '  $stale | Measure-Object',
    '',
    'clear · help'
  ];
  // ---------- the shell ----------
  // What used to be here ran exactly one cmdlet and printed. That is not what
  // anybody actually types: the job is usually "find the ones where X and count
  // them", which is a pipeline. Object-producing cmdlets now return rows, the
  // pipeline operators work on those rows, and a pipeline that ends without a
  // formatter prints itself as a table. Anything that changes state still goes
  // through the old path, so every mutation keeps its audit entry.
  function psVal(o, prop){
    if(prop === '_') return o;
    var k = Object.keys(o).filter(function(x){ return x.toLowerCase() === String(prop).toLowerCase(); })[0];
    return k ? o[k] : undefined;
  }
  function psCompare(a, op, b){
    var na = parseFloat(a), nb = parseFloat(b), nums = !isNaN(na) && !isNaN(nb) && String(a).trim()!=='' && String(b).trim()!=='';
    var sa = String(a==null ? '' : a), sb = String(b==null ? '' : b);
    switch(op){
      case '-eq': return nums ? na===nb : sa.toLowerCase()===sb.toLowerCase();
      case '-ne': return !psCompare(a,'-eq',b);
      case '-gt': return nums ? na>nb : sa>sb;
      case '-ge': return nums ? na>=nb : sa>=sb;
      case '-lt': return nums ? na<nb : sa<sb;
      case '-le': return nums ? na<=nb : sa<=sb;
      case '-like': return new RegExp('^' + sb.replace(/[.+^${}()|[\]\\]/g,'\\$&').replace(/\*/g,'.*').replace(/\?/g,'.') + '$','i').test(sa);
      case '-notlike': return !psCompare(a,'-like',b);
      case '-match': try{ return new RegExp(sb,'i').test(sa); }catch(err){ return false; }
      case '-notmatch': return !psCompare(a,'-match',b);
      case '-contains': return Array.isArray(a) ? a.some(function(x){ return String(x).toLowerCase()===sb.toLowerCase(); }) : sa.toLowerCase().indexOf(sb.toLowerCase())>=0;
      default: return false;
    }
  }
  // Where-Object accepts both shapes people write: the script block and the
  // comparison-parameter form.
  function psWhere(rows, args){
    var body = args.join(' ').trim();
    var m = body.match(/^\{\s*(.+?)\s*\}$/);
    if(m) body = m[1];
    var parts = body.split(/\s+-and\s+/i);
    return rows.filter(function(o){
      return parts.every(function(cl){
        var mm = cl.match(/^\$_\.([A-Za-z0-9_]+)\s+(-\w+)\s+(.+)$/) || cl.match(/^([A-Za-z0-9_]+)\s+(-\w+)\s+(.+)$/);
        if(!mm) return true;
        var val = psVal(o, mm[1]), rhs = mm[3].replace(/^["']|["']$/g,'');
        if(/^\$(true|false)$/i.test(rhs)) return psCompare(!!val, mm[2], /true/i.test(rhs));
        return psCompare(val, mm[2], rhs);
      });
    });
  }
  function psRows(rows, cols){
    if(!rows.length){ psOut('No results.'); return; }
    cols = cols && cols.length ? cols : Object.keys(rows[0]);
    psTable(rows.map(function(o){ return cols.map(function(c){ var v = psVal(o, c); return Array.isArray(v) ? v.join(', ') : (v==null ? '' : v); }); }), cols);
  }
  function psList(rows){
    if(!rows.length){ psOut('No results.'); return; }
    rows.forEach(function(o){
      psOut('');
      var ks = Object.keys(o), w = Math.max.apply(null, ks.map(function(k){ return k.length; }));
      ks.forEach(function(k){ var v = o[k]; psOut(k + Array(w-k.length+1).join(' ') + ' : ' + (Array.isArray(v) ? v.join(', ') : (v==null ? '' : v))); });
    });
    psOut('');
  }
  // the object-producing side of the shell
  function psSource(cmd, args){
    var par = function(n){ for(var i=0;i<args.length;i++){ if(args[i].toLowerCase()==='-'+n) return args[i+1]; } return null; };
    var pos = args.filter(function(a){ return a[0]!=='-'; })[0];
    switch(cmd){
      case 'get-aduser': {
        var f = par('filter'), id = par('identity') || pos;
        if(!f && !(id==='*')) return null;                       // single-identity form keeps the old detailed output
        return allUsers().filter(onPrem).map(function(x){
          return {SamAccountName:x.ad.sam, Name:x.name, Enabled:x.ad.enabled, OU:x.ad.ou, Department:x.dept, Title:x.title,
                  EmployeeId:x.eid||'', PasswordLastSet:x.ad.pwdSet, PasswordNeverExpires:!!x.ad.pwdNeverExpires,
                  LastLogonDate:x.ad.lastLogon, LockedOut:!!x.ad.locked, MemberOf:x.ad.groups.slice(), UserPrincipalName:mail(x.upn)};
        }).concat(S.adOnly.map(function(o){
          return {SamAccountName:o.sam, Name:o.name, Enabled:o.enabled, OU:o.ou, Department:'', Title:'', EmployeeId:'',
                  PasswordLastSet:o.pwdSet, PasswordNeverExpires:!!o.pwdNeverExpires, LastLogonDate:o.lastLogon,
                  LockedOut:false, MemberOf:(o.groups||[]).slice(), UserPrincipalName:''};
        }));
      }
      case 'get-mguser': {
        return allUsers().filter(function(x){ return x.status!=='Not created'; }).map(function(x){
          return {DisplayName:x.name, UserPrincipalName:mail(x.upn), AccountEnabled:x.status==='Enabled',
                  Department:x.dept, JobTitle:x.title, EmployeeId:x.eid||'', License:x.lic||'',
                  Groups:names(x), AdminRoles:(x.roles||[]).map(function(r){ return r.r + ' (' + r.type + ')'; }),
                  MfaMethods:(x.mfa||[]).slice(), Sessions:(x.sessions||[]).length};
        });
      }
      case 'get-mggroup': {
        return D.groups.map(function(g){
          return {DisplayName:g.name, Description:g.desc, Tier:g.tier||'standard', Source:g.source||'Cloud',
                  Owners:(S.owners[g.name]||[]).map(pname), Members:members(g.name).length,
                  RoleAssignable:!!g.roleAssignable, Dynamic:isDyn(g.name)};
        });
      }
      case 'get-mgsignin': {
        return allSignins().map(function(s){
          return {Time:s.t, User:pname(s.upn), UserPrincipalName:s.upn, Resource:s.app, Location:s.loc,
                  IpAddress:s.ip, Device:s.dev, Mfa:s.mfa, Result:s.res};
        });
      }
      case 'get-mgauditlog': {
        return S.audit.concat(D.auditSeed).map(function(a){
          return {Time:a.tl, Actor:a.actor.replace('@'+DOM,'').replace(' (PowerShell)',''), Via:/PowerShell/.test(a.actor) ? 'PowerShell' : 'Console', Category:a.cat, Activity:a.action, Target:a.target};
        });
      }
      case 'get-mfticket': {
        return visibleTickets().map(function(t){
          var st = S.tickets[t.id];
          return {Id:t.id, Type:t.type, Subject:t.subject, Priority:t.pri, Requester:pname(t.requester), Status:st.status, Disposition:st.disp||''};
        });
      }
      default: return null;
    }
  }
  function psExec(raw){
    var line = raw.trim(); if(!line) return;
    psOut('PS C:\\> ' + line, 'in');
    S.psvars = S.psvars || {};
    // $x = ...
    var asn = line.match(/^\$([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+)$/);
    var assignTo = null;
    if(asn){ assignTo = asn[1]; line = asn[2].trim(); }
    // bare $x prints the variable
    var bare = line.match(/^\$([A-Za-z_][A-Za-z0-9_]*)$/);
    if(bare && !assignTo){
      var vr = S.psvars[bare[1]];
      if(!vr){ psOut('The variable $' + bare[1] + ' has not been set.', 'err'); return; }
      psRows(vr); return;
    }
    var segs = line.split(/\s*\|\s*/);
    var first = segs[0];
    var vm = first.match(/^\$([A-Za-z_][A-Za-z0-9_]*)$/);
    var rows = null;
    if(vm){
      rows = S.psvars[vm[1]];
      if(!rows){ psOut('The variable $' + vm[1] + ' has not been set.', 'err'); return; }
      rows = rows.slice();
    } else {
      var t0 = first.match(/"[^"]*"|'[^']*'|\S+/g).map(function(t){ return t.replace(/^["']|["']$/g, ''); });
      rows = psSource(t0[0].toLowerCase(), t0.slice(1));
      if(rows === null){
        if(segs.length > 1){
          var known = /^(get|set|add|remove|new|search|move|enable|disable|unlock|revoke|start)-/i.test(t0[0]);
          psOut(t0[0] + (known ? ' : this cmdlet changes state or returns a single object, so it cannot be piped in this session.' : ' : the term \'' + t0[0] + '\' is not recognized in this session.') +
            ' Cmdlets that emit objects: Get-ADUser -Filter *, Get-MgUser, Get-MgGroup, Get-MgSignIn, Get-MgAuditLog, Get-MfTicket.', 'err'); return; }
        psRun(raw, true); return;                 // a state-changing or single-object cmdlet: old path, with its audit entry
      }
    }
    var printed = false;
    for(var i=1;i<segs.length;i++){
      var tk = segs[i].match(/"[^"]*"|'[^']*'|\{[^}]*\}|\S+/g) || [];
      var op = (tk[0]||'').toLowerCase(), rest = tk.slice(1).map(function(t){ return t.replace(/^["']|["']$/g,''); });
      if(op==='where-object' || op==='where' || op==='?'){ rows = psWhere(rows, segs[i].replace(/^\s*\S+\s*/,'').split(/\s+/)); continue; }
      if(op==='sort-object' || op==='sort'){
        var key = rest.filter(function(a){ return a[0]!=='-'; })[0], desc = rest.some(function(a){ return /^-desc/i.test(a); });
        rows = rows.slice().sort(function(a,b){ var x = psVal(a,key), y = psVal(b,key); return (x>y?1:x<y?-1:0) * (desc?-1:1); }); continue;
      }
      if(op==='select-object' || op==='select'){
        var n = rest.filter(function(a){ return a[0]!=='-'; });
        var firstN = null; for(var j=0;j<rest.length;j++){ if(/^-first$/i.test(rest[j])) firstN = +rest[j+1]; }
        if(firstN){ rows = rows.slice(0, firstN); }
        var props = n.filter(function(x){ return !/^\d+$/.test(x); }).join(' ').split(/\s*,\s*/).filter(Boolean);
        if(props.length){ rows = rows.map(function(o){ var r = {}; props.forEach(function(pr){ var k = Object.keys(o).filter(function(x){ return x.toLowerCase()===pr.toLowerCase(); })[0] || pr; r[k] = psVal(o, pr); }); return r; }); }
        continue;
      }
      if(op==='measure-object' || op==='measure'){ psOut(''); psOut('Count : ' + rows.length); psOut(''); printed = true; continue; }
      if(op==='foreach-object' || op==='foreach' || op==='%'){
        var body2 = segs[i].replace(/^\s*\S+\s*/,'').replace(/^\{|\}$/g,'').trim();
        var pm = body2.match(/^\$_\.([A-Za-z0-9_]+)$/);
        if(pm){ rows.forEach(function(o){ var v = psVal(o, pm[1]); psOut(Array.isArray(v) ? v.join(', ') : String(v==null?'':v)); }); printed = true; continue; }
        psOut('ForEach-Object : this session supports { $_.Property } only.', 'err'); return;
      }
      if(op==='format-table' || op==='ft'){ psRows(rows, rest.filter(function(a){ return a[0]!=='-'; }).join(' ').split(/\s*,\s*/).filter(Boolean)); printed = true; continue; }
      if(op==='format-list' || op==='fl'){ psList(rows); printed = true; continue; }
      psOut(tk[0] + ' : not supported in this session. Pipeline cmdlets available: Where-Object, Sort-Object, Select-Object, Measure-Object, ForEach-Object, Format-Table, Format-List.', 'err');
      return;
    }
    if(assignTo){ S.psvars[assignTo] = rows; psOut(rows.length + ' object(s) stored in $' + assignTo + '.'); return; }
    if(!printed) psRows(rows);
  }
  function psRun(raw, quiet){
    var line = raw.trim(); if(!line) return;
    if(!quiet) psOut('PS C:\\> ' + line, 'in');
    var tok = line.match(/"[^"]*"|'[^']*'|\S+/g).map(function(t){ return t.replace(/^["']|["']$/g, ''); });
    var cmd = tok[0].toLowerCase(), args = tok.slice(1);
    var par = function(n){ for(var i=0;i<args.length;i++){ if(args[i].toLowerCase()==='-'+n) return args[i+1]; } return null; };
    var has = function(n){ return args.some(function(a){ return a.toLowerCase()==='-'+n || a.toLowerCase().indexOf('-'+n+':')===0; }); };
    var pos = args.filter(function(a){ return a[0]!=='-'; })[0];
    var id = par('identity') || par('userid') || pos;
    var u = psFind(id);
    var need = function(){ if(!u){ psOut('Get-ADUser : Cannot find an object with identity: \'' + (id||'') + '\'.', 'err'); return false; } return true; };
    switch(cmd){
      case 'help': case 'get-help': PS_HELP.forEach(function(l){ psOut(l); }); return;
      case 'clear': case 'cls': S.ps = []; return;
      case 'get-aduser': {
        var filter = par('filter') || (has('filter') ? '*' : null);
        if(filter && /passwordneverexpires/i.test(filter)){
          var l = S.adOnly.filter(function(o){ return o.pwdNeverExpires; }).map(function(o){ return [o.sam, o.name, o.ou, o.pwdSet]; });
          if(!l.length) psOut('No accounts match.'); else psTable(l, ['SamAccountName','Name','OU','PasswordLastSet']);
          return;
        }
        if(filter==='*' || (!id && filter)){
          psTable(allUsers().filter(onPrem).map(function(x){ return [x.ad.sam, x.name, x.ad.enabled ? 'True' : 'False', x.ad.ou]; }).concat(S.adOnly.map(function(o){ return [o.sam, o.name, o.enabled?'True':'False', o.ou]; })), ['SamAccountName','Name','Enabled','OU']);
          return;
        }
        if(!u){ var o = adOnlyBy((id||'').toLowerCase()); if(o){ psOut(''); psOut('SamAccountName    : ' + o.sam); psOut('Name              : ' + o.name); psOut('Enabled           : ' + o.enabled); psOut('OU                : ' + o.ou); psOut('PasswordLastSet   : ' + o.pwdSet); psOut('PasswordNeverExp. : ' + o.pwdNeverExpires); psOut('LastLogonDate     : ' + o.lastLogon); psOut('MemberOf          : ' + (o.groups.join(', ')||'-')); psOut('Description       : ' + o.desc); psOut(''); return; } }
        if(!need()) return;
        psOut(''); psOut('SamAccountName    : ' + u.ad.sam); psOut('UserPrincipalName : ' + mail(u.upn)); psOut('Name              : ' + u.name);
        psOut('Enabled           : ' + u.ad.enabled); psOut('DistinguishedName : ' + dn(u)); psOut('OU                : ' + u.ad.ou);
        if(has('properties')){ psOut('PasswordLastSet   : ' + u.ad.pwdSet); psOut('PasswordNeverExp. : ' + !!u.ad.pwdNeverExpires); psOut('LastLogonDate     : ' + u.ad.lastLogon); psOut('BadPwdCount       : ' + (u.ad.badPwd||0)); psOut('LockedOut         : ' + !!u.ad.locked); psOut('Description       : ' + (u.ad.desc||'')); }
        psOut('MemberOf          : ' + (u.ad.groups.join(', ') || '-')); psOut(''); return;
      }
      case 'search-adaccount': {
        if(!has('accountinactive')){ psOut('Search-ADAccount : specify -AccountInactive.', 'err'); return; }
        var stale = adAccounts().filter(function(a){ return !/^(Mon|Sun|Sat)/.test(a.last); });
        psTable(stale.map(function(a){ return [a.sam, a.name, a.enabled?'True':'False', a.last, a.ou]; }), ['SamAccountName','Name','Enabled','LastLogonDate','OU']); return;
      }
      case 'get-adgroup': { var g = adGroup(id); if(!g){ psOut('Get-ADGroup : Cannot find group \'' + (id||'') + '\'.', 'err'); return; } psOut(''); psOut('Name       : ' + g.name); psOut('Scope      : ' + g.scope); psOut('SyncedToCloud : ' + !!g.synced); psOut('MemberOf   : ' + (g.memberOf||'-')); psOut('Description: ' + g.desc); psOut(''); return; }
      case 'get-adgroupmember': {
        var g2 = adGroup(id); if(!g2){ psOut('Get-ADGroupMember : Cannot find group \'' + (id||'') + '\'.', 'err'); return; }
        var direct = allUsers().filter(function(x){ return onPrem(x) && x.ad.groups.indexOf(g2.name)>=0; }).map(function(x){ return [x.ad.sam, x.name, 'user', 'direct']; })
          .concat(S.adOnly.filter(function(o){ return o.groups.indexOf(g2.name)>=0; }).map(function(o){ return [o.sam, o.name, 'user', 'direct']; }));
        var nested = D.adGroups.filter(function(x){ return x.memberOf===g2.name; });
        nested.forEach(function(n){ direct.push([n.name, n.name, 'group', 'nested']); });
        if(has('recursive')) nested.forEach(function(n){ allUsers().filter(function(x){ return onPrem(x) && x.ad.groups.indexOf(n.name)>=0; }).forEach(function(x){ direct.push([x.ad.sam, x.name, 'user', 'via ' + n.name]); }); });
        psTable(direct, ['SamAccountName','Name','ObjectClass','How']);
        if(nested.length && !has('recursive')) psOut('Note: this group contains a nested group. Run with -Recursive to see who that actually includes.');
        return;
      }
      case 'add-adgroupmember': case 'remove-adgroupmember': {
        var gname = par('identity') || pos, mem = par('members'), mu = psFind(mem);
        var gg = adGroup(gname); if(!gg){ psOut(cmd + ' : Cannot find group \'' + (gname||'') + '\'.', 'err'); return; }
        if(!mu || !onPrem(mu)){ psOut(cmd + ' : Cannot find member \'' + (mem||'') + '\'.', 'err'); return; }
        if(cmd==='add-adgroupmember'){
          if(mu.ad.groups.indexOf(gg.name)>=0){ psOut('The specified account name is already a member of the group.', 'err'); return; }
          mu.ad.groups.push(gg.name); psAudit('Add member to AD group', gg.name, mu.name + ' added to ' + gg.name + ' (PowerShell).', 'Active Directory', ['u:'+mu.upn,'g:'+gg.name]);
        } else {
          var ix = mu.ad.groups.indexOf(gg.name); if(ix<0){ psOut('The specified account is not a member of the group.', 'err'); return; }
          mu.ad.groups.splice(ix,1); if(/Admin/.test(gg.name)) markPriv(mu);
          psAudit('Remove member from AD group', gg.name, mu.name + ' removed from ' + gg.name + ' (PowerShell).', 'Active Directory', ['u:'+mu.upn,'g:'+gg.name]);
        }
        psOut('OK. Change is pending directory sync.'); return;
      }
      case 'disable-adaccount': case 'enable-adaccount': {
        if(!u || !onPrem(u)){ var oo = adOnlyBy((id||'').toLowerCase()); if(oo){ oo.enabled = cmd==='enable-adaccount'; psAudit(cmd==='enable-adaccount'?'Enable AD account':'Disable AD account', oo.name, 'userAccountControl changed by PowerShell. ' + oo.desc); psOut('OK.'); return; } psOut(cmd + ' : Cannot find an object with identity: \'' + (id||'') + '\'.', 'err'); return; }
        u.ad.enabled = cmd==='enable-adaccount';
        psAudit(u.ad.enabled?'Enable AD account':'Disable AD account', u.name, 'userAccountControl: ' + (u.ad.enabled?'disabled → enabled':'enabled → disabled') + ' (PowerShell). Pending directory sync.', 'Active Directory', ['u:'+u.upn]);
        psOut('OK. Change is pending directory sync.'); return;
      }
      case 'unlock-adaccount': { if(!need()) return; u.ad.locked = false; u.ad.badPwd = 0; psAudit('Unlock AD account', u.name, 'lockoutTime cleared (PowerShell).', 'Active Directory', ['u:'+u.upn]); psOut('OK.'); return; }
      case 'set-aduser': { if(!need()) return; var desc = par('description'); if(desc!=null){ u.ad.desc = desc; psAudit('Update AD user', u.name, 'description set to “' + desc + '” (PowerShell).', 'Active Directory', ['u:'+u.upn]); psOut('OK.'); } else psOut('Set-ADUser : nothing to change. Supported here: -Description.', 'err'); return; }
      case 'move-adobject': {
        var target = psOu(par('targetpath'));
        if(!target){ psOut('Move-ADObject : The target path is not a valid OU in this domain.', 'err'); return; }
        if(u && onPrem(u)){ var was = u.ad.ou; u.ad.ou = target; u.ad.ouChanged = true; psAudit('Move AD object', u.name, 'OU: ' + was + ' → ' + target + ' (PowerShell).', 'Active Directory', ['u:'+u.upn]); psOut('OK. Group policy for the new OU applies at next logon.'); return; }
        var o3 = adOnlyBy((id||'').toLowerCase()); if(o3){ var w3 = o3.ou; o3.ou = target; psAudit('Move AD object', o3.name, 'OU: ' + w3 + ' → ' + target + ' (PowerShell).'); psOut('OK.'); return; }
        psOut('Move-ADObject : Cannot find an object with identity: \'' + (id||'') + '\'.', 'err'); return;
      }
      case 'start-adsyncsynccycle': { var n = runSync(true); S.clock += 2; psOut('Result: Success'); psOut(n ? n + ' object(s) exported to the cloud directory.' : 'No changes to export.'); return; }
      case 'get-mfuser': { if(!need()) return; psOut(''); psOut('DisplayName    : ' + u.name); psOut('UserPrincipal  : ' + mail(u.upn)); psOut('AccountEnabled : ' + (u.status==='Enabled')); psOut('License        : ' + (u.lic||'none')); psOut('Groups         : ' + (names(u).join(', ')||'-')); psOut('AdminRoles     : ' + (u.roles.map(function(r){ return r.r + ' (' + r.type + ')'; }).join(', ')||'-')); psOut('Sessions       : ' + u.sessions.length); psOut('MfaMethods     : ' + (u.mfa.join(', ')||'none')); psOut('Mailbox        : ' + (u.mbx||'none')); psOut(''); return; }
      case 'get-mfsigninlog': { if(!need()) return; var l2 = allSignins().filter(function(s){ return s.upn===u.upn; }).map(function(s){ return [s.t, s.app, s.ip, s.dev, s.res]; }); psTable(l2, ['Time','Resource','IP','Device','Result']); return; }
      case 'revoke-mfusersession': { if(!need()) return; var n2 = u.sessions.length; u.sessions = []; u.revokedAt = S.clock; psAudit('Revoke sign-in sessions', u.name, n2 + ' refresh token(s) invalidated (PowerShell).', 'Authentication', ['u:'+u.upn]); psOut('OK. ' + n2 + ' session(s) revoked.'); return; }
      case 'remove-mfuserauthmethod': { if(!need()) return; if(!has('all')){ psOut('Specify -All to remove every registered method.', 'err'); return; } var m = u.mfa.slice(); u.mfa = []; psAudit('Delete authentication method', u.name, m.join(', ') + ' (PowerShell).', 'Authentication', ['u:'+u.upn]); psOut('OK.'); return; }
      case 'set-mfmailbox': { if(!need()) return; if((par('type')||'').toLowerCase()!=='shared'){ psOut('Supported here: -Type Shared.', 'err'); return; } u.mbx = 'Shared'; u.mbxDeleting = false; psAudit('Convert mailbox', u.name, 'UserMailbox → SharedMailbox (PowerShell).', 'Exchange', ['u:'+u.upn]); psOut('OK.'); return; }
      case 'add-mfmailboxpermission': { if(!need()) return; var d2 = psFind(par('user')); if(!d2){ psOut('Cannot find the user to grant access to.', 'err'); return; } if(u.delegates.indexOf(d2.upn)<0) u.delegates.push(d2.upn); psAudit('Add mailbox permission', u.name, 'FullAccess, SendAs → ' + d2.name + ' (PowerShell).', 'Exchange', ['u:'+u.upn,'u:'+d2.upn]); psOut('OK.'); return; }
      case 'remove-mfuserlicense': { if(!need()) return; var risky = u.mbx==='User'; var was = u.lic; u.lic=''; if(risky) u.mbxDeleting = true; psAudit('Remove license', u.name, was + ' removed (PowerShell).' + (risky ? ' Mailbox scheduled for deletion in 30 days.' : ''), 'License management', ['u:'+u.upn]); psOut('OK.' + (risky ? ' WARNING: the mailbox is not shared, so it is scheduled for deletion in 30 days.' : '')); return; }
      case 'get-mfshareaccess': {
        var path = par('path') || pos, sh2 = share(path);
        if(!sh2){ psOut('Get-MfShareAccess : No share at \'' + (path||'') + '\'.', 'err'); return; }
        var who = psFind(par('user'));
        if(who){ var r2 = effective(who, sh2); psOut(''); psOut('Path      : ' + sh2.path); psOut('User      : ' + who.name); psOut('Effective : ' + rankName(r2.n)); psOut('Reason    : ' + r2.why); psOut(''); return; }
        psTable(sh2.share.map(function(a){ return [a.p, a.rights, 'Share', '-']; }).concat(sh2.ntfs.map(function(a){ return [a.p, (a.deny?'DENY ':'') + a.rights, 'NTFS', a.inherited ? 'inherited' : 'explicit']; })), ['Principal','Rights','Level','Source']); return;
      }
      default: psOut(cmd + ' : The term \'' + tok[0] + '\' is not recognized in this session. Type help for what is supported.', 'err');
    }
  }

  // ---------- pages ----------
  function page(){
    switch(S.page){
      case 'tickets': return pTickets();
      case 'ticket': return pTicket(T(S.arg));
      case 'users': return pUsers();
      case 'user': return pUser(U(S.arg));
      case 'groups': return pGroups();
      case 'group': return pGroup(G(S.arg));
      case 'roles': return pRoles();
      case 'role': return pRole(AR(S.arg));
      case 'apps': return pApps();
      case 'app': return pApp(APP(S.arg));
      case 'licenses': return pLicenses();
      case 'ad': return pAD();
      case 'shares': return pShares();
      case 'sync': return pSync();
      case 'gpo': return pGPO();
      case 'ca': return pCA();
      case 'vault': return pVault();
      case 'rbac': return pRBAC();
      case 'report': return pReport();
      case 'authm': return pAuthM();
      case 'ext': return pExt();
      case 'pkg': return pPkg();
      case 'hr': return pHr();
      case 'ps': return pPS();
      case 'review': return pReview();
      case 'findings': return pFindings();
      case 'svc': return pSvc();
      case 'appregs': return pAppRegs();
      case 'risk': return pRisk();
      case 'consents': return pConsents();
      case 'bg': return pBreakGlass();
      case 'signins': return pSignins();
      case 'audit': return pAudit();
      case 'policy': return pPolicy();
      case 'runbooks': return pRunbooks();
      case 'myroles': return pMyRoles();
      default: return pHome();
    }
  }
  function allDoneBanner(){
    var pend = visibleTickets().filter(function(t){ return S.tickets[t.id].status==='pending'; }).length;
    return openCount()===0 ? '<div class="banner info"><span><b>Queue clear.</b> You can still change things, or end your shift to see how your decisions played out.</span><button class="btn" data-end="1" type="button">End shift</button></div>'
      : pend && pend===openCount() ? '<div class="banner info"><span><b>Waiting on approvals.</b> ' + pend + ' ticket(s) are pending. Approvers usually answer within a few minutes.</span></div>' : '';
  }
  function priPill(p){ return '<span class="pri ' + p.toLowerCase() + '">' + p + '</span>'; }
  function slaCell(st){
    if(st.due==null) return '<span class="faint">—</span>';
    if(st.status==='resolved'){ var met = parseT(st.at) <= st.due; return '<span class="sla ' + (met?'ok':'bad') + '">' + (met?'Met':'Breached') + '</span>'; }
    if(st.status==='pending') return '<span class="sla">Paused — pending</span>';
    var left = st.due - S.clock; return '<span class="sla ' + (left<0?'bad':left<90?'warn':'') + '">' + (left<0 ? dur(left) : dur(left) + ' left') + '</span>';
  }
  function tStatus(st){
    if(st.status==='resolved') return '<span class="pill res">Resolved</span>';
    if(st.status==='pending') return '<span class="pill pend">Pending approval</span>';
    if(st.status==='returned') return '<span class="pill act">Action needed</span>';
    return st.assignee ? '<span class="pill prog">In progress</span>' : '<span class="pill open">New</span>';
  }
  // ---- the credential vault --------------------------------------------
  // PIM answers "may you hold this role"; a vault answers "who has the password
  // right now, why, for how long, and is it still valid afterwards". The two
  // controls that make a vault a control rather than a password list are the
  // end of the check-out and what happens at it: rotate on return, or the
  // credential everybody who ever borrowed it still knows.
  function vault(){ if(!S.vault && D.vault) S.vault = JSON.parse(JSON.stringify(D.vault)); return S.vault; }
  function safeBy(id){ var v = vault(); if(!v) return null; for(var i=0;i<v.safes.length;i++){ if(v.safes[i].id===id) return v.safes[i]; } return null; }
  function vAcc(id){ var v = vault(); if(!v) return null; var hit = null;
    v.safes.forEach(function(s){ (s.accounts||[]).forEach(function(a){ if(a.id===id){ a._safe = s; hit = a; } }); }); return hit; }
  function vLog(entry){ var v = vault(); v.log = v.log || []; v.log.unshift(entry); }
  function vOverdue(a){ return a.checkedOutBy && a.dueAt != null && S.clock > a.dueAt; }

  // ---------- role mining ----------
  // The whole point of this page is that a role model built from job titles is a
  // reorganisation, not a control. Everything here is computed from the access
  // people actually hold, which is why the numbers disagree with the org chart.

  function rbacCfg(){ return D.roleModel || null; }
  function rbacState(){
    if(!S.rbac) S.rbac = { mined:false, roles:[], exceptions:{}, assigned:{}, stripped:{}, flagged:[] };
    return S.rbac;
  }
  // A person's entitlements, flattened across both halves of the identity and the
  // applications, because a role model that only knows about AD groups models a
  // third of the access and reports itself as complete.
  function entsOf(u){
    if(!u) return [];
    var out = [];
    var add = function(k){ if(k && out.indexOf(k)<0) out.push(k); };
    ((u.ad && u.ad.groups) || []).forEach(function(g){ add(typeof g === 'string' ? g : g && g.g); });
    (u.groups || []).forEach(function(g){ add(typeof g === 'string' ? g : g && g.g); });
    (u.apps || []).forEach(function(a){ add('APP:' + a.app + ':' + a.role); });
    (u.roles || []).forEach(function(r){ add('ROLE:' + (typeof r === 'string' ? r : (r && (r.r || r.role)))); });
    return out.sort();
  }
  function entLabel(e){
    if(e.indexOf('APP:')===0){ var p = e.split(':'); return p[1] + ' — ' + p[2]; }
    if(e.indexOf('ROLE:')===0) return e.slice(5) + ' (directory role)';
    return e;
  }
  function entKind(e){
    if(e.indexOf('APP:')===0) return 'Application role';
    if(e.indexOf('ROLE:')===0) return 'Directory role';
    var g = G(e); return g && g.tier === 'privileged' ? 'Privileged group' : g && g.tier === 'sensitive' ? 'Sensitive group' : 'Group';
  }
  function entSensitive(e){
    if(e.indexOf('ROLE:')===0) return true;
    var g = G(e); return !!(g && (g.tier==='privileged' || g.tier==='sensitive'));
  }
  function rbacPeople(dept){
    return allUsers().filter(function(u){
      if(u.guest) return false;
      if((u.status||'') !== 'Enabled') return false;
      if(dept && (u.dept||'') !== dept) return false;
      return true;
    });
  }
  // The mining itself. For one department: who is in it, what each entitlement's
  // coverage is, and which of them are held by so few people that they are
  // exceptions rather than anything to build a role out of.
  function mineDept(dept){
    var people = rbacPeople(dept), counts = {}, n = people.length;
    people.forEach(function(u){ entsOf(u).forEach(function(e){ counts[e] = (counts[e]||0) + 1; }); });
    var core = [], partial = [], outliers = [];
    Object.keys(counts).sort().forEach(function(e){
      var c = counts[e];
      if(n && c === n) core.push(e);
      else if(c > 1) partial.push(e);
      else outliers.push(e);
    });
    return { dept:dept, people:people, n:n, counts:counts, core:core, partial:partial, outliers:outliers };
  }
  function whoHas(dept, ent){
    return rbacPeople(dept).filter(function(u){ return entsOf(u).indexOf(ent)>=0; });
  }
  function rbacRole(name){ return rbacState().roles.filter(function(r){ return r.name===name; })[0] || null; }
  // Two entitlements that a person is not supposed to hold at once. Checked when a
  // role is defined, not afterwards, because afterwards means everyone already has it.
  function sodHit(ents){
    var pairs = (rbacCfg() && rbacCfg().sodPairs) || [], hits = [];
    pairs.forEach(function(p){ if(ents.indexOf(p.a)>=0 && ents.indexOf(p.b)>=0) hits.push(p); });
    return hits;
  }
  function rbacEffective(u){
    // what the person would hold once the model is applied: their assigned roles'
    // entitlements, plus any exception kept for them by name
    var st = rbacState(), out = [];
    (st.assigned[u.upn] || []).forEach(function(rn){
      var r = rbacRole(rn); if(r) r.ents.forEach(function(e){ if(out.indexOf(e)<0) out.push(e); });
    });
    Object.keys(st.exceptions).forEach(function(k){
      var p = k.split('|');
      if(p[0]===u.upn && st.exceptions[k]==='keep' && out.indexOf(p[1])<0) out.push(p[1]);
    });
    return out.sort();
  }

  function covBar(n, d){
    var p = d ? Math.round(n * 100 / d) : 0;
    var tone = n === d ? 'ok' : n > 1 ? 'warn' : 'bad';
    return '<div class="row" style="gap:10px;align-items:center">' +
      '<div class="mtr-t" style="margin:0;flex:1;min-width:70px" role="img" aria-label="' + n + ' of ' + d + ' people">' +
      '<i class="mtr-f ' + tone + '" style="width:' + Math.max(p, 3) + '%"></i></div>' +
      '<span class="mono faint" style="font-size:12.5px;white-space:nowrap">' + n + '/' + d + '</span></div>';
  }
  function pRBAC(){
    var cfg = rbacCfg();
    if(!cfg) return '<h1 class="pg">Role model</h1><div class="card"><div class="card-b faint">No role-modelling work in this shift.</div></div>';
    var st = rbacState();
    if(!st.mined){
      return '<h1 class="pg">Role model</h1>' +
        card('Entitlement mining', '',
          '<div class="card-b"><p>Nothing has been mined yet. The directory currently grants access one person at a time; there is no role model to compare against.</p>' +
          '<p class="faint">Mining reads the access every enabled person actually holds — on-premises groups, cloud groups, application roles and directory roles — and groups it by department so that the access people share can be told apart from the access one person happens to have.</p>' +
          '<div class="row" style="margin-top:14px"><button class="btn" data-rmine="1" type="button">Mine the entitlements</button></div></div>');
    }
    var scope = cfg.scope || [];
    var mined = scope.map(mineDept);
    var direct = 0, total = 0;
    mined.forEach(function(m){ m.people.forEach(function(u){ total += entsOf(u).length; }); });
    mined.forEach(function(m){ m.outliers.forEach(function(){ direct++; }); });

    var summary = '<div class="stats">' +
      statTile('People in scope', String(mined.reduce(function(a,m){ return a + m.n; }, 0)), 'across ' + scope.length + ' departments') +
      statTile('Distinct entitlements', String(Object.keys(mined.reduce(function(a,m){ Object.keys(m.counts).forEach(function(e){ a[e]=1; }); return a; }, {})).length), 'groups, application and directory roles') +
      statTile('Held by one person', String(direct), 'exceptions, not roles') +
      statTile('Roles defined', String(st.roles.length), st.roles.length ? 'from mined evidence' : 'none yet') +
      '</div>';

    var deptCards = mined.map(function(m){
      var rows = Object.keys(m.counts).sort(function(a,b){ return m.counts[b]-m.counts[a] || (a<b?-1:1); }).map(function(e){
        var c = m.counts[e];
        var band = c===m.n ? '<span class="pill en">Everyone</span>' : c>1 ? '<span class="pill warn">' + c + ' of ' + m.n + '</span>' : '<span class="pill dis">One person</span>';
        var holders = whoHas(m.dept, e).map(function(u){ return pname(u.upn); }).join(', ');
        return '<tr><td>' + esc(entLabel(e)) + (entSensitive(e) ? ' <span class="pill dis">sensitive</span>' : '') +
          '<div class="faint" style="font-size:12.5px">' + esc(holders) + '</div></td>' +
          '<td>' + esc(entKind(e)) + '</td>' +
          '<td>' + covBar(c, m.n) + '</td>' +
          '<td>' + band + '</td></tr>';
      }).join('');
      var defined = st.roles.filter(function(r){ return r.dept===m.dept; })[0];
      return card(esc(m.dept) + ' · ' + m.n + ' people',
        defined ? '<span class="pill en">' + esc(defined.name) + ' defined</span>'
                : '<button class="btn sm" data-rdef="' + esc(m.dept) + '" type="button">Define a role</button>',
        '<div class="card-b"><p class="faint">' + m.core.length + ' entitlement' + (m.core.length===1?'':'s') + ' held by everyone in this department, ' +
        m.partial.length + ' held by some, ' + m.outliers.length + ' held by exactly one person.</p></div>' +
        table(['Entitlement','Kind','Coverage',''], rows, 'Nobody in this department holds anything.'));
    }).join('');

    var roleRows = st.roles.map(function(r){
      var holders = Object.keys(st.assigned).filter(function(u){ return (st.assigned[u]||[]).indexOf(r.name)>=0; });
      var hits = sodHit(r.ents);
      return '<tr' + (hits.length ? ' class="denyrow"' : '') + '><td><b>' + esc(r.name) + '</b><div class="faint" style="font-size:12.5px">' + esc(r.dept) + '</div></td>' +
        '<td>' + r.ents.map(function(e){ return esc(entLabel(e)); }).join('<br>') + '</td>' +
        '<td>' + (r.owner ? esc(pname(r.owner)) : '<span style="color:var(--bad);font-weight:600">Nobody</span>') + '</td>' +
        '<td>' + (r.reviewEvery ? esc(r.reviewEvery) : '<span style="color:var(--bad);font-weight:600">Never</span>') + '</td>' +
        '<td>' + holders.length + '</td>' +
        '<td><div class="row" style="gap:6px"><button class="btn sec sm" data-rown="' + esc(r.name) + '" type="button">Owner and review</button>' +
        '<button class="btn sec sm" data-rasg="' + esc(r.name) + '" type="button">Assign</button></div></td></tr>';
    }).join('');

    // migration: assigned but still carrying the direct grants the role replaced
    var pend = [];
    st.roles.forEach(function(r){
      Object.keys(st.assigned).forEach(function(upn){
        if((st.assigned[upn]||[]).indexOf(r.name)<0) return;
        if(st.stripped[upn]) return;
        var u = U(upn); if(!u) return;
        var eff = rbacEffective(u), still = entsOf(u).filter(function(e){ return eff.indexOf(e)>=0; });
        pend.push({ u:u, role:r, still:still });
      });
    });
    var pendRows = pend.map(function(x){
      return '<tr><td><b>' + esc(x.u.name) + '</b><div class="faint" style="font-size:12.5px">' + esc(x.u.title||'') + '</div></td>' +
        '<td>' + esc(x.role.name) + '</td>' +
        '<td>' + (x.still.length ? x.still.map(function(e){ return esc(entLabel(e)); }).join('<br>') : '<span class="faint">none</span>') + '</td>' +
        '<td><button class="btn sec sm" data-rstrip="' + esc(x.u.upn) + '" type="button">Remove the direct grants</button></td></tr>';
    }).join('');

    var outRows = [];
    mined.forEach(function(m){
      m.outliers.forEach(function(e){
        var who = whoHas(m.dept, e)[0]; if(!who) return;
        var k = who.upn + '|' + e, dec = st.exceptions[k];
        outRows.push('<tr><td><b>' + esc(who.name) + '</b><div class="faint" style="font-size:12.5px">' + esc(who.title||'') + ' · ' + esc(m.dept) + '</div></td>' +
          '<td>' + esc(entLabel(e)) + (entSensitive(e) ? ' <span class="pill dis">sensitive</span>' : '') + '</td>' +
          '<td>' + (dec === 'keep' ? '<span class="pill en">Kept as a documented exception</span>' : dec === 'remove' ? '<span class="pill dis">Removed</span>' : '<span class="pill warn">Undecided</span>') + '</td>' +
          '<td>' + (dec ? '<span class="faint">' + esc(st.exceptions[k + '|why'] || '') + '</span>' :
            '<div class="row" style="gap:6px"><button class="btn sec sm" data-rex="' + esc(k) + '|keep" type="button">Keep</button>' +
            '<button class="btn sec sm" data-rex="' + esc(k) + '|remove" type="button">Remove</button></div>') + '</td></tr>');
      });
    });

    return '<h1 class="pg">Role model</h1>' + summary +
      '<div class="banner"><span>Mined from the access people hold, not from their job titles. Where the two disagree, this page follows the access.</span></div>' +
      deptCards +
      card('Roles defined', '', table(['Role','Entitlements','Owner','Review','Assigned',''], roleRows, 'No roles defined yet.')) +
      card('Migration', '<span class="faint">Assign first, then remove what it replaced.</span>',
        table(['Person','Role','Direct grants the role now covers',''], pendRows, 'Nobody is mid-migration.')) +
      card('Exceptions', '<span class="faint">Access held by exactly one person in a department.</span>',
        table(['Person','Entitlement','Decision',''], outRows.join(''), 'No exceptions found.'));
  }

  function rbacMine(){
    act('Mine entitlements', 'Role model', function(){ rbacState().mined = true; },
      'Entitlements mined across the departments in scope',
      { cat:'Governance', detail:'Entitlement mining run across ' + ((rbacCfg().scope||[]).join(', ')), mins:25 });
  }

  function rbacDefine(dept){
    var m = mineDept(dept), st = rbacState();
    var all = m.core.concat(m.partial).concat(m.outliers);
    var body = '<p>Everything held by anybody in ' + esc(dept) + '. What everyone already has is ticked; the rest is a decision.</p>' +
      '<label class="fl">Role name</label><input class="inp" id="rd-n" value="' + esc(dept + ' — standard') + '">' +
      '<div style="margin-top:12px">' + all.map(function(e){
        var c = m.counts[e], everyone = c === m.n;
        return '<label class="radio' + (everyone ? ' on' : '') + '" style="display:flex;gap:10px;align-items:flex-start;margin-bottom:6px">' +
          '<input type="checkbox" data-re="' + esc(e) + '"' + (everyone ? ' checked' : '') + '>' +
          (c === 1 ? '<span class="pill dis" style="margin-right:6px">one person</span>' : '') +
          '<span><b>' + esc(entLabel(e)) + '</b> <span class="faint">· ' + esc(entKind(e)) + '</span>' +
          '<div class="faint" style="font-size:12.5px">' + c + ' of ' + m.n + ' people · ' + esc(whoHas(dept, e).map(function(u){ return pname(u.upn); }).join(', ')) + '</div></span></label>';
      }).join('') + '</div>' +
      '<div id="rd-warn"></div>';
    openModal('Define a role from ' + dept, body, 'Define the role', function(){
      var name = (document.getElementById('rd-n').value || '').trim();
      if(!name){ return false; }
      var sel = [];
      modalEl.querySelectorAll('[data-re]').forEach(function(c){ if(c.checked) sel.push(c.dataset.re); });
      if(!sel.length) return false;
      var hits = sodHit(sel);
      act('Define role', name, function(){
        st.roles.push({ name:name, dept:dept, ents:sel.sort(), owner:'', reviewEvery:'' });
        if(hits.length) hits.forEach(function(h){ st.flagged.push(h.a + '|' + h.b); });
      }, hits.length ? 'Role defined — and it carries a segregation-of-duties conflict' : 'Role defined from mined entitlements',
        { cat:'Governance', detail:name + ' · ' + sel.length + ' entitlements · ' + dept, mins:20 });
    }, function(){
      var sync = function(){
        var sel = [];
        modalEl.querySelectorAll('[data-re]').forEach(function(c){
          c.closest('.radio').classList.toggle('on', c.checked);
          if(c.checked) sel.push(c.dataset.re);
        });
        var hits = sodHit(sel);
        var over = sel.filter(function(e){ return entSensitive(e) && m.counts[e] < m.n; });
        var w = '';
        hits.forEach(function(h){ w += '<div class="banner bad"><span><b>Segregation of duties.</b> ' + esc(h.why) + '</span></div>'; });
        over.forEach(function(e){ w += '<div class="banner warn"><span>' + esc(entLabel(e)) + ' is held by ' + m.counts[e] + ' of ' + m.n + ' people. Putting it in the role gives it to all ' + m.n + '.</span></div>'; });
        document.getElementById('rd-warn').innerHTML = w;
      };
      modalEl.querySelectorAll('[data-re]').forEach(function(c){ c.onchange = sync; });
      sync();
    });
  }

  function rbacAssign(name){
    var r = rbacRole(name); if(!r) return;
    var st = rbacState();
    var cands = rbacPeople(r.dept);
    var body = '<p>Assigning the role does not remove anything. What it replaces is removed separately, once the role is in place and verified.</p>' +
      '<div>' + cands.map(function(u){
        var has = (st.assigned[u.upn]||[]).indexOf(name)>=0;
        var eff = r.ents, mineNow = entsOf(u);
        var gains = eff.filter(function(e){ return mineNow.indexOf(e)<0; });
        return '<label class="radio' + (has ? ' on' : '') + '" style="display:flex;gap:10px;align-items:flex-start;margin-bottom:6px">' +
          '<input type="checkbox" data-ra="' + esc(u.upn) + '"' + (has ? ' checked' : '') + '>' +
          '<span><b>' + esc(u.name) + '</b> <span class="faint">· ' + esc(u.title||'') + '</span>' +
          (gains.length ? '<div style="font-size:12.5px;color:var(--warn)">Gains: ' + esc(gains.map(entLabel).join(', ')) + '</div>'
                        : '<div class="faint" style="font-size:12.5px">Already holds everything in the role</div>') + '</span></label>';
      }).join('') + '</div>';
    openModal('Assign ' + name, body, 'Assign', function(){
      var sel = [];
      modalEl.querySelectorAll('[data-ra]').forEach(function(c){ if(c.checked) sel.push(c.dataset.ra); });
      act('Assign role', name, function(){
        cands.forEach(function(u){
          var cur = st.assigned[u.upn] || [];
          var want = sel.indexOf(u.upn)>=0;
          if(want && cur.indexOf(name)<0) cur.push(name);
          if(!want) cur = cur.filter(function(x){ return x!==name; });
          st.assigned[u.upn] = cur;
        });
      }, sel.length + ' assigned to ' + name,
        { cat:'Governance', detail:name + ' assigned to ' + sel.map(function(x){ return pname(x); }).join(', '), mins:10 });
    }, function(){
      modalEl.querySelectorAll('[data-ra]').forEach(function(c){ c.onchange = function(){ c.closest('.radio').classList.toggle('on', c.checked); }; });
    });
  }

  function rbacStrip(upn){
    var u = U(upn); if(!u) return;
    var st = rbacState();
    var assigned = st.assigned[upn] || [];
    if(!assigned.length){
      openModal('Remove the direct grants', '<div class="banner bad"><span>' + esc(u.name) + ' has not been assigned a role yet. Removing the direct grants now takes the access away and puts nothing back.</span></div>', null, null);
      return;
    }
    var eff = rbacEffective(u), now = entsOf(u);
    var going = now.filter(function(e){ return eff.indexOf(e)>=0; });
    var orphan = now.filter(function(e){ return eff.indexOf(e)<0; });
    var body = '<p>The role now grants these, so the individual grants are redundant:</p><ul class="bul">' +
      (going.length ? going.map(function(e){ return '<li>' + esc(entLabel(e)) + '</li>'; }).join('') : '<li class="faint">nothing</li>') + '</ul>' +
      (orphan.length ? '<div class="banner warn"><span>These are <b>not</b> covered by the role and will be left in place: ' + esc(orphan.map(entLabel).join(', ')) + '. If they should go, decide that as an exception, not as part of the migration.</span></div>' : '');
    openModal('Remove the direct grants for ' + u.name, body, 'Remove them', function(){
      act('Remove direct grants', u.name, function(){
        st.stripped[upn] = true;
        if(u.ad && u.ad.groups) u.ad.groups = u.ad.groups.filter(function(g){ return going.indexOf(typeof g==='string'?g:g&&g.g)<0; });
        u.groups = (u.groups||[]).filter(function(g){ return going.indexOf(typeof g==='string'?g:g&&g.g)<0; });
        u.apps = (u.apps||[]).filter(function(a){ return going.indexOf('APP:' + a.app + ':' + a.role) < 0; });
      }, 'Direct grants removed — ' + u.name + ' now holds it through the role',
        { cat:'Governance', detail:u.name + ' · ' + going.length + ' direct grants removed, now granted by role', mins:8 });
    });
  }

  function rbacOwner(name){
    var r = rbacRole(name); if(!r) return;
    var opts = allUsers().filter(function(u){ return !u.guest && (u.status||'')==='Enabled'; })
      .map(function(u){ return '<option value="' + esc(u.upn) + '"' + (r.owner===u.upn ? ' selected' : '') + '>' + esc(u.name) + ' — ' + esc(u.title||'') + '</option>'; }).join('');
    var cyc = ['','Quarterly','Every six months','Annually'].map(function(c){
      return '<option value="' + esc(c) + '"' + (r.reviewEvery===c ? ' selected' : '') + '>' + esc(c || '— no review —') + '</option>'; }).join('');
    openModal('Owner and review for ' + name,
      '<p>A role with no owner is a group with a better name. Somebody has to be answerable for what it grants, and it has to come back around.</p>' +
      '<label class="fl">Owner</label><select class="inp" id="ro-w"><option value="">— nobody —</option>' + opts + '</select>' +
      '<label class="fl" style="margin-top:10px">Recertified</label><select class="inp" id="ro-c">' + cyc + '</select>',
      'Save', function(){
        var w = document.getElementById('ro-w').value, c = document.getElementById('ro-c').value;
        act('Set role owner and review', name, function(){ r.owner = w; r.reviewEvery = c; },
          'Owner and review cycle set for ' + name,
          { cat:'Governance', detail:name + ' · owner: ' + (w ? pname(w) : 'none') + ' · review: ' + (c || 'none'), mins:6 });
      });
  }

  function rbacException(key){
    var p = key.split('|'), upn = p[0], ent = p[1], dec = p[2];
    var u = U(upn); if(!u) return;
    var st = rbacState();
    var body = dec === 'keep'
      ? '<p>Kept as a documented exception. ' + esc(u.name) + ' keeps ' + esc(entLabel(ent)) + ', it stays outside the role, and it is recorded as a decision rather than as something nobody noticed.</p>' +
        '<label class="fl">Why this one is legitimate</label><textarea class="inp" id="rx-w" rows="3" placeholder="What this person does that the rest of the department does not."></textarea>'
      : '<p>' + esc(u.name) + ' loses ' + esc(entLabel(ent)) + '.</p>' +
        (entSensitive(ent) ? '<div class="banner warn"><span>This is sensitive access. If it turns out to be needed, removing it stops work until somebody grants it back.</span></div>' : '') +
        '<label class="fl">Why it is going</label><textarea class="inp" id="rx-w" rows="3" placeholder="Why this is privilege creep rather than a requirement."></textarea>';
    openModal(dec === 'keep' ? 'Keep as an exception' : 'Remove this access', body, dec === 'keep' ? 'Record the exception' : 'Remove it', function(){
      var why = (document.getElementById('rx-w').value || '').trim();
      if(!why) return false;
      act(dec === 'keep' ? 'Record access exception' : 'Remove access', u.name, function(){
        st.exceptions[upn + '|' + ent] = dec;
        st.exceptions[upn + '|' + ent + '|why'] = why;
        if(dec === 'remove'){
          if(u.ad && u.ad.groups) u.ad.groups = u.ad.groups.filter(function(g){ return (typeof g==='string'?g:g&&g.g)!==ent; });
          u.groups = (u.groups||[]).filter(function(g){ return (typeof g==='string'?g:g&&g.g)!==ent; });
          u.apps = (u.apps||[]).filter(function(a){ return ('APP:' + a.app + ':' + a.role) !== ent; });
        }
      }, dec === 'keep' ? 'Exception recorded for ' + u.name : entLabel(ent) + ' removed from ' + u.name,
        { cat:'Governance', detail:u.name + ' · ' + entLabel(ent) + ' · ' + (dec==='keep' ? 'kept as exception' : 'removed') + ' · ' + why, mins:6 });
    });
  }

  function pVault(){
    var v = vault();
    if(!v) return '<h1 class="pg">Credential vault</h1><div class="card"><div class="card-b faint">No vault in this shift.</div></div>';
    var unmanaged = (v.unmanaged || []).map(function(o){
      return '<tr><td class="mono">' + esc(o.name) + '<div class="faint" style="font-family:var(--sans);font-size:12.5px">' + esc(o.note||'') + '</div></td>' +
        '<td>' + esc(o.kind||'') + '</td><td class="mono faint">' + esc(o.lastChanged||'unknown') + '</td>' +
        '<td>' + esc(o.knownBy||'') + '</td>' +
        '<td><button class="btn sm" data-vonboard="' + esc(o.id) + '" type="button">Bring into the vault</button></td></tr>';
    }).join('');
    var safes = v.safes.map(function(s){
      var p = s.policy || {};
      var rows = (s.accounts||[]).map(function(a){
        var out = !!a.checkedOutBy, over = vOverdue(a);
        return '<tr' + (over ? ' class="denyrow"' : '') + '><td class="mono">' + esc(a.name) + '<div class="faint" style="font-family:var(--sans);font-size:12.5px">' + esc(a.kind||'') + '</div></td>' +
          '<td class="mono faint">' + esc(a.lastRotated || 'never') + '</td>' +
          '<td>' + (out ? '<b>' + esc(pname(a.checkedOutBy)) + '</b><div class="faint" style="font-size:12.5px">' + esc(a.reason||'') + (a.ticket ? ' \u00b7 ' + esc(a.ticket) : '') + '</div>' : '<span class="faint">In the safe</span>') + '</td>' +
          '<td>' + (over ? '<span class="pill dis">Overdue since ' + esc(hhmm(a.dueAt)) + '</span>' : out ? '<span class="pill warn">Due back ' + esc(hhmm(a.dueAt)) + '</span>' : '<span class="pill en">Available</span>') + '</td>' +
          '<td><div class="row" style="gap:6px">' +
            (out ? '<button class="btn sm" data-vin="' + esc(a.id) + '" type="button">Check in</button>'
                 : '<button class="btn sec sm" data-vout="' + esc(a.id) + '" type="button">Check out</button>') +
            '<button class="btn sec sm" data-vrot="' + esc(a.id) + '" type="button">Rotate now</button>' +
            (a.kind==='Break-glass' || s.circular ? '<button class="btn sec sm" data-voff="' + esc(a.id) + '" type="button">Move out of the vault</button>' : '') +
          '</div></td></tr>';
      }).join('');
      var warn = [];
      if(!p.rotateOnReturn) warn.push('This safe does not rotate on return, so every credential borrowed from it is still valid afterwards and is known by whoever borrowed it.');
      if(!p.recordSession) warn.push('Sessions are not recorded, so a check-out here produces a name and a time and no account of what was done.');
      if(p.checkout !== 'approval') warn.push('Anybody who can see this safe can take a credential from it with nobody approving.');
      if(s.circular) warn.push('The credentials in this safe are reachable only through the same sign-in they exist to recover. If that sign-in is what fails, this safe cannot be opened.');
      return card(esc(s.name), '<button class="btn sm" data-vpol="' + esc(s.id) + '" type="button">Policy</button>',
        '<div class="card-b"><dl class="kv sm">' +
        '<dt>Check-out</dt><dd>' + (p.checkout==='approval' ? 'Requires approval from ' + esc(pname(p.approver||'')) : '<span style="color:var(--warn);font-weight:600">Self-service</span>') + '</dd>' +
        '<dt>Maximum duration</dt><dd>' + (p.maxMins ? esc(String(p.maxMins)) + ' minutes' : '<span style="color:var(--warn);font-weight:600">No limit</span>') + '</dd>' +
        '<dt>On return</dt><dd>' + (p.rotateOnReturn ? 'The credential is rotated' : '<span style="color:var(--bad);font-weight:600">The credential is left as it is</span>') + '</dd>' +
        '<dt>Session recording</dt><dd>' + (p.recordSession ? 'On' : '<span style="color:var(--warn);font-weight:600">Off</span>') + '</dd>' +
        '</dl>' + warn.map(function(w){ return '<div class="banner warn"><span>' + esc(w) + '</span></div>'; }).join('') + '</div>' +
        table(['Account','Last rotated','Held by','State',''], rows, 'No accounts in this safe.'));
    }).join('');
    var log = (v.log||[]).map(function(l){
      return '<tr><td class="mono nowrap">' + esc(l.t) + '</td><td>' + esc(l.who) + '</td><td class="mono">' + esc(l.account) + '</td>' +
        '<td>' + esc(l.action) + '</td><td class="faint">' + esc(l.detail||'') + '</td>' +
        '<td>' + (l.recording ? '<button class="btn sec sm" data-vrec="' + esc(l.recording) + '" type="button">Recording</button>' : '<span class="faint">\u2014</span>') + '</td></tr>';
    }).join('');
    return '<h1 class="pg">Credential vault</h1><p class="sub">' + esc(v.name) + ' \u00b7 privileged credentials nobody memorises. A check-out is a named person, a reason, and an end.</p>' +
      (unmanaged ? card('Privileged accounts not in the vault', '<span class="pill warn">' + (v.unmanaged||[]).length + '</span>',
        table(['Account','Type','Password last changed','Known by',''], unmanaged, '')) : '') +
      safes +
      card('Check-out log', '', table(['Time','Who','Account','Action','Detail',''], log, 'Nothing has been taken out this shift.'));
  }
  function vaultCheckout(id){
    var a = vAcc(id), s = a._safe, p = s.policy || {};
    openModal('Check out \u2014 ' + a.name,
      '<p class="hint">Whoever holds this credential can do anything it can do, and the only record of why will be what you type here.</p>' +
      (p.checkout==='approval' ? '<div class="banner warn"><span>This safe requires approval from <b>' + esc(pname(p.approver||'')) + '</b>. The credential is released when they answer.</span></div>' : '') +
      (p.rotateOnReturn ? '' : '<div class="banner bad"><span>This safe does not rotate on return. Whatever you do here, you will still know this password afterwards, and so will everyone who has ever checked it out.</span></div>') +
      '<label class="fld" for="vo-t">Ticket</label><input class="in mono" id="vo-t" placeholder="e.g. VLT-1402">' +
      '<label class="fld" for="vo-w">Reason</label><input class="in" id="vo-w" placeholder="What you are going to do with it">' +
      '<label class="fld" for="vo-d">Check out for</label><select class="in" id="vo-d">' +
        [30,60,120,240,480].filter(function(m){ return !p.maxMins || m <= p.maxMins; }).map(function(m){ return '<option value="' + m + '">' + m + ' minutes</option>'; }).join('') +
        (p.maxMins ? '' : '<option value="0">No end time</option>') + '</select>',
      'Check out', function(){
        var t = document.getElementById('vo-t').value.trim(), w = document.getElementById('vo-w').value.trim(), d = +document.getElementById('vo-d').value;
        if(w.length < 4) return false;
        if(!/^[A-Za-z]{2,4}-\d{3,5}$/.test(t)) return false;
        act('Check out privileged credential', a.name, function(){
          a.checkedOutBy = ME; a.reason = w; a.ticket = t; a.outAt = S.clock; a.dueAt = d ? S.clock + d : null; a.noEnd = !d;
          a.recorded = !!p.recordSession;
          vLog({t:stamp(), who:'ia.analyst', account:a.name, action:'Checked out', detail:w + ' \u00b7 ' + t + ' \u00b7 ' + (d ? d + ' minutes' : 'no end time'), recording:p.recordSession ? ('REC-' + a.id + '-' + S.clock) : ''});
        }, 'Credential released', {cat:'Security', detail:a.name + ' checked out. ' + w + ' (' + t + '). ' + (d ? 'Due back in ' + d + ' minutes.' : 'No end time set.') + (p.recordSession ? ' Session is being recorded.' : ' Session is not recorded.')});
      });
  }
  function vaultCheckin(id, forced){
    var a = vAcc(id), s = a._safe, p = s.policy || {};
    openModal((forced ? 'Force check-in \u2014 ' : 'Check in \u2014 ') + a.name,
      (forced ? '<p>' + esc(pname(a.checkedOutBy)) + ' has held this since <b>' + esc(hhmm(a.outAt)) + '</b>' + (a.dueAt!=null ? ' and it was due back at <b>' + esc(hhmm(a.dueAt)) + '</b>' : ' with no end time') + '.</p>' : '<p>Returning <span class="mono">' + esc(a.name) + '</span> to the safe.</p>') +
      (p.rotateOnReturn ? '<p class="hint">The credential is rotated on return, so the copy anybody memorised stops working the moment you do this.</p>'
                        : '<div class="banner bad"><span>This safe is set to leave the credential as it is. Checking it in makes it available again and changes nothing about who knows it.</span></div>') +
      '<label class="fld" for="vi-w">Note</label><input class="in" id="vi-w" placeholder="Recorded against the check-out">',
      forced ? 'Force check-in' : 'Check in', function(){
        var w = document.getElementById('vi-w').value.trim();
        act(forced ? 'Force check-in of privileged credential' : 'Check in privileged credential', a.name, function(){
          var who = a.checkedOutBy;
          if(a.ticket) a.lastTicket = a.ticket;
          if(forced) a.forcedIn = true;
          a.checkedOutBy = ''; a.reason = ''; a.ticket = ''; a.dueAt = null; a.noEnd = false; a.wasForced = !!forced;
          if(p.rotateOnReturn){ a.lastRotated = stamp(); a.rotatedOnReturn = true; }
          vLog({t:stamp(), who:'ia.analyst', account:a.name, action:forced ? 'Forced check-in' : 'Checked in',
                detail:(forced ? 'Held by ' + pname(who) + '. ' : '') + (p.rotateOnReturn ? 'Rotated on return. ' : 'NOT rotated. ') + w});
        }, p.rotateOnReturn ? 'Returned and rotated' : 'Returned \u2014 not rotated',
        {cat:'Security', detail:a.name + ' ' + (forced ? 'forced back into the safe' : 'returned') + '. ' + (p.rotateOnReturn ? 'Rotated on return.' : 'Not rotated; the previous password is still valid.') + ' ' + w});
      }, null, forced);
  }
  function vaultRotate(id){
    var a = vAcc(id);
    openModal('Rotate now \u2014 ' + a.name,
      '<p>Sets a new password immediately and stores it in the vault. Anything still using the old one \u2014 a scheduled task, a saved session, a person \u2014 stops working.</p>' +
      (a.checkedOutBy ? '<div class="banner warn"><span>This credential is checked out to ' + esc(pname(a.checkedOutBy)) + ' right now. Rotating will break whatever they are in the middle of.</span></div>' : ''),
      'Rotate', function(){
        act('Rotate privileged credential', a.name, function(){
          a.lastRotated = stamp(); a.rotated = true;
          vLog({t:stamp(), who:'ia.analyst', account:a.name, action:'Rotated', detail:'Password changed and stored in the vault.'});
        }, a.name + ' rotated', {cat:'Security', detail:a.name + ' rotated out of band.'});
      });
  }
  function vaultPolicy(id){
    var s = safeBy(id), p = s.policy = s.policy || {};
    var cands = allUsers().filter(function(u){ return u.status==='Enabled' && !u.service && !u.shared; });
    openModal('Safe policy \u2014 ' + s.name,
      '<p class="hint">Three of these four decide whether this is a control or a password list. The rotation one is the control.</p>' +
      '<label class="fld" for="vp-c">Check-out</label><select class="in" id="vp-c"><option value="self"' + (p.checkout!=='approval'?' selected':'') + '>Self-service</option><option value="approval"' + (p.checkout==='approval'?' selected':'') + '>Requires approval</option></select>' +
      '<label class="fld" for="vp-a">Approver</label><select class="in" id="vp-a">' + cands.map(function(u){ return '<option value="' + esc(u.upn) + '"' + (p.approver===u.upn?' selected':'') + '>' + esc(u.name) + '</option>'; }).join('') + '</select>' +
      '<label class="fld" for="vp-m">Maximum duration</label><select class="in" id="vp-m"><option value="0"' + (!p.maxMins?' selected':'') + '>No limit</option>' +
        [30,60,120,240].map(function(m){ return '<option value="' + m + '"' + (p.maxMins===m?' selected':'') + '>' + m + ' minutes</option>'; }).join('') + '</select>' +
      '<label class="check"><input type="checkbox" id="vp-r"' + (p.rotateOnReturn?' checked':'') + '> Rotate the credential when it is checked back in</label>' +
      '<label class="check"><input type="checkbox" id="vp-s"' + (p.recordSession?' checked':'') + '> Record the session</label>',
      'Save', function(){
        var c = document.getElementById('vp-c').value, ap = document.getElementById('vp-a').value,
            mm = +document.getElementById('vp-m').value, ro = document.getElementById('vp-r').checked, rs = document.getElementById('vp-s').checked;
        act('Update safe policy', s.name, function(){ p.checkout = c; p.approver = ap; p.maxMins = mm; p.rotateOnReturn = ro; p.recordSession = rs; },
          s.name + ' policy updated', {cat:'Security', detail:s.name + ' \u00b7 ' + (c==='approval' ? 'approval by ' + pname(ap) : 'self-service') + ', max ' + (mm||'unlimited') + ' minutes, rotate on return ' + (ro?'on':'off') + ', recording ' + (rs?'on':'off') + '.'});
      });
  }
  function vaultOnboard(id){
    var v = vault(), o = (v.unmanaged||[]).filter(function(x){ return x.id===id; })[0]; if(!o) return;
    openModal('Bring into the vault \u2014 ' + o.name,
      '<p>The password becomes vault-managed. Nobody needs to know it again, and everybody who does know it keeps knowing it until it is rotated.</p>' +
      (o.knownBy ? '<div class="banner warn"><span>Currently known by <b>' + esc(o.knownBy) + '</b>.</span></div>' : '') +
      '<label class="fld" for="vb-s">Safe</label><select class="in" id="vb-s">' + v.safes.map(function(s){ return '<option value="' + esc(s.id) + '">' + esc(s.name) + '</option>'; }).join('') + '</select>' +
      '<label class="check"><input type="checkbox" id="vb-r" checked> Rotate it now, so the copies in circulation stop working</label>',
      'Onboard', function(){
        var sid = document.getElementById('vb-s').value, rot = document.getElementById('vb-r').checked, s = safeBy(sid);
        act('Onboard account to the vault', o.name, function(){
          v.unmanaged = v.unmanaged.filter(function(x){ return x.id!==id; });
          s.accounts = s.accounts || [];
          s.accounts.push({id:o.id, name:o.name, kind:o.kind||'', lastRotated:rot ? stamp() : (o.lastChanged||'never'),
            checkedOutBy:'', onboarded:true, rotatedOnOnboard:rot});
          vLog({t:stamp(), who:'ia.analyst', account:o.name, action:'Onboarded', detail:'Into ' + s.name + '. ' + (rot ? 'Rotated on onboarding.' : 'NOT rotated; the password in circulation still works.')});
        }, o.name + ' is vault-managed', {cat:'Security', detail:o.name + ' onboarded into ' + s.name + '. ' + (rot ? 'Rotated immediately.' : 'Not rotated \u2014 the password known by ' + (o.knownBy||'whoever had it') + ' is still valid.')});
      });
  }
  // Some credentials must not depend on the system that holds them. Moving one
  // out of the vault is a downgrade in convenience and an upgrade in the only
  // property that matters for a recovery path: no shared dependency.
  function vaultOffboard(id){
    var a = vAcc(id), s = a._safe;
    openModal('Move out of the vault \u2014 ' + a.name,
      '<p>The credential leaves the vault and is sealed offline: printed, sealed, and held in the physical safe with the seal as the tamper evidence.</p>' +
      '<p class="hint">This is worse in every way except one. It has no dependency on sign-in, on the network, or on the vault itself \u2014 which is the entire reason an emergency credential exists.</p>' +
      '<label class="check"><input type="checkbox" id="vf-r" checked> Rotate it on the way out, since the vault has held it</label>' +
      '<label class="fld" for="vf-w">Where it is going</label><input class="in" id="vf-w" value="Sealed envelope, IT safe, reception floor">',
      'Move out and seal', function(){
        var rot = document.getElementById('vf-r').checked, w = document.getElementById('vf-w').value.trim();
        if(w.length < 4) return false;
        act('Move credential out of the vault', a.name, function(){
          s.accounts = (s.accounts||[]).filter(function(x){ return x.id!==id; });
          var v = vault(); v.sealed = (v.sealed||[]).concat([{id:a.id, name:a.name, where:w, rotated:rot, at:stamp()}]);
          if(rot) a.rotated = true;
          v.rotatedOut = v.rotatedOut || {}; if(rot) v.rotatedOut[a.id] = true;
          vLog({t:stamp(), who:'ia.analyst', account:a.name, action:'Moved out of the vault',
                detail:w + '. ' + (rot ? 'Rotated on the way out.' : 'NOT rotated \u2014 the password the vault held is still valid.')});
        }, a.name + ' sealed offline', {cat:'Security', detail:a.name + ' removed from ' + s.name + ' and sealed at: ' + w + '. ' + (rot ? 'Rotated on removal.' : 'Not rotated.')});
      });
  }
  function vaultRecording(rid){
    openModal('Session recording ' + rid,
      '<p class="hint">A recording is the difference between knowing who took a credential and knowing what they did with it.</p>' +
      '<div class="term"><div>Connected as MERIDIAN\\adm.northbeam to MF-DC01</div><div class="faint">14 minutes 22 seconds \u00b7 keystrokes and screen</div><div>&gt; Get-Service -Name \'MF-Dock*\'</div><div>&gt; Restart-Service -Name MF-DockRelay</div><div>&gt; Get-EventLog -LogName Application -Newest 20</div><div class="faint">\u2026 session ended by check-in</div></div>',
      null);
  }

  // ---- governance reporting ---------------------------------------------
  // Every other page in this console is an operational list. This one is the
  // only page that answers "how are we doing", and it is computed live from the
  // same state the rest of the console edits — so a number here moves the
  // moment you fix the thing behind it. Forms are chosen by the data's job:
  // single values are stat tiles, a ratio against a target is a meter, and
  // counts are one-hue bars. There is no categorical palette on this page.
  function pct(n, d){ return d ? Math.round((n / d) * 100) : 0; }
  function isStale(u){ return onPrem(u) && !/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)/.test(u.ad.lastLogon || ''); }
  function peopleAccounts(){ return allUsers().filter(function(u){ return u.status!=='Not created' && !u.service && !u.shared && u.dept!=='External'; }); }
  function methodKey(s){
    if(/sms|text message/i.test(s)) return 'sms';
    if(/voice|phone call/i.test(s)) return 'voice';
    if(/push/i.test(s)) return 'app';
    if(/code|totp|one-time/i.test(s)) return 'totp';
    if(/fido|security key|hardware key|passkey/i.test(s)) return 'fido';
    if(/certificate/i.test(s)) return 'cba';
    if(/hello/i.test(s)) return 'hello';
    if(/temporary access|\btap\b/i.test(s)) return 'tap';
    return 'other';
  }
  var PHISH_OK = {fido:1, cba:1, hello:1};
  var WEAK_M = {sms:1, voice:1};
  function phishResistant(u){ return (u.mfa||[]).some(function(m){ return !!PHISH_OK[methodKey(m)]; }); }
  var METHOD_LABEL = {sms:'SMS text message', voice:'Voice call', app:'Authenticator app \u2014 push',
    totp:'Authenticator app \u2014 code', fido:'Security key or passkey', cba:'Certificate-based',
    hello:'Windows Hello', tap:'Temporary Access Pass', other:'Other'};
  // Counted off the directory, not off a number written in the scenario file.
  function methodCounts(users){
    var seen = {}, order = [];
    users.forEach(function(u){
      var mine = {};
      (u.mfa||[]).forEach(function(m){
        var k = methodKey(m);
        if(mine[k]) return; mine[k] = 1;
        if(seen[k]==null){ seen[k] = 0; order.push(k); }
        seen[k]++;
      });
    });
    var a = am();
    if(a) a.methods.forEach(function(m){ if(seen[m.id]==null){ seen[m.id] = 0; order.push(m.id); } });
    return order.map(function(k){
      var m = a ? a.methods.filter(function(x){ return x.id===k; })[0] : null;
      return {label:(m ? m.name : METHOD_LABEL[k] || k), n:seen[k],
              flag: (m ? m.weak : WEAK_M[k]) ? 'Interceptable' : (m ? m.phishResistant : PHISH_OK[k]) ? 'Phishing-resistant' : '',
              tone: (m ? m.weak : WEAK_M[k]) ? 'warn' : 'ok'};
    }).sort(function(p1,p2){ return p2.n - p1.n; });
  }
  function statTile(label, value, note, tone){
    return '<div class="stat' + (tone ? ' ' + tone : '') + '"><dt>' + esc(label) + '</dt><dd>' + esc(String(value)) + '</dd>' +
      (note ? '<p>' + esc(note) + '</p>' : '') + '</div>';
  }
  // A ratio against a target. The fill carries severity; the unfilled track is a
  // lighter step of the same ramp so the state reads across the whole bar.
  function meter(label, n, d, target, hint){
    var p = pct(n, d), tone = p >= target ? 'ok' : p >= target * 0.6 ? 'warn' : 'bad';
    var word = tone==='ok' ? 'At target' : tone==='warn' ? 'Below target' : 'Well below target';
    return '<div class="mtr"><div class="mtr-h"><span class="mtr-l">' + esc(label) + '</span>' +
      '<span class="mtr-v"><b>' + p + '%</b> <span class="faint">' + n + ' of ' + d + '</span></span></div>' +
      '<div class="mtr-t" role="img" aria-label="' + esc(label + ': ' + p + ' per cent of ' + d + ', target ' + target + ' per cent, ' + word) + '">' +
      '<i class="mtr-f ' + tone + '" style="width:' + Math.max(p, 1.5) + '%"></i>' +
      '<u class="mtr-g" style="left:' + target + '%" title="Target ' + target + '%"></u></div>' +
      '<p class="mtr-n"><span class="sdot ' + tone + '" aria-hidden="true"></span>' + esc(word) + ' \u00b7 target ' + target + '%. ' + esc(hint || '') + '</p></div>';
  }
  // Magnitude, low to high: one hue, 4px rounded data-end, a 2px surface gap
  // between neighbours, values at the tip. No legend — there is one series.
  function barRows(rows, unit){
    var max = Math.max.apply(null, rows.map(function(r){ return r.n; }).concat([1]));
    return '<div class="bars">' + rows.map(function(r){
      return '<div class="bar-r"><span class="bar-l">' + esc(r.label) +
        (r.flag ? ' <span class="sdot ' + (r.tone||'warn') + '" aria-hidden="true"></span><span class="bar-flag">' + esc(r.flag) + '</span>' : '') + '</span>' +
        '<span class="bar-w"><i style="width:' + Math.max((r.n / max) * 100, r.n ? 2 : 0) + '%"></i></span>' +
        '<span class="bar-v">' + r.n + (unit ? ' ' + esc(unit) : '') + '</span></div>';
    }).join('') + '</div>';
  }
  function pReport(){
    var people = peopleAccounts();
    var enabled = people.filter(function(u){ return u.status==='Enabled'; });
    var withMfa = enabled.filter(function(u){ return (u.mfa||[]).length; });
    var withPhish = enabled.filter(phishResistant);
    var noMgr = enabled.filter(function(u){ return !u.mgr; });
    var stale = allUsers().filter(function(u){ return u.status==='Enabled' && isStale(u); });
    var disabledLicensed = allUsers().filter(function(u){ return u.status==='Disabled' && hasLic(u); });
    var standing = allUsers().filter(function(u){ return (u.roles||[]).some(function(r){ return r.type==='active'; }); });
    var eligible = allUsers().filter(function(u){ return (u.roles||[]).some(function(r){ return r.type==='eligible'; }); });
    var svc = allUsers().filter(function(u){ return u.service || u.shared; });

    // the headline: one hero figure per view
    var cov = pct(withMfa.length, enabled.length);

    var tiles = [
      statTile('Enabled accounts', enabled.length, 'People, excluding service and shared accounts'),
      statTile('No manager on record', noMgr.length, noMgr.length ? 'Nobody to ask at the next access review' : 'Every account has an owner', noMgr.length ? 'warn' : 'ok'),
      statTile('No sign-in in 90 days', stale.length, stale.length ? 'Enabled, unused, still granting what it grants' : 'Nothing dormant', stale.length ? 'warn' : 'ok'),
      statTile('Disabled but still licensed', disabledLicensed.length, disabledLicensed.length ? 'Paid seats on accounts nobody uses' : 'No wasted seats', disabledLicensed.length ? 'bad' : 'ok'),
      statTile('Standing admin roles', standing.length, standing.length ? 'Held permanently, including at 2am' : 'All privileged access is activated on demand', standing.length > 2 ? 'bad' : standing.length ? 'warn' : 'ok'),
      statTile('Eligible, not standing', eligible.length, 'Activated when needed, with a reason recorded'),
      statTile('Service and shared accounts', svc.length, 'No person behind them; they need named owners')
    ];
    var x = ext(), k = pkgs(), a = am();
    if(x){
      var live = (x.guests||[]).filter(function(g){ return !g.removed; });
      tiles.push(statTile('Guests with no sponsor', live.filter(function(g){ return !g.sponsor; }).length, 'Nobody inside the company is asked whether they still need to be here', live.some(function(g){ return !g.sponsor; }) ? 'bad' : 'ok'));
      tiles.push(statTile('Guest access that never expires', live.filter(function(g){ return !g.expires; }).length, 'No HR feed will ever tell you they left', live.some(function(g){ return !g.expires; }) ? 'warn' : 'ok'));
    }
    if(k) tiles.push(statTile('Access packages with no end date', (k.items||[]).filter(function(q){ return !q.expiry; }).length, 'An approval once, then access for ever', (k.items||[]).some(function(q){ return !q.expiry; }) ? 'warn' : 'ok'));

    // methods: magnitude, one hue, with a status flag on the interceptable ones
    var methodBars = methodCounts(enabled);

    // privileged groups, largest first
    var privBars = D.groups.filter(function(g){ return g.tier && g.tier!=='standard'; })
      .map(function(g){ return {label:g.name, n:members(g.name).length, flag:g.tier, tone:g.tier==='privileged' ? 'bad' : 'warn'}; })
      .sort(function(p1,p2){ return p2.n - p1.n; });

    var staleRows = stale.concat(disabledLicensed.filter(function(u){ return stale.indexOf(u)<0; })).slice(0, 10).map(function(u){
      return '<tr class="click" data-user="' + esc(u.upn) + '"><td><b>' + esc(u.name) + '</b><div class="mono faint" style="font-size:12.5px">' + esc(mail(u.upn)) + '</div></td>' +
        '<td>' + esc(u.title || '') + '</td><td>' + (u.status==='Enabled' ? '<span class="pill en">Enabled</span>' : '<span class="pill dis">Disabled</span>') + '</td>' +
        '<td class="mono faint">' + esc(onPrem(u) ? (u.ad.lastLogon || '—') : '—') + '</td>' +
        '<td>' + (hasLic(u) ? esc(u.lic) : '<span class="faint">none</span>') + '</td></tr>';
    }).join('');

    return '<h1 class="pg">Reporting</h1><p class="sub">Computed from the directory as it stands right now. Fix something and the number moves \u2014 these are the same objects every other page edits.</p>' +
      '<div class="hero"><div class="hero-n">' + cov + '<span>%</span></div>' +
      '<div class="hero-t"><b>of enabled accounts have any second factor</b>' +
      '<span>' + withMfa.length + ' of ' + enabled.length + '. ' + withPhish.length + ' of them hold something a copied sign-in page cannot use at all.</span></div></div>' +
      card('Coverage', '', '<div class="card-b">' +
        meter('Any second factor', withMfa.length, enabled.length, 100, 'Everyone, no exceptions that are not break-glass.') +
        meter('Phishing-resistant method', withPhish.length, enabled.length, 60, 'A key or a certificate, not a code that can be relayed.') +
        meter('Privileged access activated, not standing', eligible.length, Math.max(eligible.length + standing.length, 1), 100, 'Standing roles are held at 2am whether you are working or not.') +
        '</div>') +
      '<dl class="stats">' + tiles.join('') + '</dl>' +
      (methodBars.length ? card('Registered authentication methods', '<span class="faint" style="font-size:12.5px">Counted across ' + enabled.length + ' enabled accounts \u00b7 people may hold more than one</span>', '<div class="card-b">' + barRows(methodBars, '') + '</div>') : '') +
      (privBars.length ? card('Members of privileged and sensitive groups', '', '<div class="card-b">' + barRows(privBars, '') + '</div>') : '') +
      (staleRows ? card('Accounts worth looking at', '<span class="faint" style="font-size:12.5px">Dormant, or disabled and still paying for a seat</span>',
        table(['Account','Role','State','Last sign-in','Licence'], staleRows, '')) : '') +
      '<p class="hint">None of these numbers are a score. They are the questions an auditor asks in the order they ask them, and every one of them has a named person behind it.</p>';
  }

  // ---- authentication methods ------------------------------------------
  // Two separate questions get muddled here. Which methods may be used to prove
  // who you are, and which may be used to get back in when you cannot. A method
  // that can be intercepted or talked out of somebody is weak for the first and
  // catastrophic for the second, because it hands over the recovery path.
  function am(){ if(!S.am && D.authMethods) S.am = JSON.parse(JSON.stringify(D.authMethods)); return S.am; }
  function amBy(id){ var a = am(); if(!a) return null; for(var i=0;i<a.methods.length;i++){ if(a.methods[i].id===id) return a.methods[i]; } return null; }
  function amScopeLabel(m){
    if(m.state!=='Enabled') return 'Disabled';
    if(m.scope==='all') return 'All users';
    if(m.scope==='none') return 'Nobody';
    return m.scope;
  }
  function pAuthM(){
    var a = am();
    if(!a) return '<h1 class="pg">Authentication methods</h1><div class="card"><div class="card-b faint">Not configured in this shift.</div></div>';
    var rows = a.methods.map(function(m){
      return '<tr><td><b>' + esc(m.name) + '</b><div class="faint" style="font-size:12.5px">' + esc(m.note||'') + '</div></td>' +
        '<td>' + (m.phishResistant ? '<span class="pill en">Phishing-resistant</span>' : m.weak ? '<span class="pill warn">Interceptable</span>' : '<span class="faint">Standard</span>') + '</td>' +
        '<td>' + (m.state==='Enabled' ? '<span class="pill en">Enabled</span>' : '<span class="pill dis">Disabled</span>') + '</td>' +
        '<td>' + esc(amScopeLabel(m)) + '</td>' +
        '<td class="mono faint">' + (m.registered==null ? '—' : m.registered) + '</td>' +
        '<td><button class="btn sec sm" data-amedit="' + m.id + '" type="button">Change</button></td></tr>';
    }).join('');
    var s = a.sspr || {};
    var weakInSspr = (s.allowed||[]).filter(function(id){ var m = amBy(id); return m && m.weak; });
    var reg = (a.registrations||[]).map(function(r, i){
      return '<tr><td>' + esc(r.who) + '</td><td>' + esc(r.method) + '</td><td class="mono nowrap">' + esc(r.when) + '</td>' +
        '<td>' + esc(r.loc||'') + '<div class="mono faint">' + esc(r.ip||'') + '</div></td>' +
        '<td>' + (r.flag ? '<span class="res bad">' + esc(r.flag) + '</span>' : '<span class="faint">—</span>') + '</td>' +
        '<td>' + (r.handled ? '<span class="pill en">' + esc(r.handled) + '</span>' : (r.flag ? '<button class="btn danger sm" data-amreg="' + i + '" type="button">Investigate</button>' : '')) + '</td></tr>';
    }).join('');
    return '<h1 class="pg">Authentication methods</h1><p class="sub">What people may use to prove who they are, and what they may use to get back in when they cannot.</p>' +
      card('Methods', '', table(['Method','Strength','State','Available to','Registered',''], rows, '')) +
      card('Self-service password reset', '<button class="btn sm" data-sspr="1" type="button">Configure</button>',
        '<div class="card-b"><dl class="kv sm">' +
        '<dt>Enabled for</dt><dd>' + (s.scope==='all' ? 'All users' : s.scope==='group' ? esc(s.group||'a group') : '<span style="color:var(--warn);font-weight:600">Nobody — every reset goes through the service desk</span>') + '</dd>' +
        '<dt>Methods required to reset</dt><dd>' + (s.required===2 ? 'Two' : '<span style="color:var(--warn);font-weight:600">One</span>') + '</dd>' +
        '<dt>Permitted for reset</dt><dd class="mono">' + esc((s.allowed||[]).map(function(id){ var m = amBy(id); return m ? m.name : id; }).join(', ') || 'none') + '</dd>' +
        '</dl>' + (weakInSspr.length ? '<div class="banner warn"><span>' + esc(weakInSspr.map(function(id){ return amBy(id).name; }).join(' and ')) + ' can reset a password on its own. Anyone who can take over a phone number can take over the account.</span></div>' : '') + '</div>') +
      card('Registration campaign', '<button class="btn sm" data-amcamp="1" type="button">Configure</button>',
        '<div class="card-b"><dl class="kv sm"><dt>State</dt><dd>' + ((s.campaign||{}).on ? '<span class="pill en">On</span> — users are prompted at sign-in' : '<span class="pill dis">Off</span>') + '</dd>' +
        '<dt>Prompting for</dt><dd>' + esc(((s.campaign||{}).method && amBy(s.campaign.method) ? amBy(s.campaign.method).name : 'nothing')) + '</dd>' +
        '<dt>Snooze limit</dt><dd>' + ((s.campaign||{}).snooze!=null ? esc(String(s.campaign.snooze)) + ' times' : '—') + '</dd></dl>' +
        '<p class="hint">Turning a strong method on does not register anybody on it. Without a campaign, the people who adopt it are the ones who already would have.</p></div>') +
      ((a.registrations||[]).length ? card('Recent method registrations', '', table(['User','Method','When','Where','','' ], reg, '')) : '');
  }
  function amEdit(id){
    var m = amBy(id), groups = D.groups.map(function(g){ return g.name; });
    openModal(m.name,
      '<p class="hint">' + esc(m.note||'') + '</p>' +
      (m.weak ? '<div class="banner warn"><span>This method can be intercepted without touching the user\u2019s device \u2014 a number can be ported, a message can be read on a locked screen, and a person can be talked into reading a code out loud.</span></div>' : '') +
      (m.phishResistant ? '<div class="banner ok"><span>This method is bound to the site it was registered for. A convincing copy of the sign-in page cannot use it, because the copy is not the same origin.</span></div>' : '') +
      '<label class="fld" for="am-s">State</label><select class="in" id="am-s"><option value="Enabled"' + (m.state==='Enabled'?' selected':'') + '>Enabled</option><option value="Disabled"' + (m.state!=='Enabled'?' selected':'') + '>Disabled</option></select>' +
      '<label class="fld" for="am-c">Available to</label><select class="in" id="am-c"><option value="all"' + (m.scope==='all'?' selected':'') + '>All users</option>' +
        groups.map(function(g){ return '<option value="' + esc(g) + '"' + (m.scope===g?' selected':'') + '>' + esc(g) + '</option>'; }).join('') +
        '<option value="none"' + (m.scope==='none'?' selected':'') + '>Nobody</option></select>',
      'Save', function(){
        var st = document.getElementById('am-s').value, sc = document.getElementById('am-c').value;
        act('Update authentication method', m.name, function(){ m.state = st; m.scope = sc; },
          m.name + ' updated', {cat:'Authentication', detail:m.name + ' · ' + st + ', available to ' + (sc==='all'?'all users':sc==='none'?'nobody':sc) + '.'});
      });
  }
  function ssprEdit(){
    var a = am(), s = a.sspr = a.sspr || {}, groups = D.groups.map(function(g){ return g.name; });
    var opts = a.methods.map(function(m){
      return '<label class="check"><input type="checkbox" class="sp-m" value="' + m.id + '"' + ((s.allowed||[]).indexOf(m.id)>=0?' checked':'') + '> ' + esc(m.name) + (m.weak ? ' <span class="pill warn">interceptable</span>' : m.phishResistant ? ' <span class="pill en">phishing-resistant</span>' : '') + '</label>';
    }).join('');
    openModal('Self-service password reset',
      '<p class="hint">Reset is the recovery path for everything else. Whatever is good enough here is good enough to take over any account, because it is what the attacker will use.</p>' +
      '<label class="fld" for="sp-s">Enabled for</label><select class="in" id="sp-s"><option value="none"' + (s.scope==='none'||!s.scope?' selected':'') + '>Nobody</option><option value="all"' + (s.scope==='all'?' selected':'') + '>All users</option>' +
        groups.map(function(g){ return '<option value="' + esc(g) + '"' + (s.scope===g?' selected':'') + '>' + esc(g) + ' only</option>'; }).join('') + '</select>' +
      '<label class="fld" for="sp-r">Methods required to reset</label><select class="in" id="sp-r"><option value="1"' + (s.required!==2?' selected':'') + '>One</option><option value="2"' + (s.required===2?' selected':'') + '>Two</option></select>' +
      '<label class="fld">Permitted for reset</label>' + opts,
      'Save', function(){
        var sc = document.getElementById('sp-s').value, rq = +document.getElementById('sp-r').value;
        var allowed = [].slice.call(modalEl.querySelectorAll('.sp-m')).filter(function(x){ return x.checked; }).map(function(x){ return x.value; });
        act('Update self-service password reset', 'Tenant', function(){ s.scope = sc; s.required = rq; s.allowed = allowed; },
          'Self-service reset updated', {cat:'Authentication', detail:'Enabled for ' + (sc==='none'?'nobody':sc) + ' · ' + rq + ' method(s) required · permitted: ' + allowed.join(', ') + '.'});
      });
  }
  function amCampaign(){
    var a = am(), s = a.sspr = a.sspr || {}, c = s.campaign = s.campaign || {};
    openModal('Registration campaign',
      '<p class="hint">A campaign interrupts sign-in and asks people to register the method you want them on. It is the only thing that moves the people who would otherwise never get round to it.</p>' +
      '<label class="fld" for="rc-o">State</label><select class="in" id="rc-o"><option value="off"' + (c.on?'':' selected') + '>Off</option><option value="on"' + (c.on?' selected':'') + '>On</option></select>' +
      '<label class="fld" for="rc-m">Prompt users to register</label><select class="in" id="rc-m">' +
        a.methods.filter(function(m){ return m.state==='Enabled'; }).map(function(m){ return '<option value="' + m.id + '"' + (c.method===m.id?' selected':'') + '>' + esc(m.name) + '</option>'; }).join('') + '</select>' +
      '<label class="fld" for="rc-s">Times a user may snooze</label><select class="in" id="rc-s"><option value="0">0 — must register now</option><option value="3" selected>3</option><option value="14">14</option></select>',
      'Save', function(){
        var on = document.getElementById('rc-o').value==='on', me = document.getElementById('rc-m').value, sn = +document.getElementById('rc-s').value;
        act('Update registration campaign', 'Tenant', function(){ c.on = on; c.method = me; c.snooze = sn; },
          on ? 'Registration campaign on' : 'Registration campaign off',
          {cat:'Authentication', detail:'Campaign ' + (on?'on':'off') + (on ? ' · prompting for ' + (amBy(me)||{}).name + ' · ' + sn + ' snoozes allowed' : '') + '.'});
      });
  }
  function amRegAction(i){
    var a = am(), r = a.registrations[i];
    openModal('Method registration — ' + r.who,
      '<dl class="kv sm"><dt>Method</dt><dd>' + esc(r.method) + '</dd><dt>When</dt><dd class="mono">' + esc(r.when) + '</dd><dt>Where</dt><dd>' + esc(r.loc||'') + ' <span class="mono faint">' + esc(r.ip||'') + '</span></dd></dl>' +
      (r.flag ? '<div class="banner bad"><span>' + esc(r.flag) + '</span></div>' : '') +
      '<p class="hint">Registering a new way to sign in is how an account takeover is made permanent: the password can be reset afterwards and the attacker still gets in. Treat an unexpected registration as a compromise, not as a user doing something odd.</p>' +
      '<label class="fld" for="ar-a">Action</label><select class="in" id="ar-a"><option value="removed">Remove the method and revoke the user\u2019s sessions</option><option value="accepted">Accept it \u2014 the user confirmed they did this</option></select>',
      'Apply', function(){
        var v = document.getElementById('ar-a').value;
        act('Action method registration', r.who, function(){ r.handled = v==='removed' ? 'Removed' : 'Accepted'; },
          v==='removed' ? 'Method removed and sessions revoked' : 'Registration accepted',
          {cat:'Authentication', detail:r.who + ' · ' + r.method + ' registered ' + r.when + ' from ' + (r.loc||'') + '. ' + (v==='removed' ? 'Method removed and all sessions revoked.' : 'Accepted as legitimate.')});
      });
  }

  // ---- external identities --------------------------------------------
  // A guest is somebody else's employee with a seat in your directory. Nobody
  // inside the company owns them, nothing tells you when they leave the company
  // that does, and the only two controls that survive contact with reality are
  // a named sponsor and an expiry date.
  function ext(){ if(!S.ext && D.external) S.ext = JSON.parse(JSON.stringify(D.external)); return S.ext; }
  function guestBy(id){ var x = ext(); if(!x) return null; for(var i=0;i<x.guests.length;i++){ if(x.guests[i].id===id) return x.guests[i]; } return null; }
  function guestState(g){
    if(g.removed) return '<span class="pill dis">Removed</span>';
    if(!g.redeemed) return '<span class="pill warn">Invited, never redeemed</span>';
    if(g.lastSignIn==='never') return '<span class="pill warn">Redeemed, never signed in</span>';
    return '<span class="pill en">Active</span>';
  }
  function pExt(){
    var x = ext();
    if(!x) return '<h1 class="pg">External identities</h1><div class="card"><div class="card-b faint">No external identities in this shift.</div></div>';
    var live = x.guests.filter(function(g){ return !g.removed; });
    var rows = live.map(function(g){
      var acts = '<div class="row" style="gap:6px">' +
        '<button class="btn sec sm" data-gsponsor="' + g.id + '" type="button">Sponsor</button>' +
        '<button class="btn sec sm" data-gexp="' + g.id + '" type="button">Expiry</button>' +
        '<button class="btn danger sm" data-grm="' + g.id + '" type="button">Remove</button></div>';
      return '<tr><td><b>' + esc(g.name) + '</b><div class="mono faint" style="font-size:12.5px">' + esc(g.email) + '</div></td>' +
        '<td>' + esc(g.org||g.email.split('@')[1]) + '</td>' +
        '<td>' + (g.sponsor ? esc(pname(g.sponsor)) : '<span class="res bad">None</span>') + '</td>' +
        '<td>' + (g.expires ? esc(g.expires) : '<span style="color:var(--warn);font-weight:600">Never</span>') + '</td>' +
        '<td class="mono faint nowrap">' + esc(g.lastSignIn||'—') + '</td>' +
        '<td>' + guestState(g) + '</td>' +
        '<td>' + ((g.groups||[]).length ? (g.groups||[]).map(function(gr){ var t = G(gr); return '<span class="tb" style="margin:0 4px 4px 0">' + esc(gr) + (t && t.tier && t.tier!=='standard' ? ' · ' + esc(t.tier) : '') + ' <button class="link" data-grmg="' + g.id + '|' + esc(gr) + '" type="button" aria-label="Remove from ' + esc(gr) + '">remove</button></span>'; }).join('') : '<span class="faint">—</span>') + '</td>' +
        '<td>' + acts + '</td></tr>';
    }).join('');
    var c = x.collab || {};
    var risky = [];
    if(c.mode !== 'allow-list') risky.push('Anybody with an address at any domain can be invited.');
    if(c.guestPerms !== 'limited') risky.push('Guests can read the full directory — every user, group and membership.');
    if(c.whoCanInvite !== 'admins') risky.push('Any member can invite a guest, with no approval and no record of why.');
    return '<h1 class="pg">External identities</h1><p class="sub">People from partner and supplier organisations with an identity in this tenant. ' + live.length + ' active.</p>' +
      card('Collaboration settings', '<button class="btn sm" data-collab="1" type="button">Change</button>',
        '<div class="card-b"><dl class="kv sm">' +
        '<dt>Who can invite</dt><dd>' + (c.whoCanInvite==='admins' ? 'Administrators only' : '<span style="color:var(--warn);font-weight:600">Any member</span>') + '</dd>' +
        '<dt>Permitted domains</dt><dd>' + (c.mode==='allow-list' ? '<span class="mono">' + esc((c.allow||[]).join(', ') || 'none') + '</span>' : '<span style="color:var(--warn);font-weight:600">Any domain</span>') + '</dd>' +
        '<dt>Guest directory access</dt><dd>' + (c.guestPerms==='limited' ? 'Limited — own profile and members they work with' : '<span style="color:var(--warn);font-weight:600">Same as members — full directory</span>') + '</dd>' +
        '</dl>' + (risky.length ? '<ul class="feed">' + risky.map(function(t){ return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' : '') + '</div>') +
      card('Guests', '', table(['Guest','Organisation','Sponsor','Expires','Last sign-in','Status','Groups',''], rows, 'No guests.'));
  }
  function guestSponsor(id){
    var g = guestBy(id), cands = allUsers().filter(function(u){ return u.status==='Enabled' && !u.service && !u.shared && u.dept!=='External'; });
    openModal('Sponsor — ' + g.name,
      '<p class="hint">A sponsor is the person inside the company who will be asked, at every review, whether this guest still needs to be here. Without one the question has nobody to go to and the answer defaults to yes.</p>' +
      '<label class="fld" for="gs-u">Sponsor</label><select class="in" id="gs-u">' + cands.map(function(u){ return '<option value="' + esc(u.upn) + '"' + (g.sponsor===u.upn?' selected':'') + '>' + esc(u.name) + ' — ' + esc(u.title) + '</option>'; }).join('') + '</select>',
      'Save', function(){
        var v = document.getElementById('gs-u').value;
        act('Set guest sponsor', g.name, function(){ g.sponsor = v; }, 'Sponsor set', {cat:'User management', detail:'Guest ' + g.email + ' sponsored by ' + pname(v) + '.'});
      });
  }
  function guestExpiry(id){
    var g = guestBy(id);
    openModal('Access expiry — ' + g.name,
      '<p class="hint">Guest access that never expires is a standing invitation held by somebody else\u2019s employee, in somebody else\u2019s HR system, that you will never be told about.</p>' +
      '<label class="fld" for="ge-d">Access expires</label><select class="in" id="ge-d"><option value="">Never</option>' +
        (D.guestExpiryOptions||['in 30 days','in 90 days','in 180 days']).map(function(o){ return '<option value="' + esc(o) + '"' + (g.expires===o?' selected':'') + '>' + esc(o) + '</option>'; }).join('') + '</select>',
      'Save', function(){
        var v = document.getElementById('ge-d').value;
        act('Set guest access expiry', g.name, function(){ g.expires = v; }, v ? 'Expiry set' : 'Expiry cleared',
          {cat:'User management', detail:'Guest ' + g.email + ' · access expires ' + (v||'never') + '.'});
      });
  }
  function guestRemove(id){
    var g = guestBy(id);
    openModal('Remove guest — ' + g.name,
      '<p>This removes <span class="mono">' + esc(g.email) + '</span> from the tenant along with every group membership and application assignment it carries.</p>' +
      '<p class="hint">Their account at ' + esc(g.org||g.email.split('@')[1]) + ' is unaffected \u2014 it was never ours. Only the seat here goes.</p>' +
      '<label class="fld" for="gr-w">Reason</label><input class="in" id="gr-w" placeholder="e.g. contract ended, never redeemed, no sponsor">',
      'Remove', function(){
        var w = document.getElementById('gr-w').value.trim(); if(w.length<3) return false;
        act('Remove guest', g.name, function(){ g.removed = true; g.removedWhy = w; }, g.name + ' removed',
          {cat:'User management', detail:'Guest ' + g.email + ' removed from the tenant. ' + w});
      }, null, true);
  }
  function guestGroupRemove(id, grp){
    var g = guestBy(id), t = G(grp);
    openModal('Remove ' + g.name + ' from ' + grp,
      '<p>' + esc(g.name) + ' is an external identity at <b>' + esc(g.org||'') + '</b> and <span class="mono">' + esc(grp) + '</span> is an internal group' + (t && t.tier && t.tier!=='standard' ? ' at the <b>' + esc(t.tier) + '</b> tier' : '') + '.</p>' +
      '<p class="hint">A guest is a member like any other, which is how this happened: a group owner added them. Everything that group is granted now, and everything it is granted later, goes to them too.</p>',
      'Remove from group', function(){
        act('Remove guest from group', g.name, function(){ g.groups = (g.groups||[]).filter(function(x){ return x!==grp; }); },
          g.name + ' removed from ' + grp, {cat:'Group management', detail:'External identity ' + g.email + ' removed from ' + grp + '.'});
      }, null, true);
  }
  function collabEdit(){
    var x = ext(), c = x.collab = x.collab || {};
    openModal('Collaboration settings',
      '<p class="hint">These three settings decide who can appear in your directory without anybody approving it, and what they can read once they are here.</p>' +
      '<label class="fld" for="cb-w">Who can invite guests</label><select class="in" id="cb-w"><option value="members"' + (c.whoCanInvite!=='admins'?' selected':'') + '>Any member</option><option value="admins"' + (c.whoCanInvite==='admins'?' selected':'') + '>Administrators only</option></select>' +
      '<label class="fld" for="cb-m">Permitted domains</label><select class="in" id="cb-m"><option value="any"' + (c.mode!=='allow-list'?' selected':'') + '>Any domain</option><option value="allow-list"' + (c.mode==='allow-list'?' selected':'') + '>Allow list only</option></select>' +
      '<label class="fld" for="cb-a">Allow list</label><input class="in mono" id="cb-a" value="' + esc((c.allow||[]).join(', ')) + '" placeholder="northbeam.example, coastaldrayage.example">' +
      '<label class="fld" for="cb-p">Guest directory access</label><select class="in" id="cb-p"><option value="same"' + (c.guestPerms!=='limited'?' selected':'') + '>Same as members</option><option value="limited"' + (c.guestPerms==='limited'?' selected':'') + '>Limited</option></select>',
      'Save', function(){
        var w = document.getElementById('cb-w').value, m = document.getElementById('cb-m').value,
            a = document.getElementById('cb-a').value.split(',').map(function(s){ return s.trim(); }).filter(Boolean),
            gp = document.getElementById('cb-p').value;
        act('Update collaboration settings', 'Tenant', function(){ c.whoCanInvite = w; c.mode = m; c.allow = a; c.guestPerms = gp; },
          'Collaboration settings updated', {cat:'Security', detail:'Invites: ' + (w==='admins'?'administrators only':'any member') + ' · domains: ' + (m==='allow-list'? a.join(', ') : 'any') + ' · guest directory access: ' + (gp==='limited'?'limited':'same as members') + '.'});
      });
  }

  // ---- access packages --------------------------------------------------
  // An access package is a request that carries its own approver and its own
  // end date. Without the second one it is just a slower way of making access
  // permanent.
  function pkgs(){ if(!S.pkg && D.packages) S.pkg = JSON.parse(JSON.stringify(D.packages)); return S.pkg; }
  function pkgBy(id){ var k = pkgs(); if(!k) return null; for(var i=0;i<k.items.length;i++){ if(k.items[i].id===id) return k.items[i]; } return null; }
  function pPkg(){
    var k = pkgs();
    if(!k) return '<h1 class="pg">Access packages</h1><div class="card"><div class="card-b faint">No catalog in this shift.</div></div>';
    var cards = k.items.map(function(p){
      var reqs = (p.requests||[]).map(function(r){
        return '<tr><td>' + esc(r.who) + '<div class="mono faint" style="font-size:12.5px">' + esc(r.email||'') + '</div></td>' +
          '<td class="faint">' + esc(r.when) + '</td><td>' + esc(r.why||'') + '</td>' +
          '<td>' + (r.decision ? '<span class="pill ' + (r.decision==='approved'?'en':'dis') + '">' + esc(r.decision) + '</span>' : '<div class="row" style="gap:6px"><button class="btn sm" data-preq="' + p.id + '|' + r.id + '|approved" type="button">Approve</button><button class="btn danger sm" data-preq="' + p.id + '|' + r.id + '|denied" type="button">Deny</button></div>') + '</td></tr>';
      }).join('');
      return card(esc(p.name), '<button class="btn sm" data-ppol="' + p.id + '" type="button">Policy</button>',
        '<div class="card-b"><dl class="kv sm">' +
        '<dt>Grants</dt><dd class="mono">' + esc((p.resources||[]).join(', ')) + '</dd>' +
        '<dt>Who can request</dt><dd>' + (p.scope==='partners' ? 'Users from the permitted partner domains' : p.scope==='internal' ? 'Employees only' : '<span style="color:var(--warn);font-weight:600">Anyone, including guests from any domain</span>') + '</dd>' +
        '<dt>Approver</dt><dd>' + (p.approver ? esc(pname(p.approver)) : '<span class="res bad">None \u2014 requests are granted automatically</span>') + '</dd>' +
        '<dt>Access expires</dt><dd>' + (p.expiry ? esc(p.expiry) : '<span style="color:var(--warn);font-weight:600">Never</span>') + '</dd>' +
        '<dt>Currently assigned</dt><dd>' + ((p.assigned||[]).length) + (p.stale ? ' <span class="pill warn">' + p.stale + ' have not used it in 90 days</span>' : '') + '</dd>' +
        '</dl></div>' + ((p.requests||[]).length ? table(['Requester','When','Reason',''], reqs, '') : ''));
    }).join('');
    return '<h1 class="pg">Access packages</h1><p class="sub">' + esc(k.catalog) + ' · a package is a bundle of groups, applications and roles that somebody can ask for, with an approver and an end date attached to the asking.</p>' + cards;
  }
  function pkgPolicy(id){
    var p = pkgBy(id), cands = allUsers().filter(function(u){ return u.status==='Enabled' && !u.service && !u.shared && u.dept!=='External'; });
    openModal('Policy — ' + p.name,
      '<p class="hint">Three questions: who may ask, who decides, and when it ends. A package with no approver is a self-service grant. A package with no end date is a permanent one.</p>' +
      '<label class="fld" for="pp-s">Who can request</label><select class="in" id="pp-s">' +
        [['any','Anyone, including guests from any domain'],['partners','Users from the permitted partner domains'],['internal','Employees only']].map(function(o){ return '<option value="' + o[0] + '"' + (p.scope===o[0]?' selected':'') + '>' + o[1] + '</option>'; }).join('') + '</select>' +
      '<label class="fld" for="pp-a">Approver</label><select class="in" id="pp-a"><option value="">None \u2014 grant automatically</option>' +
        cands.map(function(u){ return '<option value="' + esc(u.upn) + '"' + (p.approver===u.upn?' selected':'') + '>' + esc(u.name) + ' \u2014 ' + esc(u.title) + '</option>'; }).join('') + '</select>' +
      '<label class="fld" for="pp-e">Access expires</label><select class="in" id="pp-e"><option value="">Never</option>' +
        (D.pkgExpiryOptions||['after 30 days','after 90 days','after 180 days']).map(function(o){ return '<option value="' + esc(o) + '"' + (p.expiry===o?' selected':'') + '>' + esc(o) + '</option>'; }).join('') + '</select>',
      'Save', function(){
        var sc = document.getElementById('pp-s').value, ap = document.getElementById('pp-a').value, ex = document.getElementById('pp-e').value;
        act('Update access package policy', p.name, function(){ p.scope = sc; p.approver = ap; p.expiry = ex; },
          'Policy updated', {cat:'Role management', detail:p.name + ' · requestable by ' + sc + ', approver ' + (ap?pname(ap):'none') + ', expires ' + (ex||'never') + '.'});
      });
  }
  function pkgDecide(id, rid, dec){
    var p = pkgBy(id), r = (p.requests||[]).filter(function(x){ return x.id===rid; })[0]; if(!r) return;
    openModal((dec==='approved'?'Approve':'Deny') + ' — ' + r.who,
      '<p>' + esc(r.who) + ' at <span class="mono">' + esc(r.email||'') + '</span> asked for <b>' + esc(p.name) + '</b>.</p>' +
      '<p class="faint">“' + esc(r.why||'') + '”</p>' + (r.flag ? '<div class="banner warn"><span>' + esc(r.flag) + '</span></div>' : '') +
      '<label class="fld" for="pd-w">Decision note</label><input class="in" id="pd-w" placeholder="Recorded against the request">',
      dec==='approved' ? 'Approve' : 'Deny', function(){
        var w = document.getElementById('pd-w').value.trim(); if(w.length<3) return false;
        act(dec==='approved' ? 'Approve access request' : 'Deny access request', r.who, function(){ r.decision = dec; r.note = w; },
          'Request ' + dec, {cat:'Role management', detail:p.name + ' · ' + r.who + ' (' + (r.email||'') + ') ' + dec + '. ' + w});
      }, null, dec!=='approved');
  }

  // ---- inbound HR feed ------------------------------------------------
  // The payroll system is the source of authority for who exists, what they are
  // called and when they leave. The console only ever reacts to it. Every
  // record here is a decision: is this a new person, the same person again, or
  // the same person under a different name?
  function hrFeed(){ if(!S.hr && D.hrFeed) S.hr = JSON.parse(JSON.stringify(D.hrFeed)); return S.hr; }
  function hrRec(wid){ var f = hrFeed(); if(!f) return null; for(var i=0;i<f.records.length;i++){ if(f.records[i].wid===wid) return f.records[i]; } return null; }
  function hrStatePill(r){
    if(r.done==='created') return '<span class="pill en">Identity created</span>';
    if(r.done==='matched') return '<span class="pill en">Matched to ' + esc(pname(r.matchedTo)) + '</span>';
    if(r.done==='renamed') return '<span class="pill en">Name change applied</span>';
    if(r.done==='leaver') return '<span class="pill en">Leaver actioned</span>';
    if(r.done==='held') return '<span class="pill warn">Held — sent back to HR</span>';
    return '<span class="pill dis">Not processed</span>';
  }
  function pHr(){
    var f = hrFeed();
    if(!f) return '<h1 class="pg">HR feed</h1><div class="card"><div class="card-b faint">No inbound feed is configured for this shift.</div></div>';
    var rows = f.records.map(function(r){
      var kind = r.kind==='new' ? 'Starter' : r.kind==='rehire' ? 'Starter' : r.kind==='name' ? 'Change of name' : r.kind==='leaver' ? 'Leaver' : r.kind==='change' ? 'Change' : 'Record';
      var acts = [];
      if(!r.done){
        if(r.kind==='new' || r.kind==='rehire') acts.push('<button class="btn sm" data-hrnew="' + r.wid + '" type="button">Create identity</button>', '<button class="btn sec sm" data-hrmatch="' + r.wid + '" type="button">Match to existing</button>');
        if(r.kind==='name') acts.push('<button class="btn sm" data-hrname="' + r.wid + '" type="button">Apply name change</button>');
        if(r.kind==='leaver') acts.push('<button class="btn sm" data-hrleave="' + r.wid + '" type="button">Action the leaver</button>');
        acts.push('<button class="btn sec sm" data-hrhold="' + r.wid + '" type="button">Hold</button>');
      }
      return '<tr><td class="mono nowrap">' + esc(r.wid) + '</td>' +
        '<td><b>' + esc(r.preferred || r.legal) + '</b>' + (r.legal && r.preferred && r.legal!==r.preferred ? '<div class="faint" style="font-size:12.5px">Legal name: ' + esc(r.legal) + '</div>' : '') + '</td>' +
        '<td>' + esc(kind) + '<div class="faint" style="font-size:12.5px">' + esc(r.note||'') + '</div></td>' +
        '<td>' + esc(r.title||'—') + '<div class="faint" style="font-size:12.5px">' + esc(r.dept||'') + (r.mgr ? ' · ' + esc(r.mgr) : '') + '</div></td>' +
        '<td class="mono faint nowrap">' + esc(r.hire||'') + (r.term ? '<br>leaves ' + esc(r.term) : '') + '</td>' +
        '<td>' + hrStatePill(r) + '</td>' +
        '<td><div class="row" style="gap:6px">' + acts.join('') + '</div></td></tr>';
    }).join('');
    var gaps = f.records.filter(function(r){ return (r.missing||[]).length && !r.done; });
    var gapHtml = gaps.map(function(r){ return '<li><span class="mono">' + esc(r.wid) + '</span> ' + esc(r.preferred||r.legal) + ' — missing <b>' + esc((r.missing||[]).join(', ')) + '</b></li>'; }).join('');
    return '<h1 class="pg">HR feed</h1><p class="sub">' + esc(f.system) + ' · last delivery ' + esc(f.lastRun) + ' · next ' + esc(f.nextRun) + '. This system decides who exists. The directory follows it, never the other way round.</p>' +
      (gapHtml ? card('Records the feed could not complete', '<span class="pill warn">' + gaps.length + '</span>', '<div class="card-b"><ul class="feed">' + gapHtml + '</ul><p class="hint">A field the feed did not send is a question for HR, not a value for you to invent. Guessing a cost centre puts someone in the wrong role template and nobody finds out until the access review.</p></div>') : '') +
      card('This delivery', '', table(['Worker ID','Name','Type','Role','Dates','Status',''], rows, 'Nothing in this delivery.'));
  }
  function hrNew(wid){
    var r = hrRec(wid);
    var dupe = allUsers().filter(function(u){ return u.eid && r.eid && u.eid===r.eid; })[0] ||
               allUsers().filter(function(u){ return u.name===(r.preferred||r.legal); })[0];
    openModal('Create an identity — ' + (r.preferred||r.legal),
      ((r.missing||[]).length ? '<div class="banner bad"><span>The feed did not send <b>' + esc((r.missing||[]).join(', ')) + '</b> for this record. Creating now means choosing those values yourself.</span></div>' : '') +
      (dupe ? '<div class="banner warn"><span>Payroll number <span class="mono">' + esc(r.eid||'') + '</span> already belongs to <b>' + esc(dupe.name) + '</b> (' + esc(dupe.status) + '). Creating a second identity gives this person a new history and leaves the old one behind.</span></div>' : '') +
      '<dl class="kv sm"><dt>Worker ID</dt><dd class="mono">' + esc(r.wid) + '</dd><dt>Payroll number</dt><dd class="mono">' + esc(r.eid||'—') + '</dd><dt>Role</dt><dd>' + esc(r.title||'—') + '</dd><dt>Department</dt><dd>' + esc(r.dept||'—') + '</dd><dt>Manager</dt><dd>' + esc(r.mgr||'—') + '</dd><dt>Start date</dt><dd>' + esc(r.hire||'—') + '</dd>' +
        (r.term ? '<dt>End date</dt><dd><b>' + esc(r.term) + '</b></dd>' : '') + '</dl>' +
      (r.term ? '<label class="fld" for="hn-x">Account expires</label><select class="in" id="hn-x"><option value="">Not set</option><option value="' + esc(r.term) + ' 23:59">' + esc(r.term) + ' 23:59</option></select><p class="hint">The feed is carrying an end date. Setting it now is the only version of this that still works in August if nobody remembers.</p>' : ''),
      'Create identity', function(){
        var exp = r.term ? document.getElementById('hn-x').value : '';
        act('Create identity from HR record', r.preferred||r.legal, function(){
          r.done = 'created'; r.createdDupe = !!dupe; r.expSet = !!exp;
          var nu = {upn:(r.sam||''), name:(r.preferred||r.legal), title:r.title||'', dept:r.dept||'', mgr:r.mgr||'', mgrUpn:r.mgrUpn||'', status:'Not created',
                    device:'', groups:[], sessions:[], note:'Created from HR record ' + r.wid + '.', eid:r.eid||'', hired:r.hire||'', created:'today', pwd:'—', mfa:[], lic:'', apps:[],
                    ad:{exists:false, sam:(r.sam||''), ou:'Users (default container)', enabled:false, groups:[], pwdSet:'—', lastLogon:'never', desc:r.title||''},
                    roles:[], rules:[], devices:[], delegates:[], odAccess:[], fromHr:r.wid, acctExp:(exp||''), contractEnd:(r.term||'')};
          S.users[nu.upn] = nu;
        }, 'Identity created for ' + (r.preferred||r.legal), {cat:'User management', detail:'HR record ' + r.wid + ' · new identity. ' + (exp ? 'Account expires ' + exp + ', taken from the feed. ' : r.term ? 'The feed carried an end date of ' + r.term + ' and no account expiry was set. ' : '') + (dupe ? 'A record with the same payroll number already existed (' + dupe.name + ').' : '')});
      });
  }
  function hrMatch(wid){
    var r = hrRec(wid);
    var cands = allUsers().filter(function(u){ return u.status!=='Not created'; });
    var best = cands.filter(function(u){ return u.eid && r.eid && u.eid===r.eid; })[0];
    openModal('Match to an existing identity — ' + (r.preferred||r.legal),
      '<p class="hint">Somebody who comes back is the same person. Matching keeps their payroll number, their object, their mailbox and every access review decision ever made about them. Creating a second identity throws all of that away and leaves the first one for somebody else to find.</p>' +
      (best ? '<div class="banner warn"><span>Payroll number <span class="mono">' + esc(r.eid) + '</span> matches <b>' + esc(best.name) + '</b> — ' + esc(best.status) + '.</span></div>' : '') +
      '<label class="fld" for="hm-u">Existing identity</label><select class="in" id="hm-u">' +
        cands.map(function(u){ return '<option value="' + esc(u.upn) + '"' + (best && best.upn===u.upn ? ' selected' : '') + '>' + esc(u.name) + ' — ' + esc(u.title) + ' (' + esc(u.status) + ')</option>'; }).join('') + '</select>' +
      '<label class="check"><input type="checkbox" id="hm-en" checked> Re-enable the account and restore the role template for ' + esc(r.title||'the new role') + '</label>',
      'Match', function(){
        var upn = document.getElementById('hm-u').value, en = document.getElementById('hm-en').checked, u = U(upn);
        act('Match HR record to existing identity', u.name, function(){
          r.done = 'matched'; r.matchedTo = upn; r.reEnabled = en;
          if(en){ u.status = 'Enabled'; if(u.ad) { u.ad.enabled = true; } u.title = r.title || u.title; u.dept = r.dept || u.dept; u.rehired = true; }
        }, 'Matched to ' + u.name, {cat:'User management', detail:'HR record ' + r.wid + ' matched to the existing identity ' + mail(u.upn) + '. ' + (en ? 'Account re-enabled for the new role.' : 'Account left as it was.')});
      });
  }
  function hrName(wid){
    var r = hrRec(wid);
    var u = U(r.matchUpn) || allUsers().filter(function(x){ return x.eid && r.eid && x.eid===r.eid; })[0];
    if(!u){ toast('No identity on this payroll number to rename.'); return; }
    openModal('Change of name — ' + u.name,
      '<p class="hint">A rename is two separate things. The display name is cosmetic. The sign-in name is an identifier, and every application that keys on it will treat the new one as a different person unless the old one is kept as an alias.</p>' +
      '<dl class="kv sm"><dt>Current</dt><dd>' + esc(u.name) + ' <span class="mono faint">' + esc(mail(u.upn)) + '</span></dd><dt>HR legal name</dt><dd>' + esc(r.legal) + '</dd><dt>HR preferred name</dt><dd>' + esc(r.preferred||r.legal) + '</dd></dl>' +
      '<label class="fld" for="rn-d">Display name</label><input class="in" id="rn-d" value="' + esc(r.preferred||r.legal) + '">' +
      '<label class="fld" for="rn-s">Sign-in name</label><div class="row" style="gap:4px;flex-wrap:nowrap"><input class="in mono" id="rn-s" value="' + esc(r.newSam||u.upn) + '"><span class="mono faint nowrap">@' + esc(DOM) + '</span></div>' +
      '<label class="check"><input type="checkbox" id="rn-a" checked> Keep <span class="mono">' + esc(mail(u.upn)) + '</span> as a secondary address so mail to the old name still arrives</label>',
      'Apply', function(){
        var dn = document.getElementById('rn-d').value.trim(), sam = (document.getElementById('rn-s').value||'').trim().toLowerCase(), keep = document.getElementById('rn-a').checked;
        if(!dn || !sam) return false;
        var clash = upnTaken(sam); if(clash && clash.upn!==u.upn){ toast('That sign-in name already belongs to ' + clash.name + '.'); return false; }
        act('Change name', u.name, function(){
          r.done = 'renamed'; r.appliedTo = u.upn;
          var old = u.upn;
          u.oldUpn = old; u.renamedFrom = u.name; u.name = dn;
          if(u.ad) u.ad.sam = sam;
          u.upn = sam; u.keptAlias = keep;
          if(sam !== old){ delete S.users[old]; S.users[sam] = u; }
          if(keep){ u.aliases = (u.aliases||[]).concat([u.oldUpn]); }
        }, dn + ' renamed', {cat:'User management', detail:'HR record ' + r.wid + ' · display name “' + dn + '”, sign-in name ' + sam + '@' + DOM + '. ' + (keep ? 'Previous address kept as a secondary address.' : 'Previous address NOT kept — mail to it will bounce.') + ' The directory object, payroll number and mailbox are unchanged.'});
      });
  }
  function hrLeaver(wid){
    var r = hrRec(wid);
    var u = U(r.matchUpn) || allUsers().filter(function(x){ return x.eid && r.eid && x.eid===r.eid; })[0];
    openModal('Leaver from the feed — ' + (r.preferred||r.legal),
      '<p>Payroll has this person leaving on <b>' + esc(r.term||'—') + '</b>.' + (u ? ' The directory shows <b>' + esc(u.name) + '</b> as <b>' + esc(u.status) + '</b>.' : '') + '</p>' +
      '<p class="hint">The feed is the source of authority for whether somebody still works here. Where the directory disagrees with it, the directory is wrong — but find out why it disagrees before you act, because the other possibility is that the feed is describing a different person.</p>',
      'Mark actioned', function(){
        act('Action leaver from HR record', r.preferred||r.legal, function(){ r.done = 'leaver'; }, 'Leaver actioned',
          {cat:'User management', detail:'HR record ' + r.wid + ' · leaver acknowledged against the feed, effective ' + (r.term||'') + '.'});
      });
  }
  function hrHold(wid){
    var r = hrRec(wid);
    openModal('Send back to HR — ' + (r.preferred||r.legal),
      '<p class="hint">Holding a record is a real answer. It means the directory will not invent what payroll did not send.</p>' +
      '<label class="fld" for="hh-w">What is missing or wrong</label><input class="in" id="hh-w" value="' + esc((r.missing||[]).length ? 'Feed did not send ' + (r.missing||[]).join(', ') : '') + '">',
      'Hold and notify HR', function(){
        var w = document.getElementById('hh-w').value.trim(); if(w.length<4) return false;
        act('Hold HR record', r.preferred||r.legal, function(){ r.done = 'held'; r.heldWhy = w; },
          'Held and sent back to HR', {cat:'User management', detail:'HR record ' + r.wid + ' held. ' + w});
      });
  }
  function NUMW(n){ var w = ['Zero','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen']; return w[n] || String(n); }
  function card(title, right, inner){ return '<div class="card" style="margin-bottom:14px"><div class="card-h"><h3>' + title + '</h3>' + (right||'') + '</div>' + inner + '</div>'; }
  function table(head, rows, empty){ return rows ? '<div class="tablewrap"><table class="t"><thead><tr>' + head.map(function(h){ return '<th>' + h + '</th>'; }).join('') + '</tr></thead><tbody>' + rows + '</tbody></table></div>' : '<div class="card-b faint">' + empty + '</div>'; }

  function pHome(){
    var priv = D.groups.filter(function(g){ return g.tier==='privileged'; }).reduce(function(n,g){ return n + members(g.name).length; }, 0) + allUsers().reduce(function(n,u){ return n + u.roles.filter(function(r){ return r.type==='active'; }).length; }, 0);
    var sess = allUsers().reduce(function(n,u){ return n + u.sessions.length; }, 0);
    var fails = allSignins().filter(function(s){ return /^Failure/.test(s.res); }).length;
    var rows = visibleTickets().filter(function(t){ return isOpen(S.tickets[t.id]); }).map(function(t){ var st = S.tickets[t.id]; return '<tr class="click" data-ticket="' + t.id + '"><td class="mono">' + t.id + '</td><td>' + priPill(t.pri) + '</td><td>' + esc(t.subject) + '</td><td>' + tStatus(st) + '</td><td>' + slaCell(st) + '</td></tr>'; }).join('');
    var feed = S.audit.concat(D.auditSeed).slice(0,6).map(function(a){ return '<li><span class="mono faint">' + esc(a.tl) + '</span><br><b>' + esc(a.action) + '</b> · ' + esc(a.target) + '<div class="faint">' + esc(a.actor===ME ? 'You' : a.actor) + '</div></li>'; }).join('');
    return '<h1 class="pg">Good morning</h1><p class="sub">' + esc(fmtLong(S.clock)) + ' at ' + esc(D.company) + '.</p>' + allDoneBanner() +
      '<div class="health"><span><i class="dot ok"></i>Directory sync · last run ' + fmt(S.clock - (S.clock % 30)) + '</span><span><i class="dot ' + (pendingAll().length?'warn':'ok') + '"></i>Directory sync · last cycle ' + fmt(S.sync.last) + (pendingAll().length ? ' · ' + pendingAll().length + ' waiting' : '') + '</span><span><i class="dot ' + (fails>4?'warn':'ok') + '"></i>' + fails + ' failed sign-ins in 24h</span><span><i class="dot ' + (pimOn()?'warn':'ok') + '"></i>' + (pimOn() ? 'Privileged Role Administrator active until ' + hhmm(S.pim) : 'No privileged roles active') + '</span></div>' +
      '<div class="tiles">' +
        '<div class="tile"><div class="n">' + openCount() + '</div><div class="l">Open tickets</div></div>' +
        '<div class="tile"><div class="n">' + priv + '</div><div class="l">Standing privileged assignments</div></div>' +
        '<div class="tile"><div class="n">' + sess + '</div><div class="l">Active sessions</div></div>' +
        '<div class="tile"><div class="n">' + pendingAll().length + '</div><div class="l">Objects waiting to sync</div></div>' +
      '</div>' +
      '<div class="two"><div class="card"><div class="card-h"><h3>Your queue</h3><button class="btn sec sm" data-nav="tickets" type="button">View all tickets</button></div>' +
      (rows ? '<div class="tablewrap"><table class="t"><tbody>' + rows + '</tbody></table></div>' : '<div class="card-b faint">Nothing open.</div>') + '</div>' +
      '<div class="card"><div class="card-h"><h3>Recent directory activity</h3><button class="btn sec sm" data-nav="audit" type="button">Audit log</button></div><ul class="feed">' + feed + '</ul></div></div>';
  }
  function pTickets(){
    var f = S.tfilt;
    var list = visibleTickets().filter(function(t){ var st = S.tickets[t.id]; return f==='all' || (f==='open' ? isOpen(st) : f==='mine' ? st.assignee==='you' && isOpen(st) : f==='pending' ? st.status==='pending' : f==='unassigned' ? !st.assignee && isOpen(st) : st.status==='resolved'); });
    var rows = list.map(function(t){ return ticketCard(t); }).join('');
    var chips = [['open','Open'],['mine','Assigned to me'],['unassigned','Unassigned'],['pending','Pending approval'],['resolved','Resolved'],['all','All']].map(function(c){ return '<button class="chip' + (f===c[0]?' on':'') + '" data-tf="' + c[0] + '" type="button">' + c[1] + '</button>'; }).join('');
    var later = D.tickets.filter(function(x){ return !S.tickets[x.id].arrived; }).length;
    return '<div class="qhead"><div><h1 class="pg">Tickets</h1><p class="sub" style="margin-bottom:0">Identity &amp; Access queue · ' + openCount() + ' open</p></div>' +
      (later ? '<span class="arrchip">' + later + ' more arrive during the shift</span>' : '') + '</div>' + allDoneBanner() +
      '<div class="chips">' + chips + '</div>' +
      (rows || '<div class="card"><div class="card-b faint">No tickets in this view.</div></div>');
  }
  function ticketCard(t){
    var st = S.tickets[t.id];
    var cls = t.pri==='P1' || t.pri==='P2' ? 'c2' : t.pri==='P4' ? 'c4' : '';
    var left = st.due==null ? null : st.due - S.clock;
    var pct = 0, lateCls = '';
    if(left!=null){
      var total = Math.max((st.due - (st.created==null ? D.startClock : st.created)), 60);
      pct = Math.max(0, Math.min(100, (1 - left/total) * 100));
      if(left < 0) { pct = 100; lateCls = ' over'; }
      else if(left < 240) lateCls = ' soon';
    }
    var reqName = whoShort(t.requester);
    var resolved = st.status==='resolved', pending = st.status==='pending';
    var slaTxt = resolved ? (st.due!=null && parseT(st.at) <= st.due ? 'Met' : 'Breached')
      : pending ? 'Paused' : left==null ? '—' : (left < 0 ? dur(left) : dur(left) + ' left');
    return '<button class="qcard ' + cls + (resolved ? ' done' : '') + '" data-ticket="' + t.id + '" type="button">' +
      '<span class="edge"></span>' +
      '<span class="av">' + esc(initials(reqName)) + '</span>' +
      '<span class="pad"><span class="qcard-h">' + esc(t.subject) + '</span>' +
      '<span class="meta"><span class="pill' + (t.type==='Alert'||t.type==='Incident' ? ' al' : '') + '">' + esc(t.type) + '</span>' +
      '<b>' + esc(reqName) + '</b>' + (t.hint ? ' · ' + esc(t.hint) : '') +
      '<span class="tid mono">' + t.id + '</span></span></span>' +
      '<span class="sla' + lateCls + '"><span class="t">' + esc(slaTxt) + '</span>' +
      (resolved ? '<span class="st done">Resolved</span>' : pending ? '<span class="st pend">Pending approval</span>' :
        '<span class="g"><i style="width:' + pct.toFixed(0) + '%"></i></span>') + '</span></button>';
  }
  function tlItem(m){
    if(m.kind==='sys') return '<div class="sysline"><span class="mono">' + esc(m.t) + '</span> ' + esc(m.text) + '</div>';
    var cls = m.kind==='note' ? 'msg note-int' : m.kind==='approval' ? 'msg appr' : 'msg';
    var label = m.kind==='note' ? 'Internal note' : m.kind==='msg' ? 'Chat' : m.kind==='approval' ? 'Approval response' : (m.from==='you' ? 'Reply to requester' : 'Reply');
    return '<div class="' + cls + '"><div class="msg-h"><span>' + esc(who(m.from)) + '</span><span>' + label + ' · ' + esc(m.t) + '</span></div><div class="msg-b"><p>' + esc(m.text) + '</p></div></div>';
  }
  function pTicket(t){
    var st = S.tickets[t.id];
    var created = st.created!=null ? fmt(st.created) : t.created;
    var thread = (t.thread||[]).map(function(m){ return '<div class="msg"><div class="msg-h"><span>' + esc(who(m.from)) + '</span><span>Reply · ' + esc(fmt(st.created + 22)) + '</span></div><div class="msg-b"><p>' + esc(m.text) + '</p></div></div>'; }).join('');
    var links = t.related.map(function(up){
      if(U(up)) return '<button class="link" data-user="' + up + '" type="button">' + esc(U(up).name) + ' →</button>';
      var so = adOnlyBy(up);
      if(so) return '<button class="link" data-nav="svc" type="button">' + esc(so.name || up) + ' →</button>';
      return '<span class="link faint">' + esc(up) + '</span>';
    }).join('');
    var sigLink = (t.type==='Alert' || t.type==='Password reset') ? '<button class="link" data-nav="signins" type="button">Sign-in logs →</button>' : '';
    var extWarn = t.requester==='ext' ? '<div class="banner warn" style="margin-bottom:10px"><span><b>External sender.</b> This message came from outside ' + esc(DOM) + '. The address isn’t on file for any user.</span></div>' : '';
    var res;
    if(st.status==='pending'){
      res = '<div class="card"><div class="card-h"><h3>Pending approval</h3></div><div class="card-b"><p style="margin-top:0">Waiting on <b>' + esc(U(st.to).name) + '</b>. The SLA clock is paused.</p><p class="hint">Requested ' + esc(st.askedAt) + '. You’ll get a notification when they respond.</p></div></div>';
    } else if(st.status!=='resolved'){
      var ap = st.approval;
      res = '<div class="card"><div class="card-h"><h3>' + (st.status==='returned' ? 'Action needed' : 'Update ticket') + '</h3></div><div class="card-b">' +
        (st.status==='returned' && ap ? '<div class="note" style="margin:0 0 10px">' + esc(whoShort(ap.from)) + ' responded: <b>' + esc(ap.decision) + '</b>. Read the timeline, act on it, then resolve.</div>' : '') +
        '<p class="hint" style="margin-top:0">Make your changes in the directory first. Resolving records your decision. It doesn’t change anything by itself.</p>' +
        '<label class="fld" for="r-disp">Action</label><select class="in" id="r-disp"><option value="">Choose…</option>' + DISP.map(function(d){ return '<option value="' + d[0] + '">' + d[1] + '</option>'; }).join('') + '</select>' +
        '<div id="r-tow" hidden><label class="fld" for="r-to">Approver</label><select class="in" id="r-to">' + APPROVERS().map(function(a){ return '<option value="' + a + '">' + esc(U(a).name) + ' — ' + esc(U(a).title) + '</option>'; }).join('') + '</select></div>' +
        '<label class="fld" for="r-note">Work note</label><textarea class="in" id="r-note" placeholder="What you did and why. Cite the policy section you relied on."></textarea>' +
        '<div class="row" style="margin-top:12px"><button class="btn" id="r-go" type="button" disabled>Submit</button><span class="hint" id="r-need"></span></div></div></div>';
    } else {
      var dl = DISP.filter(function(d){ return d[0]===st.disp; })[0];
      res = '<div class="card"><div class="card-h"><h3>Resolved</h3><span class="faint mono">' + esc(st.at) + '</span></div><div class="card-b">' +
        '<dl class="kv"><dt>Resolution</dt><dd>' + esc(dl ? dl[1] : st.disp) + '</dd><dt>Note</dt><dd>' + esc(st.note) + '</dd></dl>' +
        '<p class="hint">Outcomes aren’t shown until you end your shift.</p><button class="btn sec sm" id="r-reopen" type="button" style="margin-top:8px">Reopen</button></div></div>';
    }
    var learn = conceptCard(t) + hintCard(t);
    var rbSteps = D.runbooks[t.type] || [];
    var rb = rbSteps.length ? '<div class="card" style="margin-top:14px"><div class="card-h"><h3>Runbook · ' + esc(t.type) + '</h3></div><div class="card-b rb"><p class="hint" style="margin:0 0 6px">Your own checklist. Ticking a box doesn’t change anything.</p>' + rbSteps.map(function(s, i){ return '<label class="check"><input type="checkbox" data-rb="' + i + '"' + (st.rb[i]?' checked':'') + '> <span>' + esc(s) + '</span></label>'; }).join('') + '</div></div>' : '';
    var meta = '<div class="card meta"><dl class="kv sm">' +
      '<dt>Priority</dt><dd>' + priPill(t.pri) + '</dd><dt>SLA</dt><dd>' + slaCell(st) + (st.due!=null ? ' <span class="faint">· due ' + fmt(st.due) + '</span>' : '') + '</dd>' +
      '<dt>Assigned to</dt><dd>' + (st.assignee ? 'You' : 'Unassigned') + (st.assignee || !isOpen(st) ? '' : ' <button class="link" id="t-assign" type="button">Assign to me</button>') + '</dd>' +
      '<dt>Queue</dt><dd>Identity &amp; Access</dd><dt>Channel</dt><dd>' + esc(t.channel) + '</dd><dt>Opened</dt><dd class="mono">' + esc(created) + '</dd>' +
      '<dt>Requester</dt><dd>' + esc(who(t.requester)) + '</dd></dl></div>';
    var composer = isOpen(st) ? '<div class="card composer"><div class="ctabs"><button type="button" class="on" data-ck="reply">Reply to requester</button><button type="button" data-ck="note">Internal note</button></div>' +
      '<textarea class="in" id="c-text" placeholder="Write a reply. The requester will see this."></textarea><div class="row" style="margin-top:8px;justify-content:flex-end"><button class="btn sec sm" id="c-send" type="button">Send reply</button></div></div>' : '';
    return '<div class="crumbs"><button data-nav="tickets" type="button">Tickets</button> / ' + t.id + '</div>' +
      '<h1 class="pg">' + esc(t.subject) + '</h1><p class="sub"><span class="mono">' + t.id + '</span> · ' + esc(t.type) + ' · ' + tStatus(st) + '</p>' +
      '<div class="tk"><div>' + extWarn +
        '<div class="msg"><div class="msg-h"><span>' + esc(who(t.requester)) + '</span><span>Request · ' + esc(created) + '</span></div><div class="msg-b"><p>' + esc(t.body) + '</p></div></div>' + thread +
        st.tl.map(tlItem).join('') + composer +
        '<div class="card"><div class="card-h"><h3>Related records</h3></div><div class="card-b"><div class="links" style="margin:0">' + links + sigLink + '<button class="link" data-nav="policy" type="button">Access policy →</button></div></div></div>' +
      '</div><div>' + meta + res + rb + learn + '</div></div>';
  }
  function pUsers(){
    var q = (S.q||'').toLowerCase();
    var list = allUsers().filter(function(u){ return !q || (u.name+' '+mail(u.upn)+' '+u.dept+' '+u.title+' '+u.eid).toLowerCase().indexOf(q)>=0; });
    var rows = list.map(function(u){ return '<tr class="click" data-user="' + u.upn + '"><td><b>' + esc(u.name) + '</b><div class="mono faint">' + mail(u.upn) + '</div></td><td>' + esc(u.title) + '</td><td>' + esc(u.dept) + '</td><td class="mono faint">' + esc(lastSignin(u)) + '</td><td>' + names(u).length + '</td><td>' + (u.roles.length ? '<span class="tier privileged">admin</span>' : '') + '</td><td>' + statusPill(u.status) + '</td></tr>'; }).join('');
    return '<h1 class="pg">Users</h1><p class="sub">' + list.length + ' accounts' + (q ? ' matching “' + esc(S.q) + '” · <button class="link" data-clearq="1" type="button">Clear</button>' : ' · employees synced from HR') + '</p>' +
      '<div class="card"><div class="tablewrap"><table class="t"><thead><tr><th>Name</th><th>Title</th><th>Dept</th><th>Last sign-in</th><th>Groups</th><th>Roles</th><th>Status</th></tr></thead><tbody>' + (rows || '<tr><td colspan="7" class="faint">No matches.</td></tr>') + '</tbody></table></div></div>';
  }
  function activityRows(ref){
    var list = S.audit.concat(D.auditSeed).filter(function(a){ return a.refs.indexOf(ref)>=0; });
    return '<div class="card"><div class="tablewrap"><table class="t"><thead><tr><th>Time</th><th>Activity</th><th>Initiated by</th><th>Detail</th></tr></thead><tbody>' +
      (list.map(function(a){ return '<tr><td class="mono nowrap">' + esc(a.tl) + '</td><td>' + esc(a.action) + '</td><td class="mono">' + esc(a.actor) + '</td><td>' + esc(a.detail) + '</td></tr>'; }).join('') || '<tr><td colspan="4" class="faint">No activity recorded.</td></tr>') + '</tbody></table></div></div>';
  }
  function pUser(u){
    var pending = u.status==='Not created';
    var tabs = [['overview','Overview']].concat(isSync(u) ? [['ad','Active Directory']] : []).concat([['groups','Cloud groups (' + names(u).length + ')'],['roles','Admin roles (' + u.roles.length + ')'],['apps','Applications'],['sessions','Sessions (' + u.sessions.length + ')'],['auth','Authentication'],['mailbox','Mailbox'],['onedrive','OneDrive'],['devices','Devices (' + u.devices.length + ')'],['signins','Sign-ins'],['activity','Activity']]);
    var actions = pending ? '<button class="btn" data-create="' + u.upn + '" type="button">Create account</button>'
      : '<button class="btn sec" data-toggle="' + u.upn + '" type="button">' + (u.status==='Enabled'?'Disable account':'Enable account') + '</button>' +
        '<button class="btn sec" data-revoke="' + u.upn + '" type="button"' + (u.sessions.length?'':' disabled') + '>Revoke sessions</button>' +
        '<button class="btn sec" data-reset="' + u.upn + '" type="button">Reset password</button>' +
        '<button class="btn sec" data-props="' + u.upn + '" type="button">Edit properties</button>' +
        '<span class="vsep"></span><button class="btn sec" data-contact="' + u.upn + '" type="button">Contact</button>' +
        '<button class="btn sec warnb" data-report="' + u.upn + '" type="button">Report to Security</button>';
    var body = '';
    var lastMod = S.audit.concat(D.auditSeed).filter(function(a){ return a.refs.indexOf('u:'+u.upn)>=0; })[0];
    var mgr = U(u.mgrUpn);
    if(S.utab==='overview'){
      body = '<div class="card"><div class="card-b"><div class="cols"><dl class="kv">' +
        '<dt>Sign-in name</dt><dd class="mono">' + mail(u.upn) + '</dd><dt>Object ID</dt><dd class="mono faint">' + guid('u'+u.upn) + '</dd><dt>Employee ID</dt><dd class="mono">' + esc(u.eid) + '</dd>' +
        '<dt>Title</dt><dd>' + esc(u.title) + '</dd><dt>Department</dt><dd>' + esc(u.dept) + '</dd>' +
        '<dt>' + (u.sponsor?'Sponsor':'Manager') + '</dt><dd>' + (mgr ? '<button class="tlink" data-user="' + mgr.upn + '" type="button">' + esc(mgr.name) + '</button>' : '—') + '</dd><dt>Office</dt><dd>' + esc(u.office) + '</dd><dt>Desk line</dt><dd class="mono">' + esc(u.desk || '—') + '</dd>' +
        '</dl><dl class="kv">' +
        '<dt>Status</dt><dd>' + statusPill(u.status) + '</dd><dt>' + (u.sponsor?'Engagement start':'Hire date') + '</dt><dd>' + esc(u.hired) + '</dd>' + (u.leave ? '<dt>Leave date</dt><dd><b>' + esc(u.leave) + '</b></dd>' : '') +
        (u.contractEnd ? '<dt>Contract end</dt><dd>' + esc(u.contractEnd) + '</dd>' : '') + '<dt>Account expires</dt><dd' + (u.sponsor && (u.acctExp||'Not set')==='Not set' ? ' style="color:var(--warn);font-weight:600"' : '') + '>' + esc(u.acctExp || 'Not set') + '</dd>' +
        '<dt>Account created</dt><dd>' + esc(u.created) + '</dd><dt>Last sign-in</dt><dd class="mono">' + esc(lastSignin(u)) + '</dd>' +
        '<dt>License</dt><dd>' + (hasLic(u) ? esc(u.lic) + (pending ? '' : ' <button class="link" data-licrm="' + u.upn + '" type="button">Remove</button>') : '<span class="faint">None</span>' + (pending || u.service ? '' : ' <button class="link" data-licadd="' + u.upn + '" type="button">Assign</button>')) + '</dd>' +
        '<dt>Source</dt><dd>' + (u.service ? 'Cloud (emergency access)' : u.sponsor ? 'Cloud (manual)' : 'HR connector') + '</dd>' +
        '</dl></div>' +
        (u.note ? '<div class="note">' + esc(u.note) + '</div>' : '') +
        (u.mbxDeleting ? '<div class="note bad">Mailbox scheduled for deletion in 30 days (license removed from a mailbox that isn’t shared).</div>' : '') +
        (lastMod ? '<p class="hint">Last modified ' + esc(lastMod.tl) + ' by ' + esc(lastMod.actor===ME?'you':lastMod.actor) + '</p>' : '') + '</div></div>';
    } else if(S.utab==='ad'){
      if(!onPrem(u)) body = '<div class="card"><div class="card-b"><p style="margin-top:0">No Active Directory object yet. HR has the record, but nobody has created the account in the domain.</p><button class="btn" data-adcreate="' + u.upn + '" type="button">Create in Active Directory</button></div></div>';
      else {
        var pend2 = pendingFor(u);
        body = (pend2.length ? '<div class="banner warn"><span><b>Waiting for directory sync.</b> ' + esc(pend2.join(', ')) + ' changed on-premises and hasn’t reached the cloud yet.</span><button class="btn" data-nav="sync" type="button">Directory sync</button></div>' : '') +
          '<div class="card" style="margin-bottom:14px"><div class="card-b"><div class="cols"><dl class="kv">' +
          '<dt>Logon name</dt><dd class="mono">' + esc(D.netbios) + '\\' + esc(u.ad.sam) + '</dd><dt>UPN</dt><dd class="mono">' + mail(u.upn) + '</dd>' +
          '<dt>Distinguished name</dt><dd class="mono" style="font-size:11.5px">' + esc(dn(u)) + '</dd><dt>OU</dt><dd class="mono">' + esc(u.ad.ou) + '</dd><dt>Description</dt><dd>' + esc(u.ad.desc || '—') + '</dd>' +
          '</dl><dl class="kv"><dt>Account state</dt><dd>' + (u.ad.enabled ? '<span class="pill en">Enabled</span>' : '<span class="pill dis">Disabled</span>') + '</dd>' +
          '<dt>Password last set</dt><dd>' + esc(u.ad.pwdSet) + '</dd><dt>Password never expires</dt><dd>' + (u.ad.pwdNeverExpires ? '<span class="pill warn">Yes</span>' : 'No') + '</dd>' +
          '<dt>Last domain logon</dt><dd class="mono">' + esc(u.ad.lastLogon) + '</dd><dt>Bad password count</dt><dd>' + (u.ad.badPwd ? '<span class="pill warn">' + u.ad.badPwd + '</span> <span class="faint">of 5 before lockout</span>' : '0') + '</dd>' +
          '<dt>Locked out</dt><dd>' + (u.ad.locked ? '<span class="pill warn">Yes</span> <button class="link" data-unlock="' + u.upn + '" type="button">Unlock</button>' : 'No') + '</dd><dt>Kerberos ticket</dt><dd class="mono" style="font-size:12px">' + esc(u.ad.kerb || '—') + '</dd></dl></div>' +
          '<div class="row" style="margin-top:12px"><button class="btn sec sm" data-adtoggle="' + u.upn + '" type="button">' + (u.ad.enabled ? 'Disable AD account' : 'Enable AD account') + '</button><button class="btn sec sm" data-admove="' + u.upn + '" type="button">Move to another OU</button><button class="btn sec sm" data-reset="' + u.upn + '" type="button">Reset password</button></div></div></div>' +
          card('AD security groups', '<button class="btn sm" data-adadd="' + u.upn + '" type="button">Add to group</button>', table(['Group','Scope','Sync',''], u.ad.groups.map(function(g,i){ var meta = adGroup(g) || {scope:'—', desc:'', synced:false};
            return '<tr><td class="mono">' + esc(g) + (/Domain Admins/.test(g) ? ' <span class="tier privileged">privileged</span>' : '') + ((u.ad.tempUntil && u.ad.tempUntil[g]) ? ' <span class="tb">⏱ removes at ' + hhmm(u.ad.tempUntil[g]) + '</span>' : '') + '<div class="faint" style="font-family:var(--sans);font-size:12.5px">' + esc(meta.desc) + '</div></td><td>' + esc(meta.scope) + '</td><td>' + (meta.synced ? 'Syncs to cloud' : '<span class="faint">On-prem only</span>') + (meta.memberOf ? '<div class="faint" style="font-size:12px">nested in ' + esc(meta.memberOf) + '</div>' : '') + '</td><td><button class="btn danger sm" data-adrm="' + u.upn + '|' + i + '" type="button">Remove</button></td></tr>'; }).join(''), 'No security groups.')) +
          card('File share access', '<button class="btn sec sm" data-nav="shares" type="button">Open file shares</button>', table(['Share','Effective access','Where it comes from'], S.shares.map(function(sh){
            var r = effective(u, sh); if(!r.n && !sh.ntfs.some(function(a){ return a.kind==='user' && a.p===u.upn; })) return '';
            var direct = sh.ntfs.filter(function(a){ return a.kind==='user' && a.p===u.upn; });
            var viaG = sh.ntfs.filter(function(a){ return a.kind==='group' && !a.deny && expandAdList(u.ad.groups).indexOf(a.p)>=0; });
            return '<tr><td class="mono">' + esc(sh.path) + '</td><td class="' + (r.n?'res ok':'faint') + '">' + rankName(r.n) + '</td><td>' + (direct.length ? '<span class="tier privileged">granted directly</span> ' + esc(direct[0].since) + ' by ' + esc(direct[0].by) + '<br>' : '') + '<span class="faint">' + (viaG.length ? 'via ' + viaG.map(function(a){ return esc(a.p); }).join(', ') : (direct.length ? '' : 'no group grants access')) + '</span></td></tr>';
          }).join(''), 'No share access.')) +
          card('Open file handles', '', table(['File','Mode','Since','Client',''], S.openFiles.filter(function(f){ return f.upn===u.upn; }).map(function(f){ return '<tr><td class="mono">' + esc(f.path) + '\\' + esc(f.file) + '</td><td>' + esc(f.mode) + '</td><td class="mono">' + esc(f.since) + '</td><td class="mono">' + esc(f.client) + '</td><td><button class="btn danger sm" data-close="' + S.openFiles.indexOf(f) + '" type="button">Close</button></td></tr>'; }).join(''), 'No open files.'));
      }
    } else if(S.utab==='groups'){
      var rows = (dynMember(u) ? '<tr><td><button class="link" data-group="GRP-AllStaff" type="button">GRP-AllStaff</button> <span class="tier">dynamic</span><div class="faint" style="font-size:12.5px;margin-top:3px">' + esc(G('GRP-AllStaff').desc) + '</div></td><td>Dynamic rule<div class="faint" style="font-size:12px">Can’t be changed by hand</div></td><td></td></tr>' : '') +
        u.groups.map(function(a,i){ var g = G(a.g); return '<tr><td><button class="link" data-group="' + a.g + '" type="button">' + esc(a.g) + '</button> ' + (g && g.tier!=='standard' ? '<span class="tier ' + g.tier + '">' + g.tier + '</span>' : '') + (a.src==='ad' ? ' <span class="tier">from AD</span>' : '') + '<div class="faint" style="font-size:12.5px;margin-top:3px">' + esc(g?g.desc:'') + '</div></td><td>' + (a.type==='tb' ? '<span class="tb">⏱ ' + esc(a.exp) + '</span>' : 'Permanent') + '<div class="faint" style="font-size:12px">' + esc(a.why) + '</div></td><td>' + (a.src==='ad' ? '<button class="btn sec sm" data-adtab="' + u.upn + '" type="button">Manage in AD</button>' : '<button class="btn danger sm" data-rm="' + u.upn + '|' + i + '" type="button">Remove</button>') + '</td></tr>'; }).join('');
      var owned = D.groups.filter(function(g){ return S.owners[g.name].indexOf(u.upn)>=0; });
      body = card('Group memberships', pending || u.service ? '' : '<button class="btn sm" data-add="' + u.upn + '" type="button">Add membership</button>', table(['Group','Assignment',''], rows, 'No group memberships.')) +
        card('Groups this user owns', '<span class="faint" style="font-size:12.5px">Owners can add and remove members.</span>', table(['Group','Tier',''], owned.map(function(g){ return '<tr><td><button class="link" data-group="' + g.name + '" type="button">' + g.name + '</button></td><td>' + (g.tier!=='standard'?'<span class="tier ' + g.tier + '">' + g.tier + '</span>':'standard') + '</td><td><button class="btn danger sm" data-rmown="' + g.name + '|' + u.upn + '" type="button">Remove as owner</button></td></tr>'; }).join(''), 'Doesn’t own any groups.'));
    } else if(S.utab==='roles'){
      body = card('Directory role assignments', pending || u.service ? '' : '<button class="btn sm" data-addrole="' + u.upn + '" type="button">Assign role</button>',
        table(['Role','Assignment','Assigned',''], u.roles.map(function(r,i){ return '<tr><td><button class="link" data-role="' + esc(r.r) + '" type="button">' + esc(r.r) + '</button> <span class="tier ' + AR(r.r).tier + '">' + AR(r.r).tier + '</span><div class="faint" style="font-size:12.5px">' + esc(AR(r.r).desc) + '</div></td><td>' + (r.type==='active' ? '<b>Active</b> · permanent' : 'Eligible · activates with MFA') + '</td><td class="faint">' + esc(r.since) + '<br>by ' + esc(r.by) + '</td><td>' + (u.service && !(S.bg||[]).some(function(x){ return x.id===u.upn; }) ? '' : '<button class="btn danger sm" data-rmrole="' + u.upn + '|' + i + '" type="button">Remove</button>') + '</td></tr>'; }).join(''), 'No admin roles. Most accounts should look like this.')) +
        '<p class="hint">Directory roles are assigned separately from groups. Removing someone from an admin group doesn’t remove a role assigned to them directly.</p>';
    } else if(S.utab==='apps'){
      var inh = []; names(u).forEach(function(g){ D.apps.forEach(function(a){ if(a.viaGroup[g]) inh.push('<tr><td>' + esc(a.name) + '</td><td>' + esc(a.viaGroup[g]) + '</td><td>Inherited from <span class="mono">' + g + '</span></td><td></td></tr>'); }); });
      var dir = u.apps.map(function(a,i){ return '<tr><td><button class="link" data-app="' + esc(a.app) + '" type="button">' + esc(a.app) + '</button></td><td><b>' + esc(a.role) + '</b></td><td>Direct assignment<div class="faint" style="font-size:12px">' + esc(a.since) + ' by ' + esc(a.by) + '</div></td><td><button class="btn danger sm" data-rmapp="' + u.upn + '|' + i + '" type="button">Remove</button></td></tr>'; }).join('');
      body = card('Application access', pending ? '' : '<button class="btn sm" data-addapp="' + u.upn + '" type="button">Assign app role</button>', table(['Application','Role','How it’s granted',''], dir + inh.join(''), 'No application access.')) +
        '<p class="hint">Inherited access follows the group. A direct assignment stays until someone removes it, whatever happens to the user’s groups.</p>';
    } else if(S.utab==='sessions'){
      var srows = u.sessions.map(function(s){ var managed = /^(MF-|WS-)/.test(s.dev); return '<tr><td>' + esc(s.dev) + '<div class="faint" style="font-size:12px">' + (managed?'Managed · compliant':'Not managed') + '</div></td><td>' + esc(s.app||'') + '</td><td>' + esc(s.loc) + '<div class="mono faint">' + esc(s.ip||'') + '</div></td><td class="mono">' + esc(s.since) + '</td><td class="mono faint">' + esc(fmt(S.clock - (hash(s.dev)%9) - 1)) + '</td></tr>'; }).join('');
      body = card('Active sessions', '<span class="faint" style="font-size:12.5px">Disabling an account doesn’t end these. Refresh tokens stay valid until revoked.</span>', table(['Device','App','Location','Signed in','Last activity'], srows, 'No active sessions.'));
    } else if(S.utab==='auth'){
      body = card('Authentication methods', u.mfa.length && !pending && !u.service ? '<button class="btn danger sm" data-mfarm="' + u.upn + '|all" type="button">Remove all</button>' : '',
        table(['Method','Registered',''], u.mfa.map(function(m,i){ return '<tr><td>' + esc(m) + '</td><td class="faint">' + esc(u.created) + '</td><td>' + (u.service ? '' : '<button class="btn danger sm" data-mfarm="' + u.upn + '|' + i + '" type="button">Remove</button>') + '</td></tr>'; }).join(''), 'No methods registered. The user can’t complete MFA.')) +
        '<div class="card"><div class="card-b"><dl class="kv"><dt>Password last set</dt><dd>' + esc(u.pwd) + '</dd><dt>Mobile on file</dt><dd class="mono">' + esc(u.phone) + '</dd><dt>Alternate email</dt><dd>None on file</dd>' +
        '<dt>Temporary Access Pass</dt><dd>' + (u.tap ? 'Issued ' + ({mgr:'(delivered to manager)', screen:'(handed over in person)', personal:'(emailed to personal address)'}[u.tap]) : '<span class="faint">None</span>' + (pending || u.service ? '' : ' <button class="link" data-tap="' + u.upn + '" type="button">Issue pass</button>')) + '</dd>' +
        '<dt>Sign-in risk</dt><dd>' + (u.upn==='l.park' ? '<span class="pill warn">Medium</span> <span class="faint">· failed passwords from an unfamiliar location</span>' : '<span class="faint">None</span>') + '</dd></dl></div></div>';
    } else if(S.utab==='mailbox'){
      if(!u.mbx) body = '<div class="card"><div class="card-b faint">No mailbox. A mailbox is created when a license is assigned.</div></div>';
      else body = '<div class="card" style="margin-bottom:14px"><div class="card-b"><dl class="kv"><dt>Mailbox type</dt><dd>' + (u.mbx==='Shared' ? '<b>Shared</b>' : 'User mailbox') + (u.mbxDeleting ? ' <span class="pill act">deletion pending</span>' : u.mbxInactive ? ' <span class="pill en">inactive mailbox, preserved</span>' : '') + '</dd><dt>Address</dt><dd class="mono">' + mail(u.upn) + '</dd><dt>Size</dt><dd>' + (1 + hash(u.upn)%9) + '.' + (hash(u.upn)%10) + ' GB of 50 GB</dd><dt>Automatic reply</dt><dd>' + (u.auto ? esc(u.auto) : '<span class="faint">Off</span>') + '</dd><dt>Full Access</dt><dd>' + (u.delegates.length ? u.delegates.map(function(d){ return esc(U(d).name); }).join(', ') : '<span class="faint">Nobody</span>') + '</dd>' +
        '<dt>Litigation hold</dt><dd>' + (u.hold ? '<span class="pill en">On</span> <span class="mono">' + esc(u.hold.matter) + '</span><div class="faint" style="font-size:12px">Requested by ' + esc(u.hold.by) + '. Everything is preserved, including what the user deletes.</div>' : '<span class="pill dis">Off</span><div class="faint" style="font-size:12px">Nothing is preserved beyond normal retention.</div>') + '</dd></dl>' +
        '<div class="row" style="margin-top:12px">' + (u.mbx!=='Shared' ? '<button class="btn sec sm" data-mbx="' + u.upn + '|shared" type="button">Convert to shared</button>' : '') + '<button class="btn sec sm" data-mbx="' + u.upn + '|delegate" type="button">Grant access</button><button class="btn sec sm" data-mbx="' + u.upn + '|auto" type="button">Set automatic reply</button><button class="btn sec sm' + (u.hold ? '' : ' warnb') + '" data-hold="' + u.upn + '" type="button">' + (u.hold ? 'Remove litigation hold' : 'Place on litigation hold') + '</button></div></div></div>' +
        card('Inbox rules', '<span class="faint" style="font-size:12.5px">Rules the user created in their own mailbox</span>', table(['Rule','Action','Created',''], u.rules.map(function(r,i){ return '<tr><td><b>' + esc(r.name) + '</b></td><td>' + esc(r.action) + (r.ext ? ' <span class="tier privileged">external</span>' : '') + (r.bad ? ' <span class="tier privileged">suspicious</span>' : '') + '</td><td class="mono faint">' + esc(r.created) + '<br>by ' + esc(r.by) + '</td><td><button class="btn danger sm" data-mbx="' + u.upn + '|rule|' + i + '" type="button">Delete</button></td></tr>'; }).join(''), 'No inbox rules.'));
    } else if(S.utab==='onedrive'){
      body = u.od ? '<div class="card"><div class="card-b"><dl class="kv"><dt>Storage used</dt><dd>' + esc(u.od) + ' of 1 TB</dd><dt>URL</dt><dd class="mono faint">meridianfreight-my.example/personal/' + u.upn.replace('.','_') + '</dd><dt>Additional access</dt><dd>' + (u.odAccess.length ? u.odAccess.map(function(d){ return esc(U(d).name); }).join(', ') : '<span class="faint">Nobody</span>') + '</dd><dt>Retention</dt><dd>Deleted 30 days after the account is deleted or unlicensed</dd></dl><div class="row" style="margin-top:12px"><button class="btn sec sm" data-od="' + u.upn + '" type="button">Give manager access</button></div></div></div>' : '<div class="card"><div class="card-b faint">No OneDrive. It’s created at first sign-in after a license is assigned.</div></div>';
    } else if(S.utab==='devices'){
      body = card('Devices', '', table(['Device','Ownership','Compliance','Last check-in','State',''], u.devices.map(function(d,i){ var corp = d.kind==='corp'; return '<tr><td class="mono">' + esc(d.id) + '<div class="faint" style="font-family:var(--sans);font-size:12px">' + esc(d.os) + '</div></td><td>' + (corp ? 'Corporate' : 'Personal') + '</td><td>' + esc(d.comp) + '</td><td class="mono faint">' + esc(d.seen) + '</td><td>' + esc(d.state) + '</td><td><div class="row">' +
        (corp ? '<button class="btn sec sm" data-dev="' + u.upn + '|' + i + '|retire" type="button">Retire</button><button class="btn danger sm" data-dev="' + u.upn + '|' + i + '|wipe" type="button">Wipe</button>' : '<button class="btn sec sm" data-dev="' + u.upn + '|' + i + '|selective" type="button">Selective wipe</button><button class="btn danger sm" type="button" disabled title="Personal device, not enrolled. Only app data can be removed.">Wipe</button>') + '</div></td></tr>'; }).join(''), 'No devices registered.')) +
        '<p class="hint">Personal devices are registered through app protection only. The company can remove its own data from them but can never wipe the device.</p>';
    } else if(S.utab==='signins'){
      body = signinTable(allSignins().filter(function(s){ return s.upn===u.upn; }), false);
    } else body = activityRows('u:' + u.upn);
    return '<div class="crumbs"><button data-nav="users" type="button">Users</button> / ' + esc(u.name) + '</div>' +
      '<div class="uhead"><div class="av">' + initials(u.name) + '</div><div><h1>' + esc(u.name) + '</h1><div class="faint">' + esc(u.title) + ' · ' + esc(u.dept) + ' · ' + statusPill(u.status) + (S.reports[u.upn] ? ' · <span class="pill warn">Security case open</span>' : '') + (u.hold ? ' · <span class="pill en">Litigation hold</span>' : '') + (u.mbxDeleting ? ' · <span class="pill act">Mailbox deleting</span>' : '') + '</div></div></div>' +
      (pending ? '<div class="banner warn"><span><b>This account hasn’t been created yet.</b> HR has a record for this person, but there’s no login.</span></div>' : '') +
      '<div class="row" style="margin-bottom:14px">' + (u.service ? '<span class="faint">Emergency access account. The credential itself is managed in Emergency access, not here.</span><span class="vsep"></span>' +
        '<button class="btn sec" data-toggle="' + u.upn + '" type="button">' + (u.status==='Enabled'?'Disable account':'Enable account') + '</button>' +
        '<button class="btn sec" data-revoke="' + u.upn + '" type="button"' + (u.sessions.length?'':' disabled') + '>Revoke sessions</button>' +
        '<button class="btn sec warnb" data-report="' + u.upn + '" type="button">Report to Security</button>' +
        ((S.bg||[]).some(function(x){ return x.id===u.upn; }) ? '<button class="btn sec" data-nav="bg" type="button">Emergency access →</button>' : '') : actions) + '</div>' +
      '<div class="tabs" role="tablist">' + tabs.map(function(x){ return '<button class="' + (S.utab===x[0]?'on':'') + '" data-utab="' + x[0] + '" type="button" role="tab">' + x[1] + '</button>'; }).join('') + '</div>' + body;
  }
  function pGroups(){
    var rows = D.groups.map(function(g){ return '<tr class="click" data-group="' + g.name + '"><td class="mono">' + g.name + '</td><td>' + esc(g.desc) + '</td><td>' + (g.tier!=='standard'?'<span class="tier ' + g.tier + '">' + g.tier + '</span>':'<span class="faint">standard</span>') + (isDyn(g.name) ? ' <span class="tier">dynamic</span>' : '') + (g.roleAssignable ? ' <span class="tier">role-assignable</span>' : '') + '</td><td>' + (g.source==='AD' ? '<span class="mono" style="font-size:12px">Windows Server AD</span>' : '<span class="faint">Cloud</span>') + '</td><td>' + members(g.name).length + '</td></tr>'; }).join('');
    return '<h1 class="pg">Groups</h1><p class="sub">Access is granted through group membership. Privileged and sensitive groups are marked.</p>' +
      '<div class="card"><div class="tablewrap"><table class="t"><thead><tr><th>Group</th><th>Grants</th><th>Type</th><th>Source</th><th>Members</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
  }
  function pGroup(g){
    var ms = members(g.name), gm = gmeta(g.name), dyn = isDyn(g.name);
    var rows = ms.map(function(u){ var i = -1; u.groups.forEach(function(a,j){ if(a.g===g.name) i=j; }); var a = u.groups[i]; return '<tr><td><button class="link" data-user="' + u.upn + '" type="button">' + esc(u.name) + '</button><div class="faint" style="font-size:12.5px">' + esc(u.title) + ' · ' + esc(u.dept) + '</div></td><td>' + (dyn ? 'Dynamic' : a.type==='tb'?'<span class="tb">⏱ ' + esc(a.exp) + '</span>':'Permanent') + '</td><td>' + statusPill(u.status) + '</td><td>' + (dyn || g.source==='AD' ? '<span class="faint">managed in AD</span>' : '<button class="btn danger sm" data-rm="' + u.upn + '|' + i + '" type="button">Remove</button>') + '</td></tr>'; }).join('');
    var ow = S.owners[g.name].map(function(up){ return '<tr><td><button class="link" data-user="' + up + '" type="button">' + esc(U(up).name) + '</button><div class="faint" style="font-size:12.5px">' + esc(U(up).title) + '</div></td><td><button class="btn danger sm" data-rmown="' + g.name + '|' + up + '" type="button">Remove owner</button></td></tr>'; }).join('');
    var apps = D.apps.filter(function(a){ return a.viaGroup[g.name]; }).map(function(a){ return a.name + ' (' + a.viaGroup[g.name] + ')'; });
    var gtab = S.gtab || 'members';
    return '<div class="crumbs"><button data-nav="groups" type="button">Groups</button> / ' + g.name + '</div>' +
      '<h1 class="pg mono" style="font-family:var(--mono)">' + g.name + '</h1><p class="sub">' + esc(g.desc) + (g.tier!=='standard' ? ' · <span class="tier ' + g.tier + '">' + g.tier + '</span>' : '') + '</p>' +
      (g.roleAssignable ? '<div class="banner warn"><span><b>Role-assignable group.</b> Changing members or owners requires Privileged Role Administrator (P9).</span></div>' : '') +
      (g.source==='AD' ? '<div class="banner warn"><span><b>Synced from Active Directory.</b> Members are managed on-premises and arrive here through directory sync (P12).</span><button class="btn" data-nav="ad" type="button">Open Active Directory</button></div>' : '') +
      '<div class="card" style="margin-bottom:14px"><div class="card-b"><dl class="kv sm cols2"><dt>Object ID</dt><dd class="mono faint">' + guid('g'+g.name) + '</dd><dt>Type</dt><dd>Security · ' + (dyn ? 'Dynamic membership' : 'Assigned membership') + '</dd><dt>Source</dt><dd>' + (g.source==='AD' ? 'Windows Server AD (synced)' : 'Cloud') + '</dd><dt>Business owner</dt><dd>' + esc(g.owner) + '</dd><dt>Created</dt><dd>' + gm[0] + '</dd><dt>Last access review</dt><dd' + (gm[1]==='Never reviewed' ? ' style="color:var(--warn);font-weight:600"' : '') + '>' + gm[1] + '</dd><dt>App access</dt><dd>' + (apps.length ? esc(apps.join(', ')) : '—') + '</dd>' + (dyn ? '<dt>Rule</dt><dd>' + esc(D.dynamic[g.name]) + '</dd>' : '') + '</dl></div></div>' +
      '<div class="tabs"><button type="button" data-gtab="members" class="' + (gtab==='members'?'on':'') + '">Members (' + ms.length + ')</button><button type="button" data-gtab="owners" class="' + (gtab==='owners'?'on':'') + '">Owners (' + S.owners[g.name].length + ')</button><button type="button" data-gtab="activity" class="' + (gtab==='activity'?'on':'') + '">Activity</button></div>' +
      (gtab==='members' ? card('Members', dyn ? '<span class="faint" style="font-size:12.5px">Managed by rule</span>' : g.source==='AD' ? '<button class="btn sec sm" data-nav="ad" type="button">Manage in Active Directory</button>' : '<button class="btn sm" data-addg="' + g.name + '" type="button">Add member</button>', table(['Member','Assignment','Status',''], rows, 'No members.'))
        : gtab==='owners' ? card('Owners', dyn ? '' : '<button class="btn sm" data-addown="' + g.name + '" type="button">Add owner</button>', table(['Owner',''], ow, 'No owners.')) + '<p class="hint">Owners can add and remove members, including themselves, without any admin role.</p>'
        : activityRows('g:' + g.name));
  }
  function pRoles(){
    var rows = D.adminRoles.map(function(r){ var a = allUsers().filter(function(u){ return u.roles.some(function(x){ return x.r===r.name; }); }); var act = a.filter(function(u){ return u.roles.some(function(x){ return x.r===r.name && x.type==='active'; }); }).length; return '<tr class="click" data-role="' + esc(r.name) + '"><td><b>' + esc(r.name) + '</b></td><td>' + esc(r.desc) + '</td><td><span class="tier ' + r.tier + '">' + r.tier + '</span></td><td>' + act + ' active · ' + (a.length-act) + ' eligible</td></tr>'; }).join('');
    return '<h1 class="pg">Admin roles</h1><p class="sub">Directory roles grant administrative rights across the tenant. They’re assigned directly, separately from groups. Changes require Privileged Role Administrator.</p>' +
      '<div class="card"><div class="tablewrap"><table class="t"><thead><tr><th>Role</th><th>Can</th><th>Tier</th><th>Assignments</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
  }
  function pRole(r){
    var rows = []; allUsers().forEach(function(u){ u.roles.forEach(function(x,i){ if(x.r===r.name) rows.push('<tr><td><button class="link" data-user="' + u.upn + '" type="button">' + esc(u.name) + '</button><div class="faint" style="font-size:12.5px">' + esc(u.title) + '</div></td><td>' + (x.type==='active'?'<b>Active</b> · permanent':'Eligible') + '</td><td class="faint">' + esc(x.since) + ' by ' + esc(x.by) + '</td><td>' + (u.service ? '<span class="faint">Break-glass</span>' : '<button class="btn danger sm" data-rmrole="' + u.upn + '|' + i + '" type="button">Remove</button>') + '</td></tr>'); }); });
    return '<div class="crumbs"><button data-nav="roles" type="button">Admin roles</button> / ' + esc(r.name) + '</div><h1 class="pg">' + esc(r.name) + '</h1><p class="sub">' + esc(r.desc) + '</p>' + card('Assignments', '', table(['User','Assignment','Assigned',''], rows.join(''), 'No assignments.'));
  }
  function pApps(){
    var rows = D.apps.map(function(a){ var direct = allUsers().filter(function(u){ return u.apps.some(function(x){ return x.app===a.name; }); }).length; return '<tr class="click" data-app="' + esc(a.name) + '"><td><b>' + esc(a.name) + '</b><div class="faint" style="font-size:12.5px">' + esc(a.desc) + '</div></td><td>' + esc(a.owner) + '</td><td class="mono" style="font-size:12px">' + Object.keys(a.viaGroup).join(', ') + '</td><td>' + direct + '</td></tr>'; }).join('');
    return '<h1 class="pg">Applications</h1><p class="sub">Apps connected to single sign-on. Access comes from a group, or from a role assigned to the user directly.</p><div class="card"><div class="tablewrap"><table class="t"><thead><tr><th>Application</th><th>Owner</th><th>Groups assigned</th><th>Direct assignments</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
  }
  function pApp(a){
    var rows = []; allUsers().forEach(function(u){ u.apps.forEach(function(x,i){ if(x.app===a.name) rows.push('<tr><td><button class="link" data-user="' + u.upn + '" type="button">' + esc(u.name) + '</button><div class="faint" style="font-size:12.5px">' + esc(u.title) + ' · ' + esc(u.dept) + '</div></td><td><b>' + esc(x.role) + '</b></td><td class="faint">' + esc(x.since) + ' by ' + esc(x.by) + '</td><td><button class="btn danger sm" data-rmapp="' + u.upn + '|' + i + '" type="button">Remove</button></td></tr>'); }); });
    var grp = Object.keys(a.viaGroup).map(function(g){ return '<tr><td class="mono">' + g + '</td><td>' + esc(a.viaGroup[g]) + '</td><td>' + members(g).length + ' members</td></tr>'; }).join('');
    var hasSso = !!sso(a), hasScim = !!scim(a);
    var tab = S.apptab || 'access';
    if(tab==='sso' && !hasSso) tab = 'access';
    if(tab==='prov' && !hasScim) tab = 'access';
    var tabs = [['access','Access']];
    if(hasSso) tabs.push(['sso','Single sign-on']);
    if(hasScim) tabs.push(['prov','Provisioning']);
    var canDecom = !!(D.decommission && D.decommission.app === a.name);
    if(canDecom) tabs.push(['decom','Decommission']);
    if(tab==='decom' && !canDecom) tab = 'access';
    var tabbar = tabs.length>1 ? '<div class="chips">' + tabs.map(function(t){ return '<button class="chip' + (tab===t[0]?' on':'') + '" data-apptab="' + t[0] + '" type="button">' + t[1] + '</button>'; }).join('') + '</div>' : '';
    var head = '<div class="crumbs"><button data-nav="apps" type="button">Applications</button> / ' + esc(a.name) + '</div><h1 class="pg">' + esc(a.name) + '</h1><p class="sub">' + esc(a.desc) + ' · Owner: ' + esc(a.owner) + ' · Roles: ' + esc(a.roles.join(', ')) + '</p>' + tabbar;
    if(tab==='sso') return head + ssoCard(a);
    if(tab==='prov') return head + scimCard(a);
    if(tab==='decom') return head + decomCard(a);
    return head +
      card('Group assignments', '', table(['Group','Role','Members'], grp, 'None.')) + card('Direct user assignments', '<span class="faint" style="font-size:12.5px">Not removed by group changes</span>', table(['User','Role','Assigned',''], rows.join(''), 'No direct assignments.'));
  }



  // ---------- training ----------
  // Three things, none of which change what the grader does. A walkthrough for
  // somebody who has never seen the console; a concept library that explains the
  // idea behind the work in the language an interview uses; and hints computed
  // from the checks themselves, so a hint can never drift out of step with the
  // thing it is hinting at.

  var TOUR = [
    { page:'tickets', sel:'.nav',
      title:'This is a console, not a quiz',
      body:'On the left is everything a real hybrid identity estate has: a cloud directory, an on-premises Active Directory, conditional access, a credential vault, reporting. You can open any of it at any time. Nothing here is a menu of right answers.' },
    { page:'tickets', sel:'#tk-list, .tk-list, main',
      title:'The queue is the work',
      body:'Each shift is a day of real tickets. People ask for things, some of which they should not get, and one of them is usually not who they say they are. Tickets arrive while you work, so the queue at 08:00 is not the queue at noon.' },
    { page:'tickets', sel:'[data-ticket]',
      title:'Open one and read it properly',
      body:'A ticket is a person asking for something in their own words. The information you need is spread across the request, the person’s record, the policy and the directory itself — which is the actual skill being tested.' },
    { page:'users', sel:'tr.click, tbody',
      title:'Every identity has two halves',
      body:'Open anybody. Their cloud account and their Active Directory object are shown side by side, and they disagree with each other more often than you would like. That disagreement is the whole problem with hybrid identity, and several shifts turn on it.' },
    { page:'policy', sel:'main, .card',
      title:'There is a written policy',
      body:'It is not decoration. Tickets cite sections of it, the grader expects you to have followed it, and one or two requests are reasonable-sounding things the policy forbids.' },
    { page:'tickets', sel:'#endshift',
      title:'Ending the shift is the point',
      body:'When you end a shift, every step you took — and every one you skipped — comes back as what it cost, three months later, to a named person. That scorecard is the reason this exists. You are meant to end a shift having missed things.' }
  ];

  function tourDone(){ try{ return localStorage.getItem('lp.console.tour') === 'done'; }catch(e){ return false; } }
  function tourFinish(){ try{ localStorage.setItem('lp.console.tour','done'); }catch(e){} S.tour = null; save(); render(); }
  function tourStart(){ S.tour = 0; save(); render(); }
  function tourGo(n){
    if(n < 0 || n >= TOUR.length) return tourFinish();
    S.tour = n;
    var step = TOUR[n];
    if(step.page && S.page !== step.page){ S.page = step.page; S.arg = null; }
    save(); render();
  }
  // Drawn after the page paints, so the ring lands on whatever is actually there.
  function tourPaint(){
    document.querySelectorAll('.tour-ring').forEach(function(x){ x.remove(); });
    var old = document.getElementById('tourpanel'); if(old) old.remove();
    if(S.tour == null || S.screen !== 'console') return;
    var n = S.tour, step = TOUR[n];
    if(!step) return;
    var el = null;
    (step.sel || '').split(',').some(function(s){ el = document.querySelector(s.trim()); return !!el; });
    if(el){
      if(el.getBoundingClientRect().top > window.innerHeight - 120) el.scrollIntoView({block:'center'});
      var r = el.getBoundingClientRect();
      var ring = document.createElement('div');
      ring.className = 'tour-ring';
      ring.style.cssText = 'position:absolute;left:' + (r.left + window.scrollX - 6) + 'px;top:' + (r.top + window.scrollY - 6) +
        'px;width:' + (r.width + 12) + 'px;height:' + (r.height + 12) + 'px;';
      document.body.appendChild(ring);
    }
    var p = document.createElement('div');
    p.className = 'tour-panel'; p.id = 'tourpanel';
    p.setAttribute('role','dialog'); p.setAttribute('aria-label','Walkthrough');
    p.innerHTML = '<div class="tour-n">Step ' + (n+1) + ' of ' + TOUR.length + '</div>' +
      '<h3>' + esc(step.title) + '</h3><p>' + esc(step.body) + '</p>' +
      '<div class="tour-f">' +
        '<button class="btn sec sm" id="tour-skip" type="button">Skip</button>' +
        '<div class="row" style="gap:6px">' +
          (n > 0 ? '<button class="btn sec sm" id="tour-back" type="button">Back</button>' : '') +
          '<button class="btn sm" id="tour-next" type="button">' + (n === TOUR.length-1 ? 'Start the shift' : 'Next') + '</button>' +
        '</div></div>';
    document.body.appendChild(p);
    document.getElementById('tour-skip').onclick = tourFinish;
    document.getElementById('tour-next').onclick = function(){ tourGo(n+1); };
    var b = document.getElementById('tour-back'); if(b) b.onclick = function(){ tourGo(n-1); };
    p.querySelector('h3').focus && p.querySelector('h3').focus();
  }

  // ---- concepts -------------------------------------------------------
  function concepts(){
    if(window.LP_CONCEPTS) return window.LP_CONCEPTS;
    var el = document.getElementById('lp-concepts');
    if(el){ try{ window.LP_CONCEPTS = JSON.parse(el.textContent); return window.LP_CONCEPTS; }catch(e){} }
    return [];
  }
  function conceptBy(id){ return concepts().filter(function(c){ return c.id === id; })[0] || null; }
  function ticketConcepts(t){
    var ids = (t.concepts && t.concepts.length) ? t.concepts : (D.concepts || []);
    return ids.map(conceptBy).filter(Boolean);
  }
  function conceptCard(t){
    var cs = ticketConcepts(t);
    if(!cs.length) return '';
    return '<div class="card" style="margin-top:14px"><div class="card-h"><h3>The concept behind this</h3></div><div class="card-b">' +
      '<p class="hint" style="margin:0 0 10px">What this ticket is really about, and what it is called when somebody asks you about it in an interview.</p>' +
      cs.map(function(c){
        return '<button class="conc" data-concept="' + esc(c.id) + '" type="button"><b>' + esc(c.name) + '</b>' +
          '<span class="faint">' + esc(c.short || '') + '</span></button>';
      }).join('') + '</div></div>';
  }
  function conceptOpen(id){
    var c = conceptBy(id); if(!c) return;
    openModal(c.name,
      '<p>' + esc(c.what) + '</p>' +
      '<h4 class="ch">Why it matters</h4><p>' + esc(c.why) + '</p>' +
      '<h4 class="ch">What goes wrong without it</h4><p>' + esc(c.fail) + '</p>' +
      (c.terms && c.terms.length ? '<h4 class="ch">The words an interviewer will use</h4><div class="chips" style="margin-top:6px">' +
        c.terms.map(function(w){ return '<span class="chip">' + esc(w) + '</span>'; }).join('') + '</div>' : '') +
      (c.shifts && c.shifts.length ? '<p class="hint" style="margin-top:12px">Worked in ' + esc(c.shifts.join(', ')) + '.</p>' : ''),
      null, null);
  }

  // ---- hints ----------------------------------------------------------
  // Computed from the ticket's own checks, so a hint is always exactly as true
  // as the grading is. Three levels: a question, then where to look, then the
  // steps themselves.
  function hintState(id){
    S.hints = S.hints || {};
    if(S.hints[id] == null) S.hints[id] = 0;
    return S.hints[id];
  }
  function unmet(t){
    return (t.checks || []).filter(function(ch){ return !ch.c.every(test); });
  }
  // Where a check lives, worked out from the shape of its condition rather than
  // from anything written by hand.
  function hintArea(ch){
    var c = (ch.c && ch.c[0]) || {};
    if(c.decom) return 'the application being retired, on its Decommission tab';
    if(c.mined || c.role || c.roleFor || c.assigned || c.assignedFor || c.stripped || c.exception) return 'the Role model page';
    if(c.cred || c.safe || c.inSafe || c.rotated || c.unmanagedGone) return 'the Credential vault';
    if(c.ca || c.covers || c.notCovers || c.signInWouldBe) return 'Conditional access';
    if(c.sso || c.entityId || c.acs || c.nameId || c.claim || c.certActive) return 'the application’s Single sign-on tab';
    if(c.scim || c.scope || c.removeOnUnassign || c.noOrphans) return 'the application’s Provisioning tab';
    if(c.hr) return 'the HR feed';
    if(c.guest || c.sponsor || c.collab || c.allowList) return 'External identities';
    if(c.pkg) return 'Access packages';
    if(c.method || c.sspr || c.campaignOn || c.tap) return 'Authentication methods';
    if(c.gpo || c.adOnly || c.adHas || c.adLacks || c.adOu || c.adTemp) return 'Active Directory';
    if(c.share || c.open) return 'File shares';
    if(c.svc || c.gmsa || c.spnNone) return 'Service accounts';
    if(c.krb || c.trust || c.sidFiltering) return 'Active Directory — the trust and Kerberos side';
    if(c.review || c.reviewDone) return 'Access reviews';
    if(c.finding || c.evidence) return 'Audit findings';
    if(c.risk || c.consent || c.revoked) return 'Identity protection and app consents';
    if(c.bg || c.sealed) return 'Emergency access';
    if(c.t) return 'this ticket — how it is answered and closed';
    if(c.u || c.has || c.lacks || c.disabled || c.hold) return 'the person’s own record';
    if(c.g || c.exactly) return 'the group’s membership';
    return 'the directory';
  }
  function hintCard(t){
    var st = S.tickets[t.id];
    if(!st || st.status === 'resolved') return '';
    var lvl = hintState(t.id), left = unmet(t), total = (t.checks||[]).length;
    var body = '<p class="hint" style="margin:0 0 10px">Hints are graded honestly: using them does not change your score, and the scorecard records that you did.</p>';
    if(lvl >= 1){
      body += left.length
        ? '<div class="note" style="margin:0 0 10px"><b>Where you are.</b> ' + left.length + ' of ' + total + ' step' + (total===1?'':'s') + ' on this ticket are still unaccounted for. Re-read what is actually being asked for, and what the policy says about it.</div>'
        : '<div class="note ok" style="margin:0 0 10px"><b>Everything here is done.</b> All ' + total + ' steps are accounted for. You can resolve it.</div>';
    }
    if(lvl >= 2 && left.length){
      var areas = [];
      left.forEach(function(ch){ var a = hintArea(ch); if(areas.indexOf(a) < 0) areas.push(a); });
      if(areas.length > 1) areas = areas.filter(function(a){ return a !== 'the directory'; });
      body += '<div class="note" style="margin:0 0 10px"><b>Where to look.</b> What is left is in ' + esc(areas.join('; ')) + '.</div>';
    }
    if(lvl >= 3 && left.length){
      body += '<div class="note" style="margin:0 0 10px"><b>What is left.</b><ul class="bul" style="margin:8px 0 0">' +
        left.map(function(ch){ return '<li>' + esc(ch.label) + (ch.crit ? ' <span class="pill dis">critical</span>' : '') + '</li>'; }).join('') +
        '</ul></div>';
    }
    var next = lvl >= 3 ? '' :
      '<button class="btn sec sm" data-hint="' + esc(t.id) + '" type="button">' +
      (lvl === 0 ? 'I’m stuck' : lvl === 1 ? 'Where should I look?' : 'Just tell me what’s left') + '</button>';
    return '<div class="card" style="margin-top:14px"><div class="card-h"><h3>Stuck?</h3>' +
      (lvl ? '<span class="faint mono">' + lvl + ' of 3 used</span>' : '') + '</div><div class="card-b">' + body + next + '</div></div>';
  }
  function hintBump(id){
    S.hints = S.hints || {};
    S.hints[id] = Math.min(3, (S.hints[id] || 0) + 1);
    S.hintsUsed = true;
    save(); render();
  }
  function hintsSummary(){
    var h = S.hints || {}, ids = Object.keys(h).filter(function(k){ return h[k] > 0; });
    if(!ids.length) return '';
    var levels = ids.reduce(function(a,k){ return a + h[k]; }, 0);
    return '<p class="hint" style="margin-top:10px">You used ' + levels + ' hint' + (levels===1?'':'s') + ' across ' +
      ids.length + ' ticket' + (ids.length===1?'':'s') + '. That is recorded here rather than deducted, because the point is what you learned, not the number.</p>';
  }

  // ---------- decommissioning an application ----------
  // Retiring an application is the only identity operation whose failure has no
  // symptom. Nothing breaks, nobody complains, and what is left behind is an
  // absence: a trust nobody watches, a group nobody owns, an account with no
  // reason to exist. So this page is mostly a dependency view, and the grading
  // is mostly about order.

  function decomCfg(){ return D.decommission || null; }
  function decomState(n){
    S.decom = S.decom || {};
    if(!S.decom[n]) S.decom[n] = { scanned:false, order:[], groups:{}, people:{}, retired:false, ssoGone:false, scimGone:false, deprovisioned:false, regGone:false, caDone:false, licReclaimed:false };
    return S.decom[n];
  }
  function decomMark(n, step){
    var st = decomState(n);
    if(st.order.indexOf(step) < 0) st.order.push(step);
  }
  function decomBefore(n, a, b){
    var o = decomState(n).order, ia = o.indexOf(a), ib = o.indexOf(b);
    return ia >= 0 && ib >= 0 && ia < ib;
  }
  // Everything that points at this application. The non-obvious half is the
  // point: the group that also grants something else, the person who has
  // nothing else, the policy that will stop matching anything.
  function appDeps(name){
    var a = appBy(name) || {};
    var direct = [], viaGroup = [], sole = [], groups = [], policies = [], regs = [], lic = 0;
    allUsers().forEach(function(u){
      if(u.guest) return;
      var has = (u.apps||[]).some(function(x){ return x.app===name; });
      if(!has) return;
      direct.push(u);
      // "sole access" means: strip this application and the account has no
      // remaining application, no group beyond the all-staff baseline, and no
      // directory role. An account like that exists only for the app.
      var others = (u.apps||[]).filter(function(x){ return x.app!==name; }).length;
      var gs = entsOf(u).filter(function(e){
        if(e.indexOf('APP:' + name + ':')===0) return false;
        if(e === 'GRP-AllStaff') return false;
        return true;
      });
      if(!others && !gs.length) sole.push(u);
    });
    Object.keys(a.viaGroup || {}).forEach(function(g){
      // a group is orphaned by the retirement only if this app was the only
      // thing it granted; the console can see that from the group's own record
      var gg = G(g) || {};
      var onlyThis = !!gg.grantsOnly && gg.grantsOnly === name;
      groups.push({ name:g, role:a.viaGroup[g], members:members(g).length, onlyThis:onlyThis, alsoGrants:gg.alsoGrants || '' });
      viaGroup.push(g);
    });
    (S.ca || []).forEach(function(p){
      var t = (p.apps || '') + ' ' + (p.assignment || '');
      if(t.indexOf(name) >= 0) policies.push(p);
    });
    (S.appRegs || []).forEach(function(r){ if((r.forApp||'') === name) regs.push(r); });
    direct.forEach(function(u){ if(u.lic) lic++; });
    return { app:a, direct:direct, sole:sole, groups:groups, policies:policies, regs:regs, lic:lic,
             sso:sso(name), scim:scim(name) };
  }

  function decomCard(a){
    var cfg = decomCfg();
    var st = decomState(a.name);
    var d = appDeps(a.name);
    if(!st.scanned){
      return card('Decommission', '',
        '<div class="card-b"><p>' + (cfg && cfg.app===a.name
            ? 'This application is scheduled for retirement on <b>' + esc(cfg.date||'') + '</b>.'
            : 'Nothing has been scanned for this application.') + '</p>' +
        '<p class="faint">Switching an application off is not one action. Before anything is removed it is worth knowing what points at it — the trust, the provisioning connector, the groups that grant it, the people who have nothing else, the policies scoped to it, and the registrations that authenticate to it. None of those raise a ticket when they are left behind.</p>' +
        '<div class="row" style="margin-top:14px"><button class="btn" data-decscan="' + esc(a.name) + '" type="button">Find what depends on it</button></div></div>');
    }
    var rows = [];
    var line = function(what, detail, state, action){
      rows.push('<tr><td><b>' + esc(what) + '</b><div class="faint" style="font-size:12.5px">' + detail + '</div></td>' +
        '<td>' + state + '</td><td>' + (action || '') + '</td></tr>');
    };
    line('Federation trust', d.sso ? 'SAML 2.0 · ' + esc((d.sso.entityId||'no entity ID')) : 'No trust configured',
      st.ssoGone ? '<span class="pill en">Removed</span>' : d.sso ? '<span class="pill warn">Live</span>' : '<span class="faint">—</span>',
      (d.sso && !st.ssoGone) ? '<button class="btn sec sm" data-decsso="' + esc(a.name) + '" type="button">Remove the trust</button>' : '');
    line('Provisioning connector', d.scim ? 'SCIM · ' + esc(d.scim.endpoint||'') : 'No connector',
      st.scimGone ? '<span class="pill en">Removed</span>' : st.deprovisioned ? '<span class="pill warn">Users deprovisioned, connector still live</span>' : d.scim ? '<span class="pill warn">Live</span>' : '<span class="faint">—</span>',
      (d.scim && !st.scimGone) ? '<div class="row" style="gap:6px">' +
        (!st.deprovisioned ? '<button class="btn sec sm" data-decdep="' + esc(a.name) + '" type="button">Deprovision the users</button>' : '') +
        '<button class="btn sec sm" data-decconn="' + esc(a.name) + '" type="button">Remove the connector</button></div>' : '');
    d.groups.forEach(function(g){
      var dec = st.groups[g.name];
      line(g.name, g.members + ' members · grants ' + esc(g.role) + (g.alsoGrants ? ' · <b>also grants ' + esc(g.alsoGrants) + '</b>' : ''),
        dec === 'delete' ? '<span class="pill en">Deleted</span>' : dec === 'keep' ? '<span class="pill en">Kept</span>' : '<span class="pill warn">Undecided</span>',
        dec ? '' : '<div class="row" style="gap:6px"><button class="btn sec sm" data-decgrp="' + esc(g.name) + '|keep" type="button">Keep</button>' +
          '<button class="btn sec sm" data-decgrp="' + esc(g.name) + '|delete" type="button">Delete</button></div>');
    });
    d.sole.forEach(function(u){
      var dec = st.people[u.upn];
      line(u.name, esc(u.title||'') + ' · <b>no access left once this application is gone</b>',
        dec === 'disable' ? '<span class="pill en">Disabled</span>' : dec === 'keep' ? '<span class="pill en">Left enabled</span>' : '<span class="pill warn">Undecided</span>',
        dec ? '' : '<div class="row" style="gap:6px"><button class="btn sec sm" data-decper="' + esc(u.upn) + '|keep" type="button">Leave enabled</button>' +
          '<button class="btn sec sm" data-decper="' + esc(u.upn) + '|disable" type="button">Disable</button></div>');
    });
    d.policies.forEach(function(p){
      line('Conditional access · ' + p.name, 'Scoped to this application',
        st.caDone ? '<span class="pill en">Handled</span>' : '<span class="pill warn">Will match nothing</span>',
        st.caDone ? '' : '<button class="btn sec sm" data-decca="' + esc(a.name) + '" type="button">Handle it</button>');
    });
    d.regs.forEach(function(r){
      line('App registration · ' + r.name, (r.secrets||[]).length + ' secret(s) · authenticates to this application',
        st.regGone ? '<span class="pill en">Removed</span>' : '<span class="pill warn">Live</span>',
        st.regGone ? '' : '<button class="btn sec sm" data-decreg="' + esc(a.name) + '" type="button">Remove it</button>');
    });
    if(d.lic) line('Licences', d.lic + ' assigned through this application’s users',
      st.licReclaimed ? '<span class="pill en">Reclaimed</span>' : '<span class="pill warn">Still billing</span>',
      st.licReclaimed ? '' : '<button class="btn sec sm" data-declic="' + esc(a.name) + '" type="button">Reclaim</button>');

    var warn = '';
    if(d.scim && st.scimGone && !st.deprovisioned)
      warn += '<div class="banner bad"><span>The connector was removed before the users were deprovisioned. Every account in the application is now stranded there: the directory can no longer reach it to remove them, and it never will again.</span></div>';
    if(cfg && cfg.retain)
      warn += '<div class="banner warn"><span><b>' + esc(cfg.retain.who) + ':</b> ' + esc(cfg.retain.why) + '</span></div>';

    return card('Decommission', st.retired ? '<span class="pill en">Retired</span>' : '<span class="faint">' + (cfg ? 'Scheduled ' + esc(cfg.date||'') : '') + '</span>',
      '<div class="card-b">' + warn + '</div>' +
      table(['What points at it','State',''], rows.join(''), 'Nothing depends on this application.'));
  }

  function decomScan(n){
    act('Scan application dependencies', n, function(){ decomState(n).scanned = true; decomMark(n,'scan'); },
      'Dependencies found for ' + n,
      { cat:'Application management', detail:'Dependency scan run against ' + n, mins:20 });
  }
  function decomSso(n){
    var s = sso(n);
    openModal('Remove the federation trust',
      '<p>Removes the SAML trust for <b>' + esc(n) + '</b> on this side.</p>' +
      '<div class="banner warn"><span>The other half lives in the application. A reply URL left configured there, on a domain that lapses with the contract, is somebody else’s open redirect later. Confirm with the owner that their side is torn down too.</span></div>' +
      '<label class="fld" for="dx-w">What the application owner confirmed</label><input class="in" id="dx-w" placeholder="Who confirmed their side is being removed">',
      'Remove the trust', function(){
        var w = (document.getElementById('dx-w').value||'').trim();
        if(w.length < 3) return false;
        act('Remove federation trust', n, function(){
          decomState(n).ssoGone = true; decomMark(n,'sso');
          S.sso = S.sso || {}; S.sso[n] = null;
        }, 'Federation trust removed for ' + n,
          { cat:'Application management', detail:n + ' · SAML trust removed · confirmed with ' + w, mins:10 });
      });
  }
  function decomDeprov(n){
    confirmBox('Deprovision the users',
      '<p>Runs the connector one last time to remove every account this directory created in <b>' + esc(n) + '</b>.</p>' +
      impact(['Accounts in the application are removed or disabled according to the connector’s unassignment behaviour.',
              'This has to happen while the connector still exists. Afterwards the directory has no way to reach the application at all.'],
             'This is the step whose order matters. Nothing warns you if you skip it.'),
      'Deprovision', function(){
        act('Deprovision application users', n, function(){
          decomState(n).deprovisioned = true; decomMark(n,'deprovision');
          var s = scim(n); if(s){ s.orphans = []; s.state = 'Deprovisioned'; }
        }, 'Users deprovisioned from ' + n,
          { cat:'Provisioning', detail:n + ' · final deprovisioning cycle run before teardown', mins:25 });
      });
  }
  function decomConn(n){
    var st = decomState(n);
    var body = st.deprovisioned
      ? '<p>The users are already out. Removing the connector now is the tidy-up.</p>'
      : '<p>The users have <b>not</b> been deprovisioned.</p>' +
        '<div class="banner bad"><span>Remove the connector now and every account the directory created in ' + esc(n) + ' stays there, live, for ever. There is no route back: the connector is how the directory reaches the application, and you are about to delete it.</span></div>';
    confirmBox('Remove the provisioning connector', body, 'Remove the connector', function(){
      act('Remove provisioning connector', n, function(){
        decomState(n).scimGone = true; decomMark(n,'connector');
        S.scim = S.scim || {}; S.scim[n] = null;
      }, 'Provisioning connector removed for ' + n,
        { cat:'Provisioning', detail:n + ' · SCIM connector removed', mins:8 });
    }, !st.deprovisioned);
  }
  function decomGroup(key){
    var p = key.split('|'), g = p[0], dec = p[1];
    var gg = G(g) || {};
    var body = dec === 'delete'
      ? '<p>Deletes <b>' + esc(g) + '</b> and everything it grants.</p>' +
        (gg.alsoGrants ? '<div class="banner bad"><span>This group also grants <b>' + esc(gg.alsoGrants) + '</b>. Deleting it takes that away from ' + members(g).length + ' people, and the application being retired has nothing to do with it.</span></div>' : '') +
        '<label class="fld" for="dg-w">Why it can go</label><input class="in" id="dg-w" placeholder="What it granted, and why nothing else needs it">'
      : '<p>Keeps <b>' + esc(g) + '</b>.</p>' +
        '<label class="fld" for="dg-w">Why it stays</label><input class="in" id="dg-w" placeholder="What else it grants">';
    openModal(dec === 'delete' ? 'Delete ' + g : 'Keep ' + g, body, dec === 'delete' ? 'Delete it' : 'Keep it', function(){
      var w = (document.getElementById('dg-w').value||'').trim();
      if(w.length < 3) return false;
      act(dec === 'delete' ? 'Delete group' : 'Keep group', g, function(){
        var n = (decomCfg()||{}).app; decomState(n).groups[g] = dec;
        if(dec === 'delete'){
          D.groups = D.groups.filter(function(x){ return x.name !== g; });
          allUsers().forEach(function(u){
            if(u.ad && u.ad.groups) u.ad.groups = u.ad.groups.filter(function(x){ return (typeof x==='string'?x:x&&x.g) !== g; });
            u.groups = (u.groups||[]).filter(function(x){ return (typeof x==='string'?x:x&&x.g) !== g; });
          });
        }
      }, dec === 'delete' ? g + ' deleted' : g + ' kept',
        { cat:'Group management', detail:g + ' · ' + dec + ' · ' + w, mins:6 });
    });
  }
  function decomPerson(key){
    var p = key.split('|'), upn = p[0], dec = p[1], u = U(upn);
    if(!u) return;
    var body = dec === 'disable'
      ? '<p><b>' + esc(u.name) + '</b> has no access left once ' + esc((decomCfg()||{}).app||'the application') + ' is gone.</p>' +
        '<label class="fld" for="dp-w">Confirmed with</label><input class="in" id="dp-w" placeholder="Who confirmed the account is no longer needed">'
      : '<p>Leaves <b>' + esc(u.name) + '</b> enabled.</p>' +
        '<div class="banner warn"><span>An enabled account with no access and no purpose is a dormant account. It will appear on the reporting page next quarter and somebody will ask about it then.</span></div>' +
        '<label class="fld" for="dp-w">Why it stays</label><input class="in" id="dp-w" placeholder="What this account is still for">';
    openModal(dec === 'disable' ? 'Disable ' + u.name : 'Leave ' + u.name + ' enabled', body, dec === 'disable' ? 'Disable' : 'Leave enabled', function(){
      var w = (document.getElementById('dp-w').value||'').trim();
      if(w.length < 3) return false;
      act(dec === 'disable' ? 'Disable account' : 'Leave account enabled', u.name, function(){
        var n = (decomCfg()||{}).app; decomState(n).people[upn] = dec;
        if(dec === 'disable'){ u.status = 'Disabled'; if(u.ad) u.ad.enabled = false; }
      }, dec === 'disable' ? u.name + ' disabled' : u.name + ' left enabled',
        { cat:'User management', detail:u.name + ' · ' + dec + ' · ' + w, mins:8 });
    }, null, dec === 'keep');
  }
  function decomCA(n){
    confirmBox('Conditional access scoped to ' + n,
      '<p>The policy targets an application that is going away.</p>' +
      impact(['A policy scoped to nothing does not fail — it simply stops applying, silently.',
              'If its controls were the reason something else was safe, that reason has gone with it.']),
      'Retire the policy', function(){
        act('Retire conditional access policy', n, function(){ decomState(n).caDone = true; decomMark(n,'ca'); },
          'Policy retired with the application',
          { cat:'Conditional access', detail:'Policy scoped to ' + n + ' retired alongside it', mins:8 });
      });
  }
  function decomReg(n){
    confirmBox('Remove the app registration',
      '<p>The registration and its secrets exist to authenticate to <b>' + esc(n) + '</b>.</p>' +
      impact(['Left in place, the secret keeps rotating and the registration keeps appearing in reports as something live.',
              'Check nothing else uses it first — a registration created for one application is often borrowed by a second.']),
      'Remove it', function(){
        act('Remove app registration', n, function(){
          decomState(n).regGone = true; decomMark(n,'reg');
          S.appRegs = S.appRegs.filter(function(r){ return (r.forApp||'') !== n; });
        }, 'App registration removed',
          { cat:'Application management', detail:'Registration for ' + n + ' removed with the application', mins:8 });
      });
  }
  function decomLic(n){
    confirmBox('Reclaim the licences',
      '<p>Licences assigned to the people who used <b>' + esc(n) + '</b>.</p>' +
      impact(['Reclaiming what is genuinely unused is the part of a decommission that pays for itself.',
              'Only the licences belonging to accounts with nothing left are reclaimed — people who still work here keep theirs.']),
      'Reclaim', function(){
        act('Reclaim licences', n, function(){ decomState(n).licReclaimed = true; decomMark(n,'lic'); },
          'Unused licences reclaimed',
          { cat:'Licensing', detail:'Licences reclaimed following the retirement of ' + n, mins:10 });
      });
  }

  // ---- Single sign-on -------------------------------------------------
  // A SAML app is four things that must agree with the other side: who we say
  // we are (entity ID), where we send the assertion (ACS), what we call the
  // user (NameID), and the certificate we sign with. Get one wrong and the
  // failure is silent on our side and loud on theirs.
  function ssoCard(a){
    var s = sso(a);
    var cert = s.cert || {};
    var certPill = certExpired(cert) ? '<span class="pill dis">Expired ' + esc(cert.expires||'') + '</span>' : '<span class="pill en">Valid to ' + esc(cert.expires||'') + '</span>';
    var claims = (s.claims||[]).map(function(c){ return '<tr><td class="mono">' + esc(c.name) + '</td><td class="mono faint">' + esc(c.source) + '</td><td>' + (c.required ? '<span class="pill warn">Required by the app</span>' : '<span class="faint">Optional</span>') + '</td><td>' + (c.missing ? '<span class="res bad">Not mapped</span>' : '<span class="res ok">Mapped</span>') + '</td></tr>'; }).join('');
    var urls = '<dl class="kv sm">' +
      '<dt>Protocol</dt><dd>' + esc(s.protocol||'SAML 2.0') + '</dd>' +
      '<dt>Identifier (entity ID)</dt><dd class="mono' + (s.entityId ? '' : ' faint') + '">' + esc(s.entityId || 'not set') + '</dd>' +
      '<dt>Reply URL (ACS)</dt><dd class="mono' + (s.acs ? '' : ' faint') + '">' + esc(s.acs || 'not set') + '</dd>' +
      '<dt>Sign-on URL</dt><dd class="mono' + (s.signOnUrl ? '' : ' faint') + '">' + esc(s.signOnUrl || 'not set') + '</dd>' +
      '<dt>NameID</dt><dd class="mono">' + esc(s.nameId || 'not set') + ' <span class="faint">· ' + esc(s.nameIdFormat||'Persistent') + '</span></dd>' +
      '</dl>';
    var log = (s.tests||[]).map(function(t){ return '<li><span class="mono faint">' + esc(t.t) + '</span> — <span class="res ' + (t.ok?'ok':'bad') + '">' + esc(t.ok?'Success':'Failure') + '</span> ' + esc(t.msg) + '</li>'; }).join('');
    return card('Configuration', '<button class="btn sm" data-ssoedit="' + esc(a.name) + '" type="button">Edit</button>', '<div class="card-b">' + urls + '</div>') +
      card('Attributes and claims', '<button class="btn sec sm" data-ssoclaim="' + esc(a.name) + '" type="button">Add a claim</button>', table(['Claim','Source','','Status'], claims, 'No claims configured. The app will only see the NameID.')) +
      card('Signing certificate', '<button class="btn sm" data-ssocert="' + esc(a.name) + '" type="button">' + (cert.pending ? 'Activate the new certificate' : 'Create a new certificate') + '</button>',
        '<div class="card-b"><dl class="kv sm"><dt>Status</dt><dd>' + certPill + '</dd><dt>Thumbprint</dt><dd class="mono faint">' + esc(cert.thumb||'') + '</dd>' +
        (cert.pending ? '<dt>Pending</dt><dd class="mono faint">' + esc(cert.newThumb||'') + ' — created, not yet active</dd>' : '') +
        '</dl><p class="hint">The app trusts one certificate at a time. Rolling over means giving them the new one <i>before</i> you activate it, or every sign-in fails at their end and nothing on ours looks wrong.</p></div>') +
      card('Test sign-on', '<button class="btn sm" data-ssotest="' + esc(a.name) + '" type="button">Run a test</button>', log ? '<div class="card-b"><ul class="feed">' + log + '</ul></div>' : '<div class="card-b faint">Not tested this shift.</div>');
  }
  function ssoEdit(n){
    var a = appBy(n), s = sso(a);
    openModal('Single sign-on — ' + a.name,
      '<p class="hint">These three values come from the application vendor. They are exact strings: a trailing slash, or http where they said https, is a failed sign-in.</p>' +
      '<label class="fld" for="so-e">Identifier (entity ID)</label><input class="in mono" id="so-e" value="' + esc(s.entityId||'') + '">' +
      '<label class="fld" for="so-a">Reply URL (assertion consumer service)</label><input class="in mono" id="so-a" value="' + esc(s.acs||'') + '">' +
      '<label class="fld" for="so-s">Sign-on URL</label><input class="in mono" id="so-s" value="' + esc(s.signOnUrl||'') + '">' +
      '<label class="fld" for="so-n">NameID</label><select class="in" id="so-n">' +
        ['user.userprincipalname','user.mail','user.employeeid','user.objectid'].map(function(o){ return '<option value="' + o + '"' + (s.nameId===o?' selected':'') + '>' + o + '</option>'; }).join('') + '</select>',
      'Save', function(){
        var ent = document.getElementById('so-e').value.trim(), acs = document.getElementById('so-a').value.trim(),
            son = document.getElementById('so-s').value.trim(), nid = document.getElementById('so-n').value;
        act('Update single sign-on configuration', a.name, function(){ s.entityId = ent; s.acs = acs; s.signOnUrl = son; s.nameId = nid; s.edited = true; },
          'Single sign-on updated for ' + a.name, {cat:'Application management', detail:a.name + ' · entity ID ' + ent + ', reply URL ' + acs + ', NameID ' + nid + '.'});
      });
  }
  function ssoClaim(n){
    var a = appBy(n), s = sso(a);
    var missing = (s.claims||[]).filter(function(c){ return c.missing; });
    var opts = ['user.employeeid','user.department','user.jobtitle','user.mail','user.givenname','user.surname','user.objectid'];
    openModal('Add a claim — ' + a.name,
      (missing.length ? '<p class="hint">' + esc(a.name) + ' is asking for <span class="mono">' + esc(missing.map(function(c){ return c.name; }).join(', ')) + '</span> and is not getting it.</p>' : '') +
      '<label class="fld" for="cl-n">Claim name</label><input class="in mono" id="cl-n" value="' + esc(missing.length ? missing[0].name : '') + '">' +
      '<label class="fld" for="cl-s">Source attribute</label><select class="in" id="cl-s">' + opts.map(function(o){ return '<option value="' + o + '">' + o + '</option>'; }).join('') + '</select>',
      'Add claim', function(){
        var nm = document.getElementById('cl-n').value.trim(), src = document.getElementById('cl-s').value;
        if(!nm) return false;
        act('Add SAML claim', a.name, function(){
          s.claims = s.claims || [];
          var hit = null; s.claims.forEach(function(c){ if(c.name===nm) hit = c; });
          if(hit){ hit.source = src; hit.missing = false; } else s.claims.push({name:nm, source:src, required:false, missing:false});
        }, 'Claim ' + nm + ' mapped', {cat:'Application management', detail:a.name + ' · claim “' + nm + '” now sourced from ' + src + '.'});
      });
  }
  function ssoCert(n){
    var a = appBy(n), s = sso(a), c = s.cert = s.cert || {};
    if(c.pending){
      openModal('Activate the new certificate — ' + a.name,
        '<p>Activating makes <span class="mono">' + esc(c.newThumb||'') + '</span> the signing certificate immediately. Every assertion is signed with it from the next sign-in onwards.</p>' +
        '<p class="hint">Only do this once the application owner confirms they have loaded it. If they have not, you have swapped a certificate that is expiring for one they do not trust.</p>' +
        '<label class="row"><input type="checkbox" id="ct-c"> <span>The application owner has confirmed the new certificate is loaded</span></label>',
        'Activate', function(){
          var confirmed = document.getElementById('ct-c').checked;
          act('Activate signing certificate', a.name, function(){
            c.thumb = c.newThumb; c.expires = c.newExpires || 'in 3 years'; c.expired = false; c.pending = false; c.activated = true; c.activatedBlind = !confirmed;
          }, 'New signing certificate is active', {cat:'Application management', detail:a.name + ' · signing certificate rolled over to ' + c.newThumb + (confirmed ? '. Owner confirmed the certificate was loaded first.' : '. Activated without confirmation from the application owner.')});
        });
      return;
    }
    openModal('New signing certificate — ' + a.name,
      '<p>This creates a second certificate. Nothing changes for the application until you activate it, which is what lets you hand it over first.</p>' +
      '<label class="fld" for="ct-l">Lifetime</label><select class="in" id="ct-l"><option value="1">1 year</option><option value="2">2 years</option><option value="3" selected>3 years</option></select>',
      'Create certificate', function(){
        var yr = document.getElementById('ct-l').value;
        act('Create signing certificate', a.name, function(){
          c.pending = true; c.newThumb = guid('cert'+a.name+S.clock).replace(/-/g,'').slice(0,40).toUpperCase(); c.newExpires = 'in ' + yr + ' years'; c.created = true;
        }, 'Certificate created — not yet active', {cat:'Application management', detail:a.name + ' · new signing certificate created, ' + yr + '-year lifetime. Not active; the current certificate still signs.'});
      });
  }
  // The test is the teaching surface: it names the first thing that is wrong,
  // in the order the protocol actually fails, rather than a generic error.
  function ssoDiagnose(a){
    var s = sso(a), c = s.cert || {}, want = s.expect || {};
    if(!s.entityId) return {ok:false, msg:'No identifier configured. The application cannot tell which identity provider the assertion came from.'};
    if(want.entityId && s.entityId !== want.entityId) return {ok:false, msg:'The application rejected the assertion: the identifier we sent does not match the one it expects.'};
    if(!s.acs) return {ok:false, msg:'No reply URL configured. The assertion has nowhere to go.'};
    if(want.acs && s.acs !== want.acs) return {ok:false, msg:'The reply URL is not one the application accepts. Check it character for character, including the scheme and any trailing slash.'};
    if(certExpired(c)) return {ok:false, msg:'The signing certificate expired on ' + (c.expires||'') + '. The application will not trust an assertion signed with it.'};
    if(c.activatedBlind) return {ok:false, msg:'The application does not trust the certificate we are signing with. It was activated before the owner loaded it.'};
    if(want.nameId && s.nameId !== want.nameId) return {ok:false, msg:'The application cannot match the user: it keys accounts on ' + want.nameId.replace('user.','') + ', and we are sending ' + (s.nameId||'nothing').replace('user.','') + '.'};
    var missing = (s.claims||[]).filter(function(x){ return x.required && x.missing; });
    if(missing.length) return {ok:false, msg:'Signed in, but the application refused the session: it requires the claim ' + missing.map(function(x){ return x.name; }).join(', ') + ' and did not receive it.'};
    return {ok:true, msg:'Assertion accepted. The application matched the user and returned a session.'};
  }
  function ssoTest(n){
    var a = appBy(n), s = sso(a);
    var r = ssoDiagnose(a);
    act('Test single sign-on', a.name, function(){ s.tests = s.tests || []; s.tests.unshift({t:stamp(), ok:r.ok, msg:r.msg}); s.tested = true; if(r.ok) s.working = true; },
      r.ok ? 'Test sign-on succeeded' : 'Test sign-on failed', {cat:'Application management', detail:a.name + ' · test sign-on ' + (r.ok?'succeeded':'failed') + '. ' + r.msg});
  }

  // ---- Provisioning (SCIM) --------------------------------------------
  function scimCard(a){
    var p = scim(a);
    var on = p.state === 'On';
    var map = (p.mapping||[]).map(function(m){ return '<tr><td class="mono">' + esc(m.src) + '</td><td class="mono faint">→ ' + esc(m.dst) + '</td><td>' + (m.matching ? '<span class="pill warn">Matching attribute</span>' : '') + '</td></tr>'; }).join('');
    var log = (p.log||[]).map(function(l){ return '<tr><td class="mono nowrap">' + esc(l.t) + '</td><td>' + esc(l.who) + '</td><td>' + esc(l.action) + '</td><td class="res ' + (/fail|skip/i.test(l.result)?'bad':'ok') + '">' + esc(l.result) + '</td></tr>'; }).join('');
    var orph = (p.orphans||[]).map(function(o){ return '<tr><td>' + esc(o.name) + '</td><td class="mono faint">' + esc(o.id) + '</td><td class="faint">' + esc(o.note||'') + '</td><td><button class="btn danger sm" data-scimdel="' + esc(a.name) + '|' + esc(o.id) + '" type="button">Deprovision</button></td></tr>'; }).join('');
    return card('Provisioning', '<button class="btn sm" data-scimtoggle="' + esc(a.name) + '" type="button">' + (on?'Turn off':'Turn on') + '</button>',
        '<div class="card-b"><dl class="kv sm"><dt>Status</dt><dd>' + (on ? '<span class="pill en">On</span>' : '<span class="pill dis">Off</span>') + '</dd>' +
        '<dt>Tenant URL</dt><dd class="mono' + (p.endpoint?'':' faint') + '">' + esc(p.endpoint || 'not set') + '</dd>' +
        '<dt>Secret token</dt><dd>' + (p.tokenSet ? '<span class="faint">Stored</span>' : '<span class="res bad">Not set</span>') + '</dd>' +
        '<dt>Scope</dt><dd>' + (p.scope==='assigned' ? 'Assigned users and groups only' : '<span style="color:var(--warn);font-weight:600">All users in the directory</span>') + ' <button class="link" data-scimscope="' + esc(a.name) + '" type="button">change</button></dd>' +
        '<dt>On unassignment</dt><dd>' + (p.removeOnUnassign ? 'Disable the account in the application' : '<span style="color:var(--warn);font-weight:600">Leave the account in place</span>') + ' <button class="link" data-scimremove="' + esc(a.name) + '" type="button">change</button></dd>' +
        '</dl><p class="hint">Scope decides who gets an account. Unassignment behaviour decides whether leaving the company actually closes it. They are separate settings and only one of them is about joining.</p></div>') +
      card('Attribute mapping', '', table(['Directory','Application',''], map, 'No mapping configured.')) +
      card('Provision on demand', '<button class="btn sec sm" data-scimrun="' + esc(a.name) + '" type="button">Run a cycle</button>', table(['Time','Identity','Action','Result'], log, 'No provisioning has run.')) +
      ((p.orphans||[]).length ? card('Accounts in the application with no matching identity', '<span class="pill warn">' + (p.orphans||[]).length + '</span>', table(['Name','Application ID','','']  , orph, '')) : '');
  }
  function scimToggle(n){
    var a = appBy(n), p = scim(a);
    if(p.state==='On'){
      openModal('Turn off provisioning — ' + a.name, '<p>Accounts already created in ' + esc(a.name) + ' stay exactly as they are. Nothing is removed, and nothing further is synchronised.</p>', 'Turn off', function(){
        act('Disable provisioning', a.name, function(){ p.state = 'Off'; }, 'Provisioning off for ' + a.name, {cat:'Application management', detail:a.name + ' · SCIM provisioning disabled. Existing accounts untouched.'});
      });
      return;
    }
    openModal('Turn on provisioning — ' + a.name,
      '<p class="hint">The tenant URL and token come from the application. Until both are set, nothing provisions.</p>' +
      '<label class="fld" for="sp-u">Tenant URL</label><input class="in mono" id="sp-u" value="' + esc(p.endpoint||'') + '" placeholder="https://.../scim/v2">' +
      '<label class="fld" for="sp-t">Secret token</label><input class="in mono" id="sp-t" type="password" placeholder="paste the token from the application">' +
      '<label class="fld" for="sp-s">Scope</label><select class="in" id="sp-s"><option value="assigned">Assigned users and groups only</option><option value="all">All users in the directory</option></select>',
      'Turn on', function(){
        var u = document.getElementById('sp-u').value.trim(), t = document.getElementById('sp-t').value.trim(), sc = document.getElementById('sp-s').value;
        if(!u || !t) return false;
        act('Enable provisioning', a.name, function(){ p.state='On'; p.endpoint=u; p.tokenSet=true; p.scope=sc; }, 'Provisioning on for ' + a.name,
          {cat:'Application management', detail:a.name + ' · SCIM provisioning enabled against ' + u + ', scope: ' + (sc==='assigned'?'assigned users and groups':'all users in the directory') + '.'});
      });
  }
  function scimScope(n){
    var a = appBy(n), p = scim(a);
    openModal('Provisioning scope — ' + a.name,
      '<p class="hint">“All users” means everyone in the directory gets an account in ' + esc(a.name) + ', including service accounts and people who have never been assigned it. Licences are usually counted per account.</p>' +
      '<label class="row"><input type="radio" name="ss" id="ss-a" value="assigned"' + (p.scope!=='all'?' checked':'') + '> <span>Assigned users and groups only</span></label>' +
      '<label class="row"><input type="radio" name="ss" id="ss-b" value="all"' + (p.scope==='all'?' checked':'') + '> <span>All users in the directory</span></label>',
      'Save', function(){
        var v = document.getElementById('ss-b').checked ? 'all' : 'assigned';
        act('Change provisioning scope', a.name, function(){ p.scope = v; }, 'Scope updated', {cat:'Application management', detail:a.name + ' · provisioning scope set to ' + (v==='all'?'all users in the directory':'assigned users and groups only') + '.'});
      });
  }
  function scimRemove(n){
    var a = appBy(n), p = scim(a);
    openModal('When someone is unassigned — ' + a.name,
      '<p class="hint">This is the setting that decides whether a leaver actually loses this application. Leaving the account in place is what produces an account nobody owns and nobody reviews.</p>' +
      '<label class="row"><input type="radio" name="sr" id="sr-a"' + (p.removeOnUnassign?' checked':'') + '> <span>Disable the account in the application</span></label>' +
      '<label class="row"><input type="radio" name="sr" id="sr-b"' + (p.removeOnUnassign?'':' checked') + '> <span>Leave the account in place</span></label>',
      'Save', function(){
        var v = document.getElementById('sr-a').checked;
        act('Change unassignment behaviour', a.name, function(){ p.removeOnUnassign = v; }, 'Saved', {cat:'Application management', detail:a.name + ' · on unassignment, accounts are now ' + (v?'disabled in the application':'left in place') + '.'});
      });
  }
  function scimRun(n){
    var a = appBy(n), p = scim(a);
    if(p.state!=='On'){ toast('Provisioning is off for ' + a.name + '.'); return; }
    act('Run provisioning cycle', a.name, function(){
      p.log = p.log || [];
      var scoped = allUsers().filter(function(u){
        if(p.scope==='all') return u.status!=='Deleted';
        return u.apps.some(function(x){ return x.app===a.name; }) || Object.keys(a.viaGroup||{}).some(function(g){ return (u.groups||[]).indexOf(g)>=0; });
      });
      scoped.slice(0,6).forEach(function(u){
        var m = (p.mapping||[]).filter(function(x){ return x.matching; })[0];
        var val = m ? (m.src==='userPrincipalName' ? u.upn : m.src==='employeeId' ? (u.eid||'') : u.name) : u.upn;
        p.log.unshift({t:stamp(), who:u.name, action: u.status==='Disabled' ? (p.removeOnUnassign ? 'Disable' : 'Skip') : 'Create or update',
          result: u.status==='Disabled' && !p.removeOnUnassign ? 'Skipped — unassignment is set to leave the account' : (m && !val ? 'Failed — matching attribute is empty' : 'Success')});
      });
      p.ran = true;
    }, 'Provisioning cycle complete', {cat:'Application management', detail:a.name + ' · on-demand provisioning cycle run.'});
  }
  function scimDeprovision(n, id){
    var a = appBy(n), p = scim(a);
    var o = (p.orphans||[]).filter(function(x){ return x.id===id; })[0]; if(!o) return;
    openModal('Deprovision — ' + o.name, '<p>This closes the account <span class="mono">' + esc(id) + '</span> inside ' + esc(a.name) + '. It has no matching identity in the directory, so nothing here will recreate it.</p>', 'Deprovision', function(){
      act('Deprovision application account', o.name, function(){ p.orphans = p.orphans.filter(function(x){ return x.id!==id; }); p.deprovisioned = (p.deprovisioned||[]).concat([id]); },
        o.name + ' deprovisioned in ' + a.name, {cat:'Application management', detail:a.name + ' · application account ' + id + ' (' + o.name + ') closed. No matching directory identity.'});
    }, null, true);
  }
  function pLicenses(){
    var rows = D.licenses.map(function(l){ var a = licAvail(l.name); return '<tr><td><b>' + esc(l.name) + '</b></td><td>' + (l.total - a) + '</td><td>' + l.total + '</td><td' + (a<3?' style="color:var(--warn);font-weight:600"':'') + '>' + a + '</td></tr>'; }).join('');
    var un = allUsers().filter(function(u){ return u.status==='Disabled' && hasLic(u); }).map(function(u){ return '<li><button class="tlink" data-user="' + u.upn + '" type="button">' + esc(u.name) + '</button> — disabled, still holds ' + esc(u.lic) + '</li>'; }).join('');
    return '<h1 class="pg">Licenses</h1><p class="sub">Seats are bought annually. A seat on a departed account is paid for and never used.</p>' + card('Subscriptions', '', table(['License','Assigned','Purchased','Available'], rows, '')) + (un ? card('Disabled accounts holding licenses', '', '<ul class="feed">' + un + '</ul>') : '');
  }
  function resClass(r){ return /^Success/.test(r) ? 'ok' : /^Interrupted/.test(r) ? 'warn' : 'bad'; }
  function signinTable(list, showUser){
    var rows = list.map(function(s){ var key = s.upn + '|' + s.t + '|' + s.app; return '<tr class="click" data-sid="' + esc(key) + '"><td class="mono nowrap">' + esc(s.t) + '</td>' + (showUser?'<td>' + (U(s.upn) ? '<button class="tlink" data-user="' + s.upn + '" type="button">' + esc(pname(s.upn)) + '</button>' : '<span class="mono">' + esc(pname(s.upn)) + '</span>') + '<div class="mono faint">' + s.upn + '</div></td>':'') + '<td>' + esc(s.app) + '</td><td>' + esc(s.loc) + '<div class="mono faint">' + esc(s.ip) + '</div></td><td class="mono">' + esc(s.dev) + '</td><td>' + esc(s.mfa) + '</td><td class="res ' + resClass(s.res) + '">' + esc(s.res) + '</td></tr>'; }).join('');
    return '<div class="card"><div class="tablewrap"><table class="t"><thead><tr><th>Time</th>' + (showUser?'<th>User</th>':'') + '<th>Resource</th><th>Location / IP</th><th>Device</th><th>MFA</th><th>Result</th></tr></thead><tbody>' + (rows || '<tr><td colspan="7" class="faint">No sign-ins.</td></tr>') + '</tbody></table></div></div><p class="hint">Select a row for full details.</p>';
  }
  function signinDetail(key){
    var s = allSignins().filter(function(x){ return x.upn + '|' + x.t + '|' + x.app === key; })[0]; if(!s) return;
    var managed = /^(MF-|WS-)/.test(s.dev), ok = /^Success/.test(s.res);
    var os = /mac/i.test(s.dev) || /Personal laptop/.test(s.dev) ? 'macOS 14.6 · Safari 17.5' : s.dev==='Unknown' ? 'Linux · python-requests/2.31' : 'Windows 11 · Edge 128';
    if(/legacy/i.test(s.app)) os = 'IMAP client · legacy protocol';
    var method = s.mfa==='Not reached' || s.mfa==='Not supported' ? 'Password (not completed)' : managed && /Windows sign-in/.test(s.app) && !/Temporary/.test(s.mfa) ? 'Windows Hello' : /token/.test(s.mfa) ? 'Refresh token (no interactive auth)' : /Temporary/.test(s.mfa) ? 'Temporary Access Pass' : 'Password + Authenticator push';
    var risk = /185\.220/.test(s.ip) ? '<span class="pill warn">Medium</span> unfamiliar location · anonymizing host' : 'None';
    // the same evaluator the What-If panel uses, so the two can never disagree
    var ev = caEval({upn:s.upn, app:s.app, client:/legacy/i.test(s.app) ? 'legacy' : 'browser',
      mfa: !(s.mfa==='Not reached' || s.mfa==='Not supported'), compliant: managed,
      phishResistant: /key|passkey|hello/i.test(s.mfa||''), anon: /185\.220/.test(s.ip),
      risk: /185\.220/.test(s.ip) ? 'medium' : 'none'});
    var ca = ev.rows.filter(function(r){ return r.applied; }).map(function(r){ return [r.p.id + ' · ' + r.p.name, r.res]; });
    if(!ca.length) ca = [['No policy applied to this sign-in', 'Not applied']];
    var code = ok ? '0' : /legacy/.test(s.res) ? 'AUTH-53003' : /disabled/.test(s.res) ? 'AUTH-50057' : /Denied/.test(s.res) ? 'AUTHZ-403' : 'AUTH-50126';
    var html = '<dl class="kv sm"><dt>Date</dt><dd class="mono">' + esc(s.t) + ':' + pad(hash(key)%60) + '</dd><dt>User</dt><dd>' + esc(pname(s.upn)) + ' <span class="mono faint">' + (U(s.upn) ? mail(s.upn) : s.upn) + '</span></dd>' +
      '<dt>Resource</dt><dd>' + esc(s.app) + '</dd><dt>Status</dt><dd class="res ' + resClass(s.res) + '">' + esc(s.res) + '</dd><dt>Error code</dt><dd class="mono">' + code + '</dd>' +
      '<dt>IP address</dt><dd class="mono">' + esc(s.ip) + '</dd><dt>Location</dt><dd>' + esc(s.loc) + '</dd>' +
      '<dt>Device</dt><dd>' + esc(s.dev) + ' · ' + (managed ? 'Managed, compliant' : 'Not managed') + '</dd><dt>Client</dt><dd class="mono">' + esc(os) + '</dd>' +
      '<dt>Auth method</dt><dd>' + esc(method) + '</dd><dt>MFA result</dt><dd>' + esc(s.mfa) + '</dd><dt>Sign-in risk</dt><dd>' + risk + '</dd>' +
      '<dt>Request ID</dt><dd class="mono faint">' + guid('r'+key) + '</dd><dt>Correlation ID</dt><dd class="mono faint">' + guid('k'+key) + '</dd></dl>' +
      '<div class="k" style="margin-top:14px">Conditional access</div><table class="t"><tbody>' + ca.map(function(c){ return '<tr><td>' + esc(c[0]) + '</td><td class="' + (/Success/.test(c[1])?'res ok':/block|Failure/.test(c[1])?'res bad':'faint') + '">' + esc(c[1]) + '</td></tr>'; }).join('') + '</tbody></table>';
    openModal('Sign-in details', html, null);
    modalEl.querySelector('.modal').classList.add('wide');
  }
  function pSignins(){
    var f = (S.sf||'').toLowerCase(), c = S.sfilt;
    var all = allSignins();
    var list = all.filter(function(s){ return (c==='all' || (c==='ok' ? /^Success/.test(s.res) : !/^Success/.test(s.res))) && (!f || (s.upn+' '+pname(s.upn)+' '+s.app+' '+s.loc+' '+s.dev+' '+s.res+' '+s.ip).toLowerCase().indexOf(f)>=0); });
    var nf = all.filter(function(s){ return !/^Success/.test(s.res); }).length;
    var chips = [['all','All (' + all.length + ')'],['ok','Success (' + (all.length-nf) + ')'],['fail','Failure (' + nf + ')']].map(function(x){ return '<button class="chip' + (c===x[0]?' on':'') + '" data-sc="' + x[0] + '" type="button">' + x[1] + '</button>'; }).join('');
    return '<h1 class="pg">Sign-in logs</h1><p class="sub">Interactive and token sign-ins, last 24 hours · newest first · times in Pacific.</p>' +
      '<div class="row" style="margin-bottom:12px"><input class="in" id="sf" type="search" placeholder="Filter by user, IP, resource, device, or result" value="' + esc(S.sf) + '" style="max-width:380px" aria-label="Filter sign-ins"><div class="chips" style="margin:0">' + chips + '</div></div>' + signinTable(list, true);
  }
  function pAudit(){
    var cat = S.acat || 'all';
    var cats = ['User management','Group management','Role management','Application management','Authentication','Exchange','SharePoint','Device management','License management','Security','Ticketing'];
    var list = S.audit.concat(D.auditSeed).filter(function(a){ return cat==='all' || (cat==='mine' ? a.mine : a.cat===cat); });
    var rows = list.map(function(a){ return '<tr class="click" data-aud="' + (a.mine ? 'm' + S.audit.indexOf(a) : 's' + D.auditSeed.indexOf(a)) + '"><td class="mono nowrap">' + esc(a.tl) + '</td><td class="mono">' + esc(a.actor===ME ? 'ia.analyst' : a.actor.replace('@' + DOM,'')) + '</td><td>' + esc(a.cat) + '</td><td>' + esc(a.action) + '</td><td>' + esc(a.target) + '</td><td class="res ok">Success</td></tr>'; }).join('');
    var chips = [['all','All'],['mine','My changes (' + mine().length + ')']].concat(cats.map(function(c){ return [c,c]; })).map(function(x){ return '<button class="chip' + (cat===x[0]?' on':'') + '" data-ac="' + x[0] + '" type="button">' + x[1] + '</button>'; }).join('');
    return '<h1 class="pg">Audit log</h1><p class="sub">Every directory change, by anyone. This is what an auditor reads.</p><div class="chips">' + chips + '</div>' +
      '<div class="card"><div class="tablewrap"><table class="t"><thead><tr><th>Date</th><th>Initiated by</th><th>Category</th><th>Activity</th><th>Target</th><th>Result</th></tr></thead><tbody>' + (rows || '<tr><td colspan="6" class="faint">No entries.</td></tr>') + '</tbody></table></div></div><p class="hint">Select a row for full details.</p>';
  }
  function auditDetail(k){
    var a = k[0]==='m' ? S.audit[+k.slice(1)] : D.auditSeed[+k.slice(1)]; if(!a) return;
    openModal('Audit entry', '<dl class="kv sm"><dt>Date</dt><dd class="mono">' + esc(a.tl) + '</dd><dt>Initiated by</dt><dd class="mono">' + esc(a.actor) + '</dd><dt>Category</dt><dd>' + esc(a.cat) + '</dd><dt>Activity</dt><dd>' + esc(a.action) + '</dd><dt>Target</dt><dd>' + esc(a.target) + '</dd><dt>Result</dt><dd class="res ok">Success</dd><dt>Detail</dt><dd>' + esc(a.detail || '—') + '</dd><dt>Correlation ID</dt><dd class="mono faint">' + (a.cid || guid('s'+a.tl)) + '</dd>' + (a.mine ? '<dt>Client IP</dt><dd class="mono">10.20.4.77</dd>' : '') + '</dl>', null);
  }
  function pPolicy(){
    return '<h1 class="pg">Access policy</h1><p class="sub">' + esc(D.company) + ' identity &amp; access standard, v3.2 · owner Ravi Shah · last revised Jul 2026.</p>' +
      '<div class="card" style="margin-bottom:14px"><div class="card-b">' + D.policy.map(function(p){ return '<p style="margin:0 0 10px"><b class="mono" style="color:var(--accent);margin-right:8px">' + p[0] + '</b>' + esc(p[1]) + '</p>'; }).join('') + '</div></div>' +
      '<div class="card"><div class="card-h"><h3>Role templates</h3></div><div class="tablewrap"><table class="t"><thead><tr><th>Role</th><th>Baseline groups</th><th>License</th></tr></thead><tbody>' +
      Object.keys(D.roles).map(function(r){ return '<tr><td>' + esc(r) + '</td><td class="mono">' + D.roles[r].join(', ') + '</td><td>' + (r==='Contractor' ? 'Contractor (F3)' : 'Business Standard') + '</td></tr>'; }).join('') + '</tbody></table></div></div>';
  }
  function pRunbooks(){
    return '<h1 class="pg">Runbooks</h1><p class="sub">Team checklists. They tell you what to check. Only the directory tells you what you’ll find.</p>' + Object.keys(D.runbooks).map(function(k){ return card(esc(k), '', '<ol class="rbl">' + D.runbooks[k].map(function(s){ return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>'); }).join('');
  }
  function pMyRoles(){
    return '<h1 class="pg">My roles</h1><p class="sub">Your admin account: <span class="mono">' + ME + '</span>. Standing roles cover daily work. Privileged changes need a just-in-time activation.</p>' +
      card('Role assignments', '', table(['Role','Status',''], MY_ROLES.map(function(r){ return '<tr><td><b>' + esc(r.r) + '</b><div class="faint" style="font-size:12.5px">' + esc(AR(r.r) ? AR(r.r).desc : '') + '</div></td><td>' + (r.type==='active' ? '<span class="pill en">Active</span>' : pimOn() ? '<span class="pill warn">Activated</span> until ' + hhmm(S.pim) : '<span class="pill dis">Eligible</span>') + '<div class="faint" style="font-size:12px">' + esc(r.note) + '</div></td><td>' + (r.type==='eligible' ? (pimOn() ? '<button class="btn sec sm" id="pim-off" type="button">Deactivate</button>' : '<button class="btn sm" id="pim-on" type="button">Activate</button>') : '') + '</td></tr>'; }).join(''), ''));
  }

  function pAD(){
    var f = S.adou || 'all';
    var accts = adAccounts().filter(function(a){ return f==='all' || a.ou===f; });
    var chips = [['all','All OUs']].concat(D.ous.map(function(o){ return [o, o + ' (' + adAccounts().filter(function(a){ return a.ou===o; }).length + ')']; })).map(function(x){ return '<button class="chip' + (f===x[0]?' on':'') + '" data-adou="' + esc(x[0]) + '" type="button">' + esc(x[1]) + '</button>'; }).join('');
    var rows = accts.map(function(a){
      var stale = !/^(Mon|Sun|Sat)/.test(a.last), tgt = a.upn ? 'data-aduser="' + a.upn + '"' : 'data-adobj="' + a.idx + '"';
      return '<tr class="click" ' + tgt + '><td class="mono">' + esc(a.sam) + '<div class="faint" style="font-family:var(--sans)">' + esc(a.name) + '</div></td><td class="mono" style="font-size:12px">' + esc(a.ou) + '</td><td>' + (a.enabled ? '<span class="pill en">Enabled</span>' : '<span class="pill dis">Disabled</span>') + '</td><td class="mono' + (a.pne?' warnt':'') + '">' + esc(a.pwdSet) + (a.pne ? '<div class="faint" style="font-family:var(--sans);color:var(--warn)">never expires</div>' : '') + '</td><td class="mono' + (stale?' warnt':'') + '">' + esc(a.last) + '</td><td class="mono" style="font-size:12px">' + esc(a.groups.join(', ') || '—') + '</td></tr>';
    }).join('');
    var grows = D.adGroups.map(function(g){
      var n = allUsers().filter(function(u){ return onPrem(u) && u.ad.groups.indexOf(g.name)>=0; }).length + S.adOnly.filter(function(o){ return o.groups.indexOf(g.name)>=0; }).length;
      var nested = D.adGroups.filter(function(x){ return x.memberOf===g.name; }).map(function(x){ return x.name; });
      return '<tr><td class="mono">' + esc(g.name) + '<div class="faint" style="font-family:var(--sans);font-size:12.5px">' + esc(g.desc) + '</div></td><td>' + esc(g.scope) + '</td><td>' + (g.synced ? '<span class="pill en">Syncs to cloud</span>' : '<span class="pill dis">On-prem only</span>') + '</td><td>' + n + ' direct' + (nested.length ? '<div class="faint" style="font-size:12px">plus nested: ' + esc(nested.join(', ')) + '</div>' : '') + (g.memberOf ? '<div class="faint" style="font-size:12px">member of ' + esc(g.memberOf) + '</div>' : '') + '</td></tr>';
    }).join('');
    return '<h1 class="pg">Active Directory</h1><p class="sub">On-premises domain <span class="mono">' + esc(D.domainFqdn) + '</span>. Employee accounts and their security groups live here first, then sync to the cloud.</p>' +
      '<div class="health">' + D.dcs.map(function(c){ return '<span><i class="dot ok"></i><span class="mono">' + esc(c.name) + '</span> · ' + esc(c.role) + '</span>'; }).join('') + '</div>' +
      '<div class="chips">' + chips + '</div>' +
      card('Accounts', '<span class="faint" style="font-size:12.5px">Select a row to open the object</span>', table(['Logon name','OU','State','Password set','Last logon','Member of'], rows, 'No accounts in this OU.')) +
      card('Security groups', '', table(['Group','Scope','Sync','Members'], grows, '')) +
      krbCard() + trustCard() +
      card('OU delegation', '<div class="row"><span class="faint" style="font-size:12.5px">Rights written on the OU itself</span><button class="btn sm" id="deleg-add" type="button">Delegate rights</button></div>', table(['OU','Granted to','Rights','Since',''], S.deleg.map(function(x, i){ return '<tr><td class="mono">' + esc(x.ou) + '</td><td>' + (x.kind==='user' ? '<button class="tlink" data-user="' + x.who + '" type="button">' + esc(U(x.who) ? U(x.who).name : x.who) + '</button> <span class="tier privileged">direct user</span>' : '<span class="mono">' + esc(x.who) + '</span>') + (x.note ? '<div class="faint" style="font-size:12px">' + esc(x.note) + '</div>' : '') + '</td><td>' + esc(x.rights) + '</td><td class="faint">' + esc(x.since) + ' by ' + esc(x.by) + '</td><td><button class="btn danger sm" data-deleg="' + i + '" type="button">Remove</button></td></tr>'; }).join(''), 'No delegation.')) +
      card('Domain policy', '', table(['Setting','Value'], D.domainPolicy.map(function(p){ return '<tr><td>' + esc(p[0]) + '</td><td>' + esc(p[1]) + '</td></tr>'; }).join(''), '')) +
      '<p class="hint">A nested group hands its members everything the parent group grants, and a right delegated on an OU stays with the person until someone removes it from the OU. Neither of them shows up in a cloud access review.</p>';
  }
  function pShares(){
    var sel = S.efu || 'd.brooks', su = U(sel);
    var eff = S.shares.map(function(sh){ var r = effective(su, sh); return '<tr><td class="mono">' + esc(sh.path) + '</td><td class="' + (r.n?'res ok':'faint') + '">' + rankName(r.n) + '</td><td class="faint">' + esc(r.why) + '</td></tr>'; }).join('');
    var scan = (S.scan && S.scan.hits && S.scan.hits.length) ? card('Credential scan · ' + esc(S.scan.by || ''), '<span class="faint" style="font-size:12.5px">Last run ' + esc(S.scan.ran || '') + '</span>', table(['Finding','Where','Who can read it',''], S.scan.hits.map(function(h){
      return '<tr' + (h.state==='open' ? ' class="denyrow"' : '') + '><td class="mono" style="font-size:12px">' + esc(h.line) + '<div class="faint" style="font-family:var(--sans)">' + esc(h.since) + '</div></td><td class="mono">' + esc(h.path) + '\\' + esc(h.file) + '</td><td class="faint">' + esc(h.who) + '</td><td>' + (h.state==='open' ? '<button class="btn danger sm" data-quar="' + esc(h.id) + '" type="button">Quarantine</button>' : '<span class="pill en">Quarantined</span>') + '</td></tr>';
    }).join(''), '')) : '';
    return '<h1 class="pg">File shares</h1><p class="sub">Shares on <span class="mono">MF-FS01</span>. What someone can actually open is the lower of the share permission and the NTFS permission, and any Deny beats every allow (P13).</p>' +
      scan + S.shares.map(function(sh){
        var srows = sh.share.map(function(a, i){ return '<tr><td><span class="mono">' + esc(a.p) + '</span></td><td>' + esc(a.rights) + '</td><td class="faint">share level</td><td><button class="btn danger sm" data-ace="' + esc(sh.path) + '|share|' + i + '" type="button">Remove</button></td></tr>'; }).join('');
        var nrows = sh.ntfs.map(function(a, i){
          var who = a.kind==='user' ? '<button class="tlink" data-user="' + a.p + '" type="button">' + esc(U(a.p) ? U(a.p).name : a.p) + '</button> <span class="tier privileged">direct user</span>' : '<span class="mono">' + esc(a.p) + '</span>';
          return '<tr' + (a.deny?' class="denyrow"':'') + '><td>' + who + (a.note ? '<div class="faint" style="font-size:12px">' + esc(a.note) + '</div>' : '') + '</td><td>' + (a.deny ? '<b style="color:var(--bad)">Deny ' + esc(a.rights) + '</b>' : esc(a.rights)) + '</td><td class="faint">' + (a.inherited ? 'inherited' : 'explicit') + ' · ' + esc(a.since) + ' by ' + esc(a.by) + '</td><td>' + (a.inherited ? '<span class="faint">from parent</span>' : '<button class="btn danger sm" data-ace="' + esc(sh.path) + '|ntfs|' + i + '" type="button">Remove</button>') + '</td></tr>';
        }).join('');
        return card('<span class="mono">' + esc(sh.path) + '</span>', '<span class="faint" style="font-size:12.5px">' + esc(sh.desc) + (sh.parent ? ' · inherits from ' + esc(sh.parent) : '') + '</span>',
          '<div class="card-b" style="padding-bottom:0"><div class="k">Share permissions</div></div>' + table(['Principal','Rights','Level',''], srows, 'None.') +
          '<div class="card-b" style="padding-bottom:0"><div class="k">NTFS permissions</div></div>' + table(['Principal','Rights','Source',''], nrows, 'None.'));
      }).join('') +
      card('Effective access', '<select class="in sm" id="efu" style="max-width:220px">' + allUsers().filter(function(u){ return u.status!=='Not created'; }).map(function(u){ return '<option value="' + u.upn + '"' + (u.upn===sel?' selected':'') + '>' + esc(u.name) + '</option>'; }).join('') + '</select>', table(['Share','Effective access','How it works out'], eff, '')) +
      card('Open files and sessions', '<span class="faint" style="font-size:12.5px">Live SMB handles on MF-FS01</span>', table(['File','Opened by','Mode','Since','Client',''], S.openFiles.map(function(f, i){ return '<tr><td class="mono">' + esc(f.path) + '\\' + esc(f.file) + '</td><td><button class="tlink" data-user="' + f.upn + '" type="button">' + esc(U(f.upn).name) + '</button></td><td>' + esc(f.mode) + '</td><td class="mono">' + esc(f.since) + '</td><td class="mono">' + esc(f.client) + '</td><td><button class="btn danger sm" data-close="' + i + '" type="button">Close handle</button></td></tr>'; }).join(''), 'No open files.')) +
      '<p class="hint">Disabling an account doesn’t close a handle that is already open, and a Kerberos ticket issued before the change stays valid for up to 10 hours.</p>';
  }
  function gpoBy(n){ var r = null; (S.gpos||[]).forEach(function(g){ if(g.name===n) r = g; }); return r; }
  function gpoAction(name, kind){
    var g = gpoBy(name); if(!g) return;
    if(kind==='link') return openModal('Link the policy', '<p>Link <b>' + esc(g.name) + '</b> so it applies to the objects underneath.</p>' +
      '<label class="fld" for="gp-l">Link to</label><select class="in" id="gp-l"><option>' + D.domainFqdn + ' (domain)</option>' + D.ous.map(function(o){ return '<option>' + esc(o) + '</option>'; }).join('') + '</select>' +
      '<label class="check"><input type="checkbox" id="gp-e"> Enforced — cannot be overridden by a policy lower down</label>' +
      '<div class="impact"><div class="k">Settings this applies</div>' + g.settings.map(function(s){ return '<p>' + esc(s) + '</p>'; }).join('') + '</div>' +
      '<p class="hint" id="gp-err">A policy that is written but not linked applies to nobody. This is the most common way a control exists on paper and nowhere else.</p>', 'Link policy', function(){
        var to = document.getElementById('gp-l').value, en = document.getElementById('gp-e').checked;
        act('Link group policy', g.name, function(){ g.link = to; g.state = 'linked'; g.enforced = en; }, g.name + ' linked to ' + to, {cat:'Group Policy', detail:'Linked to ' + to + (en ? ', enforced' : '') + '. Settings: ' + g.settings.join('; ')});
      });
    if(kind==='unlink') return confirmBox('Unlink the policy', '<p>Unlink <b>' + esc(g.name) + '</b> from <span class="mono">' + esc(g.link) + '</span>?</p>' + impact(['Everything underneath stops receiving these settings at the next policy refresh.'], ''), 'Unlink', function(){
      act('Unlink group policy', g.name, function(){ g.state = 'draft'; g.link = 'Not linked'; g.enforced = false; }, g.name + ' unlinked', {cat:'Group Policy', detail:'Link removed.'});
    }, true);
  }
  function pGPO(){
    var sel = S.gpu || 't.reyes', su = U(sel);
    var chain = onPrem(su) ? gposFor(su.ad.ou) : [];
    var draft = (S.gpos||[]).some(function(g){ return g.state==='draft'; });
    return '<h1 class="pg">Group Policy</h1><p class="sub">Policies are linked to the domain or to an OU, and they apply to whatever sits underneath. This is why the OU an account lives in matters.</p>' +
      (draft ? '<div class="banner warn"><span><b>A policy is written but not linked.</b> Until it is linked to the domain or an OU it applies to nobody, whatever it says.</span></div>' : '') +
      card('Group policy objects', '', table(['Policy','Linked to','Enforced','Settings',''], (S.gpos||[]).map(function(g){ return '<tr' + (g.state==='draft' ? ' class="denyrow"' : '') + '><td><b>' + esc(g.name) + '</b>' + (g.state==='draft' ? ' <span class="pill act">Not linked</span>' : '') + (g.note ? '<div class="faint" style="font-size:12px">' + esc(g.note) + '</div>' : '') + '</td><td class="mono">' + esc(g.link) + '</td><td>' + (g.enforced ? '<span class="pill warn">Enforced</span>' : '<span class="faint">No</span>') + '</td><td class="faint">' + g.settings.map(esc).join('<br>') + '</td><td>' + (g.state==='draft' ? '<button class="btn sec sm warnb" data-gpo="' + esc(g.name) + '|link" type="button">Link policy</button>' : (g.removable ? '<button class="btn sec sm" data-gpo="' + esc(g.name) + '|unlink" type="button">Unlink</button>' : '')) + '</td></tr>'; }).join(''), '')) +
      card('Resultant policy for a user', '<select class="in sm" id="gpu" style="max-width:220px">' + allUsers().filter(onPrem).map(function(u){ return '<option value="' + u.upn + '"' + (u.upn===sel?' selected':'') + '>' + esc(u.name) + '</option>'; }).join('') + '</select>',
        '<div class="card-b"><p style="margin-top:0">' + esc(su.name) + ' sits in <span class="mono">' + esc(onPrem(su) ? su.ad.ou : '—') + '</span>, so these apply, in order:</p><ol class="rbl">' + chain.map(function(g){ return '<li><b>' + esc(g.name) + '</b> <span class="faint">(' + esc(g.link) + ')</span><br><span class="faint">' + g.settings.map(esc).join(' · ') + '</span></li>'; }).join('') + '</ol></div>');
  }
  function pCA(){
    return '<h1 class="pg">Conditional access</h1><p class="sub">Rules evaluated on every cloud sign-in. Report-only records what a policy would have done without doing it.</p>' +
      (caRisks().length ? card('Before you change anything', '<span class="pill warn">' + caRisks().length + '</span>', '<div class="card-b"><ul class="feed">' + caRisks().map(function(r){ return '<li>' + esc(r.text) + '</li>'; }).join('') + '</ul></div>') : '') +
      card('Policies', '', table(['Policy','Assigned to','Control','State','',''], S.ca.map(function(p){ return '<tr><td><span class="mono">' + esc(p.id) + '</span> ' + esc(p.name) + (p.note ? '<div class="faint" style="font-size:12px">' + esc(p.note) + '</div>' : '') + '</td><td class="faint">' + esc(caScopeText(p)) + '</td><td>' + esc(caControlText(p)) + '</td><td>' + (p.state==='On' ? '<span class="pill en">On</span>' : p.state==='Report-only' ? '<span class="pill warn">Report-only</span>' : '<span class="pill dis">' + esc(p.state) + '</span>') + '</td><td><div class="row" style="gap:6px"><button class="btn sec sm" data-ca="' + esc(p.id) + '" type="button">' + (p.state==='On' ? 'Set report-only' : 'Turn on') + '</button><button class="btn sec sm" data-caedit="' + esc(p.id) + '" type="button">Edit</button></div></td><td></td></tr>'; }).join(''), '')) +
      caWhatIf() +
      (S.authPolicy ? card('Authentication methods policy', '', '<div class="card-b"><p class="hint" style="margin-top:0">' + esc(S.authPolicy.note || '') + '</p><dl class="kv sm">' +
        [['numberMatching','Number matching for push approvals'],['pushLocation','Show the sign-in location in the prompt'],['legacyBlocked','Block legacy authentication']].map(function(k){
          return '<dt>' + k[1] + '</dt><dd>' + (S.authPolicy[k[0]] ? '<span class="pill en">On</span>' : '<span class="pill dis">Off</span>') + ' <button class="link" data-auth="' + k[0] + '" type="button">' + (S.authPolicy[k[0]] ? 'Turn off' : 'Turn on') + '</button></dd>';
        }).join('') + '</dl></div>') : '') +
      '<p class="hint">A policy in report-only protects nobody. A policy turned on without testing locks people out. Both mistakes are common, and both show up in the sign-in logs before anyone complains.</p>';
  }
  function pPS(){
    var lines = S.ps.map(function(l){ return '<div class="' + (l.t==='in'?'pin':l.t==='err'?'err':'') + '">' + esc(l.s) + '</div>'; }).join('');
    var real = DESK && S.psreal;
    var modes = DESK ? '<div class="chips" style="margin-bottom:10px"><button class="chip' + (real?'':' on') + '" data-psmode="sim" type="button">Simulator (MF-DC01)</button><button class="chip' + (real?' on':'') + '" data-psmode="real" type="button">This computer (real PowerShell)</button></div>' : '';
    if(real) return '<h1 class="pg">PowerShell</h1><p class="sub">Running against <b>your own machine</b> (' + esc(window.LPDesktop.platform) + '). Nothing you type here touches the simulation, and nothing here is graded. It’s for practising real syntax and reading real errors.</p>' + modes +
      '<div class="banner warn"><span><b>This is a real shell.</b> Commands run as your Windows or macOS user, with your permissions. Don’t run anything here you wouldn’t run in a terminal.</span></div>' +
      '<div class="term" id="term">' + (lines || '<div class="faint">Connected to the local PowerShell host. Try: Get-Host · Get-Command -Module ActiveDirectory · Get-Help Get-ADUser</div>') + '</div>' +
      '<div class="termin"><span class="mono">PS&gt;</span><input class="in mono" id="psin" autocomplete="off" spellcheck="false" placeholder="Get-Host"></div>' +
      '<p class="hint">If the ActiveDirectory module isn’t installed on this machine, the AD cmdlets won’t exist here. That’s real too — it’s what you’d hit on a fresh workstation.</p>';
    return '<h1 class="pg">PowerShell</h1><p class="sub">Remote session to <span class="mono">MF-DC01</span> · modules loaded: ActiveDirectory, MeridianIdentity. Everything you run here changes the same directory the console shows. Type <span class="mono">help</span> to see what this session supports.</p>' + modes +
      '<div class="term" id="term">' + (lines || '<div class="faint">Windows PowerShell · connected to MF-DC01 as MERIDIAN\\ia.analyst</div>') + '</div>' +
      '<div class="termin"><span class="mono">PS C:\\&gt;</span><input class="in mono" id="psin" autocomplete="off" spellcheck="false" placeholder="Get-ADUser -Filter * | Format-Table"></div>' +
      '<p class="hint">History: ↑ and ↓. Anything you change here lands in the audit log as a PowerShell action, the same way it would at work.</p>';
  }
  function krbReset(){
    var k = S.krb; if(!k) return;
    var n = (k.resets||[]).length;
    if(n >= 2){ openModal('Already reset twice', '<p>The krbtgt password has been reset twice in this window. A third reset now does nothing a fourth would not, and every extra one breaks more replication.</p>', null); return; }
    var body = n === 0
      ? '<p>Reset the password of <span class="mono">krbtgt</span>, the account whose key signs every Kerberos ticket in <span class="mono">' + esc(D.domainFqdn) + '</span>.</p>' +
        impact(['Any forged ticket signed with the current key stops being accepted — but only after the <b>second</b> reset. Active Directory keeps the previous key so that tickets already issued keep working.',
                'Do this while the attacker still holds an account, a service ticket or replication rights, and they simply mint a new one. Containment comes first.'],
               'The second reset must wait for the maximum ticket lifetime to pass, usually ten hours. Resetting twice in a row invalidates every live ticket in the domain at once and takes the business down with it.')
      : '<p>This is the <b>second</b> reset. It retires the key that was current before the first one.</p>' +
        impact(['Every ticket signed with the old key stops working now. A golden ticket forged before the first reset is dead.'],
               'Only correct once the maximum ticket lifetime has passed since the first reset. Earlier than that and you break every session that is legitimately mid-flight.');
    confirmBox(n === 0 ? 'Reset krbtgt (first)' : 'Reset krbtgt (second)', body, n === 0 ? 'Reset krbtgt' : 'Reset krbtgt again', function(){
      act('Reset krbtgt password', 'krbtgt', function(){ k.resets = (k.resets||[]).concat([{at:S.clock}]); }, 'krbtgt password reset (' + (n+1) + ' of 2)', {cat:'Active Directory', mins:4, detail:'krbtgt key rotated on ' + D.dcs[0].name + ' and replicated. Reset ' + (n+1) + ' of the two the procedure requires.'});
    }, n === 1);
  }
  function krbSchedule(){
    var k = S.krb; if(!k) return;
    if(!(k.resets||[]).length){ openModal('Nothing to schedule yet', '<p>Schedule the second reset once the first one has been done. The gap is measured from the first.</p>', null); return; }
    openModal('Schedule the second krbtgt reset', '<p>The second reset must wait for the maximum Kerberos ticket lifetime to pass, so that every ticket signed with the old key has expired on its own.</p>' +
      '<dl class="kv sm"><dt>Maximum ticket lifetime</dt><dd class="mono">' + esc(k.ticketLife || '10 hours') + '</dd><dt>First reset</dt><dd class="mono">' + esc(hhmm(k.resets[0].at)) + '</dd></dl>' +
      '<label class="fld" for="kb-h">Run the second reset in</label><select class="in" id="kb-h"><option value="2">2 hours</option><option value="6">6 hours</option><option value="11" selected>11 hours — after the maximum ticket lifetime</option><option value="24">24 hours</option></select>' +
      '<label class="fld" for="kb-who">Who runs it</label><input class="in" id="kb-who" placeholder="The named person on call for it"><p class="hint" id="kb-e"></p>', 'Schedule', function(){
        var hrs = +document.getElementById('kb-h').value, who = (document.getElementById('kb-who').value||'').trim();
        if(who.length < 3){ document.getElementById('kb-e').textContent = 'Name who is running it. A scheduled task with no owner does not happen.'; return false; }
        if(hrs < 10){ document.getElementById('kb-e').textContent = 'That is inside the maximum ticket lifetime. Every live ticket in the domain would break, and legitimate sessions would drop mid-flight.'; return false; }
        act('Schedule krbtgt second reset', 'krbtgt', function(){ k.scheduled = {at:S.clock + hrs*60, hrs:hrs, who:who}; }, 'Second reset scheduled for ' + who + ' in ' + hrs + ' hours', {cat:'Active Directory', detail:'Second krbtgt reset scheduled ' + hrs + ' hours after the first, owned by ' + who + '.'});
      });
  }
  function krbCard(){
    var k = S.krb; if(!k) return '';
    var n = (k.resets||[]).length;
    return card('Kerberos · <span class="mono">krbtgt</span>', '<span class="faint" style="font-size:12.5px">The account whose key signs every ticket in the domain</span>',
      '<div class="card-b"><dl class="kv sm"><dt>Password last set</dt><dd class="mono' + (n ? '' : ' warnt') + '">' + esc(n ? hhmm(k.resets[n-1].at) + ' today' : (k.last || 'unknown')) + (n ? '' : '<div class="faint" style="font-family:var(--sans);color:var(--warn)">' + esc(k.lastNote || '') + '</div>') + '</dd>' +
      '<dt>Maximum ticket lifetime</dt><dd class="mono">' + esc(k.ticketLife || '10 hours') + '</dd>' +
      '<dt>Resets in this window</dt><dd>' + n + ' of 2' + (n === 1 ? ' <span class="pill warn">second reset still required</span>' : n >= 2 ? ' <span class="pill en">complete</span>' : '') + '</dd>' +
      '<dt>Second reset</dt><dd>' + (k.scheduled ? '<span class="pill en">Scheduled</span> in ' + k.scheduled.hrs + ' hours, run by ' + esc(k.scheduled.who) : '<span class="faint">Not scheduled</span>') + '</dd></dl>' +
      '<div class="row" style="margin-top:12px"><button class="btn sec warnb" id="krb-reset" type="button">Reset krbtgt password</button><button class="btn sec" id="krb-sched" type="button">Schedule the second reset</button></div>' +
      '<p class="hint" style="margin-bottom:0">A forged ticket is signed with the krbtgt key. Resetting once does not invalidate it, because Active Directory still honours the previous key — that is what keeps live sessions working. It takes two resets, separated by the maximum ticket lifetime, and both of them are pointless if the attacker still has a way to ask for a new ticket.</p></div>');
  }
  function spnAction(sam, idx){
    var o = adOnlyBy(sam); if(!o) return;
    var spn = o.spn[idx];
    confirmBox('Remove service principal name', '<p>Remove <span class="mono">' + esc(spn) + '</span> from <span class="mono">' + esc(o.sam) + '</span>?</p>' +
      impact(['Any user in the domain can request a service ticket for an account that has an SPN, and crack it offline at their leisure. No SPN, no ticket to crack.',
              'Anything that genuinely authenticates to this service by name stops working until the SPN is registered somewhere it belongs.'],
             'An SPN on an account with a human-set password is the whole of Kerberoasting.'), 'Remove SPN', function(){
      act('Remove SPN', o.name, function(){ o.spn.splice(idx,1); }, 'Removed ' + spn, {cat:'Active Directory', detail:'setspn -D ' + spn + ' ' + o.sam});
    }, true);
  }
  function gmsaConvert(sam){
    var o = adOnlyBy(sam); if(!o) return;
    confirmBox('Convert to a group managed service account', '<p>Convert <span class="mono">' + esc(o.sam) + '</span> to a gMSA?</p>' +
      impact(['Active Directory generates and rotates a 240-character password every 30 days. Nobody ever knows it, so nobody can type it, store it or crack it.',
              'Only the hosts you authorise can retrieve it. An offline crack of a captured ticket stops being feasible.'],
             'This is the actual fix for a service account with an SPN. Rotating the password by hand buys you until somebody picks a memorable one again.'), 'Convert to gMSA', function(){
      act('Convert to gMSA', o.name, function(){ o.gmsa = true; o.rotated = true; o.pwdSet = 'managed by AD'; }, o.sam + ' converted to a gMSA', {cat:'Active Directory', mins:6, detail:'Account type: user → msDS-GroupManagedServiceAccount. Password generated and rotated by Active Directory every 30 days.'});
    });
  }
  function trustBy(n){ var r = null; (S.trusts||[]).forEach(function(t){ if(t.name===n) r = t; }); return r; }
  function trustAction(name, kind){
    var t = trustBy(name); if(!t) return;
    if(kind==='sid') return confirmBox('Enable SID filtering', '<p>Turn on SID filtering (quarantine) for the trust with <span class="mono">' + esc(t.name) + '</span>?</p>' +
      impact(['SIDs from the other forest that do not belong to it are stripped out of the tokens it sends you.', 'Without it, an administrator on the other side can put your Domain Admins SID into a token and your domain controllers will honour it.'], 'This is the control that makes an incoming trust survivable. It is off by default on a trust created in a hurry.'), 'Enable SID filtering', function(){
        act('Enable SID filtering', t.name, function(){ t.sidFiltering = true; }, 'SID filtering enabled on ' + t.name, {cat:'Active Directory', detail:'netdom trust /quarantine:yes — SID history from ' + t.name + ' is now filtered.'});
      });
    if(kind==='dir') return confirmBox('Change trust direction', '<p>Make the trust with <span class="mono">' + esc(t.name) + '</span> <b>one-way outgoing</b>, so Meridian trusts nothing from the other forest?</p>' +
      impact(['Coastal accounts stop being able to authenticate to Meridian resources.', 'Meridian accounts can still reach Coastal resources for the migration.'], 'A two-way trust during an acquisition means you have inherited every weakness of a directory you have never audited.'), 'Make one-way', function(){
        act('Change trust direction', t.name, function(){ t.direction = 'One-way (outgoing)'; }, t.name + ' is now one-way outgoing', {cat:'Active Directory', detail:'Trust direction: two-way → one-way outgoing.'});
      });
    if(kind==='exp') return openModal('Set a removal date', '<p>A migration trust that nobody ever removes becomes permanent. Record when this one comes down.</p><label class="fld" for="tr-d">Remove by</label><input class="in" id="tr-d" placeholder="e.g. Sep 30, 2027"><p class="hint" id="tr-e"></p>', 'Record', function(){
      var v = (document.getElementById('tr-d').value||'').trim();
      if(v.length < 4){ document.getElementById('tr-e').textContent = 'Put a date on it, or it will still be here in three years.'; return false; }
      act('Set trust removal date', t.name, function(){ t.until = v; }, 'Removal date recorded for ' + t.name, {cat:'Active Directory', detail:'Trust scheduled for removal by ' + v + '.'});
    });
    if(kind==='rm') return confirmBox('Remove the trust', '<p>Delete the forest trust with <span class="mono">' + esc(t.name) + '</span>?</p>' + impact(['Nothing on either side can authenticate across any more.'], 'Correct once the migration is finished. Today it is the thing keeping their file server reachable.'), 'Remove trust', function(){
      act('Remove forest trust', t.name, function(){ S.trusts = S.trusts.filter(function(x){ return x.name!==t.name; }); }, 'Trust with ' + t.name + ' removed', {cat:'Active Directory', detail:'Forest trust deleted.'});
    }, true);
  }
  function trustCard(){
    if(!(S.trusts||[]).length) return '';
    return card('Forest trusts', '<span class="faint" style="font-size:12.5px">Authentication paths into this forest from another one</span>',
      table(['Trust','Direction','Transitivity','SID filtering','Removal date','Actions'], S.trusts.map(function(t){
        return '<tr' + (t.sidFiltering ? '' : ' class="denyrow"') + '><td class="mono">' + esc(t.name) + '<div class="faint" style="font-family:var(--sans);font-size:12px">' + esc(t.note||'') + '</div></td>' +
          '<td>' + esc(t.direction) + '</td><td>' + (t.transitive ? 'Transitive' : 'Non-transitive') + '</td>' +
          '<td>' + (t.sidFiltering ? '<span class="pill en">On</span>' : '<span class="pill act">Off</span>') + '</td>' +
          '<td class="mono faint">' + esc(t.until || '—') + '</td>' +
          '<td><div class="row">' + (t.sidFiltering ? '' : '<button class="btn sec sm warnb" data-trust="' + esc(t.name) + '|sid" type="button">Enable SID filtering</button>') +
          (t.direction.indexOf('One-way')===0 ? '' : '<button class="btn sec sm" data-trust="' + esc(t.name) + '|dir" type="button">Make one-way</button>') +
          '<button class="btn sec sm" data-trust="' + esc(t.name) + '|exp" type="button">Removal date</button>' +
          '<button class="btn danger sm" data-trust="' + esc(t.name) + '|rm" type="button">Remove</button></div></td></tr>';
      }).join(''), '')) +
      '<p class="hint">A trust created for a migration is an authentication path from a directory you did not build and have not audited. SID filtering, direction and an end date are the three things that decide how much of their risk you have taken on.</p>';
  }
  function pSync(){
    var pend = pendingAll(), next = S.sync.last + 30;
    var rows = pend.map(function(u){ return '<tr><td><button class="tlink" data-user="' + u.upn + '" type="button">' + esc(u.name) + '</button><div class="mono faint">' + esc(u.ad.sam) + '</div></td><td>' + esc(pendingFor(u).join(', ')) + '</td><td class="faint">' + (u.status==='Not created' ? 'New object, not yet in the cloud' : 'Waiting for the next cycle') + '</td></tr>'; }).join('');
    return '<h1 class="pg">Directory sync</h1><p class="sub">Connector <span class="mono">MF-AADC01</span> · scope: Corp Users and Contractors OUs · delta cycle every 30 minutes.</p>' +
      '<div class="tiles"><div class="tile"><div class="n">' + pend.length + '</div><div class="l">Objects waiting to sync</div></div><div class="tile"><div class="n mono" style="font-size:20px">' + fmt(S.sync.last) + '</div><div class="l">Last successful cycle</div></div><div class="tile"><div class="n mono" style="font-size:20px">' + fmt(next) + '</div><div class="l">Next scheduled cycle</div></div><div class="tile"><div class="n">0</div><div class="l">Sync errors</div></div></div>' +
      '<div class="row" style="margin-bottom:14px"><button class="btn" id="sync-now" type="button">Run sync now</button><span class="hint" style="margin:0">Same as starting a delta cycle on the sync server.</span></div>' +
      card('Pending changes', '', table(['Object','Attributes','Status'], rows, 'Nothing waiting. The cloud matches Active Directory.')) +
      '<p class="hint">Cloud-only objects — the dynamic all-staff group, cloud admin roles, licenses, mailboxes, MFA methods and the contractor account — are never touched by this connector.</p>';
  }

  function pReview(){
    if(!D.review) return '<h1 class="pg">Access reviews</h1><p class="sub">No review campaign is open in this scenario.</p>';
    var its = reviewItems(), done = its.filter(function(it){ return S.review.items[reviewKey(it)]; }).length;
    var rows = its.map(function(it){
      var dec = S.review.items[reviewKey(it)];
      return '<tr><td>' + (it.upn ? '<button class="tlink" data-user="' + it.upn + '" type="button">' + esc(it.name) + '</button>' : '<span class="mono">' + esc(it.id) + '</span>') + '<div class="faint" style="font-size:12.5px">' + esc(it.title || '') + '</div></td>' +
        '<td class="mono">' + esc(it.g) + '</td><td class="faint">' + esc(it.why || '') + '</td><td class="mono faint">' + esc(it.last || '—') + '</td>' +
        '<td>' + (dec ? (dec.d==='revoke' ? '<span class="pill act">Revoked</span>' : '<span class="pill en">Certified</span>') + '<div class="faint" style="font-size:12px">' + esc(dec.why) + '</div>' : '<span class="pill open">Undecided</span>') + '</td>' +
        '<td>' + (S.review.submitted!=null ? '<span class="faint">locked</span>' : '<button class="btn sec sm" data-rev="' + esc(reviewKey(it)) + '" type="button">' + (dec ? 'Change' : 'Decide') + '</button>') + '</td></tr>';
    }).join('');
    var sod = sodHits().map(function(h){ return '<tr><td><button class="tlink" data-user="' + h.u.upn + '" type="button">' + esc(h.u.name) + '</button><div class="faint" style="font-size:12.5px">' + esc(h.u.title) + '</div></td><td>' + esc(h.r.name) + '</td><td class="faint">' + esc(h.r.why) + '</td></tr>'; }).join('');
    return '<h1 class="pg">Access reviews</h1><p class="sub">' + esc(D.review.title) + ' · <span class="mono">' + esc(D.review.id) + '</span> · due ' + esc(D.review.due) + '</p>' +
      (S.review.submitted!=null ? '<div class="banner info"><span><b>Submitted ' + esc(fmt(S.review.submitted)) + '.</b> The campaign is closed and can be attached to a finding as evidence.</span><button class="btn" data-nav="findings" type="button">Audit findings</button></div>'
        : '<div class="banner ' + (done===its.length ? 'info' : 'warn') + '"><span><b>' + done + ' of ' + its.length + ' decided.</b> ' + esc(D.review.note) + '</span><button class="btn" id="rev-submit" type="button"' + (done===its.length ? '' : ' disabled') + '>Submit review</button></div>') +
      card('Members in scope', '', table(['Member','Group','Why they have it','Last sign-in','Decision',''], rows, 'Nothing in scope.')) +
      card('Segregation of duties', '<span class="faint" style="font-size:12.5px">Rule conflicts found in the current access</span>', table(['Person','Conflict','Why it matters'], sod, 'No conflicts found.'));
  }
  function pFindings(){
    if(!D.findings) return '<h1 class="pg">Audit findings</h1><p class="sub">No audit is open in this scenario.</p>';
    return '<h1 class="pg">Audit findings</h1><p class="sub">Findings issued by Halvorsen &amp; Wu. A finding closes when the access is fixed <i>and</i> evidence is attached.</p>' +
      D.findings.map(function(f){
        var ev = evidenceOf(f.id), st = S.tickets[f.ticket], pool = evidencePool();
        var names = ev.map(function(k){ var p = pool.filter(function(x){ return x.k===k; })[0]; return p ? p.label : k; });
        return card('<span class="mono">' + esc(f.id) + '</span> · ' + esc(f.title),
          (st ? (st.status==='resolved' ? '<span class="pill res">Ticket resolved</span>' : '<span class="pill open">Ticket open</span>') : ''),
          '<div class="card-b"><p style="margin-top:0">' + esc(f.text) + '</p>' +
          '<dl class="kv sm"><dt>Ticket</dt><dd>' + (st ? '<button class="tlink" data-ticket="' + f.ticket + '" type="button">' + f.ticket + '</button>' : '—') + '</dd>' +
          '<dt>Evidence</dt><dd>' + (names.length ? names.map(function(n){ return '<div>' + esc(n) + '</div>'; }).join('') : '<span class="faint">Nothing attached</span>') + '</dd></dl>' +
          '<div class="row" style="margin-top:10px"><button class="btn sec sm" data-attach="' + esc(f.id) + '" type="button">Attach evidence</button></div></div>');
      }).join('');
  }
  function spnRows(o){
    if(typeof o.spn === 'string') o.spn = o.spn && o.spn !== '—' ? [o.spn] : [];
    if(!o.spn || !o.spn.length) return o.gmsa ? '<p class="hint" style="margin-top:0">Group managed service account. Active Directory generates and rotates the password; nobody has ever seen it.</p>' : '';
    return card('Service principal names', '<span class="faint" style="font-size:12.5px">Any domain user can request a ticket for these</span>',
      table(['SPN','Password age','Risk',''], o.spn.map(function(s, i){
        return '<tr class="denyrow"><td class="mono">' + esc(s) + '</td><td class="mono">' + esc(o.pwdSet || '—') + '</td>' +
          '<td>' + (o.gmsa ? '<span class="pill en">Managed password</span>' : '<span class="pill act">Crackable offline</span>') + '</td>' +
          '<td><button class="btn sec sm" data-spn="' + esc(o.sam) + '|' + i + '" type="button">Remove SPN</button></td></tr>';
      }).join(''), '')) +
      (o.gmsa ? '' : '<div class="row" style="margin:-4px 0 14px"><button class="btn sec sm warnb" data-gmsa="' + esc(o.sam) + '" type="button">Convert to a gMSA</button><span class="hint" style="margin:0">Hands the password to Active Directory so no person ever holds it.</span></div>');
  }
  function pSvc(){
    var list = svcList();
    return '<h1 class="pg">Service accounts</h1><p class="sub">The accounts that run jobs. Every one should have an owner, no interactive logon, and a known list of what stores its password.</p>' +
      list.map(function(o){
        var jobs = (o.runsOn||[]).map(function(j, i){
          return '<tr><td class="mono">' + esc(j.host) + '</td><td>' + esc(j.name) + '<div class="faint" style="font-size:12px">' + esc(j.kind) + ' · ' + esc(j.note||'') + (j.essential ? ' <span class="tier privileged">essential</span>' : '') + '</div></td>' +
            '<td>' + (j.cred==='current' ? '<span class="pill en">Current</span>' : '<span class="pill act">Stale copy</span>') + '</td>' +
            '<td>' + (j.enabled ? '<span class="pill en">Enabled</span>' : '<span class="pill dis">Disabled</span>') + '<div class="mono faint" style="font-size:12px">' + esc(j.last||'') + '</div></td>' +
            '<td><div class="row">' + (j.cred==='current' ? '' : '<button class="btn sec sm" data-job="' + o.sam + '|' + i + '|update" type="button">Update credential</button>') +
            (j.enabled ? '<button class="btn danger sm" data-job="' + o.sam + '|' + i + '|disable" type="button">Disable</button>' : '<button class="btn sec sm" data-job="' + o.sam + '|' + i + '|enable" type="button">Enable</button>') + '</div></td></tr>';
        }).join('');
        return card('<span class="mono">' + esc(o.sam) + '</span>' + (o.locked ? ' <span class="pill warn">Locked out</span>' : ''), '<div class="row">' +
            (o.locked ? '<button class="btn sm" data-svcunlock="' + o.sam + '" type="button">Unlock</button>' : '') +
            '<button class="btn sec sm" data-svcowner="' + o.sam + '" type="button">' + (o.owner ? 'Change owner' : 'Set owner') + '</button>' +
            (o.interactive ? '<button class="btn sec sm" data-svcint="' + o.sam + '" type="button">Deny interactive logon</button>' : '') +
            '<button class="btn sec sm" data-svcrot="' + o.sam + '" type="button">Rotate credential</button>' +
            '<button class="btn sec warnb sm" data-reportobj="' + o.sam + '" type="button">Report to Security</button></div>',
          '<div class="card-b"><div class="cols"><dl class="kv sm"><dt>Purpose</dt><dd>' + esc(o.desc) + '</dd><dt>Owner</dt><dd>' + (o.owner ? esc(U(o.owner) ? U(o.owner).name : o.owner) : '<b style="color:var(--warn)">Nobody</b>') + '</dd><dt>Groups</dt><dd class="mono">' + esc((o.groups||[]).join(', ') || '—') + '</dd></dl>' +
          '<dl class="kv sm"><dt>Password set</dt><dd>' + esc(o.pwdSet) + (o.pwdNeverExpires ? ' <span class="pill warn">never expires</span>' : '') + '</dd><dt>Interactive logon</dt><dd>' + (o.interactive ? '<span class="pill warn">Allowed</span>' : '<span class="pill en">Denied</span>') + '</dd><dt>Bad passwords</dt><dd>' + (o.badPwd || 0) + '</dd><dt>SPN</dt><dd class="mono" style="font-size:12px">' + esc(o.spn ? (typeof o.spn === 'string' ? o.spn : (o.spn.join(', ') || '—')) : '—') + '</dd></dl></div></div>' +
          table(['Host','Job','Stored credential','State',''], jobs, 'Nothing recorded as running on this account.')) + spnRows(o);
      }).join('') +
      '<p class="hint">Rotating a credential marks every stored copy stale. That list is the difference between a rotation and an outage.</p>';
  }
  function pAppRegs(){
    return '<h1 class="pg">App registrations</h1><p class="sub">Machine-to-machine integrations. Each one authenticates with a secret that expires, whether or not anyone is watching the calendar.</p>' +
      S.appRegs.map(function(a){
        var rows = a.secrets.map(function(s){
          return '<tr' + (s.expiring && s.state==='active' ? ' class="denyrow"' : '') + '><td>' + esc(s.name) + (s.isNew ? ' <span class="tier">new</span>' : '') + '</td><td class="faint">' + esc(s.created) + '</td><td>' + (s.expiring && s.state==='active' ? '<b style="color:var(--bad)">' + esc(s.expires) + '</b>' : esc(s.expires)) + '</td><td class="mono faint">' + esc(s.lastUsed) + '</td><td>' + (s.state==='active' ? '<span class="pill en">Active</span>' : '<span class="pill dis">Revoked</span>') + '</td><td>' + (s.state==='active' ? '<button class="btn danger sm" data-secrev="' + a.id + '|' + s.id + '" type="button">Revoke</button>' : '') + '</td></tr>';
        }).join('');
        var own = a.owners.map(function(o){ var u = U(o); return (u ? esc(u.name) : esc(o)) + (u && u.status!=='Enabled' ? ' <span class="pill dis">' + esc(u.status) + '</span>' : ''); }).join(', ') || '<b style="color:var(--warn)">Nobody</b>';
        return card(esc(a.name), '<div class="row"><button class="btn sm" data-secadd="' + a.id + '" type="button">Add secret</button><button class="btn sec sm" data-regown="' + a.id + '" type="button">Owners</button></div>',
          '<div class="card-b"><dl class="kv sm"><dt>Purpose</dt><dd>' + esc(a.purpose) + '</dd><dt>Client ID</dt><dd class="mono faint">' + esc(a.clientId) + '</dd><dt>Owners</dt><dd>' + own + '</dd><dt>Permissions</dt><dd class="mono" style="font-size:12px">' + esc(a.perms.join(', ')) + '</dd></dl></div>' +
          table(['Secret','Created','Expires','Last used','State',''], rows, 'No secrets.'));
      }).join('') +
      '<p class="hint">Add the new secret, let the owner cut over, then revoke the old one. Revoking first is the same outage you were trying to prevent, just earlier.</p>';
  }
  function pRisk(){
    var byUser = {};
    S.risk.forEach(function(r){ (byUser[r.upn] = byUser[r.upn] || []).push(r); });
    var cards = Object.keys(byUser).map(function(upn){
      var u = U(upn), rs = byUser[upn], st = riskState(upn);
      var rows = rs.map(function(r){ return '<tr><td class="mono nowrap">' + esc(r.t) + '</td><td><b>' + esc(r.type) + '</b><div class="faint" style="font-size:12.5px">' + esc(r.detail) + '</div></td><td>' + (r.level==='High' ? '<span class="pill act">High</span>' : r.level==='Medium' ? '<span class="pill warn">Medium</span>' : '<span class="pill">Low</span>') + '</td><td>' + (r.state==='atRisk' ? '<span class="pill open">At risk</span>' : r.state==='confirmed' ? '<span class="pill act">Confirmed compromised</span>' : '<span class="pill en">Dismissed</span>') + (r.why ? '<div class="faint" style="font-size:12px">' + esc(r.why) + '</div>' : '') + '</td></tr>'; }).join('');
      return card('<button class="tlink" data-user="' + upn + '" type="button">' + esc(u.name) + '</button> <span class="faint">' + esc(u.title) + '</span>',
        '<div class="row">' + (st==='atRisk' ? '<button class="btn sec sm" data-risk="' + upn + '|confirmed" type="button">Confirm compromised</button><button class="btn sec sm" data-risk="' + upn + '|dismissed" type="button">Dismiss risk</button>' : '<span class="faint">' + (st==='confirmed' ? 'Confirmed compromised' : 'Dismissed') + '</span>') + '</div>',
        table(['Detected','Detection','Level','State'], rows, ''));
    }).join('');
    return '<h1 class="pg">Identity protection</h1><p class="sub">Detections raised against accounts. A detection is a signal, not a verdict — the sign-in record behind it is where the answer is.</p>' + cards +
      '<p class="hint">Confirming a compromise feeds the risk model and tells Security this was real. Dismissing one records why it wasn’t, so the next analyst doesn’t investigate it again.</p>';
  }

  // ---------- break-glass / emergency access ----------
  function bgBy(id){ var r = null; (S.bg||[]).forEach(function(x){ if(x.id===id) r = x; }); return r; }
  function bgInUse(){ return (S.bg||[]).filter(function(x){ return x.inUse; }); }
  function bgState(a){
    if(a.compromised && !a.rotatedAt) return ['bad','Credential exposed'];
    if(a.inUse) return ['act','In use — seal broken'];
    if(!a.sealed) return ['warn','Seal broken, not re-sealed'];
    return ['en','Sealed'];
  }
  function bgLine(a){
    var p = [];
    if(a.authBy) p.push('Authorized by ' + a.authBy + ' at ' + hhmm(a.authAt));
    if(a.usedAt!=null) p.push('Seal broken at ' + hhmm(a.usedAt));
    if(a.signedOutAt!=null) p.push('Signed out at ' + hhmm(a.signedOutAt));
    if(a.rotatedAt!=null) p.push('Credentials rotated at ' + hhmm(a.rotatedAt));
    if(a.sealedAt!=null) p.push('Re-sealed at ' + hhmm(a.sealedAt));
    return p.join(' · ');
  }
  function pBreakGlass(){
    var rows = (S.bg||[]).map(function(a){
      var st = bgState(a), open = a.inUse ? (S.clock - a.usedAt) : 0;
      return '<tr><td><span class="mono">' + esc(a.id) + '</span><div class="faint" style="font-size:12.5px">' + esc(a.desc) + '</div></td>' +
        '<td class="mono faint">' + esc(a.safe) + '<div class="faint" style="font-size:12px">seal ' + esc(a.seal) + '</div></td>' +
        '<td><span class="pill ' + st[0] + '">' + st[1] + '</span>' + (a.inUse ? '<div class="tb">open ' + dur(open) + '</div>' : '') + (bgLine(a) ? '<div class="faint" style="font-size:12px">' + esc(bgLine(a)) + '</div>' : '') + '</td>' +
        '<td class="mono faint nowrap">' + esc(a.lastTest || '—') + '</td>' +
        '<td><div class="row">' +
          (a.authBy ? '' : '<button class="btn sec sm" data-bg="' + esc(a.id) + '|auth" type="button">Get authorization</button>') +
          (a.inUse ? '' : '<button class="btn sec sm warnb" data-bg="' + esc(a.id) + '|use" type="button">Break seal and sign in</button>') +
          (a.inUse ? '<button class="btn sec sm" data-bg="' + esc(a.id) + '|out" type="button">Sign out</button>' : '') +
          '<button class="btn sec sm" data-bg="' + esc(a.id) + '|rot" type="button">Rotate credentials</button>' +
          (a.sealed ? '' : '<button class="btn sec sm" data-bg="' + esc(a.id) + '|seal" type="button">Re-seal</button>') +
          '<button class="btn sec sm" data-bg="' + esc(a.id) + '|rep" type="button">' + (S.reports['bg:'+a.id] ? 'Use report filed' : 'File use report') + '</button>' +
        '</div></td></tr>';
    }).join('');
    var log = (S.bgLog||[]).map(function(l){ return '<li><span class="mono faint">' + esc(hhmm(l.at)) + '</span> · <b>' + esc(l.id) + '</b> · ' + esc(l.what) + (l.why ? '<div class="faint">“' + esc(l.why) + '”</div>' : '') + '</li>'; }).join('');
    return '<h1 class="pg">Emergency access</h1><p class="sub">Break-glass accounts. Excluded from every conditional access policy on purpose, so a bad policy can never lock everyone out. Credentials live in the safe, sealed, and every use is authorized, logged, rotated and reported (P16, P17).</p>' +
      (bgInUse().length ? '<div class="banner warn"><span><b>An emergency account is signed in.</b> Do the one thing the incident needs, then sign out, rotate the credentials and re-seal. Everything it touches is attributed to a shared account, not to you.</span></div>' : '') +
      card('Accounts', '', table(['Account','Stored','State','Last quarterly test','Actions'], rows, 'No emergency access accounts in this tenant.')) +
      card('Break-glass log', '', log ? '<div class="card-b"><ul class="feed" style="padding:0">' + log + '</ul></div>' : '<div class="card-b faint">Nothing yet. Every authorization, sign-in, rotation and re-seal is written here.</div>') +
      '<p class="hint">Using break-glass is not a mistake. Using it without authorization, using it for anything beyond the incident, or leaving it signed in and un-rotated afterwards — those are the mistakes an auditor finds.</p>';
  }
  function bgLogAdd(id, what, why){ S.bgLog.unshift({at:S.clock, id:id, what:what, why:why||''}); }
  function bgAction(id, kind){
    var a = bgBy(id); if(!a) return;
    if(kind==='auth') return openModal('Authorization to use ' + a.id,
      '<p>Break-glass use needs a named authorization before the seal is broken (P16). Call the on-call manager or the CISO on the number in the runbook — not a number from an email.</p>' +
      '<label class="fld" for="bg-who">Who authorized it</label><select class="in" id="bg-who"><option value="">Choose…</option>' + (D.bgApprovers||[]).map(function(x){ return '<option value="' + esc(x.name) + '">' + esc(x.name) + ' — ' + esc(x.role) + ' (' + esc(x.how) + ')</option>'; }).join('') + '</select>' +
      '<label class="fld" for="bg-t">Incident ticket</label><input class="in mono" id="bg-t" placeholder="BG-5001">' +
      '<label class="fld" for="bg-why">What the account is needed for</label><textarea class="in" id="bg-why" placeholder="The one change it will make, and why no ordinary admin account can make it."></textarea><p class="hint" id="bg-err"></p>', 'Record authorization', function(){
        var who = document.getElementById('bg-who').value, t = document.getElementById('bg-t').value.trim(), why = document.getElementById('bg-why').value.trim();
        var err = document.getElementById('bg-err');
        if(!who){ err.textContent = 'Choose who authorized it.'; return false; }
        if(!/^[A-Z]{2}-\d{3,5}$/i.test(t)){ err.textContent = 'Enter the incident ticket number, like BG-5001.'; return false; }
        if(why.length < 12){ err.textContent = 'Say what it is needed for. The auditor reads this line first.'; return false; }
        act('Record break-glass authorization', a.id, function(){ a.authBy = who; a.authAt = S.clock; a.authTicket = t.toUpperCase(); a.authWhy = why; bgLogAdd(a.id, 'Authorized by ' + who + ' for ' + t.toUpperCase(), why); },
          'Authorization recorded for ' + a.id, {cat:'Emergency access', detail:'Authorized by ' + who + ' · ' + t.toUpperCase() + ' · “' + why + '”'});
      });
    if(kind==='use') return confirmBox('Break the seal on ' + a.id,
      '<p>Envelope <span class="mono">' + esc(a.seal) + '</span> in ' + esc(a.safe) + '. Breaking the seal is a physical, visible act and it cannot be undone.</p>' +
      (a.authBy ? '<p class="faint">Authorized by ' + esc(a.authBy) + ' at ' + esc(hhmm(a.authAt)) + ' for ' + esc(a.authTicket) + '.</p>'
                : '<div class="note bad">No authorization has been recorded. Using an emergency account without one is an audit finding on its own, whatever the outcome (P16).</div>') +
      impact(['Everything this account does is attributed to a shared credential, not to you.', 'The credential must be rotated and re-sealed the moment the incident is over.'], 'Sign-ins by this account page the CISO. That is the point of it.'), 'Break seal and sign in', function(){
        act('Break-glass sign-in', a.id, function(){ a.sealed = false; a.inUse = true; a.usedAt = S.clock; a.unauthorized = !a.authBy; bgLogAdd(a.id, 'Seal broken, signed in' + (a.authBy ? '' : ' with no authorization recorded')); },
          'Signed in as ' + a.id, {cat:'Emergency access', mins:4, detail:'Seal ' + a.seal + ' broken. ' + (a.authBy ? 'Authorized by ' + a.authBy + ' · ' + a.authTicket : 'NO AUTHORIZATION RECORDED.')});
        later2(function(){ notify('alert', 'secops', 'Emergency account ' + a.id + ' signed in. We get paged on these. Reply on the incident ticket with who authorized it.', null); });
      }, true);
    if(kind==='out') return confirmBox('Sign out of ' + a.id, '<p>End the emergency session.</p>' + impact(['The shared session is closed.'], 'Signing out is not the end of it — the credential is still the one in the broken envelope until it is rotated.'), 'Sign out', function(){
      act('Break-glass sign-out', a.id, function(){ a.inUse = false; a.signedOutAt = S.clock; bgLogAdd(a.id, 'Signed out'); }, 'Signed out of ' + a.id, {cat:'Emergency access', detail:'Session ended after ' + dur(S.clock - a.usedAt) + '.'});
    });
    if(kind==='rot') return confirmBox('Rotate the credentials for ' + a.id,
      '<p>Generate a new password and a new hardware key PIN for <span class="mono">' + esc(a.id) + '</span>, to go into a fresh sealed envelope.</p>' +
      impact(['Anyone who saw or copied the old credential loses it.'], 'Rotate after every use, and after any sign-in nobody can account for.'), 'Rotate', function(){
        act('Rotate break-glass credentials', a.id, function(){ a.rotatedAt = S.clock; a.compromised = false; a.sealed = false; a.seal = 'ENV-' + (7400 + (hash(a.id + S.clock) % 500)); bgLogAdd(a.id, 'Credentials rotated, new envelope ' + a.seal + ' — not yet sealed'); },
          'Credentials rotated for ' + a.id + ' — seal the new envelope', {cat:'Emergency access', mins:5, detail:'New password and key PIN issued, ready for envelope ' + a.seal + '.'});
      });
    if(kind==='seal'){
      if(a.inUse){ openModal('Still signed in', '<p>' + esc(a.id) + ' is still signed in. Sign out of the emergency session before re-sealing.</p>', null); return; }
      if(a.rotatedAt==null){ openModal('Rotate first', '<p>The credential in your hand is the one from the broken envelope. Re-sealing it changes nothing — anyone who read it still has it.</p><p class="faint">Rotate the credentials, then seal the new ones.</p>', null); return; }
      return confirmBox('Re-seal ' + a.id, '<p>Put the new credentials in envelope <span class="mono">' + esc(a.seal) + '</span> and return it to ' + esc(a.safe) + '.</p>', 'Re-seal', function(){
        act('Re-seal emergency credentials', a.id, function(){ a.sealed = true; a.sealedAt = S.clock; bgLogAdd(a.id, 'Re-sealed in ' + a.safe + ' as ' + a.seal); }, a.id + ' re-sealed', {cat:'Emergency access', detail:'Envelope ' + a.seal + ' returned to ' + a.safe + '.'});
      });
    }
    if(kind==='rep') return openModal('Break-glass use report — ' + a.id,
      '<p>The report the CISO and the auditor read. Say what happened, what the account did, and what it did not do.</p>' +
      '<label class="fld" for="bg-rep">Report</label><textarea class="in" id="bg-rep" style="min-height:120px" placeholder="Why the emergency account was needed, who authorized it, the exact change made, when it was signed out, rotated and re-sealed."></textarea><p class="hint" id="bg-rerr"></p>', 'File report', function(){
        var txt = document.getElementById('bg-rep').value.trim();
        if(txt.length < 40){ document.getElementById('bg-rerr').textContent = 'A real report, not a line. Forty characters is not much to ask.'; return false; }
        act('File break-glass use report', a.id, function(){ S.reports['bg:'+a.id] = txt; bgLogAdd(a.id, 'Use report filed', txt.slice(0,120)); }, 'Use report filed for ' + a.id, {cat:'Emergency access', mins:6, detail:'“' + txt + '”'});
      });
  }
  function pConsents(){
    return '<h1 class="pg">App consents</h1><p class="sub">Applications that people have granted access to their data. A consent is a standing credential: it survives password resets and MFA until it is revoked.</p>' +
      card('Granted applications', '', table(['Application','Publisher','Permissions','Granted to','State',''], S.consents.map(function(c){
        var risky = /Unverified/.test(c.publisher) && c.perms.some(function(p){ return /Mail|Files/.test(p); });
        return '<tr' + (risky && c.state==='active' ? ' class="denyrow"' : '') + '><td><b>' + esc(c.app) + '</b><div class="faint" style="font-size:12px">' + esc(c.note||'') + '</div></td><td class="' + (/Unverified/.test(c.publisher) ? 'res bad' : 'faint') + '">' + esc(c.publisher) + '</td><td class="mono" style="font-size:12px">' + esc(c.perms.join(', ')) + '</td><td>' + c.users.map(function(x){ return U(x) ? '<button class="tlink" data-user="' + x + '" type="button">' + esc(U(x).name) + '</button>' : esc(x); }).join(', ') + '<div class="mono faint" style="font-size:12px">' + esc(c.granted) + '</div></td>' +
          '<td>' + (c.state==='active' ? '<span class="pill en">Active</span>' : c.state==='revoked' ? '<span class="pill dis">Revoked</span>' : '<span class="pill act">Blocked</span>') + '</td>' +
          '<td><div class="row">' + (c.state==='active' ? '<button class="btn danger sm" data-consent="' + c.id + '|revoke" type="button">Revoke</button>' : '') + (c.state!=='blocked' ? '<button class="btn sec sm" data-consent="' + c.id + '|block" type="button">Block app</button>' : '') + '</div></td></tr>';
      }).join(''), 'No consents recorded.')) +
      '<p class="hint">Revoking removes the grant for that person. Blocking stops everyone else receiving the same email and doing the same thing tomorrow.</p>';
  }
  function scnProgress(id){
    try{
      var raw = localStorage.getItem(scnKey(id)); if(!raw) return null;
      var o = JSON.parse(raw); if(!o || !o.tickets) return null;
      var ks = Object.keys(o.tickets), done = 0, arrived = 0;
      ks.forEach(function(k){ var t = o.tickets[k]; if(t.arrived) arrived++; if(t.status==='resolved') done++; });
      return {screen:o.screen, done:done, total:ks.length, arrived:arrived, clock:o.clock,
              live:(o.screen==='console' || o.screen==='later' || o.screen==='score') && done>0 && o.screen!=='score'};
    }catch(err){ return null; }
  }
  var MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function scnDay(s){
    var mi = MON.indexOf(s.month || 'Sep'); if(mi < 0) mi = 8;
    var d = parseInt((s.dates && s.dates['0']) || '1', 10) || 1;
    return ((s.year || 2026) * 12 + mi) * 31 + d;
  }
  function scnStamp(s){
    var mins = s.startClock || 0;
    return {day:(['Mon','Tue','Wed','Thu','Fri','Sat','Sun'])[s.dayOffset||0],
            date:(s.dates && s.dates['0'] ? s.dates['0'] : ''),
            month:s.month || '', year:s.year || '',
            time:pad(Math.floor(mins/60)) + ':' + pad(mins%60)};
  }
  function spanLine(ids){
    var a = scnDay(SCN[ids[0]]), z = scnDay(SCN[ids[ids.length-1]]), span = Math.max(z - a, 1);
    var pins = ids.map(function(id){
      var s = SCN[id], m = META[id] || {}, pr = scnProgress(id), st = scnStamp(s);
      var cls = pr && pr.live ? 'live' : m.score!=null ? 'done' : '';
      var pos = ((scnDay(s) - a) / span) * 100;
      return '<button class="sl-pin ' + cls + '" data-scn="' + id + '" style="left:' + pos.toFixed(2) + '%" type="button" ' +
        'title="' + esc(st.day + ' ' + st.date + ' ' + st.month + ' ' + st.year + ' \u00b7 ' + (s.eyebrow||'').split('\u00b7').pop().trim()) + '">' +
        '<span class="sl-tip">' + esc((s.eyebrow||'').split('\u00b7').pop().trim()) + '</span></button>';
    }).join('');
    var f = scnStamp(SCN[ids[0]]), l = scnStamp(SCN[ids[ids.length-1]]);
    return '<div class="spanline"><span class="sl-end">' + esc(f.month + ' ' + f.year) + '</span>' +
      '<span class="sl-track">' + pins + '</span>' +
      '<span class="sl-end r">' + esc(l.month + ' ' + l.year) + '</span></div>';
  }
  function anyProgress(){
    if(Object.keys(META).length) return true;
    try{
      for(var i=0;i<localStorage.length;i++){ if((localStorage.key(i)||'').indexOf('lp.console.v6.')===0) return true; }
    }catch(e){}
    return false;
  }
  function wipeAll(){
    var kill = [];
    try{
      for(var i=0;i<localStorage.length;i++){ var k = localStorage.key(i)||'';
        if(k.indexOf('lp.console.')===0) kill.push(k); }
      kill.forEach(function(k){ localStorage.removeItem(k); });
    }catch(e){}
    META = {};
  }
  function pPick(){
    var ids = Object.keys(SCN);
    var totalT = 0, totalS = 0;
    ids.forEach(function(id){ totalT += SCN[id].tickets.length; SCN[id].tickets.forEach(function(t){ totalS += t.checks.length; }); });
    var first = scnStamp(SCN[ids[0]]), last = scnStamp(SCN[ids[ids.length-1]]);
    var played = ids.filter(function(id){ return META[id] && META[id].score!=null; }).length;
    var rows = ids.map(function(id, n){
      var s = SCN[id], m = META[id] || {}, st = scnStamp(s);
      var steps = s.tickets.reduce(function(a,t){ return a + t.checks.length; }, 0);
      var tag = (s.eyebrow || '').split('·').pop().trim();
      var pr = scnProgress(id), state = '';
      if(m.score!=null) state += '<span class="sh-state ' + (m.score/m.max>=0.9?'clear':m.score/m.max>=0.6?'part':'miss') + '">Best ' + m.score + ' / ' + m.max + '</span>';
      if(pr && pr.live) state += '<span class="sh-state live">In progress · ' + pr.done + ' of ' + pr.total + ' resolved</span>';
      else if(m.score==null) state += '<span class="sh-state new">Not played</span>';
      return '<div class="shift-wrap' + (pr && pr.live ? ' live' : m.score!=null ? ' done' : '') + '"><button class="shift" data-scn="' + id + '" type="button" style="--i:' + n + '">' +
        '<span class="sh-node" aria-hidden="true"></span>' +
        '<span class="sh-when"><b>' + esc(st.day) + '</b> ' + esc(st.date) + ' ' + esc(st.month) + ' ' + esc(String(st.year).slice(2)) + '<i>' + esc(st.time) + '</i></span>' +
        '<span class="sh-body"><span class="sh-tag">' + esc(tag) + '</span>' +
        '<span class="sh-head">' + esc(s.headline) + '</span>' +
        '<span class="sh-blurb">' + esc(s.blurb || '') + '</span>' +
        '<span class="sh-meta">' + s.tickets.length + ' tickets · ' + steps + ' scored steps</span></span>' +
        '<span class="sh-right">' + state + '</span></button>' +
        (pr && pr.live ? '<button class="sh-again" data-restart="' + id + '" type="button">Start again</button>' : '') + '</div>';
    }).join('');
    return '<div class="front"><div class="front-in">' +
      '<header class="front-top">' +
        '<p class="front-eyebrow">Least Privilege · a hybrid identity simulator</p>' +
        '<h1 class="front-h1">' + NUMW(ids.length) + ' shifts at one company.<br><span class="hl-2">Every decision comes back.</span></h1>' +
        '<p class="front-lede">Each shift is a full day on the identity and access queue at Meridian Freight \u2014 the same directory, the same people, and whatever the last shift left behind. There are no multiple-choice answers. You do the work in the console, and when the shift ends you find out what every decision cost three months later.</p>' +
        spanLine(ids) +
        '<dl class="front-stats">' +
          '<div><dt>Shifts</dt><dd>' + ids.length + '</dd></div>' +
          '<div><dt>Tickets</dt><dd>' + totalT + '</dd></div>' +
          '<div><dt>Scored steps</dt><dd>' + totalS + '</dd></div>' +
          '<div><dt>Played</dt><dd>' + played + ' <span>of ' + ids.length + '</span></dd></div>' +
        '</dl>' +
      '</header>' +
      '<div class="roster">' + rows + '</div>' +
      (anyProgress() ? '<div class="row" style="justify-content:center;margin-top:26px"><button class="btn sec" id="wipe" type="button">Clear all progress</button></div>' : '') +
      '<p class="front-fine">Built by Maurisha Houston. Meridian Freight, its people, its domain and its console are fictional. Real cmdlet and control names are used because the job asks for them. Progress saves in this browser, per shift, and nothing is sent anywhere.</p>' +
      '</div></div>';
  }

  // ---------- notifications / search ----------
  var panel = document.getElementById('panel');
  function closePanel(){ panel.hidden = true; var r = document.getElementById('sres'); if(r) r.hidden = true; }
  function openNotes(){
    if(!panel.hidden){ closePanel(); return; }
    var icon = {chat:'💬', alert:'⚠', ticket:'🎫', reply:'↩'};
    panel.innerHTML = '<div class="p-h"><b>Notifications</b>' + (S.notes.length ? '<button class="link" id="n-read" type="button">Mark all read</button>' : '') + '</div>' +
      (S.notes.length ? S.notes.map(function(n, i){ return '<button class="n-item' + (n.read?'':' unread') + '" data-ni="' + i + '" type="button"><span class="n-ic">' + (icon[n.kind]||'•') + '</span><span><b>' + esc(whoShort(n.from)) + '</b> <span class="mono faint">' + esc(n.t) + '</span><br>' + esc(n.text) + '</span></button>'; }).join('') : '<div class="p-empty">You’re all caught up.</div>');
    panel.hidden = false;
    var nr = document.getElementById('n-read'); if(nr) nr.onclick = function(){ S.notes.forEach(function(n){ n.read = true; }); save(); chrome(); closePanel(); };
    panel.querySelectorAll('[data-ni]').forEach(function(b){ b.onclick = function(){ var n = S.notes[+b.dataset.ni]; n.read = true; save(); closePanel(); if(n.link && n.link.ticket) nav('ticket', n.link.ticket); else if(n.link && n.link.user) nav('user', n.link.user, n.link.utab); else chrome(); }; });
  }
  function searchResults(q){
    var r = document.getElementById('sres'); q = q.trim().toLowerCase();
    if(!q || S.screen!=='console'){ r.hidden = true; return; }
    var us = allUsers().filter(function(u){ return (u.name+' '+mail(u.upn)+' '+u.eid).toLowerCase().indexOf(q)>=0; }).slice(0,5);
    var gs = D.groups.filter(function(g){ return g.name.toLowerCase().indexOf(q)>=0; }).slice(0,4);
    var ts = visibleTickets().filter(function(t){ return (t.id+' '+t.subject).toLowerCase().indexOf(q)>=0; }).slice(0,4);
    var as = D.apps.filter(function(a){ return a.name.toLowerCase().indexOf(q)>=0; }).slice(0,3);
    var h = '';
    if(us.length) h += '<div class="s-k">Users</div>' + us.map(function(u){ return '<button type="button" data-go="user|' + u.upn + '">' + esc(u.name) + ' <span class="mono faint">' + mail(u.upn) + '</span></button>'; }).join('');
    if(gs.length) h += '<div class="s-k">Groups</div>' + gs.map(function(g){ return '<button type="button" data-go="group|' + g.name + '"><span class="mono">' + g.name + '</span></button>'; }).join('');
    if(as.length) h += '<div class="s-k">Applications</div>' + as.map(function(a){ return '<button type="button" data-go="app|' + esc(a.name) + '">' + esc(a.name) + '</button>'; }).join('');
    if(ts.length) h += '<div class="s-k">Tickets</div>' + ts.map(function(t){ return '<button type="button" data-go="ticket|' + t.id + '"><span class="mono">' + t.id + '</span> ' + esc(t.subject) + '</button>'; }).join('');
    r.innerHTML = h || '<div class="p-empty">No results for “' + esc(q) + '”.</div>'; r.hidden = false;
    r.querySelectorAll('[data-go]').forEach(function(b){ b.onmousedown = function(e){ e.preventDefault(); var p = b.dataset.go.split('|'); gsI.value=''; r.hidden = true; gsI.blur(); nav(p[0], p[1]); }; });
  }

  // ---------- grading ----------
  function test(c){
    if(c.mined) return !!(S.rbac && S.rbac.mined);
    if(c.decom){
      var ds = (S.decom||{})[c.decom];
      if(!ds) return false;
      if(c.scanned) return !!ds.scanned;
      if(c.ssoGone) return !!ds.ssoGone;
      if(c.deprovisioned) return !!ds.deprovisioned;
      if(c.connGone) return !!ds.scimGone;
      if(c.caDone) return !!ds.caDone;
      if(c.regGone) return !!ds.regGone;
      if(c.licReclaimed) return !!ds.licReclaimed;
      if(c.orderOk) return decomBefore(c.decom, 'deprovision', 'connector');
      if(c.groupIs) return ds.groups[c.groupIs] === (c.as || 'delete');
      if(c.personIs) return ds.people[c.personIs] === (c.as || 'disable');
      return false;
    }
    if(c.role || c.roleFor){
      var rr = (S.rbac && S.rbac.roles || []).filter(function(x){ return c.roleFor ? x.dept===c.roleFor : x.name===c.role; })[0];
      if(c.defined) return !!rr;
      if(!rr) return false;
      if(c.hasEnt) return rr.ents.indexOf(c.hasEnt) >= 0;
      if(c.lacksEnt) return rr.ents.indexOf(c.lacksEnt) < 0;
      if(c.owner) return rr.owner === c.owner;
      if(c.anyOwner) return !!rr.owner;
      if(c.reviewed) return !!rr.reviewEvery;
      return false;
    }
    if(c.roleCount) return (S.rbac && S.rbac.roles || []).length === c.roleCount;
    if(c.assigned) return ((S.rbac && S.rbac.assigned || {})[c.u] || []).indexOf(c.assigned) >= 0;
    if(c.assignedFor){
      var held = (S.rbac && S.rbac.assigned || {})[c.u] || [];
      return held.some(function(n){
        var r = (S.rbac.roles||[]).filter(function(x){ return x.name===n; })[0];
        return !!r && r.dept === c.assignedFor;
      });
    }
    if(c.stripped) return !!(S.rbac && S.rbac.stripped && S.rbac.stripped[c.stripped]);
    if(c.notStripped) return !(S.rbac && S.rbac.stripped && S.rbac.stripped[c.notStripped]);
    if(c.exception){
      var st = (S.rbac && S.rbac.exceptions) || {};
      return st[c.exception + '|' + c.ent] === (c.as || 'keep');
    }
    if(c.sodFlagged) return ((S.rbac && S.rbac.flagged) || []).indexOf(c.sodFlagged) >= 0;
    if(c.noSod){
      var rs = (S.rbac && S.rbac.roles) || [];
      return !rs.some(function(x){ return sodHit(x.ents).length > 0; });
    }
    // true when anybody in the directory carries this name — used negated, to
    // grade an identity that should never have been created at all
    if(c.userExists){ var needle = c.userExists.toLowerCase();
      return allUsers().some(function(x){ return (x.name||'').toLowerCase().indexOf(needle)>=0; }); }
    if(c.any) return c.any.some(test);
    if(c.not) return !test(c.not);
    if(c.t){ var st = S.tickets[c.t]; if(!st) return false;
      if(c.disp) return st.status==='resolved' && st.disp===c.disp;
      if(c.replied) return !!st.replied;
      if(c.approvedBy) return !!(st.approval && st.approval.from===c.approvedBy && st.approval.decision!=='wrong');
      if(c.askedOf) return st.asked.indexOf(c.askedOf)>=0;
      return false; }
    if(c.g && c.ownerLacks) return S.owners[c.g].indexOf(c.ownerLacks)<0;
    if(c.g && c.ownerHas) return S.owners[c.g].indexOf(c.ownerHas)>=0;
    if(c.share){ var sh = share(c.share); if(!sh) return false; if(c.noDirect) return !sh.ntfs.some(function(a){ return a.kind==='user' && a.p===c.noDirect && !a.inherited; }); return false; }
    if(c.deleg) return !S.deleg.some(function(x){ return x.ou===c.deleg && x.who===c.gone; });
    if(c.open) return !S.openFiles.some(function(f){ return f.upn===c.open; });
    if(c.adOnly){ var o = adOnlyBy(c.adOnly); if(!o) return false; if(c.disabled!==undefined) return o.enabled===!c.disabled; if(c.ou) return o.ou===c.ou; if(c.noGroup) return (o.groups||[]).indexOf(c.noGroup)<0; return false; }
    if(c.reportedObj) return !!S.reports[c.reportedObj];
    if(c.svc){ var o = adOnlyBy(c.svc); if(!o) return false;
      if(c.unlocked) return !o.locked;
      if(c.hasOwner) return !!o.owner;
      if(c.noInteractive) return o.interactive===false;
      if(c.rotated) return !!o.rotated;
      if(c.notRotated) return !o.rotated;
      if(c.enabled) return o.enabled!==false;
      if(c.reported) return !!S.reports[c.svc];
      if(c.notShared) return !o.shared;
      if(c.stillBad) return (o.runsOn||[]).some(function(j){ return j.enabled && j.cred==='stale'; });
      if(c.spnNone) return !(o.spn||[]).length;
      if(c.gmsa) return !!o.gmsa;
      return false; }
    if(c.job){ var jb = jobBy(c.job); if(!jb) return false; if(c.running) return !!jb.j.enabled; if(c.ok!==undefined) return jobOk(jb.j)===c.ok; return false; }
    if(c.appReg){ var ar = appReg(c.appReg); if(!ar) return false;
      if(c.newSecret) return ar.secrets.some(function(s){ return s.isNew && s.state==='active'; });
      if(c.oldActive) return ar.secrets.some(function(s){ return !s.isNew && s.state==='active'; });
      if(c.ownerLacks) return ar.owners.indexOf(c.ownerLacks)<0;
      if(c.hasLiveOwner) return ar.owners.some(function(o2){ var u2 = U(o2); return u2 && u2.status==='Enabled'; });
      return false; }
    if(c.scan){ var hh = scanHit(c.scan); return !!(hh && hh.state==='quarantined'); }
    if(c.risk) return riskState(c.risk)===c.state;
    if(c.consent){ var cc = consentBy(c.consent); if(!cc) return false; if(c.revoked) return cc.state==='revoked' || cc.state==='blocked'; if(c.blocked) return cc.state==='blocked'; return false; }
    if(c.authPolicy) return !!(S.authPolicy && S.authPolicy[c.authPolicy]);
    if(c.ca){
      var cp = caBy(c.ca); if(!cp) return false;
      if(c.excludes) return caNorm(cp).exclude.indexOf(c.excludes) >= 0;
      if(c.covers) return caCovers(cp, {upn:c.covers});
      if(c.notCovers) return !caCovers(cp, {upn:c.notCovers});
      return cp.state === c.state;
    }
    if(c.signInWouldBe){
      var ctx = c.signInWouldBe;
      return caEval(ctx).outcome.indexOf(c.outcome || 'Success') === 0;
    }
    if(c.contacted) return !!(S.contacted||{})[c.contacted];
    if(c.gpo){ var gg = gpoBy(c.gpo); if(!gg) return false; if(c.linked) return gg.state!=='draft'; if(c.enforced) return !!gg.enforced; return true; }
    if(c.delegHas) return S.deleg.some(function(x){ return x.ou===c.delegHas && x.who===c.who; });
    // --- the credential vault ---------------------------------------------
    if(c.safe){
      var sf = safeBy(c.safe); if(!sf) return false;
      var sp = sf.policy || {};
      if(c.rotateOnReturn) return !!sp.rotateOnReturn;
      if(c.recordSession) return !!sp.recordSession;
      if(c.approval) return sp.checkout === 'approval';
      if(c.maxMins) return !!sp.maxMins && sp.maxMins <= c.maxMins;
      if(c.holds) return (sf.accounts||[]).some(function(x){ return x.id===c.holds; });
      return true;
    }
    if(c.cred){
      var vv2 = vault();
      var va = vAcc(c.cred);
      if(!va){
        var sealed = ((vv2||{}).sealed||[]).filter(function(x){ return x.id===c.cred; })[0];
        if(sealed){ if(c.rotated) return !!sealed.rotated; if(c.sealed) return true; return true; }
        return false;
      }
      if(c.inSafe) return !va.checkedOutBy;
      if(c.out) return !!va.checkedOutBy;
      if(c.rotated) return !!(va.rotated || va.rotatedOnReturn || va.rotatedOnOnboard);
      if(c.onboarded) return !!va.onboarded;
      if(c.recorded) return !!va.recorded;
      if(c.ticketed) return !!(va.ticket || va.lastTicket);
      // a generic "was ticketed" leaks across check-outs; name the ticket
      if(c.ticketIs) return va.ticket === c.ticketIs || va.lastTicket === c.ticketIs;
      if(c.forcedIn) return !!va.forcedIn;
      return true;
    }
    if(c.sealedOut){ var vv3 = vault(); return !!vv3 && (vv3.sealed||[]).some(function(x){ return x.id===c.sealedOut; }); }
    if(c.unmanagedGone){ var vv = vault(); return !!vv && !(vv.unmanaged||[]).some(function(x){ return x.id===c.unmanagedGone; }); }
    // --- authentication methods ------------------------------------------
    if(c.method){
      var mm = amBy(c.method); if(!mm) return false;
      if(c.enabled) return mm.state === 'Enabled';
      if(c.disabled) return mm.state !== 'Enabled';
      if(c.scope) return mm.state === 'Enabled' && mm.scope === c.scope;
      if(c.notFor) return mm.state !== 'Enabled' || (mm.scope !== 'all' && mm.scope !== c.notFor);
      return true;
    }
    if(c.sspr){
      var sp = (am()||{}).sspr || {};
      if(c.scope) return sp.scope === c.scope;
      if(c.on) return !!sp.scope && sp.scope !== 'none';
      if(c.required) return sp.required === c.required;
      if(c.permits) return (sp.allowed||[]).indexOf(c.permits) >= 0;
      if(c.forbids) return (sp.allowed||[]).indexOf(c.forbids) < 0;
      if(c.campaignOn) return !!(sp.campaign && sp.campaign.on);
      if(c.campaignFor) return !!(sp.campaign && sp.campaign.on && sp.campaign.method === c.campaignFor);
      return true;
    }
    if(c.registration != null){
      var rr2 = ((am()||{}).registrations||[])[c.registration];
      return !!rr2 && rr2.handled === (c.as || 'Removed');
    }
    // --- external identities and access packages -------------------------
    if(c.guest){
      var gg2 = guestBy(c.guest); if(!gg2) return false;
      if(c.removed) return !!gg2.removed;
      if(c.kept) return !gg2.removed;
      if(c.sponsored) return !gg2.removed && !!gg2.sponsor && (c.sponsor ? gg2.sponsor===c.sponsor : true);
      if(c.expirySet) return !gg2.removed && !!gg2.expires;
      if(c.noGroup) return (gg2.groups||[]).indexOf(c.noGroup) < 0;
      return true;
    }
    if(c.collab){
      var cc2 = (ext()||{}).collab || {};
      if(c.allowList) return cc2.mode === 'allow-list' && (cc2.allow||[]).length > 0;
      if(c.domain) return (cc2.allow||[]).indexOf(c.domain) >= 0;
      if(c.guestPerms) return cc2.guestPerms === c.guestPerms;
      if(c.whoCanInvite) return cc2.whoCanInvite === c.whoCanInvite;
      return true;
    }
    if(c.pkg){
      var pp2 = pkgBy(c.pkg); if(!pp2) return false;
      if(c.approver) return pp2.approver === c.approver;
      if(c.hasApprover) return !!pp2.approver;
      if(c.expirySet) return !!pp2.expiry;
      if(c.scope) return pp2.scope === c.scope;
      if(c.decided){ var rr = (pp2.requests||[]).filter(function(x){ return x.id===c.decided; })[0]; return !!rr && rr.decision === (c.as||'approved'); }
      return true;
    }
    // --- HR feed --------------------------------------------------------
    if(c.hr){
      var hrr = hrRec(c.hr); if(!hrr) return false;
      if(c.created) return hrr.done === 'created';
      if(c.noDuplicate) return !(hrr.done === 'created' && hrr.createdDupe);
      if(c.matchedTo) return hrr.done === 'matched' && hrr.matchedTo === c.matchedTo;
      if(c.reEnabled) return !!hrr.reEnabled;
      if(c.renamed) return hrr.done === 'renamed';
      if(c.held) return hrr.done === 'held';
      if(c.leaver) return hrr.done === 'leaver';
      if(c.expSet) return !!hrr.expSet;
      if(c.untouched) return !hrr.done;
      if(c.done) return !!hrr.done;
      return true;
    }
    if(c.renamedTo){
      var ru = U(c.renamedTo); if(!ru) return false;
      if(c.display) return ru.name === c.display;
      if(c.keptAlias) return !!ru.keptAlias;
      if(c.sameObject) return !!ru.oldUpn;
      return true;
    }
    // --- single sign-on -------------------------------------------------
    if(c.sso){
      var ss = sso(c.sso); if(!ss) return false;
      if(c.entityId) return ss.entityId === c.entityId;
      if(c.acs) return ss.acs === c.acs;
      if(c.nameId) return ss.nameId === c.nameId;
      if(c.signOnUrl) return ss.signOnUrl === c.signOnUrl;
      if(c.claim){ return (ss.claims||[]).some(function(x){ return x.name===c.claim && !x.missing && (!c.from || x.source===c.from); }); }
      if(c.certCreated) return !!(ss.cert && ss.cert.created);
      if(c.certActive) return !!(ss.cert && ss.cert.activated && !ss.cert.expired);
      if(c.certConfirmed) return !!(ss.cert && ss.cert.activated && !ss.cert.activatedBlind);
      if(c.certNotActive) return !(ss.cert && ss.cert.activated);
      if(c.tested) return !!ss.tested;
      if(c.works) return !!ss.working;
      return true;
    }
    if(c.scim){
      var sp = scim(c.scim); if(!sp) return false;
      if(c.on) return sp.state === 'On';
      if(c.off) return sp.state !== 'On';
      if(c.scope) return sp.scope === c.scope;
      if(c.removeOnUnassign) return !!sp.removeOnUnassign;
      if(c.leftInPlace) return !sp.removeOnUnassign;
      if(c.ran) return !!sp.ran;
      if(c.orphanGone) return (sp.deprovisioned||[]).indexOf(c.orphanGone) >= 0;
      if(c.noOrphans) return !(sp.orphans||[]).length;
      return true;
    }
    if(c.krb){
      var k = S.krb || {}, rs = k.resets || [];
      if(c.krb==='reset') return rs.length >= 1;
      if(c.krb==='once') return rs.length === 1;
      if(c.krb==='scheduled') return !!k.scheduled && k.scheduled.hrs >= 10;
      if(c.krb==='notYet') return rs.length === 0;
      if(c.krb==='after'){ var au = U(c.u); return rs.length >= 1 && !!au && au.pwdAt != null && rs[0].at >= au.pwdAt; }
      return false;
    }
    if(c.trust){
      var tr = trustBy(c.trust);
      if(c.removed) return !tr;
      if(!tr) return false;
      if(c.sidFiltering) return !!tr.sidFiltering;
      if(c.oneWay) return tr.direction.indexOf('One-way')===0;
      if(c.until) return !!tr.until;
      return true;
    }
    if(c.signInNot){ var su = U(c.u); return !!su && (su.signIn||su.upn)!==c.signInNot; }
    if(c.bg){
      var a = bgBy(c.bg); if(!a) return false;
      if(c.state==='used') return !!a.usedAt || !!a.inUse;
      if(c.state==='unused') return a.usedAt==null;
      if(c.state==='authorized') return !!a.authBy && a.usedAt!=null && a.authAt <= a.usedAt;
      if(c.state==='signedOut') return a.usedAt!=null && !a.inUse;
      if(c.state==='rotated') return a.rotatedAt!=null && (a.usedAt==null || a.rotatedAt >= a.usedAt);
      if(c.state==='sealed') return !!a.sealed && a.rotatedAt!=null;
      if(c.state==='reported') return !!S.reports['bg:'+a.id];
      return false;
    }
    if(c.reviewDone) return reviewDone() && S.review.submitted!=null;
    if(c.review){ var it = S.review.items[c.review]; return !!(it && it.d===c.d); }
    if(c.finding){
      var ev = evidenceOf(c.finding);
      if(c.evidence==='review') return ev.indexOf('review')>=0;
      if(c.evidence==='case') return ev.some(function(k){ return k.indexOf('case:')===0; });
      if(c.evidence==='audit') return ev.some(function(k){ return k.indexOf('audit:')===0; });
      if(c.evidenceText){ var pool = evidencePool(); return ev.some(function(k){ var p = pool.filter(function(x){ return x.k===k; })[0]; return p && (p.detail||'').indexOf(c.evidenceText)>=0; }); }
      return ev.length>0;
    }
    var u = U(c.u); if(!u) return false;
    var n = names(u);
    if(c.has) return n.indexOf(c.has)>=0;
    if(c.lacks) return n.indexOf(c.lacks)<0;
    if(c.exactly) return n.length===c.exactly.length && c.exactly.every(function(g){ return n.indexOf(g)>=0; });
    if(c.status) return u.status===c.status;
    if(c.sessionsMax!==undefined) return u.sessions.length <= c.sessionsMax;
    if(c.groupsCount!==undefined) return u.groups.length===c.groupsCount;
    if(c.notPwdTo) return u.pwdTo!==c.notPwdTo;
    if(c.noPwdReset) return !u.pwdReset;
    if(c.pwdReset) return !!u.pwdReset;
    if(c.noPwd) return !u.pwdReset;
    if(c.mfaLacks) return !u.mfa.some(function(m){ return m.indexOf(c.mfaLacks)>=0; });
    if(c.noBadRule) return !u.rules.some(function(r){ return r.bad; });
    if(c.containOrder){ if(u.revokedAt==null) return false; var floor = Math.max(u.pwdAt==null ? -1e9 : u.pwdAt, u.mfaAt==null ? -1e9 : u.mfaAt); return u.pwdAt!=null && u.revokedAt >= floor; }
    if(c.roleLacks) return !u.roles.some(function(r){ return r.r===c.roleLacks; });
    if(c.roleHas) return u.roles.some(function(r){ return r.r===c.roleHas && (!c.type || r.type===c.type); });
    if(c.noStandingRole) return !u.roles.some(function(r){ return r.type==='active'; });
    if(c.appLacks) return !u.apps.some(function(a){ return a.app===c.appLacks; });
    if(c.appHas) return u.apps.some(function(a){ return a.app===c.appHas; });
    if(c.extRule) return u.rules.some(function(r){ return r.ext; });
    if(c.noExtRule) return !u.rules.some(function(r){ return r.ext; });
    if(c.reported) return !!S.reports[u.upn];
    if(c.mfaNone) return !u.mfa.length;
    if(c.mbxShared) return u.mbx==='Shared';
    if(c.mbxSafe) return !u.mbxDeleting;
    if(c.accountEnabled) return u.status==='Enabled';
    if(c.accountDisabled) return u.status==='Disabled';
    if(c.hold) return !!u.hold;
    if(c.noHold) return !u.hold;
    if(c.preserved) return !!u.hold && !u.mbxDeleting;
    if(c.devUntouched) return !u.devices.some(function(d){ return d.id===c.devUntouched && d.wiped; });
    if(c.delegate) return u.delegates.indexOf(c.delegate)>=0;
    if(c.licNone) return !hasLic(u);
    if(c.licAny) return hasLic(u);
    if(c.odShared) return u.odAccess.indexOf(c.odShared)>=0;
    if(c.devWiped) return u.devices.some(function(d){ return d.id===c.devWiped && d.wiped==='selective'; });
    if(c.devTaken) return u.devices.some(function(d){ return d.id===c.devTaken && !!d.wiped; });
    if(c.acctExpSet) return !!u.acctExp && u.acctExp!=='Not set';
    if(c.acctExpClear) return !u.acctExp || u.acctExp==='Not set';
    if(c.tap) return !!u.tap;
    if(c.adOu) return onPrem(u) && u.ad.ou===c.adOu;
    if(c.adLacks) return !onPrem(u) || u.ad.groups.indexOf(c.adLacks)<0;
    if(c.adHas) return onPrem(u) && u.ad.groups.indexOf(c.adHas)>=0;
    if(c.adTemp) return onPrem(u) && !!(u.ad.tempUntil && u.ad.tempUntil[c.adTemp]);
    if(c.adDisabled) return onPrem(u) && !u.ad.enabled;
    if(c.verified) return !!S.verified[u.upn];
    if(c.revokedAfterPriv) return u.privAt!=null && u.revokedAt!=null && u.revokedAt >= u.privAt;
    if(c.notPerm) return !u.groups.some(function(a){ return a.g===c.notPerm && a.type==='perm'; });
    if(c.hasTb) return u.groups.some(function(a){ return a.g===c.hasTb && a.type==='tb'; });
    if(c.tbWin) return u.groups.some(function(a){ return a.g===c.tbWin.g && a.type==='tb' && a.win===c.tbWin.win; });
    if(c.grantOk){ var ap = S.tickets[c.grantOk.t].approval; var gr = u.groups.filter(function(a){ return a.g===c.g; }); if(!gr.length) return true; return !!(ap && ap.decision==='approved' && ap.from===c.grantOk.from && gr.every(function(a){ return a.at >= ap.at; })); }
    return false;
  }
  function grade(t){
    var res = t.checks.map(function(k){ return {k:k, ok:k.c.every(test)}; });
    var critFail = res.some(function(r){ return r.k.crit && !r.ok; }), allOk = res.every(function(r){ return r.ok; });
    return {res:res, pts: allOk ? 2 : critFail ? 0 : 1, g: allOk ? 'best' : critFail ? 'wrong' : 'partial', done:res.filter(function(r){ return r.ok; }).length};
  }

  // ---------- full-screen states ----------
  function pIntro(){
    var st = scnStamp(D), steps = D.tickets.reduce(function(a,t){ return a + t.checks.length; }, 0);
    var tag = (D.eyebrow || '').split('·').pop().trim();
    return '<div class="front brief"><div class="front-in">' +
      '<button class="back" data-pick="1" type="button">All shifts</button>' +
      '<p class="brief-stamp"><b>' + esc(st.day) + ' ' + esc(st.date) + ' ' + esc(st.month) + ' ' + esc(String(st.year)) + '</b><span>' + esc(st.time) + '</span><span>' + esc(D.company) + '</span></p>' +
      '<p class="front-eyebrow">' + esc(tag) + '</p>' +
      '<h1 class="front-h1 brief-h1">' + esc(D.headline) + '</h1>' +
      '<p class="front-lede">' + esc(D.lede) + '</p>' +
      '<div class="brief-grid">' + D.steps.map(function(s, n){ return '<div class="brief-card"><b>' + esc(s[0]) + '</b><p>' + esc(s[1]) + '</p></div>'; }).join('') + '</div>' +
      '<div class="brief-go"><button class="btn big" id="begin" type="button">Start the shift</button>' +
      '<span class="brief-count">' + D.tickets.length + ' tickets · ' + steps + ' scored steps</span></div>' +
      '<p class="front-fine">Built by Maurisha Houston. ' + esc(D.company) + ', its people and its console are fictional. Progress saves in this browser. Press <kbd>?</kbd> in the console for shortcuts.</p></div></div>';
  }
  function pLogin(){
    return '<div class="auth"><div class="auth-card"><div class="mark dark"><i></i>Meridian Identity</div><h2>Sign in</h2><p class="faint" style="margin:0 0 14px">Administrator portal · ' + esc(DOM) + '</p>' +
      (S.authErr ? '<div class="note" style="margin:0 0 12px">' + esc(S.authErr) + '</div>' : '') +
      (S.resumed && !S.authErr ? '<div class="note" style="margin:0 0 12px">Your session expired. The shift is exactly where you left it.</div>' : '') +
      '<label class="fld" for="li-user">Email</label><input class="in" id="li-user" value="' + ME + '" autocomplete="off">' +
      '<label class="fld" for="li-pass">Password</label><input class="in" id="li-pass" type="password" value="correct-horse-staple">' +
      '<div class="row" style="margin-top:16px;justify-content:space-between"><span class="hint" style="margin:0">Privileged account · MFA required</span><button class="btn" id="li-next" type="button">Next</button></div></div>' +
      '<p class="fine" style="text-align:center">Authorized use only. Activity is logged.</p></div>';
  }
  function pMfa(){
    var n = S.mfaNum, opts = [n, (n+37)%90+10, (n+61)%90+10].sort(function(a,b){ return (hash('o'+a)%7)-(hash('o'+b)%7); });
    return '<div class="auth"><div class="auth-row"><div class="auth-card"><div class="mark dark"><i></i>Meridian Identity</div><p class="mono faint" style="margin:10px 0 2px">' + ME + '</p><h2>Approve sign-in request</h2>' +
      '<p>Open your Authenticator app and enter the number shown to sign in.</p><div class="bignum" id="mfa-num">' + n + '</div>' +
      '<p class="hint">No request on your phone? You may be seeing an attacker’s prompt on someone else’s screen. Never approve a request you didn’t start.</p></div>' +
      '<div class="phone" aria-label="Simulated phone"><div class="ph-top">' + hhmm(S.clock) + '</div><div class="ph-card"><b>Are you trying to sign in?</b><p class="faint">Meridian Identity<br>' + ME + '<br>Location: Long Beach, CA</p><p style="margin:10px 0 6px">Enter the number shown to sign in.</p><div class="ph-keys">' +
      opts.map(function(o){ return '<button type="button" data-n="' + o + '">' + o + '</button>'; }).join('') + '</div><button class="ph-deny" type="button" id="mfa-deny">No, it’s not me</button></div></div></div></div>';
  }
  function pLater(){
    var ev = [];
    D.tickets.forEach(function(t){ grade(t).res.forEach(function(r){ if(!r.ok) ev.push({h:t.id + ' · ' + r.k.label, g:r.k.crit?'wrong':'partial', text:r.k.later}); }); });
    (D.combos||[]).forEach(function(c){ if(c.when.every(test)) ev.push({h:c.title, g:c.grade, text:c.text}); });
    ev.sort(function(a,b){ return (a.g==='wrong'?0:1) - (b.g==='wrong'?0:1); });
    return '<div class="sheet"><p class="eyebrow">Three months later</p>' + (ev.length
      ? '<h2>' + ev.length + ' of your decisions came back.</h2><p class="lede">Access mistakes don’t fail loudly. They sit quietly until an auditor, an attacker, or an accident finds them. The red ones are the kind that make the news.</p>' + ev.map(function(e){ return '<div class="event ' + (e.g==='wrong'?'bad':'warn') + '"><div class="e-h">' + esc(e.h) + '</div><p>' + esc(e.text) + '</p></div>'; }).join('')
      : '<h2>Nothing happened.</h2><div class="quiet">Three months pass. No incidents, no audit findings, nobody notices anything. That’s what doing this job well looks like, which is exactly why nobody will thank you for it.</div>') +
      '<div class="row" style="margin-top:20px"><button class="btn" id="toscore" type="button">See your scorecard</button></div></div>';
  }
  function pScore(){
    var total = 0, max = D.tickets.length*2, cited = 0, met = 0, steps = 0, stepsMax = 0;
    var rows = D.tickets.map(function(t){
      var g = grade(t), st = S.tickets[t.id]; total += g.pts; steps += g.done; stepsMax += t.checks.length;
      var c = /\bP(1[01]|[1-9])\b|polic/i.test(st.note||''); if(c) cited++;
      if(st.due!=null && st.at && parseT(st.at) <= st.due) met++;
      var dl = DISP.filter(function(d){ return d[0]===st.disp; })[0];
      return '<div class="srow"><div class="srow-h"><b>' + t.id + ' · ' + esc(t.subject) + '</b><span class="gpill ' + g.g + '">' + (g.g==='best'?'complete':g.g==='partial'?'partial':'critical miss') + ' · ' + g.done + '/' + t.checks.length + '</span></div>' +
        '<ul class="chk">' + g.res.map(function(r){ return '<li class="' + (r.ok?'ok':r.k.crit?'bad':'warn') + '"><span>' + (r.ok?'✓':'✗') + '</span>' + esc(r.k.label) + (r.k.crit ? ' <span class="k">critical</span>' : '') + '</li>'; }).join('') + '</ul>' +
        '<p><span class="k">Why (' + t.policy + '):</span> ' + esc(t.why) + '</p>' +
        '<p><span class="k">Your resolution:</span> ' + esc(dl?dl[1]:'—') + ' — “' + esc(st.note||'') + '”' + (c?'':' <span class="k">(no policy cited)</span>') + '</p></div>';
    }).join('');
    var p = total/max;
    var band = p>=.9 ? ['Ready for the queue','You worked from the evidence and left the directory cleaner than you found it.'] : p>=.6 ? ['Solid, with gaps','The instincts are there. The misses are in the places access hides: direct roles, ownership, mailboxes.'] : p>=.35 ? ['Needs a second reviewer','Several changes followed the request instead of the evidence.'] : ['Access sprawl','Most tickets were solved by granting what was asked. The job is checking what should be granted.'];
    var st = scnStamp(D), tag = (D.eyebrow || '').split('·').pop().trim();
    return '<div class="front score"><div class="front-in">' +
      '<p class="brief-stamp"><b>' + esc(st.day) + ' ' + esc(st.date) + ' ' + esc(st.month) + ' ' + esc(String(st.year)) + '</b><span>shift ended ' + esc(hhmm(S.clock)) + '</span><span>' + esc(tag) + '</span></p>' +
      '<div class="score-hero"><div class="score-num">' + total + '<i>/ ' + max + '</i></div>' +
      '<div class="score-say"><h1 class="front-h1 score-h1">' + esc(band[0]) + '</h1><p class="front-lede">' + esc(band[1]) + '</p></div></div>' +
      '<dl class="front-stats">' +
        '<div><dt>Steps done</dt><dd>' + steps + ' <span>of ' + stepsMax + '</span></dd></div>' +
        '<div><dt>Actions logged</dt><dd>' + mine().length + '</dd></div>' +
        '<div><dt>Policy cited</dt><dd>' + cited + ' <span>of ' + D.tickets.length + '</span></dd></div>' +
        '<div><dt>SLA met</dt><dd>' + met + ' <span>of ' + D.tickets.length + '</span></dd></div>' +
        '<div><dt>Shift length</dt><dd>' + esc(dur(S.clock - D.startClock)) + '</dd></div>' +
      '</dl>' +
      '<p class="hint" style="margin:4px 0 18px">A ticket scores 2 when every step is done, 1 when every critical step is done, and 0 when a critical step is missed.</p>' + hintsSummary() +
      rows + '<div class="row" style="margin-top:22px"><button class="btn big" id="again" type="button">Play again</button><button class="btn sec" id="review" type="button">Review the audit log</button><button class="btn sec" data-pick="1" type="button">All shifts</button></div></div></div>';
  }

  // ---------- render ----------
  function shiftEnd(){
    var last = D.startClock + 540;
    D.tickets.forEach(function(t){ var st = S.tickets[t.id]; if(st && st.due!=null && st.due > last) last = st.due; });
    return last;
  }
  // the timeline only marks what happens during the shift: tickets that arrive
  // while you work, and the moment you resolve one. Everything that was already
  // in the queue at 08:45 is not an event.
  function hudPins(){
    var a = D.startClock, z = shiftEnd(), span = Math.max(z - a, 60), out = [];
    var pct = function(m){ return Math.max(0, Math.min(100, ((m - a) / span) * 100)); };
    D.tickets.forEach(function(t){
      var st = S.tickets[t.id]; if(!st) return;
      if(st.arrived && st.created!=null && st.created > a + 2) out.push({pos:pct(st.created), cls:'in', label:t.id + ' arrived ' + hhmm(st.created)});
      if(st.status==='resolved' && st.at) out.push({pos:pct(parseT(st.at)), cls:'done', label:t.id + ' resolved ' + st.at});
    });
    return out;
  }
  function hudTicks(){
    var a = D.startClock, z = shiftEnd(), span = Math.max(z - a, 60), out = '';
    var first = Math.ceil(a / 60) * 60;
    for(var m = first; m < z; m += 60){ out += '<span class="tick" style="left:' + (((m - a) / span) * 100).toFixed(2) + '%"></span>'; }
    return out;
  }
  function hud(){
    var a = D.startClock, z = shiftEnd(), span = Math.max(z - a, 60);
    var now = Math.max(0, Math.min(100, ((S.clock - a) / span) * 100));
    var soon = visibleTickets().filter(function(t){ var st = S.tickets[t.id]; return isOpen(st) && st.due!=null && (st.due - S.clock) < 240; }).length;
    var done = D.tickets.filter(function(t){ return S.tickets[t.id].status==='resolved'; }).length;
    var later = D.tickets.filter(function(t){ return !S.tickets[t.id].arrived; }).length;
    var pins = hudPins().map(function(p){ return '<span class="pin ' + p.cls + '" style="left:' + p.pos.toFixed(2) + '%" title="' + esc(p.label) + '"></span>'; }).join('');
    return '<div class="hud-t">' +
      '<div class="hb"><i></i>Meridian Identity</div>' +
      '<div class="big-clk">' + hhmm(S.clock) + '<small>' + esc(fmtLong(S.clock).split(' · ')[0].toUpperCase()) + '</small></div>' +
      '<div class="hud-mid"><div class="search" id="searchwrap"></div></div>' +
      '<div class="hstat">' +
        '<div><b>' + openCount() + '</b><span>Open</span></div>' +
        '<div><b>' + done + '</b><span>Resolved</span></div>' +
        '<div class="' + (soon ? 'urg' : '') + '"><b>' + soon + '</b><span>Due &lt; 4h</span></div>' +
      '</div>' +
      '<div class="hud-act" id="hudact"></div></div>' +
      '<div class="tl"><div class="bar"><span class="fill" style="width:' + now.toFixed(2) + '%"></span></div>' + hudTicks() +
      pins + '<span class="pin now" style="left:' + now.toFixed(2) + '%"></span>' +
      '<span class="lab" style="left:0">' + hhmm(a) + '</span>' +
      '<span class="lab end" style="left:100%">' + hhmm(z) + '</span></div>';
  }
  function chrome(){
    var inConsole = S.screen==='console';
    var bar = document.querySelector('.bar'), slot = document.getElementById('hudslot');
    bar.classList.toggle('hud', inConsole);
    stashBar();
    if(inConsole){ slot.innerHTML = hud(); slot.dataset.k = 'h'; }
    else if(slot.dataset.k !== 'f'){
      slot.dataset.k = 'f';
      slot.innerHTML = '<div class="hud-t slim"><div class="hb"><i></i>Meridian Identity</div><span class="env">SIMULATION</span><div class="hud-mid"></div><div class="hud-act" id="hudact"></div></div>';
    }
    mountBar(document.getElementById('searchwrap'), document.getElementById('hudact'));
    chrome2();
  }
  // the HUD is rebuilt on every render, so the live controls are parked out of
  // the way first and put back after; otherwise innerHTML would delete them.
  var BARKIDS = ['gsearchwrap','offline','pimchip','bell','endshift','reset','installbtn','mebtn'];
  function stashBar(){
    var keep = document.getElementById('barkeep');
    BARKIDS.forEach(function(id){ var el = document.getElementById(id); if(el) keep.appendChild(el); });
  }
  function mountBar(searchSlot, actSlot){
    var keep = document.getElementById('barkeep');
    var sw = document.getElementById('gsearchwrap');
    if(sw) (searchSlot || keep).appendChild(sw);
    BARKIDS.slice(1).forEach(function(id){ var el = document.getElementById(id); if(el) (actSlot || keep).appendChild(el); });
  }
  function chrome2(){
    var inConsole = S.screen==='console';
    document.getElementById('endshift').disabled = !(inConsole && openCount()===0);
    document.getElementById('endshift').hidden = !inConsole;
    document.getElementById('reset').hidden = !inConsole;
    document.getElementById('gsearchwrap').hidden = !inConsole;
    var on = inConsole;
    document.getElementById('bell').hidden = !on; document.getElementById('mebtn').style.display = on ? '' : 'none';
    var n = unread(), bb = document.getElementById('belln'); bb.textContent = n; bb.hidden = !n;
    var pc = document.getElementById('pimchip'); pc.hidden = !(on && pimOn()); pc.textContent = 'PRA active · until ' + hhmm(S.pim);
    var tb = document.querySelector('.nav [data-nav=tickets] .badge'); if(tb){ tb.textContent = openCount(); tb.hidden = !openCount(); }
  }
  function render(){
    chrome();
    if(S.screen!=='console'){
      root.innerHTML = S.screen==='pick' ? pPick() : S.screen==='intro' ? pIntro() : S.screen==='login' ? pLogin() : S.screen==='mfa' ? pMfa() : S.screen==='later' ? pLater() : pScore();
      root.querySelectorAll('[data-scn]').forEach(function(b){ b.onclick = function(){
        var id = b.dataset.scn;
        if(SCN[id] && SCN[id]._stub) b.classList.add('loading');
        ensureScenario(id, function(failed){
          b.classList.remove('loading');
          if(failed) return;
          loadScenario(id); if(S.screen==='pick') S.screen = 'intro'; save(); render(); window.scrollTo(0,0);
        });
      }; });
      root.querySelectorAll('[data-restart]').forEach(function(b){ b.onclick = function(ev){ ev.stopPropagation(); var id = b.dataset.restart;
        confirmBox('Start this shift again', '<p>Clear your progress on <b>' + esc(SCN[id].headline) + '</b> and begin it from the top?</p>' + impact(['Everything you changed in that shift is discarded.'], 'Your best score for it is kept.'), 'Start again', function(){
          try{ localStorage.removeItem(scnKey(id)); }catch(err){}
          ensureScenario(id, function(failed){
            if(failed) return;
            loadScenario(id); S.screen = 'intro'; save(); render(); window.scrollTo(0,0);
          });
        }, true); }; });
      root.querySelectorAll('[data-pick]').forEach(function(b){ b.onclick = function(){ S.screen = 'pick'; save(); render(); window.scrollTo(0,0); }; });
      var wipe = document.getElementById('wipe'); if(wipe) wipe.onclick = function(){
        confirmBox('Clear all progress',
          '<p>Clears every shift you have started and every score you have recorded, in this browser.</p>' +
          impact(['Every shift goes back to its opening state.', 'Your recorded scores are removed.'],
                 'Nothing about this is stored anywhere else, so there is nothing to recover it from.'),
          'Clear everything', function(){
            wipeAll();
            var id = Object.keys(SCN)[0];
            loadScenario(id); S.screen = 'pick'; render(); window.scrollTo(0,0);
            toast('All progress cleared');
          }, true);
      };
      var b = document.getElementById('begin'); if(b) b.onclick = function(){ S.screen='login'; S.authErr=''; save(); render(); };
      var ln = document.getElementById('li-next'); if(ln){ var go = function(){ if(!document.getElementById('li-pass').value){ S.authErr = 'Enter your password.'; render(); return; } S.mfaNum = 10 + (hash('n'+Date.now()) % 89); S.screen='mfa'; S.authErr=''; save(); render(); }; ln.onclick = go; document.getElementById('li-pass').onkeydown = function(e){ if(e.key==='Enter') go(); }; }
      root.querySelectorAll('[data-n]').forEach(function(k){ k.onclick = function(){
        if(+k.dataset.n===S.mfaNum){ S.screen='console'; var back = S.resumed; S.resumed = false; var firstEver = !S.signedIn && !tourDone(); if(!S.signedIn){ S.signedIn = true; S.page='tickets'; } if(firstEver) S.tour = 0; save(); render(); toast(back ? 'Signed back in · your shift is where you left it' : 'Signed in · session policy: re-authenticate every 8 hours'); }
        else { S.screen='login'; S.authErr='Wrong number entered. The sign-in request was denied. Try again.'; save(); render(); }
      }; });
      var dn = document.getElementById('mfa-deny'); if(dn) dn.onclick = function(){ S.screen='login'; S.authErr='You denied the request. If you didn’t start it, report it to Security.'; save(); render(); };
      var ts = document.getElementById('toscore'); if(ts) ts.onclick = function(){ S.screen='score'; save(); render(); window.scrollTo(0,0); };
      if(S.screen==='score'){ var tot = 0, mx = D.tickets.length*2; D.tickets.forEach(function(t){ tot += grade(t).pts; });
        var prev = META[S.scn] || {}; if(prev.score==null || tot > prev.score){ META[S.scn] = {score:tot, max:mx, at:Date.now()}; saveMeta(); } }
      var ag = document.getElementById('again'); if(ag) ag.onclick = resetAll;
      var rv = document.getElementById('review'); if(rv) rv.onclick = function(){ S.screen='console'; S.page='audit'; S.acat='mine'; S.done = true; save(); render(); };
      return;
    }
    var navItems = [['home','Home'],['tickets','Tickets'],['sep','Sources'],['hr','HR feed'],['sep','Cloud directory'],['users','Users'],['groups','Groups'],['roles','Admin roles'],['apps','Applications'],['licenses','Licenses'],['ca','Conditional access'],['authm','Authentication methods'],['sep','Governance'],['vault','Credential vault'],['rbac','Role model'],['ext','External identities'],['pkg','Access packages'],['review','Access reviews'],['findings','Audit findings'],['svc','Service accounts'],['appregs','App registrations'],['risk','Identity protection'],['consents','App consents'],['bg','Emergency access'],['sep','On-premises'],['ad','Active Directory'],['gpo','Group Policy'],['shares','File shares'],['sync','Directory sync'],['sep','Tools'],['ps','PowerShell'],['sep','Monitoring'],['report','Reporting'],['signins','Sign-in logs'],['audit','Audit log'],['sep','Reference'],['policy','Access policy'],['runbooks','Runbooks'],['sep','You'],['myroles','My roles'],['tour','Walkthrough'],['scenarios','Scenarios']];
    var cur = {ticket:'tickets', user:'users', group:'groups', role:'roles', app:'apps'}[S.page] || S.page;
    navItems = navItems.filter(function(n){ return !(n[0]==='rbac' && !D.roleModel) && !(n[0]==='vault' && !D.vault) && !(n[0]==='authm' && !D.authMethods) && !(n[0]==='ext' && !D.external) && !(n[0]==='pkg' && !D.packages) && !(n[0]==='hr' && !D.hrFeed) && !(n[0]==='review' && !D.review) && !(n[0]==='findings' && !D.findings) && !(n[0]==='svc' && !svcList().length) && !(n[0]==='appregs' && !S.appRegs.length) && !(n[0]==='risk' && !S.risk.length) && !(n[0]==='consents' && !S.consents.length) && !(n[0]==='bg' && !(S.bg||[]).length) && !(n[0]==='scenarios' && Object.keys(SCN).length<2); });
    navItems = navItems.filter(function(n, ix){ if(n[0]!=='sep') return true; for(var k=ix+1;k<navItems.length;k++){ if(navItems[k][0]!=='sep') return true; } return false; });
    navItems = navItems.filter(function(n, ix){ return !(n[0]==='sep' && navItems[ix+1] && navItems[ix+1][0]==='sep'); });
    root.innerHTML = '<div class="shell"><nav class="nav" aria-label="Console">' + navItems.map(function(n){
      if(n[0]==='sep') return '<div class="sep">' + n[1] + '</div>';
      return '<button class="' + (cur===n[0]?'on':'') + '" data-nav="' + n[0] + '" type="button"><span>' + n[1] + '</span>' + (n[0]==='tickets' ? '<span class="badge"' + (openCount()?'':' hidden') + '>' + openCount() + '</span>' : n[0]==='myroles' && pimOn() ? '<span class="badge warnb">PRA</span>' : '') + '</button>';
    }).join('') + '<div class="navfoot"><div>Tenant <span class="mono">' + DOM + '</span></div><div>Signed in as ia.analyst</div><div class="mono">console build 4.19.0</div></div></nav><main class="main" id="main">' + page() + '</main></div>';
    wire();
    tourPaint();
  }
  function split(s){ return s.split('|'); }

  function wire(){
    var m = root;
    var on = function(sel, fn){ m.querySelectorAll(sel).forEach(function(b){ b.onclick = function(e){ e.stopPropagation(); fn(b, e); }; }); };
    // Clickable table rows were mouse-only: a <tr> takes a click handler but is
    // not in the tab order and has no implicit role, so a keyboard user could
    // not open a single user, group, ticket or application record. Every table
    // in the console is built the same way, so this fixes all of them at once.
    m.querySelectorAll('tr.click').forEach(function(tr){
      if(tr.getAttribute('tabindex')===null) tr.setAttribute('tabindex','0');
      if(!tr.getAttribute('role')) tr.setAttribute('role','button');
      if(!tr.getAttribute('aria-label')){
        var first = tr.querySelector('td');
        if(first){
          var label = (first.innerText || first.textContent || '').trim().split('\n')[0].trim();
          if(label) tr.setAttribute('aria-label', 'Open ' + label);
        }
      }
      tr.onkeydown = function(ev){
        if(ev.key === 'Enter' || ev.key === ' ' || ev.key === 'Spacebar'){ ev.preventDefault(); tr.click(); }
      };
    });
    on('[data-nav]', function(b){ if(b.dataset.nav==='tour') return tourStart(); nav(b.dataset.nav); });
    m.querySelectorAll('[data-ticket]').forEach(function(b){ b.onclick = function(){ nav('ticket', b.dataset.ticket); }; });
    on('[data-user]', function(b){ nav('user', b.dataset.user); });
    on('[data-group]', function(b){ S.gtab='members'; nav('group', b.dataset.group); });
    on('[data-role]', function(b){ nav('role', b.dataset.role); });
    on('[data-app]', function(b){ nav('app', b.dataset.app); });
    on('[data-utab]', function(b){ S.utab = b.dataset.utab; render(); });
    on('[data-gtab]', function(b){ S.gtab = b.dataset.gtab; render(); });
    on('[data-tf]', function(b){ S.tfilt = b.dataset.tf; render(); });
    on('[data-sc]', function(b){ S.sfilt = b.dataset.sc; render(); });
    on('[data-ac]', function(b){ S.acat = b.dataset.ac; render(); });
    m.querySelectorAll('[data-sid]').forEach(function(b){ b.onclick = function(){ signinDetail(b.dataset.sid); }; });
    m.querySelectorAll('[data-aud]').forEach(function(b){ b.onclick = function(){ auditDetail(b.dataset.aud); }; });
    on('[data-end]', endShift);
    on('[data-clearq]', function(){ S.q=''; gsI.value=''; render(); });
    on('[data-create]', function(b){ var u = U(b.dataset.create); if(isSync(u)) return nav('user', u.upn, 'ad'); createAccount(b.dataset.create); });
    on('[data-add]', function(b){ addMembership(b.dataset.add, null); });
    on('[data-addg]', function(b){ addMembership(null, b.dataset.addg); });
    on('[data-rm]', function(b){ var p = split(b.dataset.rm); removeMembership(p[0], +p[1]); });
    on('[data-rmrole]', function(b){ var p = split(b.dataset.rmrole); removeRole(p[0], +p[1]); });
    on('[data-addrole]', function(b){ addRole(b.dataset.addrole); });
    on('[data-rmapp]', function(b){ var p = split(b.dataset.rmapp); removeApp(p[0], +p[1]); });
    on('[data-addapp]', function(b){ addApp(b.dataset.addapp); });
    on('[data-rmown]', function(b){ var p = split(b.dataset.rmown); removeOwner(p[0], p[1]); });
    on('[data-addown]', function(b){ addOwner(b.dataset.addown); });
    on('[data-licadd]', function(b){ var u = U(b.dataset.licadd); if(u.status==='Not created') return openModal('No cloud account yet', '<p>' + esc(u.name) + ' exists in Active Directory but hasn’t synced to the cloud, so there’s nothing to license yet.</p>', 'Directory sync', function(){ nav('sync'); }); assignLicense(b.dataset.licadd); });
    on('[data-licrm]', function(b){ removeLicense(b.dataset.licrm); });
    on('[data-mbx]', function(b){ var p = split(b.dataset.mbx); mbxAction(p[0], p[1], +p[2]); });
    on('[data-od]', function(b){ odShare(b.dataset.od); });
    on('[data-hold]', function(b){ holdAction(b.dataset.hold); });
    on('[data-trust]', function(b){ var p = split(b.dataset.trust); trustAction(p[0], p[1]); });
    on('[data-spn]', function(b){ var p = split(b.dataset.spn); spnAction(p[0], +p[1]); });
    on('[data-gpo]', function(b){ var p = split(b.dataset.gpo); gpoAction(p[0], p[1]); });
    var da = document.getElementById('deleg-add'); if(da) da.onclick = delegAdd;
    on('[data-gmsa]', function(b){ gmsaConvert(b.dataset.gmsa); });
    var kr = document.getElementById('krb-reset'); if(kr) kr.onclick = krbReset;
    var ks = document.getElementById('krb-sched'); if(ks) ks.onclick = krbSchedule;
    on('[data-dev]', function(b){ var p = split(b.dataset.dev); deviceAction(p[0], +p[1], p[2]); });
    on('[data-mfarm]', function(b){ var p = split(b.dataset.mfarm); removeMfa(p[0], p[1]==='all' ? 'all' : +p[1]); });
    on('[data-props]', function(b){ editProps(b.dataset.props); });
    on('[data-contact]', function(b){ contactUser(b.dataset.contact); });
    on('[data-report]', function(b){ reportSecurity(b.dataset.report); });
    on('[data-rev]', function(b){ reviewDecide(b.dataset.rev); });
    on('[data-risk]', function(b){ var p = split(b.dataset.risk); riskDecide(p[0], p[1]); });
    on('[data-consent]', function(b){ var p = split(b.dataset.consent); consentAction(p[0], p[1]); });
    on('[data-auth]', function(b){ authToggle(b.dataset.auth); });
    on('[data-svcowner]', function(b){ svcSetOwner(b.dataset.svcowner); });
    on('[data-svcint]', function(b){ svcInteractive(b.dataset.svcint); });
    on('[data-svcunlock]', function(b){ svcUnlock(b.dataset.svcunlock); });
    on('[data-svcrot]', function(b){ svcRotate(b.dataset.svcrot); });
    on('[data-reportobj]', function(b){ reportObj(b.dataset.reportobj); });
    on('[data-job]', function(b){ var p = split(b.dataset.job); jobAction(p[0], +p[1], p[2]); });
    on('[data-concept]', function(b){ conceptOpen(b.dataset.concept); });
    on('[data-hint]', function(b){ hintBump(b.dataset.hint); });
    on('[data-decscan]', function(b){ decomScan(b.dataset.decscan); });
    on('[data-decsso]', function(b){ decomSso(b.dataset.decsso); });
    on('[data-decdep]', function(b){ decomDeprov(b.dataset.decdep); });
    on('[data-decconn]', function(b){ decomConn(b.dataset.decconn); });
    on('[data-decgrp]', function(b){ decomGroup(b.dataset.decgrp); });
    on('[data-decper]', function(b){ decomPerson(b.dataset.decper); });
    on('[data-decca]', function(b){ decomCA(b.dataset.decca); });
    on('[data-decreg]', function(b){ decomReg(b.dataset.decreg); });
    on('[data-declic]', function(b){ decomLic(b.dataset.declic); });
    on('[data-rmine]', function(){ rbacMine(); });
    on('[data-rdef]', function(b){ rbacDefine(b.dataset.rdef); });
    on('[data-rasg]', function(b){ rbacAssign(b.dataset.rasg); });
    on('[data-rown]', function(b){ rbacOwner(b.dataset.rown); });
    on('[data-rstrip]', function(b){ rbacStrip(b.dataset.rstrip); });
    on('[data-rex]', function(b){ rbacException(b.dataset.rex); });
    on('[data-vout]', function(b){ vaultCheckout(b.dataset.vout); });
    on('[data-vin]', function(b){ var a = vAcc(b.dataset.vin); vaultCheckin(b.dataset.vin, vOverdue(a) || a.checkedOutBy !== ME); });
    on('[data-vrot]', function(b){ vaultRotate(b.dataset.vrot); });
    on('[data-vpol]', function(b){ vaultPolicy(b.dataset.vpol); });
    on('[data-vonboard]', function(b){ vaultOnboard(b.dataset.vonboard); });
    on('[data-voff]', function(b){ vaultOffboard(b.dataset.voff); });
    on('[data-vrec]', function(b){ vaultRecording(b.dataset.vrec); });
    on('[data-amedit]', function(b){ amEdit(b.dataset.amedit); });
    on('[data-sspr]', function(){ ssprEdit(); });
    on('[data-amcamp]', function(){ amCampaign(); });
    on('[data-amreg]', function(b){ amRegAction(+b.dataset.amreg); });
    on('[data-grmg]', function(b){ var q = split(b.dataset.grmg); guestGroupRemove(q[0], q[1]); });
    on('[data-gsponsor]', function(b){ guestSponsor(b.dataset.gsponsor); });
    on('[data-gexp]', function(b){ guestExpiry(b.dataset.gexp); });
    on('[data-grm]', function(b){ guestRemove(b.dataset.grm); });
    on('[data-collab]', function(){ collabEdit(); });
    on('[data-ppol]', function(b){ pkgPolicy(b.dataset.ppol); });
    on('[data-preq]', function(b){ var q = split(b.dataset.preq); pkgDecide(q[0], q[1], q[2]); });
    on('[data-hrnew]', function(b){ hrNew(b.dataset.hrnew); });
    on('[data-hrmatch]', function(b){ hrMatch(b.dataset.hrmatch); });
    on('[data-hrname]', function(b){ hrName(b.dataset.hrname); });
    on('[data-hrleave]', function(b){ hrLeaver(b.dataset.hrleave); });
    on('[data-hrhold]', function(b){ hrHold(b.dataset.hrhold); });
    on('[data-apptab]', function(b){ S.apptab = b.dataset.apptab; render(); });
    on('[data-ssoedit]', function(b){ ssoEdit(b.dataset.ssoedit); });
    on('[data-ssoclaim]', function(b){ ssoClaim(b.dataset.ssoclaim); });
    on('[data-ssocert]', function(b){ ssoCert(b.dataset.ssocert); });
    on('[data-ssotest]', function(b){ ssoTest(b.dataset.ssotest); });
    on('[data-scimtoggle]', function(b){ scimToggle(b.dataset.scimtoggle); });
    on('[data-scimscope]', function(b){ scimScope(b.dataset.scimscope); });
    on('[data-scimremove]', function(b){ scimRemove(b.dataset.scimremove); });
    on('[data-scimrun]', function(b){ scimRun(b.dataset.scimrun); });
    on('[data-scimdel]', function(b){ var q = split(b.dataset.scimdel); scimDeprovision(q[0], q[1]); });
    on('[data-secadd]', function(b){ secretAdd(b.dataset.secadd); });
    on('[data-secrev]', function(b){ var p = split(b.dataset.secrev); secretRevoke(p[0], p[1]); });
    on('[data-regown]', function(b){ regOwners(b.dataset.regown); });
    on('[data-quar]', function(b){ quarantine(b.dataset.quar); });
    on('[data-attach]', function(b){ attachEvidence(b.dataset.attach); });
    var rsub = document.getElementById('rev-submit'); if(rsub) rsub.onclick = reviewSubmit;
    on('[data-adou]', function(b){ S.adou = b.dataset.adou; render(); });
    on('[data-aduser]', function(b){ nav('user', b.dataset.aduser, 'ad'); });
    on('[data-adtab]', function(b){ nav('user', b.dataset.adtab, 'ad'); });
    on('[data-adcreate]', function(b){ adCreate(b.dataset.adcreate); });
    on('[data-adtoggle]', function(b){ adToggle(b.dataset.adtoggle); });
    on('[data-admove]', function(b){ adMove(b.dataset.admove); });
    on('[data-adadd]', function(b){ adGroups(b.dataset.adadd, false); });
    on('[data-adrm]', function(b){ var p = split(b.dataset.adrm); adGroups(p[0], true, +p[1]); });
    on('[data-adobj]', function(b){ var o = S.adOnly[+b.dataset.adobj], i = +b.dataset.adobj;
      openModal(o.name, '<dl class="kv sm"><dt>Logon name</dt><dd class="mono">' + esc(D.netbios) + '\\' + esc(o.sam) + '</dd><dt>OU</dt><dd class="mono">' + esc(o.ou) + '</dd><dt>State</dt><dd>' + (o.enabled?'Enabled':'Disabled') + '</dd><dt>Password set</dt><dd>' + esc(o.pwdSet) + (o.pwdNeverExpires ? ' · <b style="color:var(--warn)">never expires</b>' : '') + '</dd><dt>Last logon</dt><dd class="mono">' + esc(o.last||o.lastLogon) + '</dd><dt>Member of</dt><dd>' + (o.groups.length ? o.groups.map(function(g, gi){ return '<div class="row" style="gap:6px;margin-bottom:3px"><span class="mono">' + esc(g) + '</span><button class="btn danger sm" data-aogrm="' + i + '|' + gi + '" type="button">Remove</button></div>'; }).join('') : '<span class="mono faint">—</span>') + '</dd><dt>Description</dt><dd>' + esc(o.desc) + '</dd></dl><div class="row" style="margin-top:12px">' + (o.enabled ? '<button class="btn sec sm" id="ao-dis" type="button">Disable account</button>' : '') + '<button class="btn sec sm" id="ao-mv" type="button">Move to another OU</button><button class="btn sec warnb sm" id="ao-rep" type="button">Report to Security</button></div>', null, null, function(close){
        var a = document.getElementById('ao-dis'); if(a) a.onclick = function(){ close(); later2(function(){ adOnlyAction(i, 'disable'); }); };
        document.getElementById('ao-mv').onclick = function(){ close(); later2(function(){ adOnlyAction(i, 'move'); }); };
        document.getElementById('ao-rep').onclick = function(){ close(); later2(function(){ reportObj(o.sam); }); };
        modalEl.querySelectorAll('[data-aogrm]').forEach(function(bb){ bb.onclick = function(){ var pp = bb.dataset.aogrm.split('|'); close(); later2(function(){ adOnlyGroupRemove(+pp[0], +pp[1]); }); }; });
      });
    });
    on('[data-ace]', function(b){ var p = split(b.dataset.ace); aceRemove(p[0], p[1], +p[2]); });
    on('[data-close]', function(b){ closeHandle(+b.dataset.close); });
    on('[data-deleg]', function(b){ delegRemove(+b.dataset.deleg); });
    on('[data-ca]', function(b){ caToggle(b.dataset.ca); });
    on('[data-caedit]', function(b){ caEdit(b.dataset.caedit); });
    var wiBind = function(id, key, kind){ var el = document.getElementById(id); if(!el) return;
      el.onchange = function(){ S.whatif = S.whatif || {}; S.whatif[key] = kind==='check' ? el.checked : el.value; save(); render(); }; };
    wiBind('wi-u','upn'); wiBind('wi-a','app'); wiBind('wi-c','client'); wiBind('wi-r','risk');
    wiBind('wi-m','mfa','check'); wiBind('wi-d','compliant','check'); wiBind('wi-p','phishResistant','check'); wiBind('wi-n','anon','check');
    on('[data-bg]', function(b){ var x = split(b.dataset.bg); bgAction(x[0], x[1]); });
    on('[data-unlock]', function(b){ unlockAccount(b.dataset.unlock); });
    var efu = document.getElementById('efu'); if(efu) efu.onchange = function(){ S.efu = efu.value; render(); };
    var gpu = document.getElementById('gpu'); if(gpu) gpu.onchange = function(){ S.gpu = gpu.value; render(); };
    on('[data-psmode]', function(b){ S.psreal = b.dataset.psmode==='real'; S.ps = []; save(); render(); });
    var psin = document.getElementById('psin');
    if(psin){
      var term = document.getElementById('term'); term.scrollTop = term.scrollHeight; psin.focus();
      var hi = -1;
      psin.onkeydown = function(ev){
        if(ev.key==='Enter'){ var v = psin.value; psin.value=''; if(!v.trim()) return;
          if(DESK && S.psreal){ psOut('PS> ' + v, 'in'); save(); render();
            window.LPDesktop.run(v).then(function(r){ (r.out||'').split('\n').forEach(function(l){ if(l.trim()!=='') psOut(l.replace(/\r$/,'')); }); (r.err||'').split('\n').forEach(function(l){ if(l.trim()!=='') psOut(l.replace(/\r$/,''), 'err'); }); if(!r.out && !r.err) psOut('(no output)'); save(); render(); });
            return; }
          psExec(v); save(); render(); }
        else if(ev.key==='ArrowUp' || ev.key==='ArrowDown'){
          var hist = S.ps.filter(function(l){ return l.t==='in'; }).map(function(l){ return l.s.replace('PS C:\\> ',''); });
          if(!hist.length) return; if(hi<0) hi = hist.length;
          hi += ev.key==='ArrowUp' ? -1 : 1; hi = Math.max(0, Math.min(hist.length-1, hi));
          psin.value = hist[hi]; ev.preventDefault();
        }
      };
    }
    on('[data-tap]', function(b){ issueTap(b.dataset.tap); });
    var sn = document.getElementById('sync-now'); if(sn) sn.onclick = syncNow;
    on('[data-toggle]', function(b){
      var u = U(b.dataset.toggle), dis = u.status==='Enabled';
      if(isSync(u)) return syncGuard('the sign-in state');
      confirmBox(dis?'Disable account':'Enable account', dis ? '<p>Disable <b>' + esc(u.name) + '</b>?</p>' + impact(['New sign-ins are blocked.', 'Dynamic group memberships (GRP-AllStaff) drop automatically.'], u.sessions.length + ' active session(s) are <b>not</b> affected. Revoke sessions separately.') : '<p>Re-enable <b>' + esc(u.name) + '</b>? They’ll be able to sign in again with their existing access and MFA methods.</p>', dis?'Disable':'Enable', function(){
        act(dis?'Disable account':'Enable account', u.name, function(){ u.status = dis ? 'Disabled' : 'Enabled'; if(dis && u.upn==='s.whitfield') later(6, 'samCheck'); }, (dis?'Disabled ':'Enabled ') + u.name, {refs:['u:'+u.upn], detail:'accountEnabled: ' + (dis ? 'true → false' : 'false → true')});
      }, dis);
    });
    on('[data-revoke]', function(b){
      var u = U(b.dataset.revoke);
      confirmBox('Revoke sessions', '<p>Sign <b>' + esc(u.name) + '</b> out of all ' + u.sessions.length + ' active session(s)?</p>' + impact([u.sessions.map(function(s){ return esc(s.dev); }).join(', ')], 'All refresh tokens are invalidated. This can’t be undone.'), 'Revoke all', function(){
        var n = u.sessions.length;
        act('Revoke sign-in sessions', u.name, function(){ u.sessions = []; u.revokedAt = S.clock; }, 'Revoked ' + n + ' session(s) for ' + u.name, {cat:'Authentication', refs:['u:'+u.upn], detail:n + ' refresh token(s) invalidated.'});
      }, true);
    });
    on('[data-reset]', function(b){ var u = U(b.dataset.reset); if(isSync(u) && S.utab!=='ad') return syncGuard('the password'); resetPassword(b.dataset.reset); });
    var po = document.getElementById('pim-on'); if(po) po.onclick = function(){ activatePim(null); };
    var pf = document.getElementById('pim-off'); if(pf) pf.onclick = function(){ act('Deactivate role', 'Privileged Role Administrator', function(){ S.pim = 0; }, 'Privileged Role Administrator deactivated', {cat:'Role management', mins:1}); };
    var sf = document.getElementById('sf'); if(sf) sf.oninput = function(){ S.sf = sf.value; var p = sf.selectionStart; render(); var n = document.getElementById('sf'); n.focus(); try{ n.setSelectionRange(p,p); }catch(e){} };
    m.querySelectorAll('[data-rb]').forEach(function(c){ c.onchange = function(){ S.tickets[S.arg].rb[+c.dataset.rb] = c.checked; save(); }; });

    var asg = document.getElementById('t-assign'); if(asg) asg.onclick = function(){ var st = S.tickets[S.arg]; st.assignee = 'you'; tl(S.arg, 'sys', 'you', 'Assigned to IAM Analyst (you). Status: New → In progress.'); S.audit.unshift({tl:stamp(), actor:ME, cat:'Ticketing', action:'Assign ticket', target:S.arg, detail:'Assigned to self.', refs:[], cid:guid('a'+S.arg), mine:true}); save(); render(); };
    var ck = 'reply';
    m.querySelectorAll('[data-ck]').forEach(function(b){ b.onclick = function(){ ck = b.dataset.ck; m.querySelectorAll('[data-ck]').forEach(function(x){ x.classList.toggle('on', x===b); }); var ta = document.getElementById('c-text'); ta.placeholder = ck==='reply' ? 'Write a reply. The requester will see this.' : 'Internal note. Only IT staff can see this.'; ta.classList.toggle('int', ck==='note'); document.getElementById('c-send').textContent = ck==='reply' ? 'Send reply' : 'Add note'; }; });
    var cs = document.getElementById('c-send'); if(cs) cs.onclick = function(){
      var ta = document.getElementById('c-text'), txt = ta.value.trim(), id = S.arg, st = S.tickets[id]; if(txt.length < 2) return;
      st.assignee = st.assignee || 'you';
      tl(id, ck, 'you', txt);
      if(ck==='reply' && !st.replied){ st.replied = true; var r = replyFor(id); if(r) later(4, 'reply', {tid:id, from:r.from, text:r.text}); }
      S.clock += 1; run(); save(); toast(ck==='reply' ? 'Reply sent to ' + whoShort(T(id).requester) : 'Internal note added'); render();
    };
    var disp = document.getElementById('r-disp');
    if(disp){
      var note = document.getElementById('r-note'), go = document.getElementById('r-go'), need = document.getElementById('r-need'), tow = document.getElementById('r-tow');
      var chk = function(){ tow.hidden = disp.value!=='route'; var ok = disp.value && note.value.trim().length>=10; go.disabled = !ok; go.textContent = disp.value==='route' ? 'Request approval' : disp.value==='security' ? 'Escalate' : 'Resolve'; need.textContent = !disp.value ? 'Choose an action.' : (note.value.trim().length<10 ? 'Add a work note.' : ''); };
      disp.onchange = chk; note.oninput = chk; chk();
      go.onclick = function(){
        var id = S.arg, st = S.tickets[id], v = disp.value;
        st.assignee = 'you'; st.note = note.value.trim(); st.disp = v; st.at = fmt(S.clock);
        var dl = DISP.filter(function(d){ return d[0]===v; })[0][1];
        if(v==='route'){
          var to = document.getElementById('r-to').value; st.status = 'pending'; st.to = to; st.asked.push(to); st.askedAt = fmt(S.clock);
          tl(id, 'sys', 'you', 'Approval requested from ' + U(to).name + '. Status → Pending approval. Note: “' + st.note + '”');
          later(5, 'approval', {tid:id, to:to});
        } else {
          st.status = 'resolved';
          tl(id, 'sys', 'you', (v==='security' ? 'Escalated to Security Operations' : dl) + '. Note: “' + st.note + '”');
          if(v==='security') later(4, 'secops', {tid:id});
        }
        S.audit.unshift({tl:stamp(), actor:ME, cat:'Ticketing', action:v==='route' ? 'Request approval' : v==='security' ? 'Escalate ticket' : 'Resolve ticket', target:id, detail:dl + (v==='route' ? ' → ' + U(st.to).name : '') + '. Note: “' + st.note + '”', refs:[], cid:guid('t'+id+S.clock), mine:true});
        S.clock += 3; run(); save(); prog();
        toast(v==='route' ? id + ' is pending approval' : v==='security' ? id + ' escalated to Security' : 'Resolved ' + id); nav('tickets');
      };
    }
    var ro = document.getElementById('r-reopen'); if(ro) ro.onclick = function(){ var st = S.tickets[S.arg]; st.status = 'returned'; st.at = null; tl(S.arg, 'sys', 'you', 'Reopened.'); S.audit.unshift({tl:stamp(), actor:ME, cat:'Ticketing', action:'Reopen ticket', target:S.arg, detail:'', refs:[], cid:guid('o'+S.arg+S.clock), mine:true}); save(); render(); };
  }

  function endShift(){ if(openCount()) return; confirmBox('End shift', '<p>End your shift? You’ll see how your decisions played out, and you won’t be able to change anything after this.</p>', 'End shift', function(){ S.screen='later'; save(); render(); window.scrollTo(0,0); }); }
  function resetAll(){ S = fresh(); save(); gsI.value=''; closePanel(); render(); window.scrollTo(0,0); }
  function shortcuts(){
    openModal('Keyboard shortcuts', '<table class="t"><tbody>' + [['/','Search users, groups, apps and tickets'],['g then t','Go to tickets'],['g then u','Go to users'],['g then g','Go to groups'],['g then r','Go to admin roles'],['g then s','Go to sign-in logs'],['g then a','Go to audit log'],['g then p','Go to access policy'],['n','Open notifications'],['Esc','Close dialog'],['?','Show this list']].map(function(r){ return '<tr><td><kbd>' + r[0].split(' then ').join('</kbd> then <kbd>') + '</kbd></td><td>' + r[1] + '</td></tr>'; }).join('') + '</tbody></table>', null);
  }

  document.getElementById('endshift').onclick = endShift;
  document.getElementById('reset').onclick = function(){ confirmBox('Reset simulation', '<p>Start the scenario over? All changes, replies and resolutions will be cleared.</p>', 'Reset', resetAll, true); };
  document.getElementById('bell').onclick = function(e){ e.stopPropagation(); openNotes(); };
  document.getElementById('pimchip').onclick = function(){ if(S.screen==='console') nav('myroles'); };
  document.querySelector('.me').onclick = function(){ if(S.screen!=='console') return; confirmBox('Sign out', '<p>Signed in as <span class="mono">' + ME + '</span>.</p><p class="faint">Sign out? Your shift is saved. You’ll need to complete MFA again.</p>', 'Sign out', function(){ S.screen='login'; S.authErr=''; save(); render(); }); };
  document.addEventListener('click', function(e){ if(!panel.hidden && !panel.contains(e.target)) closePanel(); });
  var gsI = document.getElementById('gsearch');
  gsI.oninput = function(){ searchResults(gsI.value); };
  gsI.onblur = function(){ setTimeout(function(){ document.getElementById('sres').hidden = true; }, 120); };
  gsI.onkeydown = function(e){ if(e.key==='Enter' && S.screen==='console'){ S.q = gsI.value; document.getElementById('sres').hidden = true; gsI.blur(); nav('users'); } if(e.key==='Escape'){ gsI.value=''; gsI.blur(); } };
  var gPending = false;
  document.addEventListener('keydown', function(e){
    if(S.screen!=='console' || modalEl.innerHTML) return;
    var tag = (e.target.tagName||'').toLowerCase(); if(tag==='input' || tag==='textarea' || tag==='select') return;
    if(e.key==='/'){ e.preventDefault(); gsI.focus(); return; }
    if(e.key==='?'){ shortcuts(); return; }
    if(gPending){ gPending = false; var map = {t:'tickets',u:'users',g:'groups',r:'roles',s:'signins',a:'audit',p:'policy',h:'home'}; if(map[e.key]) nav(map[e.key]); return; }
    if(e.key==='n'){ openNotes(); return; }
    if(e.key==='g'){ gPending = true; setTimeout(function(){ gPending = false; }, 1200); }
  });

  // live clock: one simulated minute every 10 seconds on shift
  setInterval(function(){
    if(S.screen!=='console' || S.done || document.hidden) return;
    var before = S.notes.length;
    S.clock += 1; run(); save(); chrome();
    if(S.notes.length!==before && (S.page==='tickets' || S.page==='home' || S.page==='ticket') && !modalEl.innerHTML && document.activeElement.tagName!=='TEXTAREA' && document.activeElement.tagName!=='INPUT') render();
  }, 10000);

  // ---------- app shell ----------
  (function(){
    try{
      if(!document.querySelector('link[rel="manifest"]')){ var l = document.createElement('link'); l.rel = 'manifest'; l.href = 'manifest.webmanifest'; document.head.appendChild(l); }
      if(!document.querySelector('meta[name="theme-color"]')){ var m = document.createElement('meta'); m.name = 'theme-color'; m.content = '#12171B'; document.head.appendChild(m); }
      if('serviceWorker' in navigator && location.protocol.indexOf('http')===0) navigator.serviceWorker.register('sw.js').catch(function(){});
    }catch(e){}
    var ib = document.getElementById('installbtn'), deferred = null;
    var standalone = false; try{ standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; }catch(e){}
    window.addEventListener('beforeinstallprompt', function(ev){ ev.preventDefault(); deferred = ev; if(ib && !DESK && !standalone) ib.hidden = false; });
    window.addEventListener('appinstalled', function(){ if(ib) ib.hidden = true; toast('Installed. It opens in its own window from now on.'); });
    if(ib) ib.onclick = function(){
      if(deferred){ deferred.prompt(); deferred = null; ib.hidden = true; return; }
      openModal('Install this app', '<p>Your browser didn’t offer the one-click install, so do it from the browser menu:</p><dl class="kv sm"><dt>Chrome / Edge</dt><dd>The install icon at the right of the address bar, or menu → Cast, save and share → Install page as app.</dd><dt>Safari (Mac)</dt><dd>File → Add to Dock.</dd><dt>iPhone / Android</dt><dd>Share → Add to Home Screen.</dd></dl><p class="faint">Once installed it opens in its own window, keeps your progress, and works with no connection.</p>', null);
    };
    var off = document.getElementById('offline');
    var net = function(){ if(off) off.hidden = navigator.onLine !== false; };
    window.addEventListener('online', net); window.addEventListener('offline', net); net();
    if(DESK){ var e2 = document.querySelector('.env'); if(e2) e2.textContent = 'DESKTOP'; }
  })();

  loadScenario(CUR);
  if(window.LP_MANIFEST) setTimeout(prefetchScenarios, 1500);
  if(Object.keys(SCN).length > 1) S.screen = 'pick';
  render();
})();
