import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Chat from "./pages/Chat";
import FAQs from "./pages/FAQs";
import Search from "./pages/Search";
import Knowledge from "./pages/Knowledge";
import Dashboard from "./pages/Dashboard";
import AITools from "./pages/AITools";
import ClassifyTool from "./pages/ClassifyTool";
import ExtractTool from "./pages/ExtractTool";
import SummarizeTool from "./pages/SummarizeTool";
import CompareTool from "./pages/CompareTool";
import PrecedentsTool from "./pages/PrecedentsTool";
import PredictTool from "./pages/PredictTool";
import DigitalLibrary from "./pages/DigitalLibrary";
import PropertiesManagement from "./pages/PropertiesManagement";
import CasesManagement from "./pages/CasesManagement";
import RulingsManagement from "./pages/RulingsManagement";
import DeedsManagement from "./pages/DeedsManagement";
import InstructionsManagement from "@/pages/InstructionsManagement";
import AdvancedSearch from "@/pages/AdvancedSearch";
import ManageKnowledge from "./pages/ManageKnowledge";
import PropertyDetails from "./pages/PropertyDetails";
import CaseDetails from "./pages/CaseDetails";
import RulingDetails from "./pages/RulingDetails";
import AboutUs from "./pages/AboutUs";
import ContactUs from "./pages/ContactUs";
import KnowledgeDetails from "./pages/KnowledgeDetails";
import SiteSettings from "./pages/SiteSettings";
import FilesManagement from "./pages/FilesManagement";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import Stats from "./pages/Stats";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminContent from "./pages/AdminContent";
import AdminActivity from "./pages/AdminActivity";
import AdminSystemSettings from "./pages/AdminSystemSettings";
import AdminNotifications from "./pages/AdminNotifications";
import ManageUsers from "./pages/ManageUsers";
import { SiteSettingsProvider } from "./contexts/SiteSettingsContext";
import Footer from "./components/Footer";

function Router() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
      <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/chat"} component={Chat} />
      <Route path={"/stats"} component={Stats} />
      <Route path={"/faqs"} component={FAQs} />
      <Route path={"/about"} component={AboutUs} />
      <Route path={"/contact"} component={ContactUs} />
      <Route path={"/search"} component={Search} />
      <Route path={"/knowledge"} component={Knowledge} />
      <Route path={"/admin"} component={AdminDashboard} />
      <Route path={"/admin/dashboard"} component={AdminDashboard} />
      <Route path={"/admin/users"} component={ManageUsers} />
      <Route path={"/admin/users-old"} component={AdminUsers} />
      <Route path={"/admin/content"} component={AdminContent} />
      <Route path={"/admin/activity"} component={AdminActivity} />
      <Route path={"/admin/system-settings"} component={AdminSystemSettings} />
      <Route path={"/admin/notifications"} component={AdminNotifications} />
      <Route path={"/admin/old-dashboard"} component={Dashboard} />
      <Route path={"/admin/tools"} component={AITools} />
        <Route path="/admin/tools/classify" component={ClassifyTool} />
      <Route path="/admin/tools/extract" component={ExtractTool} />
      <Route path="/admin/tools/summarize" component={SummarizeTool} />
      <Route path="/admin/tools/compare" component={CompareTool} />
      <Route path="/admin/tools/precedents" component={PrecedentsTool} />
       <Route path="/admin/tools/predict" component={PredictTool} />
      <Route path="/admin/library" component={DigitalLibrary} />
      <Route path="/admin/properties" component={PropertiesManagement} />
      <Route path="/admin/cases" component={CasesManagement} />
      <Route path="/admin/rulings" component={RulingsManagement} />
      <Route path="/admin/deeds" component={DeedsManagement} />
      <Route path="/admin/instructions" component={InstructionsManagement} />
       <Route path={"/admin/knowledge"} component={ManageKnowledge} />
       <Route path={"/admin/files"} component={FilesManagement} />
       <Route path={"/admin/analytics"} component={AnalyticsDashboard} />
       <Route path={"/admin/settings"} component={SiteSettings} />
        <Route path="/search" component={AdvancedSearch} />
      <Route path="/admin/properties/:id" component={PropertyDetails} />
      <Route path="/admin/cases/:id" component={CaseDetails} />
      <Route path="/admin/rulings/:id" component={RulingDetails} />
      <Route path="/knowledge/:id" component={KnowledgeDetails} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <SiteSettingsProvider>
        <ThemeProvider defaultTheme="light" switchable={true}>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </SiteSettingsProvider>
    </ErrorBoundary>
  );
}

export default App;
