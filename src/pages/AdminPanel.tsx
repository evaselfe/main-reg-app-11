import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navigation from '@/components/Navigation';
import RegistrationsTab from '@/components/admin/RegistrationsTab';
import CategoriesTab from '@/components/admin/CategoriesTab';
import PanchayathsTab from '@/components/admin/PanchayathsTab';
import AnnouncementsTab from '@/components/admin/AnnouncementsTab';
import UtilitiesTab from '@/components/admin/UtilitiesTab';
import AccountsTab from '@/components/admin/AccountsTab';
import ReportsTab from '@/components/admin/ReportsTab';
import AdminUsersTab from '@/components/admin/AdminUsersTab';
import CategoryTransferTab from '@/components/admin/CategoryTransferTab';
import NotificationBell from '@/components/admin/NotificationBell';

const AdminPanel = () => {
  const { isAdminLoggedIn, logout, hasPermission } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdminLoggedIn) {
      navigate('/admin/login');
    }
  }, [isAdminLoggedIn, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  // Permission-based tab visibility
  const canViewRegistrations = hasPermission('manage_registrations') || hasPermission('users_read');
  const canViewCategories = hasPermission('manage_categories') || hasPermission('categories_read');
  const canViewPanchayaths = hasPermission('panchayaths_read') || hasPermission('panchayaths_write');
  const canViewAnnouncements = hasPermission('announcements_read') || hasPermission('announcements_write');
  const canViewUtilities = hasPermission('manage_utilities') || hasPermission('utilities_read');
  const canViewAccounts = hasPermission('accounts_read') || hasPermission('accounts_write');
  const canViewReports = hasPermission('manage_reports') || hasPermission('reports_read');
  const canViewAdminUsers = hasPermission('manage_users') || hasPermission('admin_users_read');
  const canViewTransfers = hasPermission('manage_registrations');

  // Get the first available tab for default value
  const getDefaultTab = () => {
    if (canViewRegistrations) return 'registrations';
    if (canViewCategories) return 'categories';
    if (canViewPanchayaths) return 'panchayaths';
    if (canViewAnnouncements) return 'announcements';
    if (canViewUtilities) return 'utilities';
    if (canViewAccounts) return 'accounts';
    if (canViewReports) return 'reports';
    if (canViewAdminUsers) return 'admin-users';
    if (canViewTransfers) return 'transfers';
    return 'registrations'; // fallback
  };

  if (!isAdminLoggedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto py-4 px-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Admin Panel</h1>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Button onClick={handleLogout} variant="outline" size="sm">
              Logout
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue={getDefaultTab()} className="w-full">
          <div className="overflow-x-auto">
            <TabsList className="flex w-max sm:grid sm:w-full h-auto p-1" style={{ gridTemplateColumns: `repeat(${[canViewRegistrations, canViewCategories, canViewPanchayaths, canViewAnnouncements, canViewUtilities, canViewAccounts, canViewReports, canViewAdminUsers, canViewTransfers].filter(Boolean).length}, 1fr)` }}>
              {canViewRegistrations && (
                <TabsTrigger value="registrations" className="whitespace-nowrap text-xs sm:text-sm px-2 sm:px-3">
                  Registrations
                </TabsTrigger>
              )}
              {canViewCategories && (
                <TabsTrigger value="categories" className="whitespace-nowrap text-xs sm:text-sm px-2 sm:px-3">
                  Categories
                </TabsTrigger>
              )}
              {canViewPanchayaths && (
                <TabsTrigger value="panchayaths" className="whitespace-nowrap text-xs sm:text-sm px-2 sm:px-3">
                  Panchayaths
                </TabsTrigger>
              )}
              {canViewAnnouncements && (
                <TabsTrigger value="announcements" className="whitespace-nowrap text-xs sm:text-sm px-2 sm:px-3">
                  Announcements
                </TabsTrigger>
              )}
              {canViewUtilities && (
                <TabsTrigger value="utilities" className="whitespace-nowrap text-xs sm:text-sm px-2 sm:px-3">
                  Utilities
                </TabsTrigger>
              )}
              {canViewAccounts && (
                <TabsTrigger value="accounts" className="whitespace-nowrap text-xs sm:text-sm px-2 sm:px-3">
                  Accounts
                </TabsTrigger>
              )}
              {canViewReports && (
                <TabsTrigger value="reports" className="whitespace-nowrap text-xs sm:text-sm px-2 sm:px-3">
                  Reports
                </TabsTrigger>
              )}
              {canViewAdminUsers && (
                <TabsTrigger value="admin-users" className="whitespace-nowrap text-xs sm:text-sm px-2 sm:px-3">
                  Admin Users
                </TabsTrigger>
              )}
              {canViewTransfers && (
                <TabsTrigger value="transfers" className="whitespace-nowrap text-xs sm:text-sm px-2 sm:px-3">
                  Transfers
                </TabsTrigger>
              )}
            </TabsList>
          </div>
          
          {canViewRegistrations && (
            <TabsContent value="registrations">
              <RegistrationsTab />
            </TabsContent>
          )}
          
          {canViewCategories && (
            <TabsContent value="categories">
              <CategoriesTab />
            </TabsContent>
          )}
          
          {canViewPanchayaths && (
            <TabsContent value="panchayaths">
              <PanchayathsTab />
            </TabsContent>
          )}
          
          {canViewAnnouncements && (
            <TabsContent value="announcements">
              <AnnouncementsTab />
            </TabsContent>
          )}
          
          {canViewUtilities && (
            <TabsContent value="utilities">
              <UtilitiesTab />
            </TabsContent>
          )}
          
          {canViewAccounts && (
            <TabsContent value="accounts">
              <AccountsTab />
            </TabsContent>
          )}
          
          {canViewReports && (
            <TabsContent value="reports">
              <ReportsTab />
            </TabsContent>
          )}
          
          {canViewAdminUsers && (
            <TabsContent value="admin-users">
              <AdminUsersTab />
            </TabsContent>
          )}
          
          {canViewTransfers && (
            <TabsContent value="transfers">
              <CategoryTransferTab />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;