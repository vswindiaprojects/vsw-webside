import bcrypt from 'bcryptjs'
import fs from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { query } from '../config/db.js'

const inquiriesTable = process.env.CONTACT_TABLE || 'contact_inquiries'
const like = (value) => `%${String(value || '').trim()}%`
const pageParams = (req) => {
  const page = Math.max(Number(req.query.page) || 1, 1)
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100)
  return { page, limit, offset: (page - 1) * limit }
}
const pageResponse = (res, data, total, page, limit) => res.json({ success: true, data, page, limit, total, pages: Math.ceil(total / limit) })
const cleanStatus = (value, allowed, fallback) => allowed.includes(value) ? value : fallback
const sortOrder = (value, nameField, dateField='created_at') => value === 'oldest' ? dateField + ' ASC' : value === 'name' ? nameField + ' ASC, ' + dateField + ' DESC' : dateField + ' DESC'

export const dashboard = async (req, res) => {
  const [[users]] = await query('SELECT COUNT(*) total FROM users')
  const [[inquiries]] = await query(`SELECT COUNT(*) total, SUM(status IN ('New','Pending')) newCount, SUM(status IN ('New','Pending','Follow-up')) pendingCount FROM \`${inquiriesTable}\` WHERE archived_at IS NULL`)
  const [[projects]] = await query("SELECT COUNT(*) total, SUM(status IN ('Ongoing','active')) activeCount, SUM(status='Completed') completedCount FROM projects WHERE archived_at IS NULL")
  const [[services]] = await query("SELECT COUNT(*) total FROM services WHERE status='active'")
  const [[contacts]] = await query("SELECT COUNT(*) total FROM contact_messages")
  const [recentInquiries] = await query(`SELECT id, name, email, phone, company, service, project_brief AS message, status, created_at AS createdAt FROM \`${inquiriesTable}\` WHERE archived_at IS NULL ORDER BY created_at DESC LIMIT 6`)
  const [recentUsers] = await query('SELECT id, name, email, phone, status, created_at AS createdAt FROM users ORDER BY created_at DESC LIMIT 6')
  const [recentProjects] = await query('SELECT id, title, location, category, status, created_at AS createdAt FROM projects WHERE archived_at IS NULL ORDER BY created_at DESC LIMIT 6')
  const [recentActivity] = await query("SELECT id, type, title, message, is_read AS isRead, created_at AS createdAt FROM admin_notifications WHERE admin_id IS NULL OR admin_id=? ORDER BY created_at DESC LIMIT 8", [req.user.id])
  const [[unreadNotifications]] = await query('SELECT COUNT(*) AS total FROM admin_notifications WHERE is_read=0 AND (admin_id IS NULL OR admin_id=?)', [req.user.id])
  const [inquiryTrend] = await query(`SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS day, COUNT(*) AS total FROM \`${inquiriesTable}\` WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 13 DAY) AND archived_at IS NULL GROUP BY DATE(created_at) ORDER BY day`)
  const [inquiryStatuses] = await query(`SELECT status, COUNT(*) AS total FROM \`${inquiriesTable}\` WHERE archived_at IS NULL GROUP BY status ORDER BY total DESC`)
  const [projectStatuses] = await query("SELECT status, COUNT(*) AS total FROM projects WHERE archived_at IS NULL GROUP BY status ORDER BY total DESC")
  const [userTrend] = await query("SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS day, COUNT(*) AS total FROM users WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 13 DAY) GROUP BY DATE(created_at) ORDER BY day")
  res.json({ success: true, data: { totals: { users: users.total, inquiries: inquiries.total, newInquiries: Number(inquiries.newCount || 0), pendingInquiries: Number(inquiries.pendingCount || 0), projects: projects.total, activeProjects: Number(projects.activeCount || 0), completedProjects: Number(projects.completedCount || 0), services: services.total, contactMessages: contacts.total, unreadNotifications: Number(unreadNotifications.total || 0) }, recentInquiries, recentUsers, recentProjects, recentActivity, inquiryTrend, inquiryStatuses, projectStatuses, userTrend } })
}

