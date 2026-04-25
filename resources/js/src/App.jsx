import { useEffect, useMemo, useState } from "react";
import LoginScreen from "./screens/auth/LoginScreen";
import FieldTypeLibraryScreen from "./screens/admin/FieldTypeLibraryScreen";
import TemplateBuilderScreen from "./screens/admin/TemplateBuilderScreen";
import OrgTreeScreen from "./screens/org/OrgTreeScreen";
import ProjectListScreen from "./screens/projects/ProjectListScreen";
import EntryListScreen from "./screens/entries/EntryListScreen";
import EntryDetailScreen from "./screens/entries/EntryDetailScreen";
import Button from "./components/Button";
import { fetchTemplates, logout, me } from "./services/api";
import {
    LogOut,
    Library,
    FormInput,
    Building2,
    FolderOpen,
    FileText,
    Menu,
    X,
    User,
} from "lucide-react";

const NIA_LOGO = "/images/nia-logo.png";

const SCREENS = {
    org: "org",
    projects: "projects",
    entries: "entries",
    entryDetail: "entryDetail",
    fieldLibrary: "fieldLibrary",
    formBuilder: "formBuilder",
};

const NAV_ITEMS = [
    {
        key: SCREENS.org,
        label: "Organization",
        icon: Building2,
        group: "browse",
        adminOnly: false,
    },
    {
        key: SCREENS.projects,
        label: "Projects",
        icon: FolderOpen,
        group: "browse",
        adminOnly: false,
    },
    {
        key: SCREENS.entries,
        label: "Entries",
        icon: FileText,
        group: "browse",
        adminOnly: false,
    },
    {
        key: SCREENS.fieldLibrary,
        label: "Field Library",
        icon: Library,
        group: "admin",
        adminOnly: true,
    },
    {
        key: SCREENS.formBuilder,
        label: "Form Builder",
        icon: FormInput,
        group: "admin",
        adminOnly: true,
    },
];

