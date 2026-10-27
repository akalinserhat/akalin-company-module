/**
 * @akalin/company_module - Modül İkon Sabitleri (constants/moduleIcons.ts)
 */

import React from 'react';
import {
  Boxes,
  ShieldCheck,
  Package,
  LayoutDashboard,
  Users,
  ShoppingCart,
  FileText,
  Coins,
  Warehouse,
  ScanBarcode,
  Barcode,
  HardDrive,
  Settings,
  MapPin,
  HelpCircle,
  Bell,
  Lock,
  Building2,
  Bot,
  Database,
  Mail,
  Cloud,
  Landmark,
  Search,
  FileCode,
  Sliders,
  Cpu,
  Activity,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const MODULE_ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  LayoutDashboard,
  Building2,
  Users,
  Package,
  Boxes,
  ShoppingCart,
  FileText,
  Coins,
  Warehouse,
  ScanBarcode,
  Barcode,
  HardDrive,
  Settings,
  MapPin,
  HelpCircle,
  Bell,
  Lock,
  Bot,
  Database,
  Mail,
  Cloud,
  Landmark,
  ShieldCheck,
  Search,
  FileCode,
  Sliders,
  Cpu,
  Activity,
  CheckCircle2,
  AlertCircle
};

export function renderModuleIcon(iconName?: string, size = 18, className?: string): React.ReactNode {
  const IconComp = iconName && MODULE_ICON_MAP[iconName] ? MODULE_ICON_MAP[iconName] : Package;
  return React.createElement(IconComp, { size, className });
}
