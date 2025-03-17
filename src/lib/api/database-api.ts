
import { toast } from "sonner";
import { API_BASE_URL } from "./base-api";

/**
 * Fetches data directly from a database table using the Database API
 * @param tableName Name of the database table (without prefix)
 * @param options Additional options for the fetch request
 * @returns Promise with table data
 */
export async function fetchDatabaseTable(tableName: string, options: any = {}) {
  try {
    // Import fetchCustomAPI dynamically to avoid circular dependencies
    const { fetchCustomAPI } = await import("./custom-api");
    
    const endpoint = `/hmm/v1/tables/wp_hmm_${tableName}`;
    const data = await fetchCustomAPI(endpoint, { ...options, suppressToast: options.suppressToast ?? true });
    console.info(`Fetched data from table ${tableName}:`, data);
    return data;
  } catch (error) {
    console.error(`Error fetching from database table ${tableName}:`, error);
    if (!options.suppressToast) {
      toast.error(`Lỗi khi truy vấn bảng ${tableName}: ${error instanceof Error ? error.message : 'Không thể kết nối tới Database API'}`);
    }
    throw error;
  }
}

/**
 * Executes a custom SQL query using the Database API
 * @param query SQL query string (SELECT only)
 * @param options Additional options for the fetch request
 * @returns Promise with query results
 */
export async function executeDatabaseQuery(query: string, options: any = {}) {
  try {
    // Import fetchCustomAPI dynamically to avoid circular dependencies
    const { fetchCustomAPI } = await import("./custom-api");
    
    const endpoint = `/hmm/v1/query`;
    const data = await fetchCustomAPI(endpoint, {
      method: 'POST',
      body: { query },
      ...options,
      suppressToast: options.suppressToast ?? true
    });
    console.info(`Executed database query:`, { query, result: data });
    return data;
  } catch (error) {
    console.error(`Error executing database query:`, { query, error });
    if (!options.suppressToast) {
      toast.error(`Lỗi khi thực thi truy vấn: ${error instanceof Error ? error.message : 'Không thể kết nối tới Database API'}`);
    }
    throw error;
  }
}
