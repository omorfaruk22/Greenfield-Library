import { NextRequest,NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { authorize } from '@/lib/permissions';
import { getPagination } from '@/lib/utils';
import { serverError } from '@/lib/http';
import AuditLog from '@/models/AuditLog';
export const runtime='nodejs';
export async function GET(request:NextRequest){const access=await authorize(['Admin']);if(access.response)return access.response;try{await connectDB();const url=new URL(request.url);const {page,pageSize,skip}=getPagination(url);const q=(url.searchParams.get('q')||'').trim().slice(0,80);const filter:Record<string,unknown>={};if(q){const escaped=q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');filter.$or=[{action:{$regex:escaped,$options:'i'}},{resourceType:{$regex:escaped,$options:'i'}},{resourceId:{$regex:escaped,$options:'i'}}];}const [items,total]=await Promise.all([AuditLog.find(filter).populate('actorUserId','name email role').sort({createdAt:-1}).skip(skip).limit(pageSize).lean(),AuditLog.countDocuments(filter)]);return NextResponse.json({items,page,pageSize,total,totalPages:Math.ceil(total/pageSize)});}catch(error){return serverError('audit/list',error);}}
