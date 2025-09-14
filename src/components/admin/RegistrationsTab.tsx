import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, FileDown, Edit, Trash2, Check, X, RotateCcw, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import EditRegistrationDialog from './EditRegistrationDialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface Registration {
  id: string;
  customer_id: string;
  full_name: string;
  mobile_number: string;
  address: string;
  ward: string;
  agent: string;
  status: string;
  fee: number;
  created_at: string;
  approved_date: string;
  approved_by: string;
  expiry_date: string;
  category_id: string;
  preference_category_id?: string;
  panchayath_id?: string;
  categories: {
    name_english: string;
    name_malayalam: string;
  };
  preference_categories?: {
    name_english: string;
    name_malayalam: string;
  };
  panchayaths?: {
    name: string;
    district: string;
  };
}

const RegistrationsTab = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [panchayaths, setPanchayaths] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [panchayathFilter, setPanchayathFilter] = useState('all');
  const [editingRegistration, setEditingRegistration] = useState<Registration | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [expiryFilter, setExpiryFilter] = useState('');

  useEffect(() => {
    fetchRegistrations();
    fetchCategories();
    fetchPanchayaths();
  }, []);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select(`
          *,
          categories!registrations_category_id_fkey (name_english, name_malayalam),
          preference_categories:categories!registrations_preference_category_id_fkey (name_english, name_malayalam),
          panchayaths (name, district)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching registrations:', error);
        toast.error('Error fetching registrations');
      } else {
        console.log('Fetched registrations:', data);
        setRegistrations(data as unknown as Registration[] || []);
      }
    } catch (error) {
      console.error('Error fetching registrations:', error);
      toast.error('Error fetching registrations');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('name_english');
    
    if (data) setCategories(data);
  };

  const fetchPanchayaths = async () => {
    const { data } = await supabase
      .from('panchayaths')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (data) setPanchayaths(data);
  };

  const updateRegistrationStatus = async (id: string, status: string) => {
    try {
      let updateData: any = { 
        status,
        ...(status === 'approved' && {
          approved_date: new Date().toISOString(),
          approved_by: 'eva' // Admin username
        })
      };

      // If approving and no expiry date exists, calculate it from category
      if (status === 'approved') {
        const registration = registrations.find(r => r.id === id);
        if (registration && !registration.expiry_date) {
          const category = categories.find(c => c.id === registration.category_id);
          const expiryDays = category?.expiry_days || 30;
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + expiryDays);
          updateData.expiry_date = expiryDate.toISOString();
        }
      }

      const { error } = await supabase
        .from('registrations')
        .update(updateData)
        .eq('id', id);

      if (error) {
        toast.error('Error updating status');
      } else {
        toast.success(`Registration ${status} successfully`);
        fetchRegistrations();
      }
    } catch (error) {
      toast.error('Error updating status');
    }
  };

  const deleteRegistration = async (id: string) => {
    if (!confirm('Are you sure you want to delete this registration?')) return;

    try {
      const { error } = await supabase
        .from('registrations')
        .delete()
        .eq('id', id);

      if (error) {
        toast.error('Error deleting registration');
      } else {
        toast.success('Registration deleted successfully');
        fetchRegistrations();
      }
    } catch (error) {
      toast.error('Error deleting registration');
    }
  };

  const restoreRegistration = async (id: string) => {
    if (!confirm('Are you sure you want to restore this registration to pending status?')) return;

    try {
      const { error } = await supabase
        .from('registrations')
        .update({ 
          status: 'pending',
          approved_date: null,
          approved_by: null
        })
        .eq('id', id);

      if (error) {
        toast.error('Error restoring registration');
      } else {
        toast.success('Registration restored to pending status');
        fetchRegistrations();
      }
    } catch (error) {
      toast.error('Error restoring registration');
    }
  };

  const handleExportCSV = async () => {
    try {
      // Create CSV data with only requested fields
      const headers = ['Name', 'Mobile Number', 'Ward', 'Panchayath', 'Category', 'Registered Date', 'Expiry Date'];
      const csvData = [
        headers.join(','),
        ...filteredRegistrations.map(reg => [
          `"${reg.full_name}"`,
          reg.mobile_number,
          `"${reg.ward || 'N/A'}"`,
          `"${reg.panchayaths?.name || 'N/A'}"`,
          `"${reg.categories?.name_english || 'N/A'}"`,
          format(new Date(reg.created_at), 'dd/MM/yyyy'),
          reg.expiry_date ? format(new Date(reg.expiry_date), 'dd/MM/yyyy') : 'N/A'
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `registrations-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Registrations exported to CSV successfully');
    } catch (error) {
      toast.error('Error exporting registrations');
    }
  };

  const handleExportPDF = async () => {
    try {
      // Create HTML content for PDF
      const htmlContent = `
        <html>
          <head>
            <title>Registrations Report</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                margin: 20px; 
                font-size: 12px;
                line-height: 1.4;
              }
              h1 { 
                color: #333; 
                border-bottom: 2px solid #007bff; 
                padding-bottom: 10px; 
                margin-bottom: 20px;
              }
              .summary {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 5px;
                margin-bottom: 20px;
              }
              .registration { 
                border: 1px solid #ddd; 
                margin: 10px 0; 
                padding: 15px; 
                border-radius: 5px; 
                page-break-inside: avoid;
              }
              .header { 
                font-weight: bold; 
                color: #007bff; 
                font-size: 14px;
                margin-bottom: 8px;
              }
              .details {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
                margin-bottom: 8px;
              }
              .detail-item {
                margin-bottom: 4px;
              }
              .label {
                font-weight: bold;
                color: #666;
              }
              .status {
                display: inline-block;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 11px;
                font-weight: bold;
                text-transform: uppercase;
              }
              .status-pending { background: #fff3cd; color: #856404; }
              .status-approved { background: #d4edda; color: #155724; }
              .status-rejected { background: #f8d7da; color: #721c24; }
              .expiry-warning { color: #fd7e14; font-weight: bold; }
              @media print {
                body { margin: 0; }
                .registration { break-inside: avoid; }
              }
            </style>
          </head>
          <body>
            <h1>Registrations Report</h1>
            <div class="summary">
              <p><strong>Generated on:</strong> ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
              <p><strong>Total registrations:</strong> ${filteredRegistrations.length}</p>
              <p><strong>Status breakdown:</strong></p>
              <ul>
                <li>Pending: ${filteredRegistrations.filter(r => r.status === 'pending').length}</li>
                <li>Approved: ${filteredRegistrations.filter(r => r.status === 'approved').length}</li>
                <li>Rejected: ${filteredRegistrations.filter(r => r.status === 'rejected').length}</li>
              </ul>
            </div>
            ${filteredRegistrations.map(reg => `
              <div class="registration">
                <div class="header">${reg.full_name} (${reg.customer_id})</div>
                <div class="details">
                  <div>
                    <div class="detail-item"><span class="label">Mobile:</span> ${reg.mobile_number}</div>
                    <div class="detail-item"><span class="label">Address:</span> ${reg.address}</div>
                    <div class="detail-item"><span class="label">Panchayath:</span> ${reg.panchayaths?.name || 'N/A'}</div>
                  </div>
                  <div>
                    <div class="detail-item"><span class="label">Category:</span> ${reg.categories?.name_english || 'N/A'}</div>
                    <div class="detail-item"><span class="label">Fee:</span> ₹${reg.fee}</div>
                    <div class="detail-item">
                      <span class="label">Status:</span> 
                      <span class="status status-${reg.status}">${reg.status}</span>
                    </div>
                  </div>
                </div>
                <div class="details">
                  <div class="detail-item"><span class="label">Registered:</span> ${format(new Date(reg.created_at), 'dd/MM/yyyy')}</div>
                  ${reg.approved_date ? `<div class="detail-item"><span class="label">Approved:</span> ${format(new Date(reg.approved_date), 'dd/MM/yyyy')}</div>` : ''}
                  ${reg.expiry_date ? `<div class="detail-item ${Math.ceil((new Date(reg.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) <= 30 ? 'expiry-warning' : ''}"><span class="label">Expires:</span> ${format(new Date(reg.expiry_date), 'dd/MM/yyyy')}</div>` : ''}
                </div>
              </div>
            `).join('')}
          </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.print();
        toast.success('PDF export initiated - use your browser print dialog');
      } else {
        toast.error('Unable to open print window - please check popup blockers');
      }
    } catch (error) {
      toast.error('Error exporting to PDF');
    }
  };

  const handleEditRegistration = (registration: Registration) => {
    setEditingRegistration(registration);
    setShowEditDialog(true);
  };

  const handleEditSuccess = () => {
    fetchRegistrations();
    setShowEditDialog(false);
    setEditingRegistration(null);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getCategoryColor = (categoryName: string) => {
    const isJobCard = categoryName.toLowerCase().includes('job card');
    if (isJobCard) {
      return {
        bg: 'bg-gradient-to-r from-yellow-100 to-yellow-200',
        text: 'text-yellow-900',
        badge: 'bg-yellow-500 text-white',
        border: 'border-l-4 border-yellow-500'
      };
    }
    
    const colorIndex = Math.abs(categoryName.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % 6;
    const colors = [
      {
        bg: 'bg-gradient-to-r from-blue-50 to-blue-100',
        text: 'text-blue-900',
        badge: 'bg-blue-500 text-white',
        border: 'border-l-4 border-blue-500'
      },
      {
        bg: 'bg-gradient-to-r from-green-50 to-green-100',
        text: 'text-green-900',
        badge: 'bg-green-500 text-white',
        border: 'border-l-4 border-green-500'
      },
      {
        bg: 'bg-gradient-to-r from-purple-50 to-purple-100',
        text: 'text-purple-900',
        badge: 'bg-purple-500 text-white',
        border: 'border-l-4 border-purple-500'
      },
      {
        bg: 'bg-gradient-to-r from-orange-50 to-orange-100',
        text: 'text-orange-900',
        badge: 'bg-orange-500 text-white',
        border: 'border-l-4 border-orange-500'
      },
      {
        bg: 'bg-gradient-to-r from-pink-50 to-pink-100',
        text: 'text-pink-900',
        badge: 'bg-pink-500 text-white',
        border: 'border-l-4 border-pink-500'
      },
      {
        bg: 'bg-gradient-to-r from-indigo-50 to-indigo-100',
        text: 'text-indigo-900',
        badge: 'bg-indigo-500 text-white',
        border: 'border-l-4 border-indigo-500'
      }
    ];
    return colors[colorIndex];
  };

  const filteredRegistrations = registrations.filter(reg => {
    const matchesSearch = searchQuery === '' || 
      reg.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.mobile_number.includes(searchQuery) ||
      reg.customer_id.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesStatus = statusFilter === 'all' || reg.status === statusFilter;
    // When using expiry filter, only show Pending status regardless of selected status
    if (expiryFilter !== '') {
      matchesStatus = reg.status === 'pending';
    }
    const matchesCategory = categoryFilter === 'all' || reg.categories?.name_english === categoryFilter;
    const matchesPanchayath = panchayathFilter === 'all' || reg.panchayaths?.name === panchayathFilter;
    
    const matchesExpiry = expiryFilter === '' || (() => {
      // Always exclude approved registrations (finished)
      if (reg.status === 'approved') return false;

      const filterDays = parseInt(expiryFilter);
      if (Number.isNaN(filterDays)) return false;

      // Determine effective expiry date
      const category = categories.find((c) => c.id === reg.category_id);
      const expiryDays = category?.expiry_days ?? 30;

      let effectiveExpiry: Date;
      if (reg.expiry_date) {
        effectiveExpiry = new Date(reg.expiry_date);
      } else {
        const d = new Date(reg.created_at);
        d.setDate(d.getDate() + expiryDays);
        effectiveExpiry = d;
      }

      const daysLeft = Math.ceil((effectiveExpiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

      // If filter is 0, show all expired registrations (including negative days)
      if (filterDays === 0) {
        return daysLeft <= 0;
      }

      // For other values, show registrations expiring within that number of days
      return daysLeft <= filterDays && daysLeft >= 0;
    })();

    return matchesSearch && matchesStatus && matchesCategory && matchesPanchayath && matchesExpiry;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registration Management</CardTitle>
        <div className="space-y-3 mt-4">
          {/* Search Bar - Full width on mobile */}
          <div className="w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, mobile, or customer ID"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
          </div>

          {/* Filters - Responsive grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name_english}>
                    {cat.name_english}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={panchayathFilter} onValueChange={setPanchayathFilter}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Panchayath" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Panchayaths</SelectItem>
                {panchayaths.map((pan) => (
                  <SelectItem key={pan.id} value={pan.name}>
                    {pan.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="Expires within days"
              value={expiryFilter}
              onChange={(e) => setExpiryFilter(e.target.value)}
              className="text-xs"
              type="number"
              min="0"
            />

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="text-xs">
                  <FileDown className="w-3 h-3 mr-1" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2">
                <div className="space-y-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-start text-xs"
                    onClick={handleExportCSV}
                  >
                    <FileDown className="w-3 h-3 mr-2" />
                    Export CSV
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-start text-xs"
                    onClick={handleExportPDF}
                  >
                    <FileText className="w-3 h-3 mr-2" />
                    Export PDF
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 sm:p-6">
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[120px]">Customer ID</TableHead>
                      <TableHead className="min-w-[150px]">Name</TableHead>
                      <TableHead className="min-w-[120px]">Mobile</TableHead>
                      <TableHead className="min-w-[200px]">Address</TableHead>
                      <TableHead className="min-w-[120px]">Panchayath</TableHead>
                      <TableHead className="min-w-[180px]">Category</TableHead>
                      <TableHead className="min-w-[100px]">Status</TableHead>
                      <TableHead className="min-w-[80px]">Fee</TableHead>
                      <TableHead className="min-w-[140px]">Important Dates</TableHead>
                      <TableHead className="min-w-[140px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRegistrations.map((reg) => {
                      const categoryColor = getCategoryColor(reg.categories?.name_english || '');
                      return (
                        <TableRow key={reg.id} className={`${categoryColor.bg} ${categoryColor.border} hover:opacity-80 transition-opacity`}>
                           <TableCell className="font-medium font-mono text-xs truncate">{reg.customer_id}</TableCell>
                           <TableCell className="p-2">
                             <div className="font-medium text-sm truncate">{reg.full_name}</div>
                           </TableCell>
                           <TableCell className="p-2">
                             <div className="text-sm">{reg.mobile_number}</div>
                           </TableCell>
                           <TableCell className="p-2">
                             <div className="text-sm truncate" title={reg.address}>{reg.address}</div>
                           </TableCell>
                           <TableCell className="p-2">
                             <div className="text-sm truncate">
                               {reg.panchayaths?.name || 'N/A'}
                             </div>
                           </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              <div className="text-sm">
                                <Badge className={`${categoryColor.badge} font-bold`}>
                                  {reg.categories?.name_english}
                                </Badge>
                                <div className={`text-xs mt-1 font-malayalam ${categoryColor.text}`}>
                                  {reg.categories?.name_malayalam}
                                </div>
                              </div>
                              {reg.preference_categories && (
                                <div className="text-xs border-t pt-1">
                                  <div className="text-muted-foreground">Preference:</div>
                                  <div className={categoryColor.text}>{reg.preference_categories.name_english}</div>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <Badge className={getStatusBadgeColor(reg.status)}>
                                {reg.status}
                              </Badge>
                              {reg.approved_by && (
                                <div className="text-xs text-muted-foreground">
                                  by {reg.approved_by}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm font-medium">₹{reg.fee}</TableCell>
                          <TableCell>
                            <div className="space-y-1 text-xs">
                              <div>
                                <span className="text-muted-foreground">Reg:</span> {format(new Date(reg.created_at), 'dd/MM/yy')}
                              </div>
                              {reg.approved_date && (
                                <div>
                                  <span className="text-muted-foreground">App:</span> {format(new Date(reg.approved_date), 'dd/MM/yy')}
                                </div>
                              )}
                              {reg.expiry_date && (
                                <div className={Math.ceil((new Date(reg.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) <= 30 ? 'text-orange-600' : 'text-muted-foreground'}>
                                  <span>Exp:</span> {format(new Date(reg.expiry_date), 'dd/MM/yy')}
                                  <div className="text-xs">
                                    ({Math.ceil((new Date(reg.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}d)
                                  </div>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditRegistration(reg)}
                                title="Edit Registration"
                                className="h-7 w-7 p-0"
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              
                              {reg.status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateRegistrationStatus(reg.id, 'approved')}
                                    title="Approve"
                                    className="h-7 w-7 p-0 text-green-600"
                                  >
                                    <Check className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateRegistrationStatus(reg.id, 'rejected')}
                                    title="Reject"
                                    className="h-7 w-7 p-0 text-red-600"
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </>
                              )}
                              
                              {(reg.status === 'approved' || reg.status === 'rejected') && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => restoreRegistration(reg.id)}
                                  title="Restore to Pending"
                                  className="h-7 w-7 p-0 text-blue-600"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                </Button>
                              )}
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deleteRegistration(reg.id)}
                                title="Delete"
                                className="h-7 w-7 p-0 text-red-600"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4 p-4">
              {filteredRegistrations.map((reg) => {
                const categoryColor = getCategoryColor(reg.categories?.name_english || '');
                return (
                  <Card key={reg.id} className={`${categoryColor.bg} ${categoryColor.border}`}>
                    <CardContent className="p-4 space-y-3">
                      {/* Header with Customer ID and Status */}
                      <div className="flex justify-between items-start">
                        <div className="font-mono text-sm font-bold">{reg.customer_id}</div>
                        <Badge className={getStatusBadgeColor(reg.status)}>
                          {reg.status}
                        </Badge>
                      </div>
                      
                      {/* Contact Information */}
                      <div className="space-y-1">
                        <div className="font-medium">{reg.full_name}</div>
                        <div className="text-sm text-muted-foreground">{reg.mobile_number}</div>
                        <div className="text-sm text-muted-foreground">{reg.address}</div>
                        {reg.panchayaths && (
                          <div className="text-sm text-muted-foreground">
                            {reg.panchayaths.name}
                          </div>
                        )}
                      </div>

                      {/* Category */}
                      <div className="space-y-1">
                        <Badge className={`${categoryColor.badge} text-xs`}>
                          {reg.categories?.name_english}
                        </Badge>
                        <div className={`text-xs ${categoryColor.text}`}>
                          {reg.categories?.name_malayalam}
                        </div>
                        {reg.preference_categories && (
                          <div className="text-xs pt-1">
                            <span className="text-muted-foreground">Preference: </span>
                            <span className={categoryColor.text}>{reg.preference_categories.name_english}</span>
                          </div>
                        )}
                      </div>

                      {/* Fee and Dates */}
                      <div className="flex justify-between items-center text-sm">
                        <div className="font-medium">₹{reg.fee}</div>
                        <div className="text-right space-y-1 text-xs">
                          <div>
                            <span className="text-muted-foreground">Reg: </span>
                            {format(new Date(reg.created_at), 'dd/MM/yy')}
                          </div>
                          {reg.expiry_date && (
                            <div className={Math.ceil((new Date(reg.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) <= 30 ? 'text-orange-600' : 'text-muted-foreground'}>
                              <span>Exp: </span>
                              {format(new Date(reg.expiry_date), 'dd/MM/yy')}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 pt-2 border-t">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditRegistration(reg)}
                          className="flex-1"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        
                        {reg.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateRegistrationStatus(reg.id, 'approved')}
                              className="flex-1 text-green-600"
                            >
                              <Check className="w-3 h-3 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateRegistrationStatus(reg.id, 'rejected')}
                              className="flex-1 text-red-600"
                            >
                              <X className="w-3 h-3 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        
                        {(reg.status === 'approved' || reg.status === 'rejected') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => restoreRegistration(reg.id)}
                            className="flex-1 text-blue-600"
                          >
                            <RotateCcw className="w-3 h-3 mr-1" />
                            Restore
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteRegistration(reg.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </CardContent>

      <EditRegistrationDialog
        registration={editingRegistration}
        isOpen={showEditDialog}
        onClose={() => {
          setShowEditDialog(false);
          setEditingRegistration(null);
        }}
        onSuccess={handleEditSuccess}
      />
    </Card>
  );
};

export default RegistrationsTab;
