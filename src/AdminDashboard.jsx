import React,{useEffect,useState} from "react";
import {Link,useNavigate} from "react-router-dom";
import {Plus, Pencil, Trash2, LogOut, X} from "lucide-react";
import {supabase} from "./supabase";

const empty={name:"",slug:"",description:"",price:"",main_image_url:"",category_id:"",brand_id:"",is_active:true};
const slugify=s=>s.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");
const money=n=>`R${Number(n||0).toLocaleString("en-ZA",{minimumFractionDigits:2,maximumFractionDigits:2})}`;

export default function AdminDashboard(){
 const [user,setUser]=useState(null),[products,setProducts]=useState([]),[categories,setCategories]=useState([]),[brands,setBrands]=useState([]);
 const [form,setForm]=useState(empty),[editing,setEditing]=useState(false),[showForm,setShowForm]=useState(false),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState("");
 const nav=useNavigate();

 useEffect(()=>{(async()=>{
   const {data:{user}}=await supabase.auth.getUser();
   if(!user){nav("/admin/login",{replace:true});return;}
   const {data:admin}=await supabase.from("admin_users").select("id").eq("id",user.id).maybeSingle();
   if(!admin){await supabase.auth.signOut();nav("/admin/login",{replace:true});return;}
   setUser(user); await load(); setLoading(false);
 })()},[]);

 async function load(){
   const [p,c,b]=await Promise.all([
     supabase.from("products").select("*,category:categories(name),brand:brands(name)").order("created_at",{ascending:false}),
     supabase.from("categories").select("id,name").order("name"),
     supabase.from("brands").select("id,name").order("name")
   ]);
   if(p.error)setError(p.error.message); else setProducts(p.data||[]);
   if(!c.error)setCategories(c.data||[]); if(!b.error)setBrands(b.data||[]);
 }
 function openNew(){setForm(empty);setEditing(false);setShowForm(true);setError("");}
 function openEdit(p){setForm({id:p.id,name:p.name||"",slug:p.slug||"",description:p.description||"",price:p.price??"",main_image_url:p.main_image_url||"",category_id:p.category_id||"",brand_id:p.brand_id||"",is_active:p.is_active!==false});setEditing(true);setShowForm(true);setError("");window.scrollTo({top:0,behavior:"smooth"});}
 async function save(e){
   e.preventDefault();setSaving(true);setError("");
   const payload={name:form.name.trim(),slug:(form.slug||slugify(form.name)),description:form.description,price:Number(form.price||0),main_image_url:form.main_image_url||null,category_id:form.category_id||null,brand_id:form.brand_id||null,is_active:!!form.is_active,updated_at:new Date().toISOString()};
   let result;
   if(editing) result=await supabase.from("products").update(payload).eq("id",form.id);
   else result=await supabase.from("products").insert(payload);
   if(result.error)setError(result.error.message); else {setShowForm(false);await load();}
   setSaving(false);
 }
 async function remove(p){
   if(!confirm(`Delete ${p.name}? This cannot be undone.`))return;
   const {error}=await supabase.from("products").delete().eq("id",p.id);if(error)setError(error.message);else await load();
 }
 async function logout(){await supabase.auth.signOut();nav("/admin/login",{replace:true});}
 if(loading)return <main className="adminPage"><p>Loading admin…</p></main>;
 return <main className="adminPage"><div className="adminWrap">
   <header className="adminHeader"><div><p className="eyebrow">MYLOVE'S ESSENTIALS</p><h1>Admin Dashboard</h1><p className="muted">{user?.email}</p></div><div className="adminActions"><Link className="btn outline" to="/">View store</Link><button className="btn" onClick={logout}><LogOut size={17}/> Sign out</button></div></header>
   {error&&<div className="errorBox">{error}</div>}
   <section className="adminToolbar"><div><h2>Products</h2><p className="muted">{products.length} product{products.length===1?"":"s"}</p></div><button className="btn" onClick={openNew}><Plus size={18}/> Add product</button></section>
   {showForm&&<form className="productEditor" onSubmit={save}><div className="editorTop"><h2>{editing?"Edit product":"Add product"}</h2><button type="button" className="icon" onClick={()=>setShowForm(false)}><X/></button></div>
     <div className="formGrid"><label>Product name<input value={form.name} onChange={e=>setForm({...form,name:e.target.value,slug:editing?form.slug:slugify(e.target.value)})} required /></label>
     <label>Price (ZAR)<input type="number" min="0" step="0.01" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} required /></label>
     <label>Category<select value={form.category_id} onChange={e=>setForm({...form,category_id:e.target.value})}><option value="">Select category</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
     <label>Brand<select value={form.brand_id} onChange={e=>setForm({...form,brand_id:e.target.value})}><option value="">Select brand</option>{brands.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
     <label className="wide">Image URL<input value={form.main_image_url} onChange={e=>setForm({...form,main_image_url:e.target.value})} placeholder="https://…" /></label>
     <label className="wide">Description<textarea rows="4" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>
     <label className="check wide"><input type="checkbox" checked={form.is_active} onChange={e=>setForm({...form,is_active:e.target.checked})}/> Visible on store</label></div>
     <button className="btn" disabled={saving}>{saving?"Saving…":editing?"Save changes":"Create product"}</button>
   </form>}
   <section className="adminProducts">{products.map(p=><article className="adminProduct" key={p.id}><div className="adminThumb">{p.main_image_url?<img src={p.main_image_url} alt=""/>:<span>No image</span>}</div><div className="adminInfo"><h3>{p.name}</h3><p>{p.category?.name||"No category"} · {p.brand?.name||"No brand"}</p><strong>{money(p.price)}</strong><small className={p.is_active?"status":"status off"}>{p.is_active?"Visible":"Hidden"}</small></div><div className="adminProductActions"><button className="icon" onClick={()=>openEdit(p)} title="Edit"><Pencil/></button><button className="icon danger" onClick={()=>remove(p)} title="Delete"><Trash2/></button></div></article>)}{!products.length&&<div className="emptyAdmin"><h3>No products yet</h3><p>Add your first product using the button above.</p></div>}</section>
 </div></main>
}
