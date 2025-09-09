import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdminAuthContextType {
  isAdminLoggedIn: boolean;
  currentAdminName: string | null;
  currentAdminId: string | null;
  userPermissions: string[];
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permissionName: string) => boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [currentAdminName, setCurrentAdminName] = useState<string | null>(null);
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);

  const fetchUserPermissions = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('admin_user_permissions')
        .select(`
          admin_permissions!inner(name)
        `)
        .eq('admin_user_id', userId);

      if (error) throw error;
      
      const permissions = (data || []).map(item => (item.admin_permissions as any).name);
      setUserPermissions(permissions);
      localStorage.setItem('adminPermissions', JSON.stringify(permissions));
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      setUserPermissions([]);
    }
  };

  useEffect(() => {
    const savedAuth = localStorage.getItem('adminAuth');
    const savedAdminName = localStorage.getItem('adminName');
    const savedAdminId = localStorage.getItem('adminId');
    const savedPermissions = localStorage.getItem('adminPermissions');
    
    if (savedAuth === 'true' && savedAdminName && savedAdminId) {
      setIsAdminLoggedIn(true);
      setCurrentAdminName(savedAdminName);
      setCurrentAdminId(savedAdminId);
      if (savedPermissions) {
        setUserPermissions(JSON.parse(savedPermissions));
      }
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // Query the admin_users table
      const { data: adminUser, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('username', username)
        .eq('is_active', true)
        .single();

      if (error || !adminUser) {
        return false;
      }

      // Check password (using the same simple encoding as in AdminUsersTab)
      const expectedHash = `$2b$10$${btoa(password)}`;
      if (adminUser.password_hash !== expectedHash) {
        return false;
      }

      // Update last login
      await supabase
        .from('admin_users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', adminUser.id);

      setIsAdminLoggedIn(true);
      setCurrentAdminName(username);
      setCurrentAdminId(adminUser.id);
      localStorage.setItem('adminAuth', 'true');
      localStorage.setItem('adminName', username);
      localStorage.setItem('adminId', adminUser.id);
      
      // Fetch user permissions
      await fetchUserPermissions(adminUser.id);
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setIsAdminLoggedIn(false);
    setCurrentAdminName(null);
    setCurrentAdminId(null);
    setUserPermissions([]);
    localStorage.removeItem('adminAuth');
    localStorage.removeItem('adminName');
    localStorage.removeItem('adminId');
    localStorage.removeItem('adminPermissions');
  };

  const hasPermission = (permissionName: string): boolean => {
    return userPermissions.includes(permissionName);
  };

  return (
    <AdminAuthContext.Provider value={{ 
      isAdminLoggedIn, 
      currentAdminName, 
      currentAdminId, 
      userPermissions, 
      login, 
      logout, 
      hasPermission 
    }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};