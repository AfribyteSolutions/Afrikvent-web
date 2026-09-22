import { createClientFromRequest } from "npm:@base44/sdk";

Deno.serve(async(req)=>{try{
 const base44=createClientFromRequest(req);const user=await base44.auth.me();if(!user)return Response.json({error:"Unauthorized"},{status:401});
 const {qr_code,event_id,device_reference}=await req.json();if(!qr_code)return Response.json({error:"Ticket code required"},{status:400});
 const svc=base44.asServiceRole;const tickets=await svc.entities.Ticket.filter({qr_code_data:String(qr_code).trim().toUpperCase()});const ticket=tickets[0];
 if(!ticket)return Response.json({success:false,result:"invalid",message:"Ticket not found"},{status:404});
 const event=await svc.entities.Event.get(String(ticket.event_id));
 const own=String(ticket.organizer_id)===String(user.id);const memberships=own?[]:await svc.entities.OrganizerMember.filter({organizer_id:String(ticket.organizer_id),user_id:String(user.id),is_active:true});
 const member=memberships[0];const permitted=own||user.role==="admin"||["owner","admin","checkin_staff"].includes(String(member?.role||""));
 if(!permitted)return Response.json({error:"Not authorized to scan tickets for this organizer"},{status:403});
 if(event_id&&String(ticket.event_id)!==String(event_id))return Response.json({success:false,result:"invalid",message:"Ticket belongs to another event",event:{id:event.id,title:event.title}},{status:409});
 const status=String(ticket.ticket_status||"");let result="accepted";if(status==="used")result="already_used";else if(status==="cancelled")result="cancelled";else if(status==="refunded")result="refunded";else if(status!=="confirmed")result="invalid";
 const now=new Date().toISOString();await svc.entities.TicketCheckIn.create({ticket_id:String(ticket.id),event_id:String(ticket.event_id),organizer_id:String(ticket.organizer_id),scanned_by:String(user.id),scanned_at:now,result,device_reference:device_reference||undefined});
 if(result==="accepted")await svc.entities.Ticket.update(String(ticket.id),{ticket_status:"used",used_at:now,scanned_by:String(user.id)});
 const type=await svc.entities.TicketType.get(String(ticket.ticket_type_id)).catch(()=>null);
 return Response.json({success:result==="accepted",result,message:result==="accepted"?"Access granted":result==="already_used"?"Ticket already used":`Ticket ${result}`,ticket:{id:ticket.id,buyer_email:ticket.buyer_email,status:result==="accepted"?"used":status,type:type?.name||"Ticket"},event:{id:event.id,title:event.title}});
}catch(e){console.error(e);return Response.json({error:e instanceof Error?e.message:"Check-in failed"},{status:500});}});