# 🚀 Platform Roadmap Manager

A simple, lightweight, single-file web application for managing your platform features and roadmap with AI-powered assistance.

## ✨ Features

- **📊 Table View** - Sortable, filterable table with vertical timeline/difficulty display
- **📅 Timeline Breakdown** - Break down features into multiple phases (MVP/SHORT/LONG) with detailed planning for each
- **🤖 AI-Powered Summaries** - Automatically combines timeline item details into concise summaries
- **🤖 AI Chat Assistant** - Ask questions and get insights about your roadmap using OpenRouter API
- **✨ AI Editing Capabilities** - AI can directly create, update, and manage features with your approval
- **🏷️ Smart Categories** - Add categories at timeline-item-level for organization
- **📥 Export to CSV** - Download your roadmap data (one row per timeline item for Excel analysis)
- **💾 Backup & Restore** - Export/import complete data backups (features, memory, settings)
- **💾 Auto-Save** - All data saved locally in your browser (no server needed)
- **⚠️ Smart Warnings** - Alerts for storage issues, path changes, and data persistence
- **🎨 Beautiful UI** - Modern, responsive design

## 🚀 Quick Start

### Step 1: Open the App
Simply double-click `index.html` or open it in your web browser.

**⚠️ IMPORTANT:** Always open the file from the same location! Different file paths = different storage = lost data. See "Data Persistence" section below for details.

