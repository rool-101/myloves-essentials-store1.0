import React, {useState} from "react";
import {Link, useNavigate} from "react-router-dom";
import {supabase} from "./supabase";

export default function AdminLogin(){
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const nav=useNavigate();

  async function login(e){
    e.preventDefault(); setLoading(true); setError("");
    const {data,error:authError}=await supabase.auth.signInWithPassword({email,password});
    if(authError){setError(authError.message);setLoading(false);return;}
    const {data:admin,error:adminError}=await supabase.from("admin_users").select("id").eq("id",data.user.id).maybeSingle();
    if(adminError || !admin){await supabase.auth.signOut();setError("This account is not authorised as an admin.");setLoading(false);return;}
    nav("/admin");
  }

  return <main className="adminPage"><div className="adminCard">
    <p className="eyebrow">MYLOVE'S ESSENTIALS</p><h1>Admin Login</h1><p className="muted">Sign in to manage your products.</p>
    <form onSubmit={login} className="adminForm">
      <label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@example.com" required /></label>
      <label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Your password" required /></label>
      {error&&<p className="error">{error}</p>}
      <button className="btn full" disabled={loading}>{loading?"Signing in…":"Sign in"}</button>
    </form>
    <Link to="/" className="backLink">← Back to store</Link>
  </div></main>
}
