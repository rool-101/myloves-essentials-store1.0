import React,{useEffect,useState} from "react";
import {Routes,Route,Link,useNavigate,useParams} from "react-router-dom";
import {Menu,ShoppingCart,Search,ChevronRight,Plus,Minus,Trash2,ArrowLeft,ShieldCheck,Truck,MessageCircle} from "lucide-react";
import {supabase} from "./supabase";
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";

const demo=[
 {id:"d1",name:"Nike Air Max",slug:"nike-air-max",price:1899,main_image_url:"",category:{name:"Sneakers"},brand:{name:"Nike"},description:"Premium Nike sneaker."},
 {id:"d2",name:"Adidas Campus",slug:"adidas-campus",price:1599,main_image_url:"",category:{name:"Sneakers"},brand:{name:"Adidas"},description:"Classic Adidas style."},
 {id:"d3",name:"iPhone 15",slug:"iphone-15",price:11999,main_image_url:"",category:{name:"iPhones"},brand:null,description:"iPhone 15. Select storage, colour and condition."}
];

const money=n=>`R${Number(n||0).toLocaleString("en-ZA",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const readCart=()=>JSON.parse(localStorage.getItem("mle_cart")||"[]");
const saveCart=c=>{localStorage.setItem("mle_cart",JSON.stringify(c));window.dispatchEvent(new Event("cartchange"));};

function Layout({children}){
 const [open,setOpen]=useState(false),[count,setCount]=useState(readCart().reduce((a,x)=>a+x.quantity,0));
 useEffect(()=>{const f=()=>setCount(readCart().reduce((a,x)=>a+x.quantity,0));window.addEventListener("cartchange",f);return()=>window.removeEventListener("cartchange",f)},[]);
 return <><header><Link to="/" className="brand" onClick={()=>setOpen(false)}>MyLove's <span>Essentials</span></Link><button className="icon" onClick={()=>setOpen(!open)}><Menu/></button></header>
 {open&&<nav className="drawer">{["/","/sneakers","/iphones","/about","/delivery","/payment","/contact","/cart","/terms","/refunds"].map((p,i)=><Link key={p} onClick={()=>setOpen(false)} to={p}>{["HOME","SNEAKERS","IPHONES","ABOUT US","DELIVERY","PAYMENT","CONTACT","CART","TERMS & CONDITIONS","RETURNS & REFUNDS"][i]}</Link>)}</nav>}
 <main>{children}</main><footer><b>MyLove's Essentials</b><p>Premium sneakers & iPhones.</p><p>WhatsApp: +27 68 758 2714</p><div><Link to="/terms">Terms</Link> · <Link to="/refunds">Returns & Refunds</Link></div></footer></>
}

async function getProducts(){
 const {data,error}=await supabase.from("products").select("*,category:categories(name),brand:brands(name)").eq("is_active",true).order("created_at",{ascending:false});
 if(error||!data?.length)return demo; return data;
}

function Home(){
 return <><section className="hero"><p className="eyebrow">PREMIUM • AUTHENTIC • CURATED</p><h1>Step into<br/><em>your next level.</em></h1><p>Shop premium sneakers and iPhones, selected for people who want quality and style.</p><div className="actions"><Link className="btn" to="/sneakers">Shop Sneakers</Link><Link className="btn outline" to="/iphones">Shop iPhones</Link></div></section>
 <section className="section"><h2>Why shop with us?</h2><div className="features"><article><ShieldCheck/><h3>Quality First</h3><p>Products are listed with clear details so you can shop with confidence.</p></article><article><Truck/><h3>Delivery</h3><p>Delivery information is provided before your order is confirmed.</p></article><article><MessageCircle/><h3>WhatsApp Orders</h3><p>Build your cart online and send the order directly to WhatsApp.</p></article></div></section>
 <section className="section"><h2>About Us</h2><p>MyLove's Essentials brings together premium footwear and iPhones in one modern online store. Browse, choose your options, add to cart and contact us on WhatsApp to complete your order.</p></section></>
}

function Catalog({kind}){
 const [products,setProducts]=useState([]),[brand,setBrand]=useState("All"),[q,setQ]=useState("");
 useEffect(()=>{getProducts().then(setProducts)},[]);
 const isSneaker=kind==="Sneakers";
 const list=products.filter(p=>(p.category?.name||"").toLowerCase().includes(kind.toLowerCase().slice(0,-1))).filter(p=>!isSneaker||brand==="All"||p.brand?.name===brand).filter(p=>p.name.toLowerCase().includes(q.toLowerCase()));
 const brands=["All","Adidas","Nike","Jordan","New Balance","Puma","Other"];
 return <section className="section catalog"><div className="titleRow"><div><p className="eyebrow">SHOP</p><h1>{kind}</h1></div><div className="search"><Search size={18}/><input placeholder="Search..." value={q} onChange={e=>setQ(e.target.value)}/></div></div>
 {isSneaker&&<div className="chips">{brands.map(x=><button className={brand===x?"active":""} onClick={()=>setBrand(x)} key={x}>{x}</button>)}</div>}
 <div className="grid">{list.map(p=><ProductCard key={p.id} p={p}/>)}</div>{!list.length&&<p>No products found yet.</p>}</section>
}

function ProductCard({p}){
 return <Link className="card" to={`/product/${p.id}`}><div className="photo">{p.main_image_url?<img src={p.main_image_url} alt={p.name}/>:<span>PRODUCT IMAGE</span>}</div><small>{p.brand?.name||p.category?.name}</small><h3>{p.name}</h3><strong>{money(p.price)}</strong></Link>
}

function Product(){
 const {id}=useParams(),nav=useNavigate();const [p,setP]=useState(null);const [variants,setVariants]=useState([]);const [selected,setSelected]=useState(null);const [qty,setQty]=useState(1);
 useEffect(()=>{(async()=>{let {data}=await supabase.from("products").select("*,category:categories(name),brand:brands(name)").eq("id",id).maybeSingle();if(!data)data=demo.find(x=>x.id===id);setP(data);if(data){let r=await supabase.from("product_variants").select("*").eq("product_id",id).eq("is_active",true);setVariants(r.data||[]);}})()},[id]);
 if(!p)return <section className="section"><p>Loading...</p></section>;
 const add=()=>{const c=readCart(), key=`${p.id}-${selected?.id||"base"}`,found=c.find(x=>x.key===key),item={key,product_id:p.id,name:p.name,price:selected?.price??p.price,quantity:qty,variant:selected?.variant_name||"",image:p.main_image_url};found?found.quantity+=qty:c.push(item);saveCart(c);nav("/cart")};
 return <section className="section product"><button className="back" onClick={()=>nav(-1)}><ArrowLeft/> Back</button><div className="productLayout"><div className="largePhoto">{p.main_image_url?<img src={p.main_image_url} alt={p.name}/>:<span>PRODUCT IMAGE</span>}</div><div><p className="eyebrow">{p.brand?.name||p.category?.name}</p><h1>{p.name}</h1><h2>{money(selected?.price??p.price)}</h2><p>{p.description}</p>{variants.length>0&&<div><h3>Choose an option</h3><div className="variantList">{variants.map(v=><button className={selected?.id===v.id?"selected":""} onClick={()=>setSelected(v)} key={v.id}>{v.variant_name||[v.size,v.storage,v.colour,v.condition].filter(Boolean).join(" / ")}</button>)}</div></div>}<div className="quantity"><button onClick={()=>setQty(Math.max(1,qty-1))}><Minus/></button><b>{qty}</b><button onClick={()=>setQty(qty+1)}><Plus/></button></div><button className="btn full" onClick={add}>Add to Cart</button></div></div></section>
}

function Cart(){
 const [cart,setCart]=useState(readCart()),[agree,setAgree]=useState(false);
 const update=(key,delta)=>{let c=cart.map(x=>x.key===key?{...x,quantity:Math.max(0,x.quantity+delta)}:x).filter(x=>x.quantity);setCart(c);saveCart(c)};
 const total=cart.reduce((a,x)=>a+x.price*x.quantity,0);
 const checkout=()=>{if(!agree)return alert("Please agree to the Terms & Conditions and Returns & Refund Policy.");let text="Hello MyLove's Essentials, I would like to place this order:%0A%0A"+cart.map(x=>`• ${x.name}${x.variant?` (${x.variant})`:""} x${x.quantity} — ${money(x.price*x.quantity)}`).join("%0A")+`%0A%0ATotal: ${money(total)}%0A%0AI agree to the Terms & Conditions and Returns & Refund Policy.`;window.open(`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER||"27687582714"}?text=${text}`,"_blank")};
 return <section className="section"><p className="eyebrow">YOUR ORDER</p><h1>Cart</h1>{!cart.length?<p>Your cart is empty. <Link to="/sneakers">Start shopping.</Link></p>:<><div className="cart">{cart.map(x=><div className="cartItem" key={x.key}><div><b>{x.name}</b><small>{x.variant}</small></div><strong>{money(x.price*x.quantity)}</strong><div className="quantity"><button onClick={()=>update(x.key,-1)}><Minus/></button><b>{x.quantity}</b><button onClick={()=>update(x.key,1)}><Plus/></button><button className="trash" onClick={()=>{let c=cart.filter(i=>i.key!==x.key);setCart(c);saveCart(c)}}><Trash2/></button></div></div>)}</div><div className="checkout"><h2>Total: {money(total)}</h2><label><input type="checkbox" checked={agree} onChange={e=>setAgree(e.target.checked)}/> I agree to the <Link to="/terms">Terms & Conditions</Link> and <Link to="/refunds">Returns & Refund Policy</Link>.</label><button className="btn full" onClick={checkout}>Checkout on WhatsApp</button></div></>}</section>
}

function Info({title,children}){return <section className="section info"><p className="eyebrow">MYLOVE'S ESSENTIALS</p><h1>{title}</h1>{children}</section>}
function Policies(){
 return <Info title="Terms & Conditions"><h2>1. Orders</h2><p>Orders are requests to purchase products. We will confirm availability, pricing and delivery details before finalising an order.</p><h2>2. Products</h2><p>Product images, colours and displays may vary. Sneaker sizing and iPhone specifications should be checked carefully before ordering.</p><h2>3. Pricing & Payment</h2><p>Prices are shown in South African Rand. Payment instructions will be supplied when an order is confirmed.</p><h2>4. Delivery</h2><p>Delivery timing and fees depend on destination and will be confirmed before dispatch.</p><h2>5. WhatsApp Checkout</h2><p>WhatsApp checkout sends your cart details to our business number for order processing.</p><h2>6. Privacy</h2><p>We use information needed to process enquiries and orders and should handle personal information in accordance with applicable law.</p><h2>7. Consumer Rights</h2><p>Nothing in these terms limits any rights you have under applicable South African consumer-protection law.</p><h2>8. Changes</h2><p>We may update these terms when necessary. The latest version will be published on this page.</p></Info>
}
function Refunds(){return <Info title="Returns & Refund Policy"><h2>Change of mind</h2><p>We do not offer change-of-mind refunds except where a refund, return or cancellation is required by applicable law.</p><h2>Defective or incorrect products</h2><p>If a product is defective, unsafe, materially different from what was ordered, or otherwise qualifies for a remedy under applicable law, contact us as soon as possible with your order details and photographs where relevant.</p><h2>Before ordering</h2><p>Please check sneaker size, iPhone model, storage, colour and condition carefully before confirming your order.</p><h2>Legal rights</h2><p>This policy does not remove or reduce any rights you may have under applicable South African consumer-protection law.</p><h2>Contact</h2><p>WhatsApp: +27 68 758 2714</p></Info>}
function StoreRoutes(){return <Layout><Routes><Route path="/" element={<Home/>}/><Route path="/sneakers" element={<Catalog kind="Sneakers"/>}/><Route path="/iphones" element={<Catalog kind="iPhones"/>}/><Route path="/product/:id" element={<Product/>}/><Route path="/cart" element={<Cart/>}/><Route path="/about" element={<Info title="About Us"><p>Premium sneakers and iPhones, curated for modern customers who value quality, style and convenience.</p></Info>}/><Route path="/delivery" element={<Info title="Delivery"><p>Delivery options, fees and expected timelines will be confirmed for each order before dispatch.</p></Info>}/><Route path="/payment" element={<Info title="Payment"><p>Payment details will be provided after product availability and delivery details are confirmed.</p></Info>}/><Route path="/contact" element={<Info title="Contact"><p>WhatsApp: +27 68 758 2714</p></Info>}/><Route path="/terms" element={<Policies/>}/><Route path="/refunds" element={<Refunds/>}/></Routes></Layout>}
function App(){return <Routes><Route path="/admin/login" element={<AdminLogin/>}/><Route path="/admin" element={<AdminDashboard/>}/><Route path="*" element={<StoreRoutes/>}/></Routes>}
export default App;