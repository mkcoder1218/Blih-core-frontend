import { BriefcaseBusiness } from 'lucide-react';

import type { MainModule } from '../../types';

import { CompactSidebar } from './CompactSidebar';
import { DetailedSidebar } from './DetailedSidebar';
import type { SidebarProps } from './sidebarTypes';
import { useSidebarController } from './useSidebarController';

const INTERN_PROJECT_TABS = new Set(['mine', 'my-tasks', 'board']);

export default function Sidebar(props: SidebarProps) {
  const controller = useSidebarController(props);
  const isIntern = props.user?.employmentType === 'intern';

  const internProjectsModule: (typeof controller.mainModules)[number] = {
    id: 'projects',
    label: 'Projects',
    icon: BriefcaseBusiness,
    badge: 0,
  };

  const internMainModules: typeof controller.mainModules = controller.mainModules.some(
    (module) => module.id === 'projects',
  )
    ? controller.mainModules
    : [...controller.mainModules, internProjectsModule];

  const visibleController = isIntern
    ? {
        ...controller,
        mainModules: internMainModules,
        projectsTabs: controller.projectsTabs.filter((tab) =>
          INTERN_PROJECT_TABS.has(tab.id),
        ),
        handleModuleClick: (moduleId: MainModule) => {
          if (moduleId !== 'projects') {
            controller.handleModuleClick(moduleId);
            return;
          }

          controller.setCurrentModule('projects');
          controller.setCurrentProjectsTab('mine');
          controller.setIsDetailedView(true);
          controller.navigate('/projects/my-projects');
          controller.onMobileClose?.();
        },
      }
    : controller;

  return visibleController.isDetailedView ? (
    <DetailedSidebar controller={visibleController} />
  ) : (
    <CompactSidebar controller={visibleController} />
  );
}

export type { SidebarProps } from './sidebarTypes';
