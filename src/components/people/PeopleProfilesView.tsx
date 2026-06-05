import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrganogram, useEmployees, useDeleteEmployee } from '../../hooks/useHrRecords';
import {
  Users, CheckSquare, Calendar, Clock, TrendingUp, Plus, Search, Sparkles, Trash2, Copy, ChevronRight,
  ChevronLeft,
  Download,
  Award,
  FileText,
  Filter,
  Check,
  Eye,
  Briefcase,
  ExternalLink,
  MoreVertical,
  Pencil,
  Trash,
  Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import PeopleProfileDraftsPanel from './drafts/PeopleProfileDraftsPanel';
import CreateEmployeeModal from './CreateEmployeeModal';
import BulkEmployeeImportPage from '../../pages/BulkEmployeeImportPage';
import { StatCard, StatCardGrid, UserAvatar } from '@/components/ui/blih';

interface OrgNode {
  id: string;
  name: string;
  title: string;
  department: string;
  avatar?: string;
  children: OrgNode[];
}

// ─── Layout constants ─────────────────────────────────────────────────────────
const NODE_W = 160;
const NODE_H = 80;
const H_GAP  = 40;   // horizontal gap between siblings
const V_GAP  = 80;   // vertical gap between levels

// ─── Measure subtree width ────────────────────────────────────────────────────
function subtreeWidth(node: OrgNode): number {
  if (node.children.length === 0) return NODE_W;
  const childrenTotal = node.children.reduce((s, c) => s + subtreeWidth(c), 0);
  const gaps = (node.children.length - 1) * H_GAP;
  return Math.max(NODE_W, childrenTotal + gaps);
}

// ─── Assign x/y to every node ────────────────────────────────────────────────
interface PositionedNode {
  node: OrgNode;
  x: number;
  y: number;
  children: PositionedNode[];
}

function layoutTree(node: OrgNode, x: number, y: number): PositionedNode {
  if (node.children.length === 0) {
    return { node, x, y, children: [] };
  }
  const widths = node.children.map(subtreeWidth);
  const totalW = widths.reduce((s, w) => s + w, 0) + (node.children.length - 1) * H_GAP;
  let cursor = x - totalW / 2;
  const positioned: PositionedNode[] = node.children.map((child, i) => {
    const cw = widths[i];
    const cx = cursor + cw / 2;
    cursor += cw + H_GAP;
    return layoutTree(child, cx, y + NODE_H + V_GAP);
  });
  return { node, x, y, children: positioned };
}

// ─── Collect all nodes + edges ────────────────────────────────────────────────
function collectNodes(pn: PositionedNode, nodes: PositionedNode[], edges: { x1:number;y1:number;x2:number;y2:number }[]) {
  nodes.push(pn);
  pn.children.forEach(child => {
    edges.push({
      x1: pn.x,
      y1: pn.y + NODE_H,
      x2: child.x,
      y2: child.y,
    });
    collectNodes(child, nodes, edges);
  });
}

// ─── Bounding box ─────────────────────────────────────────────────────────────
function getBounds(nodes: PositionedNode[]) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  nodes.forEach(n => {
    minX = Math.min(minX, n.x - NODE_W / 2);
    minY = Math.min(minY, n.y);
    maxX = Math.max(maxX, n.x + NODE_W / 2);
    maxY = Math.max(maxY, n.y + NODE_H);
  });
  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
}

// ─── Single node card ─────────────────────────────────────────────────────────
function OrgCard({ pn, onSelect }: { pn: PositionedNode; onSelect: (n: OrgNode) => void }) {
  const { node, x, y } = pn;
  const initials = node.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  const hasChildren = node.children.length > 0;

  return (
    <div
      onClick={() => onSelect(node)}
      style={{
        position: 'absolute',
        left: x - NODE_W / 2,
        top: y,
        width: NODE_W,
        height: NODE_H,
      }}
      className={`cursor-pointer group select-none`}
    >
      <div className={`w-full h-full bg-white rounded-xl border-2 ${hasChildren ? 'border-blue-500' : 'border-slate-200'} shadow-sm hover:shadow-md hover:border-blue-400 transition-all flex flex-col items-center justify-center px-2 py-2 relative`}>
        {node.department && (
          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[7px] font-black uppercase tracking-widest bg-blue-600 text-white px-2 py-0.5 rounded-full whitespace-nowrap">
            {node.department}
          </span>
        )}
        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-[10px] mb-1 flex-shrink-0">
          {node.avatar
            ? <img src={node.avatar} className="w-full h-full rounded-full object-cover" alt={initials} />
            : initials}
        </div>
        <p className="text-[10px] font-black text-slate-900 truncate w-full text-center leading-tight">{node.name}</p>
        <p className="text-[8px] text-slate-400 font-semibold truncate w-full text-center mt-0.5">{node.title}</p>
      </div>
    </div>
  );
}

