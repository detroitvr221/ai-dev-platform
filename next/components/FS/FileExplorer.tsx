"use client";
import React from 'react';

export function FileExplorer({ files, activePath, onOpen, onNew, onMove }: {
  files: string[];
  activePath: string;
  onOpen: (p: string)=>void;
  onNew: ()=>void;
  onMove: (from: string, to: string)=>void;
}){
  return (
    <div className="w-[280px] min-w-[220px] max-w-[360px] h-full bg-white border-r">
      <div className="px-3 py-2 border-b text-xs font-medium flex items-center justify-between">
        <span>Files</span>
        <button className="px-2 py-1 border rounded text-[11px]" onClick={onNew}>New</button>
      </div>
      <div className="text-sm divide-y overflow-auto" style={{height:'calc(100% - 33px)'}}>
        {files.map((p)=> (
          <div key={p} className={`flex items-center gap-2 px-3 py-2 ${activePath===p?'bg-blue-50 text-blue-700':''}`}>
            <button className="flex-1 text-left hover:underline" onClick={()=>onOpen(p)}>{p}</button>
            <button className="text-[11px] px-1.5 py-0.5 border rounded" onClick={()=>{
              const to = prompt('Move/Rename to path', p);
              if (!to || to===p) return; onMove(p, to);
            }}>Move</button>
          </div>
        ))}
      </div>
    </div>
  );
}


