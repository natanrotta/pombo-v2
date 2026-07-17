// Static icon barrel for apps/web — hand-maintained (NOT auto-generated).
// Re-exports the legacy react-icons identifiers (Fi*/Lu*) as plain, non-animated
// Lucide components, plus two inlined brand marks (BrandIcons.tsx). Add or rename
// an icon by editing this file directly.
//
// Every Lucide icon is passed through `lucide()` so it defaults to a **1em** box
// (matching Chakra's own `<Icon>` and the inlined brand marks in BrandIcons.tsx)
// instead of Lucide's fixed 24px. This keeps the react-icons render contract the
// app was built on — a bare `<FiX />`, `icon={<FiX />}` or `separator={<FiX />}`
// scales with the surrounding font size — while explicit `size` / `boxSize` still
// win. Without this, every unsized usage would render at a broken 24px.
import { createElement, forwardRef } from "react";
import type { ComponentType, SVGProps } from "react";
import {
  Activity,
  CircleAlert,
  TriangleAlert,
  AlignLeft,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Award,
  Ban,
  Bold,
  Book,
  Bookmark,
  BookOpen,
  Briefcase,
  Bug,
  Building2,
  Calendar,
  Camera,
  ChartPie,
  Check,
  CircleCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsLeft,
  ChevronsRight,
  Circle,
  CircleHelp,
  CirclePlay,
  CircleX,
  Clipboard,
  Clock,
  CloudUpload,
  Code,
  Compass,
  Copy,
  Cpu,
  CreditCard,
  Database,
  DollarSign,
  Download,
  Ellipsis,
  EllipsisVertical,
  ExternalLink,
  Eye,
  EyeOff,
  File,
  FileText,
  Filter,
  Grid,
  Hash,
  HardDrive,
  Headphones,
  Heading2,
  Home,
  Image,
  Inbox,
  Info,
  Italic,
  Link,
  List,
  ListOrdered,
  Loader,
  Lock,
  LogIn,
  LogOut,
  Mail,
  MapPin,
  Maximize2,
  Menu,
  Mic,
  Minimize2,
  Moon,
  Package,
  PanelsTopLeft,
  Paperclip,
  Pause,
  Pencil,
  PenLine,
  PenTool,
  Phone,
  Play,
  Plus,
  Quote,
  RefreshCw,
  Repeat,
  RotateCcw,
  Save,
  Search,
  Send,
  Settings,
  Share2,
  Shield,
  ShieldAlert,
  SlidersHorizontal,
  Square,
  SquareCheckBig,
  Star,
  Sun,
  Tag,
  Terminal,
  Trash2,
  TrendingUp,
  Type,
  Underline,
  Upload,
  User,
  UserCheck,
  UserPlus,
  Users,
  X,
  Zap,
} from "lucide-react";

/**
 * Structural component type mirroring how react-icons' `IconType` was used
 * across the app (`icon: IconType`). Both the Lucide re-exports below and the
 * inlined brand marks in BrandIcons.tsx satisfy it.
 */
export type IconType = ComponentType<
  SVGProps<SVGSVGElement> & {
    size?: number | string;
    color?: string;
    strokeWidth?: number | string;
    title?: string;
  }
>;

type IconProps = SVGProps<SVGSVGElement> & {
  size?: number | string;
  color?: string;
  strokeWidth?: number | string;
  title?: string;
};

/**
 * Wrap a raw Lucide icon so it defaults to a 1em box. Lucide ships a fixed 24px
 * default; the app's layout (and BrandIcons.tsx) assume the react-icons 1em
 * contract, so unsized usages would otherwise render oversized. `size="1em"` is
 * applied first, then `{...props}`, so any explicit `size` (and Chakra's
 * `boxSize`, which lands as a width/height className via `<Icon as>`/`<Box as>`)
 * still overrides it.
 */