export const listAdminUsers = async (req, res) => {
  const { page, limit, offset } = pageParams(req); const search = like(req.query.search)
  const clauses = ['(name LIKE ? OR email LIKE ? OR phone LIKE ? OR CAST(id AS CHAR) LIKE ?)']; const params = [search, search, search, search]
  if (['active','disabled'].includes(req.query.status)) { clauses.push('status=?'); params.push(req.query.status) }
  if (req.query.from) { clauses.push('created_at >= ?'); params.push(req.query.from) }
  if (req.query.to) { clauses.push('created_at < DATE_ADD(?, INTERVAL 1 DAY)'); params.push(req.query.to) }
  const where = clauses.join(' AND '); const [[count]] = await query(`SELECT COUNT(*) total FROM users WHERE ${where}`, params)
  const [rows] = await query(`SELECT id,name,email,phone,company_name AS company,CASE WHEN google_sub IS NULL THEN 'Email/password' ELSE 'Google linked' END AS authProvider,status,created_at AS createdAt,last_login_at AS lastLogin FROM users WHERE ${where} ORDER BY ${sortOrder(req.query.sort, 'name')} LIMIT ? OFFSET ?`, [...params,limit,offset])
  pageResponse(res, rows, count.total, page, limit)
}
export const getAdminUser = async (req,res) => {
  const [[user]] = await query("SELECT id,name,email,phone,company_name AS company,address,city,state,country,postal_code AS postalCode,CASE WHEN google_sub IS NULL THEN 'Email/password' ELSE 'Google linked' END AS authProvider,status,created_at AS createdAt,last_login_at AS lastLogin FROM users WHERE id=?",[req.params.id])
  if (!user) return res.status(404).json({success:false,message:'User not found.'})
  const [inquiries] = await query(`SELECT id,service,project_brief AS message,status,created_at AS createdAt FROM \`${inquiriesTable}\` WHERE user_id=? ORDER BY created_at DESC LIMIT 100`,[req.params.id])
  const [activity] = await query('SELECT activity_type AS type,summary,created_at AS createdAt FROM user_activity WHERE user_id=? ORDER BY created_at DESC LIMIT 30',[req.params.id])
  res.json({success:true,data:{...user,inquiries,activity}})
}
export const updateAdminUser = async (req,res) => {
  const {name,email,phone,company='',status='active'}=req.body
  const [result]=await query('UPDATE users SET name=?,email=?,phone=?,company_name=?,status=? WHERE id=?',[name,email,phone,company,status,req.params.id])
  if (!result.affectedRows) return res.status(404).json({success:false,message:'User not found.'})
  res.json({success:true,message:'User updated.'})
}
export const deleteAdminUser = async (req,res) => {
  const [[count]]=await query(`SELECT COUNT(*) total FROM \`${inquiriesTable}\` WHERE user_id=?`,[req.params.id])
  if (count.total) return res.status(409).json({success:false,message:'This user has inquiry history. Disable the account to retain records.'})
  const [result]=await query('DELETE FROM users WHERE id=?',[req.params.id])
  if (!result.affectedRows) return res.status(404).json({success:false,message:'User not found.'})
  res.json({success:true,message:'User deleted.'})
}

export const listAdminInquiries = async (req,res) => {
  const {page,limit,offset}=pageParams(req); const q=like(req.query.search); const clauses=['i.archived_at IS NULL']; const params=[]
  if(req.query.search){clauses.push('(i.name LIKE ? OR i.email LIKE ? OR i.phone LIKE ? OR i.company LIKE ? OR i.service LIKE ? OR i.project_brief LIKE ?)');params.push(...Array(6).fill(q))}
  if(req.query.status){clauses.push('i.status=?');params.push(req.query.status)}
  if(req.query.service){clauses.push('i.service=?');params.push(req.query.service)}
  if(req.query.from){clauses.push('i.created_at>=?');params.push(req.query.from)}
  if(req.query.to){clauses.push('i.created_at < DATE_ADD(?, INTERVAL 1 DAY)');params.push(req.query.to)}
  const where=clauses.join(' AND ');const [[count]]=await query(`SELECT COUNT(*) total FROM \`${inquiriesTable}\` i WHERE ${where}`,params)
  const [rows]=await query(`SELECT i.id,i.user_id AS userId,i.name,i.email,i.phone,i.company,i.service,i.project_brief AS message,i.budget,i.status,i.follow_up_date AS followUpDate,i.assigned_admin_id AS assignedAdminId,a.name AS assignedAdmin,i.created_at AS createdAt FROM \`${inquiriesTable}\` i LEFT JOIN admins a ON a.id=i.assigned_admin_id WHERE ${where} ORDER BY ${sortOrder(req.query.sort, 'i.name', 'i.created_at')} LIMIT ? OFFSET ?`,[...params,limit,offset])
  pageResponse(res,rows,count.total,page,limit)
}
export const getAdminInquiry = async (req,res) => {
  const [[inquiry]]=await query(`SELECT i.*, i.project_brief AS message, i.follow_up_date AS followUpDate, i.assigned_admin_id AS assignedAdminId,a.name AS assignedAdmin FROM \`${inquiriesTable}\` i LEFT JOIN admins a ON a.id=i.assigned_admin_id WHERE i.id=?`,[req.params.id])
  if(!inquiry)return res.status(404).json({success:false,message:'Inquiry not found.'})
  const [notes]=await query('SELECT n.id,n.note,n.created_at AS createdAt,a.name AS author FROM inquiry_admin_notes n LEFT JOIN admins a ON a.id=n.admin_id WHERE n.inquiry_id=? ORDER BY n.created_at DESC',[req.params.id])
  res.json({success:true,data:{...inquiry,notes}})
}
export const updateAdminInquiry = async (req,res) => {
  const {status,budget,followUpDate,assignedAdminId,archived}=req.body
  const fields=[];const params=[]
  if(status!==undefined){fields.push('status=?');params.push(status)}
  if(budget!==undefined){fields.push('budget=?');params.push(budget===''?null:budget)}
  if(followUpDate!==undefined){fields.push('follow_up_date=?');params.push(followUpDate||null)}
  if(assignedAdminId!==undefined){fields.push('assigned_admin_id=?');params.push(assignedAdminId||null)}
  if(archived!==undefined){fields.push('archived_at=?');params.push(archived?new Date():null)}
  if(!fields.length)return res.status(400).json({success:false,message:'No inquiry fields to update.'})
  const [result]=await query(`UPDATE \`${inquiriesTable}\` SET ${fields.join(',')},updated_at=CURRENT_TIMESTAMP WHERE id=?`,[...params,req.params.id])
  if(!result.affectedRows)return res.status(404).json({success:false,message:'Inquiry not found.'})
  await query('INSERT INTO admin_notifications(admin_id,type,title,message,entity_type,entity_id) VALUES(NULL,?,?,?,?,?)',['inquiry_updated','Inquiry updated',`Inquiry INQ-${req.params.id} was updated by ${req.user.email}.`,'inquiry',Number(req.params.id)])
  res.json({success:true,message:'Inquiry updated.'})
}
export const addInquiryNote=async(req,res)=>{const [r]=await query('INSERT INTO inquiry_admin_notes(inquiry_id,admin_id,note) VALUES(?,?,?)',[req.params.id,req.user.id,req.body.note]);res.status(201).json({success:true,data:{id:r.insertId,note:req.body.note}})}

