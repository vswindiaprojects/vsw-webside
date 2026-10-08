import { Compass, DraftingCompass, ClipboardList, Construction, FileText, Calculator, ClipboardCheck, Files, ReceiptText, Scale, BadgeIndianRupee, ChartNoAxesCombined, CircleDollarSign, FolderCheck, Ruler, FileCheck2, Send, MessageCircleReply, BadgeCheck, HandCoins, CheckCircle2, TrendingUp, Clock3, ShieldCheck } from 'lucide-react'

export const services = [
  { number: '01', title: 'Site Surveying & Documentation', short: 'Clear site intelligence for confident decisions.', description: 'Accurate site data, measurements and project documentation create the foundation for every successful project.', icon: Compass },
  { number: '02', title: 'Design & Space Solutions', short: 'Thoughtful planning shaped around real needs.', description: 'Design planning and space solutions that respond to practical project requirements and the way people use a place.', icon: DraftingCompass },
  { number: '03', title: 'Project Management', short: 'Coordination that keeps the work moving.', description: 'Structured planning, execution monitoring and project control across the moving parts of a project.', icon: ClipboardList },
  { number: '04', title: 'Turnkey Project Solutions', short: 'One connected path from brief to completion.', description: 'Integrated execution that brings planning, coordination and project completion together under one clear direction.', icon: Construction },
  { number: '05', title: 'Contracts Billing', short: 'Documentation for commercial clarity.', description: 'Contracts, billing documentation, quantity-related documentation and commercial coordination for the project.', icon: FileText },
]

const projectVisuals = {
  'Navi Mumbai International Airport': ['quantity-surveying/navi-mumbai-international-airport', 'Airport terminal architecture'],
  'Google Data Centre': ['quantity-surveying/google-data-centre', 'Data centre server facility'],
  'Microsoft Data Centre': ['quantity-surveying/microsoft-data-centre', 'Data centre infrastructure'],
  'TCS Project': ['quantity-surveying/tcs-project', 'Technology office campus'],
  'Lodha Luxuria': ['project-management/lodha-luxuria', 'Luxury residential tower'],
  'Godrej Horizon': ['project-management/godrej-horizon', 'Residential high-rise development'],
  'Piramal Aranya': ['quantity-surveying/piramal-aranya', 'Premium residential towers'],
  'Jio World Drive': ['quantity-surveying/jio-world-drive', 'Modern retail destination'],
  'Varanasi International Cricket Stadium': ['designing/varanasi-cricket-stadium', 'Cricket stadium architecture'],
  'D. Y. Patil College Hall': ['turnkey-solutions/dy-patil-college-hall', 'College auditorium'],
  'Vandana Theater': ['turnkey-solutions/vandana-theater', 'Theatre auditorium'],
  'Goa All India Radio Hall (Akashvani)': ['turnkey-solutions/goa-air-hall', 'Radio broadcasting studio'],
  'Hive Icon 67, Office space': ['end-to-end-solutions/hive-icon-67', 'Contemporary collaborative office'],
  'New Government Medical College Hall': ['turnkey-solutions/government-medical-college-hall', 'Medical college campus'],
  'Ravindra Bhavan': ['turnkey-solutions/ravindra-bhavan', 'Cultural auditorium interior'],
  'Euro School': ['designing/euro-school', 'Contemporary school campus'],
  'Makwana Group': ['end-to-end-solutions/makwana-group', 'Modern commercial office building'],
  'Mot Realtors': ['turnkey-solutions/mot-realtors', 'Contemporary commercial development'],
  'Mr. Pagdhare House': ['end-to-end-solutions/pagdhare-house', 'Modern private residence'],
  'Kanakiya High School Hall': ['turnkey-solutions/kanakiya-high-school-hall', 'School auditorium seating'],
  'Villa Aventus – Tropicana Stays': ['project-management/villa-aventus', 'Luxury villa in a green landscape'],
  'Lions Club – Chembur – Hospital': ['project-management/lions-club-hospital', 'Hospital exterior architecture'],
  'Apex Kidney Care – Dialysis Centres': ['project-management/apex-kidney-care', 'Healthcare treatment room'],
  Samsung: ['earlier-projects/samsung', 'Technology company office exterior'],
  'WOOD KRAFT': ['earlier-projects/wood-kraft', 'Craft woodworking workshop'],
  'We Work': ['earlier-projects/wework', 'Coworking office interior'],
  'Hotel Transit, GMR Airport': ['earlier-projects/hotel-transit', 'Airport hotel interior'],
  'Collective ABFRL': ['earlier-projects/collective-abfrl', 'Premium fashion retail interior'],
  'AIR INDIA': ['earlier-projects/air-india', 'Airport terminal interior'],
  '7 APPLE': ['earlier-projects/7-apple', 'Hospitality resort architecture'],
  'Vidya Niketan School': ['earlier-projects/vidya-niketan', 'School building and campus'],
}

