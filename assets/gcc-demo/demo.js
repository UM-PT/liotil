"use strict";
const de = document.documentElement.lang === "de";
const text = de ? {
    loaded:"Beispieldokumente geladen.", applied:"Beispielmaßnahme angewendet.", reset:"Wähle ein Unternehmen und lade die Beispieldokumente.",
    complete:"Alle vorbereiteten Prüfungen sind bestanden.", synthetic:"synthetisches Beispiel", ready:"Keine Maßnahme erforderlich",
    impact:(a,b,c,d)=>"Readiness "+a+" % → "+b+" % · Kritische Hindernisse "+c+" → "+d,
    failure:"Die Demo konnte nicht geladen werden. Bitte lade die Seite neu oder öffne den Beispielreport.",
    statuses:{VALID:"Gültig",EXPIRED:"Abgelaufen",MISSING:"Fehlt",REVIEW:"Prüfen",EXPIRING:"Läuft bald ab"},
    names:{"Commercial Registration":"Handelsregistrierung","Zakat Certificate":"Zakat-Zertifikat","VAT Certificate":"VAT-Zertifikat","GOSI Certificate":"GOSI-Zertifikat","Chamber of Commerce Certificate":"Handelskammer-Zertifikat","Civil Defense Certificate":"Zivilschutz-Zertifikat","Bank Letter":"Bankbestätigung","Ownership Profile":"Eigentümerprofil","Authorized Signatory Letter":"Zeichnungsberechtigung","Cybersecurity Compliance Certificate":"Cybersecurity-Zertifikat"},
    verbs:{EXPIRED:"Erneuern",EXPIRING:"Erneuern",MISSING:"Hinzufügen",REVIEW:"Prüfen"},
    pending:"Nicht geladen",ref:"Vorbereiteter Nachweis",date:"Stand",
} : {
    loaded:"Sample documents loaded.", applied:"Sample action applied.", reset:"Choose a company and load its sample documents.",
    complete:"All prepared checks pass.", synthetic:"synthetic example", ready:"No action required",
    impact:(a,b,c,d)=>"Readiness "+a+"% → "+b+"% · Critical blockers "+c+" → "+d,
    failure:"The demo could not load. Please refresh the page or open the sample report.",
    statuses:{VALID:"Valid",EXPIRED:"Expired",MISSING:"Missing",REVIEW:"Review",EXPIRING:"Expiring"},
    names:{},verbs:{},pending:"Not loaded",ref:"Prepared document",date:"Checked",
};
const nodes = Object.fromEntries(["scenario","load","reset","score","valid","blockers","feedback","action-panel","action-heading","action-impact","apply","complete","report","documents","company","synthetic-label"].map(id=>[id,document.getElementById(id)]));
let data;
let step = null;
function state() {
    return data.scenarios[nodes.scenario.value].states[step ?? 0];
}
function render() {
    const scenario = data.scenarios[nodes.scenario.value];
    const current = state();
    const loaded = step !== null;
    nodes.score.textContent = loaded ? current.score + "%" : "—";
    nodes.valid.textContent = loaded ? current.summary.VALID : "—";
    nodes.blockers.textContent = loaded ? current.blockers : "—";
    nodes.company.textContent = scenario.supplier.company_name+" · CR "+scenario.supplier.cr_number+" · "+text.date+" "+data.checkedOn;
    nodes["action-panel"].hidden = !loaded;
    nodes.report.hidden = !loaded;
    nodes.report.href = loaded ? current.reportUrl : "#";
    nodes.apply.hidden = !current.action;
    nodes.complete.hidden = !current.action;
    nodes["synthetic-label"].textContent = text.synthetic;
    let title = text.ready;
    if (current.action) {
        title = de ? (text.names[current.action.requirement] ?? current.action.requirement)+" · "+text.verbs[current.action.status] : current.action.title;
    }
    nodes["action-heading"].textContent = title;
    nodes["action-impact"].textContent = current.action
        ? text.impact(current.score,current.action.projectedScore,current.blockers,current.action.blockersAfter)
        : text.complete;
    nodes.documents.replaceChildren();
    for (const result of current.results) {
        const row = document.createElement("li");
        const name = document.createElement("span");
        name.textContent = text.names[result.requirement] ?? result.requirement;
        if (loaded && result.status !== "MISSING") {
            const ref = document.createElement("small");
            ref.textContent = text.ref+" · "+result.short_name;
            name.append(ref);
        }
        const badge = document.createElement("span");
        badge.className = "status status-" + (loaded ? result.status : "pending");
        badge.textContent = loaded ? text.statuses[result.status] : text.pending;
        row.append(name,badge);
        nodes.documents.append(row);
    }
}
function reset() {
    step = null;
    nodes.feedback.textContent = text.reset;
    render();
}
nodes.scenario.addEventListener("change",()=>{ if (data) reset(); });
nodes.reset.addEventListener("click",reset);
nodes.load.addEventListener("click",()=>{
    step = 0;
    render();
    nodes.feedback.textContent = text.loaded;
});
nodes.apply.addEventListener("click",()=>{
    if (step === null || !state().action) return;
    step += 1;
    render();
    nodes.feedback.textContent = state().action ? text.applied : text.complete;
});
nodes.complete.addEventListener("click",()=>{
    if (step === null) return;
    step = data.scenarios[nodes.scenario.value].states.length - 1;
    render();
    nodes.feedback.textContent = text.complete;
});
fetch("assets/gcc-demo/data.json").then(response=>{
    if (!response.ok) throw Error("Could not load demo");
    return response.json();
}).then(value=>{
    data = value;
    render();
    nodes.load.disabled = false;
    nodes.reset.disabled = false;
}).catch(()=>{
    nodes.feedback.textContent = text.failure;
});
