import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { CreditCard, Wallet, Banknote, Smartphone, HelpCircle } from 'lucide-react';

interface PaymentModeDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (paymentMode: 'Cash' | 'Online' | 'Cheque' | 'UPI' | 'Other') => void;
  amount: number;
  title: string;
  description?: string;
}

export function PaymentModeDialog({
  open,
  onClose,
  onConfirm,
  amount,
  title,
  description
}: PaymentModeDialogProps) {
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'Online' | 'Cheque' | 'UPI' | 'Other'>('Cash');

  const handleConfirm = () => {
    onConfirm(paymentMode);
    onClose();
  };

  const paymentModeIcons = {
    Cash: <Banknote className="h-5 w-5" />,
    Online: <CreditCard className="h-5 w-5" />,
    Cheque: <Wallet className="h-5 w-5" />,
    UPI: <Smartphone className="h-5 w-5" />,
    Other: <HelpCircle className="h-5 w-5" />,
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#1a1a1a] border border-gray-800 shadow-2xl shadow-black/50">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">{title}</DialogTitle>
          <DialogDescription className="text-gray-300">
            {description || `Select payment mode for ₹${amount.toFixed(2)}`}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Amount Display */}
          <div className="p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-xl">
            <div className="text-center">
              <p className="text-sm text-gray-300 mb-1">Payment Amount</p>
              <p className="text-3xl font-bold text-green-300">₹{amount.toFixed(2)}</p>
            </div>
          </div>

          {/* Payment Mode Selection */}
          <div className="space-y-2">
            <Label htmlFor="paymentMode" className="text-white">Payment Mode *</Label>
            <Select value={paymentMode} onValueChange={(value: any) => setPaymentMode(value)}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <div className="flex items-center gap-2">
                  {paymentModeIcons[paymentMode]}
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">
                  <div className="flex items-center gap-2">
                    <Banknote className="h-4 w-4" />
                    <span>Cash</span>
                  </div>
                </SelectItem>
                <SelectItem value="Online">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    <span>Online Transfer</span>
                  </div>
                </SelectItem>
                <SelectItem value="Cheque">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    <span>Cheque</span>
                  </div>
                </SelectItem>
                <SelectItem value="UPI">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    <span>UPI</span>
                  </div>
                </SelectItem>
                <SelectItem value="Other">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4" />
                    <span>Other</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Info Message */}
          <div className="p-3 bg-blue-500/10 border border-blue-400/20 rounded-lg">
            <p className="text-xs text-blue-200">
              💡 This payment mode will be recorded in the accounts ledger for tracking purposes.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="border-white/20 text-white hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            className="bg-gradient-to-r from-[#2196F3] to-[#1976D2] hover:from-[#1976D2] hover:to-[#1565C0] text-white"
          >
            Confirm Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}