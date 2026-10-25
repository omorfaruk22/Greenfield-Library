import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { authorize } from '@/lib/permissions';
import { getPagination } from '@/lib/utils';
import { getMemberForUser } from '@/lib/member-for-user';
import { serverError } from '@/lib/http';
import Fine from '@/models/Fine';
export const runtime='nodejs';
export async function GET(request:NextRequest){const access=await authorize(['Admin','Librarian','Member']);if(access.response)return access.response;try{await connectDB();const url=new URL(request.url);const {page,pageSize,skip}=getPagination(url);const filter:Record<string,unknown>={};if(access.user.role==='Member'){const member=await getMemberForUser(access.user);if(!member)return NextResponse.json({items:[],page,pageSize,total:0,totalPages:0});filter.memberId=member._id;}else{const status=url.searchParams.get('status');if(status&&['Unpaid','Partially Paid','Paid','Waived'].includes(status))filter.status=status;}const [items,total]=await Promise.all([Fine.find(filter).populate('memberId','memberId fullName email').populate({path:'borrowingRecordId',populate:{path:'bookId',select:'title isbn'}}).sort({assessedAt:-1}).skip(skip).limit(pageSize).lean(),Fine.countDocuments(filter)]);return NextResponse.json({items,page,pageSize,total,totalPages:Math.ceil(total/pageSize)});}catch(error){return serverError('fines/list',error);}}
