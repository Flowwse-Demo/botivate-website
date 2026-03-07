import { useState, useEffect } from "react";
import { formatDate } from "../../../utils/dateFormatters";
import ExpandableText from "../shared/ExpandableText";

// Company Table Component for Supabase
export default function CompanyTableSection({ companyData, supabaseData, filters }) {
  const [filteredData, setFilteredData] = useState([]);

  useEffect(() => {
    if (supabaseData && companyData) {
      // First filter by company
      let data = supabaseData.filter(
        (item) =>
          item.party_name &&
          item.party_name?.toLowerCase() ===
          companyData?.companyName?.toLowerCase()
      );

      // Then apply additional filters
      if (filters.typeOfWork) {
        data = data.filter((item) => item.type_of_work === filters.typeOfWork);
      }

      if (filters.status) {
        data = data.filter((item) => {
          const itemStatus = item.actual3 ? "Completed" : "In Progress";
          return itemStatus === filters.status;
        });
      }

      if (filters.priority) {
        data = data.filter(
          (item) => item.priority_in_customer === filters.priority
        );
      }

      setFilteredData(data);
    }
  }, [supabaseData, companyData, filters]);



  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded-2xl">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 md:text-xl">
              Tasks Overview
            </h2>
            <p className="text-sm text-gray-600 md:text-base">
              Track your company's tasks and progress
            </p>
          </div>
          <div className="text-sm text-gray-500">
            {filteredData.length} tasks found
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden overflow-auto border border-gray-200 rounded-lg lg:block max-h-96">
        <table className="w-full">
          <thead className="sticky top-0 z-10 bg-blue-500">
            <tr>
              <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-white uppercase">
                Status
              </th>
              <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-white uppercase">
                Type of Work
              </th>
              <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-white uppercase">
                System Name
              </th>
              <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-white uppercase">
                Description of Work
              </th>
              <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-white uppercase">
                Expected Date to Close
              </th>
              <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-white uppercase">
                Priority
              </th>
              <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-white uppercase">
                Assigned To
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredData.length > 0 ? (
              filteredData.map((item) => {
                const status = item.actual3 ? "Completed" : "In Progress";

                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${status === "Completed"
                          ? "bg-green-100 text-green-800"
                          : "bg-blue-100 text-blue-800"
                          }`}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {item.type_of_work || "N/A"}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {item.system_name || "N/A"}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="max-w-xs text-sm text-gray-900">
                        <ExpandableText text={item.description_of_work || "N/A"} />
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(item.expected_date_to_close)}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${item.priority_in_customer === "High"
                          ? "bg-red-100 text-red-800"
                          : item.priority_in_customer === "Medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                          }`}
                      >
                        {item.priority_in_customer || "Normal"}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {item.employee_name_1 || "N/A"}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                  No tasks found matching the selected filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="p-4 space-y-4 overflow-y-auto lg:hidden max-h-96">
        {filteredData.length > 0 ? (
          filteredData.map((item) => {
            const status = item.actual3 ? "Completed" : "In Progress";

            return (
              <div
                key={item.id}
                className="p-4 border border-gray-200 rounded-lg shadow-sm bg-gray-50"
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${status === "Completed"
                      ? "bg-green-100 text-green-800"
                      : "bg-blue-100 text-blue-800"
                      }`}
                  >
                    {status}
                  </span>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${item.priority_in_customer === "High"
                      ? "bg-red-100 text-red-800"
                      : item.priority_in_customer === "Medium"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                      }`}
                  >
                    {item.priority_in_customer || "Normal"}
                  </span>
                </div>

                <div className="space-y-2">
                  <div>
                    <span className="text-xs font-medium text-gray-600">
                      Type:
                    </span>
                    <div className="text-sm font-medium text-gray-900">
                      {item.type_of_work || "N/A"}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-medium text-gray-600">
                      System:
                    </span>
                    <div className="text-sm text-gray-900">
                      {item.system_name || "N/A"}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-medium text-gray-600">
                      Description:
                    </span>
                    <div className="text-sm text-gray-900">
                      <ExpandableText text={item.description_of_work || "N/A"} />
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-medium text-gray-600">
                      Due Date:
                    </span>
                    <div className="text-sm text-gray-900">
                      {formatDate(item.expected_date_to_close)}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-medium text-gray-600">
                      Assigned To:
                    </span>
                    <div className="text-sm text-gray-900">
                      {item.employee_name_1 || "N/A"}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-8 text-center">
            <div className="text-gray-500">
              No tasks found matching the selected filters
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
