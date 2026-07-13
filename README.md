# DocSprint — Bureaucracy Made Survivable

DocSprint is a modern, high-performance web utility built to prepare, validate, and optimize your application photos, signatures, and PDFs securely in your browser's RAM. It operates with a **zero-retention privacy policy**—everything runs 100% client-side.

---

## 🚀 Key Features

*   **Photo Studio**: Smart cropping, background whitening/cleaning, and visual aspect checks matching standard specification presets (NEET, JEE, MAH-CET, passport, etc.).
*   **Signature Studio**: Automatically extracts signature lines, cleans backgrounds, creates high-contrast transparent signatures, and checks quality.
*   **PDF Studio**: Merge multiple PDFs, split ranges, rotate pages, and compress PDF files to precise target sizes safely in RAM.
*   **Vault Manager**: Keep local encrypted copies of your documents.

---

## 🛠️ Run Locally

**Prerequisites:** Node.js (v18+)

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/EnternalBlue07/DocSprint.git
    cd DocSprint
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run development server:**
    ```bash
    npm run dev
    ```
    Open `http://localhost:3000` to view it.

4.  **Build for production:**
    ```bash
    npm run build
    ```

---

## 🌐 Deployment (Vercel)

This project is a static frontend React app and can be hosted 100% for free on Vercel:

1.  Connect your GitHub account to [Vercel](https://vercel.com).
2.  Click **Import Project** and select the `DocSprint` repository.
3.  Click **Deploy** (Vercel automatically configures the Vite build commands).