export const listAdminProjects=async(req,res)=>{
  const {page,limit,offset}=pageParams(req);const q=like(req.query.search);const c=['archived_at IS NULL'];const p=[]
  if(req.query.search){c.push('(title LIKE ? OR location LIKE ? OR category LIKE ?)');p.push(q,q,q)}
  if(req.query.status){c.push('status=?');p.push(req.query.status)}
  const w=c.join(' AND ');const [[count]]=await query(`SELECT COUNT(*) total FROM projects WHERE ${w}`,p)
  const [rows]=await query(`SELECT id,title,location,category,description,client_name AS clientName,project_value AS projectValue,start_date AS startDate,completion_date AS completionDate,status,image,brochure,display_order AS displayOrder,created_at AS createdAt,updated_at AS updatedAt FROM projects WHERE ${w} ORDER BY ${req.query.sort==='name'?'title ASC':req.query.sort==='oldest'?'created_at ASC':'created_at DESC'} LIMIT ? OFFSET ?`,[...p,limit,offset]);pageResponse(res,rows,count.total,page,limit)
}
export const getAdminProject=async(req,res)=>{const [[row]]=await query('SELECT id,title,location,category,description,client_name AS clientName,project_value AS projectValue,start_date AS startDate,completion_date AS completionDate,status,image,brochure,display_order AS displayOrder FROM projects WHERE id=?',[req.params.id]);if(!row)return res.status(404).json({success:false,message:'Project not found.'});const [images]=await query('SELECT id,image_url AS imageUrl,alt_text AS altText,display_order AS displayOrder FROM project_images WHERE project_id=? ORDER BY display_order,id',[req.params.id]);res.json({success:true,data:{...row,images}})}
export const createAdminProject=async(req,res)=>{const b=req.body;const [r]=await query('INSERT INTO projects(title,location,category,description,client_name,project_value,start_date,completion_date,status,image,brochure,display_order) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',[b.title,b.location||'',b.category||'Other',b.description||'',b.clientName||'',b.projectValue||null,b.startDate||null,b.completionDate||null,cleanStatus(b.status,['Upcoming','Ongoing','Completed','On Hold'],'Upcoming'),b.image||'',b.brochure||'',Number(b.displayOrder)||0]);if(Array.isArray(b.galleryMediaIds))for(const mediaId of b.galleryMediaIds){const [[m]]=await query("SELECT CONCAT('/uploads/',stored_name) url FROM media_library WHERE id=? AND media_type='image'",[mediaId]);if(m)await query('INSERT INTO project_images(project_id,image_url,display_order) VALUES(?,?,?)',[r.insertId,m.url,Number(mediaId)||0])}await query('INSERT INTO admin_notifications(admin_id,type,title,message,entity_type,entity_id) VALUES(NULL,?,?,?,?,?)',['project_added','Project added',`${b.title} was added by ${req.user.email}.`,'project',r.insertId]);res.status(201).json({success:true,data:{id:r.insertId,...b}})}
export const updateAdminProject=async(req,res)=>{const b=req.body;const [r]=await query('UPDATE projects SET title=?,location=?,category=?,description=?,client_name=?,project_value=?,start_date=?,completion_date=?,status=?,image=?,brochure=?,display_order=? WHERE id=?',[b.title,b.location||'',b.category||'Other',b.description||'',b.clientName||'',b.projectValue||null,b.startDate||null,b.completionDate||null,cleanStatus(b.status,['Upcoming','Ongoing','Completed','On Hold'],'Upcoming'),b.image||'',b.brochure||'',Number(b.displayOrder)||0,req.params.id]);if(!r.affectedRows)return res.status(404).json({success:false,message:'Project not found.'});if(Array.isArray(b.galleryMediaIds)){await query('DELETE FROM project_images WHERE project_id=?',[req.params.id]);for(const mediaId of b.galleryMediaIds){const [[m]]=await query("SELECT CONCAT('/uploads/',stored_name) url FROM media_library WHERE id=? AND media_type='image'",[mediaId]);if(m)await query('INSERT INTO project_images(project_id,image_url,display_order) VALUES(?,?,?)',[req.params.id,m.url,Number(mediaId)||0])}}res.json({success:true,message:'Project updated.'})}
export const deleteAdminProject=async(req,res)=>{const [r]=await query('UPDATE projects SET archived_at=NOW(),status=IF(status IN (\'active\',\'inactive\'),\'inactive\',\'On Hold\') WHERE id=? AND archived_at IS NULL',[req.params.id]);if(!r.affectedRows)return res.status(404).json({success:false,message:'Project not found.'});res.json({success:true,message:'Project archived.'})}

