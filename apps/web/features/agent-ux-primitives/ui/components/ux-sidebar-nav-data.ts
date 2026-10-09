import type { LucideIcon } from "lucide-react";
import {
  HomeIcon,
  InboxIcon,
  LayersIcon,
  ListTodoIcon,
  PackageIcon,
} from "lucide-react";

/**
 * Nav model for UxSidebarNav — sections, items, and the expandable
 * Suppliers group.
 */

export interface NavChild {
  key: string;
  label: string;
}

export interface NavItem {
  badge?: number;
  children?: NavChild[];
  icon: LucideIcon;
  key: string;
  label: string;
  section: string;
}

export const SECTIONS = ["Workspace", "Objects"];

export const ITEMS: NavItem[] = [
  { icon: HomeIcon, key: "home", label: "Home", section: "Workspace" },
  {
    badge: 4,
    icon: ListTodoIcon,
    key: "tasks",
    label: "Agent tasks",
    section: "Workspace",
  },
  { icon: InboxIcon, key: "inbox", label: "Inbox", section: "Workspace" },
  {
    children: [
      { key: "cone-king", label: "Cone King" },
      { key: "maple-orbit", label: "Maple Orbit" },
      { key: "aurora", label: "Aurora Scoops" },
    ],
    icon: LayersIcon,
    key: "suppliers",
    label: "Suppliers",
    section: "Objects",
  },
  {
    icon: PackageIcon,
    key: "inventory",
    label: "Inventory",
    section: "Objects",
  },
];
