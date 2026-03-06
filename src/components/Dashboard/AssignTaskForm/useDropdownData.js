import { useState, useEffect } from "react";
import supabase from "../../../supabaseClient";

export const useDropdownData = (userRole, currentCompanyName) => {
  const [postedByOptions, setPostedByOptions] = useState([]);
  const [partyNames, setPartyNames] = useState([]);
  const [workTypes, setWorkTypes] = useState([]);
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(true);

  const [systemNames, setSystemNames] = useState([]);
  const [isLoadingSystemNames, setIsLoadingSystemNames] = useState(false);

  const fetchDropdownData = async () => {
    try {
      setIsLoadingDropdowns(true);
      const { data, error } = await supabase
        .from("dropdown")
        .select("party_name, type_of_work, posted_by");

      if (error) throw error;

      if (data && Array.isArray(data)) {
        const partyNameSet = new Set();
        const workTypeSet = new Set();
        const postedBySet = new Set();

        data.forEach((row) => {
          if (row.party_name && String(row.party_name).trim() !== "") {
            partyNameSet.add(String(row.party_name).trim());
          }
          if (row.type_of_work && String(row.type_of_work).trim() !== "") {
            workTypeSet.add(String(row.type_of_work).trim());
          }
          if (row.posted_by && String(row.posted_by).trim() !== "") {
            postedBySet.add(String(row.posted_by).trim());
          }
        });

        setPartyNames(Array.from(partyNameSet).sort());
        setWorkTypes(Array.from(workTypeSet).sort());
        setPostedByOptions(Array.from(postedBySet).sort());
      }
    } catch (error) {
      console.error("❌ Error fetching dropdown data:", error.message);
      setPartyNames(["Acemark Stationers", "AT Jewellers", "Azure Interiors"]);
      setWorkTypes([
        "Existing System Edit & Update",
        "New System",
        "Error Received",
        "Complain Report",
      ]);
      setPostedByOptions([
        "Satyendra",
        "Chetan",
        "Digendra",
        "Pratap",
        "Vikas",
        "Tuleshwar",
      ]);
    } finally {
      setIsLoadingDropdowns(false);
    }
  };

  useEffect(() => {
    fetchDropdownData();
  }, []);

  useEffect(() => {
    if (userRole === "company" && currentCompanyName && currentCompanyName !== "") {
      fetchDropdownData();
    }
  }, [currentCompanyName, userRole]);

  const fetchSystemNames = async (typeOfWork, currentPartyName) => {
    if (!typeOfWork) {
      setSystemNames([]);
      return;
    }

    setIsLoadingSystemNames(true);

    try {
      const { data, error } = await supabase
        .from("system_list")
        .select("party_name, system_name, type_of_system, status_of_system");

      if (error) throw error;

      const systemNamesSet = new Set();

      data.forEach((row) => {
        const rowTypeOfWork = row.type_of_system ? String(row.type_of_system).trim() : "";
        const columnEStatus = row.status_of_system ? String(row.status_of_system).trim() : "";
        const rowPartyName = row.party_name ? String(row.party_name).trim() : "";

        if (rowTypeOfWork === typeOfWork) {
          let shouldInclude = true;

          if (typeOfWork === "New System") {
            shouldInclude = !columnEStatus || columnEStatus === "";
          }

          if (shouldInclude) {
            if (userRole === "admin" || userRole === "user") {
              if (currentPartyName && rowPartyName === currentPartyName) {
                const systemName = row.system_name ? String(row.system_name).trim() : "";
                if (systemName !== "") systemNamesSet.add(systemName);
              }
            } else {
              if (currentCompanyName && rowPartyName === currentCompanyName) {
                const systemName = row.system_name ? String(row.system_name).trim() : "";
                if (systemName !== "") systemNamesSet.add(systemName);
              }
            }
          }
        }
      });

      setSystemNames(Array.from(systemNamesSet).sort());
    } catch (error) {
      console.error("❌ Error fetching system names from Supabase:", error.message);
      setSystemNames([]);
    } finally {
      setIsLoadingSystemNames(false);
    }
  };

  return {
    postedByOptions,
    partyNames,
    workTypes,
    isLoadingDropdowns,
    systemNames,
    setSystemNames,
    isLoadingSystemNames,
    fetchSystemNames
  };
};