export const listAdminServices=async(req,res)=>{const {page,limit,offset}=pageParams(req);const q=like(req.query.search);const c=['1=1'];const p=[];if(req.query.search){c.push('(title LIKE ? OR description LIKE ?)');p.push(q,q)}if(req.query.status){c.push('status=?');p.push(req.query.status)}const w=c.join(' AND ');const [[n]]=await query(`SELECT COUNT(*) total FROM services WHERE ${w}`,p);const [rows]=await query(`SELECT id,title,slug,description,image,icon,display_order AS displayOrder,status,created_at AS createdAt FROM services WHERE ${w} ORDER BY ${req.query.sort==='name'?'title ASC,display_order ASC':req.query.sort==='oldest'?'created_at ASC':'display_order ASC,id'} LIMIT ? OFFSET ?`,[...p,limit,offset]);pageResponse(res,rows,n.total,page,limit)}
export const createAdminService=async(req,res)=>{const b=req.body;const [r]=await query('INSERT INTO services(title,slug,description,image,icon,display_order,status) VALUES(?,?,?,?,?,?,?)',[b.title,b.slug,b.description,b.image||'',b.icon||'',Number(b.displayOrder)||0,b.status==='inactive'?'inactive':'active']);await query('INSERT INTO admin_notifications(admin_id,type,title,message,entity_type,entity_id) VALUES(NULL,?,?,?,?,?)',['service_added','Service added',`${b.title} was added by ${req.user.email}.`,'service',r.insertId]);res.status(201).json({success:true,data:{id:r.insertId,...b}})}
export const updateAdminService=async(req,res)=>{const b=req.body;const [r]=await query('UPDATE services SET title=?,slug=?,description=?,image=?,icon=?,display_order=?,status=? WHERE id=?',[b.title,b.slug,b.description,b.image||'',b.icon||'',Number(b.displayOrder)||0,b.status==='inactive'?'inactive':'active',req.params.id]);if(!r.affectedRows)return res.status(404).json({success:false,message:'Service not found.'});res.json({success:true,message:'Service updated.'})}
export const deleteAdminService=async(req,res)=>{const [r]=await query('DELETE FROM services WHERE id=?',[req.params.id]);if(!r.affectedRows)return res.status(404).json({success:false,message:'Service not found.'});res.json({success:true,message:'Service deleted.'})}

const companySelect=`SELECT id,company_name AS companyName,tagline,about_company AS aboutCompany,founded_year AS foundedYear,email,phone_1 AS phone,phone_2 AS alternatePhone,whatsapp,head_office AS address,branch_office AS branchOffice,city,state,country,google_map_url AS googleMapUrl,gst_number AS gstNumber,cin_number AS cinNumber,office_hours AS officeHours,website,facebook,instagram,linkedin,youtube,twitter,updated_at AS updatedAt FROM website_settings WHERE id=1`
export const getAdminCompany=async(req,res)=>{const [[row]]=await query(companySelect);res.json({success:true,data:row||{}})}
export const updateAdminCompany=async(req,res)=>{const b=req.body;await query(`UPDATE website_settings SET company_name=?,tagline=?,about_company=?,founded_year=?,email=?,phone_1=?,phone_2=?,whatsapp=?,head_office=?,branch_office=?,city=?,state=?,country=?,google_map_url=?,gst_number=?,cin_number=?,office_hours=?,website=?,facebook=?,instagram=?,linkedin=?,youtube=?,twitter=? WHERE id=1`,[b.companyName||'',b.tagline||'',b.aboutCompany||'',b.foundedYear||null,b.email||'',b.phone||'',b.alternatePhone||'',b.whatsapp||'',b.address||'',b.branchOffice||'',b.city||'',b.state||'',b.country||'',b.googleMapUrl||'',b.gstNumber||'',b.cinNumber||'',b.officeHours||'',b.website||'',b.facebook||'',b.instagram||'',b.linkedin||'',b.youtube||'',b.twitter||'']);res.json({success:true,message:'Company information saved.'})}
export const listContent=async(req,res)=>{const [rows]=await query('SELECT page_key AS page,section_key AS section,content,updated_at AS updatedAt FROM website_content ORDER BY page_key,section_key');res.json({success:true,data:rows})}
export const getPublicContent=async(_req,res)=>{const [rows]=await query('SELECT page_key AS page,section_key AS section,content FROM website_content');const data={};for(const row of rows){data[row.page]??={};data[row.page][row.section]=row.content}res.json({success:true,data})}
export const putContent=async(_req,res)=>res.status(410).json({success:false,message:'Website content now saves as a theme draft. Use the Website Customizer to save or publish changes.'})