const projectRecords = [
  ['Navi Mumbai International Airport', 'Navi Mumbai', 'Quantity surveying services – Billing', 'Quantity Surveying / Billing', 'Recent'],
  ['Google Data Centre', 'Mumbai', 'Quantity surveying services – Billing', 'Quantity Surveying / Billing', 'Recent'],
  ['Microsoft Data Centre', 'Pune', 'Quantity surveying services – Billing', 'Quantity Surveying / Billing', 'Recent'],
  ['TCS Project', 'Pune', 'Quantity surveying services – Billing', 'Quantity Surveying / Billing', 'Recent'],
  ['Lodha Luxuria', 'Lower Parel, Mumbai', 'Project Management and Billing', 'Project Management', 'Recent'],
  ['Godrej Horizon', 'Wadala, Mumbai', 'Project Management and Billing', 'Project Management', 'Recent'],
  ['Piramal Aranya', 'Byculla, Mumbai', 'Quantity surveying services – Billing', 'Quantity Surveying / Billing', 'Recent'],
  ['Jio World Drive', 'BKC', 'Quantity surveying services – Billing', 'Quantity Surveying / Billing', 'Recent'],
  ['Varanasi International Cricket Stadium', 'Varanasi', 'Designing', 'Designing', 'Recent'],
  ['D. Y. Patil College Hall', 'Nerul', 'Turnkey Solution', 'Turnkey Solutions', 'Recent'],
  ['Vandana Theater', 'Thane', 'Turnkey Solution', 'Turnkey Solutions', 'Recent'],
  ['Goa All India Radio Hall (Akashvani)', 'Goa', 'Turnkey Solution', 'Turnkey Solutions', 'Recent'],
  ['Hive Icon 67, Office space', 'Kandivali, Mumbai', 'End to End Solution with Designing', 'End-to-End Solutions', 'Recent'],
  ['New Government Medical College Hall', 'Rajkot', 'Turnkey Solution', 'Turnkey Solutions', 'Recent'],
  ['Ravindra Bhavan', 'Madgaon, Goa', 'Turnkey Solution', 'Turnkey Solutions', 'Recent'],
  ['Euro School', 'Hennur, Bangalore', 'Designing', 'Designing', 'Recent'],
  ['Makwana Group', 'Pune', 'End to End Solution with Designing', 'End-to-End Solutions', 'Recent'],
  ['Mot Realtors', 'Koparkhairane, Mumbai', 'Turnkey Solution', 'Turnkey Solutions', 'Recent'],
  ['Mr. Pagdhare House', 'Matunga, Mumbai', 'End to End Solution with Designing', 'End-to-End Solutions', 'Recent'],
  ['Kanakiya High School Hall', 'Mira Road', 'Turnkey Solution', 'Turnkey Solutions', 'Recent'],
  ['Villa Aventus – Tropicana Stays', 'Lonavala', 'Project Management', 'Project Management', 'Recent'],
  ['Lions Club – Chembur – Hospital', 'Chembur', 'Project Management', 'Project Management', 'Recent'],
  ['Apex Kidney Care – Dialysis Centres', 'Not specified', 'Project Management', 'Project Management', 'Recent'],
  ['Samsung', 'Noida, Delhi', 'Quantity surveying services – Billing', 'Quantity Surveying / Billing', 'Earlier'],
  ['WOOD KRAFT', 'Gurugram, Delhi', 'Scope not specified in source', 'Earlier Projects', 'Earlier'],
  ['We Work', 'Kharadi, Pune', 'Scope not specified in source', 'Earlier Projects', 'Earlier'],
  ['Hotel Transit, GMR Airport', 'Hyderabad', 'Scope not specified in source', 'Earlier Projects', 'Earlier'],
  ['Collective ABFRL', 'Santacruz, Mumbai', 'Scope not specified in source', 'Earlier Projects', 'Earlier'],
  ['AIR INDIA', 'Noida, Delhi', 'Scope not specified in source', 'Earlier Projects', 'Earlier'],
  ['7 APPLE', 'Nashik', 'Scope not specified in source', 'Earlier Projects', 'Earlier'],
  ['Vidya Niketan School', 'Dombivali, Mumbai', 'Scope not specified in source', 'Earlier Projects', 'Earlier'],
]

