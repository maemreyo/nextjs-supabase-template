# AnalysisEditor Component Architecture Diagram

## Current vs Proposed Architecture

### Current Architecture (Problems)

```mermaid
graph TD
    A[AnalysisEditor - 832 lines] --> B[TipTap Editor]
    A --> C[useTipTapEditor Hook]
    A --> D[useTipTapSelection Hook]
    A --> E[useTipTapAutoSave Hook]
    A --> F[useSessionData Hook]
    A --> G[useAnalysisSave Hook]
    A --> H[useSessionStore]
    A --> I[SessionQuickActions - Outside Return]
    
    style A fill:#ffcccc
    style I fill:#ffcccc
    
    classDef problem fill:#ffcccc,stroke:#ff0000,stroke-width:2px
    classDef hook fill:#ffffcc,stroke:#ffaa00,stroke-width:2px
    classDef component fill:#ccffcc,stroke:#00aa00,stroke-width:2px
    
    class A,I problem
    class C,D,E,F,G hook
    class B component
```

**Issues Identified:**
- 🔴 Single component with 832 lines
- 🔴 SessionQuickActions rendered outside return statement
- 🟡 Too many hooks creating complex dependencies
- 🔴 Mixed concerns (UI, business logic, state management)

### Proposed Architecture (Solution)

```mermaid
graph TD
    subgraph "Container Layer"
        A[AnalysisEditor Container]
        AP[EditorProvider]
    end
    
    subgraph "Presentation Layer"
        B[EditorHeader]
        C[EditorToolbar]
        D[EditorContent]
        E[EditorStatusBar]
        F[EditorModals]
    end
    
    subgraph "Business Logic Layer"
        G[AnalysisOrchestrator]
        H[SaveManager]
        I[KeyboardShortcutManager]
        J[SelectionManager]
    end
    
    subgraph "State Management"
        K[EditorContext]
        L[Content State]
        M[Selection State]
        N[Analysis State]
        O[Session State]
    end
    
    subgraph "UI Components"
        P[SessionInfo]
        Q[BreadcrumbNavigation]
        R[QuickActions]
        S[SaveControls]
        T[FormatControls]
        U[SelectionControls]
        V[HighlightControls]
        W[TextStats]
        X[SaveStatus]
        Y[AnalysisButton]
        Z[TipTapEditorWrapper]
        AA[BubbleMenu]
        BB[SaveToSessionDialog]
        CC[SessionQuickActionsDialog]
        DD[ErrorBoundary]
    end
    
    A --> AP
    A --> B
    A --> C
    A --> D
    A --> E
    A --> F
    
    AP --> K
    K --> L
    K --> M
    K --> N
    K --> O
    
    A --> G
    A --> H
    A --> I
    A --> J
    
    B --> P
    B --> Q
    B --> R
    
    C --> S
    C --> T
    C --> U
    C --> V
    
    D --> Z
    D --> AA
    
    E --> W
    E --> X
    E --> Y
    
    F --> BB
    F --> CC
    F --> DD
    
    classDef container fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef presentation fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef business fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef state fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef ui fill:#fce4ec,stroke:#880e4f,stroke-width:2px
    
    class A,AP container
    class B,C,D,E,F presentation
    class G,H,I,J business
    class K,L,M,N,O state
    class P,Q,R,S,T,U,V,W,X,Y,Z,BB,CC,DD ui
```

## Data Flow Architecture

```mermaid
sequenceDiagram
    participant User
    participant UI as UI Components
    participant Container as AnalysisEditor
    participant Business as Business Logic
    participant State as State Management
    participant API as External APIs
    
    User->>UI: Select text
    UI->>Container: onTextSelect(text, type)
    Container->>Business: SelectionManager.handleSelection()
    Business->>State: Update selection state
    State->>UI: Re-render with selection
    
    User->>UI: Click Analyze
    UI->>Container: triggerAnalysis(type)
    Container->>Business: AnalysisOrchestrator.start()
    Business->>API: Analysis request
    API-->>Business: Analysis result
    Business->>State: Update analysis state
    State->>UI: Display results
    
    User->>UI: Type content
    UI->>Container: updateContent(content)
    Container->>Business: SaveManager.autoSave()
    Business->>API: Save request
    API-->>Business: Save confirmation
    Business->>State: Update save status
    State->>UI: Show save status
```

## State Management Flow

```mermaid
graph LR
    subgraph "EditorContext"
        A[EditorState]
        B[EditorActions]
        C[EditorConfig]
    end
    
    subgraph "State Slices"
        D[ContentState]
        E[SelectionState]
        F[AnalysisState]
        G[SaveState]
        H[UIState]
    end
    
    subgraph "External State"
        I[SessionStore]
        J[AnalysisStore]
        K[UIStore]
    end
    
    A --> D
    A --> E
    A --> F
    A --> G
    A --> H
    
    B --> D
    B --> E
    B --> F
    B --> G
    B --> H
    
    I --> H
    J --> F
    K --> H
    
    classDef context fill:#e3f2fd,stroke:#0d47a1,stroke-width:2px
    classDef slice fill:#f1f8e9,stroke:#33691e,stroke-width:2px
    classDef external fill:#fff8e1,stroke:#ff6f00,stroke-width:2px
    
    class A,B,C context
    class D,E,F,G,H slice
    class I,J,K external
```

