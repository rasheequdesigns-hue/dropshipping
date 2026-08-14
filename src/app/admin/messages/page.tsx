"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Eye, EyeOff, Trash2, X, Search, Mail, Phone } from "lucide-react";
import { supabase, ContactMessage } from "@/lib/supabase";
import { useToast } from "@/components/Toast";

export default function AdminMessagesPage() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState<"all"|"unread"|"read">("all");

  useEffect(() => {
    async function load() {
      try { const { data } = await supabase.from("contact_messages").select("*").order("created_at", { ascending:false }); if (data) setMessages(data as ContactMessage[]); } catch {}
      setLoading(false);
    }
    load();
  }, []);

  const toggleRead = async (id: string, val: boolean) => {
    try { await supabase.from("contact_messages").update({ is_read: val }).eq("id", id); } catch {}
    setMessages(p => p.map(m => m.id === id ? { ...m, is_read: val } : m));
    if (selected?.id === id) setSelected(s => s ? { ...s, is_read: val } : s);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this message permanently?")) return;
    try { await supabase.from("contact_messages").delete().eq("id", id); } catch {}
    setMessages(p => p.filter(m => m.id !== id));
    if (selected?.id === id) setSelected(null);
    toast("Message deleted", "info");
  };

  const unreadCount = messages.filter(m => !m.is_read).length;
  let visible = filter === "unread" ? messages.filter(m => !m.is_read) : filter === "read" ? messages.filter(m => m.is_read) : messages;
  if (search.trim()) {
    const q = search.toLowerCase();
    visible = visible.filter(m => m.customer_name.toLowerCase().includes(q) || m.customer_phone.includes(q) || (m.subject ?? "").toLowerCase().includes(q));
  }

  const NG = "#00E676";

  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <h1 className="admin-page-title">Messages</h1>
        <p className="admin-page-sub">{messages.length} total · {unreadCount > 0 ? `${unreadCount} unread` : "all read"}</p>
      </div>

      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16, alignItems:"center" }}>
        <div style={{ position:"relative" }}>
          <Search style={{ position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",width:13,height:13,color:"var(--tx-3)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" className="inp" style={{ paddingLeft:28,width:180,height:34,padding:"0 10px 0 28px" }} />
        </div>
        {(["all","unread","read"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding:"4px 10px",borderRadius:99,fontSize:11,fontWeight:600,cursor:"pointer",background:filter===f?"rgba(0,230,118,0.12)":"rgba(255,255,255,0.04)",color:filter===f?NG:"var(--tx-3)",border:`1px solid ${filter===f?"rgba(0,230,118,0.25)":"rgba(255,255,255,0.08)"}` }}>
            {f.charAt(0).toUpperCase()+f.slice(1)} {f==="unread"&&unreadCount>0 && <span style={{ background:NG,color:"#0D1117",borderRadius:"50%",padding:"0 4px",fontSize:9,fontWeight:900,marginLeft:4 }}>{unreadCount}</span>}
          </button>
        ))}
      </div>

      <div className="card" style={{ overflow:"hidden" }}>
        {loading ? <div style={{ padding:36,textAlign:"center",color:"var(--tx-3)" }}>Loading…</div>
        : visible.length === 0 ? (
          <div style={{ padding:"52px 20px",textAlign:"center" }}>
            <MessageSquare style={{ width:28,height:28,color:"var(--tx-4)",margin:"0 auto 8px" }} />
            <p style={{ color:"var(--tx-3)" }}>No messages</p>
          </div>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr>{["","Sender","Subject","Preview","Date","Actions"].map(h=><th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {visible.map(m => (
                  <tr key={m.id} style={{ cursor:"pointer",fontWeight:m.is_read?400:600 }} onClick={() => { setSelected(m); if(!m.is_read) toggleRead(m.id,true); }}>
                    <td style={{ width:16 }}><div style={{ width:7,height:7,borderRadius:"50%",background:m.is_read?"transparent":NG,border:m.is_read?"1px solid rgba(255,255,255,0.12)":"none" }} /></td>
                    <td><p style={{ fontWeight:m.is_read?500:700 }}>{m.customer_name}</p><p style={{ fontSize:10,color:"var(--tx-3)" }}>{m.customer_phone}</p></td>
                    <td style={{ maxWidth:140,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:m.is_read?"var(--tx-2)":"var(--tx)" }}>{m.subject||"No subject"}</td>
                    <td style={{ maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:"var(--tx-3)",fontSize:12 }}>{m.message}</td>
                    <td style={{ color:"var(--tx-3)",fontSize:11,whiteSpace:"nowrap" }}>{new Date(m.created_at).toLocaleString("en-IN",{ day:"numeric",month:"short",hour:"2-digit",minute:"2-digit" })}</td>
                    <td onClick={e => e.stopPropagation()}>
                      <div style={{ display:"flex",gap:5 }}>
                        <button onClick={() => toggleRead(m.id,!m.is_read)} style={{ padding:"4px 6px",borderRadius:6,background:"rgba(0,230,118,0.08)",border:"1px solid rgba(0,230,118,0.18)",color:NG,cursor:"pointer" }}>
                          {m.is_read?<EyeOff style={{ width:12,height:12 }} />:<Eye style={{ width:12,height:12 }} />}
                        </button>
                        <button onClick={() => remove(m.id)} className="btn btn-sm btn-danger" style={{ padding:"4px 6px" }}>
                          <Trash2 style={{ width:12,height:12 }} />
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

      {/* Drawer */}
      {selected && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:200,display:"flex",justifyContent:"flex-end" }} onClick={e => { if(e.target===e.currentTarget) setSelected(null); }}>
          <div style={{ width:"min(440px,100vw)",background:"#161B22",borderLeft:"1px solid rgba(255,255,255,0.08)",height:"100vh",overflowY:"auto" }}>
            <div className="neon-line" />
            <div style={{ position:"sticky",top:0,background:"#161B22",padding:"14px 18px",borderBottom:"1px solid rgba(255,255,255,0.08)",display:"flex",justifyContent:"space-between",alignItems:"center",zIndex:1 }}>
              <p style={{ fontWeight:700,fontSize:15,color:"#fff" }}>Message Detail</p>
              <button onClick={()=>setSelected(null)} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--tx-3)",display:"flex" }}><X style={{ width:17,height:17 }} /></button>
            </div>
            <div style={{ padding:18,display:"flex",flexDirection:"column",gap:14 }}>
              <div style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:9,padding:"13px 15px" }}>
                <p className="section-label">Sender</p>
                <p style={{ fontSize:15,fontWeight:800,color:"#fff",marginBottom:8 }}>{selected.customer_name}</p>
                <div style={{ display:"flex",gap:12,flexWrap:"wrap" }}>
                  {[[Phone,selected.customer_phone],[Mail,selected.email]].filter(([,v])=>v).map(([Icon,val],i)=>(
                    <div key={i} style={{ display:"flex",alignItems:"center",gap:5,fontSize:12,color:"var(--tx-2)" }}>
                      {/* @ts-expect-error icon */}
                      <Icon style={{ width:12,height:12,color:NG }} />{String(val)}
                    </div>
                  ))}
                </div>
                <div style={{ display:"flex",gap:8,marginTop:10 }}>
                  <a href={`https://wa.me/91${selected.customer_phone}`} target="_blank" rel="noopener noreferrer" style={{ display:"inline-flex",alignItems:"center",gap:5,background:"#25D366",color:"#000",fontWeight:700,fontSize:11,padding:"5px 10px",borderRadius:99,textDecoration:"none" }}>WhatsApp Reply</a>
                  {selected.email && <a href={`mailto:${selected.email}?subject=Re: ${selected.subject||"Your message"}`} style={{ display:"inline-flex",alignItems:"center",gap:5,background:"rgba(96,165,250,0.12)",border:"1px solid rgba(96,165,250,0.22)",color:"#60A5FA",fontWeight:700,fontSize:11,padding:"5px 10px",borderRadius:99,textDecoration:"none" }}>Email Reply</a>}
                </div>
              </div>
              {selected.subject && <div style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:9,padding:"13px 15px" }}><p className="section-label">Subject</p><p style={{ fontSize:15,fontWeight:700,color:"#fff" }}>{selected.subject}</p></div>}
              <div style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:9,padding:"13px 15px" }}><p className="section-label">Message</p><p style={{ fontSize:13,color:"var(--tx-2)",lineHeight:1.8 }}>{selected.message}</p></div>
              <div style={{ display:"flex",gap:10 }}>
                <button onClick={()=>toggleRead(selected.id,!selected.is_read)} className="btn btn-outline" style={{ flex:1,justifyContent:"center",gap:5 }}>
                  {selected.is_read?<><EyeOff style={{ width:13,height:13 }} />Unread</>:<><Eye style={{ width:13,height:13 }} />Read</>}
                </button>
                <button onClick={()=>{ remove(selected.id); setSelected(null); }} className="btn btn-danger" style={{ flex:1,justifyContent:"center",gap:5 }}>
                  <Trash2 style={{ width:13,height:13 }} />Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
