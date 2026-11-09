/**
 * Relocation checklists. Steps are general guidance — always confirm on the official sites linked.
 */
export interface Step {
  id: string;
  title: string;
  detail: string;
  link?: string;
}
export interface Phase {
  title: string;
  steps: Step[];
}

const MOROCCO_DOCS: Step[] = [
  { id: "ma-passport", title: "Passport valid 2+ years", detail: "Renew early if it expires within the visa period." },
  { id: "ma-diploma-apostille", title: "Apostille your diploma + transcripts", detail: "Morocco is part of the Apostille Convention: get the apostille on your Bac+5 diploma and transcripts (and your Bac if asked)." },
  { id: "ma-translations", title: "Sworn English translations", detail: "Translate diploma, transcripts and civil documents with a sworn translator (traducteur assermenté) into English." },
  { id: "ma-work-certs", title: "Work certificates (attestations de travail)", detail: "One per employer covering your 5 years, with dates and job title; translate to English." },
  { id: "ma-police", title: "Police record (casier judiciaire / fiche anthropométrique)", detail: "Some employers/visas ask for it; get a recent one and translate it." },
  { id: "ma-birth", title: "Full birth certificate (copie intégrale)", detail: "Useful for registrations and future family applications." },
  { id: "ma-english", title: "English test if needed", detail: "IELTS (UKVI version for the UK). Ireland's permit does not require one, but some employers like it." },
];

export const CHECKLISTS: Record<"IE" | "UK", { title: string; phases: Phase[] }> = {
  IE: {
    title: "🇮🇪 Ireland — Critical Skills Employment Permit",
    phases: [
      { title: "Documents from Morocco", steps: MOROCCO_DOCS.map((s) => ({ ...s, id: `ie-${s.id}` })) },
      {
        title: "Job & permit",
        steps: [
          { id: "ie-offer", title: "Job offer ≥ €40,904/yr, role on the Critical Skills list", detail: "2-year contract minimum. Software developers are on the list.", link: "https://enterprise.gov.ie/en/what-we-do/workplace-and-skills/employment-permits/" },
          { id: "ie-permit-apply", title: "Employment permit application (EPOS)", detail: "Usually filed by the employer or by you with their documents. Check current processing dates on the DETE site.", link: "https://enterprise.gov.ie/en/what-we-do/workplace-and-skills/employment-permits/current-application-processing-dates/" },
          { id: "ie-permit-granted", title: "Permit granted", detail: "Keep the original permit document safe." },
          { id: "ie-visa", title: "Apply for the Irish employment visa (D visa)", detail: "Moroccan citizens need an entry visa. Apply online via AVATS after the permit is granted.", link: "https://www.irishimmigration.ie/coming-to-work-in-ireland/" },
        ],
      },
      {
        title: "Moving",
        steps: [
          { id: "ie-housing-temp", title: "Book 2–4 weeks of temporary accommodation", detail: "Dublin rentals are very competitive — don't sign anything unseen or pay deposits to strangers (scams)." },
          { id: "ie-budget", title: "Budget for the first 2 months", detail: "Deposit (1 month) + first rent + living costs, before your first salary." },
          { id: "ie-flight", title: "Flight + travel insurance", detail: "" },
        ],
      },
      {
        title: "First weeks in Ireland",
        steps: [
          { id: "ie-irp", title: "Register immigration permission (IRP card, Stamp 1)", detail: "Book the registration appointment as soon as you arrive.", link: "https://www.irishimmigration.ie/registering-your-immigration-permission/" },
          { id: "ie-pps", title: "Get your PPS number", detail: "Needed for tax and payroll (MyWelfare.ie).", link: "https://www.mywelfare.ie/" },
          { id: "ie-bank", title: "Open a bank account", detail: "Revolut/N26 fast; AIB/Bank of Ireland need proof of address." },
          { id: "ie-revenue", title: "Register with Revenue (myAccount) + check tax credits", detail: "Avoid emergency tax on your first payslips.", link: "https://www.revenue.ie/" },
          { id: "ie-housing", title: "Find long-term housing", detail: "Daft.ie, Rent.ie, Facebook groups (beware scams).", link: "https://www.daft.ie/" },
          { id: "ie-gp", title: "Register with a GP + get health insurance quotes", detail: "" },
          { id: "ie-stamp4", title: "Diary: Stamp 4 after 2 years", detail: "Critical Skills holders can apply for Stamp 4 (work without a permit) after 2 years." },
        ],
      },
    ],
  },
  UK: {
    title: "🇬🇧 UK — Skilled Worker visa",
    phases: [
      { title: "Documents from Morocco", steps: MOROCCO_DOCS.map((s) => ({ ...s, id: `uk-${s.id}` })) },
      {
        title: "Job & visa",
        steps: [
          { id: "uk-sponsor", title: "Employer is on the register of licensed sponsors", detail: "Check the company name on the official register before applying.", link: "https://www.gov.uk/government/publications/register-of-licensed-sponsors-workers" },
          { id: "uk-offer", title: "Offer ≥ £54,700 (going rate for SOC 2134) or the higher applicable rate", detail: "Confirm the occupation code and rate with the employer.", link: "https://www.gov.uk/skilled-worker-visa" },
          { id: "uk-cos", title: "Receive your Certificate of Sponsorship (CoS) number", detail: "" },
          { id: "uk-english", title: "English test at B2 (IELTS for UKVI) if not exempt", detail: "Check the current English requirement on gov.uk." },
          { id: "uk-tb", title: "TB test (check if required for Morocco)", detail: "Check the list of countries needing a TB test for visas over 6 months.", link: "https://www.gov.uk/tb-test-visa" },
          { id: "uk-apply", title: "Apply online + pay visa fee and Immigration Health Surcharge", detail: "IHS is about £1,035 per year — ask if the employer reimburses." },
          { id: "uk-biometrics", title: "Biometrics appointment (VFS / TLScontact)", detail: "" },
          { id: "uk-evisa", title: "Create your UKVI account (eVisa)", detail: "The UK uses eVisas instead of physical BRP cards.", link: "https://www.gov.uk/evisa" },
        ],
      },
      {
        title: "Moving",
        steps: [
          { id: "uk-housing-temp", title: "Book temporary accommodation", detail: "SpareRoom / Airbnb for the first weeks." },
          { id: "uk-budget", title: "Budget for the first 2 months", detail: "Deposit (5 weeks max) + rent + living costs." },
          { id: "uk-flight", title: "Flight + travel insurance", detail: "" },
        ],
      },
      {
        title: "First weeks in the UK",
        steps: [
          { id: "uk-ni", title: "Apply for a National Insurance number", detail: "", link: "https://www.gov.uk/apply-national-insurance-number" },
          { id: "uk-bank", title: "Open a bank account", detail: "Monzo/Revolut fast; high-street banks need proof of address." },
          { id: "uk-housing", title: "Find long-term housing", detail: "Rightmove, Zoopla, SpareRoom.", link: "https://www.rightmove.co.uk/" },
          { id: "uk-gp", title: "Register with a GP (NHS)", detail: "", link: "https://www.nhs.uk/nhs-services/gps/how-to-register-with-a-gp-surgery/" },
          { id: "uk-council", title: "Council tax + utilities", detail: "" },
        ],
      },
    ],
  },
};
