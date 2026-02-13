# SafePulse Quick Commands

## Start Everything (ONE COMMAND)
```bash
./start.sh
# OR
npm run dev:all
```

## Individual Servers
```bash
# Backend only
npm start

# Frontend only  
npm run dev
```

## Stop Everything
```bash
pkill -f "node.*server/index.js" && pkill -f "vite"
```

## Login Credentials
- **Email**: admin@safepulse.local
- **Password**: Admin123!

## Access Points
- Frontend: http://localhost:8080
- Backend: http://localhost:4000
- Health Check: http://localhost:4000/health

## Auto-Start on VS Code Open
The servers will automatically start when you open this workspace in VS Code (configured in .vscode/tasks.json)
