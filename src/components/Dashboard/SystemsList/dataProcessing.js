import { isProcessingCacheValid, dataCache, normalizeString } from "./cache"

export const processSystemsData = (systemData, userRole, companyName) => {
  const cacheKey = `${userRole}_${companyName}_${systemData?.data?.length || 0}`

  if (isProcessingCacheValid(cacheKey)) {
    
    return dataCache.processingCache.get(cacheKey).data
  }

  
  const startTime = performance.now()

  if (!systemData?.data) {
    throw new Error("Invalid data format received")
  }

  let resultSystems = []

  if (userRole === "admin") {
    // Deduplicate based on system_name + party_name
    const uniqueSystems = systemData.data.filter((row, index, self) =>
      index === self.findIndex(r =>
        (r.system_name?.trim().toLowerCase() || "na") === (row.system_name?.trim().toLowerCase() || "na") &&
        (r.party_name?.trim().toLowerCase() || "na") === (row.party_name?.trim().toLowerCase() || "na")
      )
    )

    resultSystems = uniqueSystems.map((row, index) => {
      const systemName = row.system_name?.trim() || "N/A"
      const systemPartyName = row.party_name?.trim() || "N/A"

      // Match all systemData rows with same system + party
      const matchingSystemRecords = systemData.data.filter(sysRow =>
        sysRow.system_name?.toLowerCase().trim() === systemName.toLowerCase() &&
        sysRow.party_name?.toLowerCase().trim() === systemPartyName.toLowerCase()
      )

      // Count "existing system edit & update"
      const existingSystemEditCount = matchingSystemRecords.filter(sys =>
        (sys.type_of_work || "").toLowerCase().includes("existing system edit & update")
      ).length

      // ✅ Convert raw data to the expected format for the modal
      const formattedSystemData = matchingSystemRecords.map(sysRow => ({
        // Map raw Supabase fields to the expected modal fields
        party_name: sysRow.party_name || "N/A",
        system_name: sysRow.system_name || "N/A",
        type_of_work: sysRow.type_of_work || "N/A",
        description_of_work: sysRow.description_of_work || "N/A",
        actual1: sysRow.actual1 || "N/A",
        expected_date_to_close: sysRow.expected_date_to_close || "N/A",
        taken_from: sysRow.taken_from || "N/A",
        priority_in_customer: sysRow.priority_in_customer || "N/A",
        team_member_name: sysRow.team_member_name || "N/A",
        status: sysRow.status || "N/A",
        remarks: sysRow.remarks || "N/A",
        flowchart: sysRow.flowchart || "N/A"
      }))

      return {
        id: row.id,
        sno: index + 1,
        system_name: systemName,
        party_name: row.party_name || "N/A",
        description_of_work: row.description_of_work || "N/A",
        type_of_work: row.type_of_work || "N/A",
        status: row.status || "",
        total_updation: row.total_updation || "N/A",
        flowchart: row.flowchart || "N/A",
        version: row.total_updation || "v1.0.0",
        lastUpdate: new Date().toISOString().split("T")[0],
        url: row.website_link || `https://${systemName.toLowerCase().replace(/\s+/g, "")}.com`,
        description: `${row.type_of_work || "System"} for ${row.description_of_work || "department"} department`,
        technology: "Web Application",
        developer: "System Admin",
        systemData: formattedSystemData,
        existingSystemEditCount, // Store the count here
      }
    })
  } else {
    // Company view - filter only company systems
    

    const companyKey = normalizeString(companyName)

    resultSystems = systemData.data
      .filter(systemRow => normalizeString(systemRow.party_name) === companyKey)
      .map((row, index) => {
        const systemName = row.system_name?.trim() || "N/A"
        const partyName = row.party_name?.trim() || "N/A"

        const matchingSystemRecords = systemData.data.filter(sysRow =>
          sysRow.system_name?.toLowerCase().trim() === systemName.toLowerCase() &&
          sysRow.party_name?.toLowerCase().trim() === partyName.toLowerCase()
        )

        const existingSystemEditCount = matchingSystemRecords.filter(sys =>
          (sys.type_of_work || "").toLowerCase().includes("existing system edit & update")
        ).length

        // ✅ Convert raw data to the expected format for the modal
        const formattedSystemData = matchingSystemRecords.map(sysRow => ({
          // Map raw Supabase fields to the expected modal fields
          party_name: sysRow.party_name || "N/A",
          system_name: sysRow.system_name || "N/A",
          type_of_work: sysRow.type_of_work || "N/A",
          description_of_work: sysRow.description_of_work || "N/A",
          actual1: sysRow.actual1 || "N/A",
          expected_date_to_close: sysRow.expected_date_to_close || "N/A",
          taken_from: sysRow.taken_from || "N/A",
          priority_in_customer: sysRow.priority_in_customer || "N/A",
          team_member_name: sysRow.team_member_name || "N/A",
          status: sysRow.status || "N/A",
          remarks: sysRow.remarks || "N/A",
          flowchart: sysRow.flowchart || "N/A"
        }))

        return {
          id: row.id,
          sno: index + 1,
          system_name: systemName,
          party_name: row.party_name || "N/A",
          description_of_work: row.description_of_work || "N/A",
          type_of_work: row.type_of_work || "N/A",
          status: row.status || "",
          total_updation: row.total_updation || "N/A",
          flowchart: row.flowchart || "N/A",
          version: row.total_updation || "v1.0.0",
          lastUpdate: new Date().toISOString().split("T")[0],
          url: row.website_link || `https://${systemName.toLowerCase().replace(/\s+/g, "")}.com`,
          description: `${row.type_of_work || "System"} for ${row.description_of_work || "department"} department`,
          technology: "Web Application",
          developer: "System Admin",
          systemData: formattedSystemData, // Ensure this is always set
          existingSystemEditCount,
        }
      })
  }

  // ✅ Cache processed result
  dataCache.processingCache.set(cacheKey, {
    data: resultSystems,
    timestamp: Date.now(),
  })

  if (dataCache.processingCache.size > 5) {
    const oldestKey = dataCache.processingCache.keys().next().value
    dataCache.processingCache.delete(oldestKey)
  }

  
  return resultSystems
}
