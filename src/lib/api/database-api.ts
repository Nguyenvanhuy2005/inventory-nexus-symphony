
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
    
    // Tạo truy vấn SQL SELECT thay vì truy cập trực tiếp bảng
    const query = `SELECT * FROM wp_hmm_${tableName} LIMIT ${options.limit || 100}`;
    
    // Sử dụng executeDatabaseQuery để thực thi truy vấn SQL
    const data = await executeDatabaseQuery(query, { ...options, suppressToast: options.suppressToast ?? true });
    
    console.info(`Fetched data from table ${tableName} using SQL query:`, data);
    
    // Định dạng kết quả trả về để phù hợp với cấu trúc dữ liệu mong đợi
    return {
      data: data.results || [],
      total: data.rows_affected || 0
    };
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
    
    // Đảm bảo truy vấn là SELECT
    if (!query.trim().toUpperCase().startsWith('SELECT')) {
      throw new Error('Chỉ hỗ trợ truy vấn SELECT cho Database API');
    }
    
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

/**
 * Fetches data using SQL JOIN between multiple tables
 * @param query SQL query with JOIN
 * @param options Additional options
 * @returns Promise with query results
 */
export async function fetchJoinedData(query: string, options: any = {}) {
  if (!query.trim().toUpperCase().startsWith('SELECT')) {
    throw new Error('Query phải bắt đầu bằng SELECT');
  }
  
  try {
    const data = await executeDatabaseQuery(query, options);
    return {
      data: data.results || [],
      total: data.rows_affected || 0
    };
  } catch (error) {
    console.error('Error fetching joined data:', error);
    throw error;
  }
}

/**
 * Đếm số lượng bản ghi trong bảng
 * @param tableName Tên bảng (không có tiền tố)
 * @param whereClause Điều kiện WHERE (tùy chọn)
 * @returns Promise với số lượng bản ghi
 */
export async function countDatabaseRecords(tableName: string, whereClause?: string) {
  const query = `SELECT COUNT(*) as total FROM wp_hmm_${tableName} ${whereClause ? 'WHERE ' + whereClause : ''}`;
  
  try {
    const data = await executeDatabaseQuery(query, { suppressToast: true });
    if (data.results && data.results.length > 0) {
      return parseInt(data.results[0].total) || 0;
    }
    return 0;
  } catch (error) {
    console.error(`Error counting records in ${tableName}:`, error);
    return 0;
  }
}

/**
 * Thêm dữ liệu vào bảng thông qua Custom API (thay vì truy vấn SQL trực tiếp)
 * @param tableName Tên bảng (không có tiền tố)
 * @param data Dữ liệu cần thêm
 * @param options Tùy chọn bổ sung
 * @returns Promise với kết quả thêm dữ liệu
 */
export async function insertDatabaseRecord(tableName: string, data: Record<string, any>, options: any = {}) {
  try {
    // Import fetchCustomAPI dynamically to avoid circular dependencies
    const { fetchCustomAPI } = await import("./custom-api");
    
    // Sử dụng endpoint để thêm dữ liệu thay vì truy vấn INSERT
    const endpoint = `/custom/v1/db/${tableName}/insert`;
    const result = await fetchCustomAPI(endpoint, {
      method: 'POST',
      body: data,
      ...options
    });
    
    console.info(`Inserted data into table ${tableName}:`, { data, result });
    return result;
  } catch (error) {
    console.error(`Error inserting into table ${tableName}:`, error);
    if (!options.suppressToast) {
      toast.error(`Lỗi khi thêm dữ liệu vào bảng ${tableName}: ${error instanceof Error ? error.message : 'Không thể kết nối tới API'}`);
    }
    throw error;
  }
}

/**
 * Cập nhật dữ liệu trong bảng thông qua Custom API (thay vì truy vấn SQL trực tiếp)
 * @param tableName Tên bảng (không có tiền tố)
 * @param id ID của bản ghi cần cập nhật
 * @param data Dữ liệu cần cập nhật
 * @param options Tùy chọn bổ sung
 * @returns Promise với kết quả cập nhật dữ liệu
 */
export async function updateDatabaseRecord(tableName: string, id: number, data: Record<string, any>, options: any = {}) {
  try {
    // Import fetchCustomAPI dynamically to avoid circular dependencies
    const { fetchCustomAPI } = await import("./custom-api");
    
    // Sử dụng endpoint để cập nhật dữ liệu thay vì truy vấn UPDATE
    const endpoint = `/custom/v1/db/${tableName}/update/${id}`;
    const result = await fetchCustomAPI(endpoint, {
      method: 'PUT',
      body: data,
      ...options
    });
    
    console.info(`Updated data in table ${tableName} for ID ${id}:`, { data, result });
    return result;
  } catch (error) {
    console.error(`Error updating table ${tableName} record ${id}:`, error);
    if (!options.suppressToast) {
      toast.error(`Lỗi khi cập nhật dữ liệu trong bảng ${tableName}: ${error instanceof Error ? error.message : 'Không thể kết nối tới API'}`);
    }
    throw error;
  }
}

/**
 * Xóa dữ liệu trong bảng thông qua Custom API (thay vì truy vấn SQL trực tiếp)
 * @param tableName Tên bảng (không có tiền tố)
 * @param id ID của bản ghi cần xóa
 * @param options Tùy chọn bổ sung
 * @returns Promise với kết quả xóa dữ liệu
 */
export async function deleteDatabaseRecord(tableName: string, id: number, options: any = {}) {
  try {
    // Import fetchCustomAPI dynamically to avoid circular dependencies
    const { fetchCustomAPI } = await import("./custom-api");
    
    // Sử dụng endpoint để xóa dữ liệu thay vì truy vấn DELETE
    const endpoint = `/custom/v1/db/${tableName}/delete/${id}`;
    const result = await fetchCustomAPI(endpoint, {
      method: 'DELETE',
      ...options
    });
    
    console.info(`Deleted data from table ${tableName} for ID ${id}:`, result);
    return result;
  } catch (error) {
    console.error(`Error deleting from table ${tableName} record ${id}:`, error);
    if (!options.suppressToast) {
      toast.error(`Lỗi khi xóa dữ liệu từ bảng ${tableName}: ${error instanceof Error ? error.message : 'Không thể kết nối tới API'}`);
    }
    throw error;
  }
}
