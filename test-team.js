import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fekrswxjqpqnhuvkezxv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZla3Jzd3hqcXBxbmh1dmtlenh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNTM1NTgsImV4cCI6MjA2NTYyOTU1OH0.T9kUSNi4tloP3zxR9y9w3gdQBm1uNoR1WaexnivgnFI';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const fetchAllTeamNames = async () => new Map();

export const processTeamDataFromSupabase = async (_supabaseData, userRole = "admin") => {
    if (userRole !== "admin") return [];

    let leanData = [];
    let from = 0;
    const limit = 5000;
    let keepFetching = true;

    while (keepFetching) {
        const { data: pageData, error } = await supabase
            .from("FMS")
            .select("id, team_member_name, employee_name_1, employee_name_2, planned3, actual3, given_date, how_many_time_take, how_many_time_take_2, planned2, actual2, actual1")
            .range(from, from + limit - 1);

        if (pageData && pageData.length > 0) {
            leanData = [...leanData, ...pageData];
            from += limit;
        }

        if (!pageData || pageData.length < limit) {
            keepFetching = false;
        }
    }

    const teamNameLookup = await fetchAllTeamNames();
    const teamMap = new Map();

    const sortedData = [...leanData].sort((a, b) => (b.id || 0) - (a.id || 0));

    for (const item of sortedData) {
        const teamMember = item.team_member_name?.trim().toLowerCase();
        const emp1 = item.employee_name_1?.trim().toLowerCase();
        const emp2 = item.employee_name_2?.trim().toLowerCase();

        const membersToCredit = new Set();
        if (teamMember && !teamMember.includes("team") && teamMember !== "none" && teamMember !== "-") membersToCredit.add(teamMember);
        if (emp1 && !emp1.includes("team") && emp1 !== "none" && emp1 !== "-") membersToCredit.add(emp1);
        if (emp2 && !emp2.includes("team") && emp2 !== "none" && emp2 !== "-") membersToCredit.add(emp2);

        if (membersToCredit.size === 0) continue;

        for (const memberName of membersToCredit) {
            if (!teamMap.has(memberName)) {
                teamMap.set(memberName, { name: memberName, totalTasks: 0, latestAssignDate: 0 });
            }
            teamMap.get(memberName).totalTasks++;
        }
    }
    return Array.from(teamMap.values());
};

async function test() {
    const users = await processTeamDataFromSupabase();
    const priyanshuRai = users.find(u => u.name === 'priyanshu rai');
    console.log("Priyanshu Rai in parsed data?", priyanshuRai);
}

test();
