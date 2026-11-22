'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Check, ChevronLeft, ChevronRight, LoaderCircle, Plus, Search, Trash2, X } from 'lucide-react';
import { apiRequest } from '@/lib/api-client';

type Field = { name: string; label: string; placeholder?: string; type?: 'text'|'email'|'url'|'date'|'number'|'textarea'|'select'; options?: {label:string;value:string}[]; required?: boolean };
type ColumnFormat = 'member-link' | 'member-name' | 'member-status' | 'category-status' | 'reservation-book' | 'reservation-member' | 'fine-book' | 'currency-bdt' | 'admin-role' | 'audit-actor';
type Column = { key: string; label: string; format?: ColumnFormat };
type PageData = { items: Record<string, unknown>[]; page: number; pageSize: number; total: number; totalPages: number };

function nestedValue(value: unknown, ...keys: string[]): unknown {
  let current = value;
  for (const key of keys) {
    if (!current || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

export function ResourceManager({ title, description = '', endpoint, fields, columns, singular, canDelete = true, canCreate = true, canEdit = true, editTitle, submitLabel, successMessage }: { title: string; description?: string; endpoint: string; fields: Field[]; columns: Column[]; singular?: string; canDelete?: boolean; canCreate?: boolean; canEdit?: boolean; editTitle?: string; submitLabel?: string; successMessage?: string }) {
  const [data,setData] = useState<PageData>({items:[],page:1,pageSize:10,total:0,totalPages:0}); const [loading,setLoading] = useState(true); const [q,setQ] = useState(''); const [page,setPage] = useState(1); const [modal,setModal] = useState(false); const [saving,setSaving] = useState(false); const [editing,setEditing] = useState<Record<string,unknown>|null>(null); const [form,setForm] = useState<Record<string,string>>({});
  const load = useCallback(async()=>{setLoading(true);try{const query=new URLSearchParams({page:String(page),pageSize:'10'});if(q.trim())query.set('q',q.trim());const result=await apiRequest<PageData>(`${endpoint}?${query}`);setData(result);}catch(error){toast.error(error instanceof Error?error.message:'Unable to load records.');setData({items:[],page,pageSize:10,total:0,totalPages:0});}finally{setLoading(false);}},[endpoint,page,q]);
  useEffect(()=>{void load();},[load]);
  function openCreate(){setEditing(null);setForm(Object.fromEntries(fields.map(f=>[f.name,f.type==='select'?(f.options?.[0]?.value||''):''])));setModal(true);}
  function openEdit(item:Record<string,unknown>){setEditing(item);setForm(Object.fromEntries(fields.map(f=>{const value=item[f.name];const text=value instanceof Date?value.toISOString():String(value??'');return [f.name,f.type==='date'&&text?text.slice(0,10):text]})));setModal(true);}
  async function save(event:React.FormEvent<HTMLFormElement>){event.preventDefault();setSaving(true);try{const method=editing?'PATCH':'POST';const url=editing?`${endpoint}/${editing._id}`:endpoint;await apiRequest(url,{method,body:JSON.stringify(form)});toast.success(editing?(successMessage||'Record updated.'):'Record created.');setModal(false);await load();}catch(error){toast.error(error instanceof Error?error.message:'Save failed.');}finally{setSaving(false);}}
  async function remove(item:Record<string,unknown>){if(!window.confirm(`Archive or remove “${String(item.name||item.title||item.fullName||'this record')}”?`))return;try{await apiRequest(`${endpoint}/${item._id}`,{method:'DELETE'});toast.success('Action completed.');await load();}catch(error){toast.error(error instanceof Error?error.message:'Action failed.');}}
  function valueFor(item:Record<string,unknown>,column:Column){
    const value=item[column.key];
    switch(column.format){
      case 'member-link': return <Link className="font-semibold hover:underline" style={{color:'var(--primary)'}} href={`/admin/members/${String(item._id)}`}>{String(value||'—')}</Link>;
      case 'member-name': return String(nestedValue(item.memberId,'fullName')||'—');
      case 'member-status': { const active=value==='Active'; return <span className="rounded-full px-2.5 py-1 text-[10px] font-bold" style={{background:active?'rgba(8,132,92,.1)':'rgba(225,29,72,.1)',color:active?'var(--primary)':'#e11d48'}}>{String(value||'—')}</span>; }
      case 'category-status': { const active=value==='Active'; return <span className="rounded-full px-2.5 py-1 text-[10px] font-bold" style={{background:active?'rgba(8,132,92,.1)':'rgba(217,119,6,.1)',color:active?'var(--primary)':'#d97706'}}>{String(value||'—')}</span>; }
      case 'reservation-book': return String(nestedValue(item.bookId,'title')||'—');
      case 'reservation-member': return String(nestedValue(item.memberId,'fullName')||'—');
      case 'fine-book': return String(nestedValue(item.borrowingRecordId,'bookId','title')||'—');
      case 'currency-bdt': return `৳ ${Number(value||0).toLocaleString()}`;
      case 'admin-role': { const admin=value==='Admin'; return <span className="rounded-full px-2.5 py-1 text-[10px] font-bold" style={{background:admin?'rgba(59,130,246,.1)':'rgba(8,132,92,.1)',color:admin?'#3b82f6':'var(--primary)'}}>{String(value||'—')}</span>; }
      case 'audit-actor': return String(nestedValue(item.actorUserId,'name')||nestedValue(item.actorUserId,'email')||'System');
      default:
        if(value===undefined||value===null||value==='')return '—';
        if(typeof value==='boolean')return value?'Yes':'No';
        if(typeof value==='number')return value.toLocaleString();
        if(typeof value==='string'&&(/At$|Date$|createdAt|updatedAt/.test(column.key)||!Number.isNaN(Date.parse(value))&&value.length>10)){const d=new Date(value);if(!Number.isNaN(d.getTime()))return d.toLocaleDateString();}
        if(typeof value==='object')return String((value as {name?:string;title?:string;fullName?:string}).name||(value as {title?:string}).title||'—');
        return String(value);
    }
  }
  return <div className="space-y-5"><div className="panel overflow-hidden"><div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between" style={{borderColor:'var(--line)'}}><div className="flex items-center gap-2 rounded-xl border px-3 py-2.5 sm:w-[320px]" style={{borderColor:'var(--line)',background:'var(--page)'}}><Search size={15} className="muted"/><input value={q} onChange={e=>{setPage(1);setQ(e.target.value);}} placeholder={`Search ${title.toLowerCase()}…`} className="w-full bg-transparent text-xs outline-none"/></div><div className="flex items-center gap-2"><span className="text-xs muted">{data.total.toLocaleString()} records</span>{canCreate && <button className="btn-primary" onClick={openCreate}><Plus size={16}/> Add {singular || title.replace(/s$/,'')}</button>}</div></div>
    <div className="overflow-x-auto"><table className="w-full min-w-[680px] border-collapse"><thead><tr>{columns.map(col=><th className="table-th" key={col.key}>{col.label}</th>)}<th className="table-th text-right">Actions</th></tr></thead><tbody>{loading?<tr><td colSpan={columns.length+1} className="table-td"><div className="flex items-center justify-center gap-2 py-8 muted"><LoaderCircle size={17} className="animate-spin"/> Loading records…</div></td></tr>:data.items.length===0?<tr><td colSpan={columns.length+1} className="table-td"><div className="py-12 text-center"><div className="text-sm font-semibold">No records found</div><p className="mt-1 text-xs muted">Try another search or create your first record.</p></div></td></tr>:data.items.map(item=><tr key={String(item._id)} className="transition hover:bg-black/[.018] dark:hover:bg-white/[.025]">{columns.map(col=><td className="table-td" key={col.key}>{valueFor(item,col)}</td>)}<td className="table-td"><div className="flex justify-end gap-1">{canEdit && <button onClick={()=>openEdit(item)} className="rounded-lg border px-3 py-1.5 text-xs font-semibold" style={{borderColor:'var(--line)'}}>Edit</button>}{canDelete&&<button onClick={()=>void remove(item)} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30" title="Archive / delete"><Trash2 size={15}/></button>}</div></td></tr>)}</tbody></table></div>
    <div className="flex items-center justify-between border-t px-4 py-3" style={{borderColor:'var(--line)'}}><p className="text-xs muted">Page {data.page} of {Math.max(1,data.totalPages)} · {data.total} total</p><div className="flex gap-2"><button className="btn-secondary !p-2" disabled={page<=1||loading} onClick={()=>setPage(p=>Math.max(1,p-1))} aria-label="Previous page"><ChevronLeft size={16}/></button><button className="btn-secondary !p-2" disabled={page>=data.totalPages||loading} onClick={()=>setPage(p=>p+1)} aria-label="Next page"><ChevronRight size={16}/></button></div></div></div>
    {modal&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setModal(false);}}><section role="dialog" aria-modal="true" aria-label={`${editing?'Edit':'Add'} ${title}`} className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border p-6 shadow-2xl" style={{background:'var(--surface)',borderColor:'var(--line)'}}><div className="mb-5 flex items-start justify-between"><div><h2 className="text-lg font-bold">{editing?`${editTitle || 'Edit'} ${singular || title.replace(/s$/,'')}`:`Add ${singular || title.replace(/s$/,'')}`}</h2><p className="mt-1 text-xs muted">Fields are validated on the server before saving.</p></div><button onClick={()=>setModal(false)} className="rounded-lg p-2 hover:bg-black/5" aria-label="Close dialog"><X size={18}/></button></div><form onSubmit={save} className="space-y-4">{fields.map(field=><div key={field.name}><label className="label" htmlFor={`field-${field.name}`}>{field.label}{field.required&&' *'}</label>{field.type==='textarea'?<textarea id={`field-${field.name}`} className="input min-h-[100px] resize-y" required={field.required} value={form[field.name]||''} onChange={e=>setForm(old=>({...old,[field.name]:e.target.value}))} placeholder={field.placeholder}/>:field.type==='select'?<select id={`field-${field.name}`} className="input" required={field.required} value={form[field.name]||''} onChange={e=>setForm(old=>({...old,[field.name]:e.target.value}))}>{field.options?.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select>:<input id={`field-${field.name}`} className="input" type={field.type||'text'} required={field.required} value={form[field.name]||''} onChange={e=>setForm(old=>({...old,[field.name]:e.target.value}))} placeholder={field.placeholder}/>}</div>)}<div className="flex justify-end gap-2 border-t pt-4" style={{borderColor:'var(--line)'}}><button type="button" className="btn-secondary" onClick={()=>setModal(false)}>Cancel</button><button className="btn-primary" disabled={saving}>{saving?<LoaderCircle size={15} className="animate-spin"/>:<Check size={15}/>} {saving?'Saving…':(submitLabel || (editing?'Save changes':'Save record'))}</button></div></form></section></div>}
  </div>;
}
