#!/usr/bin/env python3
import json
import sys
import os
import shutil
import glob
from pathlib import Path

def copy_session():
    # Target project name and workspace root
    workspace_root = "/Users/Shared/dev/openspace"
    storage_path = "/Users/opencode/.local/share/opencode/storage/message"
    
    # We look for the most recent session that has messages related to this workspace
    session_dirs = sorted(glob.glob(os.path.join(storage_path, "ses_*")), key=os.path.getmtime, reverse=True)
    
    found_session = None
    for ses_dir in session_dirs:
        # Check a few messages to see if they belong to this project
        msg_files = glob.glob(os.path.join(ses_dir, "msg_*.json"))
        # Increase scan depth slightly
        for msg_file in msg_files[:10]:
            try:
                with open(msg_file, 'r') as f:
                    content = f.read()
                    if workspace_root in content:
                        found_session = ses_dir
                        break
            except:
                continue
        if found_session:
            break
            
    if not found_session:
        print("⚠️ No active session found for this project.")
        return

    dest_dir = Path(workspace_root) / ".opencode" / "logs"
    dest_dir.mkdir(parents=True, exist_ok=True)
    
    # Merge all messages into a single session file
    all_messages = []
    msg_files = sorted(glob.glob(os.path.join(found_session, "msg_*.json")), key=os.path.getmtime)
    for msg_file in msg_files:
        try:
            with open(msg_file, 'r') as f:
                all_messages.append(json.load(f))
        except:
            continue
            
    session_file = dest_dir / "session.json"
    with open(session_file, 'w') as f:
        json.dump({"session_id": os.path.basename(found_session), "messages": all_messages}, f, indent=2)
        
    print(f"✅ Session {os.path.basename(found_session)} copied to {session_file}")

if __name__ == "__main__":
    copy_session()
