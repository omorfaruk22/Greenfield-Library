import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { authorize } from '@/lib/permissions';
import { isValidObjectId } from '@/lib/utils';
import { serverError } from '@/lib/http';
import Notification from '@/models/Notification';
type Context={params:Promise<{id:string}>};
export const runtime='nodejs';
export async function PATCH(_request:Request,context:Context){const access=await authorize(['Admin','Librarian','Member']);if(access.response)return access.response;try{const {id}=await context.params;if(!isValidObjectId(id))return NextResponse.json({error:'Notification not found.'},{status:404});await connectDB();const item=await Notification.findOneAndUpdate({_id:id,recipientUserId:access.user.id},{$set:{readAt:new Date()}},{new:true});if(!item)return NextResponse.json({error:'Notification not found.'},{status:404});return NextResponse.json({item});}catch(error){return serverError('notifications/read',error);}}
