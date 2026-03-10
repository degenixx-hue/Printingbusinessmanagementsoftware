import { useState, useRef, ChangeEvent, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useData } from '../context/DataContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
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
import { ArrowLeft, Plus, Edit, Trash2, Download, Upload, Image as ImageIcon, Calendar, Sparkles, Megaphone, FileText, CheckCircle2, Circle, X, Package } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import degenixLogo from 'figma:asset/e686929947131e66770ed743ba284a27b15aa8de.png';
import { DateTimeDisplay } from '../components/DateTimeDisplay';

export default function CreativePackageTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    quotations, 
    clients, 
    creativePackages, 
    addCreativePackage, 
    updateCreativePackage, 
    getCreativePackageById,
    festivals
  } = useData();

  const quotation = quotations.find(q => q.id === id);
  const client = quotation ? clients.find(c => c.id === quotation.clientId) : null;
  // Find ANY digital creative item in the quotation
  const creativeItem = quotation?.items.find(item => 
    item.digitalCreative && 
    item.creativePackageType && 
    item.creativeDateFrom && 
    item.creativeDateTo
  );

  // Get or create creative package tracking
  const existingPackage = useMemo(() => {
    return creativePackages.find(p => p.quotationId === id);
  }, [creativePackages, id]);

  useEffect(() => {
    if (!existingPackage && quotation && creativeItem && client) {
      // Automatically create package with default values
      const requestedCount = creativeItem.designCount || 52;
      
      // Only apply 52 limit for Festive packages, Ads packages have no limit
      const MAX_FESTIVE_DESIGNS = 52;
      const isFestive = creativeItem.creativePackageType === 'Festive';
      const designCount = isFestive ? Math.min(requestedCount, MAX_FESTIVE_DESIGNS) : requestedCount;
      
      const designs = Array.from({ length: designCount }, (_, i) => ({
        id: `design-${Date.now()}-${i}`,
        designNumber: i + 1,
        title: `Design ${i + 1}`,
        isDelivered: false,
      }));

      // Use creativeDateTo or current date for festival date
      const festDate = creativeItem.creativeDateTo || new Date().toISOString().split('T')[0];
      
      // Generate package name based on type
      const packageName = creativeItem.creativePackageType === 'Festive' 
        ? `${client.companyName} - Festive Package`
        : `${client.companyName} - Ads Package`;
      
      const newPackage = {
        quotationId: quotation.id,
        clientId: client.id,
        festivalName: packageName,
        festivalDate: festDate,
        packageType: creativeItem.creativePackageType,
        totalDesigns: designCount,
        designsDelivered: 0,
        designs,
      };

      addCreativePackage(newPackage);
      
      if (isFestive && requestedCount > MAX_FESTIVE_DESIGNS) {
        toast.warning(`Festive package capped at ${MAX_FESTIVE_DESIGNS} designs (requested: ${requestedCount})`);
      } else {
        toast.success('Package tracking initialized');
      }
    }
  }, [existingPackage, quotation, creativeItem, client, addCreativePackage]);

  const handleImportFestivalList = () => {
    if (!existingPackage) return;
    
    if (festivals.length === 0) {
      toast.error('No festivals found in Festival Management. Please add festivals first.');
      return;
    }

    // Maximum design limit
    const MAX_DESIGNS = 52;

    // Sort festivals by date
    const sortedFestivals = [...festivals].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Check if festival list exceeds the limit
    if (sortedFestivals.length > MAX_DESIGNS) {
      toast.error(`Cannot import ${sortedFestivals.length} festivals. Maximum limit is ${MAX_DESIGNS} designs. Please reduce the festival list first.`);
      return;
    }

    // Create designs from ALL festivals in the list with proper numbering
    const festivalDesigns = sortedFestivals.map((festival, index) => ({
      id: `festival-${Date.now()}-${index}-${Math.random()}`,
      designNumber: index + 1,
      title: festival.name,
      festivalDate: festival.date,
      isDelivered: false,
    }));

    // Update the package with festival designs and update total count
    updateCreativePackage(existingPackage.id, {
      designs: festivalDesigns,
      totalDesigns: festivalDesigns.length,
      designsDelivered: 0, // Reset delivered count since we're importing fresh
    });

    toast.success(`Imported ${festivalDesigns.length} festival${festivalDesigns.length > 1 ? 's' : ''} into design list (${MAX_DESIGNS - festivalDesigns.length} slots remaining)`);
  };

  const handleToggleDesign = (designId: string) => {
    if (!existingPackage) return;

    const updatedDesigns = existingPackage.designs.map(d => {
      if (d.id === designId) {
        return {
          ...d,
          isDelivered: !d.isDelivered,
          deliveryDate: !d.isDelivered ? new Date().toISOString() : undefined,
        };
      }
      return d;
    });

    const deliveredCount = updatedDesigns.filter(d => d.isDelivered).length;

    updateCreativePackage(existingPackage.id, {
      designs: updatedDesigns,
      designsDelivered: deliveredCount,
    });

    toast.success(updatedDesigns.find(d => d.id === designId)?.isDelivered ? 'Design marked as delivered' : 'Design marked as pending');
  };

  const handleUpdateDesignTitle = (designId: string, title: string) => {
    if (!existingPackage) return;

    const updatedDesigns = existingPackage.designs.map(d => 
      d.id === designId ? { ...d, title } : d
    );

    updateCreativePackage(existingPackage.id, {
      designs: updatedDesigns,
    });
  };

  const handleUpdateDeliveryDate = (designId: string, date: string) => {
    if (!existingPackage) return;

    const updatedDesigns = existingPackage.designs.map(d => 
      d.id === designId ? { ...d, deliveryDate: date } : d
    );

    updateCreativePackage(existingPackage.id, {
      designs: updatedDesigns,
    });

    toast.success('Delivery date updated');
  };

  const handleImageUpload = (designId: string, file: File) => {
    if (!existingPackage) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      
      const updatedDesigns = existingPackage.designs.map(d => 
        d.id === designId ? { ...d, deliveryImage: base64String } : d
      );

      updateCreativePackage(existingPackage.id, {
        designs: updatedDesigns,
      });

      toast.success('Image uploaded successfully');
    };

    reader.readAsDataURL(file);
  };

  const handleRemoveImage = (designId: string) => {
    if (!existingPackage) return;

    const updatedDesigns = existingPackage.designs.map(d => 
      d.id === designId ? { ...d, deliveryImage: undefined } : d
    );

    updateCreativePackage(existingPackage.id, {
      designs: updatedDesigns,
    });

    toast.success('Image removed');
  };

  const handleUpdateFestivalDate = (designId: string, date: string) => {
    if (!existingPackage) return;

    const updatedDesigns = existingPackage.designs.map(d =>
      d.id === designId ? { ...d, festivalDate: date } : d
    );

    updateCreativePackage(existingPackage.id, {
      designs: updatedDesigns,
    });
  };

  const exportToExcel = () => {
    if (!existingPackage) return;

    const data = existingPackage.designs.map((design, index) => ({
      'Design #': design.designNumber || (index + 1),
      'Title': design.title,
      'Festival Date': design.festivalDate ? new Date(design.festivalDate).toLocaleDateString() : '-',
      'Status': design.isDelivered ? 'Delivered' : 'Pending',
      'Delivery Date': design.deliveryDate ? new Date(design.deliveryDate).toLocaleDateString() : '-',
      'Notes': design.notes || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Design Tracking');
    
    // Add summary
    const summaryData = [
      { 'Metric': 'Festival', 'Value': existingPackage.festivalName },
      { 'Metric': 'Festival Date', 'Value': new Date(existingPackage.festivalDate).toLocaleDateString() },
      { 'Metric': 'Client', 'Value': client?.companyName || '' },
      { 'Metric': 'Total Designs', 'Value': existingPackage.totalDesigns },
      { 'Metric': 'Delivered', 'Value': existingPackage.designsDelivered },
      { 'Metric': 'Remaining', 'Value': existingPackage.totalDesigns - existingPackage.designsDelivered },
      { 'Metric': 'Progress', 'Value': `${Math.round((existingPackage.designsDelivered / existingPackage.totalDesigns) * 100)}%` },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    XLSX.writeFile(wb, `${existingPackage.festivalName}_designs_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Exported to Excel');
  };

  if (!quotation || !client || !creativeItem) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0d1b2a' }}>
        <div className="text-center text-white">
          <p className="text-xl">Package not found</p>
          <Button onClick={() => navigate('/creative-packages')} className="mt-4">
            Back to Packages
          </Button>
        </div>
      </div>
    );
  }

  const progress = existingPackage 
    ? Math.round((existingPackage.designsDelivered / existingPackage.totalDesigns) * 100)
    : 0;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0d1b2a' }}>
      {/* Header */}
      <div className="py-6 px-6" style={{ backgroundColor: '#1a2b4a' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/creative-packages')}
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
              <h1 className="text-white text-3xl font-bold flex items-center gap-2">
                {existingPackage?.packageType === 'Festive' ? (
                  <Sparkles className="h-8 w-8 text-purple-400" />
                ) : (
                  <Megaphone className="h-8 w-8 text-orange-400" />
                )}
                {existingPackage?.festivalName || 'Creative Package'}
              </h1>
              <p className="text-gray-300 mt-1">
                Design delivery tracking for {client.companyName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <DateTimeDisplay />
            {existingPackage && (
              <Button
                onClick={exportToExcel}
                className="bg-green-600 hover:bg-green-700"
              >
                <FileText className="mr-2 h-4 w-4" />
                Export to Excel
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {existingPackage ? (
          <>
            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 backdrop-blur-sm border border-purple-400/30 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-200 text-sm">Festival</p>
                    <p className="text-white text-xl font-bold mt-1">{existingPackage.festivalName}</p>
                  </div>
                  <Calendar className="h-10 w-10 text-purple-400" />
                </div>
                <div className="mt-2 text-xs text-purple-300">
                  Date: {new Date(existingPackage.festivalDate).toLocaleDateString()}
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 backdrop-blur-sm border border-blue-400/30 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-200 text-sm">Total Designs</p>
                    <p className="text-white text-2xl font-bold mt-1">{existingPackage.totalDesigns}</p>
                  </div>
                  <Package className="h-10 w-10 text-blue-400" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 backdrop-blur-sm border border-green-400/30 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-200 text-sm">Delivered</p>
                    <p className="text-white text-2xl font-bold mt-1">{existingPackage.designsDelivered}</p>
                  </div>
                  <CheckCircle2 className="h-10 w-10 text-green-400" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 backdrop-blur-sm border border-orange-400/30 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-200 text-sm">Remaining</p>
                    <p className="text-white text-2xl font-bold mt-1">
                      {existingPackage.totalDesigns - existingPackage.designsDelivered}
                    </p>
                  </div>
                  <Circle className="h-10 w-10 text-orange-400" />
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white font-semibold">Overall Progress</h3>
                <span className="text-white font-bold text-xl">{progress}%</span>
              </div>
              <Progress value={progress} className="h-4" />
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>{existingPackage.designsDelivered} delivered</span>
                <span>{existingPackage.totalDesigns - existingPackage.designsDelivered} remaining</span>
              </div>
            </div>

            {/* Design List */}
            <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-semibold text-lg">Design Delivery Tracking</h3>
                    <p className="text-gray-400 text-sm mt-1">Click on designs to mark as delivered or update titles</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {existingPackage.packageType === 'Festive' && existingPackage.totalDesigns >= 52 && (
                      <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 px-3 py-1">
                        <span className="font-semibold">Festive Limit Reached (52/52)</span>
                      </Badge>
                    )}
                    {existingPackage.packageType === 'Ads' && (
                      <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 px-3 py-1">
                        <span className="font-semibold">Ads Package ({existingPackage.totalDesigns} designs)</span>
                      </Badge>
                    )}
                    {existingPackage.packageType === 'Festive' && (
                      <Button
                        onClick={handleImportFestivalList}
                        className="bg-purple-600 hover:bg-purple-700"
                        size="sm"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Import Festival List
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-white/20 hover:bg-white/5">
                    <TableHead className="text-gray-200 w-[80px]">#</TableHead>
                    <TableHead className="text-gray-200">Design Title</TableHead>
                    <TableHead className="text-gray-200">Festival Date</TableHead>
                    <TableHead className="text-gray-200">Status</TableHead>
                    <TableHead className="text-gray-200">Delivery Date</TableHead>
                    <TableHead className="text-gray-200">Image</TableHead>
                    <TableHead className="text-right text-gray-200">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {existingPackage.designs.map((design) => (
                    <TableRow 
                      key={design.id} 
                      className={`border-b border-white/20 hover:bg-white/5 ${design.isDelivered ? 'bg-green-500/5' : ''}`}
                    >
                      <TableCell className="text-gray-200 font-mono">
                        {(design.designNumber || 0).toString().padStart(2, '0')}
                      </TableCell>
                      <TableCell className="text-gray-200">
                        <Input
                          value={design.title}
                          onChange={(e) => handleUpdateDesignTitle(design.id, e.target.value)}
                          className="bg-transparent border-none text-white focus:bg-white/5"
                          placeholder="Enter design title"
                        />
                      </TableCell>
                      <TableCell className="text-gray-200 text-sm">
                        <Input
                          type="date"
                          value={design.festivalDate ? new Date(design.festivalDate).toISOString().split('T')[0] : ''}
                          onChange={(e) => handleUpdateFestivalDate(design.id, e.target.value)}
                          className="bg-purple-500/10 border-purple-500/30 text-white w-40"
                          placeholder="Festival date"
                        />
                      </TableCell>
                      <TableCell>
                        {design.isDelivered ? (
                          <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Delivered
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                            <Circle className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-200 text-sm">
                        <Input
                          type="date"
                          value={design.deliveryDate ? new Date(design.deliveryDate).toISOString().split('T')[0] : ''}
                          onChange={(e) => handleUpdateDeliveryDate(design.id, e.target.value)}
                          className="bg-white/5 border-white/20 text-white w-40"
                          placeholder="When delivered"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {design.deliveryImage ? (
                            <div className="relative group">
                              <img
                                src={design.deliveryImage}
                                alt={design.title}
                                className="h-12 w-12 object-cover rounded border border-white/20 cursor-pointer"
                                onClick={() => window.open(design.deliveryImage, '_blank')}
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemoveImage(design.id)}
                                className="absolute -top-2 -right-2 h-5 w-5 p-0 bg-red-500 hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <label className="cursor-pointer">
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleImageUpload(design.id, file);
                                }}
                              />
                              <div className="flex items-center gap-1 px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded border border-blue-500/30 transition-colors">
                                <Upload className="h-3 w-3" />
                                <span className="text-xs">Upload</span>
                              </div>
                            </label>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => handleToggleDesign(design.id)}
                          className={design.isDelivered 
                            ? "bg-orange-600 hover:bg-orange-700"
                            : "bg-green-600 hover:bg-green-700"
                          }
                        >
                          {design.isDelivered ? 'Mark Pending' : 'Mark Delivered'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        ) : (
          <div className="text-center text-white py-12">
            <Package className="h-16 w-16 mx-auto text-purple-400 mb-4" />
            <p className="text-xl">Setting up package...</p>
          </div>
        )}
      </div>
    </div>
  );
}