export default function App() {
    const [user, setUser] = useState(null);
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [activeScreen, setActiveScreen] = useState(null);
    const [screenParams, setScreenParams] = useState({});
    const [templates, setTemplates] = useState([]);
    const [error, setError] = useState("");
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const isAdmin = user?.role === "admin";

    useEffect(() => {
        if (user && !activeScreen) {
            setActiveScreen(isAdmin ? SCREENS.org : SCREENS.entries);
        }
    }, [user, isAdmin, activeScreen]);

    const visibleNavItems = useMemo(
        () => NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin),
        [isAdmin],
    );

    const browseItems = visibleNavItems.filter((i) => i.group === "browse");
    const adminItems = visibleNavItems.filter((i) => i.group === "admin");

    const loadTemplates = async () => {
        try {
            setError("");
            const loaded = await fetchTemplates();
            setTemplates(loaded);
        } catch (err) {
            setError(err.message);
        }
    };

    useEffect(() => {
        const bootstrap = async () => {
            try {
                const context = await me();
                setUser(context.user);
                await loadTemplates();
            } catch {
                setUser(null);
            } finally {
                setCheckingAuth(false);
            }
        };
        bootstrap();
    }, []);

    const handleLoggedIn = async (loggedInUser) => {
        setUser(loggedInUser);
        setActiveScreen(
            loggedInUser.role === "admin" ? SCREENS.org : SCREENS.entries,
        );
        await loadTemplates();
    };

    const handleLogout = async () => {
        await logout();
        setUser(null);
        setTemplates([]);
        setActiveScreen(null);
        setScreenParams({});
    };

    const navigateTo = (screenKey, params = {}) => {
        setActiveScreen(screenKey);
        setScreenParams(params);
        setSidebarOpen(false);
    };

    // --- Loading ---
    if (checkingAuth) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <img
                        src={NIA_LOGO}
                        alt="NIA"
                        className="h-14 w-14 object-contain"
                    />
                    <div className="space-y-2 text-center">
                        <div className="h-2 w-32 animate-pulse rounded-full bg-gray-200" />
                        <div className="h-2 w-24 animate-pulse rounded-full bg-gray-100 mx-auto" />
                    </div>
                </div>
            </div>
        );
    }

    // --- Login ---
    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col pt-16 items-center px-4">
                <div className="mb-8 text-center flex flex-col items-center">
                    <img
                        src={NIA_LOGO}
                        alt="National Irrigation Administration"
                        className="mb-4 h-20 w-20 object-contain"
                    />
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                        NIA Budget Records
                    </h1>
                    <p className="mt-2 text-sm text-gray-500">
                        National Irrigation Administration
                    </p>
                </div>
                <LoginScreen onLoggedIn={handleLoggedIn} />
                <div className="mt-8 text-center text-xs text-gray-400">
                    <p className="font-medium text-gray-500 mb-2">
                        Demo Accounts
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                        <span className="bg-white px-3 py-1.5 rounded-md border border-gray-200 text-gray-600">
                            Admin: admin@nia.gov.ph
                        </span>
                        <span className="bg-white px-3 py-1.5 rounded-md border border-gray-200 text-gray-600">
                            Encoder: encoder@nia.gov.ph
                        </span>
                    </div>
                    <p className="mt-1.5 text-gray-400">
                        Password:{" "}
                        <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                            password
                        </code>
                    </p>
                </div>
            </div>
        );
    }

    // --- Sidebar Nav Item ---
    const renderNavItem = (item) => {
        const isActive = activeScreen === item.key;
        return (
            <button
                key={item.key}
                onClick={() => navigateTo(item.key)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                    isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
            >
                <item.icon
                    className={`h-[18px] w-[18px] shrink-0 ${isActive ? "text-blue-600" : "text-gray-400"}`}
                />
                {item.label}
            </button>
        );
    };

    // --- Authenticated ---
    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Mobile backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-gray-200 bg-white transition-transform duration-200 lg:static lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
            >
                {/* Header */}
                <div className="flex h-14 items-center gap-3 border-b border-gray-100 px-4">
                    <img
                        src={NIA_LOGO}
                        alt="NIA"
                        className="h-8 w-8 shrink-0 object-contain"
                    />
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-gray-900 leading-snug break-words">
                            NIA
                        </p>
                        <p className="text-[11px] text-gray-500 leading-tight mt-0.5">
                            Records Management
                        </p>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="ml-auto rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 lg:hidden"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto thin-scrollbar px-3 py-3">
                    <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                        Browse
                    </p>
                    <div className="space-y-0.5">
                        {browseItems.map(renderNavItem)}
                    </div>

                    {adminItems.length > 0 && (
                        <>
                            <div className="my-3 border-t border-gray-100"></div>
                            <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                                Administration
                            </p>
                            <div className="space-y-0.5">
                                {adminItems.map(renderNavItem)}
                            </div>
                        </>
                    )}
                </nav>

                {/* Footer */}
                <div className="border-t border-gray-100 px-3 py-3">
                    <div className="flex items-center gap-2.5 px-1">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                            <User className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-medium text-gray-900 leading-tight">
                                {user.name}
                            </p>
                            <p className="truncate text-[11px] text-gray-500 leading-tight">
                                {user.email}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
                    >
                        <LogOut className="h-3.5 w-3.5" /> Sign out
                    </button>
                </div>
            </aside>

            {/* Main */}
            <div className="flex flex-1 flex-col min-w-0">
                {/* Mobile top bar */}
                <header className="sticky top-0 z-20 flex h-12 items-center gap-3 border-b border-gray-200 bg-white/95 backdrop-blur px-4 lg:hidden">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                    <span className="text-sm font-semibold text-gray-800">
                        National Irrigation Administration
                    </span>
                </header>

                <main className="flex-1 overflow-y-auto thin-scrollbar p-4 sm:p-6 lg:p-8">
                    {error && (
                        <div className="mb-6 rounded-lg bg-red-50 p-4 border border-red-200">
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    )}

                    {activeScreen === SCREENS.org && (
                        <OrgTreeScreen
                            onNavigateToProjects={(orgUnitId) =>
                                navigateTo(SCREENS.projects, { orgUnitId })
                            }
                        />
                    )}

                    {activeScreen === SCREENS.projects && (
                        <ProjectListScreen
                            filterOrgUnitId={screenParams.orgUnitId}
                            onNavigateToEntries={(projectId) =>
                                navigateTo(SCREENS.entries, { projectId })
                            }
                            isAdmin={isAdmin}
                        />
                    )}

                    {activeScreen === SCREENS.entries && (
                        <EntryListScreen
                            filterProjectId={screenParams.projectId}
                            onOpenEntry={(entryId) =>
                                navigateTo(SCREENS.entryDetail, { entryId })
                            }
                        />
                    )}

                    {activeScreen === SCREENS.entryDetail &&
                        screenParams.entryId && (
                            <EntryDetailScreen
                                entryId={screenParams.entryId}
                                onBack={() => navigateTo(SCREENS.entries)}
                                isAdmin={isAdmin}
                            />
                        )}

                    {activeScreen === SCREENS.fieldLibrary && isAdmin && (
                        <FieldTypeLibraryScreen />
                    )}

                    {activeScreen === SCREENS.formBuilder && isAdmin && (
                        <TemplateBuilderScreen
                            onTemplateCreated={loadTemplates}
                        />
                    )}
                </main>
            </div>
        </div>
    );
}
