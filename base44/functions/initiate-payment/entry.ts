import { createClientFromRequest } from "npm:@base44/sdk";

const appUrl = () => (Deno.env.get("APP_URL") || "https://mwakwa.com").replace(/\/$/, "");
const code = () => crypto.randomUUID().replaceAll("-", "").slice(0, 20).toUpperCase();

Deno.serve(async (req) => {
 try {
  const base44=createClientFromRequest(req); const user=await base44.auth.me();
  if(!user) return Response.json({error:"Unauthorized"},{status:401});
  const {provider, tickets, phone_number, discount_code}=await req.json();
  if(!["fapshi","stripe"].includes(provider)||!Array.isArray(tickets)||!tickets.length) return Response.json({error:"Invalid payment request"},{status:400});
  const svc=base44.asServiceRole; let subtotal=0; let event:any=null; const items:any[]=[];
  for(const item of tickets){
   const tt=await svc.entities.TicketType.get(String(item.ticket_id)); if(!tt||!tt.is_active) return Response.json({error:"Ticket type unavailable"},{status:400});
   const qty=Math.max(1,Number(item.quantity||1)); const available=Math.max(0,Number(tt.max_quantity||0)-Number(tt.sold_quantity||0));
   if(qty>available) return Response.json({error:`Only ${available} ticket(s) available for ${tt.name}`},{status:409});
   const ev=await svc.entities.Event.get(String(tt.event_id)); if(!ev||ev.event_status!=="published") return Response.json({error:"Event unavailable"},{status:400});
   if(!event) event=ev; if(String(event.id)!==String(ev.id)) return Response.json({error:"A single order cannot span multiple events"},{status:400});
   const unit=Number(tt.price||0); subtotal+=unit*qty; items.push({ticket_type_id:String(tt.id),name:tt.name,quantity:qty,unit_price:unit,total:unit*qty});
  }
  let discountAmount=0; let discountId:string|undefined;
  if(discount_code){
   const ds=await svc.entities.DiscountCode.filter({event_id:String(event.id),code:String(discount_code).toUpperCase(),is_active:true}); const d=ds[0];
   if(!d) return Response.json({error:"Invalid discount code"},{status:400});
   const now=Date.now(); if(d.valid_from&&now<new Date(d.valid_from).getTime()||d.valid_until&&now>new Date(d.valid_until).getTime()) return Response.json({error:"Discount code is not currently valid"},{status:400});
   if(d.max_uses&&Number(d.uses_count||0)>=Number(d.max_uses)) return Response.json({error:"Discount code usage limit reached"},{status:400});
   discountId=String(d.id); discountAmount=d.discount_type==="percentage"?subtotal*Math.min(100,Number(d.discount_value||0))/100:Math.min(subtotal,Number(d.discount_value||0));
  }
  const total=Math.max(0,subtotal-discountAmount); if(total<=0) return Response.json({error:"Use free checkout for a zero-value order"},{status:400});
  const idem=crypto.randomUUID(); const order=await svc.entities.Order.create({buyer_id:user.id,buyer_email:user.email,event_id:String(event.id),organizer_id:event.organizer_id,status:"pending",currency:event.currency||"XAF",subtotal,discount_amount:discountAmount,total,provider,items,idempotency_key:idem,discount_code_id:discountId});
  const payment=await svc.entities.Payment.create({buyer_id:user.id,buyer_email:user.email,event_id:String(event.id),organizer_id:event.organizer_id,order_id:String(order.id),amount:total,currency:event.currency||"XAF",payment_method:provider==="fapshi"?"mobile_money":"stripe",payment_status:"pending",provider,idempotency_key:idem,mobile_number:phone_number||undefined});
  await svc.entities.Order.update(String(order.id),{payment_id:String(payment.id),status:"payment_pending"});
  let checkout_url="", providerId="", responseData:any={};
  if(provider==="fapshi"){
   const apiuser=Deno.env.get("FAPSHI_API_USER"), apikey=Deno.env.get("FAPSHI_API_KEY"), apiurl=Deno.env.get("FAPSHI_API_URL")||"https://api.fapshi.com";
   if(!apiuser||!apikey) return Response.json({error:"Fapshi is not configured",code:"PROVIDER_NOT_CONFIGURED"},{status:503});
   const r=await fetch(`${apiurl}/initiate-pay`,{method:"POST",headers:{apiuser,apikey,"Content-Type":"application/json"},body:JSON.stringify({amount:Math.round(total),email:user.email,userId:user.id,externalId:String(order.id),message:`Mwakwa order ${order.id}`,redirectUrl:`${appUrl()}/payment-success?provider=momo&order_id=${order.id}`})}); responseData=await r.json(); if(!r.ok) throw new Error(responseData?.message||"Fapshi initiation failed"); providerId=responseData.transId||""; checkout_url=responseData.link||"";
  } else {
   const key=Deno.env.get("STRIPE_SECRET_KEY"); if(!key) return Response.json({error:"Stripe is not configured",code:"PROVIDER_NOT_CONFIGURED"},{status:503});
   const params=new URLSearchParams(); params.set("mode","payment"); params.set("success_url",`${appUrl()}/payment-success?provider=stripe&session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`); params.set("cancel_url",`${appUrl()}/events/${event.id}`); params.set("customer_email",user.email||""); params.set("metadata[order_id]",String(order.id)); params.set("metadata[payment_id]",String(payment.id));
   items.forEach((it,i)=>{params.set(`line_items[${i}][quantity]`,String(it.quantity));params.set(`line_items[${i}][price_data][currency]`,String(event.currency||"XAF").toLowerCase());params.set(`line_items[${i}][price_data][unit_amount]`,String(Math.round(it.unit_price*(String(event.currency||"XAF").toUpperCase()==="XAF"?1:100))));params.set(`line_items[${i}][price_data][product_data][name]`,`${event.title} — ${it.name}`)});
   const r=await fetch("https://api.stripe.com/v1/checkout/sessions",{method:"POST",headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/x-www-form-urlencoded", "Idempotency-Key":idem},body:params}); responseData=await r.json(); if(!r.ok) throw new Error(responseData?.error?.message||"Stripe initiation failed"); providerId=responseData.id; checkout_url=responseData.url;
  }
  await svc.entities.Payment.update(String(payment.id),{provider_transaction_id:providerId,provider_session_id:provider==="stripe"?providerId:undefined,provider_checkout_url:checkout_url,provider_response:responseData,payment_status:"processing"});
  return Response.json({success:true,order_id:order.id,payment_id:payment.id,session_id:provider==="stripe"?providerId:undefined,transId:provider==="fapshi"?providerId:undefined,checkout_url,amount:total,currency:event.currency||"XAF"});
 } catch(e){console.error(e); return Response.json({error:e instanceof Error?e.message:"Payment initiation failed"},{status:500});}
});
