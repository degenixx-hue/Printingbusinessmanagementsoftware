import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useData } from '../context/DataContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { Switch } from '../components/ui/switch';
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
import { Download, Upload, LogOut, Menu, Search, Edit, Trash2, Package, Plus, ArrowLeft, MoreVertical, X, Settings } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import degenixLogo from 'figma:asset/e686929947131e66770ed743ba284a27b15aa8de.png';
import { DateTimeDisplay } from '../components/DateTimeDisplay';

export default function ProductManagement() {
  const navigate = useNavigate();
  const { products, addProduct, updateProduct, deleteProduct } = useData();
  const [showDialog, setShowDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newCategory, setNewCategory] = useState('');
  
  // Default categories stored in localStorage
  const getCategories = (): string[] => {
    const stored = localStorage.getItem('productCategories');
    if (stored) {
      return JSON.parse(stored);
    }
    // Default categories
    const defaults = [
      'Digital Creative',
      'Brochure',
      'Catalogue',
      'Leaflet',
      'Pamphlet',
      'Flyer',
      'Poster',
      'Banner',
      'ID Card',
      'Letter Pad',
      'Envelope',
      'Visiting Card',
      'Sticker',
      'Tag',
      'Other'
    ];
    localStorage.setItem('productCategories', JSON.stringify(defaults));
    return defaults;
  };

  const [categories, setCategories] = useState<string[]>(getCategories());

  const [formData, setFormData] = useState({
    productName: '',
    productCategory: '',
    size: '',
    coverPageQuantity: 0,
    coverPageGsm: 0,
    innerPageQuantity: 0,
    innerPageGsm: 0,
    laminationType: 'None' as 'None' | 'Gloss' | 'Spot' | 'Velvet Spot',
    uv: false,
    goldFoiling: false,
    digitalCreative: false,
    designCount: 52,
    purchasePrice: 0,
    pricePerUnit: 0,
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      updateProduct(editingProduct, formData);
      toast.success('Product updated successfully');
    } else {
      addProduct(formData);
      toast.success('Product added successfully');
    }
    handleCloseDialog();
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product.id);
    setFormData({
      productName: product.productName,
      productCategory: product.productCategory,
      size: product.size,
      coverPageQuantity: product.coverPageQuantity,
      coverPageGsm: product.coverPageGsm,
      innerPageQuantity: product.innerPageQuantity,
      innerPageGsm: product.innerPageGsm,
      laminationType: product.laminationType,
      uv: product.uv,
      goldFoiling: product.goldFoiling,
      digitalCreative: product.digitalCreative,
      designCount: product.designCount,
      purchasePrice: product.purchasePrice,
      pricePerUnit: product.pricePerUnit,
    });
    setShowDialog(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      deleteProduct(id);
      toast.success('Product deleted successfully');
    }
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingProduct(null);
    setFormData({
      productName: '',
      productCategory: '',
      size: '',
      coverPageQuantity: 0,
      coverPageGsm: 0,
      innerPageQuantity: 0,
      innerPageGsm: 0,
      laminationType: 'None',
      uv: false,
      goldFoiling: false,
      digitalCreative: false,
      designCount: 52,
      purchasePrice: 0,
      pricePerUnit: 0,
    });
  };

  const exportToExcel = () => {
    const data = products.map(product => ({
      'Product Name': product.productName,
      'Category': product.productCategory,
      'Size': product.size,
      'Cover Page Qty': product.coverPageQuantity,
      'Cover Page GSM': product.coverPageGsm,
      'Inner Page Qty': product.innerPageQuantity,
      'Inner Page GSM': product.innerPageGsm,
      'Lamination': product.laminationType,
      'UV': product.uv ? 'Yes' : 'No',
      'Gold Foiling': product.goldFoiling ? 'Yes' : 'No',
      'Digital Creative': product.digitalCreative ? 'Yes' : 'No',
      'Design Count': product.designCount,
      'Purchase Price': product.purchasePrice,
      'Price Per Unit': product.pricePerUnit,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Products');
    XLSX.writeFile(wb, `products_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Exported to Excel');
  };

  const filteredProducts = products.filter(product =>
    product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.productCategory.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort products alphabetically by product name
  const sortedProducts = [...filteredProducts].sort((a, b) => 
    a.productName.localeCompare(b.productName)
  );

  const handleAddCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      const updatedCategories = [...categories, newCategory.trim()].sort();
      setCategories(updatedCategories);
      localStorage.setItem('productCategories', JSON.stringify(updatedCategories));
      toast.success('Category added successfully');
      setNewCategory('');
      setShowCategoryDialog(false);
    } else if (categories.includes(newCategory.trim())) {
      toast.error('Category already exists');
    } else {
      toast.error('Category name cannot be empty');
    }
  };

  const handleRemoveCategory = (category: string) => {
    // Check if category is in use
    const isInUse = products.some(product => product.productCategory === category);
    if (isInUse) {
      toast.error('Cannot remove category - it is being used by products');
      return;
    }
    
    if (confirm(`Are you sure you want to remove the category "${category}"?`)) {
      const updatedCategories = categories.filter(cat => cat !== category);
      setCategories(updatedCategories);
      localStorage.setItem('productCategories', JSON.stringify(updatedCategories));
      toast.success('Category removed successfully');
    }
  };

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
              Product Management
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
              placeholder="Search products..."
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
            Add Product
          </Button>
        </div>

        <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-700 hover:bg-white/5">
                <TableHead className="text-gray-200">Product Name</TableHead>
                <TableHead className="text-gray-200">Category</TableHead>
                <TableHead className="text-gray-200">Size</TableHead>
                <TableHead className="text-gray-200">Cover</TableHead>
                <TableHead className="text-gray-200">Inner</TableHead>
                <TableHead className="text-gray-200">Lamination</TableHead>
                <TableHead className="text-gray-200">UV</TableHead>
                <TableHead className="text-gray-200">Gold Foiling</TableHead>
                <TableHead className="text-gray-200">Creative</TableHead>
                <TableHead className="text-gray-200">Design Count</TableHead>
                <TableHead className="text-gray-200">Price/Unit</TableHead>
                <TableHead className="text-right text-gray-200">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedProducts.length === 0 ? (
                <TableRow className="border-b border-white/20 hover:bg-white/5">
                  <TableCell colSpan={12} className="text-center text-gray-300 py-8">
                    No products found
                  </TableCell>
                </TableRow>
              ) : (
                sortedProducts.map((product) => (
                  <TableRow key={product.id} className="border-b border-white/20 hover:bg-white/5">
                    <TableCell className="font-medium text-gray-200">
                      <div className="flex items-center gap-2">
                        {product.productName}
                        {product.digitalCreative && (
                          <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                            Creative
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-200">{product.productCategory}</TableCell>
                    <TableCell className="text-gray-200">{product.size}</TableCell>
                    <TableCell className="text-gray-200">{product.coverPageQuantity} @ {product.coverPageGsm}gsm</TableCell>
                    <TableCell className="text-gray-200">{product.innerPageQuantity} @ {product.innerPageGsm}gsm</TableCell>
                    <TableCell className="text-gray-200">{product.laminationType}</TableCell>
                    <TableCell className="text-gray-200">{product.uv ? 'Yes' : 'No'}</TableCell>
                    <TableCell className="text-gray-200">{product.goldFoiling ? 'Yes' : 'No'}</TableCell>
                    <TableCell className="text-gray-200">{product.digitalCreative ? 'Yes' : 'No'}</TableCell>
                    <TableCell className="text-gray-200">{product.designCount}</TableCell>
                    <TableCell className="text-gray-200">₹{product.pricePerUnit.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(product)}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(product.id)}
                            className="text-red-600"
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-[#1a1a1a] border border-gray-800 shadow-2xl shadow-black/50" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="productName">Product Name *</Label>
                <Input
                  id="productName"
                  value={formData.productName}
                  onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                  required
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="productCategory">Product Category *</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCategoryDialog(true)}
                    className="text-blue-400 hover:text-blue-300 h-auto p-1"
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Manage
                  </Button>
                </div>
                <Select
                  value={formData.productCategory}
                  onValueChange={(value) => {
                    // Auto-enable Digital Creative if category is "Digital Creative"
                    if (value === 'Digital Creative') {
                      setFormData({ ...formData, productCategory: value, digitalCreative: true });
                    } else {
                      setFormData({ ...formData, productCategory: value });
                    }
                  }}
                >
                  <SelectTrigger id="productCategory">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="size">Size *</Label>
              <Input
                id="size"
                placeholder="e.g., A4, A5, Custom"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                required
              />
            </div>
            {/* Cover and Inner Page fields only show when editing */}
            {editingProduct && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="coverPageQuantity">Cover Page Quantity *</Label>
                    <Input
                      id="coverPageQuantity"
                      type="number"
                      value={formData.coverPageQuantity}
                      onChange={(e) => setFormData({ ...formData, coverPageQuantity: parseInt(e.target.value) || 0 })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="coverPageGsm">Cover Page GSM *</Label>
                    <Input
                      id="coverPageGsm"
                      type="number"
                      value={formData.coverPageGsm}
                      onChange={(e) => setFormData({ ...formData, coverPageGsm: parseInt(e.target.value) || 0 })}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="innerPageQuantity">Inner Page Quantity *</Label>
                    <Input
                      id="innerPageQuantity"
                      type="number"
                      value={formData.innerPageQuantity}
                      onChange={(e) => setFormData({ ...formData, innerPageQuantity: parseInt(e.target.value) || 0 })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="innerPageGsm">Inner Page GSM *</Label>
                    <Input
                      id="innerPageGsm"
                      type="number"
                      value={formData.innerPageGsm}
                      onChange={(e) => setFormData({ ...formData, innerPageGsm: parseInt(e.target.value) || 0 })}
                      required
                    />
                  </div>
                </div>
              </>
            )}
            <div>
              <Label htmlFor="laminationType">Lamination Type *</Label>
              <Select
                value={formData.laminationType}
                onValueChange={(value: any) => setFormData({ ...formData, laminationType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="None">None</SelectItem>
                  <SelectItem value="Gloss">Gloss</SelectItem>
                  {!editingProduct && (
                    <>
                      <SelectItem value="Matte">Matte</SelectItem>
                      <SelectItem value="Velvet">Velvet</SelectItem>
                    </>
                  )}
                  {editingProduct && (
                    <>
                      <SelectItem value="Matte">Matte</SelectItem>
                      <SelectItem value="Velvet">Velvet</SelectItem>
                      <SelectItem value="Spot">Spot</SelectItem>
                      <SelectItem value="Velvet Spot">Velvet Spot</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="uv">U/V Coating</Label>
                <Switch
                  id="uv"
                  checked={formData.uv}
                  onCheckedChange={(checked) => setFormData({ ...formData, uv: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="goldFoiling">Gold Foiling</Label>
                <Switch
                  id="goldFoiling"
                  checked={formData.goldFoiling}
                  onCheckedChange={(checked) => setFormData({ ...formData, goldFoiling: checked })}
                />
              </div>
            </div>
            
            {/* Digital Creative Section - Prominent */}
            <div className={`border-2 rounded-lg p-4 transition-all ${
              formData.digitalCreative 
                ? 'border-blue-500 bg-blue-500/10' 
                : 'border-gray-600 bg-gray-800/30'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="digitalCreative" className="text-base font-semibold text-gray-200">
                    Digital Creative Package
                  </Label>
                  {formData.digitalCreative && (
                    <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                      Will show in Creative Quotations
                    </span>
                  )}
                </div>
                <Switch
                  id="digitalCreative"
                  checked={formData.digitalCreative}
                  onCheckedChange={(checked) => setFormData({ ...formData, digitalCreative: checked })}
                />
              </div>
              <p className={`text-sm ${formData.digitalCreative ? 'text-blue-200' : 'text-gray-400'}`}>
                {formData.digitalCreative 
                  ? '✓ This product will appear in Creative Quotation dropdown for digital creative packages'
                  : 'Toggle ON to make this product available in Creative Quotations'
                }
              </p>
            </div>
            {formData.digitalCreative && (
              <div>
                <Label htmlFor="designCount">Number of Designs *</Label>
                <Input
                  id="designCount"
                  type="number"
                  min="1"
                  value={formData.designCount}
                  onChange={(e) => setFormData({ ...formData, designCount: parseInt(e.target.value) || 0 })}
                  placeholder="e.g., 52 for yearly package"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">Enter the total number of designs included in this package</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="purchasePrice">Purchase/Cost Price (₹)</Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  step="0.01"
                  value={formData.purchasePrice}
                  onChange={(e) => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-400 mt-1">Cost price for profit/loss analysis</p>
              </div>
              <div>
                <Label htmlFor="pricePerUnit">Selling Price (₹) *</Label>
                <Input
                  id="pricePerUnit"
                  type="number"
                  step="0.01"
                  value={formData.pricePerUnit}
                  onChange={(e) => setFormData({ ...formData, pricePerUnit: parseFloat(e.target.value) || 0 })}
                  required
                />
                <p className="text-xs text-gray-400 mt-1">Final selling price per unit</p>
              </div>
            </div>
            {formData.purchasePrice > 0 && formData.pricePerUnit > 0 && (
              <div className="bg-blue-600/10 border border-blue-500/30 rounded-lg p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">Profit Margin:</span>
                  <span className={`font-bold ${
                    formData.pricePerUnit > formData.purchasePrice ? 'text-green-400' : 'text-red-400'
                  }`}>
                    ₹{(formData.pricePerUnit - formData.purchasePrice).toFixed(2)} ({
                      formData.purchasePrice > 0 
                        ? ((formData.pricePerUnit - formData.purchasePrice) / formData.purchasePrice * 100).toFixed(2)
                        : 0
                    }%)
                  </span>
                </div>
              </div>
            )}
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit" style={{ backgroundColor: '#1a2b4a' }}>
                {editingProduct ? 'Update' : 'Add'} Product
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Manage Categories Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#1a1a1a] border border-gray-800 shadow-2xl shadow-black/50" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Manage Product Categories</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Add New Category */}
            <div className="border border-gray-700 rounded-lg p-4 bg-[#0f0f0f]">
              <Label htmlFor="newCategory" className="text-gray-200 mb-2 block">Add New Category</Label>
              <div className="flex gap-2">
                <Input
                  id="newCategory"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Enter category name"
                  className="flex-1 bg-[#1a1a1a] border-gray-700 text-white"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCategory();
                    }
                  }}
                />
                <Button 
                  type="button"
                  onClick={handleAddCategory}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>

            {/* Existing Categories */}
            <div className="border border-gray-700 rounded-lg p-4 bg-[#0f0f0f]">
              <Label className="text-gray-200 mb-3 block">Existing Categories ({categories.length})</Label>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {categories.map((category) => {
                  const isInUse = products.some(p => p.productCategory === category);
                  return (
                    <div 
                      key={category} 
                      className="flex items-center justify-between p-3 bg-[#1a1a1a] border border-gray-700 rounded-lg hover:bg-[#252525] transition-colors"
                    >
                      <span className="text-gray-200 font-medium">{category}</span>
                      <div className="flex items-center gap-2">
                        {isInUse && (
                          <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
                            In use
                          </span>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveCategory(category)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8 p-0"
                          disabled={isInUse}
                          title={isInUse ? 'Cannot remove - in use by products' : 'Remove category'}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end">
              <Button 
                type="button"
                variant="outline" 
                onClick={() => {
                  setShowCategoryDialog(false);
                  setNewCategory('');
                }}
                className="border-gray-700 text-gray-200 hover:bg-white/10"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}