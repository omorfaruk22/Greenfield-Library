import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { authorize } from '@/lib/permissions';
import { readJson, serverError } from '@/lib/http';
import { isValidObjectId } from '@/lib/utils';
import { getMemberForUser } from '@/lib/member-for-user';
import { writeAuditLog } from '@/lib/audit';
import Reservation from '@/models/Reservation';
type Context={params:Promise<{id:string}>};
export const runtime='nodejs';
export async function PATCH(request:Request,context:Context){const access=await authorize(['Admin','Librarian','Member']);if(access.response)return access.response;try{const {id}=await context.params;if(!isValidObjectId(id))return NextResponse.json({error:'Reservation not found.'},{status:404});const body=await readJson(request) as {status?:string};if(!body||typeof body.status!=='string')return NextResponse.json({error:'A reservation status is required.'},{status:422});if(!['Pending','Available for pickup','Fulfilled','Cancelled','Expired'].includes(body.status))return NextResponse.json({error:'Invalid reservation status.'},{status:422});await connectDB();const item=await Reservation.findById(id);if(!item)return NextResponse.json({error:'Reservation not found.'},{status:404});if(access.user.role==='Member'){const member=await getMemberForUser(access.user);if(!member||String(item.memberId)!==String(member._id))return NextResponse.json({error:'You can only change your own reservations.'},{status:403});if(body.status!=='Cancelled'||!['Pending','Available for pickup'].includes(item.status))return NextResponse.json({error:'You may only cancel a pending or pickup-ready reservation.'},{status:409});item.cancelledAt=new Date();}
 if(access.user.role==='Librarian'&&['Fulfilled','Expired'].includes(body.status)&&!['Pending','Available for pickup'].includes(item.status))return NextResponse.json({error:'This reservation can no longer be completed.'},{status:409});
 const before=item.status;item.status=body.status as typeof item.status;await item.save();await writeAuditLog({actor:access.user,action:'reservation.status_changed',resourceType:'Reservation',resourceId:id,before:{status:before},after:{status:item.status}});return NextResponse.json({item});}catch(error){return serverError('reservations/update',error);}}
