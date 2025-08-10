# GitHub Remote Setup Instructions

After creating your GitHub repository, run these commands:

## Step 1: Add Remote Origin
```bash
git remote add origin https://github.com/YOUR_USERNAME/x-obsidian-extension.git
```

## Step 2: Push to GitHub
```bash
git push -u origin main
```

## Step 3: Verify Setup
```bash
git remote -v
```

## Alternative: SSH Setup (if you prefer SSH)
```bash
git remote add origin git@github.com:YOUR_USERNAME/x-obsidian-extension.git
git push -u origin main
```

---

Replace `YOUR_USERNAME` with your actual GitHub username.

Once done, your repository will be available at:
https://github.com/YOUR_USERNAME/x-obsidian-extension