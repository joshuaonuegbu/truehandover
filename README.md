# 🛡️ TrueHandover

> **The Payment Bodyguard for Freelancers.**  
> *Contract Builder, Payment-Locked Delivery Vault, and Dispute Audit Shield.*

## 💡 The Core Idea: "Escrow-Lite"

In the freelance economy, there is a constant standoff at the end of a project:
1.  **The Client's Fear:** "I don't want to pay the full amount until I see the final work."
2.  **The Freelancer's Fear:** "I don't want to send the high-res files until I know the money is in the bank."

**TrueHandover solves this trust gap.** It acts as a digital intermediary without the high fees or slow processing of traditional escrow services.

## 🚀 Key Features

### 1. 🔒 Payment-Locked Delivery Vault
Instead of sending files via email or Dropbox, freelancers upload deliverables to a **TrueHandover Vault**.
-   **For the Freelancer:** Files are encrypted and locked.
-   **For the Client:** They receive a "Client Preview Link." They can see low-res watermarked previews (images), read the first page of PDFs, or watch 30-second clips of videos. This provides **Proof of Work**.
-   **The Exchange:** As soon as the client pays via the integrated checkout, the Vault instantly unlocks, allowing full-resolution downloads.

### 2. 💎 Conversion-Optimized Client View
The client interface is designed psychologically to encourage payment:
-   **Personalized:** Shows the freelancer's photo and a personal note.
-   **Trust Signals:** "Secured by TrueHandover", SSL badges, and clear deliverables lists.
-   **Instant Gratification:** One-click payment flow with immediate file access.

### 3. 📊 Financial Command Center
A "Cyber-Vault" aesthetic dashboard for tracking:
-   **Cash Flow:** Visualized via Recharts.
-   **Storage:** Track vault usage.
-   **Activity:** Real-time ticker of incoming deposits and locked files.

---

## 🛠️ Tech Stack

*   **Frontend:** React 18+
*   **Styling:** Tailwind CSS (featuring Glassmorphism, Dark Mode, and Framer-motion style CSS animations)
*   **Visualization:** Recharts
*   **Icons:** Lucide React

## 🎨 Design Philosophy

The UI uses a **"Cyber-Vault" aesthetic**:
-   **Obsidian & Emerald:** Dark, rich colors representing security and money.
-   **Glassmorphism:** Translucent panels to create depth.
-   **Micro-Interactions:** Haptic-style animations and sound effects on buttons to make finance feel tangible.

## 🔐 OAuth Setup (BYOS Cloud Drive)

- Full step-by-step setup lives in [OAUTH_DEPLOYMENT.md](OAUTH_DEPLOYMENT.md).
- Use [.env.example](.env.example) as the template for local variables.
