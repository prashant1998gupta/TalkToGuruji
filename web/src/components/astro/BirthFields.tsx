'use client';

import { CityPicker } from './CityPicker';

export type BirthDefaults = { name?: string; gender?: string; date?: string; time?: string; city?: { id: string; label: string; tz: string } | null };

/** Name / gender / date / time / place inputs. `prefix` namespaces field names (e.g. "b_" for the boy in matching). */
export function BirthFields({ prefix = '', defaults = {}, showGender = true, dark }: { prefix?: string; defaults?: BirthDefaults; showGender?: boolean; dark?: boolean }) {
  const d = dark ? '!border-white/15 !bg-white/5 !text-white placeholder:!text-white/40 [color-scheme:dark]' : '';
  const lbl = dark ? 'label !text-white/60' : 'label';
  return (
    <div className="grid grid-cols-2 gap-3.5">
      <div className={showGender ? 'col-span-2 sm:col-span-1' : 'col-span-2'}>
        <label className={lbl} htmlFor={`${prefix}name`}>Name</label>
        <input id={`${prefix}name`} name={`${prefix}name`} required maxLength={60} className={`input ${d}`} defaultValue={defaults.name} placeholder="Full name" />
      </div>
      {showGender && (
        <div className="col-span-2 sm:col-span-1">
          <label className={lbl} htmlFor={`${prefix}gender`}>Gender</label>
          <select id={`${prefix}gender`} name={`${prefix}gender`} className={`input ${d}`} defaultValue={defaults.gender || 'Male'}>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
        </div>
      )}
      <div>
        <label className={lbl} htmlFor={`${prefix}date`}>Birth date</label>
        <input id={`${prefix}date`} name={`${prefix}date`} type="date" required min="1900-01-01" max="2100-12-31" className={`input ${d}`} defaultValue={defaults.date} />
      </div>
      <div>
        <label className={lbl} htmlFor={`${prefix}time`}>Birth time</label>
        <input id={`${prefix}time`} name={`${prefix}time`} type="time" required className={`input ${d}`} defaultValue={defaults.time || '12:00'} />
      </div>
      <div className="col-span-2">
        <label className={lbl}>Birth place</label>
        <CityPicker name={`${prefix}city`} required defaultValue={defaults.city} dark={dark} />
      </div>
    </div>
  );
}
