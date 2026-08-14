"use client";

import { useState, useEffect, useRef } from "react";
import { Eye, X, Search, MapPin, Printer, MessageSquare, ShoppingCart, Trash2, Send } from "lucide-react";
import { supabase, Order, OrderItem, OrderStatus } from "@/lib/supabase";
import { useToast } from "@/components/Toast";
import { useSettings } from "@/lib/settings";

const ALL: OrderStatus[] = ["Pending","Processing","Shipped","Out for Delivery","Delivered","Cancelled"];
const SC: Record<string,string> = { Pending:"s-Pending",Processing:"s-Processing",Shipped:"s-Shipped","Out for Delivery":"s-OutforDelivery",Delivered:"s-Delivered",Cancelled:"s-Cancelled" };

/** Build a WhatsApp message for order confirmation / thanks */
function buildOrderWAMessage(order: Order, items: OrderItem[], origin: string): string {
  const trackUrl = `${origin}/profile`;
  const lines: string[] = [
    `✅ *Order Confirmed — peadia.in*`,
    ``,
    `Hi ${order.customer_name}! 👋`,
    `Thank you for shopping with us! Here are your order details:`,
    ``,
    `📦 *Order ID:* #${order.order_number}`,
    `💳 *Payment:* ${order.payment_method}`,
    `📍 *Status:* ${order.status}`,
    ``,
  ];
  if (items.length > 0) {
    lines.push(`*Items ordered:*`);
    items.forEach(i => {
      lines.push(`• ${i.product_title} × ${i.quantity} — ₹${(i.price * i.quantity).toLocaleString()}`);
    });
    lines.push(``);
  }
  lines.push(`💰 *Total Amount:* ₹${order.total_amount?.toLocaleString()}`);
  lines.push(``);
  lines.push(`📬 *Delivery Address:*`);
  lines.push(`${order.shipping_address?.street ?? order.shipping_address?.address ?? ""}, ${order.shipping_address?.city}, ${order.shipping_address?.pincode}`);
  lines.push(``);
  lines.push(`🔗 *Track your order:* ${trackUrl}`);
  lines.push(``);
  lines.push(`Need help? Reply to this message or visit peadia.in`);
  lines.push(`Thank you for choosing us! 🙏`);
  return lines.join("\n");
}

