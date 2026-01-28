
import { User, ApiResponse } from '../types';

/**
 * LƯU Ý CHO DEVELOPER:
 * File này hiện đang giả lập (mock) các API gọi đến Node/Express backend.
 * Các phần có comment "DATABASE LOGIC" là nơi bạn sẽ thay thế bằng 
 * lệnh gọi fetch() hoặc axios() đến server Express thực tế.
 */

const MOCK_DELAY = 800;

// Giả lập database bằng localStorage để demo tính năng functional
const getMockDB = (): User[] => {
  const data = localStorage.getItem('mock_users');
  return data ? JSON.parse(data) : [];
};

const saveMockDB = (users: User[]) => {
  localStorage.setItem('mock_users', JSON.stringify(users));
};

export const authService = {
  register: async (fullName: string, email: string, password: string): Promise<ApiResponse<User>> => {
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));

    // --- DATABASE LOGIC START ---
    // Thay thế đoạn này bằng: const response = await fetch('/api/register', { ... })
    
    const users = getMockDB();
    if (users.find(u => u.email === email)) {
      return { success: false, error: "Email đã tồn tại trong hệ thống!" };
    }

    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      fullName,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    saveMockDB(users);
    // --- DATABASE LOGIC END ---

    return { success: true, data: newUser };
  },

  login: async (email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> => {
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));

    // --- DATABASE LOGIC START ---
    // Thay thế đoạn này bằng: const response = await fetch('/api/login', { ... })
    
    const users = getMockDB();
    const user = users.find(u => u.email === email);
    
    // Ở bản demo này, mọi password đều được chấp nhận nếu email tồn tại
    if (!user) {
      return { success: false, error: "Email hoặc mật khẩu không đúng!" };
    }
    // --- DATABASE LOGIC END ---

    return { 
      success: true, 
      data: { 
        user, 
        token: "mock-jwt-token-" + user.id 
      } 
    };
  },

  logout: async (): Promise<void> => {
    // --- DATABASE LOGIC START ---
    // Gọi API xóa session/cookie nếu cần
    await new Promise(resolve => setTimeout(resolve, 300));
    // --- DATABASE LOGIC END ---
  }
};
