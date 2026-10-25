import { NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/mongodb';
import { getCurrentUser } from '@/lib/auth';
import { serverError,readJson,validationError } from '@/lib/http';
import { writeAuditLog } from '@/lib/audit';
import User from '@/models/User';
import Member from '@/models/Member';
export const runtime='nodejs';
export async function GET(){const user=await getCurrentUser();if(!user)return NextResponse.json({error:'Authentication required.'},{status:401});try{await connectDB();const member=await Member.findOne({userId:user.id}).select('-__v').lean();return NextResponse.json({user,member});}catch(error){return serverError('member-profile/read',error);}}
const profileSchema=z.object({name:z.string().trim().min(2).max(100),phone:z.string().trim().max(30).optional().default(''),address:z.string().trim().max(300).optional().default('')});
export async function PATCH(request:Request){const user=await getCurrentUser();if(!user)return NextResponse.json({error:'Authentication required.'},{status:401});if(user.role!=='Member')return NextResponse.json({error:'This profile endpoint is for member accounts.'},{status:403});try{const parsed=profileSchema.safeParse(await readJson(request));if(!parsed.success)return validationError(parsed.error)!;await connectDB();const member=await Member.findOne({userId:user.id});if(!member)return NextResponse.json({error:'Member profile not found.'},{status:404});const before={fullName:member.fullName,phone:member.phone,address:member.address};member.fullName=parsed.data.name;member.phone=parsed.data.phone;member.address=parsed.data.address;await member.save();await User.findByIdAndUpdate(user.id,{$set:{name:parsed.data.name}});await writeAuditLog({actor:user,action:'member.profile_updated',resourceType:'Member',resourceId:member._id.toString(),before,after:{fullName:member.fullName,phone:member.phone,address:member.address}});return NextResponse.json({success:true,user:{...user,name:parsed.data.name},member});}catch(error){const validation=validationError(error);if(validation)return validation;return serverError('member-profile/update',error);}}
