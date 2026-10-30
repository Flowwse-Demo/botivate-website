export const WORKFLOW_STAGES = [
  {
    stage: 1,
    id: "before",
    title: "Before Meeting",
    subtitle: "Preparation & Research",
    accent: "blue",
    badgeColor: "bg-blue-100 text-blue-700 border-blue-200",
    gradient: "from-blue-500 to-blue-600",
    iconBg: "bg-blue-50 text-blue-600",
    instructions: [
      "Understand the client's business background.",
      "Review previous meeting discussions.",
      "Prepare the agenda and key discussion points.",
      "Keep demonstrations, reports, and documents ready.",
      "Test the microphone, internet, and screen sharing.",
      "Confirm meeting time and attendees.",
    ],
  },
  {
    stage: 2,
    id: "during",
    title: "During Meeting",
    subtitle: "Execution & Active Listening",
    accent: "purple",
    badgeColor: "bg-purple-100 text-purple-700 border-purple-200",
    gradient: "from-purple-500 to-indigo-600",
    iconBg: "bg-purple-50 text-purple-600",
    instructions: [
      "Greet the client professionally.",
      "Introduce the meeting objectives and agenda.",
      "Understand client requirements and business challenges.",
      "Ask clarifying questions.",
      "Explain proposed solutions clearly.",
      "Record discussions, decisions, and action items.",
      "Confirm responsibilities and next steps.",
    ],
  },
  {
    stage: 3,
    id: "after",
    title: "After Meeting",
    subtitle: "Documentation & Follow-Up",
    accent: "green",
    badgeColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
    gradient: "from-emerald-500 to-teal-600",
    iconBg: "bg-emerald-50 text-emerald-600",
    instructions: [
      "Prepare and share the Minutes of Meeting.",
      "Document requirements and decisions.",
      "Assign tasks and responsible owners.",
      "Record deadlines and update project status.",
      "Follow up on unresolved issues.",
      "Schedule the next meeting when necessary.",
    ],
  },
];

export const CHECKLIST_ITEMS = {
  before: [
    { id: "b1", text: "Review the client profile and business background." },
    { id: "b2", text: "Read previous meeting notes and open action items." },
    { id: "b3", text: "Prepare the meeting agenda and key discussion points." },
    { id: "b4", text: "Keep relevant reports, presentations, and demo links ready." },
    { id: "b5", text: "Test the microphone, internet, and screen sharing." },
    { id: "b6", text: "Join the meeting on time and maintain a professional appearance." },
  ],
  during: [
    { id: "d1", text: "Greet participants and introduce yourself professionally." },
    { id: "d2", text: "Explain the meeting objective and agenda." },
    { id: "d3", text: "Ask questions to understand client requirements." },
    { id: "d4", text: "Listen carefully and clarify ambiguous requirements." },
    { id: "d5", text: "Record important discussions and decisions." },
    { id: "d6", text: "Confirm action items, owners, and deadlines." },
  ],
  after: [
    { id: "a1", text: "Prepare the Minutes of Meeting." },
    { id: "a2", text: "Record confirmed requirements and decisions." },
    { id: "a3", text: "Assign action items to the appropriate owners." },
    { id: "a4", text: "Document deadlines and unresolved questions." },
    { id: "a5", text: "Share the meeting summary with the client when appropriate." },
    { id: "a6", text: "Update project records and schedule follow-ups." },
  ],
};

export const SCRIPT_CATEGORIES = [
  {
    id: "opening",
    number: "01",
    title: "Opening the Meeting",
    purpose: "Set a welcoming, structured tone and align on agenda",
    script:
      "Good morning/afternoon, everyone. Thank you for joining today's meeting. The purpose of this discussion is to understand your requirements, review the current status, and agree on the next steps. We will go through the agenda first, and then I would be happy to address your questions.",
  },
  {
    id: "requirements",
    number: "02",
    title: "Understanding Requirements",
    purpose: "Ask open questions and discover pain points",
    script:
      "Could you walk me through your current process and explain the main challenges you are facing? I would like to understand the expected outcome so that we can recommend a suitable solution.",
  },
  {
    id: "solutions",
    number: "03",
    title: "Explaining Solutions",
    purpose: "Present approaches clearly without confusing technical jargon",
    script:
      "Based on our discussion, we propose the following approach. Let me explain how it addresses the requirements, what the implementation involves, and which points we need to confirm before proceeding.",
  },
  {
    id: "issues",
    number: "04",
    title: "Handling Issues",
    purpose: "De-escalate friction and show professional accountability",
    script:
      "Thank you for bringing this to our attention. Let me confirm that I have understood the issue correctly. We will document it, identify the next action, and confirm the responsible person and expected follow-up.",
  },
  {
    id: "closing",
    number: "05",
    title: "Closing the Meeting",
    purpose: "Reiterate commitments, owners, and clear follow-up timelines",
    script:
      "To summarize, we have agreed on the following action items and deadlines. We will share the meeting notes after this discussion and follow up on the outstanding points. Is there anything else you would like us to address before we close?",
  },
];

export const MOM_TEMPLATE_TEXT = `Client / Company    : [Client Name]
Date & Time         : [DD MMM YYYY, HH:MM – HH:MM]
Attendees           : [Name 1, Name 2, ...]
Meeting Objective   : [Brief objective of the meeting]
Discussion Summary  : [Key points discussed]
Decisions           : [Final decisions taken]
Action Items        : [Task, Owner, Due Date]
Next Meeting        : [Date & Purpose]`;

export const COMMUNICATION_PRINCIPLES = [
  {
    id: "listen",
    title: "Listen First",
    description:
      "Understand the client's needs completely before making suggestions. Avoid interrupting and ask clarifying questions.",
    color: "blue",
    iconName: "Ear",
  },
  {
    id: "simple",
    title: "Keep It Simple",
    description:
      "Use clear, concise, professional language. Avoid unnecessary technical jargon and explain complex concepts in accessible terms.",
    color: "purple",
    iconName: "Sparkles",
  },
  {
    id: "commit",
    title: "Confirm Commitments",
    description:
      "Confirm decisions, action items, responsible owners, deadlines, and expected outcomes before ending the meeting.",
    color: "emerald",
    iconName: "CheckCheck",
  },
  {
    id: "follow",
    title: "Follow Through",
    description:
      "Share meeting notes when appropriate and ensure all agreed actions are tracked to completion.",
    color: "amber",
    iconName: "Send",
  },
];

