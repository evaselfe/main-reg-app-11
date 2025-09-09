import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Eye, EyeOff, Plus, Edit, Trash2, Key } from 'lucide-react';
import { format } from 'date-fns';

interface AdminUser {
  id: string;
  username: string;
  full_name: string;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  last_login: string | null;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
}

interface UserPermission {
  permission_id: string;
  permission_name: string;
  granted_at: string;
  granted_by: string;
}

export default function AdminUsersTab() {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [userPermissions, setUserPermissions] = useState<Record<string, UserPermission[]>>({});
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    email: '',
    is_active: true
  });

  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  useEffect(() => {
    fetchAdminUsers();
    fetchPermissions();
  }, []);

  const fetchAdminUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAdminUsers(data || []);
    } catch (error: any) {
      toast.error('Failed to fetch admin users: ' + error.message);
    }
  };

  const fetchPermissions = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_permissions')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setPermissions(data || []);
    } catch (error: any) {
      toast.error('Failed to fetch permissions: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPermissions = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('admin_user_permissions')
        .select(`
          permission_id,
          granted_at,
          granted_by,
          admin_permissions!inner(name)
        `)
        .eq('admin_user_id', userId);

      if (error) throw error;
      
      const userPerms: UserPermission[] = (data || []).map(item => ({
        permission_id: item.permission_id,
        permission_name: (item.admin_permissions as any).name,
        granted_at: item.granted_at,
        granted_by: item.granted_by
      }));

      setUserPermissions(prev => ({
        ...prev,
        [userId]: userPerms
      }));

      setSelectedPermissions(userPerms.map(p => p.permission_id));
    } catch (error: any) {
      toast.error('Failed to fetch user permissions: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      full_name: '',
      email: '',
      is_active: true
    });
    setSelectedPermissions([]);
  };

  const handleAddUser = async () => {
    try {
      if (!formData.username || !formData.password || !formData.full_name) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Simple password hashing (in production, use proper bcrypt)
      const password_hash = `$2b$10$${btoa(formData.password)}`;

      const { data, error } = await supabase
        .from('admin_users')
        .insert([{
          username: formData.username,
          password_hash,
          full_name: formData.full_name,
          email: formData.email,
          is_active: formData.is_active,
          created_by: 'admin'
        }])
        .select()
        .single();

      if (error) throw error;

      // Add permissions
      if (selectedPermissions.length > 0) {
        const permissionInserts = selectedPermissions.map(permId => ({
          admin_user_id: data.id,
          permission_id: permId,
          granted_by: 'admin'
        }));

        const { error: permError } = await supabase
          .from('admin_user_permissions')
          .insert(permissionInserts);

        if (permError) throw permError;
      }

      toast.success('Admin user created successfully');
      setShowAddDialog(false);
      resetForm();
      fetchAdminUsers();
    } catch (error: any) {
      toast.error('Failed to create admin user: ' + error.message);
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;

    try {
      const updateData: any = {
        full_name: formData.full_name,
        email: formData.email,
        is_active: formData.is_active
      };

      if (formData.password) {
        updateData.password_hash = `$2b$10$${btoa(formData.password)}`;
      }

      const { error } = await supabase
        .from('admin_users')
        .update(updateData)
        .eq('id', selectedUser.id);

      if (error) throw error;

      toast.success('Admin user updated successfully');
      setShowEditDialog(false);
      resetForm();
      setSelectedUser(null);
      fetchAdminUsers();
    } catch (error: any) {
      toast.error('Failed to update admin user: ' + error.message);
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (username === 'eva') {
      toast.error('Cannot delete the main admin user');
      return;
    }

    if (!confirm('Are you sure you want to delete this admin user?')) return;

    try {
      const { error } = await supabase
        .from('admin_users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      toast.success('Admin user deleted successfully');
      fetchAdminUsers();
    } catch (error: any) {
      toast.error('Failed to delete admin user: ' + error.message);
    }
  };

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    if (checked) {
      setSelectedPermissions(prev => [...prev, permissionId]);
    } else {
      setSelectedPermissions(prev => prev.filter(id => id !== permissionId));
    }
  };

  const handleUpdatePermissions = async () => {
    if (!selectedUser) return;

    try {
      // Remove all existing permissions
      const { error: deleteError } = await supabase
        .from('admin_user_permissions')
        .delete()
        .eq('admin_user_id', selectedUser.id);

      if (deleteError) throw deleteError;

      // Add new permissions
      if (selectedPermissions.length > 0) {
        const permissionInserts = selectedPermissions.map(permId => ({
          admin_user_id: selectedUser.id,
          permission_id: permId,
          granted_by: 'admin'
        }));

        const { error: insertError } = await supabase
          .from('admin_user_permissions')
          .insert(permissionInserts);

        if (insertError) throw insertError;
      }

      toast.success('Permissions updated successfully');
      setShowPermissionsDialog(false);
      setSelectedUser(null);
      setSelectedPermissions([]);
    } catch (error: any) {
      toast.error('Failed to update permissions: ' + error.message);
    }
  };

  const openEditDialog = (user: AdminUser) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      password: '',
      full_name: user.full_name,
      email: user.email || '',
      is_active: user.is_active
    });
    setShowEditDialog(true);
  };

  const openPermissionsDialog = (user: AdminUser) => {
    setSelectedUser(user);
    fetchUserPermissions(user.id);
    setShowPermissionsDialog(true);
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading admin users...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Admin Users Management</h2>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setShowAddDialog(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Admin User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Add New Admin User</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-4">
              <div>
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Enter username"
                />
              </div>
              <div>
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked as boolean }))}
                />
                <Label htmlFor="isActive">Active User</Label>
              </div>
              
              <div>
                <Label>Permissions</Label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded p-2">
                  {permissions.map((permission) => (
                    <div key={permission.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`perm-${permission.id}`}
                        checked={selectedPermissions.includes(permission.id)}
                        onCheckedChange={(checked) => handlePermissionChange(permission.id, checked as boolean)}
                      />
                      <Label htmlFor={`perm-${permission.id}`} className="text-sm">
                        {permission.description}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              </div>
            </ScrollArea>
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddUser}>Create User</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Admin Users</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adminUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>{user.full_name}</TableCell>
                  <TableCell>{user.email || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={user.is_active ? "default" : "secondary"}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(new Date(user.created_at), 'dd/MM/yyyy')}</TableCell>
                  <TableCell>
                    {user.last_login ? format(new Date(user.last_login), 'dd/MM/yyyy HH:mm') : 'Never'}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(user)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openPermissionsDialog(user)}
                      >
                        <Key className="w-4 h-4" />
                      </Button>
                      {user.username !== 'eva' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id, user.username)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Admin User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Username</Label>
              <Input value={formData.username} disabled />
            </div>
            <div>
              <Label htmlFor="editPassword">New Password (leave blank to keep current)</Label>
              <div className="relative">
                <Input
                  id="editPassword"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter new password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="editFullName">Full Name *</Label>
              <Input
                id="editFullName"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="editEmail">Email</Label>
              <Input
                id="editEmail"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="editIsActive"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked as boolean }))}
              />
              <Label htmlFor="editIsActive">Active User</Label>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditUser}>Update User</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog open={showPermissionsDialog} onOpenChange={setShowPermissionsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Permissions - {selectedUser?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto border rounded p-4">
              {permissions.map((permission) => (
                <div key={permission.id} className="flex items-center justify-between space-x-2 p-2 border rounded">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-perm-${permission.id}`}
                      checked={selectedPermissions.includes(permission.id)}
                      onCheckedChange={(checked) => handlePermissionChange(permission.id, checked as boolean)}
                    />
                    <div>
                      <Label htmlFor={`edit-perm-${permission.id}`} className="font-medium">
                        {permission.description}
                      </Label>
                      <div className="text-xs text-muted-foreground">{permission.name}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowPermissionsDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdatePermissions}>Update Permissions</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}