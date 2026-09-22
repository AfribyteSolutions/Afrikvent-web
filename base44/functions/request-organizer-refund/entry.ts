import { createClientFromRequest } from "npm:@base44/sdk";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { ticket_id, reason } = await req.json();
    if (!ticket_id) return Response.json({ error: "ticket_id is required" }, { status: 400 });

    const svc = base44.asServiceRole;
    const ticket = await svc.entities.Ticket.get(String(ticket_id));
    if (!ticket || String(ticket.organizer_id) !== String(user.id)) {
      return Response.json({ error: "Ticket not found" }, { status: 404 });
    }
    if (!["confirmed", "used"].includes(String(ticket.ticket_status))) {
      return Response.json({ error: "Ticket is not eligible for refund review" }, { status: 409 });
    }
    if (!ticket.order_id || !ticket.payment_id) {
      return Response.json({ error: "Ticket payment record is incomplete" }, { status: 409 });
    }

    const existing = await svc.entities.RefundRequest.filter({ ticket_id: String(ticket.id) });
    const active = existing.find((item:any) => ["requested", "approved", "processing", "completed"].includes(String(item.status)));
    if (active) return Response.json({ success: true, refund_request: active, duplicate: true });

    const request = await svc.entities.RefundRequest.create({
      order_id: String(ticket.order_id),
      payment_id: String(ticket.payment_id),
      ticket_id: String(ticket.id),
      event_id: String(ticket.event_id),
      buyer_id: String(ticket.buyer_id),
      organizer_id: String(ticket.organizer_id),
      request_type: "admin_exception",
      amount: Number(ticket.total || 0),
      currency: ticket.currency || "XAF",
      reason: String(reason || "Organizer requested refund review"),
      eligibility: "manual_review",
      liability_party: "unassigned",
      status: "requested",
      idempotency_key: `organizer-refund:${ticket.id}`
    });
    return Response.json({ success: true, refund_request: request, duplicate: false });
  } catch (error) {
    console.error("request-organizer-refund failed", error);
    return Response.json({ error: error instanceof Error ? error.message : "Refund request failed" }, { status: 500 });
  }
});