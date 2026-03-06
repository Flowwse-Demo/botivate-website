import { formatDateTime } from "../../../utils/dateFormatters";

export const TABLE_COLUMNS = [
  { key: "taskNo", label: "Task No", index: 1 },
  { key: "givenDate", label: "Given Date", index: 2 },
  { key: "postedBy", label: "Posted By", index: 3 },
  { key: "typeOfWork", label: "Type Of Work", index: 4 },
  { key: "takenFrom", label: "Taken From", index: 5 },
  { key: "partyName", label: "Party Name", index: 6 },
  { key: "systemName", label: "System Name", index: 7 },
  { key: "descriptionOfWork", label: "Description Of Work", index: 8 },
  { key: "linkOfSystem", label: "Link Of System", index: 9 },
  { key: "attachmentFile", label: "Attachment File", index: 10 },
  { key: "priorityInCustomer", label: "Priority In Customer", index: 11 },
  { key: "notes", label: "Notes", index: 12 },
  { key: "expectedDateToClose", label: "Expected Date To Close", index: 13 },
];

export const transformSheetData = (rawData, masterMembers = []) => {
  if (!rawData || !Array.isArray(rawData)) {
    return { tasks: [], teamMembers1: [], teamMembers2: [] };
  }

  if (rawData.length === 0) {
    return { tasks: [], teamMembers1: [], teamMembers2: [] };
  }

  const tasks = rawData
    .map((row, index) => {
      if (!row) return null;

      const plannedDate = row.planned1 || row.planned2;
      const actualDate = row.actual1 || row.actual2;

      let status = "pending";
      if (plannedDate && actualDate) {
        status = "completed";
      } else if (plannedDate && !actualDate) {
        status = "assigned";
      }

      return {
        id: index + 1,
        rowNumber: index + 2,
        taskNo: row.task_no || "",
        givenDate: formatDateTime(row.given_date),
        postedBy: row.posted_by || "",
        typeOfWork: row.type_of_work || "",
        takenFrom: row.taken_from || "",
        partyName: row.party_name || "",
        systemName: row.system_name || "",
        descriptionOfWork: row.description_of_work || "",
        linkOfSystem: row.link_of_system || "",
        attachmentFile: row.attachment_file || "",
        priorityInCustomer: row.priority_in_customer || "Medium",
        notes: row.notes || "",
        expectedDateToClose: formatDateTime(row.expected_date_to_close),

        planned2: formatDateTime(row.planned2),
        actual2: formatDateTime(row.actual2),
        assignedMember1: row.employee_name_1 || "",
        assignedMember2: row.employee_name_2 || "",
        timeRequired: row.how_many_time_take || "",
        remarks: row.remarks || "",

        status: row.status || status,
        actual3: formatDateTime(row.actual3),
        priority: row.priority_in_customer || "Medium",
        isReassigned: false,
        originalAssignee: row.employee_name_1 || "",
      };
    })
    .filter((task) => task !== null && task.taskNo);

  const teamMembers1 = masterMembers;
  const teamMembers2 = masterMembers;

  const sortedTasks = tasks.sort((a, b) => {
    const aIsAssignedPending = a.planned2 && !a.actual2;
    const bIsAssignedPending = b.planned2 && !b.actual2;

    if (aIsAssignedPending && !bIsAssignedPending) return -1;
    if (!aIsAssignedPending && bIsAssignedPending) return 1;
    return b.id - a.id;
  });

  return { tasks: sortedTasks, teamMembers1, teamMembers2 };
};