export const listContacts=async(req,res)=>{const {page,limit,offset}=pageParams(req);const q=like(req.query.search);const c=['1=1'];const p=[];if(req.query.search){c.push('(name LIKE ? OR email LIKE ? OR phone LIKE ? OR subject LIKE ? OR message LIKE ?)');p.push(q,q,q,q,q)}if(req.query.status){c.push('status=?');p.push(req.query.status)}const w=c.join(' AND ');const [[n]]=await query(`SELECT COUNT(*) total FROM contact_messages WHERE ${w}`,p);const [rows]=await query(`SELECT id,name,email,phone,subject,message,status,created_at AS createdAt FROM contact_messages WHERE ${w} ORDER BY ${sortOrder(req.query.sort, 'name')} LIMIT ? OFFSET ?`,[...p,limit,offset]);pageResponse(res,rows,n.total,page,limit)}
export const updateContact=async(req,res)=>{const [r]=await query('UPDATE contact_messages SET status=? WHERE id=?',[req.body.status,req.params.id]);if(!r.affectedRows)return res.status(404).json({success:false,message:'Contact message not found.'});res.json({success:true,message:'Contact message updated.'})}
export const deleteContact=async(req,res)=>{const [r]=await query('DELETE FROM contact_messages WHERE id=?',[req.params.id]);if(!r.affectedRows)return res.status(404).json({success:false,message:'Contact message not found.'});res.json({success:true,message:'Contact message deleted.'})}

export const listAdminAccounts=async(req,res)=>{const [rows]=await query("SELECT id,name,email,role,created_at AS createdAt FROM admins ORDER BY created_at DESC");res.json({success:true,data:rows})}
export const createAdminAccount=async(req,res)=>{const hash=await bcrypt.hash(req.body.password,12);const [r]=await query('INSERT INTO admins(name,email,password,role) VALUES(?,?,?,?)',[req.body.name,req.body.email,hash,req.body.role]);res.status(201).json({success:true,data:{id:r.insertId,name:req.body.name,email:req.body.email,role:req.body.role}})}
export const updateAdminAccount=async(req,res)=>{const allowed=['super_admin','admin','manager','editor','support_staff'];const {name,email,role,password}=req.body;const fields=['name=?','email=?','role=?','session_version=session_version+1'];const params=[name,email,allowed.includes(role)?role:'admin'];if(password){fields.push('password=?');params.push(await bcrypt.hash(password,12))}const [r]=await query(`UPDATE admins SET ${fields.join(',')} WHERE id=?`,[...params,req.params.id]);if(!r.affectedRows)return res.status(404).json({success:false,message:'Admin account not found.'});res.json({success:true,message:'Admin account updated.'})}
export const deleteAdminAccount=async(req,res)=>{if(Number(req.params.id)===Number(req.user.id))return res.status(400).json({success:false,message:'You cannot delete your own admin account.'});const [[target]]=await query('SELECT role FROM admins WHERE id=?',[req.params.id]);if(!target)return res.status(404).json({success:false,message:'Admin account not found.'});if(target.role==='super_admin'){const [[count]]=await query("SELECT COUNT(*) total FROM admins WHERE role='super_admin'");if(count.total<=1)return res.status(409).json({success:false,message:'At least one Super Admin account must remain.'})}await query('DELETE FROM admins WHERE id=?',[req.params.id]);res.json({success:true,message:'Admin account deleted.'})}

export const listAdminNotifications=async(req,res)=>{const [rows]=await query('SELECT id,type,title,message,entity_type AS entityType,entity_id AS entityId,is_read AS isRead,created_at AS createdAt FROM admin_notifications WHERE admin_id IS NULL OR admin_id=? ORDER BY created_at DESC LIMIT 100',[req.user.id]);res.json({success:true,data:rows,unread:rows.filter(x=>!x.isRead).length})}
export const markAdminNotification=async(req,res)=>{const [r]=await query('UPDATE admin_notifications SET is_read=1 WHERE id=? AND (admin_id IS NULL OR admin_id=?)',[req.params.id,req.user.id]);if(!r.affectedRows)return res.status(404).json({success:false,message:'Notification not found.'});res.json({success:true,message:'Notification marked as read.'})}
export const markAllAdminNotifications=async(req,res)=>{await query('UPDATE admin_notifications SET is_read=1 WHERE is_read=0 AND (admin_id IS NULL OR admin_id=?)',[req.user.id]);res.json({success:true,message:'All notifications marked as read.'})}
export const deleteAdminNotification=async(req,res)=>{const [r]=await query('DELETE FROM admin_notifications WHERE id=? AND (admin_id IS NULL OR admin_id=?)',[req.params.id,req.user.id]);if(!r.affectedRows)return res.status(404).json({success:false,message:'Notification not found.'});res.json({success:true,message:'Notification deleted.'})}
export const changeAdminPassword=async(req,res)=>{const [[admin]]=await query('SELECT password FROM admins WHERE id=?',[req.user.id]);if(!admin||!(await bcrypt.compare(req.body.currentPassword,admin.password)))return res.status(400).json({success:false,message:'Current password is incorrect.'});if(req.body.currentPassword===req.body.newPassword)return res.status(400).json({success:false,message:'Choose a new password that differs from the current password.'});const hash=await bcrypt.hash(req.body.newPassword,12);await query('UPDATE admins SET password=?,session_version=session_version+1 WHERE id=?',[hash,req.user.id]);res.json({success:true,message:'Password changed. Sign in again with your new password.'})}
export const report=async(req,res)=>{
  const from=req.query.from||new Date(Date.now()-30*86400000).toISOString().slice(0,10);const to=req.query.to||new Date().toISOString().slice(0,10)
  const [[users]]=await query('SELECT COUNT(*) total FROM users WHERE created_at>=? AND created_at<DATE_ADD(?,INTERVAL 1 DAY)',[from,to])
  const [[projects]]=await query('SELECT COUNT(*) total FROM projects WHERE created_at>=? AND created_at<DATE_ADD(?,INTERVAL 1 DAY)',[from,to])
  const [[services]]=await query('SELECT COUNT(*) total FROM services WHERE created_at>=? AND created_at<DATE_ADD(?,INTERVAL 1 DAY)',[from,to])
  const [inquiries]=await query(`SELECT id,name,email,phone,company,service,status,created_at AS createdAt FROM \`${inquiriesTable}\` WHERE created_at>=? AND created_at<DATE_ADD(?,INTERVAL 1 DAY) ORDER BY created_at DESC`,[from,to])
  const [userRows]=await query('SELECT id,name,email,phone,status,created_at AS createdAt FROM users WHERE created_at>=? AND created_at<DATE_ADD(?,INTERVAL 1 DAY) ORDER BY created_at DESC',[from,to])
  const [projectRows]=await query('SELECT id,title,location,category,status,created_at AS createdAt FROM projects WHERE created_at>=? AND created_at<DATE_ADD(?,INTERVAL 1 DAY) ORDER BY created_at DESC',[from,to])
  const [serviceRows]=await query('SELECT id,title,slug,status,display_order AS displayOrder,created_at AS createdAt FROM services WHERE created_at>=? AND created_at<DATE_ADD(?,INTERVAL 1 DAY) ORDER BY created_at DESC',[from,to])
  res.json({success:true,data:{from,to,inquiries,users:users.total,projects:projects.total,services:services.total,rows:{inquiries,users:userRows,projects:projectRows,services:serviceRows}}})
}