// ─── Full org chart canvas ────────────────────────────────────────────────────
function OrgChartCanvas({ roots, onSelect }: { roots: OrgNode[]; onSelect: (n: OrgNode) => void }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const [scale, setScale] = React.useState(1);
  const dragging = React.useRef(false);
  const lastPos = React.useRef({ x: 0, y: 0 });

  // Build layout for all roots side by side
  const allNodes: PositionedNode[] = [];
  const allEdges: { x1:number;y1:number;x2:number;y2:number }[] = [];

  let cursor = 0;
  const rootLayouts: PositionedNode[] = roots.map(root => {
    const sw = subtreeWidth(root);
    const layout = layoutTree(root, cursor + sw / 2, 0);
    cursor += sw + H_GAP * 2;
    return layout;
  });

  rootLayouts.forEach(rl => collectNodes(rl, allNodes, allEdges));

  const bounds = allNodes.length > 0 ? getBounds(allNodes) : { minX: 0, minY: 0, w: 400, h: 300 };
  const PAD = 60;
  const canvasW = bounds.w + PAD * 2;
  const canvasH = bounds.h + PAD * 2;
  const offsetX = -bounds.minX + PAD;
  const offsetY = -bounds.minY + PAD;

  // Center on mount
  React.useEffect(() => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const fitScale = Math.min(1, (clientWidth - 40) / canvasW, (clientHeight - 40) / canvasH);
    setScale(fitScale);
    setPan({
      x: (clientWidth - canvasW * fitScale) / 2,
      y: (clientHeight - canvasH * fitScale) / 2,
    });
  }, [roots.length]);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(s => Math.min(2, Math.max(0.2, s * delta)));
  };

  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setPan(p => ({ x: p.x + dx, y: p.y + dy }));
  };

  const onMouseUp = () => { dragging.current = false; };

  const zoomIn  = () => setScale(s => Math.min(2, parseFloat((s * 1.2).toFixed(3))));
  const zoomOut = () => setScale(s => Math.max(0.2, parseFloat((s / 1.2).toFixed(3))));
  const resetView = () => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const fitScale = Math.min(1, (clientWidth - 40) / canvasW, (clientHeight - 40) / canvasH);
    setScale(fitScale);
    setPan({ x: (clientWidth - canvasW * fitScale) / 2, y: (clientHeight - canvasH * fitScale) / 2 });
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden relative bg-[#f8fafc] cursor-grab active:cursor-grabbing"
      onWheel={onWheel}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      {/* Dot grid background */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.4 }}>
        <defs>
          <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="#cbd5e1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dots)" />
      </svg>

      {/* Transformed canvas */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          transformOrigin: '0 0',
          position: 'absolute',
          width: canvasW,
          height: canvasH,
        }}
      >
        {/* SVG connectors */}
        <svg
          style={{ position: 'absolute', top: 0, left: 0, width: canvasW, height: canvasH, overflow: 'visible', pointerEvents: 'none' }}
        >
          {allEdges.map((e, i) => {
            const x1 = e.x1 + offsetX;
            const y1 = e.y1 + offsetY;
            const x2 = e.x2 + offsetX;
            const y2 = e.y2 + offsetY;
            const midY = (y1 + y2) / 2;
            return (
              <path
                key={i}
                d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
                fill="none"
                stroke="#93c5fd"
                strokeWidth="1.5"
                strokeDasharray="none"
              />
            );
          })}
        </svg>

        {/* Node cards */}
        {allNodes.map((pn, i) => (
          <OrgCard
            key={pn.node.id || i}
            pn={{ ...pn, x: pn.x + offsetX, y: pn.y + offsetY }}
            onSelect={onSelect}
          />
        ))}
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex items-center gap-1">
        <button
          onClick={(e) => { e.stopPropagation(); zoomOut(); }}
          className="w-7 h-7 bg-white border border-slate-200 rounded-lg shadow-sm flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors text-sm font-black select-none"
          title="Zoom out"
        >−</button>
        <button
          onClick={(e) => { e.stopPropagation(); resetView(); }}
          className="h-7 px-2 bg-white border border-slate-200 rounded-lg shadow-sm flex items-center justify-center text-[10px] font-black text-slate-500 hover:bg-slate-50 hover:border-slate-300 transition-colors select-none min-w-[44px]"
          title="Reset view"
        >{Math.round(scale * 100)}%</button>
        <button
          onClick={(e) => { e.stopPropagation(); zoomIn(); }}
          className="w-7 h-7 bg-white border border-slate-200 rounded-lg shadow-sm flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors text-sm font-black select-none"
          title="Zoom in"
        >+</button>
      </div>
    </div>
  );
}

interface PeopleProfilesViewProps {
  currentProfilesTab: 'overview' | 'create' | 'bulk_create' | 'organogram' | 'directory' | 'events' | 'archive';
  onDraftAiSuggestion: (context: string) => void;
  showAlert: (title: string, type?: 'success' | 'info' | 'error') => void;
  onViewProfile?: (employee: any) => void;
}