### Step 2: Get Your OpenRouter API Key
1. Go to [OpenRouter](https://openrouter.ai/)
2. Sign up for a free account
3. Navigate to [Keys](https://openrouter.ai/keys)
4. Create a new API key
5. Copy the key

### Step 3: Add Your API Key
1. Click the 💬 chat button in the bottom-right corner
2. Paste your OpenRouter API key in the input field
3. Start chatting with the AI assistant!

## 🔌 MCP Servers Setup (Optional)

This project uses **Model Context Protocol (MCP)** servers to enhance AI capabilities. The following servers are configured:

### 🌐 Autonomous Frontend Browser Tools (Installed)
**Purpose:** Gives AI real-time context about your running application - console logs, network requests, DOM state, and screenshots.

**What it does:**
- Inspect live application state
- Monitor console logs and errors
- Track network requests (perfect for debugging Supabase API calls)
- Take screenshots for visual debugging
- AI can see what developers see in DevTools

**Chrome Extension Setup Required:**

1. **Install the npm package:**
   ```bash
   npm install -g @winds-ai/autonomous-frontend-browser-tools
   ```

2. **Download Chrome Extension:**
   - Visit: [Autonomous Browser Tools on npm](https://www.npmjs.com/package/@winds-ai/autonomous-frontend-browser-tools)
   - Download the extension files
   - Or clone from GitHub: `git clone https://github.com/winds-ai/autonomous-frontend-browser-tools`

3. **Install Extension in Chrome:**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable **Developer mode** (toggle in top-right)
   - Click **"Load unpacked"**
   - Select the `chrome-extension/` folder from the package
   - Extension should appear with the Autonomous Browser Tools icon

4. **Usage:**
   - Open your app in Chrome (`index.html`)
   - Open DevTools (F12)
   - The extension will automatically connect to the MCP server
   - Now AI can inspect your running application!

**Perfect for:**
- Debugging Supabase sync issues
- Analyzing network performance
- Troubleshooting JavaScript errors
- Visual inspection of UI changes

---

### 🎨 MCP-UI Server (Installed ✅)
**Purpose:** Generate reusable HTML/CSS components from natural language descriptions.

**What it does:**
- Framework-agnostic raw HTML/CSS generation
- Pre-built component templates (modals, cards, buttons, forms, tables)
- Vanilla JavaScript compatible (no React/Vue required)
- Copy-paste ready components with inline CSS

**Installation Complete!**

The MCP-UI server is already configured and running. You can now generate components by asking:

**Example prompts:**
```
"Generate a modal with title 'Settings' and a form inside"
"Create a card component for displaying features"
"Generate a primary button with text 'Save Changes'"
"Create a form with name, email, and password fields"
"Generate a table showing my roadmap features"
```

**Available Component Types:**
- **Modals** - Dialog boxes with customizable content
- **Cards** - Content cards with titles, descriptions, and optional images
- **Buttons** - Styled buttons (primary, secondary, success, danger variants)
- **Forms** - Multi-field forms with validation
- **Tables** - Data tables with headers and sortable columns
- **Custom HTML** - General-purpose HTML/CSS generation

**Test Page:**
Open [mcp-ui-test.html](mcp-ui-test.html) to see component examples and test the server.

**How to Use:**
1. Ask the AI to generate a component (e.g., "Create a modal for user login")
2. The MCP-UI server generates the HTML/CSS
3. Copy the code into your project
4. Customize as needed

---

### ✨ 21st.dev Magic MCP (Installed ✅)
**Purpose:** AI-powered UI component generation (like v0.dev in your IDE).

**What it does:**
- Natural language to component generation
- Modern UI scaffolding with React, Vue, Svelte, and more
- Access to large pre-built component library
- SVGL integration for brand assets
- Professional design patterns and layouts

**Installation Complete!**

The Magic MCP server is now configured and running. You can generate advanced UI components by asking:

**Example prompts:**
```
"Create a modern dashboard layout with sidebar"
"Generate a pricing card component with three tiers"
"Build a contact form with validation"
"Create an animated hero section"
"Generate a responsive navigation bar"
```

**Features:**
- **Component Library** - Access to thousands of pre-built components
- **Modern Frameworks** - React, Vue, Svelte, Solid, and more
- **Responsive Design** - Mobile-first, adaptive layouts
- **Brand Assets** - SVGL icons and logos
- **Best Practices** - Industry-standard patterns and accessibility

**Note:** While primarily designed for React/modern frameworks, you can adapt generated components to vanilla HTML/CSS or use them as inspiration for your project.

---

### Other Configured MCP Servers

This project also has the following MCP servers configured:

- **🗄️ Supabase MCP** - Database operations and project management
- **🚀 Vercel MCP** - Deployment and environment management
- **🎭 Playwright MCP** - Browser automation and testing (Microsoft Official)
- **🎪 Puppeteer MCP** - Alternative browser automation

**Total MCP Servers:** 7 configured and connected ✅

To see all configured MCP servers:
```bash
claude mcp list
```

## 📖 How to Use

### Adding Features

1. Click **"+ Add Feature"** button
2. Fill in the **feature-level information**:
   - **Name** - Name of the feature or service
   - **Type** - Feature or Service
   - **Purpose** - What is the purpose of this feature/service?
3. Add **Timeline Breakdown Items** (at least one required):
   - Click **"+ Add Timeline Item"** to add timeline phases (MVP, SHORT, LONG)
   - For each timeline item, fill in:
     - **Timeline** - MVP (must have), SHORT (short term), or LONG (long term)
     - **Difficulty** - Easy, Medium, or Hard
     - **USP** - What makes this feature unique in this phase
     - **Integration Type** - How you'll execute this feature in this phase
     - **Categories** - Phase-specific categories (e.g., "backend" for MVP, "frontend" for SHORT)
   - You can add multiple timeline items to break down a feature into phases
   - Click **"Remove"** to delete a timeline item (minimum 1 required)
4. Click **"Save Feature"** - AI will automatically generate summaries of your timeline items

### Table View Features

The table displays all feature information in a single, comprehensive view:

**Columns:**
- **Name** - Feature or service name
- **Type** - Feature or Service badge
- **Timeline** - Vertical list of timeline phases (MVP, SHORT, LONG)
- **Difficulty** - Vertical list of difficulty levels (aligned with timelines)
- **Purpose** - Feature-level purpose description
- **USP** - AI-generated summary combining all timeline USPs
- **Integration Type** - AI-generated summary of integration approaches
- **Category** - All unique categories from timeline items
- **Actions** - Edit/Delete buttons

**Features:**
- **Search** - Type in the search box to filter features (searches across all fields)
- **Filter** - Use dropdown filters for timeline and difficulty
- **Sort** - Click column headers to sort (click again to reverse)
- **Vertical Display** - Timeline and difficulty badges stack vertically for clear phase mapping
- **Edit** - Click "Edit" button to modify feature and regenerate AI summaries
- **Delete** - Click "Delete" button to remove a feature

### AI Chat Assistant with Editing Powers

The AI assistant can now directly modify your roadmap with your approval!

**Setup:**
1. Enter your OpenRouter API key
2. Select an AI model from the dropdown:
   - **DeepSeek V3.1 Terminus** - 671B params, extremely cost-effective (default)
   - **Claude Haiku 4.5** - Anthropic's fastest model
   - **GPT-4o Mini** - OpenAI's efficient model
   - **Kimi K2** - 1T params with 256K context window
   - **Grok 4 Fast** - xAI's model with 2M context window
3. Once configured, you'll see "🟢 API Connected" - click "Settings" to change
4. Start chatting!

**Memory & Context Management:**
- **🧠 Memory Button** - Click to open Memory & Context panel
- **Custom Instructions** - Define the AI's role, context, and tone (e.g., "You are a Product Development Assistant for our integration platform")
- **Memory Items** - Store important information that persists across conversations:
  - Add items manually using the input field
  - **Auto-Analysis** - Every 5 messages, AI automatically analyzes your conversation for valuable knowledge points
  - View and manage all memory items
  - Memory is preserved when starting new conversations
- **Smart Suggestions** - Automatic memory suggestions appear as notification bar:
  - Shows "🧠 X new memory suggestions" when available
  - Click to expand and review suggested knowledge points
  - ✓ Approve to add to permanent memory
  - ✗ Reject to dismiss suggestion
  - "Approve All" / "Reject All" for bulk actions
  - **How it works:** Every 5 messages, the AI analyzes your conversation to identify important knowledge points (preferences, decisions, requirements, tech stack details, etc.). When you approve suggestions, they're added to permanent memory and included in every future AI conversation for context.
- **Memory Context Indicator** - See how many memory items are included in your current conversation context (displayed above the chat input)
- **Visual Feedback** - Toast notifications show when analysis starts and completes
- **Conversation Tracking** - Monitor message count and context usage
- **Context Warning** - Get notified when conversation becomes long (20+ messages)
- **🔄 New Conversation** - Start fresh while preserving memory and custom instructions

**Chat Features:**
- **Auto-expanding input** - Text area grows as you type (up to 200px)
- **Compact send button** - Takes minimal space, aligned to bottom
- **Enter to send** - Press Enter to send your message
- **Shift+Enter** - Press Shift+Enter to add a new line without sending
- **Formatted responses** - AI responses support:
  - **Bold text** with `**text**`
  - *Italic text* with `*text*`
  - `Code snippets` with backticks
  - Bullet points and numbered lists
  - Proper line spacing and paragraphs
  - Headers and sections
  - **Tables** - Markdown tables render as styled HTML tables with headers

**How Auto-Analysis Works:**
Every 5 messages, the AI automatically:
1. Analyzes the last 5 messages in your conversation
2. Identifies 2-3 valuable knowledge points (preferences, decisions, requirements, tech stack, architectural choices, etc.)
3. Shows a toast notification when analysis starts and completes
4. Displays suggestions in a notification bar at the top of the chat
5. You review and approve/reject each suggestion
6. Approved items are added to permanent memory
7. Memory is included in every AI conversation's context (shown in the memory context indicator above chat input)
8. Memory persists across conversations (even after starting new chats) - the AI remembers important information from previous conversations

**Example Questions:**
```
"What MVP features do I have?"
"Show me all Easy difficulty features"
"Suggest a USP for my authentication feature"
"What should I prioritize next?"
"Summarize all SHORT term features"
"Which features have the 'security' tag?"
"How many features are in progress?"
"Show me a comparison table of my features by difficulty"
```

**Table Rendering:**
When the AI provides data in table format like:
```
| Feature | Priority | Status |
|---------|----------|--------|
| Auth    | High     | Done   |
| API     | Medium   | WIP    |
```
It will render as a styled HTML table with headers, borders, and hover effects!

**✨ NEW: AI Editing Capabilities:**

The AI can now directly modify your roadmap! Just ask in natural language and the AI will propose changes for your approval:

**What AI Can Do:**
1. **Update Features** - Modify feature names, types, or purposes
   - *"Rename 'User Auth' to 'Authentication System'"*
   - *"Change the purpose of my Payment feature"*

2. **Update Timeline Items** - Change difficulty, categories, USPs, or integration types
   - *"Make the MVP phase of Authentication easier"*
   - *"Add 'security' category to all authentication timeline items"*

3. **Create New Features** - Add completely new features with timeline items
   - *"Create a new 'Email Notifications' feature with MVP and SHORT phases"*
   - *"Add a reporting dashboard feature"*

4. **Create Links** - Establish dependencies or complementary relationships
   - *"Make User Profiles depend on Authentication"*
   - *"Link Payment Gateway with Order Management as complements"*

5. **Add Timeline Items** - Extend existing features with new phases
   - *"Add a LONG term phase to the API Gateway feature"*

6. **Delete Timeline Items** - Remove unnecessary phases (use cautiously!)
   - *"Remove the LONG phase from Basic Authentication"*

**How It Works:**
1. Ask the AI to make a change in natural language
2. AI analyzes your request and proposes a specific action
3. Approval dialog shows you exactly what will change (before/after diff)
4. Click "✓ Approve" to apply or "Reject" to cancel
5. Changes are immediately reflected in your roadmap
6. All actions are logged for transparency

**Example Conversations:**
```
You: "Create a new feature called 'Real-time Chat' with an MVP phase"
AI: [Proposes new feature with timeline items]
[Approval dialog appears showing full details]
You: Approve ✓
AI: "✅ I've successfully created the new feature. It's now live in your roadmap."

You: "Make the Payment Integration feature easier"
AI: [Proposes changing difficulty from Hard to Medium]
[Shows before/after comparison]
You: Approve ✓
AI: "✅ Updated the timeline item successfully."
```

**Safety Features:**
- ✅ All changes require your explicit approval
- ✅ Clear before/after previews
- ✅ Full action logging and audit trail
- ✅ AI-modified features show badges
- ✅ Can be disabled in settings (coming soon)

**Visual Indicators:**
- 🟣 **AI Created** badge - Features created by AI
- 🔵 **AI Modified** badge - Features updated by AI

**AI Commands (Read-Only):**
- Ask about your features
- Get suggestions for USPs or integration types
- Analyze your roadmap
- Get recommendations on what to build next

### Export Data

Click **"📥 Export CSV"** to download your roadmap as a CSV file. The export creates one row per timeline item, making it perfect for Excel analysis, sharing with your team, or importing into other tools!

## 🛠️ Features Overview

### Feature-Level Fields
| Field | Description |
|---------|-------------|
| **Name** | The name of your feature or service |
| **Type** | Feature or Service |
| **Purpose** | The purpose or goal of this feature/service |

### Timeline Breakdown Items
Each feature must have at least one timeline item. Multiple items allow you to break down implementation phases:

| Field | Description |
|---------|-------------|
| **Timeline** | MVP (critical), SHORT (near term), LONG (future) |
| **Difficulty** | Easy, Medium, or Hard to implement in this phase |
| **USP** | Unique Selling Point - what makes it special in this phase |
| **Integration Type** | How you plan to execute/integrate this in this phase |
| **Categories** | Phase-specific categories (e.g., "backend", "frontend", "mobile") |

### AI-Generated Summaries
When you save a feature with multiple timeline items, AI automatically generates:
- **Combined USP** - Coherent summary showing how USPs progress across phases
- **Combined Integration Type** - Summary of all integration approaches

**Example:** A "User Authentication" feature might have:
- MVP timeline item: Basic login/signup (Easy, Backend, API)
- SHORT timeline item: Social login integration (Medium, Backend + Frontend, OAuth)
- LONG timeline item: Biometric authentication (Hard, Mobile, Biometric SDK)

AI Summary might produce:
- **USP**: "Starts with basic authentication, evolves to include social login, and advances to biometric security"
- **Integration**: "API-based auth expanding to OAuth integration and biometric SDKs"

## 💡 Tips

1. **Break Down Features by Timeline** - Use timeline breakdown to plan features in phases (MVP → SHORT → LONG) with specific details for each phase
2. **AI Summaries** - AI automatically generates concise summaries when you save features with multiple timeline items
3. **Vertical Layout** - Timeline and difficulty badges stack vertically in the table for clear visual mapping
4. **Categories Only in Timeline Items** - Add categories to individual timeline items (e.g., "backend" for MVP, "frontend" for SHORT) - they automatically appear in the main feature row
5. **Leverage AI** - Ask the AI assistant to help you write USPs, prioritize features, or suggest timeline breakdowns
6. **Export Often** - Regularly export your data as a backup - CSV exports one row per timeline item for easy Excel analysis
7. **Filter Smartly** - Timeline and difficulty filters show features if ANY timeline item matches
8. **Search Everything** - Search box searches across all fields including timeline item details and AI-generated summaries
9. **API Key Required for Summaries** - Configure your OpenRouter API key to enable AI summarization (works with chat assistant)
10. **Formatted AI Responses** - AI responses automatically format with bullet points, bold text, code blocks, tables, and proper spacing
11. **Ask for Tables** - Request the AI to show data in table format (e.g., "Show me a comparison table of features")
12. **Use Custom Instructions** - Set up custom instructions to define how the AI should behave (your role, project context, style)
13. **Build Memory Over Time** - Add important decisions, preferences, and context to memory for future conversations
14. **Review Auto-Suggestions** - Check memory suggestions every 5 messages to build your AI's permanent memory
15. **Memory Context Indicator** - Watch the indicator above chat input to see how many memory items are included in your conversation context
16. **Start New When Needed** - Use the 🔄 button to start fresh conversations while keeping your memory intact

## 🔒 Privacy & Data

- **All data is stored locally** in your browser's localStorage
- **No server or database** required
- **Your API key** is stored locally and never shared
- **Export your data** anytime to keep backups

## 💾 Data Persistence & Backup

### Important: File Path Matters!

When using `file://` protocol (opening HTML directly), **each file path gets separate storage**:

```
✅ GOOD: Always open from same location
C:\Users\harsh\Downloads\Platform Test\index.html

❌ BAD: Opening from different paths loses data
C:\Users\harsh\Desktop\index.html  ← Different storage!
C:\Users\harsh\Documents\index.html  ← Different storage!
```

### Backup & Restore Feature

**💾 Backup All** - Export everything to JSON file:
- All features
- Memory items
- Memory suggestions
- Custom instructions
- AI model preferences

**📂 Import Backup** - Restore from JSON backup:
- Select your backup file
- Confirms before overwriting current data
- Restores everything instantly

### When to Use Backup/Restore

1. **Before moving the file** - Export before changing location
2. **Regular backups** - Export weekly to avoid data loss
3. **Switching browsers** - Export from one, import to another
4. **After warnings** - If you see origin change warning
5. **Sharing data** - Send backup to teammates

### Better Solution: Use a Local Server

For more reliable data persistence, run a local web server:

**Option 1: Python (if installed)**
```bash
cd "C:\Users\harsh\Downloads\Platform Test"
python -m http.server 8000
```
Then open: `http://localhost:8000`

**Option 2: VS Code Live Server**
1. Install "Live Server" extension
2. Right-click `index.html`
3. Select "Open with Live Server"

**Option 3: Node.js http-server**
```bash
npx http-server
```

**Benefits of using local server:**
- ✅ Consistent storage location (always `localhost`)
- ✅ No path-based storage issues
- ✅ Better for development
- ✅ More reliable

## 🎨 Customization

Since this is a single HTML file, you can easily customize:

1. **Colors** - Edit the CSS gradient colors in the `<style>` section
2. **Categories** - Change MVP/SHORT/LONG to your own categories
3. **Difficulty Levels** - Modify Easy/Medium/Hard to your scale
4. **AI Models** - Add more models to the dropdown (see section below)

### Changing the AI Model

Simply use the dropdown in the AI chat panel! The app includes 5 cost-effective models:

- **DeepSeek V3.1 Terminus** - 671B params, extremely cost-effective (default)
- **Claude Haiku 4.5** - Anthropic's fastest model
- **GPT-4o Mini** - OpenAI's efficient model
- **Kimi K2** - 1T params with 256K context window
- **Grok 4 Fast** - xAI's model with 2M context window

All models are optimized for speed and cost-effectiveness, perfect for frequent use.

To add more models, edit the `<select id="modelSelect">` section in the HTML and add new `<option>` tags with the model ID from [OpenRouter's model list](https://openrouter.ai/models).

## 📱 Browser Compatibility

Works in all modern browsers:
- ✅ Chrome / Edge
- ✅ Firefox
- ✅ Safari
- ✅ Opera

## 🤝 Support

If you encounter issues:

1. **Check Browser Console** - Press F12 and look for errors
2. **Verify API Key** - Make sure your OpenRouter key is valid
3. **Clear Browser Cache** - Sometimes helps with localStorage issues
4. **Try Incognito Mode** - To rule out extension conflicts

## 📄 License

Free to use and modify for your personal and commercial projects!

## 🎯 Example Use Cases

- Planning a SaaS platform roadmap
- Managing feature requests
- Organizing development priorities
- Evaluating which features to build first
- Tracking MVP vs future features
- Collaborating with stakeholders (via CSV export)

---

**Made with ❤️ for product builders and developers**

Need help? Just ask the AI chat assistant! 🤖
