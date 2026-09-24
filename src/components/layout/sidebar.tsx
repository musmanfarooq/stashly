import { SidebarContent } from "./sidebar-content";

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-sidebar-border md:flex">
      <SidebarContent />
    </aside>
  );
}
