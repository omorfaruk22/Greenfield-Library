import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { authorize } from '@/lib/permissions';
import { reservationSchema } from '@/lib/validators/operations';
import { readJson, serverError, validationError } from '@/lib/http';
import { getPagination, isValidObjectId } from '@/lib/utils';
import { getMemberForUser } from '@/lib/member-for-user';
import { writeAuditLog } from '@/lib/audit';
import { notifyUser } from '@/lib/notifications';
import Member from '@/models/Member';
import Book from '@/models/Book';
import Reservation from '@/models/Reservation';

export const runtime = 'nodejs';
export async function GET(request: NextRequest) {
  const access = await authorize(['Admin','Librarian','Member']); if (access.response) return access.response;
  try {
    await connectDB(); const url = new URL(request.url); const {page,pageSize,skip}=getPagination(url); const filter:Record<string,unknown>={};
    if(access.user.role==='Member'){const member=await getMemberForUser(access.user);if(!member)return NextResponse.json({items:[],page,pageSize,total:0,totalPages:0});filter.memberId=member._id;}
    else { const status=url.searchParams.get('status'); if(status&&['Pending','Available for pickup','Fulfilled','Cancelled','Expired'].includes(status))filter.status=status; }
    const [items,total]=await Promise.all([Reservation.find(filter).populate('memberId','memberId fullName email').populate('bookId','title isbn coverImageUrl availableCopies').sort({reservedAt:-1}).skip(skip).limit(pageSize).lean(),Reservation.countDocuments(filter)]);
    return NextResponse.json({items,page,pageSize,total,totalPages:Math.ceil(total/pageSize)});
  } catch(error){return serverError('reservations/list',error);}
}
export async function POST(request:Request){
 const access=await authorize(['Admin','Librarian','Member']);if(access.response)return access.response;
 try{const body=await readJson(request);const parsed=reservationSchema.safeParse(body);if(!parsed.success)return validationError(parsed.error)!;await connectDB();
  let member;
  if(access.user.role==='Member') member=await getMemberForUser(access.user);
  else {const requestedMember=(body as {memberId?:string}).memberId;member=requestedMember&&isValidObjectId(requestedMember)?await Member.findById(requestedMember):null;}
  if(!member)return NextResponse.json({error:'A valid library member account is required.'},{status:422});
  if(member.status!=='Active'||(member.expiryDate&&member.expiryDate<new Date()))return NextResponse.json({error:'This membership is inactive or expired.'},{status:409});
  const book=await Book.findOne({_id:parsed.data.bookId,archivedAt:null});if(!book)return NextResponse.json({error:'Book not found.'},{status:404});
  const duplicate=await Reservation.exists({memberId:member._id,bookId:book._id,status:{$in:['Pending','Available for pickup']}});if(duplicate)return NextResponse.json({error:'You already have an active reservation for this book.'},{status:409});
  const queuePosition=await Reservation.countDocuments({bookId:book._id,status:'Pending'})+1;
  const reservation=await Reservation.create({memberId:member._id,bookId:book._id,status:'Pending',reservedAt:new Date(),queuePosition});
  await writeAuditLog({actor:access.user,action:'reservation.created',resourceType:'Reservation',resourceId:reservation._id.toString(),after:{bookTitle:book.title,member:member.fullName,queuePosition}});
  if(member.userId)await notifyUser({userId:member.userId.toString(),type:'Reservation',title:'Reservation received',message:`Your reservation for “${book.title}” is in the queue. Queue position: ${queuePosition}.`,targetUrl:'/member/my-reservations'});
  return NextResponse.json({item:reservation},{status:201});
 }catch(error){const validation=validationError(error);if(validation)return validation;return serverError('reservations/create',error);}
}
