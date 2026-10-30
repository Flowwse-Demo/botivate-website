import React, { useState, useEffect, useCallback } from "react";
import IntroBanner from "./IntroBanner";
import OverviewCards from "./OverviewCards";
import MeetingWorkflow from "./MeetingWorkflow";
import MeetingChecklist from "./MeetingChecklist";
import CommunicationGuide from "./CommunicationGuide";
import MOMTemplateCard from "./MOMTemplateCard";
import CommunicationPrinciples from "./CommunicationPrinciples";
import PracticeQuiz from "./PracticeQuiz";
import IntroModal from "./IntroModal";
import { CHECKLIST_ITEMS } from "./constants";

export default function MeetingTrainingPage({ user, userRole, userFilterData }) {
  // Persistence storage key scoped to authenticated user
  const userIdentifier =
    user?.userId || user?.id || user?.username || userFilterData?.userId || "employee";
  const storageKey = `meeting_training_progress_${userIdentifier}`;

  // State initialization with localStorage fallback
  const [stageCompletions, setStageCompletions] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.stageCompletions || { before: false, during: false, after: false };
      }
    } catch (e) {
      console.warn("Could not read meeting progress from localStorage:", e);
    }
    return { before: false, during: false, after: false };
  });

  const [checklistState, setChecklistState] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return (
          parsed.checklistState || {
            before: {},
            during: {},
            after: {},
          }
        );
      }
    } catch (e) {
      console.warn("Could not read checklist state from localStorage:", e);
    }
    return {
      before: {},
      during: {},
      after: {},
    };
  });

  const [quizState, setQuizState] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return (
          parsed.quizState || {
            attempted: false,
            score: 0,
            total: 10,
            percentage: 0,
          }
        );
      }
    } catch (e) {
      console.warn("Could not read quiz state from localStorage:", e);
    }
    return {
      attempted: false,
      score: 0,
      total: 10,
      percentage: 0,
    };
  });

  const [activeStageTab, setActiveStageTab] = useState("before");
  const [showIntroModal, setShowIntroModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Clock timer
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync state to localStorage whenever changed
  useEffect(() => {
    try {
      const payload = {
        stageCompletions,
        checklistState,
        quizState,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch (e) {
      console.warn("Could not persist meeting progress:", e);
    }
  }, [stageCompletions, checklistState, quizState, storageKey]);

  // Toggle individual checklist item
  const handleToggleChecklistItem = useCallback((stageId, itemId) => {
    setChecklistState((prev) => {
      const stageItems = { ...(prev[stageId] || {}) };
      stageItems[itemId] = !stageItems[itemId];

      // If user unchecks an item from an already-completed stage, we can optionally keep completed or require all 6
      const allItems = CHECKLIST_ITEMS[stageId] || [];
      const completedCount = allItems.filter((i) => stageItems[i.id]).length;

      // If they uncheck any item, update stage completion
      if (completedCount < allItems.length) {
        setStageCompletions((cPrev) => ({
          ...cPrev,
          [stageId]: false,
        }));
      }

      return {
        ...prev,
        [stageId]: stageItems,
      };
    });
  }, []);

  // Mark stage complete
  const handleMarkStageComplete = useCallback((stageId) => {
    const allItems = CHECKLIST_ITEMS[stageId] || [];
    const stageItems = checklistState[stageId] || {};
    const isAllChecked = allItems.every((i) => stageItems[i.id]);

    if (isAllChecked) {
      setStageCompletions((prev) => ({
        ...prev,
        [stageId]: true,
      }));
    }
  }, [checklistState]);

  // Reset stage checklist
  const handleResetStage = useCallback((stageId) => {
    setChecklistState((prev) => ({
      ...prev,
      [stageId]: {},
    }));
    setStageCompletions((prev) => ({
      ...prev,
      [stageId]: false,
    }));
  }, []);

  // Quiz completion callback
  const handleQuizCompleted = useCallback((result) => {
    setQuizState(result);
  }, []);

  // Smooth scroll helpers
  const scrollToQuiz = () => {
    const el = document.getElementById("meeting-practice-quiz");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const scrollToMOM = () => {
    const el = document.getElementById("mom-template-card");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Calculate stages learned (0 to 3)
  const stagesLearnedCount = Object.values(stageCompletions).filter(Boolean).length;

  return (
    <div className="space-y-6 sm:space-y-8 pb-10">
      {/* Section B: Introduction Banner */}
      <IntroBanner
        onTakeQuiz={scrollToQuiz}
        onWatchIntro={() => setShowIntroModal(true)}
      />

      {/* Section C: Overview KPI Cards */}
      <OverviewCards
        stagesLearnedCount={stagesLearnedCount}
        totalStages={3}
        quizState={quizState}
        onViewMOMTemplate={scrollToMOM}
        onTakeQuiz={scrollToQuiz}
      />

      {/* Section D: Meeting Workflow */}
      <MeetingWorkflow
        activeStageTab={activeStageTab}
        onSelectStage={(stageId) => setActiveStageTab(stageId)}
        stageCompletions={stageCompletions}
      />

      {/* Section E, F: Two-Column Section (Checklist & Communication Guide) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Meeting SOP & Interactive Checklist (Section E) */}
        <div className="lg:col-span-7">
          <MeetingChecklist
            activeStageTab={activeStageTab}
            setActiveStageTab={setActiveStageTab}
            checklistState={checklistState}
            onToggleItem={handleToggleChecklistItem}
            stageCompletions={stageCompletions}
            onMarkStageComplete={handleMarkStageComplete}
            onResetStage={handleResetStage}
          />
        </div>

        {/* Right Column: Communication Guide (Section F) */}
        <div className="lg:col-span-5">
          <CommunicationGuide />
        </div>
      </div>

      {/* Section G: Minutes of Meeting (MOM) Template (Section G, matching Reference Design) */}
      <MOMTemplateCard />

      {/* Section H: Professional Communication Principles */}
      <CommunicationPrinciples />

      {/* Section I: Practice Quiz */}
      <PracticeQuiz
        onQuizCompleted={handleQuizCompleted}
        currentQuizState={quizState}
      />

      {/* Intro Modal (Section B Watch Introduction modal) */}
      <IntroModal
        isOpen={showIntroModal}
        onClose={() => setShowIntroModal(false)}
        onStartQuiz={() => {
          setShowIntroModal(false);
          scrollToQuiz();
        }}
      />
    </div>
  );
}