export default function AdminOrdersPage() {
  const { toast } = useToast();
  const s = useSettings();
  const [orders,   setOrders]   = useState<Order[]>([]);
  const [filter,   setFilter]   = useState("all");
  const [search,   setSearch]   = useState("");
  const [selected, setSelected] = useState<Order | null>(null);
  const [selItems, setSelItems] = useState<OrderItem[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [hovered,  setHovered]  = useState<{ order:Order; items:OrderItem[]; loading:boolean } | null>(null);
  const [hoverPos, setHoverPos] = useState({ x:0, y:0 });
  const hoverTimer = useRef<ReturnType<typeof setTimeout>|null>(null);

  useEffect(() => {
    async function load() {
      try { const { data } = await supabase.from("orders").select("*").order("created_at",{ascending:false}); if (data) setOrders(data as Order[]); } catch {}
      setLoading(false);
    }
    load();
  }, []);

  const updateStatus = async (id:string, status:OrderStatus) => {
    try { await supabase.from("orders").update({ status }).eq("id",id); } catch {}
    setOrders(prev => prev.map(o => o.id===id ? {...o,status} : o));
    if (selected?.id===id) setSelected(s => s ? {...s,status} : s);
  };

  const removeOrder = async (id:string) => {
    if (!confirm("Delete this order permanently?")) return;
    try { await supabase.from("orders").delete().eq("id",id); } catch {}
    setOrders(prev => prev.filter(o => o.id!==id));
    if (selected?.id===id) setSelected(null);
    toast("Order deleted","info");
  };

  const onRowHover = async (e:React.MouseEvent, order:Order) => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const xPos = window.innerWidth - rect.right < 360 ? rect.left - 360 : rect.right + 8;
    setHoverPos({ x: Math.max(8, xPos), y: Math.min(rect.top, window.innerHeight - 300) });
    hoverTimer.current = setTimeout(async () => {
      setHovered({ order, items:[], loading:true });
      try {
        const { data } = await supabase.from("order_items").select("*,product:products(title,images)").eq("order_id",order.id);
        setHovered({ order, items:(data??[]) as OrderItem[], loading:false });
      } catch { setHovered({ order, items:[], loading:false }); }
    }, 350);
  };

  const onRowLeave = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setTimeout(() => setHovered(null), 200);
  };

  let visible = filter==="all" ? orders : orders.filter(o=>o.status===filter);
  if (search.trim()) {
    const q = search.toLowerCase();
    visible = visible.filter(o => String(o.order_number).includes(q) || o.customer_name.toLowerCase().includes(q) || o.customer_phone.includes(q));
  }

  const NG = "#00E676";

  return (
    <div style={{ position:"relative" }}>
      <div style={{ marginBottom:20 }}>
        <h1 className="admin-page-title">Orders</h1>
        <p className="admin-page-sub">{orders.length} total · {orders.filter(o=>o.status==="Pending").length} pending</p>
      </div>

      {/* Filters */}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16, alignItems:"center" }}>
        <div style={{ position:"relative", flexShrink:0 }}>
          <Search style={{ position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",width:13,height:13,color:"var(--tx-3)" }} />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…" className="inp" style={{ paddingLeft:28,width:180,height:34,padding:"0 10px 0 28px" }} />
        </div>
        <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
          {["all",...ALL].map(s => (
            <button key={s} onClick={()=>setFilter(s)} style={{ padding:"4px 10px",borderRadius:99,fontSize:11,fontWeight:600,cursor:"pointer",background:filter===s?"rgba(0,230,118,0.12)":"rgba(255,255,255,0.04)",color:filter===s?NG:"var(--tx-3)",border:`1px solid ${filter===s?"rgba(0,230,118,0.25)":"rgba(255,255,255,0.08)"}`,transition:"all 0.15s",whiteSpace:"nowrap" }}>
              {s==="all"?`All (${orders.length})`:s}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ overflow:"hidden" }}>
        {loading ? <div style={{ padding:36,textAlign:"center",color:"var(--tx-3)" }}>Loading…</div>
        : visible.length===0 ? (
          <div style={{ padding:"52px 20px",textAlign:"center" }}>
            <ShoppingCart style={{ width:28,height:28,color:"var(--tx-4)",margin:"0 auto 8px" }} />
            <p style={{ color:"var(--tx-3)" }}>No orders found</p>
          </div>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr>{["Order","Customer","Phone","Amount","Payment","Status","Date","Actions"].map(h=><th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {visible.map(o => (
                  <tr key={o.id} onMouseEnter={e=>onRowHover(e,o)} onMouseLeave={onRowLeave} style={{ cursor:"default" }}>
                    <td style={{ fontWeight:700,color:NG,fontSize:12 }}>#{o.order_number}</td>
                    <td style={{ fontWeight:600,maxWidth:120,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{o.customer_name}</td>
                    <td style={{ color:"var(--tx-3)",fontSize:12 }}>{o.customer_phone}</td>
                    <td style={{ fontWeight:700 }}>₹{o.total_amount?.toLocaleString()}</td>
                    <td style={{ color:"var(--tx-3)",fontSize:11 }}>{o.payment_method}</td>
                    <td>
                      <select value={o.status} onChange={e=>updateStatus(o.id,e.target.value as OrderStatus)} className={`badge ${SC[o.status]||"b-gray"}`} style={{ border:"none",background:"transparent",cursor:"pointer",outline:"none",fontSize:10,fontWeight:700,padding:"2px 4px" }}>
                        {ALL.map(s=><option key={s} value={s} style={{ background:"#161B22",color:"#fff" }}>{s}</option>)}
                      </select>
                    </td>
                    <td style={{ color:"var(--tx-3)",fontSize:11 }}>{new Date(o.created_at).toLocaleDateString("en-IN")}</td>
                    <td>
                      <div style={{ display:"flex",gap:4 }}>
                        <button onClick={async ()=>{ setSelected(o); try { const {data} = await supabase.from("order_items").select("*,product:products(title,images)").eq("order_id",o.id); setSelItems((data??[]) as OrderItem[]); } catch {} }} style={{ display:"flex",alignItems:"center",gap:3,padding:"4px 7px",background:"rgba(0,230,118,0.08)",border:"1px solid rgba(0,230,118,0.18)",borderRadius:6,cursor:"pointer",color:NG,fontSize:10,fontWeight:600 }}>
                          <Eye style={{ width:11,height:11 }} />View
                        </button>
                        <button onClick={()=>removeOrder(o.id)} className="btn btn-sm btn-danger" style={{ padding:"4px 6px" }}>
                          <Trash2 style={{ width:11,height:11 }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Hover popover */}
      {hovered && (
        <div onMouseEnter={()=>{ if(hoverTimer.current) clearTimeout(hoverTimer.current); }} onMouseLeave={()=>setHovered(null)}
          style={{ position:"fixed",top:hoverPos.y,left:hoverPos.x,zIndex:300,width:320,background:"#1C2333",border:"1px solid rgba(0,230,118,0.20)",borderRadius:12,boxShadow:"0 12px 48px rgba(0,0,0,0.65)",overflow:"hidden" }}>
          <div className="neon-line" />
          <div style={{ padding:"10px 13px",borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <p style={{ fontSize:12,fontWeight:800,color:NG }}>#{hovered.order.order_number}</p>
              <span className={`badge ${SC[hovered.order.status]||"b-gray"}`}>{hovered.order.status}</span>
            </div>
            <p style={{ fontSize:12,fontWeight:600,color:"#fff",marginTop:4 }}>{hovered.order.customer_name}</p>
            <div style={{ display:"flex",alignItems:"center",gap:7,marginTop:3 }}>
              <span style={{ fontSize:11,color:"var(--tx-3)" }}>{hovered.order.customer_phone}</span>
              <a href={`https://wa.me/91${hovered.order.customer_phone}`} target="_blank" rel="noopener noreferrer" style={{ background:"#25D366",color:"#000",fontSize:9,fontWeight:800,padding:"1px 6px",borderRadius:99,textDecoration:"none" }}>WA</a>
            </div>
            <p style={{ fontSize:10,color:"var(--tx-3)",marginTop:3 }}>
              <MapPin style={{ width:9,height:9,display:"inline",marginRight:3 }} />
              {hovered.order.shipping_address?.street??hovered.order.shipping_address?.address}, {hovered.order.shipping_address?.city}
            </p>
          </div>
          <div style={{ maxHeight:140,overflowY:"auto" }}>
            {hovered.loading ? <p style={{ padding:"10px 13px",fontSize:11,color:"var(--tx-3)" }}>Loading…</p>
            : hovered.items.length>0 ? hovered.items.map(item=>(
              <div key={item.id} style={{ display:"flex",gap:9,padding:"7px 13px",borderBottom:"1px solid rgba(255,255,255,0.05)",alignItems:"center" }}>
                {item.product?.images?.[0] && <div style={{ width:30,height:30,borderRadius:5,overflow:"hidden",flexShrink:0 }}><img src={item.product.images[0]} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }} /></div>}
                <div style={{ flex:1,minWidth:0 }}>
                  <p style={{ fontSize:11,fontWeight:600,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{item.product_title}</p>
                </div>
                <p style={{ fontSize:11,fontWeight:700,color:NG,flexShrink:0 }}>₹{item.price}×{item.quantity}</p>
              </div>
            )) : <p style={{ padding:"10px 13px",fontSize:11,color:"var(--tx-3)",textAlign:"center" }}>No items data</p>}
          </div>
          <div style={{ padding:"8px 13px",background:"rgba(0,0,0,0.2)",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
            <span style={{ fontSize:11,color:"var(--tx-3)" }}>Total · {hovered.order.payment_method}</span>
            <span style={{ fontSize:14,fontWeight:800,color:NG }}>₹{hovered.order.total_amount?.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      {selected && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:200,display:"flex",justifyContent:"flex-end" }} onClick={e=>{ if(e.target===e.currentTarget){ setSelected(null); setSelItems([]); } }}>
          <div style={{ width:"min(420px,100vw)",background:"#161B22",borderLeft:"1px solid rgba(255,255,255,0.08)",height:"100vh",overflowY:"auto" }}>
            <div className="neon-line" />
            <div style={{ position:"sticky",top:0,background:"#161B22",padding:"14px 18px",borderBottom:"1px solid rgba(255,255,255,0.08)",display:"flex",justifyContent:"space-between",alignItems:"center",zIndex:1 }}>
              <p style={{ fontSize:15,fontWeight:800,color:NG }}>#{selected.order_number}</p>
              <button onClick={()=>{ setSelected(null); setSelItems([]); }} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--tx-3)",display:"flex" }}><X style={{ width:17,height:17 }} /></button>
            </div>
            <div style={{ padding:18, display:"flex", flexDirection:"column", gap:16 }}>
              {/* WhatsApp Order Message */}
              <div style={{ background:"rgba(37,211,102,0.06)",border:"1px solid rgba(37,211,102,0.22)",borderRadius:9,padding:"13px 15px" }}>
                <p className="section-label" style={{ color:"#25D366", marginBottom:10 }}>📱 Send WhatsApp Message</p>
                <p style={{ fontSize:11,color:"var(--tx-3)",marginBottom:10,lineHeight:1.6 }}>
                  Send a personalised order confirmation / thanks message with order details and a tracking link to the customer.
                </p>
                <a
                  href={`https://wa.me/91${selected.customer_phone}?text=${encodeURIComponent(
                    `✅ *Order Confirmed — ${typeof window !== "undefined" ? window.location.hostname : "peadia.in"}*\n\nHi ${selected.customer_name}! 👋\nThank you for your order!\n\n📦 *Order ID:* #${selected.order_number}\n💳 *Payment:* ${selected.payment_method}\n📍 *Status:* ${selected.status}\n💰 *Total:* ₹${selected.total_amount?.toLocaleString()}\n\n📬 *Delivery to:*\n${selected.shipping_address?.street ?? selected.shipping_address?.address ?? ""}, ${selected.shipping_address?.city}, ${selected.shipping_address?.pincode}\n\n🔗 *Track your order:* ${typeof window !== "undefined" ? window.location.origin : "https://peadia.in"}/profile\n\nNeed help? Reply here anytime! 🙏\n— Team peadia.in`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:7,width:"100%",background:"#25D366",color:"#000",fontWeight:800,fontSize:13,padding:"11px 0",borderRadius:8,textDecoration:"none" }}>
                  <Send style={{ width:15,height:15 }} />
                  Send Thanks + Order Details via WhatsApp
                </a>
              </div>
              {/* Status */}
              <div>
                <p className="section-label">Update Status</p>
                <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
                  {ALL.map(s=>(
                    <button key={s} onClick={()=>updateStatus(selected.id,s)} style={{ padding:"5px 10px",borderRadius:99,fontSize:11,fontWeight:700,cursor:"pointer",background:selected.status===s?"rgba(0,230,118,0.12)":"rgba(255,255,255,0.04)",color:selected.status===s?NG:"var(--tx-3)",border:`1px solid ${selected.status===s?"rgba(0,230,118,0.28)":"rgba(255,255,255,0.08)"}`,transition:"all 0.15s",whiteSpace:"nowrap" }}>{s}</button>
                  ))}
                </div>
              </div>
              {/* Customer */}
              <div style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:9,padding:"13px 15px" }}>
                <p className="section-label">Customer</p>
                {[["Name",selected.customer_name],["Phone",selected.customer_phone],["Payment",selected.payment_method],["Total",`₹${selected.total_amount?.toLocaleString()}`]].map(([l,v])=>(
                  <div key={l} style={{ display:"flex",gap:8,marginBottom:6,fontSize:12 }}>
                    <span style={{ color:"var(--tx-3)",width:65,flexShrink:0 }}>{l}</span>
                    <span style={{ color:"#fff",fontWeight:600 }}>{v}</span>
                  </div>
                ))}
                <a href={`https://wa.me/91${selected.customer_phone}`} target="_blank" rel="noopener noreferrer" style={{ display:"inline-flex",alignItems:"center",gap:5,marginTop:8,background:"#25D366",color:"#000",fontWeight:700,fontSize:11,padding:"4px 10px",borderRadius:99,textDecoration:"none" }}>
                  <MessageSquare style={{ width:11,height:11 }} />WhatsApp
                </a>
              </div>
              {/* Address */}
              <div style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:9,padding:"13px 15px" }}>
                <p className="section-label" style={{ display:"flex",alignItems:"center",gap:5 }}><MapPin style={{ width:10,height:10 }} />Address</p>
                <p style={{ fontSize:12,color:"#fff",lineHeight:1.8 }}>
                  {selected.shipping_address?.street??selected.shipping_address?.address}<br/>
                  {selected.shipping_address?.city}, {selected.shipping_address?.state}<br/>
                  PIN: {selected.shipping_address?.pincode}
                </p>
              </div>
              {/* Delete */}
              <button onClick={()=>removeOrder(selected.id)} className="btn btn-danger" style={{ justifyContent:"center",gap:6 }}>
                <Trash2 style={{ width:13,height:13 }} />Delete Order
              </button>
              <button onClick={()=>window.print()} style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"9px 0",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:600,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",color:"var(--tx-2)" }}>
                <Printer style={{ width:13,height:13 }} />Print Packing Slip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