function lucide(Base: IconType, displayName: string): IconType {
  const Wrapped = forwardRef<SVGSVGElement, IconProps>((props, ref) =>
    createElement(Base, { size: "1em", ...props, ref })
  );
  Wrapped.displayName = displayName;
  return Wrapped as IconType;
}

export const FiActivity = lucide(Activity, "FiActivity");
export const FiAlertCircle = lucide(CircleAlert, "FiAlertCircle");
export const FiAlertTriangle = lucide(TriangleAlert, "FiAlertTriangle");
export const FiAlignLeft = lucide(AlignLeft, "FiAlignLeft");
export const FiArrowLeft = lucide(ArrowLeft, "FiArrowLeft");
export const FiArrowRight = lucide(ArrowRight, "FiArrowRight");
export const FiArrowUp = lucide(ArrowUp, "FiArrowUp");
export const FiAward = lucide(Award, "FiAward");
export const FiBold = lucide(Bold, "FiBold");
export const FiBook = lucide(Book, "FiBook");
export const FiBookmark = lucide(Bookmark, "FiBookmark");
export const FiBookOpen = lucide(BookOpen, "FiBookOpen");
export const FiBriefcase = lucide(Briefcase, "FiBriefcase");
export const FiBug = lucide(Bug, "FiBug");
export const FiCalendar = lucide(Calendar, "FiCalendar");
export const FiCamera = lucide(Camera, "FiCamera");
export const FiCheck = lucide(Check, "FiCheck");
export const FiCheckCircle = lucide(CircleCheck, "FiCheckCircle");
export const FiCheckSquare = lucide(SquareCheckBig, "FiCheckSquare");
export const FiChevronDown = lucide(ChevronDown, "FiChevronDown");
export const FiChevronLeft = lucide(ChevronLeft, "FiChevronLeft");
export const FiChevronRight = lucide(ChevronRight, "FiChevronRight");
export const FiChevronsLeft = lucide(ChevronsLeft, "FiChevronsLeft");
export const FiChevronsRight = lucide(ChevronsRight, "FiChevronsRight");
export const FiChevronUp = lucide(ChevronUp, "FiChevronUp");
export const FiCircle = lucide(Circle, "FiCircle");
export const FiClipboard = lucide(Clipboard, "FiClipboard");
export const FiClock = lucide(Clock, "FiClock");
export const FiCode = lucide(Code, "FiCode");
export const FiCompass = lucide(Compass, "FiCompass");
export const FiCopy = lucide(Copy, "FiCopy");
export const FiCpu = lucide(Cpu, "FiCpu");
export const FiCreditCard = lucide(CreditCard, "FiCreditCard");
export const FiDatabase = lucide(Database, "FiDatabase");
export const FiDollarSign = lucide(DollarSign, "FiDollarSign");
export const FiDownload = lucide(Download, "FiDownload");
export const FiEdit2 = lucide(Pencil, "FiEdit2");
export const FiEdit3 = lucide(PenLine, "FiEdit3");
export const FiExternalLink = lucide(ExternalLink, "FiExternalLink");
export const FiEye = lucide(Eye, "FiEye");
export const FiEyeOff = lucide(EyeOff, "FiEyeOff");
export const FiFile = lucide(File, "FiFile");
export const FiFileText = lucide(FileText, "FiFileText");
export const FiFilter = lucide(Filter, "FiFilter");
export const FiGrid = lucide(Grid, "FiGrid");
export const FiHardDrive = lucide(HardDrive, "FiHardDrive");
export const FiHash = lucide(Hash, "FiHash");
export const FiHeadphones = lucide(Headphones, "FiHeadphones");
export const FiHelpCircle = lucide(CircleHelp, "FiHelpCircle");
export const FiHome = lucide(Home, "FiHome");
export const FiImage = lucide(Image, "FiImage");
export const FiInbox = lucide(Inbox, "FiInbox");
export const FiInfo = lucide(Info, "FiInfo");
export const FiItalic = lucide(Italic, "FiItalic");
export const FiLayout = lucide(PanelsTopLeft, "FiLayout");
export const FiLink = lucide(Link, "FiLink");
export const FiList = lucide(List, "FiList");
export const FiLoader = lucide(Loader, "FiLoader");
export const FiLock = lucide(Lock, "FiLock");
export const FiLogIn = lucide(LogIn, "FiLogIn");
export const FiLogOut = lucide(LogOut, "FiLogOut");
export const FiMail = lucide(Mail, "FiMail");
export const FiMapPin = lucide(MapPin, "FiMapPin");
export const FiMaximize2 = lucide(Maximize2, "FiMaximize2");
export const FiMenu = lucide(Menu, "FiMenu");
export const FiMic = lucide(Mic, "FiMic");
export const FiMinimize2 = lucide(Minimize2, "FiMinimize2");
export const FiMoon = lucide(Moon, "FiMoon");
export const FiMoreHorizontal = lucide(Ellipsis, "FiMoreHorizontal");
export const FiMoreVertical = lucide(EllipsisVertical, "FiMoreVertical");
export const FiPackage = lucide(Package, "FiPackage");
export const FiPaperclip = lucide(Paperclip, "FiPaperclip");
export const FiPause = lucide(Pause, "FiPause");
export const FiPenTool = lucide(PenTool, "FiPenTool");
export const FiPhone = lucide(Phone, "FiPhone");
export const FiPieChart = lucide(ChartPie, "FiPieChart");
export const FiPlay = lucide(Play, "FiPlay");
export const FiPlayCircle = lucide(CirclePlay, "FiPlayCircle");
export const FiPlus = lucide(Plus, "FiPlus");
export const FiRefreshCw = lucide(RefreshCw, "FiRefreshCw");
export const FiRepeat = lucide(Repeat, "FiRepeat");
export const FiRotateCcw = lucide(RotateCcw, "FiRotateCcw");
export const FiSave = lucide(Save, "FiSave");
export const FiSearch = lucide(Search, "FiSearch");
export const FiSend = lucide(Send, "FiSend");
export const FiSettings = lucide(Settings, "FiSettings");
export const FiShare2 = lucide(Share2, "FiShare2");
export const FiShield = lucide(Shield, "FiShield");
export const FiShieldAlert = lucide(ShieldAlert, "FiShieldAlert");
export const FiSlash = lucide(Ban, "FiSlash");
export const FiSliders = lucide(SlidersHorizontal, "FiSliders");
export const FiSquare = lucide(Square, "FiSquare");
export const FiStar = lucide(Star, "FiStar");
export const FiSun = lucide(Sun, "FiSun");
export const FiTag = lucide(Tag, "FiTag");
export const FiTerminal = lucide(Terminal, "FiTerminal");
export const FiTrash2 = lucide(Trash2, "FiTrash2");
export const FiTrendingUp = lucide(TrendingUp, "FiTrendingUp");
export const FiType = lucide(Type, "FiType");
export const FiUnderline = lucide(Underline, "FiUnderline");
export const FiUpload = lucide(Upload, "FiUpload");
export const FiUploadCloud = lucide(CloudUpload, "FiUploadCloud");
export const FiUser = lucide(User, "FiUser");
export const FiUserCheck = lucide(UserCheck, "FiUserCheck");
export const FiUserPlus = lucide(UserPlus, "FiUserPlus");
export const FiUsers = lucide(Users, "FiUsers");
export const FiX = lucide(X, "FiX");
export const FiXCircle = lucide(CircleX, "FiXCircle");
export const FiZap = lucide(Zap, "FiZap");
export const LuBuilding2 = lucide(Building2, "LuBuilding2");
export const LuHeading2 = lucide(Heading2, "LuHeading2");
export const LuListOrdered = lucide(ListOrdered, "LuListOrdered");
export const LuQuote = lucide(Quote, "LuQuote");

// Brand / fill marks with no Lucide equivalent — inlined in BrandIcons.tsx.
export { BsBookmarkFill, FaWhatsapp } from "./BrandIcons";
