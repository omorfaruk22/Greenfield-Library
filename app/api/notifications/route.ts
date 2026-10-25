import { NextRequest,NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { authorize } from '@/lib/permissions';
import { getPagination } from '@/lib/utils';
import { serverError } from '@/lib/http';
import Notification from '@/models/Notification';
export const runtime='nodejs';
export async function GET(request:NextRequest){const access=await authorize(['Admin','Librarian','Member']);if(access.response)return access.response;try{await connectDB();const url=new URL(request.url);const {page,pageSize,skip}=getPagination(url);const [items,total,unread]=await Promise.all([Notification.find({recipientUserId:access.user.id}).sort({createdAt:-1}).skip(skip).limit(pageSize).lean(),Notification.countDocuments({recipientUserId:access.user.id}),Notification.countDocuments({recipientUserId:access.user.id,readAt:null})]);return NextResponse.json({items,page,pageSize,total,totalPages:Math.ceil(total/pageSize),unread});}catch(error){return serverError('notifications/list',error);}}
export async function PATCH(request:Request){const access=await authorize(['Admin','Librarian','Member']);if(access.response)return access.response;try{const body=await request.json().catch(()=>({})) as {all?:boolean};await connectDB();const filter={recipientUserId:access.user.id,readAt:null};if(body.all){const result=await Notification.updateMany(filter,{$set:{readAt:new Date()}});return NextResponse.json({success:true,modified:result.modifiedCount});}return NextResponse.json({error:'Use the notification ID endpoint to mark one item as read.'},{status:400});}catch(error){return serverError('notifications/read-all',error);}}