export default function PeopleProfilesView({
  currentProfilesTab,
  onDraftAiSuggestion,
  showAlert,
  onViewProfile,
}: PeopleProfilesViewProps) {
  const navigate = useNavigate();
  // Directory & Archive Selection States
  const [selectedDirectoryRow, setSelectedDirectoryRow] = useState<number>(0);
  const [selectedArchiveRow, setSelectedArchiveRow] = useState<number>(0);

  // Search/Filters states
  const [directionSearch, setDirectionSearch] = useState<string>('');
  const [deptFilter, setDeptFilter] = useState<string>('Marketing');
  const [archiveSearch, setArchiveSearch] = useState<string>('');
  const [archiveDeptFilter, setArchiveDeptFilter] = useState<string>('Marketing');

  // Interactive Form Creation States (Create Tab)
  // Draft creation UI is handled in PeopleProfileDraftsPanel

  const [activeEventCategory, setActiveEventCategory] = useState<'birthdays' | 'anniversaries' | 'promotions' | 'holidays'>('birthdays');

  // Organogram & Directory — React Query hooks
  const [currentPage, setCurrentPage] = useState(1);
  const employeesPerPage = 10;
  const [activeActionsMenu, setActiveActionsMenu] = useState<string | null>(null);
  const [updateEmployeeModalOpen, setUpdateEmployeeModalOpen] = useState(false);
  const [updateEmployeeUserId, setUpdateEmployeeUserId] = useState<string | null>(null);

  const { data: orgResult, isLoading: loadingOrg, refetch: refetchOrg } = useOrganogram();
  const orgData: OrgNode[] = (orgResult as any) ?? [];

  const { data: empResult, isLoading: loadingEmployees, refetch: refetchEmployees } = useEmployees({
    limit: employeesPerPage,
    offset: (currentPage - 1) * employeesPerPage,
  });
  const employees: any[] = empResult?.employees ?? [];
  const totalEmployees: number = empResult?.total ?? 0;

  const deleteEmployeeMutation = useDeleteEmployee();

  const fetchOrganogram = () => refetchOrg();
  const fetchEmployees = (page: number = 1) => {
    setCurrentPage(page);
    refetchEmployees();
  };

  const handleDeleteEmployee = async (userId: string) => {
    if (!window.confirm("Are you sure you want to delete this employee record?")) return;
    try {
      await deleteEmployeeMutation.mutateAsync(userId);
      showAlert("Employee record deleted successfully", "success");
    } catch (e: any) {
      showAlert(e.message || "Failed to delete record", "error");
    }
  };




  // Job Application Frequency Data points for matching graph curves
  const monthlyChartData = [
    { month: 'Jan', value: 130 },
    { month: 'Feb', value: 140 },
    { month: 'Mar', value: 160 },
    { month: 'Apr', value: 100 },
    { month: 'May', value: 150 },
    { month: 'Jun', value: 140 },
    { month: 'Jul', value: 175 },
    { month: 'Aug', value: 115 },
    { month: 'Sep', value: 145 },
    { month: 'Oct', value: 155 },
    { month: 'Nov', value: 140 },
    { month: 'Dec', value: 105 },
  ];

  return (
    <div className="h-full flex flex-col space-y-6">
      <AnimatePresence mode="wait">

        {/* --- 1. OVERVIEW SCREEN (IMAGE 1) --- */}
        {currentProfilesTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Top row of three large key indicators */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl border border-slate-100 p-6 flex justify-between items-center shadow-xs">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Active Onboarding</span>
                  <span className="text-3xl font-black text-slate-900 mt-2 block tracking-tight">12</span>
                </div>
                <div className="w-12 h-12 bg-blue-50/70 border border-blue-100/30 rounded-full flex items-center justify-center text-blue-600">
                  <Users className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 p-6 flex justify-between items-center shadow-xs">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Completed This Month</span>
                  <span className="text-3xl font-black text-slate-900 mt-2 block tracking-tight">28</span>
                </div>
                <div className="w-12 h-12 bg-emerald-50/70 border border-emerald-100/30 rounded-full flex items-center justify-center text-emerald-600">
                  <CheckSquare className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 p-6 flex justify-between items-center shadow-xs">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">On Probation</span>
                  <span className="text-3xl font-black text-slate-900 mt-2 block tracking-tight">45</span>
                </div>
                <div className="w-12 h-12 bg-blue-50/70 border border-blue-100/30 rounded-full flex items-center justify-center text-blue-600">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Work Hours Performance Card Container */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Work Hours Performance</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* 1. Daily Card */}
                <div className="bg-slate-50 border border-slate-100/50 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between h-[150px]">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-800">Daily</span>
                    <Clock className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <span className="text-3xl font-black text-blue-600 tracking-tight block">8.5h</span>
                    <span className="text-[10px] text-slate-400 block font-medium mt-0.5">Target: 8h</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-slate-500">
                      <span>Performance</span>
                      <span className="text-blue-600">106%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full" style={{ width: '100%' }} />
                    </div>
                  </div>
                </div>

                {/* 2. Monthly Card */}
                <div className="bg-slate-50 border border-slate-100/50 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between h-[150px]">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-800">Monthly</span>
                    <Calendar className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <span className="text-3xl font-black text-blue-600 tracking-tight block">168h</span>
                    <span className="text-[10px] text-slate-400 block font-medium mt-0.5">Target: 160h</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-slate-500">
                      <span>Performance</span>
                      <span className="text-blue-600">105%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full" style={{ width: '100%' }} />
                    </div>
                  </div>
                </div>

                {/* 3. Annually Card */}
                <div className="bg-slate-50 border border-slate-100/50 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between h-[150px]">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-800">Annually</span>
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <span className="text-3xl font-black text-blue-600 tracking-tight block">2016h</span>
                    <span className="text-[10px] text-slate-400 block font-medium mt-0.5">Target: 1920h</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-slate-500">
                      <span>Performance</span>
                      <span className="text-blue-600">105%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full" style={{ width: '100%' }} />
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Job Application Frequency Graph Block */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Job Application Frequency</h3>

              <div className="relative pt-2 h-[260px] w-full">
                {/* Visual SVG Line Graph mimicking perfect bezier dots connectors */}
                <svg className="w-full h-full" viewBox="0 0 1000 240" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <line x1="50" y1="20" x2="980" y2="20" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3,3" />
                  <line x1="50" y1="65" x2="980" y2="65" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3,3" />
                  <line x1="50" y1="110" x2="980" y2="110" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3,3" />
                  <line x1="50" y1="155" x2="980" y2="155" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3,3" />
                  <line x1="50" y1="200" x2="980" y2="200" stroke="#f1f5f9" strokeWidth="1" />

                  {/* Y Axis text labels */}
                  <text x="35" y="24" className="text-[10px] font-medium fill-slate-400" textAnchor="end">180</text>
                  <text x="35" y="69" className="text-[10px] font-medium fill-slate-400" textAnchor="end">135</text>
                  <text x="35" y="114" className="text-[10px] font-medium fill-slate-400" textAnchor="end">90</text>
                  <text x="35" y="159" className="text-[10px] font-medium fill-slate-400" textAnchor="end">45</text>
                  <text x="35" y="204" className="text-[10px] font-medium fill-slate-400" textAnchor="end">0</text>

                  {/* Chart Line Path */}
                  <path
                    d="M 50,130 C 90,120 120,110 160,115 C 200,120 240,90 280,100 C 320,110 360,145 400,150 C 440,155 480,115 520,110 C 560,105 600,120 640,115 C 680,110 720,80 760,95 C 800,110 840,135 880,115 C 920,95 950,120 980,135"
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />

                  {/* Bezier Markers / Dots */}
                  <circle cx="50" cy="130" r="4.5" fill="#2563eb" stroke="#ffffff" strokeWidth="1.5" />
                  <circle cx="160" cy="115" r="4.5" fill="#2563eb" stroke="#ffffff" strokeWidth="1.5" />
                  <circle cx="280" cy="100" r="4.5" fill="#2563eb" stroke="#ffffff" strokeWidth="1.5" />
                  <circle cx="400" cy="150" r="4.5" fill="#2563eb" stroke="#ffffff" strokeWidth="1.5" />
                  <circle cx="520" cy="110" r="4.5" fill="#2563eb" stroke="#ffffff" strokeWidth="1.5" />
                  <circle cx="640" cy="115" r="4.5" fill="#2563eb" stroke="#ffffff" strokeWidth="1.5" />
                  <circle cx="760" cy="95" r="4.5" fill="#2563eb" stroke="#ffffff" strokeWidth="1.5" />
                  <circle cx="880" cy="115" r="4.5" fill="#2563eb" stroke="#ffffff" strokeWidth="1.5" />
                  <circle cx="980" cy="135" r="4.5" fill="#2563eb" stroke="#ffffff" strokeWidth="1.5" />

                  {/* X Axis vertical ticks & labels */}
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((mon, index) => {
                    const xCoord = 50 + (index * 84.5);
                    return (
                      <g key={mon}>
                        <line x1={xCoord} y1="200" x2={xCoord} y2="204" stroke="#cbd5e1" strokeWidth="1" />
                        <text x={xCoord} y="222" className="text-[10.5px] font-bold fill-slate-400" textAnchor="middle">{mon}</text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Bottom Row Checklist Trackers */}
            <StatCardGrid cols={3}>
              <StatCard label="Total Checklists" value={3}  icon={<CheckSquare className="w-5 h-5" />} tone="blue" />
              <StatCard label="Total Items"      value={37} icon={<CheckSquare className="w-5 h-5" />} tone="blue" />
              <StatCard label="Times Used"       value={28} icon={<Calendar className="w-5 h-5" />}    tone="emerald" />
            </StatCardGrid>
          </motion.div>
        )}

        {/* --- 2. CREATE SCREEN (IMAGE 2) --- */}
        {currentProfilesTab === 'create' && (
          <motion.div
            key="create"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <PeopleProfileDraftsPanel showAlert={showAlert} />
          </motion.div>
        )}

        {currentProfilesTab === 'bulk_create' && (
          <motion.div
            key="bulk_create"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <BulkEmployeeImportPage />
          </motion.div>
        )}

        {/* --- 3. ORGANOGRAM SCREEN --- */}
        {currentProfilesTab === 'organogram' && (
          <motion.div
            key="organogram"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black text-slate-900 tracking-tight">Organization Chart</h4>
                <p className="text-[11px] text-slate-500 font-medium">Hierarchy and profiles of all employees</p>
              </div>
              <button
                onClick={() => refetchOrg()}
                disabled={loadingOrg}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors disabled:opacity-40"
              >
                {loadingOrg ? 'Loading…' : '↺ Refresh'}
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" style={{ height: 580 }}>
              {loadingOrg ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Building chart…</span>
                </div>
              ) : orgData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <Users className="w-12 h-12 text-slate-200" />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No employee hierarchy found</p>
                  <button onClick={refetchOrg} className="text-[11px] font-black text-blue-600 hover:underline">Retry</button>
                </div>
              ) : (
                <OrgChartCanvas
                  roots={orgData}
                  onSelect={(n) => showAlert(`${n.name} · ${n.title}`, 'info')}
                />
              )}
            </div>

            <p className="text-center text-[10px] text-slate-400 font-semibold">
              💡 Scroll to zoom · Drag to pan · Click a card to view profile · Click % to reset view
            </p>
          </motion.div>
        )}

        {/* --- 4. DIRECTORY SCREEN (IMAGE 4) --- */}
        {currentProfilesTab === 'directory' && (
          <motion.div
            key="directory"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-end">
              <div>
                <h4 className="text-sm font-bold text-slate-950 tracking-tight">All Employees & Profiles</h4>
                <p className="text-[11px] text-slate-500 font-medium">Directory of employees and profiles</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => navigate('../bulk_create')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-[11px] font-black text-white hover:bg-blue-700"
                >
                  <Upload className="w-3.5 h-3.5" /> Bulk Import Employees
                </button>
                <button
                  onClick={() => refetchEmployees()}
                  disabled={loadingEmployees}
                  className="text-[10px] font-black text-blue-600 flex items-center gap-1 hover:underline disabled:opacity-50"
                >
                  {loadingEmployees ? 'Reloading...' : 'Reload Roster'}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs space-y-4">

              {/* Dynamic Search / Custom Filters Row */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={directionSearch}
                    onChange={(e) => setDirectionSearch(e.target.value)}
                    placeholder="Search employees..."
                    className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-150 rounded-xl py-2 pl-10 pr-4 text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white"
                  />
                </div>

                <button
                  onClick={() => showAlert('Reset active table parameters!', 'info')}
                  className="p-2 border border-slate-200 text-slate-400 hover:text-slate-800 rounded-xl cursor-pointer"
                >
                  <Filter className="w-4 h-4" />
                </button>

                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-150 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="Marketing">Marketing</option>
                  <option value="Technical">Technical</option>
                  <option value="Business">Business</option>
                </select>

                <select
                  defaultValue="Job Type"
                  className="bg-slate-50 border border-slate-150 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="Job Type">Job Type</option>
                  <option value="Full-Time">Full-Time</option>
                  <option value="Remote">Remote</option>
                </select>

                <select
                  defaultValue="Performance"
                  className="bg-slate-50 border border-slate-150 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="Performance">Performance</option>
                  <option value="Top Rate">Top Rate</option>
                  <option value="Under Review">Under Review</option>
                </select>

                <div className="ml-auto text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                  <span>Sort by:</span>
                  <select
                    defaultValue="Name"
                    className="bg-slate-50 border border-slate-150 rounded-lg px-2 py-1 text-xs text-slate-700 font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="Name">Name</option>
                    <option value="Rank">Rank</option>
                  </select>
                </div>
              </div>

              {/* Roster Size text header indicator */}
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pt-1">
                {totalEmployees} employees found
              </div>

              {/* Table rendering panel */}
              <div className="overflow-visible">
                <table className="w-full text-left font-sans text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 tracking-wider uppercase">
                      <th className="py-3 px-4">Name & Position</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Job Type</th>
                      <th className="py-3 px-4">Address</th>
                      <th className="py-3 px-4 text-center">Rank</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {loadingEmployees ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center">
                          <div className="flex flex-col items-center gap-2">
                             <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fetching Roster...</span>
                          </div>
                        </td>
                      </tr>
                    ) : employees.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          No employees found.
                        </td>
                      </tr>
                    ) : (
                      employees.map((emp, idx) => {
                        const isActive = selectedDirectoryRow === idx;
                        const initials = emp.user?.fullName?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '??';
                        return (
                          <tr
                            key={emp.id}
                            onClick={() => onViewProfile?.(emp)}
                            className={`group transition-all relative cursor-pointer ${isActive
                                ? 'bg-slate-50/70 z-10'
                                : 'hover:bg-slate-50/30'
                              } ${activeActionsMenu === emp.id ? 'z-50' : 'z-0'}`}
                          >
                            {/* Name & Position Column */}
                            <td className="py-3.5 px-4 flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-extrabold text-xs shadow-sm border border-white/20">
                                {initials}
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 block group-hover:text-blue-600 transition-colors">{emp.user?.fullName}</span>
                                <span className="text-[10.5px] text-slate-400 block mt-0.5">{emp.position?.title || 'Staff'}</span>
                              </div>
                            </td>
  
                            {/* Department Column */}
                            <td className="py-3 px-4">
                               <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200">
                                 {emp.department?.name || 'General'}
                               </span>
                            </td>
  
                            {/* Job Type Column */}
                            <td className="py-3 px-4 font-semibold text-slate-700 capitalize">
                               {emp.employmentType?.replace('_', ' ') || 'full_time'}
                            </td>
  
                            {/* Address / Contact Info Column */}
                            <td className="py-3 px-4 text-[10.5px] leading-relaxed">
                              <span className="font-semibold text-slate-700 block">{emp.user?.email}</span>
                              <span className="text-slate-400 block font-medium mt-0.5">{emp.user?.phone || 'No Phone'}</span>
                            </td>
  
                            {/* Performance Rank Column */}
                            <td className="py-3 px-4 text-center">
                              <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-blue-600 bg-blue-50/70 py-1 px-2.5 rounded-full border border-blue-100">
                                <span>✨</span>
                                <span>90%</span>
                              </span>
                            </td>
  
                            {/* Actions Column */}
                            <td className={`py-3 px-4 text-right relative ${activeActionsMenu === emp.id ? 'z-50' : ''}`}>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveActionsMenu(activeActionsMenu === emp.id ? null : emp.id);
                                }}
                                className="p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 transition-all text-slate-400 hover:text-slate-600 cursor-pointer"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
  
                              <AnimatePresence>
                                {activeActionsMenu === emp.id && (
                                  <>
                                    <div 
                                      className="fixed inset-0 z-10" 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveActionsMenu(null);
                                      }} 
                                    />
                                    <motion.div
                                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                      animate={{ opacity: 1, scale: 1, y: 0 }}
                                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                      className="absolute right-0 top-8 w-44 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[100] overflow-hidden py-1.5"
                                    >
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onViewProfile?.(emp);
                                          setActiveActionsMenu(null);
                                        }}
                                        className="w-full flex items-center gap-2.5 px-4 py-2 text-[11px] font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                      >
                                        <Eye className="w-3.5 h-3.5" /> View Profile
                                      </button>
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setUpdateEmployeeUserId(emp.userId);
                                          setUpdateEmployeeModalOpen(true);
                                          setActiveActionsMenu(null);
                                        }}
                                        className="w-full flex items-center gap-2.5 px-4 py-2 text-[11px] font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                      >
                                        <Pencil className="w-3.5 h-3.5" /> Update Record
                                      </button>
                                      <div className="h-[1px] bg-slate-50 my-1" />
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteEmployee(emp.userId);
                                          setActiveActionsMenu(null);
                                        }}
                                        className="w-full flex items-center gap-2.5 px-4 py-2 text-[11px] font-bold text-rose-500 hover:bg-rose-50 transition-colors"
                                      >
                                        <Trash className="w-3.5 h-3.5" /> Delete Record
                                      </button>
                                    </motion.div>
                                  </>
                                )}
                              </AnimatePresence>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Navigation Pagination controls footer block */}
              <div className="flex justify-center items-center gap-1.5 pt-4 border-t border-slate-50">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                {Array.from({ length: Math.ceil(totalEmployees / employeesPerPage) }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-7 h-7 font-black text-xs rounded-full flex items-center justify-center cursor-pointer transition-all ${
                      currentPage === i + 1 
                        ? 'bg-blue-600 text-white shadow-md scale-110' 
                        : 'text-slate-500 hover:bg-slate-50 font-bold'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}

                {totalEmployees === 0 && (
                  <button className="w-7 h-7 bg-blue-600 text-white font-black text-xs rounded-full flex items-center justify-center cursor-pointer">
                    1
                  </button>
                )}

                <button
                  disabled={currentPage >= Math.ceil(totalEmployees / employeesPerPage)}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          </motion.div>
        )}

        {/* --- 5. EVENTS SCREEN (IMAGE 5) --- */}
        {currentProfilesTab === 'events' && (
          <motion.div
            key="events"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-start flex-wrap gap-4">
              <div>
                <h4 className="text-sm font-bold text-slate-950 tracking-tight">Upcoming Events</h4>
                <p className="text-[11px] text-slate-500 font-medium">Company celebrations and holidays.</p>
              </div>

              {/* Top Right category selectors */}
              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl shadow-inner text-xs font-bold">
                <button
                  onClick={() => setActiveEventCategory('birthdays')}
                  className={`px-3 py-1.5 rounded-lg cursor-pointer select-none transition-all ${activeEventCategory === 'birthdays'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                    }`}
                >
                  Birthdays
                </button>
                <button
                  onClick={() => {
                    setActiveEventCategory('anniversaries');
                    showAlert('Showing employee Work Anniversaries timeline', 'info');
                  }}
                  className={`px-3 py-1.5 rounded-lg cursor-pointer select-none transition-all ${activeEventCategory === 'anniversaries'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  Work Anniversaries
                </button>
                <button
                  onClick={() => {
                    setActiveEventCategory('promotions');
                    showAlert('Showing upcoming employee promotions info', 'info');
                  }}
                  className={`px-3 py-1.5 rounded-lg cursor-pointer select-none transition-all ${activeEventCategory === 'promotions'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  Promoted
                </button>
                <button
                  onClick={() => {
                    setActiveEventCategory('holidays');
                    showAlert('Showing registered national company holidays', 'info');
                  }}
                  className={`px-3 py-1.5 rounded-lg cursor-pointer select-none transition-all ${activeEventCategory === 'holidays'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  Holidays
                </button>
              </div>
            </div>

            {/* Side-by-Side Horizontal Cards Grid matching Image 5 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

              {/* Card 1: Birthdays (Active Category Default) */}
              <div
                onClick={() => showAlert('Celebrate Jessica Parker Birth Year Milestone', 'info')}
                className="bg-white rounded-3xl border border-slate-100 p-5 flex flex-col items-center justify-between text-center overflow-hidden h-[340px] cursor-pointer group shadow-2xs hover:shadow-xs hover:border-blue-200 transition-all"
              >
                {/* 3D-styled custom circular character design frame */}
                <div className="relative w-36 h-36 bg-gradient-to-tr from-sky-400 to-blue-600 rounded-2xl flex items-center justify-center text-white mt-1 shadow-inner overflow-hidden">
                  <span className="text-4xl">🧑🏽‍💻</span>
                  {/* Confetti overlay background simulation */}
                  <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/10 mix-blend-overlay opacity-50" />
                  <div className="absolute bottom-2 left-0 right-0 bg-black/20 backdrop-blur-xs py-1 text-[10px] uppercase tracking-wider font-extrabold text-blue-100">Jessica Parker</div>
                </div>

                <div className="pt-2 space-y-1">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-widest">Happy Birthday Wish</span>
                  <span className="text-sm font-black text-slate-800 block">Jan 22nd</span>
                </div>
              </div>

              {/* Card 2: National Victory Date Celebration */}
              <div
                onClick={() => showAlert('National Holiday: Adwa Victory Day celebration', 'info')}
                className="bg-white rounded-3xl border border-slate-100 p-5 flex flex-col items-center justify-between text-center overflow-hidden h-[340px] cursor-pointer hover:border-blue-200 shadow-2xs transition-all"
              >
                {/* Clean large Calendar style widget */}
                <div className="w-36 h-36 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col justify-between py-4 text-center mt-1">
                  <span className="text-xs uppercase tracking-widest font-black text-rose-500 font-sans block">February</span>
                  <span className="text-5xl font-extrabold text-slate-800 block tracking-tighter">28</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase">Ethiopia</span>
                </div>

                <div className="pt-2 space-y-1">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-widest">Adwa Victory Day</span>
                  <span className="text-sm font-black text-slate-800 block">Feb 28th</span>
                </div>
              </div>

              {/* Card 3: Promoted Card */}
              <div
                onClick={() => showAlert('Review promotion plans details with Team leads', 'info')}
                className="bg-white rounded-3xl border border-slate-100 p-5 flex flex-col items-center justify-between text-center overflow-hidden h-[340px] cursor-pointer hover:border-blue-200 shadow-2xs transition-all animate-pulse-slow"
              >
                {/* 3D alternative style avatar card */}
                <div className="relative w-36 h-36 bg-gradient-to-tr from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center text-white mt-1 overflow-hidden shadow-inner">
                  <span className="text-4xl">👨🏼‍💼</span>
                  <div className="absolute bottom-2 left-0 right-0 bg-black/20 backdrop-blur-xs py-1 text-[10px] uppercase tracking-wider font-extrabold text-orange-150">Jessica Parker</div>
                </div>

                <div className="pt-2 space-y-1">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-widest">To Be Promoted</span>
                  <span className="text-sm font-black text-slate-800 block">Jan 22nd</span>
                </div>
              </div>

              {/* Card 4: Work Anniversary Card */}
              <div
                onClick={() => showAlert('Celebrate work tenure of team contributor', 'info')}
                className="bg-white rounded-3xl border border-slate-100 p-5 flex flex-col items-center justify-between text-center overflow-hidden h-[340px] cursor-pointer hover:border-blue-200 shadow-2xs transition-all"
              >
                {/* 3D Dark Avatar alternative */}
                <div className="relative w-36 h-36 bg-gradient-to-tr from-purple-400 via-pink-500 to-rose-500 rounded-2xl flex items-center justify-center text-white mt-1 overflow-hidden shadow-inner">
                  <span className="text-4xl">👩🏾‍💻</span>
                  <div className="absolute bottom-2 left-0 right-0 bg-black/20 backdrop-blur-xs py-1 text-[10px] uppercase tracking-wider font-extrabold text-purple-100">Jessica Parker</div>
                </div>

                <div className="pt-2 space-y-1">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-widest">1 Year Anniversary</span>
                  <span className="text-sm font-black text-slate-800 block">Jan 22nd</span>
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* --- 6. ARCHIVE SCREEN (IMAGE 6) --- */}
        {currentProfilesTab === 'archive' && (
          <motion.div
            key="archive"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div>
              <h4 className="text-sm font-bold text-slate-950 tracking-tight">Offboarded Employee History</h4>
              <p className="text-[11px] text-slate-500 font-medium font-sans">Archived data of no longer active employees.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* Left Column (Lists & searching parameters) */}
              <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-100 p-5 space-y-4 shadow-xs">

                {/* Search box inside container */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={archiveSearch}
                    onChange={(e) => setArchiveSearch(e.target.value)}
                    placeholder="Search archived employees..."
                    className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-150 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white"
                  />
                </div>

                {/* Filters */}
                <div className="flex gap-2.5">
                  <button className="p-2 border border-slate-200 text-slate-400 rounded-xl">
                    <Filter className="w-4 h-4" />
                  </button>
                  <select
                    value={archiveDeptFilter}
                    onChange={(e) => setArchiveDeptFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-150 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value="Marketing">Marketing</option>
                    <option value="Technical">Technical</option>
                  </select>
                </div>

                {/* size metadata */}
                <div className="flex justify-between items-center pt-2">
                  <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">8 employees found</span>
                  <span className="text-[11px] font-semibold text-slate-500">Sort by: Name</span>
                </div>

                {/* List items block */}
                <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                  {[0, 1, 2, 3, 4, 5, 6, 7].map((val) => {
                    const isActive = selectedArchiveRow === val;
                    return (
                      <div
                        key={val}
                        onClick={() => setSelectedArchiveRow(val)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${isActive
                            ? 'bg-slate-50/70 border-2 border-blue-600/30'
                            : 'bg-white border-slate-50 hover:bg-slate-50/50'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#1e64f2] text-white flex items-center justify-center font-bold">
                            JP
                          </div>
                          <div>
                            <h5 className="text-[12.5px] font-bold text-slate-900 leading-none">Jessica Parker</h5>
                            <span className="text-[10px] text-slate-400 mt-1.5 block">Full Stack Developer</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[11px] font-bold text-slate-700 block">{archiveDeptFilter}</span>
                          <span className="text-[10px] text-slate-400 mt-1 block">Exited at: Dec 15, 2024</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination Controls */}
                <div className="flex justify-center items-center gap-1.5 pt-4 border-t border-slate-50">
                  <button className="p-1 rounded border border-slate-200 text-slate-400">
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button className="w-6 h-6 bg-blue-600 text-white font-bold text-xs rounded-full flex items-center justify-center">1</button>
                  <button className="w-6 h-6 font-bold text-slate-400 hover:bg-slate-100 text-xs rounded-full flex items-center justify-center">2</button>
                  <button className="w-6 h-6 font-bold text-slate-400 hover:bg-slate-100 text-xs rounded-full flex items-center justify-center">3</button>
                  <button className="w-6 h-6 font-bold text-slate-400 hover:bg-slate-100 text-xs rounded-full flex items-center justify-center">4</button>
                  <button className="p-1 rounded border border-slate-200 text-slate-400">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Right Column (Detailed Archived Employee specifications sheet) */}
              <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-100 p-6 space-y-6 shadow-xs">

                {/* Header Profile Info block */}
                <div className="flex justify-between items-start flex-wrap gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 text-white font-extrabold rounded-full flex items-center justify-center text-sm shadow-md">
                      JP
                    </div>
                    <div>
                      <h4 className="text-base font-black text-slate-900 leading-none">Jessica Parker</h4>
                      <p className="text-xs font-semibold text-slate-400 mt-1">Full Stack Developer</p>
                      <p className="text-[10px] text-slate-400/80 mt-0.5">jessica@company.com &bull; +251 987 76 6353</p>
                    </div>
                  </div>

                  <span className="bg-blue-50 text-[#1a56db] font-extrabold text-[10px] uppercase tracking-wider px-3 py-1 rounded-lg border border-blue-100/50">
                    TECHNICAL DEPT.
                  </span>
                </div>

                {/* Employment Section */}
                <div className="bg-slate-50/70 border border-slate-100 p-4.5 rounded-2xl space-y-3.5">
                  <h5 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Employment</h5>

                  <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-xs text-slate-500 font-semibold">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Start Date</span>
                      <span className="text-slate-800 font-bold block">Dec 15, 2024</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Total Tenure</span>
                      <span className="text-slate-800 font-bold block">2 years, 8 months</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">End Date</span>
                      <span className="text-slate-800 font-bold block">Dec 15, 2024</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Salary</span>
                      <span className="text-slate-800 font-black block">20,000 ETB</span>
                    </div>
                  </div>
                </div>

                {/* Offboarding Details Section */}
                <div className="bg-slate-50/70 border border-slate-100 p-4.5 rounded-2xl space-y-3.5">
                  <h5 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Offboarding Details</h5>

                  {/* Resignation Letter date line */}
                  <div className="bg-blue-50/55 border border-blue-100/40 p-3 rounded-xl flex items-center justify-between text-xs text-blue-800">
                    <span className="font-bold flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span>Resignation letter sent on:</span>
                    </span>
                    <strong className="font-black text-blue-900">Dec 30, 2025</strong>
                  </div>

                  {/* Leaving reason and AI status */}
                  <div className="grid grid-cols-2 gap-4 pt-1.5">
                    <div className="space-y-1">
                      <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">Reason for Leaving ✨</span>
                      <p className="text-[11px] font-bold text-slate-800 leading-snug">Resignation - Better Opportunity</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">Exit & Clearance</span>
                      <span className="inline-flex bg-emerald-50 text-emerald-700 font-extrabold text-[10px] uppercase py-1 px-3.5 rounded-lg border border-emerald-100">
                        Completed
                      </span>
                    </div>
                  </div>

                  {/* Top Sparkle AI score card layout */}
                  <div className="bg-blue-50/70 border border-blue-100 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black tracking-widest text-[#1e64f2] uppercase block">AI Score</span>
                      <p className="text-[10px] font-bold text-slate-400 mt-1">Overall Performance</p>
                    </div>

                    <div className="flex items-center gap-1 text-2xl font-black text-blue-600">
                      <span>✨</span>
                      <span>87%</span>
                    </div>
                  </div>
                </div>

                {/* Archived documents list block */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <h5 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Archived Documents</h5>
                    <span className="bg-slate-100 text-slate-600 font-black px-2 py-0.5 rounded-md text-[10px] tracking-tight">24 files</span>
                  </div>

                  {/* Grid of four interactive file tags */}
                  <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-slate-700">

                    <button
                      onClick={() => showAlert('Opening archived Contract file', 'success')}
                      className="bg-white hover:bg-slate-50 border border-slate-150 rounded-xl p-3 flex items-center justify-between select-none cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="truncate">Contract</span>
                      </div>
                      <Download className="w-3.5 h-3.5 text-slate-400 hover:text-blue-600" />
                    </button>

                    <button
                      onClick={() => showAlert('Downloading Performance Reviews metrics log', 'success')}
                      className="bg-white hover:bg-slate-50 border border-slate-150 rounded-xl p-3 flex items-center justify-between select-none cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-slate-400" />
                        <span className="truncate">Performance R...</span>
                      </div>
                      <Download className="w-3.5 h-3.5 text-slate-400 hover:text-blue-600" />
                    </button>

                    <button
                      onClick={() => showAlert('Extracting Exit Interview notes', 'success')}
                      className="bg-white hover:bg-slate-50 border border-slate-150 rounded-xl p-3 flex items-center justify-between select-none cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span className="truncate">Exit Interview</span>
                      </div>
                      <Download className="w-3.5 h-3.5 text-slate-400 hover:text-blue-600" />
                    </button>

                    <button
                      onClick={() => showAlert('Downloading scanning ID Documents archive', 'success')}
                      className="bg-white hover:bg-slate-50 border border-slate-150 rounded-xl p-3 flex items-center justify-between select-none cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span className="truncate">ID Document</span>
                      </div>
                      <Download className="w-3.5 h-3.5 text-slate-400 hover:text-blue-600" />
                    </button>

                  </div>
                </div>

                {/* Bottom Main Actions */}
                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => showAlert('Opening complete offboarding record ledger', 'success')}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer text-center"
                  >
                    View Record
                  </button>
                  <button
                    onClick={() => showAlert('Packaging all 24 archived files for download', 'success')}
                    className="flex-1 bg-slate-100 hover:bg-slate-250 text-slate-700 font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer text-center"
                  >
                    Download Files
                  </button>
                </div>

              </div>

            </div>
          </motion.div>
        )}

      </AnimatePresence>

      <CreateEmployeeModal
        isOpen={updateEmployeeModalOpen}
        onClose={() => {
          setUpdateEmployeeModalOpen(false);
          setUpdateEmployeeUserId(null);
        }}
        showAlert={showAlert}
        mode="update"
        targetUserId={updateEmployeeUserId || undefined}
        onSuccess={() => fetchEmployees(currentPage)}
      />
    </div>
  );
}
