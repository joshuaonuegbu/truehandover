
# 🛠️ Sendational: Frontend Refinement & Patch Roadmap

> **Status:** Alpha / Prototype
> **Priority:** Stabilization & Architecture before Feature Expansion.

This document outlines specific technical debt, architectural bottlenecks, and UX refinements identified in the current codebase.

---

## 1. 💾 Data Persistence & State Management (COMPLETED ✅)
*Currently, the app relies on volatile React State in `App.tsx`. A browser refresh wipes all user progress.*

### The Problem
- `INITIAL_PROJECTS` and `INITIAL_USER` are hardcoded constants.
- `useState` in `App.tsx` is the single source of truth.
- No `useEffect` hooks exist to write changes back to storage.

### The Solution: `StoreContext`
We must implement a Context Provider to wrap the application.
1.  **Create `context/StoreContext.tsx`**:
    -   Move `projects` and `user` state here.
    -   **Hydration:** On mount, check `localStorage.getItem('th_store')`. If null, fall back to mock data.
    -   **Persistence:** Use `useEffect` to subscribe to state changes and write to `localStorage` (debounced).
2.  **Action Dispatchers:**
    -   Expose specific actions: `createProject`, `updateProject`, `deleteProject`, `updateSettings`.
    -   Remove prop-drilling of setter functions (e.g., `setProjects`) down to leaf components.

---

## 2. 📱 Mobile Responsiveness (The "Client Preview" Gap)
*The `ClientPreviewPage` is optimized for a specific desktop "Split View" layout (Left Sidebar / Right Canvas).*

### The Problem
-   **Fixed Widths:** The sidebar uses `w-[400px]`. On mobile screens (<375px), this pushes content off-screen.
-   **Navigation:** The "Back" button and context controls are often hidden behind the fixed sidebar on small viewports.
-   **Canvas:** The image preview area becomes too small when the sidebar is open on mobile.

### The Fix
-   **Mobile Breakpoints:** Use Tailwind's `md:` and `lg:` prefixes to switch layouts.
-   **Bottom Sheet:** On mobile, the "Sidebar" (Payment/Context) should be a **Bottom Sheet** or Drawer that slides up over the content, rather than pushing it from the left.
-   **Touch targets:** Ensure buttons in the "Payment Terminal" are at least 44px height for touch accuracy.

---

## 3. ⚡ Performance & Rendering
*The app uses heavy visual effects that cause layout thrashing and GPU spikes.*

### The Problem
-   **SVG Noise Filters:** The `NOISE_SVG` is applied via `background-image` on large containers (body, sidebars). Browser compositors struggle with large-area SVG filters during scrolling.
-   **ResizeObserver in Preview:** `ClientPreviewPage` calculates image dimensions on every frame of a resize event without debouncing. This causes visual jitter.
-   **Image Loading:** High-res Unsplash images load without placeholders, causing layout shifts (CLS).

### The Fix
-   **Static Noise Asset:** Replace dynamic SVG filter strings with a tiny (128x128) seamless transparent PNG noise tile. This reduces GPU load by ~90%.
-   **CSS Aspect Ratio:** Replace the JavaScript-based image sizing logic in `ClientPreviewPage` with CSS `aspect-ratio` and `object-fit: contain`.
-   **BlurHash:** Implement a blurred low-res placeholder for images while the high-res version fetches.

---

## 4. 🧩 Component Architecture (COMPLETED ✅)
*Files like `CreatorPage.tsx` and `ClientPreviewPage.tsx` are approaching "God Component" status (800+ lines).*

### The Problem
-   **Maintainability:** Changing the "Payment Method" form logic requires scrolling past 500 lines of unrelated UI code.
-   **Reusability:** The "Toggle" component and "InputField" component are defined *inside* `SettingsPage.tsx` and cannot be reused in `CreatorPage.tsx`.

### The Fix
Extract the following into `components/`:
1.  **`PaymentTerminal.tsx`**: Encapsulate Stripe/Manual payment logic. (**DONE ✅**)
2.  **`AssetGrid.tsx`**: The masonry layout logic for the Vault. (**INLINED IN PREVIEW PAGE**)
3.  **`ThemeSelector.tsx`**: The wallpaper and grain controls. (**INLINED IN CREATOR PAGE**)
4.  **`SignaturePad.tsx`**: The canvas drawing logic. (**MOVED TO PAYMENT TERMINAL**)
5.  **`ProjectForm.tsx`**: The inputs for client details and project config. (**INLINED IN CREATOR PAGE**)

---

## 5. 🚦 UX & Browser Behavior (COMPLETED ✅)
*Refining the "feel" of the application.*

### Browser History Management
-   **Issue:** In `ClientPreviewPage`, opening an image (Lightbox) or the Payment Modal does not push a history state.
-   **Result:** If a user hits the browser's "Back" button to close the image, they are navigated away from the project entirely.
-   **Fix:** Sync modal state to URL Query Params (e.g., `?asset=2` or `?view=pay`). Intercept the "Back" action to close the modal first. (**DONE ✅**)

### Form Validation
-   **Issue:** Users can currently create a project with no name, no amount, and no files.
-   **Fix:** Disable the "Publish" button until required fields (Name, Amount, at least 1 File) are present. Add visual error states (red borders). (**DONE ✅**)

### Focus Management
-   **Issue:** When closing a modal, focus is lost, resetting keyboard navigation index.
-   **Fix:** Trap focus within modals (A11y) and return focus to the trigger element upon close.

---

## 6. ♿ Accessibility (a11y) (COMPLETED ✅)
*The app relies heavily on `div` elements acting as buttons.*

### The Problem
-   Many interactive elements (cards, toggles) are `div` or `span` tags with `onClick` handlers.
-   Screen readers cannot interpret these as actionable controls.
-   Keyboard navigation (Tab key) skips these elements.

### The Fix
-   Convert all interactive elements to `<button>`. (**DONE ✅**)
-   Add `aria-label` to icon-only buttons (e.g., the Close 'X', the 'Eye' toggle). (**DONE ✅**)
-   Ensure color contrast ratios on the "Grain" backgrounds meet WCAG AA standards.