## Component Dependencies

```mermaid
graph TD
    subgraph "Level 1 - Foundation"
        A[EditorProvider]
        B[EditorContext]
        C[Base Interfaces]
    end
    
    subgraph "Level 2 - Business Logic"
        D[AnalysisOrchestrator]
        E[SaveManager]
        F[SelectionManager]
        G[KeyboardShortcutManager]
    end
    
    subgraph "Level 3 - Container"
        H[AnalysisEditor]
    end
    
    subgraph "Level 4 - Presentation"
        I[EditorHeader]
        J[EditorToolbar]
        K[EditorContent]
        L[EditorStatusBar]
        M[EditorModals]
    end
    
    subgraph "Level 5 - UI Components"
        N[SessionInfo]
        O[SaveControls]
        P[FormatControls]
        Q[TipTapEditorWrapper]
        R[SaveDialog]
        S[BubbleMenu]
    end
    
    A --> B
    B --> C
    C --> D
    C --> E
    C --> F
    C --> G
    
    D --> H
    E --> H
    F --> H
    G --> H
    
    H --> I
    H --> J
    H --> K
    H --> L
    H --> M
    
    I --> N
    J --> O
    J --> P
    K --> Q
    M --> R
    K --> S
    
    classDef level1 fill:#ffebee,stroke:#b71c1c,stroke-width:2px
    classDef level2 fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef level3 fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef level4 fill:#e3f2fd,stroke:#0d47a1,stroke-width:2px
    classDef level5 fill:#fff3e0,stroke:#e65100,stroke-width:2px
    
    class A,B,C level1
    class D,E,F,G level2
    class H level3
    class I,J,K,L,M level4
    class N,O,P,Q,R,S level5
```

## Testing Architecture

```mermaid
graph TD
    subgraph "Test Pyramid"
        A[E2E Tests - 10%]
        B[Integration Tests - 30%]
        C[Unit Tests - 60%]
    end
    
    subgraph "E2E Test Coverage"
        D[Critical User Journeys]
        E[Cross-browser Testing]
        F[Performance Benchmarks]
    end
    
    subgraph "Integration Tests"
        G[Component Integration]
        H[Hook Integration]
        I[API Integration]
        J[State Management]
    end
    
    subgraph "Unit Tests"
        K[Component Rendering]
        L[Business Logic]
        M[Utility Functions]
        N[Event Handlers]
    end
    
    A --> D
    A --> E
    A --> F
    
    B --> G
    B --> H
    B --> I
    B --> J
    
    C --> K
    C --> L
    C --> M
    C --> N
    
    classDef e2e fill:#ffebee,stroke:#c62828,stroke-width:2px
    classDef integration fill:#f3e5f5,stroke:#6a1b9a,stroke-width:2px
    classDef unit fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    
    class A,D,E,F e2e
    class B,G,H,I,J integration
    class C,K,L,M,N unit
```

## Migration Path

```mermaid
gantt
    title AnalysisEditor Refactoring Timeline
    dateFormat  YYYY-MM-DD
    section Phase 1: Foundation
    Setup Testing Infrastructure    :p1-1, 2024-01-01, 3d
    Create Component Interfaces     :p1-2, after p1-1, 2d
    Base Container Component        :p1-3, after p1-2, 3d
    State Management Setup         :p1-4, after p1-3, 2d
    
    section Phase 2: Core Features
    Editor Content Component       :p2-1, after p1-4, 3d
    Toolbar Components            :p2-2, after p2-1, 4d
    Save Functionality           :p2-3, after p2-2, 3d
    Analysis Workflow            :p2-4, after p2-3, 4d
    
    section Phase 3: Advanced Features
    Keyboard Shortcuts          :p3-1, after p2-4, 2d
    Session Management          :p3-2, after p3-1, 3d
    Accessibility Features      :p3-3, after p3-2, 3d
    Performance Optimization    :p3-4, after p3-3, 2d
    
    section Phase 4: Testing & Polish
    Comprehensive Testing       :p4-1, after p3-4, 5d
    Error Handling             :p4-2, after p4-1, 2d
    Security Hardening         :p4-3, after p4-2, 2d
    Documentation             :p4-4, after p4-3, 1d
```

## Key Benefits of New Architecture

### 🎯 **Separation of Concerns**
- Each component has a single responsibility
- Clear boundaries between UI, business logic, and state
- Easier to understand and maintain

### 🔧 **Maintainability**
- Components under 200 lines each
- Clear dependency hierarchy
- Isolated testing possible

### 🚀 **Performance**
- Targeted re-renders with memoization
- Efficient state management
- Reduced bundle size through tree-shaking

### 🛡️ **Security**
- Input sanitization at boundaries
- Secure error handling
- No data exposure in logs

### ♿ **Accessibility**
- ARIA compliance built-in
- Keyboard navigation support
- Focus management

### 🧪 **Testability**
- 90%+ code coverage achievable
- Unit tests for all business logic
- Integration tests for component interactions

---

*This architecture diagram provides a visual roadmap for the refactoring process and will be updated as we progress through implementation.*