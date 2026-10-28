import { query } from '../config/db.js'
import { sendMail } from '../config/mailer.js'

const escapeHtml = (value='') => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
export const createPublicContactMessage=async(req,res)=>{
  const {name,email,phone='',subject='',message}=req.body
  const [saved]=await query('INSERT INTO contact_messages(name,email,phone,subject,message,status) VALUES(?,?,?,?,?,\'Unread\')',[name,email,phone,subject,message])
  await query("INSERT INTO admin_notifications(admin_id,type,title,message,entity_type,entity_id) VALUES(NULL,'contact_message','New contact message',CONCAT('New message from ', ? , '.'),'contact_message',?)",[name,saved.insertId])
  try { const receiver=process.env.INQUIRY_RECEIVER_EMAIL||'vswindiaprojects@gmail.com';const safe={name:escapeHtml(name),email:escapeHtml(email),phone:escapeHtml(phone||'—'),subject:escapeHtml(subject||'Website contact'),message:escapeHtml(message).replace(/\r?\n/g,'<br>')};await sendMail({to:receiver,replyTo:email,subject:`New Website Contact - ${name}`,text:`Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nSubject: ${subject}\n\n${message}\n\nMessage ID: ${saved.insertId}`,html:`<h2>New Website Contact</h2><p><b>Name:</b> ${safe.name}<br><b>Email:</b> ${safe.email}<br><b>Phone:</b> ${safe.phone}<br><b>Subject:</b> ${safe.subject}</p><p>${safe.message}</p><small>Message ID: ${saved.insertId}</small>`}) }
  catch(error){console.error('[contact-message-email] Could not send notification:',{code:error.code||'MAIL_ERROR'})}
  res.status(201).json({success:true,message:'Your message has been sent successfully.',data:{id:saved.insertId}})
}
