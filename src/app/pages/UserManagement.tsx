import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useData } from '../context/DataContext';
import { User } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Switch } from '../components/ui/switch';
import { ArrowLeft, Plus, Trash2, Users, Shield, UserCheck, Settings } from 'lucide-react';
import { toast } from 'sonner';
import degenixLogo from 'figma:asset/e686929947131e66770ed743ba284a27b15aa8de.png';
import { DateTimeDisplay } from '../components/DateTimeDisplay';

export default function UserManagement() {
  const navigate = useNavigate();
  const { currentUser, users, addUser, deleteUser, updateUser, companySettings } = useData();
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    fullName: '',
    role: 'user' as 'user' | 'admin',
    department: '',
    permissions: {
      accounts: false,
      staffPayroll: false,
      userManagement: false,
      dataManagement: false,
      vendors: false,
      festivals: false,
    },
  });

  const handleAddUser = () => {
    if (!newUser.username || !newUser.password || !newUser.fullName) {
      toast.error('Please fill all required fields');
      return;
    }

    addUser(newUser);
    toast.success('User added successfully');
    setShowUserDialog(false);
    setNewUser({
      username: '',
      password: '',
      fullName: '',
      role: 'user',
      department: '',
      permissions: {
        accounts: false,
        staffPayroll: false,
        userManagement: false,
        dataManagement: false,
        vendors: false,
        festivals: false,
      },
    });
  };

  const handleDeleteUser = (userId: string) => {
    if (userId === currentUser?.id) {
      toast.error('Cannot delete current user');
      return;
    }
    
    if (confirm('Are you sure you want to delete this user?')) {
      deleteUser(userId);
      toast.success('User deleted successfully');
    }
  };

  const handleOpenPermissions = (user: User) => {
    setSelectedUser(user);
    setShowPermissionsDialog(true);
  };

  const handleTogglePermission = (permission: keyof User['permissions'], currentValue: boolean) => {
    if (selectedUser) {
      updateUser(selectedUser.id, { 
        permissions: { 
          ...selectedUser.permissions, 
          [permission]: !currentValue 
        } 
      });
      setSelectedUser({
        ...selectedUser,
        permissions: {
          ...selectedUser.permissions,
          [permission]: !currentValue
        }
      });
    }
  };

  const handleTogglePermissionInline = (userId: string, permission: keyof User['permissions'], currentValue: boolean) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      updateUser(userId, { 
        permissions: { 
          ...user.permissions, 
          [permission]: !currentValue 
        } 
      });
    }
  };

  const handleUpdateDepartment = (userId: string, department: string) => {
    updateUser(userId, { department });
    toast.success('Department updated successfully');
  };

  const adminUsers = users.filter(u => u.role === 'admin');
  const regularUsers = users.filter(u => u.role === 'user');

  return (
    <div 
      className="min-h-screen"
      style={{
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%)'
      }}
    >
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#1a1a1a] border-b border-gray-800 shadow-lg shadow-black/50">
        <div className="py-6 px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/dashboard')}
                className="text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <img 
                src={degenixLogo} 
                alt="Degenix Graphics Logo" 
                className="h-14 w-14 object-contain cursor-pointer hover:opacity-80 transition-opacity" 
                onClick={() => navigate('/dashboard')}
              />
              <div>
                <h1 className="text-white text-2xl font-bold">
                  User Management
                </h1>
                <p className="text-gray-300 text-sm font-medium">{companySettings.companyName}</p>
              </div>
            </div>
            <DateTimeDisplay />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Total Users Card */}
            <Card className="bg-[#1a1a1a] border-gray-800 shadow-xl shadow-black/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-bold text-white">Total Users</CardTitle>
                <Users className="h-5 w-5 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white mb-1">{users.length}</div>
                <p className="text-xs text-gray-400">System accounts</p>
              </CardContent>
            </Card>

            {/* Admin Users Card */}
            <Card className="bg-[#1a1a1a] border-gray-800 shadow-xl shadow-black/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-bold text-white">Admin Users</CardTitle>
                <Shield className="h-5 w-5 text-pink-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white mb-1">{adminUsers.length}</div>
                <p className="text-xs text-gray-400">Full access</p>
              </CardContent>
            </Card>

            {/* Regular Users Card */}
            <Card className="bg-[#1a1a1a] border-gray-800 shadow-xl shadow-black/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-bold text-white">Regular Users</CardTitle>
                <UserCheck className="h-5 w-5 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white mb-1">{regularUsers.length}</div>
                <p className="text-xs text-gray-400">Custom access</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Container */}
          <div className="space-y-6">
              
              {/* Header Section */}
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">System Users</h2>
                <Button
                  onClick={() => setShowUserDialog(true)}
                  style={{ backgroundColor: '#10b981' }}
                  className="hover:opacity-90"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add User
                </Button>
              </div>

              {/* Users Table */}
              <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg shadow-xl shadow-black/50 overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-gray-800 hover:bg-gray-800/50">
                        <TableHead className="text-gray-200">Username</TableHead>
                        <TableHead className="text-gray-200">Full Name</TableHead>
                        <TableHead className="text-gray-200">Role</TableHead>
                        <TableHead className="text-gray-200">Department</TableHead>
                        <TableHead className="text-gray-200">Accounts</TableHead>
                        <TableHead className="text-gray-200">Staff/Payroll</TableHead>
                        <TableHead className="text-gray-200">Vendors</TableHead>
                        <TableHead className="text-gray-200">Festivals</TableHead>
                        <TableHead className="text-right text-gray-200">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-12">
                            <div className="flex flex-col items-center justify-center space-y-3">
                              <Users className="h-12 w-12 text-gray-400" />
                              <p className="text-gray-400">No users found.</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        users.map((user) => (
                          <TableRow key={user.id} className="border-b border-gray-700 hover:bg-gray-800/50 transition-colors">
                            <TableCell className="font-medium text-white">{user.username}</TableCell>
                            <TableCell className="text-purple-100">{user.fullName}</TableCell>
                            <TableCell>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  user.role === 'admin'
                                    ? 'bg-pink-500/20 text-pink-300 border border-pink-400/40'
                                    : 'bg-blue-500/20 text-blue-300 border border-blue-400/40'
                                }`}
                              >
                                {user.role}
                              </span>
                            </TableCell>
                            <TableCell className="text-gray-300">
                              {user.role === 'admin' ? (
                                <span className="text-gray-400 text-sm">{user.department || 'Management'}</span>
                              ) : (
                                <Input
                                  value={user.department || ''}
                                  onChange={(e) => handleUpdateDepartment(user.id, e.target.value)}
                                  placeholder="Enter dept"
                                  className="bg-white/5 border-white/20 text-white text-sm h-8 w-32"
                                />
                              )}
                            </TableCell>
                            <TableCell>
                              {user.role === 'admin' ? (
                                <span className="text-green-300 text-xs">✓ Always</span>
                              ) : (
                                <Switch
                                  checked={user.permissions.accounts}
                                  onCheckedChange={() => handleTogglePermissionInline(user.id, 'accounts', user.permissions.accounts)}
                                  className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-green-400 data-[state=checked]:to-emerald-500"
                                />
                              )}
                            </TableCell>
                            <TableCell>
                              {user.role === 'admin' ? (
                                <span className="text-green-300 text-xs">✓ Always</span>
                              ) : (
                                <Switch
                                  checked={user.permissions.staffPayroll}
                                  onCheckedChange={() => handleTogglePermissionInline(user.id, 'staffPayroll', user.permissions.staffPayroll)}
                                  className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-green-400 data-[state=checked]:to-emerald-500"
                                />
                              )}
                            </TableCell>
                            <TableCell>
                              {user.role === 'admin' ? (
                                <span className="text-green-300 text-xs">✓ Always</span>
                              ) : (
                                <Switch
                                  checked={user.permissions.vendors}
                                  onCheckedChange={() => handleTogglePermissionInline(user.id, 'vendors', user.permissions.vendors)}
                                  className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-green-400 data-[state=checked]:to-emerald-500"
                                />
                              )}
                            </TableCell>
                            <TableCell>
                              {user.role === 'admin' ? (
                                <span className="text-green-300 text-xs">✓ Always</span>
                              ) : (
                                <Switch
                                  checked={user.permissions.festivals}
                                  onCheckedChange={() => handleTogglePermissionInline(user.id, 'festivals', user.permissions.festivals)}
                                  className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-green-400 data-[state=checked]:to-emerald-500"
                                />
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                {user.role !== 'admin' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleOpenPermissions(user)}
                                    className="text-blue-300 hover:text-blue-200 hover:bg-blue-500/20"
                                  >
                                    <Settings className="h-4 w-4" />
                                  </Button>
                                )}
                                {user.id !== currentUser?.id && user.role !== 'admin' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="text-red-300 hover:text-red-200 hover:bg-red-500/20"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* User Permissions Info */}
              <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg shadow-xl shadow-black/50 p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                  <Shield className="mr-2 h-5 w-5 text-blue-400" />
                  Access Control Information
                </h3>
                <div className="space-y-4">
                  <div className="bg-pink-500/20 border border-pink-400/40 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <Shield className="h-5 w-5 text-pink-400 mt-0.5" />
                      <div>
                        <strong className="text-white text-sm font-semibold">Admin Users</strong>
                        <p className="text-gray-300 text-sm mt-1">
                          Full access to ALL modules. Cannot be restricted.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-blue-500/20 border border-blue-400/40 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <UserCheck className="h-5 w-5 text-blue-400 mt-0.5" />
                      <div>
                        <strong className="text-white text-sm font-semibold">Regular Users - Default Access</strong>
                        <p className="text-gray-300 text-sm mt-1">
                          ✓ Client Management, ✓ Product Management, ✓ Orders (Quotations, Job Sheets, Billing)<br/>
                          ✗ Accounts, ✗ Staff & Payroll, ✗ User Management, ✗ Data Management (Admin can grant via toggles)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
          </div>
        </div>
      </div>

      {/* Add User Dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent style={{ backgroundColor: '#1a2b4a', borderColor: 'rgba(255, 255, 255, 0.2)' }} className="max-w-2xl text-white">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">Add New User</DialogTitle>
            <DialogDescription className="text-gray-300">
              Create a new user account with department and custom permissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="username" className="text-white/90">Username *</Label>
                <Input
                  id="username"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  placeholder="Enter username"
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
              <div>
                <Label htmlFor="password" className="text-white/90">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Enter password"
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName" className="text-white/90">Full Name *</Label>
                <Input
                  id="fullName"
                  value={newUser.fullName}
                  onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                  placeholder="Enter full name"
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
              <div>
                <Label htmlFor="department" className="text-white/90">Department</Label>
                <Input
                  id="department"
                  value={newUser.department}
                  onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                  placeholder="e.g., Sales, Production"
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
            </div>
            
            <div className="bg-blue-500/20 border border-blue-400/40 rounded-lg p-4 space-y-3">
              <Label className="text-white text-sm font-semibold">Module Access Permissions</Label>
              <p className="text-gray-300 text-xs">Grant access to additional modules (Basic modules are always enabled)</p>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="perm-accounts"
                    checked={newUser.permissions.accounts}
                    onCheckedChange={(checked) => setNewUser({ ...newUser, permissions: { ...newUser.permissions, accounts: checked } })}
                    className="data-[state=checked]:bg-green-600"
                  />
                  <Label htmlFor="perm-accounts" className="text-white text-sm cursor-pointer">
                    Accounts & Ledger
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="perm-staff"
                    checked={newUser.permissions.staffPayroll}
                    onCheckedChange={(checked) => setNewUser({ ...newUser, permissions: { ...newUser.permissions, staffPayroll: checked } })}
                    className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-green-400 data-[state=checked]:to-emerald-500"
                  />
                  <Label htmlFor="perm-staff" className="text-white/90 text-sm cursor-pointer">
                    Staff & Payroll
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="perm-vendors"
                    checked={newUser.permissions.vendors}
                    onCheckedChange={(checked) => setNewUser({ ...newUser, permissions: { ...newUser.permissions, vendors: checked } })}
                    className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-green-400 data-[state=checked]:to-emerald-500"
                  />
                  <Label htmlFor="perm-vendors" className="text-white/90 text-sm cursor-pointer">
                    Vendor Management
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="perm-festivals"
                    checked={newUser.permissions.festivals}
                    onCheckedChange={(checked) => setNewUser({ ...newUser, permissions: { ...newUser.permissions, festivals: checked } })}
                    className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-green-400 data-[state=checked]:to-emerald-500"
                  />
                  <Label htmlFor="perm-festivals" className="text-white/90 text-sm cursor-pointer">
                    Festival Management
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="perm-users"
                    checked={newUser.permissions.userManagement}
                    onCheckedChange={(checked) => setNewUser({ ...newUser, permissions: { ...newUser.permissions, userManagement: checked } })}
                    className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-green-400 data-[state=checked]:to-emerald-500"
                  />
                  <Label htmlFor="perm-users" className="text-white/90 text-sm cursor-pointer">
                    User Management
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="perm-data"
                    checked={newUser.permissions.dataManagement}
                    onCheckedChange={(checked) => setNewUser({ ...newUser, permissions: { ...newUser.permissions, dataManagement: checked } })}
                    className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-green-400 data-[state=checked]:to-emerald-500"
                  />
                  <Label htmlFor="perm-data" className="text-white/90 text-sm cursor-pointer">
                    Data Management
                  </Label>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setShowUserDialog(false)} className="border-purple-300/30 text-white hover:bg-purple-500/20">
                Cancel
              </Button>
              <Button onClick={handleAddUser} className="bg-blue-600 hover:bg-blue-700">
                Add User
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Permissions Management Dialog */}
      <Dialog open={showPermissionsDialog} onOpenChange={setShowPermissionsDialog}>
        <DialogContent className="backdrop-blur-xl bg-[#1a1a1a]/95 border border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">Manage Permissions</DialogTitle>
            <DialogDescription className="text-gray-400">
              {selectedUser?.fullName} - {selectedUser?.department || 'No Department'}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="backdrop-blur-sm bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/40 rounded-lg p-4 space-y-3">
                <Label className="text-white/90 text-sm font-semibold">Module Access Permissions</Label>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-white/90 text-sm">Accounts & Ledger</Label>
                    <Switch
                      checked={selectedUser.permissions.accounts}
                      onCheckedChange={() => handleTogglePermission('accounts', selectedUser.permissions.accounts)}
                      className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-green-400 data-[state=checked]:to-emerald-500"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-white/90 text-sm">Staff & Payroll</Label>
                    <Switch
                      checked={selectedUser.permissions.staffPayroll}
                      onCheckedChange={() => handleTogglePermission('staffPayroll', selectedUser.permissions.staffPayroll)}
                      className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-green-400 data-[state=checked]:to-emerald-500"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-white/90 text-sm">Vendor Management</Label>
                    <Switch
                      checked={selectedUser.permissions.vendors}
                      onCheckedChange={() => handleTogglePermission('vendors', selectedUser.permissions.vendors)}
                      className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-green-400 data-[state=checked]:to-emerald-500"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-white/90 text-sm">Festival Management</Label>
                    <Switch
                      checked={selectedUser.permissions.festivals}
                      onCheckedChange={() => handleTogglePermission('festivals', selectedUser.permissions.festivals)}
                      className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-green-400 data-[state=checked]:to-emerald-500"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-white/90 text-sm">User Management</Label>
                    <Switch
                      checked={selectedUser.permissions.userManagement}
                      onCheckedChange={() => handleTogglePermission('userManagement', selectedUser.permissions.userManagement)}
                      className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-green-400 data-[state=checked]:to-emerald-500"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-white/90 text-sm">Data Management</Label>
                    <Switch
                      checked={selectedUser.permissions.dataManagement}
                      onCheckedChange={() => handleTogglePermission('dataManagement', selectedUser.permissions.dataManagement)}
                      className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-green-400 data-[state=checked]:to-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button onClick={() => setShowPermissionsDialog(false)} className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600">
                  Done
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}