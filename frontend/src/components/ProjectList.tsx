import React from 'react';

export function ProjectList({ projects, onSelect, onCreate }: { projects: any[]; onSelect: (id: string) => void; onCreate: () => void }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ fontWeight: 600 }}>Projects</div>
        <button onClick={onCreate}>New</button>
      </div>
      <ul>
        {projects.map((p) => (
          <li key={p.id}>
            <button onClick={() => onSelect(p.id)}>{p.name}</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

