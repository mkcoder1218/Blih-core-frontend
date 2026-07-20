import { CompactSidebar } from './CompactSidebar';
import { DetailedSidebar } from './DetailedSidebar';
import type { SidebarProps } from './sidebarTypes';
import { useSidebarController } from './useSidebarController';

export default function Sidebar(props: SidebarProps) {
  const controller = useSidebarController(props);
  return controller.isDetailedView ? (
    <DetailedSidebar controller={controller} />
  ) : (
    <CompactSidebar controller={controller} />
  );
}

export type { SidebarProps } from './sidebarTypes';
