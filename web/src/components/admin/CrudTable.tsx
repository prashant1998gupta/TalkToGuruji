'use client';

import { useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { ENTITIES, toFormValues } from './entities';
import { DeleteAndGo, EntityForm } from './EntityForm';
import { Modal } from './client';
import { Table } from './ui';

type Row = Record<string, unknown> & { id: string };

/** List + modal editor for small entities (FAQs, banners, packs, categories, pages…). */
export function CrudTable({ entity, rows, options, newDefaults }: { entity: string; rows: Row[]; options?: Record<string, { value: string; label: string }[]>; newDefaults?: Record<string, unknown> }) {
  const cfg = ENTITIES[entity];
  const [editing, setEditing] = useState<Row | 'new' | null>(null);

  const cell = (r: Row, col: string) => {
    const f = cfg.fields.find((x) => x.name === col);
    const v = r[col];
    if (f?.type === 'bool') return v ? <span className="font-semibold text-leaf">Yes</span> : <span className="text-muted">No</span>;
    if (f?.type === 'image') {
      // eslint-disable-next-line @next/next/no-img-element
      return v ? <img src={String(v)} alt="" className="h-10 w-16 rounded-lg object-cover" /> : '—';
    }
    const s = v == null || v === '' ? '—' : String(v);
    return <span className="line-clamp-2 max-w-md">{s}</span>;
  };

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button type="button" className="btn-primary btn-sm" onClick={() => setEditing('new')}><Plus className="h-4 w-4" /> New {cfg.label.toLowerCase()}</button>
      </div>
      <Table head={[...cfg.columns.map((c) => cfg.fields.find((f) => f.name === c)?.label || c), '']} empty={!rows.length}>
        {rows.map((r) => (
          <tr key={r.id}>
            {cfg.columns.map((c) => <td key={c}>{cell(r, c)}</td>)}
            <td className="whitespace-nowrap text-right">
              <div className="flex justify-end gap-1.5">
                <button type="button" className="btn-ghost btn-sm" onClick={() => setEditing(r)}><Pencil className="h-3.5 w-3.5" /> Edit</button>
                <DeleteAndGo entity={entity} id={r.id} label={cfg.label} />
              </div>
            </td>
          </tr>
        ))}
      </Table>
      {editing && (
        <Modal title={editing === 'new' ? `New ${cfg.label.toLowerCase()}` : `Edit ${cfg.label.toLowerCase()}`} onClose={() => setEditing(null)} size={cfg.fields.some((f) => f.type === 'html') ? 'lg' : 'md'}>
          <EntityForm
            compact
            entity={entity}
            id={editing === 'new' ? undefined : editing.id}
            initial={editing === 'new' ? { ...toFormValues(cfg.fields, null), ...newDefaults } : toFormValues(cfg.fields, editing)}
            options={options}
            afterSave={() => setEditing(null)}
          />
        </Modal>
      )}
    </div>
  );
}