export const listMedia = async (req, res) => {
  const { page, limit, offset } = pageParams(req)
  const q = like(req.query.search)
  const clauses = ['1=1']
  const params = []
  if (req.query.search) {
    clauses.push('(original_name LIKE ? OR alt_text LIKE ? OR mime_type LIKE ?)')
    params.push(q, q, q)
  }
  if (['image', 'document'].includes(req.query.type)) {
    clauses.push('media_type=?')
    params.push(req.query.type)
  }
  const where = clauses.join(' AND ')
  const [[count]] = await query(`SELECT COUNT(*) total FROM media_library WHERE ${where}`, params)
  const [rows] = await query(
    `SELECT m.id,m.original_name AS originalName,m.stored_name AS storedName,m.mime_type AS mimeType,m.file_size AS fileSize,m.media_type AS mediaType,m.width,m.height,m.alt_text AS altText,m.related_type AS relatedType,m.related_id AS relatedId,m.created_at AS createdAt,a.name AS uploadedBy
     FROM media_library m LEFT JOIN admins a ON a.id=m.uploaded_by
     WHERE ${where.replaceAll('original_name', 'm.original_name').replaceAll('alt_text', 'm.alt_text').replaceAll('mime_type', 'm.mime_type').replaceAll('media_type', 'm.media_type')}
     ORDER BY ${req.query.sort === 'oldest' ? 'm.created_at ASC' : req.query.sort === 'name' ? 'm.original_name ASC' : 'm.created_at DESC'}
     LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  )
  pageResponse(res, rows, count.total, page, limit)
}
export const isValidMediaFile = async (file) => {
  const handle = await fs.open(file.path, 'r')
  const signature = Buffer.alloc(16)
  let bytesRead
  try {
    ({ bytesRead } = await handle.read(signature, 0, signature.length, 0))
  } finally {
    await handle.close()
  }
  const bytes = signature.subarray(0, bytesRead)
  return (file.mimetype === 'image/jpeg' && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    || (file.mimetype === 'image/png' && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    || (file.mimetype === 'image/webp' && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP')
    || (file.mimetype === 'image/gif' && ['GIF87a', 'GIF89a'].includes(bytes.toString('ascii', 0, 6)))
    || (file.mimetype === 'application/pdf' && bytes.toString('ascii', 0, 5) === '%PDF-')
}

export const getImageDimensions = async (file) => {
  const bytes = await fs.readFile(file.path)
  let width
  let height
  if (file.mimetype === 'image/png' && bytes.length >= 24 && bytes.toString('ascii', 12, 16) === 'IHDR') {
    width = bytes.readUInt32BE(16)
    height = bytes.readUInt32BE(20)
  } else if (file.mimetype === 'image/gif' && bytes.length >= 10) {
    width = bytes.readUInt16LE(6)
    height = bytes.readUInt16LE(8)
  } else if (file.mimetype === 'image/webp' && bytes.length >= 20 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') {
    const chunk = bytes.toString('ascii', 12, 16)
    if (chunk === 'VP8X' && bytes.length >= 30) {
      width = 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16)
      height = 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16)
    } else if (chunk === 'VP8L' && bytes.length >= 25 && bytes[20] === 0x2f) {
      width = 1 + (((bytes[22] & 0x3f) << 8) | bytes[21])
      height = 1 + (((bytes[24] & 0x0f) << 10) | (bytes[23] << 2) | ((bytes[22] & 0xc0) >> 6))
    } else if (chunk === 'VP8 ' && bytes.length >= 30 && bytes[23] === 0x9d && bytes[24] === 0x01 && bytes[25] === 0x2a) {
      width = bytes.readUInt16LE(26) & 0x3fff
      height = bytes.readUInt16LE(28) & 0x3fff
    }
  } else if (file.mimetype === 'image/jpeg' && bytes.length >= 4) {
    const startOfFrame = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf])
    let offset = 2
    while (offset + 3 < bytes.length) {
      if (bytes[offset] !== 0xff) {
        offset += 1
        continue
      }
      while (bytes[offset] === 0xff) offset += 1
      const marker = bytes[offset]
      if (marker === undefined || marker === 0xd9 || marker === 0xda) break
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8)) {
        offset += 1
        continue
      }
      if (offset + 2 >= bytes.length) break
      const segmentLength = bytes.readUInt16BE(offset + 1)
      if (segmentLength < 2 || offset + 1 + segmentLength > bytes.length) break
      if (startOfFrame.has(marker) && segmentLength >= 8) {
        height = bytes.readUInt16BE(offset + 4)
        width = bytes.readUInt16BE(offset + 6)
        break
      }
      offset += 1 + segmentLength
    }
  }
  return Number.isInteger(width) && Number.isInteger(height) && width > 0 && height > 0 && width <= 100000 && height <= 100000
    ? { width, height }
    : null
}

export const uploadMediaRecord = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'Choose a file to upload.' })
  if (!await isValidMediaFile(req.file)) {
    await fs.rm(req.file.path, { force: true })
    return res.status(415).json({ success: false, message: 'The file contents do not match a supported image or PDF format.' })
  }
  const dimensions = req.file.mimetype === 'application/pdf' ? null : await getImageDimensions(req.file)
  if (req.file.mimetype !== 'application/pdf' && !dimensions) {
    await fs.rm(req.file.path, { force: true })
    return res.status(415).json({ success: false, message: 'The image is incomplete or its dimensions could not be read.' })
  }
  const originalName = path.basename(req.file.originalname).slice(0, 255)
  const mediaType = req.file.mimetype === 'application/pdf' ? 'document' : 'image'
  const relatedType = ['project', 'service', 'banner', 'gallery', 'general'].includes(req.body.relatedType) ? req.body.relatedType : 'general'
  const relatedId = Number(req.body.relatedId) || null
  const [result] = await query('INSERT INTO media_library(original_name,stored_name,mime_type,file_size,media_type,width,height,alt_text,related_type,related_id,uploaded_by) VALUES(?,?,?,?,?,?,?,?,?,?,?)', [originalName, req.file.filename, req.file.mimetype, req.file.size, mediaType, dimensions?.width ?? null, dimensions?.height ?? null, String(req.body.altText || '').slice(0, 255), relatedType, relatedId, req.user.id])
  if (mediaType === 'image' && relatedType === 'project' && relatedId) await query('INSERT INTO project_images(project_id,image_url,alt_text,display_order) VALUES(?,?,?,?)', [relatedId, `/uploads/${req.file.filename}`, String(req.body.altText || '').slice(0, 190), 0])
  if (mediaType === 'image' && relatedType === 'service' && relatedId) await query('UPDATE services SET image=? WHERE id=?', [`/uploads/${req.file.filename}`, relatedId])
  res.status(201).json({ success: true, data: { id: result.insertId, originalName, storedName: req.file.filename, url: `/uploads/${req.file.filename}`, mimeType: req.file.mimetype, fileSize: req.file.size, mediaType, ...dimensions } })
}

export const replaceMediaFile = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'Choose a replacement image.' })
  if (!await isValidMediaFile(req.file) || req.file.mimetype === 'application/pdf') {
    await fs.rm(req.file.path, { force: true })
    return res.status(415).json({ success: false, message: 'Replacement must be a valid JPG, PNG, WEBP, or GIF image.' })
  }
  const dimensions = await getImageDimensions(req.file)
  if (!dimensions) {
    await fs.rm(req.file.path, { force: true })
    return res.status(415).json({ success: false, message: 'Replacement image is incomplete or its dimensions could not be read.' })
  }
  const [[item]] = await query('SELECT stored_name AS storedName, mime_type AS mimeType, media_type AS mediaType FROM media_library WHERE id=?', [req.params.id])
  if (!item) {
    await fs.rm(req.file.path, { force: true })
    return res.status(404).json({ success: false, message: 'Media item not found.' })
  }
  if (item.mediaType !== 'image' || item.mimeType !== req.file.mimetype) {
    await fs.rm(req.file.path, { force: true })
    return res.status(415).json({ success: false, message: 'Replacement must be an image of the same format as the current media item.' })
  }
  const storedName = path.basename(item.storedName)
  if (storedName !== item.storedName) {
    await fs.rm(req.file.path, { force: true })
    return res.status(500).json({ success: false, message: 'The stored media path is invalid; replacement was stopped.' })
  }
  const uploadRoot = path.resolve(process.env.UPLOADS_DIR || path.resolve(process.cwd(), 'uploads'))
  const destination = path.resolve(uploadRoot, storedName)
  const backup = `${destination}.backup-${randomUUID()}`
  const originalName = path.basename(req.file.originalname).slice(0, 255)
  try {
    await fs.rename(destination, backup)
  } catch (error) {
    await fs.rm(req.file.path, { force: true })
    throw error
  }
  try {
    await fs.rename(req.file.path, destination)
    await query('UPDATE media_library SET original_name=?, file_size=?, width=?, height=?, uploaded_by=? WHERE id=?', [originalName, req.file.size, dimensions.width, dimensions.height, req.user.id, req.params.id])
  } catch (error) {
    await fs.rm(destination, { force: true })
    await fs.rename(backup, destination)
    await fs.rm(req.file.path, { force: true })
    throw error
  }
  await fs.rm(backup, { force: true })
  res.json({ success: true, message: 'Image replaced. Existing media URLs remain unchanged.', data: { url: `/uploads/${storedName}`, fileSize: req.file.size, originalName, ...dimensions } })
}
export const updateMedia = async (req, res) => {
  const body = req.body
  const fields = []
  const values = []
  if (body.originalName !== undefined) {
    fields.push('original_name=?')
    values.push(path.basename(body.originalName).slice(0, 255))
  }
  if (body.altText !== undefined) {
    fields.push('alt_text=?')
    values.push(body.altText)
  }
  if (body.relatedType !== undefined) {
    fields.push('related_type=?')
    values.push(body.relatedType)
  }
  if (body.relatedId !== undefined) {
    fields.push('related_id=?')
    values.push(body.relatedId || null)
  }
  if (!fields.length) return res.status(400).json({ success: false, message: 'No media fields to update.' })
  const [result] = await query(`UPDATE media_library SET ${fields.join(',')} WHERE id=?`, [...values, req.params.id])
  if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Media item not found.' })
  if (body.altText !== undefined) {
    const [[media]] = await query('SELECT stored_name AS storedName FROM media_library WHERE id=?', [req.params.id])
    if (media) await query('UPDATE project_images SET alt_text=? WHERE image_url=?', [body.altText, `/uploads/${path.basename(media.storedName)}`])
  }
  res.json({ success: true, message: 'Media item updated.' })
}
export const deleteMedia=async(req,res)=>{const [[row]]=await query('SELECT stored_name FROM media_library WHERE id=?',[req.params.id]);if(!row)return res.status(404).json({success:false,message:'Media item not found.'});const url=`/uploads/${path.basename(row.stored_name)}`;await query('DELETE FROM project_images WHERE image_url=?',[url]);await query("UPDATE services SET image='' WHERE image=?",[url]);await query('DELETE FROM media_library WHERE id=?',[req.params.id]);await fs.rm(path.resolve(process.env.UPLOADS_DIR||path.resolve(process.cwd(),'uploads'),path.basename(row.stored_name)),{force:true});res.json({success:true,message:'Media item deleted.'})}
export const listDocuments=async(req,res)=>{const {page,limit,offset}=pageParams(req);const q=like(req.query.search);const clauses=['1=1'];const params=[];if(req.query.search){clauses.push('(d.name LIKE ? OR m.original_name LIKE ? OR p.title LIKE ?)');params.push(q,q,q)}if(['active','archived'].includes(req.query.status)){clauses.push('d.status=?');params.push(req.query.status)}const where=clauses.join(' AND ');const [[n]]=await query(`SELECT COUNT(*) total FROM documents d JOIN media_library m ON m.id=d.media_id LEFT JOIN projects p ON p.id=d.related_project_id WHERE ${where}`,params);const [rows]=await query(`SELECT d.id,d.name,d.status,d.created_at AS uploadedAt,d.related_project_id AS relatedProjectId,p.title AS relatedProject,m.original_name AS fileName,m.mime_type AS mimeType,m.stored_name AS storedName FROM documents d JOIN media_library m ON m.id=d.media_id LEFT JOIN projects p ON p.id=d.related_project_id WHERE ${where} ORDER BY ${req.query.sort==='oldest'?'d.created_at ASC':req.query.sort==='name'?'d.name ASC':'d.created_at DESC'} LIMIT ? OFFSET ?`,[...params,limit,offset]);pageResponse(res,rows.map(x=>({...x,url:`/uploads/${x.storedName}`})),n.total,page,limit)}
export const createDocument=async(req,res)=>{const [[media]]=await query("SELECT id FROM media_library WHERE id=? AND media_type='document'",[req.body.mediaId]);if(!media)return res.status(400).json({success:false,message:'Upload a PDF document first.'});const [r]=await query('INSERT INTO documents(name,media_id,related_project_id,uploaded_by) VALUES(?,?,?,?)',[req.body.name,req.body.mediaId,req.body.relatedProjectId||null,req.user.id]);res.status(201).json({success:true,data:{id:r.insertId}})}
export const updateDocument=async(req,res)=>{await query('UPDATE documents SET status=? WHERE id=?',[req.body.status,req.params.id]);res.json({success:true,message:'Document updated.'})}
export const deleteDocument=async(req,res)=>{const [r]=await query('DELETE FROM documents WHERE id=?',[req.params.id]);if(!r.affectedRows)return res.status(404).json({success:false,message:'Document not found.'});res.json({success:true,message:'Document deleted.'})}
