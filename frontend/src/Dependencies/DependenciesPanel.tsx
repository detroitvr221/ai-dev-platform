import React from 'react';
import { useProjectStore } from '../state/useProjectStore';

export function DependenciesPanel() {
  const { packageJson, setPackageJson } = useProjectStore((s) => ({ packageJson: s.packageJson, setPackageJson: s.setPackageJson }));
  const [name, setName] = React.useState('');
  const [version, setVersion] = React.useState('latest');
  const [type, setType] = React.useState<'dep' | 'dev'>('dep');

  const deps = Object.entries(packageJson.dependencies || {});
  const devDeps = Object.entries(packageJson.devDependencies || {});

  const add = () => {
    if (!name) return;
    setPackageJson((pkg) => {
      const key = type === 'dep' ? 'dependencies' : 'devDependencies';
      const next = { ...pkg } as any;
      next[key] = { ...(pkg as any)[key], [name]: version };
      return next;
    });
    setName(''); setVersion('latest');
  };

  const remove = (depName: string, isDev: boolean) => {
    setPackageJson((pkg) => {
      const key = isDev ? 'devDependencies' : 'dependencies';
      const next = { ...pkg } as any;
      const rec = { ...(pkg as any)[key] };
      delete rec[depName];
      next[key] = rec;
      return next;
    });
  };

  const bump = (depName: string, isDev: boolean) => {
    setPackageJson((pkg) => {
      const key = isDev ? 'devDependencies' : 'dependencies';
      const rec = { ...(pkg as any)[key] };
      const cur = rec[depName] || '0.0.0';
      const bumped = cur.startsWith('^') ? cur : `^${cur}`;
      return { ...pkg, [key]: { ...rec, [depName]: bumped } } as any;
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-2 border-b flex gap-2 text-xs">
        <input className="border rounded px-2 py-1 flex-1" placeholder="name" value={name} onChange={(e)=>setName(e.target.value)} />
        <input className="border rounded px-2 py-1 w-28" placeholder="version" value={version} onChange={(e)=>setVersion(e.target.value)} />
        <select className="border rounded px-2 py-1" value={type} onChange={(e)=>setType(e.target.value as any)}>
          <option value="dep">dep</option>
          <option value="dev">dev</option>
        </select>
        <button className="px-2 py-1 border rounded" onClick={add}>Add</button>
      </div>
      <div className="flex-1 grid grid-cols-2 text-sm overflow-auto">
        <div>
          <div className="px-2 py-1 border-b font-medium">Dependencies</div>
          {deps.length === 0 ? <div className="p-2 text-slate-500 text-xs">None</div> : deps.map(([n, v]) => (
            <Row key={n} n={n} v={v} onRemove={() => remove(n, false)} onBump={() => bump(n, false)} />
          ))}
        </div>
        <div>
          <div className="px-2 py-1 border-b font-medium">Dev Dependencies</div>
          {devDeps.length === 0 ? <div className="p-2 text-slate-500 text-xs">None</div> : devDeps.map(([n, v]) => (
            <Row key={n} n={n} v={v} onRemove={() => remove(n, true)} onBump={() => bump(n, true)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Row({ n, v, onRemove, onBump }: { n: string; v: string; onRemove: () => void; onBump: () => void }) {
  return (
    <div className="px-2 py-1 border-b flex items-center justify-between">
      <div>
        <div className="font-mono text-xs">{n}</div>
        <div className="text-[10px] text-slate-500">{v}</div>
      </div>
      <div className="flex gap-2 text-[10px]">
        <button className="px-1.5 py-0.5 border rounded" onClick={onBump}>Bump</button>
        <button className="px-1.5 py-0.5 border rounded" onClick={onRemove}>Remove</button>
      </div>
    </div>
  );
}


