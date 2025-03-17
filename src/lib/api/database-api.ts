
import { toast } from "sonner";
import { fetchCustomAPI } from './custom-api';

/**
 * Fetch data from a table in the database
 * @param tableName Table name (without prefix)
 * @param options Additional options
 * @returns Promise with database results
 */
export async function fetchDatabaseTable(tableName: string, options: any = {}) {
  try {
    // Sử dụng endpoint truy vấn SQL tiêu chuẩn
    const query = `SELECT * FROM wp_hmm_${tableName} LIMIT 100`;
    const result = await fetchCustomAPI('/hmm/v1/query', {
      method: 'POST',
      body: { query },
      ...options
    });
    
    return {
      success: true,
      data: result.results || [],
      total: result.rows_affected || 0
    };
  } catch (error) {
    console.error(`Error fetching from table ${tableName}:`, error);
    if (!options.suppressToast) {
      toast.error(`Lỗi truy vấn bảng ${tableName}: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
    
    throw error;
  }
}

/**
 * Insert a new record into a database table
 * @param tableName Table name (without prefix)
 * @param data Record data to insert
 * @returns Promise with insert result
 */
export async function insertDatabaseRecord(tableName: string, data: any) {
  try {
    // Sử dụng endpoint chính thức của API
    const result = await fetchCustomAPI(`/hmm/v1/tables/wp_hmm_${tableName}/insert`, {
      method: 'POST',
      body: data
    });
    
    console.log(`Inserted record into ${tableName}:`, result);
    
    if (result && result.success) {
      toast.success(`Đã thêm dữ liệu vào bảng ${tableName} thành công`);
    }
    
    return result;
  } catch (error) {
    console.error(`Error inserting into table ${tableName}:`, error);
    toast.error(`Lỗi thêm dữ liệu vào bảng ${tableName}: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    throw error;
  }
}

/**
 * Update an existing record in a database table
 * @param tableName Table name (without prefix)
 * @param id Record ID to update
 * @param data Record data to update
 * @returns Promise with update result
 */
export async function updateDatabaseRecord(tableName: string, id: number, data: any) {
  try {
    // Sử dụng endpoint chính thức của API
    const result = await fetchCustomAPI(`/hmm/v1/tables/wp_hmm_${tableName}/update/${id}`, {
      method: 'PUT',
      body: data
    });
    
    console.log(`Updated record ${id} in ${tableName}:`, result);
    
    if (result && result.success) {
      toast.success(`Đã cập nhật dữ liệu trong bảng ${tableName} thành công`);
    }
    
    return result;
  } catch (error) {
    console.error(`Error updating record ${id} in table ${tableName}:`, error);
    toast.error(`Lỗi cập nhật dữ liệu trong bảng ${tableName}: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    throw error;
  }
}

/**
 * Delete a record from a database table
 * @param tableName Table name (without prefix)
 * @param id Record ID to delete
 * @returns Promise with delete result
 */
export async function deleteDatabaseRecord(tableName: string, id: number) {
  try {
    // Sử dụng endpoint chính thức của API
    const result = await fetchCustomAPI(`/hmm/v1/tables/wp_hmm_${tableName}/delete/${id}`, {
      method: 'DELETE'
    });
    
    console.log(`Deleted record ${id} from ${tableName}:`, result);
    
    if (result && result.success) {
      toast.success(`Đã xóa dữ liệu từ bảng ${tableName} thành công`);
    }
    
    return result;
  } catch (error) {
    console.error(`Error deleting record ${id} from table ${tableName}:`, error);
    toast.error(`Lỗi xóa dữ liệu từ bảng ${tableName}: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    throw error;
  }
}
