import supabase from "../../../supabaseClient";
import { transformSupabaseData } from "./dataTransform";

export const PAGE_SIZE = 50;

/**
 * Fetch tasks from Supabase with pagination and type filtering.
 * @param {"pending"|"completed"} type - "pending" (actual3 IS NULL) or "completed" (actual3 IS NOT NULL)
 * @param {number} page - page number (0-indexed)
 * @returns {Promise<Array>} raw Supabase rows
 */
export const fetchTasksByType = async (type, page) => {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase.from("FMS").select("*");

    if (type === "pending") {
        query = query.is("actual3", null);
    } else {
        query = query.not("actual3", "is", null);
    }

    const { data, error } = await query
        .order("id", { ascending: false })
        .range(from, to);

    if (error) throw error;
    return data || [];
};

/**
 * Submit (complete) selected tasks via Supabase.
 * @param {Set} selectedTaskIds - Set of task IDs to complete
 * @param {Array} filteredTasks - current filtered task list
 * @param {string} currentUser - username of submitting user
 * @param {Function} canUserSubmitTask - permission check function
 * @returns {Promise<{results: Array, currentDate: string}>}
 */
export const submitTasks = async (selectedTaskIds, filteredTasks, currentUser, canUserSubmitTask) => {
    const currentDate = new Date().toISOString();
    const results = [];

    for (const taskId of selectedTaskIds) {
        const task = filteredTasks.find((t) => t.id === taskId);
        if (!task) continue;

        if (!canUserSubmitTask(task)) {
            results.push({
                taskNo: task.taskNo,
                success: false,
                error: "You are not authorized to submit this task",
            });
            continue;
        }

        try {
            const updateData = {
                status: `Completed `,
                actual3: currentDate,
            };

            const { error } = await supabase
                .from("FMS")
                .update(updateData)
                .eq("task_no", task.taskNo);

            if (error) {
                throw new Error(error.message || "Supabase update failed");
            }

            results.push({
                taskNo: task.taskNo,
                success: true,
                message: "Completed",
            });
        } catch (error) {
            results.push({
                taskNo: task.taskNo,
                success: false,
                error: error.message,
            });
        }
    }

    return { results, currentDate };
};

/**
 * Forward a task to another team member via Google Sheets API.
 * @param {object} task - the task to forward
 * @param {string} newStatus - new forward status ("forward1" or "forward2")
 * @param {string} GOOGLE_SHEETS_URL - Google Sheets API endpoint
 * @returns {Promise<object>} API result
 */
export const forwardTask = async (task, newStatus, GOOGLE_SHEETS_URL) => {
    const formData = new URLSearchParams();
    formData.append("action", "Complete_task_assignment");
    formData.append("sheetName", "FMS");
    formData.append("taskNo", task.taskNo);
    formData.append("rowNumber", task.rowNumber);
    formData.append("status1", newStatus);

    const response = await fetch(GOOGLE_SHEETS_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
        throw new Error(result.message || "Failed to forward task");
    }

    return result;
};

/**
 * Directly complete a task via Google Sheets API.
 * @param {object} task - the task to complete
 * @param {string} submittingUser - username
 * @param {string} GOOGLE_SHEETS_URL - Google Sheets API endpoint
 * @returns {Promise<object>} API result
 */
export const completeTaskDirectly = async (task, submittingUser, GOOGLE_SHEETS_URL) => {
    const currentDate = new Date().toISOString().split("T")[0];

    const formData = new URLSearchParams();
    formData.append("action", "Complete_task_assignment");
    formData.append("sheetName", "FMS");
    formData.append("taskNo", task.taskNo);
    formData.append("rowNumber", task.rowNumber);
    formData.append("status1", `completed by ${submittingUser}`);
    formData.append("submissionDate2", currentDate);
    formData.append("completedBy", submittingUser);

    const response = await fetch(GOOGLE_SHEETS_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
    });

    return await response.json();
};
