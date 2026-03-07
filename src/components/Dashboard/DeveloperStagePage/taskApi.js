import supabase from "../../../supabaseClient";
import { API_CONFIG } from "../../../config/api";
import { transformSheetData } from "./dataTransform";
import { formatDateTime } from "../../../utils/dateFormatters";

export const fetchMasterSheetMembers = async () => {
  try {
    const { data, error } = await supabase
      .from("dropdown")
      .select("member_name");

    if (error) {
      throw error;
    }

    if (Array.isArray(data)) {
      const members = data
        .map((row) => row.member_name)
        .filter((member) => member && member.trim() !== "");

      const uniqueMembers = [...new Set(members)];
      return uniqueMembers;
    }
    return [];
  } catch (err) {
    console.error("Error fetching members from Supabase:", err);
    return [];
  }
};

const PAGE_SIZE = 50;

export const fetchTasksFromAPI = async (type = "pending", pageNumber = 0) => {
  try {
    const from = pageNumber * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase.from("FMS").select("*");

    // Apply type-specific filters at the DB level
    if (type === "pending") {
      query = query.is("actual2", null);
    } else {
      query = query.not("actual2", "is", null);
    }

    const { data: tasksData, error: tasksError } = await query
      .order("id", { ascending: false })
      .range(from, to);

    if (tasksError) throw tasksError;

    const masterMembers = await fetchMasterSheetMembers();

    if (!Array.isArray(tasksData)) {
      throw new Error("Invalid tasks data from Supabase");
    }

    const { tasks, teamMembers1, teamMembers2 } = transformSheetData(
      tasksData,
      masterMembers
    );

    const hasMore = tasksData.length === PAGE_SIZE;

    return {
      tasks,
      teamMembers1,
      teamMembers2,
      hasMore,
    };
  } catch (err) {
    console.error("Error fetching tasks:", err);
    throw err;
  }
};

// Helper to fetch initial data for both tabs simultaneously
export const fetchInitialData = async () => {
  const [pendingResult, historyResult] = await Promise.all([
    fetchTasksFromAPI("pending", 0),
    fetchTasksFromAPI("history", 0),
  ]);

  // Get unique postedBy from both sets
  const allTasks = [...pendingResult.tasks, ...historyResult.tasks];
  const uniquePostedBy = [
    ...new Set(allTasks.map((item) => item.postedBy).filter(Boolean)),
  ];

  return {
    pendingTasks: pendingResult.tasks,
    historyTasks: historyResult.tasks,
    pendingHasMore: pendingResult.hasMore,
    historyHasMore: historyResult.hasMore,
    teamMembers1: pendingResult.teamMembers1,
    teamMembers2: pendingResult.teamMembers2,
    uniquePostedBy,
  };
};

export const submitAssignments = async (selectedTasks, allTasks, assignmentForm) => {
  let successCount = 0;
  let errorCount = 0;

  for (const taskId of selectedTasks) {
    const task = allTasks.find((t) => t.id === taskId);
    const formData = assignmentForm[taskId];

    const selectedDateTime = formData.dateTime || "";
    const submissionDate = new Date().toISOString().split("T")[0];

    try {
      const { error } = await supabase
        .from("FMS")
        .update({
          employee_name_1: formData.assignedMember1 || "",
          employee_name_2: formData.assignedMember2 || "",
          how_many_time_take_2: selectedDateTime,
          remarks_2: formData.remarks || "",
          actual2: submissionDate,
          posted_by: task.postedBy || null,
        })
        .eq("id", task.id);

      if (error) {
        console.error(`Error updating task ${task.taskNo}:`, error.message);
        errorCount++;
      } else {
        successCount++;
      }
    } catch (taskError) {
      console.error(`Exception updating task ${task.taskNo}:`, taskError);
      errorCount++;
    }
  }

  return { successCount, errorCount };
};

export const handleTaskCompletionAPI = async (taskId, allTasks) => {
  const task = allTasks.find((t) => t.id === taskId);
  if (!task) throw new Error("Task not found");

  const currentDateTime = formatDateTime(new Date());

  const formData = new FormData();
  formData.append("sheetName", "FMS");
  formData.append("action", "update_task_completion");
  formData.append("taskNo", task.taskNo);
  formData.append("actual2", currentDateTime);

  const response = await fetch(API_CONFIG.UPDATE_URL, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) throw new Error("Failed to update task");

  return currentDateTime;
};