export const projects = projectRecords.map(([name, location, scope, category, status], index) => {
  const [imagePath, imageDescription] = projectVisuals[name] ?? []
  return {
    id: index + 1,
    name,
    location,
    scope,
    category,
    status,
    image: `/assets/images/projects/${imagePath}.webp`,
    imageAlt: `${imageDescription} — illustrative image for ${name}`,
  }
})

if (import.meta.env?.DEV) {
  const imagePaths = projects.map(({ image }) => image)
  const duplicatePaths = imagePaths.filter((path, index) => imagePaths.indexOf(path) !== index)
  const missingPaths = projects.filter(({ name, image, imageAlt }) => !projectVisuals[name] || !image || image.includes('undefined') || !imageAlt)
  if (duplicatePaths.length || missingPaths.length || projects.length !== Object.keys(projectVisuals).length) {
    console.warn('Project image mapping validation failed.', { duplicatePaths, missingPaths, projectCount: projects.length, mappingCount: Object.keys(projectVisuals).length })
  }
}

export const projectCategories = ['All Projects', 'Quantity Surveying / Billing', 'Project Management', 'Designing', 'Turnkey Solutions', 'End-to-End Solutions', 'Earlier Projects']

export const workflow = [
  ['01', 'Site Survey', 'Establish the facts on the ground.'], ['02', 'Detailed Report', 'Turn observations into usable information.'], ['03', 'Design & Planning', 'Shape a practical direction for the work.'], ['04', 'BOQ & Costing', 'Build a clear view of project requirements.'], ['05', 'Project Management', 'Coordinate progress with purpose.'], ['06', 'Turnkey Execution', 'Bring the plan through to completion.'], ['07', 'Billing & Quantity Surveying', 'Close the loop with structured documentation.'], ['08', 'Reconciliation & Closure', 'Bring project documentation to a clear close.'],
].map(([number, title, text]) => ({ number, title, text }))

export const strengths = ['Accuracy', 'Integrated Expertise', 'Execution Focus', 'Commercial Control', 'Transparent Documentation', 'Single-Point Coordination']

export const billingExpertise = [
  { title: 'Contract Billing', description: 'Prepare and manage project bills in line with contract requirements.', icon: ReceiptText },
  { title: 'Quantity Surveying', description: 'Measure and document executed quantities for project billing.', icon: Ruler },
  { title: 'BOQ Verification', description: 'Review BOQ quantities against project records and measurements.', icon: ClipboardCheck },
  { title: 'Client Billing', description: 'Prepare and submit client bills with supporting documentation.', icon: Send },
  { title: 'Commercial Documentation', description: 'Maintain clear records for billing, review and certification.', icon: Files },
  { title: 'Final Account Settlement', description: 'Support final bills and commercial closeout documentation.', icon: BadgeIndianRupee },
  { title: 'Variation & Extra Item Claims', description: 'Document variations and extra items for commercial review.', icon: Scale },
  { title: 'Cost Control & Reconciliation', description: 'Reconcile quantities, bills and project cost records.', icon: Calculator },
]

export const billingProcess = [
  { title: 'Project Award', icon: BadgeCheck },
  { title: 'Contract Review', icon: FileCheck2 },
  { title: 'BOQ Verification', icon: ClipboardCheck },
  { title: 'Site Measurement', icon: Ruler },
  { title: 'RA Bill Preparation', icon: ReceiptText },
  { title: 'Client Submission', icon: Send },
  { title: 'Query Resolution', icon: MessageCircleReply },
  { title: 'Payment Certification', icon: CircleDollarSign },
  { title: 'Final Bill & Commercial Closure', icon: FolderCheck },
]

export const billingBenefits = [
  { title: 'Increase Project Revenue', icon: TrendingUp },
  { title: 'Faster Bill Certification', icon: Clock3 },
  { title: 'Better Cash Flow', icon: HandCoins },
  { title: 'Stronger Variation Claims', icon: ChartNoAxesCombined },
  { title: 'Reduced Commercial Risk', icon: ShieldCheck },
]
