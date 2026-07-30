import subprocess
import sys
import os
import time

def main():
    print("=" * 60)
    print("🚀 Starting AI Course Assistant Local Servers...")
    print("=" * 60)

    base_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(base_dir, "backend")
    frontend_dir = os.path.join(base_dir, "frontend")

    # Locate backend python / uvicorn
    venv_python = os.path.join(backend_dir, "venv", "Scripts", "python.exe")
    if not os.path.exists(venv_python):
        venv_python = sys.executable

    print(f"📦 Starting FastAPI Backend server on http://localhost:8000 ...")
    backend_proc = subprocess.Popen(
        [venv_python, "-m", "uvicorn", "main:app", "--reload", "--port", "8000"],
        cwd=backend_dir
    )

    time.sleep(2)

    print(f"💻 Starting Vite Frontend server on http://localhost:3000 ...")
    if sys.platform == "win32":
        frontend_proc = subprocess.Popen(["cmd.exe", "/c", "npm run dev"], cwd=frontend_dir)
    else:
        frontend_proc = subprocess.Popen(["npm", "run", "dev"], cwd=frontend_dir)

    print("\n✅ Local application servers are now running!")
    print("   👉 Open your browser at: http://localhost:3000")
    print("   👉 Backend API Docs at:   http://localhost:8000/docs")
    print("   Press Ctrl+C in this terminal to stop both servers.")
    print("=" * 60)

    try:
        backend_proc.wait()
        frontend_proc.wait()
    except KeyboardInterrupt:
        print("\nStopping local servers...")
        backend_proc.terminate()
        frontend_proc.terminate()
        sys.exit(0)

if __name__ == "__main__":
    main()
