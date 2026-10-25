import { NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/mongodb';
import { authorize } from '@/lib/permissions';
import { isValidObjectId } from '@/lib/utils';
import { readJson,serverError,validationError } from '@/lib/http';
import { writeAuditLog } from '@/lib/audit';
import User from '@/models/User';
type Context={params:Promise<{id:string}>};
export const runtime='nodejs';
export async function PATCH(request:Request,context:Context){const access=await authorize(['Admin']);if(access.response)return access.response;try{const {id}=await context.params;if(!isValidObjectId(id))return NextResponse.json({error:'User not found.'},{status:404});const parsed=z.object({role:z.enum(['Admin','Librarian','Member']).optional(),status:z.enum(['Active','Suspended']).optional()}).refine(value=>!!value.role||!!value.status).safeParse(await readJson(request));if(!parsed.success)return validationError(parsed.error)!;if(id===access.user.id&&((parsed.data.role&&parsed.data.role!=='Admin')||(parsed.data.status&&parsed.data.status!=='Active')))return NextResponse.json({error:'You cannot remove your own admin access or suspend your account.'},{status:409});await connectDB();const user=await User.findById(id);if(!user)return NextResponse.json({error:'User not found.'},{status:404});const before={role:user.role,status:user.status};if(parsed.data.role)user.role=parsed.data.role;if(parsed.data.status)user.status=parsed.data.status;await user.save();await writeAuditLog({actor:access.user,action:'user.access_updated',resourceType:'User',resourceId:id,before,after:{role:user.role,status:user.status}});return NextResponse.json({item:{_id:user._id.toString(),name:user.name,email:user.email,role:user.role,status:user.status,lastLoginAt:user.lastLoginAt,createdAt:user.createdAt}});}catch(error){return serverError('users/update',error);}}
