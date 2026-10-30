import React, { useState, useEffect } from 'react';

import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { LandingPage } from './components/LandingPage.tsx';
import { BrowseProjects } from './components/BrowseProjects.tsx';
import { ProfileSetup } from './components/ProfileSetup.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { ProjectDetailModal } from './components/ProjectDetailModal.tsx';
import { ProjectChat } from './components/ProjectChat.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { CreateProjectModal } from './components/CreateProjectModal.tsx';
import { Project } from './types.ts';
import { collection, onSnapshot, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase.ts';

function AppContent() {
  const { userProfile, updateProfile } = useAuth();

  const [currentTab, setCurrentTab] = useState<
    'landing' | 'browse' | 'dashboard' | 'chat'
  >('landing');

  const [activeChatProject, setActiveChatProject] =
    useState<Project | null>(null);

  const [selectedProjectForDetail, setSelectedProjectForDetail] =
    useState<Project | null>(null);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] =
    useState(false);
  const [isProfileSetupModalOpen, setIsProfileSetupModalOpen] =
    useState(false);

  // Keep the app's light color palette.
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.removeItem('crewhub_theme');
  }, []);

  // Real-time Firestore projects collection.
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'projects'),
      (snapshot) => {
        const list: Project[] = [];

        snapshot.forEach((projectDoc) => {
          list.push({
            id: projectDoc.id,
            ...projectDoc.data(),
          } as Project);
        });

        setProjects(list);
      },
      (error) => {
        console.warn('Firestore projects listener error:', error);
      }
    );

    return () => unsubscribe();
  }, []);

  // Keep the selected chat project synchronized with project updates.
  useEffect(() => {
    if (!activeChatProject) return;

    const freshProject = projects.find(
      (project) => project.id === activeChatProject.id
    );

    if (freshProject && freshProject !== activeChatProject) {
      setActiveChatProject(freshProject);
    }
  }, [projects, activeChatProject]);

  // Prompt users to complete their profile when necessary.
  useEffect(() => {
    if (userProfile && !userProfile.completedProfile) {
      setIsProfileSetupModalOpen(true);
    }
  }, [userProfile?.id, userProfile?.completedProfile]);

  // Update the project roster when a leader accepts an applicant.
  const handleUpdateProjectRoster = async (
    projectId: string,
    newMember: any,
    filledRole: string
  ) => {
    const project = projects.find((item) => item.id === projectId);

    if (!project) return;

    const updatedMembers = [...(project.members || []), newMember];

    const updatedMemberIds = Array.from(
      new Set([...(project.memberIds || []), newMember.userId])
    );

    const updatedOpenRoles = (project.openRoles || []).map((role) =>
      role.role.toLowerCase() === filledRole.toLowerCase()
        ? { ...role, filled: true, filledBy: newMember.userId }
        : role
    );

    const updatedProject: Project = {
      ...project,
      members: updatedMembers,
      memberIds: updatedMemberIds,
      openRoles: updatedOpenRoles,
      updatedAt: new Date().toISOString(),
    };

    // Update the UI immediately.
    setProjects((previous) =>
      previous.map((item) =>
        item.id === projectId ? updatedProject : item
      )
    );

    if (activeChatProject?.id === projectId) {
      setActiveChatProject(updatedProject);
    }

    // Save changes to Firestore.
    try {
      await updateDoc(doc(db, 'projects', projectId), {
        members: updatedMembers,
        memberIds: updatedMemberIds,
        openRoles: updatedOpenRoles,
        updatedAt: updatedProject.updatedAt,
      });
    } catch (error) {
      console.warn('Update project roster error:', error);
    }
  };

  const handleOpenChat = (project: Project) => {
    setActiveChatProject(project);
    setCurrentTab('chat');
  };

  // Create a project and save it to Firestore.
  const handleCreateProject = async (newProject: Project) => {
    try {
      await setDoc(doc(db, 'projects', newProject.id), newProject);
    } catch (error) {
      console.warn('Save new project to Firestore error:', error);
    }

    setCurrentTab('dashboard');
  };

  // Handle navigation.
  const handleSelectTab = (tab: string) => {
    if (tab === 'profile') {
      setIsProfileSetupModalOpen(true);
      return;
    }

    if (tab === 'chat') {
      if (!activeChatProject) {
        const userProject =
          projects.find(
            (project) =>
              userProfile &&
              (project.leaderId === userProfile.id ||
                project.memberIds?.includes(userProfile.id))
          ) || projects[0];

        if (userProject) {
          setActiveChatProject(userProject);
        }
      }

      setCurrentTab('chat');
      return;
    }

    setCurrentTab(tab as 'landing' | 'browse' | 'dashboard' | 'chat');
  };

  return (
    <div className="min-h-screen bg-[#EFE7D8] text-[#36241E] flex flex-col selection:bg-[#5B6838] selection:text-[#F5EDE2] relative overflow-x-hidden">
      {/* Scattered ambient gold stars */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
        <span className="absolute top-12 left-8 text-2xl text-[#D9A83A] opacity-80 animate-pulse">
          ★
        </span>
        <span className="absolute top-36 right-12 text-3xl text-[#D9A83A] opacity-75">
          ★
        </span>
        <span className="absolute top-1/3 left-16 text-xl text-[#D9A83A] opacity-60">
          ★
        </span>
        <span className="absolute top-1/2 right-20 text-2xl text-[#D9A83A] opacity-70">
          ★
        </span>
        <span className="absolute top-2/3 left-10 text-3xl text-[#D9A83A] opacity-65">
          ★
        </span>
        <span className="absolute bottom-24 right-16 text-2xl text-[#D9A83A] opacity-80">
          ★
        </span>
      </div>

      <div className="relative z-10 flex flex-col flex-1">
        <Navbar
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
          onOpenCreateModal={() => {
            if (!userProfile) {
              setIsAuthModalOpen(true);
            } else {
              setIsCreateProjectModalOpen(true);
            }
          }}
          onOpenAuth={() => setIsAuthModalOpen(true)}
        />

        {/* Banner for incomplete profile */}
        {userProfile && !userProfile.completedProfile && (
          <div className="bg-[#DFB4C4] border-b-2 border-[#36241E] px-4 py-2 text-center text-xs font-mono font-bold text-[#36241E] flex items-center justify-center gap-2">
            <span>
              ★ Action Required: Finish setting up your GitHub & skills profile
              to activate AI matching.
            </span>

            <button
              onClick={() => setIsProfileSetupModalOpen(true)}
              className="underline font-black hover:text-[#5B6838] cursor-pointer"
            >
              Complete Profile Now →
            </button>
          </div>
        )}

        <main className="flex-1">
          {currentTab === 'landing' && (
            <LandingPage
              projects={projects}
              onBrowse={() => setCurrentTab('browse')}
              onCreateProject={() => {
                if (!userProfile) {
                  setIsAuthModalOpen(true);
                } else {
                  setIsCreateProjectModalOpen(true);
                }
              }}
              onSelectProject={(project) =>
                setSelectedProjectForDetail(project)
              }
            />
          )}

          {currentTab === 'browse' && (
            <BrowseProjects
              projects={projects}
              onSelectProject={(project) =>
                setSelectedProjectForDetail(project)
              }
              onRequestJoin={(project) =>
                setSelectedProjectForDetail(project)
              }
              onCreateProject={() => {
                if (!userProfile) {
                  setIsAuthModalOpen(true);
                } else {
                  setIsCreateProjectModalOpen(true);
                }
              }}
            />
          )}

          {currentTab === 'dashboard' && (
            <Dashboard
              projects={projects}
              onOpenChat={handleOpenChat}
              onSelectProject={(project) =>
                setSelectedProjectForDetail(project)
              }
              onCreateProject={() => {
                if (!userProfile) {
                  setIsAuthModalOpen(true);
                } else {
                  setIsCreateProjectModalOpen(true);
                }
              }}
              onUpdateProjectRoster={handleUpdateProjectRoster}
            />
          )}

          {currentTab === 'chat' && activeChatProject && (
            <ProjectChat
              project={activeChatProject}
              onBack={() => setCurrentTab('dashboard')}
              onRemoveMember={(memberId) => {
                const updatedMembers = (
                  activeChatProject.members || []
                ).filter((member) => member.userId !== memberId);

                const updatedMemberIds = (
                  activeChatProject.memberIds || []
                ).filter((id) => id !== memberId);

                const updatedProject = {
                  ...activeChatProject,
                  members: updatedMembers,
                  memberIds: updatedMemberIds,
                };

                setActiveChatProject(updatedProject);

                setProjects((previous) =>
                  previous.map((project) =>
                    project.id === updatedProject.id
                      ? updatedProject
                      : project
                  )
                );

                updateDoc(doc(db, 'projects', activeChatProject.id), {
                  members: updatedMembers,
                  memberIds: updatedMemberIds,
                }).catch((error) => {
                  console.warn('Remove member error:', error);
                });
              }}
            />
          )}
        </main>

        {/* Sign-in modal */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={() => {
            setIsAuthModalOpen(false);
            setIsProfileSetupModalOpen(true);
          }}
        />

        {/* Profile setup modal */}
        <ProfileSetup
          isOpen={isProfileSetupModalOpen}
          onClose={() => setIsProfileSetupModalOpen(false)}
          onComplete={async () => {
            await updateProfile({ completedProfile: true });
            setIsProfileSetupModalOpen(false);
            setCurrentTab('browse');
          }}
        />

        {/* Project detail modal */}
        <ProjectDetailModal
          project={selectedProjectForDetail}
          onClose={() => setSelectedProjectForDetail(null)}
          onRequestSubmitted={() => {
            setCurrentTab('dashboard');
          }}
        />

        {/* Create project modal */}
        <CreateProjectModal
          isOpen={isCreateProjectModalOpen}
          onClose={() => setIsCreateProjectModalOpen(false)}
          onProjectCreated={handleCreateProject}
        />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}