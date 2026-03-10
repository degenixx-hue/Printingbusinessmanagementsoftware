import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useData } from '../context/DataContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Dialog,
  DialogContent,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { ArrowLeft, Plus, MoreVertical, Download, Search } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import degenixLogo from 'figma:asset/e686929947131e66770ed743ba284a27b15aa8de.png';
import { DateTimeDisplay } from '../components/DateTimeDisplay';

export default function ClientManagement() {
  const navigate = useNavigate();
  const { clients, addClient, updateClient, deleteClient } = useData();
  const [showDialog, setShowDialog] = useState(false);
  const [editingClient, setEditingClient] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    companyName: '',
    clientName: '',
    contactNumber: '',
    email: '',
    address: '',
    gst: '',
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (editingClient) {
      updateClient(editingClient, formData);
      toast.success('Client updated successfully');
    } else {
      addClient(formData);
      toast.success('Client added successfully');
    }
    handleCloseDialog();
  };

  const handleEdit = (client: any) => {
    setEditingClient(client.id);
    setFormData({
      companyName: client.companyName,
      clientName: client.clientName,
      contactNumber: client.contactNumber,
      email: client.email,
      address: client.address,
      gst: client.gst,
    });
    setShowDialog(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this client?')) {
      deleteClient(id);
      toast.success('Client deleted successfully');
    }
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingClient(null);
    setFormData({
      companyName: '',
      clientName: '',
      contactNumber: '',
      email: '',
      address: '',
      gst: '',
    });
  };

  const exportToExcel = () => {
    const data = clients.map(client => ({
      'Company Name': client.companyName,
      'Client Name': client.clientName,
      'Contact Number': client.contactNumber,
      'Email': client.email,
      'Address': client.address,
      'GST Number': client.gst,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Clients');
    XLSX.writeFile(wb, `clients_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Exported to Excel');
  };

  const filteredClients = clients.filter(client =>
    client.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.contactNumber.includes(searchTerm) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div 
      className="min-h-screen"
      style={{
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%)'
      }}
    >
      {/* Header */}
      <div className="py-6 px-6 bg-[#1a1a1a] border-b border-gray-800 shadow-lg shadow-black/50">
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
            <div>
              <img 
                src={degenixLogo} 
                alt="Degenix Graphics Logo" 
                className="h-14 w-14 object-contain cursor-pointer hover:opacity-80 transition-opacity" 
                onClick={() => navigate('/dashboard')}
              />
            </div>
            <h1 className="text-white text-2xl font-bold">
              Client Management
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <DateTimeDisplay />
            <Button
              variant="ghost"
              size="icon"
              onClick={exportToExcel}
              className="text-white hover:bg-white/10"
            >
              <Download className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-[#1a1a1a] border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>
          <Button 
            onClick={() => setShowDialog(true)} 
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Client
          </Button>
        </div>

        <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-700 hover:bg-white/5">
                <TableHead className="text-gray-300">Company Name</TableHead>
                <TableHead className="text-gray-300">Client Name</TableHead>
                <TableHead className="text-gray-300">Contact Number</TableHead>
                <TableHead className="text-gray-300">Email</TableHead>
                <TableHead className="text-gray-300">GST Number</TableHead>
                <TableHead className="text-right text-gray-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.length === 0 ? (
                <TableRow className="border-b border-gray-700 hover:bg-white/5">
                  <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                    No clients found
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => (
                  <TableRow key={client.id} className="border-b border-gray-700 hover:bg-white/5">
                    <TableCell className="font-medium text-white">{client.companyName}</TableCell>
                    <TableCell className="text-gray-300">{client.clientName}</TableCell>
                    <TableCell className="text-gray-300">{client.contactNumber}</TableCell>
                    <TableCell className="text-gray-300">{client.email}</TableCell>
                    <TableCell className="text-gray-300">{client.gst}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-gray-900 border-gray-700">
                          <DropdownMenuItem onClick={() => handleEdit(client)} className="text-white hover:bg-white/10">
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(client.id)}
                            className="text-red-400 hover:bg-red-500/20"
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#1a1a1a] border border-gray-800 shadow-2xl shadow-black/50" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{editingClient ? 'Edit Client' : 'Add New Client'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="clientName">Client Name *</Label>
                <Input
                  id="clientName"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contactNumber">Contact Number *</Label>
                <Input
                  id="contactNumber"
                  value={formData.contactNumber}
                  onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="address">Address *</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={3}
                required
              />
            </div>
            <div>
              <Label htmlFor="gst">GST Number</Label>
              <Input
                id="gst"
                value={formData.gst}
                onChange={(e) => setFormData({ ...formData, gst: e.target.value })}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit" style={{ backgroundColor: '#1a2b4a' }}>
                {editingClient ? 'Update' : 'Add'} Client
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}