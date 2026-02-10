#!/usr/bin/env python3
"""
Deterministic Sanitizer for n8n Workflows
100% ตายตัว - ไม่ใช้ AI - ใช้ String Replacement และ Regex เท่านั้น

Configuration ทั้งหมดมาจากไฟล์ .env.sanitizer
สามารถเพิ่ม-ลด sensitive data ได้โดยไม่ต้องแก้ไฟล์นี้
"""

import os
import re
import json
import sys
from pathlib import Path
from typing import Dict, List, Tuple

# ========================================
# CONFIGURATION - โหลดจาก .env.sanitizer
# ========================================

PROJECT_ROOT = Path(__file__).parent
ENV_FILE = PROJECT_ROOT / '.env.sanitizer'

# Default placeholders (ถ้าไม่ระบุใน .env)
DEFAULT_PLACEHOLDERS = {
    'DATABASE': 'YourDatabase',
    'TABLE': 'YourTable',
    'URL': 'example.com',
    'EMAIL': 'example@example.com',
    'NAME': 'YourName',
    'ID': 'YourId',
    'KEY': 'YourKey',
    'TOKEN': 'YourToken',
}

def load_env_config(env_file: Path) -> Dict[str, str]:
    """โหลดค่า configuration จากไฟล์ .env"""
    config = {}
    if env_file.exists():
        with open(env_file, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                # ข้าม comment และบรรทัดว่าง
                if not line or line.startswith('#'):
                    continue
                # อ่าน KEY=VALUE
                if '=' in line:
                    key, value = line.split('=', 1)
                    config[key.strip()] = value.strip()
    else:
        print(f"[WARNING] .env.sanitizer not found at {env_file}")
        print("[WARNING] Creating from template...")
        # สร้างไฟล์จาก template ถ้ายังไม่มี
        example_file = env_file.parent / '.env.sanitizer.example'
        if example_file.exists():
            import shutil
            shutil.copy(example_file, env_file)
            print(f"[INFO] Created {env_file} from template")
            print("[INFO] Please edit .env.sanitizer with your real data")
            return load_env_config(env_file)
    return config

def build_sanitize_rules(config: Dict[str, str]) -> List[Tuple[str, str, bool]]:
    """
    สร้าง sanitize rules จาก config อัตโนมัติ

    รูปแบบใน .env:
    - SANITIZE_XXX=RealValue (ข้อมูลจริง)
    - PLACEHOLDER_XXX=PlaceholderValue (ค่าที่ต้องการแทนที่)

    Rules จะถูกสร้างอัตโนมัติจากคู่ SANITIZE_/PLACEHOLDER_
    """
    rules = []

    # จัดกลุ่ม config เป็น sanitize vs placeholder
    sanitize_items = {}
    placeholders = {}

    for key, value in config.items():
        if key.startswith('SANITIZE_'):
            name = key.replace('SANITIZE_', '')
            sanitize_items[name] = value
        elif key.startswith('PLACEHOLDER_'):
            name = key.replace('PLACEHOLDER_', '')
            placeholders[name] = value

    # สร้าง rules จากคู่ sanitize/placeholder
    for name, real_value in sanitize_items.items():
        # หา placeholder ที่ตรงกัน
        placeholder = placeholders.get(name)

        # ถ้าไม่มีระบุ placeholder ให้สร้างอัตโนมัติ
        if not placeholder:
            # พยายามตรวจสอบจากประเภทข้อมูล
            if 'DB' in name or 'DATABASE' in name:
                placeholder = DEFAULT_PLACEHOLDERS['DATABASE']
            elif 'TABLE' in name:
                placeholder = DEFAULT_PLACEHOLDERS['TABLE']
            elif 'URL' in name or 'DOMAIN' in name:
                placeholder = DEFAULT_PLACEHOLDERS['URL']
            elif 'EMAIL' in name or 'MAIL' in name:
                placeholder = DEFAULT_PLACEHOLDERS['EMAIL']
            elif 'NAME' in name or 'SPR' in name or 'FRANCHISE' in name:
                placeholder = DEFAULT_PLACEHOLDERS['NAME']
            elif 'ID' in name:
                placeholder = DEFAULT_PLACEHOLDERS['ID']
            elif 'KEY' in name or 'TOKEN' in name or 'CREDENTIAL' in name:
                placeholder = DEFAULT_PLACEHOLDERS['KEY']
            else:
                placeholder = DEFAULT_PLACEHOLDERS['NAME']

        # สร้าง rules (หลายรูปแบบเพื่อครอบคลุม)
        # 1. Simple replacement (case sensitive)
        rules.append((real_value, placeholder, False))

        # 2. Regex replacement (case insensitive) - escape special chars
        escaped_value = re.escape(real_value)
        rules.append((escaped_value, placeholder, True))

    return rules

# โหลด configuration
env_config = load_env_config(ENV_FILE)

# สร้าง sanitize rules อัตโนมัติ
SANITIZE_RULES = build_sanitize_rules(env_config)

# ========================================
# SANITIZATION RULES
# ========================================

class Sanitizer:
    def __init__(self, project_root: Path, dry_run: bool = False):
        self.project_root = project_root
        self.dry_run = dry_run
        self.changes_made: List[Tuple[str, str, str]] = []

        # Stats
        self.files_processed = 0
        self.files_modified = 0
        self.replacements_made = 0

    def sanitize_text(self, text: str) -> str:
        """Sanitize text content with all rules - เฉพาะข้อมูล sensitive, เก็บ IDs ไว้ครบ"""
        original = text
        result = text

        # Apply all sanitization rules (Database, URLs, Emails, Company Names, etc.)
        for pattern, replacement, use_regex in SANITIZE_RULES:
            if use_regex:
                result = re.sub(pattern, replacement, result, flags=re.IGNORECASE)
            else:
                result = result.replace(pattern, replacement)

        # เก็บ IDs/UUIDs ไว้ครบ - ไม่แปลงอะไรทั้งนั้น
        # (เพราะ n8n ต้องการ IDs จริงสำหรับการ import)

        # Track changes
        if result != original:
            self.replacements_made += 1
            return result
        return text

    def sanitize_value(self, key: str, value: any, parent_key: str = '') -> any:
        """
        Sanitize individual values while preserving structure.
        Preserves: node names, IDs, types, connections
        Sanitizes: Database names, URLs, emails, company names in values
        """
        # Keys to preserve (never sanitize their values)
        PRESERVE_KEYS = {
            'id', 'name', 'type', 'webhookId', 'workflowId', 'instanceId',
            'nodes', 'connections', 'position', 'parameters', 'credentials'
        }

        # If value is a dict, recurse
        if isinstance(value, dict):
            result = {}
            for k, v in value.items():
                result[k] = self.sanitize_value(k, v, key)
            return result

        # If value is a list, recurse for each item
        elif isinstance(value, list):
            return [self.sanitize_value(key, item, parent_key) for item in value]

        # If value is a string, apply sanitization rules (with exceptions)
        elif isinstance(value, str):
            # PRESERVE: Node names (name field at node level)
            if key == 'name' and parent_key in ['', 'nodes']:
                return value

            # PRESERVE: All ID fields, types, webhook paths
            if key in PRESERVE_KEYS or 'id' in key.lower():
                return value

            # PRESERVE: n8n webhook paths (like /webhook/xxx-xxx-xxx)
            if '/webhook/' in value or value.startswith('/') and value.count('/') > 1:
                return value

            # SANITIZE: Apply sanitization rules to other string values
            return self.sanitize_text(value)

        # Return other types as-is
        return value

    def sanitize_json_file(self, file_path: Path) -> bool:
        """Sanitize JSON workflow file with special handling for n8n format"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            original = content
            modified = False

            # Parse JSON
            try:
                data = json.loads(content)

                # 1. Clear pinData at root level (n8n workflow pinned data)
                if 'pinData' in data and data['pinData']:
                    if data['pinData'] != {}:
                        data['pinData'] = {}
                        modified = True

                # 2. Clear pinData in all nodes (ลบข้อมูลที่ pin ไว้ในแต่ละ node)
                if 'nodes' in data:
                    for node in data['nodes']:
                        if 'pinData' in node and node['pinData']:
                            # Check if pinData is not empty
                            if node['pinData'] != {}:
                                node['pinData'] = {}
                                modified = True

                # 3. Sanitize values selectively (preserve node names, IDs)
                sanitized_data = self.sanitize_value('', data)

                # Convert back to JSON
                json_str = json.dumps(sanitized_data, ensure_ascii=False, indent=2)

                if modified or json_str != original:
                    if not self.dry_run:
                        with open(file_path, 'w', encoding='utf-8') as f:
                            f.write(json_str)

                    self.files_modified += 1
                    return True

            except json.JSONDecodeError:
                # Fallback to text sanitization if JSON parse fails
                result = self.sanitize_text(content)
                if result != original:
                    if not self.dry_run:
                        with open(file_path, 'w', encoding='utf-8') as f:
                            f.write(result)
                    self.files_modified += 1
                    return True

            return False

        except Exception as e:
            print(f"  ERROR processing {file_path}: {e}")
            return False

    def sanitize_text_file(self, file_path: Path) -> bool:
        """Sanitize text files (md, txt, etc.)"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            result = self.sanitize_text(content)

            if result != content:
                if not self.dry_run:
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(result)
                self.files_modified += 1
                return True

            return False

        except Exception as e:
            print(f"  ERROR processing {file_path}: {e}")
            return False

    def process_directory(self):
        """Process all relevant files in project"""
        print(f"{'='*60}")
        print(f"{'DETECT DRY RUN' if self.dry_run else 'SANITIZE MODE'}")
        print(f"Project: {self.project_root}")
        print(f"{'='*60}\n")

        # Show loaded rules
        if SANITIZE_RULES:
            print(f"Loaded {len(SANITIZE_RULES)} sanitization rules:")
            unique_rules = set()
            for pattern, replacement, use_regex in SANITIZE_RULES:
                if not use_regex:  # Show only simple replacements
                    if pattern not in unique_rules:
                        unique_rules.add(pattern)
                        print(f"  - {pattern} -> {replacement}")
            print()

        # File patterns to process
        json_files = list(self.project_root.glob("workflows/*.json"))
        md_files = list(self.project_root.glob("*.md"))
        all_files = json_files + md_files

        print(f"Found {len(all_files)} files to check\n")

        for file_path in sorted(all_files):
            self.files_processed += 1
            rel_path = file_path.relative_to(self.project_root)
            print(f"Checking: {rel_path}")

            if file_path.suffix == '.json':
                modified = self.sanitize_json_file(file_path)
            else:
                modified = self.sanitize_text_file(file_path)

            if modified:
                print(f"  [+] MODIFIED")
            else:
                print(f"  [ ] Clean")

    def verify(self) -> bool:
        """Verify no sensitive data remains"""
        print(f"\n{'='*60}")
        print("VERIFICATION - Checking for sensitive data...")
        print(f"{'='*60}\n")

        all_clean = True

        # Files to skip from verification (documentation files)
        SKIP_FROM_VERIFY = ['GITHUB_PUBLISH_GUIDE.md', 'sanitize.py']

        # Patterns to verify they DON'T exist (ใช้ค่าจริงจาก .env)
        forbidden_patterns = [
            (r'pinData"\s*:\s*\{[^}]', 'pinData with content', re.MULTILINE),
        ]

        # เพิ่ม patterns จาก SANITIZE_ config (เฉพาะที่ไม่ใช่ URL/Email pattern ซับซ้อน)
        for key, value in env_config.items():
            if key.startswith('SANITIZE_'):
                # Get corresponding placeholder
                name = key.replace('SANITIZE_', '')
                placeholder_key = f'PLACEHOLDER_{name}'
                placeholder = env_config.get(placeholder_key)

                # Skip if real value equals placeholder (no sanitization intended)
                if value == placeholder:
                    continue

                # Escape special regex characters
                escaped_value = re.escape(value)
                # Check for exact match
                forbidden_patterns.append((escaped_value, f'Sensitive data: {key}', 0))

        json_files = list(self.project_root.glob("workflows/*.json"))
        md_files = [f for f in self.project_root.glob("*.md") if f.name not in SKIP_FROM_VERIFY]
        all_files = json_files + md_files

        issues_found = []

        for file_path in all_files:
            rel_path = file_path.relative_to(self.project_root)

            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            for pattern, description, flags in forbidden_patterns:
                matches = re.finditer(pattern, content, flags)
                for match in matches:
                    # Get line number
                    line_num = content[:match.start()].count('\n') + 1
                    # Get context
                    lines = content.split('\n')
                    context_line = lines[line_num - 1].strip()[:80]

                    # SKIP: Node names and connections (preserve n8n structure)
                    # Patterns that indicate we're in a node name context
                    skip_contexts = [
                        '"name":',           # Node name field
                        '"node":',           # Connection node reference
                        '": {',              # Object key (likely a node reference)
                        'cachedResultName',  # Cached data reference
                    ]

                    # Check if this match is in a node name context
                    is_node_name = any(ctx in context_line or ctx in content[max(0, match.start()-50):match.start()+50] for ctx in skip_contexts)

                    # Also skip if the pattern is part of common node name prefixes
                    node_name_prefixes = ['Get Branch', 'Set Branch', 'Find Branch', 'Merge Branch']
                    if any(prefix in context_line for prefix in node_name_prefixes):
                        is_node_name = True

                    if is_node_name:
                        continue  # Skip this match - it's a node name

                    issues_found.append({
                        'file': str(rel_path),
                        'line': line_num,
                        'issue': description,
                        'context': context_line
                    })
                    all_clean = False

        if issues_found:
            print("[!] ISSUES FOUND:\n")
            for issue in issues_found[:20]:  # Show first 20
                print(f"  File: {issue['file']}:{issue['line']}")
                print(f"  Issue: {issue['issue']}")
                # Safely print context - remove problematic characters
                try:
                    context = issue['context'].encode('ascii', 'ignore').decode('ascii')
                    print(f"  Context: {context}")
                except:
                    print(f"  Context: [binary data]")
                print()

            if len(issues_found) > 20:
                print(f"  ... and {len(issues_found) - 20} more issues\n")

            return False
        else:
            print("[OK] ALL CLEAN - No sensitive data found!\n")
            return True


# ========================================
# MAIN
# ========================================

def main():
    import argparse

    parser = argparse.ArgumentParser(
        description='Deterministic sanitizer for n8n workflows'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Show changes without modifying files'
    )
    parser.add_argument(
        '--verify-only',
        action='store_true',
        help='Only verify, no sanitization'
    )
    parser.add_argument(
        '--path',
        type=str,
        default=str(PROJECT_ROOT),
        help='Project root path'
    )

    args = parser.parse_args()

    project_root = Path(args.path)

    if args.verify_only:
        sanitizer = Sanitizer(project_root, dry_run=True)
        sanitizer.process_directory()  # Just to count files
        result = sanitizer.verify()
        sys.exit(0 if result else 1)
    else:
        sanitizer = Sanitizer(project_root, dry_run=args.dry_run)

        # Run sanitization
        sanitizer.process_directory()

        # Show summary
        print(f"\n{'='*60}")
        print("SUMMARY")
        print(f"{'='*60}")
        print(f"Files processed: {sanitizer.files_processed}")
        print(f"Files modified: {sanitizer.files_modified}")
        print(f"{'='*60}\n")

        # Always verify after sanitization
        if not args.dry_run:
            sanitizer.verify()
        else:
            print("(Dry run - files not modified)\n")


if __name__ == '__main__':
    main()
