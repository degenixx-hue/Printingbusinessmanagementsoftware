import { useState, FormEvent, useRef, ChangeEvent } from 'react';
import { useNavigate } from 'react-router';
import { useData } from '../context/DataContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import { ArrowLeft, Plus, Calendar, Download, Upload, MoreVertical, Edit, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import degenixLogo from 'figma:asset/e686929947131e66770ed743ba284a27b15aa8de.png';
import { DateTimeDisplay } from '../components/DateTimeDisplay';

export default function FestivalManagement() {
  const navigate = useNavigate();
  const { 
    festivals, 
    addFestival, 
    addMultipleFestivals,
    updateFestival, 
    deleteFestival, 
    currentUser 
  } = useData();
  
  const [showDialog, setShowDialog] = useState(false);
  const [editingFestival, setEditingFestival] = useState<string | null>(null);
  const [festivalName, setFestivalName] = useState('');
  const [festivalDate, setFestivalDate] = useState('');
  const [selectedFestivals, setSelectedFestivals] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (!festivalName.trim()) {
      toast.error('Please enter festival name');
      return;
    }
    
    if (!festivalDate) {
      toast.error('Please select festival date');
      return;
    }

    if (editingFestival) {
      updateFestival(editingFestival, {
        name: festivalName,
        date: festivalDate,
      });
      toast.success('Festival updated successfully');
    } else {
      addFestival({
        name: festivalName,
        date: festivalDate,
      });
      toast.success('Festival added successfully');
    }

    // Reset form
    setFestivalName('');
    setFestivalDate('');
    setEditingFestival(null);
    setShowDialog(false);
  };

  const handleEdit = (festival: any) => {
    setEditingFestival(festival.id);
    setFestivalName(festival.name);
    setFestivalDate(festival.date);
    setShowDialog(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this festival?')) {
      deleteFestival(id);
      toast.success('Festival deleted successfully');
    }
  };

  const handleAddNew = () => {
    setEditingFestival(null);
    setFestivalName('');
    setFestivalDate('');
    setShowDialog(true);
  };

  // Sort festivals by date
  const sortedFestivals = [...festivals].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(festivals);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Festivals');
    XLSX.writeFile(workbook, 'festivals.xlsx');
    toast.success('Festivals exported successfully');
  };

  const handleImport = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { raw: false, dateNF: 'yyyy-mm-dd' });

        const festivalsToAdd: Array<{ name: string; date: string }> = [];

        json.forEach((row: any) => {
          try {
            const name = row.name || row.Name || row.NAME || row['Festival Name'] || row['festival name'];
            const dateValue = row.date || row.Date || row.DATE || row['Festival Date'] || row['festival date'];

            if (name && dateValue) {
              // Parse the date - handle different formats
              let formattedDate = '';
              
              // If it's already in YYYY-MM-DD format
              if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
                formattedDate = dateValue;
              } 
              // If it's DD/MM/YYYY format
              else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateValue)) {
                const [day, month, year] = dateValue.split('/');
                formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
              }
              // If it's MM/DD/YYYY format
              else if (/^\d{2}-\d{2}-\d{4}$/.test(dateValue)) {
                const [day, month, year] = dateValue.split('-');
                formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
              }
              // Try parsing as a date object
              else {
                const parsedDate = new Date(dateValue);
                if (!isNaN(parsedDate.getTime())) {
                  formattedDate = parsedDate.toISOString().split('T')[0];
                }
              }

              if (formattedDate) {
                festivalsToAdd.push({
                  name: String(name).trim(),
                  date: formattedDate,
                });
              }
            }
          } catch (error) {
            // Silently skip invalid rows
          }
        });

        if (festivalsToAdd.length > 0) {
          addMultipleFestivals(festivalsToAdd);
          toast.success(`Successfully imported ${festivalsToAdd.length} festival${festivalsToAdd.length > 1 ? 's' : ''}!`);
        } else {
          toast.error('No valid festival data found in the file');
        }
      } catch (error) {
        toast.error('Failed to import festivals. Please check the file format.');
      }
    };
    
    reader.onerror = () => {
      toast.error('Failed to read file. Please try again.');
    };
    
    reader.readAsArrayBuffer(file);
    
    // Reset the input
    e.target.value = '';
  };

  // Bulk delete functions
  const handleToggleSelectAll = () => {
    if (selectedFestivals.length === festivals.length) {
      setSelectedFestivals([]);
    } else {
      setSelectedFestivals(festivals.map(f => f.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedFestivals(prev => 
      prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = () => {
    if (selectedFestivals.length === 0) {
      toast.error('Please select festivals to delete');
      return;
    }

    if (confirm(`Are you sure you want to delete ${selectedFestivals.length} selected festival${selectedFestivals.length > 1 ? 's' : ''}?`)) {
      selectedFestivals.forEach(id => deleteFestival(id));
      setSelectedFestivals([]);
      toast.success(`Successfully deleted ${selectedFestivals.length} festival${selectedFestivals.length > 1 ? 's' : ''}`);
    }
  };

  const handleDeleteAll = () => {
    if (festivals.length === 0) {
      toast.error('No festivals to delete');
      return;
    }

    if (confirm(`Are you sure you want to delete ALL ${festivals.length} festivals? This action cannot be undone!`)) {
      festivals.forEach(festival => deleteFestival(festival.id));
      setSelectedFestivals([]);
      toast.success('All festivals deleted successfully');
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0d1b2a' }}>
      {/* Header */}
      <div className="py-4 px-6" style={{ backgroundColor: '#1a2b4a' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/data-management')}
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
            <div>
              <h1 className="text-white text-2xl font-bold">Festival Management</h1>
              <p className="text-blue-200 text-sm">Manage festivals for creative packages</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <DateTimeDisplay />
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImport}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import Excel
            </Button>
            <Button
              onClick={handleExport}
              className="bg-purple-600 hover:bg-purple-700 text-white"
              disabled={festivals.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
            <Button
              onClick={handleAddNew}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Festival
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mb-6">
            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 backdrop-blur-sm border border-blue-400/30 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-sm">Total Festivals</p>
                  <p className="text-white text-3xl font-bold mt-2">{festivals.length}</p>
                </div>
                <Calendar className="h-12 w-12 text-blue-400" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 backdrop-blur-sm border border-green-400/30 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-200 text-sm">Upcoming Festivals</p>
                  <p className="text-white text-3xl font-bold mt-2">
                    {festivals.filter(f => new Date(f.date) >= new Date()).length}
                  </p>
                </div>
                <Calendar className="h-12 w-12 text-green-400" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 backdrop-blur-sm border border-purple-400/30 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-200 text-sm">This Month</p>
                  <p className="text-white text-3xl font-bold mt-2">
                    {festivals.filter(f => {
                      const festDate = new Date(f.date);
                      const now = new Date();
                      return festDate.getMonth() === now.getMonth() && festDate.getFullYear() === now.getFullYear();
                    }).length}
                  </p>
                </div>
                <Calendar className="h-12 w-12 text-purple-400" />
              </div>
            </div>
          </div>

          {/* Festivals Table */}
          <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg shadow overflow-hidden">
            {/* Bulk Actions Bar */}
            {festivals.length > 0 && (
              <div className="p-4 border-b border-white/20 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedFestivals.length === festivals.length && festivals.length > 0}
                      onCheckedChange={handleToggleSelectAll}
                      className="border-white/40"
                    />
                    <span className="text-white text-sm">
                      {selectedFestivals.length > 0 
                        ? `${selectedFestivals.length} selected` 
                        : 'Select All'
                      }
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedFestivals.length > 0 && (
                    <Button
                      onClick={handleDeleteSelected}
                      className="bg-red-600 hover:bg-red-700 text-white"
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Selected ({selectedFestivals.length})
                    </Button>
                  )}
                  <Button
                    onClick={handleDeleteAll}
                    className="bg-red-700 hover:bg-red-800 text-white"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete All
                  </Button>
                </div>
              </div>
            )}
            <Table>
              <TableHeader>
                <TableRow className="border-b border-white/10 hover:bg-transparent">
                  <TableHead className="text-blue-200 w-[50px]">
                    <span className="sr-only">Select</span>
                  </TableHead>
                  <TableHead className="text-blue-200">Festival Name</TableHead>
                  <TableHead className="text-blue-200">Date</TableHead>
                  <TableHead className="text-blue-200">Status</TableHead>
                  <TableHead className="text-blue-200">Days Until</TableHead>
                  <TableHead className="text-blue-200 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedFestivals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-blue-200 py-8">
                      No festivals added yet. Click "Add Festival" to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedFestivals.map((festival) => {
                    const festivalDate = new Date(festival.date);
                    const today = new Date();
                    const daysUntil = Math.ceil((festivalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    const isPast = festivalDate < today;
                    const isToday = festivalDate.toDateString() === today.toDateString();

                    return (
                      <TableRow key={festival.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <TableCell>
                          <Checkbox
                            checked={selectedFestivals.includes(festival.id)}
                            onCheckedChange={() => handleToggleSelect(festival.id)}
                            className="border-white/40"
                          />
                        </TableCell>
                        <TableCell className="text-white font-medium">{festival.name}</TableCell>
                        <TableCell className="text-blue-100">
                          {new Date(festival.date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </TableCell>
                        <TableCell>
                          {isToday ? (
                            <span className="px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                              Today
                            </span>
                          ) : isPast ? (
                            <span className="px-2 py-1 rounded-full text-xs bg-gray-500/20 text-gray-300 border border-gray-500/30">
                              Past
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-300 border border-green-500/30">
                              Upcoming
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-blue-100">
                          {isToday ? (
                            'Today'
                          ) : isPast ? (
                            `${Math.abs(daysUntil)} days ago`
                          ) : (
                            `In ${daysUntil} days`
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(festival)}
                              className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(festival.id)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Add/Edit Festival Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#1a2b4a] border-white/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingFestival ? 'Edit Festival' : 'Add New Festival'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="festivalName" className="text-white">Festival Name *</Label>
                <Input
                  id="festivalName"
                  type="text"
                  value={festivalName}
                  onChange={(e) => setFestivalName(e.target.value)}
                  placeholder="e.g., Diwali, Christmas, New Year"
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
              <div>
                <Label htmlFor="festivalDate" className="text-white">Festival Date *</Label>
                <Input
                  id="festivalDate"
                  type="date"
                  value={festivalDate}
                  onChange={(e) => setFestivalDate(e.target.value)}
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowDialog(false);
                  setEditingFestival(null);
                  setFestivalName('');
                  setFestivalDate('');
                }}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {editingFestival ? 'Update Festival' : 'Add Festival'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}