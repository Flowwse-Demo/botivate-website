import supabase from "../../../supabaseClient"

const CACHE_EXPIRY_TIME = 5 * 60 * 1000 // 5 minutes
const QUICK_CACHE_TIME = 2 * 1000 // 2 seconds for instant UI
const PROCESSING_CACHE_TIME = 30 * 1000 // 30 seconds for processed data

// Global cache objects
export let dataCache = {
  fmsData: null,
  systemListData: null,
  lastFetched: 0,
  quickCache: {
    systems: null,
    processedData: null,
    lastCached: 0
  },
  processingCache: new Map()
}

// ✅ Cache validation functions
export const isCacheValid = () => {
  return dataCache.fmsData && dataCache.systemListData &&
    (Date.now() - dataCache.lastFetched) < CACHE_EXPIRY_TIME
}

export const isQuickCacheValid = () => {
  return dataCache.quickCache.systems &&
    (Date.now() - dataCache.quickCache.lastCached) < QUICK_CACHE_TIME
}

export const isProcessingCacheValid = (cacheKey) => {
  const cached = dataCache.processingCache.get(cacheKey)
  return cached && (Date.now() - cached.timestamp) < PROCESSING_CACHE_TIME
}

// Utility functions
export const normalizeString = (str) => {
  return str ? str.toString().toLowerCase().trim() : ''
}

// ✅ Optimized fetch functions with caching
export const fetchSupabaseDataCached = async (tableName) => {
  if (isCacheValid()) {
    
    return tableName === "FMS" ? dataCache.fmsData : dataCache.systemListData
  }

  

  try {
    let { data, error } = await supabase
    .from(tableName)
    .select("*")

    if (error) throw error
    if (!data) throw new Error("No data received")

    // Cache the fresh data
    if (tableName === "FMS") {
      dataCache.fmsData = { data }
    } else if (tableName === "SystemList") {
      dataCache.systemListData = { data }
    }

    if (dataCache.fmsData && dataCache.systemListData) {
      dataCache.lastFetched = Date.now()
    }

    return { data }
  } catch (error) {
    console.error(`Error fetching ${tableName} data:`, error)
    throw error
  }
}
