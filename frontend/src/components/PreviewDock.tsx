import React from 'react';
import hljs from 'highlight.js/lib/common';

export function PreviewDock({ prd, apis, code, designUrl }: { prd: string; apis: string[]; code: string; designUrl?: string }) {
  const [open, setOpen] = React.useState(true);
  const [tab, setTab] = React.useState<'design'|'code'|'docs'>('design');
  const highlighted = React.useMemo(()=>{ try { return hljs.highlightAuto(code || '').value } catch { return code } }, [code]);

  return (
    <div className={`border rounded-xl bg-white shadow-soft transition-all ${open? '':'opacity-90'}`}>
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <div className="text-sm font-medium">Live Preview</div>
        <div className="flex items-center gap-2">
          {(['design','code','docs'] as const).map((t)=> (
            <button key={t} className={`px-2 py-1 rounded text-xs ${tab===t?'bg-slate-900 text-white':'bg-slate-100 text-slate-700'}`} onClick={()=>setTab(t)}>{t[0].toUpperCase()+t.slice(1)}</button>
          ))}
          <button onClick={()=>setOpen(o=>!o)} className="text-xs px-2 py-1 rounded border">{open?'Collapse':'Expand'}</button>
        </div>
      </div>
      {open && (
        <div className="p-3 h-[520px] overflow-auto">
          {tab==='design' && (
            designUrl ? <img src={designUrl} alt="Design preview" className="rounded-lg w-full h-auto shadow" /> : <EmptyState title="No design yet" action="Generate Wireframes"/>
          )}
          {tab==='code' && (
            code ? <pre className="text-xs font-mono whitespace-pre" dangerouslySetInnerHTML={{__html: highlighted}}/> : <EmptyState title="No code yet" action="Generate Components" />
          )}
          {tab==='docs' && (
            prd || apis?.length ? (
              <div className="space-y-4">
                {prd && <DocCard title="PRD" body={prd} />}
                {apis?.length>0 && <DocCard title="APIs" body={apis.map(a=>`- ${a}`).join('\n')} />}
              </div>
            ) : <EmptyState title="No docs yet" action="Generate PRD" />
          )}
        </div>
      )}
    </div>
  );
}

function DocCard({title, body}:{title:string; body:string}){
  return (
    <div className="border rounded-lg p-3 bg-gradient-to-b from-white to-slate-50">
      <div className="text-sm font-semibold mb-2">{title}</div>
      <pre className="text-xs whitespace-pre-wrap">{body}</pre>
    </div>
  );
}

function EmptyState({title, action}:{title:string; action:string}){
  return (
    <div className="grid place-items-center h-full text-center">
      <div>
        <div className="text-slate-400 mb-2">{title}</div>
        <button className="px-3 py-1.5 text-xs rounded bg-blue-600 text-white hover:bg-blue-700">{action}</button>
      </div>
    </div>
  );
}
