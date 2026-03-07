import { Building2, Download as DownloadIcon, AlertCircle, User, Users, PieChart } from "lucide-react"
import { getDeadlineStatus } from "./exportHelpers"
import ExpandableText from "../shared/ExpandableText"

export default function ReportTable({ stats, reportsData, exportToCSV }) {
  return (
    <>
      {/* Company Distribution Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
            <div className="flex items-center gap-2 mb-2 sm:mb-0">
              <Building2 className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Task Distribution by Company</h2>
            </div>
            <button
              onClick={() => exportToCSV('company-summary')}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
            >
              <DownloadIcon className="w-3 h-3" />
              Export
            </button>
          </div>
          <p className="text-gray-600 text-sm mt-1">
            Shows how tasks are distributed between companies and persons
          </p>
        </div>

        {Object.keys(stats.companyPersonDistribution).length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No data available</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Tasks</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Persons</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task Distribution (Person: Count)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {Object.entries(stats.companyPersonDistribution)
                  .sort(([, a], [, b]) => Object.values(b).reduce((sum, val) => sum + val, 0) - Object.values(a).reduce((sum, val) => sum + val, 0))
                  .map(([company, persons]) => {
                    const totalTasks = stats.byCompany[company] || 0
                    const todayTasks = reportsData.filter(task => task.party_name === company && getDeadlineStatus(task.planned3) === 'today').length
                    const upcomingTasks = reportsData.filter(task => task.party_name === company && getDeadlineStatus(task.planned3) === 'upcoming').length
                    const overdueTasks = reportsData.filter(task => task.party_name === company && getDeadlineStatus(task.planned3) === 'overdue').length

                    return (
                      <tr key={company} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-gray-900">{company}</p>
                            <p className="text-sm text-gray-500">
                              {reportsData.filter(t => t.party_name === company)[0]?.system_name || 'No System'}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-blue-600 text-lg">{totalTasks}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {Object.keys(persons).map(person => (
                              <span key={person} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                <User className="w-3 h-3 mr-1" />
                                {person}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {Object.entries(persons)
                              .sort(([, a], [, b]) => b - a)
                              .map(([person, count]) => (
                                <div key={person} className="flex items-center justify-between">
                                  <span className="text-gray-700">{person}</span>
                                  <span className="font-semibold">{count}</span>
                                </div>
                              ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {todayTasks > 0 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                Today: {todayTasks}
                              </span>
                            )}
                            {upcomingTasks > 0 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                Upcoming: {upcomingTasks}
                              </span>
                            )}
                            {overdueTasks > 0 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                                Overdue: {overdueTasks}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Person Distribution Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-purple-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
            <div className="flex items-center gap-2 mb-2 sm:mb-0">
              <Users className="w-5 h-5 text-purple-600" />
              <h2 className="text-xl font-bold text-gray-900">Task Distribution by Person</h2>
            </div>
            <button
              onClick={() => exportToCSV('person-summary')}
              className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm"
            >
              <DownloadIcon className="w-3 h-3" />
              Export
            </button>
          </div>
          <p className="text-gray-600 text-sm mt-1">
            Shows how many pending tasks each person has and their companies
          </p>
        </div>

        {Object.keys(stats.byPerson).length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No data available</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Person</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Tasks</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Companies</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline Breakdown</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {Object.entries(stats.byPerson)
                  .sort(([, a], [, b]) => b - a)
                  .map(([person, count]) => {
                    const personTasks = reportsData.filter(task => task.employee_name_1 === person || task.team_member_name === person)
                    const companies = [...new Set(personTasks.map(t => t.party_name).filter(Boolean))]
                    const todayTasks = personTasks.filter(t => getDeadlineStatus(t.planned3) === 'today').length
                    const upcomingTasks = personTasks.filter(t => getDeadlineStatus(t.planned3) === 'upcoming').length
                    const overdueTasks = personTasks.filter(t => getDeadlineStatus(t.planned3) === 'overdue').length

                    return (
                      <tr key={person} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="p-2 bg-purple-100 rounded-lg mr-3">
                              <User className="w-4 h-4 text-purple-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{person}</p>
                              <p className="text-sm text-gray-500">
                                {personTasks[0]?.team_name || 'No Team'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-purple-600 text-lg">{count}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {companies.map(company => (
                              <span key={company} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                <Building2 className="w-3 h-3 mr-1" />
                                {company}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="max-w-xs">
                            <div className="text-sm text-gray-700 truncate">
                              {personTasks.slice(0, 3).map(task => task.task_no).filter(Boolean).join(', ')}
                              {personTasks.length > 3 && ` and ${personTasks.length - 3} more...`}
                            </div>
                            <div className="text-xs text-gray-500 mt-1 flex">
                              <span className="mr-1">Latest:</span>
                              <div className="flex-1"><ExpandableText text={personTasks[0]?.description_of_work} /></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-600">Today:</span>
                              <span className="font-semibold text-green-600">{todayTasks}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-600">Upcoming:</span>
                              <span className="font-semibold text-blue-600">{upcomingTasks}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-600">Overdue:</span>
                              <span className="font-semibold text-red-600">{overdueTasks}</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary Cards at Bottom */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Companies */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top Companies by Tasks</h3>
            <PieChart className="w-5 h-5 text-blue-500" />
          </div>
          <div className="space-y-3">
            {Object.entries(stats.byCompany)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([company, count]) => (
                <div key={company} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    <span className="text-gray-700 truncate">{company}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-semibold text-blue-600 mr-2">{count}</span>
                    <span className="text-xs text-gray-500">
                      ({((count / (stats.totalPending || 1)) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Top Persons */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top Persons by Tasks</h3>
            <Users className="w-5 h-5 text-purple-500" />
          </div>
          <div className="space-y-3">
            {Object.entries(stats.byPerson)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([person, count]) => (
                <div key={person} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                    <span className="text-gray-700 truncate">{person}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-semibold text-purple-600 mr-2">{count}</span>
                    <span className="text-xs text-gray-500">
                      ({((count / (stats.totalPending || 1)) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </>
  )
}
