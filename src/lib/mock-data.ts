import type { Project } from "@/lib/types";

export const currentUserId = "profile-priya";

export const demoProject: Project = {
  id: "project-ai-policy",
  name: "AI Policy Seminar",
  description: "Shared source board for the spring research draft.",
  inviteSlug: "ai-policy-seminar",
  members: [
    {
      id: "member-1",
      role: "owner",
      profile: {
        id: currentUserId,
        email: "priya@example.edu",
        name: "Priya Sen"
      }
    },
    {
      id: "member-2",
      role: "member",
      profile: {
        id: "profile-mateo",
        email: "mateo@example.edu",
        name: "Mateo Chen"
      }
    },
    {
      id: "member-3",
      role: "member",
      profile: {
        id: "profile-nora",
        email: "nora@example.edu",
        name: "Nora Wilson"
      }
    }
  ],
  bookmarks: [
    {
      id: "bookmark-1",
      projectId: "project-ai-policy",
      url: "https://hai.stanford.edu/ai-index",
      normalizedUrl: "https://hai.stanford.edu/ai-index",
      title: "AI Index Report",
      description:
        "Long-running benchmark report tracking AI investment, capabilities, public opinion, policy, and responsible AI trends.",
      faviconUrl: "https://hai.stanford.edu/favicon.ico",
      imageUrl:
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
      siteName: "Stanford HAI",
      status: "reading",
      researchNotes: {
        summary:
          "Useful for the opening section on how quickly AI deployment has shifted from lab demos to public infrastructure. The report gives the team a credible source for tracking capability, investment, governance, and adoption trends over time.",
        mainIdea:
          "AI systems are moving from experimental tools into broad social and economic infrastructure, which makes measurement and governance more urgent.",
        facts: [
          "Tracks AI trends across technical performance, economy, policy, education, and public opinion.",
          "Useful as a neutral benchmark source because it is updated as a recurring index.",
          "Governance sections can support claims about policy catching up to deployment."
        ]
      },
      tags: [
        { id: "tag-policy", name: "policy", color: "#365a8c" },
        { id: "tag-data", name: "data", color: "#6f826a" }
      ],
      addedBy: {
        id: "profile-mateo",
        email: "mateo@example.edu",
        name: "Mateo Chen"
      },
      comments: [
        {
          id: "comment-1",
          bookmarkId: "bookmark-1",
          user: {
            id: currentUserId,
            email: "priya@example.edu",
            name: "Priya Sen"
          },
          body: "Pull charts from the governance chapter.",
          createdAt: new Date("2026-06-26T15:30:00Z").toISOString()
        }
      ],
      createdAt: new Date("2026-06-25T17:20:00Z").toISOString(),
      updatedAt: new Date("2026-06-27T10:00:00Z").toISOString()
    },
    {
      id: "bookmark-2",
      projectId: "project-ai-policy",
      url: "https://www.nist.gov/itl/ai-risk-management-framework",
      normalizedUrl: "https://www.nist.gov/itl/ai-risk-management-framework",
      title: "AI Risk Management Framework",
      description:
        "NIST framework for identifying, measuring, managing, and governing AI risks across organizational contexts.",
      faviconUrl: "https://www.nist.gov/themes/custom/nist_www/favicon.ico",
      imageUrl:
        "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80",
      siteName: "NIST",
      status: "to_read",
      researchNotes: {
        summary:
          "Anchor source for risk categories and governance vocabulary. It should help standardize how the paper talks about identifying, measuring, and managing AI risks.",
        mainIdea:
          "Organizations need a structured lifecycle process for mapping, measuring, managing, and governing AI risk.",
        facts: [
          "The framework is designed to be voluntary and adaptable across sectors.",
          "It emphasizes trustworthy AI characteristics and governance practices.",
          "Risk management is framed as an ongoing process, not a one-time checklist."
        ]
      },
      tags: [
        { id: "tag-risk", name: "risk", color: "#b96f5a" },
        { id: "tag-framework", name: "framework", color: "#6f826a" }
      ],
      addedBy: {
        id: "profile-nora",
        email: "nora@example.edu",
        name: "Nora Wilson"
      },
      comments: [],
      createdAt: new Date("2026-06-24T09:15:00Z").toISOString(),
      updatedAt: new Date("2026-06-24T09:15:00Z").toISOString()
    },
    {
      id: "bookmark-3",
      projectId: "project-ai-policy",
      url: "https://www.oecd.org/ai/principles/",
      normalizedUrl: "https://www.oecd.org/ai/principles/",
      title: "OECD AI Principles",
      description:
        "International AI principles covering inclusive growth, human-centered values, transparency, robustness, and accountability.",
      faviconUrl: "https://www.oecd.org/favicon.ico",
      imageUrl:
        "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80",
      siteName: "OECD",
      status: "done",
      researchNotes: {
        summary:
          "Good comparison point for EU and US policy language. The principles are concise enough to cite in the policy comparison table.",
        mainIdea:
          "International AI governance tends to converge around human-centered values, transparency, robustness, and accountability.",
        facts: [
          "Principles include inclusive growth, human-centered values, transparency, robustness, and accountability.",
          "Helpful for comparing high-level norms against binding legal requirements.",
          "Can be used to show cross-border consensus on baseline AI governance language."
        ]
      },
      tags: [
        { id: "tag-policy", name: "policy", color: "#365a8c" },
        { id: "tag-global", name: "global", color: "#7b6ba8" }
      ],
      addedBy: {
        id: currentUserId,
        email: "priya@example.edu",
        name: "Priya Sen"
      },
      comments: [
        {
          id: "comment-2",
          bookmarkId: "bookmark-3",
          user: {
            id: "profile-nora",
            email: "nora@example.edu",
            name: "Nora Wilson"
          },
          body: "I used this in the comparison table.",
          createdAt: new Date("2026-06-28T13:10:00Z").toISOString()
        }
      ],
      createdAt: new Date("2026-06-23T12:00:00Z").toISOString(),
      updatedAt: new Date("2026-06-28T13:10:00Z").toISOString()
    },
    {
      id: "bookmark-4",
      projectId: "project-ai-policy",
      url: "https://artificialintelligenceact.eu/",
      normalizedUrl: "https://artificialintelligenceact.eu/",
      title: "EU Artificial Intelligence Act Tracker",
      description:
        "Public guide and tracker for the European Union AI Act, including timelines, obligations, and risk categories.",
      faviconUrl: "https://artificialintelligenceact.eu/favicon.ico",
      imageUrl:
        "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=1200&q=80",
      siteName: "AI Act",
      status: "used_in_draft",
      researchNotes: {
        summary:
          "Use for the section on risk-tiered regulatory models. This source is best for explaining how obligations change depending on the AI system risk category.",
        mainIdea:
          "The EU model organizes AI regulation around risk tiers, with stricter duties for higher-risk systems.",
        facts: [
          "Useful for timelines, implementation milestones, and obligation summaries.",
          "Supports the draft section contrasting risk-tiered regulation with voluntary frameworks.",
          "Good source for plain-language descriptions of prohibited and high-risk systems."
        ]
      },
      tags: [
        { id: "tag-eu", name: "EU", color: "#365a8c" },
        { id: "tag-law", name: "law", color: "#b96f5a" }
      ],
      addedBy: {
        id: "profile-mateo",
        email: "mateo@example.edu",
        name: "Mateo Chen"
      },
      comments: [],
      createdAt: new Date("2026-06-22T18:40:00Z").toISOString(),
      updatedAt: new Date("2026-06-29T08:45:00Z").toISOString()
    }
  ]
};
