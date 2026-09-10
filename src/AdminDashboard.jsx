import React,{useEffect,useMemo,useState} from "react";
import {Link,useNavigate} from "react-router-dom";
import {Plus,Pencil,Trash2,LogOut,X,ImagePlus} from "lucide-react";
import {supabase} from "./supabase";

const empty={name:"",slug:"",description:"",price:"",main_image_url:"",category_id:"",brand_id:"",is_active:true};
const slugify=s=>s.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");
const money=n=>`R${Number(n||0).toLocaleString("en-ZA",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const imageList=value=>{if(!value)return [];try{const parsed=JSON.parse(value);return Array.isArray(parsed)?parsed.filter(Boolean):[value]}catch{return [value]}};
const imageValue=images=>images.length?JSON.stringify(images):null;

export default function AdminDashboard(){
 const [user,setUser]=useState(null),[products,setProducts]=useState([]),[categories,setCategories]=useState([]),[brands,setBrands]=useState([]);
 const [form,setForm]=useState(empty),[existingImages,setExistingImages]=useState([]),[newFiles,setNewFiles]=useState([]);
 const [editing,setEditing]=useState(false),[showForm,setShowForm]=useState(false),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState("");
 const nav=useNavigate();
 useEffect(()=>{(async()=>{
   const {data:{user}}=await supabase.auth.getUser();
   if(!user){nav("/admin/login",{replace:true});return;}
   const {data:admin}=await supabase.from("admin_users").select("id").eq("id",user.id).maybeSingle();
   if(!admin){await supabase.auth.signOut();nav("/admin/login",{replace:true});return;}
   setUser(user);await load();setLoading(false);
 })()},[]);
 async function load(){
   const [p,c,b]=await Promise.all([
     supabase.from("products").select("*,category:categories(name),brand:brands(name)").order("created_at",{ascending:false}),
     supabase.from("categories").select("id,name").order("name"),
     supabase.from("brands").select("id,name").order("name")
   ]);
   if(p.error)setError(p.error.message);else setProducts(p.data||[]);
   if(!c.error)setCategories(c.data||[]);if(!b.error)setBrands(b.data||[]);
 }
 function resetImages(){setExistingImages([]);setNewFiles([])}
 function openNew(){setForm(empty);setExistingImages([]);setNewFiles([]);setEditing(false);setShowForm(true);setError("");window.scrollTo({top:0,behavior:"smooth"})}
 function openEdit(p){setForm({id:p.id,name:p.name||"",slug:p.slug||"",description:p.description||"",price:p.price??"",main_image_url:p.main_image_url||"",category_id:p.category_id||"",brand_id:p.brand_id||"",is_active:p.is_active!==false});setExistingImages(imageList(p.main_image_url));setNewFiles([]);setEditing(true);setShowForm(true);setError("");window.scrollTo({top:0,behavior:"smooth"})}
 function chooseFiles(e){setNewFiles(prev=>[...prev,...Array.from(e.target.files||[])]);e.target.value=""}
 function removeExisting(i){setExistingImages(prev=>prev.filter((_,idx)=>idx!==i))}
 function removeNew(i){setNewFiles(prev=>prev.filter((_,idx)=>idx!==i))}
 async function uploadFiles(){
   if(!newFiles.length)return [];
   const urls=[];
   for(const file of newFiles){
     const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,"-");
     const path=`${user.id}/${crypto.randomUUID()}-${safe}`;
     const {error}=await supabase.storage.from("product-images").upload(path,file,{cacheControl:"3600",upsert:false});
     if(error)throw error;
     const {data}=supabase.storage.from("product-images").getPublicUrl(path);
     urls.push(data.publicUrl);
   }
   return urls;
 }
 async function save(e){
   e.preventDefault();setSaving(true);setError("");
   try{
     const uploaded=await uploadFiles();
     const images=[...existingImages,...uploaded];
     const payload={name:form.name.trim(),slug:(form.slug||slugify(form.name)),description:form.description,price:Number(form.price||0),main_image_url:imageValue(images),category_id:form.category_id||null,brand_id:form.brand_id||null,is_active:!!form.is_active,updated_at:new Date().toISOString()};
     const result=editing?await supabase.from("products").update(payload).eq("id",form.id):await supabase.from("products").insert(payload);
     if(result.error)throw result.error;
     setShowForm(false);resetImages();await load();
   }catch(err){setError(err.message||"Could not save product.");}
   setSaving(false);
 }
 async function remove(p){if(!confirm(`Delete ${p.name}? This cannot be undone.`))return;const {error}=await supabase.from("products").delete().eq("id",p.id);if(error)setError(error.message);else await load()}
 async function logout(){await supabase.auth.signOut();nav("/admin/login",{replace:true})}
 const newPreviews=useMemo(()=>newFiles.map(file=>({file,url:URL.createObjectURL(file)})),[newFiles]);
 useEffect(()=>()=>newPreviews.forEach(x=>URL.revokeObjectURL(x.url)),[newPreviews]);
 if(loading)return <main className="adminPage"><p>Loading admin…</p></main>;
 return <main className="adminPage"><div className="adminWrap">
   <div className="adminHeader"><div><p className="eyebrow">MYLOVE'S ESSENTIALS</p><h1>Admin Dashboard</h1><p className="muted">{user?.email}</p></div><div className="adminActions"><Link className="btn outline" to="/">View store</Link><button className="btn" onClick={logout}><LogOut size={17}/> Sign out</button></div></div>
   {error&&<div className="errorBox">{error}</div>}
   <section className="adminToolbar"><div><h2>Products</h2><p className="muted">{products.length} product{products.length===1?"":"s"}</p></div><button className="btn" onClick={openNew}><Plus size={18}/> Add product</button></section>
   {showForm&&<form className="productEditor" onSubmit={save}><div className="editorTop"><h2>{editing?"Edit product":"Add product"}</h2><button type="button" className="icon" onClick={()=>setShowForm(false)}><X/></button></div>
     <div className="formGrid"><label>Product name<input value={form.name} onChange={e=>setForm({...form,name:e.target.value,slug:editing?form.slug:slugify(e.target.value)})} required/></label>
     <label>Price (ZAR)<input type="number" min="0" step="0.01" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} required/></label>
     <label>Category<select value={form.category_id} onChange={e=>setForm({...form,category_id:e.target.value})}><option value="">Select category</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
     <label>Brand<select value={form.brand_id} onChange={e=>setForm({...form,brand_id:e.target.value})}><option value="">Select brand</option>{brands.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
     <div className="wide imageUpload"><label>Product images</label><label className="uploadBox"><ImagePlus size={22}/><span>Add one or multiple images</span><small>JPG, PNG or WEBP</small><input type="file" accept="image/*" multiple onChange={chooseFiles}/></label>
       {(existingImages.length>0||newPreviews.length>0)&&<div className="imagePreviewGrid">{existingImages.map((url,i)=><div className="imagePreview" key={`old-${url}-${i}`}><img src={url} alt=""/><button type="button" onClick={()=>removeExisting(i)}><X size={15}/></button></div>)}{newPreviews.map((x,i)=><div className="imagePreview" key={`new-${x.url}`}><img src={x.url} alt=""/><button type="button" onClick={()=>removeNew(i)}><X size={15}/></button></div>)}</div>}
     </div>
     <label className="wide">Description<textarea rows="4" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>
     <label className="check wide"><input type="checkbox" checked={form.is_active} onChange={e=>setForm({...form,is_active:e.target.checked})}/> Visible on store</label></div>
     <button className="btn" disabled={saving}>{saving?"Saving images…":editing?"Save changes":"Create product"}</button>
   </form>}
   <section className="adminProducts">{products.map(p=>{const imgs=imageList(p.main_image_url);return <article className="adminProduct" key={p.id}><div className="adminThumb">{imgs[0]?<img src={imgs[0]} alt=""/>:<span>No image</span>}</div><div className="adminInfo"><h3>{p.name}</h3><p>{p.category?.name||"No category"} · {p.brand?.name||"No brand"}</p><strong>{money(p.price)}</strong><small className={p.is_active?"status":"status off"}>{p.is_active?"Visible":"Hidden"}</small>{imgs.length>1&&<small className="imageCount">{imgs.length} images</small>}</div><div className="adminProductActions"><button className="icon" onClick={()=>openEdit(p)} title="Edit"><Pencil/></button><button className="icon danger" onClick={()=>remove(p)} title="Delete"><Trash2/></button></div></article>})}{!products.length&&<div className="emptyAdmin"><h3>No products yet</h3><p>Add your first product using the button above.</p></div>}</section>
 </div></main>
}
