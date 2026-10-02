import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";
import ReactMarkdown from "react-markdown";

// Maps status/priority/severity values used across every module
// (Projects, Requirements, Tasks, Milestones, Test Cases, Bugs) to a
// consistent colored pill, instead of plain text.
const BADGE_TONES = {
  COMPLETED: "success",
  RESOLVED: "success",
  CLOSED: "success",
  DONE: "success",
  PASSED: "success",

  IN_PROGRESS: "warning",
  MEDIUM: "warning",
  REOPENED: "warning",

  HIGH: "danger",
  CRITICAL: "danger",
  OPEN: "danger",
  FAILED: "danger",
  BLOCKED: "danger",

  LOW: "info",
  PLANNED: "info",
  TODO: "info",
  PENDING: "info",
  NOT_EXECUTED: "info",
  FUNCTIONAL: "info",
  NON_FUNCTIONAL: "info",
};

// Small inline icon set for the sidebar — no external icon
// library is installed, so these are hand-drawn minimal SVGs.
const ICONS = {
  dashboard: (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2.5" y="2.5" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <rect x="11" y="2.5" width="6.5" height="4.5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <rect x="11" y="9" width="6.5" height="8.5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <rect x="2.5" y="11" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  ),
  projects: (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 5.5A1.5 1.5 0 0 1 4.5 4h3.4a1.5 1.5 0 0 1 1.2.6l.9 1.2a1.5 1.5 0 0 0 1.2.6H15.5A1.5 1.5 0 0 1 17 7.9v6.6A1.5 1.5 0 0 1 15.5 16h-11A1.5 1.5 0 0 1 3 14.5v-9Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  ),
  requirements: (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 3h7l3 3v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M7 9h6M7 12h6M7 15h3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  tasks: (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="14" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M6.5 10.2l2 2 4.5-4.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  milestones: (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 17V3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M5 4h9l-2.3 3L14 10H5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  ),
  testcases: (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 3h4M9 3v3.2a2 2 0 0 1-.4 1.2L5 13a2.5 2.5 0 0 0 2 4h6a2.5 2.5 0 0 0 2-4l-3.6-5.6a2 2 0 0 1-.4-1.2V3" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M6.5 12h7" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  ),
  bugs: (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="10" cy="11" rx="4" ry="5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10 6V4M7 6.5 5.5 4.8M13 6.5l1.5-1.7M4 11h2.2M13.8 11H16M4.8 15l1.9-1.3M13.3 13.7l1.9 1.3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  ),
  ai: (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 2.5l1.4 3.4 3.4 1.4-3.4 1.4L10 12.1l-1.4-3.4-3.4-1.4 3.4-1.4L10 2.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M15.5 12l.7 1.7 1.7.7-1.7.7-.7 1.7-.7-1.7-1.7-.7 1.7-.7.7-1.7Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
    </svg>
  ),
};

function NavIcon({ name }) {
  return <span className="nav-icon">{ICONS[name]}</span>;
}

function Badge({ value }) {
  if (!value) {
    return <span className="badge badge-neutral">—</span>;
  }

  const tone = BADGE_TONES[value] || "neutral";
  const label = String(value).replace(/_/g, " ");

  return <span className={`badge badge-${tone}`}>{label}</span>;
}

function App() {
  const [summary, setSummary] = useState({
    totalProjects: 0,
    totalRequirements: 0,
    totalTasks: 0,
    totalMilestones: 0,
    totalTestCases: 0,
    totalBugs: 0,
  });

  const [activePage, setActivePage] = useState("Dashboard");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // ================= ROLE PERMISSIONS =================

  const userRole = currentUser?.role || "";

  const canManageProjects =
    userRole === "ADMIN" || userRole === "PROJECT_MANAGER";

  const canManageRequirements =
    userRole === "ADMIN" || userRole === "PROJECT_MANAGER";

  const canManageTasks =
    userRole === "ADMIN" ||
    userRole === "PROJECT_MANAGER" ||
    userRole === "DEVELOPER";

  const canManageMilestones =
    userRole === "ADMIN" || userRole === "PROJECT_MANAGER";

  const canManageTestCases =
    userRole === "ADMIN" || userRole === "QA_TESTER";

  const canManageBugs =
    userRole === "ADMIN" || userRole === "QA_TESTER";

  // ================= PROJECTS =================

  const [projects, setProjects] = useState([]);

  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState(null);

  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectStatus, setProjectStatus] = useState("PLANNED");
  const [projectStartDate, setProjectStartDate] = useState("");
  const [projectEndDate, setProjectEndDate] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  // ================= REQUIREMENTS =================

  const [requirements, setRequirements] = useState([]);

  const [showRequirementForm, setShowRequirementForm] =
    useState(false);

  const [editingRequirementId, setEditingRequirementId] =
    useState(null);

  const [requirementTitle, setRequirementTitle] = useState("");
  const [requirementDescription, setRequirementDescription] =
    useState("");
  const [requirementPriority, setRequirementPriority] =
    useState("MEDIUM");
  const [requirementStatus, setRequirementStatus] =
    useState("PENDING");
  const [requirementType, setRequirementType] =
    useState("FUNCTIONAL");
  const [requirementProjectId, setRequirementProjectId] =
    useState("");
  const [requirementSearch, setRequirementSearch] = useState("");
  const [requirementStatusFilter, setRequirementStatusFilter] = useState("ALL");
  const [requirementTypeFilter, setRequirementTypeFilter] = useState("ALL");

  // ================= TASKS =================

  const [tasks, setTasks] = useState([]);

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskStatus, setTaskStatus] = useState("TODO");
  const [taskPriority, setTaskPriority] = useState("MEDIUM");
  const [taskAssignedTo, setTaskAssignedTo] = useState("");
  const [taskStartDate, setTaskStartDate] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskProjectId, setTaskProjectId] = useState("");
  const [taskRequirementId, setTaskRequirementId] = useState("");
  const [taskSearch, setTaskSearch] = useState("");
  const [taskStatusFilter, setTaskStatusFilter] = useState("ALL");
  const [taskPriorityFilter, setTaskPriorityFilter] = useState("ALL");
  const [taskProjectFilter, setTaskProjectFilter] = useState("ALL");

  // ================= MILESTONES =================

  const [milestones, setMilestones] = useState([]);

  const [showMilestoneForm, setShowMilestoneForm] =
    useState(false);

  const [editingMilestoneId, setEditingMilestoneId] =
    useState(null);

  const [milestoneName, setMilestoneName] = useState("");

  const [milestoneDescription, setMilestoneDescription] =
    useState("");

  const [milestoneStatus, setMilestoneStatus] =
    useState("PLANNED");

  const [milestoneStartDate, setMilestoneStartDate] =
    useState("");

  const [milestoneDueDate, setMilestoneDueDate] =
    useState("");

  const [milestoneProjectId, setMilestoneProjectId] =
    useState("");
  const [milestoneSearch, setMilestoneSearch] = useState("");
  const [milestoneStatusFilter, setMilestoneStatusFilter] = useState("ALL");
  const [milestoneProjectFilter, setMilestoneProjectFilter] = useState("ALL");

  // ================= TEST CASES =================

  const [testCases, setTestCases] = useState([]);

  const [showTestCaseForm, setShowTestCaseForm] =
    useState(false);

  const [editingTestCaseId, setEditingTestCaseId] =
    useState(null);

  const [testCaseTitle, setTestCaseTitle] = useState("");

  const [testCaseDescription, setTestCaseDescription] =
    useState("");

  const [testCasePreconditions, setTestCasePreconditions] =
    useState("");

  const [testCaseExpectedResult, setTestCaseExpectedResult] =
    useState("");

  const [testCaseActualResult, setTestCaseActualResult] =
    useState("");

  const [testCaseStatus, setTestCaseStatus] =
    useState("NOT_EXECUTED");

  const [testCasePriority, setTestCasePriority] =
    useState("MEDIUM");

  const [testCaseProjectId, setTestCaseProjectId] =
    useState("");
  const [testCaseSearch, setTestCaseSearch] = useState("");
  const [testCaseStatusFilter, setTestCaseStatusFilter] = useState("ALL");
  const [testCasePriorityFilter, setTestCasePriorityFilter] = useState("ALL");
  const [testCaseProjectFilter, setTestCaseProjectFilter] = useState("ALL");

  // ================= BUGS =================

  const [bugs, setBugs] = useState([]);

  const [showBugForm, setShowBugForm] = useState(false);
  const [editingBugId, setEditingBugId] = useState(null);

  const [bugTitle, setBugTitle] = useState("");
  const [bugDescription, setBugDescription] = useState("");
  const [bugSeverity, setBugSeverity] = useState("MEDIUM");
  const [bugPriority, setBugPriority] = useState("MEDIUM");
  const [bugStatus, setBugStatus] = useState("OPEN");
  const [bugAssignedTo, setBugAssignedTo] = useState("");
  const [bugReportedBy, setBugReportedBy] = useState("");
  const [bugCreatedDate, setBugCreatedDate] = useState("");
  const [bugProjectId, setBugProjectId] = useState("");
  const [bugTestCaseId, setBugTestCaseId] = useState("");
  const [bugSearch, setBugSearch] = useState("");
  const [bugSeverityFilter, setBugSeverityFilter] = useState("ALL");
  const [bugPriorityFilter, setBugPriorityFilter] = useState("ALL");
  const [bugStatusFilter, setBugStatusFilter] = useState("ALL");

  // ================= AI ASSISTANT =================

  const [aiText, setAiText] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiChatInput, setAiChatInput] = useState("");
  const [aiChatMessages, setAiChatMessages] = useState([]);
  const [aiChatLoading, setAiChatLoading] = useState(false);
  const [aiActionMode, setAiActionMode] = useState("chat");
  const [aiProjectStatusProjectId, setAiProjectStatusProjectId] = useState("");

  // ================= LOAD DATA =================

  useEffect(() => {
    loadDashboard();
    loadProjects();
    loadRequirements();
    loadTasks();
    loadMilestones();
    loadTestCases();
    loadBugs();
  }, []);

  // ================= DASHBOARD =================

  const loadDashboard = () => {
    axios
      .get("http://localhost:8080/api/dashboard/summary")
      .then((response) => {
        setSummary(response.data);
      })
      .catch((error) => {
        console.error("Error loading dashboard:", error);
      });
  };

  // ================= PROJECT FUNCTIONS =================

  const loadProjects = () => {
    axios
      .get("http://localhost:8080/api/projects")
      .then((response) => {
        setProjects(response.data);
      })
      .catch((error) => {
        console.error("Error loading projects:", error);
      });
  };

  const clearProjectForm = () => {
    setProjectName("");
    setProjectDescription("");
    setProjectStatus("PLANNED");
    setProjectStartDate("");
    setProjectEndDate("");
    setEditingProjectId(null);
  };

  const handleOpenAddForm = () => {
    clearProjectForm();
    setShowProjectForm(true);
  };

  const handleEditProject = (project) => {
    setEditingProjectId(project.id);
    setProjectName(project.name || "");
    setProjectDescription(project.description || "");
    setProjectStatus(project.status || "PLANNED");
    setProjectStartDate(project.startDate || "");
    setProjectEndDate(project.endDate || "");

    setShowProjectForm(true);
  };

  const handleSaveProject = () => {
    if (!projectName.trim()) {
      alert("Please enter a project name.");
      return;
    }

    if (!projectDescription.trim()) {
      alert("Please enter a project description.");
      return;
    }

    if (!projectStartDate) {
      alert("Please select a start date.");
      return;
    }

    if (!projectEndDate) {
      alert("Please select an end date.");
      return;
    }

    if (projectEndDate < projectStartDate) {
      alert("End date cannot be before start date.");
      return;
    }

    const projectData = {
      name: projectName,
      description: projectDescription,
      status: projectStatus,
      startDate: projectStartDate,
      endDate: projectEndDate,
    };

    if (editingProjectId !== null) {
      axios
        .put(
          `http://localhost:8080/api/projects/${editingProjectId}`,
          projectData
        )
        .then((response) => {
          setProjects((prevProjects) =>
            prevProjects.map((project) =>
              project.id === editingProjectId
                ? response.data
                : project
            )
          );

          clearProjectForm();
          setShowProjectForm(false);

          loadDashboard();
        })
        .catch((error) => {
          console.error("Error updating project:", error);
          alert("Unable to update project.");
        });

      return;
    }

    axios
      .post("http://localhost:8080/api/projects", projectData)
      .then((response) => {
        setProjects((prevProjects) => [
          ...prevProjects,
          response.data,
        ]);

        clearProjectForm();
        setShowProjectForm(false);

        loadDashboard();
      })
      .catch((error) => {
        console.error("Error creating project:", error);
        alert("Unable to create project.");
      });
  };

  const handleDeleteProject = (projectId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this project?"
    );

    if (!confirmDelete) {
      return;
    }

    axios
      .delete(`http://localhost:8080/api/projects/${projectId}`)
      .then(() => {
        setProjects((prevProjects) =>
          prevProjects.filter(
            (project) => project.id !== projectId
          )
        );

        loadDashboard();
      })
      .catch((error) => {
        console.error("Error deleting project:", error);
        alert(
          "Unable to delete project. It may contain related data."
        );
      });
  };

  const getProjectItems = (items, projectId) => {
    return items.filter((item) => {
      const itemProjectId =
        item?.project?.id ??
        item?.projectId ??
        item?.project?.projectId;

      return String(itemProjectId ?? "") === String(projectId);
    });
  };

  const getProjectMetrics = (projectId) => {
    const projectRequirements = getProjectItems(requirements, projectId);
    const projectTasks = getProjectItems(tasks, projectId);
    const projectMilestones = getProjectItems(milestones, projectId);
    const projectTests = getProjectItems(testCases, projectId);
    const projectBugs = getProjectItems(bugs, projectId);

    const completedTasks = projectTasks.filter((item) =>
      ["DONE", "COMPLETED"].includes(String(item.status || "").toUpperCase())
    ).length;

    const completedMilestones = projectMilestones.filter((item) =>
      ["DONE", "COMPLETED"].includes(String(item.status || "").toUpperCase())
    ).length;

    const passedTests = projectTests.filter((item) =>
      String(item.status || "").toUpperCase() === "PASSED"
    ).length;

    const openBugs = projectBugs.filter((item) =>
      !["RESOLVED", "CLOSED"].includes(String(item.status || "").toUpperCase())
    ).length;

    const taskProgress = projectTasks.length
      ? Math.round((completedTasks / projectTasks.length) * 100)
      : 0;
    const milestoneProgress = projectMilestones.length
      ? Math.round((completedMilestones / projectMilestones.length) * 100)
      : 0;
    const testingProgress = projectTests.length
      ? Math.round((passedTests / projectTests.length) * 100)
      : 0;

    const progressSources = [];
    if (projectTasks.length) progressSources.push(taskProgress);
    if (projectMilestones.length) progressSources.push(milestoneProgress);
    if (projectRequirements.length) {
      const completedRequirements = projectRequirements.filter((item) =>
        ["COMPLETED", "DONE", "APPROVED"].includes(String(item.status || "").toUpperCase())
      ).length;
      progressSources.push(Math.round((completedRequirements / projectRequirements.length) * 100));
    }

    const progress = progressSources.length
      ? Math.round(progressSources.reduce((sum, value) => sum + value, 0) / progressSources.length)
      : 0;

    return {
      requirements: projectRequirements.length,
      tasks: projectTasks.length,
      milestones: projectMilestones.length,
      testCases: projectTests.length,
      bugs: projectBugs.length,
      openBugs,
      passedTests,
      progress,
      taskProgress,
      milestoneProgress,
      testingProgress,
    };
  };

  // ================= REQUIREMENT FUNCTIONS =================

  const loadRequirements = () => {
    axios
      .get("http://localhost:8080/api/requirements")
      .then((response) => {
        setRequirements(response.data);
      })
      .catch((error) => {
        console.error(
          "Error loading requirements:",
          error
        );
      });
  };

  const clearRequirementForm = () => {
    setRequirementTitle("");
    setRequirementDescription("");
    setRequirementPriority("MEDIUM");
    setRequirementStatus("PENDING");
    setRequirementType("FUNCTIONAL");
    setRequirementProjectId("");
    setEditingRequirementId(null);
  };

  const handleOpenAddRequirement = () => {
    clearRequirementForm();
    setShowRequirementForm(true);
  };

  const handleEditRequirement = (requirement) => {
    setEditingRequirementId(requirement.id);

    setRequirementTitle(requirement.title || "");

    setRequirementDescription(
      requirement.description || ""
    );

    setRequirementPriority(
      requirement.priority || "MEDIUM"
    );

    setRequirementStatus(
      requirement.status || "PENDING"
    );

    setRequirementType(
      requirement.type || "FUNCTIONAL"
    );

    setRequirementProjectId(
      requirement.project
        ? String(requirement.project.id)
        : ""
    );

    setShowRequirementForm(true);
  };

  const handleSaveRequirement = () => {
    if (!requirementTitle.trim()) {
      alert("Please enter a requirement title.");
      return;
    }

    if (!requirementDescription.trim()) {
      alert("Please enter a requirement description.");
      return;
    }

    if (!requirementProjectId) {
      alert("Please select a project.");
      return;
    }

    const requirementData = {
      title: requirementTitle,
      description: requirementDescription,
      priority: requirementPriority,
      status: requirementStatus,
      type: requirementType,
      project: {
        id: Number(requirementProjectId),
      },
    };

    if (editingRequirementId !== null) {
      axios
        .put(
          `http://localhost:8080/api/requirements/${editingRequirementId}`,
          requirementData
        )
        .then((response) => {
          setRequirements((prevRequirements) =>
            prevRequirements.map((requirement) =>
              requirement.id === editingRequirementId
                ? response.data
                : requirement
            )
          );

          clearRequirementForm();
          setShowRequirementForm(false);

          loadDashboard();
        })
        .catch((error) => {
          console.error(
            "Error updating requirement:",
            error
          );

          alert("Unable to update requirement.");
        });

      return;
    }

    axios
      .post(
        "http://localhost:8080/api/requirements",
        requirementData
      )
      .then((response) => {
        setRequirements((prevRequirements) => [
          ...prevRequirements,
          response.data,
        ]);

        clearRequirementForm();
        setShowRequirementForm(false);

        loadDashboard();
      })
      .catch((error) => {
        console.error(
          "Error creating requirement:",
          error
        );

        alert("Unable to create requirement.");
      });
  };

  const handleDeleteRequirement = (requirementId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this requirement?"
    );

    if (!confirmDelete) {
      return;
    }

    axios
      .delete(
        `http://localhost:8080/api/requirements/${requirementId}`
      )
      .then(() => {
        setRequirements((prevRequirements) =>
          prevRequirements.filter(
            (requirement) =>
              requirement.id !== requirementId
          )
        );

        loadDashboard();
      })
      .catch((error) => {
        console.error(
          "Error deleting requirement:",
          error
        );

        alert("Unable to delete requirement.");
      });
  };

  // ================= TASK FUNCTIONS =================

  const loadTasks = () => {
    axios
      .get("http://localhost:8080/api/tasks")
      .then((response) => {
        setTasks(response.data);
      })
      .catch((error) => {
        console.error("Error loading tasks:", error);
      });
  };

  const clearTaskForm = () => {
    setTaskTitle("");
    setTaskDescription("");
    setTaskStatus("TODO");
    setTaskPriority("MEDIUM");
    setTaskAssignedTo("");
    setTaskStartDate("");
    setTaskDueDate("");
    setTaskProjectId("");
    setTaskRequirementId("");
    setEditingTaskId(null);
  };

  const handleOpenAddTask = () => {
    clearTaskForm();
    setShowTaskForm(true);
  };

  const handleEditTask = (task) => {
    setEditingTaskId(task.id);
    setTaskTitle(task.title || "");
    setTaskDescription(task.description || "");
    setTaskStatus(task.status || "TODO");
    setTaskPriority(task.priority || "MEDIUM");
    setTaskAssignedTo(task.assignedTo || "");
    setTaskStartDate(task.startDate || "");
    setTaskDueDate(task.dueDate || "");
    setTaskProjectId(
      task.project ? String(task.project.id) : ""
    );
    setTaskRequirementId(
      task.requirement ? String(task.requirement.id) : ""
    );
    setShowTaskForm(true);
  };

  const handleSaveTask = () => {
    if (!taskTitle.trim()) {
      alert("Please enter a task title.");
      return;
    }

    if (!taskDescription.trim()) {
      alert("Please enter a task description.");
      return;
    }

    if (!taskAssignedTo.trim()) {
      alert("Please enter who the task is assigned to.");
      return;
    }

    if (!taskStartDate) {
      alert("Please select a start date.");
      return;
    }

    if (!taskDueDate) {
      alert("Please select a due date.");
      return;
    }

    if (taskDueDate < taskStartDate) {
      alert("Due date cannot be before start date.");
      return;
    }

    if (!taskProjectId) {
      alert("Please select a project.");
      return;
    }

    if (!taskRequirementId) {
      alert("Please select a requirement.");
      return;
    }

    const taskData = {
      title: taskTitle,
      description: taskDescription,
      status: taskStatus,
      priority: taskPriority,
      assignedTo: taskAssignedTo,
      startDate: taskStartDate,
      dueDate: taskDueDate,
      project: {
        id: Number(taskProjectId),
      },
      requirement: {
        id: Number(taskRequirementId),
      },
    };

    if (editingTaskId !== null) {
      axios
        .put(
          `http://localhost:8080/api/tasks/${editingTaskId}`,
          taskData
        )
        .then((response) => {
          setTasks((prevTasks) =>
            prevTasks.map((task) =>
              task.id === editingTaskId
                ? response.data
                : task
            )
          );

          clearTaskForm();
          setShowTaskForm(false);
          loadDashboard();

          alert("Task updated successfully.");
        })
        .catch((error) => {
          console.error("Error updating task:", error);

          if (error.response) {
            console.error(
              "Backend response:",
              error.response.data
            );
          }

          alert("Unable to update task.");
        });

      return;
    }

    axios
      .post("http://localhost:8080/api/tasks", taskData)
      .then((response) => {
        setTasks((prevTasks) => [
          ...prevTasks,
          response.data,
        ]);

        clearTaskForm();
        setShowTaskForm(false);
        loadDashboard();

        alert("Task created successfully.");
      })
      .catch((error) => {
        console.error("Error creating task:", error);

        if (error.response) {
          console.error(
            "Backend response:",
            error.response.data
          );
        }

        alert("Unable to create task.");
      });
  };

  const handleDeleteTask = (taskId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this task?"
    );

    if (!confirmDelete) {
      return;
    }

    axios
      .delete(`http://localhost:8080/api/tasks/${taskId}`)
      .then(() => {
        setTasks((prevTasks) =>
          prevTasks.filter((task) => task.id !== taskId)
        );

        loadDashboard();
        alert("Task deleted successfully.");
      })
      .catch((error) => {
        console.error("Error deleting task:", error);

        if (error.response) {
          console.error(
            "Backend response:",
            error.response.data
          );
        }

        alert("Unable to delete task.");
      });
  };

  // ================= MILESTONE FUNCTIONS =================

  const loadMilestones = () => {
    axios
      .get("http://localhost:8080/api/milestones")
      .then((response) => {
        setMilestones(response.data);
      })
      .catch((error) => {
        console.error(
          "Error loading milestones:",
          error
        );
      });
  };

  const clearMilestoneForm = () => {
    setMilestoneName("");
    setMilestoneDescription("");
    setMilestoneStatus("PLANNED");
    setMilestoneStartDate("");
    setMilestoneDueDate("");
    setMilestoneProjectId("");
    setEditingMilestoneId(null);
  };

  const handleOpenAddMilestone = () => {
    clearMilestoneForm();
    setShowMilestoneForm(true);
  };

  const handleEditMilestone = (milestone) => {
    setEditingMilestoneId(milestone.id);

    setMilestoneName(milestone.name || "");

    setMilestoneDescription(
      milestone.description || ""
    );

    setMilestoneStatus(
      milestone.status || "PLANNED"
    );

    setMilestoneStartDate(
      milestone.startDate || ""
    );

    setMilestoneDueDate(
      milestone.dueDate || ""
    );

    setMilestoneProjectId(
      milestone.project
        ? String(milestone.project.id)
        : ""
    );

    setShowMilestoneForm(true);
  };

  const handleSaveMilestone = () => {
    if (!milestoneName.trim()) {
      alert("Please enter a milestone name.");
      return;
    }

    if (!milestoneDescription.trim()) {
      alert("Please enter a milestone description.");
      return;
    }

    if (!milestoneStartDate) {
      alert("Please select a start date.");
      return;
    }

    if (!milestoneDueDate) {
      alert("Please select a due date.");
      return;
    }

    if (milestoneDueDate < milestoneStartDate) {
      alert("Due date cannot be before start date.");
      return;
    }

    if (!milestoneProjectId) {
      alert("Please select a project.");
      return;
    }

    const milestoneData = {
      name: milestoneName,
      description: milestoneDescription,
      status: milestoneStatus,
      startDate: milestoneStartDate,
      dueDate: milestoneDueDate,
      project: {
        id: Number(milestoneProjectId),
      },
    };

    if (editingMilestoneId !== null) {
      axios
        .put(
          `http://localhost:8080/api/milestones/${editingMilestoneId}`,
          milestoneData
        )
        .then((response) => {
          setMilestones((prevMilestones) =>
            prevMilestones.map((milestone) =>
              milestone.id === editingMilestoneId
                ? response.data
                : milestone
            )
          );

          clearMilestoneForm();
          setShowMilestoneForm(false);

          loadDashboard();

          alert("Milestone updated successfully.");
        })
        .catch((error) => {
          console.error(
            "Error updating milestone:",
            error
          );

          if (error.response) {
            console.error(
              "Backend response:",
              error.response.data
            );
          }

          alert("Unable to update milestone.");
        });

      return;
    }

    axios
      .post(
        "http://localhost:8080/api/milestones",
        milestoneData
      )
      .then((response) => {
        setMilestones((prevMilestones) => [
          ...prevMilestones,
          response.data,
        ]);

        clearMilestoneForm();
        setShowMilestoneForm(false);

        loadDashboard();

        alert("Milestone created successfully.");
      })
      .catch((error) => {
        console.error(
          "Error creating milestone:",
          error
        );

        if (error.response) {
          console.error(
            "Backend response:",
            error.response.data
          );
        }

        alert("Unable to create milestone.");
      });
  };

  const handleDeleteMilestone = (milestoneId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this milestone?"
    );

    if (!confirmDelete) {
      return;
    }

    axios
      .delete(
        `http://localhost:8080/api/milestones/${milestoneId}`
      )
      .then(() => {
        setMilestones((prevMilestones) =>
          prevMilestones.filter(
            (milestone) =>
              milestone.id !== milestoneId
          )
        );

        loadDashboard();

        alert("Milestone deleted successfully.");
      })
      .catch((error) => {
        console.error(
          "Error deleting milestone:",
          error
        );

        if (error.response) {
          console.error(
            "Backend response:",
            error.response.data
          );
        }

        alert("Unable to delete milestone.");
      });
  };

  // =====================================================
  // ================= TEST CASE FUNCTIONS ===============
  // =====================================================

  const loadTestCases = () => {
    axios
      .get("http://localhost:8080/api/testcases")
      .then((response) => {
        setTestCases(response.data);
      })
      .catch((error) => {
        console.error(
          "Error loading test cases:",
          error
        );
      });
  };

  const clearTestCaseForm = () => {
    setTestCaseTitle("");
    setTestCaseDescription("");
    setTestCasePreconditions("");
    setTestCaseExpectedResult("");
    setTestCaseActualResult("");
    setTestCaseStatus("NOT_EXECUTED");
    setTestCasePriority("MEDIUM");
    setTestCaseProjectId("");
    setEditingTestCaseId(null);
  };

  const handleOpenAddTestCase = () => {
    clearTestCaseForm();
    setShowTestCaseForm(true);
  };

  const handleEditTestCase = (testCase) => {
    setEditingTestCaseId(testCase.id);

    setTestCaseTitle(testCase.title || "");

    setTestCaseDescription(
      testCase.description || ""
    );

    setTestCasePreconditions(
      testCase.preconditions || ""
    );

    setTestCaseExpectedResult(
      testCase.expectedResult || ""
    );

    setTestCaseActualResult(
      testCase.actualResult || ""
    );

    setTestCaseStatus(
      testCase.status || "NOT_EXECUTED"
    );

    setTestCasePriority(
      testCase.priority || "MEDIUM"
    );

    setTestCaseProjectId(
      testCase.project
        ? String(testCase.project.id)
        : ""
    );

    setShowTestCaseForm(true);
  };

  const handleSaveTestCase = () => {
    if (!testCaseTitle.trim()) {
      alert("Please enter a test case title.");
      return;
    }

    if (!testCaseDescription.trim()) {
      alert("Please enter a test case description.");
      return;
    }

    if (!testCasePreconditions.trim()) {
      alert("Please enter the preconditions.");
      return;
    }

    if (!testCaseExpectedResult.trim()) {
      alert("Please enter the expected result.");
      return;
    }

    if (!testCaseProjectId) {
      alert("Please select a project.");
      return;
    }

    const testCaseData = {
      title: testCaseTitle,
      description: testCaseDescription,
      preconditions: testCasePreconditions,
      expectedResult: testCaseExpectedResult,
      actualResult: testCaseActualResult,
      status: testCaseStatus,
      priority: testCasePriority,
      project: {
        id: Number(testCaseProjectId),
      },
    };

    if (editingTestCaseId !== null) {
      axios
        .put(
          `http://localhost:8080/api/testcases/${editingTestCaseId}`,
          testCaseData
        )
        .then((response) => {
          setTestCases((prevTestCases) =>
            prevTestCases.map((testCase) =>
              testCase.id === editingTestCaseId
                ? response.data
                : testCase
            )
          );

          clearTestCaseForm();
          setShowTestCaseForm(false);

          loadDashboard();

          alert("Test case updated successfully.");
        })
        .catch((error) => {
          console.error(
            "Error updating test case:",
            error
          );

          if (error.response) {
            console.error(
              "Backend response:",
              error.response.data
            );
          }

          alert("Unable to update test case.");
        });

      return;
    }

    axios
      .post(
        "http://localhost:8080/api/testcases",
        testCaseData
      )
      .then((response) => {
        setTestCases((prevTestCases) => [
          ...prevTestCases,
          response.data,
        ]);

        clearTestCaseForm();
        setShowTestCaseForm(false);

        loadDashboard();

        alert("Test case created successfully.");
      })
      .catch((error) => {
        console.error(
          "Error creating test case:",
          error
        );

        if (error.response) {
          console.error(
            "Backend response:",
            error.response.data
          );
        }

        alert("Unable to create test case.");
      });
  };

  const handleDeleteTestCase = (testCaseId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this test case?"
    );

    if (!confirmDelete) {
      return;
    }

    axios
      .delete(
        `http://localhost:8080/api/testcases/${testCaseId}`
      )
      .then(() => {
        setTestCases((prevTestCases) =>
          prevTestCases.filter(
            (testCase) =>
              testCase.id !== testCaseId
          )
        );

        loadDashboard();

        alert("Test case deleted successfully.");
      })
      .catch((error) => {
        console.error(
          "Error deleting test case:",
          error
        );

        if (error.response) {
          console.error(
            "Backend response:",
            error.response.data
          );
        }

        alert("Unable to delete test case.");
      });
  };

  // =====================================================
  // ================= BUG FUNCTIONS =====================
  // =====================================================

  const loadBugs = () => {
    axios
      .get("http://localhost:8080/api/bugs")
      .then((response) => {
        setBugs(response.data);
      })
      .catch((error) => {
        console.error(
          "Error loading bugs:",
          error
        );
      });
  };

  const clearBugForm = () => {
    setBugTitle("");
    setBugDescription("");
    setBugSeverity("MEDIUM");
    setBugPriority("MEDIUM");
    setBugStatus("OPEN");
    setBugAssignedTo("");
    setBugReportedBy("");
    setBugCreatedDate("");
    setBugProjectId("");
    setBugTestCaseId("");
    setEditingBugId(null);
  };

  const handleOpenAddBug = () => {
    clearBugForm();
    setShowBugForm(true);
  };

  const handleEditBug = (bug) => {
    setEditingBugId(bug.id);

    setBugTitle(bug.title || "");

    setBugDescription(
      bug.description || ""
    );

    setBugSeverity(
      bug.severity || "MEDIUM"
    );

    setBugPriority(
      bug.priority || "MEDIUM"
    );

    setBugStatus(
      bug.status || "OPEN"
    );

    setBugAssignedTo(
      bug.assignedTo || ""
    );

    setBugReportedBy(
      bug.reportedBy || ""
    );

    setBugCreatedDate(
      bug.createdDate || ""
    );

    setBugProjectId(
      bug.project
        ? String(bug.project.id)
        : ""
    );

    setBugTestCaseId(
      bug.testCase
        ? String(bug.testCase.id)
        : ""
    );

    setShowBugForm(true);
  };

  const handleSaveBug = () => {
    if (!bugTitle.trim()) {
      alert("Please enter a bug title.");
      return;
    }

    if (!bugDescription.trim()) {
      alert("Please enter a bug description.");
      return;
    }

    if (!bugAssignedTo.trim()) {
      alert("Please enter who the bug is assigned to.");
      return;
    }

    if (!bugReportedBy.trim()) {
      alert("Please enter who reported the bug.");
      return;
    }

    if (!bugCreatedDate) {
      alert("Please select the bug created date.");
      return;
    }

    if (!bugProjectId) {
      alert("Please select a project.");
      return;
    }

    if (!bugTestCaseId) {
      alert("Please select a test case.");
      return;
    }

    const bugData = {
      title: bugTitle,
      description: bugDescription,
      severity: bugSeverity,
      priority: bugPriority,
      status: bugStatus,
      assignedTo: bugAssignedTo,
      reportedBy: bugReportedBy,
      createdDate: bugCreatedDate,
      project: {
        id: Number(bugProjectId),
      },
      testCase: {
        id: Number(bugTestCaseId),
      },
    };

    // EDIT BUG

    if (editingBugId !== null) {
      axios
        .put(
          `http://localhost:8080/api/bugs/${editingBugId}`,
          bugData
        )
        .then((response) => {
          setBugs((prevBugs) =>
            prevBugs.map((bug) =>
              bug.id === editingBugId
                ? response.data
                : bug
            )
          );

          clearBugForm();
          setShowBugForm(false);

          loadDashboard();

          alert("Bug updated successfully.");
        })
        .catch((error) => {
          console.error(
            "Error updating bug:",
            error
          );

          if (error.response) {
            console.error(
              "Backend response:",
              error.response.data
            );
          }

          alert("Unable to update bug.");
        });

      return;
    }

    // ADD BUG

    axios
      .post(
        "http://localhost:8080/api/bugs",
        bugData
      )
      .then((response) => {
        setBugs((prevBugs) => [
          ...prevBugs,
          response.data,
        ]);

        clearBugForm();
        setShowBugForm(false);

        loadDashboard();

        alert("Bug created successfully.");
      })
      .catch((error) => {
        console.error(
          "Error creating bug:",
          error
        );

        if (error.response) {
          console.error(
            "Backend response:",
            error.response.data
          );
        }

        alert("Unable to create bug.");
      });
  };

  const handleDeleteBug = (bugId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this bug?"
    );

    if (!confirmDelete) {
      return;
    }

    axios
      .delete(
        `http://localhost:8080/api/bugs/${bugId}`
      )
      .then(() => {
        setBugs((prevBugs) =>
          prevBugs.filter(
            (bug) => bug.id !== bugId
          )
        );

        loadDashboard();

        alert("Bug deleted successfully.");
      })
      .catch((error) => {
        console.error(
          "Error deleting bug:",
          error
        );

        if (error.response) {
          console.error(
            "Backend response:",
            error.response.data
          );
        }

        alert("Unable to delete bug.");
      });
  };

  // ================= AI ASSISTANT FUNCTION =================

  const handleAIProcess = () => {

    if (!aiText.trim()) {
      alert("Please enter some text.");
      return;
    }

    setAiLoading(true);
    setAiResult("");

    axios
      .post("http://localhost:8080/api/ai/process", {
        text: aiText
      })
      .then((response) => {
        setAiResult(response.data.result);
      })
      .catch((error) => {
        console.error(
          "Error processing AI request:",
          error
        );

        if (error.response) {
          console.error(
            "Backend response:",
            error.response.data
          );
        }

        alert("Unable to connect to AI Assistant.");
      })
      .finally(() => {
        setAiLoading(false);
      });
  };

  const handleAIChat = async () => {
    const message = aiChatInput.trim();

    if (!message || aiChatLoading) {
      return;
    }

    const userMessage = {
      role: "user",
      content: message,
    };

    setAiChatMessages((prev) => [
      ...prev,
      userMessage,
    ]);

    setAiChatInput("");
    setAiChatLoading(true);

    try {
      let response;

      if (aiActionMode === "summarize-requirement") {
        response = await axios.post(
          "http://localhost:8080/api/ai/summarize-requirement",
          {
            requirement: message,
          }
        );
      } else if (aiActionMode === "classify-bug") {
        response = await axios.post(
          "http://localhost:8080/api/ai/classify-bug",
          {
            bugDescription: message,
          }
        );
      } else if (aiActionMode === "generate-test-cases") {
        response = await axios.post(
          "http://localhost:8080/api/ai/generate-test-cases",
          {
            requirement: message,
          }
        );
      } else if (aiActionMode === "project-status") {
        const projectId = Number(message);

        if (!Number.isInteger(projectId) || projectId <= 0) {
          throw new Error("Please enter a valid project ID.");
        }

        const statusResponse = await axios.get(
          `http://localhost:8080/api/ai/project-status/${projectId}`
        );

        const statusData = statusResponse.data || {};
        const project = projects.find(
          (item) => String(item.id) === String(projectId)
        );

        const projectName =
          project?.name || `Project ${projectId}`;

        const verifiedProjectData =
          `Project Name: ${projectName}\n` +
          `Project Status: ${statusData.projectStatus || "Unknown"}\n` +
          `Task Completion: ${Number(statusData.taskCompletion || 0).toFixed(1)}%\n` +
          `Completed Tasks: ${statusData.completedTasks || 0} / ${statusData.totalTasks || 0}\n` +
          `Milestone Progress: ${Number(statusData.milestoneProgress || 0).toFixed(1)}%\n` +
          `Completed Milestones: ${statusData.completedMilestones || 0} / ${statusData.totalMilestones || 0}\n` +
          `Testing Progress: ${Number(statusData.testingProgress || 0).toFixed(1)}%\n` +
          `Passed Test Cases: ${statusData.passedTestCases || 0} / ${statusData.totalTestCases || 0}\n` +
          `Open Bugs: ${statusData.openBugs || 0}\n` +
          `High/Critical Bugs: ${statusData.highSeverityBugs || 0}`;

        response = await axios.post(
          "http://localhost:8080/api/ai/chat",
          {
            message:
              "You are ProjectHub AI. Create a concise professional project status summary using ONLY the verified project metrics below. Do not invent dates, causes, risks, percentages or achievements. Include Project Status, Progress Summary, Quality Summary and Recommended Next Step.\n\n" +
              verifiedProjectData,
          }
        );
      } else {
        response = await axios.post(
          "http://localhost:8080/api/ai/chat",
          {
            message: message,
          }
        );
      }

      const aiMessage = {
        role: "assistant",
        content:
          response.data?.result ||
          "Sorry, I couldn't generate a response.",
      };

      setAiChatMessages((prev) => [
        ...prev,
        aiMessage,
      ]);
    } catch (error) {
      console.error("AI chat error:", error);

      setAiChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            error.message === "Please enter a valid project ID."
              ? error.message
              : "Sorry, I couldn't connect to the AI assistant. Please make sure the backend and Ollama are running.",
        },
      ]);
    } finally {
      setAiChatLoading(false);
      setAiActionMode("chat");
      setAiProjectStatusProjectId("");
    }
  };

  const handleClearAIChat = () => {
    setAiChatMessages([]);
    setAiChatInput("");
  };

  // ================= LOGIN =================

  const handleLogin = () => {
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError("Please enter your email and password.");
      return;
    }

    setLoginLoading(true);
    setLoginError("");

    axios
      .post("http://localhost:8080/api/users/login", {
        email: loginEmail,
        password: loginPassword,
      })
      .then((response) => {
        if (!response.data) {
          setLoginError("Invalid email or password.");
          return;
        }

        const user = response.data;

        setCurrentUser({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        });

        setIsLoggedIn(true);
        setActivePage("Dashboard");

        setLoginEmail("");
        setLoginPassword("");
      })
      .catch((error) => {
        console.error("Login error:", error);
        setLoginError("Unable to login. Please try again.");
      })
      .finally(() => {
        setLoginLoading(false);
      });
  };

  // ================= PROFILE FUNCTIONS =================

  const handleOpenProfileEdit = () => {
    setProfileName(currentUser?.name || "");
    setProfileEmail(currentUser?.email || "");
    setIsEditingProfile(true);
  };

  const handleCancelProfileEdit = () => {
    setProfileName(currentUser?.name || "");
    setProfileEmail(currentUser?.email || "");
    setIsEditingProfile(false);
  };

  const handleSaveProfile = () => {
    if (!profileName.trim()) {
      alert("Please enter your name.");
      return;
    }

    if (!profileEmail.trim()) {
      alert("Please enter your email.");
      return;
    }

    setProfileSaving(true);

    axios
      .put(`http://localhost:8080/api/users/${currentUser.id}`, {
        name: profileName,
        email: profileEmail,
        role: currentUser.role,
      })
      .then((response) => {
        const updatedUser = response.data;

        setCurrentUser({
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
        });

        setIsEditingProfile(false);

        alert("Profile updated successfully.");
      })
      .catch((error) => {
        console.error("Error updating profile:", error);
        alert("Unable to update profile.");
      })
      .finally(() => {
        setProfileSaving(false);
      });
  };

  const handleDeleteAccount = () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to permanently delete your account? This action cannot be undone."
    );

    if (!confirmDelete) {
      return;
    }

    axios
      .delete(`http://localhost:8080/api/users/${currentUser.id}`)
      .then(() => {
        alert("Account deleted successfully.");

        setIsLoggedIn(false);
        setCurrentUser(null);
        setActivePage("Dashboard");
        setLoginEmail("");
        setLoginPassword("");
        setLoginError("");
      })
      .catch((error) => {
        console.error("Error deleting account:", error);
        alert("Unable to delete your account.");
      });
  };

  // ================= LOGOUT =================
  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setActivePage("Dashboard");

    setLoginEmail("");
    setLoginPassword("");
    setLoginError("");

    localStorage.removeItem("projectHubUser");
  };

  // ================= UI =================

  // ================= LOGIN SCREEN =================

  if (!isLoggedIn) {
    return (
      <div className="login-page">
        <div className="login-card">

          <div className="login-brand">
            <div className="login-logo">PH</div>
            <h1>ProjectHub</h1>
          </div>

          <p className="login-subtitle">
            AI-Assisted Software Project and Quality Management System
          </p>

          <h2>Welcome back</h2>
          <p className="login-description">
            Sign in to manage your software projects and quality activities.
          </p>

          <label>Email</label>

          <input
            type="email"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            placeholder="Enter your email"
          />

          <label>Password</label>

          <input
            type="password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            placeholder="Enter your password"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleLogin();
              }
            }}
          />

          {loginError && (
            <div className="login-error">
              {loginError}
            </div>
          )}

          <button
            className="login-button"
            onClick={handleLogin}
            disabled={loginLoading}
          >
            {loginLoading ? "Signing in..." : "Sign In"}
          </button>

        </div>
      </div>
    );
  }

  return (
    <div className="layout">

      {/* ================= SIDEBAR ================= */}

      <aside className="sidebar">

        <div className="sidebar-brand">
          <span className="sidebar-logo">PH</span>
          <h2>ProjectHub</h2>
        </div>

        <nav className="sidebar-nav">

          <div className="nav-section-label">Workspace</div>

          <div
            className={`nav-item ${activePage === "Dashboard" ? "active" : ""}`}
            onClick={() => setActivePage("Dashboard")}
          >
            <NavIcon name="dashboard" />
            <span>Dashboard</span>
          </div>

          <div className="nav-section-label">Planning</div>

          {canManageProjects && (
            <div className={`nav-item ${activePage === "Projects" ? "active" : ""}`} onClick={() => setActivePage("Projects")}>
              <NavIcon name="projects" />
              <span>Projects</span>
            </div>
          )}

          {canManageRequirements && (
            <div className={`nav-item ${activePage === "Requirements" ? "active" : ""}`} onClick={() => setActivePage("Requirements")}>
              <NavIcon name="requirements" />
              <span>Requirements</span>
            </div>
          )}

          {canManageTasks && (
            <div className={`nav-item ${activePage === "Tasks" ? "active" : ""}`} onClick={() => setActivePage("Tasks")}>
              <NavIcon name="tasks" />
              <span>Tasks</span>
            </div>
          )}

          {canManageMilestones && (
            <div className={`nav-item ${activePage === "Milestones" ? "active" : ""}`} onClick={() => setActivePage("Milestones")}>
              <NavIcon name="milestones" />
              <span>Milestones</span>
            </div>
          )}

          <div className="nav-section-label">Quality</div>

          {canManageTestCases && (
            <div className={`nav-item ${activePage === "Test Cases" ? "active" : ""}`} onClick={() => setActivePage("Test Cases")}>
              <NavIcon name="testcases" />
              <span>Test Cases</span>
            </div>
          )}

          {canManageBugs && (
            <div className={`nav-item ${activePage === "Bugs" ? "active" : ""}`} onClick={() => setActivePage("Bugs")}>
              <NavIcon name="bugs" />
              <span>Bugs</span>
            </div>
          )}

          <div className="nav-section-label">Intelligence</div>

          <div
            className={`nav-item nav-item-ai ${activePage === "AI Assistant" ? "active" : ""}`}
            onClick={() => setActivePage("AI Assistant")}
          >
            <NavIcon name="ai" />
            <span>AI Assistant</span>
          </div>

        </nav>

        {/* ================= USER ACCOUNT ================= */}
        {currentUser && (
          <div className="sidebar-account">

            <div className="sidebar-user">
              <div className="sidebar-user-avatar">
                {currentUser.name
                  ? currentUser.name.charAt(0).toUpperCase()
                  : "U"}
              </div>

              <div className="sidebar-user-info">
                <strong>{currentUser.name}</strong>
                <span>
                  {currentUser.role
                    ? currentUser.role.replace(/_/g, " ")
                    : "User"}
                </span>
              </div>
            </div>

            <button
              className="sidebar-account-button"
              onClick={() => setActivePage("My Profile")}
            >
              <span>My Profile</span>
            </button>

            <button
              className="sidebar-logout"
              onClick={handleLogout}
            >
              Logout
            </button>

          </div>
        )}

      </aside>

      {/* ================= MAIN CONTENT ================= */}

      <main className="main-content">

        <header className="app-topbar">
          <div className="topbar-search">
            <span className="topbar-search-icon">⌕</span>
            <span>Search projects, tasks, requirements...</span>
            <kbd>Ctrl K</kbd>
          </div>
          <div className="topbar-actions">
            <button className="topbar-icon-button" type="button" title="Help">?</button>
            <button className="topbar-icon-button" type="button" title="Notifications">○</button>
            <div className="topbar-user">
              <span className="topbar-avatar">{currentUser?.name?.charAt(0)?.toUpperCase() || "U"}</span>
              <span className="topbar-user-name">{currentUser?.name || "User"}</span>
            </div>
          </div>
        </header>

        <div className="page-header">
          <div>
            <div className="page-eyebrow">ProjectHub / Workspace</div>
            <h1>{activePage}</h1>
            <p>{
              activePage === "Dashboard" ? "Overview of delivery, quality and project health." :
              activePage === "Projects" ? "Plan and monitor software projects from one workspace." :
              activePage === "Requirements" ? "Capture and manage functional and non-functional requirements." :
              activePage === "Tasks" ? "Track execution, ownership, priorities and delivery progress." :
              activePage === "Milestones" ? "Monitor important delivery checkpoints and dates." :
              activePage === "Test Cases" ? "Design, execute and track software quality checks." :
              activePage === "Bugs" ? "Track defects, severity, priority and resolution status." :
              activePage === "AI Assistant" ? "AI-assisted support for requirements, QA and project delivery." :
              activePage === "My Profile" ? "Manage your account information and preferences." :
              "Software project and quality management workspace."
            }</p>
          </div>
          <div className="page-header-meta">
            <span className="workspace-status"><span></span> Workspace active</span>
          </div>
        </div>

        {/* ================= MY PROFILE ================= */}
        {activePage === "My Profile" && currentUser && (
          <div className="profile-page">

            <div className="profile-header">
              <h3>My Profile</h3>
              <p>View and manage your account information.</p>
            </div>

            <div className="profile-card">

              <div className="profile-avatar">
                {currentUser.name
                  ? currentUser.name.charAt(0).toUpperCase()
                  : "U"}
              </div>

              <div className="profile-details">

                {/* NAME */}
                <div className="profile-field">
                  <span className="profile-label">Name</span>

                  {isEditingProfile ? (
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="profile-edit-input"
                    />
                  ) : (
                    <strong>{currentUser.name}</strong>
                  )}
                </div>

                {/* EMAIL */}
                <div className="profile-field">
                  <span className="profile-label">Email</span>

                  {isEditingProfile ? (
                    <input
                      type="email"
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      className="profile-edit-input"
                    />
                  ) : (
                    <strong>{currentUser.email}</strong>
                  )}
                </div>

                {/* ROLE */}
                <div className="profile-field">
                  <span className="profile-label">Role</span>

                  <strong>
                    {currentUser.role
                      ? currentUser.role.replace(/_/g, " ")
                      : "User"}
                  </strong>

                  {isEditingProfile && (
                    <small className="profile-role-note">
                      Role can only be changed by an administrator.
                    </small>
                  )}
                </div>

                {/* ACTION BUTTONS */}
                <div className="profile-actions">

                  {!isEditingProfile ? (
                    <button
                      className="profile-edit-button"
                      onClick={handleOpenProfileEdit}
                    >
                      Edit Profile
                    </button>
                  ) : (
                    <>
                      <button
                        className="profile-save-button"
                        onClick={handleSaveProfile}
                        disabled={profileSaving}
                      >
                        {profileSaving ? "Saving..." : "Save Changes"}
                      </button>

                      <button
                        className="profile-cancel-button"
                        onClick={handleCancelProfileEdit}
                        disabled={profileSaving}
                      >
                        Cancel
                      </button>
                    </>
                  )}

                </div>

                {/* DELETE ACCOUNT */}
                {!isEditingProfile && (
                  <div className="profile-danger-zone">

                    <div>
                      <strong>Delete Account</strong>
                      <p>
                        Permanently delete your account and sign out.
                      </p>
                    </div>

                    <button
                      className="profile-delete-button"
                      onClick={handleDeleteAccount}
                    >
                      Delete Account
                    </button>

                  </div>
                )}

              </div>
            </div>

          </div>
        )}

        {/* ================= DASHBOARD ================= */}

        {activePage === "Dashboard" && (

          <div className="dashboard-page">
            <div className="dashboard-toolbar">
              <div>
                <strong>Workspace overview</strong>
                <span>Live summary from your project data</span>
              </div>
              <span className="dashboard-date">Today</span>
            </div>

            <div className="dashboard-cards">

            <div className="card stat-card stat-projects">
              <span className="stat-icon"><NavIcon name="projects" /></span>
              <h3>Projects</h3>
              <p>{summary.totalProjects}</p>
            </div>

            <div className="card stat-card stat-requirements">
              <span className="stat-icon"><NavIcon name="requirements" /></span>
              <h3>Requirements</h3>
              <p>{summary.totalRequirements}</p>
            </div>

            <div className="card stat-card stat-tasks">
              <span className="stat-icon"><NavIcon name="tasks" /></span>
              <h3>Tasks</h3>
              <p>{summary.totalTasks}</p>
            </div>

            <div className="card stat-card stat-milestones">
              <span className="stat-icon"><NavIcon name="milestones" /></span>
              <h3>Milestones</h3>
              <p>{summary.totalMilestones}</p>
            </div>

            <div className="card stat-card stat-testcases">
              <span className="stat-icon"><NavIcon name="testcases" /></span>
              <h3>Test Cases</h3>
              <p>{summary.totalTestCases}</p>
            </div>

            <div className="card stat-card stat-bugs">
              <span className="stat-icon"><NavIcon name="bugs" /></span>
              <h3>Bugs</h3>
              <p>{summary.totalBugs}</p>
            </div>

            </div>

            <div className="dashboard-lower-grid">
              <section className="dashboard-panel">
                <div className="panel-heading">
                  <div><strong>Delivery overview</strong><span>Current workload across the workspace</span></div>
                </div>
                <div className="progress-row"><div><span>Requirements</span><strong>{summary.totalRequirements}</strong></div><div className="progress-track"><span style={{ width: `${Math.min(summary.totalRequirements * 5, 100)}%` }}></span></div></div>
                <div className="progress-row"><div><span>Tasks</span><strong>{summary.totalTasks}</strong></div><div className="progress-track"><span style={{ width: `${Math.min(summary.totalTasks * 5, 100)}%` }}></span></div></div>
                <div className="progress-row"><div><span>Milestones</span><strong>{summary.totalMilestones}</strong></div><div className="progress-track"><span style={{ width: `${Math.min(summary.totalMilestones * 10, 100)}%` }}></span></div></div>
              </section>

              <section className="dashboard-panel quality-panel">
                <div className="panel-heading">
                  <div><strong>Quality snapshot</strong><span>Testing and defect workload</span></div>
                </div>
                <div className="quality-metrics">
                  <div><span>Test cases</span><strong>{summary.totalTestCases}</strong></div>
                  <div><span>Open bugs</span><strong className={summary.totalBugs > 0 ? "metric-danger" : "metric-success"}>{summary.totalBugs}</strong></div>
                </div>
                <div className="quality-note">Use the Test Cases and Bugs workspaces to keep quality signals current.</div>
              </section>
            </div>
          </div>

        )}

        {/* ================= PROJECTS ================= */}

        {activePage === "Projects" && (

          <div className="projects-workspace">

            {selectedProjectId !== null ? (
              (() => {
                const project = projects.find((item) => item.id === selectedProjectId);
                if (!project) {
                  return (
                    <div className="empty-state">
                      <strong>Project not found</strong>
                      <span>The selected project is no longer available.</span>
                      <button type="button" className="button button-secondary" onClick={() => setSelectedProjectId(null)}>Back to Projects</button>
                    </div>
                  );
                }
                const metrics = getProjectMetrics(project.id);

                return (
                  <div className="project-detail-page">
                    <button
                      type="button"
                      className="back-link"
                      onClick={() => setSelectedProjectId(null)}
                    >
                      ← Back to Projects
                    </button>

                    <div className="project-detail-header">
                      <div>
                        <div className="eyebrow">Project workspace</div>
                        <h2>{project.name}</h2>
                        <p>{project.description || "No project description provided."}</p>
                      </div>
                      <div className="project-detail-actions">
                        <Badge value={project.status} />
                        {canManageProjects && (
                          <button
                            type="button"
                            className="button button-secondary"
                            onClick={() => handleEditProject(project)}
                          >
                            Edit Project
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="project-meta-strip">
                      <span><strong>Start</strong>{project.startDate || "—"}</span>
                      <span><strong>End</strong>{project.endDate || "—"}</span>
                      <span><strong>Progress</strong>{metrics.progress}%</span>
                      <span><strong>Open Bugs</strong>{metrics.openBugs}</span>
                    </div>

                    <div className="project-detail-grid">
                      <section className="workspace-panel project-progress-panel">
                        <div className="panel-heading">
                          <div>
                            <strong>Delivery progress</strong>
                            <span>Current project execution across core work items.</span>
                          </div>
                          <strong className="progress-value">{metrics.progress}%</strong>
                        </div>
                        <div className="large-progress-track">
                          <span style={{ width: `${metrics.progress}%` }} />
                        </div>
                        <div className="project-progress-list">
                          <div><span>Tasks</span><strong>{metrics.taskProgress}%</strong></div>
                          <div><span>Milestones</span><strong>{metrics.milestoneProgress}%</strong></div>
                          <div><span>Testing</span><strong>{metrics.testingProgress}%</strong></div>
                        </div>
                      </section>

                      <section className="workspace-panel">
                        <div className="panel-heading">
                          <div>
                            <strong>Project health</strong>
                            <span>Live counts from your project data.</span>
                          </div>
                        </div>
                        <div className="project-health-grid">
                          <div><span>Requirements</span><strong>{metrics.requirements}</strong></div>
                          <div><span>Tasks</span><strong>{metrics.tasks}</strong></div>
                          <div><span>Milestones</span><strong>{metrics.milestones}</strong></div>
                          <div><span>Test cases</span><strong>{metrics.testCases}</strong></div>
                          <div><span>Passed tests</span><strong className="metric-success">{metrics.passedTests}</strong></div>
                          <div><span>Open bugs</span><strong className={metrics.openBugs ? "metric-danger" : "metric-success"}>{metrics.openBugs}</strong></div>
                        </div>
                      </section>
                    </div>

                    <section className="workspace-panel project-links-panel">
                      <div className="panel-heading">
                        <div>
                          <strong>Project workspaces</strong>
                          <span>Open the related management area to continue delivery.</span>
                        </div>
                      </div>
                      <div className="project-workspace-links">
                        <button type="button" onClick={() => setActivePage("Requirements")}>Requirements <span>→</span></button>
                        <button type="button" onClick={() => setActivePage("Tasks")}>Tasks <span>→</span></button>
                        <button type="button" onClick={() => setActivePage("Milestones")}>Milestones <span>→</span></button>
                        <button type="button" onClick={() => setActivePage("Test Cases")}>Testing <span>→</span></button>
                        <button type="button" onClick={() => setActivePage("Bugs")}>Bugs <span>→</span></button>
                      </div>
                    </section>
                  </div>
                );
              })()
            ) : (
              <>
                <div className="module-toolbar">
                  <div>
                    <div className="eyebrow">Planning</div>
                    <h2>Projects</h2>
                    <p>Manage software projects, delivery timelines and project health.</p>
                  </div>
                  {canManageProjects && (
                    <button className="button button-primary" type="button" onClick={handleOpenAddForm}>
                      + New Project
                    </button>
                  )}
                </div>

                <div className="project-table-toolbar">
                  <div className="table-search">
                    <span>⌕</span>
                    <input
                      type="search"
                      placeholder="Search projects..."
                      onChange={(e) => {
                        const value = e.target.value.toLowerCase();
                        document.querySelectorAll("[data-project-row]").forEach((row) => {
                          row.style.display = row.dataset.search.includes(value) ? "" : "none";
                        });
                      }}
                    />
                  </div>
                  <span className="table-count">{projects.length} project{projects.length === 1 ? "" : "s"}</span>
                </div>

                {showProjectForm && (
                  <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) { clearProjectForm(); setShowProjectForm(false); } }}>
                    <div className="modal-card project-modal" role="dialog" aria-modal="true">
                      <div className="modal-header">
                        <div>
                          <div className="eyebrow">Project</div>
                          <h3>{editingProjectId !== null ? "Edit Project" : "New Project"}</h3>
                        </div>
                        <button type="button" className="modal-close" onClick={() => { clearProjectForm(); setShowProjectForm(false); }}>×</button>
                      </div>

                      <div className="modal-body">
                        <label>Project name<input type="text" placeholder="e.g. Customer Portal" value={projectName} onChange={(e) => setProjectName(e.target.value)} /></label>
                        <label>Description<textarea placeholder="Describe the project and its goal..." rows="4" value={projectDescription} onChange={(e) => setProjectDescription(e.target.value)} /></label>
                        <div className="form-grid-2">
                          <label>Status<select value={projectStatus} onChange={(e) => setProjectStatus(e.target.value)}><option value="PLANNED">Planned</option><option value="IN_PROGRESS">In Progress</option><option value="COMPLETED">Completed</option></select></label>
                          <label>Start date<input type="date" value={projectStartDate} onChange={(e) => setProjectStartDate(e.target.value)} /></label>
                        </div>
                        <label>End date<input type="date" value={projectEndDate} onChange={(e) => setProjectEndDate(e.target.value)} /></label>
                      </div>

                      <div className="modal-footer">
                        <button type="button" className="button button-secondary" onClick={() => { clearProjectForm(); setShowProjectForm(false); }}>Cancel</button>
                        <button type="button" className="button button-primary" onClick={handleSaveProject}>{editingProjectId !== null ? "Save Changes" : "Create Project"}</button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="workspace-panel project-table-panel">
                  {projects.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-state-icon">P</div>
                      <strong>No projects yet</strong>
                      <span>Create your first project to start tracking requirements, tasks, milestones and quality.</span>
                      {canManageProjects && <button className="button button-primary" type="button" onClick={handleOpenAddForm}>Create Project</button>}
                    </div>
                  ) : (
                    <div className="data-table-wrap">
                      <table className="data-table project-data-table">
                        <thead><tr><th>Project</th><th>Status</th><th>Progress</th><th>Timeline</th><th className="table-actions-heading">Actions</th></tr></thead>
                        <tbody>
                          {projects.map((project) => {
                            const metrics = getProjectMetrics(project.id);
                            const search = `${project.name || ""} ${project.description || ""} ${project.status || ""}`.toLowerCase();
                            return (
                              <tr key={project.id} data-project-row data-search={search}>
                                <td>
                                  <button type="button" className="project-name-button" onClick={() => setSelectedProjectId(project.id)}>{project.name}</button>
                                  <span className="table-secondary">{project.description || "No description"}</span>
                                </td>
                                <td><Badge value={project.status} /></td>
                                <td>
                                  <div className="table-progress">
                                    <div className="table-progress-track"><span style={{ width: `${metrics.progress}%` }} /></div>
                                    <strong>{metrics.progress}%</strong>
                                  </div>
                                </td>
                                <td><span className="timeline-text">{project.startDate || "—"} <span>→</span> {project.endDate || "—"}</span></td>
                                <td>
                                  <div className="row-actions">
                                    <button type="button" className="row-action" onClick={() => setSelectedProjectId(project.id)}>Open</button>
                                    {canManageProjects && <button type="button" className="row-action" onClick={() => handleEditProject(project)}>Edit</button>}
                                    {canManageProjects && <button type="button" className="row-action row-action-danger" onClick={() => handleDeleteProject(project.id)}>Delete</button>}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ================= REQUIREMENTS ================= */}

        {activePage === "Requirements" && (
          <div className="module-page">
            <div className="module-page-header">
              <div>
                <div className="breadcrumb">ProjectHub / Planning</div>
                <h2>Requirements</h2>
                <p>Capture, prioritize and track functional and non-functional requirements.</p>
              </div>
              {canManageRequirements && (
                <button className="primary-action" onClick={handleOpenAddRequirement}>
                  + New Requirement
                </button>
              )}
            </div>

            <div className="module-toolbar">
              <div className="module-search">
                <span>⌕</span>
                <input
                  type="text"
                  placeholder="Search requirements..."
                  value={requirementSearch}
                  onChange={(e) => setRequirementSearch(e.target.value)}
                />
              </div>
              <select value={requirementStatusFilter} onChange={(e) => setRequirementStatusFilter(e.target.value)}>
                <option value="ALL">All statuses</option>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
              <select value={requirementTypeFilter} onChange={(e) => setRequirementTypeFilter(e.target.value)}>
                <option value="ALL">All types</option>
                <option value="FUNCTIONAL">Functional</option>
                <option value="NON_FUNCTIONAL">Non-Functional</option>
              </select>
            </div>

            {showRequirementForm && (
              <div className="modal-backdrop" onMouseDown={() => { clearRequirementForm(); setShowRequirementForm(false); }}>
                <div className="module-modal" onMouseDown={(e) => e.stopPropagation()}>
                  <div className="module-modal-header">
                    <div>
                      <span className="modal-eyebrow">Requirement management</span>
                      <h3>{editingRequirementId !== null ? "Edit Requirement" : "New Requirement"}</h3>
                    </div>
                    <button className="modal-close" type="button" onClick={() => { clearRequirementForm(); setShowRequirementForm(false); }}>×</button>
                  </div>

                  <div className="form-grid">
                    <label className="form-field full-width">
                      <span>Title</span>
                      <input type="text" placeholder="Requirement title" value={requirementTitle} onChange={(e) => setRequirementTitle(e.target.value)} />
                    </label>
                    <label className="form-field full-width">
                      <span>Description</span>
                      <textarea placeholder="Describe the requirement clearly..." rows="5" value={requirementDescription} onChange={(e) => setRequirementDescription(e.target.value)} />
                    </label>
                    <label className="form-field">
                      <span>Priority</span>
                      <select value={requirementPriority} onChange={(e) => setRequirementPriority(e.target.value)}>
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="CRITICAL">Critical</option>
                      </select>
                    </label>
                    <label className="form-field">
                      <span>Status</span>
                      <select value={requirementStatus} onChange={(e) => setRequirementStatus(e.target.value)}>
                        <option value="PENDING">Pending</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="COMPLETED">Completed</option>
                      </select>
                    </label>
                    <label className="form-field">
                      <span>Type</span>
                      <select value={requirementType} onChange={(e) => setRequirementType(e.target.value)}>
                        <option value="FUNCTIONAL">Functional</option>
                        <option value="NON_FUNCTIONAL">Non-Functional</option>
                      </select>
                    </label>
                    <label className="form-field">
                      <span>Project</span>
                      <select value={requirementProjectId} onChange={(e) => setRequirementProjectId(e.target.value)}>
                        <option value="">Select project</option>
                        {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                      </select>
                    </label>
                  </div>

                  <div className="module-modal-footer">
                    <button className="secondary-action" type="button" onClick={() => { clearRequirementForm(); setShowRequirementForm(false); }}>Cancel</button>
                    <button className="primary-action" type="button" onClick={handleSaveRequirement}>
                      {editingRequirementId !== null ? "Save Changes" : "Create Requirement"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="module-summary-row">
              <span><strong>{requirements.length}</strong> total requirements</span>
              <span>{requirements.filter((item) => item.status === "COMPLETED").length} completed</span>
              <span>{requirements.filter((item) => item.status === "IN_PROGRESS").length} in progress</span>
            </div>

            <div className="data-table-card">
              {(() => {
                const filteredRequirements = requirements.filter((requirement) => {
                  const text = `${requirement.title || ""} ${requirement.description || ""} ${requirement.project?.name || ""}`.toLowerCase();
                  const matchesSearch = text.includes(requirementSearch.toLowerCase());
                  const matchesStatus = requirementStatusFilter === "ALL" || requirement.status === requirementStatusFilter;
                  const matchesType = requirementTypeFilter === "ALL" || requirement.type === requirementTypeFilter;
                  return matchesSearch && matchesStatus && matchesType;
                });

                if (filteredRequirements.length === 0) {
                  return (
                    <div className="empty-module-state">
                      <div className="empty-module-icon">R</div>
                      <h3>{requirements.length === 0 ? "No requirements yet" : "No matching requirements"}</h3>
                      <p>{requirements.length === 0 ? "Create the first requirement to start defining project scope." : "Try changing your search or filters."}</p>
                      {requirements.length === 0 && canManageRequirements && (
                        <button className="primary-action" onClick={handleOpenAddRequirement}>+ New Requirement</button>
                      )}
                    </div>
                  );
                }

                return (
                  <div className="table-scroll">
                    <table className="professional-table">
                      <thead>
                        <tr>
                          <th>Requirement</th>
                          <th>Project</th>
                          <th>Type</th>
                          <th>Priority</th>
                          <th>Status</th>
                          <th className="table-actions-header">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRequirements.map((requirement) => (
                          <tr key={requirement.id}>
                            <td>
                              <div className="table-primary-text">{requirement.title}</div>
                              <div className="table-secondary-text">{requirement.description || "No description provided."}</div>
                            </td>
                            <td>{requirement.project?.name || "Unassigned"}</td>
                            <td><span className="table-type-badge">{requirement.type === "NON_FUNCTIONAL" ? "Non-Functional" : "Functional"}</span></td>
                            <td><Badge value={requirement.priority} /></td>
                            <td><Badge value={requirement.status} /></td>
                            <td>
                              <div className="row-actions">
                                {canManageRequirements && <button className="row-action" type="button" onClick={() => handleEditRequirement(requirement)}>Edit</button>}
                                {canManageRequirements && <button className="row-action row-action-danger" type="button" onClick={() => handleDeleteRequirement(requirement.id)}>Delete</button>}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ================= MILESTONES ================= */}

        {activePage === "Milestones" && (
          <div className="module-page">
            <div className="module-page-header">
              <div>
                <div className="breadcrumb">ProjectHub / Planning</div>
                <h2>Milestones</h2>
                <p>Monitor important delivery checkpoints, schedules and project progress.</p>
              </div>
              {canManageMilestones && (
                <button className="primary-action" type="button" onClick={handleOpenAddMilestone}>
                  + New Milestone
                </button>
              )}
            </div>

            <div className="module-summary-row">
              <span><strong>{milestones.length}</strong> total milestones</span>
              <span>{milestones.filter((item) => item.status === "COMPLETED").length} completed</span>
              <span>{milestones.filter((item) => item.status === "IN_PROGRESS").length} in progress</span>
              <span>{milestones.filter((item) => item.status === "PLANNED").length} planned</span>
            </div>

            {showMilestoneForm && canManageMilestones && (
              <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) { clearMilestoneForm(); setShowMilestoneForm(false); } }}>
                <div className="module-modal milestone-modal" role="dialog" aria-modal="true">
                  <div className="module-modal-header">
                    <div>
                      <span className="modal-eyebrow">Milestone management</span>
                      <h3>{editingMilestoneId !== null ? "Edit Milestone" : "New Milestone"}</h3>
                      <p>Define an important delivery checkpoint, schedule and project relationship.</p>
                    </div>
                    <button className="modal-close" type="button" onClick={() => { clearMilestoneForm(); setShowMilestoneForm(false); }}>×</button>
                  </div>

                  <div className="module-modal-body form-grid">
                    <label className="form-field full-width">
                      <span>Milestone name</span>
                      <input type="text" placeholder="e.g. First Review Complete" value={milestoneName} onChange={(e) => setMilestoneName(e.target.value)} />
                    </label>

                    <label className="form-field full-width">
                      <span>Description</span>
                      <textarea placeholder="Describe the milestone and expected outcome..." rows="4" value={milestoneDescription} onChange={(e) => setMilestoneDescription(e.target.value)} />
                    </label>

                    <label className="form-field">
                      <span>Status</span>
                      <select value={milestoneStatus} onChange={(e) => setMilestoneStatus(e.target.value)}>
                        <option value="PLANNED">Planned</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="COMPLETED">Completed</option>
                      </select>
                    </label>

                    <label className="form-field">
                      <span>Project</span>
                      <select value={milestoneProjectId} onChange={(e) => setMilestoneProjectId(e.target.value)}>
                        <option value="">Select project</option>
                        {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                      </select>
                    </label>

                    <label className="form-field">
                      <span>Start date</span>
                      <input type="date" value={milestoneStartDate} onChange={(e) => setMilestoneStartDate(e.target.value)} />
                    </label>

                    <label className="form-field">
                      <span>Due date</span>
                      <input type="date" value={milestoneDueDate} onChange={(e) => setMilestoneDueDate(e.target.value)} />
                    </label>
                  </div>

                  <div className="module-modal-footer">
                    <button className="secondary-action" type="button" onClick={() => { clearMilestoneForm(); setShowMilestoneForm(false); }}>Cancel</button>
                    <button className="primary-action" type="button" onClick={handleSaveMilestone}>
                      {editingMilestoneId !== null ? "Save Changes" : "Create Milestone"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="module-toolbar">
              <div className="module-search">
                <span>⌕</span>
                <input
                  type="search"
                  placeholder="Search milestones, projects..."
                  value={milestoneSearch}
                  onChange={(e) => setMilestoneSearch(e.target.value)}
                />
              </div>
              <select value={milestoneStatusFilter} onChange={(e) => setMilestoneStatusFilter(e.target.value)}>
                <option value="ALL">All statuses</option>
                <option value="PLANNED">Planned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
              <select value={milestoneProjectFilter} onChange={(e) => setMilestoneProjectFilter(e.target.value)}>
                <option value="ALL">All projects</option>
                {projects.map((project) => <option key={project.id} value={String(project.id)}>{project.name}</option>)}
              </select>
            </div>

            <div className="data-table-card">
              {(() => {
                const filteredMilestones = milestones.filter((milestone) => {
                  const text = `${milestone.name || ""} ${milestone.description || ""} ${milestone.project?.name || ""}`.toLowerCase();
                  const matchesSearch = text.includes(milestoneSearch.toLowerCase());
                  const matchesStatus = milestoneStatusFilter === "ALL" || milestone.status === milestoneStatusFilter;
                  const matchesProject = milestoneProjectFilter === "ALL" || String(milestone.project?.id || "") === milestoneProjectFilter;
                  return matchesSearch && matchesStatus && matchesProject;
                });

                if (filteredMilestones.length === 0) {
                  return (
                    <div className="empty-module-state">
                      <div className="empty-module-icon">M</div>
                      <h3>{milestones.length === 0 ? "No milestones yet" : "No matching milestones"}</h3>
                      <p>{milestones.length === 0 ? "Create the first milestone to start tracking delivery checkpoints." : "Try changing your search or filters."}</p>
                      {milestones.length === 0 && canManageMilestones && (
                        <button className="primary-action" type="button" onClick={handleOpenAddMilestone}>+ New Milestone</button>
                      )}
                    </div>
                  );
                }

                return (
                  <div className="table-scroll">
                    <table className="professional-table">
                      <thead>
                        <tr>
                          <th>Milestone</th>
                          <th>Project</th>
                          <th>Status</th>
                          <th>Start</th>
                          <th>Due</th>
                          <th className="table-actions-header">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMilestones.map((milestone) => (
                          <tr key={milestone.id}>
                            <td>
                              <div className="table-primary-text">{milestone.name}</div>
                              <div className="table-secondary-text">{milestone.description || "No description provided."}</div>
                            </td>
                            <td>{milestone.project?.name || "Unassigned"}</td>
                            <td><Badge value={milestone.status} /></td>
                            <td>{milestone.startDate || "—"}</td>
                            <td>{milestone.dueDate || "—"}</td>
                            <td>
                              <div className="row-actions">
                                {canManageMilestones && <button className="row-action" type="button" onClick={() => handleEditMilestone(milestone)}>Edit</button>}
                                {canManageMilestones && <button className="row-action row-action-danger" type="button" onClick={() => handleDeleteMilestone(milestone.id)}>Delete</button>}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ================================================= */}
        {/* ================= TEST CASES ==================== */}
        {/* ================================================= */}

        {activePage === "Test Cases" && (
          <div className="module-page">
            <div className="module-page-header">
              <div>
                <div className="breadcrumb">ProjectHub / Quality</div>
                <h2>Test Cases</h2>
                <p>Design, execute and track software quality checks across projects.</p>
              </div>
              {canManageTestCases && (
                <button className="primary-action" type="button" onClick={handleOpenAddTestCase}>
                  + New Test Case
                </button>
              )}
            </div>

            <div className="module-summary-row">
              <span><strong>{testCases.length}</strong> total test cases</span>
              <span>{testCases.filter((item) => item.status === "PASSED").length} passed</span>
              <span>{testCases.filter((item) => item.status === "FAILED").length} failed</span>
              <span>{testCases.filter((item) => item.status === "NOT_EXECUTED").length} not executed</span>
            </div>

            {showTestCaseForm && canManageTestCases && (
              <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) { clearTestCaseForm(); setShowTestCaseForm(false); } }}>
                <div className="module-modal testcase-modal" role="dialog" aria-modal="true">
                  <div className="module-modal-header">
                    <div>
                      <span className="modal-eyebrow">Test management</span>
                      <h3>{editingTestCaseId !== null ? "Edit Test Case" : "New Test Case"}</h3>
                      <p>Define the test scenario, expected behavior and execution status.</p>
                    </div>
                    <button className="modal-close" type="button" onClick={() => { clearTestCaseForm(); setShowTestCaseForm(false); }}>×</button>
                  </div>

                  <div className="module-modal-body form-grid">
                    <label className="form-field full-width">
                      <span>Test case title</span>
                      <input type="text" placeholder="e.g. Verify user login" value={testCaseTitle} onChange={(e) => setTestCaseTitle(e.target.value)} />
                    </label>

                    <label className="form-field full-width">
                      <span>Description</span>
                      <textarea placeholder="Describe what this test validates..." rows="3" value={testCaseDescription} onChange={(e) => setTestCaseDescription(e.target.value)} />
                    </label>

                    <label className="form-field full-width">
                      <span>Preconditions</span>
                      <textarea placeholder="List conditions that must be true before execution..." rows="3" value={testCasePreconditions} onChange={(e) => setTestCasePreconditions(e.target.value)} />
                    </label>

                    <label className="form-field">
                      <span>Expected result</span>
                      <textarea placeholder="Expected system behavior..." rows="3" value={testCaseExpectedResult} onChange={(e) => setTestCaseExpectedResult(e.target.value)} />
                    </label>

                    <label className="form-field">
                      <span>Actual result</span>
                      <textarea placeholder="Observed behavior after execution..." rows="3" value={testCaseActualResult} onChange={(e) => setTestCaseActualResult(e.target.value)} />
                    </label>

                    <label className="form-field">
                      <span>Status</span>
                      <select value={testCaseStatus} onChange={(e) => setTestCaseStatus(e.target.value)}>
                        <option value="NOT_EXECUTED">Not Executed</option>
                        <option value="PASSED">Passed</option>
                        <option value="FAILED">Failed</option>
                        <option value="BLOCKED">Blocked</option>
                      </select>
                    </label>

                    <label className="form-field">
                      <span>Priority</span>
                      <select value={testCasePriority} onChange={(e) => setTestCasePriority(e.target.value)}>
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="CRITICAL">Critical</option>
                      </select>
                    </label>

                    <label className="form-field full-width">
                      <span>Project</span>
                      <select value={testCaseProjectId} onChange={(e) => setTestCaseProjectId(e.target.value)}>
                        <option value="">Select project</option>
                        {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                      </select>
                    </label>
                  </div>

                  <div className="module-modal-footer">
                    <button className="secondary-action" type="button" onClick={() => { clearTestCaseForm(); setShowTestCaseForm(false); }}>Cancel</button>
                    <button className="primary-action" type="button" onClick={handleSaveTestCase}>
                      {editingTestCaseId !== null ? "Save Changes" : "Create Test Case"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="module-toolbar">
              <div className="module-search">
                <span>⌕</span>
                <input
                  type="search"
                  placeholder="Search test cases, projects..."
                  value={testCaseSearch}
                  onChange={(e) => setTestCaseSearch(e.target.value)}
                />
              </div>
              <select value={testCaseStatusFilter} onChange={(e) => setTestCaseStatusFilter(e.target.value)}>
                <option value="ALL">All statuses</option>
                <option value="NOT_EXECUTED">Not Executed</option>
                <option value="PASSED">Passed</option>
                <option value="FAILED">Failed</option>
                <option value="BLOCKED">Blocked</option>
              </select>
              <select value={testCasePriorityFilter} onChange={(e) => setTestCasePriorityFilter(e.target.value)}>
                <option value="ALL">All priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
              <select value={testCaseProjectFilter} onChange={(e) => setTestCaseProjectFilter(e.target.value)}>
                <option value="ALL">All projects</option>
                {projects.map((project) => <option key={project.id} value={String(project.id)}>{project.name}</option>)}
              </select>
            </div>

            <div className="data-table-card">
              {(() => {
                const filteredTestCases = testCases.filter((testCase) => {
                  const text = `${testCase.title || ""} ${testCase.description || ""} ${testCase.preconditions || ""} ${testCase.project?.name || ""}`.toLowerCase();
                  const matchesSearch = text.includes(testCaseSearch.toLowerCase());
                  const matchesStatus = testCaseStatusFilter === "ALL" || testCase.status === testCaseStatusFilter;
                  const matchesPriority = testCasePriorityFilter === "ALL" || testCase.priority === testCasePriorityFilter;
                  const matchesProject = testCaseProjectFilter === "ALL" || String(testCase.project?.id || "") === testCaseProjectFilter;
                  return matchesSearch && matchesStatus && matchesPriority && matchesProject;
                });

                if (filteredTestCases.length === 0) {
                  return (
                    <div className="empty-module-state">
                      <div className="empty-module-icon">T</div>
                      <h3>{testCases.length === 0 ? "No test cases yet" : "No matching test cases"}</h3>
                      <p>{testCases.length === 0 ? "Create the first test case to start tracking software quality." : "Try changing your search or filters."}</p>
                      {testCases.length === 0 && canManageTestCases && (
                        <button className="primary-action" type="button" onClick={handleOpenAddTestCase}>+ New Test Case</button>
                      )}
                    </div>
                  );
                }

                return (
                  <div className="table-scroll">
                    <table className="professional-table">
                      <thead>
                        <tr>
                          <th>Test Case</th>
                          <th>Project</th>
                          <th>Status</th>
                          <th>Priority</th>
                          <th>Expected Result</th>
                          <th className="table-actions-header">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTestCases.map((testCase) => (
                          <tr key={testCase.id}>
                            <td>
                              <div className="table-primary-text">{testCase.title}</div>
                              <div className="table-secondary-text">{testCase.description || "No description provided."}</div>
                            </td>
                            <td>{testCase.project?.name || "Unassigned"}</td>
                            <td><Badge value={testCase.status} /></td>
                            <td><Badge value={testCase.priority} /></td>
                            <td>
                              <div className="table-secondary-text" title={testCase.expectedResult || ""}>
                                {testCase.expectedResult || "Not defined"}
                              </div>
                            </td>
                            <td>
                              <div className="row-actions">
                                {canManageTestCases && <button className="row-action" type="button" onClick={() => handleEditTestCase(testCase)}>Edit</button>}
                                {canManageTestCases && <button className="row-action row-action-danger" type="button" onClick={() => handleDeleteTestCase(testCase.id)}>Delete</button>}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ================= TASKS ================= */}

        {activePage === "Tasks" && (
          <div className="module-page">
            <div className="module-header-row">
              <div>
                <div className="eyebrow">Execution</div>
                <h2 className="module-page-title">Tasks</h2>
                <p className="module-page-subtitle">Track ownership, priorities, deadlines and delivery progress.</p>
              </div>
              {canManageTasks && (
                <button className="primary-action" type="button" onClick={handleOpenAddTask}>
                  + New Task
                </button>
              )}
            </div>

            <div className="module-summary-row task-summary-row">
              <span><strong>{tasks.length}</strong> total tasks</span>
              <span>{tasks.filter((item) => item.status === "COMPLETED").length} completed</span>
              <span>{tasks.filter((item) => item.status === "IN_PROGRESS").length} in progress</span>
              <span>{tasks.filter((item) => item.status === "TODO").length} to do</span>
            </div>

            {showTaskForm && canManageTasks && (
              <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) { clearTaskForm(); setShowTaskForm(false); } }}>
                <div className="module-modal task-modal" role="dialog" aria-modal="true">
                  <div className="module-modal-header">
                    <div>
                      <span className="modal-eyebrow">Task management</span>
                      <h3>{editingTaskId !== null ? "Edit Task" : "New Task"}</h3>
                      <p>Define the work item, ownership, schedule and project relationship.</p>
                    </div>
                    <button className="modal-close" type="button" onClick={() => { clearTaskForm(); setShowTaskForm(false); }}>×</button>
                  </div>

                  <div className="module-modal-body">
                    <div className="form-grid-2">
                      <label className="form-field full-span">
                        <span>Task title</span>
                        <input type="text" placeholder="e.g. Implement login validation" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
                      </label>

                      <label className="form-field full-span">
                        <span>Description</span>
                        <textarea rows="4" placeholder="Describe the work to be completed..." value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} />
                      </label>

                      <label className="form-field">
                        <span>Status</span>
                        <select value={taskStatus} onChange={(e) => setTaskStatus(e.target.value)}>
                          <option value="TODO">To Do</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="COMPLETED">Completed</option>
                        </select>
                      </label>

                      <label className="form-field">
                        <span>Priority</span>
                        <select value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)}>
                          <option value="LOW">Low</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                          <option value="CRITICAL">Critical</option>
                        </select>
                      </label>

                      <label className="form-field">
                        <span>Assigned to</span>
                        <input type="text" placeholder="Team member" value={taskAssignedTo} onChange={(e) => setTaskAssignedTo(e.target.value)} />
                      </label>

                      <label className="form-field">
                        <span>Project</span>
                        <select value={taskProjectId} onChange={(e) => setTaskProjectId(e.target.value)}>
                          <option value="">Select project</option>
                          {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                        </select>
                      </label>

                      <label className="form-field">
                        <span>Requirement</span>
                        <select value={taskRequirementId} onChange={(e) => setTaskRequirementId(e.target.value)}>
                          <option value="">Select requirement</option>
                          {requirements.map((requirement) => <option key={requirement.id} value={requirement.id}>{requirement.title}</option>)}
                        </select>
                      </label>

                      <label className="form-field">
                        <span>Start date</span>
                        <input type="date" value={taskStartDate} onChange={(e) => setTaskStartDate(e.target.value)} />
                      </label>

                      <label className="form-field">
                        <span>Due date</span>
                        <input type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} />
                      </label>
                    </div>
                  </div>

                  <div className="module-modal-footer">
                    <button className="secondary-action" type="button" onClick={() => { clearTaskForm(); setShowTaskForm(false); }}>Cancel</button>
                    <button className="primary-action" type="button" onClick={handleSaveTask}>
                      {editingTaskId !== null ? "Save Changes" : "Create Task"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="module-toolbar">
              <div className="module-search">
                <span>⌕</span>
                <input type="search" placeholder="Search tasks, assignees, projects..." value={taskSearch} onChange={(e) => setTaskSearch(e.target.value)} />
              </div>
              <select value={taskStatusFilter} onChange={(e) => setTaskStatusFilter(e.target.value)}>
                <option value="ALL">All statuses</option>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
              <select value={taskPriorityFilter} onChange={(e) => setTaskPriorityFilter(e.target.value)}>
                <option value="ALL">All priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
              <select value={taskProjectFilter} onChange={(e) => setTaskProjectFilter(e.target.value)}>
                <option value="ALL">All projects</option>
                {projects.map((project) => <option key={project.id} value={String(project.id)}>{project.name}</option>)}
              </select>
            </div>

            <div className="data-table-card">
              {(() => {
                const filteredTasks = tasks.filter((task) => {
                  const text = `${task.title || ""} ${task.description || ""} ${task.assignedTo || ""} ${task.project?.name || ""} ${task.requirement?.title || ""}`.toLowerCase();
                  const matchesSearch = text.includes(taskSearch.toLowerCase());
                  const matchesStatus = taskStatusFilter === "ALL" || task.status === taskStatusFilter;
                  const matchesPriority = taskPriorityFilter === "ALL" || task.priority === taskPriorityFilter;
                  const matchesProject = taskProjectFilter === "ALL" || String(task.project?.id || "") === taskProjectFilter;
                  return matchesSearch && matchesStatus && matchesPriority && matchesProject;
                });

                if (filteredTasks.length === 0) {
                  return (
                    <div className="empty-module-state">
                      <div className="empty-module-icon">T</div>
                      <h3>{tasks.length === 0 ? "No tasks yet" : "No matching tasks"}</h3>
                      <p>{tasks.length === 0 ? "Create the first task to start tracking project execution." : "Try changing your search or filters."}</p>
                      {tasks.length === 0 && canManageTasks && (
                        <button className="primary-action" onClick={handleOpenAddTask}>+ New Task</button>
                      )}
                    </div>
                  );
                }

                return (
                  <div className="table-scroll">
                    <table className="professional-table task-professional-table">
                      <thead>
                        <tr>
                          <th>Task</th>
                          <th>Project</th>
                          <th>Assignee</th>
                          <th>Status</th>
                          <th>Priority</th>
                          <th>Due</th>
                          <th className="table-actions-header">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTasks.map((task) => {
                          const dueDate = task.dueDate ? new Date(`${task.dueDate}T23:59:59`) : null;
                          const overdue = dueDate && task.status !== "COMPLETED" && dueDate < new Date();
                          return (
                            <tr key={task.id}>
                              <td>
                                <div className="table-primary-text">{task.title}</div>
                                <div className="table-secondary-text">{task.requirement?.title || "No linked requirement"}</div>
                              </td>
                              <td>{task.project?.name || "Unassigned"}</td>
                              <td>{task.assignedTo || "Unassigned"}</td>
                              <td><Badge value={task.status} /></td>
                              <td><Badge value={task.priority} /></td>
                              <td>
                                <span className={overdue ? "task-due-overdue" : "task-due-date"}>
                                  {task.dueDate || "—"}
                                </span>
                                {overdue && <span className="task-overdue-label">Overdue</span>}
                              </td>
                              <td>
                                <div className="row-actions">
                                  {canManageTasks && <button className="row-action" type="button" onClick={() => handleEditTask(task)}>Edit</button>}
                                  {canManageTasks && <button className="row-action row-action-danger" type="button" onClick={() => handleDeleteTask(task.id)}>Delete</button>}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ================================================= */}
        {/* ================= BUGS =========================== */}
        {/* ================================================= */}

        {activePage === "Bugs" && (
          <div className="module-page">
            <div className="module-page-header">
              <div>
                <div className="breadcrumb">ProjectHub / Quality</div>
                <h2>Bugs</h2>
                <p>Track defects, severity, priority, ownership and resolution status.</p>
              </div>
              {canManageBugs && (
                <button className="primary-action" type="button" onClick={handleOpenAddBug}>
                  + New Bug
                </button>
              )}
            </div>

            <div className="module-summary-row">
              <span><strong>{bugs.length}</strong> total bugs</span>
              <span>{bugs.filter((item) => item.status === "OPEN").length} open</span>
              <span>{bugs.filter((item) => item.status === "IN_PROGRESS").length} in progress</span>
              <span>{bugs.filter((item) => item.status === "RESOLVED" || item.status === "CLOSED").length} resolved / closed</span>
            </div>

            {showBugForm && canManageBugs && (
              <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) { clearBugForm(); setShowBugForm(false); } }}>
                <div className="module-modal bug-modal" role="dialog" aria-modal="true">
                  <div className="module-modal-header">
                    <div>
                      <span className="modal-eyebrow">Defect management</span>
                      <h3>{editingBugId !== null ? "Edit Bug" : "New Bug"}</h3>
                      <p>Capture the defect, impact, ownership and related quality context.</p>
                    </div>
                    <button className="modal-close" type="button" onClick={() => { clearBugForm(); setShowBugForm(false); }}>×</button>
                  </div>

                  <div className="module-modal-body form-grid">
                    <label className="form-field full-width">
                      <span>Bug title</span>
                      <input type="text" placeholder="e.g. Login button remains loading" value={bugTitle} onChange={(e) => setBugTitle(e.target.value)} />
                    </label>

                    <label className="form-field full-width">
                      <span>Description</span>
                      <textarea placeholder="Describe the defect, actual behavior and impact..." rows="4" value={bugDescription} onChange={(e) => setBugDescription(e.target.value)} />
                    </label>

                    <label className="form-field">
                      <span>Severity</span>
                      <select value={bugSeverity} onChange={(e) => setBugSeverity(e.target.value)}>
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="CRITICAL">Critical</option>
                      </select>
                    </label>

                    <label className="form-field">
                      <span>Priority</span>
                      <select value={bugPriority} onChange={(e) => setBugPriority(e.target.value)}>
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="CRITICAL">Critical</option>
                      </select>
                    </label>

                    <label className="form-field">
                      <span>Status</span>
                      <select value={bugStatus} onChange={(e) => setBugStatus(e.target.value)}>
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="CLOSED">Closed</option>
                        <option value="REOPENED">Reopened</option>
                      </select>
                    </label>

                    <label className="form-field">
                      <span>Assigned to</span>
                      <input type="text" placeholder="Team member" value={bugAssignedTo} onChange={(e) => setBugAssignedTo(e.target.value)} />
                    </label>

                    <label className="form-field">
                      <span>Reported by</span>
                      <input type="text" placeholder="Team member" value={bugReportedBy} onChange={(e) => setBugReportedBy(e.target.value)} />
                    </label>

                    <label className="form-field">
                      <span>Created date</span>
                      <input type="date" value={bugCreatedDate} onChange={(e) => setBugCreatedDate(e.target.value)} />
                    </label>

                    <label className="form-field">
                      <span>Project</span>
                      <select value={bugProjectId} onChange={(e) => setBugProjectId(e.target.value)}>
                        <option value="">Select project</option>
                        {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                      </select>
                    </label>

                    <label className="form-field full-width">
                      <span>Related test case</span>
                      <select value={bugTestCaseId} onChange={(e) => setBugTestCaseId(e.target.value)}>
                        <option value="">Select test case</option>
                        {testCases.map((testCase) => <option key={testCase.id} value={testCase.id}>{testCase.title}</option>)}
                      </select>
                    </label>
                  </div>

                  <div className="module-modal-footer">
                    <button className="secondary-action" type="button" onClick={() => { clearBugForm(); setShowBugForm(false); }}>Cancel</button>
                    <button className="primary-action" type="button" onClick={handleSaveBug}>
                      {editingBugId !== null ? "Save Changes" : "Create Bug"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="module-toolbar">
              <div className="module-search">
                <span>⌕</span>
                <input
                  type="search"
                  placeholder="Search bugs, projects, assignees..."
                  value={bugSearch}
                  onChange={(e) => setBugSearch(e.target.value)}
                />
              </div>
              <select value={bugStatusFilter} onChange={(e) => setBugStatusFilter(e.target.value)}>
                <option value="ALL">All statuses</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
                <option value="REOPENED">Reopened</option>
              </select>
              <select value={bugSeverityFilter} onChange={(e) => setBugSeverityFilter(e.target.value)}>
                <option value="ALL">All severities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
              <select value={bugPriorityFilter} onChange={(e) => setBugPriorityFilter(e.target.value)}>
                <option value="ALL">All priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>

            <div className="data-table-card">
              {(() => {
                const filteredBugs = bugs.filter((bug) => {
                  const text = `${bug.title || ""} ${bug.description || ""} ${bug.assignedTo || ""} ${bug.reportedBy || ""} ${bug.project?.name || ""} ${bug.testCase?.title || ""}`.toLowerCase();
                  const matchesSearch = text.includes(bugSearch.toLowerCase());
                  const matchesStatus = bugStatusFilter === "ALL" || bug.status === bugStatusFilter;
                  const matchesSeverity = bugSeverityFilter === "ALL" || bug.severity === bugSeverityFilter;
                  const matchesPriority = bugPriorityFilter === "ALL" || bug.priority === bugPriorityFilter;
                  return matchesSearch && matchesStatus && matchesSeverity && matchesPriority;
                });

                if (filteredBugs.length === 0) {
                  return (
                    <div className="empty-module-state">
                      <div className="empty-module-icon">B</div>
                      <h3>{bugs.length === 0 ? "No bugs yet" : "No matching bugs"}</h3>
                      <p>{bugs.length === 0 ? "Create the first defect to start tracking software quality issues." : "Try changing your search or filters."}</p>
                      {bugs.length === 0 && canManageBugs && (
                        <button className="primary-action" type="button" onClick={handleOpenAddBug}>+ New Bug</button>
                      )}
                    </div>
                  );
                }

                return (
                  <div className="table-scroll">
                    <table className="professional-table">
                      <thead>
                        <tr>
                          <th>Bug</th>
                          <th>Project</th>
                          <th>Severity</th>
                          <th>Priority</th>
                          <th>Status</th>
                          <th>Assigned To</th>
                          <th className="table-actions-header">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredBugs.map((bug) => (
                          <tr key={bug.id}>
                            <td>
                              <div className="table-primary-text">{bug.title}</div>
                              <div className="table-secondary-text">{bug.description || "No description provided."}</div>
                            </td>
                            <td>{bug.project?.name || "Unassigned"}</td>
                            <td><Badge value={bug.severity} /></td>
                            <td><Badge value={bug.priority} /></td>
                            <td><Badge value={bug.status} /></td>
                            <td>{bug.assignedTo || "Unassigned"}</td>
                            <td>
                              <div className="row-actions">
                                {canManageBugs && <button className="row-action" type="button" onClick={() => handleEditBug(bug)}>Edit</button>}
                                {canManageBugs && <button className="row-action row-action-danger" type="button" onClick={() => handleDeleteBug(bug.id)}>Delete</button>}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ================================================= */}
        {/* ================= AI ASSISTANT ================== */}
        {/* ================================================= */}

        {activePage === "AI Assistant" && (

          <div className="ai-assistant-page">

            <div className="ai-header">

              <div>
                <h3>AI Assistant</h3>
                <p>
                  Your intelligent assistant for software development,
                  project management and quality assurance.
                </p>
              </div>

              {aiChatMessages.length > 0 && (
                <button
                  className="ai-clear-button"
                  onClick={handleClearAIChat}
                >
                  Clear Chat
                </button>
              )}

            </div>

            <div className="ai-quick-actions">

              <div className="ai-quick-actions-header">
                <div>
                  <h3>Quick Actions</h3>
                  <p>Get help with common project and QA activities.</p>
                </div>
              </div>

              <div className="ai-quick-actions-grid">

                <button
                  className="ai-action-card"
                  onClick={() => {
                    setAiActionMode("summarize-requirement");
                    setAiChatInput(
                      "Summarize the following software requirement in a clear and concise way:\n\n"
                    );
                  }}
                >
                  <span className="ai-action-icon">R</span>

                  <span className="ai-action-text">
                    <strong>Summarize Requirement</strong>
                    <small>Turn a long requirement into a concise summary.</small>
                  </span>
                </button>

                <button
                  className="ai-action-card"
                  onClick={() => {
                    setAiActionMode("classify-bug");
                    setAiChatInput(
                      "Analyze the following software bug and classify its category, severity, priority and suggested area:\n\n"
                    );
                  }}
                >
                  <span className="ai-action-icon">B</span>

                  <span className="ai-action-text">
                    <strong>Classify Bug</strong>
                    <small>Analyze a bug and identify its category and severity.</small>
                  </span>
                </button>

                <button
                  className="ai-action-card"
                  onClick={() => {
                    setAiActionMode("generate-test-cases");
                    setAiChatInput("");
                  }}
                >
                  <span className="ai-action-icon">T</span>

                  <span className="ai-action-text">
                    <strong>Generate Test Cases</strong>
                    <small>Create structured test cases from a requirement.</small>
                  </span>
                </button>

                <button
                  className="ai-action-card"
                  onClick={() => {
                    setAiActionMode("project-status");
                    const firstProjectId = projects[0]?.id;
                    setAiProjectStatusProjectId(
                      firstProjectId ? String(firstProjectId) : ""
                    );
                    setAiChatInput(
                      firstProjectId ? String(firstProjectId) : ""
                    );
                  }}
                >
                  <span className="ai-action-icon">P</span>

                  <span className="ai-action-text">
                    <strong>Project Status</strong>
                    <small>Turn project information into a clear status summary.</small>
                  </span>
                </button>

              </div>

            </div>

            <div className="card ai-chat-card">

              <div className="ai-chat-messages">

                {aiChatMessages.length === 0 && (

                  <div className="ai-empty-state">

                    <div className="ai-empty-icon">
                      AI
                    </div>

                    <h3>
                      How can I help you?
                    </h3>

                    <p>
                      Ask me about software development,
                      testing, requirements, bugs, Agile,
                      databases, APIs or project management.
                    </p>

                    <div className="ai-suggestions">

                      <button
                        onClick={() =>
                          setAiChatInput(
                            "Explain software testing in simple words."
                          )
                        }
                      >
                        Explain software testing
                      </button>

                      <button
                        onClick={() =>
                          setAiChatInput(
                            "Give me test cases for a login page."
                          )
                        }
                      >
                        Generate test cases
                      </button>

                      <button
                        onClick={() =>
                          setAiChatInput(
                            "How can I manage software project risks?"
                          )
                        }
                      >
                        Project management help
                      </button>

                      <button
                        onClick={() =>
                          setAiChatInput(
                            "Explain REST APIs with a simple example."
                          )
                        }
                      >
                        Explain REST APIs
                      </button>

                    </div>

                  </div>

                )}

                {aiChatMessages.map((message, index) => (

                  <div
                    key={index}
                    className={`ai-message ${
                      message.role === "user"
                        ? "ai-message-user"
                        : "ai-message-assistant"
                    }`}
                  >

                    <div className="ai-message-label">
                      {message.role === "user"
                        ? "You"
                        : "ProjectHub AI"}
                    </div>

                    <div className="ai-message-content">
                      <ReactMarkdown>
                        {message.content}
                      </ReactMarkdown>
                    </div>

                  </div>

                ))}

                {aiChatLoading && (

                  <div className="ai-message ai-message-assistant">

                    <div className="ai-message-label">
                      ProjectHub AI
                    </div>

                    <div className="ai-typing">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>

                  </div>

                )}

              </div>

              <div className="ai-chat-input-area">

                {aiActionMode === "project-status" && (
                  <div className="ai-project-selector">
                    <label htmlFor="ai-project-status-select">Project</label>
                    <select
                      id="ai-project-status-select"
                      value={aiProjectStatusProjectId}
                      onChange={(e) => {
                        const value = e.target.value;
                        setAiProjectStatusProjectId(value);
                        setAiChatInput(value);
                      }}
                    >
                      <option value="">Select a project</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name} (ID: {project.id})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <textarea
                  value={aiChatInput}
                  onChange={(e) =>
                    setAiChatInput(e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      !e.shiftKey
                    ) {
                      e.preventDefault();
                      handleAIChat();
                    }
                  }}
                  placeholder={
                    aiActionMode === "project-status"
                      ? "Enter a project ID to generate its AI-assisted status summary..."
                      : "Ask ProjectHub AI anything..."
                  }
                  rows="3"
                  disabled={aiChatLoading}
                />

                <div className="ai-chat-input-footer">

                  <span>
                    {aiActionMode === "project-status"
                      ? "Enter the project ID · Enter to send"
                      : "Enter to send · Shift + Enter for new line"}
                  </span>

                  <button
                    className="ai-send-button"
                    onClick={handleAIChat}
                    disabled={
                      aiChatLoading ||
                      !aiChatInput.trim()
                    }
                  >
                    {aiChatLoading
                      ? "Thinking..."
                      : "Send"}
                  </button>

                </div>

              </div>

              </div>

          </div>

        )}

      </main>

    </div>
  );
}

export default App;