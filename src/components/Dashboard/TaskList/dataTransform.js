import { formatDateTime } from "../../../utils/dateFormatters";

export const TABLE_COLUMNS = [
    { key: "taskNo", label: "Task No" },
    { key: "givenDate", label: "Given Date" },
    { key: "postedBy", label: "Posted By" },
    { key: "typeOfWork", label: "Type Of Work" },
    { key: "takenFrom", label: "Taken From" },
    { key: "partyName", label: "Party Name" },
    { key: "systemName", label: "System Name" },
    { key: "descriptionOfWork", label: "Description Of Work" },
    { key: "linkOfSystem", label: "Link Of System" },
    { key: "attachmentFile", label: "Attachment File" },
    { key: "priorityInCustomer", label: "Priority In Customer" },
    { key: "notes", label: "Notes" },
    { key: "expectedDateToClose", label: "Expected Date To Close" },
];

export const transformSupabaseData = (rawData) => {
    if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
        return { tasks: [], teamMembers1: [], teamMembers2: [] };
    }

    const membersX = new Set();
    const membersY = new Set();

    const tasks = rawData
        .map((row, index) => {
            if (!row) return null;

            const plannedDate = row.planned2 || row.planned1;
            const actualDate = row.actual2 || row.actual1;

            let status = "pending";
            if (plannedDate && actualDate) {
                status = "completed";
            } else if (plannedDate && !actualDate) {
                status = "assigned";
            }

            const task = {
                id: row.id,
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
                planned1: formatDateTime(row.planned1),
                actual1: formatDateTime(row.actual1),
                delay1: row.delay1 || "",
                teamMemberName: row.team_member_name || "",
                howManyTimeTabs: row.how_many_time_take || "",
                remarks: row.remarks || "",
                planned2: formatDateTime(row.planned2),
                actual2: formatDateTime(row.actual2),
                delay2: row.delay2 || "",
                assignedMember1: row.employee_name_1 || "",
                assignedMember2: row.employee_name_2 || "",
                timeRequired: row.how_many_time_take_2 || "",
                remarks2: row.remarks_2 || "",
                planned3: formatDateTime(row.planned3),
                actual3: formatDateTime(row.actual3),
                delay3: row.delay3 || "",
                status: row.status || status,
                systemList: row.system_list || "",
                uiStatus: status,
                priority: row.priority_in_customer || "Medium",
                isReassigned: false,
                originalAssignee: row.employee_name_1 || "",
            };

            if (task.assignedMember1) membersX.add(task.assignedMember1);
            if (task.assignedMember2) membersY.add(task.assignedMember2);

            return task;
        })
        .filter((task) => task !== null && task.taskNo);

    const teamMembers1 = Array.from(membersX).filter(Boolean);
    const teamMembers2 = Array.from(membersY).filter(Boolean);

    const sortedTasks = tasks.sort((a, b) => {
        const aIsAssignedPending = a.planned2 && !a.actual2;
        const bIsAssignedPending = b.planned2 && !b.actual2;
        if (aIsAssignedPending && !bIsAssignedPending) return -1;
        if (!aIsAssignedPending && bIsAssignedPending) return 1;
        return b.id - a.id;
    });

    return { tasks: sortedTasks, teamMembers1, teamMembers2 };
};

export const fetchMasterSheetLinkData = async (supabase) => {
    try {
        const { data, error } = await supabase.from("master").select("*");
        if (error) throw error;
        if (data && data.length > 0) {
            return data;
        } else {
            console.warn("No Master Sheet Link data found");
            return null;
        }
    } catch (error) {
        console.error("Error fetching Master Sheet Link data from Supabase:", error);
        return null;
    }
};

export const getCompanyPartyNames = (companyName, masterSheetData) => {
    if (!companyName || !masterSheetData || !Array.isArray(masterSheetData)) {
        return [];
    }

    const matchingParties = [];

    for (let i = 1; i < masterSheetData.length; i++) {
        const row = masterSheetData[i];
        if (!row || !Array.isArray(row)) continue;

        const companyNameInSheet = row[2] ? row[2].toString().trim() : "";

        if (companyNameInSheet.toLowerCase() === companyName.toLowerCase()) {
            const possiblePartyColumns = [2, 6, 7, 8];
            for (const colIndex of possiblePartyColumns) {
                if (row[colIndex]) {
                    const partyName = row[colIndex].toString().trim();
                    if (partyName && !matchingParties.includes(partyName)) {
                        matchingParties.push(partyName);
                    }
                }
            }

            if (matchingParties.length === 0) {
                matchingParties.push(companyNameInSheet);
            }
        }
    }

    return matchingParties;
};
